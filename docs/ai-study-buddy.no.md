# AI-studiekompis — slik fungerer den

**AI-studiekompisen** (Hjelp → *AI Study Buddy*) er en assistent inne i appen som
svarer på spørsmål om **denne applikasjonen** — *Workplace Learning With AI
(WLWAI)*—: modulene, agentene, funksjonene og hvordan du bruker dem. Den er
forankret i prosjektets egen dokumentasjon, så den skal ikke finne på funksjoner.

## Hva den kan (konteksten)

For hvert spørsmål bygger kompisen en kontekst fra disse kildene og sender den til
språkmodellen sammen med spørsmålet ditt:

1. **Appoversikt** — et kompakt repo-kart (`docs/llms.txt`): hva appen er,
   tjenester, porter og regler. Alltid inkludert.
2. **Agentkatalog** — hele listen over agenter (navn + kort beskrivelse) fra
   `/api/agents/catalog`. Alltid inkludert, så den kan svare "hvilke agenter har
   appen?".
3. **Relevante hjelpeseksjoner** — de mest relevante seksjonene i hjelpe­dokumentene
   for *ditt konkrete spørsmål* (se *Slik finner den informasjon*).
4. **README-utdrag** — starten av README, lagt til når avkryssingsboksen **Use
   README context** er på (på som standard).

## Slik finner den informasjon (gjenfinning)

Kompisen gjør et lett **nøkkelordsøk** over et kuratert sett hjelpe­dokumenter —
`README.md`, `architecture`, `deployment`, `agents`, `admin-dev`, `n8n`,
`J-messages_Analyzer`, `MCP_TESTING_GUIDE`, `TESTING`— via endepunktet
`GET /api/help/search`. Den:

- deler hvert dokument i seksjoner etter overskrift, på ditt språk (es/no/en);
- rangerer seksjoner etter nøkkelord­treff med spørsmålet, med **høy vekt på
  overskrifter** og et tak på kroppspoeng slik at et langt dokument ikke vinner
  bare på lengde;
- normaliserer aksenter (`cómo` → `como`) og matcher ord­**stammer**
  (`despliega` → finner `despliegue`);
- returnerer de øverste seksjonene pluss en **indeks** over dokumentene.

Disse seksjonene injiseres i konteksten, så svarene kan sitere ekte innhold
(filer, kommandoer, steg) fra dokumentasjonen.

## Kontroller

- **Use README context** (avkryssing) — inkluderer et utdrag av README. På som
  standard. Forhåndsvisningen viser de første linjene av README på ditt språk.
- **Agent** (nedtrekk) — velg én agent for et **fokusert** svar om kun den
  agenten. La den stå på *Select an agent…* for generelle spørsmål.

## Utforming

Skrivefeltet ligger **over** svarpanelet. Spørsmålet ditt blir stående i feltet
etter at du sender det (det tømmes ikke), og det gjentas **ikke** inne i
svarpanelet — så det dupliseres aldri. Svarene vises i panelet under.

## Tips — gode spørsmål

- "Hvilke agenter har denne appen?"
- "Hvordan distribueres appen til skyen?"
- "Hvordan fungerer arkitekturen / backend?"
- "Hvordan konfigurerer jeg n8n?"
- "Forklar J-messages Analyzer" (eller velg den i Agent-nedtrekket)

## Begrensninger

- Den svarer **kun ut fra dokumentert informasjon**. Hvis noe ikke står i
  dokumentene, sier den fra i stedet for å finne på et svar.
- Nøkkelordsøket krysser **ikke** språk: et spørsmål på ett språk matcher kanskje
  ikke et dokument som bare finnes på et annet. De lokaliserte, kuraterte
  dokumentene dekker de vanlige tilfellene; full tverrspråklig gjenfinning ville
  krevd embeddings, som prosjektet unngår for å holde avhengighetene lette.
- Fullstendige svar krever en tilkoblet AI-modell (kompisen streamer via
  `/llm-stream`). Uten den er svarene generiske plassholdere.
