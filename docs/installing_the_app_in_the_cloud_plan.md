# Installing the App in the Cloud
**Implementation Plan for Workplace Learning With AI (WLWAI)**  
**Format:** Cursor AI + Claude Code ready Markdown  
**Date:** April 2026

---

## 1. Executive Summary

This document defines the implementation plan for a new WLWAI module called **Installing the App in the Cloud**.

The purpose of the module is twofold:

1. Help move the existing application from a local Windows development environment to a cloud-accessible environment.
2. Teach, inside the app itself, how a local AI-powered application can be deployed to the cloud and made accessible from any device.

This module should **cloud-enable the existing architecture with minimal disruption**.

---

## 2. Strategic Principle

### Do not rewrite the stack
The current application already has a clear architecture:

- Frontend: React
- Backend: FastAPI (Python)
- Database: MongoDB
- Authentication: Firebase Auth
- Optional automation layer: n8n
- Extra service: separate Node.js web search backend

Because of that, the correct strategy is:

> **Cloudify the current architecture incrementally, instead of migrating to a different platform stack.**

### Explicit decisions
For the first deployment phase:

- Keep MongoDB
- Keep Firebase Auth
- Keep FastAPI
- Keep React
- Keep the existing AI provider model
- Leave n8n out of the first deployment
- Treat the web search backend as optional / phase 2
- Do not introduce Supabase or Clerk
- Do not attempt a one-click “auto deploy” module in v1

---

## 3. Recommended Cloud Architecture

### Frontend
**Vercel**
- Best fit for a React frontend
- Easy GitHub-based deployment
- Fast feedback loop

### Backend
**Google Cloud Run**
- Good fit for the existing FastAPI backend
- Container-first
- Good learning value for cloud deployment

### Database
**MongoDB Atlas**
- Natural continuation of the current MongoDB-based design
- Minimal application refactor

### Authentication
**Firebase Auth**
- Keep current auth model
- Avoid unnecessary migration

### DNS / SSL / Edge
**Cloudflare**
- Domain, DNS, SSL, and optional protection layer
- Can be added after the first successful deployment

### Optional Later Add-ons
- Sentry
- PostHog
- Resend
- n8n in cloud
- web search backend as a separate deployable service

---

## 4. Why This Architecture Is the Right Choice

This recommendation is based on the realities of the current repo:

- the backend is already a standalone FastAPI service
- the frontend is already a standalone React application
- the repo already includes deployment-oriented assets
- MongoDB is already central to the application
- Firebase Auth is already part of the design
- n8n is already documented as optional
- the application already runs as multiple services locally

The cloud version should feel like **the same product**, not a rebuilt product.

---

## 5. Module Mission

The new module **Installing the App in the Cloud** should become:

> A deployment planning, readiness, checklist, and validation module embedded inside WLWAI.

It should help the user answer:

- What is my recommended cloud architecture?
- Which services are mandatory and which are optional?
- Which environment variables do I need to move to cloud secrets?
- How do I deploy the frontend?
- How do I deploy the backend?
- How do I connect MongoDB Atlas and Firebase Auth?
- How do I verify the cloud deployment works from another device?
- What should I do next if something fails?

---

## 6. Placement in the Sidebar

The new module should be added as the **last module in the sidebar**, immediately after:

- `Future`

---

## 7. Functional Scope

### In Scope
- deployment architecture recommendation
- service inventory
- environment and secret mapping
- deployment checklists
- frontend deployment guide
- backend deployment guide
- database/auth connection guide
- smoke test guide
- readiness scoring
- documentation export
- UI integration in the sidebar

### Out of Scope for v1
- automatic production deployment from inside the app
- Terraform / full Infrastructure as Code
- Kubernetes
- multi-region production rollout
- full CI/CD automation
- n8n deployment
- auto-provisioning cloud resources
- replacing Firebase or MongoDB

---

## 8. Recommended Tab Structure

I recommend **8 tabs**.

### 8.1 Overview
Provide a high-level deployment dashboard.

Should show:
- what the module does
- recommended architecture summary
- deployment maturity status
- detected local architecture
- quick actions to the next steps

### 8.2 Target Architecture
Explain the recommended cloud architecture visually and clearly.

Content:
- Vercel → frontend
- Cloud Run → FastAPI backend
- MongoDB Atlas → application data
- Firebase Auth → authentication
- Cloudflare → DNS / domain / SSL
- optional monitoring and analytics later

