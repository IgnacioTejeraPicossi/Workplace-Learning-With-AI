"""
Self-Simulating Reality Agent — Learning Path (V3)
==================================================
Plan §8: a suggested reading order through the module. Deliberately deterministic
and LLM-free (fast, offline, honest): a **curated curriculum** ordered by evidence
level — established science first, then mainstream, then the speculative OPH core,
then philosophy, then hands-on practice — so the reader builds epistemic footing
before meeting the speculative material.

The only "smart" part uses the **vector store**: given an optional learning goal,
the store finds the most relevant knowledge-base chunk and we recommend the stage
that covers it as the entry point (prerequisites still shown before it).

The stage TEXT (title / what / why) lives in the frontend i18n so it stays fully
localized (EN/ES/NO); the backend returns only the structure + recommended start.
"""

from typing import Any, Dict, List, Optional

from backend.services import self_sim_reality_vectorstore as vectorstore

LEARNING_VERSION = "1.0.0"

# Ordered curriculum. Each stage maps to a module tab, carries the dominant
# epistemic level for that stage, and lists the KB concept ids it covers (used to
# route a goal to its entry stage). Order encodes the pedagogy: evidence first.
STAGES: List[Dict[str, Any]] = [
    {"id": "rules",                "tab": "overview",          "level": "established",
     "concept_ids": []},
    {"id": "established_brain",    "tab": "theoryTour",        "level": "established",
     "concept_ids": ["friston-fep"]},
    {"id": "mainstream_physics",   "tab": "theoryTour",        "level": "mainstream",
     "concept_ids": ["holographic-principle", "celestial-holography", "rovelli-rqm"]},
    {"id": "consciousness_science","tab": "theoryTour",        "level": "mainstream",
     "concept_ids": ["iit-tononi", "gnw-dehaene"]},
    {"id": "oph_core",             "tab": "concepts",          "level": "speculative",
     "concept_ids": ["oph-observer-patch", "oph-self-simulating"]},
    {"id": "oph_mechanism",        "tab": "ophMechanics",      "level": "speculative",
     "concept_ids": ["oph-overlap-consensus", "oph-fixed-point"]},
    {"id": "philosophy",           "tab": "substrateQuestion", "level": "philosophy",
     "concept_ids": ["bostrom-simulation"]},
    {"id": "ai_frontier",          "tab": "aiAsObserver",      "level": "philosophy",
     "concept_ids": ["ai-as-observer"]},
    {"id": "practice",             "tab": "dialogue",          "level": "speculative",
     "concept_ids": []},
]

_MAX_GOAL_CHARS = 300


def _recommended_start(goal: str) -> str:
    """Route a goal to its entry stage via the vector store; default to the start."""
    goal = (goal or "").strip()
    if not goal:
        return STAGES[0]["id"]
    try:
        res = vectorstore.search(goal, k=1, backend="tfidf")
        if res["results"]:
            cid = res["results"][0]["id"]
            for s in STAGES:
                if cid in s["concept_ids"]:
                    return s["id"]
    except Exception:
        pass
    return STAGES[0]["id"]


def learning_path(goal: str = "") -> Dict[str, Any]:
    """Return the ordered curriculum + a recommended entry stage for the goal.

    Deterministic; never raises.
    """
    goal = (goal or "").strip()[:_MAX_GOAL_CHARS]
    return {
        "goal": goal,
        "stages": STAGES,
        "recommended_start": _recommended_start(goal),
        "count": len(STAGES),
        "version": LEARNING_VERSION,
    }


def health() -> Dict[str, Any]:
    return {"status": "ok", "component": "self_sim_reality_learning",
            "version": LEARNING_VERSION, "stages": len(STAGES)}
