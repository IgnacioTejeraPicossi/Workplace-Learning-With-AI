"""AI enrichment service for the AGI Progress Hub.

Provides three methods, one per Hub tab (Tracker, Endings, Benefits) that:
  1) Query a fresh source of web results:
        primary  : the websearch-backend Node service at http://localhost:8080
        fallback : DuckDuckGo HTML scraping (backend/simple_web_search.py logic)
        last     : LLM-only "best-effort" using model knowledge
  2) Pass the current panel data + web results to the unified LLM
     (ask_ai_unified → ItemAI / OpenRouter / OpenAI with fallback)
  3) Return a list of structured, non-destructive suggestions that the
     frontend can review and apply manually.

No suggestion is ever applied server-side. The router returns the suggestions
and the frontend is responsible for displaying and optionally persisting them
(only the Tracker persists, via POST /api/agi/progress).
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

import httpx


WEBSEARCH_BACKEND_URL = os.getenv(
    "WEBSEARCH_BACKEND_URL", "http://localhost:8080/web-search"
)
DDG_URL = "https://html.duckduckgo.com/html/"
DDG_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
)


# ---------------------------------------------------------------------------
# Web search with graceful fallback
# ---------------------------------------------------------------------------

async def _search_via_node_backend(query: str, timeout: float = 20.0) -> Optional[str]:
    """Primary path: POST to the websearch-backend Node service (port 8080).

    Returns the textual `result` field or None on any failure.
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                WEBSEARCH_BACKEND_URL, json={"query": query}
            )
            resp.raise_for_status()
            data = resp.json()
            text = data.get("result") or ""
            if text and isinstance(text, str):
                return text
    except Exception as e:
        print(f"[agi_ai_enrich] websearch-backend failed ({e}); falling back to DuckDuckGo")
    return None


async def _search_via_duckduckgo(query: str, limit: int = 8, timeout: float = 15.0) -> Optional[str]:
    """Fallback path: scrape DuckDuckGo HTML for search results.

    Returns a plain-text block with one "Title — snippet (url)" per line,
    or None if nothing usable was returned.
    """
    link_pattern = r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)</a>'
    snippet_pattern = r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([^<]*)</a>'
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(
                DDG_URL,
                headers={"User-Agent": DDG_USER_AGENT},
                params={"q": query},
            )
            resp.raise_for_status()
            html = resp.text
            links = re.findall(link_pattern, html)
            snippets = re.findall(snippet_pattern, html)
            lines: List[str] = []
            for i, (url, title) in enumerate(links[:limit]):
                if url.startswith("/"):
                    continue
                title_clean = re.sub(r"<[^>]+>", "", title).strip()
                if not title_clean or len(title_clean) < 6:
                    continue
                snippet_clean = ""
                if i < len(snippets):
                    snippet_clean = re.sub(r"<[^>]+>", "", snippets[i]).strip()
                lines.append(f"- {title_clean} — {snippet_clean[:240]} ({url})")
            if lines:
                return "\n".join(lines)
    except Exception as e:
        print(f"[agi_ai_enrich] DuckDuckGo search failed: {e}")
    return None


async def gather_web_context(query: str) -> Dict[str, Any]:
    """Run the full websearch cascade: Node backend → DuckDuckGo → empty.

    Returns {'source': 'websearch_backend'|'duckduckgo'|'none', 'text': str}.
    The caller decides whether to downgrade gracefully when source == 'none'.
    """
    text = await _search_via_node_backend(query)
    if text:
        return {"source": "websearch_backend", "text": text}

    text = await _search_via_duckduckgo(query)
    if text:
        return {"source": "duckduckgo", "text": text}

    return {"source": "none", "text": ""}


# ---------------------------------------------------------------------------
# JSON extraction helper (LLMs occasionally wrap JSON in ```json fences)
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> Optional[Any]:
    if not raw:
        return None
    raw = raw.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", raw, re.DOTALL)
    if fence_match:
        raw = fence_match.group(1)
    try:
        return json.loads(raw)
    except Exception:
        pass
    first = raw.find("{")
    last = raw.rfind("}")
    if first >= 0 and last > first:
        try:
            return json.loads(raw[first : last + 1])
        except Exception:
            return None
    return None


# ---------------------------------------------------------------------------
# Per-tab enrichment methods
# ---------------------------------------------------------------------------

