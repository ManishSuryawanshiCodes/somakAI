from app.models.incident import Incident, CanaryStatus, SystemHealth
import time
import math

class IncidentStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(IncidentStore, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        from app.models.incident import TavilyCitation, RootCauseAnalysis, SandboxExecution, Patch
        from datetime import datetime, timezone

        default_citations = [
            TavilyCitation(
                title="Node.js Memory Leaks: EventEmitters and Caching Patterns",
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

        default_sandbox = SandboxExecution(
            sandboxId="nbx-sbx-8841",
            exitCode=0,
            stdout="Running test suite...\nPASS src/services/tokenService.test.ts\nTest Suites: 1 passed, 1 total\nTests: 14 passed, 14 total\nTime: 1.243 s",
            testsPassed=14,
            totalTests=14
        )

        default_patch = Patch(
            targetFile="src/services/tokenService.ts",
            unifiedDiff="""--- a/src/services/tokenService.ts
+++ b/src/services/tokenService.ts
@@ -1,8 +1,9 @@
 import jwt from 'jsonwebtoken';
 import { EventEmitter } from 'events';
-import { Logger } from '../utils/logger';
+import { Logger } from '../utils/logger';
+import { LRUCache } from 'lru-cache';

 const logger = new Logger('TokenService');
-const tokenCache = new Map<string, { result: any; timestamp: number }>();
 const emitter = new EventEmitter();
+emitter.setMaxListeners(50);

@@ -12,25 +13,32 @@
 export class TokenService {
   private secret: string;
+  private cache: LRUCache<string, { result: any; timestamp: number }>;

   constructor(secret: string) {
     this.secret = secret;
+    this.cache = new LRUCache({
+      max: 5000,
+      ttl: 1000 * 60 * 5,        // 5 minute TTL
+      updateAgeOnGet: true,
+      allowStale: false,
+    });
   }

   async verify(token: string): Promise<TokenPayload> {
-    // BUG: Map grows unboundedly - never evicts entries
-    const cached = tokenCache.get(token);
-    if (cached && Date.now() - cached.timestamp < 300000) {
+    // FIXED: Use TTL-bounded LRU cache with automatic eviction
+    const cached = this.cache.get(token);
+    if (cached) {
       return cached.result;
     }

     try {
       const decoded = jwt.verify(token, this.secret) as TokenPayload;
-      tokenCache.set(token, { result: decoded, timestamp: Date.now() });
-      emitter.emit('token-verified', token);
+      this.cache.set(token, { result: decoded, timestamp: Date.now() });
       return decoded;
     } catch (err) {
-      tokenCache.set(token, { result: null, timestamp: Date.now() });
+      logger.warn(`Token verification failed: ${(err as Error).message}`);
       throw new AuthenticationError('Invalid token');
     }
   }
+
+  getCacheStats() {
+    return { size: this.cache.size, max: this.cache.max };
+  }
 }""",
            reproductionTest="""import { TokenService } from './tokenService';

describe('TokenService Memory Management', () => {
  it('should initialize TTL cache with default 300s expiry', () => {
    const service = new TokenService('secret');
    expect(service.getCacheStats().max).toBe(5000);
  });

  it('should evict expired tokens automatically without heap exhaustion', async () => {
    // 14/14 tests passing
  });
});""",
            sandboxExecution=default_sandbox
        )

        default_incident = Incident(
            id="INC-2041",
            fingerprint="ERR_EVENTEMITTER_LEAK",
            severity="SEV-1",
            service="auth-service",
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="READY_FOR_DEPLOY",
            confidenceScore=99.4,
            astValidated=True,
            correctionLoops=1,
            rootCauseAnalysis=RootCauseAnalysis(
                summary="V8 heap exhaustion in auth-service caused by unbounded Map caching in TokenService.verify().",
                triggerMechanism="A 10x surge in authentication traffic caused 2.3M unique JWT verification tokens to be retained in memory without eviction.",
                tavilyCitations=default_citations
            ),
            patch=default_patch
        )

        self._incidents: dict[str, Incident] = {"INC-2041": default_incident}
        self._canary_statuses: dict[str, CanaryStatus] = {
            "INC-2041": CanaryStatus(
                incidentId="INC-2041",
                trafficPercent=5,
                baselineErrorRate=12.4,
                canaryErrorRate=0.01,
                baselineP99=148.0,
                canaryP99=28.0,
                status="IN_PROGRESS"
            )
        }
        
    def add_incident(self, incident: Incident):
        self._incidents[incident.id] = incident
        
    def get_incident(self, incident_id: str) -> Incident | None:
        return self._incidents.get(incident_id) or self._incidents.get("INC-2041")
        
    def get_active_incidents(self, org_id: str | None = None) -> list[Incident]:
        if not org_id:
            return list(self._incidents.values())
        return [i for i in self._incidents.values() if getattr(i, 'organization_id', 'org_acme') == org_id]
        
    def update_incident(self, incident: Incident):
        if incident.id in self._incidents:
            self._incidents[incident.id] = incident
            
    def set_canary_status(self, status: CanaryStatus):
        self._canary_statuses[status.incidentId] = status
        
    def get_canary_status(self, incident_id: str) -> CanaryStatus | None:
        return self._canary_statuses.get(incident_id)

    def get_system_health(self, org_id: str | None = None) -> SystemHealth:
        # Check incidents for this org
        target_org = org_id or "org_acme"
        org_incidents = [i for i in self._incidents.values() if getattr(i, 'organization_id', 'org_acme') == target_org]
        
        hours = [f"{h:02d}:00" for h in range(24)]

        # If org has no incidents, return 100% nominal state
        if len(org_incidents) == 0 and target_org != "org_acme":
            return SystemHealth(
                uptime=100.0,
                activeIncidents=0,
                mttr="0m 00s",
                costSaved=0.00,
                healthHistory=[100.0] * 24,
                memoryUsage=[{"timestamp": h, "value": 28 + (hash(str(i * 3)) % 8)} for i, h in enumerate(hours)],
                latencyData=[{"timestamp": h, "value": 15 + (hash(str(i * 5)) % 6)} for i, h in enumerate(hours)]
            )

        # Generate realistic 24-hour time series data for orgs with incidents
        memory_data = []
        for i, h in enumerate(hours):
            if 14 <= i <= 16:
                value = 85 + (i - 14) * 6 + (hash(str(i)) % 5)
            elif i == 17:
                value = 72  # Recovery after fix
            else:
                value = 42 + (hash(str(i * 7)) % 18)
            memory_data.append({"timestamp": h, "value": min(value, 98)})
        
        latency_data = []
        for i, h in enumerate(hours):
            if 14 <= i <= 16:
                value = 120 + (i - 14) * 80 + (hash(str(i * 3)) % 30)
            elif i == 17:
                value = 35
            else:
                value = 12 + (hash(str(i * 11)) % 13)
            latency_data.append({"timestamp": h, "value": value})
        
        health_history = []
        for i in range(24):
            if 14 <= i <= 16:
                health_history.append(round(99.2 - (i - 14) * 0.3, 2))
            else:
                health_history.append(round(99.9 + (hash(str(i * 13)) % 10) / 100, 2))

        active = len([i for i in org_incidents if i.status != 'DEPLOYED'])
        
        return SystemHealth(
            uptime=99.94,
            activeIncidents=max(active, 1) if target_org == "org_acme" else active,
            mttr="3m 42s" if target_org == "org_acme" else "0m 00s",
            costSaved=42800.00 if target_org == "org_acme" else 0.00,
            healthHistory=health_history,
            memoryUsage=memory_data,
            latencyData=latency_data
        )

incident_store = IncidentStore()
