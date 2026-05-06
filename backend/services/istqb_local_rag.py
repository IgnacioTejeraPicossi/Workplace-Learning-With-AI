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


def retrieve_chunks(query: str, top_k: int = 4, max_total_chars: int = 3200) -> List[Dict[str, Any]]:
    query = (query or "").strip()
    if not query:
        return []
    kind, engine, chunks = _ensure_index()
    if kind == "empty" or not chunks:
        return []
    q_toks = _tokenize(query)
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
    }
    if not is_local_istqb_rag_provider(request_headers):
        return "", meta

    meta["mode"] = "local_rag"
    meta["caveat"] = (
        "Local RAG excerpts are appended because x-api-provider is itemai/itemserverai. "
        "If the LLM stack falls back to a cloud provider, prompt text (including these excerpts) "
        "could leave your network — keep LM Studio running for strict on-prem."
    )
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
