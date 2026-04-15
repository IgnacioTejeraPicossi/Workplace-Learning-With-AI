"""
Cloud Install Module — Service Layer
Deterministic, testable business logic for deployment planning and cloud readiness.

Methods:
  get_cloud_install_status()        — overall readiness score + section statuses
  recommend_architecture()          — recommended cloud architecture
  generate_env_template()           — environment variable templates
  generate_deploy_checklist()       — deployment checklist per scope
  run_smoke_tests()                 — run basic smoke tests against endpoints
  get_cost_baseline()               — cost estimates by tier
  get_troubleshooting()             — troubleshooting guidance
"""

import os
import logging
import time
from datetime import datetime
from typing import Optional

import httpx

logger = logging.getLogger("cloud_install")


# ─── Status ─────────────────────────────────────────────────────────────────

def get_cloud_install_status() -> dict:
    """
    Compute deployment readiness based on actual environment state.
    Returns deterministic JSON; never crashes.
    """
    sections = []

    # 1. Architecture Decision — always ready (defined in plan)
    sections.append({
        "id": "architecture",
        "label": "Architecture Decision",
        "status": "ready",
        "progress": 100,
        "details": "Vercel + Cloud Run + Atlas + Firebase",
    })

    # 2. Environment & Secrets — check if key env vars exist
    env_checks = [
        os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS"),
        os.getenv("OPENAI_API_KEY"),
        os.getenv("FIREBASE_SERVICE_ACCOUNT") or os.path.exists("serviceAccountKey.json"),
    ]
    env_ready = sum(1 for c in env_checks if c)
    env_total = len(env_checks)
    env_pct = int(env_ready / env_total * 100) if env_total else 0
    sections.append({
        "id": "env_secrets",
        "label": "Environment & Secrets",
        "status": "ready" if env_pct == 100 else "partial" if env_pct > 0 else "not_started",
        "progress": env_pct,
        "details": f"{env_ready}/{env_total} core secrets configured",
    })

    # 3. Frontend Deployment — check if build exists
    frontend_build_exists = os.path.exists("frontend/build/index.html")
    sections.append({
        "id": "frontend",
        "label": "Frontend Deployment",
        "status": "ready" if frontend_build_exists else "not_started",
        "progress": 100 if frontend_build_exists else 0,
        "details": "Build exists" if frontend_build_exists else "Run 'npm run build' in frontend/",
    })

    # 4. Backend Deployment — check Dockerfile exists and has content
    dockerfile_exists = os.path.exists("deployment/Dockerfile")
    dockerfile_has_content = False
    if dockerfile_exists:
        try:
            with open("deployment/Dockerfile", "r") as f:
                content = f.read().strip()
                dockerfile_has_content = len(content) > 100  # More than just a comment
        except Exception:
            pass
    sections.append({
        "id": "backend",
        "label": "Backend Deployment",
        "status": "ready" if dockerfile_has_content else "partial" if dockerfile_exists else "not_started",
        "progress": 100 if dockerfile_has_content else 20 if dockerfile_exists else 0,
        "details": "Dockerfile ready" if dockerfile_has_content else "Dockerfile needs completion",
    })

    # 5. Data & Auth Connection — check MongoDB reachable
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS", "")
    is_cloud_mongo = "mongodb+srv" in mongo_uri or "atlas" in mongo_uri.lower()
    sections.append({
        "id": "data_auth",
        "label": "Data & Auth Connection",
        "status": "ready" if is_cloud_mongo else "partial" if mongo_uri else "not_started",
        "progress": 100 if is_cloud_mongo else 30 if mongo_uri else 0,
        "details": "Cloud MongoDB configured" if is_cloud_mongo else "Using local MongoDB" if mongo_uri else "No MongoDB URI",
    })

    # 6. Smoke Tests — always pending until explicitly run
    sections.append({
        "id": "smoke_tests",
        "label": "Smoke Tests",
        "status": "not_started",
        "progress": 0,
        "details": "Run smoke tests after deployment",
    })

    # Calculate overall readiness
    total_progress = sum(s["progress"] for s in sections)
    readiness_score = int(total_progress / len(sections)) if sections else 0

    return {
        "ok": True,
        "module": "cloud_install",
        "readinessScore": readiness_score,
        "sections": sections,
        "stack": {
            "frontend": "react",
            "backend": "fastapi",
            "database": "mongodb",
            "auth": "firebase",
            "dns": "cloudflare",
            "monitoring": None,
        },
        "lastChecked": datetime.utcnow().isoformat(),
    }


