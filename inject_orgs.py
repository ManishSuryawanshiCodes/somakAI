import sys
import os

BACKEND_DIR = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
sys.path.insert(0, BACKEND_DIR)

from app.services.org_store import org_store

org_a = org_store.create_org("Test Org A", "test-org-a", "creator@orga.com")
org_b = org_store.create_org("Test Org B", "test-org-b", "creator@orgb.com")

print(f"ORG_A:{org_a.id}")
print(f"ORG_B:{org_b.id}")
