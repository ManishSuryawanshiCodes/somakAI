"""
SOMAK AI — Multi-Factor Authentication (TOTP) Service
Generates base32 secrets, otpauth URLs, and verifies 6-digit TOTP tokens using pyotp.
"""

import pyotp
import urllib.parse
from app.core.config import settings

def generate_mfa_secret(email: str) -> dict:
    """Generates a new TOTP secret and otpauth setup URI."""
    secret = pyotp.random_base32()
    issuer = settings.MFA_ISSUER_NAME
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=email, issuer_name=issuer)
    
    # Also generate a lightweight QR code image URL (or inline SVG format)
    # Using standard quickchart / google chart URL for immediate rendering in browser
    encoded_uri = urllib.parse.quote(otpauth_url)
    qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_uri}"

    return {
        "secret": secret,
        "otpauth_url": otpauth_url,
        "qr_image_url": qr_image_url,
        "issuer": issuer,
    }

def verify_totp_code(secret: str, code: str) -> bool:
    """Verifies a 6-digit code against secret with 1-step window tolerance for clock skew."""
    if not secret or not code:
        return False
    clean_code = code.replace(" ", "").replace("-", "").strip()
    totp = pyotp.TOTP(secret)
    return totp.verify(clean_code, valid_window=1)
