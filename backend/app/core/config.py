import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    NEBIUS_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    SENTRY_WEBHOOK_SECRET: str = "sentry_whsec_dev_token_991823"
    SESSION_SECRET: str = "somak_sec_session_super_secret_key_32b_hex"
    ENCRYPTION_MASTER_KEY: str = "G1U6pM5N1D-9Bw_l1iK8m4o2P3q4R5s6T7u8V9w0X1Y="  # Valid 32-byte urlsafe base64 Fernet key
    MFA_ISSUER_NAME: str = "SOMAK AI"
    COOKIE_SECURE: bool = False  # Set to True in production over HTTPS
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_SECONDS: int = 900  # 15 minutes
    SANDBOX_TIMEOUT_SECONDS: int = 10

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
