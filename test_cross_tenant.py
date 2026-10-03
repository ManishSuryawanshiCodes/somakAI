import urllib.request
import json

base_url = "http://127.0.0.1:8000/api"

req = urllib.request.Request(
    f"{base_url}/auth/login",
    data=json.dumps({"email": "userb@test.com", "password": "password"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    token = data["access_token"]
    
    # Now try to fetch incident from Org A
    req2 = urllib.request.Request(
        f"{base_url}/incidents/inc-test-org-a?org_id=org_3695e47b",
        headers={"Authorization": f"Bearer {token}", "x-organization-id": "org_3695e47b"}
    )
    try:
        with urllib.request.urlopen(req2) as res2:
            print("SUCCESS (FAIL): Fetched cross-tenant incident!", res2.read().decode())
    except Exception as e:
        print("BLOCKED (PASS):", e.read().decode() if hasattr(e, 'read') else str(e))