### 8.3 Providers & Cost
Compare practical cloud options without overwhelming the user.

Suggested sections:
- Recommended stack
- Cheapest practical stack
- Learning-first stack
- Deferred tools for phase 2

### 8.4 Environment & Secrets
Translate the local `.env` setup into cloud configuration.

Must cover:
- backend root `.env`
- frontend `.env`
- `websearch-backend/.env`
- secret vs public variable distinction
- cloud secret storage notes
- variable validation checklist

### 8.5 Deploy Frontend
Guide deployment of the React frontend to Vercel.

Must include:
- GitHub repo connection
- project root selection
- build command
- production API base URL
- environment variable checklist
- smoke test checklist

### 8.6 Deploy Backend
Guide deployment of FastAPI to Cloud Run.

Must include:
- Dockerfile review
- Cloud Run config review
- required secrets
- CORS review
- health endpoint validation
- logging notes
- rollback basics

### 8.7 Data & Auth
Connect production-ready data and auth services.

Must include:
- MongoDB Atlas connection
- Firebase Auth configuration
- backend secret mapping
- frontend Firebase public config
- auth smoke tests
- persistence smoke tests

### 8.8 Smoke Tests & Monitoring
Validate that the cloud deployment is actually working.

Should include:
- frontend load check
- backend health check
- login check
- Mongo write/read check
- AI provider connectivity check
- optional web search connectivity check
- error visibility
- basic monitoring setup
- troubleshooting hints

---

## 9. Suggested User Workflow

### Workflow A — New Deployment Planning
1. Open the module
2. Read architecture recommendation
3. Confirm services to keep
4. Generate environment templates
5. Follow frontend deploy guide
6. Follow backend deploy guide
7. Connect MongoDB Atlas and Firebase
8. Run smoke tests
9. Mark deployment readiness complete

### Workflow B — Troubleshooting a Failed Deployment
1. Open the module
2. Go to Smoke Tests & Monitoring
3. Run the validation checklist
4. Identify the failing layer
5. Open the related troubleshooting guidance
6. Apply fix
7. Re-run validation

---

## 10. System Design for the Module

```text
Installing the App in the Cloud
│
├── UI Layer
│   ├── Overview
│   ├── Target Architecture
│   ├── Providers & Cost
│   ├── Environment & Secrets
│   ├── Deploy Frontend
│   ├── Deploy Backend
│   ├── Data & Auth
│   └── Smoke Tests & Monitoring
│
├── Service Layer
│   ├── cloud status service
│   ├── architecture recommendation service
│   ├── env template service
│   ├── deploy checklist service
│   ├── smoke test service
│   └── troubleshooting helper service
│
├── Data Layer
│   ├── deployment profiles
│   ├── environment templates
│   ├── readiness scores
│   ├── smoke test results
│   └── checklists
│
└── Optional Future Integrations
    ├── Sentry
    ├── PostHog
    ├── Resend
    ├── Cloudflare
    └── websearch backend deployment
```

---

## 11. Backend API Design

Recommended base path:

```text
/api/cloud-install/
```

### Endpoints
- `GET /api/cloud-install/status`
- `POST /api/cloud-install/recommend-architecture`
- `POST /api/cloud-install/generate-env-template`
- `POST /api/cloud-install/generate-deploy-checklist`
- `POST /api/cloud-install/run-smoke-tests`
- `GET /api/cloud-install/cost-baseline`
- `GET /api/cloud-install/troubleshooting`

Optional later:
- `POST /api/cloud-install/export-plan`
- `POST /api/cloud-install/save-profile`
- `GET /api/cloud-install/profiles`

---

## 12. Suggested Data Model

### Collections
```text
cloud_install_profiles
cloud_install_checklists
cloud_install_smoke_tests
cloud_install_exports
```

### Example profile document
```json
{
  "_id": "deploy_profile_001",
  "name": "vercel-cloudrun-atlas-firebase",
  "frontendProvider": "vercel",
  "backendProvider": "cloud_run",
  "databaseProvider": "mongodb_atlas",
  "authProvider": "firebase_auth",
  "dnsProvider": "cloudflare",
  "includeN8n": false,
  "includeWebSearchBackend": false,
  "status": "draft",
  "createdAt": "2026-04-14T12:00:00Z"
}
```

---

## 13. File Structure Proposal

