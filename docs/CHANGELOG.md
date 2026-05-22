# Changelog

All notable changes to the J-messages Analyzer and Retrospective Learning system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.15.1] - 2026-05-22

### Added — AGI Hub · Homo Sapiens vs. KI i Test · Option A (log-only feedback) — closes the trilogy

The "Future improvements" footer of the workshop tab listed three design flavours for the per-round feedback loop. Option B (ephemeral re-run) shipped with Pack 3; Option C (persistent prompt evolution) shipped with Phase E. **Option A (log-only feedback) was the only remaining gap** — feedback notes that didn't trigger a re-run nor a revision proposal were lost. This release closes the trilogy.

**Backend**

- `backend/db.py`: new collection `homo_vs_ai_feedback_log_collection` ("homo_vs_ai_feedback_log").
- `backend/services/homo_vs_ai_service.py`:
  - New `log_feedback_note(task, text, actor, context, previous_ai_output, extra)` — persists to Mongo with in-memory fallback (~5000 entry cap, sliding-window trim). Deterministic `entry_id` via SHA-1 of `task|text|timestamp` for de-dup.
  - New `export_feedback_log(task, since, limit)` — returns newest-first entries from BOTH Mongo and the in-memory fallback, with task / since filters. Default cap 1000, max 5000.
  - `run_challenge` now auto-logs every ephemeral re-run (`context="ephemeral-rerun"`) — best-effort, never blocks the re-run.
- `backend/routers/homo_vs_ai.py`: 2 new routes added (5 → 7 total):
  - `POST /api/agi/homo-vs-ai/feedback-log` — explicit log from "Save as note" button.
  - `GET /api/agi/homo-vs-ai/feedback-log/export?task=&since=&limit=` — download for post-workshop analysis.

**Frontend** (`frontend/src/pages/help/agi/HomoSapiensVsAI.jsx`)

- New "📝 Save as note" button beside Re-run with feedback + Propose revision. Captures the typed critique to the log without re-running the AI or proposing a revision. Useful when the host wants the note on record but neither B nor C is desired in the moment. Inline toast confirmation; clears on textarea edit.
- Auto-log inside `proposeRevision()` — best-effort `context="proposal-trigger"` entry so every proposal moment is captured even if the LLM refuses.
- New `FeedbackLogExportPanel` component near the bottom of the workshop tab (between Phase E governance and Future improvements). One-click JSON download via `Blob URL`; filename `workshop-feedback-log-<UTC>.json`. Surfaced with entry count + filename confirmation.
- `frontend/src/api/agiApi.js`: `logHomoVsAiFeedback(...)` + `exportHomoVsAiFeedbackLog(...)` helpers.

**i18n** — 9 new keys × 3 locales (EN / NO / ES) under `homoVsAi.feedbackLog.*`:
- `saveBtn`, `saving`, `saved`, `saveTooltip`, `panelKicker`, `panelLead`, `exportBtn`, `exporting`, `exportedCount`

Plus updates to `homoVsAi.future.lead` + `homoVsAi.future.ideas[0].status` + `homoVsAi.future.ideas[0].options[0]` to reflect the new shipped status of Option A.

**Smoke** — new `backend/tests/smoke_feedback_log.py` (8 checks): log shape, auto-log shape, validation (empty text + unknown task rejected), export with task filter, router registration, newest-first ordering. All green.

**Backward compatibility**: 100% additive. Existing flows unchanged. Mock-first: works without Mongo (in-memory fallback).

**Validation**:
- `python -m backend.tests.smoke_feedback_log` → 8/8 PASS
- `python -m backend.tests.smoke_prompt_evolution` → 3/3 PASS (Phase E unchanged)
- i18n parity within `homoVsAi.feedbackLog`: 9 keys × 3 locales identical

**Future-improvements footer** now marks Option A as `shipped · 1.15.1`. The trilogy is complete.

---

## [1.15.0] - 2026-05-21

### Added — Red Cross Web QA · Phase H+ : enonic-xp skill applied across 13 audit areas

End-to-end integration of the `.claude/skills/enonic-xp/` knowledge base (0.1.0 → 0.2.0) into every area of the Red Cross Web QA Agent. The skill was built in earlier work from three pilot Enonic XP reviews (`xp-nva` × 2 + Cristin→NVA migration); this release applies its 7 reference documents (security / performance / reliability / api-design / data-integrity / nashorn-compatibility / code-review-checklist) to enrich the 13 audit suites of the module. All changes are additive and backward-compatible.

**Per-area enrichments (summary)**

| Area | Top-3 actions implemented | New checks | New i18n keys |
|------|---------------------------|------------|---------------|
| Test Plan | Enonic XP red flags block + `static-review` test level + extended mock fallback (NoQL probe, DST regression, static-review work items) | — | — |
| Playwright | Storybook drift-guard + `cms-preview.spec.ts` template + `migrated-links.spec.ts` template | 3 deterministic specs | — |
| Cypress | 3 deterministic templates: `component-designsystemet.cy.ts` (Guillotine stubbing) + `regression-donation.cy.ts` (cypress-axe + hydration + æøå) + `quick-debug.cy.ts` | 3 specs | — |
| API & GraphQL | `checkInjection` + `checkIntrospectionDisabledInProd` + `checkDepthLimit`; `_GRAPHQL_BASELINES` for real schema-drift comparison; 3 Postman negative tests (400/401/429); Content-Type + responseSize budget | +3 | +3 |
| CMS Quality | `CMS_QA_PROMPT` rewrite (5→60 lines); 14 deterministic test cases per area with `severity` + `enonic_xp_pattern` + `acceptance_criteria` + `automation_ref` | — | — |
| Forms QA | `checkCsrf` + `checkInjectionInFormFields` + `checkServiceUrlGeneration` + `checkFundyOriginAllowed`; Beredskap critical-path resilience; Nashorn static-review test case; APIM prefill enriched (timeout + shape + retry) | +4 | +3 |
| Content Migration | `checkUrlParameterConsistency` + `checkStructuredFilterPreserved` + `checkStaleDataLifecycle`; 3 new `broken_pages` issue types; `automation_ref` cross-refs to `playwright:migrated-links.spec.ts` | +3 | +3 |
| Accessibility | `checkLangAttribute` + `checkHtmlAreaEditorialA11y` + `checkCmsEditorialUiA11y`; `check_notes` parallel dict with skill citations; 4 new Enonic-keyed violations; `cross_tool_refs` to NVDA + WAVE + Playwright + Cypress | +3 | +3 |
| Performance (Enonic panel) | `checkRefreshStrategy` + `checkChangeDetectionPerf` + `checkConnectionPooling`; `_PERF_HOT_QUERY_BASELINES` for p95 degradation tracking; `composite_score` + `cross_tool_refs` | +3 | +3 |
| Designsystemet | `checkDsSsrHydration` + `checkDsPackageVersionsAligned` + `checkDsHtmlAreaIntegration`; `_DS_COMPLIANCE_BASELINES` for `compliance_score` trend; 2 skill-cited recommendations | +3 | +3 |
| Role Matrix | `checkRepositoryAcl` + `checkNoQLInjectionInRoleQueries` + `checkRoleCacheStaleness`; 2 new matrix rows for repository-level principals; `_ROLE_MATRIX_BASELINES` for matrix drift tracking | +3 | +3 |
| Stress Test (k6 + Loadster + Resilience) | `checkApimBackpressure` + `checkGuillotineUnderLoad` + `checkBackgroundJobsUnderLoad`; DST drift probe on crisis/soak; `_RESILIENCE_BASELINES` for `resilience_score` trend; k6 + Loadster results expose Enonic-XP signals | +3 | — |
| Security & Privacy | `checkNashornSafety` + `checkResponseSizeLimit` + `checkRepositoryAcl` in legacy `run_security_scan`; Phase H `Finding` schema gains Optional `enonic_xp_pattern` + `automation_ref`; routing helpers `_suggest_enonic_xp_pattern` + `_suggest_automation_ref` auto-populate from `check_id` | +3 | — |

**Module-level state changes**

- **i18n parity**: 696 → **721 keys × 3 locales** (EN/NO/ES) — strictly additive, full parity preserved.
- **Smoke checks** (`backend/tests/smoke_red_cross_qa.py`): 20 → **37 checks**, all green.
- **Phase H workbench smoke** (`backend/tests/smoke_qa_security.py`): 16/16 PASS unchanged (no regression from the `Finding` schema additions — Optional fields default to None).
- **In-memory baselines** (new pattern, reused across 5 areas for trend tracking):
  - `_GRAPHQL_BASELINES`         — schema drift (API & GraphQL)
  - `_PERF_HOT_QUERY_BASELINES`  — hot query p95 degradation (Performance)
  - `_DS_COMPLIANCE_BASELINES`   — Designsystemet compliance_score trend
  - `_ROLE_MATRIX_BASELINES`     — Role Matrix drift (added/removed/changed rows)
  - `_RESILIENCE_BASELINES`      — Resilience score trend
  - (Phase H workbench already had `_GRAPHQL_BASELINES` baseline pattern; new areas mirror it.)

**Cross-tool refs (new top-level field across 9 areas)**

A `cross_tool_refs` object on every area response now makes the module self-navigable: a single audit result links to the related sibling endpoints, the Playwright/Cypress specs generated elsewhere, and the relevant skill section. Pattern: `playwright_spec`, `cypress_spec`, `skill_doc` plus area-specific keys (e.g. `nvda_script_endpoint`, `wave_audit_endpoint` for Accessibility; `lighthouse_endpoint`, `loadster_endpoint` for Performance; `phase_h_workbench_scan` for Security & Privacy legacy bridge).

**Documentation**

- New `docs/audits/red-cross-qa-enonic-xp-roundup.md` — consolidated audit retrospective with the priority matrix across all 13 areas, severity counts, smoke deltas and follow-up suggestions.
- `.claude/skills/enonic-xp/SKILL.md` bumped to 0.2.0 with retro notes from the 13-area application.
- `README.md` + `.claude/MODULES_REFERENCE.md` updated to reflect new counters.

**Validation**: 37/37 `smoke_red_cross_qa` PASS · 16/16 `smoke_qa_security` PASS · 721 × 3 i18n parity holds.

---

## [1.14.0] - 2026-05-15

### Added — Red Cross Web QA · Phase H Pack 4.1 + 4.2: precise scan diffs and real ADO dispatch

Closes two of the three Pack 4 candidates left as "Future" in 1.13.0. Pack 4.3 (Apollo plugin for Lunix performance) remains deferred pending coordination with the Røde Kors tech leder. All changes are additive and backward-compatible with Pack 3 contracts.

**Pack 4.1 — per-scan finding snapshots → precise historical diffs**

