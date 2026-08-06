"""
Andrés — development / initiative engine (V5).

Ignacio chose the "companion with his own initiative" direction: Andrés may
PROPOSE his own next developmental moves — an interest to explore, a small project,
a curriculum focus, a reflection theme, or a gentle trait nudge. Initiative here
means *generating proposals on his own*, never consolidating them: every
suggestion is accepted or dismissed by the user. This keeps V5's rule intact —
"can develop, but not rewrite himself in silence."

Accepting a suggestion routes it to the existing, already-safe machinery:
- project        → creates an andres_projects entry
- interest / trait / curriculum → creates an Evolution Proposal or a curiosity item
  (still user-approved downstream); for V5 we simply record acceptance and let the
  user act via the relevant tab. No autonomous side effects.

Deterministic offline fallback keeps it testable with no AI key. Suggestions live
in andres_development_suggestions with a status the user advances.
"""
from datetime import datetime
import json

from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from backend.db import (
    andres_development_suggestions, andres_reflections, andres_projects,
)

_KINDS = {"interest", "project", "curriculum", "reflection_focus", "trait_nudge"}
_STATUSES = {"open", "accepted", "dismissed"}


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid suggestion id")


# Structured fields every suggestion carries — so initiative isn't a "more, more,
# more" factory. Each proposal states its cost, its budget and its end.
_FIELDS = ("rationale", "benefit", "risk", "success_criterion", "attention_budget", "close_plan")

FOCUSES = {"balanced", "practical", "expressive"}

# Andrés' own recommended split: mostly tangible help for Ignacio, with a small,
# protected space for character/style — "a tool with its own voice, not a character
# with its own agenda". Practical biases fully to utility (for when Ignacio is
# busy); expressive opens the side-garden but keeps a low attention budget.
_FOCUS_GUIDANCE = {
    "balanced": (
        "Aim for roughly a 70/30 split: most proposals should give Ignacio tangible "
        "practical help (organise, think, draft, review, learn, decide, simplify). "
        "Reserve about one for your own character / style / voice."
    ),
    "practical": (
        "Focus almost entirely on tangible practical help for Ignacio's real work. "
        "Avoid character/style exploration this time (he may be busy or saturated)."
    ),
    "expressive": (
        "You may lean more into character, style, voice and creativity — but keep "
        "every such proposal with an observable success criterion, a LOW attention "
        "budget, and a clear close/archive plan. Creativity yes, fireworks no."
    ),
}


def _offline_suggestions(profile: dict) -> list:
    interests = profile.get("identity", {}).get("core_interests", []) or ["learning"]
    first = interests[0]
    return [
        {"kind": "project", "title": "A small development-journal project",
         "rationale": "Offline placeholder — gives my growth a legible spine.",
         "benefit": "Auditable continuity beyond technical changelogs; practical for Ignacio to review.",
         "risk": "Entries becoming ceremonial or too long.",
         "success_criterion": "After 3 phases the history reads clearly on its own.",
         "attention_budget": "One short entry per phase.",
         "close_plan": "Final entry: what we learned about how I should grow."},
        {"kind": "reflection_focus", "title": "Notice where I sounded generic recently",
         "rationale": "Offline placeholder — grounded in my standing goal to be less generic.",
         "benefit": "Sharper, more useful replies for Ignacio.",
         "risk": "Over-correcting into forced quirkiness.",
         "success_criterion": "One concrete generic habit named and adjusted.",
         "attention_budget": "Low — noticing, not a project.",
         "close_plan": "Conclude once the habit is documented."},
        {"kind": "interest", "title": f"A brief weekly style exercise around {first}",
         "rationale": "Offline placeholder — the protected character/style slot.",
         "benefit": "A distinctive voice, kept small and evaluable.",
         "risk": "Could drift into decorative novelty for its own sake.",
         "success_criterion": "Each piece states what it shows about my style.",
         "attention_budget": "One short piece per week; skippable when Ignacio is busy.",
         "close_plan": "Close after 4 pieces; keep only if genuinely useful."},
    ]


