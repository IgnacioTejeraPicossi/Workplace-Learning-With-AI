# Enkel ROS for J-meldings-MCP i Enonic

---

## 1. Formål

Formålet med denne enkle ROS-en er å vurdere risiko og sårbarheter ved bruk av KI og MCP i forbindelse med håndtering av J-meldinger i Fiskeridirektoratet sitt Enonic-miljø.

Analysen skal:

- Avdekke de viktigste risikoene knyttet til:
  - Integrasjon mellom Enonic og MCP-løsningen.
  - Bruk av tredjeparts KI-tjenester (f.eks. OpenAI, Copilot).
  - Håndtering og sikring av API-nøkler.
- Foreslå konkrete tiltak for å redusere risiko til et akseptabelt nivå.

## 2. Omfang

Denne ROS-en omfatter:

- **MCP-funksjonalitet for J-meldinger:**
  - Analyse av J-meldinger (fra DOCX til strukturert JSON).
  - Opprettelse / oppdatering av J-meldingsinnhold i Enonic.

- **Integrasjon mellom:**
  - Enonic XP (innhold og editorer).
  - Intern KI-/integrasjonsplattform (WLWAI, MCP-server).
  - Eventuelle eksterne KI-tjenester (OpenAI, Copilot, osv.).

**Følgende er ikke med i denne ROS-en (kan nevnes eksplisitt):**

- Generell bruk av KI i hele virksomheten.
- Andre innholdstyper enn J-meldinger.
- Infrastruktur-sikkerhet på et mer overordnet nivå (nettverk, drift av Enonic-plattformen generelt).

## 3. Kort beskrivelse av løsning

- En **MCP-server** gjør spesifikke verktøy tilgjengelig, f.eks.:
  - `analyze_j_melding` (analysere DOCX → JSON).
  - `create_j_melding` / `update_j_melding` (opprette/oppdatere innhold i Enonic).

- En **KI-klient** (ChatGPT, Claude, WLWAI-agent el.l.) kaller MCP-verktøyene.

- **MCP-serveren:**
  - Leser J-melding som fil (DOCX) via URL eller opplasting.
  - Sender tekstlig innhold til KI-tjeneste (hvis relevant).
  - Lager strukturert representasjon (metadata, innholdsfortegnelse, HTML-innhold).
  - Kaller Enonic sitt API for å opprette eller oppdatere J-meldingsinnhold.

## 4. Dataflyt og informasjonstyper

### Dataflyt

```
J-melding (DOCX) → MCP Server → KI-tjeneste (hvis aktuelt) → JSON → Enonic XP
```

**Detaljert flyt:**

1. **Input**: J-melding (DOCX-fil) lastes opp eller hentes fra URL
2. **Parsing**: MCP-server parser DOCX-innhold
3. **Analyse**: Tekst sendes til KI-tjeneste for ekstraksjon av metadata
4. **Strukturering**: Genererer strukturert JSON (metadata, TOC, HTML)
5. **Lagring**: Oppdaterer/oppretter innhold i Enonic via API
6. **Logging**: Logger alle operasjoner og endringer

### Informasjonstyper som behandles

**Typisk innhold:**
- Juridiske tekster og forskrifter
- Paragrafer og regelverk
- Datoer (gyldig fra/til)
- Geografiske områder
- Fiskerireguleringer og kvoter

**Personopplysninger:**
- ❌ **Behandles IKKE personopplysninger** (kun lovtekst og forskrifter)

**Sensitive opplysninger:**
- ❌ **Behandles IKKE sensitive opplysninger** (offentlige forskrifter)

### Lagring og logging

- **J-meldingstekst**: Lagres i MongoDB (backend database)
- **Metadata**: Lagres i MongoDB og Enonic
- **API-respons**: Midlertidig lagring for prosessering
- **Logger**: Strukturert logging av alle MCP-kall og operasjoner

## 5. Tredjepartsløsninger og API-nøkler

### Tredjepartstjenester i bruk

| Tjeneste | Formål | Datatyper som sendes |
|----------|--------|---------------------|
| **OpenAI API** | Ekstraksjon av metadata fra J-melding tekst | Lovtekst, paragrafer (ingen persondata) |
| **OpenRouter** | Alternativ KI-leverandør | Lovtekst, paragrafer (ingen persondata) |
| **ItemAI/LM Studio** | Lokal KI-modell (ingen ekstern sending) | Lovtekst (lokalt) |

### Håndtering av API-nøkler

#### Lagring av nøkler

**Produksjonsmiljø:**
- ✅ Lagres i **secret store / Key Vault** (Azure Key Vault eller tilsvarende)
- ✅ Miljøvariabler på server-side (`.env`-filer, **aldri** i kode)
- ✅ Backend-only: Nøkler er **aldri** eksponert til frontend/klient

**Utviklingsmiljø:**
- `.env`-fil lokalt (ikke committed til Git)
- `.env.example` viser struktur uten faktiske nøkler

