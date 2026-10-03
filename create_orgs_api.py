import urllib.request
import json

base_url = "http://127.0.0.1:8000/api"

def login():
    req = urllib.request.Request(
        f"{base_url}/auth/login",
        data=json.dumps({"email": "demo-admin@somakai.dev", "password": "demo"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            return data["access_token"]
    except Exception as e:
        print("Login failed, maybe need to sign up", e)
        # fallback register
        req = urllib.request.Request(
            f"{base_url}/auth/signup",
            data=json.dumps({"email": "demo-admin@somakai.dev", "password": "demo"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            return data["access_token"]

token = login()

def create_org(name, slug):
    req = urllib.request.Request(
        f"{base_url}/organizations",
        data=json.dumps({"name": name, "slug": slug}).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

try:
    org_a = create_org("Test Org A", "test-org-a")
    print("ORG_A:", org_a["id"])
except Exception as e:
    print(e.read() if hasattr(e, 'read') else str(e))

try:
    org_b = create_org("Test Org B", "test-org-b")
    print("ORG_B:", org_b["id"])
except Exception as e:
    print(e.read() if hasattr(e, 'read') else str(e))
