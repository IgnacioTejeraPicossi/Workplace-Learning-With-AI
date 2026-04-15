# Pack 2 — Claude Code Refinement
**Module:** Installing the App in the Cloud  
**Project:** Workplace Learning With AI (WLWAI)  
**Date:** April 2026  
**Audience:** Claude Code  
**Goal:** Refine the first Cursor AI implementation and build the real backend foundation for the cloud deployment module.

---

## 1. Current Status

The first implementation pass is already in place in the frontend.

Confirmed from the current local result:
- The module exists in the sidebar
- It is placed after `Future`
- The page renders correctly
- The first 4 tabs are visible:
  - Overview
  - Target Architecture
  - Environment & Secrets
  - Smoke Tests & Monitoring
- The first readiness UI is already working
- The module does not break the rest of the sidebar flow

This means **Pack 1 is complete enough to move into backend refinement and cloud-readiness hardening**.

---

## 2. What Claude Code Should Do Now

Claude Code should **not rebuild the module**.

Claude Code should:
1. inspect the existing implementation created by Cursor AI
2. preserve the working frontend structure
3. add the missing backend foundation
4. harden the app for cloud deployment
5. prepare the next UI expansion cleanly
6. avoid unnecessary architecture churn

---

## 3. Main Objective of Pack 2

Build the **real backend layer and cloud-readiness base** for the new module.

The result of Pack 2 should be:

- backend router added
- backend service added
- typed request/response contracts added
- `/health` and `/ready` confirmed
- cloud-readiness issues identified and reduced
- module API endpoints connected or connectable
- path prepared for the next frontend expansion
- no regression in the existing app

---

## 4. Architectural Constraints

Claude Code must respect these constraints:

- Keep **React frontend**
- Keep **FastAPI backend**
- Keep **MongoDB**
- Keep **Firebase Auth**
- Keep current AI provider model
- Keep `websearch-backend` as optional phase 2
- Keep `agentops-n8n` out of deployment v1
- Do **not** introduce Supabase
- Do **not** introduce Clerk
- Do **not** redesign the app into a different cloud stack
- Do **not** remove working frontend code unless clearly broken
- Do **not** touch unrelated modules unless required for shared infrastructure

---

## 5. Repo Reality Claude Code Must Respect

The current repo already contains:
- a React frontend
- a FastAPI backend
- MongoDB as a central data layer
- Firebase Auth
- an optional `agentops-n8n` folder
- a separate `websearch-backend`
- a `deployment/` folder with `cloudrun.yaml` and `Dockerfile`

The backend is expected to run from the **repository root**, not from inside `backend/`.

The backend startup pattern is:

