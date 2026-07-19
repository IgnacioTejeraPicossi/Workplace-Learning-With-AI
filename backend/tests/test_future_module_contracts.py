"""
Future module (Idea Log / Feature Roadmap / scaffolds) — contract tests.

Covers the 2026-07 audit fixes. The validation paths (malformed id, bad status,
bad email) return 400 BEFORE any Mongo call, so they run fully offline. The
scaffold test patches both the LLM (→ mock string) and the Mongo history insert,
so it is CI-safe with no database and no LLM key.

Run:  python -m pytest backend/tests/test_future_module_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app

BASE = "http://test"


# ── ObjectId guard: malformed id → 400 (was 500) ─────────────────────────────

@pytest.mark.asyncio
async def test_malformed_id_returns_400_not_500():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r_up = await c.post("/admin/unknown-intents/notavalidid/upvote")
        r_del = await c.delete("/admin/unknown-intents/xxx")
    assert r_up.status_code == 400
    assert r_del.status_code == 400


# ── Status validation: only the 5 roadmap states are accepted ────────────────

@pytest.mark.asyncio
async def test_invalid_status_returns_400():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        # Valid ObjectId shape but bogus status → 400 before Mongo write
        r = await c.post("/admin/unknown-intents/000000000000000000000000/status",
                         json={"status": "Bogus"})
    assert r.status_code == 400


# ── Email validation on subscribe ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_email_returns_400():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/admin/unknown-intents/000000000000000000000000/subscribe",
                         json={"email": "notanemail"})
    assert r.status_code == 400


# ── generate-scaffold: is_mock flag + useful deterministic stub offline ──────

@patch("backend.app.scaffold_history_collection")
@patch("backend.app.generate_scaffold")
@pytest.mark.asyncio
async def test_scaffold_is_mock_and_real_stub_offline(mock_gen, mock_coll):
    # Simulate no-LLM-key path: ask_openai returns a "[MOCKED RESPONSE]" string.
    mock_gen.return_value = "[MOCKED RESPONSE] This would be the AI's answer to: ..."
    mock_coll.insert_one = AsyncMock(return_value=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/generate-scaffold", json={
            "feature_name": "VR Learning",
            "feature_summary": "Let users learn in virtual reality",
            "scaffold_type": "API Route",
        })
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    # The bare placeholder is replaced by a real, buildable stub
    assert "[MOCKED RESPONSE]" not in d["code"]
    assert "APIRouter" in d["code"]
    assert mock_coll.insert_one.await_count == 1


@pytest.mark.asyncio
async def test_scaffold_requires_feature_name():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/generate-scaffold", json={"feature_name": "", "feature_summary": "x"})
    assert r.status_code == 422
