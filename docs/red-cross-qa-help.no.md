# Red Cross Web QA Agent — Brukerveiledning

**Red Cross Web QA Agent** er en 24/7 QA-kopilot for ombyggingen av **rodekors.no** (Enonic XP CMS + en NextJS-frontend). Den hjelper teamet med å teste frontend, API-er, CMS, ytelse, tilgjengelighet, SEO, sikkerhet, innholdskvalitet og releaseklarhet — og gjøre resultatene om til skript, rapporter og Azure DevOps-arbeidselementer.

Den er **mock-first**: hver fane fungerer offline med realistiske eksempeldata, så du kan utforske den uten et live nettsted eller API-nøkler. Når en ekte backend/nettsted er tilgjengelig, brukes den i stedet.

> ⚠️ **KI brukes kun som støtte.** Ekte persondata, produksjonsdata og API-nøkler hører **ikke** hjemme i KI-en. Bekreft banneret i appen før du kjører KI-assisterte handlinger.

## Kom i gang
1. Åpne **Innstillinger** én gang og bekreft (deretter **Lagre**):
   - **Lokal URL** → vanligvis `http://localhost:3000`
   - **Test-URL** → `https://next.lunix.cloud/testside`
   - **Enonic XP admin-URL** → `https://rodekors-xp8dev.enonic.cloud/admin`
2. Velg et **Miljø** (øverst til høyre): `Local` eller `Test`. Header-chipen **🎯** viser det levende målet fra Innstillinger.
3. Velg en **Kjøremodus**: **Generer skript og rapporter** eller **Kjør direkte**.
4. Åpne fanen du trenger. URL-feltene (Performance / Accessibility / Designsystemet) synkes fra Innstillinger når du bytter miljø; andre faner sender samme `base_url` til backend når de genererer skript.
5. Se gjennom resultatet; funn kan sendes til **Azure DevOps** og samles i en **Sprintrapport**.

## Mål-URL-er (presets og Innstillinger)
Standardverdier og ett-klikks chips:
- ❤️‍🩹 **rodekors.no** — produksjon (kun eksplisitt preset).
- 🧪 **https://next.lunix.cloud/testside** — publisert TestSide (NextJS + Enonic XP + GraphQL). Standard **Test**-BASE_URL.
- 💻 **localhost:3000** — **Local**-BASE_URL.

**Enonic XP admin (Content Studio):** `https://rodekors-xp8dev.enonic.cloud/admin` — konfigureres under **Innstillinger → Enonic XP admin‑URL**. Dette er CMS-konsollen, **ikke** den offentlige Test BASE_URL brukt av Playwright / Lighthouse / axe / k6.

### Hvordan Innstillinger styrer alle faner (runtime)
Innstillingene lastes når agenten åpnes og deles med alle faner (`settingsApi.js`):

| Innstilling | Brukes som |
|---|---|
| `env_local_url` | BASE_URL når miljø = **Local** |
| `env_test_url` | BASE_URL når miljø = **Test** |
| `enonic_admin_url` | CMS-adminlenke (CMS QA-fanen + preview-verktøy) |

- Bytting av **Local / Test** i headeren oppdaterer 🎯-chipen og synker URL-feltene på Performance, Accessibility og Designsystemet.
- Etter **Lagre** i Innstillinger oppdateres cachen, så alle faner ser de nye URL-ene med en gang.
- Generatorene (Playwright, Cypress, Postman, k6, Loadster, Forms QA, …) mottar `base_url` fra frontend og bygger den inn i skript — de hardkoder ikke lenger `test.rodekors.no`.

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
| ⚙️ Settings | Local- / Test- / Enonic admin-URL-er, kjøremodus, Azure DevOps-prosjekt, sprintoppsett, terskler — **kilde til sannhet for BASE_URL på tvers av alle faner** |

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
- **Hvor ble `test.lunix.cloud` av?** Den flyttet til **`next.lunix.cloud`** (2026-09-28). Publisert Test-sti er nå **`/testside`**. Den gamle daterte eksempelrapporten beholder sitt opprinnelige navn.
- **Hva med `test.rodekors.no`?** Erstattet som standard Test-URL av **`https://next.lunix.cloud/testside`**. Enonic-admin er **`https://rodekors-xp8dev.enonic.cloud/admin`**.
- **Jeg endret Innstillinger, men en fane viser fortsatt en gammel URL.** Klikk **Lagre** i Innstillinger, bytt Local ↔ Test én gang (eller last siden på nytt). Header-chipen 🎯 skal matche Innstillinger.
- **Kan jeg fortsatt overstyre URL-en på Performance / Accessibility?** Ja — skriv eller velg en preset. Neste miljø-/Innstillinger-synk gjenoppretter BASE_URL fra Innstillinger.
- **Sendes dataene mine til KI?** Bare det du skriver inn. Hold ekte person-/produksjonsdata og API-nøkler utenfor KI-inndata (se banneret).
- **Hvor er tidligere resultater?** I **Runs**-fanen.
- **Hvor finner jeg denne veiledningen i appen?** README Viewer → `docs/red-cross-qa-help.no.md` (også `.md` / `.es.md`).