async def enrich_tracker(
    current_models: List[Dict[str, Any]], request_headers: Optional[Dict] = None
) -> Dict[str, Any]:
    """Propose new rows OR score updates for the AGI Progress Tracker.

    Output schema (non-destructive — frontend reviews before applying):
      {
        "source": "websearch_backend"|"duckduckgo"|"none",
        "suggestions": [
          {
            "kind": "new" | "update",
            "model": str, "year": int,
            "scores": {"K":0..10, "RW":0..10, "M":0..10, "R":0..10,
                       "WM":0..10, "MS":0..10, "MR":0..10,
                       "V":0..10, "A":0..10, "S":0..10},
            "total": int,             # 0..100, should equal sum(scores)
            "notes": str,             # 1-2 lines mentioning real benchmarks
            "sources": [str]          # URLs backing the proposal
          }
        ]
      }
    """
    from backend.llm import ask_ai_unified

    query = (
        "Latest frontier AI model benchmark scores 2026: "
        "Claude Opus, GPT, Gemini — GPQA Diamond, MATH-500, "
        "SWE-bench Verified/Pro, ARC-AGI-2, HumanEval, MMLU"
    )
    web = await gather_web_context(query)

    system = (
        "You are an AI research analyst updating an AGI progress tracker "
        "that uses the Hendrycks et al. (2025) 10-domain CHC framework:\n"
        "  K = General Knowledge, RW = Reading & Writing, M = Math,\n"
        "  R = On-the-Spot Reasoning, WM = Working Memory,\n"
        "  MS = Long-Term Memory Storage (architectural 0 for all current LLMs),\n"
        "  MR = Long-Term Memory Retrieval, V = Visual, A = Auditory, S = Speed.\n"
        "Score each domain 0-10. total must equal the sum of the 10 scores.\n"
        "Only propose new models or score updates backed by recent public "
        "benchmarks. Keep MS at 0 unless architecture clearly changed.\n"
        "Return STRICT JSON only — no prose, no markdown fences."
    )

    user = (
        "Current models already in the tracker:\n"
        f"{json.dumps(current_models, ensure_ascii=False)}\n\n"
        f"Web search results (source={web['source']}):\n"
        f"{web['text'] or '(no web results; rely on your own knowledge with caution)'}\n\n"
        "Task: propose up to 4 suggestions. Each MUST be either:\n"
        "  - kind='new'    : a frontier model not yet tracked, OR\n"
        "  - kind='update' : a score refinement for an already-tracked model.\n"
        "Do NOT restate unchanged models. Cite public sources for each.\n\n"
        "Return JSON exactly matching this shape:\n"
        "{\n"
        '  "suggestions": [\n'
        '    {"kind":"new","model":"...","year":2026,'
        '"scores":{"K":0,"RW":0,"M":0,"R":0,"WM":0,"MS":0,"MR":0,"V":0,"A":0,"S":0},'
        '"total":0,"notes":"...","sources":["https://..."]}\n'
        "  ]\n"
        "}"
    )

    raw = await ask_ai_unified(
        prompt=user,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        max_tokens=1400,
        temperature=0.2,
        request_headers=request_headers,
    )

    parsed = _extract_json(raw or "") or {}
    suggestions = parsed.get("suggestions") if isinstance(parsed, dict) else None
    return {
        "source": web["source"],
        "suggestions": suggestions if isinstance(suggestions, list) else [],
        "raw": raw if not suggestions else None,
    }


