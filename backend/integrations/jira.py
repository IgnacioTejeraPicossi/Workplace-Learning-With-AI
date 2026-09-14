"""
Jira integration for EA Second Brain Agent.

⚠️ TOKEN ROTATION NOTE (2026-09-14)
The "AI learning Jira integration" Atlassian API token was deliberately left to
EXPIRE (~2026-10-10) because Jira issue creation is not in active use right now.
So this integration is currently DORMANT — `create_issue` returns a mock when the
env vars are unset, and returns a clear "token expired" error if the old token is
still present but rejected.

**Before using Jira again** (e.g. the EA Second Brain / Compliance agent creating
real issues):
  1. Create a new token at https://id.atlassian.com/manage-profile/security/api-tokens
  2. Set JIRA_API_TOKEN (and JIRA_BASE_URL / JIRA_EMAIL) in the repo-root `.env`
     — never in code, never committed. Restart the backend.
  3. If the Compliance agent's "Send → n8n/OutSystems" path is used, also update the
     Jira credential stored in n8n / OutSystems (a separate place).
  4. Revoke the old token.
"""

import base64
import httpx
import os

JIRA_BASE_URL = os.getenv("JIRA_BASE_URL", "").rstrip("/")
JIRA_EMAIL = os.getenv("JIRA_EMAIL", "")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN", "")

AUTH = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {AUTH}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

async def create_issue(payload: dict) -> str:
    """
    Create a Jira issue
    
    Payload mapping:
    {
        "projectKey": "EA",
        "summary": "EA Update: K8s 1.31",
        "description": "<p>Markdown/HTML allowed</p>",
        "issueType": "Task",
        "labels": ["ea", "architecture"],
        "assignee": "user@company.com"  # optional
    }
    """
    if not JIRA_BASE_URL or not JIRA_EMAIL or not JIRA_API_TOKEN:
        return "JIRA-MOCK-123"  # Return mock if not configured
    
    issue = {
        "fields": {
            "project": {"key": payload.get("projectKey", "EA")},
            "summary": payload["summary"],
            "issuetype": {"name": payload.get("issueType", "Task")},
            "labels": payload.get("labels", []),
        }
    }
    
    if payload.get("description"):
        issue["fields"]["description"] = {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": payload["description"]
                        }
                    ]
                }
            ]
        }
    
    if payload.get("assignee"):
        issue["fields"]["assignee"] = {"name": payload["assignee"]}
    
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{JIRA_BASE_URL}/rest/api/3/issue",
            json=issue,
            headers=HEADERS,
            timeout=30.0
        )
        # Auth failure (401/403) most likely means the Jira API token expired.
        # The "AI learning Jira integration" token was left to expire ~2026-10-10.
        # Surface an actionable message (reaches the run's errors via ea_execute).
        if r.status_code in (401, 403):
            raise RuntimeError(
                "Jira auth failed (HTTP %d): the API token was probably expired or "
                "revoked. The 'AI learning Jira integration' token was set to expire "
                "~2026-10-10. Create a new token at "
                "https://id.atlassian.com/manage-profile/security/api-tokens, update "
                "JIRA_API_TOKEN in the repo-root .env (and the n8n/OutSystems Jira "
                "credential if that path is used), then restart the backend."
                % r.status_code
            )
        r.raise_for_status()
        data = r.json()
        return data.get("key", data.get("id", "JIRA-UNKNOWN"))

