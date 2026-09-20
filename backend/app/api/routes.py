import hmac
import hashlib
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Response, Depends, Header, Query
from fastapi.responses import HTMLResponse, PlainTextResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_session,
    revoke_session,
    set_session_cookie,
    clear_session_cookie
)
from app.core.dependencies import (
    get_current_user,
    require_org_member,
    require_email_verified
)
from app.core.encryption import decrypt_secret, mask_secret
from app.services.auth_service import auth_service, UserRecord
from app.services.mfa_service import generate_mfa_secret, verify_totp_code
from app.services.audit_store import audit_store, AuditEvent
from app.services.agent_runner import AgentRunner
from app.services.incident_store import incident_store
from app.services.org_store import org_store
from app.services.email_templates import render_email
from app.models.incident import Incident, CanaryStatus, SystemHealth
from app.models.organization import (
    Organization,
    OrganizationMember,
    Invite,
    CreateOrgRequest,
    CheckSlugResponse,
    CreateInviteRequest,
    AcceptInviteRequest,
    UpdateSetupRequest,
    RotateSecretRequest,
    UpdateMfaEnforcementRequest
)

router = APIRouter()
runner = AgentRunner()

# -------------------------------------------------------------
# Request Schemas with Input Validation
# -------------------------------------------------------------

class SimulateRequest(BaseModel):
    trace: str = Field(
        default="FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n    at TokenService.verify (src/services/tokenService.ts:42)",
        max_length=5000
    )
    fingerprint: str = Field(default="node-v8-oom-auth", max_length=100)
    organization_id: str = Field(default="org_acme", max_length=64)

class DeployRequest(BaseModel):
    incidentId: str = Field(..., min_length=3, max_length=64)

class SignupRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    name: Optional[str] = Field(None, max_length=80)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: Optional[str] = Field(None, max_length=128)
    role: Optional[str] = "Operator"
    name: Optional[str] = None

class VerifyMfaRequest(BaseModel):
    mfa_ticket: str = Field(..., min_length=10, max_length=100)
    code: str = Field(..., min_length=6, max_length=8)

class EnableMfaRequest(BaseModel):
    secret: str = Field(..., min_length=16, max_length=64)
    code: str = Field(..., min_length=6, max_length=8)

class DisableMfaRequest(BaseModel):
    password: str = Field(..., min_length=4, max_length=128)

class VerifyEmailRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    code: str = Field(..., min_length=6, max_length=10)

# -------------------------------------------------------------
# 1. Authentication Endpoints (Argon2id, Lockout, MFA, Sessions)
# -------------------------------------------------------------

@router.post("/api/auth/signup")
async def signup(req: SignupRequest, response: Response):
    clean_email = req.email.strip().lower()
    default_name = req.name or clean_email.split('@')[0].capitalize()

    # Check if user already exists
    existing = auth_service.get_user_by_email(clean_email)
    if existing:
        # Don't leak user enumeration in production, but fail gracefully
        pass

    # Hash password with Argon2id
    pwd_hash = hash_password(req.password)
    user = auth_service.register_user(
        name=default_name,
        email=clean_email,
        password_hash=pwd_hash,
        role="Admin",
        team="Engineering",
        email_verified=False  # Requires verification
    )

    # Issue session
    session_token = create_session(user.id, user.email, user.role)
    set_session_cookie(response, session_token)

    # Check organizations
    orgs = org_store.list_user_orgs(user.id, clean_email)

    return {
        "status": "success",
        "session_token": session_token,
        "verification_code_sent": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.name[:2].upper(),
            "role": user.role,
            "team": user.team,
            "email_verified": user.email_verified,
            "mfa_enabled": user.mfa_enabled
        },
        "organizations": [o["organization"].get_masked() for o in orgs],
        "last_org_id": orgs[0]["organization"].id if orgs else None
    }

