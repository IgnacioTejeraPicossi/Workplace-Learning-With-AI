"""
Andrés — semantic memory helper (P2).

Turns memory recall from pure keyword-overlap into meaning-based ranking, so
Andrés remembers by *what things mean*, not only by exact words. A memory's
content is embedded (OpenAI `text-embedding-3-small`) at write time and cached in
its Mongo document; `retrieve_relevant` then blends cosine similarity with the
existing importance / recency / verified / keyword signals.

Graceful degradation (mirrors the rest of the module):
  - No OpenAI key, or `AI_FORCE_MOCK` set (CI/offline/tests) → embeddings are OFF,
    `embed_text` returns None, and recall falls back to the previous keyword path.
    So offline behaviour — and every offline test — is unchanged.
  - Any embedding error → None (never raises, never blocks a chat turn).
"""
import math
import os
from typing import List, Optional


def _force_mock() -> bool:
    return os.getenv("AI_FORCE_MOCK", "").strip().lower() in ("1", "true", "yes", "on")


def _openai_key() -> Optional[str]:
    try:
        from backend import llm
        return getattr(llm, "OPENAI_API_KEY", None)
    except Exception:
        return None


def embeddings_available() -> bool:
    """True only when we can (and should) compute embeddings. Off under
    AI_FORCE_MOCK so tests/CI stay deterministic and network-free."""
    if _force_mock():
        return False
    key = _openai_key()
    return bool(key and str(key).strip())


def embed_text(text: str) -> Optional[List[float]]:
    """Embed one text → vector, or None on any failure / when embeddings are off."""
    if not text or not embeddings_available():
        return None
    try:
        import openai
        openai.api_key = _openai_key()
        resp = openai.embeddings.create(model="text-embedding-3-small", input=[text[:8000]])
        return list(resp.data[0].embedding)
    except Exception:  # pragma: no cover - network/SDK failure → keyword fallback
        return None


def cosine(a: Optional[List[float]], b: Optional[List[float]]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)
