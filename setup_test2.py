import sys
import os

BACKEND_DIR = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
sys.path.insert(0, BACKEND_DIR)

from app.services.auth_service import auth_service
from app.services.org_store import org_store
from app.services.incident_store import incident_store
from app.models.organization import CreateOrgRequest
from app.models.incident import Incident

user_a = auth_service.register_user("User A", "usera2@test.com", "password123")
user_b = auth_service.register_user("User B", "userb2@test.com", "password123")

req_a = CreateOrgRequest(name="Test Org A", slug="test-org-a2", creator_email=user_a.email, user_id=user_a.id)
org_a = org_store.create_org(req_a)

req_b = CreateOrgRequest(name="Test Org B", slug="test-org-b2", creator_email=user_b.email, user_id=user_b.id)
org_b = org_store.create_org(req_b)

inc = Incident(
    id="inc-test-org-a2",
    organization_id=org_a.id,
    fingerprint="test-fingerprint2",
    severity="SEV-1",
    service="test-service",
    timestamp="2026-10-03T00:00:00Z",
    status="TRIAGING",
    reasoning_steps=[]
)
incident_store.add_incident(inc)

print(f"ORG_A_ID:{org_a.id}")
print(f"ORG_B_ID:{org_b.id}")