`backend/schemas/qa_security.py`:
- New `FindingSnapshotEntry` Pydantic model (5 fields: `id`, `check_id`, `title`, `severity`, `status`). Kept intentionally small — a scan run with 50 findings stays under ~5 KB.
- `ScanRun` gains an `Optional[List[FindingSnapshotEntry]] findings_snapshot` field, aliased `findingsSnapshot` for the frontend. Optional preserves backward compatibility with scan docs persisted before Pack 4.1.

`backend/services/qa_security_service.py`:
- `perform_scan()` now builds and persists `findings_snapshot` on every new `ScanRun` doc — captured AFTER status-preservation logic has merged the new scan with prior human decisions.
- `diff_scans()` rewritten to prefer the precise path when both runs carry a snapshot:
  - **`_diff_via_snapshots`** — set-difference + status transitions: `not in from + in to (open) → new`; `open in from + (closed in to OR absent in to) → fixed`; `closed in from + open in to → regressed`; `open in both → persisted`. Closed-status set: `{fixed, verified, accepted_risk}`.
  - **`_diff_via_timestamps`** — original Pack 3 logic, kept as fallback for scan docs that pre-date Pack 4.1.
  - Response now includes a `diff_mode` discriminator: `"precise" | "timestamp_fallback" | "no_scans"`. UI / debug tools can show users which logic was used.

**Pack 4.2 — real ADO REST integration via `ADO_PAT` env var**

`backend/services/qa_security_service.py`:
- New helpers `_build_ado_description_md`, `_build_ado_json_patch`, and async `_dispatch_via_ado_rest`. Single source of truth for the work-item Markdown body and JSON-Patch document so the mock path and the live REST path produce indistinguishable payloads for review.
- `dispatch_finding_to_ado()` now checks `os.environ['ADO_PAT']` (or `AZURE_DEVOPS_PAT`):
  - When set, POSTs the JSON-Patch document to `https://dev.azure.com/{org}/{project}/_apis/wit/workitems/${type}?api-version=7.0` using HTTP Basic auth (empty user + PAT as password). On 2xx, returns the real work-item ID + `_links.html.href` URL with `is_mock=False`.
  - On any failure (no PAT, network, 401, non-2xx, JSON parse), gracefully falls back to the deterministic SHA-derived mock — `is_mock=True` and the failure reason is captured in `live_error` and the audit-log history entry.
- Response shape additions: `is_mock: bool`, `live_error: Optional[str]`. The finding doc now also persists `ado_is_mock` so the UI can render the correct badge without re-fetching the dispatch result.
- ADO settings expanded: `ado_area_path`, `ado_iteration_path`, `ado_tags` from `red_cross_qa_settings` are now honoured in the JSON-Patch.

`httpx==0.25.2` is already in `backend/requirements.txt` (used by `agi_ai_enrich_service.py` and `cloud_install_service.py`); no new dependency was added.

**Environment / configuration**

- `ADO_PAT` (or `AZURE_DEVOPS_PAT`) — Personal Access Token with `Work Items: Read & Write` scope. When absent, dispatch stays mock-first (the workshop / demo UX remains green without an ADO tenant). Never commit the value; read from `.env` only.

**Frontend** — `FindingRow.jsx`:
- New MOCK / LIVE badge rendered next to the ADO link button (green for LIVE, amber for MOCK). Title attribute explains the state in the active locale.
- Dispatch callback now propagates `ado_is_mock` so the badge appears immediately without a refetch.
- Defaults to MOCK on legacy finding docs that pre-date Pack 4.2 (no `ado_is_mock` field persisted).

**i18n** — 4 new keys × 3 locales (EN / NO / ES), under `redCrossWebQaModule.securityPrivacy.*`:
- `findingAdoMockBadge`, `findingAdoMockTitle`, `findingAdoLiveBadge`, `findingAdoLiveTitle`

Total: 700 keys × 3 locales (was 696 × 3 in 1.13.0). Parity validated.

**Smoke tests** — `backend/tests/smoke_qa_security.py` extended from 15 → 16 checks. New Pack 4.1 check exercises the snapshot path end-to-end (runs 2 scans, asserts `diff_mode == "precise"`, validates snapshots on both `from` and `to` run docs, confirms snapshot-derived diff rows do not leak `owner`/`updated_at`). Existing Pack 3 dispatch check extended to assert Pack 4.2 response shape (`is_mock`, `live_error`, `work_item.json_patch` with 5 required fields).

Validation results:
- `python -m backend.tests.smoke_qa_security` → 16/16 PASS
- `python -m backend.tests.smoke_red_cross_qa` → 20/20 PASS (no regression)
- i18n parity: EN/NO/ES 700 keys each, no missing/extra
- Frontend `npm run build` → exit 0 (only pre-existing lint warnings in unrelated modules)

### Deferred to Pack 4.3 (awaiting Tom)
- Apollo plugin for live Lunix Next.js GraphQL performance telemetry. Plan: design the contract on our side (`docs/apollo-plugin-contract.md`), provide sample plugin code Tom can paste into `app/api/graphql/route.ts` on the Lunix repo, accept results via a new `/api/qa/security/apollo-stats` ingestion endpoint. No Lunix-side work until Tom is briefed.

---

## [1.13.0] - 2026-05-15

### Added — Red Cross Web QA · Phase H Pack 3: 5 workflow extensions on the Sikkerhet og personvern workbench

Closes the Pack 3 candidates left as "Future" in 1.12.0. All five extensions are additive: Pack 2 endpoints, contracts and persistence remain untouched.

**Backend service** (`backend/services/qa_security_service.py`, +~500 lines):

1. **`export_markdown_report(environment, include_dpia, include_history, sprint_name, lang)`** — Composes a structured sprint-ready Markdown report: snapshot rollup → findings grouped by severity → tally table → last-N scan history → DPIA snapshot. Filename includes the sprint slug. No server file-system involvement (the frontend creates a Blob URL for download).

