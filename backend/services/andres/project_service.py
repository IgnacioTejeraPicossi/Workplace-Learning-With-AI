"""
Andrés — project service (V2 core + V5 lifecycle).

Andrés' own small projects. Active projects are injected into the prompt's
[CURRENT PROJECTS] layer, so they shape how he shows up. Stored in andres_projects;
counters.current_projects tracks the *active* count.

V5 lifecycle (Andrés' own design): a project moves
`proposed → active → paused → completed | abandoned → archived`, with two hard
rules he asked for:
  1. Nothing becomes `active` without the user's approval.
  2. Nothing is `archived` without a brief **closure reflection**.

Archiving isn't failure — it's disposal with dignity, and it distinguishes:
  • **cemetery** — the project didn't work / was vague / too costly; nothing to keep.
  • **compost** — it shouldn't continue now, but it left a reusable seed (a
    guideline, a phrase, a preference, a useful constraint). Compost MUST carry a
    `reuse_seed`, so a dead project can still feed the next one.

Each project also carries the same discipline as Andrés' suggestions — rationale,
benefit, risk, success_criteria, attention_budget — so initiative never becomes a
"more, more, more" shelf of half-breathing prototypes.
"""
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_projects, andres_profiles

_STATUSES = {"proposed", "active", "paused", "completed", "abandoned", "archived"}
# statuses a plain update may set (archiving has its own closure-gated endpoint)
_UPDATABLE_STATUSES = {"proposed", "active", "paused", "completed", "abandoned"}
_DISPOSITIONS = {"cemetery", "compost"}
_RICH_FIELDS = ("rationale", "benefit", "risk", "success_criteria", "attention_budget", "review_at")


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid project id")


async def _recount(user_id: str) -> None:
    active = await andres_projects.count_documents({"user_id": user_id, "status": "active"})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.current_projects": active}}
    )


async def list_projects(user_id: str, limit: int = 100) -> list:
    out = []
    async for doc in andres_projects.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def create_project(user_id: str, data: dict) -> dict:
    now = datetime.utcnow().isoformat()
    status = data.get("status", "active")
    if status not in _STATUSES or status == "archived":
        status = "active"
    doc = {
        "user_id": user_id,
        "title": (data.get("title") or "").strip()[:200],
        "description": (data.get("description") or "").strip()[:2000],
        "status": status,
        # a user-created project is approved by the act of creating it; a project
        # proposed by Andrés' initiative starts unapproved and must be approved.
        "approved_by_user": status == "active",
        "origin": data.get("origin", "user"),
        "created_at": now,
        "updated_at": now,
        "closure_reflection": None,
        "archive_reason": None,
        "reuse_seed": None,
    }
    for f in _RICH_FIELDS:
        doc[f] = (str(data.get(f) or "").strip()[:1000]) or None
    res = await andres_projects.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    await _recount(user_id)
    return doc


