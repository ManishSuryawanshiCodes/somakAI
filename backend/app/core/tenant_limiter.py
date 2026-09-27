"""
SOMAK AI — Multi-Tenant Concurrency Limiter & Fair Queuing Manager
Prevents noisy tenants from starving shared AI/sandbox pipeline capacity.
Enforces per-organization concurrency caps and sliding-window webhook ingress rate limits.
"""

import time
import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
from contextlib import asynccontextmanager

logger = logging.getLogger("somak.tenant_limiter")

class TenantQueueManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TenantQueueManager, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        # Maximum concurrent in-flight pipeline executions per org
        self.default_concurrency_limit = 3
        self.enterprise_concurrency_limit = 10
        self.active_jobs_per_org: Dict[str, int] = defaultdict(int)

        # Ingress rate limits: 100 requests per 60-second sliding window per tenant
        self.rate_limit_window_sec = 60.0
        self.rate_limit_max_requests = 100
        self.request_timestamps_per_org: Dict[str, List[float]] = defaultdict(list)

        # Tier-based rate limits for server-level LLM fallback calls (calls per 1-hour window)
        self.server_fallback_tier_limits = {
            "free": 5,
            "team": 30,
            "business": 100,
            "enterprise": 250,
        }
        self.server_fallback_window_sec = 3600.0  # 1 hour
        self.server_fallback_timestamps: Dict[str, List[float]] = defaultdict(list)

        self._lock = asyncio.Lock()

    def get_tenant_limit(self, org_id: str) -> int:
        if "enterprise" in org_id.lower() or "acme" in org_id.lower():
            return self.enterprise_concurrency_limit
        return self.default_concurrency_limit

    async def check_webhook_rate_limit(self, org_id: str) -> Tuple[bool, int, Optional[str]]:
        """
        Sliding-window rate limiter for inbound webhooks.
        Returns: (is_allowed, retry_after_seconds, rejection_reason)
        """
        async with self._lock:
            now = time.time()
            cutoff = now - self.rate_limit_window_sec
            timestamps = [t for t in self.request_timestamps_per_org[org_id] if t > cutoff]
            self.request_timestamps_per_org[org_id] = timestamps

            if len(timestamps) >= self.rate_limit_max_requests:
                oldest_in_window = timestamps[0]
                retry_after = max(1, int(oldest_in_window + self.rate_limit_window_sec - now))
                msg = f"Tenant '{org_id}' webhook rate limit exceeded ({self.rate_limit_max_requests} req/min). Fair-queuing protection engaged."
                logger.warning(f"[RateLimit] {msg}")
                return False, retry_after, msg

            self.request_timestamps_per_org[org_id].append(now)
            return True, 0, None

    async def check_server_fallback_rate_limit(self, org_id: str, plan: str = "business") -> Tuple[bool, int, Optional[str]]:
        """
        Sliding-window rate limiter for shared server-level AI credits (NVIDIA NIM / Gemini fallback).
        Prevents resource depletion and protects quotas per tenant tier.
        """
        async with self._lock:
            now = time.time()
            cutoff = now - self.server_fallback_window_sec
            normalized_plan = (plan or "free").lower()
            max_calls = self.server_fallback_tier_limits.get(normalized_plan, self.server_fallback_tier_limits["free"])

            timestamps = [t for t in self.server_fallback_timestamps[org_id] if t > cutoff]
            self.server_fallback_timestamps[org_id] = timestamps

            if len(timestamps) >= max_calls:
                oldest_in_window = timestamps[0]
                retry_after = max(1, int(oldest_in_window + self.server_fallback_window_sec - now))
                msg = f"Org '{org_id}' on {normalized_plan.upper()} tier reached server AI fallback limit ({max_calls}/hr). Please configure a BYOK key in Settings or upgrade your plan."
                logger.warning(f"[ServerFallbackLimiter] {msg}")
                return False, retry_after, msg

            self.server_fallback_timestamps[org_id].append(now)
            return True, 0, None

    async def can_schedule_pipeline(self, org_id: str) -> Tuple[bool, str]:
        """Checks if organization has available concurrency capacity."""
        limit = self.get_tenant_limit(org_id)
        current = self.active_jobs_per_org[org_id]
        if current >= limit:
            return False, f"Tenant '{org_id}' concurrency limit reached ({current}/{limit} active pipelines). Queued for fair-dispatch."
        return True, "Capacity available"

    @asynccontextmanager
    async def tenant_slot(self, org_id: str):
        """Context manager reserving an execution slot for an org."""
        async with self._lock:
            self.active_jobs_per_org[org_id] += 1
            current = self.active_jobs_per_org[org_id]
            logger.info(f"[TenantLimiter] Org '{org_id}' active jobs: {current}/{self.get_tenant_limit(org_id)}")

        try:
            yield
        finally:
            async with self._lock:
                self.active_jobs_per_org[org_id] = max(0, self.active_jobs_per_org[org_id] - 1)
                logger.info(f"[TenantLimiter] Released slot for org '{org_id}'. Remaining active: {self.active_jobs_per_org[org_id]}")

    def get_metrics(self) -> Dict[str, Any]:
        """Telemetry on multi-tenant active allocations."""
        return {
            "active_jobs_per_org": dict(self.active_jobs_per_org),
            "total_active_pipelines": sum(self.active_jobs_per_org.values()),
            "configured_limits": {
                "default": self.default_concurrency_limit,
                "enterprise": self.enterprise_concurrency_limit,
                "rate_limit_window_sec": self.rate_limit_window_sec,
                "max_webhooks_per_min": self.rate_limit_max_requests
            }
        }

tenant_limiter = TenantQueueManager()
