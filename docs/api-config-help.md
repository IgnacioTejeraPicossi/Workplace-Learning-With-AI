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
| **401 "User not found"** / **"Incorrect API key"** | Invalid or revoked key for the selected provider. **Generate a new key** and Save. (On OpenRouter a 401 is **not** retried on other models — a bad key would fail on all of them.) |
| ✅ success with the note *"the OpenAI field held an OpenRouter key sk-or-…; it was ignored…"* | The browser's **OpenAI** field has an **OpenRouter** key stored in it. The app ignores it and uses the server's OpenAI key (`.env`), so it **works**. To remove the note: clear the OpenAI field or enter your `sk-proj…` key → **Save Keys**. |
| **"This looks like an OpenRouter key (sk-or-...), not an OpenAI key"** | Same as above, but the server has **no** `OPENAI_API_KEY`. Enter a real OpenAI key, or select the OpenRouter provider. |
| **"This looks like an OpenAI key (sk-...), not an OpenRouter key"** | An OpenAI key was entered in the OpenRouter field. Enter your `sk-or-v1-…` key. |
| **429 "temporarily rate-limited"** | The free model's shared upstream pool is throttled. The backend **auto-retries across other free models** (Google → Poolside → NVIDIA), so this usually self-heals; if all are busy, wait a minute or set `OPENROUTER_MODEL` to another `:free` model. |
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
- **OpenRouter** calls use the **OpenAI SDK pointed at OpenRouter** (`OpenAI(api_key=..., base_url=OPENROUTER_BASE_URL).chat.completions.create(...)`) — no separate `openrouter` package. They are called as standard models → `max_tokens` + temperature. (The catalogue flags almost every `:free` model as "reasoning"-capable, but they work with `max_tokens`; verified 2026-10-23.)
- Every OpenRouter call (`ask_openrouter` and the Test API button) goes through `_openrouter_create_with_fallback()` → see *Fallback across free models* below.

### Where keys live (precedence)
A key is resolved in this order (first non-empty wins):
1. **Per-request** — browser field / `x-openai-key` / `x-openrouter-key` header.
2. **Environment** — `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (from `.env`).
3. **Saved config** — `api_config.json` at the repo root, written by **Save Keys** (`backend/api_config_storage.py`). This fallback (added 2026-10) is why a saved key is actually used for calls, not just stored.

**Cross-provider key rule** (2026-10): a `sk-or-` key is **never** sent to OpenAI.
- `llm.get_api_config_from_headers`: if the `x-openai-key` header is `sk-or-…`, it is ignored and `.env` / saved config is used.
- `/api/test-api` (provider `openai`): does the same and says so in the message; it only errors if no OpenAI key is left.
- `/api/test-api` (provider `openrouter`): a `sk-…` key that is not `sk-or-` is rejected with a clear 400.
- Typical cause: the browser stores the fields in `localStorage` (`openaiKey`, `openrouterKey`), so a key pasted into the wrong field stays there until you clear it and press Save Keys.

The API Config module (`frontend/src/APIConfig.jsx`) selects the **provider** and stores keys; it uses the **absolute backend base** (`REACT_APP_API_BASE_URL` → default `http://localhost:8000`), like every other module.

### Handling an OpenAI model deprecation
1. Read the recommended replacement on https://developers.openai.com/api/docs/deprecations.
2. Change the one line in `gpt5_config.py` (or set the env var). Hardcoded low-model references in `api_test.py` / `routers/agentops/prompt.py` / `services/agentic_rag/your_llm.py` already import `OPENAI_LOW_MODEL`, so the default propagates.
3. If the new id is a new family prefix, extend the reasoning-model detection in `llm.py`.

History: `gpt-5.4-nano` was deprecated (shutdown 2027-04-01) → replaced by `gpt-6-luna`.

### Changing the OpenRouter free model
OpenRouter's free catalogue is **volatile** (e.g. `nex-agi/nex-n2-pro:free` was retired). To switch: set env `OPENROUTER_MODEL`, or change the default in `gpt5_config.py`. Find live free models via `GET https://openrouter.ai/api/v1/models` (no key) and filter `id` ending in `:free` with `$0` pricing.

