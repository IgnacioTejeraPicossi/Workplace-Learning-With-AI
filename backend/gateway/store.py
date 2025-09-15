from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import os

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

async def get_turns(run_id:str, limit:int=12) -> List[Dict]:
    doc = await mongo.clinic_cases.find_one({"run_id":run_id}) or {}
    turns = (doc.get("turns") or [])[-limit:]
    return turns