async def enrich_endings(
    endings: List[Dict[str, Any]],
    pdoom_estimates: List[Dict[str, Any]],
    request_headers: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Propose new quotes / citations / P(doom) updates for Possible Endings.

    Output:
      {
        "source": ...,
        "suggestions": [
          {
            "kind": "quote" | "pdoom" | "reference",
            "target": "<endingId or 'pdoom' or 'global'>",
            "text": "...",                # the quote or statement
            "attribution": "...",          # who said it, year
            "sourceUrl": "...",            # primary URL
            "note": "..."                  # 1-line context
          }
        ]
      }
    """
    from backend.llm import ask_ai_unified

    query = (
        "Latest 2025 2026 quotes P(doom) AI extinction risk leaders "
        "Geoffrey Hinton Dario Amodei Yoshua Bengio Sam Altman Dan Hendrycks "
        "AI safety statements"
    )
    web = await gather_web_context(query)

    system = (
        "You are a research archivist for a page titled 'Possible Endings for AGI' "
        "with 12 scenarios (surface/shallow/deep). Each scenario already has one "
        "quote + attribution. Your job is to propose UPDATES using recent, "
        "real, verifiable public statements — ideally from 2025 or 2026.\n"
        "Only output what you are confident is real. Every suggestion MUST "
        "include a working source URL. Return STRICT JSON."
    )

    user = (
        "Current 12 endings (id, title, current quote + attribution):\n"
        f"{json.dumps(endings, ensure_ascii=False)}\n\n"
        "Current P(doom) estimates shown on the page:\n"
        f"{json.dumps(pdoom_estimates, ensure_ascii=False)}\n\n"
        f"Web search results (source={web['source']}):\n"
        f"{web['text'] or '(no web results)'}\n\n"
        "Task: propose up to 5 suggestions. Each MUST be one of:\n"
        "  - kind='quote'     : a better/newer quote for a given endingId "
        "(I..XII). Must be a REAL public statement.\n"
        "  - kind='pdoom'     : an updated P(doom) estimate from a named "
        "expert (target='pdoom').\n"
        "  - kind='reference' : a new high-value primary source to add to "
        "the references panel (target='global').\n\n"
        "Return JSON EXACTLY:\n"
        "{\n"
        '  "suggestions": [\n'
        '    {"kind":"quote","target":"I","text":"...","attribution":"Name, Role (Year)",'
        '"sourceUrl":"https://...","note":"..."}\n'
        "  ]\n"
        "}"
    )

    raw = await ask_ai_unified(
        prompt=user,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        max_tokens=1400,
        temperature=0.3,
        request_headers=request_headers,
    )

    parsed = _extract_json(raw or "") or {}
    suggestions = parsed.get("suggestions") if isinstance(parsed, dict) else None
    return {
        "source": web["source"],
        "suggestions": suggestions if isinstance(suggestions, list) else [],
        "raw": raw if not suggestions else None,
    }


async def enrich_benefits(
    benefits: List[Dict[str, Any]], request_headers: Optional[Dict] = None
) -> Dict[str, Any]:
    """Propose new examples per benefit category for 'The Benefits of AGI'.

    Output:
      {
        "source": ...,
        "suggestions": [
          {
            "categoryId": "health"|"science"|...,
            "newExample": "...",       # concrete, dated, short
            "sourceUrl": "...",
            "note": "..."
          }
        ]
      }
    """
    from backend.llm import ask_ai_unified

    query = (
        "AI breakthroughs 2025 2026 concrete achievements health medicine drug "
        "discovery climate fusion materials science education productivity"
    )
    web = await gather_web_context(query)

    system = (
        "You are a research analyst updating 'The Benefits of AGI' page. "
        "Each category (health, science, education, climate, productivity, "
        "poverty, creativity, space, governance) has example bullets. "
        "Propose new, concrete, DATED, real-world examples from 2025/2026 — "
        "not speculation. Every suggestion MUST include a primary source URL. "
        "Return STRICT JSON."
    )

    user = (
        "Current benefits and existing examples:\n"
        f"{json.dumps(benefits, ensure_ascii=False)}\n\n"
        f"Web search results (source={web['source']}):\n"
        f"{web['text'] or '(no web results)'}\n\n"
        "Task: propose up to 6 suggestions, ideally covering different categories. "
        "Each example should be a single short, concrete sentence referencing a "
        "real 2025/2026 milestone (named tool, team, paper, or deployment).\n\n"
        "Return JSON EXACTLY:\n"
        "{\n"
        '  "suggestions": [\n'
        '    {"categoryId":"health","newExample":"...",'
        '"sourceUrl":"https://...","note":"..."}\n'
        "  ]\n"
        "}"
    )

    raw = await ask_ai_unified(
        prompt=user,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        max_tokens=1400,
        temperature=0.4,
        request_headers=request_headers,
    )

    parsed = _extract_json(raw or "") or {}
    suggestions = parsed.get("suggestions") if isinstance(parsed, dict) else None
    return {
        "source": web["source"],
        "suggestions": suggestions if isinstance(suggestions, list) else [],
        "raw": raw if not suggestions else None,
    }
