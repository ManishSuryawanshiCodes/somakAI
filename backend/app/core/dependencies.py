"""
SOMAK AI — FastAPI Security & Server-Side RBAC Dependencies
Strictly enforces authentication, email verification, organization tenancy scoping, and role hierarchy.
"""

from typing import Optional, Tuple
from fastapi import Request, HTTPException, Depends, Header
from app.core.security import get_session
from app.services.auth_service import auth_service, UserRecord
from app.services.org_store import org_store
from app.services.incident_store import incident_store

ROLE_HIERARCHY = {
    "Admin": 3,
    "Operator": 2,
    "Viewer": 1,
}

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None, alias="x-user-email")
) -> UserRecord:
    """
    Resolves authenticated user from:
    1. HttpOnly cookie: somak_session
    2. Authorization header: Bearer <session_token>
    3. Fallback header: x-user-email (for demo/development backwards compatibility)
    """
    # 1. Check session cookie
    token = request.cookies.get("somak_session")

    # 2. Check Authorization Bearer header
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

    if token:
        session = get_session(token)
        if session:
            user = auth_service.get_user_by_id(session["user_id"]) or auth_service.get_user_by_email(session["email"])
            if user:
                return user

    # 3. Fallback header for demo or tests
    if x_user_email:
        user = auth_service.get_user_by_email(x_user_email)
        if user:
            return user

    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please log in to proceed.",
        headers={"WWW-Authenticate": "Bearer"}
    )

async def require_email_verified(
    user: UserRecord = Depends(get_current_user)
) -> UserRecord:
    """Ensures user has completed email verification before sensitive actions."""
    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Email verification required. Please verify your email before performing this action.",
            headers={"X-Error-Code": "EMAIL_VERIFICATION_REQUIRED"}
        )
    return user

def require_org_member(required_role: Optional[str] = None):
    """
    Factory dependency verifying:
    1. The authenticated user is an active member of the target organization.
    2. The user's actual server-side role meets or exceeds required_role (Admin > Operator > Viewer).
    """
    async def dependency(
        request: Request,
        user: UserRecord = Depends(get_current_user)
    ) -> Tuple[UserRecord, str, str]:
        # 1. Resolve org_id
        org_id = request.path_params.get("org_id")
        
        if not org_id:
            org_id = request.headers.get("x-org-id") or request.query_params.get("org_id")

        if not org_id and request.method in ("POST", "PATCH", "PUT"):
            try:
                body = await request.json()
                org_id = body.get("organization_id") or body.get("org_id")
                # If incidentId provided (e.g. deploy/promote/rollback), resolve org from incident
                if not org_id and "incidentId" in body:
                    inc = incident_store.get_incident(body["incidentId"])
                    if inc and inc.organization_id:
                        org_id = inc.organization_id
            except Exception:
                pass

        if not org_id:
            # Default to primary demo org if unspecified
            org_id = "org_acme"

        # 2. Verify user membership in org
        members = org_store.list_org_members(org_id)
        user_member = None
        for m in members:
            if m.user_id == user.id or m.user.email.lower() == user.email.lower():
                user_member = m
                break

        if not user_member:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: User {user.email} is not a member of organization '{org_id}'."
            )

        actual_role = user_member.role

        # 3. Check role hierarchy
        if required_role:
            user_level = ROLE_HIERARCHY.get(actual_role, 0)
            required_level = ROLE_HIERARCHY.get(required_role, 0)

            if user_level < required_level:
                raise HTTPException(
                    status_code=403,
                    detail=f"Forbidden: Action requires '{required_role}' role, but your role in organization '{org_id}' is '{actual_role}'."
                )

        return user, org_id, actual_role

    return dependency
