"""
SOMAK AI — Authentication & Account Security Service
Manages Argon2 user credentials, failed attempt lockout, email verification, and MFA challenges.
"""

import time
import math
import secrets
from typing import Dict, Optional, Tuple
from app.core.security import hash_password, verify_password
from app.core.config import settings

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
        self.verification_code: Optional[str] = None
        self.failed_attempts = 0
        self.locked_until = 0.0

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

        # Seed pre-hashed accounts with Argon2id
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
        user_id = f"usr_{abs(hash(clean_email)) % 10000000:07d}"
        if "elena" in clean_email: user_id = "usr_elena"
        elif "marcus" in clean_email: user_id = "usr_mv492"
        elif "observer" in clean_email: user_id = "usr_observer"
        elif "sarah" in clean_email: user_id = "usr_sarah"

        user = UserRecord(
            id=user_id,
            name=name,
            email=clean_email,
            password_hash=password_hash,
            role=role,
            team=team,
            email_verified=email_verified,
            mfa_enabled=mfa_enabled,
            mfa_secret=mfa_secret
        )
        if not email_verified:
            user.verification_code = f"{secrets.randbelow(900000) + 100000}"

        self._users_by_email[clean_email] = user
        return user

    def get_user_by_email(self, email: str) -> Optional[UserRecord]:
        return self._users_by_email.get(email.lower().strip())

    def get_user_by_id(self, user_id: str) -> Optional[UserRecord]:
        for u in self._users_by_email.values():
            if u.id == user_id:
                return u
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
        user = self.get_user_by_email(email)
        if not user:
            return 1, 0
        now = time.time()
        if user.locked_until > now:
            return user.failed_attempts, max(1, math.ceil(user.locked_until - now))

        user.failed_attempts += 1
        if user.failed_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + settings.LOCKOUT_DURATION_SECONDS
            return user.failed_attempts, settings.LOCKOUT_DURATION_SECONDS
        return user.failed_attempts, 0

    def reset_failed_logins(self, email: str):
        user = self.get_user_by_email(email)
        if user:
            user.failed_attempts = 0
            user.locked_until = 0.0

    def verify_email_code(self, email: str, code: str) -> bool:
        user = self.get_user_by_email(email)
        if not user:
            return False
        clean_code = code.replace("-", "").strip()
        if user.verification_code and user.verification_code == clean_code:
            user.email_verified = True
            user.verification_code = None
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
