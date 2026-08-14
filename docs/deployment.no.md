# Utrulling (Deployment)

## Oppstart av backend
- Se `BACKEND_STARTUP.md` for detaljerte steg.
- Start fra **rot-mappen i repoet**: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`

## Miljøvariabler

### Backend
- `MONGO_URI` – tilkoblingsstreng for MongoDB (Atlas: `mongodb+srv://...`, lokalt: `mongodb://localhost:27017`)
- `OPENAI_API_KEY` – OpenAI-API-nøkkel for LLM-kall
- `HMAC_SECRET` – HMAC-nøkkel for signering mellom agenter
- `ALLOWED_ORIGINS` – tillatte CORS-origins, kommaseparert (f.eks. `https://your-app.vercel.app,http://localhost:3000`)
- `PORT` – backend-port (Cloud Run setter denne automatisk, standard 8000)
- `ALLOW_MOCK_AUTH` – **SIKKERHET**: når `true` returnerer backend en mock-bruker og alle endepunkter er åpne. **Må være `false` (eller ikke satt) i produksjon**, sammen med ekte Firebase-legitimasjon.
- `ANTHROPIC_API_KEY` – Anthropic-API-nøkkel (valgfri, alternativ LLM)
- `FIREBASE_SERVICE_ACCOUNT` – sti til Firebase-tjenestekonto-JSON
- `LM_STUDIO_URL` – lokalt LM Studio-endepunkt (valgfritt, ikke brukt i skyen)

#### Nyere agenter / moduler (valgfritt, sett kun hvis funksjonen brukes)
- `API_PROVIDER` – LLM-gateway-leverandør: `openai` \| `openrouter` \| `itemai` (bruk `openai` i skyen; itemai/LM Studio er kun lokalt)
- `OPENROUTER_API_KEY` – OpenRouter-nøkkel (alternativ LLM-leverandør)
- `EMBED_MODEL` – embeddings-modell for Self-Simulating Reality-vektorbutikken / Kildekart (standard `text-embedding-3-small`; faller tilbake til offline TF-IDF uten `OPENAI_API_KEY`)
- `AZURE_DEVOPS_PAT` (eller `ADO_PAT`) – Azure DevOps-PAT for Red Cross Web QA Agent (sprint / arbeidselement-innhenting)
- `WAVE_API_KEY` – WebAIM WAVE-nøkkel for Red Cross QA tilgjengelighetssjekker
- `ROBOMIND_ADMIN_TOKEN` – admin-port for Robomind Clinic innstillinger/policy-endepunkter
- `EMAIL_PROVIDER` + `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` (eller `SENDGRID_API_KEY`) – utgående e-post for Future-modulens "Notify Me"-flyt
- `JWT_SECRET` – signeringshemmelighet for sesjon/JWT
- `VOICEBOX_URL` – lokalt Voicebox-endepunkt (Language Agents; kun lokalt, faller tilbake til nettleser-TTS i skyen)

> Merk: `OPENAI_API_KEY` driver nå også Self-Simulating Reality-embeddings (Kildekart) og Andrés the Robot bilde/syn. Uten den degraderer disse elegant (offline/mock), de krasjer ikke.
- `BACKEND_BASE_URL` – basis-URL for FastAPI (standard http://localhost:8000)
- `OUTSYSTEMS_CALLBACK_URL` – overstyrer standard callback ved behov
- `OUTSYSTEMS_*` eller `N8N_*` – sett OutSystems, eller utelat for å bruke n8n-reserveløsning

### Frontend
- `REACT_APP_API_BASE_URL` – URL til backend-API (f.eks. `https://your-backend.run.app`)
- `REACT_APP_WEBSEARCH_BASE_URL` – URL til nettsøk-backend
- `REACT_APP_FIREBASE_*` – offentlige Firebase-konfignøkler (API_KEY, AUTH_DOMAIN, PROJECT_ID, osv.)

### Nettsøk-backend (Fase 2)
- `WEBSEARCH_PORT` – port for nettsøk-backend (standard 8080)
- `SERPER_API_KEY` – Serper.dev-API-nøkkel for nettsøk
- `ALLOWED_ORIGINS` – CORS-origins for nettsøk

## Sky-utrulling

### Arkitektur
- **Frontend**: Vercel (React, GitHub CI/CD)
- **Backend**: Google Cloud Run (Docker-container, skalerer til null)
- **Database**: MongoDB Atlas (gratis M0-nivå tilgjengelig)
- **Autentisering**: Firebase Auth (allerede integrert, ingen migrering)
- **DNS/SSL**: Cloudflare (Fase 2)

### Utrullingsartefakter
- `deployment/Dockerfile` – Python 3.11-slim, klar for Cloud Run, HEALTHCHECK inkludert
- `deployment/cloudrun.yaml` – Knative-tjenestespesifikasjon (europe-north1, skalering 0-3, startup-/liveness-/readiness-prober)

### Kjappe utrullingskommandoer
```bash
# Bygg Docker-image lokalt
docker build -t wlwai-backend -f deployment/Dockerfile .

# Test lokalt
docker run -p 8000:8000 --env-file .env wlwai-backend

# Rull ut til Cloud Run
gcloud builds submit --tag gcr.io/PROJECT/wlwai-backend
gcloud run deploy wlwai-backend --image gcr.io/PROJECT/wlwai-backend --region europe-north1
```

### Helse-endepunkter
- `GET /health` – grunnleggende helsesjekk (ok, service, versjon, tidsstempel)
- `GET /ready` – klar-sjekk med MongoDB-ping

### Cloud Install-modul
Modulen «Installing the App in the Cloud» gir en utrullingsarbeidsbenk i appen:
- Klarhets-score over **7 seksjoner**: Arkitektur, Miljø og hemmeligheter, Frontend, Backend,
  Data og Auth, **Sikkerhetsherding**, Røyktester.
- Arkitekturanbefalinger med kostnadsestimater.
- Maler for miljøvariabler med veiledning om sky-lagring (inkluderer nå de nyere agent-variablene over).
- Automatiske røyktester mot live-endepunkter, inkludert et **"Agenter og moduler"-lag** som
  pinger hver notabel agents health-endepunkt (Andrés `/api/andres/health`, Self-Simulating
  Reality `/api/self-sim-reality/health`, Claim Analyzer, Self-Correcting Loop, Robomind
  `/api/clinic/health`, Cybersecurity `/api/cyber/health`, AGI `/api/agi/progress`) — slik at
  en deploy valideres til å faktisk servere modulene, ikke bare `/health`.
- Feilsøkingsguide (nå med `modules`-, `security`- og resonneringsmodell-oppføringer).
- API: `GET/POST /api/cloud-install/*` (7 endepunkter).

### Sikkerhetsherding (før produksjon)
- Sett **`ALLOW_MOCK_AUTH=false`** (eller la den være usatt) — ellers serverer backend en delt
  mock-bruker og alle endepunkter er åpne.
- Oppgi **ekte Firebase-legitimasjon** slik at auth ikke faller tilbake til mock-brukeren.
- Modulens **Sikkerhetsherding**-seksjon sjekker begge og blir rød hvis noe er feil.

## Merknader
- Oppdater CORS-origins til å inkludere frontend-verten(e) via `ALLOWED_ORIGINS`-miljøvariabelen.
- Hemmeligheter bør bruke Google Cloud Secret Manager (backend) eller Vercel Environment Variables (frontend).
- Commit aldri `.env`-filer til git.
