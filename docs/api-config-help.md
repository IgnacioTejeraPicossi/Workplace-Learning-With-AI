# API Configuration — User & Maintainer Guide

**API Config** is the command centre that decides which AI backend powers **every** agent in the app. Pick a provider, give it a key, test it, and all modules (Andrés, Red Cross QA, J-messages, etc.) route their AI calls through it.

---

## Part 1 — For users

### The four providers
- 🏠 **ItemAI API** — a local LM Studio server (`http://localhost:1234`). Free, offline, private.
- 🖥️ **ItemServerAI API** — an LM Studio server on your network. Free.
- 🚀 **OpenAI API** — direct OpenAI models (premium quality, paid). Needs an OpenAI key (`sk-...`).
- 🌐 **OpenRouter API** — one key, many providers, **including free models**. Needs an OpenRouter key (`sk-or-v1-...`).

### Set it up
1. **Select API Provider** (the cards at the top).
2. Paste the matching **API key** in the field.
3. **💾 Save Keys** — stores it in your browser **and** on the server.
4. **Restart the backend** so it loads the current code/config.
5. **🧪 Test API** — confirms the real connection works.

> "Saved successfully" only confirms the **save**. The green result from **Test API** confirms the **connection**.

### OpenRouter + free models
- The app defaults to a **FREE** model: `google/gemma-4-31b-it:free` ($0 per token).
- **"Free model" ≠ "no key".** OpenRouter still requires a valid API key to authenticate *every* request. The free model just means you aren't charged per token — a **$0 paid balance is fine** for `:free` models (they are **rate-limited**).
- Get a key at **https://openrouter.ai/keys** → *Create Key* (copy it once; it starts with `sk-or-v1-`). A free account usually needs no credit card for `:free` models.

### Troubleshooting
| Message | Meaning / fix |
|---|---|
| **"API key is required"** | No key entered and none saved/on server. Paste the key → Save Keys. |
| **"Failed to fetch"** (on save) | The browser couldn't reach the backend. Make sure the backend is running on `:8000`; restart the React dev server if needed. |
| **"OpenRouter library not installed"** | Old backend code. **Restart the backend** (the current code no longer needs that package). |
| **401 "User not found"** / **"Incorrect API key"** | Wrong/invalid key for the selected provider (an OpenRouter `sk-or-` key used with OpenAI, or a revoked key). The app now rejects a provider mismatch with a clear message; otherwise **generate a new key** and Save. |
| **429 "temporarily rate-limited"** | The free model's shared upstream pool is throttled. The backend **auto-retries across other free models** (Google → MiniMax → NVIDIA), so this usually self-heals; if all are busy, wait a minute or set `OPENROUTER_MODEL` to another `:free` model. |
| Replies look canned / `[MOCKED RESPONSE]` | No valid key reached the provider → it fell back to offline mock. Check the key + restart. |

---

## Part 2 — For maintainers (and future changes)

### Where models are chosen
`backend/gpt5_config.py` is the single source of truth. All are **env-overridable** (no code change needed):

| Tier | Constant / env | Default (2026-10) |
|---|---|---|
| Low | `OPENAI_LOW_MODEL` | `gpt-6-luna` |
| Medium | `OPENAI_MEDIUM_MODEL` | `gpt-5.4-mini` |
| High | `OPENAI_HIGH_MODEL` | `gpt-5.5` |
| Frontier (opt-in) | `OPENAI_FRONTIER_MODEL` | `gpt-6-astra` |
| OpenRouter | `OPENROUTER_MODEL` | `google/gemma-4-31b-it:free` |

`get_optimal_model(task_type, complexity)` maps `complexity` (`low`/`medium`/`high`/`frontier`) to a tier. **Frontier** (GPT-6 Astra) is **opt-in only** — e.g. the J-messages Analyzer "AI Level" dropdown sends `complexity=frontier`; it is never a default (it is ~5× the high-tier cost).

### How calls are made (`backend/llm.py`)
- Entry point: `ask_ai_unified` / `ask_ai_unified_sync(prompt|messages, task_type, complexity, max_tokens, request_headers)`.
- **Reasoning models** (`gpt-5*`, `gpt-6*`, `o1*`, `o3*`) are detected by prefix in TWO places (`_normalize_params_for_model` → `max_completion_tokens` + drop temperature; and the empty-content retry). **Any new `gpt-6`/`gpt-7` id must be covered by those prefix checks** or it returns empty/errors.
- **OpenRouter** calls use the **OpenAI SDK pointed at OpenRouter** (`OpenAI(api_key=..., base_url=OPENROUTER_BASE_URL).chat.completions.create(...)`) — no separate `openrouter` package. OpenRouter models are standard (non-reasoning) → they keep `max_tokens` + temperature.

### Where keys live (precedence)
A key is resolved in this order (first non-empty wins):
1. **Per-request** — browser field / `x-openai-key` / `x-openrouter-key` header.
2. **Environment** — `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (from `.env`).
3. **Saved config** — `api_config.json` at the repo root, written by **Save Keys** (`backend/api_config_storage.py`). This fallback (added 2026-10) is why a saved key is actually used for calls, not just stored.

The API Config module (`frontend/src/APIConfig.jsx`) selects the **provider** and stores keys; it uses the **absolute backend base** (`REACT_APP_API_BASE_URL` → default `http://localhost:8000`), like every other module.

### Handling an OpenAI model deprecation
1. Read the recommended replacement on https://developers.openai.com/api/docs/deprecations.
2. Change the one line in `gpt5_config.py` (or set the env var). Hardcoded low-model references in `api_test.py` / `routers/agentops/prompt.py` / `services/agentic_rag/your_llm.py` already import `OPENAI_LOW_MODEL`, so the default propagates.
3. If the new id is a new family prefix, extend the reasoning-model detection in `llm.py`.

History: `gpt-5.4-nano` was deprecated (shutdown 2027-04-01) → replaced by `gpt-6-luna`.

### Changing the OpenRouter free model
OpenRouter's free catalogue is **volatile** (e.g. `nex-agi/nex-n2-pro:free` was retired). To switch: set env `OPENROUTER_MODEL`, or change the default in `gpt5_config.py`. Find live free models via `GET https://openrouter.ai/api/v1/models` (no key) and filter `id` ending in `:free` with `$0` pricing.