# ─── Architecture Recommendation ────────────────────────────────────────────

def recommend_architecture(include_optional: bool = False, budget_tier: str = "starter") -> dict:
    """Return the recommended cloud architecture for WLWAI."""
    services = [
        {
            "id": "frontend",
            "name": "React Frontend",
            "provider": "Vercel",
            "role": "Static site hosting + CDN",
            "phase": 1,
            "tier": "hobby" if budget_tier == "free" else "pro",
            "estimated_monthly_cost": "$0" if budget_tier == "free" else "$20",
            "why": "Best-in-class for React apps. GitHub-based deploy, instant previews, edge CDN.",
            "key_features": ["Auto-deploy from GitHub", "Preview deployments", "Edge CDN", "Custom domains", "Environment variables"],
            "alternatives": ["Netlify", "Cloudflare Pages", "Firebase Hosting"],
        },
        {
            "id": "backend",
            "name": "FastAPI Backend",
            "provider": "Google Cloud Run",
            "role": "Containerized API server",
            "phase": 1,
            "tier": "free-tier" if budget_tier == "free" else "standard",
            "estimated_monthly_cost": "$0–5" if budget_tier == "free" else "$10–30",
            "why": "Container-first, scales to zero, great learning value. Direct Docker deployment.",
            "key_features": ["Scale to zero", "Container-based", "Auto-scaling", "Custom domains", "Secret Manager integration"],
            "alternatives": ["Railway", "Render", "Fly.io", "AWS App Runner"],
        },
        {
            "id": "database",
            "name": "MongoDB",
            "provider": "MongoDB Atlas",
            "role": "Application database",
            "phase": 1,
            "tier": "M0 Free" if budget_tier == "free" else "M2 Shared",
            "estimated_monthly_cost": "$0" if budget_tier == "free" else "$9",
            "why": "Natural continuation of local MongoDB. Minimal code changes. Free tier available.",
            "key_features": ["Free tier (512MB)", "Auto-backups", "Monitoring", "Network access control", "Connection string swap"],
            "alternatives": ["Render PostgreSQL", "PlanetScale", "Supabase (not recommended for this stack)"],
        },
        {
            "id": "auth",
            "name": "Firebase Authentication",
            "provider": "Firebase (Google)",
            "role": "User authentication",
            "phase": 1,
            "tier": "spark (free)",
            "estimated_monthly_cost": "$0",
            "why": "Already in use. No migration needed. Free for most usage patterns.",
            "key_features": ["Email/password auth", "Social login", "JWT tokens", "Free tier generous", "Existing integration"],
            "alternatives": ["Auth0", "Clerk (not recommended — unnecessary migration)"],
        },
        {
            "id": "dns",
            "name": "DNS & SSL",
            "provider": "Cloudflare",
            "role": "Domain management, SSL, DDoS protection",
            "phase": 2,
            "tier": "free",
            "estimated_monthly_cost": "$0",
            "why": "Free DNS, automatic SSL, DDoS protection. Add after first successful deployment.",
            "key_features": ["Free DNS", "Auto SSL", "DDoS protection", "Page rules", "Analytics"],
            "alternatives": ["Route 53", "Google Cloud DNS"],
        },
    ]

    if include_optional:
        services.extend([
            {
                "id": "monitoring",
                "name": "Error Tracking",
                "provider": "Sentry",
                "role": "Error monitoring and alerting",
                "phase": 2,
                "tier": "developer (free)",
                "estimated_monthly_cost": "$0",
                "why": "Catch production errors early. Free tier covers most needs.",
                "key_features": ["Error tracking", "Performance monitoring", "Release tracking"],
                "alternatives": ["LogRocket", "Datadog"],
            },
            {
                "id": "analytics",
                "name": "Product Analytics",
                "provider": "PostHog",
                "role": "Usage analytics and feature flags",
                "phase": 2,
                "tier": "free",
                "estimated_monthly_cost": "$0",
                "why": "Open-source product analytics. Self-hostable or cloud.",
                "key_features": ["Event tracking", "Feature flags", "Session replay"],
                "alternatives": ["Mixpanel", "Amplitude"],
            },
        ])

    # Cost estimate
    costs = {"free": "$0", "starter": "$29–59/mo", "professional": "$60–120/mo"}

    return {
        "ok": True,
        "strategy": "Cloudify the current architecture incrementally. Keep MongoDB, Firebase Auth, FastAPI, React. Deploy frontend and backend separately.",
        "services": services,
        "total_estimated_monthly": costs.get(budget_tier, "$29–59/mo"),
        "deployment_order": ["database", "auth", "backend", "frontend", "dns"],
        "notes": [
            "n8n is intentionally deferred to phase 2+",
            "websearch-backend is optional and can be deployed separately later",
            "Start with free tiers; upgrade only when needed",
            "Vercel and Cloud Run both support custom domains",
        ],
    }


