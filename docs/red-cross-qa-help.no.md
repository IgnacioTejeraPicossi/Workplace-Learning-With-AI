# Red Cross Web QA Agent — Brukerveiledning

**Red Cross Web QA Agent** er en 24/7 QA-kopilot for ombyggingen av **rodekors.no** (Enonic XP CMS + en NextJS-frontend). Den hjelper teamet med å teste frontend, API-er, CMS, ytelse, tilgjengelighet, SEO, sikkerhet, innholdskvalitet og releaseklarhet — og gjøre resultatene om til skript, rapporter og Azure DevOps-arbeidselementer.

Den er **mock-first**: hver fane fungerer offline med realistiske eksempeldata, så du kan utforske den uten et live nettsted eller API-nøkler. Når en ekte backend/nettsted er tilgjengelig, brukes den i stedet.

> ⚠️ **KI brukes kun som støtte.** Ekte persondata, produksjonsdata og API-nøkler hører **ikke** hjemme i KI-en. Bekreft banneret i appen før du kjører KI-assisterte handlinger.

## Kom i gang
1. Velg et **Miljø** (øverst til høyre): `Local` eller `Test`.
2. Velg en **Kjøremodus**: **Generer skript og rapporter** (lager artefakter du kjører i Cursor / Claude / GitHub Actions) eller **Kjør direkte** (kjører Playwright / Cypress / axe / Lighthouse / k6 i appen når verktøyet er tilgjengelig).
3. Åpne fanen du trenger, sett mål-**URL** (eller klikk en preset-chip), og kjør.
4. Se gjennom resultatet; funn kan sendes til **Azure DevOps** og samles i en **Sprintrapport**.

## Mål-URL-er (presets)
Ett-klikks chips som setter målet for en kjøring:
- ❤️‍🩹 **rodekors.no** — produksjon.
- 🧪 **next.lunix.cloud** — Toms NextJS + Enonic XP + GraphQL-forhåndsvisning (flyttet fra `test.lunix.cloud` 2026-09-28). Det beste smoke-målet for de Enonic-spesifikke sjekkene.
- 💻 **localhost:3000** — din lokale utviklingsbygg.

## Fanene i korte trekk
| Fane | Hva den gjør |
|---|---|
| 📊 Dashboard | Oversikt, backend-/tilkoblingsstatus, hurtiglenker |
| 📋 Test Plan | Generer en testplan fra et Azure DevOps-arbeidselement + akseptkriterier |
| 🎭 Playwright | Generer / kjør Playwright-spec-er (Storybook-bevisst — Toms foretrukne E2E) |
| 🌲 Cypress | Generer / kjør Cypress-spec-er (ad-hoc / ikke-Storybook) |
| 🔌 API QA | Analyser endepunkter, eksporter en Postman-samling, kjør GraphQL-introspeksjon |
| 📝 CMS QA | Testtilfeller for Enonic Content Studio (forhåndsvisning vs publisert, ISR, brutte lenker…) |
| 📑 Forms QA | Skjemasjekker (donasjon / frivillig / kontakt) + funn |
| 📦 Migration | Migrasjonsrevisjon gammelt CMS → Enonic XP (mapping, æøå, 301-er, opphav) |
| ♿ Accessibility | axe-core + Lighthouse + manuell sjekkliste + skjermleserskript, WCAG 2.1 / 2.2 AA |
| ⚡ Performance | Core Web Vitals + Enonic-spesifikk ytelse (GraphQL-waterfall / N+1 / over-fetch) |
| 🎨 Designsystemet | Digdir Designsystemet-samsvarsscore + avvik |
| 🔐 Role Matrix | Rolle-/tilgangsrevisjon (ACL) på tvers av nettstedet |
| 🔥 Stress Test | k6 / Loadster-last + resiliensjekker (brytepunkt-VU, gjenoppretting, drift) |
| 🛡️ Security & Privacy | Sikkerhetsskann + GDPR / DPIA-sjekkliste-arbeidsbenk |
| 🎯 Azure DevOps | Parse innlimte elementer, hent en sprint, opprett arbeidselementer, send en bunt |
| 📈 Sprint Report | Generer automatisk Trines sprintrapport (status, avvik, anbefalinger) |
| ✅ UAT Support | Støttemateriale for brukeraksepttest |
| 🎲 Risk Matrix | Risikoanalyse (sannsynlighet × konsekvens) |
| 📜 Runs | Historikk over hver kjøring — gjenåpne tidligere resultater |
| ⚙️ Settings | Miljø, kjøremodus, sprintoppsett, grunnlinjer |

## Kjøremodi
- **Generer skript og rapporter** — agenten skriver artefaktene (Playwright- / Cypress-spec-er, k6-skript, Postman-samlinger, rapporter) som du kjører i din egen pipeline (Cursor, Claude, GitHub Actions). Ingenting kjøres mot nettstedet.
- **Kjør direkte** — når verktøyet er tilgjengelig, kjører agenten sjekken i appen (Lighthouse, axe, Playwright, k6…) og viser live resultater. Mangler et verktøy, faller den tilbake til mock-data og sier ifra.

## Enonic-XP-signaler
Flere faner viser ekstra signaler i tråd med god Enonic XP-praksis:
- 🧩 **Mønster-badge (skill)** — knytter et funn til en seksjon i et skill-dokument (f.eks. `security-patterns.md §2`).
- 🔗 **Relaterte verktøy og spesifikasjoner** — hvor du finner relevant endepunkt / spesifikasjon.
- **Sammensatt score** (0–100) og **▲ delta vs grunnlinje** — trendsporing mellom kjøringer.

De er informative og vises bare når backend leverer dem (Accessibility, Performance, Role Matrix, Forms QA, Designsystemet, Stress Test).

## Teamkontekst (Tom og Trine)
- **Tom (Tech leder, Røde Kors)** — ombyggingen er NextJS + Enonic XP + Guillotine GraphQL; komponenter bor i **Storybook** med **Playwright** (brukt i stedet for Cypress); **Postman** er den foretrukne måten å pirke på GraphQL. Tom-tips-bannere vises på de relevante fanene.
- **Trine (Testleder)** — **Teststrategien** styrer alvorlighetsgrader (Sev 1–4 i utvikling, Kat A–C i drift) og krever en **rapport per sprint**, som Sprint Report-fanen automatiserer.

## Azure DevOps-flyt
Lim inn et arbeidselement eller hent en sprint, gjør funn om til arbeidselementer, forhåndsvis handlingsbunten, og opprett så elementene eller send bunten. Sending **registrerer** intensjonen; den endrer ikke eksterne systemer av seg selv.

## Ofte stilte spørsmål
- **Trenger jeg et live nettsted eller en API-nøkkel?** Nei — den er mock-first; alt fungerer offline med eksempeldata.
- **Hvor ble `test.lunix.cloud` av?** Den flyttet til **`next.lunix.cloud`** (2026-09-28). Den gamle daterte eksempelrapporten beholder sitt opprinnelige navn.
- **Sendes dataene mine til KI?** Bare det du skriver inn. Hold ekte person-/produksjonsdata og API-nøkler utenfor KI-inndata (se banneret).
- **Hvor er tidligere resultater?** I **Runs**-fanen.
