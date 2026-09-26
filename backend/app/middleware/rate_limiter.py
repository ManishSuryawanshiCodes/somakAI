"""
SOMAK AI — Rate Limiting & Abuse Protection Middleware
Thread-safe sliding-window rate limiter per client IP.
"""

import time
import math
import threading
from collections import deque
from typing import Dict, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

class RateLimitRule:
    def __init__(self, max_requests: int, window_seconds: int, description: str):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.description = description

class RateLimiterMiddleware(BaseHTTPMiddleware):
    _instances = []

    def __init__(self, app):
        super().__init__(app)
        self.lock = threading.Lock()
        # storage: { key: deque([timestamps...]) }
        self.storage: Dict[str, deque] = {}
        RateLimiterMiddleware._instances.append(self)

        # Route matching rules: (path_prefix, RateLimitRule)
        self.rules: Dict[str, RateLimitRule] = {
            "/api/auth/signup": RateLimitRule(5, 3600, "5 requests per hour"),
            "/api/auth/login": RateLimitRule(15, 60, "15 requests per minute"),
            "/api/simulate": RateLimitRule(30, 60, "30 requests per minute"),
            "/api/v1/webhook": RateLimitRule(30, 60, "30 requests per minute"),
        }

    @classmethod
    def reset(cls):
        for inst in cls._instances:
            with inst.lock:
                inst.storage.clear()

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # First IP in comma-separated chain
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def _match_rule(self, path: str) -> Optional[Tuple[str, RateLimitRule]]:
        for prefix, rule in self.rules.items():
            if path.startswith(prefix):
                return prefix, rule
        return None

    async def dispatch(self, request: Request, call_next):
        # Never rate limit CORS preflight OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check if route matches any protected endpoint
        path = request.url.path
        match = self._match_rule(path)

        if not match:
            return await call_next(request)

        prefix, rule = match
        client_ip = self._get_client_ip(request)
        key = f"{prefix}:{client_ip}"
        now = time.time()

        with self.lock:
            if key not in self.storage:
                self.storage[key] = deque()

            bucket = self.storage[key]

            # 1. Evict timestamps outside sliding window
            cutoff = now - rule.window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            # 2. Check if rate limit exceeded
            if len(bucket) >= rule.max_requests:
                oldest = bucket[0]
                retry_after = max(1, math.ceil(oldest + rule.window_seconds - now))
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": f"Rate limit exceeded. Too many requests to {prefix}.",
                        "retry_after": retry_after,
                        "limit": rule.description,
                    },
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(rule.max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(now + retry_after)),
                    },
                )

            # 3. Allow request and record timestamp
            bucket.append(now)
            remaining = rule.max_requests - len(bucket)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rule.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response
