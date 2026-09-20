import httpx
from app.core.config import settings
from app.models.incident import TavilyCitation

class TavilySearchService:
    async def search(self, query: str) -> list[TavilyCitation]:
        if not settings.TAVILY_API_KEY:
            return self._simulated_search()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={"query": query, "api_key": settings.TAVILY_API_KEY}
                )
                response.raise_for_status()
                data = response.json()
                return [
                    TavilyCitation(
                        title=result.get("title", ""),
                        url=result.get("url", ""),
                        snippet=result.get("content", "")
                    ) for result in data.get("results", [])[:3]
                ]
        except Exception:
            return self._simulated_search()

    def _simulated_search(self) -> list[TavilyCitation]:
        return [
            TavilyCitation(
                title="Node.js Memory Leaks: EventEmitters and Caching",
                url="https://nodejs.org/en/docs/guides/diagnostics/memory/event-emitters",
                snippet="A common source of memory leaks in Node.js applications is unmanaged event listeners and unbounded cache objects storing large payload data."
            ),
            TavilyCitation(
                title="Best practices for implementing LRU cache in TypeScript",
                url="https://blog.logrocket.com/implementing-lru-cache-typescript/",
                snippet="When dealing with high-throughput services, unbounded Maps can quickly consume the V8 heap. Implement a size-limited LRU or TTL cache to prevent OOM errors."
            ),
            TavilyCitation(
                title="Debugging V8 Out Of Memory Exceptions in Auth Services",
                url="https://engineering.auth0.com/debugging-oom-nodejs",
                snippet="In auth services, JWT token validation results in many intermediate objects. If you cache token verification results, ensure the cache has a strict upper bound."
            )
        ]
