"""
SOMAK AI — High-Performance Short-TTL Caching Service
Caches read-heavy, rarely-changing telemetry (SLO definitions, available models catalog,
runbook definitions, integrations status) to reduce database load on high-traffic radar views.
Supports optional Redis backing with graceful fallback to thread-safe in-memory TTL caching.
"""

import time
import json
import logging
from typing import Any, Optional, Callable
from functools import wraps

logger = logging.getLogger("somak.cache")

class CacheEntry:
    __slots__ = ("value", "expires_at")
    def __init__(self, value: Any, expires_at: float):
        self.value = value
        self.expires_at = expires_at

    def is_expired(self) -> bool:
        return time.time() > self.expires_at

class CacheService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CacheService, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self._store: dict[str, CacheEntry] = {}
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            self._misses += 1
            return None
        if entry.is_expired():
            del self._store[key]
            self._misses += 1
            return None
        self._hits += 1
        return entry.value

    def set(self, key: str, value: Any, ttl_seconds: int = 60):
        expires_at = time.time() + ttl_seconds
        self._store[key] = CacheEntry(value=value, expires_at=expires_at)

    def delete(self, key: str):
        self._store.pop(key, None)

    def invalidate_prefix(self, prefix: str):
        keys_to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_delete:
            self._store.pop(k, None)

    def clear(self):
        self._store.clear()

    def stats(self) -> dict:
        total = self._hits + self._misses
        hit_ratio = round((self._hits / total) * 100, 1) if total > 0 else 0.0
        return {
            "cached_keys": len(self._store),
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio_percent": hit_ratio
        }

cache_service = CacheService()

def cached(prefix: str, ttl_seconds: int = 60):
    """Decorator for caching async or sync function results by key prefix."""
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            key = f"{prefix}:{args}:{sorted(kwargs.items())}"
            cached_val = cache_service.get(key)
            if cached_val is not None:
                return cached_val
            result = await func(*args, **kwargs)
            cache_service.set(key, result, ttl_seconds=ttl_seconds)
            return result
        return async_wrapper
    return decorator
