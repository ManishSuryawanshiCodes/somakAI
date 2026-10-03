import urllib.request
import json
import uuid
import sys
import hmac, hashlib
import os

base_url = "http://127.0.0.1:8000/api"

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
    req = urllib.request.Request(
        f"{base_url}{path}",
        headers=headers
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

# 1. Signup User A and B
uuid_a = uuid.uuid4().hex[:6]
uuid_b = uuid.uuid4().hex[:6]

res_a = http_post("/auth/signup", {"name": "User A", "email": f"a_{uuid_a}@test.com", "password": "password123"})
tok_a = res_a["session_token"]
org_a_id = res_a["last_org_id"]

res_b = http_post("/auth/signup", {"name": "User B", "email": f"b_{uuid_b}@test.com", "password": "password123"})
tok_b = res_b["session_token"]
org_b_id = res_b["last_org_id"]

# 3. Simulate Incident in Org A
incident_payload = {
    "event_id": f"inc-{uuid_a}",
    "project_name": "test-service",
    "severity": "SEV-1",
    "culprit": "test",
    "message": "test",
    "organization_id": org_a_id
}

secret = "somak_whsec_live_2026_x9k2"
try:
    with open('backend/.env', 'r') as f:
        for line in f:
            if line.startswith('SENTRY_WEBHOOK_SECRET='):
                secret = line.strip().split('=', 1)[1]
except:
    pass

body = json.dumps(incident_payload).encode('utf-8')
sig = hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest()

wh_req = urllib.request.Request(
    f"{base_url}/incidents/webhook?org_id={org_a_id}",
    data=body,
    headers={"Content-Type": "application/json", "sentry-hook-signature": sig, "x-organization-id": org_a_id}
)
try:
    with urllib.request.urlopen(wh_req) as res:
        inc_res = json.loads(res.read().decode())
        inc_id = inc_res.get("incident_id")
        print("Created Incident:", inc_id)
except Exception as e:
    print("Webhook failed:", e.read().decode() if hasattr(e, 'read') else str(e))
    sys.exit(1)

# 4. Fetch from Org B (should fail)
try:
    http_get(f"/incidents/{inc_id}", tok_b, org_b_id)
    print("FAIL: User B was able to fetch Org A's incident!")
except urllib.error.HTTPError as e:
    print("\n================== API RESPONSE ==================")
    print(f"HTTP {e.code} {e.reason}")
    print(e.read().decode("utf-8"))
    print("==================================================")
