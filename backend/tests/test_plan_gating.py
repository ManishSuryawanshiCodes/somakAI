"""
SOMAK AI — Plan-Gated Features & Server-Side Enforcement Tests
Tests plan restrictions across Free, Team, Business, and Enterprise tiers.
"""

import sys
import os

sys.path.insert(0, r"d:\PROJECT\SentryOps\backend")

from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import auth_service
from app.services.org_store import org_store
from app.services.incident_store import incident_store
from app.core.security import create_session
from app.core.database import init_db
from app.models.incident import Incident
from app.models.organization import Organization, SetupChecklist, CreateOrgRequest

def run_tests():
    init_db()
    client = TestClient(app)

    print("==================================================")
    print("SOMAK AI PLAN GATING & MINIMALISM AUDIT TESTS")
    print("==================================================")

    import uuid
    # Setup test orgs with unique slugs: one free, one team, one business, one enterprise with usr_elena as Admin
    uid = uuid.uuid4().hex[:6]
    free_org = org_store.create_org(CreateOrgRequest(name="Free Tier Org", slug=f"free-{uid}", plan="free", user_id="usr_elena", user_name="Elena Rostova", user_email="elena.rostova@somak.internal"))
    team_org = org_store.create_org(CreateOrgRequest(name="Team Tier Org", slug=f"team-{uid}", plan="team", user_id="usr_elena", user_name="Elena Rostova", user_email="elena.rostova@somak.internal"))
    biz_org = org_store.create_org(CreateOrgRequest(name="Business Tier Org", slug=f"biz-{uid}", plan="business", user_id="usr_elena", user_name="Elena Rostova", user_email="elena.rostova@somak.internal"))
    ent_org = org_store.create_org(CreateOrgRequest(name="Enterprise Tier Org", slug=f"ent-{uid}", plan="enterprise", user_id="usr_elena", user_name="Elena Rostova", user_email="elena.rostova@somak.internal"))

    # Setup admin auth header
    admin_token = create_session(user_id="usr_elena", email="elena.rostova@somak.internal", role="Admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # ----------------------------------------------------
    # 1. BYOK Provider Gating
    # ----------------------------------------------------
    print("\n[1/6] Testing BYOK Provider Restrictions...")
    # Free tier should reject custom BYOK API keys
    res_free = client.patch(
        f"/api/organizations/{free_org.id}/setup",
        json={"claude_key": "sk-ant-test-key", "anthropic_api_key": "sk-ant-test-key"},
        headers=admin_headers
    )
    assert res_free.status_code == 403, f"Expected 403 for Free tier BYOK, got {res_free.status_code}: {res_free.text}"
    assert "business" in res_free.json()["detail"].lower()
    print("  [PASS] Free tier correctly rejected BYOK key setup with HTTP 403.")

    # Team tier allows at most 1 BYOK key
    res_team_1 = client.patch(
        f"/api/organizations/{team_org.id}/setup",
        json={"anthropic_api_key": "sk-ant-test-key"},
        headers=admin_headers
    )
    assert res_team_1.status_code == 200, f"Expected 200 for Team tier 1 BYOK, got {res_team_1.status_code}: {res_team_1.text}"

    res_team_2 = client.patch(
        f"/api/organizations/{team_org.id}/setup",
        json={"anthropic_api_key": "sk-ant-test-key", "openai_api_key": "sk-proj-test-key"},
        headers=admin_headers
    )
    assert res_team_2.status_code == 403, f"Expected 403 for Team tier 2 BYOK, got {res_team_2.status_code}: {res_team_2.text}"
    print("  [PASS] Team tier allows 1 BYOK key and rejects 2+ with HTTP 403.")

    # ----------------------------------------------------
    # 2. Secret Rotation Gating
    # ----------------------------------------------------
    print("\n[2/6] Testing Secret Rotation BYOK Gating...")
    res_rot = client.post(
        f"/api/organizations/{free_org.id}/secrets/rotate",
        json={"secret_type": "anthropic_api_key", "new_value": "sk-ant-rot-key"},
        headers=admin_headers
    )
    assert res_rot.status_code == 403, f"Expected 403 for Free tier secret rotation, got {res_rot.status_code}"
    print("  [PASS] Secret rotation blocked BYOK rotation for Free tier with HTTP 403.")

    # ----------------------------------------------------
    # 3. Custom Sandbox Limits Gating
    # ----------------------------------------------------
    print("\n[3/6] Testing Custom Sandbox Isolation Limits...")
    # Business tier attempting 8 sandboxes (> 4 requires Enterprise)
    res_sb_biz = client.patch(
        f"/api/organizations/{biz_org.id}/setup",
        json={"sandbox_concurrency": 8},
        headers=admin_headers
    )
    assert res_sb_biz.status_code == 403, f"Expected 403 for Business tier concurrency > 4, got {res_sb_biz.status_code}"
    assert "enterprise" in res_sb_biz.json()["detail"].lower()

    # Enterprise tier setting 8 sandboxes and 30s timeout succeeds
    res_sb_ent = client.patch(
        f"/api/organizations/{ent_org.id}/setup",
        json={"sandbox_concurrency": 8, "sandbox_timeout": 30},
        headers=admin_headers
    )
    assert res_sb_ent.status_code == 200, f"Expected 200 for Enterprise tier custom sandbox limits, got {res_sb_ent.status_code}"
    print("  [PASS] Custom sandbox limits properly gated to Enterprise tier.")

    # ----------------------------------------------------
    # 4. Audit Log Access Gating
    # ----------------------------------------------------
    print("\n[4/6] Testing Audit Log Access Gating...")
    # Free tier request for audit logs
    res_audit_free = client.get(
        f"/api/audit/events?org_id={free_org.id}",
        headers=admin_headers
    )
    assert res_audit_free.status_code == 403, f"Expected 403 for Free tier audit logs, got {res_audit_free.status_code}"

    # Business tier request for audit logs
    res_audit_biz = client.get(
        f"/api/audit/events?org_id={biz_org.id}",
        headers=admin_headers
    )
    assert res_audit_biz.status_code == 200, f"Expected 200 for Business tier audit logs, got {res_audit_biz.status_code}"
    print("  [PASS] Audit logs return HTTP 403 for Free tier and HTTP 200 for Business tier.")

    # ----------------------------------------------------
    # 5. Incident Volume Limit Gating (Free tier <= 5 incidents)
    # ----------------------------------------------------
    print("\n[5/6] Testing Free Tier Incident Simulation Limit...")
    # Populate free_org with 5 mock incidents
    for i in range(5):
        incident_store.add_incident(Incident(
            id=f"INC-TEST-FREE-{i}",
            organization_id=free_org.id,
            fingerprint=f"FINGERPRINT-FREE-{i}",
            severity="SEV-1",
            service="payment-service",
            timestamp="2026-09-24T14:00:00Z",
            status="DEPLOYED",
            confidenceScore=99.0,
            astValidated=True,
            correctionLoops=0,
            triage_provider="nebius",
            triage_model="nvidia/nemotron-3-nano-30b-a3b",
            synthesis_provider="nebius",
            synthesis_model="nvidia/nemotron-3-ultra-550b",
            fallback_occurred=False,
            reasoning_steps=[]
        ))

    # 6th incident simulation should be blocked with 429
    res_sim = client.post(
        "/api/incidents/simulate",
        json={"organization_id": free_org.id},
        headers=admin_headers
    )
    assert res_sim.status_code == 429, f"Expected 429 for Free tier quota exceeded, got {res_sim.status_code}"
    assert "upgrade" in res_sim.json()["detail"].lower()
    print("  [PASS] Free tier simulation blocked at 5 incidents with HTTP 429 Quota Exceeded.")

    # ----------------------------------------------------
    # 6. Admin Plan Upgrade API
    # ----------------------------------------------------
    print("\n[6/6] Testing Plan Upgrade via Admin API...")
    res_upgrade = client.patch(
        f"/api/organizations/{free_org.id}/plan",
        json={"plan": "business"},
        headers=admin_headers
    )
    assert res_upgrade.status_code == 200, f"Expected 200 for plan upgrade, got {res_upgrade.status_code}"
    assert res_upgrade.json()["plan"] == "business"

    # Now that free_org is business, secret rotation should succeed
    res_rot_upgraded = client.post(
        f"/api/organizations/{free_org.id}/secrets/rotate",
        json={"secret_type": "anthropic_api_key", "new_value": "sk-ant-rot-success"},
        headers=admin_headers
    )
    assert res_rot_upgraded.status_code == 200, f"Expected 200 after upgrading to business, got {res_rot_upgraded.status_code}"
    print("  [PASS] Plan upgraded to Business successfully via PATCH API; feature restrictions lifted.")

    print("\n>>> ALL 6 PLAN GATING & SECURITY TESTS PASSED! <<<")

if __name__ == "__main__":
    run_tests()