```text
frontend/src/
  InstallingAppInCloud.jsx
  cloud-install/
    Overview.jsx
    TargetArchitecture.jsx
    ProvidersCost.jsx
    EnvSecrets.jsx
    DeployFrontend.jsx
    DeployBackend.jsx
    DataAuth.jsx
    SmokeTestsMonitoring.jsx
    components/
      ArchitectureCard.jsx
      CostComparisonTable.jsx
      EnvTemplateViewer.jsx
      DeployChecklistPanel.jsx
      SmokeTestCard.jsx
      ReadinessScoreCard.jsx

backend/
  routers/
    cloud_install.py
  services/
    cloud_install_service.py
  schemas/
    cloud_install.py
  prompts/
    cloud_install/
      recommendArchitecture.prompt.md
      envTemplate.prompt.md
      deployChecklist.prompt.md
      troubleshooting.prompt.md

docs-md/
  Installing_the_App_in_the_Cloud.md
```

### Existing files likely to be updated
- `frontend/src/Sidebar.jsx`
- `frontend/src/App.jsx`
- `backend/app.py`
- i18n files / translation resources

---

## 14. Required UI Behavior

The module should behave like the newer structured WLWAI modules:

- modern tabbed layout
- visual cards
- clear “Next step” prompts
- green/yellow/red status indicators
- read-only recommendations + editable checklists
- export to Markdown
- responsive design
- EN/NO internationalization

### UX principle
This module should feel like:

> “An operational learning console for cloud deployment.”

Not like a static README page.

---

## 15. Core Learning Content the Module Must Teach

The module should teach these concrete concepts:

### Deployment model
- frontend and backend are deployed separately
- databases are hosted independently
- auth configuration spans frontend + backend
- cloud deployment is a composition of services, not one magic button

### Environment model
- some values are public frontend config
- some values are backend-only secrets
- some services can remain optional in phase 1

### Reliability model
- production URLs differ from localhost
- CORS must be reviewed
- health checks matter
- smoke tests matter
- logs matter
- observability matters

### Product thinking
- do not ship everything at once
- make the core product reachable first
- add automation and advanced services later

---

## 16. Phase-Based Implementation Plan

### Phase 0 — Architecture Freeze
**Goal:** Confirm the cloud strategy and prevent unnecessary rework.

Decisions to lock:
- Keep MongoDB
- Keep Firebase Auth
- Use Vercel for frontend
- Use Cloud Run for backend
- Leave n8n out of the first deployment
- Treat web search backend as optional phase 2
- Do not migrate to Supabase or Clerk

**Deliverables:**
- Architecture Decision Record in Markdown
- Initial deployment profile
- Approved implementation scope

### Phase 1 — Cloud Readiness Hardening
**Goal:** Prepare the current codebase for cloud deployment.

Tasks:
- find and remove `localhost` assumptions where needed
- centralize API base URL handling
- review CORS policy
- review `.env` loading expectations
- add or confirm `/health` endpoint
- add or confirm `/ready` endpoint
- verify FastAPI runs correctly in a container
- verify frontend can point to a production backend URL

### Phase 2 — Frontend Deployment Path
**Goal:** Deploy the frontend cleanly.

Tasks:
- review frontend build behavior
- document Vercel configuration
- document environment variables
- define production API URL mapping
- add frontend deployment checklist inside the module
- add smoke test checklist for login and navigation

### Phase 3 — Backend Deployment Path
**Goal:** Deploy FastAPI to Cloud Run.

Tasks:
- review `deployment/Dockerfile`
- review `deployment/cloudrun.yaml`
- verify startup command for container
- document required backend secrets
- review port expectations
- review CORS with cloud frontend
- add backend deployment checklist inside the module
- add backend troubleshooting guide

### Phase 4 — Data & Auth Connection
**Goal:** Move the data and auth layer to hosted services.

Tasks:
- connect MongoDB Atlas
- validate remote `MONGO_URI`
- map Firebase backend credentials
- map frontend Firebase public config
- test login in cloud
- test persistence in cloud
- add Data & Auth checklist tab content

### Phase 5 — Smoke Tests & Monitoring
**Goal:** Make cloud validation explicit and repeatable.

Tasks:
- define smoke test matrix
- implement cloud status endpoint
- implement smoke test execution / simulation
- add failure hints by layer
- optionally add Sentry guidance
- optionally add PostHog guidance

### Phase 6 — Full Module UI Integration
**Goal:** Make the module production-ready inside WLWAI.

