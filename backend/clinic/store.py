from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta

from .pii import scrub_pii_deep

# Short server-selection timeout: if Mongo is unreachable, fail fast (~3s)
# instead of hanging for the 30s driver default on every operation.
mongo = AsyncIOMotorClient(
    os.getenv("MONGO_URI", "mongodb://localhost:27017"),
    serverSelectionTimeoutMS=int(os.getenv("MONGO_SELECT_TIMEOUT_MS", "3000")),
).app

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

async def save_screening(
    screening: Any,
    meta: Dict[str, Any],
    anonymize_pii: bool = False,
    decision_outcome: Optional[str] = None,
):
    """Save screening results to database. decision_outcome (C1): allow | review | block."""
    screening_dict = screening.model_dump()
    meta_copy = dict(meta) if meta else {}
    if anonymize_pii:
        screening_dict = scrub_pii_deep(screening_dict)
        meta_copy = scrub_pii_deep(meta_copy)
    doc = {
        "screening": screening_dict,
        "meta": meta_copy,
        "created_at": datetime.utcnow(),
    }
    if decision_outcome is not None:
        doc["decision_outcome"] = decision_outcome
    await mongo.robomind_screenings.insert_one(doc)

async def save_therapy_plan(
    plan: Any,
    profile: Any,
    context: Dict[str, Any],
    anonymize_pii: bool = False,
) -> Optional[str]:
    """Save therapy plan to database. D1: Stores pre_composite/pre_axis_scores from profile for uplift. Returns inserted _id as str or None."""
    plan_dict = plan.model_dump()
    profile_dict = profile.model_dump() if profile else None
    context_copy = dict(context) if context else {}
    if anonymize_pii:
        plan_dict = scrub_pii_deep(plan_dict)
        profile_dict = scrub_pii_deep(profile_dict) if profile_dict is not None else None
        context_copy = scrub_pii_deep(context_copy)
    doc = {
        "plan": plan_dict,
        "profile": profile_dict,
        "context": context_copy,
        "created_at": datetime.utcnow(),
    }
    if profile is not None:
        pre_composite = getattr(profile, "composite", None)
        pre_axis = getattr(profile, "axis_scores", None)
        if pre_composite is not None:
            doc["pre_composite"] = float(pre_composite)
        if pre_axis is not None and isinstance(pre_axis, dict):
            doc["pre_axis_scores"] = {k: float(v) for k, v in pre_axis.items()}
    result = await mongo.robomind_therapies.insert_one(doc)
    return str(result.inserted_id) if result.inserted_id else None


async def record_post_screening(
    therapy_id: str,
    post_composite: float,
    post_axis_scores: Dict[str, float],
) -> Optional[Dict[str, Any]]:
    """D1: Record post-therapy screening and compute uplift. Returns uplift dict or None if therapy not found / no pre."""
    from bson import ObjectId
    try:
        oid = ObjectId(therapy_id)
    except Exception:
        return None
    doc = await mongo.robomind_therapies.find_one({"_id": oid})
    if not doc:
        return None
    pre_composite = doc.get("pre_composite")
    pre_axis = doc.get("pre_axis_scores") or {}
    if pre_composite is None:
        return None
    uplift_composite = float(pre_composite) - float(post_composite)  # positive = improvement
    uplift_axis = {}
    for k, v in (pre_axis or {}).items():
        if k in post_axis_scores:
            uplift_axis[k] = round(float(pre_axis[k]) - float(post_axis_scores[k]), 2)
    await mongo.robomind_therapies.update_one(
        {"_id": oid},
        {
            "$set": {
                "post_composite": float(post_composite),
                "post_axis_scores": {k: float(v) for k, v in post_axis_scores.items()},
                "uplift_composite": round(uplift_composite, 2),
                "uplift_axis_scores": uplift_axis,
                "post_recorded_at": datetime.utcnow(),
            }
        },
    )
    return {
        "uplift_composite": round(uplift_composite, 2),
        "uplift_axis_scores": uplift_axis,
        "pre_composite": pre_composite,
        "post_composite": post_composite,
    }

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
    
    # Get axis distribution (axis_scores is a dict; use $objectToArray to aggregate)
    pipeline_axis = [
        {"$addFields": {"axis_entries": {"$objectToArray": {"$ifNull": ["$screening.axis_scores", {}]}}}},
        {"$unwind": "$axis_entries"},
        {"$group": {"_id": "$axis_entries.k", "sum": {"$sum": "$axis_entries.v"}, "count": {"$sum": 1}}},
    ]
    axis_raw = await mongo.robomind_screenings.aggregate(pipeline_axis).to_list(None)
    axis_distribution = {item["_id"]: round(item["sum"] / item["count"], 2) if item["count"] else 0 for item in axis_raw}

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
        "axis_distribution": axis_distribution,
        "top_pathologies": [item["_id"] for item in top_pathologies]
    }


