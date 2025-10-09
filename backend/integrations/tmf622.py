"""
TMF622 Product Ordering API Integration
Handles order creation and modification
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

async def create_order(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new product order using TMF622 API
    
    Expected payload:
    {
        "externalId": "unique-order-id",
        "customerId": "customer-id", 
        "offeringId": "product-offering-id",
        "quantity": 1,
        "appointment": {...}  # optional
    }
    """
    try:
        order_body = {
            "externalId": payload.get("externalId"),
            "relatedParty": [{"role": "Customer", "id": payload.get("customerId")}],
            "orderItem": [{
                "action": "add",
                "productOffering": {"id": payload.get("offeringId")},
                "quantity": payload.get("quantity", 1),
            }]
        }
        
        # Add appointment if provided
        if payload.get("appointment"):
            order_body["orderItem"][0]["appointment"] = payload["appointment"]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TMF_BASE_URL}/tmf-api/productOrdering/v4/productOrder",
                json=order_body,
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Order created successfully: {result.get('id')}")
            
            return {
                "order_id": result.get("id", "order-created"),
                "status": result.get("state", "acknowledged"),
                "external_id": payload.get("externalId")
            }
            
    except httpx.HTTPError as e:
        logger.error(f"TMF622 API error creating order: {e}")
        return {
            "order_id": "error",
            "status": "failed",
            "external_id": payload.get("externalId"),
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error creating order: {e}")
        return {
            "order_id": "error", 
            "status": "failed",
            "external_id": payload.get("externalId"),
            "error": str(e)
        }

async def change_order(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Modify an existing product order using TMF622 API
    
    Expected payload:
    {
        "externalId": "unique-order-id",
        "customerId": "customer-id",
        "productId": "existing-product-id",
        "offeringId": "new-offering-id"
    }
    """
    try:
        order_body = {
            "externalId": payload.get("externalId"),
            "relatedParty": [{"role": "Customer", "id": payload.get("customerId")}],
            "orderItem": [{
                "action": "modify",
                "product": {"id": payload.get("productId")},
                "productOffering": {"id": payload.get("offeringId")}
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TMF_BASE_URL}/tmf-api/productOrdering/v4/productOrder",
                json=order_body,
                headers=HEADERS,
                timeout=30.0
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Order modified successfully: {result.get('id')}")
            
            return {
                "order_id": result.get("id", "order-modified"),
                "status": result.get("state", "acknowledged"),
                "external_id": payload.get("externalId")
            }
            
    except httpx.HTTPError as e:
        logger.error(f"TMF622 API error modifying order: {e}")
        return {
            "order_id": "error",
            "status": "failed", 
            "external_id": payload.get("externalId"),
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error modifying order: {e}")
        return {
            "order_id": "error",
            "status": "failed",
            "external_id": payload.get("externalId"),
            "error": str(e)
        }

async def change_subscription(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Change subscription - wrapper around change_order
    """
    return await change_order(payload)
