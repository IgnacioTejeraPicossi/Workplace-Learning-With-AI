# 🤖 AI-drevet plattform for arbeidsplasslæring

**Workplace Learning With AI (WLWAI)** er et porteføljeprosjekt med fokus på **automatisk testing, AI-assistert validering, agent-baserte arbeidsflyter og LLM-drevet produkteksperimentering**. Det kombinerer FastAPI, React, MCP, Postman og strukturerte AI-pipelines for å utforske hvordan moderne AI-systemer kan testes, feilsøkes, integreres og forbedres i virkelige scenarier. (Test Manager/AI Test/Automatic testing)

---

## 🎯 Porteføljefokus

- **Automatisk testing**: API-validering, MCP-testflyter, reproduserbare diagnoser og feilsøkingsorienterte arbeidsflyter.
- **Anvendt AI-ingeniørkunst**: prompt-iterasjon, LLM-orkestrering, agent-baserte arbeidsflyter og strukturerte analyse-pipelines.
- **Systemintegrasjon**: FastAPI-backend, React-frontend, MongoDB, n8n, OutSystems-broer og MCP-kompatible verktøy.
- **Eksperimenterende tankesett**: raske tilbakemeldingssløyfer for feilsøking, validering, prompt-forbedring og analyse av AI-atferd.

---

## 🚀 Hva dette demonstrerer

- **AI + testing sammen**: ikke bare å bygge AI-funksjoner, men å validere og feilsøke dem systematisk.
- **MCP- og verktøy-interoperabilitet**: testing av AI-verktøy gjennom STDIO/HTTP-broer og klientarbeidsflyter som Postman.
- **LLM-drevne produktarbeidsflyter**: dokumentanalyse, prompt-håndtering, evalueringssløyfer og agent-orienterte grensesnitt.
- **Praktisk full-stack-leveranse**: backend-API-er, frontend-komponenter, integrasjonsdokumentasjon og testveiledning i ett repo.

---

## 📚 Kjernefunksjoner

| Område | Høydepunkter |
|------|------------|
| **Testing og validering** | MCP-server, Postman-testflyter, valideringsdokumentasjon, feilsøkingsflyter |
| **AI og agenter** | AgentOps Studio, Repository Analyzer, Document Analyzer, Agentic RAG, AI Study Buddy |
| **Arbeidsplasslæring** | AI-konsepter, mikroleksjoner, anbefalinger, scenariosimulator, sertifiseringer |
| **Bedrift og drift** | EA Second Brain (Portfolio, Impact Scoring, Heatmap, Deprecation Radar, Ask), Process Designer, Catalog Manager |
| **Sky-utrulling** | Cloud Install-arbeidsbenk, klarhets-score, utrullings-sjekkliste, automatiske røyktester, kostnads-baseline, Dockerfile + Cloud Run-konfig |
| **Security Center** | Plattformsikkerhet og personvern i 6 moduler: lokal kryptering (AES-GCM 256), automatisk datasletting, brukerkontroll og eksport av data, PII-anonymisering, dynamisk sikkerhets-score, sanntids hendelsesovervåking |
| **Cybersikkerhet** | Sikkerhetsplattform med 10 faner: trusselbibliotek, ekte sårbarhetsskanning, NIST CSF 2.0-posisjon, compliance-sporing, coach for sikker koding, hendelsesøvelser, kunnskapsbase, sikkerhetsovervåker for agenter |
| **QA og testautomatisering** | Red Cross Web QA Agent (20 faner / 50 endepunkter): Playwright + Cypress-generatorer, Skjemabygger + Fundy skjema-QA, revisjon av innholdsmigrering, Enonic-spesifikk ytelse, Designsystemet (Digdir)-samsvar, rolletillatelsesmatrise, **Azure DevOps work-item-pakke**, **Sprint Report-generator**, **DPIA / DoD-verifikator / Resilience / UAT-støtte / Risikomatrise**, **k6 + Loadster dobbel lasttesting**, **Storybook + Postman + GraphQL-introspeksjon** (Fase F), **NVDA + WAVE**-tilgjengelighet (Fase G), **Fase H · Pack 2 — Sikkerhet og personvern-arbeidsbenk** (backend-drevet, persistent, status bevart mellom re-skanninger, strukturert DPIA), **Fase H · Pack 3 — 5 arbeidsflyt-utvidelser** (📥 Markdown-eksport av funn + DPIA + historikk, 🎯 idempotent ADO-utsending av ett enkelt funn med deterministiske mock-work-item-ID-er, 🔀 skann-diff med new/fixed/regressed/persisted-grupper, ✅ verify-fix-flyt som auto-promoterer `fixed` → `verified`, 🌐 miljømatrise på tvers av local/test/staging/prod), tilpasset Trine Bruus Teststrategi 30.3 |
| **Språkagenter** | 6 språktutorer (japansk, kinesisk, koreansk, English Mastery, norsk, spansk) — uttale, grammatikk, vokabular-SRS, samtale; **eksempler med innfødt klonet stemme** (Voicebox, lokalt) og **muntlig Conversation Audio** (Web Speech ASR + TTS, valgfritt nettsøk) |
| **Spesialiserte AI-brukstilfeller** | J-messages Analyzer, compliance-/produktivitetsagenter, ATM V&V Test Copilot, AI-eksperimentering |

---

## 📁 Struktur

```
├── backend/           # FastAPI (Python): API, routers, clinic, gateway, agents, mcp_bridge_server
├── frontend/          # React: src/, components, RobomindClinic, JMessagesAnalyzer, etc.
├── deployment/        # Cloud deployment: Dockerfile, cloudrun.yaml (Google Cloud Run)
├── grocery_bot/       # Autonomous bot experimentation sandbox (strategy.py, bot.py)
├── websearch-backend/ # Node.js web search service
├── agentops-n8n/      # n8n workflows (Docker)
├── docs/              # All documentation (*.md), including full README
├── requirements.txt   # Python deps (root)
├── .env               # Backend env (root)
└── README.md          # This file
```

**Backend** må kjøres fra **rot-mappen i repoet**:

