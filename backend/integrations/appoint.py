"""
Appointment Scheduling Integration
Handles technician appointments and field service scheduling
"""

import os
import httpx
from typing import Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Configuration
APPOINT_BASE_URL = os.getenv("APPOINT_BASE_URL", "https://appointments.example.com")
APPOINT_TOKEN = os.getenv("APPOINT_TOKEN", "demo-token")

HEADERS = {
    "Authorization": f"Bearer {APPOINT_TOKEN}",
    "Content-Type": "application/json"
}

async def schedule_appointment(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Schedule a technician appointment
    
    Expected payload:
    {
        "customerId": "customer-id",
        "slotStart": "2024-01-01T10:00:00Z",
        "slotEnd": "2024-01-01T12:00:00Z", 
        "type": "Technician",
        "serviceType": "Installation",
        "address": "customer-address"
    }
    """
    try:
        appointment_body = {
            "customerId": payload.get("customerId"),
            "slotStart": payload.get("slotStart"),
            "slotEnd": payload.get("slotEnd"),
            "type": payload.get("type", "Technician"),
            "serviceType": payload.get("serviceType", "Installation"),
            "address": payload.get("address", ""),
            "notes": payload.get("notes", "")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{APPOINT_BASE_URL}/api/schedule",
                json=appointment_body,
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Appointment scheduled successfully: {result.get('id')}")
            
            return {
                "appointment_id": result.get("id", "appointment-scheduled"),
                "status": result.get("status", "scheduled"),
                "scheduled_time": result.get("scheduledTime", payload.get("slotStart")),
                "customer_id": payload.get("customerId"),
                "type": payload.get("type", "Technician")
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Appointment API error: {e}")
        return {
            "appointment_id": "error",
            "status": "failed",
            "customer_id": payload.get("customerId"),
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error scheduling appointment: {e}")
        return {
            "appointment_id": "error",
            "status": "failed",
            "customer_id": payload.get("customerId"),
            "error": str(e)
        }

async def get_available_slots(customer_id: str, service_type: str = "Installation") -> Dict[str, Any]:
    """
    Get available appointment slots for a customer
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{APPOINT_BASE_URL}/api/slots",
                params={
                    "customerId": customer_id,
                    "serviceType": service_type
                },
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            return {
                "available_slots": result.get("slots", []),
                "customer_id": customer_id,
                "service_type": service_type
            }
            
    except Exception as e:
        logger.error(f"Error getting available slots: {e}")
        return {
            "available_slots": [],
            "customer_id": customer_id,
            "service_type": service_type,
            "error": str(e)
        }
