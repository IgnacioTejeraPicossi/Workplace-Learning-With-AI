# Red Cross Web QA Agent — Azure DevOps Integration Guide

**Module**: Red Cross Web QA Agent (`frontend/src/red-cross-qa/AzureDevOps.jsx`)
**Backend**: `backend/services/red_cross_qa.py` + `backend/routers/red_cross_qa.py`
**Versions**: [1.15.4] Paste-and-Generate · [1.15.7] Live REST fetch with PAT
**ADO instance**: `https://dev.azure.com/RedCrossNorway/rkdotno`

---

## What this integration does

Two complementary workflows on the **"Azure DevOps"** tab let the agent ingest real Sprint backlog items and emit a structured Røde Kors-aware test plan:

| Workflow | When to use | Needs PAT? |
|---|---|---|
| **📋 Paste-and-Generate** | You're looking at one Story / Task in ADO and want a test plan for it right now | No |
| **📥 Fetch-from-ADO** | You want to see the whole Sprint backlog in the agent and pick items from a list | Optional — works with mock fallback when PAT absent |

Both pipelines end at the same place: `generate_test_plan` inside `red_cross_qa.py`, which:

- Reuses the static-review work-item fallback from the Enonic XP skill (Phase H+)
- Outputs in the user's UI locale (EN / NO / ES) via `lang` parameter
- Returns: manual tests · automated candidates · accessibility checklist · API checks · regression scope · suggested test data · suggested ADO work items

---

## Quick-start

### Option A — Paste only (no setup)

1. Open the agent → **Azure DevOps** tab.
2. Scroll to the **"📋 Paste a real Sprint item → get a test plan"** panel.
3. In Azure DevOps, open any User Story / Task → click **Copy** (or select-all + Ctrl+C in the body).
4. Paste into the textarea.
5. Click **"Generer testplan fra innliming"** (or its EN / ES equivalent).
6. Done — read the parsed structure on top, the suggested plan below.

No backend `.env` changes needed. The parser is **heuristic** and works offline.

### Option B — Live REST fetch (one-time PAT setup, then frictionless)

1. **Generate a PAT** at `https://dev.azure.com/RedCrossNorway/_usersSettings/tokens`
   - Name: `wlwai-red-cross-qa-readonly`
   - Scope: **Work Items → Read** (read-only is enough — fetch only reads)
   - Expiry: pick what your security policy allows (90 days is typical)
   - Copy the token immediately (ADO only shows it once)
2. **Add to backend `.env`** at the repo root:
   ```env
   ADO_PAT=<paste-the-token-here>
   ```
   (Or `AZURE_DEVOPS_PAT=...` — both env names are accepted.)
3. **Restart the backend**:
   ```bash
   python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```
4. Open the agent → **Azure DevOps** tab → **"📥 Hent fra Azure DevOps"** panel.
5. Click **"Hent sprint-saker"** — the badge flips from **MOCK** (amber) to **LIVE (PAT)** (green).
6. Click **"↓ Bruk denne saken"** on any item → the textarea below auto-fills + scrolls into view.
7. Click **"Generer testplan fra innliming"** to run the plan.

---

## Architecture

