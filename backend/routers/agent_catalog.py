"""
Agent Catalog API
Serves reusable agent descriptors with MCP endpoints
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
import os
from typing import List, Dict, Any

router = APIRouter(prefix="/api/agents", tags=["Agent Catalog"])

# Get catalog directory from environment or use default
CATALOG_DIR = Path(os.getenv("AGENT_CATALOG_DIR", "./configs/agents"))

@router.get("/catalog")
async def get_agent_catalog():
    """
    Get all available agent descriptors from the catalog
    """
    items = []
    
    if not CATALOG_DIR.exists():
        return {"items": items, "message": "Agent catalog directory not found"}
    
    try:
        for file_path in CATALOG_DIR.glob("*.json"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    agent_descriptor = json.load(f)
                    items.append(agent_descriptor)
            except Exception as e:
                # Skip bad files but log the error
                items.append({
                    "id": file_path.stem, 
                    "error": f"Failed to load: {str(e)}",
                    "name": f"Invalid Agent ({file_path.stem})"
                })
        
        return {
            "items": items,
            "total": len(items),
            "catalog_dir": str(CATALOG_DIR)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load agent catalog: {str(e)}")

@router.get("/catalog/{agent_id}")
async def get_agent_descriptor(agent_id: str):
    """
    Get specific agent descriptor by ID
    """
    agent_file = CATALOG_DIR / f"{agent_id}.json"
    
    if not agent_file.exists():
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    try:
        with open(agent_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load agent descriptor: {str(e)}")

@router.get("/capabilities")
async def get_all_capabilities():
    """
    Get all unique capabilities across all agents
    """
    catalog_response = await get_agent_catalog()
    capabilities = set()
    
    for agent in catalog_response["items"]:
        if "capabilities" in agent and isinstance(agent["capabilities"], list):
            capabilities.update(agent["capabilities"])
    
    return {
        "capabilities": sorted(list(capabilities)),
        "total": len(capabilities)
    }

@router.get("/mcp-endpoints")
async def get_mcp_endpoints():
    """
    Get all MCP endpoints for agent discovery
    """
    catalog_response = await get_agent_catalog()
    endpoints = []
    
    for agent in catalog_response["items"]:
        if "mcp" in agent and "endpoint" in agent["mcp"]:
            endpoints.append({
                "agent_id": agent.get("id"),
                "agent_name": agent.get("name"),
                "mcp_endpoint": agent["mcp"]["endpoint"],
                "tools": agent.get("mcp", {}).get("tools", [])
            })
    
    return {
        "endpoints": endpoints,
        "total": len(endpoints)
    }

