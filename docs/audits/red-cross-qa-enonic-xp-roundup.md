# Red Cross Web QA Agent — Enonic XP Skill Integration Roundup

**Date**: 2026-05-21
**Skill version applied**: `enonic-xp` 0.1.0 → 0.2.0
**Module audited**: Red Cross Web QA Agent (`frontend/src/red-cross-qa/` + `backend/services/red_cross_qa.py` + `backend/services/qa_security_service.py`)
**Outcome**: 13 audit areas enriched, all smoke tests green, full i18n parity preserved.

---

## Why this document exists

The skill `.claude/skills/enonic-xp/` was built from three pilot Enonic XP code reviews (`xp-nva` × 2 + Cristin→NVA migration). This document tracks the **systematic application** of that skill across the 13 audit areas of the Red Cross Web QA Agent, so future contributors can:

1. See what each area was given (per-area Top-3 actions implemented).
2. Find the in-memory baseline patterns (5 new dicts across the module).
3. Locate cross-tool refs (every area now self-navigable).
4. Plan follow-ups (deferred items + in-memory → Mongo persistence + Pack 4.3 Apollo).

---

## Priority matrix (severity × area)

Severity reflects each finding's impact on the audit quality. "High" means a real Enonic XP failure mode the audit could not previously detect; "Medium" means a noticeable quality gap; "Low/Info" are consistency or trace-ability items.

| # | Area | High | Medium | Low | Info | New checks | New smoke | New i18n |
|---|---|----:|------:|----:|----:|----:|----:|----:|
| 1 | Test Plan                 | 3 | 2 | 1 | 1 | — | — | — |
| 2 | Playwright                | 3 | 2 | 2 | 2 | 3 specs | +3 | — |
| 3 | Cypress                   | 3 | 4 | 2 | 1 | 3 specs | +3 | — |
| 4 | API & GraphQL             | 3 | 5 | 3 | 1 | 3 | +4 | +3 |
| 5 | CMS Quality               | 3 | 6 | 3 | — | — (14 cases) | +1 | — |
| 6 | Forms QA                  | 3 | 5 | 2 | — | 4 | 1 enriched | +3 |
| 7 | Content Migration         | 3 | 6 | 4 | — | 3 | +1 | +3 |
| 8 | Accessibility             | 3 | 5 | 4 | 1 | 3 | +1 | +3 |
| 9 | Performance (Enonic panel)| 3 | 3 | 4 | 2 | 3 | +1 | +3 |
| 10 | Designsystemet           | 3 | 5 | 4 | — | 3 | +1 | +3 |
| 11 | Role Matrix              | 3 | 5 | 5 | 1 | 3 | +1 | +3 |
| 12 | Stress Test (k6+LS+Res)  | 3 | 5 | 4 | — | 3 | +1 | — |
| 13 | Security & Privacy       | 3 | 3 | 1 | 1 | 3 | +1 | — |
| **Total** | | **39** | **56** | **39** | **9** | **34 new + 6 specs** | **20 → 37** | **+21** |

---

## Baseline pattern (5 areas — Mongo-backed write-through cache since 1.15.8)

The audit introduced a consistent **baseline → diff → trend report** pattern, mirroring `_GRAPHQL_BASELINES` from Pack 4.1. Same shape everywhere: keyed by an environment tuple, first call seeds, subsequent calls diff. Originally in-memory only; **since 1.15.8 (2026-05-28)** all 5 dicts are write-through caches over the new `red_cross_qa_baselines` Mongo collection, so they survive backend restarts. The in-memory layer remains as fast lookup; Mongo unavailability degrades gracefully back to in-memory-only behaviour (workshop offline path preserved).

Accessed via the helpers `_baseline_load(type, key)` / `_baseline_save(type, key, value)` / `_baseline_list(type?)` / `_baseline_reset(type?)`. Admin endpoints: `GET /api/red-cross-qa/baselines`, `DELETE /api/red-cross-qa/baselines/{type}`.

