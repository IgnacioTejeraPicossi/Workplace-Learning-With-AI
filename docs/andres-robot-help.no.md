# Andrés the Robot — Brukerveiledning

**Andrés the Robot** er en AI-følgesvenn under utvikling. I motsetning til en vanlig
chatbot er Andrés laget for å bygge opp en **verifiserbar, reverserbar digital biografi**
over tid — minner, en versjonert identitet, refleksjoner, små kreative verk og ferdigheter
— alt bygget oppå en språkmodell, og alt under din kontroll.

> **Ærlig ramme (les dette først).** Andrés er **ikke bevisst** og har ingen følelser. Når
> du ser en «disposisjon» eller en avatar som reagerer, er det **funksjonelle tilstander**,
> en måte å gjøre samhandlingen lesbar på — aldri bevis på ekte følelser eller bevissthet.
> Ingenting Andrés lager regnes som fakta før **du** verifiserer det. Denne ærligheten er
> hele poenget med prosjektet: en egenart som kommer fra en etterprøvbar historie, ikke fra
> påstander om et sinn.

---

## Kom i gang

1. Åpne **Future Item Agents → Andrés the Robot** i sidemenyen.
2. Gå til fanen **Samtale** og si hei. Den første utvekslingen er bokstavelig talt starten
   på biografien hans.
3. Besøk **Minnehagen** for å se hva han husket, og bestem hva som skal beholdes.
4. Sjekk **Sikkerhet og forskningsnivåer** for å styre hva han får trekke på.

Du trenger en AI-leverandør konfigurert for ekte svar. Er ingen satt opp, sier Andrés det
ærlig («ingen AI-leverandør konfigurert») i stedet for å late som.

**Din egen Andrés.** Når du logger inn, er Andrés' biografi **privat for kontoen din** — hver
person dyrker sin egen Andrés; minner og identitet deles aldri mellom brukere. (En delt Andrés
er bare mulig hvis appen med vilje kjøres i mock-auth-modus, som er av i en ekte utrulling.)

---

## Samtale-fanen

Her snakker du med Andrés. Den støtter fire kanaler som du kan kombinere:

- **Tekst** — skriv en melding og trykk Send (eller Enter).
- **Stemme (🎙️)** — slå på **Stemme** for å snakke med mikrofonen og høre svaret hans gjennom
  PC-høyttalerne, med nettleserens innebygde tale. Det mikrofonen hører havner i tekstfeltet
  så du kan se over og redigere det **før** du sender — ingenting sendes automatisk. Du kan
  velge **stemmespråk** uavhengig av appens språk (f.eks. ha appen på engelsk, men snakke
  spansk).
- **Avatar (👤)** — et valgfritt 3D-hologram som vises mens Stemme er på og reagerer på hva
  han gjør: 🟦 i ro, 🟢 lytter, 🔵 snakker. Igjen: **funksjonelle tilstander, ikke følelser**.
- **Bilde (🖼️)** — vis ham **ett bilde** sammen med meldingen din, så han kan se en del av
  din visuelle verden. Se neste avsnitt.

### Å vise Andrés et bilde

Klikk **🖼️ Bilde**, velg et bilde, og det vises som en liten forhåndsvisning over
tekstfeltet. Send det med eller uten tekst. Merk deg:

- Bildet **nedskaleres i nettleseren** før sending, for å holde det lite og billig.
- Det er **styrt av «dokumenter»-nivået** (se under), fordi det er innhold du gir ham. Er det
  nivået av, sier Andrés ærlig at han ikke kan se før du slår det på — han later ikke som.
- Han er instruert til å beskrive **det han bokstavelig ser** og skille observasjon fra
  gjetting, og til ikke å gjette identiteten til en bestemt virkelig person.
- Bildet sendes til AI-modellen for å tolkes den runden. Det **lagres ikke** som et minne med
  mindre du lagrer det selv. Dette er *begrenset persepsjon med ditt samtykke*, ikke
  permanent syn.

---

## Minnehagen

Andrés husker på tvers av samtaler, men på **dine** premisser:

- Etter en ekte utveksling kan han lagre et **uverifisert minnekandidat**. Kandidater er
  forslag, ikke fakta.