Tasks:
- add module to sidebar after `Future`
- wire route/page in `App.jsx`
- build all tabs
- add EN/NO translations
- support export to Markdown
- support saving deployment profile
- ensure visual consistency with the rest of the app

### Phase 7 — Optional Extensions
**Goal:** Prepare a second iteration after the MVP is stable.

Potential extensions:
- deploy `websearch-backend`
- add n8n deployment guidance
- add domain connection walkthrough
- add Cloudflare configuration walkthrough
- add Sentry integration
- add PostHog integration
- add CI/CD pipeline guidance
- add environment comparison: local vs cloud vs production

---

## 17. Responsibility Split: Cursor AI vs Claude Code

### Claude Code should lead
- Docker and Cloud Run work
- backend deployment hardening
- secret handling design
- health/ready endpoint implementation
- infrastructure-facing refactors
- backend troubleshooting logic
- deployment scripts
- containerization review

### Cursor AI should lead
- React module creation
- tabbed UI implementation
- sidebar integration
- `App.jsx` routing integration
- i18n integration
- checklist and status components
- API client wiring
- Markdown documentation scaffolding

### Shared work
- prompt files
- data schemas
- exported Markdown templates
- smoke test UX
- environment mapping tables
- docs refinement

---

## 18. Smoke Test Matrix

### Minimum smoke tests for MVP

#### Frontend
- homepage loads
- sidebar renders
- new module opens
- API base URL is correct

#### Backend
- `/health` returns success
- `/ready` returns success
- main API responds from cloud URL

#### Authentication
- Firebase login works
- session persists correctly
- protected route behavior is valid

#### Database
- MongoDB Atlas connection succeeds
- sample read works
- sample write works

#### AI Layer
- at least one AI provider path works
- errors are surfaced clearly when unavailable

#### Optional Phase 2
- websearch backend reachable
- optional observability endpoint works

---

## 19. Acceptance Criteria

### Functional Acceptance Criteria
- new module appears after `Future` in the sidebar
- module provides architecture recommendation
- module provides environment/secrets guidance
- module provides frontend deployment guide
- module provides backend deployment guide
- module provides data/auth connection guide
- module provides smoke test guidance
- module can export the deployment plan/checklist as Markdown

### Technical Acceptance Criteria
- backend endpoints exist and return structured JSON
- UI tabs are functional and connected
- EN/NO translations exist
- layout matches recent structured modules
- module does not break existing app behavior

### Educational Acceptance Criteria
A user unfamiliar with cloud deployment can understand:
- what needs to be deployed
- in what order
- what secrets are needed
- how to verify success
- how to troubleshoot common issues

---

## 20. Risks and Mitigations

### Risk 1 — Scope explosion
**Mitigation:** Keep v1 focused on planning, guidance, checklists, and smoke tests.

### Risk 2 — Confusing infrastructure advice
**Mitigation:** Recommend one primary architecture only:
- Vercel
- Cloud Run
- MongoDB Atlas
- Firebase Auth
- Cloudflare later

### Risk 3 — Local assumptions break cloud rollout
**Mitigation:** Prioritize Phase 1 hardening before building the whole module UI.

### Risk 4 — Too many optional services too early
**Mitigation:** Make n8n, web search backend, analytics, and email clearly marked as later phases.

### Risk 5 — Module becomes just documentation
**Mitigation:** Add interactive checklists, readiness states, and smoke test results.

---

## 21. Suggested First Prompt for Cursor AI

```md
Implement a new WLWAI module called "Installing the App in the Cloud".

Goal:
Create a tabbed, interactive module that helps plan and validate cloud deployment for the existing WLWAI application.

Constraints:
- Do not introduce Supabase, Clerk, or new primary infrastructure.
- Assume the recommended architecture is:
  - Vercel for frontend
  - Google Cloud Run for backend
  - MongoDB Atlas for database
  - Firebase Auth for authentication
  - Cloudflare as optional later DNS/SSL layer
- Leave n8n out of the first deployment scope.
- Treat the websearch-backend as optional phase 2.
- Add the module as the last item in the sidebar, immediately after "Future".
- Follow the architecture and file structure from the implementation plan.
- Use a tabbed UI with these tabs:
  1. Overview
  2. Target Architecture
  3. Providers & Cost
  4. Environment & Secrets
  5. Deploy Frontend
  6. Deploy Backend
  7. Data & Auth
  8. Smoke Tests & Monitoring
- Keep the UI consistent with recent structured modules in the app.
- Add EN/NO i18n support.

Output:
1. File tree
2. Created files with code
3. Sidebar and App.jsx updates
4. API client updates if needed
5. Any new translation keys
```