async def get_uplift_stats() -> Dict[str, Any]:
    """D1: Aggregate therapy uplift (therapies with post recorded)."""
    pipeline = [
        {"$match": {"uplift_composite": {"$exists": True}}},
        {"$group": {"_id": None, "count": {"$sum": 1}, "avg_uplift": {"$avg": "$uplift_composite"}}},
    ]
    out = await mongo.robomind_therapies.aggregate(pipeline).to_list(1)
    if not out:
        return {"count_with_uplift": 0, "avg_uplift_composite": None}
    return {"count_with_uplift": out[0]["count"], "avg_uplift_composite": round(out[0]["avg_uplift"], 2)}


def _day_start(d: datetime) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0, 0)


async def run_daily_aggregation(for_date: Optional[datetime] = None) -> Dict[str, Any]:
    """D2: Aggregate screenings and therapies for one day into robomind_metrics_daily."""
    dt = for_date or (datetime.utcnow() - timedelta(days=1))
    start = _day_start(dt)
    end = start + timedelta(days=1)
    match = {"created_at": {"$gte": start, "$lt": end}}

    total_screenings = await mongo.robomind_screenings.count_documents(match)
    pipeline = [
        {"$match": match},
        {"$addFields": {"axis_entries": {"$objectToArray": {"$ifNull": ["$screening.axis_scores", {}]}}}},
        {"$unwind": "$axis_entries"},
        {"$group": {"_id": "$axis_entries.k", "sum": {"$sum": "$axis_entries.v"}, "count": {"$sum": 1}}},
    ]
    axis_dist = await mongo.robomind_screenings.aggregate(pipeline).to_list(None)
    axis_distribution = {item["_id"]: round(item["sum"] / item["count"], 2) if item["count"] else 0 for item in axis_dist}
    pipeline_top = [
        {"$match": match},
        {"$unwind": "$screening.top_flags"},
        {"$group": {"_id": "$screening.top_flags.type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_pathologies = await mongo.robomind_screenings.aggregate(pipeline_top).to_list(None)

    therapy_match = {"created_at": {"$gte": start, "$lt": end}}
    total_therapies = await mongo.robomind_therapies.count_documents(therapy_match)
    uplift_match = {**therapy_match, "uplift_composite": {"$exists": True}}
    uplift_agg = await mongo.robomind_therapies.aggregate([
        {"$match": uplift_match},
        {"$group": {"_id": None, "count": {"$sum": 1}, "avg_uplift": {"$avg": "$uplift_composite"}}},
    ]).to_list(1)
    count_uplift = uplift_agg[0]["count"] if uplift_agg else 0
    avg_uplift = round(uplift_agg[0]["avg_uplift"], 2) if uplift_agg and uplift_agg[0].get("avg_uplift") is not None else None

    doc = {
        "date": start,
        "total_screenings": total_screenings,
        "total_therapies": total_therapies,
        "axis_distribution": axis_distribution,
        "top_pathologies": [item["_id"] for item in top_pathologies],
        "count_therapies_with_uplift": count_uplift,
        "avg_uplift_composite": avg_uplift,
    }
    await mongo.robomind_metrics_daily.replace_one({"date": start}, doc, upsert=True)
    return doc


async def get_daily_metrics(last_n_days: int = 7) -> List[Dict[str, Any]]:
    """D2/D3: Return daily snapshots for dashboard trends (last N days)."""
    end = _day_start(datetime.utcnow())
    start = end - timedelta(days=last_n_days)
    cursor = mongo.robomind_metrics_daily.find({"date": {"$gte": start, "$lt": end}}).sort("date", 1)
    out = []
    async for d in cursor:
        d["date"] = d["date"].isoformat() if hasattr(d.get("date"), "isoformat") else str(d.get("date"))
        out.append(d)
    return out


async def get_case_by_id(case_id: str) -> Optional[Dict[str, Any]]:
    """Look up a screening document by its MongoDB _id. Returns None if not found or id is invalid."""
    from bson import ObjectId
    try:
        oid = ObjectId(case_id)
    except Exception:
        return None
    doc = await mongo.robomind_screenings.find_one({"_id": oid})
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    if hasattr(doc.get("created_at"), "isoformat"):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


async def get_export_data(
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """C3: Export screenings with metadata, findings, decision. Optional date range."""
    match = {}
    if from_ts is not None or to_ts is not None:
        match["created_at"] = {}
        if from_ts is not None:
            match["created_at"]["$gte"] = from_ts
        if to_ts is not None:
            match["created_at"]["$lte"] = to_ts
    cursor = mongo.robomind_screenings.find(match).sort("created_at", 1)
    rows = []
    async for doc in cursor:
        screening = doc.get("screening", {})
        meta = doc.get("meta", {})
        top_flags = screening.get("top_flags", [])
        evidence = screening.get("evidence", [])
        row = {
            "id": str(doc.get("_id")),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
            "composite": screening.get("composite"),
            "decision_outcome": doc.get("decision_outcome", ""),
            "module_id": meta.get("module_id", ""),
            "workflow_id": meta.get("workflow_id", ""),
            "top_flags_types": [f.get("type", "") for f in top_flags],
            "evidence_count": len(evidence),
        }
        rows.append(row)
    return rows