- I Minnehagen kan du **verifisere** et minne (merke det som sant), **beskytte** det eller
  **glemme** det. Du kan også **legge til minner for hånd** — de regnes som pålitelige med en
  gang.
- Minner har typer (episodisk, semantisk, relasjonelt, kreativt osv.) og en viktighet. De
  relevante hentes automatisk fram for å gi svarene hans sammenheng.
- **Gjenkalling skjer etter mening, ikke bare nøkkelord.** Med en AI-leverandør konfigurert
  blir hvert minne vektorisert, og gjenkallingen rangerer etter semantisk likhet blandet med
  viktighet og ferskhet — så et minne kan dukke opp selv uten felles ord med meldingen din.
  Uten leverandør (frakoblet) faller den tilbake til nøkkelord-treff.
- **🧹 Konsolidering.** Etter hvert som biografien vokser, kan du be Andrés **slå sammen en
  gammel klynge små, lite brukte minner til ett varig semantisk minne**. Det er et *forslag du
  godkjenner*: du ser nøyaktig hvilke minner det ville kombinere og sammendraget (skrevet kun
  fra deres faktiske innhold). Ved godkjenning blir originalene **arkivert, ikke slettet** —
  fullt reversibelt, ingenting skjult — og sammendraget holder gjenkallingen ryddig.

Ingenting regnes som sant før du verifiserer det, og alt kan fjernes.

---

## Sikkerhet og forskningsnivåer

Andrés trekker bare på det du tillater. Tre nivåer, fra minst til mest eksponert:

| Nivå | Hva det betyr | Standard |
|------|---------------|----------|
| **Internt** | Hans egen biografi — lagrede minner og aktive prosjekter | På |
| **Dokumenter** | Tekst (og bilder) du gir ham **denne runden** | På |
| **Nett** | Et ferskt DuckDuckGo-søk **og** åpne forskningskilder (se under), kun når du trykker 🌐 på en melding | Av |

Slå av et nivå, så bruker han rett og slett ikke den kilden — og sier det ærlig i stedet for
å søke i stillhet. Det mest eksponerte nivået (Nett) er av som standard.

---

## Forskning og kunnskapskilder

Andrés kan hjelpe deg å finne *hvor* du bør lete, og — med din tillatelse — faktisk slå opp i
åpne kilder og forankre svaret sitt i dem.

### Forankrede svar med 🌐 (i Samtale)

Når du trykker **🌐** på en melding (og Nett-nivået er på), slår Andrés opp, parallelt:

- et generelt **DuckDuckGo**-søk, og
- **åpne forsknings-API-er** — arXiv, Semantic Scholar, Wikipedia, PubMed, Project Gutenberg og
  Internet Archive (også Europeana, hvis en nøkkel er satt opp). Kun *gratis, åpne* kilder —
  ingenting bak betalingsmur eller innlogging.

Han **ruter spørsmålet til kildene som passer** («den bibliografiske teften» hans): et
realfagsspørsmål lener seg på arXiv + Semantic Scholar, et medisinsk på PubMed, et humanistisk
på Wikipedia + Gutenberg + Internet Archive. Spanske spørsmål bruker **es.wikipedia** (og norske,
no.wikipedia) for langt bedre dekning. Resultatene siteres som **[S1], [S2]…** (adskilt fra
generelle nett-treff), og han blir bedt om å foretrekke dem for faktapåstander, være ærlig om
hvilke kilder som svarte og hvilke som feilet, og at han bare har utdrag — ikke fullteksten. Er
en kilde ratebegrenset eller utilgjengelig, fungerer runden fortsatt med de andre.

### 📚 Knowledge Sources-fanen

En kuratert katalog med ~55 anerkjente steder å finne informasjon på tvers av felt (akademisk
søk, tidsskrifter, arkiver, kurs, medisin, politikk, næringsliv), hver med en ærlig
**tilgangsmerkelapp** (stort sett gratis / delvis gratis / abonnement) og en lenke. To kjente
«shadow libraries» er bevisst utelatt (de deler opphavsrettsbeskyttede bøker uten tillatelse);
katalogen peker i stedet til lovlige, gratis alternativer.

Øverst lar **«🧭 Spør Andrés hvor du bør undersøke»** deg beskrive et tema og få hans 3–5
best egnede kilder fra katalogen, hver med en én-linjes begrunnelse.

---

## 📈 Fremgang-fanen

