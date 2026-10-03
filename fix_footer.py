import re

path = r'd:\PROJECT\SentryOps\frontend\src\components\landing\LandingPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'<Link href="/soc-audit".*?>\s*Compliance & SOC-2\s*</Link>',
    r'<span className="text-slate-500 cursor-not-allowed">Compliance & Audit (Roadmap)</span>',
    content,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
