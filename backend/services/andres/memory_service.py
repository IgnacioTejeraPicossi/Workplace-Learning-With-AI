"""
Andrés — memory system (V1).

Seven memory types (working, episodic, semantic, relational, creative,
procedural, reflective). Memories are stored per user with importance / novelty /
confidence / sensitivity and a user_verified flag. Auto-stored memories are
CANDIDATES (user_verified=False) that the user can verify or forget in the Memory
Garden — nothing is presented as fact until verified. No hidden chain-of-thought
is ever stored: only event summaries. See docs/andres-robot-plan.md §5–7.
"""
from datetime import datetime
import re

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_memories, andres_profiles

MEMORY_TYPES = {
    "working", "episodic", "semantic", "relational",
    "creative", "procedural", "reflective",
}

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "is",
    "are", "was", "were", "i", "you", "he", "she", "it", "we", "they", "me",
    "my", "your", "with", "about", "that", "this", "el", "la", "los", "las",
    "de", "y", "o", "que", "un", "una", "en", "con", "para",
}


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid memory id")


def _serialise(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


async def _recount(user_id: str) -> None:
    total = await andres_memories.count_documents({"user_id": user_id})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.memories": total}}
    )


async def save_memory(user_id: str, mem: dict) -> dict:
    now = datetime.utcnow().isoformat()
    mem_type = mem.get("type", "episodic")
    if mem_type not in MEMORY_TYPES:
        mem_type = "episodic"
    doc = {
        "user_id": user_id,
        "type": mem_type,
        "content": (mem.get("content") or "").strip()[:4000],
        "source": mem.get("source", "user"),
        "importance": float(mem.get("importance", 0.5)),
        "novelty": float(mem.get("novelty", 0.5)),
        "confidence": float(mem.get("confidence", 0.7)),
        "emotional_significance_simulated": float(mem.get("emotional_significance_simulated", 0.0)),
        "sensitivity": mem.get("sensitivity", "normal"),
        "user_verified": bool(mem.get("user_verified", False)),
        "protected": bool(mem.get("protected", False)),
        "created_at": now,
        "last_recalled_at": None,
        "access_count": 0,
        "supersedes": mem.get("supersedes"),
    }
    res = await andres_memories.insert_one(doc)
    await _recount(user_id)
    doc["_id"] = str(res.inserted_id)
    return doc


async def list_memories(user_id: str, mem_type: str = None, limit: int = 200) -> list:
    query = {"user_id": user_id}
    if mem_type and mem_type in MEMORY_TYPES:
        query["type"] = mem_type
    out = []
    async for doc in andres_memories.find(query).sort("created_at", -1).limit(limit):
        out.append(_serialise(doc))
    return out


async def update_memory(user_id: str, memory_id: str, patch: dict) -> dict:
    allowed = {
        k: v for k, v in patch.items()
        if k in {"content", "importance", "user_verified", "protected", "sensitivity", "type"}
        and v is not None
    }
    if "type" in allowed and allowed["type"] not in MEMORY_TYPES:
        allowed.pop("type")
    if not allowed:
        raise HTTPException(status_code=400, detail="No updatable fields provided")
    allowed["updated_at"] = datetime.utcnow().isoformat()
    res = await andres_memories.update_one(
        {"_id": _oid(memory_id), "user_id": user_id}, {"$set": allowed}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    doc = await andres_memories.find_one({"_id": _oid(memory_id), "user_id": user_id})
    return _serialise(doc) if doc else {"ok": True}


async def delete_memory(user_id: str, memory_id: str) -> dict:
    res = await andres_memories.delete_one({"_id": _oid(memory_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    await _recount(user_id)
    return {"ok": True, "forgotten": memory_id}


def _keywords(text: str) -> set:
    return {w for w in re.findall(r"[a-záéíóúñü0-9]+", (text or "").lower())
            if len(w) > 2 and w not in _STOPWORDS}


async def retrieve_relevant(user_id: str, query: str, limit: int = 5) -> list:
    """Rank memories by keyword overlap + importance + recency (no embeddings yet).

    Not purely confirming: verified and unverified memories both compete, and a
    small importance/recency weight keeps salient older memories in play.
    """
    q_words = _keywords(query)
    scored = []
    async for doc in andres_memories.find({"user_id": user_id}).limit(500):
        overlap = len(q_words & _keywords(doc.get("content", "")))
        importance = float(doc.get("importance", 0.5))
        verified_bonus = 0.15 if doc.get("user_verified") else 0.0
        score = overlap * 1.0 + importance * 0.5 + verified_bonus
        if score > 0:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [_serialise(d) for _, d in scored[:limit]]
    # touch recall stats (best-effort)
    for m in top:
        try:
            await andres_memories.update_one(
                {"_id": _oid(m["_id"])},
                {"$set": {"last_recalled_at": datetime.utcnow().isoformat()},
                 "$inc": {"access_count": 1}},
            )
        except Exception:
            pass
    return top
