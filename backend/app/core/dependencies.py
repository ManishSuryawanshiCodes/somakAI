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
    authorization: Optional[str] = Header(None)
) -> UserRecord:
    """
    Resolves authenticated user from:
    1. HttpOnly cookie: somak_session
    2. Authorization header: Bearer <session_token>
    NO unauthenticated header bypasses allowed.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

    if not token:
        token = request.cookies.get("somak_session")

    if token:
        session = get_session(token)
        if session:
            user = auth_service.get_user_by_id(session["user_id"]) or auth_service.get_user_by_email(session["email"])
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
        # 1. Resolve org_id from explicit parameters
        org_id = request.path_params.get("org_id")
        
        if not org_id:
            org_id = request.headers.get("x-org-id") or request.query_params.get("org_id")

        if not org_id and request.method in ("POST", "PATCH", "PUT"):
            try:
                body = await request.json()
                org_id = body.get("organization_id") or body.get("org_id")
            except Exception:
                pass

        if not org_id:
            # Resolve from user's primary/active org memberships
            user_orgs = org_store.list_user_orgs(user.id, user.email)
            if user_orgs:
                org_id = user_orgs[0]["organization"].id
            else:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied: User {user.email} is not affiliated with any organization."
                )

        # 2. Verify user membership in resolved org
        members = org_store.list_org_members(org_id)
        user_member = None
        for m in members:
            if m.user_id == user.id or m.user.email.lower() == user.email.lower():
                user_member = m
                break

        if not user_member:
            raise HTTPException(
                status_code=404,
                detail=f"Organization '{org_id}' not found."
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
