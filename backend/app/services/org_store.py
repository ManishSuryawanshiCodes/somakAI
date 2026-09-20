import uuid
from datetime import datetime, timezone, timedelta
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrgMemberUser,
    Invite,
    SetupChecklist,
    CreateOrgRequest,
    CreateInviteRequest,
    AcceptInviteRequest,
    UpdateSetupRequest,
    UserRole
)
from app.core.encryption import encrypt_secret

class OrgStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OrgStore, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        # Seed default demo organization: Acme Corp with encrypted credentials
        acme_checklist = SetupChecklist(
            sentry_connected=True,
            sentry_dsn="https://o4505@sentry.io/450582",
            sentry_inbound_url="https://api.sentryops.io/v1/webhook/ingest/acme-prod",
            sentry_webhook_secret=encrypt_secret("sentry_whsec_dev_token_991823"),
            ai_connected=True,
            ai_api_key=encrypt_secret("neb-tok-live-89f4b321"),
            ai_model_tier="nvidia/nemotron-3-ultra-550b",
            tavily_connected=True,
            tavily_api_key=encrypt_secret("tvly-prod-c4391aa8"),
            notifications_connected=True,
            slack_webhook=encrypt_secret("https://hooks.slack.com/services/T00/B00/X123456"),
            pagerduty_key=encrypt_secret("pd_live_a89f920bc481"),
            team_invited=True,
        )

        acme_org = Organization(
            id="org_acme",
            name="Acme Corp",
            slug="acme",
            team_size="11-50",
            primary_use_case="Autonomous Incident Remediation",
            created_at=datetime.now(timezone.utc).isoformat(),
            created_by="usr_elena",
            setup_checklist=acme_checklist,
        )

        self._organizations: dict[str, Organization] = {"org_acme": acme_org}

        # Seed members for Acme Corp with real MFA enrollment status
        self._members: dict[str, list[OrganizationMember]] = {
            "org_acme": [
                OrganizationMember(
                    id="mem_1",
                    organization_id="org_acme",
                    user_id="usr_elena",
                    role="Admin",
                    joined_at=datetime.now(timezone.utc).isoformat(),
                    user=OrgMemberUser(
                        id="usr_elena",
                        name="Elena Rostova",
                        email="elena.rostova@sentryops.internal",
                        avatar="ER",
                        team="SecOps & Infrastructure",
                        mfa_enabled=True,
                        email_verified=True,
                    ),
                ),
                OrganizationMember(
                    id="mem_2",
                    organization_id="org_acme",
                    user_id="usr_mv492",
                    role="Operator",
                    joined_at=datetime.now(timezone.utc).isoformat(),
                    user=OrgMemberUser(
                        id="usr_mv492",
                        name="Marcus Vance",
                        email="marcus.vance@sentryops.internal",
                        avatar="MV",
                        team="Platform Reliability SRE",
                        mfa_enabled=False,
                        email_verified=True,
                    ),
                ),
                OrganizationMember(
                    id="mem_3",
                    organization_id="org_acme",
                    user_id="usr_devin",
                    role="Operator",
                    joined_at=datetime.now(timezone.utc).isoformat(),
                    user=OrgMemberUser(
                        id="usr_devin",
                        name="Devin Zhao",
                        email="devin.zhao@sentryops.internal",
                        avatar="DZ",
                        team="Cloud Operations",
                        mfa_enabled=False,
                        email_verified=True,
                    ),
                ),
                OrganizationMember(
                    id="mem_4",
                    organization_id="org_acme",
                    user_id="usr_sarah",
                    role="Viewer",
                    joined_at=datetime.now(timezone.utc).isoformat(),
                    user=OrgMemberUser(
                        id="usr_sarah",
                        name="Sarah Connor",
                        email="sarah.connor@sentryops.internal",
                        avatar="SC",
                        team="Compliance & Audit",
                        mfa_enabled=False,
                        email_verified=True,
                    ),
                ),
                OrganizationMember(
                    id="mem_5",
                    organization_id="org_acme",
                    user_id="usr_observer",
                    role="Viewer",
                    joined_at=datetime.now(timezone.utc).isoformat(),
                    user=OrgMemberUser(
                        id="usr_observer",
                        name="Audit Observer",
                        email="audit.observer@sentryops.internal",
                        avatar="AO",
                        team="Read-Only Observer",
                        mfa_enabled=False,
                        email_verified=True,
                    ),
                ),
            ]
        }

        # Invites mapped by token
        self._invites_by_token: dict[str, Invite] = {}
        # Pre-seed one pending invite for testing
        test_token = "inv_demo_token_7d"
        exp_time = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        sample_invite = Invite(
            id="inv_sample_01",
            organization_id="org_acme",
            organization_name="Acme Corp",
            organization_slug="acme",
            email="new-sre@company.com",
            role="Operator",
            token=test_token,
            invited_by="Elena Rostova",
            created_at=datetime.now(timezone.utc).isoformat(),
            expires_at=exp_time,
            status="pending"
        )
        self._invites_by_token[test_token] = sample_invite

    def is_slug_available(self, slug: str) -> bool:
        clean_slug = slug.strip().lower()
        if not clean_slug:
            return False
        for org in self._organizations.values():
            if org.slug.lower() == clean_slug:
                return False
        return True

    def create_org(self, req: CreateOrgRequest) -> Organization:
        clean_slug = req.slug.strip().lower()
        if not self.is_slug_available(clean_slug):
            clean_slug = f"{clean_slug}-{uuid.uuid4().hex[:4]}"

        org_id = f"org_{uuid.uuid4().hex[:8]}"
        inbound_url = f"https://api.sentryops.io/v1/webhook/ingest/{clean_slug}"
        
        checklist = SetupChecklist(
            sentry_inbound_url=inbound_url
        )

        org = Organization(
            id=org_id,
            name=req.name.strip(),
            slug=clean_slug,
            team_size=req.team_size or "2-10",
            primary_use_case=req.primary_use_case or "Autonomous Incident Remediation",
            created_at=datetime.now(timezone.utc).isoformat(),
            created_by=req.user_id,
            setup_checklist=checklist
        )

        self._organizations[org_id] = org

        # Add creator as Admin
        initial_member = OrganizationMember(
            id=f"mem_{uuid.uuid4().hex[:8]}",
            organization_id=org_id,
            user_id=req.user_id,
            role="Admin",
            joined_at=datetime.now(timezone.utc).isoformat(),
            user=OrgMemberUser(
                id=req.user_id,
                name=req.user_name,
                email=req.user_email,
                avatar=(req.user_name[:2] if req.user_name else "OP").upper(),
                team="SecOps & Infrastructure",
            ),
        )

        self._members[org_id] = [initial_member]
        return org

    def get_org(self, org_id: str) -> Organization | None:
        return self._organizations.get(org_id)

    def get_org_by_slug(self, slug: str) -> Organization | None:
        clean_slug = slug.strip().lower()
        for org in self._organizations.values():
            if org.slug.lower() == clean_slug:
                return org
        return None

    def list_user_orgs(self, user_id: str, user_email: str | None = None) -> list[dict]:
        results = []
        for org_id, members in self._members.items():
            for m in members:
                if m.user_id == user_id or (user_email and m.user.email.lower() == user_email.lower()):
                    org = self._organizations.get(org_id)
                    if org:
                        results.append({
                            "organization": org,
                            "role": m.role,
                            "member_id": m.id
                        })
                    break
        return results

    def list_org_members(self, org_id: str) -> list[OrganizationMember]:
        return self._members.get(org_id, [])

    def create_invites(self, org_id: str, req: CreateInviteRequest) -> list[Invite]:
        org = self._organizations.get(org_id)
        if not org:
            raise ValueError(f"Organization {org_id} not found")

        created_invites: list[Invite] = []
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

        for email in req.emails:
            clean_email = email.strip().lower()
            if not clean_email or "@" not in clean_email:
                continue

            token = f"inv_{uuid.uuid4().hex}"
            invite = Invite(
                id=f"inv_{uuid.uuid4().hex[:8]}",
                organization_id=org_id,
                organization_name=org.name,
                organization_slug=org.slug,
                email=clean_email,
                role=req.role,
                token=token,
                invited_by=req.invited_by,
                created_at=datetime.now(timezone.utc).isoformat(),
                expires_at=expires_at,
                status="pending"
            )
            self._invites_by_token[token] = invite
            created_invites.append(invite)

        # Mark team_invited true on org checklist
        org.setup_checklist.team_invited = True
        return created_invites

    def list_org_invites(self, org_id: str) -> list[Invite]:
        # Filter invites by org, checking expiry
        now = datetime.now(timezone.utc)
        results = []
        for inv in self._invites_by_token.values():
            if inv.organization_id == org_id and inv.status in ['pending', 'expired']:
                # check expiration
                try:
                    exp = datetime.fromisoformat(inv.expires_at)
                    if exp < now and inv.status == 'pending':
                        inv.status = 'expired'
                except Exception:
                    pass
                results.append(inv)
        return sorted(results, key=lambda x: x.created_at, reverse=True)

    def revoke_invite(self, org_id: str, invite_id: str) -> bool:
        for token, inv in list(self._invites_by_token.items()):
            if inv.organization_id == org_id and inv.id == invite_id:
                inv.status = 'revoked'
                return True
        return False

    def resend_invite(self, org_id: str, invite_id: str) -> Invite | None:
        for token, inv in self._invites_by_token.items():
            if inv.organization_id == org_id and inv.id == invite_id:
                inv.expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
                inv.status = 'pending'
                return inv
        return None

    def get_invite_by_token(self, token: str) -> Invite | None:
        inv = self._invites_by_token.get(token)
        if not inv:
            return None
        now = datetime.now(timezone.utc)
        try:
            exp = datetime.fromisoformat(inv.expires_at)
            if exp < now and inv.status == 'pending':
                inv.status = 'expired'
        except Exception:
            pass
        return inv

    def accept_invite(self, token: str, req: AcceptInviteRequest) -> dict:
        inv = self.get_invite_by_token(token)
        if not inv:
            raise ValueError("Invite token not found")
        if inv.status != 'pending':
            raise ValueError(f"Invite is no longer active ({inv.status})")

        org = self._organizations.get(inv.organization_id)
        if not org:
            raise ValueError("Organization no longer exists")

        user_id = req.user_id or f"usr_{uuid.uuid4().hex[:8]}"
        user_name = req.name or inv.email.split('@')[0].capitalize()

        # Check if already a member
        members = self._members.setdefault(inv.organization_id, [])
        for m in members:
            if m.user.email.lower() == inv.email.lower() or m.user_id == user_id:
                inv.status = 'accepted'
                return {
                    "organization": org,
                    "member": m,
                    "user": m.user,
                    "already_member": True
                }

        new_member = OrganizationMember(
            id=f"mem_{uuid.uuid4().hex[:8]}",
            organization_id=inv.organization_id,
            user_id=user_id,
            role=inv.role,
            joined_at=datetime.now(timezone.utc).isoformat(),
            user=OrgMemberUser(
                id=user_id,
                name=user_name,
                email=inv.email,
                avatar=(user_name[:2] if user_name else "OP").upper(),
                team="Reliability Engineering"
            )
        )
        members.append(new_member)
        inv.status = 'accepted'

        return {
            "organization": org,
            "member": new_member,
            "user": new_member.user,
            "already_member": False
        }

    def update_org_setup(self, org_id: str, req: UpdateSetupRequest) -> Organization:
        org = self._organizations.get(org_id)
        if not org:
            raise ValueError(f"Organization {org_id} not found")

        checklist = org.setup_checklist
        if req.sentry_dsn is not None:
            checklist.sentry_dsn = req.sentry_dsn
            checklist.sentry_connected = bool(req.sentry_dsn)
        if req.sentry_connected is not None:
            checklist.sentry_connected = req.sentry_connected
        if req.sentry_inbound_url is not None:
            checklist.sentry_inbound_url = req.sentry_inbound_url
        if req.sentry_webhook_secret is not None:
            checklist.sentry_webhook_secret = encrypt_secret(req.sentry_webhook_secret)

        if req.ai_api_key is not None:
            checklist.ai_api_key = encrypt_secret(req.ai_api_key)
            checklist.ai_connected = bool(req.ai_api_key)
        if req.ai_model_tier is not None:
            checklist.ai_model_tier = req.ai_model_tier
        if req.ai_connected is not None:
            checklist.ai_connected = req.ai_connected

        if req.tavily_api_key is not None:
            checklist.tavily_api_key = encrypt_secret(req.tavily_api_key)
            checklist.tavily_connected = bool(req.tavily_api_key)
        if req.tavily_connected is not None:
            checklist.tavily_connected = req.tavily_connected

        if req.slack_webhook is not None:
            checklist.slack_webhook = encrypt_secret(req.slack_webhook)
            checklist.notifications_connected = bool(req.slack_webhook or checklist.pagerduty_key)
        if req.pagerduty_key is not None:
            checklist.pagerduty_key = encrypt_secret(req.pagerduty_key)
            checklist.notifications_connected = bool(checklist.slack_webhook or req.pagerduty_key)
        if req.notifications_connected is not None:
            checklist.notifications_connected = req.notifications_connected

        if req.team_invited is not None:
            checklist.team_invited = req.team_invited

        return org

    def rotate_secret(self, org_id: str, secret_type: str, new_value: str) -> bool:
        """Rotates a single integration secret with envelope encryption."""
        org = self._organizations.get(org_id)
        if not org:
            return False
        encrypted_val = encrypt_secret(new_value)
        if hasattr(org.setup_checklist, secret_type):
            setattr(org.setup_checklist, secret_type, encrypted_val)
            return True
        return False

    def toggle_mfa_enforcement(self, org_id: str, enforced: bool) -> bool:
        """Enforces or relaxes MFA requirement for all org members."""
        org = self._organizations.get(org_id)
        if not org:
            return False
        org.mfa_enforced = enforced
        return True

    def update_member_mfa(self, user_id: str, mfa_enabled: bool):
        """Updates MFA enrollment status across all memberships for a user."""
        for members in self._members.values():
            for m in members:
                if m.user_id == user_id:
                    m.user.mfa_enabled = mfa_enabled

org_store = OrgStore()

