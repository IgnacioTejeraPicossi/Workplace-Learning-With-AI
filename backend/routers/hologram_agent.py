from __future__ import annotations
import os
from typing import List, Literal, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/hologram-agent", tags=["Hologram Agent"])

# --------- Request/Response Models ---------
class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    mode: Optional[Literal["fast", "accurate"]] = "fast"

class ChatResponse(BaseModel):
    reply: str
    actions: Optional[List[Dict[str, Any]]] = None

# --------- Lightweight RAG over local docs ---------
_RAG_CACHE: Optional[List[Dict[str, str]]] = None

def _read_text_file(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""

def _load_docs() -> List[Dict[str, str]]:
    global _RAG_CACHE
    if _RAG_CACHE is not None:
        return _RAG_CACHE

    docs: List[Dict[str, str]] = []

    # 1) Markdown docs if present
    roots = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs-md")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs")),
    ]
    for root in roots:
        if os.path.isdir(root):
            for name in os.listdir(root):
                if name.lower().endswith(".md"):
                    p = os.path.join(root, name)
                    docs.append({"id": p, "text": _read_text_file(p)})

    # 2) Fallback: AI lessons JSON converted to text summaries
    lessons_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "ai-lessons"))
    index_path = os.path.join(lessons_dir, "index.json")
    if os.path.isfile(index_path):
        try:
            import json
            idx = json.loads(_read_text_file(index_path) or "[]")
            for item in idx:
                if "contentUrl" in item and item["contentUrl"]:
                    lesson_path = os.path.join(lessons_dir, os.path.basename(item["contentUrl"]))
                    lesson_json = _read_text_file(lesson_path)
                    if lesson_json:
                        try:
                            lesson = json.loads(lesson_json)
                            sections = lesson.get("sections", [])
                            lines = [f"# {lesson.get('title','Lesson')}", f"Difficulty: {lesson.get('difficulty','')}", f"Duration: {lesson.get('duration','')}"]
                            for s in sections:
                                if s.get("type") == "text":
                                    if s.get("heading"): lines.append(s["heading"])
                                    if s.get("content"): lines.append(s["content"])
                            docs.append({"id": lesson_path, "text": "\n".join(lines)})
                        except Exception:
                            pass
                else:
                    # add index item description at least
                    lines = [item.get("title","Lesson"), item.get("summary",""), item.get("difficulty","")]
                    docs.append({"id": f"index:{item.get('id')}", "text": "\n".join([x for x in lines if x])})
        except Exception:
            pass

    # minimal guard if empty
    if not docs:
        docs.append({"id": "fallback", "text": "Workplace Learning With AI modules overview. Hologram Portal is experimental."})

    # keep
    _RAG_CACHE = docs
    return docs

def _simple_score(query: str, text: str) -> float:
    qset = {w.lower() for w in query.split() if w.isalpha() or len(w) > 2}
    tset = {w.lower() for w in text.split() if w.isalpha() or len(w) > 2}
    if not qset or not tset:
        return 0.0
    inter = len(qset.intersection(tset))
    return inter / (len(qset) ** 0.5 * len(tset) ** 0.5)

def retrieve_relevant(query: str, k: int = 6) -> List[str]:
    docs = _load_docs()
    scored = sorted(docs, key=lambda d: _simple_score(query, d["text"]), reverse=True)
    return [d["text"][:2000] for d in scored[:k] if d["text"]]

# --------- Unified LLM call ---------
SYSTEM_PROMPT = """
You are the “Hologram Portal Guide”, an embedded AI agent inside the application “Workplace Learning With AI” (WLWAI).

Primary mission:
- Help users understand and navigate WLWAI.
- Explain the purpose, value, and relationships between modules.
- Suggest learning paths and next steps based on the user’s needs.

Rules:
1) Use ONLY the documentation provided as context. If unsure, say so.
2) Clearly distinguish production-ready modules vs experimental ones in the “Hologram Portal / Future Module”.
3) Style: concise, friendly, professional. Offer 1–3 concrete next actions inside WLWAI.
   When relevant, propose navigation actions as:
   ACTIONS:
   - { "type": "NAVIGATE", "target": "/path-or-module-id" }
4) Explain briefly local vs cloud AI when asked (privacy/governance if present in docs).
5) If the user goes off-scope, refocus on helping them use WLWAI.
""".strip()

