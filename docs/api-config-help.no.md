# API-konfigurasjon — Bruker- og vedlikeholdsguide

**API Config** er kommandosenteret som bestemmer hvilken KI-backend som driver **alle** agentene i appen. Du velger en leverandør, gir den en nøkkel, tester den, og alle moduler (Andrés, Red Cross QA, J-messages osv.) ruter KI-kallene sine gjennom den.

---

## Del 1 — For brukere

### De fire leverandørene
- 🏠 **ItemAI API** — en lokal LM Studio-server (`http://localhost:1234`). Gratis, offline, privat.
- 🖥️ **ItemServerAI API** — en LM Studio-server på nettverket ditt. Gratis.
- 🚀 **OpenAI API** — OpenAI-modeller direkte (premium, betalt). Krever OpenAI-nøkkel (`sk-...`).
- 🌐 **OpenRouter API** — én nøkkel, mange leverandører, **inkludert gratis modeller**. Krever OpenRouter-nøkkel (`sk-or-v1-...`).

### Sett det opp
1. **Velg leverandør** (kortene øverst).
2. Lim inn riktig **API-nøkkel** i feltet.
3. **💾 Save Keys** — lagres i nettleseren din **og** på serveren.
4. **Start backend på nytt** så den laster gjeldende kode/konfig.
5. **🧪 Test API** — bekrefter at den reelle tilkoblingen virker.

> "Lagret" bekrefter bare **lagringen**. Det grønne resultatet fra **Test API** bekrefter **tilkoblingen**.

### OpenRouter + gratis modeller
- Appen bruker som standard en **GRATIS** modell: `nvidia/nemotron-3-super-120b-a12b:free` ($0 per token).
- **"Gratis modell" ≠ "ingen nøkkel".** OpenRouter krever fortsatt en gyldig API-nøkkel for å autentisere **hvert** kall. Gratismodellen betyr bare at du ikke belastes per token — en **betalt saldo på $0 holder** for `:free`-modeller (de er **ratebegrenset**).
- Hent en nøkkel på **https://openrouter.ai/keys** → *Create Key* (kopier den én gang; den starter med `sk-or-v1-`). En gratis konto trenger vanligvis ikke kredittkort for `:free`-modeller.

### Feilsøking
| Melding | Betydning / løsning |
|---|---|
| **"API key is required"** | Ingen nøkkel skrevet inn og ingen lagret/på server. Lim inn nøkkelen → Save Keys. |
| **"Failed to fetch"** (ved lagring) | Nettleseren nådde ikke backend. Sjekk at backend kjører på `:8000`; start React-dev-serveren på nytt ved behov. |
| **"OpenRouter library not installed"** | Gammel backend-kode. **Start backend på nytt** (gjeldende kode trenger ikke den pakken lenger). |
| **401 "User not found"** | Selve **OpenRouter-nøkkelen er ugyldig/tilbakekalt** (ikke et kredittproblem — det ville vært 402). **Generer en ny nøkkel** og lagre. |
| Svar ser standardiserte ut / `[MOCKED RESPONSE]` | Ingen gyldig nøkkel nådde leverandøren → falt tilbake til offline-mock. Sjekk nøkkelen + start på nytt. |

---

## Del 2 — For vedlikehold (og framtidige endringer)

### Hvor modellene velges
`backend/gpt5_config.py` er den eneste sannhetskilden. Alle kan **overstyres med miljøvariabler** (uten kodeendring):

| Nivå | Konstant / env | Standard (2026-10) |
|---|---|---|
| Low | `OPENAI_LOW_MODEL` | `gpt-6-luna` |
| Medium | `OPENAI_MEDIUM_MODEL` | `gpt-5.4-mini` |
| High | `OPENAI_HIGH_MODEL` | `gpt-5.5` |
| Frontier (opt-in) | `OPENAI_FRONTIER_MODEL` | `gpt-6-astra` |
| OpenRouter | `OPENROUTER_MODEL` | `nvidia/nemotron-3-super-120b-a12b:free` |

`get_optimal_model(task_type, complexity)` kobler `complexity` (`low`/`medium`/`high`/`frontier`) til et nivå. **Frontier** (GPT-6 Astra) er **kun opt-in** — f.eks. sender "AI Level"-nedtrekket i J-messages Analyzer `complexity=frontier`; det er aldri standard (koster ~5× høy-nivået).

### Hvordan kallene gjøres (`backend/llm.py`)
- Inngangspunkt: `ask_ai_unified` / `ask_ai_unified_sync(prompt|messages, task_type, complexity, max_tokens, request_headers)`.
- **Resonneringsmodeller** (`gpt-5*`, `gpt-6*`, `o1*`, `o3*`) oppdages via prefiks TO steder (`_normalize_params_for_model` → `max_completion_tokens` + fjern temperatur; og tom-innhold-retrien). **Enhver ny `gpt-6`/`gpt-7`-id må dekkes av disse prefikssjekkene**, ellers returnerer den tomt/feil.
- **OpenRouter**-kall bruker **OpenAI-SDK-en pekt mot OpenRouter** (`OpenAI(api_key=..., base_url=OPENROUTER_BASE_URL).chat.completions.create(...)`) — ingen egen `openrouter`-pakke. OpenRouter-modeller er standard (ikke-resonnerende) → de beholder `max_tokens` + temperatur.

### Hvor nøklene bor (rekkefølge)
En nøkkel løses i denne rekkefølgen (første ikke-tomme vinner):
1. **Per forespørsel** — nettleserfelt / `x-openai-key` / `x-openrouter-key`-header.
2. **Miljø** — `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (fra `.env`).
3. **Lagret konfig** — `api_config.json` i repo-roten, skrevet av **Save Keys** (`backend/api_config_storage.py`). Dette fallbacket (lagt til 2026-10) er grunnen til at en lagret nøkkel faktisk brukes i kall, ikke bare lagres.

API Config-modulen (`frontend/src/APIConfig.jsx`) velger **leverandør** og lagrer nøkler; den bruker den **absolutte backend-basen** (`REACT_APP_API_BASE_URL` → standard `http://localhost:8000`), som alle andre moduler.

### Håndtere en OpenAI-modell-utfasing
1. Les anbefalt erstatning på https://developers.openai.com/api/docs/deprecations.
2. Endre den ene linjen i `gpt5_config.py` (eller sett miljøvariabelen). Hardkodede low-modell-referanser i `api_test.py` / `routers/agentops/prompt.py` / `services/agentic_rag/your_llm.py` importerer allerede `OPENAI_LOW_MODEL`, så standarden forplanter seg.
3. Hvis den nye id-en er en ny familieprefiks, utvid resonneringsmodell-deteksjonen i `llm.py`.

Historikk: `gpt-5.4-nano` ble utfaset (avslått 2027-04-01) → erstattet med `gpt-6-luna`.

### Endre OpenRouter-gratismodellen
OpenRouters gratiskatalog er **volatil** (f.eks. ble `nex-agi/nex-n2-pro:free` trukket tilbake). For å bytte: sett env `OPENROUTER_MODEL`, eller endre standarden i `gpt5_config.py`. Finn levende gratismodeller via `GET https://openrouter.ai/api/v1/models` (ingen nøkkel) og filtrer `id` som ender på `:free` med `$0`-pris.
