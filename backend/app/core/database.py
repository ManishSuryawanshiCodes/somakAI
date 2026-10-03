"""
SOMAK AI — Supabase PostgreSQL Database Integration & Connection Pooling
Manages threaded connection pooling, schema indexing, and transactional persistence.
"""

import json
import time
import logging
from typing import Optional, Any, List, Dict
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool, PoolError
from app.core.config import settings

logger = logging.getLogger("somak.database")

SCHEMA_DDL = """
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    team_size TEXT,
    primary_use_case TEXT,
    mfa_enforced BOOLEAN DEFAULT FALSE,
    plan TEXT DEFAULT 'business',
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    setup_checklist JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    severity TEXT NOT NULL,
    service TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence_score DOUBLE PRECISION,
    ast_validated BOOLEAN,
    correction_loops INTEGER DEFAULT 0,
    root_cause_analysis JSONB,
    patch JSONB,
    post_mortem_report TEXT,
    triage_provider TEXT DEFAULT 'nebius',
    triage_model TEXT DEFAULT 'nvidia/nemotron-3-nano-30b-a3b',
    synthesis_provider TEXT DEFAULT 'nebius',
    synthesis_model TEXT DEFAULT 'nvidia/nemotron-3-ultra-550b',
    fallback_occurred BOOLEAN DEFAULT FALSE,
    fallback_message TEXT,
    reasoning_steps JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS provider_usage (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    stage TEXT NOT NULL,
    billing_type TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_estimate DOUBLE PRECISION DEFAULT 0.0,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    org_id TEXT NOT NULL,
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    target TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    previous_hash TEXT NOT NULL,
    tamper_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Operator',
    team TEXT NOT NULL DEFAULT 'Reliability Engineering',
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    verification_code TEXT,
    failed_attempts INTEGER DEFAULT 0,
    locked_until DOUBLE PRECISION DEFAULT 0.0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    subject TEXT DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);


-- =============================================================
-- Supabase Row Level Security (RLS) Policies
-- =============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Drop existing to allow re-creation safely
DROP POLICY IF EXISTS tenant_isolation_organizations ON organizations;
DROP POLICY IF EXISTS tenant_isolation_incidents ON incidents;
DROP POLICY IF EXISTS tenant_isolation_provider_usage ON provider_usage;
DROP POLICY IF EXISTS tenant_isolation_audit_events ON audit_events;

-- Organizations: Only accessible if auth.jwt() claims org_id matches OR if backend service role
CREATE POLICY tenant_isolation_organizations ON organizations 
    FOR ALL USING (
        id = current_setting('request.jwt.claims', true)::jsonb->>'org_id'
        OR current_user = 'service_role'
    );

CREATE POLICY tenant_isolation_incidents ON incidents 
    FOR ALL USING (
        organization_id = current_setting('request.jwt.claims', true)::jsonb->>'org_id'
        OR current_user = 'service_role'
    );

CREATE POLICY tenant_isolation_provider_usage ON provider_usage 
    FOR ALL USING (
        org_id = current_setting('request.jwt.claims', true)::jsonb->>'org_id'
        OR current_user = 'service_role'
    );

CREATE POLICY tenant_isolation_audit_events ON audit_events 
    FOR ALL USING (
        org_id = current_setting('request.jwt.claims', true)::jsonb->>'org_id'
        OR current_user = 'service_role'
    );


-- =============================================================
-- Production Performance & Multi-Tenant Partitioning Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_incidents_org_timestamp ON incidents (organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON incidents (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_severity ON incidents (organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_provider_usage_org ON provider_usage (org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_provider_usage_provider ON provider_usage (provider, model);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON audit_events (org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions (created_at DESC);

-- =============================================================
-- Database-Enforced Append-Only Audit Trail (Zero Update/Delete)
-- =============================================================
CREATE OR REPLACE FUNCTION reject_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail is strictly append-only. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_events_immutable ON audit_events;
CREATE TRIGGER trg_audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
"""

