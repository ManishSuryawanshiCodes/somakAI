"""
SOMAK AI — Authentication & Account Security Service
Manages Argon2 user credentials, PostgreSQL persistence, failed attempt lockout, email verification, and MFA challenges.
"""

import time
import math
import secrets
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime, timezone
from app.core.security import hash_password, verify_password
from app.core.config import settings

logger = logging.getLogger("somak.auth")

class UserRecord:
    def __init__(
        self,
        id: str,
        name: str,
        email: str,
        password_hash: str,
        role: str = "Operator",
        team: str = "Reliability Engineering",
        email_verified: bool = True,
        mfa_enabled: bool = False,
        mfa_secret: Optional[str] = None,
        verification_code: Optional[str] = None,
        failed_attempts: int = 0,
        locked_until: float = 0.0,
        created_at: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.email = email.lower().strip()
        self.password_hash = password_hash
        self.role = role
        self.team = team
        self.email_verified = email_verified
        self.mfa_enabled = mfa_enabled
        self.mfa_secret = mfa_secret
        self.verification_code = verification_code
        self.failed_attempts = failed_attempts
        self.locked_until = locked_until
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()

class AuthService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AuthService, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self._users_by_email: Dict[str, UserRecord] = {}
        self._mfa_tickets: Dict[str, Tuple[str, float]] = {}  # ticket: (user_email, expires_at)

        # Pre-seed standard administrative and demo accounts with Argon2id
        default_pwd_hash = hash_password("Password123!")

        for domain in ["somak.internal", "sentryops.internal"]:
            self.register_user(
                name="Elena Rostova",
                email=f"elena.rostova@{domain}",
                password_hash=default_pwd_hash,
                role="Admin",
                team="SecOps & Infrastructure",
                email_verified=True,
                mfa_enabled=True,
                mfa_secret="JBSWY3DPEHPK3PXP"  # Standard test secret
            )
            self.register_user(
                name="Marcus Vance",
                email=f"marcus.vance@{domain}",
                password_hash=default_pwd_hash,
                role="Operator",
                team="Platform Reliability SRE",
                email_verified=True,
                mfa_enabled=False
            )
            self.register_user(
                name="Sarah Connor",
                email=f"sarah.connor@{domain}",
                password_hash=default_pwd_hash,
                role="Viewer",
                team="Compliance & Audit",
                email_verified=True,
                mfa_enabled=False
            )
            self.register_user(
                name="Audit Observer",
                email=f"audit.observer@{domain}",
                password_hash=default_pwd_hash,
                role="Viewer",
                team="Read-Only Observer",
                email_verified=True,
                mfa_enabled=False
            )

        # Seed public demo accounts matching frontend quick login
        u_admin = self.register_user(
            name="Elena Rostova",
            email="demo-admin@somakai.dev",
            password_hash=default_pwd_hash,
            role="Admin",
            team="SecOps & Infrastructure",
            email_verified=True,
            mfa_enabled=False
        )
        u_admin.id = "usr_demo_admin"

        u_op = self.register_user(
            name="Marcus Vance",
            email="demo-operator@somakai.dev",
            password_hash=default_pwd_hash,
            role="Operator",
            team="Platform Reliability SRE",
            email_verified=True,
            mfa_enabled=False
        )
        u_op.id = "usr_demo_operator"

        u_vw = self.register_user(
            name="Sarah Connor",
            email="demo-viewer@somakai.dev",
            password_hash=default_pwd_hash,
            role="Viewer",
            team="Read-Only Compliance",
            email_verified=True,
            mfa_enabled=False
        )
        u_vw.id = "usr_demo_viewer"

        self.hydrate_from_db()

    def hydrate_from_db(self):
        """Hydrates user accounts directly from live Supabase PostgreSQL database."""
        try:
            from app.core.database import db
            rows = db.execute_query("SELECT * FROM users LIMIT 100;")
            if rows:
                for r in rows:
                    user = UserRecord(
                        id=r["id"],
                        name=r["name"],
                        email=r["email"],
                        password_hash=r["password_hash"],
                        role=r.get("role", "Operator"),
                        team=r.get("team", "Reliability Engineering"),
                        email_verified=r.get("email_verified", False),
                        mfa_enabled=r.get("mfa_enabled", False),
                        mfa_secret=r.get("mfa_secret"),
                        verification_code=r.get("verification_code"),
                        failed_attempts=r.get("failed_attempts", 0),
                        locked_until=float(r.get("locked_until", 0.0) or 0.0),
                        created_at=r.get("created_at")
                    )
                    self._users_by_email[user.email] = user
        except Exception as e:
            logger.debug(f"Auth DB hydration notice: {e}")

    def register_user(
        self,
        name: str,
        email: str,
        password_hash: str,
        role: str = "Admin",
        team: str = "Engineering",
        email_verified: bool = False,
        mfa_enabled: bool = False,
        mfa_secret: Optional[str] = None
    ) -> UserRecord:
        clean_email = email.lower().strip()
        if clean_email == "elena.rostova@somak.internal": user_id = "usr_elena"
        elif clean_email == "marcus.vance@somak.internal": user_id = "usr_mv492"
        elif clean_email == "audit.observer@somak.internal": user_id = "usr_observer"
        elif clean_email == "sarah.connor@somak.internal": user_id = "usr_sarah"
        else: user_id = f"usr_{abs(hash(clean_email)) % 10000000:07d}_{secrets.token_hex(3)}"

        verification_code = f"{secrets.randbelow(900000) + 100000}" if not email_verified else None

        user = UserRecord(
            id=user_id,
            name=name,
            email=clean_email,
            password_hash=password_hash,
            role=role,
            team=team,
            email_verified=email_verified,
            mfa_enabled=mfa_enabled,
            mfa_secret=mfa_secret,
            verification_code=verification_code
        )

        self._users_by_email[clean_email] = user

        # Persist to Supabase PostgreSQL database
        try:
            from app.core.database import db
            db.execute_query(
                """
                INSERT INTO users (
                    id, name, email, password_hash, role, team,
                    email_verified, mfa_enabled, mfa_secret, verification_code,
                    failed_attempts, locked_until, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    password_hash = EXCLUDED.password_hash,
                    role = EXCLUDED.role,
                    team = EXCLUDED.team,
                    email_verified = EXCLUDED.email_verified,
                    mfa_enabled = EXCLUDED.mfa_enabled,
                    mfa_secret = EXCLUDED.mfa_secret,
                    verification_code = EXCLUDED.verification_code,
                    failed_attempts = EXCLUDED.failed_attempts,
                    locked_until = EXCLUDED.locked_until;
                """,
                (
                    user.id, user.name, user.email, user.password_hash, user.role, user.team,
                    user.email_verified, user.mfa_enabled, user.mfa_secret, user.verification_code,
                    user.failed_attempts, user.locked_until, user.created_at
                )
            )
        except Exception as e:
            logger.warning(f"Error persisting user {clean_email} to database: {e}")

        return user

    def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        clean_email = email.lower().strip()
        if clean_email in self._users_by_email:
            return self._users_by_email[clean_email]

        # Query database fallback
        try:
            from app.core.database import db
            rows = db.execute_query("SELECT * FROM users WHERE LOWER(email) = %s LIMIT 1;", (clean_email,))
            if rows:
                r = rows[0]
                user = UserRecord(
                    id=r["id"],
                    name=r["name"],
                    email=r["email"],
                    password_hash=r["password_hash"],
                    role=r.get("role", "Operator"),
                    team=r.get("team", "Reliability Engineering"),
                    email_verified=r.get("email_verified", False),
                    mfa_enabled=r.get("mfa_enabled", False),
                    mfa_secret=r.get("mfa_secret"),
                    verification_code=r.get("verification_code"),
                    failed_attempts=r.get("failed_attempts", 0),
                    locked_until=float(r.get("locked_until", 0.0) or 0.0),
                    created_at=r.get("created_at")
                )
                self._users_by_email[clean_email] = user
                return user
        except Exception:
            pass

        return None

    def get_user_by_id(self, user_id: str) -> Optional[UserRecord]:
        for u in self._users_by_email.values():
            if u.id == user_id:
                return u

        # Query database fallback
        try:
            from app.core.database import db
            rows = db.execute_query("SELECT * FROM users WHERE id = %s LIMIT 1;", (user_id,))
            if rows:
                r = rows[0]
                user = UserRecord(
                    id=r["id"],
                    name=r["name"],
                    email=r["email"],
                    password_hash=r["password_hash"],
                    role=r.get("role", "Operator"),
                    team=r.get("team", "Reliability Engineering"),
                    email_verified=r.get("email_verified", False),
                    mfa_enabled=r.get("mfa_enabled", False),
                    mfa_secret=r.get("mfa_secret"),
                    verification_code=r.get("verification_code"),
                    failed_attempts=r.get("failed_attempts", 0),
                    locked_until=float(r.get("locked_until", 0.0) or 0.0),
                    created_at=r.get("created_at")
                )
                self._users_by_email[user.email] = user
                return user
        except Exception:
            pass

        return None

    def check_lockout(self, email: str) -> Tuple[bool, int]:
        """Returns (is_locked, remaining_seconds)."""
        user = self.get_user_by_email(email)
        if not user:
            return False, 0
        now = time.time()
        if user.locked_until > now:
            remaining = max(1, math.ceil(user.locked_until - now))
            return True, remaining
        return False, 0

    def record_failed_login(self, email: str) -> Tuple[int, int]:
        """Records failed attempt. Returns (attempts, lockout_remaining_seconds)."""
        clean_email = email.lower().strip()
        user = self.get_user_by_email(clean_email)
        if not user:
            return 1, 0
        now = time.time()
        if user.locked_until > now:
            return user.failed_attempts, max(1, math.ceil(user.locked_until - now))

        user.failed_attempts += 1
        lockout_dur = 0
        if user.failed_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + settings.LOCKOUT_DURATION_SECONDS
            lockout_dur = settings.LOCKOUT_DURATION_SECONDS

        try:
            from app.core.database import db
            db.execute_query(
                "UPDATE users SET failed_attempts = %s, locked_until = %s WHERE LOWER(email) = %s;",
                (user.failed_attempts, user.locked_until, clean_email)
            )
        except Exception:
            pass

        return user.failed_attempts, lockout_dur

    def reset_failed_logins(self, email: str):
        clean_email = email.lower().strip()
        user = self.get_user_by_email(clean_email)
        if user:
            user.failed_attempts = 0
            user.locked_until = 0.0
            try:
                from app.core.database import db
                db.execute_query(
                    "UPDATE users SET failed_attempts = 0, locked_until = 0.0 WHERE LOWER(email) = %s;",
                    (clean_email,)
                )
            except Exception:
                pass

    def verify_email_code(self, email: str, code: str) -> bool:
        clean_email = email.lower().strip()
        user = self.get_user_by_email(clean_email)
        if not user:
            return False
        clean_code = code.replace("-", "").strip()
        if user.verification_code and user.verification_code == clean_code:
            user.email_verified = True
            user.verification_code = None
            try:
                from app.core.database import db
                db.execute_query(
                    "UPDATE users SET email_verified = TRUE, verification_code = NULL WHERE LOWER(email) = %s;",
                    (clean_email,)
                )
            except Exception:
                pass
            return True
        return False

    def create_mfa_ticket(self, email: str) -> str:
        ticket = f"mfa_{secrets.token_urlsafe(24)}"
        # Ticket valid for 5 minutes
        self._mfa_tickets[ticket] = (email.lower().strip(), time.time() + 300)
        return ticket

    def consume_mfa_ticket(self, ticket: str) -> Optional[UserRecord]:
        if ticket not in self._mfa_tickets:
            return None
        email, expires_at = self._mfa_tickets.pop(ticket)
        if time.time() > expires_at:
            return None
        return self.get_user_by_email(email)

auth_service = AuthService()
