import os
import re

frontend_dir = r'd:\PROJECT\SentryOps\frontend\src'

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            
            # Remove mock fallbacks for incident ID parameters
            content = re.sub(r"\|\|\s*'INC-2041'", "", content)
            
            # Remove direct uses of mockIncident when id matches (if possible, let's just make it null)
            # Actually, we should just let it fetch from the backend and return 404 or empty.
            content = content.replace("? mockIncident : null", "")
            content = content.replace("id === 'INC-2041' mockIncident : null", "null") # from bad replace
            content = content.replace("activeIncident = incident || (id === 'INC-2041' ? mockIncident : null)", "activeIncident = incident")
            content = content.replace("incident || (id === 'INC-2041'  )", "incident") # fix after replace
            content = content.replace("activeIncident = incident || (id === 'INC-2041')", "activeIncident = incident")
            content = content.replace("incident || (id === 'INC-2041')", "incident")
            
            if orig_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