```
                    ┌────────────────────┐
                    │ Azure DevOps Board │
                    │  RedCrossNorway/   │
                    │      rkdotno       │
                    └─────────┬──────────┘
                              │
                              │ WIQL POST + batch GET
                              │ (Basic auth, PAT from env)
                              │
                ┌─────────────▼─────────────┐
                │   _fetch_ado_via_rest()   │
                │   in red_cross_qa.py      │
                │                           │
                │   httpx 15s timeout       │
                │   never raises            │
                └─────────────┬─────────────┘
                              │
                  is_mock=False│  (when PAT set)
                              │
                              ▼
                 ┌────────────────────────┐
                 │ fetch_ado_sprint_items │◄──── _mock_ado_sprint_items()
                 │      (entry point)     │       (4 curated items when
                 └────────────┬───────────┘        PAT missing or call fails)
                              │
                              │ POST /api/red-cross-qa/ado/fetch-sprint
                              ▼
                 ┌────────────────────────┐
                 │  AzureDevOps.jsx       │
                 │  📥 Fetch panel        │
                 │     ↓ "Use this item"  │
                 └────────────┬───────────┘
                              │
                              │ POST /api/red-cross-qa/ado/format-item
                              ▼
                 ┌────────────────────────┐
                 │ format_ado_item_as_    │
                 │ paste_text(item)       │ ── round-trip safe
                 └────────────┬───────────┘
                              │
                              ▼
                 ┌────────────────────────┐         ┌─────────────────────┐
                 │  📋 Paste textarea     │ ◄────── │   User clipboard    │
                 │  AzureDevOps.jsx       │         │   paste workflow    │
                 └────────────┬───────────┘         └─────────────────────┘
                              │
                              │ POST /api/red-cross-qa/ado/paste-to-plan
                              ▼
                 ┌────────────────────────┐
                 │ parse_ado_pasted_text  │
                 │  + Røde Kors content   │
                 │    type detection      │
                 └────────────┬───────────┘
                              ▼
                 ┌────────────────────────┐
                 │  generate_test_plan    │  ← reuses Tool 1 with enriched
                 │      (Tool 1)          │     work-item context
                 └────────────┬───────────┘
                              ▼
                       Structured plan
                  (NO / EN / ES per user locale)
```