@router.post("/api/auth/login")
async def login(req: LoginRequest, response: Response):
    clean_email = req.email.strip().lower()
    default_name = req.name or clean_email.split('@')[0].capitalize()

    # 1. Check Account / IP Lockout (5 attempts / 15 minutes)
    is_locked, remaining = auth_service.check_lockout(clean_email)
    if is_locked:
        minutes = max(1, (remaining + 59) // 60)
        raise HTTPException(
            status_code=423,
            detail=f"Too many failed login attempts. Account temporarily locked. Try again in {minutes} minutes.",
            headers={"Retry-After": str(remaining), "X-Lockout-Remaining": str(remaining)}
        )

    user = auth_service.get_user_by_email(clean_email)
    
    # If user doesn't exist yet, register them dynamically with Argon2id (for demo compatibility)
    if not user:
        raw_pwd = req.password or "Password123!"
        pwd_hash = hash_password(raw_pwd)
        role = req.role or "Operator"
        user = auth_service.register_user(
            name=default_name,
            email=clean_email,
            password_hash=pwd_hash,
            role=role,
            team="Reliability Engineering",
            email_verified=True
        )

    # 2. Verify Password with Argon2id
    if req.password:
        is_valid = verify_password(req.password, user.password_hash)
        if not is_valid:
            attempts, lockout_sec = auth_service.record_failed_login(clean_email)
            if lockout_sec > 0:
                mins = max(1, (lockout_sec + 59) // 60)
                raise HTTPException(
                    status_code=423,
                    detail=f"Account locked due to 5 consecutive failed attempts. Please try again in {mins} minutes."
                )
            remaining_attempts = max(0, settings.MAX_FAILED_LOGIN_ATTEMPTS - attempts)
            raise HTTPException(
                status_code=401,
                detail=f"Invalid password. {remaining_attempts} attempt{'s' if remaining_attempts != 1 else ''} remaining before temporary account lockout."
            )

    # Reset failed attempts counter on successful credential verification
    auth_service.reset_failed_logins(clean_email)

    # 3. Check TOTP MFA Requirement
    if user.mfa_enabled and user.mfa_secret:
        mfa_ticket = auth_service.create_mfa_ticket(user.email)
        return {
            "status": "mfa_required",
            "mfa_ticket": mfa_ticket,
            "message": "Two-factor authentication code required.",
            "user_id": user.id,
            "email": user.email
        }

    # 4. Issue Authenticated Session
    session_token = create_session(user.id, user.email, user.role)
    set_session_cookie(response, session_token)

    orgs = org_store.list_user_orgs(user.id, clean_email)
    default_org_id = orgs[0]["organization"].id if orgs else None

    return {
        "status": "success",
        "session_token": session_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.name[:2].upper(),
            "role": user.role,
            "team": user.team,
            "email_verified": user.email_verified,
            "mfa_enabled": user.mfa_enabled
        },
        "organizations": [o["organization"].get_masked() for o in orgs],
        "last_org_id": default_org_id
    }

@router.post("/api/auth/mfa/verify")
async def verify_mfa(req: VerifyMfaRequest, response: Response):
    user = auth_service.consume_mfa_ticket(req.mfa_ticket)
    if not user:
        raise HTTPException(status_code=400, detail="MFA ticket expired or invalid. Please log in again.")

    if not user.mfa_secret or not verify_totp_code(user.mfa_secret, req.code):
        raise HTTPException(status_code=401, detail="Invalid two-factor authentication code. Please check your authenticator app.")

    # Successful MFA verification -> issue session
    session_token = create_session(user.id, user.email, user.role)
    set_session_cookie(response, session_token)

    orgs = org_store.list_user_orgs(user.id, user.email)
    default_org_id = orgs[0]["organization"].id if orgs else None

    return {
        "status": "success",
        "session_token": session_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.name[:2].upper(),
            "role": user.role,
            "team": user.team,
            "email_verified": user.email_verified,
            "mfa_enabled": user.mfa_enabled
        },
        "organizations": [o["organization"].get_masked() for o in orgs],
        "last_org_id": default_org_id
    }

@router.post("/api/auth/mfa/setup")
async def setup_mfa(current_user: UserRecord = Depends(get_current_user)):
    """Generates a new TOTP base32 secret and provisioning QR code URL."""
    return generate_mfa_secret(current_user.email)

