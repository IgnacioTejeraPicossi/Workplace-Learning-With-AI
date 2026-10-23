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
- Appen bruker som standard en **GRATIS** modell: `google/gemma-4-31b-it:free` ($0 per token).
- **"Gratis modell" ≠ "ingen nøkkel".** OpenRouter krever fortsatt en gyldig API-nøkkel for å autentisere **hvert** kall. Gratismodellen betyr bare at du ikke belastes per token — en **betalt saldo på $0 holder** for `:free`-modeller (de er **ratebegrenset**).
- Hent en nøkkel på **https://openrouter.ai/keys** → *Create Key* (kopier den én gang; den starter med `sk-or-v1-`). En gratis konto trenger vanligvis ikke kredittkort for `:free`-modeller.

### Feilsøking
| Melding | Betydning / løsning |
|---|---|
| **"API key is required"** | Ingen nøkkel skrevet inn og ingen lagret/på server. Lim inn nøkkelen → Save Keys. |
| **"Failed to fetch"** (ved lagring) | Nettleseren nådde ikke backend. Sjekk at backend kjører på `:8000`; start React-dev-serveren på nytt ved behov. |
| **"OpenRouter library not installed"** | Gammel backend-kode. **Start backend på nytt** (gjeldende kode trenger ikke den pakken lenger). |
| **401 "User not found"** / **"Incorrect API key"** | Ugyldig eller tilbakekalt nøkkel for valgt leverandør. **Generer en ny nøkkel** og lagre. (Hos OpenRouter prøves en 401 **ikke** på andre modeller — en feil nøkkel ville feilet på alle.) |
| ✅ vellykket med merknaden *"the OpenAI field held an OpenRouter key sk-or-…; it was ignored…"* | **OpenAI**-feltet i nettleseren har en **OpenRouter**-nøkkel lagret. Appen ignorerer den og bruker serverens OpenAI-nøkkel (`.env`), så det **fungerer**. For å fjerne merknaden: tøm OpenAI-feltet eller skriv inn `sk-proj…`-nøkkelen din → **Save Keys**. |
| **"This looks like an OpenRouter key (sk-or-...), not an OpenAI key"** | Som over, men serveren har **ingen** `OPENAI_API_KEY`. Skriv inn en ekte OpenAI-nøkkel, eller velg OpenRouter-leverandøren. |
| **"This looks like an OpenAI key (sk-...), not an OpenRouter key"** | En OpenAI-nøkkel er skrevet i OpenRouter-feltet. Skriv inn `sk-or-v1-…`-nøkkelen din. |
| **429 "temporarily rate-limited"** | Den gratis modellens delte pool er ratebegrenset. Backend **prøver automatisk andre gratis modeller** (Google → Poolside → NVIDIA), så dette løser seg vanligvis selv; hvis alle er opptatt, vent et minutt eller sett `OPENROUTER_MODEL` til en annen `:free`-modell. |
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
| OpenRouter | `OPENROUTER_MODEL` | `google/gemma-4-31b-it:free` |

`get_optimal_model(task_type, complexity)` kobler `complexity` (`low`/`medium`/`high`/`frontier`) til et nivå. **Frontier** (GPT-6 Astra) er **kun opt-in** — f.eks. sender "AI Level"-nedtrekket i J-messages Analyzer `complexity=frontier`; det er aldri standard (koster ~5× høy-nivået).

### Hvordan kallene gjøres (`backend/llm.py`)
- Inngangspunkt: `ask_ai_unified` / `ask_ai_unified_sync(prompt|messages, task_type, complexity, max_tokens, request_headers)`.
- **Resonneringsmodeller** (`gpt-5*`, `gpt-6*`, `o1*`, `o3*`) oppdages via prefiks TO steder (`_normalize_params_for_model` → `max_completion_tokens` + fjern temperatur; og tom-innhold-retrien). **Enhver ny `gpt-6`/`gpt-7`-id må dekkes av disse prefikssjekkene**, ellers returnerer den tomt/feil.
- **OpenRouter**-kall bruker **OpenAI-SDK-en pekt mot OpenRouter** (`OpenAI(api_key=..., base_url=OPENROUTER_BASE_URL).chat.completions.create(...)`) — ingen egen `openrouter`-pakke. De kalles som standardmodeller → `max_tokens` + temperatur. (Katalogen merker nesten alle `:free`-modeller som "reasoning"-kapable, men de fungerer med `max_tokens`; verifisert 2026-10-23.)
- Alle OpenRouter-kall (`ask_openrouter` og Test API-knappen) går via `_openrouter_create_with_fallback()` → se *Fallback mellom gratismodeller* nedenfor.

