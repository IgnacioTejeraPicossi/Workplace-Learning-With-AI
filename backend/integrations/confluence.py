"""
Confluence integration for EA Second Brain Agent
"""

import base64
import httpx
import os

CONFLUENCE_BASE = os.getenv("CONFLUENCE_BASE", "").rstrip("/")
CONFLUENCE_AUTH = os.getenv("CONFLUENCE_AUTH", "")  # base64(user:token)

HEADERS = {
    "Authorization": f"Basic {CONFLUENCE_AUTH}",
    "Content-Type": "application/json"
}

async def update_page(payload: dict) -> str:
    """
    Update a Confluence page
    
    Payload mapping:
    {
        "pageId": "12345",
        "title": "EA Updates",
        "body_storage": "<p>HTML in storage format</p>",
        "version": 2  # optional; API increments automatically when omitted
    }
    """
    if not CONFLUENCE_BASE or not CONFLUENCE_AUTH:
        return "conf:mock-page-1"  # Return mock if not configured
    
    page_id = payload["pageId"]
    body = {
        "id": page_id,
        "type": "page",
        "title": payload.get("title", "EA Updates"),
        "version": {"number": payload.get("version", 1) + 1},
        "body": {
            "storage": {
                "value": payload["body_storage"],
                "representation": "storage"
            }
        },
    }
    
    async with httpx.AsyncClient() as client:
        r = await client.put(
            f"{CONFLUENCE_BASE}/rest/api/content/{page_id}",
            json=body,
            headers=HEADERS,
            timeout=30.0
        )
        r.raise_for_status()
        return page_id

