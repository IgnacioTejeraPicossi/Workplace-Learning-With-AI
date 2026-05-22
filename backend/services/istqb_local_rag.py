"""Hybrid local-only ISTQB RAG for the Homo Sapiens vs. AI workshop module.

When the active API provider is local (ItemAI / ItemServerAI — LM Studio path),
we retrieve short verbatim chunks from PDFs under ``<repo>/docs-ISTQB/`` using
BM25 and append them to the system prompt.

When the provider is cloud (OpenAI, OpenRouter) OR when no PDFs exist, this
module returns an empty block — curated anchors from ``istqb_anchors.json`` still
apply.

Licensing note: full syllabus text stays on the developer machine; it is only
injected into prompts that are sent to the locally configured endpoint selected
in the UI. If ``ask_ai_unified`` falls back to a cloud provider, those excerpts
could leave the machine — see ``caveat`` in the returned metadata.
"""

from __future__ import annotations

import logging
import math
import re
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.llm import get_api_config_from_headers

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ISTQB_DIR = PROJECT_ROOT / "docs-ISTQB"

CHUNK_CHARS = 900
CHUNK_OVERLAP = 140
MAX_CHUNKS_IN_INDEX = 50_000

_INDEX_LOCK = threading.Lock()
# Tuple layout:
#   ("bm25", BM25Okapi instance, list[chunk dict])
# | ("simple", list[list[str]] token lists parallel to chunks, list[chunk dict])
# | ("empty", None, [])
_INDEX: Optional[Tuple[str, Any, List[Dict[str, Any]]]] = None


def _tokenize(text: str) -> List[str]:
    """Lowercase word tokens; keeps Nordic letters."""
    if not text:
        return []
    return [t for t in re.findall(r"[\w]+", text.lower(), flags=re.UNICODE) if len(t) > 1]


def _window_chunks(page_text: str, page_num: int, source_name: str) -> List[Dict[str, Any]]:
    collapsed = re.sub(r"\s+", " ", (page_text or "").strip())
    if len(collapsed) < 40:
        return []
    out: List[Dict[str, Any]] = []
    step = max(CHUNK_CHARS - CHUNK_OVERLAP, 200)
    for i in range(0, len(collapsed), step):
        piece = collapsed[i : i + CHUNK_CHARS].strip()
        if len(piece) < 60:
            break
        out.append({"source": source_name, "page": page_num, "text": piece})
    return out


def _load_pdf_chunks() -> List[Dict[str, Any]]:
    if not ISTQB_DIR.is_dir():
        return []
    try:
        from pypdf import PdfReader
    except ImportError:
        logger.warning("pypdf not available — ISTQB local RAG disabled")
        return []

    chunks: List[Dict[str, Any]] = []
    for pdf_path in sorted(ISTQB_DIR.glob("*.pdf")):
        try:
            reader = PdfReader(str(pdf_path))
        except Exception as e:
            logger.warning("Could not open %s: %s", pdf_path, e)
            continue
        name = pdf_path.name
        for i, page in enumerate(reader.pages):
            try:
                txt = page.extract_text() or ""
            except Exception:
                txt = ""
            for ch in _window_chunks(txt, i + 1, name):
                chunks.append(ch)
                if len(chunks) >= MAX_CHUNKS_IN_INDEX:
                    return chunks
    return chunks


def _ensure_index() -> Tuple[str, Any, List[Dict[str, Any]]]:
    global _INDEX
    with _INDEX_LOCK:
        if _INDEX is not None:
            return _INDEX

        raw_chunks = _load_pdf_chunks()
        if not raw_chunks:
            _INDEX = ("empty", None, [])
            return _INDEX

        chunks_meta: List[Dict[str, Any]] = []
        token_lists: List[List[str]] = []
        for ch in raw_chunks:
            toks = _tokenize(ch["text"])
            if toks:
                chunks_meta.append(ch)
                token_lists.append(toks)

        if not chunks_meta:
            _INDEX = ("empty", None, [])
            return _INDEX

        try:
            from rank_bm25 import BM25Okapi

            bm25 = BM25Okapi(token_lists)
            _INDEX = ("bm25", bm25, chunks_meta)
            logger.info(
                "ISTQB local RAG index ready (BM25): %s chunks from %s",
                len(chunks_meta),
                ISTQB_DIR,
            )
        except ImportError:
            _INDEX = ("simple", token_lists, chunks_meta)
            logger.info(
                "ISTQB local RAG index ready (simple token overlap; pip install rank-bm25 for BM25): %s chunks from %s",
                len(chunks_meta),
                ISTQB_DIR,
            )
        return _INDEX


def is_local_istqb_rag_provider(request_headers: Optional[Dict[str, str]]) -> bool:
    cfg = get_api_config_from_headers(request_headers)
    p = str(cfg.get("provider") or "").lower().strip()
    return p in ("itemai", "itemserverai")


