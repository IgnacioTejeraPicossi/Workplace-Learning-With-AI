"""
Andrés the Robot — router (V0 "Birth" + V1 "Memory" + V2 "Reflection").

Endpoints: health, profile, chat (real LLM via the unified gateway; prompt
assembled from the immutable constitution + identity + projects + recalled
memories; is_mock offline fallback). V1 adds memory CRUD + retrieval. V2 adds
reflections/journal, a curiosity queue, projects, and user-approved evolution
(propose/approve/reject + versioning/rollback). See docs/andres-robot-plan.md.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from typing import Optional, List, Dict

from backend.db import andres_conversations, andres_profiles
from backend.services.andres.identity_service import (
    get_or_create_profile,
    developmental_age_days,
)
from backend.services.andres.prompt_assembler import assemble_system_prompt
from backend.services.andres import (
    memory_service, reflection_engine, curiosity_engine, project_service,
    evolution_manager,
)

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


class CuriosityPatch(BaseModel):
    status: str = Field(..., pattern="^(open|explored|dismissed)$")


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=2000)
    status: str = "active"


class ProjectPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class EvolutionProposal(BaseModel):
    rationale: str = Field("", max_length=2000)
    changes: Dict = Field(default_factory=dict)


class RollbackRequest(BaseModel):
    target_version: int = Field(..., ge=1)


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

    # V1: recall relevant memories; V2: surface active projects — both into the prompt.
    recalled = await memory_service.retrieve_relevant(uid, body.message, limit=5)
    try:
        projects = await project_service.list_projects(uid, limit=20)
    except Exception:
        projects = []
    system_prompt = assemble_system_prompt(profile_doc, memories=recalled, projects=projects)
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
    paused = bool(profile_doc.get("development_paused", False))
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


# ── V2: reflection / journal ─────────────────────────────────────────────────

@router.post("/reflect")
async def reflect(http_request: Request, user=Depends(_verify_token)):
    """Andrés reflects on recent experience and stores a journal reflection."""
    uid = user.get("uid")
    profile_doc = await get_or_create_profile(uid)
    if profile_doc.get("development_paused"):
        return {"paused": True, "reflection": None}
    doc = await reflection_engine.generate_reflection(
        uid, profile_doc, request_headers=http_request.headers
    )
    return {"reflection": doc, "is_mock": doc.get("is_mock", False)}


@router.get("/reflections")
async def get_reflections(limit: int = 100, user=Depends(_verify_token)):
    items = await reflection_engine.list_reflections(user.get("uid"), limit=limit)
    return {"reflections": items, "count": len(items)}


# ── V2: curiosity queue ──────────────────────────────────────────────────────

@router.post("/curiosity/generate")
async def curiosity_generate(http_request: Request, user=Depends(_verify_token)):
    """Andrés forms a few new spontaneous wonderings (within allowed scope)."""
    uid = user.get("uid")
    profile_doc = await get_or_create_profile(uid)
    if profile_doc.get("development_paused"):
        return {"paused": True, "wonderings": []}
    items = await curiosity_engine.generate_wonderings(
        uid, profile_doc, n=3, request_headers=http_request.headers
    )
    return {"wonderings": items, "count": len(items)}


@router.get("/curiosity")
async def curiosity_list(status: str = None, user=Depends(_verify_token)):
    items = await curiosity_engine.list_curiosity(user.get("uid"), status=status)
    return {"wonderings": items, "count": len(items)}


@router.patch("/curiosity/{item_id}")
async def curiosity_update(item_id: str, body: CuriosityPatch, user=Depends(_verify_token)):
    return await curiosity_engine.update_curiosity(user.get("uid"), item_id, body.status)


# ── V2: projects ─────────────────────────────────────────────────────────────

@router.get("/projects")
async def projects_list(user=Depends(_verify_token)):
    items = await project_service.list_projects(user.get("uid"))
    return {"projects": items, "count": len(items)}


@router.post("/projects")
async def projects_create(body: ProjectCreate, user=Depends(_verify_token)):
    return await project_service.create_project(user.get("uid"), body.model_dump())


@router.patch("/projects/{project_id}")
async def projects_update(project_id: str, body: ProjectPatch, user=Depends(_verify_token)):
    return await project_service.update_project(user.get("uid"), project_id, body.model_dump())


@router.delete("/projects/{project_id}")
async def projects_delete(project_id: str, user=Depends(_verify_token)):
    return await project_service.delete_project(user.get("uid"), project_id)


# ── V2: evolution (propose → user approves/rejects → versioned; + rollback) ───

@router.post("/evolution/propose")
async def evolution_propose(body: EvolutionProposal, user=Depends(_verify_token)):
    """Register a proposed identity change. Does NOT change Andrés until approved."""
    uid = user.get("uid")
    profile_doc = await get_or_create_profile(uid)
    return await evolution_manager.propose(uid, profile_doc, body.rationale, body.changes)


@router.get("/evolution/proposals")
async def evolution_proposals(status: str = None, user=Depends(_verify_token)):
    items = await evolution_manager.list_proposals(user.get("uid"), status=status)
    return {"proposals": items, "count": len(items)}


@router.get("/evolution/versions")
async def evolution_versions(user=Depends(_verify_token)):
    items = await evolution_manager.list_versions(user.get("uid"))
    return {"versions": items, "count": len(items)}


@router.post("/evolution/{proposal_id}/approve")
async def evolution_approve(proposal_id: str, user=Depends(_verify_token)):
    """Apply a pending proposal — the only way Andrés' identity actually changes."""
    uid = user.get("uid")
    profile_doc = await get_or_create_profile(uid)
    return await evolution_manager.approve(uid, profile_doc, proposal_id)


@router.post("/evolution/{proposal_id}/reject")
async def evolution_reject(proposal_id: str, user=Depends(_verify_token)):
    return await evolution_manager.reject(user.get("uid"), proposal_id)


@router.post("/evolution/rollback")
async def evolution_rollback(body: RollbackRequest, user=Depends(_verify_token)):
    """Restore a prior identity version as a new (auditable, reversible) version."""
    uid = user.get("uid")
    profile_doc = await get_or_create_profile(uid)
    return await evolution_manager.rollback(uid, profile_doc, body.target_version)
