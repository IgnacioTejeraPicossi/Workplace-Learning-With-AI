"""
Jira integration for EA Second Brain Agent
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
        r.raise_for_status()
        data = r.json()
        return data.get("key", data.get("id", "JIRA-UNKNOWN"))

