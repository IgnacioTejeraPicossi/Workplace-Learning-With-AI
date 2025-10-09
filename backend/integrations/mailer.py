"""
Email Integration for Personal Attention Agent
Handles email digests and notifications via Microsoft Graph
"""

import os
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime

# Graph configuration
GRAPH_BEARER_TOKEN = os.getenv("GRAPH_BEARER_TOKEN", "")
GRAPH_USER_ID = os.getenv("GRAPH_USER_ID", "me")
GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"

async def send_digest(payload: Dict[str, Any]) -> str:
    """Send email digest via Microsoft Graph"""
    if not GRAPH_BEARER_TOKEN:
        raise RuntimeError("GRAPH_BEARER_TOKEN not set")
    
    # Extract recipients
    recipients = payload.get("to", [])
    if not recipients:
        raise ValueError("No recipients specified")
    
    # Build email content
    subject = payload.get("subject", "Personal Attention Digest")
    html_content = payload.get("html", "<p>No content provided</p>")
    
    # Email message structure
    message = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_content
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": recipient.get("address", recipient) if isinstance(recipient, dict) else recipient,
                        "name": recipient.get("name", "") if isinstance(recipient, dict) else ""
                    }
                }
                for recipient in recipients
            ],
            "ccRecipients": [
                {
                    "emailAddress": {
                        "address": cc.get("address", cc) if isinstance(cc, dict) else cc,
                        "name": cc.get("name", "") if isinstance(cc, dict) else ""
                    }
                }
                for cc in payload.get("cc", [])
            ]
        },
        "saveToSentItems": True
    }
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{GRAPH_BASE_URL}/users/{GRAPH_USER_ID}/sendMail",
            json=message,
            headers=headers
        )
        response.raise_for_status()
        
        return f"email:digest_sent:{response.status_code}"

async def send_daily_brief(payload: Dict[str, Any]) -> str:
    """Send daily brief email with clustered information"""
    clusters = payload.get("clusters", [])
    priority = payload.get("priority", "medium")
    
    # Build HTML content
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .header {{ background-color: #f0f0f0; padding: 15px; border-radius: 5px; }}
            .cluster {{ margin: 15px 0; padding: 10px; border-left: 4px solid #0078d4; }}
            .urgent {{ border-left-color: #d13438; }}
            .high {{ border-left-color: #ff8c00; }}
            .medium {{ border-left-color: #107c10; }}
            .low {{ border-left-color: #605e5c; }}
            .evidence {{ margin: 5px 0; font-size: 0.9em; color: #666; }}
            .actions {{ margin: 10px 0; }}
            .action {{ background-color: #e1f5fe; padding: 8px; margin: 5px 0; border-radius: 3px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h2>📊 Personal Attention Daily Brief</h2>
            <p><strong>Date:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
            <p><strong>Priority Level:</strong> {priority.upper()}</p>
        </div>
    """
    
    if not clusters:
        html_content += "<p>No significant clusters detected today.</p>"
    else:
        for cluster in clusters:
            priority_class = cluster.get("priority", "medium")
            html_content += f"""
            <div class="cluster {priority_class}">
                <h3>{cluster.get('topic', 'Untitled Cluster')}</h3>
                <p><strong>Summary:</strong> {cluster.get('summary', 'No summary available')}</p>
                <p><strong>Volume:</strong> {cluster.get('volume', 1)} signals</p>
                <p><strong>Score:</strong> {cluster.get('score', 0):.2f}</p>
                
                <div class="evidence">
                    <h4>Evidence:</h4>
                    {''.join([f'<p>• <a href="{ev.get("url", "#")}">{ev.get("source", "Unknown")}</a>: {ev.get("snippet", "")}</p>' for ev in cluster.get("evidence", [])])}
                </div>
                
                <div class="actions">
                    <h4>Recommended Actions:</h4>
                    {''.join([f'<div class="action"><strong>{action.get("title", "")}</strong><br>{action.get("detail", "")}</div>' for action in cluster.get("recommended_actions", [])])}
                </div>
            </div>
            """
    
    html_content += """
    </body>
    </html>
    """
    
    digest_payload = {
        "to": payload.get("to", []),
        "subject": f"Personal Attention Daily Brief - {datetime.utcnow().strftime('%Y-%m-%d')}",
        "html": html_content
    }
    
    return await send_digest(digest_payload)

async def send_alert_notification(payload: Dict[str, Any]) -> str:
    """Send urgent alert notification"""
    priority = payload.get("priority", "medium")
    topic = payload.get("topic", "Personal Attention Alert")
    
    emoji_map = {
        "urgent": "🚨",
        "high": "⚠️",
        "medium": "ℹ️", 
        "low": "📝"
    }
    
    emoji = emoji_map.get(priority, "ℹ️")
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; margin: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #0078d4;">
            <h2>{emoji} {priority.upper()} ALERT: {topic}</h2>
            <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
            <p><strong>Summary:</strong> {payload.get('summary', 'No summary available')}</p>
            
            <h3>Evidence:</h3>
            <ul>
                {''.join([f'<li><a href="{ev.get("url", "#")}">{ev.get("source", "Unknown")}</a>: {ev.get("snippet", "")}</li>' for ev in payload.get("evidence", [])])}
            </ul>
            
            <h3>Recommended Actions:</h3>
            <ul>
                {''.join([f'<li><strong>{action.get("title", "")}</strong>: {action.get("detail", "")}</li>' for action in payload.get("recommended_actions", [])])}
            </ul>
        </div>
    </body>
    </html>
    """
    
    alert_payload = {
        "to": payload.get("to", []),
        "subject": f"{emoji} {priority.upper()}: {topic}",
        "html": html_content
    }
    
    return await send_digest(alert_payload)