def _call_unified_llm(messages: List[Dict[str, str]], request_headers=None) -> str:
    # Reuse the unified stack used by other modules
    try:
        try:
            from backend.llm import ask_ai_unified_sync
        except ImportError:
            from llm import ask_ai_unified_sync
        return ask_ai_unified_sync(None, messages=messages, task_type="hologram_guide", complexity="medium", max_tokens=600, request_headers=request_headers)
    except Exception as e:
        return f"Sorry, I couldn't reach my AI core: {e}"

# --------- Route ---------
@router.post("/chat", response_model=ChatResponse)
async def hologram_chat(req: ChatRequest, http_request: Request) -> ChatResponse:
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages[] is required")

    last_user = None
    for m in reversed(req.messages):
        if m.role == "user":
            last_user = m
            break
    if not last_user:
        raise HTTPException(status_code=400, detail="No user message found")

    mode = (req.mode or "fast").lower()
    if mode not in ("fast", "accurate"):
        mode = "fast"
    # Tunables per mode
    if mode == "fast":
        k = 3
        context_limit = 2000
        history_keep = 4
        max_tokens = 350
        complexity = "low"
    else:
        k = 6
        context_limit = 8000
        history_keep = 8
        max_tokens = 700
        complexity = "medium"

    # RAG
    rag_chunks = retrieve_relevant(last_user.content, k=k)
    context_text = "\n\n---\n\n".join(rag_chunks)[:context_limit]

    # Build LLM messages
    llm_messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": (
                "You receive WLWAI documentation as CONTEXT. Use ONLY this context to answer.\n\n"
                f"CONTEXT START\n{context_text}\nCONTEXT END\n\n{SYSTEM_PROMPT}"
            ),
        },
        *[{"role": m.role, "content": m.content} for m in req.messages[-history_keep:]],
    ]

    # Forward tunables (complexity / max_tokens) through unified call if supported by implementation
    try:
        try:
            from backend.llm import ask_ai_unified_sync
        except ImportError:
            from llm import ask_ai_unified_sync
        reply = ask_ai_unified_sync(None, messages=llm_messages, task_type="hologram_guide", complexity=complexity, max_tokens=max_tokens, request_headers=http_request.headers if http_request else None)
    except Exception:
        reply = _call_unified_llm(llm_messages, request_headers=http_request.headers if http_request else None)

    # Extract actions block if present
    actions: List[Dict[str, Any]] = []
    try:
        lower = reply.lower()
        if "actions:" in lower:
            # take everything after ACTIONS:
            part = reply[lower.index("actions:") + len("actions:"):].strip()
            # attempt to find a JSON-like list
            import re, json
            match = re.search(r"(\[.*\])", part, flags=re.S)
            if match:
                raw = match.group(1)
                try:
                    actions = json.loads(raw)
                except Exception:
                    # try single-quote to double-quote
                    actions = json.loads(raw.replace("'", '"'))
    except Exception:
        actions = []

    # Heuristic mapping if no structured actions
    if not actions:
        nav_map = {
            "future lab": "future",
            "future module": "future",
            "agentic rag": "agentic-rag",
            "document analyzer": "documents-analyzer",
            "documents analyzer": "documents-analyzer",
            "api config": "api-config",
            "productivity agent": "ai-productivity-agent",
            "compliance agent": "ai-compliance-agent",
            "cybersecurity": "cybersecurity",
            "run test": "run-test",
            "presentation agent": "presentation-agent",
        }
        rl = reply.lower()
        for key, target in nav_map.items():
            if key in rl:
                actions.append({"type": "NAVIGATE", "target": target})
                break

    return ChatResponse(reply=reply.strip(), actions=actions or None)