### Hvor nøklene bor (rekkefølge)
En nøkkel løses i denne rekkefølgen (første ikke-tomme vinner):
1. **Per forespørsel** — nettleserfelt / `x-openai-key` / `x-openrouter-key`-header.
2. **Miljø** — `OPENAI_API_KEY` / `OPENROUTER_API_KEY` (fra `.env`).
3. **Lagret konfig** — `api_config.json` i repo-roten, skrevet av **Save Keys** (`backend/api_config_storage.py`). Dette fallbacket (lagt til 2026-10) er grunnen til at en lagret nøkkel faktisk brukes i kall, ikke bare lagres.

**Regel mot leverandør-forveksling** (2026-10): en `sk-or-`-nøkkel sendes **aldri** til OpenAI.
- `llm.get_api_config_from_headers`: hvis `x-openai-key`-headeren er `sk-or-…`, ignoreres den og `.env` / lagret konfig brukes.
- `/api/test-api` (provider `openai`): gjør det samme og sier det i meldingen; feiler bare hvis ingen OpenAI-nøkkel finnes.
- `/api/test-api` (provider `openrouter`): en `sk-…`-nøkkel som ikke er `sk-or-` avvises med en tydelig 400.
- Typisk årsak: nettleseren lagrer feltene i `localStorage` (`openaiKey`, `openrouterKey`), så en nøkkel limt inn i feil felt blir liggende til du tømmer det og trykker Save Keys.

API Config-modulen (`frontend/src/APIConfig.jsx`) velger **leverandør** og lagrer nøkler; den bruker den **absolutte backend-basen** (`REACT_APP_API_BASE_URL` → standard `http://localhost:8000`), som alle andre moduler.

### Håndtere en OpenAI-modell-utfasing
1. Les anbefalt erstatning på https://developers.openai.com/api/docs/deprecations.
2. Endre den ene linjen i `gpt5_config.py` (eller sett miljøvariabelen). Hardkodede low-modell-referanser i `api_test.py` / `routers/agentops/prompt.py` / `services/agentic_rag/your_llm.py` importerer allerede `OPENAI_LOW_MODEL`, så standarden forplanter seg.
3. Hvis den nye id-en er en ny familieprefiks, utvid resonneringsmodell-deteksjonen i `llm.py`.

Historikk: `gpt-5.4-nano` ble utfaset (avslått 2027-04-01) → erstattet med `gpt-6-luna`.

### Endre OpenRouter-gratismodellen
OpenRouters gratiskatalog er **volatil** (f.eks. ble `nex-agi/nex-n2-pro:free` trukket tilbake). For å bytte: sett env `OPENROUTER_MODEL`, eller endre standarden i `gpt5_config.py`. Finn levende gratismodeller via `GET https://openrouter.ai/api/v1/models` (ingen nøkkel) og filtrer `id` som ender på `:free` med `$0`-pris.