# ─── Environment Template ──────────────────────────────────────────────────

def generate_env_template(scope: str = "all", include_optional: bool = True) -> dict:
    """Generate environment variable templates for cloud deployment."""
    groups = []

    # Backend .env
    if scope in ("backend", "all"):
        backend_vars = [
            {"name": "MONGO_URI", "value_hint": "mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai_learning", "type": "secret", "description": "MongoDB Atlas connection string", "cloud_note": "Store in Cloud Run Secret Manager", "required": True},
            {"name": "OPENAI_API_KEY", "value_hint": "sk-...", "type": "secret", "description": "OpenAI API key for LLM calls", "cloud_note": "Store in Secret Manager", "required": True},
            {"name": "HMAC_SECRET", "value_hint": "your-random-secret-key", "type": "secret", "description": "HMAC key for agent-to-agent signing", "cloud_note": "Store in Secret Manager", "required": True},
            {"name": "ALLOWED_ORIGINS", "value_hint": "https://your-app.vercel.app,https://your-domain.com", "type": "public", "description": "CORS allowed origins (comma-separated)", "cloud_note": "Must include your Vercel frontend URL", "required": True},
            {"name": "PORT", "value_hint": "8000", "type": "public", "description": "Backend port (Cloud Run sets $PORT automatically)", "cloud_note": "Cloud Run injects PORT env var", "required": True},
        ]
        if include_optional:
            backend_vars.extend([
                {"name": "ANTHROPIC_API_KEY", "value_hint": "sk-ant-...", "type": "secret", "description": "Anthropic API key (alternative LLM)", "cloud_note": "Store in Secret Manager", "required": False},
                {"name": "FIREBASE_SERVICE_ACCOUNT", "value_hint": "/path/to/serviceAccountKey.json", "type": "secret", "description": "Firebase service account JSON", "cloud_note": "Mount as volume or inline JSON in Secret Manager", "required": False},
                {"name": "LM_STUDIO_URL", "value_hint": "http://localhost:1234", "type": "optional", "description": "Local LM Studio endpoint (not used in cloud)", "cloud_note": "Remove or leave empty in cloud", "required": False},
                {"name": "JIRA_BASE_URL", "value_hint": "https://your-domain.atlassian.net", "type": "optional", "description": "Jira integration (EA Agent)", "cloud_note": "Store in Secret Manager if used", "required": False},
                {"name": "SLACK_BOT_TOKEN", "value_hint": "xoxb-...", "type": "optional", "description": "Slack bot token (EA Agent)", "cloud_note": "Store in Secret Manager if used", "required": False},
            ])
        groups.append({
            "scope": "backend",
            "filename": ".env",
            "variables": backend_vars,
            "cloud_storage_note": "Use Google Cloud Secret Manager for secrets. Set public vars as Cloud Run environment variables.",
        })

    # Frontend .env
    if scope in ("frontend", "all"):
        frontend_vars = [
            {"name": "REACT_APP_API_BASE_URL", "value_hint": "https://your-backend-xxxxx.run.app", "type": "public", "description": "Backend API URL", "cloud_note": "Set in Vercel Environment Variables", "required": True},
            {"name": "REACT_APP_FIREBASE_API_KEY", "value_hint": "AIza...", "type": "public", "description": "Firebase public API key", "cloud_note": "Safe to expose (public key)", "required": True},
            {"name": "REACT_APP_FIREBASE_AUTH_DOMAIN", "value_hint": "your-project.firebaseapp.com", "type": "public", "description": "Firebase auth domain", "cloud_note": "Set in Vercel", "required": True},
            {"name": "REACT_APP_FIREBASE_PROJECT_ID", "value_hint": "your-project-id", "type": "public", "description": "Firebase project ID", "cloud_note": "Set in Vercel", "required": True},
            {"name": "REACT_APP_FIREBASE_STORAGE_BUCKET", "value_hint": "your-project.appspot.com", "type": "public", "description": "Firebase storage bucket", "cloud_note": "Set in Vercel", "required": False},
            {"name": "REACT_APP_FIREBASE_MESSAGING_SENDER_ID", "value_hint": "123456789", "type": "public", "description": "Firebase messaging sender ID", "cloud_note": "Set in Vercel", "required": False},
            {"name": "REACT_APP_FIREBASE_APP_ID", "value_hint": "1:123:web:abc", "type": "public", "description": "Firebase app ID", "cloud_note": "Set in Vercel", "required": False},
        ]
        groups.append({
            "scope": "frontend",
            "filename": "frontend/.env",
            "variables": frontend_vars,
            "cloud_storage_note": "All frontend variables are public (exposed in browser). Set in Vercel dashboard under Environment Variables.",
        })

    # Websearch backend (optional)
    if scope in ("websearch", "all") and include_optional:
        ws_vars = [
            {"name": "PORT", "value_hint": "3001", "type": "public", "description": "Websearch backend port", "cloud_note": "Set in Cloud Run or hosting platform", "required": True},
            {"name": "SERPER_API_KEY", "value_hint": "your-serper-key", "type": "secret", "description": "Serper.dev API key for web search", "cloud_note": "Store in Secret Manager", "required": True},
            {"name": "ALLOWED_ORIGINS", "value_hint": "https://your-backend.run.app", "type": "public", "description": "CORS origins for websearch", "cloud_note": "Backend Cloud Run URL", "required": True},
        ]
        groups.append({
            "scope": "websearch",
            "filename": "websearch-backend/.env",
            "variables": ws_vars,
            "cloud_storage_note": "Phase 2: Deploy as separate Cloud Run service if needed.",
        })

    all_vars = [v for g in groups for v in g["variables"]]
    return {
        "ok": True,
        "groups": groups,
        "total_variables": len(all_vars),
        "required_count": sum(1 for v in all_vars if v["required"]),
        "secret_count": sum(1 for v in all_vars if v["type"] == "secret"),
    }


