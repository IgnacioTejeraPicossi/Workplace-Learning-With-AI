from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
from datetime import datetime

try:
    # Prefer existing motor async client if available in project
    from backend.db import database
    _COL = database.get_collection("agi_progress")
except Exception:
    _COL = None

router = APIRouter(prefix="/api/agi", tags=["AGI Progress"])

DomainKey = Literal["K","RW","M","R","WM","MS","MR","V","A","S"]

class AGIItem(BaseModel):
    model: str = Field(..., examples=["GPT-5"])
    year: int = Field(..., examples=[2025])
    scores: Dict[DomainKey, int]
    total: int = Field(..., ge=0, le=100)
    created_at: Optional[datetime] = None
    notes: Optional[str] = None

DEFAULT_DATA: List[AGIItem] = [
    AGIItem(model="GPT-4", year=2023,
            scores={"K":8,"RW":6,"M":4,"R":0,"WM":2,"MS":0,"MR":4,"V":0,"A":0,"S":3},
            total=27),
    AGIItem(model="GPT-5", year=2025,
            scores={"K":9,"RW":10,"M":10,"R":7,"WM":5,"MS":0,"MR":4,"V":4,"A":6,"S":3},
            total=58),
]

def _ensure_seed():
    if not _COL:
        return
    async def _seed():
        if await _COL.estimated_document_count() == 0:
            await _COL.insert_many([i.model_dump() for i in DEFAULT_DATA])
    return _seed()

@router.get("/progress", response_model=List[AGIItem])
async def get_progress():
    try:
        if _COL:
            await _ensure_seed()
            items = await _COL.find({}, {"_id":0}).to_list(1000)
            return items
    except Exception:
        pass
    return DEFAULT_DATA

@router.post("/progress", response_model=AGIItem)
async def add_progress(item: AGIItem):
    item.created_at = datetime.utcnow()
    try:
        if _COL:
            await _COL.insert_one(item.model_dump())
    except Exception:
        pass
    return item