### Fallback mellom gratismodeller
`:free`-modeller deler ratebegrensnings-pooler per leverandør og gir ofte 404/429. `_openrouter_create_with_fallback(client, messages, params, primary_model)` i `backend/llm.py`:
1. Prøver `OPENROUTER_MODEL`, deretter hver modell i `OPENROUTER_FREE_FALLBACKS` (uten gjentakelser), i rekkefølge.
2. **Autentiseringsfeil først** (`401`, `user not found`, `unauthorized`, `invalid api key`) → kastes straks, ingen nytt forsøk. Sjekkes først fordi OpenRouters 401 sier "User not found", som ellers ville truffet den generelle "not found"-markøren.
3. **Forbigående feil** (`429`, `404`, `rate-limit`, `temporarily`, `provider returned error`, `not found`, `no endpoints`) → neste modell.
4. Alle andre feil → kastes straks. Hvis alle modeller feiler → siste feil kastes.
5. Returnerer `(response, model_used)`; Test API viser *"default model was rate-limited; used free fallback X"* når standardmodellen ikke svarte.

Standardliste (`gpt5_config.py`), en ny leverandør i hvert steg så én pool ikke kan stoppe appen:

| Rekkefølge | Modell | Leverandør |
|---|---|---|
| 1 | `google/gemma-4-31b-it:free` (= `OPENROUTER_MODEL`) | Google |
| 2 | `poolside/laguna-s-2.1:free` | Poolside |
| 3 | `nvidia/nemotron-3-ultra-550b-a55b:free` | NVIDIA |

Kan overstyres uten kode med `OPENROUTER_FREE_FALLBACKS=modell1,modell2,...` i `.env` (se `.env.example`).

### Sjekke en gratismodell før du legger den til
1. **At den finnes**: `GET https://openrouter.ai/api/v1/models` (ingen nøkkel) og se etter eksakt `id`. *Ekte eksempel:* `minimax/minimax-m3.1-flash:free` fungerte 2026-10-22, og OpenRouter **trakk den tilbake** dagen etter — siden ble den hoppet over i stillhet. Gratiskatalogen endrer seg fra en dag til den neste.
2. **At den faktisk svarer** på et lite kall (som Test API: `max_tokens=50`) med nøkkelen din. Hva feilene betyr:
   - **403 "only available on agentic harnesses"** → kan ikke brukes i denne appen (f.eks. `thinkingmachines/inkling:free`).
   - **429** → finnes, men er opptatt nå; greit som fallback.
   - **404 / "No endpoints"** → trukket tilbake eller ingen aktiv leverandør.
3. Oppdater `gpt5_config.py` + `.env.example` + denne hjelpen (3 språk) + `CHANGELOG`.

### Tester (offline, i CI)
- `backend/tests/test_openrouter_fallback.py` — fallback (direkte suksess, 404/429 → neste, 401 uten nytt forsøk, alle feiler, ingen duplikater), Test API-meldingen og regelen mot nøkkel-forveksling.
- `backend/tests/test_api_test_fallback.py` — Test API bruker `.env`-nøkkelen når feltet er tomt.
- Kjør: `python -m pytest backend/tests/test_openrouter_fallback.py backend/tests/test_api_test_fallback.py -q`
- Live-sjekk (bruker serverens lagrede nøkkel): `POST http://localhost:8000/api/test-api` med `{"provider":"openrouter","openrouterKey":""}` eller `{"provider":"openai","openaiKey":""}`.

### Endringshistorikk (2026-10)
| Commit | Dato | Endring |
|---|---|---|
| `47759e7` | 2026-10-22 | Regel mot `sk-or-` ↔ OpenAI-forveksling. Standard gratismodell: `nvidia/nemotron-3-super-120b-a12b:free` → `google/gemma-4-31b-it:free`. |
| `467a9bc` | 2026-10-22 | `_openrouter_create_with_fallback` + `OPENROUTER_FREE_FALLBACKS`; Test API viser hvilken fallback som svarte. |
| `46bc7d7` | 2026-10-23 | Fiks: en 401 ble prøvd på alle modeller. Nye tester + CI, `.env.example`, CHANGELOG `[1.45.6]`. |
| `47e3a9f` | 2026-10-23 | Fallback `minimax/minimax-m3.1-flash:free` (trukket tilbake fra OpenRouter) → `poolside/laguna-s-2.1:free`. |
| `f9647ec` | 2026-10-23 | Test API (OpenAI) ignorerer en `sk-or-`-nøkkel i feltet og bruker servernøkkelen i stedet for å feile. |