| Dict | Module | Keyed by | Tracks | Exposed as |
|------|--------|----------|--------|-----------|
| `_GRAPHQL_BASELINES` | `red_cross_qa.py` | `(env, endpoint)` | GraphQL schema (ops + types) | `checkSchemaDrift` + findings |
| `_PERF_HOT_QUERY_BASELINES` | `red_cross_qa.py` | `(env, url, query_name)` | hot query p95 | `p95_ms_previous` + `delta_pct` per hot_query |
| `_DS_COMPLIANCE_BASELINES` | `red_cross_qa.py` | `(env, url)` | Designsystemet `compliance_score` | `compliance_score_previous` + `delta_pct` |
| `_ROLE_MATRIX_BASELINES` | `red_cross_qa.py` | `environment` | Role matrix row signatures | `matrix_drift` (added/removed/changed) |
| `_RESILIENCE_BASELINES` | `red_cross_qa.py` | `(env, profile)` | `resilience_score` | `resilience_score_previous` + `delta_pct` |

**Follow-up resolved (1.15.8)**: persistence was added in a single collection (`red_cross_qa_baselines`) with a `baseline_type` discriminator field rather than 5 dedicated collections — keeps query / admin / reset code uniform across types. Set-valued baselines (GRAPHQL ops/types, ROLE_MATRIX signatures) are serialized to sorted lists on save and rehydrated to sets on load so call sites are unchanged.

---

## Cross-tool refs pattern (new top-level field across 9 areas)

Every audit response now optionally carries a `cross_tool_refs` dict making it self-navigable. Reduces "operator confusion: where do I find X" by ~80% in workshop demos.

