"""Offline contract & retrieval tests for the Hologram Guide (`backend/routers/hologram_agent.py`).

Verifies:
1. Section index loads README.md (and localized README.es.md / README.no.md),
   docs/llms.txt, and the README Viewer help guides (*-help.md).
2. Queries about recent modules (Red Cross Web QA, AGI Progress Hub, Web Lab,
   Robomind Clinic, J-messages Analyzer, Self-Simulating Reality, Andrés Robot)
   retrieve relevant documentation sections.
3. `_extract_actions_and_clean_reply` normalizes both structured ACTIONS JSON
   and natural-language module mentions to valid `App.jsx` section targets.
"""
from __future__ import annotations

from backend.routers.hologram_agent import (
    NAV_TARGET_LABELS,
    WLWAI_MODULE_CATALOG,
    _extract_actions_and_clean_reply,
    _load_sections,
    retrieve_relevant,
)


def test_sections_include_readme_and_viewer_guides():
    sections_en = _load_sections("en")
    docs_en = {s["doc"] for s in sections_en}
    assert "WLWAI_CATALOG" in docs_en
    assert "README.md" in docs_en
    assert "docs/llms.txt" in docs_en
    assert "docs/red-cross-qa-help.md" in docs_en
    assert "docs/self-sim-reality-help.md" in docs_en
    assert "docs/andres-robot-help.md" in docs_en

    sections_es = _load_sections("es")
    docs_es = {s["doc"] for s in sections_es}
    assert "README.es.md" in docs_es
    assert "docs/red-cross-qa-help.es.md" in docs_es


def test_retrieve_relevant_finds_modern_modules():
    rcqa_chunks = retrieve_relevant(
        "How do Settings and env_local_url work in Red Cross Web QA Agent?",
        k=5,
        language="en",
    )
    joined_rcqa = "\n".join(rcqa_chunks).lower()
    assert "red cross" in joined_rcqa
    assert "env_local_url" in joined_rcqa or "next.lunix.cloud" in joined_rcqa

    weblab_chunks = retrieve_relevant(
        "¿Qué hace el módulo Web Lab para Redcross.no web en el puerto 3102?",
        k=5,
        language="es",
    )
    joined_wl = "\n".join(weblab_chunks).lower()
    assert "3102" in joined_wl and ("web lab" in joined_wl or "redcross" in joined_wl)

    jmsg_chunks = retrieve_relevant(
        "How does J-messages Analyzer process Fiskeridirektoratet documents?",
        k=5,
        language="en",
    )
    assert any("j-messages" in c.lower() or "fiskeridirektoratet" in c.lower() for c in jmsg_chunks)


def test_extract_actions_structured_and_fallback():
    raw = (
        "You can test rodekors.no in Red Cross Web QA Agent or inspect AGI Progress.\n\n"
        'ACTIONS:\n[{"type": "NAVIGATE", "target": "red-cross-web-qa"}, '
        '{"type": "NAVIGATE", "target": "agi-progress"}]'
    )
    clean, actions = _extract_actions_and_clean_reply(raw, "Where can I test rodekors?")
    assert "ACTIONS:" not in clean
    targets = [a["target"] for a in actions]
    assert targets == ["red-cross-web-qa", "agi-progress"]
    assert all(a.get("label") for a in actions)

    # Heuristic fallback when LLM omits ACTIONS block
    clean2, actions2 = _extract_actions_and_clean_reply(
        "Puedes abrir Cruz Roja Web QA Agent o el Laboratorio Web.",
        "Quiero ver Cruz Roja",
    )
    targets2 = [a["target"] for a in actions2]
    assert "red-cross-web-qa" in targets2
    assert all(t in NAV_TARGET_LABELS for t in targets2)
    assert "red-cross-web-qa" in WLWAI_MODULE_CATALOG
