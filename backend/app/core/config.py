import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    NEBIUS_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    SENTRY_WEBHOOK_SECRET: str = "sentry_whsec_63f6f68ed41ead93c1e2f93b66f3c9e5ae842057aa85ed67"
    SESSION_SECRET: str = "4fe6abda02c263fb03d4eef8729537771cd0a601510a98c10587369395b22ffa"
    ENCRYPTION_MASTER_KEY: str = "KAqej9u5ywcF6oDW5v9dN6soVEs0gDL1r0eLO7a4w8Q="  # Valid 32-byte urlsafe base64 Fernet key
    MFA_ISSUER_NAME: str = "SOMAK AI"
    COOKIE_SECURE: bool = False  # Set to True in production over HTTPS
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_SECONDS: int = 900  # 15 minutes
    SANDBOX_TIMEOUT_SECONDS: int = 10
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    SOMAK_INFRA_SENTRY_DSN: str = ""
    REDIS_URL: str = ""
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://app.somak.ai"
    ]

    class Config:
        env_file = (
            os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
            ".env"
        )
        extra = "allow"

settings = Settings()
