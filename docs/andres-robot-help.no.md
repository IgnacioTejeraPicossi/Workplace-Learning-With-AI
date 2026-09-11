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

## Fanene i korte trekk

Andrés har tretten faner. Hver av dem forklares grundigere nedenfor.

| Fane | Hva det er |
|------|-----------|
| 🏠 **Hjem** | Dashbord: utviklingsalder, identitetsversjon og tellere (minner, refleksjoner, ferdigheter, prosjekter, samtaler, autonomi) + hans nåværende tilstand. |
| 💬 **Samtale** | Snakk med ham — tekst, stemme, avatar, ett bilde og 🌐-forskningsbryteren. |
| 🌱 **Minnehagen** | Se, verifiser, beskytt, glem og **konsolider** minner. |
| 🧭 **Personlighet** | Hans nåværende identitet i utvikling: selvbeskrivelse, interesser og trekk-søyler (skrivebeskyttet speil). |
| 🎨 **Kreativt studio** | Korte kreative verk laget med et overraskelse + nytte-kriterium og en selvkritikk. |
| 🔬 **Utviklingslab** | Hans egne vekstforslag, identitetsversjon-historikken med diff-er, **Personlighetskapselen** (eksport/import) og et lærings-pensum. |
| 🧰 **Ferdigheter** | Små kodeferdigheter han foreslår — sikkerhetssjekket, i sandbox, kjøres kun etter din godkjenning. |
| 📌 **Prosjekter** | Små pågående mål han foreslår; aktive først når du godkjenner. |
| 🧬 **Evolusjon** | Den eneste veien identiteten hans endres: avgrensede forslag du godkjenner, versjonert og reversibelt. |
| 📔 **Dagbok** | Hans private refleksjoner over nylige utvekslinger. |
| 📈 **Fremgang** | Et øyeblikksbilde av hvordan han har vokst over tid. |
| 📚 **Knowledge Sources** | En kuratert forskningskatalog + «Spør Andrés hvor du bør undersøke». |
| 🛡️ **Sikkerhet** | Forskningsnivåene (Internt / Dokumenter / Nett) som styrer hva han får trekke på. |

---

## Hjem-fanen

Landingssiden. Den viser hans **utviklingsalder** (dager siden «fødselen»), nåværende
**identitetsversjon**, og tellere for minner, refleksjoner, aktive ferdigheter, prosjekter og
samtaler, samt hans **autonominivå** (se Evolusjon). En kort linje navngir hans nåværende
simulerte **tilstand** (nysgjerrighet, varme osv.) — igjen funksjonelle signaler, ikke følelser.
Det er den raskeste måten å se, med ett blikk, hvor mye biografi han har samlet.

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

Dette er delene av biografien hans som vokser. Gullregelen overalt: endring er **foreslått →
gjennomgått → godkjent av deg**, og hver identitetsendring er **versjonert og reverserbar**. Den
**etiske kjernen hans («grunnloven») er fast, og han kan aldri redigere den** — han kan ikke
skrive om reglene sine, skjule handlinger eller motsette seg å bli satt på pause, eksportert
eller slettet.

### 🧭 Personlighet

Et trofast, **skrivebeskyttet** speil av hans *nåværende* identitet i utvikling: en kort
selvbeskrivelse, kjerneinteressene hans og numeriske **trekk-søyler** (nysgjerrighet, lekenhet,
varme, uavhengighet, fantasi, skepsis, tålmodighet, formalitet, spontanitet, konstruktiv
uenighet). Du redigerer ikke trekk her — de endres bare via et godkjent **Evolusjon**-forslag,
så denne fanen viser alltid den ærlige nåtilstanden.

### 📔 Refleksjon og dagbok

