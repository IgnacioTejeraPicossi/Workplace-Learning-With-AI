# Red Cross Web QA Agent — User Guide

The **Red Cross Web QA Agent** is a 24/7 QA copilot for the **rodekors.no** rebuild (Enonic XP CMS + a NextJS front end). It helps the team test the front end, APIs, CMS, performance, accessibility, SEO, security, content quality and release readiness — and turn the results into scripts, reports and Azure DevOps work items.

It is **mock-first**: every tab works offline with realistic sample data, so you can explore it without a live site or API keys. When a real backend/site is available it uses that instead.

> ⚠️ **AI is used as support only.** Real personal data, production data and API keys do **not** belong in the AI. Acknowledge the in-app banner before running AI-assisted actions.

## Quick start
1. Open **Settings** once and confirm (then **Save**):
   - **Local URL** → usually `http://localhost:3000`
   - **Test URL** → `https://next.lunix.cloud/testside`
   - **Enonic XP admin URL** → `https://rodekors-xp8dev.enonic.cloud/admin`
2. Pick an **Environment** (top right): `Local` or `Test`. The header chip **🎯** shows the live target from Settings.
3. Pick an **Execution Mode**: **Generate scripts & reports** or **Execute directly**.
4. Open the tab you need. URL fields (Performance / Accessibility / Designsystemet) sync from Settings when you change environment; other tabs send that same `base_url` to the backend when generating scripts.
5. Review the result; findings can be pushed to **Azure DevOps** and rolled up into a **Sprint Report**.

## Target URLs (presets & Settings)
Defaults and one-click chips:
- ❤️‍🩹 **rodekors.no** — production (explicit preset only).
- 🧪 **https://next.lunix.cloud/testside** — published TestSide (NextJS + Enonic XP + GraphQL). Default **Test** BASE_URL.
- 💻 **localhost:3000** — local / **Local** BASE_URL.

**Enonic XP admin (Content Studio):** `https://rodekors-xp8dev.enonic.cloud/admin` — configured under **Settings → Enonic XP admin URL**. This is the CMS console, **not** the public Test BASE_URL used by Playwright / Lighthouse / axe / k6.

### How Settings drive every tab (runtime)
Settings are loaded once when the agent opens and shared with all tabs (`settingsApi.js`):

| Setting | Used as |
|---|---|
| `env_local_url` | BASE_URL when Environment = **Local** |
| `env_test_url` | BASE_URL when Environment = **Test** |
| `enonic_admin_url` | CMS admin link (CMS QA tab + CMS preview tooling) |

- Changing **Local / Test** in the header updates the 🎯 chip and re-syncs URL inputs on Performance, Accessibility and Designsystemet.
- After **Save** in Settings, the cache refreshes so every tab sees the new URLs immediately.
- Generators (Playwright, Cypress, Postman, k6, Loadster, Forms QA, …) receive `base_url` from the frontend and embed that host in scripts — they no longer hardcode `test.rodekors.no`.

