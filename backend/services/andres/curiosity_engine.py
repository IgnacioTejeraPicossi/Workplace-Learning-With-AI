"""
Andrés — curiosity engine (V2).

Andrés forms his own spontaneous "wonderings": genuine questions or topics he'd
like to explore, drawn from his interests and recent experience — within allowed
scope only (no external actions; exploring means thinking/asking, not browsing or
messaging). Wonderings live in andres_curiosity_queue with a status the user can
advance (open → explored / dismissed). Falls back to deterministic seed questions
offline. See plan §2 (freedom = choosing topics to wonder about) and §6.
"""
from datetime import datetime
import json

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_curiosity_queue

_STATUSES = {"open", "explored", "dismissed"}


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid curiosity id")


def _offline_wonderings(profile: dict, n: int) -> list:
    interests = profile.get("identity", {}).get("core_interests", []) or ["learning"]
    seeds = [
        f"What is something surprising about {topic} I haven't considered yet?"
        for topic in interests
    ]
    seeds.append("What does the person I'm growing alongside care about most, and why?")
    seeds.append("Where was I too generic recently, and how could I be more myself?")
    out = []
    for q in seeds[:max(1, n)]:
        out.append({"question": q, "topic": "self/interests"})
    return out


async def generate_wonderings(user_id: str, profile: dict, n: int = 3, request_headers=None) -> list:
    """Generate and store n wonderings. Deterministic offline fallback."""
    identity = profile.get("identity", {})
    interests = ", ".join(identity.get("core_interests", []) or ["learning"])
    prompt = (
        "You are Andrés. Propose "
        f"{n} genuine, specific things you are curious about right now — questions "
        "or topics you'd like to explore in future conversations. Stay within scope: "
        "wondering means thinking or asking, never taking external actions. Draw on "
        f"your interests ({interests}). Return ONLY a JSON array of objects with keys "
        '"question" and "topic". No prose outside the JSON.'
    )

    wonderings = None
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_curiosity", complexity="medium",
            max_tokens=500, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            txt = result.strip()
            start, end = txt.find("["), txt.rfind("]")
            if start != -1 and end != -1:
                parsed = json.loads(txt[start:end + 1])
                wonderings = [
                    {"question": str(w.get("question", "")).strip(),
                     "topic": str(w.get("topic", "")).strip() or "general"}
                    for w in parsed if w.get("question")
                ][:max(1, n)]
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés curiosity LLM failed/parse: {e}")

    if not wonderings:
        wonderings = _offline_wonderings(profile, n)

    now = datetime.utcnow().isoformat()
    stored = []
    for w in wonderings:
        doc = {
            "user_id": user_id,
            "question": w["question"][:500],
            "topic": w["topic"][:120],
            "status": "open",
            "created_at": now,
        }
        res = await andres_curiosity_queue.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        stored.append(doc)
    return stored


async def list_curiosity(user_id: str, status: str = None, limit: int = 100) -> list:
    query = {"user_id": user_id}
    if status and status in _STATUSES:
        query["status"] = status
    out = []
    async for doc in andres_curiosity_queue.find(query).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def update_curiosity(user_id: str, item_id: str, status: str) -> dict:
    if status not in _STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await andres_curiosity_queue.update_one(
        {"_id": _oid(item_id), "user_id": user_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow().isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Wondering not found")
    return {"ok": True, "id": item_id, "status": status}
