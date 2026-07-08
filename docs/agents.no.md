# AGENTS.md — Workplace Learning With AI (WLWAI)

Dette repoet er en modulær AI-plattform med flere tjenester. Denne filen definerer hvordan AI-agenter (Cursor, CLI-agenter, MCP-aktiverte agenter) skal opptre når de gjør endringer.

## 0) Repo-identitet
WLWAI kombinerer:
- FastAPI-backend (Python) som tilbyr kjerne-API-er, AI-orkestrering og spesialmoduler
- React-frontend (lærings-UI + agent-UI)
- Node-basert nettsøk-backend
- Valgfrie n8n-arbeidsflyter (AgentOps Studio-automatisering)
- MCP-server (J-messages Analyzer) tilgjengelig via Postman/Claude gjennom en STDIO-broserver

Viktigste moduler:
- J-messages Analyzer (behandling av Fiskeridirektoratets regelverk)
- Robomind Clinic (AI-psykologi / Psychopathia Machinalis)
- Repo Analyzer Cursor AI (dokumentasjonsgenerering + oppretting av læringsmoduler)
- Prompt Managers for Compliance- og Productivity-agenter

## 1) Ufravikelige prinsipper
1. Små, gjennomgåbare PR-er (én hovedmodul/-tjeneste per PR med mindre annet er bedt om).
2. Commit aldri hemmeligheter (API-nøkler, tokens, passord). Bruk `.env` og miljøvariabler.
3. Bevar stabile porter og den dokumenterte tjenestetopologien:
   - backend 8000, frontend 3000, websearch 8080, n8n 5678, LM Studio 1234, MCP-testfilserver 8888.
4. Backend MÅ startes fra ROT-mappen i repoet (ikke fra `backend/`) for å unngå import-problemer.
5. Ved endring av API-kontrakter: legg til / juster kontrakttester, eller som et minimum en reproduserbar røyktest-kommando i TESTING.md.
6. Unngå tunge avhengigheter: ikke gjeninnfør den avviklede Voice Cloning-stacken eller lignende avhengigheter på flere GB.

## 2) «Arbeidsstil» (agent-arbeidsflyt)
For enhver oppgave:
1. Omfangsklassifisering: Backend / Frontend / MCP / n8n / Websearch / Konkurranse-bot.
2. Identifiser valideringsport(ene) FØR koding (se TESTING.md).
3. Implementer minimale endringer som følger eksisterende mønstre.
4. Kjør minimumsporten(e).
5. Oppsummer:
   - hva som ble endret
   - hvorfor
   - hvordan det ble validert (kommandoer + resultater)
   - risikoer / oppfølging

## 3) Tjenestegrenser (hva hører hjemme hvor)
### Backend (FastAPI, Python)
- Kjør fra rot: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- Tverrgående tjenester:
  - Enhetlig LLM-stack (delte funksjoner brukt av flere moduler)
  - Mongo-lagring for moduler (dokumenter, prompter, klinikk-kjøringer)

### Frontend (React)
- Kjører på 3000, kaller backend på 8000 (via REACT_APP_API_BASE_URL eller lignende).
- UI-moduler inkluderer: J-messages Analyzer, Robomind Clinic, Repo Analyzer Cursor AI, agent-prompt-managere, osv.

### Nettsøk-backend (Node)
- Kjører på 8080. Behandles som en separat tjeneste; hold API-et stabilt.

### n8n (Docker, valgfritt)
- Kjører på 5678. Brukes til AgentOps Studio-flyter; unngå å bryte webhook-nyttelast.

### MCP-server (J-messages Analyzer)
- Manifest: `GET http://localhost:8000/api/mcp/manifest`
- Broserver: `backend/mcp_bridge_server.py` (STDIO JSON-RPC)
- Testfilserver: `python backend/test_mcp_server.py` på port 8888 for å servere lokale dokumenter til Postman MCP.

