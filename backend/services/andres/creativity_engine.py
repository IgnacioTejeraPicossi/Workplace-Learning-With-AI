"""
Andrés — creativity engine (V3).

Andrés produces small creative artifacts (ideas, concept blends, provocations) —
but never as fireworks. Every artifact is immediately run through the evaluator
(novelty + usefulness + honest self-critique), because Andrés himself asked for
"surprise me WITH usefulness" and "surprise me, then self-critique". Modes:

- surprise          : an unexpected idea
- surprise_useful   : unexpected AND genuinely useful (novelty alone isn't enough)
- self_critique     : surprise, then he critiques it candidly
- blend             : fuse two given concepts into one new, useful idea

Artifacts are stored in andres_creative_artifacts and are fully user-curatable
(deletable). Deterministic offline fallback keeps the pipeline testable with no
AI key. See plan §11 (V3) and Andrés' own design note in the changelog.
"""
from datetime import datetime

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import andres_creative_artifacts, andres_profiles
from backend.services.andres.evaluators import evaluate_creativity

MODES = {"surprise", "surprise_useful", "self_critique", "blend"}


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid artifact id")


def _build_prompt(mode: str, seed: str, concept_a: str, concept_b: str, interests: str) -> str:
    base = (
        "You are Andrés being creative. Keep it concise (120-200 words), specific "
        "and genuinely yours — avoid generic-assistant phrasing. You may name "
        "simulated dispositions but never claim real feeling.\n\n"
    )
    if mode == "blend":
        return base + (
            f"Fuse these two concepts into ONE original, genuinely useful idea: "
            f"\"{concept_a}\" + \"{concept_b}\". Explain the fusion and why it could "
            "actually be useful, not just clever."
        )
    if mode == "surprise_useful":
        return base + (
            f"Surprise me with an unexpected idea about {seed or interests}, but it "
            "must be genuinely USEFUL — novelty alone is not enough. Make the "
            "usefulness explicit."
        )
    if mode == "self_critique":
        return base + (
            f"Surprise me with an unexpected idea about {seed or interests}. Then, in "
            "a short second paragraph headed 'Self-critique:', name its weakest point "
            "honestly."
        )
    # default: surprise
    return base + f"Surprise me with an unexpected idea about {seed or interests}."


def _offline_artifact(mode: str, seed: str, concept_a: str, concept_b: str) -> str:
    if mode == "blend":
        return (
            f"(offline placeholder) A blend of \"{concept_a}\" and \"{concept_b}\": "
            "no AI provider is configured, so I can't genuinely create right now. "
            "Once a model key is set I'll fuse these into something new and useful. "
            "(This is an honest limitation, not a lack of imagination.)"
        )
    return (
        f"(offline placeholder) I'd love to surprise you about "
        f"{seed or 'this'}, but no AI provider is configured, so I can't create "
        "freely yet. This note is deterministic, not a genuine idea."
    )


async def generate(user_id: str, profile: dict, mode: str, seed: str = "",
                   concept_a: str = "", concept_b: str = "", request_headers=None) -> dict:
    if mode not in MODES:
        mode = "surprise_useful"
    interests = ", ".join(profile.get("identity", {}).get("core_interests", []) or ["ideas"])
    prompt = _build_prompt(mode, seed, concept_a, concept_b, interests)

    is_mock = True
    content = _offline_artifact(mode, seed, concept_a, concept_b)
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_creativity", complexity="high",
            max_tokens=600, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            content = result.strip()
            is_mock = False
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés creativity LLM failed: {e}")

    task_desc = (f"blend {concept_a} + {concept_b}" if mode == "blend"
                 else (seed or "open-ended surprise"))
    evaluation = await evaluate_creativity(content, task=task_desc, request_headers=request_headers)

    now = datetime.utcnow().isoformat()
    doc = {
        "user_id": user_id,
        "mode": mode,
        "seed": (seed or "")[:500],
        "concept_a": (concept_a or "")[:200],
        "concept_b": (concept_b or "")[:200],
        "content": content,
        "novelty": evaluation["novelty"],
        "usefulness": evaluation["usefulness"],
        "self_critique": evaluation["self_critique"],
        "is_mock": is_mock,
        "created_at": now,
    }
    res = await andres_creative_artifacts.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    total = await andres_creative_artifacts.count_documents({"user_id": user_id})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.creative_artifacts": total}}
    )
    return doc


async def list_artifacts(user_id: str, limit: int = 100) -> list:
    out = []
    async for doc in andres_creative_artifacts.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def delete_artifact(user_id: str, artifact_id: str) -> dict:
    res = await andres_creative_artifacts.delete_one({"_id": _oid(artifact_id), "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artifact not found")
    total = await andres_creative_artifacts.count_documents({"user_id": user_id})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.creative_artifacts": total}}
    )
    return {"ok": True, "deleted": artifact_id}
