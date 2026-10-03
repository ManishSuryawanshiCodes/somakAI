import urllib.request
import json
import base64
import logging

logger = logging.getLogger('somak.github')

class GitHubService:
    def __init__(self, token: str, repo_full_name: str):
        self.token = token
        self.repo = repo_full_name
        self.base_url = "https://api.github.com"
        
    def _request(self, method: str, path: str, payload: dict = None):
        url = f"{self.base_url}/repos/{self.repo}{path}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Somak-AI-Remediation"
        }
        data = json.dumps(payload).encode('utf-8') if payload else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as res:
                return json.loads(res.read().decode())
        except Exception as e:
            err = e.read().decode() if hasattr(e, 'read') else str(e)
            logger.error(f"GitHub API Error [{method} {path}]: {err}")
            raise Exception(f"GitHub API Error: {err}")

    def get_default_branch_sha(self) -> tuple[str, str]:
        res = self._request("GET", "")
        default_branch = res.get("default_branch", "main")
        ref_res = self._request("GET", f"/git/ref/heads/{default_branch}")
        return default_branch, ref_res["object"]["sha"]

    def create_branch(self, branch_name: str, sha: str):
        self._request("POST", "/git/refs", {
            "ref": f"refs/heads/{branch_name}",
            "sha": sha
        })

    def create_or_update_file(self, path: str, content: str, commit_message: str, branch: str):
        # Check if file exists to get SHA
        file_sha = None
        try:
            file_res = self._request("GET", f"/contents/{path}?ref={branch}")
            file_sha = file_res["sha"]
        except:
            pass
            
        payload = {
            "message": commit_message,
            "content": base64.b64encode(content.encode('utf-8')).decode('utf-8'),
            "branch": branch
        }
        if file_sha:
            payload["sha"] = file_sha
            
        return self._request("PUT", f"/contents/{path}", payload)

    def create_pull_request(self, title: str, body: str, head: str, base: str) -> str:
        res = self._request("POST", "/pulls", {
            "title": title,
            "body": body,
            "head": head,
            "base": base
        })
        return res.get("html_url")

def create_remediation_pr(token: str, repo: str, branch_name: str, files_to_patch: list, title: str, body: str):
    gh = GitHubService(token, repo)
    base_branch, base_sha = gh.get_default_branch_sha()
    gh.create_branch(branch_name, base_sha)
    
    for f in files_to_patch:
        gh.create_or_update_file(f["path"], f["content"], f"fix: {f['path']}", branch_name)
        
    pr_url = gh.create_pull_request(title, body, branch_name, base_branch)
    return pr_url

