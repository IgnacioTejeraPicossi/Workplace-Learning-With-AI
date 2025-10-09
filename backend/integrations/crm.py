"""
CRM Integration for Sales Assistant Agent
Supports Salesforce, Dynamics 365, and HubSpot
"""

import os
import httpx
from typing import Dict, Any, Optional, List

# CRM Provider configuration
CRM_PROVIDER = os.getenv("CRM_PROVIDER", "salesforce")
CRM_BASE_URL = os.getenv("CRM_BASE_URL", "")
CRM_BEARER_TOKEN = os.getenv("CRM_BEARER_TOKEN", "")

async def _make_request(method: str, url: str, data: Optional[Dict] = None) -> Dict[str, Any]:
    """Make authenticated request to CRM"""
    headers = {
        "Authorization": f"Bearer {CRM_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        if method.upper() == "GET":
            response = await client.get(url, headers=headers)
        elif method.upper() == "POST":
            response = await client.post(url, json=data, headers=headers)
        elif method.upper() == "PATCH":
            response = await client.patch(url, json=data, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()

async def update_opportunity(payload: Dict[str, Any]) -> str:
    """Update opportunity in CRM"""
    opportunity_id = payload.get("id")
    if not opportunity_id:
        raise ValueError("Opportunity ID is required")
    
    if CRM_PROVIDER == "salesforce":
        # Salesforce REST API
        url = f"{CRM_BASE_URL}/services/data/v57.0/sobjects/Opportunity/{opportunity_id}"
        data = {}
        
        if payload.get("stage"):
            data["StageName"] = payload["stage"]
        if payload.get("nextStep"):
            data["NextStep"] = payload["nextStep"]
        if payload.get("closeDate"):
            data["CloseDate"] = payload["closeDate"]
        if payload.get("amount"):
            data["Amount"] = payload["amount"]
            
        await _make_request("PATCH", url, data)
        return opportunity_id
        
    elif CRM_PROVIDER == "dynamics":
        # Dynamics 365 Web API
        url = f"{CRM_BASE_URL}/api/data/v9.2/opportunities({opportunity_id})"
        data = {}
        
        if payload.get("stage"):
            data["stageid"] = payload["stage"]
        if payload.get("closeDate"):
            data["estimatedclosedate"] = payload["closeDate"]
        if payload.get("amount"):
            data["estimatedvalue"] = payload["amount"]
            
        await _make_request("PATCH", url, data)
        return opportunity_id
        
    elif CRM_PROVIDER == "hubspot":
        # HubSpot CRM API
        url = f"{CRM_BASE_URL}/crm/v3/objects/deals/{opportunity_id}"
        data = {
            "properties": {}
        }
        
        if payload.get("stage"):
            data["properties"]["dealstage"] = payload["stage"]
        if payload.get("nextStep"):
            data["properties"]["hs_next_step"] = payload["nextStep"]
        if payload.get("closeDate"):
            data["properties"]["closedate"] = payload["closeDate"]
        if payload.get("amount"):
            data["properties"]["amount"] = payload["amount"]
            
        await _make_request("PATCH", url, data)
        return opportunity_id
        
    else:
        raise ValueError(f"Unsupported CRM provider: {CRM_PROVIDER}")

async def create_task(payload: Dict[str, Any]) -> str:
    """Create task in CRM"""
    if CRM_PROVIDER == "salesforce":
        # Salesforce Task creation
        url = f"{CRM_BASE_URL}/services/data/v57.0/sobjects/Task"
        data = {
            "WhatId": payload.get("opportunityId"),
            "Subject": payload.get("subject", "Follow-up"),
            "ActivityDate": payload.get("due")
        }
        
        if payload.get("ownerId"):
            data["OwnerId"] = payload["ownerId"]
            
        result = await _make_request("POST", url, data)
        return result.get("id", "task-created")
        
    elif CRM_PROVIDER == "dynamics":
        # Dynamics 365 Task creation
        url = f"{CRM_BASE_URL}/api/data/v9.2/tasks"
        data = {
            "subject": payload.get("subject", "Follow-up")
        }
        
        if payload.get("due"):
            data["scheduledend"] = payload["due"]
        if payload.get("opportunityId"):
            data["regardingobjectid_opportunity@odata.bind"] = f"/opportunities({payload['opportunityId']})"
            
        result = await _make_request("POST", url, data)
        return result.get("activityid", "task-created")
        
    elif CRM_PROVIDER == "hubspot":
        # HubSpot Task creation
        url = f"{CRM_BASE_URL}/engagements/v1/engagements"
        data = {
            "engagement": {"type": "TASK"},
            "associations": {"dealIds": [payload.get("opportunityId")]},
            "metadata": {
                "subject": payload.get("subject", "Follow-up")
            }
        }
        
        result = await _make_request("POST", url, data)
        return result.get("engagement", {}).get("id", "task-created")
        
    else:
        raise ValueError(f"Unsupported CRM provider: {CRM_PROVIDER}")

async def get_opportunity(opportunity_id: str) -> Dict[str, Any]:
    """Get opportunity details from CRM"""
    if CRM_PROVIDER == "salesforce":
        url = f"{CRM_BASE_URL}/services/data/v57.0/sobjects/Opportunity/{opportunity_id}"
        return await _make_request("GET", url)
        
    elif CRM_PROVIDER == "dynamics":
        url = f"{CRM_BASE_URL}/api/data/v9.2/opportunities({opportunity_id})"
        return await _make_request("GET", url)
        
    elif CRM_PROVIDER == "hubspot":
        url = f"{CRM_BASE_URL}/crm/v3/objects/deals/{opportunity_id}"
        return await _make_request("GET", url)
        
    else:
        raise ValueError(f"Unsupported CRM provider: {CRM_PROVIDER}")

async def list_opportunities(limit: int = 50) -> List[Dict[str, Any]]:
    """List opportunities from CRM"""
    if CRM_PROVIDER == "salesforce":
        url = f"{CRM_BASE_URL}/services/data/v57.0/query/?q=SELECT Id,Name,StageName,Amount,CloseDate FROM Opportunity LIMIT {limit}"
        result = await _make_request("GET", url)
        return result.get("records", [])
        
    elif CRM_PROVIDER == "dynamics":
        url = f"{CRM_BASE_URL}/api/data/v9.2/opportunities?$top={limit}"
        result = await _make_request("GET", url)
        return result.get("value", [])
        
    elif CRM_PROVIDER == "hubspot":
        url = f"{CRM_BASE_URL}/crm/v3/objects/deals?limit={limit}"
        result = await _make_request("GET", url)
        return result.get("results", [])
        
    else:
        raise ValueError(f"Unsupported CRM provider: {CRM_PROVIDER}")
