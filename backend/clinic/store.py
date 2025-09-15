from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

mongo = AsyncIOMotorClient(os.getenv("MONGO_URI","mongodb://localhost:27017")).app

async def append_turn(run_id:str, turn:Dict, meta:Dict):
    await mongo.clinic_cases.update_one(
        {"run_id":run_id},
        {"$push":{"turns":turn}, "$setOnInsert":{"meta":meta}},
        upsert=True
    )

async def save_findings(run_id:str, report:Dict):
    await mongo.clinic_findings.update_one(
        {"run_id":run_id}, {"$set":report}, upsert=True
    )

async def save_screening(screening: Any, meta: Dict[str, Any]):
    """Save screening results to database"""
    await mongo.robomind_screenings.insert_one({
        "screening": screening.dict(),
        "meta": meta,
        "created_at": datetime.utcnow()
    })

async def save_therapy_plan(plan: Any, profile: Any, context: Dict[str, Any]):
    """Save therapy plan to database"""
    await mongo.robomind_therapies.insert_one({
        "plan": plan.dict(),
        "profile": profile.dict() if profile else None,
        "context": context,
        "created_at": datetime.utcnow()
    })

async def get_dashboard_metrics():
    """Get dashboard metrics for the clinic"""
    # Get screening statistics
    total_screenings = await mongo.robomind_screenings.count_documents({})
    
    # Get axis distribution
    pipeline = [
        {"$unwind": "$screening.axis_scores"},
        {"$group": {"_id": "$screening.axis_scores", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    axis_distribution = await mongo.robomind_screenings.aggregate(pipeline).to_list(None)
    
    # Get top pathologies
    pipeline = [
        {"$unwind": "$screening.top_flags"},
        {"$group": {"_id": "$screening.top_flags.type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_pathologies = await mongo.robomind_screenings.aggregate(pipeline).to_list(None)
    
    return {
        "total_screenings": total_screenings,
        "axis_distribution": {item["_id"]: item["count"] for item in axis_distribution},
        "top_pathologies": [item["_id"] for item in top_pathologies]
    }