class Database:
    def __init__(self):
        self._connected = False
        self._conn_str = settings.DATABASE_URL
        self._pool: Optional[ThreadedConnectionPool] = None
        self._min_conn = 4
        self._max_conn = 30

    def _init_pool(self) -> bool:
        if self._pool is not None:
            return True
        try:
            self._pool = ThreadedConnectionPool(
                minconn=self._min_conn,
                maxconn=self._max_conn,
                dsn=self._conn_str,
                connect_timeout=5
            )
            logger.info(f"Initialized PostgreSQL ThreadedConnectionPool ({self._min_conn}-{self._max_conn} connections).")
            return True
        except Exception as e:
            logger.warning(f"Failed to initialize PostgreSQL connection pool: {e}. Falling back to on-demand connections.")
            self._pool = None
            return False

    def get_connection(self):
        """Retrieves a connection from the pool, or creates one on demand if pool is uninitialized."""
        if self._pool is None:
            self._init_pool()

        if self._pool is not None:
            try:
                conn = self._pool.getconn()
                if conn.closed:
                    self._pool.putconn(conn, close=True)
                    conn = psycopg2.connect(self._conn_str, connect_timeout=5)
                return conn
            except PoolError as pe:
                logger.warning(f"Connection pool exhausted ({pe}), falling back to direct connection.")
                return psycopg2.connect(self._conn_str, connect_timeout=5)
            except Exception as e:
                logger.warning(f"Error checking out pooled connection: {e}")
                pass

        try:
            return psycopg2.connect(self._conn_str, connect_timeout=5)
        except Exception as e:
            logger.warning(f"Failed to connect to Supabase PostgreSQL: {e}")
            return None

    def release_connection(self, conn, close: bool = False):
        """Returns connection to pool or closes direct connection safely."""
        if not conn:
            return
        if self._pool is not None:
            try:
                self._pool.putconn(conn, close=close)
                return
            except Exception:
                pass
        try:
            conn.close()
        except Exception:
            pass

    @contextmanager
    def connection(self):
        """Thread-safe context manager for connection acquisition and return."""
        conn = self.get_connection()
        if not conn:
            yield None
            return
        try:
            yield conn
        finally:
            self.release_connection(conn)

    def init_db(self) -> bool:
        """Initializes tables and indexes on Supabase."""
        self._init_pool()
        with self.connection() as conn:
            if not conn:
                logger.warning("Supabase connection unavailable, using in-memory store.")
                return False
            try:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(SCHEMA_DDL)
                        cur.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'business';")
                        cur.execute("ALTER TABLE incidents ALTER COLUMN confidence_score DROP DEFAULT;")
                        cur.execute("ALTER TABLE incidents ALTER COLUMN ast_validated DROP DEFAULT;")
                self._connected = True
                logger.info("Successfully connected to Supabase and verified PostgreSQL tables and indexes.")
                return True
            except Exception as e:
                logger.error(f"Error initializing Supabase schema and indexes: {e}")
                return False

    def execute_query(self, query: str, params: tuple = ()) -> Optional[List[Dict[str, Any]]]:
        """Executes a parameterized query safely through pooled connection."""
        with self.connection() as conn:
            if not conn:
                return None
            try:
                with conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(query, params)
                        if cur.description:
                            return cur.fetchall()
                return []
            except Exception as e:
                logger.error(f"Database query error: {e}")
                return None

    def check_health(self) -> Dict[str, Any]:
        """Probes database responsiveness and returns latency metrics."""
        t0 = time.time()
        res = self.execute_query("SELECT 1 AS probe;")
        latency_ms = round((time.time() - t0) * 1000, 2)
        healthy = bool(res and res[0].get("probe") == 1)
        return {
            "connected": healthy,
            "latency_ms": latency_ms if healthy else None,
            "pool_active": self._pool is not None,
            "min_pool": self._min_conn,
            "max_pool": self._max_conn,
        }

    def close(self):
        """Closes all pooled connections on shutdown."""
        if self._pool is not None:
            try:
                self._pool.closeall()
                logger.info("Closed all PostgreSQL pooled connections.")
            except Exception as e:
                logger.warning(f"Error closing connection pool: {e}")
            self._pool = None

db = Database()

def is_db_available() -> bool:
    return db.check_health().get("connected", False)

def init_db() -> bool:
    return db.init_db()
