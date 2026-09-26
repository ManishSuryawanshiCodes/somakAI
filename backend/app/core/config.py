import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file into os.environ if present
_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_candidates = [_backend_dir / ".env", Path.cwd() / ".env"]
for env_file in _env_candidates:
    if env_file.exists():
        load_dotenv(env_file, override=False)
        break

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    NEBIUS_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    # Required secrets with no default - fail loudly if missing
    SENTRY_WEBHOOK_SECRET: str = os.environ["SENTRY_WEBHOOK_SECRET"]
    SESSION_SECRET: str = os.environ["SESSION_SECRET"]
    ENCRYPTION_MASTER_KEY: str = os.environ["ENCRYPTION_MASTER_KEY"]
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
    DODO_API_KEY: str = ""
    DODO_WEBHOOK_SECRET: str = ""
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
