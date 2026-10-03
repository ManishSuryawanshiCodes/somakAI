import os
import re

target_dir = r'd:\PROJECT\SentryOps\frontend\src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content
    content = re.sub(r'SOC-2 / ISO 27001', 'Tamper-Evident Security', content)
    content = re.sub(r'SOC-2 Type II', 'Tamper-Evident Audit', content)
    content = re.sub(r'SOC-2 / ISO-27001 Certified', 'Tamper-Evident Security', content)
    content = re.sub(r'SOC-2 Ready', 'Tamper-Evident', content)
    content = re.sub(r'SOC-2 Recommended', 'Security Recommended', content)
    content = re.sub(r'SOC-2 compliance', 'tamper-evident audit compliance', content)
    content = re.sub(r'SOC-2 Cryptographic Audit Logs', 'Cryptographic Audit Logs', content)
    content = re.sub(r'SOC-2 Audit Log', 'Audit Log', content)
    content = re.sub(r'SOC-2 Post-Mortem', 'Post-Mortem', content)
    content = re.sub(r'satisfy SOC-2 retention', 'satisfy data retention', content)
    
    content = re.sub(r'Firecracker microVM', 'isolated sandbox', content, flags=re.IGNORECASE)
    content = re.sub(r'Firecracker VM', 'sandbox container', content, flags=re.IGNORECASE)
    content = re.sub(r'Firecracker MicroVMs', 'isolated sandboxes', content, flags=re.IGNORECASE)
    content = re.sub(r'Firecracker', 'Sandbox', content, flags=re.IGNORECASE)
    
    if content != orig_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

