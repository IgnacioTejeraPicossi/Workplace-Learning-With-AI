"""
Microsoft Graph Calendar Integration for Personal Attention Agent
Handles calendar events and focus holds
"""

import os
import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Graph configuration
GRAPH_BEARER_TOKEN = os.getenv("GRAPH_BEARER_TOKEN", "")
GRAPH_USER_ID = os.getenv("GRAPH_USER_ID", "me")
GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"

async def create_event(payload: Dict[str, Any]) -> str:
    """Create calendar event via Microsoft Graph"""
    if not GRAPH_BEARER_TOKEN:
        raise RuntimeError("GRAPH_BEARER_TOKEN not set")
    
    # Default event structure
    event_data = {
        "subject": payload.get("subject", "Focus Hold - Personal Attention"),
        "body": {
            "contentType": "HTML",
            "content": payload.get("body", "<p>Focus hold scheduled by Personal Attention Agent</p>")
        },
        "start": payload.get("start", {
            "dateTime": (datetime.utcnow() + timedelta(minutes=15)).isoformat() + "Z",
            "timeZone": "UTC"
        }),
        "end": payload.get("end", {
            "dateTime": (datetime.utcnow() + timedelta(minutes=45)).isoformat() + "Z", 
            "timeZone": "UTC"
        }),
        "attendees": payload.get("attendees", []),
        "isReminderOn": True,
        "reminderMinutesBeforeStart": 15,
        "sensitivity": payload.get("sensitivity", "normal"),
        "importance": payload.get("importance", "normal")
    }
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{GRAPH_BASE_URL}/users/{GRAPH_USER_ID}/events",
            json=event_data,
            headers=headers
        )
        response.raise_for_status()
        
        result = response.json()
        return f"calendar:event_created:{result.get('id', 'unknown')}"

async def create_focus_hold(payload: Dict[str, Any]) -> str:
    """Create a focus hold event for attention management"""
    focus_payload = {
        "subject": f"Focus Hold: {payload.get('topic', 'Personal Attention')}",
        "body": f"""
        <h3>Focus Hold Scheduled</h3>
        <p><strong>Topic:</strong> {payload.get('topic', 'Personal Attention Alert')}</p>
        <p><strong>Summary:</strong> {payload.get('summary', 'Please review the attached information')}</p>
        <p><strong>Priority:</strong> {payload.get('priority', 'Medium')}</p>
        <p>This focus hold was automatically scheduled by the Personal Attention Agent.</p>
        """,
        "start": {
            "dateTime": payload.get("start_time", (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z"),
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": payload.get("end_time", (datetime.utcnow() + timedelta(minutes=30)).isoformat() + "Z"),
            "timeZone": "UTC"
        },
        "attendees": payload.get("attendees", []),
        "sensitivity": "private",
        "importance": "high" if payload.get("priority") == "urgent" else "normal"
    }
    
    return await create_event(focus_payload)

async def list_upcoming_events(hours: int = 24) -> list:
    """List upcoming events for the next N hours"""
    if not GRAPH_BEARER_TOKEN:
        raise RuntimeError("GRAPH_BEARER_TOKEN not set")
    
    start_time = datetime.utcnow()
    end_time = start_time + timedelta(hours=hours)
    
    params = {
        "startDateTime": start_time.isoformat() + "Z",
        "endDateTime": end_time.isoformat() + "Z",
        "$orderby": "start/dateTime"
    }
    
    headers = {
        "Authorization": f"Bearer {GRAPH_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{GRAPH_BASE_URL}/users/{GRAPH_USER_ID}/calendarView",
            params=params,
            headers=headers
        )
        response.raise_for_status()
        
        return response.json().get("value", [])