# ─── Deploy Checklist ───────────────────────────────────────────────────────

def generate_deploy_checklist(scope: str = "all") -> dict:
    """Generate deployment checklist items."""
    items = []

    if scope in ("frontend", "all"):
        items.extend([
            {"id": "fe-1", "label": "Connect GitHub repo to Vercel", "category": "frontend", "required": True, "help_text": "Go to vercel.com, import your repo, select frontend/ as root directory"},
            {"id": "fe-2", "label": "Set REACT_APP_API_BASE_URL to Cloud Run URL", "category": "frontend", "required": True, "help_text": "In Vercel dashboard → Settings → Environment Variables"},
            {"id": "fe-3", "label": "Set Firebase public config variables", "category": "frontend", "required": True, "help_text": "REACT_APP_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID"},
            {"id": "fe-4", "label": "Set build command: npm run build", "category": "frontend", "required": True, "command": "npm run build"},
            {"id": "fe-5", "label": "Set output directory: build", "category": "frontend", "required": True},
            {"id": "fe-6", "label": "Test deployment preview in Vercel", "category": "frontend", "required": True},
            {"id": "fe-7", "label": "Verify homepage loads from cloud URL", "category": "frontend", "required": True},
            {"id": "fe-8", "label": "Verify API calls reach backend", "category": "frontend", "required": True},
        ])

    if scope in ("backend", "all"):
        items.extend([
            {"id": "be-1", "label": "Build Docker image locally", "category": "backend", "required": True, "command": "docker build -t wlwai-backend -f deployment/Dockerfile ."},
            {"id": "be-2", "label": "Test Docker image runs locally", "category": "backend", "required": True, "command": "docker run -p 8000:8000 wlwai-backend"},
            {"id": "be-3", "label": "Push Docker image to Google Artifact Registry", "category": "backend", "required": True, "command": "gcloud builds submit --tag gcr.io/PROJECT/wlwai-backend"},
            {"id": "be-4", "label": "Deploy to Cloud Run", "category": "backend", "required": True, "command": "gcloud run deploy wlwai-backend --image gcr.io/PROJECT/wlwai-backend --region europe-north1"},
            {"id": "be-5", "label": "Set MONGO_URI in Cloud Run secrets", "category": "backend", "required": True},
            {"id": "be-6", "label": "Set OPENAI_API_KEY in Cloud Run secrets", "category": "backend", "required": True},
            {"id": "be-7", "label": "Set ALLOWED_ORIGINS to Vercel frontend URL", "category": "backend", "required": True},
            {"id": "be-8", "label": "Verify /health returns 200", "category": "backend", "required": True},
            {"id": "be-9", "label": "Verify /ready returns 200", "category": "backend", "required": True},
        ])

    if scope in ("database", "all"):
        items.extend([
            {"id": "db-1", "label": "Create MongoDB Atlas cluster (free M0)", "category": "database", "required": True, "help_text": "atlas.mongodb.com → Create cluster → M0 Free"},
            {"id": "db-2", "label": "Create database user with password", "category": "database", "required": True},
            {"id": "db-3", "label": "Add Cloud Run IP to Network Access (or 0.0.0.0/0 for testing)", "category": "database", "required": True},
            {"id": "db-4", "label": "Copy connection string to MONGO_URI", "category": "database", "required": True},
            {"id": "db-5", "label": "Verify backend can read/write to Atlas", "category": "database", "required": True},
        ])

    if scope in ("auth", "all"):
        items.extend([
            {"id": "auth-1", "label": "Add Vercel domain to Firebase authorized domains", "category": "auth", "required": True, "help_text": "Firebase Console → Authentication → Settings → Authorized domains"},
            {"id": "auth-2", "label": "Add Cloud Run domain to Firebase authorized domains", "category": "auth", "required": True},
            {"id": "auth-3", "label": "Upload serviceAccountKey.json to Cloud Run secrets", "category": "auth", "required": True},
            {"id": "auth-4", "label": "Verify login works from cloud URL", "category": "auth", "required": True},
        ])

    return {
        "ok": True,
        "scope": scope,
        "items": items,
        "total": len(items),
        "completed": 0,
        "progress_pct": 0,
    }


