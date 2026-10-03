import re

path = r'd:\PROJECT\SentryOps\backend\app\core\database.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

rls_ddl = """
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
"""

# Insert RLS before the first CREATE INDEX
content = content.replace("-- =============================================================\n-- Production Performance", rls_ddl + "\n\n-- =============================================================\n-- Production Performance")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
