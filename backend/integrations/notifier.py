"""
Notification Integration for Operations Efficiency Agent
Slack and Email notifications
"""

import os
import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Environment variables
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
SLACK_TIMEOUT = int(os.getenv("SLACK_TIMEOUT", "30"))

GRAPH_BEARER_TOKEN = os.getenv("GRAPH_BEARER_TOKEN")
GRAPH_USER_ID = os.getenv("GRAPH_USER_ID", "me")
GRAPH_TIMEOUT = int(os.getenv("GRAPH_TIMEOUT", "30"))

async def slack_notification(payload: Dict[str, Any]) -> str:
    """
    Send Slack notification
    payload: {channel: "#finance", text: "...", blocks?: [...]}
    """
    if not SLACK_BOT_TOKEN:
        logger.warning("SLACK_BOT_TOKEN not configured, skipping Slack notification")
        return "skipped"
    
    channel = payload.get("channel", "#general")
    text = payload.get("text", "Notification from Ops Efficiency Agent")
    blocks = payload.get("blocks", [])
    
    message_data = {
        "channel": channel,
        "text": text,
        "username": "Ops Efficiency Agent",
        "icon_emoji": ":robot_face:"
    }
    
    if blocks:
        message_data["blocks"] = blocks
    
    try:
        async with httpx.AsyncClient(timeout=SLACK_TIMEOUT) as client:
            response = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers={
                    "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=message_data
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get("ok"):
                error = data.get("error", "Unknown error")
                raise RuntimeError(f"Slack API error: {error}")
            
            ts = data.get("ts", "unknown")
            logger.info(f"Slack notification sent to {channel}: {ts}")
            return ts
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to send Slack notification: {e}")
        raise
    except Exception as e:
        logger.error(f"Slack notification error: {e}")
        raise

async def email_notification(payload: Dict[str, Any]) -> str:
    """
    Send email notification via Microsoft Graph
    payload: {to: ["email@example.com"], subject: "...", html: "..."}
    """
    if not GRAPH_BEARER_TOKEN:
        logger.warning("GRAPH_BEARER_TOKEN not configured, skipping email notification")
        return "skipped"
    
    to_recipients = payload.get("to", [])
    subject = payload.get("subject", "Notification from Ops Efficiency Agent")
    html_content = payload.get("html", "<p>Notification from Ops Efficiency Agent</p>")
    
    if not to_recipients:
        raise ValueError("No recipients specified")
    
    # Prepare email body
    email_body = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_content
            },
            "toRecipients": [
                {"emailAddress": {"address": email}} for email in to_recipients
            ]
        },
        "saveToSentItems": True
    }
    
    try:
        async with httpx.AsyncClient(timeout=GRAPH_TIMEOUT) as client:
            response = await client.post(
                f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}/sendMail",
                headers={
                    "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=email_body
            )
            response.raise_for_status()
            
            logger.info(f"Email notification sent to {len(to_recipients)} recipients")
            return "email:sent"
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to send email notification: {e}")
        raise
    except Exception as e:
        logger.error(f"Email notification error: {e}")
        raise

def create_invoice_slack_blocks(invoice_id: str, action: str, amount: float, vendor: str) -> List[Dict[str, Any]]:
    """
    Create rich Slack blocks for invoice notifications
    """
    color = "good" if action == "approved" else "warning" if action == "hold" else "danger"
    emoji = "✅" if action == "approved" else "⚠️" if action == "hold" else "❌"
    
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{emoji} Invoice {action.title()}"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Invoice ID:*\n{invoice_id}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Amount:*\nNOK {amount:,.2f}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Vendor:*\n{vendor}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Action:*\n{action.title()}"
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Processed by Ops Efficiency Agent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                }
            ]
        }
    ]

def create_allocation_slack_blocks(allocation_id: str, amount: float, lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Create rich Slack blocks for allocation notifications
    """
    lines_text = "\n".join([
        f"• {line.get('costCenter', 'N/A')}: NOK {line.get('amount', 0):,.2f}"
        for line in lines
    ])
    
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "💰 Cost Allocation Posted"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Allocation ID:*\n{allocation_id}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Total Amount:*\nNOK {amount:,.2f}"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Allocation Lines:*\n{lines_text}"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Posted by Ops Efficiency Agent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                }
            ]
        }
    ]

def create_recruitment_slack_blocks(job_id: str, candidates_count: int, top_candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Create rich Slack blocks for recruitment notifications
    """
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "👥 CV Ranking Complete"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Job ID:*\n{job_id}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Candidates Ranked:*\n{candidates_count}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Top Candidate:*\n{top_candidate.get('candidateId', 'N/A')}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Score:*\n{top_candidate.get('score01', 0):.1%}"
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Ranked by Ops Efficiency Agent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                }
            ]
        }
    ]

async def health_check() -> Dict[str, bool]:
    """
    Check notification systems health
    """
    health = {
        "slack": False,
        "email": False
    }
    
    # Check Slack
    if SLACK_BOT_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    "https://slack.com/api/auth.test",
                    headers={"Authorization": f"Bearer {SLACK_BOT_TOKEN}"}
                )
                health["slack"] = response.status_code == 200
        except Exception:
            pass
    
    # Check Email (Graph)
    if GRAPH_BEARER_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}",
                    headers={"Authorization": f"Bearer {GRAPH_BEARER_TOKEN}"}
                )
                health["email"] = response.status_code == 200
        except Exception:
            pass
    
    return health
