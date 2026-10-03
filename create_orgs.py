import urllib.request
import json

base_url = "http://127.0.0.1:8000/api"

# Create Org A
req_a = urllib.request.Request(
    f"{base_url}/organizations",
    data=json.dumps({"name": "Test Org A", "slug": "test-org-a", "creator_email": "test@orga.com"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req_a) as res:
    org_a = json.loads(res.read().decode())
    print("Org A Created:", org_a)

# Create Org B
req_b = urllib.request.Request(
    f"{base_url}/organizations",
    data=json.dumps({"name": "Test Org B", "slug": "test-org-b", "creator_email": "test@orgb.com"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req_b) as res:
    org_b = json.loads(res.read().decode())
    print("Org B Created:", org_b)

with open('org_ids.txt', 'w') as f:
    f.write(f"{org_a['id']},{org_b['id']}")
