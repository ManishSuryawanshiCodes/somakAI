from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime, timezone
from app.core.encryption import mask_secret

UserRole = Literal['Admin', 'Operator', 'Viewer']

class SetupChecklist(BaseModel):
    sentry_connected: bool = False
    sentry_dsn: str = ""
    sentry_inbound_url: str = ""
    sentry_webhook_secret: str = ""
    ai_connected: bool = False
    ai_api_key: str = ""
    ai_model_tier: str = "nvidia/nemotron-3-nano-30b-a3b"
    tavily_connected: bool = False
    tavily_api_key: str = ""
    notifications_connected: bool = False
    slack_webhook: str = ""
    pagerduty_key: str = ""
    team_invited: bool = False

    def get_masked(self) -> "SetupChecklist":
        """Returns sanitized checklist with secret values masked for public API transmission."""
        copy_data = self.model_dump()
        copy_data["ai_api_key"] = mask_secret(self.ai_api_key)
        copy_data["tavily_api_key"] = mask_secret(self.tavily_api_key)
        copy_data["slack_webhook"] = mask_secret(self.slack_webhook)
        copy_data["pagerduty_key"] = mask_secret(self.pagerduty_key)
        copy_data["sentry_webhook_secret"] = mask_secret(self.sentry_webhook_secret)
        return SetupChecklist(**copy_data)

class Organization(BaseModel):
    id: str
    name: str
    slug: str
    team_size: str | None = "2-10"
    primary_use_case: str | None = "Autonomous Incident Remediation"
    mfa_enforced: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str
    setup_checklist: SetupChecklist = Field(default_factory=SetupChecklist)

    def get_masked(self) -> "Organization":
        """Returns organization with integration secrets masked."""
        copy_data = self.model_dump()
        copy_data["setup_checklist"] = self.setup_checklist.get_masked()
        return Organization(**copy_data)

class OrgMemberUser(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    team: str = "Reliability Engineering"
    mfa_enabled: bool = False
    email_verified: bool = True

class OrganizationMember(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: UserRole
    joined_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    user: OrgMemberUser

class Invite(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    organization_slug: str
    email: str
    role: UserRole
    token: str
    invited_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str
    status: Literal['pending', 'accepted', 'revoked', 'expired'] = 'pending'

class CreateOrgRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    slug: str = Field(..., min_length=2, max_length=50)
    team_size: str | None = None
    primary_use_case: str | None = None
    user_id: str
    user_name: str = "Operator"
    user_email: str = "operator@sentryops.internal"

class CheckSlugResponse(BaseModel):
    slug: str
    available: bool
    suggestion: str | None = None

class CreateInviteRequest(BaseModel):
    emails: list[str] = Field(..., min_items=1)
    role: UserRole
    invited_by: str

class AcceptInviteRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: str

class UpdateSetupRequest(BaseModel):
    sentry_connected: bool | None = None
    sentry_dsn: str | None = None
    sentry_inbound_url: str | None = None
    sentry_webhook_secret: str | None = None
    ai_connected: bool | None = None
    ai_api_key: str | None = None
    ai_model_tier: str | None = None
    tavily_connected: bool | None = None
    tavily_api_key: str | None = None
    notifications_connected: bool | None = None
    slack_webhook: str | None = None
    pagerduty_key: str | None = None
    team_invited: bool | None = None

class RotateSecretRequest(BaseModel):
    secret_type: Literal['ai_api_key', 'tavily_api_key', 'slack_webhook', 'pagerduty_key', 'sentry_webhook_secret']
    new_value: str = Field(..., min_length=4, max_length=500)

class UpdateMfaEnforcementRequest(BaseModel):
    mfa_enforced: bool