# ─── Smoke Tests ────────────────────────────────────────────────────────────

async def run_smoke_tests(
    layers: list = None,
    backend_url: str = None,
    frontend_url: str = None,
) -> dict:
    """
    Run actual smoke tests against endpoints.
    Tests what is reachable; skips what isn't configured.
    """
    if layers is None:
        layers = ["backend"]

    backend_url = backend_url or os.getenv("BACKEND_URL", "http://localhost:8000")
    frontend_url = frontend_url or os.getenv("FRONTEND_URL", "http://localhost:3000")
    checks = []

    if "backend" in layers:
        # Test /health
        checks.append(await _check_url(f"{backend_url}/health", "backend", "Health endpoint"))
        # Test /ready
        checks.append(await _check_url(f"{backend_url}/ready", "backend", "Ready endpoint"))
        # Test /api/health
        checks.append(await _check_url(f"{backend_url}/api/health", "backend", "API health"))
        # Test cloud-install status
        checks.append(await _check_url(f"{backend_url}/api/cloud-install/status", "backend", "Cloud install status"))

    if "frontend" in layers:
        checks.append(await _check_url(frontend_url, "frontend", "Homepage loads"))

    if "auth" in layers:
        # Just check Firebase is configured
        has_firebase = os.path.exists("serviceAccountKey.json") or os.getenv("FIREBASE_SERVICE_ACCOUNT")
        checks.append({
            "id": "auth-firebase-config",
            "layer": "auth",
            "name": "Firebase credentials available",
            "status": "pass" if has_firebase else "fail",
            "message": "Firebase configured" if has_firebase else "serviceAccountKey.json not found",
        })

    if "database" in layers:
        mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS", "")
        checks.append({
            "id": "db-uri-set",
            "layer": "database",
            "name": "MongoDB URI configured",
            "status": "pass" if mongo_uri else "fail",
            "message": f"URI set ({'cloud' if 'atlas' in mongo_uri.lower() or 'mongodb+srv' in mongo_uri else 'local'})" if mongo_uri else "MONGO_URI not set",
        })

    if "ai" in layers:
        has_ai = bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))
        checks.append({
            "id": "ai-key-set",
            "layer": "ai",
            "name": "AI provider API key configured",
            "status": "pass" if has_ai else "fail",
            "message": "AI key available" if has_ai else "No OPENAI_API_KEY or ANTHROPIC_API_KEY",
        })

    passed = sum(1 for c in checks if c["status"] == "pass")
    failed = sum(1 for c in checks if c["status"] == "fail")
    skipped = sum(1 for c in checks if c["status"] == "skip")

    return {
        "ok": failed == 0,
        "total_checks": len(checks),
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "checks": checks,
        "summary": f"{passed}/{len(checks)} checks passed" + (f", {failed} failed" if failed else ""),
    }


