"""
EA insights storage (MongoDB)
"""

from datetime import datetime
from backend.db import database

# EA insights collection
ea_insights_collection = database.get_collection("ea_insights")

async def save_insight(insight: dict):
    """Save a new EA insight"""
    insight["created_at"] = datetime.utcnow()
    await ea_insights_collection.insert_one(insight)

async def recent_insights(limit: int = 50, status: str = None):
    """Get recent insights, optionally filtered by status"""
    query = {"status": status} if status else {}
    cursor = ea_insights_collection.find(query).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def update_insight_status(insight_id: str, status: str):
    """Update insight status (pending, sent, dismissed)"""
    await ea_insights_collection.update_one(
        {"insight_id": insight_id},
        {"$set": {"status": status}}
    )

