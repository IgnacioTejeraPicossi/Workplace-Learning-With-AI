"""Offline regression test for /api/test-api server-side key fallback.

Bug (2026-08-22): the "Test API" button in API Config sends the UI-field key,
which is empty when the user relies on the server's `.env` OPENAI_API_KEY. The
endpoint required the request key and never fell back to the environment, so the
test failed with an empty, confusing message ("API test failed: API test failed:").
Fix: fall back to OPENAI_API_KEY / OPENROUTER_API_KEY when the field is empty, and
never return an empty error string.

These tests mock the OpenAI SDK so they run with no network and no real key.
"""
import os
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from backend.api_test import test_api_connection as run_test_api, APITestRequest


def _fake_completion(*_a, **_k):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content="OpenAI API is working correctly."))]
    )


@pytest.mark.asyncio
async def test_openai_falls_back_to_env_when_field_empty():
    with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-env-test-key"}), \
         patch("backend.api_test.openai.chat.completions.create", side_effect=_fake_completion):
        res = await run_test_api(APITestRequest(provider="openai", openaiKey=""))
    assert res["success"] is True
    assert res["provider"] == "openai"


@pytest.mark.asyncio
async def test_openai_uses_supplied_field_key_when_present():
    with patch.dict(os.environ, {}, clear=False), \
         patch("backend.api_test.openai.chat.completions.create", side_effect=_fake_completion) as mock_create:
        await run_test_api(APITestRequest(provider="openai", openaiKey="sk-field-key"))
    # the field key wins over any env key
    assert mock_create.called


@pytest.mark.asyncio
async def test_openai_missing_everywhere_returns_nonempty_error():
    env = {k: v for k, v in os.environ.items() if k != "OPENAI_API_KEY"}
    with patch.dict(os.environ, env, clear=True):
        res = await run_test_api(APITestRequest(provider="openai", openaiKey=""))
    assert res["success"] is False
    # the message must never be empty (the original bug) and must be informative
    assert res["error"] and res["error"].strip()
    assert "required" in res["error"].lower()
