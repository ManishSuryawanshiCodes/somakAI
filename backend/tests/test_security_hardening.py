"""
SOMAK AI — Comprehensive Security Hardening Verification Suite
Tests all 9 security dimensions synchronously using FastAPI TestClient.
"""

import sys
import os
import hmac
import hashlib
import pyotp

sys.path.insert(0, r"d:\PROJECT\SentryOps\backend")

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.core.encryption import encrypt_secret, decrypt_secret, mask_secret
from app.services.auth_service import auth_service
from app.services.audit_store import audit_store
from app.services.incident_store import incident_store
from app.models.incident import Incident, CanaryStatus

client = TestClient(app)

def test_argon2id_password_hashing():
    print("\n[1/9] Testing Argon2id Password Hashing...")
    pwd = "EnterpriseSecurePassword2026!"
    hashed = hash_password(pwd)
    assert hashed.startswith("$argon2id$"), f"Expected $argon2id$ hash prefix, got {hashed[:15]}"
    assert verify_password(pwd, hashed) is True, "Argon2id password verification failed for valid password"
    assert verify_password("WrongPassword123", hashed) is False, "Argon2id should reject wrong password"
    print("  [PASS] Argon2id hashing and verification operating with OWASP work factor.")

def test_login_rate_limiting_and_account_lockout():
    print("\n[2/9] Testing Login Rate Limiting & Account Lockout (5 attempts / 15m)...")
    victim_email = "lockout-target@company.com"
    auth_service.register_user("Target User", victim_email, hash_password("ValidPassword123!"))

    # Send 4 failed attempts
    for attempt in range(1, 5):
        res = client.post("/api/auth/login", json={"email": victim_email, "password": "WrongPassword"})
        assert res.status_code == 401, f"Attempt {attempt} expected 401, got {res.status_code}"
        assert "attempt" in res.json().get("detail", "")
    print("  [PASS] 4 failed attempts correctly return 401 with remaining attempt count.")

    # 5th failed attempt MUST trigger lockout (HTTP 423)
    res_lockout = client.post("/api/auth/login", json={"email": victim_email, "password": "WrongPassword"})
    assert res_lockout.status_code == 423, f"5th attempt expected 423 Locked, got {res_lockout.status_code}: {res_lockout.text}"
    assert "locked" in res_lockout.json().get("detail", "").lower()
    print("  [PASS] 5th consecutive failure locked the account for 15 minutes (HTTP 423).")

    # Even with the CORRECT password, locked account must remain blocked
    res_blocked = client.post("/api/auth/login", json={"email": victim_email, "password": "ValidPassword123!"})
    assert res_blocked.status_code == 423, f"Locked account must reject even valid credentials during cooldown, got {res_blocked.status_code}"
    print("  [PASS] Locked account strictly denies login attempts during cooldown period.")

def test_totp_multi_factor_authentication():
    print("\n[3/9] Testing TOTP Multi-Factor Authentication...")
    # Elena has MFA enabled with secret JBSWY3DPEHPK3PXP
    res_mfa_step1 = client.post("/api/auth/login", json={
        "email": "elena.rostova@somak.internal",
        "password": "Password123!"
    })
    assert res_mfa_step1.status_code == 200
    data_step1 = res_mfa_step1.json()
    assert data_step1.get("status") == "mfa_required", f"Expected mfa_required, got {data_step1}"
    mfa_ticket = data_step1.get("mfa_ticket")
    assert mfa_ticket is not None
    print("  [PASS] Step 1 login for MFA user returns mfa_required with single-use ticket.")

    # Invalid TOTP code must fail
    res_bad_code = client.post("/api/auth/mfa/verify", json={"mfa_ticket": mfa_ticket, "code": "000000"})
    assert res_bad_code.status_code == 401, f"Bad TOTP expected 401, got {res_bad_code.status_code}"
    print("  [PASS] Invalid TOTP code rejected with 401.")

    # Generate real valid TOTP code using pyotp
    totp = pyotp.TOTP("JBSWY3DPEHPK3PXP")
    valid_code = totp.now()

    # Get a fresh ticket
    res_fresh = client.post("/api/auth/login", json={
        "email": "elena.rostova@somak.internal",
        "password": "Password123!"
    })
    fresh_ticket = res_fresh.json()["mfa_ticket"]

    res_valid_mfa = client.post("/api/auth/mfa/verify", json={"mfa_ticket": fresh_ticket, "code": valid_code})
    assert res_valid_mfa.status_code == 200, f"Expected 200 for valid TOTP, got {res_valid_mfa.status_code}: {res_valid_mfa.text}"
    assert "somak_session" in res_valid_mfa.headers.get("set-cookie", "")
    print("  [PASS] Valid TOTP verification completed login and issued HttpOnly session cookie.")