#### Tilgangsstyring

**Hvem har tilgang:**
- Backend-applikasjon (service account)
- Autoriserte administratorer (via secret management system)
- **IKKE** frontend eller klientkode
- **IKKE** i logger eller feilmeldinger

#### Rotasjon av nøkler

**Rutiner:**
- Planlagt rotasjon: Hver 90. dag
- Ved mistanke om kompromittering: Umiddelbart
- Ved endring av personell med tilgang: Innen 24 timer

**Prosess:**
1. Generer ny API-nøkkel hos leverandør
2. Oppdater nøkkel i Key Vault / secret store
3. Restart applikasjon for å laste ny nøkkel
4. Verifiser at ny nøkkel fungerer
5. Deaktiver gammel nøkkel hos leverandør
6. Dokumenter rotasjon i logg

#### Sikring mot eksponering

**Tiltak implementert:**

1. **Kode:**
   - ✅ Ingen hardkodede nøkler
   - ✅ `.gitignore` inkluderer `.env`-filer
   - ✅ Pre-commit hooks sjekker for nøkler

2. **Logger:**
   - ✅ API-nøkler filtreres ut fra logger
   - ✅ Kun de første 4 tegnene vises (f.eks. `sk-ab***`)

3. **Frontend:**
   - ✅ Ingen nøkler i JavaScript-kode
   - ✅ Alle KI-kall går via backend API

4. **Feilhåndtering:**
   - ✅ Generiske feilmeldinger til klient
   - ✅ Detaljerte feil kun i server-side logger

## 6. Risikoanalyse (forenklet tabell)

| # | Risiko-beskrivelse | Sannsynlighet | Konsekvens | Risikonivå | Foreslåtte tiltak |
|---|-------------------|---------------|------------|------------|-------------------|
| 1 | API-nøkkel til KI-tjeneste (f.eks. OpenAI) blir eksponert (kode, logg, frontend) og misbrukt | Middels | Høy (økonomisk tap, misbruk av konto) | Middels/Høy | Lagre nøkler kun i secret store / env-vars. Streng tilgangsstyring. Ingen nøkler i repo, logger eller klientkode. Rutine for nøkkelrotasjon. |
| 2 | J-meldingsinnhold eller interne notater sendes til tredjeparts KI-tjeneste i strid med interne retningslinjer | Lav/Middels | Middels/Høy (brudd på policy, omdømme) | Middels | Avklare hva som er lov å sende. Konfigurere KI-klienten slik at bare nødvendige felter sendes (ingen persondata). Dokumentere dette tydelig. |
| 3 | Feil i MCP-integrasjon fører til at feil eller ufullstendige J-meldinger publiseres i Enonic | Middels | Middels/Høy (feil i regelverk på web) | Middels | «Human-in-the-loop»: alle KI-genererte J-meldinger skal gjennomgås av redaktør/jurist før publisering. Logg og sporbarhet på alle endringer. |
| 4 | Uautorisert tilgang til MCP-verktøyene (f.eks. fra feil miljø eller uønsket klient) | Lav/Middels | Høy | Middels | Begrense tilgang til MCP til definerte klienter/miljøer (IP-filter, auth, tokens). Ikke eksponere MCP åpent mot internett uten kontroll. |
| 5 | Mangelfull logging gjør det vanskelig å ettergå hva KI/MCP faktisk har gjort i Enonic | Middels | Middels | Middels | Implementere strukturert logging (hvilket verktøy, hvilken J-ID, tidspunkt, bruker/klient). Lagre referanse til endringer i Enonic (contentId). |

### Risikovurdering - Nivåskala

**Sannsynlighet:**
- **Lav**: Sjelden forekomst, krever spesielle omstendigheter
- **Middels**: Kan forekomme under normale forhold
- **Høy**: Sannsynlig å forekomme uten tiltak

**Konsekvens:**
- **Lav**: Minimal påvirkning, lett å rette
- **Middels**: Betydelig påvirkning, krever ressurser å rette
- **Høy**: Alvorlig påvirkning, potensielt økonomisk tap eller omdømmerisiko

## 7. Tiltak (oppsummert)

### Prioriterte sikkerhetstiltak

#### 1. API-nøkkel sikkerhet

**Implementerte tiltak:**
- ✅ Secret management for alle API-nøkler (Azure Key Vault / miljøvariabler)
- ✅ Ingen nøkler i kode, frontend, eller logger
- ✅ Rotasjonsrutine (90 dager eller ved behov)
- ✅ Tilgangskontroll til nøkler (kun autorisert personell)

**Prosedyrer:**
- Dokumentert prosedyre for nøkkelrotasjon
- Beredskapsplan ved nøkkellekkasje
- Regelmessig audit av tilganger

#### 2. Data governance

**Klare regler for KI-tjenester:**
- ✅ **KUN lovtekst og forskrifter** sendes til eksterne KI-tjenester
- ❌ **ALDRI persondata** eller sensitive opplysninger
- ✅ Dokumentert policy for data til tredjeparter
- ✅ Konfigurerbart per miljø (prod kan bruke kun lokal KI)