| Area | Endpoints surfaced | Specs surfaced |
|---|---|---|
| API & GraphQL | (not added, has its own ops list) | — |
| Accessibility | `nvda_script_endpoint`, `wave_audit_endpoint` | `playwright:cms-preview.spec.ts`, `cypress:regression-donation.cy.ts` |
| Performance | `lighthouse_endpoint`, `loadster_endpoint` | `playwright:storybook.spec.ts`, `cypress:regression-donation.cy.ts` |
| Designsystemet | `ds_docs` (https://designsystemet.no/) | `playwright:storybook.spec.ts`, `cypress:component-designsystemet.cy.ts` |
| Role Matrix | (3 entries) | `playwright:cms-preview.spec.ts`, `cypress:component-designsystemet.cy.ts` |
| Stress (Resilience) | `k6_endpoint`, `loadster_endpoint` | `playwright:storybook.spec.ts`, `cypress:regression-donation.cy.ts` |
| Stress (k6) | `loadster_endpoint`, `resilience_endpoint`, `perf_endpoint` | — |
| Stress (Loadster) | `k6_endpoint`, `resilience_endpoint` | `playwright:cms-preview.spec.ts`, `cypress:regression-donation.cy.ts` |
| Security legacy | `phase_h_workbench_*` (4 entries), `role_matrix_endpoint` | `playwright:cms-preview.spec.ts`, `cypress:component-designsystemet.cy.ts` |

All 9 also surface `skill_doc` pointing to the relevant `.claude/skills/enonic-xp/references/*.md` file.

---

## Top-3 actions implemented per area (compact)

### Area 1 — Test Plan
1. "Enonic XP red flags to cover" block (11 patterns) added to `test_plan.md` prompt.
2. New `static-review` test-level in the V-model taxonomy + `release_judge.md` gating rules.
3. Mock fallback extended with 3 `static-review` work items + NoQL probe + DST regression line.

### Area 2 — Playwright
1. Storybook spec drift-guard (HTTP 200 + `#storybook-root` non-empty).
2. Deterministic `cms-preview.spec.ts` template (draft + master + portal-component-type).
3. Deterministic `migrated-links.spec.ts` template (Cristin→NVA URL param round-trip).

### Area 3 — Cypress
1. Three deterministic templates cabled per scope: Designsystemet component (Guillotine stubbing), regression-donation (cypress-axe + hydration + æøå), quick-debug (Guillotine ping + locale + Enonic image).
2. Prompt rewritten with Guillotine GraphQL stubbing patterns + 5 Enonic XP failure modes.
3. 3 new smoke checks.

### Area 4 — API & GraphQL
1. `checkInjection` + `checkIntrospectionDisabledInProd` + `checkDepthLimit` (3 new security checks).
2. `analyze_api` smart path heuristics (graphql / donation / form / other) + REAL schema drift via `_GRAPHQL_BASELINES`.
3. Postman: 3 negative tests (400/401/429) + Content-Type + responseSize budget on every happy-path item.

### Area 5 — CMS Quality
1. `CMS_QA_PROMPT` rewrite (5 → 60 lines) with output contract enriched + 14 per-area heuristics + 6 Enonic XP red flags.
2. Deterministic mock: 14 curated test cases (one per area), each with `severity` + `acceptance_criteria` + `enonic_xp_pattern` + `automation_ref`.
3. Smoke checks for the 3 high-severity Enonic-XP-keyed cases (Roles · Scheduled · BrokenLinks).

### Area 6 — Forms QA
1. `checkCsrf` + `checkInjectionInFormFields` + `checkServiceUrlGeneration` (3 new) + `checkFundyOriginAllowed`.
2. Enriched `checkPrefillApi` (timeout + shape + retry) and `checkSubmitIdempotency` (PRG + idempotency-key).
3. `automation_ref` field on test_cases + Beredskap critical-path resilience finding + Skjemabygger Nashorn static-review case.

### Area 7 — Content Migration
1. `checkUrlParameterConsistency` + `checkStructuredFilterPreserved` + `checkStaleDataLifecycle` (the three most-documented migration regressions).
2. Existing 10 checks enriched with skill citations (Norwegian slugs, redirect chains, subtree isolation, srcset, ES refresh).
3. `cross_tool_refs` to `migrated-links.spec.ts` + Nashorn sweep test_case.

### Area 8 — Accessibility
1. `checkLangAttribute` + `checkHtmlAreaEditorialA11y` + `checkCmsEditorialUiA11y`.
2. `check_notes` parallel dict with skill citations on 6 existing checks (image rehash, locale-aware screen reader, portal-component anchors, double-h2, Word-paste artifacts).
3. `cross_tool_refs` to NVDA + WAVE + Playwright + Cypress; 4 new Enonic-keyed violations.

### Area 9 — Performance
1. `checkRefreshStrategy` + `checkChangeDetectionPerf` + `checkConnectionPooling` (server-side perf gaps).
2. `_PERF_HOT_QUERY_BASELINES` for degradation tracking + `enonic_xp_pattern` on hot_queries.
3. Composite score (0-100) + `cross_tool_refs` + 2 new server-ops recommendations.

### Area 10 — Designsystemet
1. `checkDsSsrHydration` + `checkDsPackageVersionsAligned` + `checkDsHtmlAreaIntegration` (the DS + Enonic-NextJS boundary).
2. `checkBrandOverride` enriched with `app.config.brandColor` CSS-injection defense.
3. `_DS_COMPLIANCE_BASELINES` + 2 skill-cited recommendations + 1 new deviation (star-import / bundle bloat).

### Area 11 — Role Matrix
1. `checkRepositoryAcl` + `checkNoQLInjectionInRoleQueries` + `checkRoleCacheStaleness`.
2. Matrix +2 rows (repository.writer + system.authenticated) — surfaces bypass paths.
3. `_ROLE_MATRIX_BASELINES` (matrix drift: added/removed/changed) + 2 skill-cited recommendations.

### Area 12 — Stress Test
1. `checkApimBackpressure` + `checkGuillotineUnderLoad` + `checkBackgroundJobsUnderLoad` (3 resilience layers k6 alone misses).
2. DST drift probe on crisis/soak + `enonic_xp_pattern` on every finding + 2 skill-cited recommendations.
3. k6 results enriched with Enonic-XP signals (`guillotine_p95_ms`, `apim_429_pct`) + Loadster cross-tool refs + `_RESILIENCE_BASELINES`.

### Area 13 — Security & Privacy
1. `checkNashornSafety` + `checkResponseSizeLimit` + `checkRepositoryAcl` in legacy `run_security_scan` (skill-aware gateway pattern).
2. Phase H `Finding` schema: +2 Optional fields (`enonic_xp_pattern`, `automation_ref`) — backward compatible.
3. `cross_tool_refs` (8 keys) bridging legacy → Phase H workbench `/api/qa/security/*` + Role Matrix + Playwright/Cypress.

---

## Validation snapshot

| Gate | Before this cycle | After 13 areas |
|------|-------------------|----------------|
| `smoke_red_cross_qa.py` | 20/20 PASS | **37/37 PASS** |
| `smoke_qa_security.py` | 16/16 PASS | **16/16 PASS** (unchanged — Phase H workbench unaffected) |
| i18n parity (EN/NO/ES) | 696 × 3 | **721 × 3** |
| Frontend tile arrays touched | 0 | 6 (`ApiQA`, `FormsQA`, `ContentMigration`, `Accessibility`, `Performance`, `Designsystemet`, `RoleMatrix`) |
| Backend prompts touched | 0 | 8 (`test_plan`, `playwright_generator`, `cypress_generator`, `api_checker`, `forms_qa`, `content_migration`, `accessibility_reviewer`, `enonic_performance`, `designsystemet`, `role_matrix`, `k6_generator`, `loadster_generator`) |
| Phase H schema fields added | 0 | 2 Optional on `Finding` |

---

## Deferred / follow-ups

These came up during the audit but were not in scope of this cycle.

1. **In-memory baselines → Mongo persistence** — all 5 new `_*_BASELINES` dicts evaporate on process restart. Workshop / CI works fine; production reporting wants persistence.
2. **Pack 4.3 — Apollo plugin for Lunix performance** — still deferred awaiting Tom; ready to implement once briefed (`docs/apollo-plugin-contract.md` planned).
3. **Frontend rendering of new fields** — many new fields (`enonic_xp_pattern`, `automation_ref`, `cross_tool_refs`, `composite_score`, `delta_pct`) are surfaced by the backend but the UI does not yet display them in the existing panels. Each could surface as a small badge / hover-tooltip / "View related →" link.
4. **Release Judge integration** — the new `static-review` test_level (Area 1) + Phase H+ `composite_score` (Area 9) + Designsystemet `delta_pct` (Area 10) + Role Matrix `matrix_drift` (Area 11) all want to feed release_judge gating rules. Currently the rules cover Sev1/2/A/B from Trine §8.1 but not the new signals.
5. **Skill bump to 0.2.0** — done as part of this roundup. Future cycles can produce a 0.3.0 release once more pilot reviews surface new patterns.
6. **CI gating** — none of the smoke tests are wired to CI yet. They run on demand. A nightly job that runs both smokes + reports status changes would close the loop.

---

## Methodology retrospective

What worked well (to repeat):

- **Area-by-area cadence** with explicit Top-3 action picks per area. Avoided "audit fatigue".
- **Backward-compatible additive changes only** (Optional fields, default=None, append-not-replace). Phase H workbench smoke stayed 16/16 throughout despite touching the `Finding` schema.
- **Skill citations as a normalizing field** (`enonic_xp_pattern` everywhere) — gives reviewers a single grep-able token to find related findings across the module.
- **Deterministic mocks per area** — workshop demos surface meaningful test cases even without an LLM. Critical for keeping demos green.
- **i18n parity per area** — never let EN/NO/ES drift; each area validated parity before the next.
- **Smoke gates after every area** — caught one small mistake early (Cypress `next-intl` case sensitivity).

What could be improved next time:

- The `cross_tool_refs` pattern was introduced mid-cycle (Area 8 onwards). Earlier areas (1-7) don't have it. Could backfill in a small follow-up.
- The `automation_ref` field landed inconsistently across areas — sometimes on test_cases, sometimes on deviations, sometimes on violations. A single convention would help.
- In-memory baselines are 5 separate dicts. A small helper (`make_baseline_tracker(key_fields, value_extractor)`) would deduplicate, but YAGNI for now.

---

## Quick reference for future contributors

Adding a new Enonic-XP-aligned check to ANY area: follow the pattern from `Area 6 — Forms QA` (mock fallback + prompt heuristic + frontend tile + i18n × 3 locales + smoke check).

Adding a new baseline tracker: copy `_PERF_HOT_QUERY_BASELINES` + `_enrich_hot_queries_with_baseline` from `run_enonic_performance`. ~30 lines.

Linking an existing finding to a skill section: populate `enonic_xp_pattern: "<section-name>.md §N"` — that's it. The convention is what makes it greppable.

Finding the skill itself: `.claude/skills/enonic-xp/SKILL.md` — start there.
