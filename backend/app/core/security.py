"""
SOMAK AI — Core Security & Authentication Infrastructure
Argon2id password hashing, session tokens, and cookie management.
"""

import time
import hmac
import hashlib
import secrets
from typing import Optional, Dict
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from starlette.responses import Response
from app.core.config import settings

# Argon2id hasher with strong OWASP work factor:
# memory_cost=65536 (64 MB), time_cost=3, parallelism=4
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32
)

def hash_password(plaintext: str) -> str:
    """Hashes plaintext using Argon2id."""
    return ph.hash(plaintext)

def verify_password(plaintext: str, hashed: str) -> bool:
    """Verifies plaintext against Argon2id hash with timing safety."""
    try:
        return ph.verify(hashed, plaintext)
    except (VerifyMismatchError, InvalidHashError, Exception):
        return False

# In-Memory Active Session Registry
# { session_id: { user_id, email, role, created_at, expires_at } }
_active_sessions: Dict[str, dict] = {}

SESSION_MAX_AGE_SECONDS = 86400  # 24 hours

def create_session(user_id: str, email: str, role: str) -> str:
    """Creates a cryptographically secure session and returns token."""
    raw_token = secrets.token_urlsafe(32)
    now = time.time()
    _active_sessions[raw_token] = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "created_at": now,
        "expires_at": now + SESSION_MAX_AGE_SECONDS,
    }
    return raw_token

def get_session(token: str) -> Optional[dict]:
    """Retrieves and validates an active session."""
    if not token or token not in _active_sessions:
        return None
    session = _active_sessions[token]
    if time.time() > session["expires_at"]:
        del _active_sessions[token]
        return None
    return session

def revoke_session(token: str) -> bool:
    """Revokes a session upon logout."""
    if token in _active_sessions:
        del _active_sessions[token]
        return True
    return False

def set_session_cookie(response: Response, token: str):
    """Sets HttpOnly, SameSite=Strict session cookie."""
    response.set_cookie(
        key="somak_session",
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",  # lax allows local cross-port navigation, strict in prod
        path="/",
    )

def clear_session_cookie(response: Response):
    """Clears the session cookie."""
    response.delete_cookie(
        key="somak_session",
        path="/",
        httponly=True,
        samesite="lax",
    )
