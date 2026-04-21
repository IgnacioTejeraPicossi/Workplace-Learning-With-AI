# Changelog

All notable changes to the J-messages Analyzer and Retrospective Learning system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

