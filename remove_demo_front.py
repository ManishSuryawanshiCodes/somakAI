path = r'd:\PROJECT\SentryOps\frontend\src\context\AuthContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip().startswith('// Dedicated Seeded Demo Users (No raw credentials exposed)'):
        skip = True
    elif skip and line.strip() == 'let backendRes: any = null;':
        skip = False
        new_lines.append('    // 1. Call backend endpoint with actual credentials\n')
        new_lines.append(line)
    elif not skip:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
