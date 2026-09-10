"""Offline tests for Andrés P5 quick-wins: chat rate limit + language-aware Wikipedia."""
import os
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from backend.services.andres import rate_limit as RL
from backend.services.andres import scholarly_research as S


def test_rate_limit_trips_after_max():
    RL.reset()
    with patch.dict(os.environ, {"ANDRES_CHAT_RATE_MAX": "2", "ANDRES_CHAT_RATE_WINDOW_SEC": "60"}):
        RL.check_and_record("u1")   # 1
        RL.check_and_record("u1")   # 2
        with pytest.raises(HTTPException) as ei:
            RL.check_and_record("u1")   # 3 → over
        assert ei.value.status_code == 429
        assert "Retry-After" in (ei.value.headers or {})
    RL.reset()


def test_rate_limit_is_per_user():
    RL.reset()
    with patch.dict(os.environ, {"ANDRES_CHAT_RATE_MAX": "1", "ANDRES_CHAT_RATE_WINDOW_SEC": "60"}):
        RL.check_and_record("a")           # a: ok
        RL.check_and_record("b")           # b: independent, ok
        with pytest.raises(HTTPException):
            RL.check_and_record("a")       # a again → over
    RL.reset()


def test_rate_limit_disabled_when_max_zero():
    RL.reset()
    with patch.dict(os.environ, {"ANDRES_CHAT_RATE_MAX": "0"}):
        for _ in range(50):
            RL.check_and_record("u1")      # never raises when disabled
    RL.reset()


@pytest.mark.parametrize("query,expected", [
    ("the poetry of Federico García Lorca", "es"),   # accented vowel
    ("¿Qué rasgos tiene el Romancero gitano?", "es"),
    ("hvordan lærer man matematikk?", "no"),
    ("retrieval-augmented generation in machine learning", "en"),
])
def test_wiki_lang_detection(query, expected):
    assert S._wiki_lang(query) == expected


@pytest.mark.asyncio
async def test_wikipedia_uses_detected_language_edition():
    captured = {}

    class _Resp:
        def raise_for_status(self): pass
        def json(self): return {"query": {"search": [{"title": "Lorca", "snippet": "poeta"}]}}

    class _Client:
        async def get(self, url, params=None):
            captured["url"] = url
            return _Resp()

    out = await S._wikipedia(_Client(), "la poesía de Lorca", 2)
    assert "es.wikipedia.org" in captured["url"]
    assert out and "es.wikipedia.org" in out[0]["url"]