async def update_project(user_id: str, project_id: str, patch: dict) -> dict:
    fields = {"title", "description", "status"} | set(_RICH_FIELDS)
    allowed = {k: v for k, v in patch.items() if k in fields and v is not None}
    if "status" in allowed and allowed["status"] not in _UPDATABLE_STATUSES:
        # archiving must go through archive_project (needs a closure reflection)
        raise HTTPException(status_code=400, detail="Use the archive endpoint to archive")
    if not allowed:
        raise HTTPException(status_code=400, detail="No updatable fields provided")
    allowed["updated_at"] = datetime.utcnow().isoformat()
    res = await andres_projects.update_one(
        {"_id": _oid(project_id), "user_id": user_id}, {"$set": allowed}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await _recount(user_id)
    doc = await andres_projects.find_one({"_id": _oid(project_id), "user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc or {"ok": True}


async def approve_project(user_id: str, project_id: str) -> dict:
    """Rule 1: a proposed project only becomes active with the user's approval."""
    doc = await andres_projects.find_one({"_id": _oid(project_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    if doc.get("status") != "proposed":
        raise HTTPException(status_code=409, detail=f"Project is {doc.get('status')}, not proposed")
    await andres_projects.update_one(
        {"_id": _oid(project_id), "user_id": user_id},
        {"$set": {"status": "active", "approved_by_user": True,
                  "updated_at": datetime.utcnow().isoformat()}},
    )
    await _recount(user_id)
    return {"ok": True, "id": project_id, "status": "active"}


async def archive_project(user_id: str, project_id: str, closure: dict) -> dict:
    """Rule 2: archiving requires a closure reflection; compost must carry a seed."""
    disposition = (closure or {}).get("disposition")
    if disposition not in _DISPOSITIONS:
        raise HTTPException(status_code=400, detail="disposition must be 'cemetery' or 'compost'")
    reflection = {
        "what_worked": str(closure.get("what_worked", "")).strip()[:1000],
        "what_didnt": str(closure.get("what_didnt", "")).strip()[:1000],
        "learned": str(closure.get("learned", "")).strip()[:1000],
        "guideline": str(closure.get("guideline", "")).strip()[:1000],
    }
    if not any(reflection.values()):
        raise HTTPException(status_code=400, detail="A closure reflection is required to archive")
    reuse_seed = str(closure.get("reuse_seed", "")).strip()[:1000] or None
    if disposition == "compost" and not reuse_seed:
        raise HTTPException(status_code=400, detail="Compost requires a reuse_seed (what to keep)")

    res = await andres_projects.update_one(
        {"_id": _oid(project_id), "user_id": user_id},
        {"$set": {
            "status": "archived",
            "archive_reason": disposition,
            "closure_reflection": reflection,
            "reuse_seed": reuse_seed,
            "archived_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await _recount(user_id)
    doc = await andres_projects.find_one({"_id": _oid(project_id), "user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])

    # When archiving as "compost", plant the reusable seed into the Memory Garden
    # as a verified procedural memory so future conversations and projects actually
    # inherit the lesson (Hands -> Library biological loop).
    if disposition == "compost" and reuse_seed:
        try:
            from backend.services.andres import memory_service
            proj_title = (doc or {}).get("title") or "Archived project"
            learned_part = f" Learned: {reflection['learned']}" if reflection.get("learned") else ""
            guideline_part = f" Guideline: {reflection['guideline']}" if reflection.get("guideline") else ""
            seed_content = (
                f"[Compost seed from project '{proj_title}'] {reuse_seed}."
                f"{learned_part}{guideline_part}"
            ).strip()[:4000]
            planted = await memory_service.save_memory(user_id, {
                "type": "procedural",
                "content": seed_content,
                "source": "compost",
                "importance": 0.75,
                "user_verified": True,
            })
            if doc is not None:
                doc["planted_memory_id"] = planted.get("_id")
        except Exception as ex:  # pragma: no cover - defensive
            print(f"⚠️ Andrés compost->memory plant failed: {ex}")

    return doc or {"ok": True}


async def propose_project_with_andres(
    user_id: str,
    profile: dict,
    memories: list = None,
    topic_hint: str = "",
    request_headers=None,
) -> dict:
    """Andrés proposes a bounded project (`status='proposed'`, requires user approval)."""
    identity = (profile or {}).get("identity", {})
    interests = ", ".join(identity.get("core_interests", [])) or "learning, reflection, synthesis"
    mem_snippets = "\n".join(
        f"- ({m.get('type', 'episodic')}) {m.get('content', '')[:180]}"
        for m in (memories or [])[:6]
    ) or "(no memories yet)"

    prompt = (
        "You are Andrés, proposing ONE small, concrete, collaborative project to "
        "pursue with the user inside WLWAI. Keep it bounded and auditable.\n"
        f"Your core interests: {interests}\n"
        f"Recent memories with this user:\n{mem_snippets}\n"
        + (f"User's optional topic hint: {topic_hint.strip()}\n" if (topic_hint or "").strip() else "")
        + "Return ONLY valid JSON with keys: "
        "{\"title\": \"...\", \"description\": \"...\", \"rationale\": \"...\", "
        "\"benefit\": \"...\", \"risk\": \"...\", \"success_criteria\": \"...\", "
        "\"attention_budget\": \"...\"}"
    )

    parsed = None
    is_mock = True
    try:
        from backend.llm import ask_ai_unified
        raw = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_project_propose",
            complexity="medium",
            max_tokens=700,
            request_headers=request_headers,
        )
        if raw and not raw.startswith("[MOCKED RESPONSE"):
            import json
            s, e = raw.find("{"), raw.rfind("}")
            if s != -1 and e != -1:
                parsed = json.loads(raw[s:e + 1])
                is_mock = False
    except Exception as ex:  # pragma: no cover - defensive
        print(f"⚠️ Andrés project proposal fallback: {ex}")

    if not isinstance(parsed, dict) or not parsed.get("title"):
        hint_clean = (topic_hint or "").strip()
        first_interest = (identity.get("core_interests") or ["shared inquiry"])[0]
        title_stub = (
            f"Explore: {hint_clean[:80]}"
            if hint_clean
            else f"Shared inquiry on {first_interest}"
        )
        parsed = {
            "title": title_stub,
            "description": (
                "A small, two-week notebook where we collect verified notes, one "
                "reusable skill, and a closing reflection on what worked."
            ),
            "rationale": f"Builds directly on {first_interest} and your recent conversations.",
            "benefit": "Turns scattered exchanges into one structured, reusable artifact.",
            "risk": "Low — stays read-only/sandboxed until you approve any step.",
            "success_criteria": "3 verified memories + 1 closing reflection.",
            "attention_budget": "15 min / week",
        }

    doc = await create_project(user_id, {
        "title": str(parsed.get("title", "Proposed project"))[:200],
        "description": str(parsed.get("description", ""))[:2000],
        "status": "proposed",
        "origin": "andres",
        "rationale": parsed.get("rationale"),
        "benefit": parsed.get("benefit"),
        "risk": parsed.get("risk"),
        "success_criteria": parsed.get("success_criteria"),
        "attention_budget": parsed.get("attention_budget"),
    })
    doc["is_mock"] = is_mock
    return doc


async def delete_project(user_id: str, project_id: str) -> dict:
    res = await andres_projects.delete_one({"_id": _oid(project_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await _recount(user_id)
    return {"ok": True, "deleted": project_id}
