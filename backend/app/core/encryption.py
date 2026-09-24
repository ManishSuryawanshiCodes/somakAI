"""
SOMAK AI — Envelope Encryption Service
Cryptographic at-rest encryption for integration secrets using Fernet (AES-128-CBC + HMAC-SHA256).
"""

import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_MASTER_KEY
    try:
        # Validate Fernet key
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        # Deterministically derive 32-byte urlsafe base64 key from whatever string is configured
        digest = hashlib.sha256(key.encode()).digest()
        urlsafe_key = base64.urlsafe_b64encode(digest)
        return Fernet(urlsafe_key)

_fernet = _get_fernet()

def encrypt_secret(plaintext: str) -> str:
    """Encrypts plaintext secret to base64 Fernet token."""
    if not plaintext:
        return ""
    if plaintext.startswith("enc:"):
        return plaintext  # Already encrypted
    encrypted_bytes = _fernet.encrypt(plaintext.encode("utf-8"))
    return f"enc:{encrypted_bytes.decode('utf-8')}"

def decrypt_secret(ciphertext: str) -> str:
    """Decrypts Fernet token back to plaintext string."""
    if not ciphertext:
        return ""
    if not ciphertext.startswith("enc:"):
        return ciphertext  # Legacy plaintext, return directly
    raw_token = ciphertext[4:]
    try:
        decrypted_bytes = _fernet.decrypt(raw_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except (InvalidToken, Exception) as e:
        return f"[DECRYPTION_FAILED: {str(e)}]"

def mask_secret(secret: str) -> str:
    """Masks secret showing only prefix and last 4 characters."""
    if not secret:
        return ""
    # If encrypted, decrypt first to extract true last4
    plain = decrypt_secret(secret)
    if len(plain) <= 8:
        return "••••••••"
    if plain.startswith("sk-ant-"):
        prefix = "sk-ant-"
    elif plain.startswith("AIzaSy"):
        prefix = "AIza"
    elif plain.startswith("sk-"):
        prefix = "sk-"
    elif plain.startswith(("neb-", "tvly", "http", "pd_")):
        prefix = plain[:4]
    else:
        prefix = ""
    suffix = plain[-4:]
    return f"{prefix}••••••••{suffix}" if prefix else f"••••••••{suffix}"
