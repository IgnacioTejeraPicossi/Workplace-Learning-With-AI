# Humanoid Runs Repository - Data persistence
from typing import Dict, List, Any, Optional
from datetime import datetime
from .mongo_humanoid import get_db
from bson import ObjectId

COLLECTION_NAME = "humanoid_runs"

def _coerce_dt(x: Optional[str]) -> Optional[datetime]:
    """Convert string to datetime, handling ISO format"""
    if not x:
        return None
    try:
        if "T" in x:
            return datetime.fromisoformat(x)
        return datetime.fromisoformat(x + "T00:00:00")
    except Exception:
        return None

def _build_match(filters: Dict[str, Any]) -> Dict[str, Any]:
    """Build MongoDB match query from filters"""
    q: Dict[str, Any] = {}
    
    # Date range
    start = _coerce_dt(filters.get("start"))
    end = _coerce_dt(filters.get("end"))
    if start or end:
        q["created_at"] = {}
        if start: 
            q["created_at"]["$gte"] = start
        if end:   
            q["created_at"]["$lte"] = end

    # Safety status
    safety_ok = filters.get("safety_ok")
    if isinstance(safety_ok, bool):
        q["safety.ok"] = safety_ok

    # Task name (case-insensitive contains)
    task = filters.get("task")
    if task:
        q["plan.task_name"] = {"$regex": task, "$options": "i"}

    # Minimum score
    min_score = filters.get("min_score")
    if min_score is not None:
        q["judge.score"] = {"$gte": float(min_score)}

    # Minor events flag
    only_minor_events = filters.get("only_minor_events")
    if isinstance(only_minor_events, bool) and only_minor_events:
        q["sim.kpis.minor_events"] = {"$gte": 1}

    return q

async def insert_run(run: Dict[str, Any]) -> str:
    """Insert a new run record"""
    try:
        db = get_db()
        if db is None:
            print("⚠️ MongoDB not available, using mock ID")
            return "mock_run_id"
        collection = db[COLLECTION_NAME]
        run["created_at"] = run.get("created_at") or datetime.utcnow()
        result = await collection.insert_one(run)
        return str(result.inserted_id)
    except Exception as e:
        print(f"⚠️ Error inserting run: {e}")
        return "mock_run_id"

async def list_runs_filtered(filters: Dict[str, Any], limit: int = 20, sort_desc: bool = True) -> List[Dict[str, Any]]:
    """Get filtered list of runs with aggregation pipeline"""
    try:
        db = get_db()
        if db is None:
            print("⚠️ MongoDB not available, returning empty list")
            return []
        collection = db[COLLECTION_NAME]
        match = _build_match(filters)
        min_tr = filters.get("min_time_ratio")
        max_tr = filters.get("max_time_ratio")

        pipeline = [
            {"$addFields": {
                "time_ratio": {
                    "$cond": [
                        {"$gt": ["$plan.est_total_seconds", 0]},
                        {"$divide": ["$sim.sim_total_seconds", "$plan.est_total_seconds"]},
                        None
                    ]
                }
            }},
            {"$match": match}
        ]

        # Apply time ratio filters
        tr_cond = []
        if min_tr is not None:
            tr_cond.append({"$gte": ["$time_ratio", float(min_tr)]})
        if max_tr is not None:
            tr_cond.append({"$lte": ["$time_ratio", float(max_tr)]})
        if tr_cond:
            pipeline.append({"$match": {"$expr": {"$and": tr_cond}}})

        pipeline.extend([
            {"$sort": {"created_at": -1 if sort_desc else 1}},
            {"$limit": int(limit)},
            {"$project": {
                "_id": {"$toString": "$_id"},
                "plan": 1, "sim": 1, "safety": 1, "judge": 1,
                "created_at": 1, "time_ratio": 1
            }}
        ])

        docs = await collection.aggregate(pipeline).to_list(length=limit)
        return docs
    except Exception as e:
        print(f"⚠️ Error listing runs: {e}")
        return []

async def get_summary_filtered(filters: Dict[str, Any]) -> Dict[str, Any]:
    """Get aggregated summary of runs"""
    try:
        db = get_db()
        if db is None:
            print("⚠️ MongoDB not available, returning empty summary")
            return {"count": 0, "ok_rate": 0, "avg_score": 0, "avg_time_ratio": 0, "total_minor_events": 0}
        collection = db[COLLECTION_NAME]
        match = _build_match(filters)
        min_tr = filters.get("min_time_ratio")
        max_tr = filters.get("max_time_ratio")

        pipeline = [
            {"$addFields": {
                "time_ratio": {
                    "$cond": [
                        {"$gt": ["$plan.est_total_seconds", 0]},
                        {"$divide": ["$sim.sim_total_seconds", "$plan.est_total_seconds"]},
                        None
                    ]
                }
            }},
            {"$match": match}
        ]

        # Apply time ratio filters
        tr_cond = []
        if min_tr is not None:
            tr_cond.append({"$gte": ["$time_ratio", float(min_tr)]})
        if max_tr is not None:
            tr_cond.append({"$lte": ["$time_ratio", float(max_tr)]})
        if tr_cond:
            pipeline.append({"$match": {"$expr": {"$and": tr_cond}}})

        pipeline.extend([
            {"$project": {
                "ok": {"$ifNull": ["$safety.ok", False]},
                "score": {"$ifNull": ["$judge.score", 0]},
                "sim_total": {"$ifNull": ["$sim.sim_total_seconds", 0]},
                "est_total": {"$ifNull": ["$plan.est_total_seconds", 0]},
                "minor_events": {"$ifNull": ["$sim.kpis.minor_events", 0]},
                "time_ratio": 1
            }},
            {"$group": {
                "_id": None,
                "count": {"$sum": 1},
                "ok_rate": {"$avg": {"$cond": ["$ok", 1, 0]}},
                "avg_score": {"$avg": "$score"},
                "avg_time_ratio": {"$avg": "$time_ratio"},
                "total_minor_events": {"$sum": "$minor_events"}
            }}
        ])

        result = await collection.aggregate(pipeline).to_list(length=1)
        if not result:
            return {
                "count": 0, "ok_rate": 0, "avg_score": 0, 
                "avg_time_ratio": 0, "total_minor_events": 0
            }
        
        out = result[0]
        out.pop("_id", None)
        
        # Round for UI display
        for k in ("ok_rate", "avg_score", "avg_time_ratio"):
            v = out.get(k, 0) or 0
            out[k] = round(v, 3)
        
        return out
    except Exception as e:
        print(f"⚠️ Error getting summary: {e}")
        return {"count": 0, "ok_rate": 0, "avg_score": 0, "avg_time_ratio": 0, "total_minor_events": 0}

async def get_run_by_id(run_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific run by ID"""
    try:
        db = get_db()
        collection = db[COLLECTION_NAME]
        result = await collection.find_one({"_id": ObjectId(run_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result
    except Exception:
        return None

async def delete_run(run_id: str) -> bool:
    """Delete a run by ID"""
    try:
        db = get_db()
        collection = db[COLLECTION_NAME]
        result = await collection.delete_one({"_id": ObjectId(run_id)})
        return result.deleted_count > 0
    except Exception:
        return False
