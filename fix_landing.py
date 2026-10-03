import re

path = r'd:\PROJECT\SentryOps\frontend\src\components\landing\LandingPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 95.2% Auto-Resolved -> Fully Automated Flow
content = re.sub(r'>95\.2% Auto-Resolved<', '>Automated Pipeline<', content)

# 2. 14,000+ autonomous remediation runs
content = re.sub(r'Recovery metrics from 14,000\+ autonomous remediation runs\.', 'Automated remediation pipeline metrics.', content)
content = re.sub(r'<StatCounter target=\{95\.2\} decimals=\{1\} suffix="%" />', 'Automated', content)
content = re.sub(r'<StatCounter target=\{0\.00\} decimals=\{2\} suffix="%" />', 'Verified', content)
content = re.sub(r'<StatCounter target=\{14000\} duration=\{2\} prefix="" suffix="\+" \/>', 'Active', content)
content = re.sub(r'<StatCounter target=\{0\} prefix="\$" suffix="K" \/>', 'Monitored', content)
# " Downtime Saved"
content = re.sub(r'Downtime Saved', 'Downtime Monitored', content)
content = re.sub(r'Auto-Resolution Rate', 'Pipeline Status', content)
content = re.sub(r'Zero Regressions', 'AST Validation', content)
content = re.sub(r'0\.00% Error rate', 'Test Coverage', content)
content = re.sub(r'Production Remediations', 'Pipeline Executions', content)

# 3. Firecracker -> network-restricted sandbox
content = re.sub(r'Firecracker MicroVM Sandbox', 'Network-Restricted Sandbox', content, flags=re.IGNORECASE)
content = re.sub(r'Firecracker microVM', 'isolated sandbox', content, flags=re.IGNORECASE)
content = re.sub(r'Firecracker VM', 'Sandbox', content, flags=re.IGNORECASE)
content = re.sub(r'Firecracker MicroVMs', 'isolated sandboxes', content, flags=re.IGNORECASE)
content = re.sub(r'Firecracker', 'Sandbox', content, flags=re.IGNORECASE)

# 4. SOC-2 Type II
content = re.sub(r'SOC-2 Ready Audit Trail', 'Tamper-Evident Audit Trail', content)
content = re.sub(r'SOC-2 Type II audit logging & export', 'Tamper-evident audit logging & export', content)
content = re.sub(r'SOC-2 Type II Audit Log Recorded \(SHA-256 Verified\)', 'Tamper-Evident Audit Log Recorded (SHA-256 Verified)', content)

# 5. AWS KMS, Vault -> Fernet envelope encryption
content = re.sub(r'Bring your own keys across AWS KMS, HashiCorp Vault, or Google Cloud KMS with per-tenant DEK wrapping\.', 'Securely encrypt API keys using Fernet envelope encryption with a master key.', content)

# 6. Tenant boundary verification terminal
content = re.sub(r'<div className="text-violet-400 font-bold">Tamper-Evident Audit Log Recorded \(SHA-256 Verified\)</div>', '<div className="text-violet-400 font-bold">Tamper-Evident Audit Log Recorded (SHA-256 Verified)</div>\n                <div className="text-slate-500 italic mt-4 text-[10px]">* illustrative terminal animation</div>', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('LandingPage replaced')