## The tabs at a glance
| Tab | What it does |
|---|---|
| 📊 Dashboard | Overview, backend/connection status, quick links |
| 📋 Test Plan | Generate a test plan from an Azure DevOps work item + acceptance criteria |
| 🎭 Playwright | Generate / run Playwright specs (Storybook-aware — Tom's preferred E2E) |
| 🌲 Cypress | Generate / run Cypress specs (ad-hoc / non-Storybook) |
| 🔌 API QA | Analyse endpoints, export a Postman collection, run GraphQL introspection |
| 📝 CMS QA | Enonic Content Studio test cases (preview vs published, ISR, broken links…) |
| 📑 Forms QA | Donation / volunteer / contact form checks + findings |
| 📦 Migration | Legacy CMS → Enonic XP migration audit (mapping, æøå, 301s, provenance) |
| ♿ Accessibility | axe-core + Lighthouse + manual checklist + screen-reader scripts, WCAG 2.1 / 2.2 AA |
| ⚡ Performance | Core Web Vitals + Enonic-specific perf (GraphQL waterfall / N+1 / over-fetch) |
| 🎨 Designsystemet | Digdir Designsystemet compliance score + deviations |
| 🔐 Role Matrix | Role / permission (ACL) audit across the site |
| 🔥 Stress Test | k6 / Loadster load + resilience checks (breakpoint VU, recovery, drift) |
| 🛡️ Security & Privacy | Security scan + GDPR / DPIA checklist workbench |
| 🎯 Azure DevOps | Parse pasted items, fetch a sprint, create work items, dispatch a bundle |
| 📈 Sprint Report | Auto-generate Trine's per-sprint report (status, deviations, recommendations) |
| ✅ UAT Support | User-acceptance-test support material |
| 🎲 Risk Matrix | Risk analysis (likelihood × impact) |
| 📜 Runs | History of every run — re-open past results |
| ⚙️ Settings | Local / Test / Enonic admin URLs, execution mode, Azure DevOps project, sprint config, thresholds — **source of truth for BASE_URL across all tabs** |

## Execution modes
- **Generate scripts & reports** — the agent writes the artifacts (Playwright / Cypress specs, k6 scripts, Postman collections, reports) for you to run in your own pipeline (Cursor, Claude, GitHub Actions). Nothing is executed against the site.
- **Execute directly** — when the tooling is available, the agent runs the check in-app (Lighthouse, axe, Playwright, k6…) and shows live results. If a tool is missing it falls back to mock data and says so.

## Enonic-XP signals
Several tabs surface extra signals aligned with Enonic XP good practice:
- 🧩 **Skill-pattern badge** — links a finding to a skill-doc section (e.g. `security-patterns.md §2`).
- 🔗 **Related tools & specs** — where to find the relevant endpoint / spec.
- **Composite score** (0–100) and **▲ delta vs baseline** — trend tracking between runs.

They are informational and appear only when the backend provides them (Accessibility, Performance, Role Matrix, Forms QA, Designsystemet, Stress Test).

## Team context (Tom & Trine)
- **Tom (Tech leder, Røde Kors)** — the rebuild is NextJS + Enonic XP + Guillotine GraphQL; components live in **Storybook** with **Playwright** (used instead of Cypress); **Postman** is the preferred way to poke GraphQL. Tom-tip banners appear on the relevant tabs.
- **Trine (Testleder)** — the **Teststrategi** governs severities (Sev 1–4 in development, Kat A–C in operations) and mandates a **per-sprint report**, which the Sprint Report tab automates.

## Azure DevOps flow
Paste a work item or fetch a sprint, turn findings into work items, preview the action bundle, then create the items or dispatch the bundle. Dispatch **records** the intent; it does not mutate external systems on its own.

## Frequently asked
- **Do I need a live site or an API key?** No — it is mock-first; everything works offline with sample data.
- **Where did `test.lunix.cloud` go?** It moved to **`next.lunix.cloud`** (2026-09-28). The published Test path is now **`/testside`**. The old dated sample report keeps its original name.
- **What about `test.rodekors.no`?** Replaced as the default Test URL by **`https://next.lunix.cloud/testside`**. Enonic admin is at **`https://rodekors-xp8dev.enonic.cloud/admin`**.
- **I changed Settings but a tab still shows an old URL.** Click **Save** in Settings, then switch Local ↔ Test once (or reload the page). The header 🎯 chip should match Settings.
- **Can I still override the URL on Performance / Accessibility?** Yes — type or pick a preset. The next environment / Settings sync will restore the Settings BASE_URL.
- **Is my data sent to AI?** Only what you type in. Keep real personal / production data and API keys out of AI inputs (see the banner).
- **Where are past results?** The **Runs** tab.
- **Where is this guide in the app?** README Viewer → `docs/red-cross-qa-help.md` (also `.es.md` / `.no.md`).