def istqb_rag_index_stats() -> Dict[str, Any]:
    """Lightweight introspection for GET /istqb-rag-status."""
    pdf_count = 0
    if ISTQB_DIR.is_dir():
        pdf_count = len(list(ISTQB_DIR.glob("*.pdf")))
    kind, engine, chunks = _ensure_index()
    n_chunks = len(chunks) if chunks else 0
    return {
        "docs_dir": str(ISTQB_DIR),
        "pdf_files": pdf_count,
        "indexed_chunks": n_chunks,
        "index_ready": kind != "empty" and n_chunks > 0,
        "retriever": "bm25" if kind == "bm25" else ("token_overlap" if kind == "simple" else "none"),
    }


# ---------------------------------------------------------------------------
# 1.15.3 (2026-05-22) — Option 3 · Translate-then-BM25 for Norwegian queries
# ---------------------------------------------------------------------------
#
# Diagnostic on 1.15.2 found a real retrieval gap: Norwegian conceptual
# queries against English ISTQB syllabi were returning only Norwegian
# glossary fragments (coincidental language overlap, not topic overlap).
# Embedding-based RAG would fix this but at the cost of ~470 MB model,
# new heavyweight dep, and loss of determinism — see CHANGELOG [1.15.3]
# for the design decision.
#
# This module's compromise: a small NO→EN ISTQB terminology dictionary
# applied to the query BEFORE BM25 tokenization. The original NO query
# is concatenated with the EN translation so:
#   - Original NO tokens still find Norwegian glossary matches (good
#     when the user IS asking about a Norwegian term).
#   - Translated EN tokens find the English syllabus chunks (the real
#     testing guidance).
# BM25 ranks both naturally and surfaces the best hits.
#
# Zero new dependencies. 100% deterministic. ~60 terms covers the
# vocabulary the workshop's 10 tasks use.

_NO_EN_ISTQB_TERMS: Dict[str, str] = {
    # --- Core ISTQB testing terminology (Norwegian → English) ----------
    "akseptansetest": "acceptance test",
    "akseptansekriterier": "acceptance criteria",
    "akseptansetesting": "acceptance testing",
    "ekvivalensklasse": "equivalence partitioning",
    "ekvivalensklasser": "equivalence partitioning",
    "grenseverdianalyse": "boundary value analysis",
    "grenseverdier": "boundary values",
    "regresjonstest": "regression test",
    "regresjonstesting": "regression testing",
    "røyktest": "smoke test",
    "røyktesting": "smoke testing",
    "ytelsestest": "performance test",
    "ytelsestesting": "performance testing",
    "sikkerhetstest": "security test",
    "sikkerhetstesting": "security testing",
    "tilgjengelighet": "accessibility",
    "bruksvennlighet": "usability",
    "pålitelighet": "reliability",
    "utforskende": "exploratory",
    "utforskning": "exploration",
    # --- Workshop's 10 testing tasks -----------------------------------
    "scenarier": "scenarios",
    "scenario": "scenario",
    "risiko": "risk",
    "risikoanalyse": "risk analysis",
    "tvetydighet": "ambiguity",
    "tvetydigheter": "ambiguities",
    "oppfølging": "follow-up",
    "oppfølgingsspørsmål": "follow-up questions",
    "automatisering": "automation",
    "testautomatisering": "test automation",
    "testdata": "test data",
    "orakel": "oracle",
    "orakelproblem": "oracle problem",
    "triage": "triage",
    # --- Test design / process -----------------------------------------
    "testdesign": "test design",
    "testteknikker": "test techniques",
    "testteknikk": "test technique",
    "teknikker": "techniques",
    "testtilfelle": "test case",
    "testtilfeller": "test cases",
    "testplan": "test plan",
    "testleder": "test manager",
    "testbasis": "test basis",
    "testdekning": "test coverage",
    "testresultater": "test results",
    "testdrevet": "test-driven",
    "testverktøy": "test tool",
    "testscript": "test script",
    "testskript": "test script",
    "spesifikasjon": "specification",
    "spesifikasjonsbasert": "specification-based",
    "strukturbasert": "structure-based",
    "erfaringsbasert": "experience-based",
    "svartboks": "black-box",
    "hvitboks": "white-box",
    "glassboks": "glass-box",
    # --- Defects / findings --------------------------------------------
    "defekt": "defect",
    "defekter": "defects",
    "feil": "defect",
    "avvik": "finding",
    "krav": "requirements",
    "uklare": "unclear",
    "uklart": "unclear",
    "klare": "clear",
    "brukerhistorie": "user story",
    "brukerhistorier": "user stories",
    "gjennomgang": "review",
    "inspeksjon": "inspection",
    # --- Common workshop-context verbs / nouns -------------------------
    "tester": "test",
    "testing": "testing",
    "prøving": "testing",
    "betalingsflyt": "payment flow",
    "betalingsprosess": "payment process",
    # --- Question words / function words (lightly translated to keep BM25
    # tokens close to the EN syllabus phrasing). We translate only the ones
    # that meaningfully change the search; "the", "a" etc. are dropped by
    # the min-length-2 filter in _tokenize so we don't list them here.
    "hvordan": "how",
    "hvilken": "which",
    "hvilke": "which",
    "hva": "what",
    "ikke": "not",
    "uten": "without",
}

