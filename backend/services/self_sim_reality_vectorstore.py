"""
Self-Simulating Reality Agent — Vector store (V2)
=================================================
A real vector store over the curated OPH + science knowledge base, upgrading the
V1 "RAG-lite" keyword-count retriever to cosine-similarity ranking over vectors.

Two pluggable backends, chosen automatically:

  - **embeddings** — dense semantic vectors via OpenAI `text-embedding-3-small`
    (cached per KB content-hash, so the KB is embedded once). Real semantic recall:
    "are we living in a dream?" retrieves the simulation chunks even with no shared
    words. Used when an OpenAI key is available.

  - **tfidf** — sparse TF-IDF vectors + cosine, pure-Python, deterministic and
    offline. A genuine vector store (no external deps), used as the fallback and by
    the offline test-suite.

Both rank by cosine similarity. Everything degrades gracefully: any embeddings
failure falls back to TF-IDF, so the store never raises and always returns results.
"""

import hashlib
import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

from backend.services.self_sim_reality_chat import KNOWLEDGE_BASE

VECTORSTORE_VERSION = "2.0.0"

# ── Tokenisation (shared with the tfidf backend) ────────────────────────────
_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "on", "that",
    "this", "it", "as", "be", "for", "with", "what", "how", "why", "does", "do",
    "can", "we", "you", "i", "if", "not", "but", "by", "at", "from", "about",
    "el", "la", "los", "las", "un", "una", "de", "que", "y", "o", "es", "en",
    "por", "para", "con", "se", "su", "como", "qué", "cómo",
    "og", "et", "er", "som", "på", "av", "til", "hva", "hvordan",
}


def _tokenize(text: str) -> List[str]:
    return [w for w in re.findall(r"[a-zA-ZÀ-ÿ]+", (text or "").lower())
            if len(w) > 2 and w not in _STOPWORDS]


def _chunk_blob(chunk: Dict[str, Any]) -> str:
    return " ".join([chunk.get("title", ""), chunk.get("text", ""),
                     " ".join(chunk.get("tags", []))])


def _kb_hash() -> str:
    h = hashlib.sha256()
    for c in KNOWLEDGE_BASE:
        h.update(c["id"].encode("utf-8"))
        h.update(_chunk_blob(c).encode("utf-8"))
    return h.hexdigest()


# ── TF-IDF backend ──────────────────────────────────────────────────────────

def _l2_normalize(vec: Dict[str, float]) -> Dict[str, float]:
    norm = math.sqrt(sum(v * v for v in vec.values()))
    if norm == 0:
        return vec
    return {k: v / norm for k, v in vec.items()}


class _TfidfIndex:
    """Builds an IDF model over the KB and vectorises text into L2-normalised
    sparse TF-IDF vectors. Deterministic; no network."""

    def __init__(self):
        self.docs = KNOWLEDGE_BASE
        n = len(self.docs)
        df: Counter = Counter()
        self._doc_tokens: List[List[str]] = []
        for c in self.docs:
            toks = _tokenize(_chunk_blob(c))
            self._doc_tokens.append(toks)
            for term in set(toks):
                df[term] += 1
        # smoothed idf
        self.idf: Dict[str, float] = {
            term: math.log((n + 1) / (d + 1)) + 1.0 for term, d in df.items()
        }
        self.doc_vectors: List[Dict[str, float]] = [
            self._vectorize_tokens(toks) for toks in self._doc_tokens
        ]

    def _vectorize_tokens(self, tokens: List[str]) -> Dict[str, float]:
        tf = Counter(tokens)
        vec = {term: count * self.idf.get(term, 0.0) for term, count in tf.items()}
        return _l2_normalize(vec)

    def vectorize(self, text: str) -> Dict[str, float]:
        # query terms unknown to the corpus have idf 0 → they don't affect cosine
        return self._vectorize_tokens(_tokenize(text))

    def search(self, query: str, k: int) -> List[Tuple[float, Dict[str, Any]]]:
        q = self.vectorize(query)
        scored = []
        for c, dv in zip(self.docs, self.doc_vectors):
            score = sum(w * dv.get(term, 0.0) for term, w in q.items())
            if score > 0:
                scored.append((score, c))
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:k]


_tfidf_index: Optional[_TfidfIndex] = None


def _get_tfidf() -> _TfidfIndex:
    global _tfidf_index
    if _tfidf_index is None:
        _tfidf_index = _TfidfIndex()
    return _tfidf_index


# ── Embeddings backend (optional, OpenAI) ───────────────────────────────────

_embed_cache: Dict[str, List[List[float]]] = {}   # kb_hash → list of chunk vectors


def _openai_key() -> Optional[str]:
    try:
        from backend import llm
        return getattr(llm, "OPENAI_API_KEY", None)
    except Exception:
        return None


def embeddings_available() -> bool:
    """True when we can compute embeddings (a key is set). Patched off in tests."""
    key = _openai_key()
    return bool(key and str(key).strip())


def _embed(texts: List[str]) -> Optional[List[List[float]]]:
    """Embed a batch of texts. Returns None on any failure (→ tfidf fallback)."""
    key = _openai_key()
    if not key:
        return None
    try:
        import openai
        openai.api_key = key
        resp = openai.embeddings.create(model="text-embedding-3-small", input=texts)
        # sort by index to be safe
        items = sorted(resp.data, key=lambda d: d.index)
        return [list(it.embedding) for it in items]
    except Exception:
        return None


def _kb_embeddings() -> Optional[List[List[float]]]:
    h = _kb_hash()
    if h in _embed_cache:
        return _embed_cache[h]
    vecs = _embed([_chunk_blob(c) for c in KNOWLEDGE_BASE])
    if vecs is not None:
        _embed_cache[h] = vecs
    return vecs


def _dense_cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _embed_search(query: str, k: int) -> Optional[List[Tuple[float, Dict[str, Any]]]]:
    kb_vecs = _kb_embeddings()
    if kb_vecs is None:
        return None
    q = _embed([query])
    if not q:
        return None
    qv = q[0]
    scored = [(_dense_cosine(qv, dv), c) for dv, c in zip(kb_vecs, KNOWLEDGE_BASE)]
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:k]


# ── Public API ──────────────────────────────────────────────────────────────

def search(query: str, k: int = 5, backend: str = "auto") -> Dict[str, Any]:
    """Rank KB chunks against the query. Returns {backend, results:[{...,score}]}.

    backend: "auto" (embeddings if available, else tfidf), "embeddings", or "tfidf".
    Never raises; always falls back to tfidf.
    """
    query = (query or "").strip()
    used = "tfidf"
    scored: Optional[List[Tuple[float, Dict[str, Any]]]] = None

    want_embed = backend == "embeddings" or (backend == "auto" and embeddings_available())
    if want_embed:
        scored = _embed_search(query, k)
        if scored is not None:
            used = "embeddings"

    if scored is None:
        scored = _get_tfidf().search(query, k)
        used = "tfidf"

    results = []
    for score, c in scored:
        results.append({
            "id": c["id"], "title": c["title"], "level": c["level"],
            "claim": c["text"], "sources": c["sources"], "tags": c["tags"],
            "score": round(float(score), 4),
        })
    return {"backend": used, "results": results, "count": len(results)}


def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "component": "self_sim_reality_vectorstore",
        "version": VECTORSTORE_VERSION,
        "kb_chunks": len(KNOWLEDGE_BASE),
        "embeddings_available": embeddings_available(),
        "default_backend": "embeddings" if embeddings_available() else "tfidf",
    }