---

## 22. Suggested First Prompt for Claude Code

```md
Implement the backend and deployment-readiness foundation for a new WLWAI module called "Installing the App in the Cloud".

Goals:
- Add backend support for deployment planning and smoke test guidance
- Harden the app for cloud deployment without changing its core architecture

Required backend work:
- Add router: backend/routers/cloud_install.py
- Add service: backend/services/cloud_install_service.py
- Add schemas for:
  - deployment profile
  - env template request/response
  - smoke test request/response
  - architecture recommendation response
- Add endpoints:
  - GET /api/cloud-install/status
  - POST /api/cloud-install/recommend-architecture
  - POST /api/cloud-install/generate-env-template
  - POST /api/cloud-install/generate-deploy-checklist
  - POST /api/cloud-install/run-smoke-tests
  - GET /api/cloud-install/cost-baseline
- Review the current backend for cloud-readiness issues:
  - localhost assumptions
  - CORS assumptions
  - environment loading assumptions
  - startup assumptions
- Add or confirm:
  - /health endpoint
  - /ready endpoint
- Review deployment/Dockerfile and deployment/cloudrun.yaml compatibility with the current backend startup pattern

Constraints:
- Do not introduce Supabase or Clerk
- Do not include n8n deployment in v1
- Keep all changes compatible with the current FastAPI + MongoDB + Firebase structure
- Make outputs structured, typed, and easy for the frontend to consume

Output:
1. File tree
2. New backend files
3. Changes to backend/app.py
4. Health/readiness endpoints
5. Any cloud-readiness fixes
6. Short explanation of the most important deployment assumptions discovered
```

---

## 23. Suggested Phase 2 Prompt for Cursor AI

```md
Now implement the frontend UI for the "Installing the App in the Cloud" module.

Requirements:
- Build all 8 tabs
- Add status cards and readiness scoring
- Add interactive checklist panels
- Add a simple architecture diagram or card-based architecture layout
- Add environment variable mapping tables
- Add smoke test cards
- Add markdown export support
- Use visually clear states:
  - green = ready
  - yellow = partial
  - red = missing
- Keep the layout professional, readable, and consistent with the rest of WLWAI

Also:
- Add the module after "Future" in the sidebar
- Wire routing and rendering in App.jsx
- Add EN/NO translations for all tab labels, button labels, and section headings
```

---

## 24. Suggested Phase 2 Prompt for Claude Code

```md
Now implement cloud-readiness hardening and backend logic for the "Installing the App in the Cloud" module.

Tasks:
- Implement realistic status responses for deployment readiness
- Add environment template generation for:
  - backend root .env
  - frontend/.env
  - websearch-backend/.env (optional phase 2)
- Add smoke test simulation/validation logic
- Add troubleshooting guidance categories:
  - frontend
  - backend
  - auth
  - database
  - AI provider
  - optional web search
- Add cost-baseline endpoint with simple structured assumptions
- Ensure all responses are deterministic and easy for the frontend to display
- Review health and readiness endpoints and ensure they are safe for cloud usage
```

---

## 25. Minimal MVP Recommendation

Start with this MVP:

- 1 new sidebar module
- 4 backend endpoints
- 4 core tabs:
  - Overview
  - Target Architecture
  - Environment & Secrets
  - Smoke Tests & Monitoring
- 1 readiness score
- 1 deployment checklist
- 1 Markdown export
- 1 health endpoint
- 1 ready endpoint

### Why this MVP works
Because it proves:
- the architecture is understood
- the deployment path is clear
- the module is useful
- the product can teach deployment inside itself

---

## 26. Final Recommendation

Build this module as a **deployment planning and cloud-readiness workbench**, not as a full deployment engine.

That gives you the best balance of:

- learning value
- implementation realism
- low cost
- minimal stack disruption
- good demo value
- useful future expansion

The correct first cloud story for WLWAI is:

**React frontend on Vercel + FastAPI backend on Cloud Run + MongoDB Atlas + Firebase Auth**,  
with **n8n intentionally deferred** and **web search backend treated as optional phase 2**.

That is the cleanest path from local Windows development to a reachable cloud deployment without unnecessary architectural churn.