async def _check_url(url: str, layer: str, name: str) -> dict:
    """Check if a URL is reachable and returns 200."""
    check_id = f"{layer}-{name.lower().replace(' ', '-')}"
    try:
        start = time.time()
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
        duration_ms = int((time.time() - start) * 1000)
        return {
            "id": check_id,
            "layer": layer,
            "name": name,
            "status": "pass" if resp.status_code == 200 else "fail",
            "message": f"HTTP {resp.status_code} ({duration_ms}ms)",
            "duration_ms": duration_ms,
        }
    except httpx.ConnectError:
        return {"id": check_id, "layer": layer, "name": name, "status": "fail", "message": f"Connection refused: {url}"}
    except httpx.TimeoutException:
        return {"id": check_id, "layer": layer, "name": name, "status": "fail", "message": f"Timeout: {url}"}
    except Exception as e:
        return {"id": check_id, "layer": layer, "name": name, "status": "fail", "message": str(e)}


# ─── Cost Baseline ──────────────────────────────────────────────────────────

def get_cost_baseline() -> dict:
    """Structured cost estimates for the recommended architecture."""
    items = [
        {"service": "Vercel (Frontend)", "provider": "Vercel", "tier": "Hobby (Free)", "monthly_estimate": "$0", "notes": "Free for personal projects. Pro at $20/mo for teams.", "phase": 1},
        {"service": "Cloud Run (Backend)", "provider": "Google Cloud", "tier": "Free tier", "monthly_estimate": "$0–5", "notes": "First 2M requests/mo free. Scales to zero. Pricing per request + CPU/memory.", "phase": 1},
        {"service": "MongoDB Atlas", "provider": "MongoDB", "tier": "M0 Free / M2 Shared", "monthly_estimate": "$0–9", "notes": "M0 = 512MB free. M2 = 2GB at $9/mo. Sufficient for dev/demo.", "phase": 1},
        {"service": "Firebase Auth", "provider": "Google", "tier": "Spark (Free)", "monthly_estimate": "$0", "notes": "Free for up to 50k MAU (email/password). Phone auth charged separately.", "phase": 1},
        {"service": "Cloudflare DNS", "provider": "Cloudflare", "tier": "Free", "monthly_estimate": "$0", "notes": "Free DNS, SSL, basic DDoS. Add after first deploy.", "phase": 2},
        {"service": "Domain name", "provider": "Any registrar", "tier": "Annual", "monthly_estimate": "$1", "notes": "~$10-15/year for .com or .dev domain.", "phase": 2},
    ]
    return {
        "ok": True,
        "currency": "USD",
        "items": items,
        "total_monthly": "$0–15",
        "total_yearly": "$0–180",
        "assumptions": [
            "Low traffic (< 10k requests/day)",
            "Using free tiers where available",
            "No custom domain in Phase 1",
            "Single region deployment",
            "No n8n or websearch-backend in Phase 1",
        ],
        "budget_tiers": {
            "free": "$0/mo — Free tiers only, some limitations",
            "starter": "$29–59/mo — M2 Atlas + Vercel Pro + small Cloud Run",
            "professional": "$60–120/mo — M10 Atlas + monitoring + multiple regions",
        },
    }


# ─── Troubleshooting ───────────────────────────────────────────────────────

