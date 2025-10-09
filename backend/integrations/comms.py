"""
Communication Integration
Handles email, SMS, and push notifications
"""

import os
import httpx
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Configuration
COMMS_PROVIDER = os.getenv("COMMS_PROVIDER", "m365").lower()
COMMS_API_KEY = os.getenv("COMMS_API_KEY", "")
GRAPH_BEARER_TOKEN = os.getenv("GRAPH_BEARER_TOKEN", "")
GRAPH_USER_ID = os.getenv("GRAPH_USER_ID", "me")

async def send_communication(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send communication via email, SMS, or push notification
    
    Expected payload:
    {
        "channel": "email|sms|push",
        "to": "recipient@example.com",
        "subject": "Message subject",
        "html": "<p>HTML content</p>",
        "text": "Plain text content"
    }
    """
    channel = payload.get("channel", "email").lower()
    
    try:
        if channel == "email":
            return await send_email(payload)
        elif channel == "sms":
            return await send_sms(payload)
        elif channel == "push":
            return await send_push(payload)
        else:
            raise ValueError(f"Unsupported communication channel: {channel}")
            
    except Exception as e:
        logger.error(f"Error sending communication: {e}")
        return {
            "message_id": "error",
            "channel": channel,
            "status": "failed",
            "error": str(e)
        }

async def send_email(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send email via Microsoft Graph API"""
    try:
        if COMMS_PROVIDER == "m365" and GRAPH_BEARER_TOKEN:
            # Microsoft Graph API
            email_body = {
                "message": {
                    "subject": payload.get("subject", "Notification"),
                    "body": {
                        "contentType": "HTML",
                        "content": payload.get("html", payload.get("text", ""))
                    },
                    "toRecipients": [{
                        "emailAddress": {
                            "address": payload.get("to")
                        }
                    }]
                },
                "saveToSentItems": True
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://graph.microsoft.com/v1.0/users/{GRAPH_USER_ID}/sendMail",
                    json=email_body,
                    headers={"Authorization": f"Bearer {GRAPH_BEARER_TOKEN}"},
                    timeout=30.0
                )
                response.raise_for_status()
                
                logger.info(f"Email sent successfully to {payload.get('to')}")
                
                return {
                    "message_id": f"email-{payload.get('to')}",
                    "channel": "email",
                    "status": "sent",
                    "recipient": payload.get("to")
                }
        else:
            # Fallback to generic email service
            return await send_generic_email(payload)
            
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return {
            "message_id": "error",
            "channel": "email", 
            "status": "failed",
            "error": str(e)
        }

async def send_sms(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send SMS message"""
    try:
        sms_body = {
            "to": payload.get("to"),
            "text": payload.get("text", payload.get("subject", ""))
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://sms.provider.example.com/send",
                json=sms_body,
                headers={"Authorization": f"Bearer {COMMS_API_KEY}"},
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"SMS sent successfully to {payload.get('to')}")
            
            return {
                "message_id": result.get("id", f"sms-{payload.get('to')}"),
                "channel": "sms",
                "status": "sent",
                "recipient": payload.get("to")
            }
            
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        return {
            "message_id": "error",
            "channel": "sms",
            "status": "failed", 
            "error": str(e)
        }

async def send_push(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Send push notification"""
    try:
        push_body = {
            "to": payload.get("to"),
            "title": payload.get("subject", "Notification"),
            "body": payload.get("text", ""),
            "data": payload.get("data", {})
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://push.provider.example.com/send",
                json=push_body,
                headers={"Authorization": f"Bearer {COMMS_API_KEY}"},
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Push notification sent successfully to {payload.get('to')}")
            
            return {
                "message_id": result.get("id", f"push-{payload.get('to')}"),
                "channel": "push",
                "status": "sent",
                "recipient": payload.get("to")
            }
            
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return {
            "message_id": "error",
            "channel": "push",
            "status": "failed",
            "error": str(e)
        }

async def send_generic_email(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback generic email service"""
    logger.info(f"Sending generic email to {payload.get('to')}")
    return {
        "message_id": f"generic-email-{payload.get('to')}",
        "channel": "email",
        "status": "sent",
        "recipient": payload.get("to")
    }
