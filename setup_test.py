import sys
import os

BACKEND_DIR = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
sys.path.insert(0, BACKEND_DIR)

from app.services.auth_service import auth_service
from app.services.org_store import org_store
from app.services.incident_store import incident_store
from app.models.organization import CreateOrgRequest
from app.models.incident import Incident

user_a = auth_service.register_user("usera@test.com", "password", "User A")
user_b = auth_service.register_user("userb@test.com", "password", "User B")

req_a = CreateOrgRequest(name="Test Org A", slug="test-org-a", creator_email=user_a.email, user_id=user_a.id)
org_a = org_store.create_org(req_a)

req_b = CreateOrgRequest(name="Test Org B", slug="test-org-b", creator_email=user_b.email, user_id=user_b.id)
org_b = org_store.create_org(req_b)

# Create incident in org A
inc = Incident(
    id="inc-test-org-a",
    organization_id=org_a.id,
    fingerprint="test-fingerprint",
    severity="SEV-1",
    service="test-service",
    timestamp="2026-10-03T00:00:00Z",
    status="TRIAGING",
    reasoning_steps=[]
)
incident_store.add_incident(inc)

print(f"ORG_A_ID:{org_a.id}")
print(f"ORG_B_ID:{org_b.id}")
print(f"INCIDENT_ID:{inc.id}")
print(f"USER_B_TOKEN:{user_b.session_tokens[0] if user_b.session_tokens else ''}")