### Fallback across free models
`:free` models share per-provider rate-limit pools and often return 404/429. `_openrouter_create_with_fallback(client, messages, params, primary_model)` in `backend/llm.py`:
1. Tries `OPENROUTER_MODEL`, then each model in `OPENROUTER_FREE_FALLBACKS` (no repeats), in order.
2. **Auth errors first** (`401`, `user not found`, `unauthorized`, `invalid api key`) → raised at once, no retry. Checked first because OpenRouter's 401 says "User not found", which would otherwise match the generic "not found" marker.
3. **Transient errors** (`429`, `404`, `rate-limit`, `temporarily`, `provider returned error`, `not found`, `no endpoints`) → next model.
4. Any other error → raised at once. If every model fails → the last error is raised.
5. Returns `(response, model_used)`; the Test API shows *"default model was rate-limited; used free fallback X"* when the default model did not answer.

Default list (`gpt5_config.py`), a different provider at each step so one pool cannot take the app down:

| Order | Model | Provider |
|---|---|---|
| 1 | `google/gemma-4-31b-it:free` (= `OPENROUTER_MODEL`) | Google |
| 2 | `poolside/laguna-s-2.1:free` | Poolside |
| 3 | `nvidia/nemotron-3-ultra-550b-a55b:free` | NVIDIA |

Override without code via `OPENROUTER_FREE_FALLBACKS=model1,model2,...` in `.env` (see `.env.example`).

### Checking a free model before adding it
1. **It exists**: `GET https://openrouter.ai/api/v1/models` (no key) and look for the exact `id`. *Real example:* `minimax/minimax-m3.1-flash:free` worked on 2026-10-22 and OpenRouter **retired** it the next day — from then on it was silently skipped. The free catalogue changes from one day to the next.
2. **It really answers** a small call (like the Test API: `max_tokens=50`) with your key. What the errors mean:
   - **403 "only available on agentic harnesses"** → unusable for this app (e.g. `thinkingmachines/inkling:free`).
   - **429** → exists but busy right now; fine as a fallback.
   - **404 / "No endpoints"** → retired or no active provider.
3. Update `gpt5_config.py` + `.env.example` + this help (3 languages) + `CHANGELOG`.

### Tests (offline, in CI)
- `backend/tests/test_openrouter_fallback.py` — fallback (direct success, 404/429 → next, 401 not retried, all fail, no duplicates), Test API message and the cross-provider key rule.
- `backend/tests/test_api_test_fallback.py` — Test API uses the `.env` key when the field is empty.
- Run: `python -m pytest backend/tests/test_openrouter_fallback.py backend/tests/test_api_test_fallback.py -q`
- Live check (uses the server's saved key): `POST http://localhost:8000/api/test-api` with `{"provider":"openrouter","openrouterKey":""}` or `{"provider":"openai","openaiKey":""}`.

### Change history (2026-10)
| Commit | Date | Change |
|---|---|---|
| `47759e7` | 2026-10-22 | `sk-or-` ↔ OpenAI cross-provider rule. Default free model: `nvidia/nemotron-3-super-120b-a12b:free` → `google/gemma-4-31b-it:free`. |
| `467a9bc` | 2026-10-22 | `_openrouter_create_with_fallback` + `OPENROUTER_FREE_FALLBACKS`; Test API reports which fallback answered. |
| `46bc7d7` | 2026-10-23 | Fix: a 401 was retried on every model. New tests + CI, `.env.example`, CHANGELOG `[1.45.6]`. |
| `47e3a9f` | 2026-10-23 | Fallback `minimax/minimax-m3.1-flash:free` (retired from OpenRouter) → `poolside/laguna-s-2.1:free`. |
| `f9647ec` | 2026-10-23 | Test API (OpenAI) ignores a `sk-or-` key in the field and uses the server key instead of failing. |
