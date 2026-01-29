# Rapport: Hvordan «Analyze file»-modulen fungerer (J-messages Analyzer)

**Dato:** Januar 2026  
**Dokument:** 25-195.jml.docx  
**Kontekst:** Bruk av «Analyze file» med Prompt Manager-prompt; resultatet viser hodet (metadata), innholdsfortegnelse (index) og resten av dokumentet. Opplevelsen av at det går veldig raskt og at AI kanskje ikke analyserer hele dokumentet.

---

## 1. Kort oppsummering

- **Hele dokumentet** blir lest og brukt til å bygge **innholdsfortegnelse (TOC)** og **brødtekst (body)** som du ser i grensesnittet.
- **Kun metadata-delen** (ID, status, datoer, kategori, område, tittel, erstatter/erstattet av) kommer fra **én AI-kall**.
- Til det AI-kallet sendes **hele headeren** pluss **kun de første 4000 tegnene** av brødteksten. Derfor er det raskt, og AI får **ikke** hele dokumentet – det er **bevisst** slik for å begrense tokenbruk og holde metadata-oppgaven fokusert.

---

## 2. Nøyaktig flyt når du velger «Analyze file»

Når du laster opp f.eks. `25-195.jml.docx` og klikker **«Analyze file»**, skjer følgende i backend (`j_messages_analyzer.py`).

### 2.1 Steg 1: Les hele DOCX-filen (ingen AI)

- **Funksjon:** `read_docx_paragraphs(file_bytes)`
- **Hva skjer:** Hele .docx-filen leses. Alle avsnitt og tabeller hentes i rekkefølge (tabeller konverteres til HTML-markører).
- **Resultat:** En liste med alle paragrafer/linjer i dokumentet – **hele dokumentet** er tilgjengelig i minnet.

### 2.2 Steg 2: Dele i header og body (ingen AI)

- **Funksjon:** `split_header_body(paragraphs)`
- **Hva skjer:** Teksten deles ved markøren *«Forskriften lyder etter dette»*. Alt **før** markøren = **header** (ofte metadata, tittel, hjemmel). Alt **etter** = **body** (selve forskriften med kapitler og §).
- **Resultat:** `header_text` (hel) og `body_text` (hel) – fortsatt **hele dokumentet**.

### 2.3 Steg 3: Bygge TOC og body-HTML (ingen AI)

- **Funksjon:** `build_toc_and_body_html(body_text)`
- **Hva skjer:** **Hele** `body_text` går gjennom:
  - Linjer som starter med «Kapittel » → nivå 1 i innholdsfortegnelsen + `<h1>` i HTML.
  - Linjer som starter med «§» → nivå 2 under siste kapittel + `<h2>` i HTML.
  - Alt annet → `<p>` i HTML.
  - Tabell-markører → innsatt som HTML-tabeller.
- **Resultat:** Det du ser som **«index»** (TOC) og **«resten av dokumentet»** (body_html) er altså generert fra **hele** brødteksten, uten AI. Derfor får du alle kapitler og § (Kapittel 1–6, § 1–28 osv.) korrekt.

### 2.4 Steg 4: Metadata med AI (én kall, begrenset input)

- **Funksjon:** `build_metadata_prompt(header_text, body_text)` + `ask_ai_unified_sync(...)`
- **Hva skjer:**
  - Prompten fra Prompt Manager (f.eks. «Extract metadata from this Norwegian fishing regulation document. Return ONLY valid JSON…») brukes.
  - **Til AI sendes:**
    - **Hele** `header_text` (ingen kutting).
    - **Kun de første 4000 tegnene** av `body_text` – dvs. `body_text[:4000]`.
  - Årsaken til 4000 tegn er dokumentert i koden: *«Limit body text to 4000 characters to avoid token limits»*.
- **Resultat:** AI returnerer en JSON med `j_id`, `title`, `status`, `valid_from`, `valid_to`, `replaces_id`, `replaced_by_id`, `category`, `area`. Disse verdiene blir **hodet** du ser (ID, Status, Valid from/to, Replaces, Category, Area, tittel).

### 2.5 Valgfritt: Oppsummering (kun hvis «Summary» ≠ None)

- Hvis du velger f.eks. «Short/Medium/Long» under Summary, gjøres **et ekstra** AI-kall som ber om en oppsummering av forskriften.
- Da brukes **de første 12 000 tegnene** av `body_text` – fortsatt ikke hele dokumentet, men mer enn ved metadata-kallet.

---

## 3. Hvorfor det oppleves raskt, og «analyserer AI hele dokumentet?»

| Del av resultatet | Hvordan det lages | Bruker AI? | Hvor mye av dokumentet? |
|-------------------|-------------------|------------|--------------------------|
| **Hode (metadata)** | AI får prompt + header + **første 4000 tegn** av body | Ja, **én** kall | **Nei** – kun starten av body |
| **Index (TOC)** | Regelbasert (Kapittel / §) på **hele** body | Nei | **Ja** – hele dokumentet |
| **Resten (body_html)** | Regelbasert HTML fra **hele** body | Nei | **Ja** – hele dokumentet |

- **Hastighet:** Mye av arbeidet er lokal Python (les DOCX, splitt, bygg TOC/HTML). Den eneste LLM-runden er metadata med begrenset input (header + 4000 tegn), så svartiden er kort.
- **«Analyserer AI hele dokumentet?»:** **Nei.** AI brukes bare til å **trekke ut metadata** og får med vilje kun en **utklipp** av dokumentet (header + start av body) for å spare tokens og holde oppgaven tydelig. Hele dokumentet er likevel **vist** i grensesnittet fordi TOC og body bygges fra **hele** filen uten AI.

---

## 4. Konklusjon og anbefalinger

- **Designet er bevisst:** Prompten i Prompt Manager sier «Extract metadata» – modulen er ikke bygget for at AI skal «analysere» eller lese hele dokumentet; den skal bare fylle metadatafeltene.
- **Hele dokumentet blir brukt** til det du ser: hodet kommer fra AI (på grunnlag av header + 4000 tegn body), mens index og brødtekst kommer fra full dokumentbehandling uten AI.
- **Hvis du ønsker at AI skal se mer av dokumentet** (f.eks. for bedre kategori/område eller andre felter), kan man vurdere å øke grensen 4000 tegn for metadata-prompten, eller å sende et lengre utdrag – med tanke på tokenbruk og modellgrenser.
- **Valgfri oppsummering** («Summary») bruker allerede 12 000 tegn av body til et eget AI-kall; metadata-kallet forblir 4000 tegn for å holde det raskt og innenfor tokenbegrensninger.

---

*Rapporten er basert på koden i `backend/routers/j_messages_analyzer.py` (lesing av DOCX, `split_header_body`, `build_toc_and_body_html`, `build_metadata_prompt` og `/analyze`-flyten).*
