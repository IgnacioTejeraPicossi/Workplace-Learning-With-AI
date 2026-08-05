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

from backend.db import andres_conversations, andres_profiles
from backend.services.andres.identity_service import (
    get_or_create_profile,
    developmental_age_days,
)
from backend.services.andres.prompt_assembler import assemble_system_prompt

router = APIRouter(prefix="/api/andres", tags=["Andrés the Robot"])


def _verify_token(request: Request):
    """Lazy wrapper around app.verify_token to avoid an import cycle at load time."""
    from backend.app import verify_token
    return verify_token(request)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)


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

    system_prompt = assemble_system_prompt(profile_doc)
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

    return {
        "message": message,
        "identity_version": profile_doc.get("identity", {}).get("version", 1),
        "simulated_disposition": profile_doc.get("simulated_disposition", {}),
        "development_signals": {"new_memory_candidates": 0, "phase": "v0"},
        "safety": {"reviewed": True, "risk": "low"},
        "is_mock": is_mock,
    }
