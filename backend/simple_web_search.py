from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from urllib.parse import quote_plus
import httpx
import re
import asyncio
import time

router = APIRouter()

class SimpleSearchRequest(BaseModel):
    topic: str
    limit: int = 10

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

@router.post("/simple-search")
async def simple_web_search(request: SimpleSearchRequest):
    """Simple web search using DuckDuckGo (no API key required)"""
    try:
        # Use the user's query verbatim. (Previously we appended
        # "best practices tutorial guide" to every query, which skewed all
        # results toward tutorials and broke news/factual/fresh lookups.)
        query = (request.topic or "").strip()
        if not query:
            raise HTTPException(status_code=422, detail="Empty search query")
        url = "https://html.duckduckgo.com/html/"
        params = {"q": query}

        # Use a realistic, current user agent to avoid blocking.
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            # POST (form submit) instead of GET: DuckDuckGo answers a GET to the
            # html endpoint with a 202 anti-bot "please wait" page (0 results),
            # but returns real results to the POST form submission.
            response = await client.post(url, headers=headers, data=params)
            response.raise_for_status()

            # A 202 (or any non-200) is DuckDuckGo's rate-limit / challenge page,
            # not results — treat it as an honest "no results" instead of parsing
            # the challenge HTML into garbage.
            if response.status_code != 200:
                print(f"⚠️ DuckDuckGo returned status {response.status_code} for: {query}")
                ddg_url = f"https://duckduckgo.com/?q={quote_plus(query)}"
                return {"results": [], "query": query, "provider": "DuckDuckGo", "fallback_url": ddg_url}

            # Parse HTML response to extract search results
            html_content = response.text
            
            # Extract results using regex patterns for DuckDuckGo HTML
            results = []
            
            # Pattern for DuckDuckGo result links
            # Look for links with class "result__a" or similar
            link_pattern = r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)</a>'
            snippet_pattern = r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([^<]*)</a>'
            
            # Find all links
            links = re.findall(link_pattern, html_content)
            snippets = re.findall(snippet_pattern, html_content)
            
            # Process results (limit to requested amount)
            for i, (url, title) in enumerate(links[:request.limit]):
                if url.startswith('/'):
                    # Skip internal DuckDuckGo links
                    continue
                    
                # Clean up the title
                title = re.sub(r'<[^>]+>', '', title).strip()
                
                # Get snippet if available
                snippet = ""
                if i < len(snippets):
                    snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                
                # Skip if no meaningful content
                if not title or len(title) < 10:
                    continue
                
                results.append(SearchResult(
                    title=title,
                    url=url,
                    snippet=snippet[:200] + "..." if len(snippet) > 200 else snippet
                ))
            
            # If parsing yielded nothing, be honest: return an empty result set
            # (the frontend shows a localized "no results" state) plus a link to
            # run the same query on DuckDuckGo. Previously this fabricated 10
            # fake, English-only "results" that looked real but were not.
            if not results:
                print(f"⚠️ DuckDuckGo parsing returned no results for: {query}")
                ddg_url = f"https://duckduckgo.com/?q={quote_plus(query)}"
                return {
                    "results": [],
                    "query": query,
                    "provider": "DuckDuckGo",
                    "fallback_url": ddg_url,
                }

            return {"results": results[:request.limit], "query": query, "provider": "DuckDuckGo"}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Search API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/search-health")
async def search_health():
    """Health check for search service"""
    return {"status": "healthy", "service": "duckduckgo-web-search"}


# ── AI + Internet: grounded answer with citations (1.30.7) ───────────────────
# Makes the "Web Search (AI + Internet)" module actually AI-grounded: it runs a
# fresh DuckDuckGo search and asks the LLM to synthesize a concise, cited answer
# using ONLY those sources. Reusable by other modules that need current info.
# Offline-safe: if no LLM is configured the answer falls back to a deterministic
# grounded extract of the top sources and is flagged is_mock=True.

def _deterministic_answer(query: str, results: List[SearchResult]) -> str:
    """Honest offline summary: the top source extracts, no fabrication."""
    lines = [f'Top sources found for "{query}":']
    for i, r in enumerate(results[:3]):
        snip = (r.snippet or "").strip()
        lines.append(f"[{i + 1}] {r.title}" + (f" — {snip}" if snip else ""))
    lines.append("(AI synthesis is unavailable offline — showing grounded source extracts.)")
    return "\n".join(lines)


