"""
GRC Store for MongoDB operations
Responsible AI Ops data persistence
"""

from backend.database import database
from datetime import datetime
from typing import List, Dict, Any, Optional

# Collections
grc_objects_collection = database.grc_objects
grc_signals_collection = database.grc_signals
grc_findings_collection = database.grc_findings
grc_actions_collection = database.grc_actions
grc_policies_collection = database.grc_policies

async def save_business_object(obj_data: Dict[str, Any]) -> str:
    """Save business object to MongoDB"""
    obj_data.setdefault("created_at", datetime.utcnow())
    result = await grc_objects_collection.insert_one(obj_data)
    return str(result.inserted_id)

async def save_signal(signal_data: Dict[str, Any]) -> str:
    """Save signal to MongoDB"""
    signal_data.setdefault("created_at", datetime.utcnow())
    result = await grc_signals_collection.insert_one(signal_data)
    return str(result.inserted_id)

async def save_finding(finding_data: Dict[str, Any]) -> str:
    """Save finding to MongoDB"""
    finding_data.setdefault("created_at", datetime.utcnow())
    result = await grc_findings_collection.insert_one(finding_data)
    return str(result.inserted_id)

async def save_action(action_data: Dict[str, Any]) -> str:
    """Save action to MongoDB"""
    action_data.setdefault("created_at", datetime.utcnow())
    result = await grc_actions_collection.insert_one(action_data)
    return str(result.inserted_id)

async def get_recent_findings(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent findings"""
    cursor = grc_findings_collection.find().sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def get_findings_by_status(status: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get findings by status"""
    cursor = grc_findings_collection.find({"status": status}).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def get_findings_by_object(object_id: str) -> List[Dict[str, Any]]:
    """Get findings for specific object"""
    cursor = grc_findings_collection.find({"object_id": object_id}).sort("created_at", -1)
    return [doc async for doc in cursor]

async def update_finding_status(finding_id: str, status: str) -> bool:
    """Update finding status"""
    result = await grc_findings_collection.update_one(
        {"_id": finding_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

async def get_policy_config() -> Dict[str, Any]:
    """Get GRC policy configuration"""
    policy = await grc_policies_collection.find_one({"type": "default"})
    if not policy:
        # Create default policy
        default_policy = {
            "type": "default",
            "max_auto_impact": 1000.0,
            "sod_required_roles": ["controller", "procurement-approver"],
            "confidence_threshold": 0.7,
            "severity_threshold": 0.5,
            "materiality_threshold": 0.3,
            "created_at": datetime.utcnow()
        }
        await grc_policies_collection.insert_one(default_policy)
        return default_policy
    return policy

async def update_policy_config(policy_data: Dict[str, Any]) -> bool:
    """Update GRC policy configuration"""
    result = await grc_policies_collection.update_one(
        {"type": "default"},
        {
            "$set": {
                **policy_data,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    return result.modified_count > 0 or result.upserted_id is not None

async def get_grc_stats() -> Dict[str, Any]:
    """Get GRC agent statistics"""
    total_findings = await grc_findings_collection.count_documents({})
    open_findings = await grc_findings_collection.count_documents({"status": "Open"})
    resolved_findings = await grc_findings_collection.count_documents({"status": "Resolved"})
    total_actions = await grc_actions_collection.count_documents({})
    
    return {
        "total_findings": total_findings,
        "open_findings": open_findings,
        "resolved_findings": resolved_findings,
        "total_actions": total_actions,
        "resolution_rate": resolved_findings / total_findings if total_findings > 0 else 0
    }
