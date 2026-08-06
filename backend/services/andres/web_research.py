"""
Andrés — web research (tier-3 external, user-initiated).

Andrés' own research model put external web access as the highest, most cautious
tier. This wires his chat to the app's EXISTING DuckDuckGo search
(`backend.simple_web_search.simple_web_search`) — no new provider, no autonomous
browsing. It only runs when the user turns the 🌐 toggle on for a message; it is
read-only (search, never post); results are injected transparently and Andrés is
told to cite them and to keep clear what came from the web vs his own knowledge.

Returns a structured payload for the response and a prompt block for the LLM. Per
Andrés' own request, the payload carries an explicit **web_access status**
(available | unavailable | failed | off) plus provider, timestamp and
sources_consulted, so he can be honest about whether he actually searched, it
failed, or he's reasoning from prior knowledge. Never raises.

  • available   — searched and got usable results
  • unavailable — searched but nothing usable came back
  • failed      — the search itself errored
  • off         — the user did not turn web access on (handled by the caller)
"""
from datetime import datetime

SEARCH_PROVIDER = "duckduckgo"


def off_state() -> dict:
    """The payload when the user did not request web access this turn."""
    return {"used": False, "web_access": "off", "search_provider": SEARCH_PROVIDER,
            "sources_consulted": 0, "citations": []}


async def research(query: str, limit: int = 5) -> dict:
    """Run a fresh web search for `query`. Returns a dict; never raises."""
    now = datetime.utcnow().isoformat()
    base = {"used": True, "query": (query or "").strip(),
            "search_provider": SEARCH_PROVIDER, "last_search_timestamp": now,
            "results": [], "citations": [], "sources_consulted": 0, "fallback_url": None}

    if not base["query"]:
        return {**base, "web_access": "failed", "error": "empty query"}
    try:
        from backend.simple_web_search import simple_web_search, SimpleSearchRequest
        # cap the query length — a pasted article makes a poor search query
        data = await simple_web_search(SimpleSearchRequest(topic=base["query"][:400], limit=limit))
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés web research failed: {e}")
        return {**base, "web_access": "failed", "error": str(e)}

    results = data.get("results", []) or []
    norm = []
    for r in results:
        # results are SearchResult pydantic models or dicts
        title = getattr(r, "title", None) or (r.get("title") if isinstance(r, dict) else "")
        url = getattr(r, "url", None) or (r.get("url") if isinstance(r, dict) else "")
        snippet = getattr(r, "snippet", None) or (r.get("snippet") if isinstance(r, dict) else "")
        norm.append({"title": title, "url": url, "snippet": snippet})

    citations = [{"n": i + 1, "title": r["title"], "url": r["url"]} for i, r in enumerate(norm)]
    return {
        **base,
        "web_access": "available" if norm else "unavailable",
        "results": norm,
        "citations": citations,
        "sources_consulted": len(norm),
        "fallback_url": data.get("fallback_url"),
    }


def prompt_block(web: dict) -> str:
    """Build the [WEB SEARCH RESULTS] system layer from a research() payload."""
    status = web.get("web_access", "unavailable")
    results = web.get("results", [])
    if not results:
        detail = ("the search failed" if status == "failed"
                  else "no usable results came back")
        return (
            f"[WEB ACCESS: {status}] (provider: {web.get('search_provider')})\n"
            "The user asked you to consult the web, but " + detail +
            f" for \"{web.get('query', '')}\". Say so honestly; do not invent "
            "sources or claim you found something. You may suggest the DuckDuckGo link.\n\n"
        )
    lines = [
        f"[{i + 1}] {r['title']} — {(r.get('snippet') or '').strip()} ({r['url']})"
        for i, r in enumerate(results)
    ]
    return (
        f"[WEB ACCESS: {status}] (provider: {web.get('search_provider')}, "
        f"{web.get('sources_consulted', 0)} sources)\n"
        "[WEB SEARCH RESULTS] — FRESH results from a DuckDuckGo search the user asked "
        "you to run. Use them to answer. Cite sources inline as [n]. Be clear about "
        "what you just learned from the web versus what you already knew or are "
        "inferring. Never invent URLs or facts beyond these snippets.\n"
        + "\n".join(lines) + "\n\n"
    )
