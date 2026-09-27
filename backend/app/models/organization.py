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
    triage_provider: str = "nebius"
    triage_model: str = "nvidia/nemotron-3-nano-30b-a3b"
    synthesis_provider: str = "nebius"
    synthesis_model: str = "nvidia/nemotron-3-ultra-550b"
    nebius_api_key: str = ""
    nvidia_nim_connected: bool = False
    nvidia_nim_api_key: str = ""
    anthropic_connected: bool = False
    anthropic_api_key: str = ""
    openai_connected: bool = False
    openai_api_key: str = ""
    google_connected: bool = False
    google_api_key: str = ""
    tavily_connected: bool = False
    tavily_api_key: str = ""
    notifications_connected: bool = False
    slack_webhook: str = ""
    pagerduty_key: str = ""
    team_invited: bool = False
    sandbox_concurrency: int = 4
    sandbox_timeout: int = 15
    onboarding_completed: bool = False

    def get_masked(self) -> "SetupChecklist":
        """Returns sanitized checklist with secret values masked for public API transmission."""
        copy_data = self.model_dump()
        copy_data["ai_api_key"] = mask_secret(self.ai_api_key)
        copy_data["nebius_api_key"] = mask_secret(self.nebius_api_key or self.ai_api_key)
        copy_data["nvidia_nim_api_key"] = mask_secret(self.nvidia_nim_api_key)
        copy_data["anthropic_api_key"] = mask_secret(self.anthropic_api_key)
        copy_data["openai_api_key"] = mask_secret(self.openai_api_key)
        copy_data["google_api_key"] = mask_secret(self.google_api_key)
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
    onboarding_completed: bool = False
    plan: Literal['free', 'team', 'business', 'enterprise'] = 'business'
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
    plan: Optional[Literal['free', 'team', 'business', 'enterprise']] = None
    user_id: str
    user_name: str = "Operator"
    user_email: str = "operator@somak.internal"

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
    triage_provider: str | None = None
    triage_model: str | None = None
    synthesis_provider: str | None = None
    synthesis_model: str | None = None
    nebius_api_key: str | None = None
    nvidia_nim_connected: bool | None = None
    nvidia_nim_api_key: str | None = None
    anthropic_connected: bool | None = None
    anthropic_api_key: str | None = None
    openai_connected: bool | None = None
    openai_api_key: str | None = None
    google_connected: bool | None = None
    google_api_key: str | None = None
    tavily_connected: bool | None = None
    tavily_api_key: str | None = None
    notifications_connected: bool | None = None
    slack_webhook: str | None = None
    pagerduty_key: str | None = None
    team_invited: bool | None = None
    sandbox_concurrency: int | None = None
    sandbox_timeout: int | None = None
    onboarding_completed: bool | None = None

class RotateSecretRequest(BaseModel):
    secret_type: Literal[
        'ai_api_key',
        'nebius_api_key',
        'nvidia_nim_api_key',
        'anthropic_api_key',
        'openai_api_key',
        'google_api_key',
        'tavily_api_key',
        'slack_webhook',
        'pagerduty_key',
        'sentry_webhook_secret'
    ]
    new_value: str = Field(..., min_length=4, max_length=500)


class UpdateMfaEnforcementRequest(BaseModel):
    mfa_enforced: bool


class UpdateOrgPlanRequest(BaseModel):
    plan: Literal['free', 'team', 'business', 'enterprise']