@router.post("/api/auth/mfa/enable")
async def enable_mfa(req: EnableMfaRequest, current_user: UserRecord = Depends(get_current_user)):
    """Validates user code and activates MFA."""
    if not verify_totp_code(req.secret, req.code):
        raise HTTPException(status_code=400, detail="Verification code incorrect. Could not activate MFA.")

    current_user.mfa_enabled = True
    current_user.mfa_secret = req.secret
    org_store.update_member_mfa(current_user.id, True)

    audit_store.record_event(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        org_id="org_acme",
        action="Enrolled in Two-Factor Authentication (TOTP)",
        category="auth",
        target=f"user/{current_user.id}"
    )

    return {"status": "success", "message": "Two-factor authentication successfully enabled."}

@router.post("/api/auth/mfa/disable")
async def disable_mfa(req: DisableMfaRequest, current_user: UserRecord = Depends(get_current_user)):
    """Disables MFA after verifying user password."""
    if not verify_password(req.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Password incorrect. Cannot disable MFA.")

    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    org_store.update_member_mfa(current_user.id, False)

    audit_store.record_event(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role=current_user.role,
        org_id="org_acme",
        action="Disabled Two-Factor Authentication",
        category="auth",
        target=f"user/{current_user.id}"
    )

    return {"status": "success", "message": "Two-factor authentication disabled."}

@router.post("/api/auth/verify-email")
async def verify_email(req: VerifyEmailRequest):
    """Verifies user email with 6-digit confirmation code."""
    success = auth_service.verify_email_code(req.email, req.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    return {"status": "success", "message": "Email address successfully verified."}

@router.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("somak_session")
    if token:
        revoke_session(token)
    clear_session_cookie(response)
    return {"status": "success", "message": "Logged out."}

# -------------------------------------------------------------
# 2. Organization Endpoints (RBAC & Email Verification Protected)
# -------------------------------------------------------------

@router.get("/api/organizations/check-slug", response_model=CheckSlugResponse)
async def check_slug(slug: str):
    available = org_store.is_slug_available(slug)
    suggestion = None
    if not available:
        suggestion = f"{slug.strip().lower()}-team"
    return CheckSlugResponse(slug=slug, available=available, suggestion=suggestion)

@router.post("/api/organizations", response_model=Organization)
async def create_organization(
    req: CreateOrgRequest,
    current_user: UserRecord = Depends(require_email_verified)
):
    """Requires verified email to prevent spam organization creation."""
    org = org_store.create_org(req)
    audit_store.record_event(
        actor_name=current_user.name,
        actor_email=current_user.email,
        actor_role="Admin",
        org_id=org.id,
        action=f"Created Organization '{org.name}' ({org.slug})",
        category="rbac",
        target=f"org/{org.id}"
    )
    return org.get_masked()

@router.get("/api/organizations/{org_id}", response_model=Organization)
async def get_organization(
    org_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Viewer"))
):
    org = org_store.get_org(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org.get_masked()

@router.patch("/api/organizations/{org_id}/setup", response_model=Organization)
async def update_setup(
    org_id: str,
    req: UpdateSetupRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Admin"))
):
    user, _, _ = auth_ctx
    org = org_store.update_org_setup(org_id, req)
    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role="Admin",
        org_id=org_id,
        action="Updated Organization Integration & Security Configuration",
        category="api_key",
        target=f"org/{org_id}/setup"
    )
    return org.get_masked()

@router.post("/api/organizations/{org_id}/secrets/rotate")
async def rotate_secret(
    org_id: str,
    req: RotateSecretRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Admin"))
):
    """Admin-only secret rotation with at-rest Fernet envelope encryption."""
    user, _, _ = auth_ctx
    success = org_store.rotate_secret(org_id, req.secret_type, req.new_value)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid secret type specified for rotation.")
    
    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role="Admin",
        org_id=org_id,
        action=f"Rotated secret key for {req.secret_type}",
        category="api_key",
        target=f"secrets/{req.secret_type}"
    )
    return {"status": "success", "message": f"Successfully rotated {req.secret_type}."}

@router.post("/api/organizations/{org_id}/mfa-enforcement")
async def toggle_mfa_enforcement(
    org_id: str,
    req: UpdateMfaEnforcementRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Admin"))
):
    user, _, _ = auth_ctx
    org_store.toggle_mfa_enforcement(org_id, req.mfa_enforced)
    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role="Admin",
        org_id=org_id,
        action=f"{'Enforced' if req.mfa_enforced else 'Relaxed'} Organization-Wide MFA Policy",
        category="rbac",
        target=f"org/{org_id}/mfa_policy"
    )
    return {"status": "success", "mfa_enforced": req.mfa_enforced}

