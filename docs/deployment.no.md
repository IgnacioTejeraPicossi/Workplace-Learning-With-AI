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
- `ANTHROPIC_API_KEY` – Anthropic-API-nøkkel (valgfri, alternativ LLM)
- `FIREBASE_SERVICE_ACCOUNT` – sti til Firebase-tjenestekonto-JSON
- `LM_STUDIO_URL` – lokalt LM Studio-endepunkt (valgfritt, ikke brukt i skyen)
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
- Klarhets-score og fremdriftssporing per seksjon
- Arkitekturanbefalinger med kostnadsestimater
- Maler for miljøvariabler med veiledning om sky-lagring
- Automatiske røyktester mot live-endepunkter
- Feilsøkingsguide (13 punkter over 5 kategorier)
- API: `GET/POST /api/cloud-install/*` (7 endepunkter)

## Merknader
- Oppdater CORS-origins til å inkludere frontend-verten(e) via `ALLOWED_ORIGINS`-miljøvariabelen.
- Hemmeligheter bør bruke Google Cloud Secret Manager (backend) eller Vercel Environment Variables (frontend).
- Commit aldri `.env`-filer til git.
