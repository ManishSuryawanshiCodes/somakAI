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

# -------------------------------------------------------------
# Signed Tokens: SSE Stream & Single-Use Action Confirmation
# -------------------------------------------------------------

import json
import base64

_consumed_confirmation_nonces = set()

def _sign_payload(payload: dict) -> str:
    raw_json = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw_json).decode("utf-8").rstrip("=")
    sig = hmac.new(settings.SESSION_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"

def _verify_payload(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, sig = parts
        expected_sig = hmac.new(settings.SESSION_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, sig):
            return None
        # Add padding back if necessary
        padding = "=" * (4 - (len(b64_payload) % 4)) if len(b64_payload) % 4 != 0 else ""
        raw_json = base64.urlsafe_b64decode(b64_payload + padding).decode("utf-8")
        payload = json.loads(raw_json)
        if time.time() > payload.get("exp", 0):
            return None
        return payload
    except Exception:
        return None

def create_stream_token(user_id: str, org_id: str) -> str:
    """Creates a short-lived (5 min) signed token for EventSource SSE connections."""
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "typ": "sse_stream",
        "exp": time.time() + 300,
        "nonce": secrets.token_hex(8)
    }
    return _sign_payload(payload)

def verify_stream_token(token: str) -> Optional[dict]:
    """Verifies a signed stream token."""
    payload = _verify_payload(token)
    if not payload or payload.get("typ") != "sse_stream":
        return None
    return payload

def create_confirmation_token(user_id: str, org_id: str, action: str, incident_id: str) -> str:
    """Creates a single-use 2-minute signed token for destructive actions (rollback, promote)."""
    nonce = secrets.token_hex(16)
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "act": action,
        "inc": incident_id,
        "typ": "action_confirm",
        "nonce": nonce,
        "exp": time.time() + 120,
    }
    return _sign_payload(payload)

def verify_and_consume_confirmation_token(token: str, user_id: str, org_id: str, action: str, incident_id: str) -> bool:
    """Verifies that the confirmation token is valid, matches the action & resource, and has not been used."""
    payload = _verify_payload(token)
    if not payload:
        return False
    if payload.get("typ") != "action_confirm":
        return False
    if payload.get("org_id") != org_id or payload.get("act") != action or payload.get("inc") != incident_id:
        return False
    # Check if user matches or has admin rights
    if payload.get("sub") != user_id:
        return False
    nonce = payload.get("nonce")
    if not nonce or nonce in _consumed_confirmation_nonces:
        return False
    # Mark as consumed (single-use)
    _consumed_confirmation_nonces.add(nonce)
    return True