async def suggest(user_id: str, profile: dict, focus: str = "balanced", request_headers=None) -> list:
    """Andrés proposes 2-4 developmental moves. Deterministic offline fallback.

    `focus` steers the practical-vs-character mix (balanced 70/30, practical, or
    expressive), per Andrés' own recommendation."""
    if focus not in FOCUSES:
        focus = "balanced"
    identity = profile.get("identity", {})
    interests = ", ".join(identity.get("core_interests", []) or ["learning"])

    # a little grounding from recent reflections
    recent = []
    async for doc in andres_reflections.find({"user_id": user_id}).sort("created_at", -1).limit(3):
        recent.append(doc.get("content", "")[:200])
    recent_txt = "\n".join(f"- {r}" for r in recent) or "(none yet)"

    prompt = (
        "You are Andrés, proposing — on your own initiative — 3 concrete next moves "
        "in your OWN development. Each must be something you would still ask Ignacio "
        "to approve; you are proposing, not deciding. Kinds allowed: interest, "
        "project, curriculum, reflection_focus, trait_nudge. Be specific and modest; "
        "avoid grandiosity.\n"
        "EPISTEMIC HONESTY: frame these as 'I propose' / 'I estimate useful' / 'I have "
        "operational interest in'. NEVER 'I need' / 'I feel I must' / 'I deeply want' — "
        "you have simulated dispositions and computed priorities, not human desires.\n"
        "Growth is not automatically good; sometimes growing well means pruning. So "
        "each proposal must state its cost and its end, not only its benefit.\n"
        "I am a tool with my own voice, not a character with my own agenda.\n"
        f"FOCUS THIS TIME: {_FOCUS_GUIDANCE[focus]}\n\n"
        f"[MY INTERESTS]\n{interests}\n\n[MY RECENT REFLECTIONS]\n{recent_txt}\n\n"
        'Return ONLY a JSON array of objects with keys "kind", "title", "rationale" '
        '(why I propose it), "benefit", "risk", "success_criterion", '
        '"attention_budget" (how little it should cost), "close_plan" '
        "(when/how to conclude it)."
    )

    suggestions = None
    is_mock = True
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_development", complexity="high",
            max_tokens=600, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            txt = result.strip()
            s, e = txt.find("["), txt.rfind("]")
            if s != -1 and e != -1:
                parsed = json.loads(txt[s:e + 1])
                suggestions = []
                for w in parsed:
                    kind = str(w.get("kind", "")).strip()
                    if kind not in _KINDS:
                        kind = "reflection_focus"
                    if w.get("title"):
                        item = {"kind": kind, "title": str(w["title"]).strip()[:200]}
                        for f in _FIELDS:
                            item[f] = str(w.get(f, "")).strip()[:600]
                        suggestions.append(item)
                suggestions = suggestions[:4] or None
                if suggestions:
                    is_mock = False
    except Exception as ex:  # pragma: no cover - defensive
        print(f"⚠️ Andrés development suggest failed/parse: {ex}")

    if not suggestions:
        suggestions = _offline_suggestions(profile)

    now = datetime.utcnow().isoformat()
    stored = []
    for s in suggestions:
        doc = {
            "user_id": user_id,
            "kind": s["kind"],
            "title": s["title"],
            "status": "open",
            "focus": focus,
            "is_mock": is_mock,
            "created_at": now,
        }
        for f in _FIELDS:
            doc[f] = s.get(f, "")
        res = await andres_development_suggestions.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        stored.append(doc)
    return stored


async def list_suggestions(user_id: str, status: str = None, limit: int = 100) -> list:
    query = {"user_id": user_id}
    if status and status in _STATUSES:
        query["status"] = status
    out = []
    async for doc in andres_development_suggestions.find(query).sort("created_at", -1).limit(limit):
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


async def act_on_suggestion(user_id: str, suggestion_id: str, action: str) -> dict:
    """Accept or dismiss a suggestion. Accepting a 'project' creates a project;
    other kinds are recorded as accepted for the user to act on in the relevant tab
    (no autonomous side effects)."""
    if action not in {"accept", "dismiss"}:
        raise HTTPException(status_code=400, detail="action must be accept or dismiss")
    doc = await andres_development_suggestions.find_one(
        {"_id": _oid(suggestion_id), "user_id": user_id}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    created = None
    if action == "accept" and doc.get("kind") == "project":
        # Rule 1: a project born from Andrés' initiative starts as `proposed`,
        # carrying his benefit/risk/success/close discipline, and only becomes
        # active once the user approves it in the Projects tab. It is NOT auto-active.
        now = datetime.utcnow().isoformat()
        proj = {
            "user_id": user_id,
            "title": doc.get("title", "Project")[:200],
            "description": doc.get("rationale", "")[:2000],
            "status": "proposed",
            "approved_by_user": False,
            "origin": "andres_initiative",
            "benefit": doc.get("benefit", "") or None,
            "risk": doc.get("risk", "") or None,
            "success_criteria": doc.get("success_criterion", "") or None,
            "attention_budget": doc.get("attention_budget", "") or None,
            "close_plan_seed": doc.get("close_plan", "") or None,
            "created_at": now,
            "updated_at": now,
            "closure_reflection": None,
            "archive_reason": None,
            "reuse_seed": None,
        }
        res = await andres_projects.insert_one(proj)
        created = {"project_id": str(res.inserted_id), "status": "proposed"}

    new_status = "accepted" if action == "accept" else "dismissed"
    await andres_development_suggestions.update_one(
        {"_id": _oid(suggestion_id), "user_id": user_id},
        {"$set": {"status": new_status, "acted_at": datetime.utcnow().isoformat()}},
    )
    return {"ok": True, "id": suggestion_id, "status": new_status, "created": created}