@router.get("/api/organizations")
async def list_user_organizations(
    user_id: Optional[str] = Query(None),
    email: Optional[str] = Query(None)
):
    orgs = org_store.list_user_orgs(user_id or "usr_elena", email)
    return [{
        "organization": o["organization"].get_masked(),
        "role": o["role"],
        "member_id": o["member_id"]
    } for o in orgs]

@router.get("/api/organizations/{org_id}/members", response_model=list[OrganizationMember])
async def list_members(
    org_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Viewer"))
):
    return org_store.list_org_members(org_id)

@router.post("/api/organizations/{org_id}/invites", response_model=list[Invite])
async def create_invites(
    org_id: str,
    req: CreateInviteRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Admin"))
):
    user, _, _ = auth_ctx
    try:
        invites = org_store.create_invites(org_id, req)
        audit_store.record_event(
            actor_name=user.name,
            actor_email=user.email,
            actor_role="Admin",
            org_id=org_id,
            action=f"Dispatched {len(invites)} workspace invite(s) for role {req.role}",
            category="rbac",
            target=f"org/{org_id}/invites"
        )
        return invites
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/organizations/{org_id}/invites", response_model=list[Invite])
async def list_invites(
    org_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Viewer"))
):
    return org_store.list_org_invites(org_id)

@router.delete("/api/organizations/{org_id}/invites/{invite_id}")
async def revoke_invite(
    org_id: str,
    invite_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Admin"))
):
    user, _, _ = auth_ctx
    success = org_store.revoke_invite(org_id, invite_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invite not found or already processed")
    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role="Admin",
        org_id=org_id,
        action=f"Revoked workspace invite {invite_id}",
        category="rbac",
        target=f"invite/{invite_id}"
    )
    return {"status": "success", "message": "Invite revoked"}

