"""
Andrés — scholarly research (V1 of "use the Knowledge Sources for real").

A sibling of the tier-3 web search (`web_research.py`) that grounds a chat turn in
REAL, open, ToS-friendly research APIs instead of a general web search.

V2 (2026-08-23) — a pool of open sources + topic routing ("Andrés' bibliographic
nose"): the question is mapped to the source(s) that actually fit it, instead of
always hitting the same three. Sources in the pool (all free / no key unless noted):

  • arXiv            — physics / math / CS preprints (Atom XML API)
  • Semantic Scholar — cross-discipline papers + abstracts (JSON API)
  • Wikipedia        — encyclopedic base (MediaWiki search API) — always included
  • PubMed           — biomedical literature (NCBI E-utilities)
  • Project Gutenberg— public-domain books (Gutendex API)
  • Internet Archive — texts / books / media (advancedsearch API)
  • Europeana        — cultural heritage — OPTIONAL, needs a free EUROPEANA_KEY

This is deliberately the OPEN subset of the directory: no paywalled sources
(ScienceDirect, Nature, JSTOR…) are queried — we never bypass a paywall or a login.
Read-only search; results are injected transparently and Andrés is told to cite them
as [S1], [S2]… (distinct from the web block's [1], [2]) and to keep clear what he
just learned vs already knew.

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

PROVIDERS = "arxiv · semantic-scholar · wikipedia · pubmed · gutenberg · internet-archive (+europeana)"
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


async def _pubmed(client, query, limit):
    """NCBI E-utilities: esearch (PMIDs) → esummary (titles). No key needed."""
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    r = await client.get(f"{base}/esearch.fcgi",
                         params={"db": "pubmed", "term": query, "retmax": limit, "retmode": "json"})
    r.raise_for_status()
    ids = (((r.json() or {}).get("esearchresult") or {}).get("idlist") or [])
    if not ids:
        return []
    r2 = await client.get(f"{base}/esummary.fcgi",
                          params={"db": "pubmed", "id": ",".join(ids), "retmode": "json"})
    r2.raise_for_status()
    summ = (r2.json() or {}).get("result") or {}
    out = []
    for pmid in ids:
        doc = summ.get(pmid) or {}
        title = _clean(doc.get("title") or "", 220)
        if not title:
            continue
        src = _clean(doc.get("source") or "", 80)
        year = (doc.get("pubdate") or "")[:4]
        snippet = " ".join(x for x in [src, f"({year})" if year else ""] if x)
        out.append({"title": title, "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    "snippet": snippet, "source": "PubMed"})
    return out


async def _gutenberg(client, query, limit):
    """Project Gutenberg via the Gutendex API. No key needed. Public-domain books."""
    r = await client.get("https://gutendex.com/books", params={"search": query})
    r.raise_for_status()
    out = []
    for b in ((r.json() or {}).get("results") or [])[:limit]:
        title = _clean(b.get("title") or "", 200)
        authors = ", ".join(a.get("name", "") for a in (b.get("authors") or []))
        bid = b.get("id")
        if title and bid:
            out.append({"title": title, "url": f"https://www.gutenberg.org/ebooks/{bid}",
                        "snippet": _clean(authors, 160), "source": "Project Gutenberg"})
    return out


async def _internet_archive(client, query, limit):
    """Internet Archive advancedsearch API. No key needed. Texts, books, audio."""
    r = await client.get("https://archive.org/advancedsearch.php",
                         params={"q": query, "fl[]": ["identifier", "title", "creator"],
                                 "rows": limit, "output": "json", "sort[]": "downloads desc"})
    r.raise_for_status()
    docs = (((r.json() or {}).get("response") or {}).get("docs") or [])
    out = []
    for d in docs:
        ident = d.get("identifier")
        title = _clean((d.get("title") if isinstance(d.get("title"), str) else "") or "", 200)
        if ident and title:
            creator = d.get("creator")
            creator = creator if isinstance(creator, str) else (creator[0] if isinstance(creator, list) and creator else "")
            out.append({"title": title, "url": f"https://archive.org/details/{ident}",
                        "snippet": _clean(creator, 160), "source": "Internet Archive"})
    return out


async def _europeana(client, query, limit):
    """Europeana cultural-heritage search. Needs a free API key (EUROPEANA_KEY);
    self-skips (returns []) when the key is not configured, so it never errors."""
    key = os.getenv("EUROPEANA_KEY")
    if not key:
        return []
    r = await client.get("https://api.europeana.eu/record/v2/search.json",
                         params={"wskey": key, "query": query, "rows": limit})
    r.raise_for_status()
    out = []
    for item in ((r.json() or {}).get("items") or []):
        title = _clean(" ".join(item.get("title") or []) or "", 200)
        guid = item.get("guid") or ""
        if title and guid:
            who = ", ".join(item.get("dcCreator") or [])
            out.append({"title": title, "url": guid, "snippet": _clean(who, 160), "source": "Europeana"})
    return out


# ── Source routing — Andrés' "bibliographic nose" ────────────────────────────
# Map a question to the source(s) that actually fit it, instead of always hitting
# the same three. Reuses the SAME keyword→category taxonomy as the "Ask Andrés
# where to research" suggester (single source of truth) so the routing and the
# recommendation stay consistent.
# key → fetcher function NAME (resolved via globals() at call time, so tests that
# patch the module-level fetchers actually take effect).
_SOURCE_FUNC_NAMES = {
    "arxiv": "_arxiv", "semantic_scholar": "_semantic_scholar", "wikipedia": "_wikipedia",
    "pubmed": "_pubmed", "gutenberg": "_gutenberg", "internet_archive": "_internet_archive",
    "europeana": "_europeana",
}
_SOURCE_NAMES = {
    "arxiv": "arXiv", "semantic_scholar": "Semantic Scholar", "wikipedia": "Wikipedia",
    "pubmed": "PubMed", "gutenberg": "Project Gutenberg", "internet_archive": "Internet Archive",
    "europeana": "Europeana",
}
# A routing-specific keyword map, tuned for SOURCE selection (distinct from the
# suggester's directory-category map, which proved too coarse — it sent Lorca to
# arXiv and a machine-learning query to "courses"). Substring-matched, lower-cased.
_ROUTE_KEYWORDS = {
    "stem": ["machine learning", "deep learning", "neural", "algorithm", "physics", "quantum",
             "computer science", "artificial intelligence", " ai ", " ai.", "retrieval-augmented",
             " rag", "llm", "language model", "transformer", "dataset", "preprint", "statistics",
             "mathematics", "optimization", "software", "engineering", "robotics", "astronom"],
    "medicine": ["clinical", "disease", "medical", "medicine", "patient", "therapy", "drug",
                 "health", "diagnosis", "cancer", "vaccine", "psycholog", "brain", "genetic", "genome"],
    "humanities": ["poetry", "poem", "poet", "novel", "literature", "literary", "author", "writer",
                   "philosophy", "philosopher", "history", "historical", "art ", "artist", "painting",
                   "music", "culture", "cultural", "myth", "folk", "avant-garde", "romancero", "lorca",
                   "cervantes", "shakespeare", "renaissance", "medieval", "classic", "religion"],
    "books": ["book", "ebook", "e-book", "public domain", "full text", "manuscript", "edition", "read the"],
}
_ROUTE_SOURCES = {
    "stem": ["arxiv", "semantic_scholar"],
    "medicine": ["pubmed", "semantic_scholar"],
    "humanities": ["wikipedia", "gutenberg", "internet_archive", "europeana"],
    "books": ["gutenberg", "internet_archive"],
}
# Wikipedia is always in the mix: broad, reliable, and (as the Lorca case showed)
# often the best starting point for humanities where arXiv is useless.
_BASELINE_SOURCES = ["wikipedia"]
# When nothing matches, stay broad and cross-domain — NOT arXiv (STEM-only), so a
# humanities question never gets polluted with irrelevant physics preprints.
_DEFAULT_SOURCES = ["wikipedia", "semantic_scholar"]


def _route_sources(query: str):
    """Pick the source keys that fit the query. Never empty; Wikipedia always in."""
    q = f" {(query or '').lower()} "
    hits = [cat for cat, kws in _ROUTE_KEYWORDS.items() if any(kw in q for kw in kws)]
    chosen = list(_BASELINE_SOURCES)
    if hits:
        for cat in hits:
            for s in _ROUTE_SOURCES.get(cat, []):
                if s not in chosen:
                    chosen.append(s)
    else:
        for s in _DEFAULT_SOURCES:
            if s not in chosen:
                chosen.append(s)
    # Europeana only participates when its key is configured (else it's a no-op).
    if "europeana" in chosen and not os.getenv("EUROPEANA_KEY"):
        chosen.remove("europeana")
    return chosen


# Common EN+ES question scaffolding to drop so the API search sees salient terms,
# not a whole natural-language sentence (which hurts keyword-based search a lot —
# "poetry of Lorca" finds the page; the full question often finds nothing).
_STOPWORDS = {
    "what", "which", "who", "whom", "whose", "how", "why", "when", "where", "does", "do", "did",
    "is", "are", "was", "were", "the", "a", "an", "of", "in", "to", "for", "and", "or", "with",
    "without", "about", "on", "at", "by", "from", "that", "this", "these", "those", "can", "could",
    "some", "any", "recent", "there",
    "qué", "que", "cómo", "como", "por", "para", "de", "del", "la", "el", "los", "las", "un", "una",
    "unos", "unas", "y", "o", "con", "sin", "sobre", "cuáles", "cuál", "existe", "existen", "hay",
    "puede", "pueden", "se", "más", "entre", "su", "sus", "al", "lo",
}


def _search_terms(query: str) -> str:
    """Strip question scaffolding / stopwords to a keyword-ish search string.
    Falls back to the original when cleaning would leave nothing useful."""
    raw = (query or "").strip()
    tokens = re.findall(r"[\wÀ-ÿ'-]+", raw.lower())
    kept = [t for t in tokens if t not in _STOPWORDS and len(t) > 1]
    cleaned = " ".join(kept).strip()
    return cleaned if len(cleaned) >= 3 else raw


_MAX_TOTAL = 10  # cap the combined result set so the prompt stays bounded


async def research(query: str, limit_per_source: int = 2, sources=None) -> dict:
    """Query the routed open research APIs in parallel. Never raises.

    `sources` may be an explicit list of source keys (e.g. ["arxiv","wikipedia"]);
    when omitted, `_route_sources(query)` picks them from the question's topic.
    """
    now = datetime.utcnow().isoformat()
    q = (query or "").strip()[:400]
    if not sources:
        sources = _route_sources(q)          # route on the full phrasing
    search_q = _search_terms(q)              # but search the APIs with salient terms
    sources = [s for s in sources if s in _SOURCE_FUNC_NAMES] or list(_BASELINE_SOURCES)
    providers = " + ".join(_SOURCE_NAMES[s] for s in sources)
    base = {"used": True, "query": q, "providers": providers, "routed_sources": sources,
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
                *[globals()[_SOURCE_FUNC_NAMES[s]](client, search_q, limit_per_source) for s in sources],
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

    results = results[:_MAX_TOTAL]
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
