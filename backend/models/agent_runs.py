from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime

# Attestation model for execution receipts
class Attestation(BaseModel):
    """Execution receipt for agent runs"""
    bundle_hash: str         # SHA-256 of canonical Action Bundle
    receipt_hash: str        # SHA-256 of the receipt object
    signed_by: str           # Service name that signed the receipt
    algorithm: str = "SHA256"
    hmac_signature: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Pydantic model for reads/writes
class AgentRun(BaseModel):
    run_id: str
    module: Literal["compliance", "productivity"]
    topic: str
    status: Literal["QUEUED","RUNNING","DONE","FAILED"] = "QUEUED"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    artifacts: Dict[str, Any] = {}  # e.g., {"jira":["LEARN-101","LEARN-102"], "slack":"ts123", "sheets":"url"}
    error: Optional[str] = None
    bundle_hash: Optional[str] = None  # Hash of the action bundle for attestation
    attestation: Optional[Attestation] = None  # Execution receipt

# Minimal persistence helpers (Motor or PyMongo—example with Motor)
from motor.motor_asyncio import AsyncIOMotorClient
import os

_mongo = AsyncIOMotorClient(os.getenv("MONGO_URI","mongodb://localhost:27017"))
db = _mongo[os.getenv("MONGO_DB","app")]
runs = db["agent_runs"]

async def save_run(doc: AgentRun):
    await runs.update_one({"run_id": doc.run_id},
                          {"$set": doc.model_dump()},
                          upsert=True)

async def update_run(run_id: str, **patch):
    patch["updated_at"] = datetime.utcnow()
    await runs.update_one({"run_id": run_id}, {"$set": patch})

async def list_runs(module: Optional[str] = None, limit: int = 50):
    q = {"module": module} if module else {}
    cur = runs.find(q).sort("created_at", -1).limit(limit)
    results = []
    async for doc in cur:
        # Convert ObjectId to string for JSON serialization
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
