"""
TMF679 Product Offering Qualification API Integration
Handles product offering qualification and eligibility checks
"""

import os
import httpx
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Configuration
TMF_BASE_URL = os.getenv("TMF_BASE_URL", "https://tmf.example.com")
TMF_AUTH_TOKEN = os.getenv("TMF_AUTH_TOKEN", "demo-token")

HEADERS = {
    "Authorization": f"Bearer {TMF_AUTH_TOKEN}",
    "Content-Type": "application/json"
}

async def qualify_offering(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Qualify a product offering for a customer using TMF679 API
    
    Expected payload:
    {
        "offeringId": "product-offering-id",
        "customerId": "customer-id",
        "service": {
            "place": "address-or-location"
        }
    }
    """
    try:
        qualification_body = {
            "productOffering": {"id": payload.get("offeringId")},
            "relatedParty": [{"id": payload.get("customerId")}],
            "service": payload.get("service", {})
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TMF_BASE_URL}/tmf-api/productOfferingQualification/v4/productOfferingQualification",
                json=qualification_body,
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Offering qualified successfully: {result.get('id')}")
            
            return {
                "qualification_id": result.get("id", "qualified"),
                "status": result.get("state", "qualified"),
                "offering_id": payload.get("offeringId"),
                "customer_id": payload.get("customerId"),
                "eligible": result.get("eligible", True),
                "price": result.get("price", {}),
                "availability": result.get("availability", {})
            }
            
    except httpx.HTTPError as e:
        logger.error(f"TMF679 API error qualifying offering: {e}")
        return {
            "qualification_id": "error",
            "status": "failed",
            "offering_id": payload.get("offeringId"),
            "customer_id": payload.get("customerId"),
            "eligible": False,
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error qualifying offering: {e}")
        return {
            "qualification_id": "error",
            "status": "failed", 
            "offering_id": payload.get("offeringId"),
            "customer_id": payload.get("customerId"),
            "eligible": False,
            "error": str(e)
        }

async def check_eligibility(customer_id: str, offering_id: str, service_location: str = None) -> bool:
    """
    Simple eligibility check wrapper
    """
    payload = {
        "offeringId": offering_id,
        "customerId": customer_id,
        "service": {"place": service_location} if service_location else {}
    }
    
    result = await qualify_offering(payload)
    return result.get("eligible", False)
