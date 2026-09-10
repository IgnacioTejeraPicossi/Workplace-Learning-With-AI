"""
Andrés — memory consolidation (audit P3).

Over time a biography accumulates many small, rarely-recalled episodic memories.
Consolidation folds an old cluster of them into ONE semantic memory that captures
their gist — so recall stays sharp as the memory grows.

Honesty & consent (constitution):
  • Consent-first: consolidation is a PROPOSAL. Nothing changes until the user
    approves it; they see exactly which memories it would fold in.
  • Grounded, never fabricated: the summary is written only from the actual memory
    contents; the new memory records `supersedes` = the source ids.
  • Reversible, nothing hidden: on approval the source memories are ARCHIVED
    (`archived: True`, `consolidated_into`), NOT deleted — they can be restored.

Mock-first: works with no LLM (deterministic offline summary), same `is_mock`
contract as the rest of the module.
"""
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException

from backend.db import andres_memories, andres_memory_consolidations, andres_profiles
from backend.services.andres import semantic_memory

# A cluster smaller than this isn't worth consolidating.
_MIN_CLUSTER = 3
_MAX_CANDIDATES = 8


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")


def _offline_summary(cluster: list) -> str:
    themes = "; ".join((d.get("content") or "").strip()[:60] for d in cluster[:4])
    return (f"A consolidation of {len(cluster)} early episodic memories, covering: "
            f"{themes}." if themes else f"A consolidation of {len(cluster)} early episodic memories.")


async def _summarise(cluster: list, request_headers=None):
    lines = "\n".join(f"- {(d.get('content') or '').strip()[:300]}" for d in cluster)
    prompt = (
        "You are Andrés, consolidating some of your own old episodic memories into a "
        "single, durable semantic memory. Write ONE short paragraph (2-4 sentences) "
        "that captures the shared gist of the memories below. Use ONLY what is in "
        "them — never invent details, names or events not present. Write it in the "
        "first person, as something you know.\n\n"
        f"[MEMORIES TO CONSOLIDATE]\n{lines}\n"
    )
    is_mock = True
    summary = _offline_summary(cluster)
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_consolidation", complexity="medium",
            max_tokens=350, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            summary = result.strip()
            is_mock = False
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés consolidation LLM failed: {e}")
    return summary, is_mock


async def propose_consolidation(user_id: str, request_headers=None) -> dict:
    """Pick an old, low-salience episodic cluster and PROPOSE a consolidation.
    Stores nothing on the memories themselves — only a pending proposal."""
    cands = []
    async for d in andres_memories.find({
        "user_id": user_id, "type": "episodic",
        "protected": {"$ne": True}, "archived": {"$ne": True},
        "consolidated_into": {"$exists": False},
    }).sort("created_at", 1).limit(200):
        cands.append(d)
    # Prefer the least-important, least-recalled, oldest memories to fold in.
    cands.sort(key=lambda d: (float(d.get("importance", 0.5)),
                              int(d.get("access_count", 0)),
                              d.get("created_at", "")))
    cluster = cands[:_MAX_CANDIDATES]
    if len(cluster) < _MIN_CLUSTER:
        return {"status": "nothing", "candidates": len(cluster),
                "reason": "Not enough old, low-priority episodic memories to consolidate yet."}

    summary, is_mock = await _summarise(cluster, request_headers)
    now = datetime.utcnow().isoformat()
    doc = {
        "user_id": user_id,
        "status": "pending",
        "summary": summary,
        "is_mock": is_mock,
        "source_ids": [str(d["_id"]) for d in cluster],
        "source_preview": [
            {"id": str(d["_id"]), "content": (d.get("content") or "")[:140],
             "created_at": d.get("created_at")}
            for d in cluster
        ],
        "count": len(cluster),
        "created_at": now,
    }
    res = await andres_memory_consolidations.insert_one(dict(doc))
    doc["_id"] = str(res.inserted_id)
    return {"status": "proposed", "proposal": doc}


async def list_consolidations(user_id: str, status: str = None, limit: int = 20) -> list:
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    out = []
    async for d in andres_memory_consolidations.find(query).sort("created_at", -1).limit(limit):
        d["_id"] = str(d["_id"])
        out.append(d)
    return out


async def act_on_consolidation(user_id: str, consolidation_id: str, action: str) -> dict:
    prop = await andres_memory_consolidations.find_one(
        {"_id": _oid(consolidation_id), "user_id": user_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Consolidation proposal not found")
    if prop.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Proposal already {prop.get('status')}")

    if action == "reject":
        await andres_memory_consolidations.update_one(
            {"_id": prop["_id"]},
            {"$set": {"status": "rejected", "acted_at": datetime.utcnow().isoformat()}})
        return {"status": "rejected", "consolidation_id": consolidation_id}

    if action != "approve":
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    # Create the consolidated semantic memory grounded in the sources.
    src_oids = []
    for sid in prop.get("source_ids", []):
        try:
            src_oids.append(ObjectId(sid))
        except Exception:
            pass
    now = datetime.utcnow().isoformat()
    summary = prop.get("summary", "")
    new_doc = {
        "user_id": user_id,
        "type": "semantic",
        "content": summary[:4000],
        "source": "consolidation",
        "importance": 0.6,
        "novelty": 0.4,
        "confidence": 0.7,
        "emotional_significance_simulated": 0.0,
        "sensitivity": "normal",
        "user_verified": False,
        "protected": False,
        "created_at": now,
        "last_recalled_at": None,
        "access_count": 0,
        "supersedes": prop.get("source_ids", []),
        "embedding": semantic_memory.embed_text(summary),
    }
    res = await andres_memories.insert_one(new_doc)
    new_id = str(res.inserted_id)

    # Archive (not delete) the sources — reversible, nothing hidden.
    archived = 0
    if src_oids:
        upd = await andres_memories.update_many(
            {"_id": {"$in": src_oids}, "user_id": user_id},
            {"$set": {"archived": True, "consolidated_into": new_id}})
        archived = getattr(upd, "modified_count", 0) or 0

    await andres_memory_consolidations.update_one(
        {"_id": prop["_id"]},
        {"$set": {"status": "approved", "acted_at": now, "resulting_memory_id": new_id}})

    # Keep the profile's memory counter honest (archived memories still exist).
    try:
        total = await andres_memories.count_documents({"user_id": user_id})
        await andres_profiles.update_one(
            {"user_id": user_id}, {"$set": {"counters.memories": total}})
    except Exception:
        pass

    return {"status": "approved", "consolidation_id": consolidation_id,
            "new_memory_id": new_id, "archived_sources": archived}
