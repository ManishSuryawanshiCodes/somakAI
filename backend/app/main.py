from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import router
from app.middleware.rate_limiter import RateLimiterMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting SOMAK AI Backend Service...")
    yield
    print("Shutting down SOMAK AI Backend Service...")

app = FastAPI(title="SOMAK AI API", lifespan=lifespan)

app.add_middleware(RateLimiterMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "SentryOps API"}
