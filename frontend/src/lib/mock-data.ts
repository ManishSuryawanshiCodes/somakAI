import { Incident, SystemHealth, CanaryStatus } from './types';

export const mockIncident: Incident = {
  id: 'INC-2041',
  fingerprint: 'MEM_LEAK_AUTH_TOKEN_SVC',
  severity: 'SEV-1',
  service: 'auth-service',
  timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
  status: 'READY_FOR_DEPLOY',
  rootCauseAnalysis: {
    summary: 'V8 heap exhaustion in auth-service caused by unbounded Map<string, any> in TokenService.verify(). Each unique JWT token creates a cache entry that is never evicted, leading to OOM crash under sustained load (~50k req/min). The tokenCache Map grew to 2.3M entries consuming 1.8GB of heap memory before the container was killed by the OOM killer.',
    triggerMechanism: 'The recent marketing campaign drove 10x traffic spike (50k req/min vs normal 5k). The TokenService cached every unique JWT verification result in an unbounded Map. Without TTL or size limits, memory grew linearly with unique tokens until V8 heap limit (2GB) was exceeded.',
    tavilyCitations: [
      {
        title: 'Node.js Memory Leaks: EventEmitters and Caching Patterns',
        url: 'https://nodejs.org/en/docs/guides/diagnostics/memory/event-emitters',
        snippet: 'A common source of memory leaks in Node.js applications is unmanaged event listeners and unbounded cache objects storing large payload data. Always set maxListeners and implement cache eviction policies.'
      },
      {
        title: 'Best practices for implementing LRU cache in TypeScript',
        url: 'https://blog.logrocket.com/implementing-lru-cache-typescript/',
        snippet: 'When dealing with high-throughput services, unbounded Maps can quickly consume the V8 heap. Implement a size-limited LRU or TTL cache to prevent OOM errors. The lru-cache package provides a battle-tested solution.'
      },
      {
        title: 'Debugging V8 Out Of Memory Exceptions in Auth Services',
        url: 'https://engineering.auth0.com/debugging-oom-nodejs',
        snippet: 'In auth services, JWT token validation results in many intermediate objects. If you cache token verification results, ensure the cache has a strict upper bound. We recommend max 5000-10000 entries with 5-minute TTL.'
      }
    ]
  },
  patch: {
    targetFile: 'src/services/tokenService.ts',
    unifiedDiff: `--- a/src/services/tokenService.ts
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
+      logger.warn(\`Token verification failed: \${(err as Error).message}\`);
       throw new AuthenticationError('Invalid token');
     }
   }
+
+  getCacheStats() {
+    return { size: this.cache.size, max: this.cache.max };
+  }
 }`,
    reproductionTest: `import { TokenService } from '../tokenService';
import jwt from 'jsonwebtoken';

describe('TokenService Memory Management', () => {
  const SECRET = 'test-secret-key-256bit';
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService(SECRET);
  });

  it('should initialize LRU cache with default 5000 max entries', () => {
    const stats = service.getCacheStats();
    expect(stats.max).toBe(5000);
  });

  it('should evict expired tokens automatically after TTL', async () => {
    const token = jwt.sign({ userId: '1' }, SECRET, { expiresIn: '1h' });
    await service.verify(token);
    expect(service.getCacheStats().size).toBe(1);
  });

  it('should not exceed MAX_CACHE_SIZE entries under load', async () => {
    for (let i = 0; i < 10000; i++) {
      const token = jwt.sign({ userId: String(i) }, SECRET);
      await service.verify(token);
    }
    expect(service.getCacheStats().size).toBeLessThanOrEqual(5000);
  });

  it('should cache valid tokens for faster lookups', async () => {
    const token = jwt.sign({ userId: 'perf' }, SECRET);
    await service.verify(token);
    const start = Date.now();
    await service.verify(token);
    expect(Date.now() - start).toBeLessThan(5);
  });

  it('should handle concurrent verification without leak', async () => {
    const tokens = Array.from({ length: 100 }, (_, i) =>
      jwt.sign({ userId: String(i) }, SECRET)
    );
    await Promise.all(tokens.map(t => service.verify(t)));
    expect(service.getCacheStats().size).toBe(100);
  });

  it('should throw AuthenticationError for invalid tokens', async () => {
    await expect(service.verify('invalid')).rejects.toThrow();
  });

  it('should not cache failed verification results', async () => {
    try { await service.verify('bad'); } catch {}
    expect(service.getCacheStats().size).toBe(0);
  });
});`,
    sandboxExecution: {
      sandboxId: 'nbx-sandbox-8841',
      exitCode: 0,
      stdout: 'PASS src/services/__tests__/tokenService.spec.ts\nTest Suites: 1 passed, 1 total\nTests: 14 passed, 14 total\nTime: 4.218s',
      testsPassed: 14,
      totalTests: 14
    }
  }
};

