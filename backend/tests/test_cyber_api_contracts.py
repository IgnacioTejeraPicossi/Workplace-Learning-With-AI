"""
Cybersecurity module — API contract tests (offline, mock-first).

The module keeps all state in memory (no MongoDB), so this suite runs with no
database, no LLM key and no external tools. The RAG test patches the LLM to
None to force the deterministic fallback.

Run:  python -m pytest backend/tests/test_cyber_api_contracts.py -v
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport

from backend.app import app

BASE = "http://test"


async def _get(path: str):
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        return await c.get(path)


async def _post(path: str, json=None):
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        return await c.post(path, json=json)


# ── Health & catalogues ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health():
    r = await _get("/api/cyber/health")
    assert r.status_code == 200
    assert r.json().get("status") in ("healthy", "ok")


@pytest.mark.asyncio
async def test_threats_list_and_detail():
    r = await _get("/api/cyber/threats")
    assert r.status_code == 200
    threats = r.json()
    assert isinstance(threats, list) and threats
    t0 = threats[0]
    for field in ("id", "name", "category", "cia_impact", "description", "controls"):
        assert field in t0
    # Detail + 404
    r2 = await _get(f"/api/cyber/threats/{t0['id']}")
    assert r2.status_code == 200 and r2.json()["id"] == t0["id"]
    r3 = await _get("/api/cyber/threats/NOPE-999")
    assert r3.status_code == 404


@pytest.mark.asyncio
async def test_controls_list():
    r = await _get("/api/cyber/controls")
    assert r.status_code == 200
    controls = r.json()
    assert isinstance(controls, list) and len(controls) >= 10
    assert all("framework" in c and "id" in c for c in controls)


@pytest.mark.asyncio
async def test_knowledge_articles_and_categories():
    r = await _get("/api/cyber/knowledge/articles")
    assert r.status_code == 200
    arts = r.json()
    assert isinstance(arts, list) and arts
    art_id = arts[0]["id"]
    r2 = await _get(f"/api/cyber/knowledge/articles/{art_id}")
    assert r2.status_code == 200 and "content" in r2.json()
    r3 = await _get("/api/cyber/knowledge/categories")
    assert r3.status_code == 200


# ── Posture / risk ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_risk_score_bounds():
    r = await _get("/api/cyber/risk/score")
    assert r.status_code == 200
    d = r.json()
    assert 0.0 <= d["overall"] <= 100.0
    assert d["trend"] in ("improving", "stable", "degrading")


@pytest.mark.asyncio
async def test_posture_nist_domains():
    r = await _get("/api/cyber/posture/nist-domains")
    assert r.status_code == 200


# ── Compliance (incl. new validation) ────────────────────────────────────────

@pytest.mark.asyncio
async def test_compliance_status_and_summary_consistency():
    r = await _get("/api/cyber/compliance/status")
    assert r.status_code == 200
    statuses = r.json()
    assert statuses and all("framework" in s and "status" in s for s in statuses)

    r2 = await _get("/api/cyber/compliance/summary")
    assert r2.status_code == 200
    summary = r2.json()
    assert summary["total_controls"] == len(statuses)
    assert 0 <= summary["overall_completion_pct"] <= 100


@pytest.mark.asyncio
async def test_compliance_update_valid_and_invalid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        # Valid update
        r = await c.put("/api/cyber/compliance/CIS/4.1",
                        json={"status": "partial", "evidence": "Hardening rollout started"})
        assert r.status_code == 200
        assert r.json()["status"] == "partial"
        # Invalid status value → 422 (validated Literal)
        r2 = await c.put("/api/cyber/compliance/CIS/4.1", json={"status": "banana"})
        assert r2.status_code == 422
        # Unknown control → 404
        r3 = await c.put("/api/cyber/compliance/CIS/99.9", json={"status": "implemented"})
        assert r3.status_code == 404
        # Restore seed value so test order doesn't matter
        await c.put("/api/cyber/compliance/CIS/4.1",
                    json={"status": "not_implemented",
                          "evidence": "CIS Benchmarks not yet applied to all systems"})


# ── Vulnerability scan (no external tools required) ──────────────────────────

@pytest.mark.asyncio
async def test_scan_unknown_type_flagged():
    r = await _post("/api/cyber/vulnerabilities/scan",
                    json={"project": "default", "scan_types": ["bogus"]})
    assert r.status_code == 200
    d = r.json()
    assert d["bogus"]["success"] is False


@pytest.mark.asyncio
async def test_vulnerabilities_summary():
    r = await _get("/api/cyber/vulnerabilities/summary")
    assert r.status_code == 200


# ── RAG (forced offline fallback → deterministic) ────────────────────────────

@patch("backend.routers.cybersecurity.ask_ai_unified", None)
@pytest.mark.asyncio
async def test_rag_ask_offline_fallback_contract():
    r = await _post("/api/cyber/rag/ask", json={"question": "How do I prevent phishing?"})
    assert r.status_code == 200
    d = r.json()
    for field in ("answer", "sources", "confidence", "processing_time", "is_mock"):
        assert field in d
    assert d["is_mock"] is True
    assert "phishing" in d["answer"].lower()
    # Validation: empty question → 422
    r2 = await _post("/api/cyber/rag/ask", json={"question": ""})
    assert r2.status_code == 422


# ── Incident drills (full flow) ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_drill_full_flow():
    r = await _get("/api/cyber/drills/scenarios")
    assert r.status_code == 200
    scenarios = r.json()
    assert scenarios
    sid = scenarios[0]["id"]

    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r2 = await c.post(f"/api/cyber/drills/start/{sid}")
        assert r2.status_code == 200
        session = r2.json()["session"]
        step = r2.json()["step"]
        assert session["total_steps"] >= 1 and step is not None

        # Answer the first step with the known-correct option → score increments
        r3 = await c.post(f"/api/cyber/drills/{session['id']}/action",
                          params={"chosen_option": step["correct_option"]})
        assert r3.status_code == 200
        fb = r3.json()["feedback"]
        assert fb["is_correct"] is True
        assert r3.json()["session"]["score"] == 1

        # Session state retrievable; unknown session → 404
        r4 = await c.get(f"/api/cyber/drills/{session['id']}")
        assert r4.status_code == 200
        r5 = await c.get("/api/cyber/drills/does-not-exist")
        assert r5.status_code == 404
        # Unknown scenario → 404
        r6 = await c.post("/api/cyber/drills/start/nope")
        assert r6.status_code == 404


# ── Coach & agent-security surface ───────────────────────────────────────────

@pytest.mark.asyncio
async def test_coach_topics_contract():
    r = await _get("/api/cyber/coach/topics")
    assert r.status_code == 200
    topics = r.json()
    assert topics and all("id" in t and "title" in t for t in topics)


@pytest.mark.asyncio
async def test_agent_security_overview():
    r = await _get("/api/agent-security/overview")
    assert r.status_code == 200
    r2 = await _get("/api/agent-security/health")
    assert r2.status_code == 200
