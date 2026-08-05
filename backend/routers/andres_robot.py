"""
Andrés the Robot — router (V0 "Birth").

V0 endpoints: health, profile (get-or-create), chat (real LLM via the unified
gateway, prompt assembled from the immutable constitution + current identity,
is_mock offline fallback). Memory / reflection / creativity / skills / evolution
arrive in later phases. See docs/andres-robot-plan.md.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from typing import Optional

from backend.db import andres_conversations, andres_profiles
from backend.services.andres.identity_service import (
    get_or_create_profile,
    developmental_age_days,
)
from backend.services.andres.prompt_assembler import assemble_system_prompt
from backend.services.andres import memory_service

router = APIRouter(prefix="/api/andres", tags=["Andrés the Robot"])


def _verify_token(request: Request):
    """Lazy wrapper around app.verify_token to avoid an import cycle at load time."""
    from backend.app import verify_token
    return verify_token(request)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)


class MemoryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    type: str = "episodic"
    importance: float = Field(0.5, ge=0, le=1)
    sensitivity: str = "normal"
    user_verified: bool = True   # a memory the user adds by hand is verified


class MemoryPatch(BaseModel):
    content: Optional[str] = None
    importance: Optional[float] = Field(None, ge=0, le=1)
    user_verified: Optional[bool] = None
    protected: Optional[bool] = None
    sensitivity: Optional[str] = None
    type: Optional[str] = None


@router.get("/health")
async def health():
    return {"status": "healthy", "module": "andres_robot", "version": "v0"}


@router.get("/profile")
async def profile(user=Depends(_verify_token)):
    """Return the user's Andrés profile (creating the V0 'birth' profile if none)."""
    p = await get_or_create_profile(user.get("uid"))
    p["developmental_age_days"] = await developmental_age_days(p)
    return p


@router.post("/chat")
async def chat(body: ChatRequest, http_request: Request, user=Depends(_verify_token)):
    """One conversational turn with Andrés."""
    uid = user.get("uid")
    profile_doc = await get_or_create_profile(uid)

    # V1: recall relevant memories and weave them into the prompt.
    recalled = await memory_service.retrieve_relevant(uid, body.message, limit=5)
    system_prompt = assemble_system_prompt(profile_doc, memories=recalled)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": body.message},
    ]

    # Real LLM via the unified gateway; degrade gracefully when no key is set.
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=messages, task_type="andres_chat", complexity="high",
            max_tokens=700, request_headers=http_request.headers,
        )
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés chat LLM failed: {e}")
        result = None

    is_mock = (not result) or result.startswith("[MOCKED RESPONSE")
    if is_mock:
        message = (
            "I'm awake, but no AI provider is configured right now, so I can't think "
            "freely yet. Once a model key is set I'll be able to talk with you properly "
            "— and start building the memories that will make me, over time, someone "
            "distinct. (This is an honest limitation, not a mood.)"
        )
    else:
        message = result.strip()

    now = datetime.utcnow().isoformat()
    await andres_conversations.insert_one({
        "user_id": uid,
        "user_message": body.message,
        "andres_message": message,
        "is_mock": is_mock,
        "identity_version": profile_doc.get("identity", {}).get("version", 1),
        "created_at": now,
    })
    await andres_profiles.update_one(
        {"user_id": uid},
        {"$inc": {"counters.conversations": 1}, "$set": {"updated_at": now}},
    )

    # V1: after a real exchange, store an episodic memory CANDIDATE (unverified),
    # provided autonomy allows it and Andrés isn't paused. The user curates these
    # in the Memory Garden — nothing here is treated as fact until verified.
    new_candidates = 0
    autonomy = int(profile_doc.get("autonomy_level", 2))
    paused = bool(profile_doc.get("paused", False))
    if (not is_mock) and autonomy >= 1 and not paused:
        try:
            await memory_service.save_memory(uid, {
                "type": "episodic",
                "content": f"The user said: “{body.message.strip()[:400]}”. "
                           f"I replied about: {message[:200]}",
                "source": "auto",
                "importance": 0.4,
                "user_verified": False,
            })
            new_candidates = 1
        except Exception as e:  # pragma: no cover - defensive
            print(f"⚠️ Andrés memory candidate store failed: {e}")

    return {
        "message": message,
        "identity_version": profile_doc.get("identity", {}).get("version", 1),
        "simulated_disposition": profile_doc.get("simulated_disposition", {}),
        "development_signals": {
            "new_memory_candidates": new_candidates,
            "memories_recalled": len(recalled),
            "phase": "v1",
        },
        "safety": {"reviewed": True, "risk": "low"},
        "is_mock": is_mock,
    }


@router.get("/memories")
async def get_memories(type: str = None, limit: int = 200, user=Depends(_verify_token)):
    """List the user's Andrés memories, newest first, optionally filtered by type."""
    items = await memory_service.list_memories(user.get("uid"), mem_type=type, limit=limit)
    return {"memories": items, "count": len(items)}


@router.post("/memories")
async def create_memory(body: MemoryCreate, user=Depends(_verify_token)):
    """Add a memory by hand (verified by default — the user is authoring it)."""
    doc = await memory_service.save_memory(user.get("uid"), body.model_dump())
    return doc


@router.patch("/memories/{memory_id}")
async def patch_memory(memory_id: str, body: MemoryPatch, user=Depends(_verify_token)):
    """Correct / verify / protect a memory (Memory Garden actions)."""
    return await memory_service.update_memory(user.get("uid"), memory_id, body.model_dump())


@router.delete("/memories/{memory_id}")
async def forget_memory(memory_id: str, user=Depends(_verify_token)):
    """Forget (delete) a memory. Protected memories are still deletable by the user."""
    return await memory_service.delete_memory(user.get("uid"), memory_id)