---

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/red-cross-qa/ado/fetch-sprint` | `{iteration_path?, area_path?, organization?, project?, environment?, lang?}` | `{status, is_mock, live_error, organization, project, iteration_path, area_path, item_count, items[]}` |
| `POST` | `/api/red-cross-qa/ado/format-item` | `{item}` | `{status, pasted_text}` |
| `POST` | `/api/red-cross-qa/ado/parse-pasted` | `{pasted_text, environment?, lang?}` | `{status, parsed: {title, description, acceptance_criteria, fields, tags, rk_content_type, risk_level, …}}` |
| `POST` | `/api/red-cross-qa/ado/paste-to-plan` | `{pasted_text, environment?, lang?}` | `{status, parsed, plan, lang, environment}` |

All overrides default to the Settings tab values (or `DEFAULT_SETTINGS`: `RedCrossNorway / rkdotno / rkdotno\Web QA / rkdotno\Sprint 2`).

---

## Paste-and-Generate — recognised field headers

The parser is **bilingual + hyphen-tolerant**. All of these match:

```
Title: …               Tittel: …
Work Item Type: …      Arbeidselement-type: …       Arbeidselementtype: …
State: …               Tilstand: …                  Status: …
Area Path: …           Område-sti: …                Område: …
Iteration Path: …      Iterasjons-sti: …            Sprint: …
Priority: …            Prioritet: …
Tags: …                Etiketter: …                 Tagger: …
Story Points: …        Estimat: …
```

Section headers (introduce multi-line blocks):

```
Description: / Beskrivelse: / Details:
Acceptance Criteria / Akseptansekriterier / AC
Definition of Done / Definisjon av ferdig
Risk / Risiko
```

If no Title field is present, the first non-empty line becomes the title. Free-floating text before any header becomes the description.

---

## Røde Kors content-type detection

The parser scores keyword occurrences across `title + description + acceptance_criteria + tags` and surfaces the highest-density match from 8 types:

| Content type | NO keywords | EN keywords |
|---|---|---|
| `Distrikt` | distrikt, fylke | district, region |
| `Forening` | forening, lokalforening, lokallag | branch, chapter |
| `Aktivitet` | aktivitet, tilbud | activity, service offering |
| `Kontaktperson` | kontaktperson, ansatt, frivillig kontakt | contact person |
| `TjenesteKurs` | tjeneste, kurs, opplæring | course, service |
| `Tema` | tema | theme, thematic |
| `Nyhet` | nyhet, artikkel | news, article |
| `Kampanje` | kampanje, donasjon, giverkampanje | campaign, donation |

The detected type is surfaced in the UI as a green "Detected Røde Kors content type" chip + fed to `generate_test_plan` as enriched context so the plan covers content-type-specific scenarios (e.g. multi-tenant Distrikt isolation, Vipps-handoff for Kampanje, …).

---

## Mock vs Live mode

| Aspect | MOCK (no PAT) | LIVE (PAT set) |
|---|---|---|
| Source | `_mock_ado_sprint_items(iteration)` — 4 curated items hardcoded in `red_cross_qa.py` | Real WIQL + batch GET against `dev.azure.com/RedCrossNorway/rkdotno` |
| Item count | Always 4 (User Story × 2, Task, Bug) | Whatever the WIQL query returns (capped at 200 per batch) |
| `is_mock` flag | `true` | `false` |
| UI badge | amber **MOCK** chip | green **LIVE (PAT)** chip |
| Network | None | HTTPS to `dev.azure.com`, 15 s timeout |
| Determinism | Yes — workshop-safe | Depends on the live board state |

**The fallback chain is graceful**: if `ADO_PAT` is set but the call fails (401 / network / timeout / project not found), `fetch_ado_sprint_items` returns the **mock** items + a `live_error` field in the response. The UI shows the MOCK badge but the user is not blocked — they can still pick items and generate plans.

---

## Security

**This integration was designed for a workshop-demo / on-premise audit environment. Do not assume it's hardened for a public-facing multi-tenant SaaS deployment.**

What's done right:
- ✅ PAT only read from `os.environ["ADO_PAT"]` (or `AZURE_DEVOPS_PAT`) — **never** from the request body
- ✅ PAT never logged, echoed in responses, or persisted in MongoDB
- ✅ `.env` files are in `.gitignore` (verified at repo root; `hackathon_config.env` was historically tracked and was `git rm --cached`-ed)
- ✅ HTTPS only via httpx, 15 s timeout per call
- ✅ HTML stripped from `System.Description` + `Microsoft.VSTS.Common.AcceptanceCriteria` before exposure (ADO returns rich text)
- ✅ Smoke explicitly asserts `ADO_PAT` is NOT set during CI to keep tests hermetic and avoid hitting the live API from a CI runner

What you still need to think about:
- ⚠️ The backend serves the `/api/red-cross-qa/ado/fetch-sprint` endpoint to whoever can reach port 8000. If you expose it beyond localhost, gate it behind auth or restrict by network.
- ⚠️ PAT scope: use **Work Items → Read** only. The current integration is read-only — there's no path that needs Write scope. (Pack 4.2 dispatch is a separate flow with its own consent gate.)
- ⚠️ Rotate the PAT on the cadence your org requires. Token expiry is enforced server-side by Azure DevOps; expired PAT → 401 → graceful mock fallback in the agent.

---

## Troubleshooting

### "Badge shows MOCK even though I set ADO_PAT"

1. Confirm the backend was **restarted** after editing `.env` — uvicorn doesn't hot-reload env vars even with `--reload`.
2. Confirm the env var name is exactly `ADO_PAT` or `AZURE_DEVOPS_PAT` (no trailing whitespace, no quotes around the value in `.env`).
3. Check the response for `live_error`:
   ```bash
   curl -X POST http://localhost:8000/api/red-cross-qa/ado/fetch-sprint -H "Content-Type: application/json" -d '{}'
   ```
   - `"live_error": "WIQL returned 401: ..."` → PAT invalid / expired
   - `"live_error": "WIQL returned 403: ..."` → PAT lacks the Work Items Read scope, or you don't have project access
   - `"live_error": "WIQL returned 404: ..."` → org / project name mismatch (check Settings tab)
   - `"live_error": "TimeoutException: ..."` → network / firewall

### "Fetched items list is empty"

The WIQL query is `WHERE [System.IterationPath] = '<iteration>' AND [System.AreaPath] = '<area>'`. If both are set and no work items match, you get an empty array (not an error). Try:

- Remove the area path override in the iteration field
- Verify the iteration path matches exactly what ADO uses (including the backslash separator: `rkdotno\Sprint 2`, not `rkdotno/Sprint 2`)
- The frontend "Iteration path override" field sends an empty string → backend falls back to `DEFAULT_SETTINGS.ado_iteration_path` (`rkdotno\Sprint 2`)

### "The parser missed a field I pasted"

The parser is heuristic. If you have a clipboard format the regex doesn't recognise, the fix is to either:
- Reformat the paste manually (add `Title:` / `Description:` / `Acceptance Criteria:` headers)
- Or add the unrecognised header pattern to `_ADO_FIELD_PATTERNS` / `_ADO_SECTION_HEADERS` in `backend/services/red_cross_qa.py` and add a smoke check.

### "Plan came out generic / didn't capture the donation context"

The `generate_test_plan` path tries the LLM first and falls back to a deterministic Enonic-skill-aware mock if the LLM is unavailable or returns invalid JSON. Two things help:
- Run with a working LLM endpoint (LM Studio on port 1234 by default, see `BACKEND_STARTUP.md`)
- Make sure the paste includes acceptance criteria — the LLM uses these aggressively

---

## Smoke tests

The integration is covered by `backend/tests/smoke_red_cross_qa.py`. Run from repo root:

```bash
python -m backend.tests.smoke_red_cross_qa
```

Expected output near the end:

```
[OK] ADO paste parser (NO, content_type=Kampanje, 3 tags, AC captured)
[OK] ADO paste parser (messy free-form, content_type=Distrikt)
[OK] paste-to-plan NO (7 work items, 3 static-review)
[OK] ADO paste parser (empty input handled)
[OK] ADO fetch (mock, 4 items, types={'Bug', 'Task', 'User Story'})
[OK] ADO format-item → parse-pasted round-trip (title, type, iteration, tags, AC all preserved)
[OK] ADO fetch → format → paste-to-plan (7 work items in plan)
[PASS] ALL SMOKE CHECKS PASSED
```

The fetch + round-trip checks **explicitly assert** `ADO_PAT` is not set in the process environment — if you have it set locally, unset it before running the smoke or the assertion will fail.

---

## File map

```
backend/
├── services/red_cross_qa.py
│   ├── parse_ado_pasted_text()              [1.15.4]
│   ├── generate_test_plan_from_ado_item()   [1.15.4]
│   ├── format_ado_item_as_paste_text()      [1.15.7]
│   ├── _fetch_ado_via_rest()                [1.15.7]  — never raises
│   ├── _mock_ado_sprint_items()             [1.15.7]
│   └── fetch_ado_sprint_items()             [1.15.7]  — public entry point
├── routers/red_cross_qa.py
│   ├── POST /ado/parse-pasted               [1.15.4]
│   ├── POST /ado/paste-to-plan              [1.15.4]
│   ├── POST /ado/fetch-sprint               [1.15.7]
│   └── POST /ado/format-item                [1.15.7]
└── tests/smoke_red_cross_qa.py
    ├── checks 1-4 (parser + paste-to-plan)  [1.15.4]
    └── checks 5-7 (fetch + round-trip + e2e)[1.15.7]

frontend/src/red-cross-qa/AzureDevOps.jsx
├── 📥 Fetch-from-ADO panel                  [1.15.7]
├── 📋 Paste-and-Generate panel              [1.15.4]
└── Existing 🏷️ Bundle config + dispatch     (Pack 4.2)

frontend/src/i18n/locales/{en,no,es}/redCrossWebQaModule.json
└── ado.{paste*, parsed*, plan*, fetch*, btnUseItem, ...}
    54 keys × 3 locales (as of 1.15.7)
```

---

## Related docs

- `docs/CHANGELOG.md` entries: [1.15.4] · [1.15.7]
- `docs/audits/red-cross-qa-enonic-xp-roundup.md` — companion audit (Phase H+ static-review items the plan reuses)
- `backend/services/qa_security_service.py` `dispatch_finding_to_ado` — Pack 4.2 dispatch (the *opposite* direction: push findings to ADO)

---

*Last updated: 2026-05-28 (version 1.15.7)*
