import sys
import os

BACKEND_DIR = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
sys.path.insert(0, BACKEND_DIR)

from app.services.org_store import org_store
from app.models.organization import CreateOrgRequest

req_a = CreateOrgRequest(name="Test Org A", slug="test-org-a", creator_email="test@orga.com")
org_a = org_store.create_org(req_a)

req_b = CreateOrgRequest(name="Test Org B", slug="test-org-b", creator_email="test@orgb.com")
org_b = org_store.create_org(req_b)

print(f"ORG_A_ID:{org_a.id}")
print(f"ORG_B_ID:{org_b.id}")

# also let's make sure they are in the db so the api can hit them
