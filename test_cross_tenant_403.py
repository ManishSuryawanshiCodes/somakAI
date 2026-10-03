import urllib.request
import json
import sys

base_url = "http://127.0.0.1:8000/api"

# We can re-use the token and inc_id from the previous test if they are known, but I'll just write a quick script that uses the python script's logic to test 403
import uuid
uuid_a = uuid.uuid4().hex[:6]
uuid_b = uuid.uuid4().hex[:6]
email_a = f"a_{uuid_a}@test.com"
email_b = f"b_{uuid_b}@test.com"

def http_post(path, payload, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{base_url}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def http_get(path, token, org_id=None):
    headers = {"Authorization": f"Bearer {token}"}
    if org_id:
        headers["x-organization-id"] = org_id
    req = urllib.request.Request(f"{base_url}{path}", headers=headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

res_a = http_post("/auth/signup", {"name": "User A", "email": email_a, "password": "password123"})
tok_a = res_a["session_token"]
org_a_id = res_a["last_org_id"]

res_b = http_post("/auth/signup", {"name": "User B", "email": email_b, "password": "password123"})
tok_b = res_b["session_token"]

# Attempt to fetch Org A's data using User B's token but passing Org A's ID
try:
    http_get(f"/incidents/active", tok_b, org_a_id)
    print("FAIL: User B bypassed auth!")
except urllib.error.HTTPError as e:
    print("\n================== API RESPONSE ==================")
    print(f"HTTP {e.code} {e.reason}")
    print(e.read().decode("utf-8"))
    print("==================================================")
