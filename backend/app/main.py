import os
import time
import psutil
import logging
from fastapi import FastAPI, Response, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import db
from app.core.job_queue import job_queue
from app.core.tenant_limiter import tenant_limiter
from app.core.cache import cache_service
from app.services.incident_store import incident_store
from app.services.auth_service import auth_service
from app.services.org_store import org_store
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.api.routes import router

logger = logging.getLogger("somak.main")
SERVER_START_TIME = time.time()

# -------------------------------------------------------------
# Error Monitoring for Somak AI Infrastructure (Sentry SDK)
# -------------------------------------------------------------
sentry_dsn = settings.SOMAK_INFRA_SENTRY_DSN or os.getenv("SOMAK_INFRA_SENTRY_DSN") or os.getenv("SENTRY_DSN")
if sentry_dsn:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=1.0,
            environment=settings.ENVIRONMENT,
            release="somak-ai@2.0.0",
        )
        logger.info("[Sentry] Infrastructure error monitoring initialized.")
    except Exception as e:
        logger.warning(f"[Sentry] Notice: Could not initialize Sentry SDK ({e})")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SOMAK AI Backend Service...")
    # 1. Initialize DB pool, execute table DDL & performance indexes
    connected = db.init_db()
    if connected:
        logger.info("[Database] Successfully connected to live Supabase PostgreSQL database.")
    else:
        logger.warning("[Database] WARNING: Supabase PostgreSQL connection failed.")

    # 2. Crash Auto-Recovery: Hydrate in-flight & historical incidents from Supabase
    incident_store.hydrate_from_db()
    logger.info("Auto-recovery: In-flight and active incidents hydrated from Supabase PostgreSQL.")

    # 3. User Account Hydration: Hydrate user records from PostgreSQL
    auth_service.hydrate_from_db()
    logger.info("User accounts: Successfully hydrated user accounts from Supabase PostgreSQL.")

    # 4. Organization Hydration: Hydrate tenant workspaces and checklists from PostgreSQL
    org_store.hydrate_from_db()
    logger.info("Organizations: Successfully hydrated tenant organizations from Supabase PostgreSQL.")

    # 5. Start background job queue workers
    job_queue.start_workers(worker_count=4)

    yield

    logger.info("Shutting down SOMAK AI Backend Service...")
    # 4. Graceful shutdown: drain queue workers and close DB connection pool
    await job_queue.stop_workers()
    db.close()
    logger.info("SOMAK AI Backend shutdown complete.")

app = FastAPI(title="SOMAK AI API", lifespan=lifespan)

# Global unhandled exception handler: prevents stack trace leaks to client
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Telemetry has logged the incident."}
    )

app.add_middleware(RateLimiterMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Somak AI Autonomous Incident Remediation API",
        "version": "2.0.0",
        "byok_providers": ["nebius", "anthropic", "openai", "google"]
    }

# -------------------------------------------------------------
# DevOps Health, Liveness & Readiness Probes (Render / Railway / K8s)
# -------------------------------------------------------------

@app.get("/health")
async def health_check(response: Response):
    """
    Comprehensive infrastructure health probe inspecting database connection pool,
    background job queue lag, multi-tenant concurrency slots, and process memory.
    """
    db_health = db.check_health()
    queue_metrics = job_queue.get_metrics()
    tenant_metrics = tenant_limiter.get_metrics()
    cache_stats = cache_service.stats()

    process = psutil.Process(os.getpid())
    memory_mb = round(process.memory_info().rss / (1024 * 1024), 2)
    uptime_sec = round(time.time() - SERVER_START_TIME, 1)

    is_healthy = db_health.get("connected", False) or db._pool is None
    status_str = "healthy" if db_health.get("connected", False) else "degraded"

    if not is_healthy:
        response.status_code = 503

    return {
        "status": status_str,
        "uptime_seconds": uptime_sec,
        "database": db_health,
        "job_queue": queue_metrics,
        "tenant_limiter": tenant_metrics,
        "cache": cache_stats,
        "process": {
            "pid": os.getpid(),
            "rss_memory_mb": memory_mb
        }
    }

@app.get("/healthz")
async def liveness_probe():
    """Kubernetes / Container orchestrator liveness probe."""
    return {"status": "alive"}

@app.get("/readyz")
async def readiness_probe(response: Response):
    """Kubernetes / Container orchestrator readiness probe."""
    db_ok = db.check_health().get("connected", False)
    if not db_ok:
        response.status_code = 503
        return {"status": "not_ready", "reason": "Database connection pool unreachable"}
    return {"status": "ready"}
