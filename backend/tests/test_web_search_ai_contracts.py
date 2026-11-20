"""
Web Search — AI + Internet grounded-answer contract tests (offline).

The /api/web-search-ai endpoint runs a DuckDuckGo search and asks the LLM to
synthesize a cited answer. Tests mock BOTH the search (no network) and the LLM
(no key), so they run fully offline and deterministically.

Run:  python -m pytest backend/tests/test_web_search_ai_contracts.py -v
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.simple_web_search import SearchResult, _ws_cache_clear

BASE = "http://test"


@pytest.fixture(autouse=True)
def _clear_ws_cache():
    # The /web-search-ai cache is module-level; clear it around each test so the
    # same query across tests doesn't return a previous test's cached answer.
    _ws_cache_clear()
    yield
    _ws_cache_clear()

_SAMPLE = {
    "results": [
        SearchResult(title="EU AI Act overview", url="https://example.com/a", snippet="The Act entered into force..."),
        SearchResult(title="Timeline of obligations", url="https://example.com/b", snippet="Phased deadlines through 2026..."),
    ],
    "query": "eu ai act 2026",
    "provider": "DuckDuckGo",
}


@patch("backend.llm.ask_ai_unified_sync", return_value="The EU AI Act is phased in through 2026 [1][2].")
@patch("backend.simple_web_search.simple_web_search", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_ai_answer_grounded(mock_search, mock_llm):
    mock_search.return_value = _SAMPLE
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/web-search-ai", json={"topic": "eu ai act 2026", "limit": 6})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is False
    assert "2026" in d["answer"]
    assert len(d["citations"]) == 2
    assert d["citations"][0]["url"] == "https://example.com/a"


@patch("backend.llm.ask_ai_unified_sync", return_value="[MOCKED RESPONSE] All AI providers unavailable")
@patch("backend.simple_web_search.simple_web_search", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_ai_answer_offline_fallback(mock_search, mock_llm):
    mock_search.return_value = _SAMPLE
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/web-search-ai", json={"topic": "eu ai act 2026"})
    assert r.status_code == 200
    d = r.json()
    assert d["is_mock"] is True
    # Deterministic grounded extract, no fabrication
    assert "Top sources found" in d["answer"]
    assert "EU AI Act overview" in d["answer"]


@patch("backend.simple_web_search.simple_web_search", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_ai_answer_no_results(mock_search):
    mock_search.return_value = {"results": [], "query": "zzz", "provider": "DuckDuckGo"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/web-search-ai", json={"topic": "zzz"})
    assert r.status_code == 200
    d = r.json()
    assert d["answer"] == ""
    assert d["citations"] == []


@pytest.mark.asyncio
async def test_validation_empty_topic():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.post("/api/web-search-ai", json={"topic": "   "})
    assert r.status_code == 422


@patch("backend.llm.ask_ai_unified_sync", return_value="Cached answer [1].")
@patch("backend.simple_web_search.simple_web_search", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_ai_answer_is_cached_per_query(mock_search, mock_llm):
    mock_search.return_value = _SAMPLE
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r1 = await c.post("/api/web-search-ai", json={"topic": "cache me", "limit": 6})
        r2 = await c.post("/api/web-search-ai", json={"topic": "cache me", "limit": 6})
    assert r1.status_code == 200 and r2.status_code == 200
    # The second identical query is served from cache -> upstream search ran once.
    assert mock_search.call_count == 1
    assert r1.json().get("cached") is None  # first call is a fresh miss
    assert r2.json().get("cached") is True  # second call is a cache hit
    assert r1.json()["answer"] == r2.json()["answer"]