## 4) Modul-spesifikke rammer
### A) J-messages Analyzer (Fiskeridirektoratet)
Viktige kodeplasseringer:
- Routere: `backend/routers/j_messages_analyzer.py`, `backend/routers/j_messages_training.py`
- Tjenester: `backend/services/j_messages_evaluator.py`, `backend/services/prompt_suggestion_service.py`
- Frontend: `frontend/src/JMessagesAnalyzer.jsx`, `frontend/src/JMessagesLibrary.jsx`, `frontend/src/JMessagesPairsLibrary.jsx`, `frontend/src/components/PromptPanel.jsx`

Regler:
- Bevar lagrede felter: `{id, title, status, toc, body_html, summary}` der det er relevant.
- Bevar det versjonerte native prompt-systemet under `backend/prompts/j_messages/v{version}/` og hold prompt-versjonen fanget i analyseresultatene.
- Ved endring av analyse-output: oppdater eksportstier og UI-renderere.

### B) Prompt Manager (Compliance- og Productivity-agenter)
Backend-API-kontrakten må forbli stabil:
- `GET/POST/PUT/DELETE /api/prompts/{agent}`
- `POST /api/prompts/{agent}/test` returnerer:
  - Compliance: `{ ok, output, summary, risks }`
  - Productivity: `{ ok, output, summary, actions }`

Regler:
- Hold Mongo-samlingen `prompts` sine felter kompatible (`agent`, `name`, `prompt`, flagg, tidsstempler).
- Testing av en prompt skal ikke endre live produksjonsanalyse med mindre det er eksplisitt tilsiktet.

### C) Robomind Clinic (Psychopathia Machinalis)
Det finnes to lag:
- Eldre klinikk (regeldetektorer + valgfri LLM-dommer)
- Utvidet klinikk-API (konkurranse) under `/api/robomind/*` med Pydantic-skjemaer

Endepunkter (utvidet):
- `POST /api/robomind/screen`
- `POST /api/robomind/therapy`
- `POST /api/robomind/apply`
- `GET /api/robomind/dashboard/metrics`
- `GET /api/robomind/cases/{id}`

Regler:
- Oppretthold Pydantic-skjemakompatibilitet for Screen/Therapy/Apply-svar.
- Hvis du endrer atferden til det utvidede API-et, kjør kontrakttest-suiten:
  `python -m pytest backend/tests/test_robomind_api_contracts.py -v`
- Hvis demo-modus-headere/-flagg finnes, bevar deterministisk atferd.

### D) Repo Analyzer Cursor AI
Backend-endepunkter:
- `POST /api/cursor-readme/upload-files`
- `POST /api/cursor-readme/generate`
- `POST /api/cursor-readme/save-learning-module`
- `GET /api/cursor-readme/learning-modules`
- `GET /api/cursor-readme/learning-module/{module_id}`

Regler:
- Bevar opplastingsgrenser og feilhåndtering.
- Hold «konvertering til læringsmodul» stabil; den brukes av læringssystemet.

### E) MCP-testing via Postman / Claude
Regler:
- MCP-verktøyoppdagelse må fungere via `tools/list` STDIO til broen.
- Manifestet må forbli tilgjengelig (`/api/mcp/manifest`).
- Unngå skjemaendringer på inn-/ut-data for MCP-verktøy med mindre de er versjonert.

## 5) Stoppbetingelser (stopp + rapporter)
Stopp og rapporter hvis:
- En endring kan lekke hemmeligheter eller personopplysninger (PII)
- Backend ikke lenger starter fra ROT
- MCP-verktøyoppdagelse feiler
- Gateway-/klinikk-kontrakter brytes uten en oppdatert test
- Avhengighetsvekst truer repo-størrelse eller utrullbarhet

## 6) Ferdig-definisjon (DoD)
En endring er ferdig når:
- Relevante tjenester starter og svarer
- Minimum valideringsporter passerer (TESTING.md)
- Ingen hemmeligheter er committet
- Dokumenter er oppdatert hvis arbeidsflyten ble endret
- PR-oppsummeringen inkluderer kommandobevis
