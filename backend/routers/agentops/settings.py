# AgentOps Studio - Settings Router
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, Any
from bson import ObjectId
from db import database
from services.agentops.schemas import StudioSettings

router = APIRouter(tags=["settings"])

COLL = "studio_settings"
DOC_ID = "global"  # single-document config

def _clean(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc: return {}
    doc["_id"] = str(doc["_id"])
    return doc

async def _ensure_doc():
    db = database
    d = await db[COLL].find_one({"_id": DOC_ID})
    if d: return d
    # create with defaults
    defaults = StudioSettings().dict()
    defaults.update({"_id": DOC_ID, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()})
    await db[COLL].insert_one(defaults)
    return await db[COLL].find_one({"_id": DOC_ID})

@router.get("")
async def get_settings():
    d = await _ensure_doc()
    return _clean(d)

@router.put("")
async def put_settings(payload: Dict[str, Any]):
    # full replace (except metadata)
    try:
        StudioSettings(**payload)  # validate
    except Exception as e:
        raise HTTPException(422, f"Invalid settings: {e}")
    db = database
    payload["_id"] = DOC_ID
    payload["updated_at"] = datetime.utcnow()
    await db[COLL].update_one({"_id": DOC_ID}, {"$set": payload}, upsert=True)
    return await get_settings()

@router.patch("")
async def patch_settings(patch: Dict[str, Any]):
    # partial update
    try:
        # validate only provided fields by constructing a model with subset
        StudioSettings(**{k: v for k, v in patch.items() if k in StudioSettings.__fields__})
    except Exception as e:
        raise HTTPException(422, f"Invalid settings: {e}")
    db = database
    await _ensure_doc()
    patch["updated_at"] = datetime.utcnow()
    await db[COLL].update_one({"_id": DOC_ID}, {"$set": patch})
    return await get_settings()

@router.get("/_ping")
def settings_ping():
    return {"ok": True, "module": "settings"}