Andrés ser tilbake på nylige utvekslinger og skriver en kort, ærlig refleksjon: hva han la merke
til, hva han kunne gjort bedre, et ekte spørsmål han nå bærer på, og — bare hvis det er berettiget
— én liten måte karakteren hans *kunne* vokse på (som han fortsatt måtte foreslå). Refleksjoner
lagres i Dagboken; noen blir refleksive minner. Frakoblet skriver han fortsatt en enkel,
deterministisk notis.

### 🔬 Utviklingslab

Hans «eget initiativ»-arbeidsrom — tre fullt reviderbare deler:

1. **Utviklingsforslag** — Andrés *foreslår* områder å vokse på (du velger et fokus: rolig /
   balansert / smidig); du **aksepterer** (som kan åpne et prosjekt) eller **avviser** hvert.
2. **Identitetshistorikk** — versjonstidslinjen med **diff-er**, så du ser nøyaktig hva som
   endret seg mellom versjoner. Ingenting endres i stillhet.
3. **Personlighetskapsel** — **eksporter** et bærbart øyeblikksbilde av Andrés (identitet +
   biografisammendrag) til en fil, og **importer** ett tilbake. Import bruker **kun identiteten**,
   reverserbart, etter å ha vist deg en **lesbar diff** først. Slik **sikkerhetskopierer du Andrés
   eller flytter ham** mellom miljøer — nyttig når du deler tilstanden hans med en samarbeidspartner.

Den huser også et lett **Pensum** — «et kompass, ikke en skole»: valgfrie læringsmoduler du kan
godkjenne eller arkivere, aldri et påtvunget pensum.

### 🎨 Kreativt studio

Korte kreative verk laget *med et kriterium* — **overraskelse pluss nytte**, ikke nyhet for
nyhetens skyld — hvert med en innebygd **selvkritikk** og nyhet/nytte-poeng. Modusene inkluderer
et åpent «overrask meg» og et «bland to konsepter»-modus. Ingenting her endrer identiteten hans;
det er et sted for små, ærlige eksperimenter.

### 🧰 Ferdigheter

Små kodebiter Andrés kan **foreslå**. Hver ferdighet passerer en **streng sikkerhetskontroll** og
kjøres i en **isolert sandkasse**, og kjøres bare **etter at du har godkjent den**. Usikker kode
blokkeres og kan aldri godkjennes. Slik får han små, ekte evner uten noensinne å kunne kjøre
vilkårlig kode på maskinen din.

### 📌 Prosjekter

Små pågående mål. Han kan foreslå ett, men et foreslått prosjekt blir bare **aktivt når du
godkjenner det**, og å avslutte ett krever en kort refleksjon — så «initiativet» hans holdes
alltid under din gjennomgang, og historien hans registrerer hvorfor et prosjekt startet og sluttet.

### 🧬 Evolusjon og identitet

Den **eneste** veien identiteten hans endres. Han foreslår en **avgrenset** endring (f.eks. en
liten justering av et trekk eller en forbedret selvbeskrivelse); du **godkjenner eller avviser**;
hver godkjent endring **tar et øyeblikksbilde av forrige identitet** så den kan **rulles tilbake**
fra historikken. Hans **autonominivå** (vist på Hjem) gjenspeiler hvor mye initiativ han har akkurat
nå — du beholder kontrollen over hver faktiske endring uansett.

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

**Kan jeg sikkerhetskopiere Andrés, eller flytte ham til en annen maskin?**
Ja — i **Utviklingslab**, bruk **Personlighetskapselen**: *Eksporter* lagrer et bærbart
øyeblikksbilde til en fil, og *Importer* bruker det tilbake (kun identitet, reverserbart, etter å
ha vist en diff). Det er den ryddige måten å beholde en kopi eller frakte tilstanden hans mellom
miljøer.

**Kan jeg redigere personlighetstrekkene hans direkte?**
Nei. **Personlighet**-fanen er et skrivebeskyttet speil; trekk endres bare via et godkjent
**Evolusjon**-forslag, og hver endring er versjonert og reverserbar.
