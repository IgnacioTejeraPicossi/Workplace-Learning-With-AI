# Enonic 'Red Cross' — Hjelp

**Enonic 'Red Cross'**-agenten er en prosjektkunnskaps- og testassistent for Røde Kors'
**Enonic XP 8 / Content Studio 6**-installasjon. Du finner den i sidemenyen under
**Item Agents → Enonic Red Cross**, rett under Humanizing AI.

Den hjelper deg (og nye som ikke kjenner installasjonen) med å forstå plattformen og Røde
Kors-prosjektet, og med å forberede, forklare og feilsøke testene. Den **kjører ikke** tester,
redigerer ikke CMS-et og skriver ikke til Azure DevOps — **Red Cross Web QA Agent** er fortsatt
arbeidsflaten for kjøring og rapportering.

## Hva den gjør

- Forklarer Enonic-plattformen med versjonsbevisste dokumentasjonslenker (XP 8 / Content
  Studio 6, holdt adskilt fra den eldre XP 7).
- Svarer på prosjektspesifikke spørsmål forankret **kun** i en kuratert, kildebelagt
  kunnskapsbase — den dikter aldri opp fakta.
- Lar deg søke i den importerte testkatalogen etter id, tittel, persona, resultat og sprint.
- Skisserer forslag til manuelle testprosedyrer — tydelig merket, med lokale utkast-ider, aldri
  oppdiktede Azure DevOps-ider.

## Fanene

- **Oversikt** — hva agenten er, evidensforklaringen og dens begrensninger.
- **Assistent** — en forankret chat. Spør om plattformen eller installasjonen og hvordan man
  tester den. Hvert svar kommer med siterte kilder, en evidensstatus (underbygd / delvis /
  utilstrekkelig) og, når det er relevant, manglende informasjon og et foreslått
  oppfølgingsspørsmål. Skriv spørsmålet ditt (Ctrl/Cmd+Enter sender) eller trykk på et forslag.
- **Kunnskap** — de forankrede faktaene assistenten kan sitere, hver merket med evidensnivå og
  sin kilde.
- **Testkatalog** — de importerte testsakene. Filtrer på tekst, persona (Sluttbruker /
  Redaktør), resultat og sprint. **Klikk på en saks-id** for å hoppe til Assistenten med
  «Hvordan bør jeg teste sak N?» allerede spurt.
- **Prosjektkontekst** — miljø-URL-er, arkitektur, Azure DevOps-koordinatene og de «kjente
  ukjente» som fortsatt må samles inn.

## Evidensnivåer

Hver påstand assistenten kommer med er merket, så du alltid vet hvor solid den er:

- **Plattformdok** — Enonic-produktdokumentasjon.
- **Prosjektfakta** — et bekreftet faktum om denne konkrete installasjonen.
- **Observasjon** — et datert, miljøspesifikt resultat (ikke live status).
- **Testoppskrift** — et praktisk steg destillert fra å kjøre tester.
- **Veiledning** — et generelt forslag, ikke et etablert prosjektfaktum.

Assistenten presenterer aldri spekulasjon som faktum, sier aldri at den har åpnet Content Studio
eller kjørt en test, og dikter aldri opp offisielle teststeg. Et tidligere «Passed/Active» er en
observasjon på det tidspunktet, ikke en påstand om i dag.

## Testkatalogen

Katalogen inneholder teamets testsaker på tvers av sprinter, importert fra Azure DevOps Test
Plan som **observasjoner** (registrerte utfall), ikke offisielle stegdefinisjoner og ikke live
status. Resultatene mappes slik:

- **Passed → pass** ✅, **Failed → fail** ❌, **Blocked → blocked** ⛔, **Active (ikke kjørt
  ennå) → planned** 🗓️, og **partial** 🟡 der en sak besto med et forbehold.

Én testsak kan høre til flere sprint-suiter, så katalogen er nøklet på **(saks-id, sprint)** —
samme id kan opptre én gang per sprint. Noen saker har i tillegg et notat fra en praktisk
testøkt som går dypere enn det offisielle utfallet; notatet forklarer funnet.

## Hva den (ennå) ikke gjør

Den redigerer ikke CMS-et, publiserer ikke, kjører ikke tester og skriver ikke til Azure DevOps.
Et generert test- eller feilutkast er ikke en kjørt test. Opplasting av egne dokumenter (en
innlasting/godkjennings-pipeline) og skrivebeskyttede live-koblinger til Enonic / Azure DevOps er
planlagt for en senere versjon — se `docs/enonic-red-cross-agent-plan.md`.

## Språk og konfigurasjon

Agenten svarer på engelsk, norsk eller spansk, i tråd med appens språk. Den bruker samme delte
LLM-konfigurasjon som resten av appen (satt under API Config); ingen egen nøkkel trengs. Hvis
ingen modell er tilgjengelig, faller den tilbake til et frakoblet plassholdersvar, tydelig
merket.

## Legge til flere testdata

Nye sprinter legges til ved å utvide katalogen i `backend/services/enonic_red_cross.py` (hver
sak bærer sin `sprint`). Fordi Røde Kors holder Azure DevOps privat, transkriberes sprint-data
fra skjermbilder i stedet for å hentes live.
