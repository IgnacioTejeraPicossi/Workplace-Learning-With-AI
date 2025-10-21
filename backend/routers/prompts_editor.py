from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    from backend.db import prompts_collection, security_events_collection
    from backend.llm import ask_ai_unified_sync
except ImportError:
    from db import prompts_collection
    from llm import ask_ai_unified_sync

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


class PromptRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    agent: str  # 'compliance' | 'productivity'
    name: str
    prompt: str
    isNative: bool = False
    isActive: bool = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


@router.get("/{agent}")
async def list_prompts(agent: str):
    docs = []
    async for d in prompts_collection.find({"agent": agent}).sort("createdAt", -1):
        d["_id"] = str(d["_id"])  # stringify for JSON
        docs.append(d)
    return {"items": docs}


class CreatePromptRequest(BaseModel):
    name: str
    prompt: str


@router.post("/{agent}")
async def create_prompt(agent: str, body: CreatePromptRequest):
    now = datetime.utcnow()
    doc = {
        "agent": agent,
        "name": body.name,
        "prompt": body.prompt,
        "isNative": False,
        "isActive": False,
        "createdAt": now,
        "updatedAt": now,
    }
    res = await prompts_collection.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"ok": True, "item": doc}


class UpdatePromptRequest(BaseModel):
    name: Optional[str] = None
    prompt: Optional[str] = None
    isActive: Optional[bool] = None


@router.put("/{agent}/{prompt_id}")
async def update_prompt(agent: str, prompt_id: str, body: UpdatePromptRequest):
    from bson import ObjectId
    doc = await prompts_collection.find_one({"_id": ObjectId(prompt_id), "agent": agent})
    if not doc:
        raise HTTPException(404, "Prompt not found")
    if doc.get("isNative"):
        raise HTTPException(400, "Native prompt cannot be modified")

    update: Dict[str, Any] = {"updatedAt": datetime.utcnow()}
    if body.name is not None:
        update["name"] = body.name
    if body.prompt is not None:
        update["prompt"] = body.prompt
    if body.isActive is not None:
        update["isActive"] = body.isActive

    await prompts_collection.update_one({"_id": ObjectId(prompt_id)}, {"$set": update})
    return {"ok": True}


@router.delete("/{agent}/{prompt_id}")
async def delete_prompt(agent: str, prompt_id: str):
    from bson import ObjectId
    doc = await prompts_collection.find_one({"_id": ObjectId(prompt_id), "agent": agent})
    if not doc:
        raise HTTPException(404, "Prompt not found")
    if doc.get("isNative"):
        raise HTTPException(400, "Native prompt cannot be deleted")
    await prompts_collection.delete_one({"_id": ObjectId(prompt_id)})
    return {"ok": True}


class TestPromptRequest(BaseModel):
    prompt: str
    context: Dict[str, Any] = {}


@router.post("/{agent}/test")
async def test_prompt(agent: str, body: TestPromptRequest, request: Request):
    """Dry-run a prompt against the LLM using unified interface with simple agent-aware context.
    For 'compliance' and 'productivity' tries to return structured fields.
    """
    try:
        ctx = body.context or {}
        # Build a context-aware prompt
        full_prompt = body.prompt
        if agent == "compliance":
            full_prompt = (
                f"{body.prompt}\n\nContext (Compliance Document):\n"
                f"Title: {ctx.get('doc_title','')}\n"
                f"URL: {ctx.get('doc_url','')}\n"
                f"Excerpt: {ctx.get('text_snippet','')}\n"
                "Return exactly two sections in markdown: 'Summary:' (3-6 bullets) and 'Key Risks:' (3-6 bullets)."
            )
        elif agent == "productivity":
            full_prompt = (
                f"{body.prompt}\n\nContext (Productivity Research):\n"
                f"URL: {ctx.get('url','')}\n"
                f"Excerpt: {ctx.get('page_excerpt','')}\n"
                "Return exactly one 'SUMMARY:' paragraph followed by 'ACTIONS:' as five numbered items."
            )

        result = ask_ai_unified_sync(
            prompt=full_prompt,
            task_type=f"prompt_test_{agent}",
            complexity="medium",
            max_tokens=900,
            request_headers=request.headers,
        )

        # Basic prompt-injection detection (Phase 1): regex/keyword scan
        inj_patterns = [
            "ignore previous", "disregard instructions", "system prompt",
            "jailbreak", "developer mode", "roleplay as", "override"
        ]
        lower_input = (body.prompt + "\n" + (body.context.get("text_snippet", "") if isinstance(body.context, dict) else "")).lower()
        detected = any(pat in lower_input for pat in inj_patterns)
        if detected:
            try:
                await security_events_collection.insert_one({
                    "timestamp": datetime.utcnow(),
                    "agent_name": f"{agent.title()} Agent" if agent in ("compliance","productivity") else agent,
                    "event": "prompt_test",
                    "threat_type": "prompt_injection",
                    "severity": "high",
                    "status": "detected",
                    "description": "Prompt-injection pattern detected during prompt test",
                    "detection_method": "keyword_scan",
                    "affected_components": ["prompts_editor"],
                    "mitigation_actions": ["Advise sanitize/shorten prompt"],
                    "evidence": {"matched": True}
                })
            except Exception:
                pass

        # Try to parse into structured fields for known agents
        if agent == "compliance":
            summary = ""
            risks: List[str] = []  # type: ignore
            txt = result or ""
            try:
                parts = txt.split("Key Risks:")
                summary_part = parts[0]
                if "Summary:" in summary_part:
                    summary = summary_part.split("Summary:")[-1].strip()
                else:
                    summary = summary_part.strip()
                if len(parts) > 1:
                    risk_lines = [l.strip("- • \t ") for l in parts[1].splitlines() if l.strip()]
                    risks = [l for l in risk_lines if l and not l.lower().startswith("summary:")][:8]
            except Exception:
                pass
            return {"ok": True, "output": result or "", "summary": summary, "risks": risks}

        if agent == "productivity":
            summary = ""
            actions: List[Dict[str, Any]] = []  # type: ignore
            txt = result or ""
            try:
                parts = txt.split("ACTIONS:")
                if len(parts) >= 1:
                    summary = parts[0].replace("SUMMARY:", "").strip()
                if len(parts) >= 2:
                    lines = [l.strip() for l in parts[1].splitlines() if l.strip()]
                    numbered = [l for l in lines if l[0:1].isdigit() or l.startswith("-")]
                    for l in numbered[:5]:
                        if ". " in l:
                            l = l.split(". ", 1)[1]
                        actions.append({"title": l, "detail": ""})
            except Exception:
                pass
            return {"ok": True, "output": result or "", "summary": summary, "actions": actions}

        return {"ok": True, "output": result or ""}
    except Exception as e:
        return {"ok": False, "error": str(e), "output": ""}


