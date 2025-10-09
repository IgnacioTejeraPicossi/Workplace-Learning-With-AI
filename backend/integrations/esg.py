"""
ESG Integration for GRC Agent
Environmental, Social, and Governance metrics
"""

import os
import httpx
from typing import Dict, Any

ESG_BASE_URL = os.getenv("ESG_BASE_URL", "https://esg.example.com")
ESG_BEARER_TOKEN = os.getenv("ESG_BEARER_TOKEN", "token")

HEADERS = {
    "Authorization": f"Bearer {ESG_BEARER_TOKEN}",
    "Content-Type": "application/json"
}

async def recalculate(payload: Dict[str, Any]) -> str:
    """Recalculate ESG metric with new factor"""
    # payload: {metricId: "...", factorId: "...", newFactor: 1.23}
    metric_id = payload.get("metricId")
    factor_id = payload.get("factorId")
    new_factor = payload.get("newFactor")
    
    url = f"{ESG_BASE_URL}/api/metrics/{metric_id}/recalculate"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url, 
            headers=HEADERS, 
            json={
                "factorId": factor_id,
                "newFactor": new_factor,
                "recalculationReason": "GRC Agent - Data quality correction"
            }
        )
        response.raise_for_status()
        return metric_id

async def get_metric(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Get ESG metric details"""
    # payload: {metricId: "..."}
    metric_id = payload.get("metricId")
    
    url = f"{ESG_BASE_URL}/api/metrics/{metric_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.json()

async def update_factor(payload: Dict[str, Any]) -> str:
    """Update ESG calculation factor"""
    # payload: {factorId: "...", newValue: 1.23, reason: "..."}
    factor_id = payload.get("factorId")
    new_value = payload.get("newValue")
    reason = payload.get("reason", "GRC Agent update")
    
    url = f"{ESG_BASE_URL}/api/factors/{factor_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            url, 
            headers=HEADERS, 
            json={
                "value": new_value,
                "updateReason": reason
            }
        )
        response.raise_for_status()
        return factor_id
