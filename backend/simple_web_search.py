from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from urllib.parse import quote_plus
import httpx
import re

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
        "You are a research assistant. Using ONLY the numbered web sources below, "
        "write a concise, accurate answer to the user's query in 3-6 sentences. "
        "Cite sources inline as [n]. If the sources do not cover the query, say so "
        "plainly. Do not invent facts, numbers or URLs.\n\n"
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


@router.post("/web-search-ai")
async def web_search_ai(request: SimpleSearchRequest):
    """Fresh web search + AI-synthesized, cited answer (reusable across modules)."""
    query = (request.topic or "").strip()
    if not query:
        raise HTTPException(status_code=422, detail="Empty search query")

    search = await simple_web_search(SimpleSearchRequest(topic=query, limit=request.limit or 6))
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
