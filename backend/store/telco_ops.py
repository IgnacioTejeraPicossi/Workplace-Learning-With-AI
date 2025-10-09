"""
Telco Ops Store
MongoDB operations for telco ops agent
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from ..database import database

# Collections
ops_recommendations_collection = database.ops_recommendations
ops_signals_collection = database.ops_signals
ops_customers_collection = database.ops_customers
ops_policies_collection = database.ops_policies

async def save_recommendation(recommendation: Dict[str, Any]) -> str:
    """Save a recommendation to the database"""
    recommendation.setdefault("created_at", datetime.utcnow())
    recommendation.setdefault("updated_at", datetime.utcnow())
    
    result = await ops_recommendations_collection.insert_one(recommendation)
    return str(result.inserted_id)

async def get_recommendations(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Get recommendations with optional filters"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    
    cursor = ops_recommendations_collection.find(query).sort("created_at", -1).limit(limit)
    recommendations = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for rec in recommendations:
        rec["_id"] = str(rec["_id"])
    
    return recommendations

async def update_recommendation(recommendation_id: str, updates: Dict[str, Any]) -> bool:
    """Update a recommendation"""
    updates["updated_at"] = datetime.utcnow()
    
    result = await ops_recommendations_collection.update_one(
        {"_id": recommendation_id},
        {"$set": updates}
    )
    return result.modified_count > 0

async def save_signal(signal: Dict[str, Any]) -> str:
    """Save a signal to the database"""
    signal.setdefault("created_at", datetime.utcnow())
    
    result = await ops_signals_collection.insert_one(signal)
    return str(result.inserted_id)

async def get_signals(
    signal_type: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Get signals with optional filters"""
    query = {}
    if signal_type:
        query["type"] = signal_type
    if source:
        query["source"] = source
    
    cursor = ops_signals_collection.find(query).sort("occurred_at", -1).limit(limit)
    signals = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for signal in signals:
        signal["_id"] = str(signal["_id"])
    
    return signals

async def save_customer_context(customer_context: Dict[str, Any]) -> str:
    """Save customer context information"""
    customer_context.setdefault("updated_at", datetime.utcnow())
    
    # Upsert based on customer_id
    result = await ops_customers_collection.update_one(
        {"customer_id": customer_context["customer_id"]},
        {"$set": customer_context},
        upsert=True
    )
    
    if result.upserted_id:
        return str(result.upserted_id)
    else:
        # Return existing customer_id
        return customer_context["customer_id"]

async def get_customer_context(customer_id: str) -> Optional[Dict[str, Any]]:
    """Get customer context by customer_id"""
    customer = await ops_customers_collection.find_one({"customer_id": customer_id})
    
    if customer:
        customer["_id"] = str(customer["_id"])
    
    return customer

async def get_policy_config() -> Dict[str, Any]:
    """Get policy configuration"""
    policy = await ops_policies_collection.find_one({"type": "main"})
    
    if not policy:
        # Return default policy
        default_policy = {
            "max_auto_value": 50.0,
            "confidence_threshold": 0.7,
            "risk_threshold": 70.0,
            "required_approval_roles": ["ops-supervisor"]
        }
        await ops_policies_collection.insert_one({
            "type": "main",
            "config": default_policy,
            "created_at": datetime.utcnow()
        })
        return default_policy
    
    return policy.get("config", {})

async def update_policy_config(config: Dict[str, Any]) -> bool:
    """Update policy configuration"""
    result = await ops_policies_collection.update_one(
        {"type": "main"},
        {
            "$set": {
                "config": config,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    return result.modified_count > 0 or result.upserted_id is not None
