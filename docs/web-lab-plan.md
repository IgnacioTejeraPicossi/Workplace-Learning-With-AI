# Web Lab — Full Implementation Plan

**Module**: Web Lab (`frontend/src/web-lab/` + future `backend/routers/web_lab.py`)
**First version**: 1.16.0 · 2026-05-29 (V0 — structure only)
**Project owner intent**: separate workspace for the actual website clones, distinct from the Red Cross Web QA Agent (which stays focused on QA testing patterns)
**Sidebar position**: between "Future Item Agents" and "Robomind Clinic"
**Starting projects**: Item.no web + Redcross.no web (both via `git clone` from GitHub)

---

## 1. Conceptual positioning

> The Web Lab is **infrastructure** for hosting local clones of real websites. It is **not another QA agent**. The QA testing patterns for rodekors.no continue to live in the Red Cross Web QA Agent module (Agent #9). When the Web Lab serves a local copy of rodekors.no at `http://localhost:3102`, the RC QA Agent is pointed at that URL by setting **`env_local_url`** (Environment = **Local**). The published Test BASE_URL (`env_test_url` = `https://next.lunix.cloud/testside`) stays untouched.

This separation matters because:
- Cloning, installing, starting, modifying a website is **fundamentally different** work from running 23 audit suites against it
- The QA agent has 41 routes, 811 i18n leaves, 23 suites, a Phase H+ security workbench, ADO integration, and a full settings UI — it's a heavy module
- Mixing "local clone management" into it would dilute its purpose and force two unrelated UX flows into one module

The Web Lab borrows nothing from the QA Agent's UI patterns. It uses its own simpler shell.

---

## 2. Versioning roadmap

| Version | Scope | Estimated effort | What ships |
|---|---|---|---|
| **V0** (1.16.0) | Sidebar + placeholder pages | 0.5 day · DONE | Sidebar entry between Future Item Agents and Robomind Clinic. Two routes (`web-lab-item-no`, `web-lab-redcross-no`). Placeholder pages with hero / intent / roadmap. Cross-link from Redcross.no page to RC QA Agent. Full i18n EN/NO/ES (25 keys × 3 locales). |
| **V1** (1.17.0) | Registry + clone + open local URL (read-only) | 1-2 days | Mongo collection `web_lab_projects_collection`. Backend `GET /api/web-lab/projects`, `GET /projects/{id}`, `POST /projects/{id}/clone` (real `git clone` with security checks). Frontend "Open in browser" button. **Key feature**: "Use as local env for RC QA Agent" — sets `settings.env_local_url` to the clone URL (`http://localhost:3102`), optionally `env_default: "local"`, **preserves** `env_test_url` (TestSide) and `enonic_admin_url`. |
| **V2** (1.18.0) | Install + start/stop + health check + logs | 3-4 days | `process_service.py` with `psutil`. Endpoints `/install`, `/start`, `/stop`, `/status`, `/logs?tail=N&since=...`. Streaming logs via polling first (SSE in V2.1). Port collision check + disk space check pre-start. Auto-stop after N hours configurable. PID persistence + recovery at backend startup. |
| **V3** (1.19.0) | Playwright smoke + local-vs-prod compare + snapshot baselines | 4-5 days | Reuse `generate_playwright_tests` from RC QA Agent with `localUrl` as `base_url` / Environment **Local** (`env_local_url`). New `web_lab_snapshots_collection` with the same pattern as the QA Agent's `_baseline_load / _baseline_save`. HTML diff + screenshot diff + accessibility delta between local and production. |
| **V4** (later) | AI copilot + multi-branch + monorepo support | TBD | Hologram Guide chat scoped to the local site. Git worktrees for testing PRs without losing main. Detect subdirectory monorepo apps via `package.json` workspaces or `lerna.json`. |

V0 is in the same commit as this document. V1+ requires explicit green-light per version.

---

## 3. Architecture (V1+)

```
                        ┌─────────────────────────┐
                        │   GitHub repositories   │
                        │ Item-org/item-no.git    │
                        │ Item-org/rodekors-no.git│
                        └──────────┬──────────────┘
                                   │ git clone --depth 1
                                   │ git pull
                                   ▼
              ┌────────────────────────────────────────┐
              │  LOCAL_WEBSITES_ROOT (from .env)       │
              │  default: C:\WLWAI\local-websites      │
              │    ├── item-no/                        │
              │    └── rodekors-no/                    │
              └────────────────────┬───────────────────┘
                                   │ controlled commands
                                   │ (npm install, npm run dev)
                                   ▼
              ┌────────────────────────────────────────┐
              │  process_service.py · subprocess +     │
              │  psutil. shell=False, args list, 15s   │
              │  timeout, PID tracked in Mongo,        │
              │  auto-stop after N hours configurable. │
              └────────────────────┬───────────────────┘
                                   │ HTTP health probe
                                   │ (poll localhost:3101 / 3102)
                                   ▼
                  ┌────────────────────────────┐
                  │  http://localhost:3101  ←──┼── Item.no local clone
                  │  http://localhost:3102  ←──┼── Redcross.no local clone
                  └─────────────┬──────────────┘
                                │ "Use as local env for RC QA Agent"
                                │ POST settings.env_local_url = local URL
                                │ (keep env_test_url = next.lunix.cloud/testside)
                                │ invalidateRcqaSettingsCache() → open RCQA Local
                                ▼
                  ┌────────────────────────────┐
                  │  Red Cross Web QA Agent    │
                  │  Settings runtime          │
                  │  Local → env_local_url     │
                  │  Test  → env_test_url      │
                  │  (23 suites vs chosen URL) │
                  └────────────────────────────┘
```

### RCQA URL roles (do not conflate)

| RCQA setting | Default | Role |
|---|---|---|
| `env_local_url` | `http://localhost:3000` (WLWAI FE) | Environment **Local**. Web Lab overwrites this with the clone URL (`http://localhost:3102` for Redcross). |
| `env_test_url` | `https://next.lunix.cloud/testside` | Environment **Test** — published TestSide. **Never** overwritten by Web Lab. |
| `enonic_admin_url` | `https://rodekors-xp8dev.enonic.cloud/admin` | CMS admin (Content Studio). Not a public BASE_URL. |

Port map: **3000** = WLWAI frontend · **3101** = Item.no clone · **3102** = Redcross.no clone · **8000** = FastAPI backend.

---

## 4. Mongo schema

Following the existing WLWAI naming convention (`red_cross_qa_*` already used).

### `web_lab_projects_collection`

```json
{
  "_id": "redcross-no",
  "name": "Redcross.no web",
  "slug": "redcross-no",
  "description": "Local clone of the rodekors.no website",
  "repository_url": "https://github.com/<org>/<repo>.git",
  "branch": "main",
  "local_path": "rodekors-no",
  "local_port": 3102,
  "local_url": "http://localhost:3102",
  "production_url": "https://www.rodekors.no",
  "framework": "Next.js",
  "install_command": "npm ci",
  "start_command": "npm run dev",
  "stop_strategy": "SIGTERM",
  "health_path": "/",
  "status": "not_cloned",
  "is_busy": false,
  "current_pid": null,
  "last_cloned_at": null,
  "last_pulled_at": null,
  "last_started_at": null,
  "last_health_check_at": null,
  "auto_stop_after_seconds": 14400,
  "created_at": "2026-05-29T...",
  "updated_at": "2026-05-29T..."
}
```

`status` enum: `not_cloned | cloning | cloned | installing | installed | starting | running | stopping | stopped | error`

### `web_lab_runs_collection` (V2+)

Each install/start/stop/test cycle persisted with `run_id`, `project_id`, `command`, `started_at`, `ended_at`, `exit_code`, `stdout_path`, `stderr_path`.

### `web_lab_logs_collection` (V2+)

Rolling log entries `{run_id, timestamp, source: "stdout|stderr", level, message}`. TTL index 30 days.

### `web_lab_snapshots_collection` (V3+)

Reuses the pattern of `red_cross_qa_baselines_collection` (1.15.8): single collection with `snapshot_type` discriminator (`homepage_html`, `screenshot_hash`, `wcag_violations_count`, …) and `project_id::path` compound `_id`.

---

## 5. Backend endpoints (V1)

| Method | Path | Description |
|---|---|---|
| GET | `/api/web-lab/projects` | List all registered projects |
| GET | `/api/web-lab/projects/{slug}` | Single project detail |
| POST | `/api/web-lab/projects/{slug}/clone` | `git clone` into `LOCAL_WEBSITES_ROOT/{local_path}`. Idempotent (if already cloned, returns 409 with hint to `/pull`) |
| POST | `/api/web-lab/projects/{slug}/pull` | `git pull` on the existing clone |
| GET | `/api/web-lab/projects/{slug}/status` | Read-only status snapshot |

V2 adds: `/install`, `/start`, `/stop`, `/logs`.
V3 adds: `/run-smoke`, `/compare-with-production`.

All endpoints follow the existing mock-first convention from the QA Agent.

---

## 6. Security (V1)

Mirroring the `dispatch_finding_to_ado` pattern from Pack 4.2.

### Hard rules

1. `LOCAL_WEBSITES_ROOT` must be set in `.env`. Default `C:\WLWAI\local-websites` (Windows) or `/var/lib/wlwai/local-websites` (Linux). **Never hardcoded in code**.
2. Every path operation validates with `os.path.commonpath()` that the resolved path stays under `LOCAL_WEBSITES_ROOT`. Path traversal (`../`) blocked before subprocess fires.
3. **Only whitelisted commands** in `WEB_QA_ALLOWED_COMMANDS=git,npm,pnpm,yarn`. `shutil.which()` checks the binary exists.
4. `subprocess.run(shell=False, args=[...], timeout=300)` — never shell expansion, always argument list.
5. **No user-supplied command strings reach subprocess.** The UI sends `{action: "install"}` not `{command: "npm install"}`. The backend maps action → predefined command from the project config.
6. Logs strip patterns `/[A-Za-z0-9_-]{20,}/` (likely tokens) before persistence.
7. Pre-clone scan: regex sweep for `AWS_KEY=`, `GITHUB_TOKEN=`, etc. in the freshly cloned `.env*` files. Warn the user, never auto-delete.

### Soft rules

- Lock per project (`is_busy: true` in Mongo) during install/start/stop to prevent race conditions
- Disk space check (`shutil.disk_usage(LOCAL_WEBSITES_ROOT).free`) before `clone` — warn if < 2 GB
- Port collision check (`socket.connect_ex(('127.0.0.1', port))`) before `start` — abort if occupied
- Auto-stop timer: when a project starts, schedule a stop after `auto_stop_after_seconds`. Prevents fugues if the user forgets

---

## 7. Frontend (V1+)

### Component tree

```
frontend/src/web-lab/
├── _WebLabPage.jsx          [V0] · shared placeholder layout
├── ItemNoWeb.jsx            [V0] · Item.no placeholder
├── RedcrossNoWeb.jsx        [V0] · Redcross.no placeholder
├── ItemNoLab.jsx            [V1+] · replaces ItemNoWeb with real UI
├── RedcrossNoLab.jsx        [V1+] · same
├── components/
│   ├── ProjectHeader.jsx    [V1] · status pill + name + production link
│   ├── GitRepoPanel.jsx     [V1] · clone / pull buttons + last_pulled_at
│   ├── RuntimePanel.jsx     [V2] · install / start / stop + health pill
│   ├── LogsPanel.jsx        [V2] · tail logs with auto-scroll
│   ├── ConnectToQaAgent.jsx [V1] · "Use as local env for RC QA Agent" button
│   └── CompareWithProd.jsx  [V3] · HTML/screenshot/a11y diff panel
└── api/webLabApi.js         [V1] · fetch client
```

### "Use as local env for RC QA Agent" flow (V1 key feature) — **contract**

Aligned with the RCQA Settings runtime (`frontend/src/red-cross-qa/settingsApi.js`): Local/Test BASE_URL comes from Settings, generators receive `base_url`, and Settings cache must be invalidated after writes.

**Button behaviour (Redcross.no Web Lab page):**

1. `POST /api/red-cross-qa/settings` with a **partial** update that **only** touches Local (and optionally default env):
   ```json
   {
     "env_local_url": "http://localhost:3102",
     "env_default": "local"
   }
   ```
2. **Do not** send `env_test_url` or `enonic_admin_url` in this payload (or send the existing values unchanged). Published TestSide and Enonic admin must remain as configured.
3. Call `invalidateRcqaSettingsCache()` from `settingsApi.js` so the RCQA shell does not keep a stale cache.
4. Navigate to the RC QA Agent with Environment = **Local** (header 🎯 chip should show `http://localhost:3102`).
5. Suites / generators then use that `base_url` against the local clone.

**Hard rules**

| Rule | Why |
|---|---|
| Write `env_local_url`, not `env_test_url` | Local clone ≠ published TestSide |
| Preserve `env_test_url` = `https://next.lunix.cloud/testside` | Smoke against Test must keep working |
| Preserve `enonic_admin_url` | CMS admin is separate from BASE_URL |
| Invalidate RCQA settings cache after POST | Shell + tabs share `settingsApi` cache |
| Prefer importing helpers from `settingsApi.js` | Avoid a second ad-hoc settings client |

**Not** "zero new code in the QA Agent" anymore: Web Lab **reuses** the existing Settings API + `settingsApi.js` cache helpers. No schema change required: `POST /settings` uses `exclude_unset=True` and Mongo `$set`, so a partial body only updates the keys sent.

**Implementer notes**

- After POST, call `invalidateRcqaSettingsCache()` then prefer `fetchRcqaSettings({ force: true })` (or GET) before trusting URLs — the current `save_settings` response is `DEFAULT ∪ payload`, not the full Mongo-merged document.
- Optional small RCQA hardening (same PR as V1 or follow-up): make `save_settings` return the same merge as `get_settings` so partial writers see the preserved `env_test_url` / `enonic_admin_url` in the response.
- Button label: **"Use as local env for RC QA Agent"** (not "test env") to match Local vs Test semantics.

---

## 8. i18n contract

EN / NO / ES parity preserved at all times. V0 adds 25 leaves × 3 locales (already shipped). V1+ adds:

| Block | EN reference | Approximate leaves |
|---|---|---|
| `webLab.status` | running / stopped / error / cloning / installing | 8 |
| `webLab.actions` | btnClone / btnPull / btnInstall / btnStart / btnStop / btnOpen / btnUseAsLocalEnv | 7 |
| `webLab.git` | repositoryUrl / branch / lastPulledAt / cloneSuccess / cloneError | 8 |
| `webLab.runtime` | installCommand / startCommand / port / pid / uptime / healthy / unhealthy / autoStopIn | 10 |
| `webLab.logs` | tailHeader / noLogs / showMore / clear | 4 |
| `webLab.compare` | (V3) htmlDiff / screenshotDiff / a11yDelta | ~10 |

---

## 9. Smoke tests

`backend/tests/smoke_web_lab.py`:

| Version | Smoke checks |
|---|---|
| V1 | (1) `LOCAL_WEBSITES_ROOT` resolves & exists; (2) `GET /projects` returns 2 entries; (3) `POST /projects/redcross-no/clone` with path traversal payload returns 400; (4) `clone` with valid path returns 200 + status=cloned; (5) Idempotency: second `clone` returns 409 |
| V2 | (6) `install` triggers npm with controlled args; (7) `start` returns 200 and port becomes listening within 30s; (8) `stop` kills the process via psutil; (9) Port collision detected pre-start; (10) Auto-stop fires after configured seconds |
| V1+ | (V1-RCQA) After `useAsLocalEnv`: GET `/api/red-cross-qa/settings` has `env_local_url == http://localhost:3102` **and** `env_test_url` still equals `https://next.lunix.cloud/testside` (and `enonic_admin_url` unchanged) |
| V3 | (11) Snapshot capture stores HTML hash + screenshot hash; (12) Diff between two snapshots returns the right diff_mode; (13) same RCQA contract as V1-RCQA after connect |

---

## 10. Risks (carried from the analysis before V0)

| Risk | Mitigation |
|---|---|
| Procesos huérfanos en Windows si el backend muere mid-start | `psutil` + PID tracking en Mongo + verificación al startup del backend |
| Concurrencia: dos clones del mismo proyecto a la vez | Lock `is_busy: true` en el doc del proyecto durante la operación |
| Espacio en disco: rodekors.no + node_modules ≈ 1.5 GB | `shutil.disk_usage` check pre-clone con threshold configurable |
| Permisos NTFS con espacios en paths | `pathlib.Path` siempre + nunca `shell=True` |
| Cookies del dominio real chocan con local | Documentación clara + recomendar perfil de browser separado |
| Repos privados sin auth | Documentar setup de SSH keys / GitHub PAT en `.env` |
| Secret leakage en logs streaming | Regex sweep + redacción antes de persistir |
| Procesos npm zombi tras parada | `psutil.children(recursive=True)` para matar el árbol completo |

---

## 11. File map (V0 · what shipped now)

```
frontend/src/
├── web-lab/
│   ├── _WebLabPage.jsx              ← shared placeholder + optional urlContext panel
│   ├── ItemNoWeb.jsx                ← Item.no instance (~23 lines)
│   └── RedcrossNoWeb.jsx            ← Redcross.no + RCQA URL map (Local/Test/Enonic) + QA cross-link
├── App.jsx                          ← +2 imports, +2 routes
├── Sidebar.jsx                      ← +1 expandable group with 2 sub-items
└── i18n/locales/{en,no,es}/common.json
                                     ← sidebar keys + webLab block (incl. Redcross urlMap leaves)

docs/
└── web-lab-plan.md                  ← this document
```

V0 is a frontend-only change. No backend code, no Mongo collections, no new endpoints. Pure presentation + i18n.

---

## 12. How to validate V0 manually

1. Start backend: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
2. Start frontend: `cd frontend && npm start`
3. In the sidebar, expand "🌐 Web Lab" (between Future Item Agents and Robomind Clinic)
4. Click "🏢 Item.no web" — confirm blue hero, intent list, roadmap renders. Switch language to NO + ES, verify all 25 keys translate
5. Click "❤️‍🩹 Redcross.no web" — confirm red hero, related-agent panel visible with "→ Cruz Roja Web QA Agent" link, intent + roadmap render
6. Click the related-agent button — confirm sidebar selection switches to "Red Cross Web QA Agent" and the existing module loads
7. Switch language to Norwegian and Spanish; verify both pages render fully localized

V0 is **purely structural**. No real clone happens, no servers start. The placeholder is honest about that via the "V0 · structure only" badge.

---

## 13. Next concrete step

When you give green light for V1, the first commit will:
1. Add `LOCAL_WEBSITES_ROOT` to `.env.example` (real `.env` stays untracked)
2. Add `web_lab_projects_collection` to `backend/db.py`
3. Add `backend/routers/web_lab.py` with `GET /projects` + `GET /projects/{slug}`
4. Seed the 2 projects (Item.no + Redcross.no) on first request
5. Replace `_WebLabPage` placeholder data with real API calls
6. Add the "Use as local env for RC QA Agent" button + integration (**contract in §7**: `env_local_url` + cache invalidate; never overwrite `env_test_url`)
7. Add smoke checks (V1 row + **V1-RCQA** row in section 9)

Expected size: ~600 LOC across 5-6 files. Single commit, single PR review.

---

*Last updated: 2026-11-02 — V1 RCQA integration contract corrected (`env_local_url` / preserve TestSide; aligns with Settings runtime). V0 still ships as 1.16.0 structure-only.*
