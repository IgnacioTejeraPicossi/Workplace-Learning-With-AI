"""Offline tests for the OpenRouter free-model fallback and the cross-provider key guard.

Covers the API Config changes of 2026-10-22:
- `_openrouter_create_with_fallback` retries across OPENROUTER_FREE_FALLBACKS on a
  transient 404/429, but re-raises a real error (401 bad key) immediately.
- `/api/test-api` (provider=openrouter) reports which fallback model answered.
- An OpenRouter key (sk-or-...) is never accepted as an OpenAI key, and vice versa.

No network and no real key: the OpenAI SDK client is replaced by a fake.
"""
from types import SimpleNamespace
from unittest.mock import patch

import pytest

import backend.llm as llm
from backend.api_test import test_api_connection as run_test_api, APITestRequest
from backend.gpt5_config import OPENROUTER_MODEL, OPENROUTER_FREE_FALLBACKS


def _ok(content="OpenRouter API is working correctly."):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


class _FakeClient:
    """Mimics `OpenAI(...).chat.completions.create`; fails for the models in `failures`."""

    def __init__(self, failures=None, *_a, **_k):
        self.failures = failures or {}
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, model, messages, **params):
        self.calls.append(model)
        if model in self.failures:
            raise Exception(self.failures[model])
        return _ok()


MSGS = [{"role": "user", "content": "ping"}]
FALLBACK = [m for m in OPENROUTER_FREE_FALLBACKS if m != OPENROUTER_MODEL][0]


# ── helper: _openrouter_create_with_fallback ───────────────────────────────

def test_primary_model_success_uses_primary():
    client = _FakeClient()
    _resp, used = llm._openrouter_create_with_fallback(client, MSGS, {"max_tokens": 5}, OPENROUTER_MODEL)
    assert used == OPENROUTER_MODEL
    assert client.calls == [OPENROUTER_MODEL]


@pytest.mark.parametrize("err", [
    "Error code: 429 - temporarily rate-limited upstream",
    "Error code: 404 - No endpoints found for this model",
])
def test_transient_error_falls_back_to_next_free_model(err):
    client = _FakeClient(failures={OPENROUTER_MODEL: err})
    _resp, used = llm._openrouter_create_with_fallback(client, MSGS, {}, OPENROUTER_MODEL)
    assert used == FALLBACK
    assert client.calls == [OPENROUTER_MODEL, FALLBACK]


def test_auth_error_is_not_retried():
    client = _FakeClient(failures={OPENROUTER_MODEL: "Error code: 401 - User not found"})
    with pytest.raises(Exception, match="401"):
        llm._openrouter_create_with_fallback(client, MSGS, {}, OPENROUTER_MODEL)
    assert client.calls == [OPENROUTER_MODEL]  # no pointless retries on a bad key


def test_all_candidates_fail_raises_last_error_and_tries_each_once():
    failures = {m: f"429 rate-limit on {m}" for m in OPENROUTER_FREE_FALLBACKS}
    client = _FakeClient(failures=failures)
    with pytest.raises(Exception, match=OPENROUTER_FREE_FALLBACKS[-1]):
        llm._openrouter_create_with_fallback(client, MSGS, {}, OPENROUTER_MODEL)
    # primary is not tried twice even though it is also in the fallback list
    assert client.calls == list(dict.fromkeys([OPENROUTER_MODEL] + OPENROUTER_FREE_FALLBACKS))


# ── endpoint: /api/test-api provider=openrouter ────────────────────────────

@pytest.mark.asyncio
async def test_test_api_openrouter_reports_fallback_model():
    fake = _FakeClient(failures={OPENROUTER_MODEL: "429 temporarily rate-limited"})
    with patch("openai.OpenAI", return_value=fake):
        res = await run_test_api(APITestRequest(provider="openrouter", openrouterKey="sk-or-v1-test-key-123456"))
    assert res["success"] is True
    assert FALLBACK in res["message"]


@pytest.mark.asyncio
async def test_test_api_openrouter_default_model_has_no_fallback_note():
    with patch("openai.OpenAI", return_value=_FakeClient()):
        res = await run_test_api(APITestRequest(provider="openrouter", openrouterKey="sk-or-v1-test-key-123456"))
    assert res["success"] is True
    assert res["message"] == "OpenRouter API connection successful"


# ── cross-provider key guard ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_openrouter_key_rejected_for_openai_provider():
    res = await run_test_api(APITestRequest(provider="openai", openaiKey="sk-or-v1-test-key-123456"))
    assert res["success"] is False
    assert "OpenRouter key" in res["error"]


@pytest.mark.asyncio
async def test_openai_key_rejected_for_openrouter_provider():
    res = await run_test_api(APITestRequest(provider="openrouter", openrouterKey="sk-proj-test-key-123456"))
    assert res["success"] is False
    assert "OpenAI key" in res["error"]


def test_header_openrouter_key_never_used_as_openai_key():
    headers = {"x-openai-key": "sk-or-v1-test-key-1234567890"}
    with patch.object(llm, "OPENAI_API_KEY", ""), \
         patch.object(llm, "_saved_api_config", return_value={}):
        cfg = llm.get_api_config_from_headers(headers)
    assert cfg["openai_key"] == ""