# Function words that are uniquely Norwegian (vs. EN). 2+ hits in a query
# is a strong signal it's Norwegian. The query may also contain æ/ø/å
# which is an even stronger signal.
_NO_FUNCTION_WORDS = frozenset({
    "jeg", "du", "vi", "dere", "han", "hun", "den", "det",
    "ikke", "er", "var", "har", "hadde", "skal", "vil", "kan",
    "må", "bør", "med", "uten", "til", "fra", "av", "på",
    "som", "når", "hvor", "hvordan", "hva", "hvilken", "hvilke",
    "og", "eller", "men", "hvis", "fordi",
    # Heuristic boost on ISTQB-Norwegian vocabulary
    "krav", "feil", "defekt", "tester", "uklar", "uklare",
})

# 1.15.3 refinement — Norwegian function words / pronouns / copulas that
# add no semantic value for ISTQB search but DO heavily match the
# Norwegian glossary (because every glossary entry uses them). Dropping
# them after translation cleans up the BM25 query so EN syllabi rise to
# the top. Excludes terms already in _NO_EN_ISTQB_TERMS — those translate
# to useful EN tokens (e.g. "hvordan" → "how").
_NO_STOPWORDS_TO_DROP = frozenset({
    "jeg", "du", "vi", "dere", "han", "hun", "den", "det",
    "er", "var", "har", "hadde", "skal", "vil", "kan",
    "må", "bør", "til", "fra", "av", "på",
    "som", "når", "hvor",
    "og", "eller", "men", "hvis", "fordi",
    # Articles + prepositions
    "en", "et", "med", "for", "om", "i",
    "noe", "noen", "dette", "denne",
})


def _is_norwegian_query(text: str) -> bool:
    """Detect Norwegian queries with three cheap signals:
      1. æ/ø/å presence (strongest — Norwegian-specific characters)
      2. ≥2 Norwegian function words ('jeg', 'med', 'hvordan', etc.)
      3. ≥2 ISTQB-NO vocabulary hits (catches term-only queries like
         'utforskende testing testdesign teknikker' which have no function
         words but ARE clearly Norwegian).
    False on plain English."""
    if not text:
        return False
    text_lower = text.lower()
    if any(ch in text_lower for ch in "æøå"):
        return True
    tokens = set(re.findall(r"\w+", text_lower, flags=re.UNICODE))
    if sum(1 for w in _NO_FUNCTION_WORDS if w in tokens) >= 2:
        return True
    # Third signal — dictionary-vocabulary hits. Catches term-only queries.
    if sum(1 for w in _NO_EN_ISTQB_TERMS if w in tokens) >= 2:
        return True
    return False


def _translate_query_if_norwegian(query: str) -> Tuple[str, Dict[str, Any]]:
    """If the query looks Norwegian, return its English-translated form
    (in-place substitution of recognised ISTQB terms; untranslated tokens
    kept verbatim).

    1.15.3 (revised on first diagnostic) — initial design concatenated
    original + translated, but the Norwegian-token doubling caused the
    NO glossary to keep dominating BM25 results. The revised design
    returns the in-place translated query ALONE, which gives BM25 a
    cleaner EN-leaning token set without losing the untranslatable
    tokens (proper nouns, numbers, etc.).

    Returns ``(translated_query, metadata)`` where metadata explains
    what happened (so callers can surface it for transparency):
        {
          "detected": "no" | "en",
          "applied":  bool,           # whether translation actually fired
          "translated_terms": [{"no": ..., "en": ...}, ...],
        }

    Pure routing, deterministic, zero deps.
    """
    if not _is_norwegian_query(query):
        return query, {"detected": "en", "applied": False, "translated_terms": []}

    translated_pairs: List[Dict[str, str]] = []
    out_parts: List[str] = []
    seen = set()
    # Walk the original query token by token so we preserve word order +
    # untranslatable tokens (proper nouns, numbers, code-like fragments).
    for tok_match in re.finditer(r"\w+|[^\w\s]+|\s+", query, flags=re.UNICODE):
        tok = tok_match.group(0)
        key = tok.lower()
        en = _NO_EN_ISTQB_TERMS.get(key)
        if en:
            out_parts.append(en)
            if key not in seen:
                translated_pairs.append({"no": key, "en": en})
                seen.add(key)
        elif key in _NO_STOPWORDS_TO_DROP:
            # 1.15.3 refinement — drop pure NO function words after detecting
            # the query is Norwegian. Keeps the BM25 search clean of tokens
            # that would heavily match the NO glossary without adding any
            # ISTQB semantic value. Whitespace handling: replace with a
            # single space so word boundaries survive.
            if tok.isspace():
                out_parts.append(tok)
            else:
                out_parts.append(" ")
        else:
            # Keep original NO token in place — it may still help on niche
            # glossary lookups. The translated terms now carry the main
            # search weight.
            out_parts.append(tok)
    translated_query = "".join(out_parts).strip()
    return translated_query or query.strip(), {
        "detected": "no",
        "applied": bool(translated_pairs),
        "translated_terms": translated_pairs,
    }