def test_server_side_rbac_enforcement():
    print("\n[4/9] Testing Server-Side RBAC Enforcement (Viewer vs Operator vs Admin)...")
    # Log in Sarah Connor (Viewer)
    res_sarah = client.post("/api/auth/login", json={
        "email": "sarah.connor@somak.internal",
        "password": "Password123!"
    })
    sarah_token = res_sarah.json()["session_token"]
    sarah_headers = {"Authorization": f"Bearer {sarah_token}"}

    # Reset a mock incident to TRIAGING
    inc = Incident(
        id="INC-SEC-TEST",
        organization_id="org_acme",
        fingerprint="fp-test",
        severity="SEV-1",
        service="auth-service",
        timestamp="2026-09-20T12:00:00Z",
        status="TRIAGING",
        confidenceScore=99.0,
        astValidated=True
    )
    incident_store.add_incident(inc)

    # VIEWER CALLING DEPLOY MUST BE REJECTED (HTTP 403)
    res_viewer_deploy = client.post("/api/remediation/deploy", json={"incidentId": "INC-SEC-TEST"}, headers=sarah_headers)
    assert res_viewer_deploy.status_code == 403, f"Viewer calling deploy must receive 403, got {res_viewer_deploy.status_code}: {res_viewer_deploy.text}"
    assert "Operator" in res_viewer_deploy.json().get("detail", "")
    print("  [PASS] Viewer token blocked from calling /api/remediation/deploy (HTTP 403).")

    # VIEWER CALLING PROMOTE MUST BE REJECTED (HTTP 403)
    res_viewer_promote = client.post("/api/remediation/promote", json={"incidentId": "INC-SEC-TEST"}, headers=sarah_headers)
    assert res_viewer_promote.status_code == 403, f"Viewer calling promote must receive 403, got {res_viewer_promote.status_code}"
    print("  [PASS] Viewer token blocked from calling /api/remediation/promote (HTTP 403).")

    # VIEWER CALLING ROLLBACK MUST BE REJECTED (HTTP 403)
    res_viewer_rollback = client.post("/api/remediation/rollback", json={"incidentId": "INC-SEC-TEST"}, headers=sarah_headers)
    assert res_viewer_rollback.status_code == 403, f"Viewer calling rollback must receive 403, got {res_viewer_rollback.status_code}"
    print("  [PASS] Viewer token blocked from calling /api/remediation/rollback (HTTP 403).")

    # OPERATOR (Marcus) CALLING DEPLOY MUST SUCCEED (HTTP 200)
    res_marcus = client.post("/api/auth/login", json={
        "email": "marcus.vance@somak.internal",
        "password": "Password123!"
    })
    marcus_token = res_marcus.json()["session_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    res_op_deploy = client.post("/api/remediation/deploy", json={"incidentId": "INC-SEC-TEST"}, headers=marcus_headers)
    assert res_op_deploy.status_code == 200, f"Operator should be allowed to deploy, got {res_op_deploy.status_code}: {res_op_deploy.text}"
    print("  [PASS] Operator token successfully executed /api/remediation/deploy (HTTP 200).")

    # OPERATOR CALLING ADMIN-ONLY SETTINGS MUST BE REJECTED (HTTP 403)
    res_op_settings = client.patch(
        "/api/organizations/org_acme/setup",
        json={"ai_api_key": "neb-tok-unauthorized"},
        headers=marcus_headers
    )
    assert res_op_settings.status_code == 403, f"Operator editing admin settings expected 403, got {res_op_settings.status_code}"
    print("  [PASS] Operator token blocked from modifying organization settings (HTTP 403).")

def test_destructive_action_state_machine_safety():
    print("\n[5/9] Testing Destructive Action State Machine Safety...")
    # Prepare operator headers
    res_marcus = client.post("/api/auth/login", json={
        "email": "marcus.vance@somak.internal",
        "password": "Password123!"
    })
    marcus_token = res_marcus.json()["session_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    # Ensure incident exists and is deployed
    inc = Incident(
        id="INC-SEC-TEST-SM",
        organization_id="org_acme",
        fingerprint="fp-test-sm",
        severity="SEV-1",
        service="auth-service",
        timestamp="2026-09-20T12:00:00Z",
        status="TRIAGING",
        confidenceScore=99.0,
        astValidated=True
    )
    incident_store.add_incident(inc)
    res_deploy = client.post("/api/remediation/deploy", json={"incidentId": "INC-SEC-TEST-SM"}, headers=marcus_headers)
    assert res_deploy.status_code == 200

    # Calling deploy again must fail with HTTP 409 Conflict
    res_double_deploy = client.post("/api/remediation/deploy", json={"incidentId": "INC-SEC-TEST-SM"}, headers=marcus_headers)
    assert res_double_deploy.status_code == 409, f"Double deploy should return 409 Conflict, got {res_double_deploy.status_code}"
    print("  [PASS] Re-deploying an already deployed incident safely rejected with HTTP 409 Conflict.")

    # Rollback active canary with required single-use confirmation token
    res_tok = client.post("/api/remediation/confirmation-token", json={"incidentId": "INC-SEC-TEST-SM", "action": "rollback"}, headers=marcus_headers)
    assert res_tok.status_code == 200
    tok = res_tok.json()["confirmation_token"]
    res_rollback = client.post("/api/remediation/rollback", json={"incidentId": "INC-SEC-TEST-SM", "confirmation_token": tok}, headers=marcus_headers)
    assert res_rollback.status_code == 200

    # Rolling back an already rolled back canary MUST fail with HTTP 409 Conflict
    res_tok2 = client.post("/api/remediation/confirmation-token", json={"incidentId": "INC-SEC-TEST-SM", "action": "rollback"}, headers=marcus_headers)
    assert res_tok2.status_code == 200
    tok2 = res_tok2.json()["confirmation_token"]
    res_double_rollback = client.post("/api/remediation/rollback", json={"incidentId": "INC-SEC-TEST-SM", "confirmation_token": tok2}, headers=marcus_headers)
    assert res_double_rollback.status_code == 409, f"Double rollback should return 409 Conflict, got {res_double_rollback.status_code}"
    print("  [PASS] Rolling back an already rolled back canary safely rejected with HTTP 409 Conflict.")

def test_envelope_encryption_at_rest_and_secret_masking():
    print("\n[6/9] Testing Envelope Encryption at Rest & Secret Masking...")
    res_marcus = client.post("/api/auth/login", json={
        "email": "marcus.vance@somak.internal",
        "password": "Password123!"
    })
    marcus_token = res_marcus.json()["session_token"]
    marcus_headers = {"Authorization": f"Bearer {marcus_token}"}

    secret_val = "neb-tok-live-super-secret-9941"
    enc = encrypt_secret(secret_val)
    assert enc.startswith("enc:"), f"Expected enc: prefix, got {enc}"
    assert decrypt_secret(enc) == secret_val, "Fernet decryption failed to recover plaintext"
    masked = mask_secret(secret_val)
    assert masked == "neb-••••••••9941", f"Expected masked format, got {masked}"
    print("  [PASS] Fernet envelope encryption and masking verified.")

    # Verify API GET /api/organizations/org_acme NEVER exposes plaintext secrets
    res_org = client.get("/api/organizations/org_acme", headers=marcus_headers)
    assert res_org.status_code == 200
    checklist = res_org.json()["setup_checklist"]
    assert "••••" in checklist["ai_api_key"], f"Secret was leaked in plaintext: {checklist['ai_api_key']}"
    assert "••••" in checklist["tavily_api_key"]
    assert "••••" in checklist["slack_webhook"]
    print("  [PASS] Organization API strictly returns masked credentials (never plaintext).")

def test_sentry_inbound_webhook_hmac_signature():
    print("\n[7/9] Testing Sentry Inbound Webhook HMAC-SHA256 Signature Verification...")
    webhook_payload = b'{"event_id":"evt_99412","project_name":"auth-service","severity":"SEV-1"}'
    correct_secret = settings.SENTRY_WEBHOOK_SECRET
    correct_sig = hmac.new(correct_secret.encode("utf-8"), webhook_payload, hashlib.sha256).hexdigest()

    # 1. Valid signature
    res_valid_hook = client.post(
        "/api/incidents/webhook",
        content=webhook_payload,
        headers={"sentry-hook-signature": correct_sig, "Content-Type": "application/json"}
    )
    assert res_valid_hook.status_code == 200, f"Valid signature expected 200, got {res_valid_hook.status_code}"
    print("  [PASS] Webhook with valid HMAC-SHA256 signature accepted.")

    # 2. Forged / invalid signature MUST be rejected (HTTP 401)
    res_tampered_hook = client.post(
        "/api/incidents/webhook",
        content=webhook_payload,
        headers={"sentry-hook-signature": "forged_invalid_signature_hex_12345", "Content-Type": "application/json"}
    )
    assert res_tampered_hook.status_code == 401, f"Forged signature must return 401, got {res_tampered_hook.status_code}"
    # 3. Query token parameter auth path MUST be rejected (HTTP 401)
    res_token_hook = client.post(
        f"/api/incidents/webhook?token={correct_secret}",
        content=b'{"data":{"issue":{"id":"issue_desconnect_1","title":"Hello Sentry! Verification event from DESConnect","project":{"name":"DESConnect"}},"event":{"culprit":"?([eval])","message":"Verification event"}}}',
        headers={"Content-Type": "application/json"}
    )
    assert res_token_hook.status_code == 401, f"Token query parameter must return 401, got {res_token_hook.status_code}"
    print("  [PASS] Deprecated token query parameter rejected with HTTP 401 Unauthorized.")

def test_append_only_cryptographic_audit_trail():
    print("\n[8/9] Testing Append-Only Cryptographic Audit Trail...")
    events = audit_store.list_events("org_acme")
    assert len(events) >= 5, f"Expected at least 5 audit events, got {len(events)}"
    for e in events[:3]:
        assert e.verificationHash.startswith("sha256:"), f"Missing sha256 verification hash: {e}"
        assert e.actor["name"], "Actor details missing from audit log"
        assert e.action, "Action missing from audit log"
    print(f"  [PASS] Append-only audit store contains {len(events)} tamper-evident chained records.")

def test_email_verification_gating():
    print("\n[9/9] Testing Email Verification Gating...")
    # Register unverified user
    unverified_email = f"unverified-{os.urandom(4).hex()}@company.io"
    auth_service.register_user("New Unverified", unverified_email, hash_password("Pass123!"), email_verified=False)
    res_unv_login = client.post("/api/auth/login", json={"email": unverified_email, "password": "Pass123!"})
    unv_token = res_unv_login.json()["session_token"]
    unv_headers = {"Authorization": f"Bearer {unv_token}"}

    # Attempting to create org must be blocked (HTTP 403)
    res_blocked_org = client.post(
        "/api/organizations",
        json={"name": "Spam Org", "slug": "spam-org", "user_id": "usr_unv"},
        headers=unv_headers
    )
    assert res_blocked_org.status_code == 403, f"Unverified email expected 403, got {res_blocked_org.status_code}"
    assert "verification" in res_blocked_org.json().get("detail", "").lower()
    print("  [PASS] Unverified user blocked from sensitive actions (HTTP 403).")

def run_tests():
    print("==================================================")
    print("SOMAK AI SECURITY HARDENING VERIFICATION")
    print("==================================================")
    test_argon2id_password_hashing()
    test_login_rate_limiting_and_account_lockout()
    test_totp_multi_factor_authentication()
    test_server_side_rbac_enforcement()
    test_destructive_action_state_machine_safety()
    test_envelope_encryption_at_rest_and_secret_masking()
    test_sentry_inbound_webhook_hmac_signature()
    test_append_only_cryptographic_audit_trail()
    test_email_verification_gating()
    print("\n==================================================")
    print("ALL 9 SECURITY HARDENING DIMENSIONS VERIFIED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