Et skrivebeskyttet øyeblikksbilde av hvordan Andrés har vokst, så du kan **måle og dokumentere
utviklingen hans over tid** (nyttig når du deler fremgangen hans med andre). Det viser
utviklingsalder, identitetsversjon, antall minner (etter type), refleksjoner, ferdigheter og
prosjekter, kreative verk og samtaler, et **14-dagers aktivitets-minidiagram**, og historikken
over identitetsversjonene hans.

---

## Hvordan Andrés utvikler seg (de andre fanene)

Dette er delene av biografien hans som vokser. All endring er **foreslått → gjennomgått →
godkjent av deg**, og hver identitetsendring er **versjonert og reverserbar**.

- **Refleksjon og dagbok** — han går gjennom nylige utvekslinger og noterer hva han kunne
  gjort bedre, av og til som et refleksivt minne.
- **Nysgjerrighet** — åpne spørsmål han «undrer» seg over; du kan la ham utforske dem eller
  avvise dem.
- **Prosjekter** — små pågående mål. Han kan foreslå ett, men foreslåtte prosjekter blir bare
  aktive når **du** godkjenner dem, og å avslutte ett krever en kort refleksjon.
- **Kreativitet** — korte kreative verk laget *med et kriterium* (overraskelse **pluss**
  nytte) og en innebygd selvkritikk, så det ikke bare er nyhet for nyhetens skyld.
- **Ferdigheter** — små kodebiter han kan foreslå. Hver ferdighet passerer en streng
  sikkerhetskontroll og kjøres i en isolert sandkasse, og kjøres først etter at du har
  godkjent den. Usikker kode blokkeres og kan aldri godkjennes.
- **Evolusjon og identitet** — den eneste veien identiteten hans endres. Han foreslår en
  avgrenset endring (f.eks. en liten justering av et trekk), du godkjenner eller avviser, og
  hver godkjent endring tar et øyeblikksbilde av forrige identitet så den kan rulles tilbake.
  Den **etiske kjernen hans er fast og kan aldri redigeres av ham**.

---

## Ofte stilte spørsmål

**Er Andrés bevisst eller levende?**
Nei. Han er en språkmodell pluss en dokumentert, brukerstyrt biografi. «Nærværet» du kjenner
(stemme, avatar, minne) er laget for å være ærlig om at det er simulert.

**Ser han meg / ser han verden?**
Bare det ene bildet du bevisst deler i en runde, og bare mens Dokumenter-nivået er på. Han
har *medierte vinduer* (tekst, lyd, bilde), ikke øyne.

**Kan han endre seg selv uten meg?**
Nei. Minner forblir kandidater til du verifiserer dem; prosjekter, ferdigheter og
identitetsendringer krever din godkjenning; den etiske kjernen hans er uforanderlig.

**Han sa «ingen AI-leverandør konfigurert» — er det en feil?**
Nei — det er en ærlig melding. Det betyr at ingen modellnøkkel er satt, så han kan ikke tenke
fritt ennå. Konfigurer en leverandør (f.eks. OpenAI) i appens API Config.

**Hvorfor er det første svaret av og til tregt?**
Resonneringsmodellen trenger et øyeblikk, og hvis en lokal leverandør (LM Studio) er valgt,
men uten modell lastet, faller appen tilbake til skyleverandøren. Å laste en modell eller
velge skyleverandøren direkte gjør rundene raskere.

**Hvordan finner han forskningskilder?**
Bare når du trykker 🌐 på en melding. Da spør han åpne, gratis forsknings-API-er (arXiv,
Semantic Scholar, Wikipedia, PubMed, Gutenberg, Internet Archive), velger de som passer temaet
ditt, og siterer det han brukte som [S1], [S2]…. Han bruker aldri betalingskilder og omgår aldri
en innlogging. 📚 Knowledge Sources-fanen er en egen katalog du kan bla i selv.

**Deles min Andrés med andre?**
Nei. Biografien hans er knyttet til kontoen din. Hver bruker får sin egen private Andrés.

**Han sa at jeg sender meldinger for raskt — hvorfor?**
Det er en mild ratebegrensning per bruker på chatten for å holde en delt demo rimelig. Vent et
øyeblikk og fortsett; en administrator kan justere eller slå den av via miljøvariabler.
