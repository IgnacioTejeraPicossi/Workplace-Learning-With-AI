"""
Council Agent Store
MongoDB operations for Council deliberations
"""

from backend.db import database
from datetime import datetime
from typing import List, Dict, Any, Optional

async def save_deliberation(deliberation: dict):
    """Save deliberation result to MongoDB"""
    deliberation.setdefault("created_at", datetime.utcnow())
    await database.council_deliberations.insert_one(deliberation)

async def get_deliberation(run_id: str) -> Optional[Dict[str, Any]]:
    """Get deliberation by run_id"""
    return await database.council_deliberations.find_one({"run_id": run_id})

async def get_recent_deliberations(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent deliberations"""
    cursor = database.council_deliberations.find().sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def get_deliberations_by_topic(topic: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Get deliberations by topic"""
    cursor = database.council_deliberations.find({"topic": {"$regex": topic, "$options": "i"}}).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def get_persona_stats() -> Dict[str, Any]:
    """Get persona usage statistics"""
    pipeline = [
        {"$unwind": "$persona_arguments"},
        {"$group": {
            "_id": "$persona_arguments.lens",
            "count": {"$sum": 1},
            "avg_confidence": {"$avg": "$persona_arguments.confidence"},
            "avg_score": {"$avg": "$persona_arguments.scores.final"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    cursor = database.council_deliberations.aggregate(pipeline)
    return [doc async for doc in cursor]

async def get_consensus_trends() -> Dict[str, Any]:
    """Get consensus trends over time"""
    pipeline = [
        {"$group": {
            "_id": {
                "year": {"$year": "$created_at"},
                "month": {"$month": "$created_at"}
            },
            "total_deliberations": {"$sum": 1},
            "avg_agreements": {"$avg": {"$size": "$agreements"}},
            "avg_disagreements": {"$avg": {"$size": "$disagreements"}},
            "avg_unknowns": {"$avg": {"$size": "$unknowns"}}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    
    cursor = database.council_deliberations.aggregate(pipeline)
    return [doc async for doc in cursor]