export const mockIncident2: Incident = {
  id: 'INC-2042',
  fingerprint: 'HIGH_LATENCY_PAYMENT_SVC',
  severity: 'SEV-2',
  service: 'payment-service',
  timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  status: 'INVESTIGATING',
  rootCauseAnalysis: {
    summary: 'Elevated P99 latency in payment processing pipeline due to connection pool exhaustion on PostgreSQL read replicas.',
    triggerMechanism: 'Increased checkout volume saturated the default 10-connection pool, causing queuing and timeouts.',
    tavilyCitations: []
  },
  patch: null
};

// Generate realistic 24h time series with spike at 14:00-16:00
function generateMemoryData(): { timestamp: string; value: number }[] {
  return Array.from({ length: 24 }, (_, i) => {
    let value: number;
    if (i >= 14 && i <= 16) {
      value = 85 + (i - 14) * 6 + Math.random() * 3;
    } else if (i === 17) {
      value = 55; // Recovery
    } else {
      value = 38 + Math.random() * 18;
    }
    return { timestamp: `${String(i).padStart(2, '0')}:00`, value: Math.round(value * 10) / 10 };
  });
}

function generateLatencyData(): { timestamp: string; value: number }[] {
  return Array.from({ length: 24 }, (_, i) => {
    let value: number;
    if (i >= 14 && i <= 16) {
      value = 120 + (i - 14) * 80 + Math.random() * 30;
    } else if (i === 17) {
      value = 28;
    } else {
      value = 12 + Math.random() * 13;
    }
    return { timestamp: `${String(i).padStart(2, '0')}:00`, value: Math.round(value * 10) / 10 };
  });
}

function generateHealthHistory(): number[] {
  return Array.from({ length: 24 }, (_, i) => {
    if (i >= 14 && i <= 16) return +(99.2 - (i - 14) * 0.3).toFixed(2);
    return +(99.9 + Math.random() * 0.09).toFixed(2);
  });
}

export const mockHealth: SystemHealth = {
  uptime: 99.94,
  activeIncidents: 1,
  mttr: '3m 42s',
  costSaved: 42800,
  healthHistory: generateHealthHistory(),
  memoryUsage: generateMemoryData(),
  latencyData: generateLatencyData()
};

export const mockCanary: CanaryStatus = {
  incidentId: 'INC-2041',
  trafficPercent: 5,
  baselineErrorRate: 12.4,
  canaryErrorRate: 0.02,
  baselineP99: 148,
  canaryP99: 28,
  status: 'IN_PROGRESS'
};

export const mockTerminalLines = [
  '$ docker pull nbx-registry/sandbox-runner:latest',
  'latest: Pulling from nbx-registry/sandbox-runner',
  'Digest: sha256:a3b8f2e4c9d1...  Status: Image is up to date',
  '',
  '[+] Building sandbox environment...',
  '[+] Copying workspace files...',
  '[+] Installing dependencies...',
  '$ npm install --production=false',
  'added 847 packages in 6.2s',
  '',
  '[+] Applying patch to src/services/tokenService.ts',
  '[+] Running reproduction test suite...',
  '',
  ' PASS  src/services/__tests__/tokenService.spec.ts',
  '  TokenService Memory Management',
  '    ✓ should initialize LRU cache with default 5000 max entries (3ms)',
  '    ✓ should evict expired tokens automatically after TTL (1502ms)',
  '    ✓ should not exceed MAX_CACHE_SIZE entries under load (89ms)',
  '    ✓ should cache valid tokens for faster lookups (1ms)',
  '    ✓ should handle concurrent verification without leak (12ms)',
  '    ✓ should throw AuthenticationError for invalid tokens (2ms)',
  '    ✓ should not cache failed verification results (1ms)',
  '    ✓ should update access time on cache hit (3ms)',
  '    ✓ should handle token expiry gracefully (1501ms)',
  '    ✓ should return correct payload structure (2ms)',
  '    ✓ should handle malformed JWT tokens (1ms)',
  '    ✓ should respect maxListeners on EventEmitter (1ms)',
  '    ✓ should clean up resources on service shutdown (3ms)',
  '    ✓ should log warning on verification failure (1ms)',
  '',
  'Test Suites:  1 passed, 1 total',
  'Tests:        14 passed, 14 total',
  'Snapshots:    0 total',
  'Time:         4.218s',
  '',
  '✓ All assertions passed',
  '✓ Memory usage within bounds (peak: 128MB < 256MB limit)',
  '✓ Sandbox execution completed with exit code 0'
];

export const mockCanaryTimeSeries = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 5}m`,
  baselineError: +(12.4 + (Math.random() - 0.5) * 2).toFixed(1),
  canaryError: +Math.max(0, 12.4 - i * 1.1 + (Math.random() - 0.5) * 0.5).toFixed(1),
  baselineP99: Math.round(148 + (Math.random() - 0.5) * 20),
  canaryP99: Math.round(Math.max(25, 148 - i * 11 + (Math.random() - 0.5) * 5)),
}));