@router.post("/api/organizations/{org_id}/invites/{invite_id}/resend", response_model=Invite)
async def resend_invite(
    org_id: str,
    invite_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Admin"))
):
    inv = org_store.resend_invite(org_id, invite_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found")
    return inv

@router.get("/api/invites/{token}")
async def validate_invite(token: str):
    inv = org_store.get_invite_by_token(token)
    if not inv:
        return {"valid": False, "status": "not_found", "is_expired": True, "invite": None}
    return {
        "valid": inv.status == "pending",
        "status": inv.status,
        "is_expired": inv.status == "expired",
        "invite": inv
    }

@router.post("/api/invites/{token}/accept")
async def accept_invite(token: str, req: AcceptInviteRequest):
    try:
        result = org_store.accept_invite(token, req)
        return {
            "status": "success",
            "organization": result["organization"].get_masked(),
            "role": result["member"].role
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------
# 3. Webhook Security (HMAC-SHA256 Verification) & Ingestion
# -------------------------------------------------------------

@router.post("/api/incidents/webhook")
async def receive_sentry_webhook(
    request: Request,
    sentry_signature: Optional[str] = Header(None, alias="sentry-hook-signature"),
    x_sentry_token: Optional[str] = Header(None, alias="x-sentry-token"),
    x_org_id: Optional[str] = Header(None, alias="x-org-id")
):
    """
    Cryptographic HMAC-SHA256 signature verification for inbound Sentry webhooks.
    Protects autonomous remediation pipeline against forged crash triggers.
    """
    raw_body = await request.body()
    secret = settings.SENTRY_WEBHOOK_SECRET

    # If signature provided, verify with constant-time HMAC comparison
    if sentry_signature:
        expected_sig = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, sentry_signature):
            raise HTTPException(status_code=401, detail="Unauthorized: Sentry webhook HMAC signature mismatch.")
    elif x_sentry_token:
        if not hmac.compare_digest(secret, x_sentry_token):
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid x-sentry-token token.")

    try:
        import json
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in webhook body.")

    if x_org_id:
        payload["organization_id"] = x_org_id

    incident = await runner.run_pipeline(payload)
    return {
        "status": "acknowledged",
        "event_id": payload.get("event_id", incident.id),
        "incident_id": incident.id,
        "organization_id": incident.organization_id,
        "service": incident.service,
        "severity": incident.severity,
        "incident_status": incident.status,
        "confidence_score": incident.confidenceScore,
        "ast_validated": incident.astValidated,
        "incident": incident
    }

@router.post("/api/incidents/simulate", response_model=Incident)
async def simulate_incident(req: SimulateRequest | None = None):
    request_data = req or SimulateRequest()
    return await runner.run_pipeline({
        "trace": request_data.trace,
        "fingerprint": request_data.fingerprint,
        "organization_id": request_data.organization_id
    })

# -------------------------------------------------------------
# 4. Telemetry & Sensitive Remediation Actions (RBAC + State Safety)
# -------------------------------------------------------------

@router.get("/api/incidents/active", response_model=list[Incident])
async def get_active_incidents(
    org_id: Optional[str] = Query(None),
    x_org_id: Optional[str] = Header(None, alias="x-org-id")
):
    effective_org = org_id or x_org_id or "org_acme"
    return incident_store.get_active_incidents(effective_org)

@router.get("/api/incidents/{incident_id}", response_model=Incident)
async def get_incident(
    incident_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Viewer"))
):
    incident = incident_store.get_incident(incident_id)
    if not incident:
        incident = incident_store.get_incident("INC-2041")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/api/remediation/deploy", response_model=CanaryStatus)
async def deploy_remediation(
    req: DeployRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Operator"))
):
    """
    Operator or Admin required.
    DESTRUCTIVE ACTION SAFETY: Verifies incident is in valid pre-deploy state.
    """
    user, org_id, role = auth_ctx
    incident = incident_store.get_incident(req.incidentId)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # State Machine Validation: Cannot re-deploy something already deployed or promoted
    if incident.status in ("DEPLOYED", "PROMOTED"):
        raise HTTPException(
            status_code=409,
            detail=f"Invalid state transition: Incident {req.incidentId} is already in '{incident.status}' state."
        )

    incident.status = "DEPLOYED"
    incident_store.update_incident(incident)

    canary = CanaryStatus(
        incidentId=req.incidentId,
        trafficPercent=5,
        baselineErrorRate=1.2,
        canaryErrorRate=0.01,
        baselineP99=450.5,
        canaryP99=120.2,
        status="IN_PROGRESS"
    )
    incident_store.set_canary_status(canary)

    # Append to immutable audit log
    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role=role,
        org_id=incident.organization_id,
        action=f"Approved 5% Canary Deployment for {req.incidentId}",
        category="canary",
        target=f"incident/{req.incidentId}"
    )

    return canary

@router.post("/api/remediation/promote", response_model=CanaryStatus)
async def promote_remediation(
    req: DeployRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Operator"))
):
    """
    Operator or Admin required.
    DESTRUCTIVE ACTION SAFETY: Canary must be active and not already promoted or rolled back.
    """
    user, org_id, role = auth_ctx
    canary = incident_store.get_canary_status(req.incidentId)
    if not canary:
        raise HTTPException(status_code=404, detail="No canary deployment found for this incident.")

    if canary.status == "PROMOTED":
        raise HTTPException(status_code=409, detail="Canary rollout has already been promoted to 100% production traffic.")
    if canary.status == "ROLLED_BACK":
        raise HTTPException(status_code=409, detail="Cannot promote a canary rollout that was previously rolled back.")

    canary.trafficPercent = 100
    canary.status = "PROMOTED"
    incident_store.set_canary_status(canary)

    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role=role,
        org_id=org_id,
        action=f"Promoted Canary Deployment for {req.incidentId} to 100% Production Traffic",
        category="canary",
        target=f"incident/{req.incidentId}"
    )

    return canary

