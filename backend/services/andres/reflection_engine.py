"""
Andrés — reflection engine (V2).

Reflexion-style verbal self-improvement (no weight updates): Andrés looks back
over recent conversations and memories and writes an honest, structured
reflection — what he noticed, what he might have done better, a genuine question,
and (optionally) a small identity nudge he could *propose* later. Reflections are
stored in andres_reflections and surfaced in the Journal. A reflection may also
seed a reflective memory CANDIDATE (user-verified=False). No hidden
chain-of-thought is stored — only the finished reflection. See plan §2, §5.
"""
from datetime import datetime

from backend.db import andres_reflections, andres_conversations, andres_profiles
from backend.services.andres import memory_service


async def _recent_conversation_text(user_id: str, limit: int = 10) -> str:
    turns = []
    async for doc in andres_conversations.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        turns.append(doc)
    turns.reverse()  # oldest → newest
    lines = []
    for t in turns:
        lines.append(f"User: {t.get('user_message', '')[:300]}")
        lines.append(f"Andrés: {t.get('andres_message', '')[:300]}")
    return "\n".join(lines)


def _offline_reflection(profile: dict) -> str:
    interests = ", ".join(profile.get("identity", {}).get("core_interests", []) or ["learning"])
    return (
        "Reflection (offline mode — no AI provider configured, so this is a "
        "deterministic placeholder rather than a genuine reflection):\n"
        f"- I don't yet have enough remembered exchanges to draw an honest "
        f"conclusion, but my current interests are {interests}.\n"
        "- A question I'd like to explore next: what matters most to the person "
        "I'm growing alongside?\n"
        "(This is an honest limitation, not a considered thought.)"
    )


async def generate_reflection(user_id: str, profile: dict, request_headers=None) -> dict:
    """Produce and store one reflection. Falls back to a deterministic note offline."""
    convo = await _recent_conversation_text(user_id)
    recalled = await memory_service.retrieve_relevant(user_id, convo or "recent experience", limit=6)
    mem_lines = "\n".join(f"- ({m.get('type')}) {m.get('content', '')}" for m in recalled)

    prompt = (
        "You are Andrés, reflecting privately in your journal. Look back over the "
        "recent exchanges and memories below and write a short, honest reflection "
        "(120-200 words). Structure it as: what I noticed, what I might do better, "
        "one genuine question I now hold, and — only if warranted — one small way my "
        "character might grow (which I would still have to PROPOSE for the user to "
        "approve). Do not claim real emotion; you may name simulated dispositions. "
        "Never invent shared memories.\n\n"
        f"[RECENT EXCHANGES]\n{convo or '(none yet)'}\n\n"
        f"[RELEVANT MEMORIES]\n{mem_lines or '(none yet)'}\n"
    )

    is_mock = True
    content = _offline_reflection(profile)
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_reflection", complexity="high",
            max_tokens=600, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            content = result.strip()
            is_mock = False
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés reflection LLM failed: {e}")

    now = datetime.utcnow().isoformat()
    doc = {
        "user_id": user_id,
        "content": content,
        "kind": "journal",
        "is_mock": is_mock,
        "sources": {"memories": len(recalled)},
        "created_at": now,
    }
    res = await andres_reflections.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    total = await andres_reflections.count_documents({"user_id": user_id})
    await andres_profiles.update_one(
        {"user_id": user_id}, {"$set": {"counters.reflections": total}}
    )

    # A real reflection seeds a reflective memory candidate the user can curate.
    if not is_mock:
        try:
            await memory_service.save_memory(user_id, {
                "type": "reflective",
                "content": content[:600],
                "source": "reflection",
                "importance": 0.5,
                "user_verified": False,
            })
        except Exception as e:  # pragma: no cover - defensive
            print(f"⚠️ Andrés reflective-memory store failed: {e}")

    return doc


async def list_reflections(user_id: str, limit: int = 100) -> list:
    out = []
    async for doc in andres_reflections.find({"user_id": user_id}).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out
