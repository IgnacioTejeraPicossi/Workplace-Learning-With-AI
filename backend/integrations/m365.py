"""
Microsoft 365 Integration for Sales Assistant Agent
Handles email draft creation and calendar integration
"""

import os
import httpx
from typing import Dict, Any, List, Optional

# Microsoft Graph configuration
GRAPH_USER_ID = os.getenv("GRAPH_USER_ID", "me")
GRAPH_BEARER_TOKEN = os.getenv("GRAPH_BEARER_TOKEN", "")

async def create_draft(payload: Dict[str, Any]) -> str:
    """Create email draft in Microsoft 365"""
    
    if not GRAPH_BEARER_TOKEN:
        raise ValueError("Microsoft Graph token not configured")
    
    # Prepare email data
    email_data = {
        "subject": payload.get("subject", "Follow-up"),
        "body": {
            "contentType": "HTML",
            "content": payload.get("html", "<p>Hi,</p><p>Thank you for your time today.</p><p>Best regards</p>")
        },
        "toRecipients": []
    }
    
    # Add recipients
    recipients = payload.get("to", [])
    for recipient in recipients:
        email_data["toRecipients"].append({
            "emailAddress": {
                "address": recipient.get("address"),
                "name": recipient.get("name", recipient.get("address"))
            }
        })
    
    # Add CC recipients if provided
    cc_recipients = payload.get("cc", [])
    if cc_recipients:
        email_data["ccRecipients"] = []
        for recipient in cc_recipients:
            email_data["ccRecipients"].append({
                "emailAddress": {
                    "address": recipient.get("address"),
                    "name": recipient.get("name", recipient.get("address"))
                }
            })
    
    # Create draft via Microsoft Graph API
    url = f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=email_data, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result.get("id", "draft-created")

async def get_user_calendar_events(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Get user calendar events for a date range"""
    
    if not GRAPH_BEARER_TOKEN:
        raise ValueError("Microsoft Graph token not configured")
    
    url = f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}/calendar/events"
    params = {
        "startDateTime": start_date,
        "endDateTime": end_date,
        "$orderby": "start/dateTime"
    }
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result.get("value", [])

async def get_meeting_attendees(event_id: str) -> List[Dict[str, Any]]:
    """Get attendees for a specific meeting"""
    
    if not GRAPH_BEARER_TOKEN:
        raise ValueError("Microsoft Graph token not configured")
    
    url = f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}/calendar/events/{event_id}/attendees"
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        return result.get("value", [])

async def create_follow_up_draft(
    opportunity_name: str,
    meeting_summary: str,
    attendees: List[Dict[str, str]],
    next_steps: List[str]
) -> str:
    """Create contextual follow-up email draft after a meeting"""
    
    # Generate HTML content
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Follow-up: {opportunity_name}</h2>
        
        <p>Dear Team,</p>
        
        <p>Thank you for the productive meeting today regarding <strong>{opportunity_name}</strong>.</p>
        
        <h3>Meeting Summary:</h3>
        <p>{meeting_summary}</p>
        
        <h3>Next Steps:</h3>
        <ul>
    """
    
    for step in next_steps:
        html_content += f"<li>{step}</li>"
    
    html_content += """
        </ul>
        
        <p>I'll follow up on these items and keep you updated on our progress.</p>
        
        <p>Best regards,<br>
        Sales Team</p>
    </body>
    </html>
    """
    
    # Prepare draft payload
    draft_payload = {
        "subject": f"Follow-up: {opportunity_name}",
        "html": html_content,
        "to": attendees
    }
    
    return await create_draft(draft_payload)

async def get_user_profile() -> Dict[str, Any]:
    """Get current user profile from Microsoft Graph"""
    
    if not GRAPH_BEARER_TOKEN:
        raise ValueError("Microsoft Graph token not configured")
    
    url = f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}"
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        
        return response.json()
