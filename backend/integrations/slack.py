"""
Slack integration for EA Second Brain Agent
"""

import httpx
import os

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

async def post_message(payload: dict) -> str:
    """
    Post message to Slack
    
    Payload mapping (bot):
    {"channel": "#ea-updates", "text": "EA Update…", "blocks": [...]}
    
    Payload mapping (webhook):
    {"text": "EA Update…"}
    """
    if SLACK_BOT_TOKEN:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers={
                    "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )
            r.raise_for_status()
            data = r.json()
            if not data.get("ok"):
                raise RuntimeError(f"Slack error: {data}")
            return data.get("ts", "slack:ok")
    elif SLACK_WEBHOOK_URL:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                SLACK_WEBHOOK_URL,
                json=payload,
                timeout=30.0
            )
            r.raise_for_status()
            return "slack:webhook-ok"
    else:
        return "slack:mock-ok"  # Return mock if not configured

