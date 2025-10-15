"""
Slack Integration for Sales Assistant Agent
Handles Slack notifications and messages
"""

import os
import httpx
from typing import Dict, Any, Optional, List

# Slack configuration
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
SLACK_DEFAULT_CHANNEL = os.getenv("SLACK_DEFAULT_CHANNEL", "#sales")

async def post_message(payload: Dict[str, Any]) -> str:
    """Post message to Slack"""
    
    # Use bot token if available, otherwise fallback to webhook
    if SLACK_BOT_TOKEN:
        return await _post_with_bot_token(payload)
    elif SLACK_WEBHOOK_URL:
        return await _post_with_webhook(payload)
    else:
        # Return mock string if Slack is not configured to avoid breaking demo flows
        return "SLACK-MOCK-POSTED"

async def _post_with_bot_token(payload: Dict[str, Any]) -> str:
    """Post message using Slack Bot Token"""
    
    channel = payload.get("channel", SLACK_DEFAULT_CHANNEL)
    text = payload.get("text", "Sales Assistant notification")
    
    # Optional: Add blocks for rich formatting
    blocks = payload.get("blocks", [])
    
    message_data = {
        "channel": channel,
        "text": text
    }
    
    if blocks:
        message_data["blocks"] = blocks
    
    url = "https://slack.com/api/chat.postMessage"
    
    headers = {
        "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=message_data, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        if not result.get("ok"):
            raise ValueError(f"Slack API error: {result.get('error')}")
        
        return result.get("ts", "message-posted")

async def _post_with_webhook(payload: Dict[str, Any]) -> str:
    """Post message using Slack Webhook"""
    
    text = payload.get("text", "Sales Assistant notification")
    
    message_data = {
        "text": text
    }
    
    # Add optional attachments
    attachments = payload.get("attachments", [])
    if attachments:
        message_data["attachments"] = attachments
    
    async with httpx.AsyncClient() as client:
        response = await client.post(SLACK_WEBHOOK_URL, json=message_data)
        response.raise_for_status()
        
        return "webhook-message-posted"

async def post_deal_alert(
    opportunity_name: str,
    stage: str,
    amount: Optional[float],
    owner: str,
    risk_level: str,
    next_steps: List[str]
) -> str:
    """Post deal alert to Slack with rich formatting"""
    
    # Create rich message with blocks
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🚨 Deal Alert: {opportunity_name}"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Stage:* {stage}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Amount:* ${amount:,.2f}" if amount else "*Amount:* TBD"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Owner:* {owner}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Risk Level:* {risk_level}"
                }
            ]
        }
    ]
    
    # Add next steps if provided
    if next_steps:
        steps_text = "\n".join([f"• {step}" for step in next_steps])
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Next Steps:*\n{steps_text}"
            }
        })
    
    payload = {
        "text": f"Deal Alert: {opportunity_name}",
        "blocks": blocks,
        "channel": SLACK_DEFAULT_CHANNEL
    }
    
    return await post_message(payload)

async def post_pipeline_summary(
    total_deals: int,
    high_risk_deals: int,
    high_potential_deals: int,
    hygiene_issues: int
) -> str:
    """Post daily pipeline summary to Slack"""
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📊 Daily Pipeline Summary"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Total Deals:* {total_deals}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*High Risk:* {high_risk_deals}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*High Potential:* {high_potential_deals}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Hygiene Issues:* {hygiene_issues}"
                }
            ]
        }
    ]
    
    payload = {
        "text": "Daily Pipeline Summary",
        "blocks": blocks,
        "channel": SLACK_DEFAULT_CHANNEL
    }
    
    return await post_message(payload)

async def post_meeting_follow_up(
    opportunity_name: str,
    meeting_summary: str,
    attendees: List[str],
    next_steps: List[str]
) -> str:
    """Post meeting follow-up notification to Slack"""
    
    attendees_text = ", ".join(attendees) if attendees else "Team"
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"📅 Meeting Follow-up: {opportunity_name}"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Attendees:* {attendees_text}\n*Summary:* {meeting_summary}"
            }
        }
    ]
    
    if next_steps:
        steps_text = "\n".join([f"• {step}" for step in next_steps])
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Next Steps:*\n{steps_text}"
            }
        })
    
    payload = {
        "text": f"Meeting Follow-up: {opportunity_name}",
        "blocks": blocks,
        "channel": SLACK_DEFAULT_CHANNEL
    }
    
    return await post_message(payload)