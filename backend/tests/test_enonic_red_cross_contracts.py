"""
Enonic 'Red Cross' Agent — contract tests (offline, CI-safe).

The router + service run with no LLM: ask_ai_unified is either None (mock path)
or patched to a deterministic AsyncMock (LLM parse + sanitize path). No network
or model access. Checks the grounding, the seeded catalog, and the epistemic
discipline (every section tagged; off-palette levels clamped; never empty).

Run: python -m pytest backend/tests/test_enonic_red_cross_contracts.py -v
"""
import json
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.services import enonic_red_cross as svc

BASE = "http://test"

_LEVELS = {"platform-doc", "project-fact", "project-observation", "test-recipe", "guidance", "unsupported"}
_STATUS = {"supported", "partial", "insufficient"}


def test_retrieve_exact_id_and_keyword_grounded():
    # an explicit test id surfaces that case's grounding chunk first
    ids = [c["id"] for c in svc.retrieve("How should I test case 29376?")]
    assert ids[0] == "case-29376"
    # a platform/publish question retrieves the relevant curated chunks
    pub = [c["id"] for c in svc.retrieve("how does the publish flow work in content studio")]
    assert "rk-publish-flow" in pub
    # an unrelated query still returns a non-empty default grounding
    fb = svc.retrieve("zzzzz qqqqq")
    assert fb and len(fb) >= 1


def test_knowledge_base_is_wellformed():
    kb = svc.KNOWLEDGE_BASE
    assert len(kb) >= 12
    ids = [c["id"] for c in kb]
    assert len(ids) == len(set(ids))                 # no duplicate ids
    for c in kb:
        assert c["id"] and c["title"] and c["text"]
        assert c["level"] in _LEVELS
        assert c["sources"] and c["tags"]


def test_catalog_seed_and_filters():
    cat = svc.test_catalog()
    assert len(cat) >= 15
    # unique per (id, sprint) — the same test case can belong to several sprint suites
    keys = [(c["id"], c["sprint"]) for c in cat]
    assert len(keys) == len(set(keys))
    assert all(c["result"] in {"pass", "fail", "partial", "blocked", "planned"} for c in cat)
    # the 29376 CTA-button case is recorded as a FAIL (feature not deployed)
    f = svc.test_catalog(result="fail")
    assert "29376" in [c["id"] for c in f]
    # persona filter works
    red = svc.test_catalog(persona="Redaktør")
    assert red and all(c["persona"] == "Redaktør" for c in red)
    # multi-sprint support: Sprint 5, 6 (imported) + Sprint 7 (session) all present
    assert {"5", "6", "7"}.issubset(set(svc.sprints()))
    s5 = svc.test_catalog(sprint="5")
    s6 = svc.test_catalog(sprint="6")
    s7 = svc.test_catalog(sprint="7")
    assert len(s5) + len(s6) + len(s7) == len(cat)  # every case has a sprint
    assert len(s5) == 152 and len(s6) == 58 and len(s7) == 115
    assert svc.test_catalog(sprint="999") == []
    assert all(c["sprint"] == "6" for c in s6)
    # imported outcomes: Sprint 5 has 7 recorded failures, Sprint 6 has 2
    assert len(svc.test_catalog(sprint="5", result="fail")) == 7
    assert len(svc.test_catalog(sprint="6", result="fail")) == 2
    # Sprint 7 (complete) has many not-yet-run 'Active' cases → 'planned'
    assert len(svc.test_catalog(sprint="7", result="planned")) >= 40


def test_health_and_accessors():
    h = svc.health()
    assert h["status"] == "ok" and h["agent"] == "enonic_red_cross"
    assert h["kb_chunks"] == len(svc.knowledge())
    assert h["test_cases_seeded"] == len(svc.test_catalog())
    pc = svc.project_context()
    assert pc["context"]["public_test_frontend"].startswith("https://next.lunix.cloud")
    assert pc["context"]["known_unknowns"]


def test_sanitize_clamps_offpalette_levels_and_status():
    out = svc._sanitize({
        "sections": [{"level": "totally-made-up", "text": "x"}, "not-a-dict"],
        "evidence_status": "99%",
    }, chunks=[])
    assert out["sections"][0]["level"] == "guidance"      # clamped
    assert out["evidence_status"] == "partial"            # clamped
    assert isinstance(out["missing_information"], list)


@pytest.mark.asyncio
async def test_chat_mock_path_is_wellformed():
    # No LLM available -> deterministic trilingual mock, still fully tagged.
    with patch.object(svc, "ask_ai_unified", None):
        async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as ac:
            r = await ac.post("/api/enonic-red-cross/chat",
                              json={"message": "Which content types are deployed?", "lang": "es"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    assert d["evidence_status"] in _STATUS
    assert d["sections"] and all(s["level"] in _LEVELS for s in d["sections"])


@pytest.mark.asyncio
async def test_chat_llm_path_parses_and_sanitizes():
    payload = json.dumps({
        "short_answer": "Seven content types are deployed.",
        "sections": [{"kind": "project", "level": "project-fact",
                      "text": "branch-district, branch-local, frontpage, list-page, news-article, page, story-article.",
                      "sources": ["schema/content/all"]},
                     {"kind": "x", "level": "bogus-level", "text": "y", "sources": []}],
        "evidence_status": "supported",
        "missing_information": [],
        "suggested_next_question": "Want the public URL patterns?",
    })
    with patch.object(svc, "ask_ai_unified", AsyncMock(return_value=payload)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as ac:
            r = await ac.post("/api/enonic-red-cross/chat",
                              json={"message": "content types?", "lang": "en"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert d["sections"][0]["level"] == "project-fact"
    assert d["sections"][1]["level"] == "guidance"        # off-palette clamped
    assert d["evidence_status"] == "supported"


@pytest.mark.asyncio
async def test_catalog_endpoint_filters():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as ac:
        r = await ac.get("/api/enonic-red-cross/test-catalog", params={"result": "fail"})
        k = await ac.get("/api/enonic-red-cross/knowledge")
        h = await ac.get("/api/enonic-red-cross/health")
    assert r.status_code == 200 and all(c["result"] == "fail" for c in r.json()["cases"])
    assert k.status_code == 200 and k.json()["count"] >= 12
    assert h.status_code == 200 and h.json()["status"] == "ok"
