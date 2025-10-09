"""
CRM Integration
Handles case creation and management
"""

import os
import httpx
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Configuration
CRM_BASE_URL = os.getenv("CRM_BASE_URL", "https://crm.example.com")
CRM_BEARER_TOKEN = os.getenv("CRM_BEARER_TOKEN", "demo-token")

HEADERS = {
    "Authorization": f"Bearer {CRM_BEARER_TOKEN}",
    "Content-Type": "application/json"
}

async def create_case(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a CRM case
    
    Expected payload:
    {
        "customerId": "customer-id",
        "subject": "Case subject",
        "description": "Case description",
        "priority": "Low|Medium|High|Critical",
        "category": "Technical|Billing|Support",
        "assignedTo": "agent-id"
    }
    """
    try:
        case_body = {
            "customerId": payload.get("customerId"),
            "subject": payload.get("subject", "Telco Ops Case"),
            "description": payload.get("description", ""),
            "priority": payload.get("priority", "Medium"),
            "category": payload.get("category", "Technical"),
            "assignedTo": payload.get("assignedTo"),
            "source": "Telco Ops Agent",
            "status": "Open"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CRM_BASE_URL}/api/cases",
                json=case_body,
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"CRM case created successfully: {result.get('id')}")
            
            return {
                "case_id": result.get("id", "case-created"),
                "status": result.get("status", "Open"),
                "priority": payload.get("priority", "Medium"),
                "customer_id": payload.get("customerId"),
                "subject": payload.get("subject", "Telco Ops Case")
            }
            
    except httpx.HTTPError as e:
        logger.error(f"CRM API error creating case: {e}")
        return {
            "case_id": "error",
            "status": "failed",
            "customer_id": payload.get("customerId"),
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error creating CRM case: {e}")
        return {
            "case_id": "error",
            "status": "failed",
            "customer_id": payload.get("customerId"),
            "error": str(e)
        }

async def update_case(case_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing CRM case
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{CRM_BASE_URL}/api/cases/{case_id}",
                json=updates,
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"CRM case updated successfully: {case_id}")
            
            return {
                "case_id": case_id,
                "status": result.get("status", "Updated"),
                "updated_fields": list(updates.keys())
            }
            
    except Exception as e:
        logger.error(f"Error updating CRM case {case_id}: {e}")
        return {
            "case_id": case_id,
            "status": "failed",
            "error": str(e)
        }

async def get_case(case_id: str) -> Dict[str, Any]:
    """
    Get CRM case details
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CRM_BASE_URL}/api/cases/{case_id}",
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            return result
            
    except Exception as e:
        logger.error(f"Error getting CRM case {case_id}: {e}")
        return {
            "case_id": case_id,
            "error": str(e)
        }