```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

## 6. Pack 2 Scope

### In Scope
- `backend/routers/cloud_install.py`
- `backend/services/cloud_install_service.py`
- `backend/schemas/cloud_install.py` or equivalent typed models
- `/api/cloud-install/*` endpoints
- `/health`
- `/ready`
- cloud-readiness checks
- environment template generation
- deploy checklist generation
- smoke test response structure
- cost baseline response structure
- troubleshooting guidance response structure
- integration with `backend/app.py`

### Out of Scope
- full Terraform
- full CI/CD
- n8n deployment
- automatic cloud provisioning
- production domain automation
- full websearch-backend deployment
- replacing current auth or DB stack

---

## 7. Required Backend Endpoints

Base path:

```text
/api/cloud-install/
```

Claude Code should implement these endpoints:

### Core
- `GET /api/cloud-install/status`
- `POST /api/cloud-install/recommend-architecture`
- `POST /api/cloud-install/generate-env-template`
- `POST /api/cloud-install/generate-deploy-checklist`
- `POST /api/cloud-install/run-smoke-tests`
- `GET /api/cloud-install/cost-baseline`
- `GET /api/cloud-install/troubleshooting`

### Global health
- `GET /health`
- `GET /ready`

---

## 8. Expected Response Design

Claude Code should prefer **deterministic, typed, frontend-friendly JSON**.

### Example: `GET /api/cloud-install/status`
```json
{
  "ok": true,
  "module": "cloud_install",
  "readinessScore": 17,
  "sections": [
    {"id": "architecture", "status": "defined"},
    {"id": "env", "status": "pending_review"},
    {"id": "frontend", "status": "not_started"},
    {"id": "backend", "status": "not_started"},
    {"id": "data_auth", "status": "not_started"},
    {"id": "smoke_tests", "status": "not_started"}
  ],
  "stack": {
    "frontend": "react",
    "backend": "fastapi",
    "database": "mongodb",
    "auth": "firebase"
  }
}
```

### Example: `GET /health`
```json
{
  "ok": true,
  "service": "wlwai-backend",
  "status": "healthy"
}
```

### Example: `GET /ready`
```json
{
  "ok": true,
  "service": "wlwai-backend",
  "status": "ready",
  "checks": {
    "app_imports": true,
    "router_registration": true
  }
}
```

---

## 9. Cloud-Readiness Checks Claude Code Must Review

Claude Code should inspect the repo for these categories:

### 9.1 Localhost assumptions
Look for:
- hardcoded `localhost`
- hardcoded ports
- backend URLs embedded in frontend logic
- local-only assumptions in service code

### 9.2 Environment loading assumptions
Review:
- root `.env` expectations
- frontend `.env` expectations
- optional `websearch-backend/.env`
- missing fallback behavior

### 9.3 CORS assumptions
Review:
- current frontend origin assumptions
- whether production frontend origins can be added safely
- whether CORS is too narrow or too open

### 9.4 Startup assumptions
Review:
- import path assumptions
- root-directory assumptions
- Docker startup compatibility
- Cloud Run compatibility

### 9.5 Optional service assumptions
Ensure that:
- n8n remains optional
- web search backend remains optional
- app can work without local LM Studio
- app can rely on cloud AI providers only

---

## 10. Service Responsibilities

Claude Code should create a clear service layer with methods such as:

- `get_cloud_install_status()`
- `recommend_architecture()`
- `generate_env_template(scope)`
- `generate_deploy_checklist(scope)`
- `run_smoke_tests(payload)`
- `get_cost_baseline()`
- `get_troubleshooting(category)`

The service layer should remain:
- deterministic
- easy to test
- easy to extend
- not coupled to frontend rendering

---

## 11. Suggested Schemas / Models

Claude Code should define typed models for:

- `CloudInstallStatusResponse`
- `CloudInstallSectionStatus`
- `ArchitectureRecommendationRequest`
- `ArchitectureRecommendationResponse`
- `EnvTemplateRequest`
- `EnvTemplateResponse`
- `DeployChecklistRequest`
- `DeployChecklistResponse`
- `SmokeTestRequest`
- `SmokeTestResponse`
- `CostBaselineResponse`
- `TroubleshootingResponse`

Prefer Pydantic models or the existing typed backend pattern used in the repo.

---

## 12. What to Preserve from the Existing Frontend

Claude Code should **not overwrite the working frontend shell** unless necessary.

Preserve:
- the current module placement in sidebar
- the current tab structure
- the current basic readiness card logic
- the architecture summary layout
- the working page shell and rendering

Only adjust frontend if needed for:
- real API integration
- stronger contract alignment
- corrected naming consistency

---

## 13. Validation Strategy

Claude Code should leave the module better than it found it in these 4 ways:

### 13.1 Backend exists
The module has real API support.

### 13.2 Health checks exist
The app is closer to cloud deployment.

### 13.3 Contracts are stable
Frontend can consume backend responses safely.

### 13.4 Cloud-readiness issues are surfaced
Not hidden.

---

## 14. Deliverables Expected from Claude Code

Claude Code should return:

1. file tree of changes
2. new backend files
3. updates to `backend/app.py`
4. health/readiness endpoints
5. any cloud-readiness fixes
6. short explanation of discovered deployment assumptions
7. notes on any risky areas not changed yet

---

## 15. Prompt 1 for Claude Code

```md
Refine the existing WLWAI module "Installing the App in the Cloud" that has already been created in the frontend.

Current state:
- The module already exists in the sidebar
- It is already placed after "Future"
- The page shell renders correctly
- The first 4 tabs exist:
  - Overview
  - Target Architecture
  - Environment & Secrets
  - Smoke Tests & Monitoring
- The readiness cards and architecture summary already render

Your job is NOT to rebuild the module.
Your job is to preserve the working frontend structure and implement the backend foundation plus cloud-readiness hardening.

Required work:
1. Add router: `backend/routers/cloud_install.py`
2. Add service: `backend/services/cloud_install_service.py`
3. Add typed models/schemas for request/response contracts
4. Add endpoints:
   - GET /api/cloud-install/status
   - POST /api/cloud-install/recommend-architecture
   - POST /api/cloud-install/generate-env-template
   - POST /api/cloud-install/generate-deploy-checklist
   - POST /api/cloud-install/run-smoke-tests
   - GET /api/cloud-install/cost-baseline
   - GET /api/cloud-install/troubleshooting
5. Add or confirm:
   - GET /health
   - GET /ready
6. Review cloud-readiness in the existing backend:
   - localhost assumptions
   - CORS assumptions
   - environment loading assumptions
   - startup assumptions
7. Keep architecture unchanged:
   - React frontend
   - FastAPI backend
   - MongoDB
   - Firebase Auth
   - websearch-backend optional
   - n8n out of phase 1
8. Do not introduce Supabase or Clerk
9. Do not break existing modules

Implementation requirements:
- return deterministic JSON
- keep contracts frontend-friendly
- use a service layer instead of putting business logic directly in the router
- align with existing code style and backend structure
- if Mongo is unavailable, return safe status responses instead of crashing the module
- do not assume all cloud services are configured yet

Output:
1. File tree
2. New files created
3. app.py updates
4. health/readiness implementation
5. cloud-readiness fixes found
6. any follow-up recommendations
```

---

## 16. Prompt 2 for Claude Code

Use this only after Prompt 1 is completed and tested.

```md
Now refine the "Installing the App in the Cloud" module further by connecting the existing frontend shell to the new backend contracts and preparing the module for the next UI expansion.

Goals:
- connect the current frontend shell to real backend endpoints where appropriate
- preserve the existing 4 working tabs
- improve readiness status handling
- make the data contracts stable enough for adding the next tabs later:
  - Deploy Frontend
  - Deploy Backend
  - Data & Auth

Required work:
1. Connect frontend status/readiness to GET /api/cloud-install/status
2. Connect architecture data to the backend recommendation response if appropriate
3. Connect env template generation to backend responses
4. Connect smoke test data to backend responses
5. Improve graceful fallback behavior if backend is offline
6. Preserve the current look and feel
7. Keep EN/NO compatibility in mind
8. Do not overengineer the module
9. Do not add all remaining tabs yet unless clearly low-risk

Also:
- document any API contract mismatches
- normalize naming if needed
- leave the code ready for Cursor AI or a later pass to implement the remaining tabs

Output:
1. Updated file tree
2. Connected frontend/backend areas
3. Any renamed fields or normalized contracts
4. Manual test checklist
5. Remaining gaps before Pack 3
```

---

## 17. Manual Validation Checklist After Claude Code

Run these checks locally after Claude finishes:

### Backend
- backend starts from repo root
- `/health` works
- `/ready` works
- `/api/cloud-install/status` works
- `/api/cloud-install/cost-baseline` works

### Frontend
- module still appears after `Future`
- page still opens correctly
- existing 4 tabs still render
- readiness score still renders
- no broken styles
- no broken routing

### Integration
- frontend handles backend success
- frontend handles backend offline case
- no other modules are broken
- CORS still works in local mode

---

## 18. Expected Pack 2 Outcome

If Pack 2 goes well, you should end up with:

- a working frontend shell from Cursor AI
- a real backend foundation from Claude Code
- cloud-readiness hardening started
- health/readiness endpoints available
- the module ready for the next expansion phase

That will be the correct moment to build **Pack 3**:
- complete remaining tabs
- add markdown export
- add profile persistence
- add stronger smoke test workflows
- optionally add cloud deployment runbooks

---

## 19. Final Instruction to Claude Code

Do not try to “finish everything.”

This pass is successful if:
- the module becomes real on the backend
- the app becomes more deployable
- the architecture remains clean
- the frontend shell survives intact
- the next phase becomes easier

That is the target for Pack 2.
