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
            sentry_inbound_url="https://api.somak.ai/v1/webhook/ingest/acme-prod",
            sentry_webhook_secret=encrypt_secret("sentry_whsec_dev_token_991823"),
            ai_connected=True,
            ai_api_key=encrypt_secret("neb-tok-live-89f4b321"),
            nebius_api_key=encrypt_secret("neb-tok-live-89f4b321"),
            ai_model_tier="nvidia/nemotron-3-ultra-550b",
            triage_provider="nebius",
            triage_model="nvidia/nemotron-3-nano-30b-a3b",
            synthesis_provider="nebius",
            synthesis_model="nvidia/nemotron-3-ultra-550b",
            anthropic_connected=False,
            anthropic_api_key="",
            openai_connected=False,
            openai_api_key="",
            google_connected=False,
            google_api_key="",
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
            plan="enterprise",
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
                        email="elena.rostova@somak.internal",
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
                        email="marcus.vance@somak.internal",
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
                        email="devin.zhao@somak.internal",
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
                        email="sarah.connor@somak.internal",
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
                        email="audit.observer@somak.internal",
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
        inbound_url = f"https://api.somak.ai/v1/webhook/ingest/{clean_slug}"
        
        checklist = SetupChecklist(
            sentry_inbound_url=inbound_url
        )

        org = Organization(
            id=org_id,
            name=req.name.strip(),
            slug=clean_slug,
            team_size=req.team_size or "2-10",
            primary_use_case=req.primary_use_case or "Autonomous Incident Remediation",
            plan=req.plan or "business",
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
        self._sync_org_to_db(org)
        return org

    def hydrate_from_db(self):
        """Hydrates organizations from Supabase PostgreSQL database into memory."""
        try:
            import json
            from app.core.database import db
            rows = db.execute_query("SELECT * FROM organizations;")
            if rows:
                for r in rows:
                    ch_data = r.get("setup_checklist")
                    if isinstance(ch_data, str):
                        try:
                            ch_data = json.loads(ch_data)
                        except Exception:
                            ch_data = {}
                    elif not isinstance(ch_data, dict):
                        ch_data = {}
                    checklist = SetupChecklist(**ch_data)
                    org = Organization(
                        id=r["id"],
                        name=r["name"],
                        slug=r["slug"],
                        team_size=r.get("team_size") or "2-10",
                        primary_use_case=r.get("primary_use_case") or "Autonomous Incident Remediation",
                        mfa_enforced=r.get("mfa_enforced", False),
                        plan=r.get("plan", "business"),
                        created_at=r["created_at"],
                        created_by=r["created_by"],
                        setup_checklist=checklist
                    )
                    self._organizations[org.id] = org

                    if org.id not in self._members:
                        creator_id = org.created_by
                        self._members[org.id] = [
                            OrganizationMember(
                                id=f"mem_{org.id[:8]}",
                                organization_id=org.id,
                                user_id=creator_id,
                                role="Admin",
                                joined_at=org.created_at,
                                user=OrgMemberUser(
                                    id=creator_id,
                                    name="Workspace Admin",
                                    email=f"admin@{org.slug}.com",
                                    avatar="WA",
                                    team="SecOps & Infrastructure",
                                    mfa_enabled=False,
                                    email_verified=True,
                                )
                            )
                        ]
        except Exception as e:
            pass

    def get_org(self, org_id: str) -> Organization | None:
        return self._organizations.get(org_id)

    def get_org_by_slug(self, slug: str) -> Organization | None:
        clean_slug = slug.strip().lower()
        for org in self._organizations.values():
            if org.slug.lower() == clean_slug:
                return org
        return None

    def list_all_orgs(self) -> list[Organization]:
        return list(self._organizations.values())

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
            checklist.nebius_api_key = checklist.ai_api_key
            checklist.ai_connected = bool(req.ai_api_key)
        if req.nebius_api_key is not None:
            checklist.nebius_api_key = encrypt_secret(req.nebius_api_key)
            checklist.ai_api_key = checklist.nebius_api_key
            checklist.ai_connected = bool(req.nebius_api_key)
        if req.ai_model_tier is not None:
            checklist.ai_model_tier = req.ai_model_tier
        if req.triage_provider is not None:
            checklist.triage_provider = req.triage_provider
        if req.triage_model is not None:
            checklist.triage_model = req.triage_model
        if req.synthesis_provider is not None:
            checklist.synthesis_provider = req.synthesis_provider
        if req.synthesis_model is not None:
            checklist.synthesis_model = req.synthesis_model
        if req.ai_connected is not None:
            checklist.ai_connected = req.ai_connected

        if req.anthropic_api_key is not None:
            checklist.anthropic_api_key = encrypt_secret(req.anthropic_api_key)
            checklist.anthropic_connected = bool(req.anthropic_api_key)
        if req.anthropic_connected is not None:
            checklist.anthropic_connected = req.anthropic_connected

        if req.openai_api_key is not None:
            checklist.openai_api_key = encrypt_secret(req.openai_api_key)
            checklist.openai_connected = bool(req.openai_api_key)
        if req.openai_connected is not None:
            checklist.openai_connected = req.openai_connected

        if req.google_api_key is not None:
            checklist.google_api_key = encrypt_secret(req.google_api_key)
            checklist.google_connected = bool(req.google_api_key)
        if req.google_connected is not None:
            checklist.google_connected = req.google_connected

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

        if req.sandbox_concurrency is not None:
            checklist.sandbox_concurrency = req.sandbox_concurrency
        if req.sandbox_timeout is not None:
            checklist.sandbox_timeout = req.sandbox_timeout

        self._sync_org_to_db(org)
        return org

    def update_org_plan(self, org_id: str, plan: str) -> Organization | None:
        """Updates plan tier for an organization."""
        org = self._organizations.get(org_id)
        if not org:
            return None
        org.plan = plan  # type: ignore
        self._sync_org_to_db(org)
        return org

    def rotate_secret(self, org_id: str, secret_type: str, new_value: str) -> bool:
        """Rotates a single integration secret with envelope encryption."""
        org = self._organizations.get(org_id)
        if not org:
            return False
        encrypted_val = encrypt_secret(new_value)
        if hasattr(org.setup_checklist, secret_type):
            setattr(org.setup_checklist, secret_type, encrypted_val)
            if secret_type in ("ai_api_key", "nebius_api_key"):
                org.setup_checklist.ai_api_key = encrypted_val
                org.setup_checklist.nebius_api_key = encrypted_val
                org.setup_checklist.ai_connected = bool(new_value)
            elif secret_type == "anthropic_api_key":
                org.setup_checklist.anthropic_connected = bool(new_value)
            elif secret_type == "openai_api_key":
                org.setup_checklist.openai_connected = bool(new_value)
            elif secret_type == "google_api_key":
                org.setup_checklist.google_connected = bool(new_value)
            elif secret_type == "tavily_api_key":
                org.setup_checklist.tavily_connected = bool(new_value)
            self._sync_org_to_db(org)
            return True
        return False

    def get_decrypted_provider_key(self, org_id: str, provider: str) -> str:
        """Returns the decrypted BYOK key for an organization and provider."""
        org = self._organizations.get(org_id)
        if not org:
            return ""
        ch = org.setup_checklist
        prov = (provider or "").lower()
        enc_key = ""
        if prov == "anthropic":
            enc_key = ch.anthropic_api_key
        elif prov == "openai":
            enc_key = ch.openai_api_key
        elif prov == "google":
            enc_key = ch.google_api_key
        elif prov == "nebius":
            enc_key = ch.nebius_api_key or ch.ai_api_key

        if not enc_key:
            return ""
        from app.core.encryption import decrypt_secret
        return decrypt_secret(enc_key)

    def _sync_org_to_db(self, org: Organization):
        """Asynchronously or best-effort syncs org to Supabase PostgreSQL."""
        try:
            import json
            from app.core.database import db
            query = """
            INSERT INTO organizations (id, name, slug, team_size, primary_use_case, mfa_enforced, plan, created_at, created_by, setup_checklist)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                team_size = EXCLUDED.team_size,
                primary_use_case = EXCLUDED.primary_use_case,
                mfa_enforced = EXCLUDED.mfa_enforced,
                plan = EXCLUDED.plan,
                setup_checklist = EXCLUDED.setup_checklist;
            """
            db.execute_query(query, (
                org.id,
                org.name,
                org.slug,
                org.team_size,
                org.primary_use_case,
                org.mfa_enforced,
                org.plan,
                org.created_at,
                org.created_by,
                json.dumps(org.setup_checklist.model_dump())
            ))
        except Exception:
            pass


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

