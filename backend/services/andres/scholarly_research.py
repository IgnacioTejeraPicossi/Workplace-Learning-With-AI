"""
Andrés — scholarly research (V1 of "use the Knowledge Sources for real").

A sibling of the tier-3 web search (`web_research.py`) that grounds a chat turn in
REAL, open, ToS-friendly research APIs instead of a general web search:

  • arXiv            — physics / math / CS preprints (Atom XML API)
  • Semantic Scholar — cross-discipline papers + abstracts (JSON API)
  • Wikipedia        — encyclopedic base (MediaWiki search API)

All three are free and need no key. This is deliberately the OPEN subset of the
directory: no paywalled sources (ScienceDirect, Nature, JSTOR…) are queried — we
never bypass a paywall or a login. Read-only search; results are injected
transparently and Andrés is told to cite them as [S1], [S2]… (distinct from the
web block's [1], [2]) and to keep clear what he just learned vs already knew.

Same honesty contract as web_research: gated by the tier-3 web permission + the
per-turn 🌐 toggle in the caller; never raises; returns an explicit status.
Each source is fetched in parallel with a short timeout, so one slow/blocked API
can't hang the chat.
"""
import asyncio
import html
import os
import re
from datetime import datetime

PROVIDERS = "arxiv + semantic-scholar + wikipedia"
_TIMEOUT = 6.0

# Wikimedia enforces a User-Agent policy: requests must identify the tool AND give
# a way to make contact, or the API answers 403. We use the project's public repo
# URL as the contact (not a personal email) and let it be overridden via env. The
# same descriptive UA is sent to all three APIs (arXiv/Semantic Scholar are lenient).
_CONTACT = os.getenv(
    "SCHOLARLY_CONTACT",
    "https://github.com/IgnacioTejeraPicossi/Workplace-Learning-With-AI",
)
_UA = f"WorkplaceLearningWithAI/1.0 (Andres Robot research assistant; +{_CONTACT}) python-httpx"


def off_state() -> dict:
    return {"used": False, "access": "off", "providers": PROVIDERS,
            "sources_consulted": 0, "citations": []}


def disabled_state() -> dict:
    return {"used": False, "access": "disabled", "providers": PROVIDERS,
            "sources_consulted": 0, "citations": []}


def _clean(text: str, limit: int = 320) -> str:
    """Strip HTML tags/entities and collapse whitespace to a short snippet."""
    text = re.sub(r"<[^>]+>", "", text or "")
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


async def _arxiv(client, query, limit):
    import xml.etree.ElementTree as ET
    url = "http://export.arxiv.org/api/query"
    params = {"search_query": f"all:{query}", "start": 0, "max_results": limit}
    r = await client.get(url, params=params)
    r.raise_for_status()
    ns = {"a": "http://www.w3.org/2005/Atom"}
    root = ET.fromstring(r.text)
    out = []
    for entry in root.findall("a:entry", ns):
        title = _clean((entry.findtext("a:title", default="", namespaces=ns)), 200)
        summary = _clean((entry.findtext("a:summary", default="", namespaces=ns)))
        link = (entry.findtext("a:id", default="", namespaces=ns) or "").strip()
        if title and link:
            out.append({"title": title, "url": link, "snippet": summary, "source": "arXiv"})
    return out


async def _semantic_scholar(client, query, limit):
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {"query": query, "limit": limit, "fields": "title,abstract,url,year,externalIds"}
    r = await client.get(url, params=params)
    r.raise_for_status()
    data = r.json() or {}
    out = []
    for p in (data.get("data") or []):
        title = _clean(p.get("title") or "", 200)
        link = (p.get("url") or "").strip()
        if not link:
            doi = (p.get("externalIds") or {}).get("DOI")
            if doi:
                link = f"https://doi.org/{doi}"
        snippet = _clean(p.get("abstract") or "")
        year = p.get("year")
        if title and link:
            out.append({"title": f"{title}" + (f" ({year})" if year else ""),
                        "url": link, "snippet": snippet, "source": "Semantic Scholar"})
    return out


async def _wikipedia(client, query, limit):
    url = "https://en.wikipedia.org/w/api.php"
    params = {"action": "query", "format": "json", "list": "search",
              "srsearch": query, "srlimit": limit, "srprop": "snippet"}
    r = await client.get(url, params=params)
    r.raise_for_status()
    data = r.json() or {}
    out = []
    for hit in ((data.get("query") or {}).get("search") or []):
        title = _clean(hit.get("title") or "", 200)
        snippet = _clean(hit.get("snippet") or "")
        if title:
            page = title.replace(" ", "_")
            out.append({"title": title, "url": f"https://en.wikipedia.org/wiki/{page}",
                        "snippet": snippet, "source": "Wikipedia"})
    return out


async def research(query: str, limit_per_source: int = 3) -> dict:
    """Query the three open research APIs in parallel. Never raises."""
    now = datetime.utcnow().isoformat()
    q = (query or "").strip()[:400]
    base = {"used": True, "query": q, "providers": PROVIDERS,
            "last_search_timestamp": now, "results": [], "citations": [], "sources_consulted": 0}
    if not q:
        return {**base, "access": "failed", "error": "empty query"}

    results = []
    try:
        import httpx
        async with httpx.AsyncClient(
            timeout=_TIMEOUT,
            headers={"User-Agent": _UA, "Api-User-Agent": _UA},  # Api-User-Agent: MediaWiki policy
            follow_redirects=True,
        ) as client:
            gathered = await asyncio.gather(
                _arxiv(client, q, limit_per_source),
                _semantic_scholar(client, q, limit_per_source),
                _wikipedia(client, q, limit_per_source),
                return_exceptions=True,
            )
        for g in gathered:
            if isinstance(g, list):
                results.extend(g)
            else:  # pragma: no cover - individual source failure is expected offline
                print(f"⚠️ Andrés scholarly source failed: {g!r}")
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés scholarly research failed: {e}")
        return {**base, "access": "failed", "error": str(e)}

    citations = [{"n": f"S{i + 1}", "title": r["title"], "url": r["url"], "source": r["source"]}
                 for i, r in enumerate(results)]
    return {
        **base,
        "access": "available" if results else "unavailable",
        "results": results,
        "citations": citations,
        "sources_consulted": len(results),
    }


def prompt_block(sch: dict) -> str:
    """Build the [SCHOLARLY SOURCES] system layer from a research() payload."""
    results = sch.get("results", [])
    if not results:
        status = sch.get("access", "unavailable")
        detail = "the lookup failed" if status == "failed" else "no usable results came back"
        return (
            f"[SCHOLARLY ACCESS: {status}] (providers: {sch.get('providers')})\n"
            "The user asked you to research this; " + detail +
            f" for \"{sch.get('query', '')}\". Say so honestly; do not invent papers.\n\n"
        )
    lines = [
        f"[S{i + 1}] ({r['source']}) {r['title']} — {(r.get('snippet') or '').strip()} ({r['url']})"
        for i, r in enumerate(results)
    ]
    return (
        f"[SCHOLARLY ACCESS: available] (providers: {sch.get('providers')}, "
        f"{sch.get('sources_consulted', 0)} sources)\n"
        "[SCHOLARLY SOURCES] — FRESH results from open research APIs (arXiv, Semantic "
        "Scholar, Wikipedia) the user asked you to consult. Prefer these over general "
        "web results for factual/academic claims. Cite them inline as [S1], [S2]…, and "
        "be clear about what you just learned here versus what you already knew. Never "
        "invent papers, authors or URLs beyond these; you only have the snippets, not "
        "the full text.\n"
        + "\n".join(lines) + "\n\n"
    )
