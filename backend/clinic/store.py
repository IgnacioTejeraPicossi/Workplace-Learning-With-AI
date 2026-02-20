from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta

from .pii import scrub_pii_deep

mongo = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017")).app

# A3: Retention config (days). Raw screenings/therapies; metrics aggregated from screenings.
RETENTION_DAYS_RAW = int(os.getenv("ROBOMIND_RETENTION_DAYS_RAW", "30"))
RETENTION_DAYS_THERAPIES = int(os.getenv("ROBOMIND_RETENTION_DAYS_THERAPIES", "30"))

async def append_turn(run_id: str, turn: Dict, meta: Dict, anonymize_pii: bool = False):
    if anonymize_pii:
        turn = scrub_pii_deep(turn)
        meta = scrub_pii_deep(meta)
    await mongo.clinic_cases.update_one(
        {"run_id": run_id},
        {"$push": {"turns": turn}, "$setOnInsert": {"meta": meta}},
        upsert=True
    )

async def save_findings(run_id: str, report: Dict, anonymize_pii: bool = False):
    if anonymize_pii:
        report = scrub_pii_deep(report)
    await mongo.clinic_findings.update_one(
        {"run_id": run_id}, {"$set": report}, upsert=True
    )

async def save_screening(screening: Any, meta: Dict[str, Any], anonymize_pii: bool = False):
    """Save screening results to database. When anonymize_pii=True, PII in screening and meta is scrubbed."""
    screening_dict = screening.model_dump()
    meta_copy = dict(meta) if meta else {}
    if anonymize_pii:
        screening_dict = scrub_pii_deep(screening_dict)
        meta_copy = scrub_pii_deep(meta_copy)
    await mongo.robomind_screenings.insert_one({
        "screening": screening_dict,
        "meta": meta_copy,
        "created_at": datetime.utcnow()
    })

async def save_therapy_plan(plan: Any, profile: Any, context: Dict[str, Any], anonymize_pii: bool = False):
    """Save therapy plan to database. When anonymize_pii=True, PII in plan, profile, context is scrubbed."""
    plan_dict = plan.model_dump()
    profile_dict = profile.model_dump() if profile else None
    context_copy = dict(context) if context else {}
    if anonymize_pii:
        plan_dict = scrub_pii_deep(plan_dict)
        profile_dict = scrub_pii_deep(profile_dict) if profile_dict is not None else None
        context_copy = scrub_pii_deep(context_copy)
    await mongo.robomind_therapies.insert_one({
        "plan": plan_dict,
        "profile": profile_dict,
        "context": context_copy,
        "created_at": datetime.utcnow()
    })

async def cleanup_old_screenings(days: Optional[int] = None) -> int:
    """Delete screenings older than `days`. Uses RETENTION_DAYS_RAW if days not given. Returns deleted count."""
    d = days if days is not None else RETENTION_DAYS_RAW
    cutoff = datetime.utcnow() - timedelta(days=d)
    result = await mongo.robomind_screenings.delete_many({"created_at": {"$lt": cutoff}})
    return result.deleted_count

async def cleanup_old_therapies(days: Optional[int] = None) -> int:
    """Delete therapies older than `days`. Uses RETENTION_DAYS_THERAPIES if days not given. Returns deleted count."""
    d = days if days is not None else RETENTION_DAYS_THERAPIES
    cutoff = datetime.utcnow() - timedelta(days=d)
    result = await mongo.robomind_therapies.delete_many({"created_at": {"$lt": cutoff}})
    return result.deleted_count

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