def get_troubleshooting(category: str = None) -> dict:
    """Structured troubleshooting guidance by category."""
    items = [
        # Frontend
        {"id": "ts-fe-1", "category": "frontend", "symptom": "White screen after deployment", "probable_cause": "REACT_APP_API_BASE_URL not set or pointing to localhost", "fix": "Set REACT_APP_API_BASE_URL to your Cloud Run backend URL in Vercel Environment Variables and redeploy", "severity": "critical"},
        {"id": "ts-fe-2", "category": "frontend", "symptom": "API calls fail with CORS error", "probable_cause": "Backend ALLOWED_ORIGINS does not include the Vercel URL", "fix": "Add your Vercel URL to ALLOWED_ORIGINS in Cloud Run and redeploy backend", "severity": "critical"},
        {"id": "ts-fe-3", "category": "frontend", "symptom": "Build fails on Vercel", "probable_cause": "Missing environment variables or dependency issues", "fix": "Check Vercel build logs. Ensure all REACT_APP_ variables are set. Run npm install locally first.", "severity": "high"},
        # Backend
        {"id": "ts-be-1", "category": "backend", "symptom": "/health returns 502 or connection refused", "probable_cause": "Container failed to start or port mismatch", "fix": "Check Cloud Run logs. Ensure Dockerfile uses PORT env var (Cloud Run injects it). Verify 'python -m uvicorn backend.app:app --host 0.0.0.0 --port $PORT'", "severity": "critical"},
        {"id": "ts-be-2", "category": "backend", "symptom": "Backend starts but imports fail", "probable_cause": "Running from wrong directory inside container", "fix": "Ensure Dockerfile WORKDIR is set to repo root, not to backend/. The app uses 'backend.app:app' import path.", "severity": "critical"},
        {"id": "ts-be-3", "category": "backend", "symptom": "Container builds but times out on startup", "probable_cause": "Missing dependencies or slow initialization", "fix": "Increase Cloud Run startup timeout. Check if all pip packages are installed. Firebase init may fail without credentials.", "severity": "high"},
        {"id": "ts-be-4", "category": "backend", "symptom": "Request returns 500 Internal Server Error", "probable_cause": "Missing environment variables (MONGO_URI, API keys)", "fix": "Check Cloud Run logs for the specific error. Most common: MongoDB connection failure or missing API keys.", "severity": "high"},
        # Auth
        {"id": "ts-auth-1", "category": "auth", "symptom": "Login fails from cloud URL", "probable_cause": "Cloud URL not in Firebase authorized domains", "fix": "Add your Vercel URL and Cloud Run URL to Firebase Console → Authentication → Settings → Authorized domains", "severity": "critical"},
        {"id": "ts-auth-2", "category": "auth", "symptom": "Backend returns 'mock user' instead of real auth", "probable_cause": "serviceAccountKey.json not available in the container", "fix": "Mount service account via Secret Manager or include as env var FIREBASE_SERVICE_ACCOUNT_JSON", "severity": "high"},
        # Database
        {"id": "ts-db-1", "category": "database", "symptom": "Backend cannot connect to MongoDB Atlas", "probable_cause": "IP not whitelisted in Atlas Network Access", "fix": "Add 0.0.0.0/0 to Network Access for testing (restrict later). Check MONGO_URI format includes database name.", "severity": "critical"},
        {"id": "ts-db-2", "category": "database", "symptom": "Writes work locally but fail in cloud", "probable_cause": "Atlas user doesn't have write permissions", "fix": "Check Atlas → Database Access → verify user has readWriteAnyDatabase role.", "severity": "high"},
        # AI
        {"id": "ts-ai-1", "category": "ai", "symptom": "AI features return errors or [MOCKED RESPONSE]", "probable_cause": "OPENAI_API_KEY not set or invalid", "fix": "Set OPENAI_API_KEY in Cloud Run secrets. The app falls back to mock responses if no AI key is available.", "severity": "medium"},
        {"id": "ts-ai-2", "category": "ai", "symptom": "LM Studio features don't work in cloud", "probable_cause": "LM Studio is a local-only service", "fix": "LM Studio (localhost:1234) is not available in cloud. The app uses OpenAI/Anthropic fallback automatically.", "severity": "low"},
    ]

    if category:
        items = [i for i in items if i["category"] == category]

    return {
        "ok": True,
        "category": category,
        "items": items,
        "total": len(items),
    }
