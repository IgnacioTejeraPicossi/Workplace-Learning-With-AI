"""
Andrés — skill service (V4).

Voyager-style growing skill library, but bounded and auditable. Every skill is a
pure `def skill(x)` function that must clear the static sandbox safety gate before
it can be stored as a runnable proposal, and must be **user-approved** before it
counts as an active skill. Skills run only in the stripped sandbox
(`sandbox.run_in_sandbox`) against explicit inputs; runs are logged in
andres_skill_runs with duration + outcome. Nothing here can touch the app, disk or
network. Traceability + human approval are the point — per Andrés' own V4 ask.

Lifecycle: draft (optional, LLM) → propose (safety-gated) → [pending|blocked] →
user approves → active (or reject / delete). Pending & active skills can be
sandbox-run for testing; blocked ones cannot.
"""
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_skills, andres_skill_runs, andres_profiles
from backend.services.andres.sandbox import static_safety_check, run_in_sandbox

_RUNNABLE = {"pending", "active"}


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid skill id")


async def _recount_active(user_id: str) -> None:
    active = await andres_skills.count_documents({"user_id": user_id, "status": "active"})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.active_skills": active}}
    )


def _draft_stub(task: str) -> dict:
    return {
        "name": "echo_skill",
        "description": f"(offline stub) A placeholder skill for: {task[:120]}",
        "code": (
            "def skill(x):\n"
            "    # Offline stub — no AI provider configured, so this is a safe,\n"
            "    # trivial function rather than a genuine skill.\n"
            "    return x\n"
        ),
        "is_mock": True,
    }


async def draft_skill(user_id: str, task: str, request_headers=None) -> dict:
    """Andrés drafts a candidate skill (NOT stored). Deterministic offline stub."""
    prompt = (
        "You are Andrés, drafting a small, safe Python skill. Write ONE self-contained "
        "top-level function `def skill(x):` that solves the task. HARD RULES: no "
        "imports, no file/network/OS access, no eval/exec, no names or attributes "
        "starting with '_'. Use only basic builtins (len, range, sum, sorted, etc.). "
        "Return ONLY JSON: {\"name\": \"...\", \"description\": \"...\", \"code\": \"...\"} "
        "where code is the function source.\n\n"
        f"[TASK]\n{task}"
    )
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_skill_draft", complexity="high",
            max_tokens=700, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            import json
            txt = result.strip()
            s, e = txt.find("{"), txt.rfind("}")
            if s != -1 and e != -1:
                parsed = json.loads(txt[s:e + 1])
                code = str(parsed.get("code", ""))
                return {
                    "name": str(parsed.get("name", "skill"))[:80],
                    "description": str(parsed.get("description", ""))[:500],
                    "code": code,
                    "safety": static_safety_check(code),
                    "is_mock": False,
                }
    except Exception as ex:  # pragma: no cover - defensive
        print(f"⚠️ Andrés skill draft failed/parse: {ex}")
    stub = _draft_stub(task)
    stub["safety"] = static_safety_check(stub["code"])
    return stub


async def propose_skill(user_id: str, data: dict) -> dict:
    """Store a proposed skill, safety-gated. Blocked skills are stored (for
    traceability) but can never run or be approved."""
    code = (data.get("code") or "")
    safety = static_safety_check(code)
    status = "pending" if safety["ok"] else "blocked"
    now = datetime.utcnow().isoformat()
    doc = {
        "user_id": user_id,
        "name": (data.get("name") or "skill").strip()[:80],
        "description": (data.get("description") or "").strip()[:500],
        "code": code[:4000],
        "status": status,
        "safety": safety,
        "runs": 0,
        "created_at": now,
        "updated_at": now,
    }
    res = await andres_skills.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return doc


async def list_skills(user_id: str, limit: int = 100) -> list:
    out = []
    async for doc in andres_skills.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def approve_skill(user_id: str, skill_id: str) -> dict:
    doc = await andres_skills.find_one({"_id": _oid(skill_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Skill not found")
    if doc.get("status") == "blocked":
        raise HTTPException(status_code=409, detail="Skill blocked by safety check; cannot approve")
    if doc.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Skill already {doc.get('status')}")
    await andres_skills.update_one(
        {"_id": _oid(skill_id), "user_id": user_id},
        {"$set": {"status": "active", "updated_at": datetime.utcnow().isoformat()}},
    )
    await _recount_active(user_id)
    return {"ok": True, "id": skill_id, "status": "active"}


async def reject_skill(user_id: str, skill_id: str) -> dict:
    res = await andres_skills.update_one(
        {"_id": _oid(skill_id), "user_id": user_id},
        {"$set": {"status": "rejected", "updated_at": datetime.utcnow().isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")
    await _recount_active(user_id)
    return {"ok": True, "id": skill_id, "status": "rejected"}


async def delete_skill(user_id: str, skill_id: str) -> dict:
    res = await andres_skills.delete_one({"_id": _oid(skill_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")
    await _recount_active(user_id)
    return {"ok": True, "deleted": skill_id}


async def run_skill(user_id: str, skill_id: str, test_input) -> dict:
    """Sandbox-run a pending/active skill against test_input; log the run."""
    doc = await andres_skills.find_one({"_id": _oid(skill_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Skill not found")
    if doc.get("status") not in _RUNNABLE:
        raise HTTPException(status_code=409, detail=f"Skill is {doc.get('status')} and cannot run")
    if not doc.get("safety", {}).get("ok"):
        raise HTTPException(status_code=409, detail="Skill failed the safety check; cannot run")

    result = run_in_sandbox(doc["code"], test_input)
    now = datetime.utcnow().isoformat()
    await andres_skill_runs.insert_one({
        "user_id": user_id,
        "skill_id": skill_id,
        "input": test_input,
        "ok": result["ok"],
        "output": result["output"],
        "error": result["error"],
        "duration_ms": result["duration_ms"],
        "created_at": now,
    })
    await andres_skills.update_one(
        {"_id": _oid(skill_id), "user_id": user_id},
        {"$inc": {"runs": 1}, "$set": {"last_run_at": now}},
    )
    return {"skill_id": skill_id, **result}


async def metrics(user_id: str) -> dict:
    """Comprehensible development metrics for the Skill Library (Andrés' ask)."""
    total = await andres_skills.count_documents({"user_id": user_id})
    active = await andres_skills.count_documents({"user_id": user_id, "status": "active"})
    pending = await andres_skills.count_documents({"user_id": user_id, "status": "pending"})
    blocked = await andres_skills.count_documents({"user_id": user_id, "status": "blocked"})
    runs = await andres_skill_runs.count_documents({"user_id": user_id})
    ok_runs = await andres_skill_runs.count_documents({"user_id": user_id, "ok": True})
    return {
        "total": total, "active": active, "pending": pending, "blocked": blocked,
        "runs": runs, "successful_runs": ok_runs,
        "run_success_rate": round(ok_runs / runs, 2) if runs else None,
    }
