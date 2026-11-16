"""Offline tests for the OpenRouter free-model fallback and the cross-provider key guard.

Covers the API Config changes of 2026-10-22:
- `_openrouter_create_with_fallback` retries across OPENROUTER_FREE_FALLBACKS on a
  transient 404/429, but re-raises a real error (401 bad key) immediately.
- `/api/test-api` (provider=openrouter) reports which fallback model answered.
- An OpenRouter key (sk-or-...) is never accepted as an OpenAI key, and vice versa.

No network and no real key: the OpenAI SDK client is replaced by a fake.
"""
import os
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
async def test_openrouter_key_in_openai_field_falls_back_to_server_key():
    with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-proj-server-test-key"}), \
         patch("backend.api_test.openai.chat.completions.create", return_value=_ok("ok")) as create:
        res = await run_test_api(APITestRequest(provider="openai", openaiKey="sk-or-v1-test-key-123456"))
    assert res["success"] is True
    assert "ignored" in res["message"]
    assert create.called
    import backend.api_test as api_test_mod
    assert api_test_mod.openai.api_key == "sk-proj-server-test-key"  # never the sk-or- key


@pytest.mark.asyncio
async def test_openrouter_key_rejected_for_openai_when_no_server_key():
    env = {k: v for k, v in os.environ.items() if k != "OPENAI_API_KEY"}
    with patch.dict(os.environ, env, clear=True), \
         patch("backend.api_test._saved_cfg", return_value={}), \
         patch("backend.api_test.openai.chat.completions.create") as create:
        res = await run_test_api(APITestRequest(provider="openai", openaiKey="sk-or-v1-test-key-123456"))
    assert res["success"] is False
    assert "OpenRouter key" in res["error"]
    assert not create.called


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


# ── helper: _openrouter_stream_with_fallback (streaming) ────────────────────
# Added 2026-11-16: the STREAMING OpenRouter path (used by Micro-lesson, AI Study
# Buddy chat, …) previously called the single default free model with no fallback,
# so a transient gemma 429 surfaced as "Sorry, I encountered an error…". These cover
# the pre-first-chunk fallback that mirrors _openrouter_create_with_fallback.


class _FakeStreamClient:
    """Mimics OpenAI(...).chat.completions.create(stream=True). A model can fail at
    create() time, on the first stream iteration, or after the first chunk."""

    def __init__(self, fail_on_create=None, fail_on_iter=None, fail_after_first=None, content="hello world"):
        self.fail_on_create = fail_on_create or {}
        self.fail_on_iter = fail_on_iter or {}
        self.fail_after_first = fail_after_first or {}
        self.content = content
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, model, messages, stream=False, **params):
        self.calls.append(model)
        if model in self.fail_on_create:
            raise Exception(self.fail_on_create[model])
        parent = self

        def _chunk(text):
            return SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content=text))])

        def _gen():
            if model in parent.fail_on_iter:
                raise Exception(parent.fail_on_iter[model])
            for i, w in enumerate(parent.content.split()):
                yield _chunk(w + " ")
                if i == 0 and model in parent.fail_after_first:
                    raise Exception(parent.fail_after_first[model])
        return _gen()


def _collect(gen):
    return "".join(gen)


def test_stream_primary_success_uses_primary():
    client = _FakeStreamClient(content="one two")
    out = _collect(llm._openrouter_stream_with_fallback(client, MSGS, {}, OPENROUTER_MODEL))
    assert "one" in out and "two" in out
    assert client.calls == [OPENROUTER_MODEL]


@pytest.mark.parametrize("where", ["create", "iter"])
def test_stream_transient_error_falls_back_to_next_free_model(where):
    err = "Error code: 429 - google/gemma-4-31b-it:free is temporarily rate-limited upstream"
    kw = {"fail_on_create": {OPENROUTER_MODEL: err}} if where == "create" else {"fail_on_iter": {OPENROUTER_MODEL: err}}
    client = _FakeStreamClient(content="answer here", **kw)
    out = _collect(llm._openrouter_stream_with_fallback(client, MSGS, {}, OPENROUTER_MODEL))
    assert "answer" in out
    assert client.calls == [OPENROUTER_MODEL, FALLBACK]


def test_stream_auth_error_is_not_retried():
    client = _FakeStreamClient(fail_on_iter={OPENROUTER_MODEL: "Error code: 401 - User not found"})
    with pytest.raises(Exception, match="401"):
        _collect(llm._openrouter_stream_with_fallback(client, MSGS, {}, OPENROUTER_MODEL))
    assert client.calls == [OPENROUTER_MODEL]  # bad key → no pointless retries


def test_stream_does_not_switch_models_after_content_started():
    # Primary streams one chunk then drops mid-stream → can't restart on another model.
    client = _FakeStreamClient(fail_after_first={OPENROUTER_MODEL: "Error code: 429 - mid-stream drop"}, content="partial text")
    with pytest.raises(Exception, match="429"):
        _collect(llm._openrouter_stream_with_fallback(client, MSGS, {}, OPENROUTER_MODEL))
    assert client.calls == [OPENROUTER_MODEL]  # did NOT fall back once bytes were sent


def test_stream_all_candidates_fail_raises_last():
    failures = {m: f"429 rate-limit on {m}" for m in OPENROUTER_FREE_FALLBACKS}
    client = _FakeStreamClient(fail_on_iter=failures)
    with pytest.raises(Exception):
        _collect(llm._openrouter_stream_with_fallback(client, MSGS, {}, OPENROUTER_MODEL))
    assert client.calls == list(dict.fromkeys([OPENROUTER_MODEL] + OPENROUTER_FREE_FALLBACKS))
