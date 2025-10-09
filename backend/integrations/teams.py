"""
Microsoft Teams Integration for Personal Attention Agent
Handles Teams notifications and adaptive cards
"""

import os
import httpx
from typing import Dict, Any, Optional

# Teams configuration
TEAMS_WEBHOOK_URL = os.getenv("TEAMS_WEBHOOK_URL", "")
TEAMS_BOT_TOKEN = os.getenv("TEAMS_BOT_TOKEN", "")

async def send_card(payload: Dict[str, Any]) -> str:
    """Send adaptive card to Teams channel"""
    if not TEAMS_WEBHOOK_URL:
        raise RuntimeError("TEAMS_WEBHOOK_URL not set")
    
    # Default adaptive card structure
    card = payload.get("card", {
        "type": "AdaptiveCard",
        "version": "1.3",
        "body": [
            {
                "type": "TextBlock",
                "text": payload.get("title", "Personal Attention Alert"),
                "weight": "Bolder",
                "size": "Medium"
            },
            {
                "type": "TextBlock",
                "text": payload.get("summary", "No summary provided"),
                "wrap": True
            }
        ],
        "actions": [
            {
                "type": "Action.OpenUrl",
                "title": "View Details",
                "url": payload.get("url", "https://example.com")
            }
        ]
    })
    
    # Teams webhook payload
    teams_payload = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": card
            }
        ]
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(TEAMS_WEBHOOK_URL, json=teams_payload)
        response.raise_for_status()
        return f"teams:card_sent:{response.status_code}"

async def send_message(payload: Dict[str, Any]) -> str:
    """Send simple text message to Teams"""
    if not TEAMS_WEBHOOK_URL:
        raise RuntimeError("TEAMS_WEBHOOK_URL not set")
    
    teams_payload = {
        "text": payload.get("text", "Personal Attention Alert"),
        "summary": payload.get("summary", "Alert from Personal Attention Agent")
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(TEAMS_WEBHOOK_URL, json=teams_payload)
        response.raise_for_status()
        return f"teams:message_sent:{response.status_code}"

async def send_notification(payload: Dict[str, Any]) -> str:
    """Send notification with priority level"""
    priority = payload.get("priority", "medium")
    emoji_map = {
        "urgent": "🚨",
        "high": "⚠️", 
        "medium": "ℹ️",
        "low": "📝"
    }
    
    emoji = emoji_map.get(priority, "ℹ️")
    text = f"{emoji} **{priority.upper()}** - {payload.get('text', 'Alert')}"
    
    return await send_message({"text": text, "summary": payload.get("summary", "")})
