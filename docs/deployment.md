# Deployment

## Backend startup
- See `BACKEND_STARTUP.md` for detailed steps.
- Start from **repo root**: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`

## Environment variables

### Backend
- `MONGO_URI` – MongoDB connection string (Atlas: `mongodb+srv://...`, local: `mongodb://localhost:27017`)
- `OPENAI_API_KEY` – OpenAI API key for LLM calls
- `HMAC_SECRET` – HMAC key for agent-to-agent signing
- `ALLOWED_ORIGINS` – CORS allowed origins, comma-separated (e.g. `https://your-app.vercel.app,http://localhost:3000`)
- `PORT` – Backend port (Cloud Run injects this automatically, default 8000)
- `ALLOW_MOCK_AUTH` – **SECURITY**: when `true`, the backend returns a mock user and every endpoint is open. **Must be `false` (or unset) in production**, together with real Firebase credentials.
- `ANTHROPIC_API_KEY` – Anthropic API key (optional, alternative LLM)
- `FIREBASE_SERVICE_ACCOUNT` – Path to Firebase service account JSON
- `LM_STUDIO_URL` – Local LM Studio endpoint (optional, not used in cloud)
- `BACKEND_BASE_URL` – base URL for FastAPI (default http://localhost:8000)
- `OUTSYSTEMS_CALLBACK_URL` – overrides default callback if needed
- `OUTSYSTEMS_*` or `N8N_*` – set OutSystems, or omit to use n8n fallback

#### Newer agents / modules (optional, set only if the feature is used)
- `API_PROVIDER` – LLM gateway provider: `openai` \| `openrouter` \| `itemai` (use `openai` in cloud; itemai/LM Studio is local-only)
- `OPENROUTER_API_KEY` – OpenRouter key (alternative LLM provider)
- `EMBED_MODEL` – embeddings model for the Self-Simulating Reality vector store / Source Map (default `text-embedding-3-small`; falls back to offline TF-IDF without `OPENAI_API_KEY`)
- `AZURE_DEVOPS_PAT` (a.k.a. `ADO_PAT`) – Azure DevOps PAT for the Red Cross Web QA Agent (sprint / work-item ingest)
- `WAVE_API_KEY` – WebAIM WAVE key for Red Cross QA accessibility checks
- `ROBOMIND_ADMIN_TOKEN` – admin gate for Robomind Clinic settings/policy endpoints
- `EMAIL_PROVIDER` + `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` (or `SENDGRID_API_KEY`) – outbound email for the Future module "Notify Me" flow
- `JWT_SECRET` – session/JWT signing secret
- `VOICEBOX_URL` – local Voicebox voice-cloning endpoint (Language Agents; local-only, falls back to browser TTS in cloud)

> Note: `OPENAI_API_KEY` now also powers the Self-Simulating Reality embeddings (Source Map) and Andrés the Robot image/vision. Without it those degrade gracefully (offline/mock), they don't crash.

### Frontend
- `REACT_APP_API_BASE_URL` – Backend API URL (e.g. `https://your-backend.run.app`)
- `REACT_APP_WEBSEARCH_BASE_URL` – Web search backend URL
- `REACT_APP_FIREBASE_*` – Firebase public config keys (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)

### Websearch Backend (Phase 2)
- `WEBSEARCH_PORT` – Websearch backend port (default 8080)
- `SERPER_API_KEY` – Serper.dev API key for web search
- `ALLOWED_ORIGINS` – CORS origins for websearch

## Cloud Deployment

### Architecture
- **Frontend**: Vercel (React, GitHub CI/CD)
- **Backend**: Google Cloud Run (Docker container, scale to zero)
- **Database**: MongoDB Atlas (free M0 tier available)
- **Auth**: Firebase Auth (already integrated, no migration)
- **DNS/SSL**: Cloudflare (Phase 2)

### Deployment artifacts
- `deployment/Dockerfile` – Python 3.11-slim, Cloud Run-ready, HEALTHCHECK included
- `deployment/cloudrun.yaml` – Knative service spec (europe-north1, scale 0-3, startup/liveness/readiness probes)

### Quick deploy commands
```bash
# Build Docker image locally
docker build -t wlwai-backend -f deployment/Dockerfile .

# Test locally
docker run -p 8000:8000 --env-file .env wlwai-backend

# Deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT/wlwai-backend
gcloud run deploy wlwai-backend --image gcr.io/PROJECT/wlwai-backend --region europe-north1
```

### Health endpoints
- `GET /health` – Basic health check (ok, service, version, timestamp)
- `GET /ready` – Readiness check with MongoDB ping

### Cloud Install module
The "Installing the App in the Cloud" module provides an in-app deployment workbench:
- Readiness score across **7 sections**: Architecture, Environment & Secrets, Frontend,
  Backend, Data & Auth, **Security Hardening**, Smoke Tests.
- Architecture recommendations with cost estimates.
- Environment variable templates with cloud storage guidance (now includes the newer-agent
  vars above).
- Automated smoke tests against live endpoints, including a **"Agents & Modules" layer** that
  pings each notable agent's health endpoint (Andrés `/api/andres/health`, Self-Simulating
  Reality `/api/self-sim-reality/health`, Claim Analyzer, Self-Correcting Loop, Robomind
  `/api/clinic/health`, Cybersecurity `/api/cyber/health`, AGI `/api/agi/progress`) so a
  deploy is validated to actually serve the modules, not just `/health`.
- Troubleshooting guide (now including `modules`, `security` and reasoning-model entries).
- API: `GET/POST /api/cloud-install/*` (7 endpoints).

### Security hardening (before going live)
- Set **`ALLOW_MOCK_AUTH=false`** (or leave it unset) — otherwise the backend serves a shared
  mock user and every endpoint is open.
- Provide **real Firebase credentials** (`FIREBASE_SERVICE_ACCOUNT` / `serviceAccountKey.json`
  / `FIREBASE_CREDENTIALS`), so auth doesn't fall back to the mock user.
- The module's **Security Hardening** readiness section checks both and shows red when either
  is wrong.

## Notes
- Update CORS origins to include your frontend host(s) via `ALLOWED_ORIGINS` env var.
- Secrets should use Google Cloud Secret Manager (backend) or Vercel Environment Variables (frontend).
- Never commit `.env` files to git.