def retrieve_chunks(query: str, top_k: int = 4, max_total_chars: int = 3200) -> List[Dict[str, Any]]:
    query = (query or "").strip()
    if not query:
        return []
    kind, engine, chunks = _ensure_index()
    if kind == "empty" or not chunks:
        return []

    # 1.15.3 — translate Norwegian queries before tokenization. The combined
    # query (original + EN translation of recognised terms) lets BM25 surface
    # both NO glossary matches AND EN syllabus chunks.
    search_query, _translation_meta = _translate_query_if_norwegian(query)

    q_toks = _tokenize(search_query)
    if not q_toks:
        return []

    if kind == "bm25":
        scores = engine.get_scores(q_toks)
    else:
        q_set = set(q_toks)
        scores = []
        for toks in engine:
            cset = set(toks)
            overlap = len(q_set & cset)
            scores.append(overlap / (math.sqrt(len(cset)) + 1.0))

    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    picked: List[Dict[str, Any]] = []
    total = 0
    seen_text: set[str] = set()
    for idx in ranked:
        if scores[idx] <= 0 and len(picked) >= 1:
            break
        ch = chunks[idx]
        key = ch["text"][:200]
        if key in seen_text:
            continue
        seen_text.add(key)
        tlen = len(ch["text"])
        if total + tlen > max_total_chars and picked:
            continue
        picked.append({**ch, "_score": float(scores[idx])})
        total += tlen
        if len(picked) >= top_k:
            break
    return picked


def format_rag_prompt_block(chunk_list: List[Dict[str, Any]]) -> str:
    if not chunk_list:
        return ""
    lines = [
        "",
        "ISTQB RETRIEVED EXCERPTS (local RAG — verbatim fragments from docs-ISTQB PDFs on this machine). "
        "Ground your reasoning in these passages when relevant; cite as [source, page].",
    ]
    for i, ch in enumerate(chunk_list, 1):
        lines.append(f"[{i}] {ch['source']} — page {ch['page']}")
        lines.append(ch["text"])
    return "\n".join(lines)


def build_rag_context_block(
    request_headers: Optional[Dict[str, str]],
    query: str,
    top_k: int = 4,
    max_total_chars: int = 3200,
) -> Tuple[str, Dict[str, Any]]:
    """Return (system_prompt_suffix, metadata dict) for API responses."""
    meta: Dict[str, Any] = {
        "mode": "anchors_only",
        "chunks_used": 0,
        "sources": [],
        "caveat": None,
        # 1.15.3 — Surface the NO→EN translation when it fires so consumers
        # can render a small "translated to match English syllabi" badge.
        "query_translation": {"detected": "en", "applied": False, "translated_terms": []},
    }
    if not is_local_istqb_rag_provider(request_headers):
        return "", meta

    meta["mode"] = "local_rag"
    meta["caveat"] = (
        "Local RAG excerpts are appended because x-api-provider is itemai/itemserverai. "
        "If the LLM stack falls back to a cloud provider, prompt text (including these excerpts) "
        "could leave your network — keep LM Studio running for strict on-prem."
    )
    # 1.15.3 — peek at the translation outcome BEFORE calling retrieve_chunks,
    # so the metadata is set whether retrieval finds anything or not.
    _search_query, translation_meta = _translate_query_if_norwegian(query)
    meta["query_translation"] = translation_meta

    chunks = retrieve_chunks(query, top_k=top_k, max_total_chars=max_total_chars)
    if not chunks:
        meta["mode"] = "local_rag_unavailable"
        meta["caveat"] = (
            "Local provider selected but no ISTQB chunks were indexed — add PDF files under "
            f"{ISTQB_DIR} and restart the backend, or rely on curated anchors only."
        )
        return "", meta

    block = format_rag_prompt_block(chunks)
    meta["chunks_used"] = len(chunks)
    meta["sources"] = [f"{c['source']} p.{c['page']}" for c in chunks]
    return block, meta