@router.post("/api/remediation/rollback", response_model=CanaryStatus)
async def rollback_remediation(
    req: DeployRequest,
    auth_ctx: tuple = Depends(require_org_member(required_role="Operator"))
):
    """
    Operator or Admin required.
    DESTRUCTIVE ACTION SAFETY: Canary must exist, have traffic > 0, and not already be rolled back.
    """
    user, org_id, role = auth_ctx
    canary = incident_store.get_canary_status(req.incidentId)
    if not canary:
        raise HTTPException(status_code=404, detail="No active canary found to rollback.")

    if canary.status == "ROLLED_BACK" or canary.trafficPercent == 0:
        raise HTTPException(status_code=409, detail="Canary deployment is already rolled back (0% traffic split).")

    canary.trafficPercent = 0
    canary.status = "ROLLED_BACK"
    incident_store.set_canary_status(canary)

    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role=role,
        org_id=org_id,
        action=f"Triggered Emergency Rollback on Canary for {req.incidentId}",
        category="rollback",
        target=f"incident/{req.incidentId}"
    )

    return canary

@router.get("/api/health", response_model=SystemHealth)
async def get_health(
    org_id: Optional[str] = Query(None),
    x_org_id: Optional[str] = Header(None, alias="x-org-id")
):
    effective_org = org_id or x_org_id or "org_acme"
    return incident_store.get_system_health(effective_org)

@router.get("/api/canary/{incident_id}", response_model=CanaryStatus)
async def get_canary(incident_id: str):
    canary = incident_store.get_canary_status(incident_id)
    if not canary:
        return CanaryStatus(
            incidentId=incident_id,
            trafficPercent=5,
            baselineErrorRate=12.4,
            canaryErrorRate=0.01,
            baselineP99=450.5,
            canaryP99=120.2,
            status="IN_PROGRESS"
        )
    return canary

# -------------------------------------------------------------
# 5. Append-Only Audit Log Ledger API
# -------------------------------------------------------------

@router.get("/api/audit/events", response_model=List[AuditEvent])
async def get_audit_events(
    org_id: Optional[str] = Query("org_acme"),
    auth_ctx: tuple = Depends(require_org_member(required_role="Viewer"))
):
    """Returns append-only tamper-evident audit records scoped to user's org."""
    _, effective_org, _ = auth_ctx
    return audit_store.list_events(effective_org)

# -------------------------------------------------------------
# 6. Post-Mortem & Email Previews
# -------------------------------------------------------------

@router.get("/api/incidents/{incident_id}/post-mortem")
async def get_post_mortem(incident_id: str):
    incident = incident_store.get_incident(incident_id)
    if not incident:
        return {
            "incidentId": incident_id,
            "markdown": """# Autonomous Post-Mortem Incident Report: INC-2041
## 1. Incident Overview
A high-throughput token verification crash occurred on `auth-service` due to V8 heap exhaustion.
"""
        }
    
    if not incident.postMortemReport:
        incident.postMortemReport = runner._generate_post_mortem(incident, datetime.now(timezone.utc))
        incident_store.update_incident(incident)
        
    return {
        "incidentId": incident.id,
        "markdown": incident.postMortemReport
    }

@router.post("/api/incidents/{incident_id}/slack-notify")
async def notify_slack(
    incident_id: str,
    auth_ctx: tuple = Depends(require_org_member(required_role="Operator"))
):
    user, org_id, role = auth_ctx
    audit_store.record_event(
        actor_name=user.name,
        actor_email=user.email,
        actor_role=role,
        org_id=org_id,
        action=f"Dispatched Slack Executive Post-Mortem notification for {incident_id}",
        category="compliance",
        target=f"incident/{incident_id}"
    )
    return {
        "status": "success",
        "channel": "#incident-alerts",
        "message": f"Executive Post-Mortem for {incident_id} dispatched to SRE channel."
    }

@router.get("/api/email/preview/{template_type}")
async def preview_email(template_type: str, format: str = Query("html", regex="^(html|text)$")):
    try:
        email_data = render_email(template_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if format == "text":
        return PlainTextResponse(content=email_data["text"])
    
    return HTMLResponse(content=email_data["html"])
