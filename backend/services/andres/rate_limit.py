"""
Andrés — a small per-user rate limit for the chat endpoint (audit P5).

Each chat turn spends an LLM call (plus optional web + scholarly lookups), so a
shared demo needs a cheap guard against runaway cost. This is an in-memory
sliding-window limiter — resets on restart, per process — which is enough for a
single-instance demo. Configurable and easy to disable:

  • ANDRES_CHAT_RATE_MAX         — max messages per window per user (default 30).
                                    Set to 0 (or below) to DISABLE the limit.
  • ANDRES_CHAT_RATE_WINDOW_SEC  — window length in seconds (default 60).
"""
import os
import time
from collections import defaultdict

from fastapi import HTTPException

_HITS = defaultdict(list)   # user_id → [timestamps]


def _config():
    def _int(name, default):
        try:
            return int(os.getenv(name, str(default)))
        except (TypeError, ValueError):
            return default
    return _int("ANDRES_CHAT_RATE_MAX", 30), max(1, _int("ANDRES_CHAT_RATE_WINDOW_SEC", 60))


def reset():
    """Clear all recorded hits (used by tests)."""
    _HITS.clear()


def check_and_record(user_id: str) -> None:
    """Record one chat call for `user_id`; raise HTTP 429 if over the limit.
    A non-positive ANDRES_CHAT_RATE_MAX disables the limit entirely."""
    max_hits, window = _config()
    if max_hits <= 0:
        return
    now = time.time()
    hits = _HITS[user_id]
    cutoff = now - window
    hits[:] = [t for t in hits if t >= cutoff]   # drop old
    if len(hits) >= max_hits:
        retry = max(1, int(window - (now - hits[0])) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"Too many messages — please wait a moment (limit {max_hits} per {window}s).",
            headers={"Retry-After": str(retry)},
        )
    hits.append(now)
