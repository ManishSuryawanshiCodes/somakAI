# Somak AI — Database Backup, Retention & Disaster Recovery Procedure

This runbook outlines the backup posture, verification protocol, Point-in-Time Recovery (PITR), and disaster recovery restoration procedures for Somak AI's managed Supabase PostgreSQL instance.

---

## 1. Automated Managed Backups Posture

Somak AI runs on a managed Supabase PostgreSQL cluster (`db.[PROJECT-REF].supabase.co`).

### Backup Specifications
- **Frequency:** Automated daily snapshots at 00:00 UTC.
- **Retention:** 7 days (Standard / Pro tier) or 30 days (Enterprise tier).
- **WAL Archiving:** Continuous Write-Ahead Log (WAL) streaming enabled for Point-in-Time Recovery (PITR).
- **Encryption:** AES-256 at rest (AWS S3 storage backend with KMS key encryption) and TLS 1.3 in-transit.
- **Scope:** Complete database including all tenant schemas (`organizations`, `incidents`, `provider_usage`, `audit_events`).

### Verification Protocol
To verify that daily backups are executing normally:
1. Navigate to the **Supabase Dashboard** > **Project Settings** > **Database** > **Backups**.
2. Confirm the **Latest Backup Timestamp** is within the last 24 hours.
3. Check the **Backup Status** badge displays `Healthy`.

---

## 2. On-Demand Hot Backup Runbook (`pg_dump`)

Prior to major infrastructure deployments, schema alterations, or quarterly compliance audits, operators should execute an encrypted point-in-time snapshot.

### Pre-requisites
- PostgreSQL client tools (`pg_dump` version 15+)
- Connection string securely retrieved from your environment:
  `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` (or `$DATABASE_URL`)

### Execution Command (Linux / macOS / PowerShell)
```bash
# Generate a compressed, custom-format database archive using $DATABASE_URL
pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  --file="somak_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Table-Specific Ingestion Snapshot
If capturing active incidents and audit trails only:
```bash
pg_dump \
  --dbname="$DATABASE_URL" \
  --table=incidents \
  --table=audit_events \
  --table=provider_usage \
  --format=custom \
  --file="somak_incidents_audit_$(date +%Y%m%d).dump"
```

---

## 3. Disaster Recovery Restoration Procedure (`pg_restore`)

If a catastrophic database corruption, accidental tenant drop, or regional failure occurs, follow this step-by-step restoration playbook:

### Step 1: Isolate & Drain Ingress
1. Put the Somak AI ingress proxy or API into maintenance mode to prevent incoming writes.
2. In the Supabase Dashboard, terminate all active client connection pools.

### Step 2: Validate Target Instance
Verify that the target PostgreSQL database is reachable:
```bash
python -c "from app.core.database import db; print(db.check_health())"
```

### Step 3: Execute Restoration
To restore the schema and data from a `.dump` snapshot:
```bash
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  somak_backup_YYYYMMDD_HHMMSS.dump
```

### Step 4: Verify Schema & Performance Indexes
Run the automated database index and health verification script:
```bash
python tests/test_prompt_parity.py
```
Assert that:
- Tables `organizations`, `incidents`, `provider_usage`, `audit_events` exist.
- B-Tree indexes `idx_incidents_org_timestamp`, `idx_incidents_org_status`, `idx_incidents_org_severity` are valid.
- Connection pooling returns `healthy` with `<100ms` probe latency.

### Step 5: Resume Traffic
1. Re-enable the backend API instances.
2. Observe container auto-recovery logs:
   `Auto-recovery: In-flight and active incidents hydrated from Supabase PostgreSQL.`
3. Verify live `/health` probe returns HTTP 200:
   ```bash
   curl http://localhost:8000/health
   ```
4. Verify the Incident Radar UI updates cleanly.

---

## 4. Recovery Objectives (RTO / RPO)

| Dimension | Target | Mechanism |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 5 minutes** | Supabase continuous WAL stream (PITR) + memory hydration buffer |
| **Recovery Time Objective (RTO)** | **< 15 minutes** | Pre-tested `pg_restore` playbook and automated schema migration |
| **Backup Redundancy** | **Dual (3-2-1)** | Supabase Managed Cloud Storage + Operator quarterly offsite cold archive |
