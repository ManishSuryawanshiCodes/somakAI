path = r'd:\PROJECT\SentryOps\backend\app\core\dependencies.py'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip().startswith('if token.startswith("demo_session_"):'):
        skip = True
    elif skip and line.strip().startswith('user = auth_service.get_user_by_session(token)'):
        skip = False
        new_lines.append(line)
    elif not skip:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