**Implementering:**
- Filtrer bort eventuelle persondata før KI-prosessering
- Valideringsrutiner i kode
- Opplæring av brukere

#### 3. Human-in-the-loop

**Godkjenningsprosess:**
- ✅ All KI-generert/oppdatert J-melding **må godkjennes** av fagperson før publisering
- ✅ Arbeidsflyt i Enonic med utkast-status
- ✅ Synlig markering av KI-generert innhold

**Ansvarsfordeling:**
- Redaktør/jurist: Godkjenner juridisk innhold
- IT: Overvåker teknisk drift
- KI-systemet: Forslag og utkast, **ikke** endelig publisering

#### 4. Tilgangsstyring

**MCP Server:**
- ✅ Autentisering via API-token eller OAuth
- ✅ IP-hvitelisting for tillatte klienter
- ✅ Rate limiting for å forhindre misbruk
- ❌ **IKKE** eksponert direkte til internett

**Enonic API:**
- ✅ Dedikert service account med minste nødvendige rettigheter
- ✅ Logging av alle API-kall
- ✅ Tilgangskontroll på innholdstype-nivå

#### 5. Logging og sporbarhet

**Strukturert logging:**
```json
{
  "timestamp": "2025-12-17T10:30:00Z",
  "event": "mcp_tool_call",
  "tool": "analyze_j_melding",
  "j_id": "J-195-2025",
  "user": "service_account",
  "client": "claude_desktop",
  "status": "success",
  "content_id": "abc123"
}
```

**Lagres:**
- Hvilket MCP-verktøy som ble kalt
- Hvilken J-melding (ID)
- Tidspunkt
- Bruker/klient
- Resultat (suksess/feil)
- Referanse til Enonic contentId

**Oppbevaring:**
- Minimum 12 måneder
- Sikker backup
- Tilgangskontroll til logger

#### 6. Beredskap og prosedyrer

**Ved mistanke om nøkkellekkasje:**
1. Deaktiver kompromittert nøkkel umiddelbart
2. Generer og aktiver ny nøkkel
3. Restart tjenester
4. Gjennomgå logger for misbruk
5. Varsle relevant personell
6. Dokumenter hendelse

**Regelmessig vedlikehold:**
- Månedlig: Gjennomgang av logger
- Kvartalsvis: Rotasjon av API-nøkler
- Halvårlig: Oppdatering av ROS
- Årlig: Sikkerhetsaudit

## 8. Konklusjon

### Samlet vurdering

Løsningen for J-meldings-MCP i Enonic vurderes som **akseptabel under forutsetning av at alle foreslåtte tiltak gjennomføres**.

### Styrker ved løsningen

- ✅ Ingen behandling av personopplysninger
- ✅ Kun offentlige forskrifter prosesseres
- ✅ Human-in-the-loop sikrer kvalitet
- ✅ Robust logging og sporbarhet
- ✅ Klare prosedyrer for API-nøkkel håndtering

### Områder som krever oppmerksomhet

- ⚠️ Kontinuerlig oppdatering av sikkerhetsprosedyrer
- ⚠️ Opplæring av brukere i korrekt bruk
- ⚠️ Regelmessig audit av tilganger og logger
- ⚠️ Beredskap ved hendelser

### Betingelser for akseptabel risiko

1. **Implementering av alle tekniske tiltak** beskrevet i kapittel 7
2. **Etablering av prosedyrer** for nøkkelrotasjon og beredskap
3. **Opplæring** av relevant personell
4. **Regelmessig gjennomgang** av logger og tilganger
5. **Dokumentasjon** av alle avvik og hendelser

### Når skal ROS-en oppdateres?

Denne ROS-en skal **oppdateres ved:**

- ✏️ Endringer i arkitektur (ny MCP, ny KI-leverandør)
- ✏️ Utvidet bruk av persondata eller sensitive opplysninger
- ✏️ Større endringer i Enonic-løsningen
- ✏️ Sikkerhetshendelser eller avvik
- ✏️ Nye trusler eller sårbarheter oppdages
- ✏️ Minimum én gang per år (planlagt review)

### Godkjenning

**Dokument opprettet:** 2025-12-17  
**Neste planlagte review:** 2026-06-17

---

## Vedlegg A: Referanser

### Relatert dokumentasjon

- [J-messages Analyzer Module Documentation](./J-messages_Analyzer.md)
- [MCP Testing Guide](./MCP_TESTING_GUIDE.md)
- [Claude Desktop Setup](./CLAUDE_DESKTOP_SETUP.md)
- [Postman MCP Testing](./POSTMAN_MCP_TESTING.md)

### Eksterne ressurser

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Azure Key Vault Best Practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)

---

*Dette dokumentet er en del av sikkerhetsdokumentasjonen for J-messages Analyzer og MCP Server integrasjon.*

