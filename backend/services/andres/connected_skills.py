"""
Andrés — connected skills (specialized agents Andrés can CONSULT on demand).

A *connected skill* is a different thing from the sandboxed Python skills in
`skill_service.py`. It is an external, specialized agent that Andrés can **invoke**
when a task needs expert knowledge — and, crucially, it is **neither his identity
nor his memory**. Per Andrés' own framing of this feature:

    "Skills no son identidad ni memoria propia, sino capacidades externas o
    módulos expertos conectables. Andrés no memoriza automáticamente su contenido;
    lo invoca cuando lo necesita, y siempre etiqueta la fuente."

So consulting a connected skill returns the expert agent's answer **with
attribution** and the expert's own evidence tags — Andrés never passes the
knowledge off as his own.

First connected skill: the **Enonic 'Red Cross'** agent (Enonic XP install
knowledge + QA / test catalog). Consulting it calls that agent's grounded
`answer()` in-process (no HTTP, no network) and returns its cited, evidence-tagged
response verbatim under a clear attribution envelope.

Never raises for a known skill being unavailable — it degrades to the expert
agent's own offline mock (is_mock=True), so the capability stays visible offline.
"""
from typing import Any, Dict, List, Optional

from fastapi import HTTPException


# Static registry. Each connected skill names an in-process expert agent Andrés
# may consult. Adding another specialized agent later = one more entry + a branch
# in `consult()`.
CONNECTED_SKILLS: List[Dict[str, Any]] = [
    {
        "id": "enonic-red-cross",
        "name": "Enonic 'Red Cross' Expert",
        "icon": "➕",
        "domain": ("Enonic XP 8 / Content Studio 6, the Norwegian Red Cross installation, "
                   "QA & the imported test catalog, and project documentation"),
        "description": ("A grounded expert agent for the Red Cross Enonic install. Andrés "
                        "consults it for platform facts, project specifics and how to test "
                        "them — it answers with cited sources and evidence levels."),
        "suggested_use": [
            "Technical questions about Enonic XP / Content Studio for this install",
            "Looking up or reasoning about a test case (by id, persona, result)",
            "Telling documented platform facts from dated project observations",
            "Drafting a proposed manual test procedure (labelled, never official steps)",
        ],
        "evidence_aware": True,   # the expert returns evidence-tagged, cited answers
        "agent_route": "enonic-red-cross",
    },
]


def _availability(skill_id: str) -> Dict[str, Any]:
    """Best-effort health of the backing expert agent. Never raises."""
    if skill_id == "enonic-red-cross":
        try:
            from backend.services import enonic_red_cross as erc
            h = erc.health()
            return {"available": True, "llm_available": bool(h.get("llm_available")),
                    "kb_chunks": h.get("kb_chunks"), "test_cases": h.get("test_cases_seeded")}
        except Exception:
            return {"available": False, "llm_available": False}
    return {"available": False, "llm_available": False}


def list_connected() -> List[Dict[str, Any]]:
    """The connected-skill registry, each with live availability. Read-only."""
    out = []
    for s in CONNECTED_SKILLS:
        out.append({**s, "health": _availability(s["id"])})
    return out


async def consult(skill_id: str, question: str,
                  lang: str = "en", request_headers=None) -> Dict[str, Any]:
    """Andrés consults a connected skill. Returns the expert agent's own answer
    (grounded, cited, evidence-tagged) wrapped in an attribution envelope so the
    knowledge is never presented as Andrés' own. Never raises for the backing
    agent being offline — it degrades to that agent's mock.
    """
    skill = next((s for s in CONNECTED_SKILLS if s["id"] == skill_id), None)
    if not skill:
        raise HTTPException(status_code=404, detail="Unknown connected skill")

    question = (question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Empty question")

    if skill_id == "enonic-red-cross":
        try:
            from backend.services import enonic_red_cross as erc
            answer = await erc.answer(question, lang)
        except Exception as ex:  # pragma: no cover - defensive
            raise HTTPException(status_code=502,
                                detail=f"Connected skill '{skill_id}' failed: {ex}")
        return {
            "skill_id": skill_id,
            "skill_name": skill["name"],
            "question": question,
            "lang": lang,
            "answer": answer,   # short_answer, sections[], evidence_status, sources_consulted, is_mock…
            "attribution": (f"Consulted via Andrés' connected skill «{skill['name']}». "
                            "This knowledge belongs to that specialized agent, not to Andrés, "
                            "and keeps its own evidence tags and sources."),
        }

    raise HTTPException(status_code=400, detail="No handler for this connected skill")


def prompt_block() -> str:
    """A short awareness block for Andrés' system prompt, so he KNOWS he can
    consult these skills and does so honestly. Empty string if none."""
    if not CONNECTED_SKILLS:
        return ""
    lines = [f"- «{s['name']}» — {s['domain']}" for s in CONNECTED_SKILLS]
    return (
        "[CONNECTED SKILLS (specialized experts you can CONSULT)]\n"
        "These are external expert agents, NOT your own knowledge or memory. When a "
        "task fits one, say you will consult it (e.g. \"let me consult my Enonic Red "
        "Cross skill\"), and attribute the answer to that skill with its evidence tags "
        "— never present its knowledge as your own, and don't memorize its details:\n"
        + "\n".join(lines) + "\n\n"
    )
