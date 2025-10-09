"""
Notification Integration for GRC Agent
Slack and Microsoft Teams notifications
"""

import os
import httpx
from typing import Dict, Any

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
TEAMS_WEBHOOK_URL = os.getenv("TEAMS_WEBHOOK_URL")

async def slack(payload: Dict[str, Any]) -> str:
    """Send Slack notification"""
    # payload: {channel: "#grc", text: "...", blocks?: [...]}
    if not SLACK_BOT_TOKEN:
        raise RuntimeError("SLACK_BOT_TOKEN not configured")
    
    url = "https://slack.com/api/chat.postMessage"
    headers = {
        "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("ok"):
            raise RuntimeError(f"Slack API error: {data}")
        
        return data.get("ts", "slack:ok")

async def teams(payload: Dict[str, Any]) -> str:
    """Send Microsoft Teams notification"""
    # payload: {card: {...}} or {text: "..."}
    if not TEAMS_WEBHOOK_URL:
        raise RuntimeError("TEAMS_WEBHOOK_URL not configured")
    
    # Use card format if provided, otherwise use text
    message_payload = payload.get("card", payload)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(TEAMS_WEBHOOK_URL, json=message_payload)
        response.raise_for_status()
        return "teams:ok"

async def send_grc_alert(
    channel: str,
    title: str,
    message: str,
    severity: str = "medium",
    object_ref: str = None
) -> str:
    """Send standardized GRC alert"""
    
    # Slack format
    if channel.startswith("#"):
        slack_payload = {
            "channel": channel,
            "text": f"🚨 GRC Alert: {title}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🚨 GRC Alert: {title}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": message
                    }
                }
            ]
        }
        
        if object_ref:
            slack_payload["blocks"].append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Object: {object_ref}"
                    }
                ]
            })
        
        return await slack(slack_payload)
    
    # Teams format
    else:
        teams_payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "FF6B6B" if severity == "high" else "FFA500" if severity == "medium" else "00BFA5",
            "summary": f"GRC Alert: {title}",
            "sections": [
                {
                    "activityTitle": f"🚨 GRC Alert: {title}",
                    "activitySubtitle": f"Severity: {severity.upper()}",
                    "text": message
                }
            ]
        }
        
        if object_ref:
            teams_payload["sections"][0]["facts"] = [
                {
                    "name": "Object Reference",
                    "value": object_ref
                }
            ]
        
        return await teams(teams_payload)