2. **`dispatch_finding_to_ado(finding_id, environment, actor, lang)`** — Push a single finding to Azure DevOps as a work item. Mock-first today: generates a deterministic SHA-derived work-item ID (e.g. #44300) and ADO URL based on the org/project from the existing `red_cross_qa_settings`. Severity → ADO priority + work-item-type + severity_dev mapping (`critical→P1/Bug/Sev 1`, `high→P2/Bug/Sev 2`, etc.). Persists `ado_url` + `ado_work_item_id` + `ado_dispatched_at` on the finding so re-dispatches are idempotent (same finding always lands on the same mock work item). Audit-log entry appended on every dispatch.

3. **`diff_scans(from_scan_id, to_scan_id, environment)`** — Compares two scan runs, returns `{from, to, counts_delta, findings: {new, fixed, regressed, persisted}, summary}`. Pragmatic categorisation: NEW = created in the window, FIXED = closed in the window, REGRESSED = had been fixed/verified but reopened, PERSISTED = open in both runs. Default args use newest vs previous run.

4. **`verify_finding(finding_id, environment, lang, actor)`** — Re-runs the scan and inspects whether the finding is still detected. Auto-transitions: not re-detected → `verified`; re-detected with same severity → reopened (`open`); status preserved → records the verification attempt only. Returns `{finding, verification, scan_id, note}`. The `verification` outcome is one of `still_clean / regressed / preserved / inconclusive`.

5. **`get_environment_matrix()`** — Returns the most-recent snapshot per known environment (`local / test / staging / prod`) plus a `worst_overall` aggregate. Powers the governance overview at the top of the Sikkerhet og personvern tab.

**Backend router** (`backend/routers/qa_security.py`, 5 new endpoints, 8 → 13 unique paths, 10 → 15 method bindings):

| Endpoint | Method | Purpose |
|---|---|---|
| `/export/markdown` | POST | Generate Markdown report |
| `/findings/{id}/dispatch-ado` | POST | Push finding to ADO (idempotent) |
| `/diff` | GET | Compare two scan runs |
| `/findings/{id}/verify` | POST | Re-run scan, transition status |
| `/environments` | GET | Snapshot per env + worst-overall |

**Frontend** — 3 new components + augmented `FindingRow`:

- **`ExportButtons.jsx`** — sprint-name input + "📥 Export Markdown" button, downloads via Blob URL.
- **`ScanDiffPanel.jsx`** — diff vs previous (default) or any older scan picked from dropdown. 4-column bucket view (NEW / REGRESSED / FIXED / PERSISTED) with severity-coloured rows + "+N more" overflow.
- **`EnvironmentMatrix.jsx`** — 4 clickable env cards (local/test/staging/prod) with status pill + PASS/WARN/FAIL/openFindings stats + last scan timestamp + DPIA indicator. Click switches the active environment for the rest of the workbench (requires `setEnvironment` passed down from the agent shell).
- **`FindingRow.jsx`** augmented with two new buttons inside the expanded edit form:
  - **🎯 Send to ADO** — opens ADO link if already dispatched (`ado_url` set), otherwise calls the dispatcher. Idempotent.
  - **✅ Verify fix** — only renders when status is `fixed`. Triggers `verify_finding` and updates locally.

**Agent shell** — `RedCrossWebQAAgent.jsx` now passes `setEnvironment` to the SecurityPrivacy tab (one-line addition) so the environment matrix can actually switch envs.

**i18n** — 24 new keys × 3 locales (EN/NO/ES) under `securityPrivacy.*`:
- Export: `exportMarkdownBtn`, `exportSprintPlaceholder`
- Finding actions: `findingDispatchAdo`, `findingDispatchAdoTitle`, `findingAdoLinkTitle`, `findingVerify`, `findingVerifyTitle`
- Diff: `diffTitle`, `diffHint`, `diffFromLabel`, `diffAutoPrevious`, `diffRefresh`, `diffNeedTwoRuns`, `diffBucket_new/fixed/regressed/persisted`, `diffBucketEmpty`, `diffBucketMore`
- Env matrix: `envMatrixTitle`, `envMatrixHint`, `envMatrixWorst`, `envMatrixRefresh`, `envMatrixPickHint`
- Total i18n size: **696 keys per locale** (was 672), full parity.

**Tests** — `smoke_qa_security.py` extended with **5 Pack 3 checks**:
- `export_markdown_report`: filename + required sections + byte count
- `dispatch_finding_to_ado`: deterministic mock URL, severity_dev mapping, idempotent re-dispatch, ado_url persisted on finding
- `diff_scans`: 4 buckets, counts_delta, summary
- `verify_finding`: verification outcome categorisation, final status in valid set
- `get_environment_matrix`: 4 envs present, worst_overall in valid set
- **Total: 15/15 PASS** (10 Pack 2 + 5 Pack 3) without Mongo, without LLM.

**Docs**

- `README.md` updated (route count, Pack 3 capabilities)
- `docs/CHANGELOG.md` — this entry
- `.claude/MODULES_REFERENCE.md` — Pack 3 endpoints table appended

**Architectural notes**

- **Mock-first preserved everywhere.** ADO dispatch is a deterministic SHA-derived mock URL today. When a real ADO PAT is wired in later, only `dispatch_finding_to_ado` changes; the persisted shape on the finding stays identical.
- **Idempotent ADO dispatch.** Same finding ID + same SHA → same mock work-item ID. Re-clicking "Send to ADO" doesn't create duplicate work items.
- **Diff is a snapshot, not a journal.** Today we compare CURRENT findings against scan timestamps, so the "REGRESSED" bucket relies on the finding's audit history. Acceptable for the workshop demo; a future Pack 4 could persist per-scan snapshots if precise historical diffs become important.
- **Verify-fix re-runs the whole scan today.** A future Pack 4 could optimise to re-run only the parent check, but the cost is negligible (mock-first scans complete in ~50ms).

---

## [1.12.0] - 2026-05-13

### Added — Red Cross Web QA · Phase H (Pack 2): Sikkerhet og personvern workbench

The Sikkerhet og personvern tab is promoted from "status board" to a real backend-driven QA/security work surface. Co-designed with ChatGPT and Tom (Tech leder, Røde Kors) — implemented as Pack 2 of the security plan shared 2026-05-13.

**Why this matters**: the existing module already showed status cards + findings + a DPIA panel. Pack 2 makes findings *actionable, traceable and persistent*: a finding marked `fixed` stays `fixed` across re-scans; scan runs persist with timestamps + counts; the DPIA is editable not just visual.

**Backend (new files)**

- **NEW** `backend/schemas/qa_security.py` — Pydantic models for `SecurityCheck`, `Finding`, `ScanRun`, `DpiaForm` + request/response wrappers. Stable, frontend-friendly contract: every check carries `id, title, description, category (security/privacy/dpia), status, severity, scan_type (automatic / semi-automatic / manual), summary, findings[], evidence[], recommendations[], source, last_run_at`.
- **NEW** `backend/repositories/qa_security_repository.py` — Mongo persistence with in-memory fallback. Critical behaviour: `upsert_finding` preserves user-set statuses (`accepted_risk`, `fixed`, `verified`) so re-scans never clobber human decisions. Append-only audit history (last 20 entries per finding).
- **NEW** `backend/services/qa_security_service.py` — Orchestrator on top of `red_cross_qa.run_security_scan` + `run_dpia_check`. Adds static check catalogue (25 entries — 13 security/privacy + 12 DPIA — with category + scan_type tagging), deterministic finding IDs (`<check_id>::<title-slug>`), keyword-based finding-to-check routing, auto-suggested owners per check (devops / backend / personvernombud / etc.), DPIA seeding on first request.
- **NEW** `backend/routers/qa_security.py` — 8 paths under `/api/qa/security/*` with 10 method bindings:
  - `GET /status` — top-level rollup
  - `GET /checks` — list with status
  - `GET /checks/{id}` — full detail with findings_detail
  - `POST /scan` — persist a ScanRun + Findings; returns snapshot
  - `GET /findings` — filter by status / severity / check_id
  - `PATCH /findings/{id}` — update status / owner / recommendation / evidence + audit note
  - `GET /history` — last N runs
  - `GET /dpia` — load form (seeds default on first request)
  - `POST /dpia` — replace form
  - `PATCH /dpia` — partial update
- **MODIFIED** `backend/db.py` — 3 new Mongo collections: `qa_security_scans`, `qa_security_findings`, `qa_security_dpia`.
- **MODIFIED** `backend/app.py` — registers `qa_security_router`.
- **NEW** `backend/tests/smoke_qa_security.py` — 10 checks exercising the full lifecycle (perform_scan → check shape → finding shape → status snapshot → check detail → filters → PATCH → **re-scan preserves status** → history newest-first → DPIA seed/save/patch → router registration).

**Backward compatibility**: `/api/red-cross-qa/run-security-scan` and `/api/red-cross-qa/run-dpia-check` remain untouched. The new `/api/qa/security/*` namespace is additive.

**Frontend (new structure)**

- **NEW** `frontend/src/red-cross-qa/security/` directory with 7 components + 1 API client + 1 tokens module:
  - `SecurityPrivacyTab.jsx` — orchestrator. Holds all state (snapshot, checks, findings, history, active detail, filters). Children are presentational + emit events back up.
  - `components/SecurityCheckCard.jsx` — clickable card with status pill, category icon, severity badge, scan_type chip, findings count, last_run timestamp.
  - `components/SecurityCheckDetailPanel.jsx` — drawer with summary, evidence list, recommendations list, full findings rows. Closeable.
  - `components/FindingRow.jsx` — expandable row. Status selector (open/accepted_risk/fixed/verified), owner input, recommendation textarea, audit note input, Save button, audit history viewer.
  - `components/FindingsList.jsx` — collection wrapper with filtered-vs-total count.
  - `components/ScanHistoryPanel.jsx` — last 5 runs with PASS/WARN/FAIL stat chips + trend arrow (↓ improving / ↑ regressing / → flat) vs previous run.
  - `components/DpiaChecklistPanel.jsx` — editable structured form (10 fields: text/textarea/list/bool kinds), Save / Discard buttons, dirty tracking, "saved at" indicator.
  - `components/StatusFilters.jsx` — composite filter bar (check status / scan type / category / finding status / severity) used for both grid and findings.
  - `api.js` — thin REST client (`securityApi.status / checks / checkDetail / scan / findings / patchFinding / history / dpia.get / dpia.save / dpia.patch`).
  - `tokens.js` — shared visual tokens (STATUS_STYLES, SEV_COLOR, FINDING_STATUS_STYLES, SCAN_TYPE_STYLES, CATEGORY_STYLES + panel / panelTitle / inputCss / primaryBtn / etc.).
- **MODIFIED** `frontend/src/red-cross-qa/SecurityPrivacy.jsx` — collapsed to a 1-line re-export so the agent shell wiring stays unchanged.

**i18n** — full EN/NO/ES parity, **82 new keys × 3 locales = 246 new entries** under `securityPrivacy.*`:
- Snapshot: `snapshotTitle`, `runScan`, `lastScanAt`, `noScanYet`, `overall`, `statTotal`, `statOpenFindings`
- Checks: `checksTitle`, `checksHint`, `noChecksForFilter`, `lastRunAt`, `findingsCount`, `scanType`, `source`
- Scan types: `scanType_automatic`, `scanType_semi_automatic`, `scanType_manual`
- Categories: `category_security`, `category_privacy`, `category_dpia`
- Detail: `detailSummary`, `detailEvidence`, `detailRecommendations`, `detailLinkedFindings`, `noFindingsForCheck`
- Findings: `findingsSectionTitle`, `noFindingsForFilter`, `findingStatusLabel`, `findingOwner`, `findingOwnerPlaceholder`, `findingRecommendation`, `findingRecommendationPlaceholder`, `findingNote`, `findingNotePlaceholder`, `findingSave`, `findingHistory`, `updatedAt`
- Finding statuses: `findingStatus_open`, `findingStatus_accepted_risk`, `findingStatus_fixed`, `findingStatus_verified`
- Filters: `filterStatus`, `filterScanType`, `filterCategory`, `filterFindingStatus`, `filterSeverity`, `filterAll`
- History: `historyTitle`, `historyHint`, `historyTrigger`, `noHistory`, `trendImproving`, `trendRegressing`, `trendFlat`
- DPIA: `dpiaTitle`, `dpiaHint`, `dpiaSave`, `dpiaDiscard`, `dpiaSavedAt`, `dpiaLastUpdate`, `dpiaBoolYes`, `dpiaBoolNo`, `dpiaListHint` + 10 field labels (`dpiaField_*`) + 10 placeholders (`dpiaPlaceholder_*`)
- **Total i18n locale size**: 672 keys per locale (was 590), full parity.

**Architectural notes**

- **No new tabs.** Tab 14 retains its position in the agent shell; only its internal implementation changed. The old single-file `SecurityPrivacy.jsx` (~250 lines) is now a 1-line re-export pointing at the new modular structure (~1500 lines split across 9 files).
- **Mock-first preserved.** The new `/api/qa/security/scan` endpoint calls the existing `run_security_scan` + `run_dpia_check` (which are mock-first). No new LLM dependency — the workshop demo runs offline.
- **Persistence is optional.** When Mongo is unavailable, the repository falls back to module-level in-memory caches so the workshop demo works in any environment. When Mongo IS available, findings + DPIA + scan history persist across backend restarts.
- **User-set status is sacred.** The `_PROTECTED_STATUSES` set in the repository (`{accepted_risk, fixed, verified}`) means re-running a scan never silently reopens a finding the human deliberately closed. Title / description / evidence / severity may refresh from the scanner; status / owner / recommendation are kept as the human last set them.

**Tests**

- New: 10/10 Phase H smoke checks PASS (`python -m backend.tests.smoke_qa_security`).
- Regression: 20/20 Phase A→G smoke checks still PASS (`python -m backend.tests.smoke_red_cross_qa`).
- Frontend production build: 0 warnings in `src/red-cross-qa/`.

**Future (Pack 3 candidates)**

- Markdown / PDF export of findings list
- Direct dispatch from finding → ADO work item
- Diff between two scan runs
- "Verify fix" flow (re-runs only the scan plug-in linked to the closed finding)
- Environment matrix (local / test / staging / prod side-by-side)

---

## [1.11.0] - 2026-05-13

### Added — Red Cross Web QA · Phase G: NVDA + WAVE inside the Universell utforming-pilot tab

User request (2026-05-13, en): *"Puedes colocarme en el agente 'Røde Kors Web QA-agent' en su pestaña 'Universell utforming-pilot' que también pueda usar NVDA y WAVE?"*

Both tools live alongside the existing axe-core + Lighthouse runner via a 3-radio tool selector at the top of the tab. The target URL field + WCAG version selector are reused across all three tools.

**Backend**

- **MODIFIED** `backend/services/red_cross_qa.py`:
  - **NEW** `generate_nvda_script(url, scope, environment, lang)` — produces a deterministic markdown NVDA checklist (no LLM): NVDA setup keystrokes (`Insert + Ctrl + N`), elements-list opener (`Insert + F7`), page-title announce (`Insert + T`), Tab navigation, heading sweep (`H`), landmark sweep (`D`), form-field re-announce (`Insert + Tab`), error-on-validation announce (`Insert + B`), dialog open (`Insert + Down`). 5 scopes with per-scope expected announcements: `donation` (Beløp edit required, Vipps button), `volunteer` (Telefonnummer / Postnummer required), `search` (combo box autocomplete), `navigation` (banner / hovedmeny / hopp-til-hovedinnhold), `forms` (generic). Returns: `script_md`, `step_count`, `wcag_sc_covered[]`, `filename`, platform.
  - **NEW** `run_wave_audit(url, environment, lang)` — mock-first WAVE (WebAIM) report shape mirroring the public API: `categories` (errors / contrast_errors / alerts / features / structural_elements / aria), `errors_detail[]` / `contrast_detail[]` / `alerts_detail[]` with WCAG SC mapping and severity. Returns the public report URL `https://wave.webaim.org/report#/{url}` for direct browser inspection. Real API call deferred behind `WAVE_API_KEY` env var (workshop safety: mock-first by default).
- **MODIFIED** `backend/routers/red_cross_qa.py`:
  - 2 new Pydantic models: `NvdaScriptRequest` (url, scope, env, lang) + `WaveAuditRequest` (url, env, lang).
  - 2 new endpoints: `POST /generate-nvda-script` + `POST /run-wave-audit`.
  - Total route count: **37** (was 35).

**Frontend**

- **REWRITE** `frontend/src/red-cross-qa/Accessibility.jsx`:
  - 3-radio **tool selector** at the top (axe / NVDA / WAVE) — only the selected tool's UI renders below.
  - When `axe` is selected: existing WCAG version selector + 12-check grid + score card + violations panel (unchanged behaviour).
  - When `nvda` is selected: scope picker (5 chips) + Generate button + markdown viewer with monospace dark theme, WCAG SC chips, **Download .md** button (`Blob` API → browser download).
  - When `wave` is selected: 6 stat cards (errors / contrast / alerts / features / structure / aria) + deep-link button to `wave.webaim.org/report` + 3 detail tables (Errors / Contrast errors / Alerts) with WCAG mapping + severity badge + mock-data notice with `WAVE_API_KEY` hint.

**i18n**

- **29 new keys × 3 locales** (EN / NO / ES) under `redCrossWebQaModule.accessibility.*`:
  - Tool selector: `toolTitle`, `toolHint`, `tool_axe_hint`, `tool_nvda_hint`, `tool_wave_hint`
  - NVDA: `btnGenerateNvda`, `btnDownloadNvda`, `nvdaScopeTitle`, `nvdaScope_donation`, `nvdaScope_volunteer`, `nvdaScope_search`, `nvdaScope_navigation`, `nvdaScope_forms`, `nvdaSteps`, `nvdaWcagCovered`
  - WAVE: `btnRunWave`, `waveOpenReport`, `waveOpenHint`, `waveMockNotice`, `waveKeyPresentButMock`, `waveKeyMissing`, `waveErrorsTitle`, `waveContrastTitle`, `waveAlertsTitle`, `waveColCode`, `waveColLabel`, `waveColCount`, `waveColWcag`, `waveColSeverity`
- Total: **590 keys per locale** (was 561), full EN/NO/ES parity.

**Tests**

- **MODIFIED** `backend/tests/smoke_red_cross_qa.py` — **2 new checks**:
  - NVDA: script contains `Insert + Ctrl + N`, `Insert + T`, `Insert + F7`, `Tab`, "Expected announcement", "WCAG SC", at least one mention of `1.3.1`; ≥8 steps; ≥5 WCAG SCs covered.
  - WAVE: all 6 categories present (errors, contrast_errors, alerts, features, structural_elements, aria), `wave_report_url` starts with `https://wave.webaim.org/report#/`, `errors_detail` / `contrast_detail` / `alerts_detail` are lists, `used_api` is `False` (mock-first guarantee).
- Total smoke checks: **20** (was 18). All pass without Mongo, without LLM, without `WAVE_API_KEY`.

**Docs**

- `README.md` — Red Cross QA section now lists 37 endpoints / 20 smoke checks / 590 i18n keys; tab 9 row rewritten to describe the 3-tool selector.
- `docs/CHANGELOG.md` — this entry.
- `.claude/MODULES_REFERENCE.md` — Red Cross QA module updated to 37 routes + Phase G endpoints.

**Architectural notes**

- **No new tabs**, no new prompts. NVDA + WAVE fold into the existing Accessibility tab.
- **NVDA is deterministic by design.** Keyboard shortcuts, expected announcements, WCAG SC mapping must NOT drift between runs — they're baked-in templates, not LLM-generated.
- **WAVE is mock-first by default.** A real API call to `https://wave.webaim.org/api/` would require `WAVE_API_KEY` env var; the mock path returns a shape-identical report so swapping in real API results later is a one-line change.
- **Backward compatible.** Existing axe + Lighthouse flow unchanged; the tool selector defaults to `axe` so existing workflows keep working without retraining.

---

## [1.10.0] - 2026-05-12

### Added — Red Cross Web QA · Phase F: Tom's tooling tips for the rodekors.no NextJS rebuild

Tom (Tech leder, Røde Kors) gave three tooling tips in Slack on 2026-05-12:
1. *"Frontend er laget med NextJS, så vi bruker Storybook for React/Next"*
2. *"Playwright er bundlet med Storybook, så vi bruker det i stedet for Cypress, siden verktøy-integrasjonen er på plass allerede"*
3. *"Postman blir nyttig for å få testet GraphQL-grensesnittene fra Guillotine/XP"*

Phase F lands all three in the agent — no new tabs (folded into existing Playwright + Cypress + API QA + Dashboard tabs).

**Backend**

- **MODIFIED** `backend/services/red_cross_qa.py`:
  - `generate_playwright_tests` recognises a new `scenarioStorybook` scope. When present, the generator ALWAYS emits a deterministic `storybook.spec.ts` (template-based, not LLM-generated) that uses `@storybook/test-runner` patterns: `iframe.html?id=...` URL, axe-core injection per story with WCAG 2.2 AA tag profile (`wcag2a/wcag2aa/wcag22aa`), keyboard interaction sanity check. Targets Designsystemet canonical story IDs (`button--primary`, `textfield--default`, `alert--info`).
  - **NEW** `export_postman_collection(scope, environment, lang)` — generates a Postman Collection v2.1 JSON with the 4 canonical Guillotine GraphQL queries (`GetDistrictPage`, `GetActivityList`, `GetCampaignPage`, `GetForeningContacts`), parameterised with `{{base_url}}` + `{{token}}` variables, per-request tests asserting status 200 + no GraphQL errors. Persists to `red_cross_qa_generated_scripts_collection` for traceability.
  - **NEW** `run_graphql_introspection(url, environment, lang)` — mock-first introspection of the Guillotine schema. Returns 5 canonical operations (`guillotine.get`, `guillotine.query`, `guillotine.getChildren`, `guillotine.getSite`, `guillotine.getReferences`) and 8 Røde Kors content types (`rodekors:Distrikt`, `Forening`, `Aktivitet`, `Kontaktperson`, `Kampanje`, `TjenesteKurs`, `Tema`, `Nyhet`). Also returns the canonical `__schema` introspection query as documentation.
- **MODIFIED** `backend/routers/red_cross_qa.py`:
  - 2 new Pydantic models: `PostmanExportRequest` + `GraphqlIntrospectionRequest`.
  - 2 new endpoints: `POST /export-postman-collection` + `POST /run-graphql-introspection`.
  - Total route count: **35** (was 33).

**Frontend**

- **MODIFIED** `frontend/src/red-cross-qa/Playwright.jsx`:
  - New scope `scenarioStorybook` (icon 📚, color `#a16207`).
  - Amber Tom-tip banner under the PageHero quoting the Storybook bundling tip.
- **MODIFIED** `frontend/src/red-cross-qa/Cypress.jsx`:
  - Yellow soft-deprecation notice at the top recommending Playwright (Tab 3) for this project, with Cypress kept for ad-hoc/non-Storybook needs.
- **MODIFIED** `frontend/src/red-cross-qa/ApiQA.jsx`:
  - Blue Tom-tip banner under the PageHero quoting the Postman/GraphQL tip.
  - New **"🔍 GraphQL schema introspection"** panel: table of operations (name / args / returns / note) + grid of content types with their fields + collapsible `__schema` query viewer.
  - New **"📦 Export Postman Collection (Tom's workflow)"** panel: button that calls the backend, receives the collection JSON, and triggers a browser download of `rodekors-guillotine.postman_collection.json`. Success badge shows filename + operation count.
- **MODIFIED** `frontend/src/red-cross-qa/Dashboard.jsx`:
  - New **"💡 Tom's tooling stack for rodekors.no"** panel under the stat cards, with 4 colored TipCards (NextJS, Storybook, Playwright, Postman) + attribution line.

**i18n**

- **27 new keys × 3 locales** (EN / NO / ES) under existing `redCrossWebQaModule.*` blocks:
  - `playwright.scenarioStorybook` + `playwright.tomTipLabel` + `playwright.tomTipText`
  - `cypress.tomNoticeLabel` + `cypress.tomNoticeText`
  - `apiQa.tomTipLabel` + `apiQa.tomTipText` + `apiQa.introspectionTitle` + `apiQa.introspectionHint` + `apiQa.btnIntrospect` + `apiQa.operationsTitle` + `apiQa.contentTypesTitle` + `apiQa.opName` + `apiQa.opArgs` + `apiQa.opReturns` + `apiQa.opNote` + `apiQa.showIntrospectionQuery` + `apiQa.postmanTitle` + `apiQa.postmanHint` + `apiQa.btnExportPostman` + `apiQa.postmanDownloaded`
  - `dashboard.tomTipsTitle` + `dashboard.tomTipNextjs` + `dashboard.tomTipStorybook` + `dashboard.tomTipPlaywright` + `dashboard.tomTipPostman` + `dashboard.tomTipsAttribution`
- Total: **561 keys per locale** (was 534), full EN/NO/ES parity.

**Tests**

- **MODIFIED** `backend/tests/smoke_red_cross_qa.py` — **3 new checks**:
  - Playwright Storybook scope: when `scenarioStorybook` is in scopes, output contains `axe-playwright`, `iframe.html`, `storybook-root`, `wcag22aa`.
  - Postman Collection: valid v2.1 schema, 4 canonical operations, `base_url` + `token` variables, every request has a test script asserting no GraphQL errors.
  - GraphQL introspection: ≥5 operations including `guillotine.get` and `guillotine.query`, content types include Distrikt/Aktivitet/Kampanje, `__schema` in introspection_query.
- Total smoke checks: **18** (was 15). All pass without Mongo, without LLM.

**Docs**

- `README.md` updated — Red Cross QA section now reflects 20 tabs / 35 endpoints / 18 smoke checks / 561 i18n keys + Phase F additions to tabs 1, 3, 4, 5.
- `docs/CHANGELOG.md` — this entry.
- `.claude/MODULES_REFERENCE.md` — Red Cross QA module updated to 35 routes + Phase F endpoints.

**Architectural notes**

- **No new tabs, no new prompts.** Phase F folds Tom's tips into existing tabs (Dashboard / Playwright / Cypress / API QA), keeping the 20-tab shell unchanged.
- **Storybook spec is deterministic.** The template lives in `_storybook_playwright_spec()` rather than passing through the LLM, so the output is identical every time — workshop-demo friendly and doesn't drift if the LLM goes down.
- **Backward compatible.** Existing Playwright scopes still work; Cypress tab still works (just shows the deprecation banner); `analyze-api` still works (the 2 new endpoints sit alongside it).
- **Mock-first preserved.** Postman export uses curated query templates, not LLM-generated. GraphQL introspection returns a curated baseline when no live URL is reachable. Both work offline.

---

## [1.9.0] - 2026-05-12

### Added — Homo Sapiens vs. AI · Phase E: Persistent Prompt Evolution with human-in-the-loop governance

Closes the **Option-C feedback loop** that was deliberately deferred in 1.8.0 for "silent drift" risk. The risk is mitigated with a small regression harness + a human approval gate + an LLM refusal path. Every action lands in an append-only audit log; rollback is one click away.

**Backend**

- **NEW** `backend/services/prompt_evolution.py` (~480 lines) — `get_active_prompt`, `list_revisions`, `propose_revision`, `approve_revision`, `reject_revision`, `rollback_to`, `run_regression`. Mock-first graceful degradation: every async function returns deterministic fallback data when MongoDB is unavailable. `_safe_parse_json` is robust against ```` ```json fences ```` and surrounding LLM prose. `_score_output` is deterministic: keyword coverage + length sanity + markdown structure — no LLM in the scoring loop so the same numbers come out every run.
- **NEW** `backend/routers/prompt_evolution.py` (7 endpoints under `/api/agi/homo-vs-ai/prompt-evolution/*`):
  - `POST /propose` — LLM #2 proposes a revised system prompt; persists `pending` or `refused`.
  - `GET /revisions?task=&status=&limit=` — list with filters.
  - `POST /{id}/approve` — human approval gate; supersedes prior active.
  - `POST /{id}/reject` — reject with reason (audit log).
  - `POST /{id}/regression` — runs curated harness base vs proposed, returns side-by-side scores + aggregate verdict (`no_regression` / `mixed` / `regression`).
  - `POST /{id}/rollback` — re-activate a previously superseded revision.
  - `GET /active/{task}` — debug helper.
- **NEW** `backend/data/regression_samples.json` — 3 curated inputs per task (`must_appear` keywords, `min_chars` / `max_chars`, `must_contain_markdown` flag). Used by the harness; keep small (workshop demo can't wait 30s).
- **MODIFIED** `backend/services/homo_vs_ai_service.py` → `run_challenge` reads from `get_active_prompt(task)` first; falls back to `TASK_SPECS[task]["system"]` when no revision is active or Mongo is unavailable. Response now carries `prompt_source: { source: 'baked_in' | 'evolved', revision_id?, version?, approved_by?, approved_at? }`.
- **MODIFIED** `backend/routers/homo_vs_ai.py` → `ChallengeResponse` carries new `PromptSourceMeta` (Pydantic model).
- **MODIFIED** `backend/app.py` → registers `prompt_evolution_router`.
- **NEW** `backend/db.py` collections: `homo_vs_ai_prompt_revisions` (versioned prompt history) + `homo_vs_ai_prompt_audit` (append-only).

**LLM refusal path (governance safeguard)**

The meta-prompt (`PROPOSE_SYSTEM_PROMPT` in `prompt_evolution.py`) explicitly instructs LLM #2 to **refuse** revisions that risk silent drift: removing ISTQB anchoring, dropping the bilingual hint, narrowing the prompt to the sample input, contradictory feedback, etc. Refusals are persisted with `risk_flags` and `refusal_reason` so the workshop host can see what the LLM caught. Refused revisions can be archived from the panel.

**Frontend**

- **MODIFIED** `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx`:
  - Yellow **🧬 Propose persistent revision** button next to the existing grey *Re-run with feedback* button (same precondition: requires an AI answer + human feedback).
  - Per-card pending/refused result panel (rationale + risk flags + revision_id).
  - Green **🧬 Evolved prompt v3** badge when the AI answer used an evolved prompt.
  - **NEW** `PromptEvolutionPanel` section (Section 07) — filters by task + status, expandable revision cards with base/proposed/feedback/previous-AI side-by-side, action buttons (Approve / Reject / Regression / Rollback), regression results viewer with per-sample drill-down.
- **MODIFIED** `frontend/src/api/agiApi.js` — 7 new helpers: `proposePromptRevision`, `listPromptRevisions`, `approvePromptRevision`, `rejectPromptRevision`, `rollbackPromptRevision`, `runRegressionHarness`, `getActivePromptForTask`.

**i18n**

- **34 new `homoVsAi.evolve.*` keys × 3 locales** (EN / NO / ES) — all native quality, fully translated. Covers the propose button, the per-card result panel, all governance panel labels (filters, statuses, actions, prompts, regression view).
- `homoVsAi.future.lead` updated in EN/NO/ES to call out Phase E shipping.
- `homoVsAi.future.ideas[0].status` changed from "Shipped · Option B" to "Shipped · Option B + Option C (Phase E)".
- `homoVsAi.future.ideas[0].options[2]` (formerly "C · Persistent prompt evolution" deferred) now marked **shipped · Phase E** with the regression harness called out explicitly.

**Tests**

- **NEW** `backend/tests/smoke_prompt_evolution.py` — 8 checks: `_safe_parse_json` robustness (5 cases incl. fenced JSON + noise), `_score_output` determinism (good→pass, poor→fail, empty→fail), `get_active_prompt` backward-compat (None when no revision), `propose_revision` graceful refusal when LLM unavailable, propose→reject state transition, `run_regression` graceful degradation, router registration (7 routes), `ChallengeResponse.prompt_source` default = `baked_in`. All checks pass without Mongo (mock-first) and without an LLM (auto-refusal path).
- Existing `backend/tests/smoke_red_cross_qa.py` still passes 15/15 — Phase E added no regressions to other modules.

**Docs**

- `README.md` updated — AGI Hub section now lists Phase E with all 7 endpoints, Mongo collections, validation status.
- `docs/README_FULL.md` updated — Tab 4 backend section adds a "Phase E — Prompt Evolution governance" subsection with full endpoint catalogue.
- `docs/README_INDEX.md` — first index entry for AGI Hub added (was missing).
- `.claude/MODULES_REFERENCE.md` — module #14 entry added for AGI Hub.

**Architectural notes**

- **Backward-compatible by design.** If the new Mongo collections are empty (or Mongo is down entirely), `get_active_prompt` returns `None` and `run_challenge` keeps using `TASK_SPECS` exactly as before 1.8.0. Existing flows cannot regress just by enabling this module.
- **Append-only audit.** Revisions are never deleted, only soft-marked (`pending` → `active` / `rejected` / `superseded` / `refused`). Status transitions write an entry to `homo_vs_ai_prompt_audit` with actor, action, timestamp, detail.
- **No auto-promotion.** The LLM proposes, a human approves. The only "automatic" status move is `superseded` when a newer revision is approved for the same task.
- **MVP scope (deliberate).** Prompt evolution is wired into `/challenge` only. `/route` and `/judge` keep their fixed system prompts. Embedding-based RAG remains deferred (BM25 covers semantic queries well enough for the workshop).

---

## [1.8.0] - 2026-05-06

### Added — Homo Sapiens vs. AI: ephemeral feedback re-run + local ISTQB RAG

**Ephemeral “Re-run with feedback” (former Future improvement · Option B)**

- `POST /api/agi/homo-vs-ai/challenge` accepts optional paired fields `previous_ai_output` and `feedback`. When both are set, a one-shot block is appended to the system message so the model revises its answer; core `TASK_SPECS` prompts are unchanged (no drift between rounds).
- Workshop UI: each live round has a textarea + **Re-run with feedback** under the vote bar (`HomoSapiensVsAI.jsx`).

**Hybrid local-only ISTQB RAG (former Future improvement · Option C)**

- New `backend/services/istqb_local_rag.py`: when `x-api-provider` is `itemai` or `itemserverai`, BM25 (`rank-bm25`) retrieves windowed text chunks from `docs-ISTQB/*.pdf` (pypdf) and appends excerpts to the system prompt for **challenge**, **route**, and **judge**. Cloud providers still get only curated JSON anchors.
- Responses include `istqb_rag: { mode, chunks_used, sources, caveat }`.
- `GET /api/agi/homo-vs-ai/istqb-rag-status` — PDF count, indexed chunk count, whether the request provider is RAG-eligible.

**Docs / i18n**

- “Future improvements” footnote updated (EN/NO/ES) to mark B+C as shipped; Option C persistent prompt evolution remains documented but not implemented.

---

## [1.7.1] - 2026-04-14

### Added — ISTQB-anchored prompts (Homo Sapiens vs. KI i Test)

Small, low-risk iteration on top of 1.7.0 that grounds every LLM call in the module against real ISTQB syllabi sections. Authored ahead of the SOCO workshop to give the testing tone measurable credibility with testers in the audience. Shipped as **Option A — curated anchors**: hand-written JSON with section numbers and one-line summaries, validated against the actual PDFs. Full RAG is parked as a future improvement (see below).

**Backend:**
- `backend/data/istqb_anchors.json` (new) — curated anchors for:
  - all 10 live rounds (1-3 anchors each, drawn from CTFL v4.0 and CT-AI v1.0)
  - the Problem Router (routing is itself an ISTQB skill — CTFL §4.1 / §5.1.5)
  - the AI Judge (judging test quality — CTFL §5.3.1 / CT-AI §8.8)
  - a compact Norwegian glossary (~30 terms, majority authoritative from ISTQB-NO v2.4 by Norwegian Testing Board; a handful flagged `approx: true` where the 2016 NO glossary does not cover the term — e.g. automation bias, metamorphic testing, concept drift)
  - metadata block with ISTQB license note: syllabi stay gitignored under `docs-ISTQB/`, only short curated summaries live in the JSON
- `backend/services/istqb_anchors.py` (new) — thin cached loader exposing:
  - `get_anchors(kind, key)` — raw block access
  - `build_istqb_prompt_block(kind, key, language)` — 80-150-token text block appended to system prompts (advisory wording, plus NO terminology only when language hint is `no`)
  - `anchors_summary_for_response(kind, key)` — JSON-serialisable list consumed by the frontend badge
  - fully tolerant: missing file / malformed JSON / missing key → empty block, the module keeps working
- `backend/services/homo_vs_ai_service.py`:
  - `run_challenge()` now injects the task's ISTQB block into the system prompt and returns `istqb_anchors: [...]` in the response
  - `_router_system_prompt()` appends the router's ISTQB anchors; `route_problem()` returns them on success *and* on both fallback paths
  - `_judge_system_prompt()` appends **both** the judged task's anchors *and* the judge-generic anchors (so the judge knows what a strong answer looks like for the task AND what "quality" means in general)
  - `judge_round()` returns the combined anchor list on success and fallback

**FastAPI contract:**
- `backend/routers/homo_vs_ai.py`:
  - New Pydantic model `IstqbAnchor` = `{ syllabus: str, section: str, summary: str }`
  - `ChallengeResponse`, `RouteResponse`, `JudgeResponse` now carry `istqb_anchors: List[IstqbAnchor]` (defaults to `[]` — 100% backwards compatible with existing clients)

**Frontend:**
- `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx`:
  - New `IstqbBadge` component — `📚 ISTQB-anchored` pill, clickable, expands to a compact list of the exact syllabi sections used for that prompt, with a license footnote
  - `DemoCard` — badge rendered in the round header next to the title after the first Run AI call (per round, independent state)
  - `ProblemRouter` — badge rendered in the "AI recommends" result card header (shared across all router anchors)
  - `JudgeAdvisoryPanel` — badge rendered next to the confidence chip (so the judge verdict is visibly tied to both the task's syllabi and the judge rubric)
- `frontend/src/i18n/locales/en/common.json` + `frontend/src/i18n/locales/no/common.json`:
  - New block `homoVsAi.istqb.*` = `{ badge, tooltip, title, footnote }` in both locales, with native-quality Norwegian wording ("ISTQB-forankret", "Pensum-seksjonene denne prompten er forankret i", etc.)

**Future improvements footnote extended:**
- Second parked idea added: "Full ISTQB RAG pipeline" with three documented options:
  - Option A (curated anchors) — what this release ships
  - Option B (full cloud RAG) — deferred due to ISTQB licensing restrictions on full-text use with cloud LLMs
  - Option C (hybrid local-only RAG) — recommended path forward: full RAG only when a local provider (LM Studio / Ollama) is active, automatic fallback to Option A for any cloud provider. Both EN and NO copies carry the full three-option breakdown and a `tradeoff` explaining why this is deferred until post-workshop.

**Notes and trade-offs:**
- The block is **advisory** ("you MAY anchor your reasoning…") — the LLM is not forced to parrot section numbers. This keeps tone credible without making answers robotic.
- Token footprint: ~80-150 tokens per prompt — small enough not to eat into the model's working context.
- Norwegian terminology block is only appended when the language hint is Norwegian, to avoid bloating English runs.
- All file paths (`docs-ISTQB/`) remain gitignored; no syllabus PDFs are committed or transmitted.

---

## [1.7.0] - 2026-04-14

### Added / Changed — Homo Sapiens vs. KI i Test (post-1.6.0 iteration pack)

Accumulated improvements to the SOCO workshop tab since the initial 1.6.0 release. The tab evolved from a 4-round proof of concept into a polished 10-round workshop module with an AI-driven problem router, an advisory AI judge, and a footnote of parked future ideas.

**Head-to-head demos — expanded from 4 to 10 rounds (1:1 with the Activity Matrix):**
- `backend/services/homo_vs_ai_service.py` — `TASK_SPECS` grew from 4 to 10 active tasks plus `tests_from_code` kept as a legacy entry (omitted from the live grid):
  - Existing: `scenarios`, `ambiguities`, `followups`
  - New: `risk`, `exploratory`, `automation`, `testData`, `oracle`, `triage`, `accessibility`
  - Each new prompt is testing-literate (Rex Black / James Bach / Kaner / Hendrickson / Adzic / Nielsen references baked into the system prompt)
- `backend/routers/homo_vs_ai.py` — `TaskLiteral` updated to enumerate all 11 tasks (fixes a latent Pydantic 422 that would have fired for the new rounds)
- `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx` — `DEMO_TASKS` array grew to 10 in the same 1:1 order as the Activity Matrix rows
- Quick-navigation chip bar ("Jump to Round N") added above the demo grid — each chip scrolls smoothly to the targeted demo card so the presenter can hop between rounds without scrolling manually

**Editable human panel (per-round):**
- Each demo card's "Human tester (prewritten)" panel is now editable in place via a ✏️ Edit button: participants can replace, clear, or restore the prewritten answer before comparing against the AI
- Edits are dirty-tracked: if the user edits, language switches mid-session no longer overwrite the group's work; an un-edited panel still mirrors the active locale
- Buttons: Edit / Save / Clear / Restore prewritten — all i18n-driven

**Problem Router ("Step 0") — free-form problem → AI picks the best round:**
- New panel at the top of Section 03, styled as "Step 0 · Problem Router"
- Backend endpoint `POST /api/agi/homo-vs-ai/route { problem, language? }` returns `{ recommended, rationale, runner_ups[], raw? }`
- Frontend UX: textarea → "Find best round" button → recommended round card with rationale + up to 2 alternatives. Each recommendation has "Use this problem in Round N" (pre-populates the demo's input textarea and scrolls to it) and "Just jump to round" (navigation only)
- **Router prompt v2 refinements** (same day, after a false-positive routing on a Norwegian user story):
  - Rewrote task catalog with explicit "PICK THIS when…" / "DO NOT pick this when…" rules to reduce overlap between adjacent tasks (notably `scenarios` vs `ambiguities`, `oracle` vs `ambiguities`, `triage` vs `followups`)
  - Added an ordered **decision rubric** (10 rules, stop-at-first-match) so the LLM has a consistent tiebreaker when multiple tasks could apply
  - Added 4 **few-shot examples** covering the most common mis-routing failure modes (user story → scenarios; release scope → risk; vague bug → followups; vague terms → ambiguities)
  - Named common **anti-patterns** explicitly: a user story starting with "As a user" / "Som bruker" is NOT automatically `ambiguities` — most route to `scenarios`
  - Temperature lowered from 0.2 to 0.1 (routing is classification, not creativity); `max_tokens` trimmed to 450
- API helper: `routeTestingProblem({ problem, language })` in `frontend/src/api/agiApi.js`

**AI Judge (advisory) — head-to-head verdict:**
- New backend endpoint `POST /api/agi/homo-vs-ai/judge { task, human_answer, ai_answer, user_input?, language? }` returns `{ verdict: human|ai|tie, confidence: low|medium|high, rationale, criteria: { accuracy, coverage, practical_value }, raw? }`
- Service function `judge_round` with dedicated system prompt that:
  - Explicitly warns the LLM about **self-preference bias** (LLMs tend to favour longer / more structured / bullet-heavy outputs when judging other LLMs' work — cites Anthropic / Berkeley / Stanford 2023-2024 research in the prompt itself)
  - Supplies a per-task quality **rubric** (`JUDGE_CRITERIA` dict, one concise paragraph per task) grounded in the existing `TASK_SPECS`
  - Includes the original input alongside both answers so the judge can verify each answer actually addresses the prompt (prevents "beautifully written answer to the wrong question" from winning)
  - Temperature 0.1, strict JSON output with graceful fallback (tie + low confidence + raw payload for debugging)
- Frontend UX:
  - New purple **"🧠 Ask AI to judge"** button sits in the vote bar next to the three `+1` human vote buttons, separated by a subtle divider. Disabled until both the human answer and the AI output are non-empty
  - `JudgeAdvisoryPanel` renders below the vote bar when a verdict arrives: verdict label (🧑 / 🤖 / 🤝), colour-coded confidence pill, full rationale, three-cell criteria breakdown (Accuracy / Coverage / Practical value), and a **self-preference bias disclaimer** ("this verdict is advisory — the scoreboard only counts your vote")
  - Running the AI again, or resetting to sample, clears the stale judge result
- **Design: advisory-only by explicit choice (option A in the design discussion):**
  - The AI judge NEVER writes to the scoreboard directly — the human presenter still casts the canonical `+1` vote
  - When the human votes, the judge's verdict at that moment is attached as a snapshot (`aiJudge` field) and rendered as a **badge in the Scoreboard round log**:
    - empty → `—` discreet dash
    - judge agreed with human → **green `🤖 agreed`**
    - judge disagreed → **amber `🤖 said X`** with tooltip noting possible self-preference bias
  - JSON export now carries `task`, `humanVote`, `aiJudge` per round — auditable retrospective of how often the AI and the room agreed
- **Why this design**: turns the known self-preference bias into a didactic moment instead of silently poisoning the scoreboard — aligns with the workshop's critical-thinking framing
- API helper: `judgeTestingRound({ task, humanAnswer, aiAnswer, userInput, language })` in `frontend/src/api/agiApi.js`

**AGI Progress Hub promoted from Help submenu to top-level sidebar entry:**
- `frontend/src/Sidebar.jsx` — `agi-progress` removed from the Help submenu and added as a standalone entry in the `developer` group, immediately below **Run Test** and above **API Config**
- Icon upgraded from the (missing) `chart` key to `bar-chart` (📊) — the former fell back to 📄 because it wasn't in the icon map
- Rationale: 4 tabs + AI enrichment + full SOCO workshop module no longer fit the "system help" shelf
- No routing changes in `App.jsx`: the switch on `section === "agi-progress"` still resolves to `AgiProgressPage`
- i18n (`sidebar.agiProgress`) was already a flat key — no translation changes needed

**Future improvements parking lot:**
- New `FutureImprovementsNote` component rendered as a footnote at the bottom of the workshop tab, beneath the Speaker Crib Sheet. Deliberately styled as a muted footnote (dashed border, 11-12 px italic) — NOT a new section — to avoid UI noise during the live workshop
- Ships with one parked idea: **"Per-round feedback loop with AI self-improvement"**, documenting three possible design variants (A: feedback log only · B: ephemeral injection — the preferred live-demo flavour · C: persistent prompt evolution with rollback) and a clear "Why deferred" paragraph so the next maintainer has context instead of starting from zero
- Bilingual EN/NO with native Norwegian in `homoVsAi.future.*`

**i18n additions (EN + NO):**
- `homoVsAi.demos.*` new sub-block `judge.*` (17 keys: kicker, button, running, disabledHint, errorPrefix, verdict*, confidence*, criteria*, biasDisclaimer, rawToggle)
- `homoVsAi.scoreboard.aiJudge*` (5 keys: None, Agree, Disagree, AgreeTitle, DisagreeTitle)
- `homoVsAi.router.*` — new block for Problem Router (14 keys)
- `homoVsAi.future.*` — new block for the parking lot (kicker, lead, tradeoffPrefix, ideas[])
- Norwegian written natively (bokmål), keeping testing/AI jargon close to the English form where that is how Norwegian testers speak (ISTQB, oracle, exploratory, self-preference bias, boundary, WCAG)

**Developer notes:**
- No new frontend dependencies; MarkdownLite, the judge panel, the badges and the footnote are all inline
- Backend `JUDGE_CRITERIA` mirrors `TASK_SPECS` — if either drifts the judge becomes noisy; the comment in the service flags this explicitly
- Problem Router v2 rubric + few-shot is deterministic enough at `temperature=0.1` that "Som bruker ønsker jeg å logge inn med Google…" now reliably routes to `scenarios` (was routing to `ambiguities` before the rewrite)

---

## [1.6.0] - 2026-04-14

### Added — AGI Hub "Homo Sapiens vs. KI i Test" tab (SOCO workshop companion)

A fourth tab dedicated to the "Homo Sapiens vs. KI" workshop hosted by Ola Kleiven and Keyhan Farahaninia at SOCO. Built to be **demo-ready on a projector**: everything fits in one scroll, no nested navigation to get lost in while presenting.

**Frontend — one big self-contained page with 6 sections:**
- `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx`:
  1. `WorkshopHero` — SOCO kicker, hosts callout, 3 reflection questions as visual anchors
  2. `ActivityMatrix` — 10 testing activities × 3 verdicts (human / AI / hybrid) with rationale + confidence
  3. `HeadToHeadDemos` — 4 interactive rounds (scenarios / ambiguities / followups / tests_from_code) with side-by-side "human prewritten" vs "AI live" panels and per-round vote bar
  4. `TrustFramework` — 7-dimension decision grid ("AI excels when… / Humans excel when… / Practical rule")
  5. `WorkshopScoreboard` — configurable group names, note-per-round, undo, reset, JSON export, auto-fed from vote buttons
  6. `SpeakerCribSheet` — collapsible speaker-only panel with 60-sec opener, 4 curated quotes (Bach/Kaner/Hendrycks/Amodei) with "use when" hints, 5 likely Q&A pairs, closer
- `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx` also ships a tiny inline `MarkdownLite` renderer (~30 lines) so AI output displays with headings / bullets / bold without adding a dependency
- `frontend/src/pages/help/AgiProgressPage.jsx` — fourth tab wired (icon 🧑‍💻)
- `frontend/src/api/agiApi.js` — `runTestingChallenge({ task, input, language })` helper using `fetchWithAuth` (API Config headers forwarded)

**Backend — dedicated workshop router:**
- `backend/services/homo_vs_ai_service.py`:
  - Four testing-literate prompts (ISTQB + context-driven school vocabulary: risk, oracle, exploratory, boundary, heuristics)
  - Shared dispatcher `run_challenge(task, user_input, language, request_headers)` over `ask_ai_unified` with language-aware hint (answers in input's language; explicit "no"/"en" override)
- `backend/routers/homo_vs_ai.py`:
  - `POST /api/agi/homo-vs-ai/challenge` — dispatches to one of {scenarios, ambiguities, followups, tests_from_code}
  - `GET /api/agi/homo-vs-ai/tasks` — discovery of available challenges
  - Forwards API Config headers (`x-api-provider`, `x-openai-key`, `x-openrouter-key`, `x-itemai-*`) so the model selection from the UI is respected
- `backend/app.py` — router registered next to the AGI enrichment router

**i18n — native-quality Norwegian (primary workshop language):**
- Top-level `homoVsAi.*` block added to both `locales/en/common.json` and `locales/no/common.json`
- Norwegian copy written in the register an actual Norwegian tester uses, keeping industry terms in English (`exploratory`, `oracle`, `boundary`, `edge case`, `risk-based`, `bug`, `happy path`, `race`) where that is how Norwegian testers speak in practice
- New `help.agiTabs.homoVsAi` label in both locales
- Ships prewritten human answers for all 4 demo rounds in both languages so the presenter has solid baseline content to read out loud before hitting "Run AI"

**Design principles honoured:**
- Non-destructive: the scoreboard, notes and vote history are session-only by design (no DB writes) — the workshop artifacts live in the exported JSON
- No new frontend dependencies (MarkdownLite is inline)
- All text i18n-driven so the language switcher in the app header flips the whole tab between English and Norwegian in one click

**Docs:**
- `README.md` — new section "AGI Hub — 'Homo Sapiens vs. KI i Test' tab" with a pointer to the presenter checklist
- `docs/README_FULL.md` — Tab 4 documented end-to-end: activities, endpoints, language hint behaviour, plus a new **"How to run this in a live workshop"** checklist (pre-flight, 45-minute run order, AI-failure fallback narrative, post-workshop JSON export)
- `docs/README_FULL.md` Table of Contents updated to reference the fourth tab

---

## [1.5.0] - 2026-04-14

### Added — AGI Hub "Update with AI" (live web + LLM enrichment)

All three AGI Progress Hub tabs now expose a non-destructive "Update information from the web with AI" panel that pulls live web context and asks the configured LLM for structured, review-and-apply suggestions.

**Backend — new service + router:**
- `backend/services/agi_ai_enrich_service.py` — web search cascade with graceful fallback:
  1. **Primary**: `websearch-backend` (Node, port 8080) via POST `/web-search`
  2. **Fallback**: DuckDuckGo HTML scrape (`html.duckduckgo.com`) when the Node service is unreachable
  3. **Last resort**: LLM-only best-effort (marked `source: "none"` in the response)
  - Three tab-specific prompts (Tracker / Endings / Benefits), each with its own strict-JSON output schema
  - JSON extraction tolerates fenced output and trailing prose
- `backend/routers/agi_ai_enrich.py` — new namespace `POST /api/agi/ai-enrich/{tracker|endings|benefits}`
  - Pydantic request/response schemas (`TrackerEnrichRequest`, `EndingsEnrichRequest`, `BenefitsEnrichRequest`, `EnrichResponse`)
  - Forwards API Config headers (`x-api-provider`, `x-openai-key`, `x-openrouter-key`, `x-itemai-*`) to `ask_ai_unified`
- `backend/app.py` — router registered next to the existing AGI progress router

**Frontend — shared panel + per-tab wiring:**
- `frontend/src/pages/help/agi/AiSuggestions.jsx` — reusable button + review panel with Apply/Dismiss per suggestion, web-source label, empty/error states, and raw-LLM debug drawer when JSON parsing fails
- `frontend/src/api/agiApi.js` — `enrichTracker()`, `enrichEndings()`, `enrichBenefits()` helpers that route through `fetchWithAuth` (so API Config headers travel automatically)
- `frontend/src/pages/help/agi/AgiTracker.jsx` — Apply **persists** via the existing `POST /api/agi/progress` (upsert). Validates `sum(scores) == total` and flags mismatches. Updates the in-memory list so the chart and dropdown reflect the new model immediately.
- `frontend/src/pages/help/agi/PossibleEndings.jsx` — Apply is **session-only**. Three suggestion kinds:
  - `quote` → overrides the quote/attribution of the targeted ending (I–XII) with an "AI UPDATED" badge
  - `pdoom` → appends a new card to the P(doom) banner with an "AI" badge
  - `reference` → appends a new card to the Sources & References panel with an "AI" badge
- `frontend/src/pages/help/agi/BenefitsOfAGI.jsx` — Apply is **session-only**: each accepted suggestion is appended as a new bullet to the target category with an "AI" badge and source link

**i18n:**
- EN + NO keys under `ai.*` in `common.json` (button label, states, web-source labels, apply/dismiss, empty/raw)
- Norwegian strings written natively (no machine translation tags)

**Persistence model (confirmed with user):**
- Tracker: DB-backed (upsert into the existing `agi_progress` collection)
- Endings + Benefits: in-memory / session-only by explicit design — avoids drift of curated scenario copy
- Nothing is ever applied server-side; every change passes through the user's Apply button

---

## [1.4.0] - 2026-04-14

### Added — AGI Progress Hub (restructuring of Help → AGI Progress)

The single-page "AGI Progress Tracker" was restructured into a three-tab hub, AgentOps-style, and the dataset was updated through 2026.

**Frontend — new tab container and components:**
- `frontend/src/pages/help/AgiProgressPage.jsx` — converted from a single page to a tab container (Tracker / Endings / Benefits)
- `frontend/src/pages/help/agi/AgiTracker.jsx` — original tracker content, now a child tab; dropdown synchronized with charts on first render
- `frontend/src/pages/help/agi/PossibleEndings.jsx` — iceberg visualization + 12 AGI ending scenarios in 3 zones (Surface / Shallow / Deep), with zone filter
- `frontend/src/pages/help/agi/BenefitsOfAGI.jsx` — categorized cards: Health, Science, Education, Productivity, Accessibility, etc.
- `frontend/public/images/agi-endings-iceberg.png` — iceberg asset

**Backend — dataset refresh and idempotent seed:**
- `backend/routers/agi_progress.py` — `DEFAULT_DATA` expanded from 2 to 5 models through 2026:
  - GPT-4 (2023) 27%, GPT-5 (2025) 58%, **Claude Opus 4.6 (2025) 61%**, **Gemini 3.1 Pro (2026) 61%**, **Claude Opus 4.7 (2026) 67%**
  - Each model carries real benchmark notes (GPQA Diamond, MATH-500, SWE-bench Verified/Pro, ARC-AGI-2, HumanEval)
  - Long-Term Memory Storage (MS) remains 0 for all current LLMs — explicitly documented as the architectural bottleneck from the Hendrycks paper
- Seed is now **idempotent**: uses upsert by `model`+`year` so updates to `DEFAULT_DATA` propagate to existing MongoDB deployments without wiping manually-added rows
- `POST /api/agi/progress` now upserts (previously insert-only)
- Results sorted by year then total for stable UI ordering

**UX fixes:**
- Dropdown "Model:" and chart panels now sync on first render (defaults to newest model by year+total — Claude Opus 4.7 2026)
- Benchmark context panel added under the radar showing the public benchmarks behind each model's scores

**Possible Endings — sourced citations (April 2026 follow-up):**
- Every one of the 12 endings now carries a notable quote with attribution, extracted from a curated sources compilation (~50 time-stamped references): Moravec, Tegmark, Musk, Hinton, Amodei, Altman, Hendrycks, LeCun, Suleyman, Harari, McAleer, Guterres
- New "P(doom)" banner with public estimates from Hinton (>50%), Amodei (25%, Sep 2025), AI Impacts 2024 survey (1-in-6 median), Toby Ord (~10%), and Pichai ("pretty high")
- New "Sources & References" panel with link to the primary-sources Google Doc and cards for Life 3.0, Mind Children, The Precipice, AI Impacts, aistatement.com, Anthropic Agentic Misalignment Appendix, Hinton's Guardian interview, and Altman's "The Merge"
- Scenario descriptions enriched with real references (e.g., Ending I now cites Ord's 100× nuclear, Ending XI cites Tegmark's pandemic-reversion argument)

**i18n:**
- New keys `help.agiHub`, `help.agiTabs`, `help.agiEndings`, `help.agiBenefits`, `help.agiProgress.benchmarkContext` in EN/NO
- Additional keys `agiEndings.pdoom.*`, `agiEndings.sources.*`, and per-ending `quote`/`attribution` pairs in EN/NO
- Subtitle updated to reference 2025 paper + 2026 additions
- `frontend/src/i18n/locales/{en,no}/agiHubModule.json` created; `common.json` updated with hub/tab labels

---

## [1.3.0] - 2026-04-15

### Added — Installing the App in the Cloud

New deployment planning and cloud-readiness module. Implemented in two packs:

**Pack 1 — Frontend Shell (Cursor AI):**
- 4 interactive tabs: Overview, Target Architecture, Environment & Secrets, Smoke Tests & Monitoring
- Readiness score dashboard with 6 section cards
- Architecture flow diagram with 5 service cards (2 phases)
- Environment variable reference with copy-to-clipboard and secret/public/optional classification
- Manual smoke test checklist (5 layers, per-layer progress)
- Troubleshooting guide with common deployment issues
- i18n: 92 keys EN/NO

**Pack 2 — Backend Foundation + Cloud Hardening (Claude Code):**
- Backend service: `cloud_install_service.py` (7 deterministic methods)
- Backend router: `cloud_install.py` (7 endpoints at `/api/cloud-install/*`)
- Typed schemas: `cloud_install.py` (18 Pydantic models)
- Deployment artifacts: `deployment/Dockerfile` + `deployment/cloudrun.yaml` (functional, Cloud Run-ready)
- Cloud-readiness: CORS via `ALLOWED_ORIGINS`, `MONGO_URI` env var, `/health` enhanced, `/ready` endpoint
- Frontend connected to backend (all 4 tabs) with graceful fallback if offline
- Automated smoke test runner, live troubleshooting, cost baseline panel, deployment order visualization

### Added — EA Second Brain Agent

Full Enterprise Architecture portfolio management agent:
- Portfolio CRUD with tech stack, criticality, lifecycle, EOL tracking
- Impact Scoring (Ketil 6.0 formula)
- Technology Heatmap and Deprecation Radar
- AI-powered insight generation with status workflow
- Natural language queries against portfolio
- Dashboard with stats, insights, radar, heatmap, lifecycle distribution
- Watchlist and Source Feed management
- Seed data: 8 Norwegian portfolio items, 7 insights
- Backend: 24 endpoints, 15+ models, ~500-line service
- Frontend: 5 tab components
- i18n: 172 keys EN/NO

---

## [1.2.0] - 2026-04 (Earlier April)

### Added — ATM V&V Test Copilot, Babel Library AI Intelligence, Cybersecurity Module

See root README.md for full details on these modules.

---

## [1.0.1] - 2025-12-19

### Documentation Improvements

#### Consolidated Epic 3 Documentation

**Motivation:**
- Previous structure had 3 separate files for Epic 3 (Import Guide, Phase 2, Phase 3)
- Files didn't follow consistent naming convention (EPIC3_* vs J_MESSAGES_*)
- Hard to find related documentation in file browser
- Onboarding required reading multiple disconnected files

**Changes:**
- ✅ **Created**: `J_MESSAGES_RETROSPECTIVE_LEARNING.md` (comprehensive guide)
- ✅ **Removed**: `J_MESSAGES_IMPORT_GUIDE.md` (merged)
- ✅ **Removed**: `EPIC3_PHASE2_REAL_AI_INTEGRATION.md` (merged)
- ✅ **Removed**: `EPIC3_PHASE3_PROMPT_SUGGESTIONS.md` (merged)
- ✅ **Updated**: `README_INDEX.md` (single entry for Epic 3)

**New Structure:**

```
J_MESSAGES_RETROSPECTIVE_LEARNING.md
├─ Overview & Architecture
├─ Phase 1: Data Model & Import Pipeline
├─ Phase 2: Real AI Integration
├─ Phase 3: AI-Powered Prompt Suggestions
├─ Data Structure Reference (consolidated)
├─ Testing Guide (comprehensive)
├─ Troubleshooting (all known issues)
└─ Production Deployment & Next Steps
```

**Benefits:**
- ✅ Single source of truth for all Epic 3 functionality
- ✅ Consistent naming: All J-messages docs start with `J_MESSAGES_*`
- ✅ Better file browser grouping (sorted alphabetically)
- ✅ Easier onboarding: One file to read
- ✅ Centralized troubleshooting section
- ✅ Complete data structure reference in one place

---

## [1.0.0] - 2025-12-19

### 🎉 Major Release: Epic 3 - Retrospective Learning & Prompt Refinement

Complete implementation of AI-powered continuous learning system for J-messages analysis.

### Added

#### Phase 1: Data Model & Import Pipeline
- **New MongoDB Collection**: `j_message_pairs` for storing original + human-analyzed document pairs
- **REST API Endpoints**:
  - `GET /api/j-messages/training` - List training pairs with filters
  - `GET /api/j-messages/training/{id}` - Get single pair
  - `POST /api/j-messages/training` - Create pair
  - `PATCH /api/j-messages/training/{id}` - Update pair
  - `POST /api/j-messages/training/import` - Batch import
  - `DELETE /api/j-messages/training/{pair_id}` - Delete pair
  - `GET /api/j-messages/training/stats/summary` - Statistics
- **CLI Import Script**: `backend/scripts/import_enonic_pairs.js` for JSONL batch import
- **Frontend Component**: `JMessagesPairsLibrary.jsx` with side-by-side document comparison
- **Documentation**: `J_MESSAGES_IMPORT_GUIDE.md` with 16 detailed sections

#### Phase 2: Real AI Integration
- **Evaluator Service**: `backend/services/j_messages_evaluator.py` for comparing AI vs. human analysis
- **New Function**: `analyze_text_content()` in `j_messages_analyzer.py` for reusable AI analysis
- **Evaluation Endpoints**:
  - `POST /api/j-messages/training/{pair_id}/evaluate` - Evaluate single pair
  - `POST /api/j-messages/training/evaluate-batch` - Evaluate multiple pairs
  - `GET /api/j-messages/training/{pair_id}/evaluation` - Get evaluation results
- **Metrics Dashboard**: Field-by-field accuracy display with color-coded badges
- **Evaluation Features**:
  - Overall accuracy calculation
  - Per-field accuracy (j_id, title, dates, categories, etc.)
  - String similarity for text fields
  - Date comparison with format normalization
  - Array comparison (Jaccard similarity)
  - Human-readable evaluation summaries
- **Documentation**: `EPIC3_PHASE2_REAL_AI_INTEGRATION.md` with testing guide

#### Phase 3: AI-Powered Prompt Suggestions
- **Suggestion Service**: `backend/services/prompt_suggestion_service.py` for intelligent prompt improvement
- **Meta-Prompt Builder**: Generates comprehensive prompts for LLM analysis of evaluation results
- **Smart Example Selection**: 70% low-accuracy + 30% high-accuracy pairs for balanced learning
- **API Endpoint**: `POST /api/j-messages/training/prompt/suggest`
- **Frontend Features**:
  - "💡 Suggest Prompt Improvements" button
  - Full-screen modal with suggestion display
  - Key improvements section (3-5 bullet points)
  - Side-by-side prompt comparison
  - One-click copy to clipboard
  - "Copy & Use in Prompt Manager" integration
- **Documentation**: `EPIC3_PHASE3_PROMPT_SUGGESTIONS.md` with architecture and usage guide

### Fixed

#### Critical Bugs Resolved
1. **Field Name Mismatch** (Dec 19)
   - **Issue**: MongoDB query used `evaluation.overall_accuracy` but data stored as `evaluation.overall_score`
   - **Impact**: "No evaluated training pairs found" error
   - **Files**: `j_messages_training.py`, `prompt_suggestion_service.py`

2. **Import Path Error** (Dec 19)
   - **Issue**: Incorrect import from `backend.routers.ask_ai` instead of `backend.llm`
   - **Impact**: "No module named 'routers'" error during suggestion generation
   - **Files**: `prompt_suggestion_service.py`

3. **Field Accuracy Path** (Dec 19)
   - **Issue**: Accessed `evaluation.field_accuracy` directly instead of `evaluation.metrics.field_accuracy`
   - **Impact**: Empty field accuracy in suggestions
   - **Files**: `prompt_suggestion_service.py`

4. **Import Pattern** (Dec 19)
   - **Issue**: Imports only worked when running from `backend/` directory
   - **Impact**: Failed when running from project root (standard deployment)
   - **Solution**: Implemented fallback import pattern for all services
   - **Files**: All services and routers

### Changed

- **Import Strategy**: All backend services now use fallback import pattern supporting both root and backend directory execution
- **Data Structure**: Standardized on `evaluation.overall_score` for top-level accuracy
- **Documentation**: Updated all guides with data structure references and troubleshooting sections

### Documentation

- **New Guides**:
  - `CHANGELOG.md` - This file
  - `J_MESSAGES_RETROSPECTIVE_LEARNING.md` - **Consolidated guide** covering all of Epic 3 (Phases 1, 2, 3)

- **Consolidated**:
  - Merged `J_MESSAGES_IMPORT_GUIDE.md` into consolidated guide
  - Merged `EPIC3_PHASE2_REAL_AI_INTEGRATION.md` into consolidated guide
  - Merged `EPIC3_PHASE3_PROMPT_SUGGESTIONS.md` into consolidated guide
  - **Benefit**: Single source of truth, consistent naming (J_MESSAGES_*), easier navigation

- **Updated**:
  - `README_INDEX.md` - Simplified with single Epic 3 link
  - All guides now follow J_MESSAGES_* naming convention

### Technical Debt

- **Future Optimization**: Batch evaluation could be parallelized for better performance
- **UI Enhancement**: Progress bar for long-running operations
- **Caching**: Consider caching evaluation results to avoid re-computation
- **Prompt Versioning**: Save suggested prompts as versioned entities in database

---

## [0.9.0] - 2025-12-17 (Pre-Epic 3)

### Added
- MCP Server integration for J-messages Analyzer
- Claude Desktop and Postman testing capabilities
- Risk and Vulnerability Analysis (ROS) documentation
- API configuration management
- Test automation framework

### Previous Work
See individual documentation files:
- `MCP_TESTING_GUIDE.md`
- `CLAUDE_DESKTOP_SETUP.md`
- `POSTMAN_MCP_TESTING.md`
- `J_MESSAGES_ROS_ANALYSIS.md`

---

## Version History

- **1.3.0** (Apr 15, 2026): Installing the App in the Cloud + EA Second Brain Agent
- **1.2.0** (Apr 2026): ATM V&V Test Copilot, Babel Library AI Intelligence, Cybersecurity Module
- **1.0.0** (Dec 19, 2025): Epic 3 complete - Retrospective Learning & Prompt Refinement
- **0.9.0** (Dec 17, 2025): MCP Server integration
- **0.8.0** (Earlier): J-messages Analyzer core functionality

---

## Contributors

- **Ignacio Tejera** - Product Owner & Requirements
- **AI Assistant (Claude Sonnet 4.5)** - Implementation & Documentation
- **Fiskedirektoratet Team** - Domain expertise & testing

---

## License

Internal project for Fiskedirektoratet - Not for public distribution

---

*For detailed technical information, see individual documentation files in `/docs`*

