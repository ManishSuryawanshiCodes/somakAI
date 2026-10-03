import asyncio
import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.getcwd(), 'backend'))
sys.path.insert(0, BACKEND_DIR)

from app.core.sandbox_runner import SandboxManager

hostile_script = '''
print('Attempting to read .env file...')
try:
    with open('../.env', 'r') as f:
        print('READ SUCCESS:', f.read()[:20])
except Exception as e:
    print('READ FAILED:', type(e).__name__, str(e))

print('Attempting to make network request...')
try:
    import urllib.request
    urllib.request.urlopen('http://google.com', timeout=2)
    print('NETWORK SUCCESS')
except Exception as e:
    print('NETWORK FAILED:', type(e).__name__, str(e))
'''

async def run_hostile_test():
    sm = SandboxManager()
    code, out, passed, total = await sm.execute_isolated_test(hostile_script, "", deny_network=True)
    print("EXIT CODE:", code)
    print("OUTPUT:\n", out)

asyncio.run(run_hostile_test())