def _synthesize_answer(query: str, results: List[SearchResult]):
    """Return (answer, is_mock). Never raises; falls back deterministically."""
    if not results:
        return "", False
    context = "\n".join(
        f"[{i + 1}] {r.title}\n{(r.snippet or '').strip()}\n({r.url})"
        for i, r in enumerate(results)
    )
    prompt = (
        "You are a research assistant. Using ONLY the numbered web sources below "
        "(their titles and snippets), write a concise, useful answer to the user's "
        "query in 3-6 sentences, citing sources inline as [n]. The snippets may be "
        "short — when they don't contain full details, still summarize the main "
        "themes and signals the sources point to, and note briefly that it is based "
        "on titles/snippets rather than refusing to answer. Do not invent specific "
        "facts, numbers or URLs beyond what the sources state.\n\n"
        f"User query: {query}\n\nSources:\n{context}\n\nAnswer:"
    )
    try:
        try:
            from backend.llm import ask_ai_unified_sync
        except ImportError:
            from llm import ask_ai_unified_sync
        result = ask_ai_unified_sync(
            prompt=prompt, task_type="web_search", complexity="medium", max_tokens=500
        )
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ AI web-search synthesis failed: {e}")
        result = None

    if not result or result.startswith("[MOCKED RESPONSE"):
        return _deterministic_answer(query, results), True
    return result.strip(), False


# ── Per-query result cache + in-flight de-duplication ────────────────────────
# DuckDuckGo throttles the HTML endpoint (intermittent 202s), and React 18
# StrictMode fires each FreshInsights panel's fetch twice in dev. A tiny
# in-memory TTL cache plus in-flight de-duplication collapses repeated/concurrent
# identical queries into a SINGLE upstream search, and remembers good answers for
# a while — fewer DuckDuckGo hits, fewer 202s, and the StrictMode double-call is
# served once. In-memory only (per process); fine for this best-effort feature.
_WS_CACHE = {}        # key -> (expires_at_monotonic, data)
_WS_INFLIGHT = {}     # key -> asyncio.Future for an in-progress computation
_WS_STATE_LOCK = asyncio.Lock()
_WS_TTL_OK_S = 900    # cache answers WITH results for 15 min
_WS_TTL_EMPTY_S = 60  # cache empty/throttled answers only briefly (recover fast)


def _ws_cache_clear() -> None:
    """Clear the web-search cache + in-flight map. Used by tests for isolation."""
    _WS_CACHE.clear()
    _WS_INFLIGHT.clear()


def _ws_cache_get(key):
    entry = _WS_CACHE.get(key)
    if not entry:
        return None
    expires_at, data = entry
    if time.monotonic() >= expires_at:
        _WS_CACHE.pop(key, None)
        return None
    return data


def _ws_cache_put(key, data) -> None:
    # Good results linger; an empty/throttled result expires quickly so the panel
    # can recover as soon as DuckDuckGo stops rate-limiting.
    ttl = _WS_TTL_OK_S if data.get("results") else _WS_TTL_EMPTY_S
    _WS_CACHE[key] = (time.monotonic() + ttl, data)


async def _compute_web_search_ai(query: str, limit: int) -> Dict:
    """Run the actual search + AI synthesis for one query (no caching)."""
    search = await simple_web_search(SimpleSearchRequest(topic=query, limit=limit))
    results = search.get("results", [])
    answer, is_mock = _synthesize_answer(query, results)
    citations = [
        {"n": i + 1, "title": r.title, "url": r.url} for i, r in enumerate(results)
    ]
    return {
        "query": query,
        "answer": answer,
        "citations": citations,
        "results": results,
        "is_mock": is_mock,
        "provider": "DuckDuckGo + AI",
        "fallback_url": search.get("fallback_url"),
    }


@router.post("/web-search-ai")
async def web_search_ai(request: SimpleSearchRequest):
    """Fresh web search + AI-synthesized, cited answer (reusable across modules).

    Cached per (query, limit): a still-fresh result is served from cache, and
    identical concurrent requests share one upstream search instead of each
    hitting DuckDuckGo. Responses served without a new search carry cached=True.
    """
    query = (request.topic or "").strip()
    if not query:
        raise HTTPException(status_code=422, detail="Empty search query")
    limit = request.limit or 6
    key = (query.lower(), limit)

    async with _WS_STATE_LOCK:
        cached = _ws_cache_get(key)
        if cached is not None:
            return {**cached, "cached": True}
        fut = _WS_INFLIGHT.get(key)
        is_owner = fut is None
        if is_owner:
            fut = asyncio.get_running_loop().create_future()
            _WS_INFLIGHT[key] = fut

    if not is_owner:
        # Another request is already running this exact query — reuse its result.
        data = await fut
        return {**data, "cached": True}

    try:
        data = await _compute_web_search_ai(query, limit)
        async with _WS_STATE_LOCK:
            _ws_cache_put(key, data)
        if not fut.done():
            fut.set_result(data)
        return data
    except Exception as e:
        if not fut.done():
            fut.set_exception(e)
        raise
    finally:
        async with _WS_STATE_LOCK:
            _WS_INFLIGHT.pop(key, None)
