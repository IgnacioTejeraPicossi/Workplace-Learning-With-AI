# your_bm25.py
from typing import List
try:
    from rank_bm25 import BM25Okapi
except Exception:
    BM25Okapi = None

def _tokenize(t: str) -> List[str]:
    return t.lower().split()

def bm25_topk(query: str, corpus_texts: List[str], k: int = 5) -> List[int]:
    if not corpus_texts: return []
    if BM25Okapi is None:
        # fallback: tf-idf casero muy simple (no ideal)
        scores = []
        q = set(_tokenize(query))
        for i, txt in enumerate(corpus_texts):
            tokens = set(_tokenize(txt))
            scores.append((i, len(q & tokens)))
        scores.sort(key=lambda x: x[1], reverse=True)
        return [i for i,_ in scores[:k]]
    tokenized_corpus = [_tokenize(t) for t in corpus_texts]
    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(_tokenize(query))
    idx = list(range(len(corpus_texts)))
    idx.sort(key=lambda i: scores[i], reverse=True)
    return idx[:k]
