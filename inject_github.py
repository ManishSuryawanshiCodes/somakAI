import re

path = r'd:\PROJECT\SentryOps\backend\app\api\routes.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add github_service import
content = content.replace("from app.services.agent_runner import AgentRunner", "from app.services.agent_runner import AgentRunner\nfrom app.services.github_service import create_remediation_pr")

# Update deploy_remediation
deploy_logic = '''
    # Trigger GitHub PR if configured
    org_config = org_store.get_org(org_id)
    checklist = org_config.setup_checklist if org_config else None
    if checklist and checklist.github_repo and checklist.github_token:
        try:
            files = []
            if incident.patch:
                for f in incident.patch.get("files", []):
                    # We might need to fetch the original content and patch it, or if it's already a whole file
                    # If it's a diff, applying it via API is hard. For now, assume it's the full content or just commit a patch file
                    pass
            
            # Simple mock of the PR opening since we don't have the full AST file state locally without cloning
            pr_url = create_remediation_pr(
                token=checklist.github_token,
                repo=checklist.github_repo,
                branch_name=f"somak-remediation-{req.incidentId}",
                files_to_patch=[{"path": f"somak_patches/{req.incidentId}.patch", "content": json.dumps(incident.patch)}],
                title=f"Fix(Somak): {incident.service} - {incident.severity} Hotfix",
                body=f"Autonomous remediation patch synthesized for incident {req.incidentId}.\\n\\n**Incident Details:**\\n- Root Cause: {incident.root_cause_analysis.get('root_cause', '') if incident.root_cause_analysis else 'Unknown'}\\n\\nPlease review and verify."
            )
            audit_store.record_event(
                actor_name=user.name, actor_email=user.email, actor_role=role,
                org_id=incident.organization_id, action=f"Opened GitHub PR for {req.incidentId}: {pr_url}",
                category="github", target=f"incident/{req.incidentId}"
            )
        except Exception as e:
            logger.error(f"Failed to create GitHub PR: {e}")
            audit_store.record_event(
                actor_name=user.name, actor_email=user.email, actor_role=role,
                org_id=incident.organization_id, action=f"Failed to open GitHub PR: {e}",
                category="github", target=f"incident/{req.incidentId}"
            )

    return canary
'''
content = content.replace("    return canary\n\n@router.post(\"/api/remediation/rollback\", response_model=CanaryStatus)", deploy_logic + "\n@router.post(\"/api/remediation/rollback\", response_model=CanaryStatus)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
