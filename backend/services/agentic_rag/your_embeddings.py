# your_embeddings.py
from typing import List
import hashlib
import os

_model = None
_use_st = True

def _load_model():
    global _model, _use_st
    if _model is not None: return
    try:
        from sentence_transformers import SentenceTransformer
        # pequeño y rápido en CPU
        name = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        _model = SentenceTransformer(name)
    except Exception:
        _use_st = False

def embed_small(text: str) -> List[float]:
    _load_model()
    if _use_st and _model:
        v = _model.encode([text], normalize_embeddings=True)[0]
        return v.tolist()
    # fallback determinista (hash → 128 dims)
    h = hashlib.sha256(text.encode()).digest()
    dims = 128
    arr = [h[i % len(h)]/255.0 for i in range(dims)]
    return arr
