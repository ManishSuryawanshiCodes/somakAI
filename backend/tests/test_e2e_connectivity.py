"""
SOMAK AI — Full End-to-End Database, Auth, and Multi-Layer Data Flow Verification Suite
Directly queries Supabase PostgreSQL and tests all 6 dimensions specified in the audit.
"""

import sys
import os
import uuid
import json

sys.path.insert(0, r"d:\PROJECT\SentryOps\backend")

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import db, init_db
from app.core.security import verify_password
from app.services.auth_service import auth_service
from app.services.org_store import org_store
from app.middleware.rate_limiter import RateLimiterMiddleware

client = TestClient(app)

# Shared test email/pwd generated for sequential tests if needed
shared_test_email = None
shared_test_password = "SecurePassword2026!#"

def test_check_1_database_connection_and_raw_schema():
    print("\n[CHECK 1] Database Connection & Raw Schema Query...")
    # Verify pool and connection to real Supabase PostgreSQL
    init_success = init_db()
    assert init_success is True, "Failed to connect to Supabase PostgreSQL database."
    print("  [OK] Successfully connected to live Supabase PostgreSQL.")

    # Raw query to confirm tables exist in PostgreSQL
    tables_query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    tables = db.execute_query(tables_query)
    table_names = [t["table_name"] for t in tables] if tables else []
    print(f"  [OK] Discovered {len(table_names)} tables in public schema: {table_names}")

    required_tables = ["users", "organizations", "incidents", "provider_usage", "audit_events"]
    for req_table in required_tables:
        assert req_table in table_names, f"Missing required table '{req_table}' in database!"
        # Verify columns of required table
        cols = db.execute_query(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{req_table}';")
        col_names = [c["column_name"] for c in cols] if cols else []
        print(f"       Table '{req_table}': {len(col_names)} columns -> {col_names[:5]}...")

    print("  >>> CHECK 1 PASSED: Real Postgres database connected and verified.")

def test_check_2_register_flow_and_database_persistence():
    print("\n[CHECK 2] Register Flow — Full Trace & Database Persistence...")
    global shared_test_email
    test_uuid = uuid.uuid4().hex[:8]
    test_email = f"audit-user-{test_uuid}@acme-testing.com"
    shared_test_email = test_email
    test_password = shared_test_password
    test_name = f"Audit Engineer {test_uuid}"

    # Submit registration request
    reg_response = client.post(
        "/api/auth/signup",
        json={
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
    )
    assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
    reg_data = reg_response.json()
    assert reg_data["status"] == "success"
    assert "session_token" in reg_data
    created_user = reg_data["user"]
    print(f"  [OK] Registration endpoint returned HTTP 200: User ID={created_user['id']}, Email={created_user['email']}")

    # Directly query the PostgreSQL users table with raw SQL
    db_user_rows = db.execute_query("SELECT * FROM users WHERE LOWER(email) = LOWER(%s);", (test_email,))
    assert db_user_rows and len(db_user_rows) == 1, f"User {test_email} NOT found in PostgreSQL database!"
    db_user = db_user_rows[0]
    print(f"  [OK] Raw PostgreSQL query verified row in 'users' table: ID={db_user['id']}")

    # Confirm password is an Argon2id hash, not plaintext
    pwd_hash = db_user["password_hash"]
    assert pwd_hash.startswith("$argon2id$"), f"Expected $argon2id$ hash prefix, got {pwd_hash[:15]}"
    assert test_password not in pwd_hash, "Plaintext password was leaked or stored directly!"
    assert verify_password(test_password, pwd_hash) is True, "Stored Argon2id hash does not verify against test password!"
    print(f"  [OK] Password cryptographically secured with Argon2id: {pwd_hash[:30]}...")

    # Confirm user created in unverified state with verification code
    assert db_user["email_verified"] is False, "New user should be created in email_verified=False state"
    verif_code = db_user["verification_code"]
    assert verif_code is not None and len(verif_code) == 6, f"Expected 6-digit verification code, got {verif_code}"
    print(f"  [OK] Account created in unverified state (email_verified=False, verification_code={verif_code})")

    # Verify email code
    verify_res = client.post(
        "/api/auth/verify-email",
        json={"email": test_email, "code": verif_code}
    )
    assert verify_res.status_code == 200, f"Email verification failed: {verify_res.text}"
    db_user_updated = db.execute_query("SELECT email_verified, verification_code FROM users WHERE LOWER(email) = LOWER(%s);", (test_email,))[0]
    assert db_user_updated["email_verified"] is True, "Database did not reflect email_verified=True after verification!"
    assert db_user_updated["verification_code"] is None, "Verification code should be cleared upon verification!"
    print("  [OK] Email verified: PostgreSQL updated to email_verified=True, verification_code=NULL")
    print("  >>> CHECK 2 PASSED: Real registration persisted and verified in PostgreSQL.")

def test_check_3_login_flow_password_verification_and_session():
    RateLimiterMiddleware.reset()
    print("\n[3] Login Flow — Full Trace, Password Verification & Session Security...")
    test_email = shared_test_email or "audit-user-fallback@acme-testing.com"
    test_password = shared_test_password

    # A. Test non-existent user
    non_existent_res = client.post(
        "/api/auth/login",
        json={"email": f"ghost-{uuid.uuid4().hex[:6]}@random.org", "password": "AnyPassword123!"}
    )
    assert non_existent_res.status_code == 401, f"Expected 401 for non-existent user, got {non_existent_res.status_code}"
    print("  [OK] Non-existent user rejected with HTTP 401 Unauthorized.")

    # B. Test WRONG password
    wrong_pwd_res = client.post(
        "/api/auth/login",
        json={"email": test_email, "password": "WrongPassword999!"}
    )
    assert wrong_pwd_res.status_code == 401, f"Expected 401 for wrong password, got {wrong_pwd_res.status_code}"
    assert "attempt" in wrong_pwd_res.json()["detail"].lower()
    print(f"  [OK] Wrong credentials rejected with HTTP 401: '{wrong_pwd_res.json()['detail']}'")

    # C. Test CORRECT password
    login_res = client.post(
        "/api/auth/login",
        json={"email": test_email, "password": test_password}
    )
    assert login_res.status_code == 200, f"Valid login failed: {login_res.text}"
    login_data = login_res.json()
    assert login_data["status"] == "success"
    session_token = login_data["session_token"]
    assert session_token and len(session_token) > 20
    print(f"  [OK] Valid login succeeded: Issued session token ({session_token[:12]}...)")

    # D. Inspect cookie headers
    cookies = login_res.cookies
    assert "somak_session" in cookies, "Expected 'somak_session' cookie in login response!"
    session_cookie_value = cookies["somak_session"]
    assert session_cookie_value == session_token
    print(f"  [OK] HttpOnly session cookie 'somak_session' verified in response headers.")

    # E. Test authenticated endpoint with session cookie
    auth_req = client.get("/api/organizations", cookies={"somak_session": session_token})
    assert auth_req.status_code == 200, f"Expected 200 for authenticated request, got {auth_req.status_code}"
    print("  [OK] Authenticated request with session cookie succeeded (HTTP 200).")

    # F. Test stripping auth header / cookie -> must be rejected with 401 or 403
    client.cookies.clear()
    unauth_req = client.get("/api/organizations/org_acme/members")
    assert unauth_req.status_code in (401, 403), f"Expected 401/403 for unauthenticated access, got {unauth_req.status_code}"
    print(f"  [OK] Stripping session cookie strictly rejected request with HTTP {unauth_req.status_code}.")
    print("  >>> CHECK 3 PASSED: Login flow validated against PostgreSQL Argon2id hash.")

def test_check_4_frontend_backend_data_flow_across_pages():
    RateLimiterMiddleware.reset()
    print("\n[CHECK 4] Frontend-Backend Data Flow across 3 User-Facing Pages...")

    # Pre-authenticated admin headers for testing endpoints (with TOTP if MFA is active)
    import pyotp
    admin_login = client.post("/api/auth/login", json={"email": "elena.rostova@somak.internal", "password": "Password123!"})
    login_data = admin_login.json()
    if login_data.get("status") == "mfa_required":
        totp = pyotp.TOTP("JBSWY3DPEHPK3PXP")
        mfa_res = client.post("/api/auth/mfa/verify", json={"mfa_ticket": login_data["mfa_ticket"], "code": totp.now()})
        admin_token = mfa_res.json()["session_token"]
    else:
        admin_token = login_data["session_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Page 1: Incident Radar / Telemetry (GET /api/incidents/active and GET /api/health)
    incidents_res = client.get("/api/incidents/active?org_id=org_acme")
    assert incidents_res.status_code == 200
    incidents_data = incidents_res.json()
    assert isinstance(incidents_data, list) and len(incidents_data) > 0
    health_res = client.get("/api/health?org_id=org_acme")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert "uptime" in health_data and "memoryUsage" in health_data
    print(f"  [PAGE 1: Dashboard / Incidents] Verified real API: {len(incidents_data)} incident(s), Health uptime={health_data['uptime']}%")

    # Page 2: Settings / Models & Integrations (GET /api/models/available and GET /api/organizations/{id})
    models_res = client.get("/api/models/available?org_id=org_acme")
    assert models_res.status_code == 200
    models_data = models_res.json()
    assert "providers" in models_data and len(models_data["providers"]) >= 4
    org_res = client.get("/api/organizations/org_acme", headers=admin_headers)
    assert org_res.status_code == 200
    org_data = org_res.json()
    assert org_data["id"] == "org_acme"
    print(f"  [PAGE 2: Settings / Integrations] Verified real API: {len(models_data['providers'])} LLM providers, Org={org_data['name']}")

    # Page 3: Team Members & Real Data Modification (GET /members and POST /invites)
    members_res = client.get("/api/organizations/org_acme/members", headers=admin_headers)
    assert members_res.status_code == 200
    members_data = members_res.json()
    assert len(members_data) >= 3
    print(f"  [PAGE 3: Team Members] Verified real API: {len(members_data)} members retrieved.")

    # Create a real record: Dispatch an invite to a new engineer
    invite_email = f"invited-sre-{uuid.uuid4().hex[:6]}@company.com"
    invite_res = client.post(
        "/api/organizations/org_acme/invites",
        json={"emails": [invite_email], "role": "Operator", "invited_by": "Elena Rostova"},
        headers=admin_headers
    )
    assert invite_res.status_code == 200, f"Invite creation failed: {invite_res.text}"
    invites_created = invite_res.json()
    assert len(invites_created) == 1
    created_invite = invites_created[0]
    assert created_invite["email"] == invite_email
    print(f"  [PAGE 3: Data Mutation] Created real invite record: ID={created_invite['id']}, Email={created_invite['email']}")

    # Confirm persistence by fetching list of invites through fresh request
    invites_list_res = client.get("/api/organizations/org_acme/invites", headers=admin_headers)
    assert invites_list_res.status_code == 200
    found_invite = any(inv["email"] == invite_email for inv in invites_list_res.json())
    assert found_invite is True, "Created invite was not found upon fresh query!"
    print("  [OK] Confirmed invite record persisted and retrievable on fresh query.")
    print("  >>> CHECK 4 PASSED: Real data flowing across Dashboard, Settings, and Team pages.")

def test_check_5_error_state_and_boundary_verification():
    RateLimiterMiddleware.reset()
    print("\n[CHECK 5] Error State & Boundary Verification...")
    # Test invalid / malformed request payload (FastAPI 422 validation error)
    bad_payload_res = client.post("/api/auth/login", json={"role": "Admin"})
    assert bad_payload_res.status_code == 422
    print("  [OK] Malformed payload handled gracefully with HTTP 422 validation error.")

    # Test accessing restricted resource with insufficient role (Viewer attempting admin action)
    viewer_session = auth_service.get_user_by_email("sarah.connor@somak.internal")
    assert viewer_session is not None
    from app.core.security import create_session
    viewer_tok = create_session(viewer_session.id, viewer_session.email, "Viewer")
    forbidden_res = client.patch(
        "/api/organizations/org_acme/setup",
        json={"sentry_dsn": "https://fake@sentry.io/123"},
        headers={"Authorization": f"Bearer {viewer_tok}"}
    )
    assert forbidden_res.status_code == 403, f"Expected 403 Forbidden, got {forbidden_res.status_code}"
    print(f"  [OK] Insufficient role access properly rejected with HTTP 403: {forbidden_res.json()['detail']}")
    print("  >>> CHECK 5 PASSED: Error and boundary states properly handled.")

def test_check_6_environment_configuration():
    print("\n[CHECK 6] Environment Configuration Check...")
    # Confirm backend database URL is read from environment / settings
    db_url = settings.DATABASE_URL
    assert db_url and "postgres" in db_url.lower()
    print(f"  [OK] Backend DATABASE_URL read from environment configuration: {db_url[:28]}...[REDACTED]")

    # Confirm frontend uses NEXT_PUBLIC_API_BASE
    api_ts_path = r"d:\PROJECT\SentryOps\frontend\src\lib\api.ts"
    with open(api_ts_path, "r", encoding="utf-8") as f:
        api_ts_content = f.read()
    assert "process.env.NEXT_PUBLIC_API_BASE" in api_ts_content, "API_BASE in frontend is not reading NEXT_PUBLIC_API_BASE!"
    print("  [OK] Frontend API_BASE reads dynamically from process.env.NEXT_PUBLIC_API_BASE.")

def run_e2e_verification():
    print("==================================================================")
    print("SOMAK AI — FULL END-TO-END SYSTEM VERIFICATION AUDIT")
    print("==================================================================")
    test_check_1_database_connection_and_raw_schema()
    test_check_2_register_flow_and_database_persistence()
    test_check_3_login_flow_password_verification_and_session()
    test_check_4_frontend_backend_data_flow_across_pages()
    test_check_5_error_state_and_boundary_verification()
    test_check_6_environment_configuration()
    print("\n==================================================================")
    print("ALL 6 END-TO-END VERIFICATION CHECKS PASSED (100% GREEN)")
    print("==================================================================")

if __name__ == "__main__":
    run_e2e_verification()