```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Porter**: Backend 8000, Frontend 3000, Web Search 8080 (`WEBSEARCH_PORT`), n8n 5678 (valgfritt), testfilserver 8888 (for MCP).

---

## 📖 Dokumentasjon

**Start her hvis du vil forstå hvordan dette prosjektet testes og dokumenteres:**

- [docs/agents.md](docs/agents.md)
- [docs/llms.txt](docs/llms.txt)
- [docs/TESTING.md](docs/TESTING.md)

---

- **Full README** (installasjon, oppsett, alle moduler): [docs/README_FULL.md](docs/README_FULL.md)
- **Hurtigindeks**: [docs/README_INDEX.md](docs/README_INDEX.md) — arkitektur, utrulling, agenter, administrasjon
- **Autonom bot-sandkasse**: [grocery_bot/README.md](grocery_bot/README.md)
- **MCP / Postman-testing**: [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md) — J-messages Analyzer via MCP eller HTTP
- **Andrés the Robot** (AI-følgesvenn under utvikling — brukerveiledning): [docs/andres-robot-help.md](docs/andres-robot-help.md)
- **Self-Simulating Reality Agent** (OPH-filosofifølgesvenn — brukerveiledning): [docs/self-sim-reality-help.md](docs/self-sim-reality-help.md)

---

## 🔄 Nylig arbeid (2024–2026)

### Andrés the Robot — AI-følgesvenn under utvikling (august 2026)

**Andrés the Robot** (sidemeny → **Future Item Agents → Andrés the Robot**) er en
AI-følgesvenn under utvikling som bygger en **verifiserbar, reverserbar digital biografi**
(minne, versjonert identitet, refleksjon, kreativitet, sandkasse-ferdigheter) oppå en
språkmodell — uttrykkelig **ikke** en påstand om bevissthet. Han snakker via tekst, stemme
og en valgfri 3D-avatar, og kan se på **ett bilde per melding** (begrenset persepsjon med
samtykke per runde, styrt av forskningsnivået «Dokumenter»). Alt han husker eller endrer er
**foreslått → gjennomgått → godkjent av deg**.
**Brukerveiledning:** [docs/andres-robot-help.md](docs/andres-robot-help.md).

### Språkagenter — innfødt klonet stemme + muntlig samtale (juli 2026)

**Språkagenter**-familien (sidemeny → **Language Agents**) er et sett med seks språktutorer — 🇯🇵 Japanese Sensei · 🇨🇳 Chinese Teacher · 🇰🇷 Korean Teacher · 🇬🇧 English Mastery · 🇳🇴 Norwegian Mentor · 🇪🇸 Spanish Teacher — hver et arbeidsområde med flere faner (uttale, grammatikk, vokabular-SRS, samtale, osv.) drevet av `/api/{japanese|chinese|korean|english|norwegian|spanish}/*`. Kontraktdekning: `backend/tests/test_language_agents_contracts.py` (42 tester på tvers av de 6 agentene).

To funksjoner landet i juli 2026:

**1. Eksempler med innfødt klonet stemme — Spanish Teacher (CHANGELOG [1.19.0])**
En lokal, personvernbevarende **stemmekloning** via **[Voicebox](https://voicebox.sh)** (åpen kildekode, kjører på `127.0.0.1`, holder alle stemmedata på brukerens maskin). Fordi live CPU-syntese av en klonet stemme er treg (~1-5 min/setning uten GPU), spiller Spanish Teachers **Uttale**-fane av et kuratert sett med **forhåndsgenererte** innfødte eksempelsetninger (hilsener, klasseromsinstruksjoner, uttalevisning av rr/ñ/j/ll, oppmuntring) — bufret som WAV og servert for **umiddelbar** avspilling (~0,2s).
- Backend: `backend/services/voice_examples.py` (setningssett + buffer + trimmer for referanse-prefiks med stillhetsdeteksjon + validering av talehastighet og stemmeinnhold), `backend/scripts/pregenerate_voice_examples.py` (offline-generator, gjenopptakbar), endepunkter `GET /api/voice/examples` + `GET /api/voice/examples/{id}/audio`.
- Voicebox-proxyen `backend/routers/voicebox.py` er skrevet om for Voicebox v0.5.0s **asynkrone** genereringsflyt (POST /generate → poll /history/{id} → GET /audio/{id}), med elegant fallback til nettleserstemme og valg av `engine`/`model_size`.
- Frontend: `NativeVoiceExamples`-panel i `SpanishTeacher.jsx`; tester `backend/tests/test_voice_examples.py` (10). i18n EN/NO/ES.
- **Modellmatrise (verifisert):** klonede stemmer fungerer med Qwen TTS (`qwen`, 0.6B/1.7B); `qwen_custom_voice` avviser kloner, Kokoro har fast stemme og LuxTTS støtter kun engelsk.

**2. Conversation Audio — English Mastery AI (CHANGELOG [1.20.0])**
En ny **🎙 Conversation Audio**-fane: håndfri *muntlig* øving. Du snakker (Web Speech **ASR**, `hologram/useSpeechCapture`), mentoren svarer, og svaret leses automatisk høyt (nettleser-TTS) i en tur-basert sløyfe — gjenbruker det eksisterende endepunktet `/api/english/conversation/message` (Fase 1, ingen backend-endring). **Fase 2** legger til en valgfri **🌐 nettsøk**-bryter: mentoren undersøker temaet via den frittstående Node-tjenesten `websearch-backend` (`WEBSEARCH_URL`, standard `:8080`) og forankrer svaret med aktuelle fakta (`web_research`-flagg → `web_used`-svar), og faller elegant tilbake til et vanlig svar når tjenesten er av.
- Backend: `backend/services/english_mentor.py` (`_web_research` + `web_research`-parameter), `backend/routers/english_mentor.py`. Frontend: `TabConversationAudio` i `EnglishMentor.jsx`. i18n EN/NO/ES.
- **Ingen Docker-avhengighet:** English Mastery bruker nettleserstemmen; Voicebox/Docker brukes kun til de spanske klonede stemme-eksemplene og degraderer elegant når den er av.

> **Merk:** `docs/Voice-Cloning-Discontinuation.md` (des. 2024) beskriver et *tidligere*, forlatt Coqui-TTS-forsøk og er **erstattet** av Voicebox-tilnærmingen over.

### Red Cross Web QA Agent (mai 2026 — tilpasning til Teststrategi 30.3)

En 24/7 QA-copilot skreddersydd for gjenoppbyggingen av nettstedet **rodekors.no** på **Enonic XP CMS + NextJS + Designsystemet (Digdir)**. Item Agent #9, tilgjengelig fra sidemenyen under **Future Item Agents**.

Tilpasset **Trine Bruus Teststrategi 30.3** (Testleder, Røde Kors): **Azure DevOps** er det offisielle testverktøyet (§5), hvert funn bærer det doble alvorlighetsskjemaet `severity_dev` 1-4 + `category_ops` A-C (§8.1), testnivåene følger V-modellen (unit / SIT / system / UAT / performance, §5), og **Fundy** er anerkjent som leverandøren av donasjonsskjemaer (adskilt fra Vipps-betalingsoverleveringen, §3 Systemlandskap).

Agenten leveres som et **20-fanes skall** (`frontend/src/RedCrossWebQAAgent.jsx`) med to kjøremoduser — **Generate-only** (produserer skript/rapporter for Cursor / Claude Code / GitHub Actions) og **Execute-directly** (kjører Playwright / Cypress / axe-core / Lighthouse / k6 i appen) — og to miljøer (lokalt på `:3000`, test). Hver kjøring signeres med en SHA-256 attestasjonshash for sporbarhet.

**20 faner** (`frontend/src/red-cross-qa/*.jsx`):

| # | Fane | Formål |
|---|-----|---------|
| 1 | 📊 Dashboard | Live kvalitetsstatus: totalt antall kjøringer, bestått-rate, åpne funn, kritiske blokkerere, 11 quality gates, panel med 16 Quick Actions-knapper, **Fase F: Toms verktøytips-banner** (NextJS + Storybook + Playwright + Postman for rodekors.no-gjenoppbyggingen) |
| 2 | 📋 Test Plan | LLM-en konverterer et Azure DevOps work item / user story til en testplan for manuell + automatisert + tilgjengelighet + API + regresjon; sender ut `ado_work_items` med `work_item_type` (Bug / Task / Test Case), `priority` 1-4 og `test_level` (unit / sit / system / uat / performance) |
| 3 | 🎭 Playwright | Kryssnettleser E2E-generator (10 omfang: navigasjon, skjemaer, søk, donasjon, frivillig, CMS-forhåndsvisning, a11y smoke, visuell, API-mock, **Fase F: Storybook for Designsystemet-komponenter — genererer en deterministisk `storybook.spec.ts` med `@storybook/test-runner`-mønstre, `iframe.html`-URL-mønster, axe-core-injeksjon per historie, WCAG 2.2 AA-tagprofil**). Tom-tips-banneret forklarer at Playwright er buntet med Storybook for dette prosjektet. |
| 4 | 🌲 Cypress | Generator for komponenter + frontend-regresjon. **Fase F: mild deprecation-varsel** øverst som anbefaler Playwright (fane 3) siden Storybook-bunting allerede er på plass; Cypress gjenstår for ad-hoc / ikke-Storybook-behov. |
| 5 | 🔌 API QA | Enonic Guillotine GraphQL + NextJS API + eksterne integrasjoner — 10 sjekker. **Fase F: GraphQL-skjema-introspeksjonspanel** (lister 5 Guillotine-operasjoner + 8 Røde Kors-innholdstyper som Distrikt / Aktivitet / Kampanje, mock-first) + **Postman Collection v2.1-eksportknapp** med nettleser-nedlasting (4 kanoniske spørringer, `base_url` + `token`-variabler, tester per forespørsel som sjekker status 200 + ingen GraphQL-feil). Toms foretrukne arbeidsflyt for å pirke på XP-backenden. |
| 6 | 📝 CMS QA | Enonic Content Studio-redaktør + besøkeropplevelse — 14 områder |
| 7 | 📑 Forms QA | **Skjemabygger + Fundy**-revisjon — **21 sjekker** (12 grunn: JSON Schema, Adam Silver-mønstre, flertrinnstilstand, mobiltastatur, autocomplete, APIM/Dataverse-prefill, ARIA live-regioner, feiloppsummering, **Vipps-overlevering**, PRG-idempotens, pluss 9 **Fundy** donasjonsleverandør-sjekker). Funn bærer `severity_dev` 1-4 + `category_ops` A-C |
| 8 | 📦 Content Migration | Revisjon av gradvis migrering fra eldre CMS → Enonic XP — 8 innholdstyper (Forening / Distrikt / Aktivitet / Kontaktperson / Tjeneste-Kurs / Tema / Nyhet / Kampanje) × 10 sjekker (mapping, æøå-tegn, relasjoner, re-forankring av bilder, 301-omdirigeringer, SEO, ISR-invalidering, videreføring av rolletillatelser) |
| 9 | ♿ Universell utforming-pilot (Tilgjengelighet) | **Verktøyvelger** med 3 motorer side ved side: 🤖 **axe-core + Lighthouse** (eksisterende automatisk skann, 12 sjekker, WCAG 2.1/2.2 AA-bryter), 🔊 **NVDA** (Fase G — genererer en markdown-sjekkliste med `Insert+T` / `Insert+F7` / Tab-tastetrykk + forventede opplesninger + WCAG SC-mapping per steg, 5 omfangs-presets: donasjon / frivillig / søk / navigasjon / skjemaer, .md-nedlasting), 🌊 **WAVE (WebAIM)** (Fase G — mock-first-rapport med statistikkort for feil/kontrast/varsler/features/struktur/aria + 3 detaljtabeller + dyplenke til `wave.webaim.org/report#/{url}`; ekte API-kall når miljøvariabelen `WAVE_API_KEY` er satt) |
| 10 | ⚡ Performance | Core Web Vitals + **Enonic-spesifikk ytelse**: Guillotine GraphQL-waterfall / N+1 / over-fetch, ISR-revalidering, bildetjeneste, publiserings-ack-latens, UI-blokkering ved masse-publisering, part-virtualisering, cache-friskhet — 10 sjekker + hot-queries-tabell + p95-metrikker |
| 11 | 🎨 Designsystemet | **Digdir Designsystemet-samsvar** — bruk av `@digdir/designsystemet-react`, tokens, typografi, mellomrom, mørk modus, merkevare-overstyring, versjon, knapp- + skjemaelement-komponenter — 10 sjekker + 0-100 samsvars-score + avvikspanel |
| 12 | 🔐 Role Matrix | **Ekte autorisasjonstester** på tvers av 6 redaksjonelle roller (Administrator / Eier / Lokal eier / Redaktør / Lokal redaktør / Bidragsyter) × 4 handlinger (read/edit/publish/delete) — 8 authZ-sjekker (subtre-isolasjon, publiseringsguard, sletteguard, guard for rolletildeling, revisjonslogg, sesjonsutløp, privilegie-eskalering, API-authZ) |
| 13 | 🔥 Stress Test | k6-lastprofiler for Røde Kors-topper: smoke, normal, kampanjetopp, **krisespiss (1 000+ VU-er)**, 4-timers soak. **Fase D** legger til **Loadster** som et parallelt verktøy med en radio-velger øverst — Loadster kjører ekte nettlesere, så den fanger **JS-hydrering** (`hydration_p95_ms`) og **SPA-navigasjonskostnad** (`spa_nav_p95_ms`) som k6 på protokollnivå ikke kan måle (relevant for NextJS + Designsystemet frontend-UX). Pluss en dedikert **Resilience**-seksjon (Trine §7) med `resilience_score` 0-100, breakpoint-VU, gjenopprettingssekunder, topp-feilrate, minne-drift — som skiller *ytelse* fra *resilience* |
| 14 | 🛡️ Sikkerhet og personvern | **Fase H · Pack 2 — full backend-drevet arbeidsbenk**: snapshot-panel (samlet status + pass/warn/fail/open-funn) → klikkbare sjekk-kort (status + alvorlighet + scan_type + kategori-badge + antall koblede funn) → detalj-skuff (sammendrag, bevis, anbefalinger, fulle funn-rader) → filtrerbar funnliste med **4-tilstands-arbeidsflyt** (open / accepted_risk / fixed / verified, status bevart mellom re-skanninger) og redigering av eier/anbefaling + revisjonshistorikk → **skannehistorikk** med trendpiler som sammenligner fail+warn mot forrige kjøring → strukturert **DPIA-redaktør** med 10 felt (purpose, dataTypes, sensitiveData, storageLocation, accessRoles, retention, thirdParties, legalBasis, riskNotes, mitigations). 13 sikkerhets-/personvern- + 12 DPIA-sjekker = 25 totalt. Støttet av 3 MongoDB-samlinger + fallback i minne |
| 15 | 🎯 Azure DevOps | Konverter funn til Azure DevOps work items (Bug / Task / Test Case) med prioritets-pille (P1-P4), `severity_dev` (dev)-, `category_ops` (drift)- og `test_level`-badges. Kan også sende til OutSystems |
| 16 | 📈 Sprint Report | **Sprint-rapport-generator** — aggregerer kjøringer/funn/utsendinger for aktiv sprint, beregner Sev1-4 + KatA-C-tellinger, produserer en norsk/engelsk narrativ (Status / Identifiserte avvik / Anbefalinger) for Trines rapporteringslinje opp til Røde Kors. Inkluderer nå en **Definition of Done-verifikator** (Trine §6.1: funksjonalitet testet ✓ / integrasjoner verifisert ✓ / kjente feil dokumentert ✓ / klar for UAT ✓) beregnet mekanisk per work item |
| 17 | ✅ UAT Support | **NY** — Item kjører ikke UAT; det gjør Røde Kors. Genererer UAT-skript, sjekklister per interessent og et signeringsskjema for de navngitte interessentene **Hilde Forslund** (Produkteier), **Trine Røsand Scheen** (Fagperson), **Astri Fretheim** (Fagperson) |
| 18 | 🎲 Risikomatrise | **NY** — Trine §10: matrisen lever utenfor strategidokumentet. Lim inn CSV/JSON, agenten scorer hver risiko (sannsynlighet × konsekvens, 1-25), tildeler `level` (critical / high / medium / low), mapper til testsuiter og produserer `suite_priority` + `coverage_gaps` |
| 19 | 📜 Runs | Kjøringshistorikk med attestasjonshash, artefakter, skjermbilder |
| 20 | ⚙️ Settings | Miljøer, verktøy, **Azure DevOps**-prosjekt (organization / project / area path / iteration path / tags / current sprint / sprint length weeks), betalingsflyt-omfang (Vipps), kvalitetsterskler |

**Backend:**
- Tjeneste: `backend/services/red_cross_qa.py` — **23 suiter** med mock-first elegant degradering (hver funksjon returnerer deterministiske data når LLM er utilgjengelig). Genererer `severity_dev` + `category_ops`-annotasjoner på hvert funn.
- Router: `backend/routers/red_cross_qa.py` — **37 ruter** på `/api/red-cross-qa/*` (Fase B: DPIA / DoD / Resilience / UAT / Risikomatrise; Fase D: Loadster; Fase F: Postman + GraphQL-introspeksjon; Fase G: `/generate-nvda-script`, `/run-wave-audit`)
- **Fase H-underrouter** `backend/routers/qa_security.py` — **13 stier / 15 method bindings** på `/api/qa/security/*`. Pack 2: status, checks, checks/{id}, scan, findings, findings/{id} PATCH, history, dpia GET/POST/PATCH. Pack 3: `/export/markdown`, `/findings/{id}/dispatch-ado`, `/diff`, `/findings/{id}/verify`, `/environments`. Støttet av `backend/services/qa_security_service.py` + `backend/repositories/qa_security_repository.py` + `backend/schemas/qa_security.py` med 3 dedikerte MongoDB-samlinger (`qa_security_scans`, `qa_security_findings`, `qa_security_dpia`) og fallback i minne. Brukerdefinerte funn-statuser (`fixed` / `accepted_risk` / `verified`) bevares mellom re-skanninger. Pack 3 legger til: Markdown-eksport av sprint-rapport, idempotent ADO-utsending av ett funn (deterministiske mock-work-item-ID-er), skann-kjøring-diff med new/fixed/regressed/persisted-grupper, verify-fix re-skann-flyt med auto-statusovergang, og 4-miljøs styringsmatrise. **Pack 4.1** legger til `findings_snapshot` per skann på hvert `ScanRun`-dokument → `diff_scans` returnerer en `diff_mode`-diskriminator (`"precise"` når begge kjøringer bærer snapshots, `"timestamp_fallback"` ellers). **Pack 4.2** kobler til ekte Azure DevOps REST-integrasjon: når `ADO_PAT` (eller `AZURE_DEVOPS_PAT`) er satt i miljøet, POST-er `dispatch_finding_to_ado` et JSON-Patch-dokument til `https://dev.azure.com/{org}/{project}/_apis/wit/workitems/${type}?api-version=7.0` (Basic auth, tom bruker + PAT som passord); ved enhver feil faller den elegant tilbake til den deterministiske SHA-mocken og eksponerer `is_mock` + `live_error` i svaret. UI-en viser en MOCK / LIVE-badge ved siden av ADO-lenken deretter.
- Versjonerte prompter: `backend/prompts/red_cross_qa/*.md` (13 prompter: test_plan, playwright_generator, cypress_generator, api_checker, accessibility_reviewer, performance_reviewer, k6_generator, release_judge, **forms_qa**, **content_migration**, **enonic_performance**, **designsystemet**, **role_matrix**). `release_judge.md` og `test_plan.md` er oppdatert til å referere Azure DevOps + Sev/Kat dobbel alvorlighet + V-modell testnivåer.

**Frontend** (`frontend/src/red-cross-qa/` — 21 filer: 20 fanekomponenter + delt `_PageHero.jsx`):
Inline-stil designsystem som matcher ATM V&V Test Copilot-modulen — gradient side-heroer, panelkort, statuschips (pass/warn/fail/pending), alvorlighets-badges (critical/high/medium/low + `severity_dev` 1-4 + `category_ops` A-C).

**i18n**: Full EN / NO / ES-paritet (40+ toppnivå-seksjoner hver, **700 nøkler per språk** etter Fase H Pack 4.2). Nye blokker: `dpia:` (10 nøkler), `dod:` (15), `resilience:` (13), `uatSupport:` (22), `riskMatrix:` (24), `stakeholders:` (3), Fase C migrerings-proveniens + WCAG-versjon (8), Fase D Loadster-verktøyvelger (11) + 2 fane-etiketter, Fase F: Tom-tips-bannere + Storybook + Postman + GraphQL-introspeksjon (27), Fase G NVDA + WAVE (29), **Fase H · Pack 2: snapshot-paneletiketter + klikkbare sjekk-kort + 4-tilstands funn-arbeidsflyt (open / accepted_risk / fixed / verified) + 5 filtre (status / type / kategori / funn-tilstand / alvorlighet) + skannehistorikk med trendpiler + strukturert DPIA-redaktør med 10 felt (82 nøkler)**.

**Slik bruker du det**:
1. Backend: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000` fra rot i repoet
2. Frontend: `cd frontend && npm start` → åpne `http://localhost:3000`
3. Sidemeny → **Future Item Agents** → ❤️‍🩹 **Red Cross Web QA Agent**
4. Velg miljø (`local` / `test`) og kjøremodus (`generate` / `execute`) i toppen
5. Åpne en fane og klikk **Run**-knappen. Funn + anbefalinger + foreslåtte testtilfeller vises inline med `severity_dev` / `category_ops`-annotasjoner; kjøringer lagres under **Runs**-fanen med SHA-256 attestasjonshashen.
6. Slutt på sprinten → **Sprint Report**-fanen → klikk **Generate** for Trines interessent-klare norske narrativ.

**Bakoverkompatibilitet**: `TestPlanRequest` beholder `jira_epic` som et deprecated alias for `ado_work_item`; MongoDB-samlingsnavnet `red_cross_qa_jira_dispatches_collection` beholdes bevisst for å unngå en DB-migrering. Kun brukervendt terminologi ble endret.

**Valideringsstatus**: Backend-importer er rene (23 suiter, 37 ruter + 13 Fase H-stier / 15 method bindings etter Pack 3), ende-til-ende røyktester passerer (`backend/tests/smoke_red_cross_qa.py` — **37 sjekker** som dekker Fase A→G + Fase H+ skill-integrasjon på tvers av 13 revisjonsområder; **`backend/tests/smoke_qa_security.py` — 16 sjekker** som dekker livssyklusen til Fase H Pack 2 + Pack 3 + Pack 4: perform_scan-persistens, deterministiske funn-ID-er, filtrerbare funn, **re-skann bevarer brukerdefinert status** (Pack 2-løftet), **Markdown-eksport med påkrevde seksjoner**, **idempotent ADO-utsending med deterministisk mock-work-item-ID** + Pack 4.2 `is_mock` / `live_error`-form + JSON-Patch-dokumentvalidering, **skann-diff med 4 grupper** + Pack 4.1 snapshot-drevet `diff_mode == "precise"`-assertering, **verify-fix-flyt med statusoverganger**, **miljømatrise med worst-overall-aggregering**, DPIA seed → save → patch). Alle 3 språk parser med paritet (**721 nøkler × 3** etter Fase H+ Enonic-skill-integrasjonssyklusen), frontend-produksjonsbygg lykkes med **0 advarsler i `src/red-cross-qa/`**.

**Fase H+ (1.15.0, 2026-05-21) — Enonic XP-skillet systematisk anvendt på tvers av 13 revisjonsområder**. Kunnskapsbasen `.claude/skills/enonic-xp/` (mønstre for security / performance / reliability / api-design / data-integrity / nashorn-compatibility) drev additive berikelser i hver suite i modulen: 34 nye skill-tilpassede sjekker, 6 nye deterministiske Playwright/Cypress-specs, 5 baseline-trackere i minne for trenddeteksjon (`_GRAPHQL_BASELINES`, `_PERF_HOT_QUERY_BASELINES`, `_DS_COMPLIANCE_BASELINES`, `_ROLE_MATRIX_BASELINES`, `_RESILIENCE_BASELINES`), `cross_tool_refs` på 9 områder som gjør hvert svar selv-navigerbart, og 2 Optional-felt på Fase H `Finding`-skjemaet (`enonic_xp_pattern` + `automation_ref`) slik at hvert funn kan sitere sin skill-seksjon og lenke til en eksisterende automatisert spec. Full retrospektiv i `docs/audits/red-cross-qa-enonic-xp-roundup.md`.

**AGI Progress · Feedback-trilogi (1.15.1 + 1.15.2, 2026-05-22) — A + B + C komplette og sammenkoblede**. Homo Sapiens vs. KI i Test-workshopfanen leverte opprinnelig Alternativ B (flyktig re-kjøring, Pack 3) og Alternativ C (persistent prompt-evolusjon + styring + regresjonssele, Fase E). Det gjenstående hullet — **Alternativ A (kun-logg feedback-persistens)** — landet i 1.15.1 med en ny Mongo-samling `homo_vs_ai_feedback_log` (fallback i minne for workshop-demoer), auto-logging fra Re-run with feedback + Propose revision-handlinger, og et JSON-eksportpanel med ett klikk nederst i workshopfanen. 1.15.2 lukket deretter **A → C-broen**: hvert fanget notat kan promoteres til et Fase E-revisjonsforslag via en `🧬 Promote to revision`-knapp per rad i eksportpanelet, som kaller det eksisterende `proposePromptRevision`-endepunktet med oppføringens lagrede felt (`task`, `user_input`, `previous_ai_output`, `text`) — uten å skrive på nytt. Smoke `smoke_feedback_log.py` 11/11 PASS. Fase E uendret (3/3). Full retrospektiv i `docs/audits/agi-progress-trilogy-roundup.md`.

**Valgfrie miljøvariabler for Red Cross Web QA**:
- `ADO_PAT` (eller `AZURE_DEVOPS_PAT`) — Azure DevOps Personal Access Token med `Work Items: Read & Write`-omfang. Når satt, oppretter `POST /api/qa/security/findings/{id}/dispatch-ado` et ekte ADO work item via REST-API-et; når fraværende, faller utsendingen tilbake til en deterministisk mock slik at workshop-UX-en forblir grønn. Commit aldri verdien — les kun fra `.env`.

### Self-Simulating Reality Agent (1.36.0 · august 2026 — V0+V1+V2+V3)

En seriøst anlagt, epistemisk disiplinert følgesvenn for den mest spekulative ideen på veikartet: forslaget om at observatører, sinn eller bevissthet deltar i konstruksjonen av universet de opplever. Ankerrammeverket er **Observer Patch Holography (OPH)** av Bernhard Mueller et al. Agentens ledesetning — *"Jeg forteller deg ikke hva du skal tro. Jeg viser deg hva som er vitenskap, hva som er teori, hva som er filosofi, og hva som er metafysisk fantasi"* — er ufravikelig. Hver påstand går gjennom en 5-nivås epistemisk klassifikator (`established / mainstream / speculative / philosophy / metaphor / unsupported`) før den slippes.

**Brukerveiledning:** [docs/self-sim-reality-help.md](docs/self-sim-reality-help.md) (også i appens README-visning).

Plassert i sidemenyen under **Future Item Agents** (ikon 🌀). **11 faner**:

1. 🎯 **Overview** — misjon, ledesetning, 5 epistemiske nivåer
2. 📚 **Core Concepts** — 5 OPH-kort fra Muellers presentasjon
3. ⚙️ **OPH Mechanics** — tekniske detaljer om observer-patch-modellen
4. 🧭 **Theory Tour** — **8 teorier** (Friston Predictive Processing, Rovelli Relational QM, 't Hooft/Susskind Holographic, Bostrom Simulation, Tononi IIT, Dehaene GNW, **Celestial Holography**, OPH) hver med forfatter + epistemisk nivå + relasjon til OPH. Under teori-radene: et **Featured Voice-kort for Sabrina Gonzalez Pasterski** (Faculty ved Perimeter Institute, Deputy Director for Simons Collaboration on Celestial Holography, oppdager av den gravitasjonelle spin-memory-effekten sammen med Strominger og Zhiboedov) med lenker til hennes Perimeter-profil, Simons Collaboration, `physicsgirl.com` og den kanoniske arXiv-oversikten 2111.11392.
5. 💬 **Dialogue / Dialog** *(NY · V1 [1.36.0])* — den samtalebaserte agenten. Spør om observatører, sinn, bevissthet, simulering, holografi eller OPH; **hvert svar kommer tilbake strukturert og merket etter evidensnivå** — aldri løs prosa som kan la spekulasjon fremstå som faktum. `POST /api/self-sim-reality/chat` forankrer hver runde i en **kuratert OPH + vitenskap-kunnskapsbase** (12 chunks, hver med sitt eget epistemiske nivå + kilder) hentet via nøkkelord-overlapp («RAG-lite» — en vektorbutikk er den dokumenterte oppgraderingssømmen). Strukturert JSON: `short_answer` + nivå-merkede `sections` (scientific_grounding / speculative_extension / oph_interpretation) + red-team `objections` + `safer_reformulation` (når spørsmålet overdriver) + `suggested_next_question`. Nivåer utenfor paletten klemmes; en trespråklig mock holder fanen i live offline. System-prompten håndhever modulregelen (*aldri «dette er sant», alltid «dette hører til nivå X»*; OPH alltid `speculative`) og flagger forvekslingen observatør-som-apparat vs observatør-som-sinn.
6. 🔍 **WiPhy Search** — live spørringer mot `wiphy.org/api/search`, Pasterskis offentlige MCP-server for gjenfinning av fysikk-påstander (~10 155 artikler · 361 273 påstander · 17 953 konsepter). Korpus-statistikkblokk ved montering + defensiv JSON-parser (godtar flere feltnavn- og wrapper-former) + differensiert `cors` / `http` / `network`-feiltekst med "Open on wiphy.org"-utvei. Artikkel-ID-er lenker til arXiv.
7. 🔬 **Claim Analyzer** *(V2)* — lim inn en sterk påstand (f.eks. *"bevissthet kollapser bølgefunksjonen"*) og backend-LLM-en returnerer 5 paneler: **epistemisk dom**-badge (`mostly_solid / mixed / mostly_overreach / unsupported`), **vitenskapelig kjerne** (hver del med sitt bevisnivå), **overreach** (hver del merket med én av 5 typer: `unsupported / category_error / conflation / overgeneralization / philosophical_leap`), **reformulering** i samme idés ærlige register, og **nøkkelbegreper** som klikkbare chips. Klikk på et begrep bygger bro til WiPhy Search-fanen med søket auto-kjørt via en shell-nivå `{query, nonce}`-tilstand.
8. 🎨 **Playground** *(V3)* — to matchede pedagogiske verktøy stablet vertikalt: **Theory Map** (ren SVG, 8 noder med OPH sentrert og 7 satellitter håndplassert etter strukturell affinitet; 9 typede kanter med distinkte farger: `provides_form`, `structural_parallel`, `competes_with`, `candidate_measure`, `de_mystifies`, `different_framing`, `supports_side`, `extends_to_flat`; klikk på en node → info-panel som leser fra samme i18n-nøkler som Theory Tour) og **Observer Patch Simulator** (HTML5 Canvas 720×380 med `requestAnimationFrame` + `cancelAnimationFrame`-opprydding; N patches med brownsk bevegelse + veggsprett + parvis-overlapp tilstandskonvergens; live konsensus-metrikk `1 - std(states)` vokser mot 100% uten noen global koordinator — den pedagogiske poengen).
9. 🧠 **AI as Observer** — 5 tankeeksperimenter om hvorvidt AI-er kan være observer patches
10. 🌌 **Substrate Question** — 7 filosofiske seksjoner som utvider OPHs ontologi (det harde problemet, substrat vs opplevelse, kosmologisk konvergens, hypotesen om rekursiv forståelse, det platonske spørsmålet, den lingvistiske grensen, tre ærlige posisjoner)
11. 🗺️ **Roadmap & Sources** — V0→V3-faser + 14 referanselenker (OPH repo/learn/book, Mueller X, Bostrom, Rovelli, Susskind, Friston, IIT, GNW, **Pasterski Perimeter, Simons Collaboration, arXiv 2111.11392, physicsgirl.com**) + blokk med kandidat-integrasjoner for full `wiphy.org/mcp` MCP-verktøyintegrasjon (avventer backend-arbeid)

**Backend**:
- `backend/services/self_sim_reality_chat.py` + `backend/routers/self_sim_reality.py` *(V1 [1.36.0])* — `POST /api/self-sim-reality/chat` (+ `GET /concepts`, `GET /health`). Kuratert 12-chunks kunnskapsbase hentet via nøkkelord-overlapp (RAG-lite), strukturert epistemisk-merket JSON med sanitizering/klemming, trespråklig mock. Tester `backend/tests/test_self_sim_reality_chat.py` (6 offline).
- `backend/services/claim_analyzer.py` + `backend/routers/claim_analyzer.py` — `POST /api/claim-analyzer/analyze` som returnerer `{core_scientific[], overreach[], reformulation, epistemic_verdict, key_terms[]}` med streng kun-JSON LLM-prompt og trespråklig mock-fallback.
- `backend/llm.py::_normalize_params_for_model` utvidet i 1.18.4 til å droppe `temperature` og `top_p` på GPT-5.x / o1 / o3-modeller (de godtar kun standardverdien 1) — en kaskaderende fiks som løsnet ~8 andre moduler som stille falt tilbake til sine mocks.

**Frontend** (`frontend/src/self-sim-reality/` + `frontend/src/SelfSimRealityAgent.jsx`):
- 4 nye komponenter i 1.18.4: `WiphySearch.jsx` (316 linjer), `ClaimAnalyzer.jsx` (350 linjer), `Playground.jsx` (30 linjer), `playground/TheoryMap.jsx` (254 linjer), `playground/ObserverPatchSimulator.jsx` (320 linjer).
- Shell-nivå kryssfane-tilstand `{query, nonce}` som bygger bro fra Claim Analyzer → WiPhy Search.
- Én kilde til sannhet: Theory Map leser de samme `theoryTour.rows.*` i18n-nøklene som Theory Tour-fanen, så oppdatering av en teori ett sted forplanter seg automatisk.

**i18n**: Full **EN / ES / NO**-paritet — ~60 nye nøkler per språk i 1.18.4 (Celestial Holography-rad, Featured Voice-kort, WiPhy Search, Claim Analyzer, Playground). Totalt ~180 blader per språk for denne modulen.

Se `docs/self-sim-reality-agent-plan.md` §14 for den fulle 1.18.4-retrospektiven og `docs/CHANGELOG.md` [1.18.4].

### AGI Hub — "Homo Sapiens vs. KI i Test"-fane (april 2026)

Fjerde fane i AGI Progress Hub, skreddersydd som en **workshop-følgesvenn for SOCO** (norsk programvaretestingskonsulentselskap). Rettet mot "Homo Sapiens vs. KI"-sesjonen med Ola Kleiven og Keyhan Farahaninia.

> **Sidemeny-endring (1.7.0):** **AGI Progress** ble forfremmet fra Help-undermenyen til en toppnivå-oppføring i sidemenyen (rett under **Run Test**, ikon 📊) fordi modulen vokste ut av "systemhjelp"-hyllen — 4 faner, AI-berikelse og en full workshop-modul.

Seksjoner på én scroll:
1. **Workshop-hero** — de tre SOCO-refleksjonsspørsmålene som ankere, vertskaps-callout.
2. **Activity Matrix** — 10 kanoniske testaktiviteter × 3 dommer (🧑 Menneske / 🤖 AI / 🤝 Hybrid), hver med begrunnelse og tillitsnivå.
3. **Head-to-head — 10 live-runder** (1:1 med Activity Matrix) som treffer `POST /api/agi/homo-vs-ai/challenge` og strømmer live AI-svar ved siden av et forhåndsskrevet "menneskelig tester"-panel. De ti rundene: `scenarios`, `risk`, `ambiguities`, `exploratory`, `followups`, `automation`, `testData`, `oracle`, `triage`, `accessibility`. En hurtignav-chip-bar lar presentatøren hoppe til en hvilken som helst runde på prosjektoren uten å scrolle.
   - **Step 0 · Problem Router** — et fritekst-panel øverst der testeren beskriver et reelt problem; AI-en velger den best passende runden, forklarer hvorfor, foreslår opptil 2 alternativer og kan forhåndsutfylle den valgte demoens input med ett klikk. Router-prompt v2 bruker en beslutningsrubrikk med 10 regler + 4 few-shot-eksempler på `temperature=0.1` slik at rutingen er deterministisk (f.eks. "Som bruker ønsker jeg å logge inn med Google…" lander pålitelig på `scenarios`, ikke `ambiguities`).
   - **Redigerbart menneskepanel** — hver rundes forhåndsskrevne svar kan redigeres på stedet (Edit / Save / Clear / Restore prewritten). Deltakere kan skrive sitt eget svar før de trykker Run AI. Språkbytte overskriver ikke lenger et redigert panel (dirty-tracked).
   - **AI Judge (rådgivende)** — ved siden av de tre menneskelige `+1`-stemmeknappene kaller en separat **🧠 Ask AI to judge**-knapp `POST /api/agi/homo-vs-ai/judge` og gjengir et dom-panel: dom (🧑/🤖/🤝), tillit, oppdeling per kriterium (nøyaktighet / dekning / praktisk verdi), begrunnelse og et **selv-preferanse-bias-forbehold**. Dommen er kun rådgivende — poengtavlen teller kun din stemme. Når mennesket avgir en stemme, festes dommerens dom i det øyeblikket som et snapshot og vises i Scoreboard-rundeloggen som en badge: `—` (ingen dommer), **grønn `🤖 agreed`**, eller **gul `🤖 said X`**.
4. **Trust framework** — 7-raders beslutningsrutenett ("AI utmerker seg når… / Mennesker utmerker seg når… / Praktisk regel") etter dimensjon: kontekst, risiko, tvetydighet, nyhet, volum, skjønn, ansvarlighet.
5. **Workshop Scoreboard** — konfigurerbare grupper, rundelogg med notater, angre, nullstill, JSON-eksport. Stemmer fra head-to-head-demoene mates inn automatisk og inkluderer nå også `task` + `aiJudge` per runde, så den eksporterte JSON-en er en reviderbar oversikt over hvor ofte rommet og AI-en var enige.
6. **Speaker Crib Sheet** (sammenleggbar, kun for taleren) — 60-sekunders åpning, 4 ekte sitater (Bach, Kaner, Hendrycks, Amodei) med "bruk når"-hint, 5 sannsynlige publikumsspørsmål + forberedte svar, og en avslutning.
7. **Prompt Evolution-panel (Fase E, NY)** — styringsseksjon mellom Speaker Crib Sheet og Future Improvements-footeren. Lukker **Alternativ C-feedback-sløyfen** som ble bevisst utsatt på grunn av "stille drift"-risiko. Når mennesket skriver kritisk feedback under en re-kjøring, ber en gul **🧬 Propose persistent revision**-knapp LLM #2 om å foreslå en permanent diff til oppgavens base-`TASK_SPECS`-prompt. Forslaget lander som `status="pending"` i `homo_vs_ai_prompt_revisions`-samlingen, med full revisjonslogg i `homo_vs_ai_prompt_audit`. Workshop-verten godkjenner / avviser / kjører en regresjonssele (3 kuraterte prøver per oppgave scoret mekanisk på nøkkelord-dekning + lengde + markdown-struktur) / ruller tilbake fra samme panel. Godkjente revisjoner mater alle fremtidige runder; `run_challenge` leser fra Mongo med elegant fallback til TASK_SPECS når ingen revisjon er aktiv eller Mongo er utilgjengelig. LLM-en kan **avvise** utrygge revisjoner (returnerer `status: refused` med `refusal_reason` + risikoflagg); avvisninger lagres for revisjonssporet. En `🧬 Evolved prompt v3`-badge vises ved siden av AI-svar som brukte en evolvert prompt.
8. **Future improvements-fotnote** — fortsatt en dempet parkeringsplass nederst. De leverte elementene er: **Alternativ B** (1.8.0, flyktig *Re-run with feedback*), **Local ISTQB PDF RAG** (1.8.0, BM25 over `docs-ISTQB/*.pdf` for ItemAI/ItemServerAI-leverandører; skyen forblir på ankere), og nå **Alternativ C — persistent prompt-evolusjon (Fase E)** beskrevet over. **Full sky-RAG** med embeddings + vektor-DB forblir bevisst uimplementert (ISTQB-lisensiering er blokkereren).

**ISTQB-forankrede prompter (1.7.1):** hvert AI-kall i modulen er nå forankret i ekte ISTQB-pensumseksjoner (CTFL v4.0 + CT-AI v1.0), pluss en norsk terminologiblokk fra det offisielle ISTQB-NO v2.4-glossaret når sesjonen kjører på norsk. En `📚 ISTQB-anchored`-badge vises på hvert runde-kort, på Problem Router-resultatet og ved siden av AI Judge-dommen — klikk på den avslører de eksakte seksjonene som ble brukt. Implementert som **Alternativ A (kuraterte ankere)**: ~80-150 tokens per prompt, tolerant loader, i samsvar med ISTQB-lisensiering (kun kuraterte korte sammendrag lever i repoet — de fulle PDF-ene forblir gitignored under `docs-ISTQB/`). Se `backend/data/istqb_anchors.json` + `backend/services/istqb_anchors.py`.

**Workshop-iterasjon (1.8.0):** valgfrie **lokale PDF-utdrag** (`backend/services/istqb_local_rag.py`) føyd til system-prompter når `x-api-provider` er `itemai` eller `itemserverai`; svar inkluderer `istqb_rag`-metadata og UI-en viser et grønt/gult **Local ISTQB PDF RAG**-hint. **`GET /api/agi/homo-vs-ai/istqb-rag-status`** rapporterer indeksens helse. Se `docs/CHANGELOG.md` **[1.8.0]**.

Fullt tospråklig **EN / NO / ES** for denne fanen: norsk holder innfødt kvalitet for testere; spansk dekker de samme `homoVsAi.*`-nøklene (inkludert feedback-re-kjøring + RAG-hint).

Backend: `backend/services/homo_vs_ai_service.py` + `backend/routers/homo_vs_ai.py` + `backend/services/istqb_anchors.py` + `backend/services/istqb_local_rag.py` + **`backend/services/prompt_evolution.py`** (Fase E) + **`backend/routers/prompt_evolution.py`** (Fase E) + `backend/data/regression_samples.json` (kuraterte sele-input, 3 per oppgave)
- `POST /api/agi/homo-vs-ai/challenge` — kjør én av 10 testrunder; valgfritt **`previous_ai_output` + `feedback`** for flyktig re-kjøring; svaret inkluderer `istqb_anchors: IstqbAnchor[]`, **`istqb_rag: IstqbRagMeta`** og **`prompt_source: { source: 'baked_in' | 'evolved', revision_id?, version?, approved_by?, approved_at? }`** (Fase E)
- `POST /api/agi/homo-vs-ai/route` — Problem Router (fritekst → beste runde; ankere + valgfri lokal RAG)
- `POST /api/agi/homo-vs-ai/judge` — AI Judge (rådgivende dom; ankere + valgfri lokal RAG)
- `GET  /api/agi/homo-vs-ai/tasks` — oppdagelse
- `GET  /api/agi/homo-vs-ai/istqb-rag-status` — PDF/chunk-tellinger og retriever-modus (for demoer med lokal LM)
- **`POST /api/agi/homo-vs-ai/prompt-evolution/propose`** — LLM #2 foreslår en revidert system-prompt for en oppgave; lagrer pending eller refused (Fase E)
- **`GET  /api/agi/homo-vs-ai/prompt-evolution/revisions`** — liste med `?task=` + `?status=`-filtre
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/approve`** — menneskelig godkjenningsport; erstatter forrige aktive
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/reject`** — avvis med begrunnelse (revisjonslogg)
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/regression`** — kjører den kuraterte selen base vs foreslått, returnerer side-om-side-scorer
- **`POST /api/agi/homo-vs-ai/prompt-evolution/{id}/rollback`** — re-aktiver en tidligere erstattet revisjon
- **`GET  /api/agi/homo-vs-ai/prompt-evolution/active/{task}`** — feilsøkingshjelper: løs den for øyeblikket aktive prompten for en oppgave

Mongo-samlinger (Fase E): `homo_vs_ai_prompt_revisions` (versjonert prompt-historikk, status: pending/active/rejected/superseded/refused) + `homo_vs_ai_prompt_audit` (append-only handlingslogg).

Frontend: `frontend/src/pages/help/agi/HomoSapiensVsAI.jsx` (inkludert `IstqbBadge`, `IstqbRagHint`, feedback-textarea + **Re-run with feedback**, **Fase E** `PromptEvolutionPanel` + `PromptBox` + `RegressionView` + den gule **🧬 Propose persistent revision**-knappen + den grønne **🧬 Evolved prompt**-badgen)
Frontend API-hjelpere: `frontend/src/api/agiApi.js` — `proposePromptRevision / listPromptRevisions / approvePromptRevision / rejectPromptRevision / rollbackPromptRevision / runRegressionHarness / getActivePromptForTask`
Fane-kobling: `frontend/src/pages/help/AgiProgressPage.jsx`
Sidemeny-kobling: `frontend/src/Sidebar.jsx` (toppnivå `agi-progress`-oppføring, gruppe `developer`, ikon `bar-chart`)
i18n: toppnivå `homoVsAi.*`-blokk i `common.json` for **EN, NO og ES** (router, judge, scoreboard, future, **istqb**, demos.feedback*, **evolve.* (Fase E, 34 nøkler × 3 språk)**), pluss `help.agiTabs.homoVsAi` og `sidebar.agiProgress`

**Smoke**: `python -m backend.tests.smoke_prompt_evolution` kjører 8 sjekker som dekker robustheten til `_safe_parse_json`, determinismen til `_score_output`, bakoverkompatibiliteten til `get_active_prompt`, propose→reject-tilstandsoverganger, elegant degradering av regresjonsselen, router-registrering og standardverdien for `ChallengeResponse.prompt_source` — alt uten å kreve Mongo (mock-first) og uten å kreve en LLM (via auto-avvisning).

> **Skal du kjøre dette hos SOCO?** En full presentatør-sjekkliste (pre-flight, 45-minutters kjørerekkefølge, hva du gjør hvis AI-tilkoblingen faller, post-workshop-eksport) finnes i [`docs/README_FULL.md` → Tab 4 → *How to run this in a live workshop*](docs/README_FULL.md#tab-4--homo-sapiens-vs-ki-i-test-soco-workshop-companion).

### AGI Hub — "Update with AI" (april 2026)

Alle tre AGI Progress Hub-fanene har nå et ikke-destruktivt **"Update information from the web with AI"**-panel. Ett klikk kjører et live nettsøk (`websearch-backend` på port 8080 → **DuckDuckGo-fallback** → kun-LLM best-effort) og ber den konfigurerte LLM-en om strukturerte forslag. Hvert forslag gjengis som et kort med **Apply** / **Dismiss**-knapper — ingenting overskrives stille.

- **Tracker** → Apply lagres via det eksisterende `POST /api/agi/progress` (upsert), som validerer `sum(scores) == total`.
- **Possible Endings** → Apply er kun for sesjonen; godtar `quote` (overstyrer et scenarios sitat/attribusjon), `pdoom` (legger til et P(doom)-kort), eller `reference` (legger til en Sources-oppføring). Alle AI-anvendte elementer merkes med en "AI" / "AI UPDATED"-badge.
- **Benefits of AGI** → Apply er kun for sesjonen; legger til et nytt eksempel-punkt (med kildelenke) i målkategorien.

Backend: `backend/services/agi_ai_enrich_service.py`, `backend/routers/agi_ai_enrich.py` → `POST /api/agi/ai-enrich/{tracker|endings|benefits}`
Frontend: `frontend/src/pages/help/agi/AiSuggestions.jsx` (delt panel) + fane-kobling i `AgiTracker.jsx`, `PossibleEndings.jsx`, `BenefitsOfAGI.jsx`
i18n: `ai.*`-nøkler (EN/NO)

### AGI Progress Hub (april 2026)

Den enkeltsides "AGI Progress Tracker" under Help ble omstrukturert til en hub med tre faner (AgentOps-stil) og datasettet oppdatert gjennom 2026:

- **Fane 1 — AGI Progress Tracker**: CHC-inspirert rammeverk fra Hendrycks et al. (2025). Datasettet omfatter nå **14 modeller, oppdatert til august 2026** (web-hentet der det er forbi assistentens kunnskapsgrense): GPT-4 (2023) 27% → GPT-5 (2025) 58% → **Claude Opus 4.6/4.7/4.8** (2025–26) 61/67/71% → **Gemini 3.1 Pro** 61% → de kinesiske åpne-vekt **Kimi K2.6/K3** (Moonshot) 59/66% → **GPT-5.6 «Sol»** 75% → **Claude Opus 5** 76% → **Gemini 3.6 Flash** 66% → **Grok 4.5/4.6** (xAI/SpaceXAI) 68/73% → **Claude Fable 5** 80% (krever bruks-kreditter). Hver modell bærer ekte benchmark-notater (GPQA Diamond, SWE-bench Verified/Pro, ARC-AGI-2, Artificial Analysis Intelligence Index). Long-Term Memory Storage forblir 0 på tvers av alle nåværende LLM-er — den arkitektoniske flaskehalsen fra artikkelen. Ærlig forbehold i notatene: text-first åpne-vekt-modeller (Kimi) kan lede kodebenchmarks, men skårer lavere på *denne* bredde-metrikken fordi syn og lyd veier likt med de andre domenene.
- **Fane 2 — Possible Endings for AGI**: isfjell-visualisering med 12 mulige AGI-fremtider på tvers av 3 soner (Surface / Shallow / Deep), med sone-filter og kort per scenario.
- **Fane 3 — The Benefits of AGI**: kategoriserte kort (Helse, Vitenskap, Utdanning, Produktivitet, Tilgjengelighet, osv.) med konkrete eksempler.
- **Backend-herding**: `DEFAULT_DATA`-seedet er nå idempotent (upsert etter model+year), så oppdatering av standardverdier krever ikke lenger å tømme MongoDB; `POST /api/agi/progress` gjør også upsert. Dropdown/chart-synkronisering fikset ved første render.

Backend: `backend/routers/agi_progress.py`
Frontend: `frontend/src/pages/help/AgiProgressPage.jsx` (fane-container) + `frontend/src/pages/help/agi/{AgiTracker,PossibleEndings,BenefitsOfAGI}.jsx`
Assets: `frontend/public/images/agi-endings-iceberg.png`
i18n: `help.agiHub`, `help.agiTabs`, `help.agiProgress`, `help.agiEndings`, `help.agiBenefits` i EN/NO
Kilde: ["A Definition of AGI" — Hendrycks et al. (Oxford–MIT–Cornell, CAIS, okt. 2025)](https://www.agidefinition.ai/paper.pdf)

### Installing the App in the Cloud (april 2026)

Ny modul for utrullingsplanlegging og sky-klarhet. Gir en interaktiv arbeidsbenk for å migrere plattformen til sky-tjenester (Vercel + Google Cloud Run + MongoDB Atlas + Firebase Auth). Plassert i sidemenyen etter "Future".

**Pack 1 — Frontend-skall (Cursor AI):**
- 4 interaktive faner: Overview, Target Architecture, Environment & Secrets, Smoke Tests & Monitoring
- Klarhets-score-dashboard med 6 seksjonskort og fremdriftssporing
- Arkitekturflyt-diagram med tjenestekort (5 tjenester, 2 faser)
- Miljøvariabel-referanse med kopier-til-utklippstavle, secret/public/optional-klassifisering
- Manuell røyktest-sjekkliste (5 lag: frontend, backend, auth, database, AI) med fremdrift per lag
- Feilsøkingsguide med vanlige sky-utrullingsproblemer
- Full EN/NO i18n (92 nøkler med perfekt paritet)

**Pack 2 — Backend-fundament + sky-herding (Claude Code):**
- **Backend-tjeneste**: `backend/services/cloud_install_service.py` — 7 deterministiske metoder: status (ekte miljøinspeksjon), arkitekturanbefaling (3 budsjettnivåer), env-mal (20 variabler, 6 hemmeligheter, 3 omfang), utrullings-sjekkliste (26 punkter), røyktester (async, treffer ekte endepunkter via httpx), kostnads-baseline (6 punkter), feilsøking (13 punkter, 5 kategorier)
- **Backend-router**: `backend/routers/cloud_install.py` — 7 endepunkter på `/api/cloud-install/*`
- **Typede skjemaer**: `backend/schemas/cloud_install.py` — 18 Pydantic-modeller
- **Utrullingsartefakter**: `deployment/Dockerfile` (Python 3.11-slim, klar for Cloud Run) + `deployment/cloudrun.yaml` (Knative-spec, skala 0-3, prober, Secret Manager-referanser)
- **Sky-klarhetsfikser**: CORS via `ALLOWED_ORIGINS`-miljøvariabel, støtte for `MONGO_URI`-miljøvariabel, `/health` forbedret, `/ready`-endepunkt med MongoDB-ping
- **Frontend-backend-tilkobling**: alle 4 faner koblet til ekte backend med elegant fallback hvis offline
  - CloudOverview → `GET /api/cloud-install/status` (live klarhets-score)
  - CloudTargetArchitecture → `POST /recommend-architecture` + `GET /cost-baseline` (kostnadspanel, utrullingsrekkefølge)
  - CloudEnvSecrets → `POST /generate-env-template` (live statistikkbanner, backend-baserte variabler)
  - CloudSmokeTests → `POST /run-smoke-tests` (automatisk testkjører) + `GET /troubleshooting` (live punkter med alvorlighet)

Backend: `backend/routers/cloud_install.py`, `backend/services/cloud_install_service.py`, `backend/schemas/cloud_install.py`
Frontend: `frontend/src/cloud-install/` (5 komponenter: InstallingAppInCloud, CloudOverview, CloudTargetArchitecture, CloudEnvSecrets, CloudSmokeTests)
Deployment: `deployment/Dockerfile`, `deployment/cloudrun.yaml`
i18n: 92 nøkler EN/NO med full paritet

### EA Second Brain Agent (april 2026)

Full implementasjon av Enterprise Architecture Second Brain-agenten basert på Ketils OutSystems-orienterte visjonsdokumenter. Porteføljehåndtering, impact scoring, teknologi-heatmap, deprecation radar, AI-drevne innsikter og naturlig-språk-spørringer.

- **Portefølje-CRUD**: opprett/rediger/slett porteføljeelementer med teknologistakker, kritikalitetsnivåer (1-5), livssyklusstatuser og EOL-sporing
- **Impact Scoring**: Ketil 6.0-formel — `ImpactScore = 0.40 * Relevance + 0.30 * Criticality + 0.20 * Freshness + 0.10 * Risk`
- **Technology Heatmap**: aggregerings-pipeline som viser teknologibruk-tellinger og risikonivåer
- **Deprecation Radar**: EOL-sporing sortert etter hastegrad
- **AI-drevne innsikter**: LLM-genererte innsikter med porteføljekontekst, statusflyt (New → Acknowledged → In Progress → Resolved/Dismissed)
- **Naturlig-språk-spørringer**: still spørsmål om porteføljen, få strukturerte svar med tillitsscorer
- **Dashboard**: 6 statistikkort, Today's Insights, Deprecation Radar, Tech Heatmap, Lifecycle Distribution, Quick Actions
- **Seed-data**: 8 norske porteføljeelementer, 6 watchlist-elementer, 5 source feeds, 7 realistiske innsikter

Backend: `backend/services/ea_second_brain.py` (~500 linjer), `backend/routers/ea_second_brain.py` (24 endepunkter på `/api/ea-brain/*`), `backend/models/ea.py` (15+ Pydantic-modeller)
Frontend: `frontend/src/EASecondBrain.jsx` + `frontend/src/ea-agent/` (5 fanekomponenter: Dashboard, Insights, Portfolio, Ask, Settings)
Seed: `backend/scripts/seed_ea_brain.py` — kjør med `python -m backend.scripts.seed_ea_brain`
MongoDB: 4 samlinger (`ea_portfolio_items`, `ea_watchlists`, `ea_source_feeds`, `ea_insights`)
i18n: 172 nøkler EN/NO med full paritet

### ATM V&V Test Copilot (april 2026)

Ny agent-modul som implementerer en AI-drevet test-copilot for sikkerhetskritiske arbeidsflyter innen verifikasjon og validering av lufttrafikkstyring (ATM/ATC). Plassert i sidemenyen under "Future Item Agents".

- **Overview Dashboard**: live statistikk, backend-helseindikator, interaktive Quick Actions og et klikkbart scenariokategori-rutenett (navigerer til Scenario Builder med den valgte typen forhåndslastet)
- **Requirement Lab**: innhent krav (6 kildetyper), AI-normaliser til intent/conditions/constraints/expectedBehavior, generer deretter strukturerte testdesign med positive/negative/edge case-tester, automatiseringskandidater og åpne spørsmål
- **Scenario Builder**: generer ATM-scenariomatriser for 7 scenariofamilier (konfliktdeteksjon, sektor-overlevering, banoppdatering, degradert overvåking, samsvarsovervåking, varsel-timing, beredskaps-fallback) med konfigurerbare risikonivåer og egendefinerte parametere
- **Run Analyzer**: last opp testkjøring-artefakter (logger, JSON, XML, konsolloutput), AI-diagnostiser feil med alvorlighetsforslag, rotårsaksanalyse (med tillitsnivåer), berørte områder og foreslåtte neste steg
- **Export**: Markdown-eksport for testdesign og scenariomatriser
- **Forhåndslastede eksempler**: seed-skript med 13 realistiske ATM/ATC-eksempler (5 krav, 3 testdesign, 3 scenariomatriser, 2 testkjøring-analyser) basert på EUROCAE ED-153-, DO-278A- og EUROCONTROL STCA-spesifikasjonene

Backend: `backend/services/atm_copilot.py`, `backend/routers/atm_copilot.py` (17 endepunkter på `/api/atm-copilot/`)
Frontend: `frontend/src/AtmVvTestCopilot.jsx` + `frontend/src/atm-copilot/` (4 fanekomponenter)
Seed: `backend/scripts/seed_atm_examples.py` — kjør med `python -m backend.scripts.seed_atm_examples`
MongoDB: 4 samlinger (`atm_requirement_bundles`, `atm_test_designs`, `atm_scenario_matrices`, `atm_test_runs`)
i18n: 120+ nøkler EN/NO med full paritet
Docs: `docs-md/Readme ATM Agent.md` (frittstående) | `docs/ATM VV Test Copilot.docx` | `Presentation/ATM_VV_Test_Copilot_Presentation.pptx`

### Babel Library AI Intelligence (april 2026)

Komplett 4-fase AI-veikart implementert for Babel Library-modulen:

- **Fase 1 — Intelligent klassifisering**: LLM-drevet klassifisering (11 domener, 3 vanskelighetsnivåer), automatisk tagging, sentence-transformer-embeddings (384d) og hybrid-søk (semantisk 60% + nøkkelord 40%)
- **Fase 2 — Personaliserte anbefalinger**: sporing av brukerinteraksjon med tids-forfall, læringsprofiler, anbefalingsmotor med 4 signaler (mestringsgap, interesse, type/vanskelighet, friskhet) og AI-genererte læringsstier
- **Fase 3 — AI-innholdsgenerering**: ett enkelt LLM-kall per ressurs genererer sammendrag med nøkkelpunkter, 3 spørsmålstyper (flervalg, sant/usant, åpne) med interaktiv vis/skjul-svar, og adaptive læringshint (forutsetninger, neste steg)
- **Fase 4 — Prediktiv intelligens**: trendanalyse med momentum-indikatorer, prognose for etterspørsel vs tilbud, deteksjon av kunnskapsgap per bruker og distribusjon av nettverksekspertise — alt ren dataaggregering, ingen LLM-kall

Backend: `backend/services/babel_intelligence.py`, `babel_predictive.py`, `learning_profile.py`, `recommendation_engine.py`
Routers: `backend/routers/babel_intelligence.py` (13 endepunkter), `learning_profile.py` (5 endepunkter)
Frontend: `frontend/src/BabelLibrary.jsx` — AI-søk, anbefalinger, innholdspaneler, prediktivt dashboard
i18n: 313 nøkler EN/NO med full paritet

### Cybersikkerhetsmodul (april 2026)

Full implementasjon av 10-fanes cybersikkerhetsplattformen over 3 sprinter:
- **Sprint 1**: Posture & Risk (NIST CSF 2.0 domenescorer, risikomåler) + Vulnerabilities (ekte npm/pip/secret-skanning)
- **Sprint 2**: Compliance Tracker (22 kontroller, 5 rammeverk, inline-redigering) + Secure Coding Coach (10 temaer med rike leksjoner)
- **Sprint 3**: Incident Drills (6 scenarier med steg-for-steg-feedback) + Knowledge Base (8 artikler + AI Q&A)
- **Feilrettinger**: MongoDB-persistens for Agent Security, ekte sårbarhetsskannere med elegant fallback

Backend: `backend/routers/cybersecurity.py` (1499 linjer) + `agent_security.py` (785 linjer)
Frontend: `frontend/src/cyber/` (11 komponenter)

### Automatisk testing og AI-validering

Nylig arbeid i dette repoet har fokusert på **automatisk validering, AI-assistert feilsøking og verktøydrevet testing av LLM-arbeidsflyter**.

**Høydepunkter:**
- **MCP-bro-testing**: validering av verktøy gjennom STDIO ↔ HTTP-flyter kompatible med Postman og MCP-lignende klienter.
- **Feilsøkingsflyt**: spor, tilstandsinspeksjon, feilsøking av tilkobling og reproduserbare diagnoser.
- **AI-assistert iterasjon**: rask forbedring av prompter, strategier og systematferd gjennom korte test/måle-sløyfer.
- **Strukturert dokumentasjon for mennesker og agenter**: `docs/agents.md`, `docs/llms.txt`, `docs/TESTING.md`.

### MCP-server / Postman (J-messages Analyzer)

MCP-broen i `backend/mcp_bridge_server.py` oversetter STDIO ↔ HTTP slik at Postman kan påkalle verktøy som `analyze_j_melding` og `list_j_meldinger`.

**Dokumentert feilsøking inkluderer:**
- **`cmd.exe`-problemer på Windows** når Postman starter bro-prosessen.
- **HTTP-fallback-testing** via `POST /api/mcp/j-messages/analyze`.
- **PATH-verifisering** for `cmd.exe` i Windows-miljøer.
- **cURL-eksempler** og reproduserbare forespørselsmønstre i [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).

**Testfilserver**: `python backend/test_mcp_server.py` på port `8888`.

---

## 🧪 Testing

- **Backend**: `pytest` der tester finnes.
- **Frontend**: bevar eksisterende komponentatferd.
- **MCP / API-validering**: [docs/MCP_TESTING_GUIDE.md](docs/MCP_TESTING_GUIDE.md), [docs/POSTMAN_MCP_TESTING.md](docs/POSTMAN_MCP_TESTING.md).
- **Prosjektets testdokumentasjon**: [docs/TESTING.md](docs/TESTING.md).

---

*Workplace Learning With AI — Ignacio Tejera*
