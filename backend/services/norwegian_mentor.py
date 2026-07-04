"""
Norsk Mester AI — Service
=========================
Functional V1 for the Norwegian mentor, aimed at a Spanish speaker who already
knows some Norwegian (and speaks English) and wants to perfect it.

NOT a beginner "learn the alphabet" agent. A *perfection* tool tuned to the
things that stay hard: pitch accent (tonelag), the kj/skj/sj sounds, V2 word
order, definite forms, and the tiny filler words (småord) no course teaches.

Nine modules:
  1. Uttale & Tonelag   — sounds + the two tonemes (bønder/bønner, tanken)
  2. Grammatikk         — V2 order, en/ei/et gender, definite forms, tenses
  3. Småord             — jo, da, vel, altså, nok, nå
  4. Ordforråd SRS      — Bokmål frequency vocabulary, SM-2
  5. Germanic Bridge    — EN↔NO cognates + false friends (gift, rar, spent…)
  6. Samtale            — LLM-backed, everyday + work Norwegian
  7. Skriving           — paste text, get feedback
  8. Kultur             — Janteloven (links to Humanizing AI Nordic Lens), dugnad…
  9. Dashboard          — stats + mission

Single-user model (user_id='default'). Meaning fields carry {en, es, no}.
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_ai_unified
except Exception:
    ask_ai_unified = None  # type: ignore

try:
    from backend.db import database
    _VOCAB_COL = database.get_collection("norwegian_vocab_progress")
    _SRS_COL   = database.get_collection("norwegian_srs_reviews")
    _CONV_COL  = database.get_collection("norwegian_conversation_runs")
    _WRITE_COL = database.get_collection("norwegian_writing_runs")
except Exception:
    _VOCAB_COL = _SRS_COL = _CONV_COL = _WRITE_COL = None

DEFAULT_USER = "default"
NORWEGIAN_MENTOR_VERSION = "1.0.0"


# ═══════════════════════════════════════════════════════════════════════════════
# 1 — Uttale (pronunciation) & Tonelag (pitch accent)
# ═══════════════════════════════════════════════════════════════════════════════

_SOUNDS: List[Dict[str, Any]] = [
    {"sound":"kj / tj","example":"kjøtt (meat), kino (cinema)","ipa":"ç",
     "tip":{"en":"The 'kj' sound /ç/ is a soft, hissy 'h'-like sound — closest to a whispered 'sh' with the tongue high. NOT the same as 'sj'. Many young Norwegians now merge it with 'sj', but standard is distinct.",
            "es":"El sonido 'kj' /ç/ es suave y sibilante, parecido a una 'sh' susurrada con la lengua alta. NO es igual que 'sj'. Muchos jóvenes lo fusionan con 'sj', pero el estándar los distingue.",
            "no":"'kj'-lyden /ç/ er en myk, hveste lyd — ikke det samme som 'sj'."}},
    {"sound":"skj / sj / sk(i)","example":"skje (spoon), sjø (sea), ski","ipa":"ʃ",
     "tip":{"en":"All make the English 'sh' sound /ʃ/. 'sk' before i/y/ei also becomes /ʃ/: 'ski' = 'shi'.",
            "es":"Todos producen el sonido 'sh' inglés /ʃ/. 'sk' antes de i/y/ei también: 'ski' = 'shi'.",
            "no":"Alle gir 'sh'-lyden /ʃ/. 'sk' foran i/y/ei blir også /ʃ/."}},
    {"sound":"æ","example":"lære (to learn), være (to be)","ipa":"æ",
     "tip":{"en":"Open front vowel, like the 'a' in English 'cat' but longer. Spanish has nothing like it.",
            "es":"Vocal anterior abierta, como la 'a' de 'cat' en inglés pero más larga. El español no la tiene.",
            "no":"Åpen fremre vokal, som 'a' i engelsk 'cat'."}},
    {"sound":"ø","example":"øl (beer), søt (sweet)","ipa":"ø",
     "tip":{"en":"Round your lips as for 'o' but say 'e'. Like French 'eu' or German 'ö'.",
            "es":"Redondea los labios como para 'o' pero di 'e'. Como la 'eu' francesa o la 'ö' alemana.",
            "no":"Rund leppene som for 'o', men si 'e'."}},
    {"sound":"å","example":"båt (boat), gå (to go)","ipa":"oː",
     "tip":{"en":"Like the 'o' in English 'more' / Spanish 'o' but rounder and often long. NOT the Norwegian 'o' (which sounds like 'oo').",
            "es":"Como la 'o' de 'more' en inglés / 'o' española pero más redonda y a menudo larga. NO es la 'o' noruega (que suena 'u').",
            "no":"Som 'o' i engelsk 'more', men rundere."}},
    {"sound":"o","example":"bok (book), sol (sun)","ipa":"uː",
     "tip":{"en":"Norwegian 'o' usually sounds like English 'oo' /uː/, NOT like Spanish 'o'. 'bok' = 'book'-ish → 'boohk'.",
            "es":"La 'o' noruega suele sonar como 'oo' inglesa /uː/, NO como la 'o' española. 'bok' ≈ 'buuk'.",
            "no":"Norsk 'o' høres ofte ut som engelsk 'oo'."}},
    {"sound":"u","example":"hus (house), du (you)","ipa":"ʉː",
     "tip":{"en":"A tight, central rounded vowel /ʉ/ — purse your lips and say 'ee'. Unique; not Spanish 'u'.",
            "es":"Vocal central cerrada y redondeada /ʉ/ — frunce los labios y di 'i'. Única; no es la 'u' española.",
            "no":"En trang, sentral rundet vokal /ʉ/."}},
    {"sound":"y","example":"ny (new), by (city)","ipa":"yː",
     "tip":{"en":"Round lips as for 'u' but say 'ee'. Like German 'ü' / French 'u'.",
            "es":"Redondea los labios como para 'u' pero di 'i'. Como la 'ü' alemana / 'u' francesa.",
            "no":"Rund leppene som for 'u', men si 'ee'."}},
    {"sound":"r","example":"rød (red), bra (good)","ipa":"ɾ / ʁ",
     "tip":{"en":"Eastern Norwegian rolls/taps the 'r' (like Spanish!) — an advantage for you. Western/Southern uses a French-style guttural 'r'. Retroflex: r+t/d/n/l/s merge (norsk 'rs' → 'sh').",
            "es":"El noruego oriental vibra la 'r' (¡como en español!) — una ventaja para ti. El occidental/sur usa una 'r' gutural francesa. Retrofleja: r+t/d/n/l/s se fusionan.",
            "no":"Østnorsk ruller 'r' (som spansk!). Vestnorsk bruker skarre-r."}},
    {"sound":"long vs short vowel","example":"tak (roof) vs takk (thanks)","ipa":"ɑː vs ɑ",
     "tip":{"en":"Vowel LENGTH is meaning-bearing. One consonant after = long vowel; double consonant = short vowel. 'tak' (long, roof) vs 'takk' (short, thanks); 'lat' (lazy) vs 'latt' (laughed).",
            "es":"La LONGITUD de la vocal cambia el significado. Una consonante después = vocal larga; consonante doble = vocal corta. 'tak' (largo, techo) vs 'takk' (corto, gracias).",
            "no":"Vokallengde er betydningsbærende. 'tak' vs 'takk'."}},
]

# Tonelag (pitch accent) — the star differentiator. Oslo/Eastern realization.
_TONEMES: List[Dict[str, Any]] = [
    {"pair":"tanken","t1":"the tank (en tank → tanken)","t2":"the thought (en tanke → tanken)",
     "note":{"en":"A true homograph pair: spelled identically, distinguished ONLY by tone. Accent 1 (low-then-rising, from 'tank') vs Accent 2 (high-falling-then-low, from 'tanke').",
             "es":"Un par homógrafo real: se escriben igual, se distinguen SOLO por el tono. Acento 1 (bajo y ascendente, de 'tank') vs Acento 2 (alto-descendente-luego-bajo, de 'tanke').",
             "no":"Ekte homograf-par: skrives likt, skilles KUN av tonelag."}},
    {"pair":"ånden","t1":"the spirit / ghost (en ånd → ånden)","t2":"the breath (en ånde → ånden)",
     "note":{"en":"Another homograph: 'the ghost' (Accent 1) vs 'the breath' (Accent 2). The Holy Ghost is 'Den Hellige Ånd' — Accent 1.",
             "es":"Otro homógrafo: 'el espíritu' (Acento 1) vs 'el aliento' (Acento 2).",
             "no":"Homograf: 'ånden' (spøkelset, tonem 1) vs 'ånden' (pusten, tonem 2)."}},
    {"pair":"bønder / bønner","t1":"bønder = farmers (Accent 1)","t2":"bønner = beans / prayers (Accent 2)",
     "note":{"en":"The textbook classic. Near-minimal (d vs n), but the standard illustration of the two tonemes. If you flatten the tone, Norwegians may hear the wrong word.",
             "es":"El ejemplo clásico de los libros. Casi-mínimo (d vs n), pero la ilustración estándar de los dos tonemas. Si aplanas el tono, pueden entender otra palabra.",
             "no":"Læreboka-klassikeren for de to tonemene."}},
    {"pair":"loven / låven","t1":"loven = the law (Accent 1)","t2":"låven = the barn (Accent 2)",
     "note":{"en":"Different vowel (o/å) AND tone. Illustrates how tone rides on top of the vowel system.",
             "es":"Vocal distinta (o/å) Y tono. Muestra cómo el tono se monta sobre el sistema vocálico.",
             "no":"Ulik vokal (o/å) og tonelag."}},
]

_TONELAG_INTRO = {
    "en": "Norwegian is a PITCH-ACCENT language. Most two-syllable words carry one of two 'tonemes'. In Oslo/Eastern Norwegian: Accent 1 is a low, flat first syllable; Accent 2 is a high, sharply falling first syllable. This 'singing' quality is what makes Norwegian sound Norwegian — and flattening it is the #1 giveaway of a foreign accent, even at an advanced level.",
    "es": "El noruego es una lengua de ACENTO TONAL. La mayoría de palabras bisílabas llevan uno de dos 'tonemas'. En noruego de Oslo/oriental: el Acento 1 tiene una primera sílaba baja y plana; el Acento 2, una primera sílaba alta y bruscamente descendente. Esa cualidad 'cantada' es lo que hace que el noruego suene noruego — y aplanarla es la señal nº1 de acento extranjero, incluso en nivel avanzado.",
    "no": "Norsk er et TONELAGSSPRÅK. De fleste tostavelsesord bærer ett av to tonem. I Oslo/østnorsk: tonem 1 har en lav, flat første stavelse; tonem 2 en høy, brått fallende første stavelse.",
}


def get_pronunciation() -> Dict[str, Any]:
    return {"sounds": _SOUNDS, "tonemes": _TONEMES, "tonelag_intro": _TONELAG_INTRO}


# ═══════════════════════════════════════════════════════════════════════════════
# 2 — Grammatikk
# ═══════════════════════════════════════════════════════════════════════════════

_GRAMMAR: List[Dict[str, Any]] = [
    {"id":"g1","level":"core","title":"V2 word order (verbet på andreplass)",
     "pattern":"[Front element] + VERB + subject + …",
     "explanation":{
        "en":"The finite verb MUST be the second element in a main clause. If anything other than the subject comes first (a time phrase, an object), the subject moves AFTER the verb (inversion). This is the single hardest structural habit for Spanish/English speakers.",
        "es":"El verbo conjugado DEBE ir en segunda posición en la oración principal. Si algo distinto del sujeto va primero (una expresión de tiempo, un objeto), el sujeto pasa DESPUÉS del verbo (inversión). Es el hábito estructural más difícil para hispano/anglohablantes.",
        "no":"Det finitte verbet MÅ stå på andreplass i en hovedsetning."},
     "examples":[
        {"no":"Jeg drikker kaffe om morgenen.","gloss":"I drink coffee in the morning. (subject first — normal)"},
        {"no":"Om morgenen drikker jeg kaffe.","gloss":"In the morning drink I coffee. (time first → verb 2nd → subject after)"}],
     "commonMistake":{
        "en":"❌ 'Om morgenen jeg drikker kaffe' → ✓ 'Om morgenen drikker jeg kaffe' (invert!).",
        "es":"❌ 'Om morgenen jeg drikker kaffe' → ✓ 'Om morgenen drikker jeg kaffe' (¡invierte!).",
        "no":"❌ 'Om morgenen jeg drikker' → ✓ 'Om morgenen drikker jeg'."}},
    {"id":"g2","level":"core","title":"Gender: en / ei / et",
     "pattern":"en gutt (m) · ei/en jente (f) · et hus (n)",
     "explanation":{
        "en":"Three genders: masculine (en), feminine (ei — often optional, can use en), neuter (et). The gender decides the definite ending: -en / -a / -et. In Bokmål you can usually use 'en' for feminine nouns too (en jente / jenta).",
        "es":"Tres géneros: masculino (en), femenino (ei — a menudo opcional, puedes usar en), neutro (et). El género decide la terminación definida: -en / -a / -et. En Bokmål puedes usar 'en' también para femeninos.",
        "no":"Tre kjønn: hankjønn (en), hunkjønn (ei), intetkjønn (et)."},
     "examples":[
        {"no":"en bil → bilen","gloss":"a car → the car (masculine)"},
        {"no":"et hus → huset","gloss":"a house → the house (neuter)"}],
     "commonMistake":{
        "en":"Neuter nouns are the trap — memorise them: 'et barn', 'et år', 'et eple'.",
        "es":"Los sustantivos neutros son la trampa — memorízalos: 'et barn', 'et år', 'et eple'.",
        "no":"Intetkjønnsord må pugges: 'et barn', 'et år'."}},
    {"id":"g3","level":"core","title":"Definite form is a SUFFIX",
     "pattern":"noun + -en/-a/-et (not a separate word)",
     "explanation":{
        "en":"Unlike Spanish 'el/la' or English 'the', Norwegian attaches the definite article to the END of the noun: hus → huset (the house), bil → bilen (the car). With an adjective you get 'double definiteness': den store bilen (the big car).",
        "es":"A diferencia del 'el/la' español o el 'the' inglés, el noruego pega el artículo definido al FINAL del sustantivo: hus → huset. Con adjetivo aparece la 'doble definición': den store bilen.",
        "no":"Bestemt form er et suffiks: hus → huset. Med adjektiv: den store bilen."},
     "examples":[
        {"no":"boka ligger på bordet","gloss":"the book is on the table (both suffixed)"},
        {"no":"det gamle huset","gloss":"the old house (double definiteness: det … -et)"}],
     "commonMistake":{
        "en":"With an adjective you need BOTH: 'det gamle huset', not 'gamle huset' or 'det gamle hus'.",
        "es":"Con adjetivo necesitas AMBOS: 'det gamle huset'.",
        "no":"Med adjektiv trengs begge: 'det gamle huset'."}},
    {"id":"g4","level":"core","title":"Present & past tense",
     "pattern":"å snakke → snakker (pres) → snakket (past)",
     "explanation":{
        "en":"Norwegian has NO person conjugation — the verb is the same for jeg/du/han/vi/de. Present usually adds -r; past adds -et/-te/-de depending on the verb class. Irregular strong verbs change the vowel (drikke → drakk → drukket).",
        "es":"El noruego NO conjuga por persona — el verbo es igual para jeg/du/han/vi/de. El presente añade -r; el pasado añade -et/-te/-de según la clase. Los verbos fuertes irregulares cambian la vocal (drikke → drakk).",
        "no":"Norsk bøyer ikke etter person. Presens: -r. Preteritum: -et/-te/-de."},
     "examples":[
        {"no":"jeg snakker / du snakker / de snakker","gloss":"same form for all persons"},
        {"no":"drikke → drakk → har drukket","gloss":"strong verb (vowel change)"}],
     "commonMistake":{
        "en":"Don't add person endings: ❌ 'han snakkar' → ✓ 'han snakker'. No 's' like English 3rd person.",
        "es":"No añadas terminaciones de persona: ✓ 'han snakker'. Sin 's' como la 3ª persona inglesa.",
        "no":"Ikke bøy etter person: ✓ 'han snakker'."}},
    {"id":"g5","level":"advanced","title":"Adjective agreement",
     "pattern":"en fin bil · et fint hus · fine biler",
     "explanation":{
        "en":"Adjectives agree with the noun: add -t for neuter singular (fint), -e for plural and definite (fine). 'en fin bil' but 'et fint hus' and 'fine biler' / 'den fine bilen'.",
        "es":"Los adjetivos concuerdan: añade -t para neutro singular (fint), -e para plural y definido (fine). 'en fin bil' pero 'et fint hus' y 'fine biler'.",
        "no":"Adjektiv samsvarsbøyes: -t (intetkjønn), -e (flertall/bestemt)."},
     "examples":[
        {"no":"et stort hus","gloss":"a big house (neuter → -t)"},
        {"no":"de store husene","gloss":"the big houses (plural/definite → -e)"}],
     "commonMistake":{
        "en":"Don't forget the -t on neuter: ❌ 'et stor hus' → ✓ 'et stort hus'.",
        "es":"No olvides la -t en neutro: ✓ 'et stort hus'.",
        "no":"Ikke glem -t i intetkjønn: ✓ 'et stort hus'."}},
    {"id":"g6","level":"advanced","title":"Possessives (min/mi/mitt/mine)",
     "pattern":"bilen min · boka mi · huset mitt · bøkene mine",
     "explanation":{
        "en":"Possessives agree with the possessed noun's gender, and usually come AFTER the noun in the definite form: 'bilen min' (my car), 'huset mitt' (my house). Placing them before (min bil) is more emphatic/formal.",
        "es":"Los posesivos concuerdan con el género del sustantivo poseído y suelen ir DESPUÉS del sustantivo en forma definida: 'bilen min', 'huset mitt'. Ponerlos delante (min bil) es más enfático/formal.",
        "no":"Eiendomsord samsvarer i kjønn og står oftest etter substantivet: 'bilen min'."},
     "examples":[
        {"no":"broren min bor i Oslo","gloss":"my brother lives in Oslo (after noun — neutral)"},
        {"no":"det er mitt ansvar","gloss":"it's my responsibility (before noun — emphatic)"}],
     "commonMistake":{
        "en":"After the noun, use the DEFINITE noun: 'bilen min' not 'bil min'.",
        "es":"Tras el sustantivo, usa la forma DEFINIDA: 'bilen min' no 'bil min'.",
        "no":"Etter substantivet: bestemt form — 'bilen min'."}},
]

_GRAMMAR_MAP = {g["id"]: g for g in _GRAMMAR}


def get_grammar_path(level: str = "all") -> List[Dict[str, Any]]:
    if level == "all":
        return _GRAMMAR
    return [g for g in _GRAMMAR if g["level"] == level]


def get_grammar_point(point_id: str) -> Optional[Dict[str, Any]]:
    return _GRAMMAR_MAP.get(point_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 3 — Småord (the tiny words no course teaches)
# ═══════════════════════════════════════════════════════════════════════════════

_SMAORD: List[Dict[str, Any]] = [
    {"word":"jo","meaning":{"en":"'yes' contradicting a negative; also 'as you know' softener","es":"'sí' contradiciendo una negación; también matiz de 'como sabes'","no":"'jo'"},
     "example":"«Du liker ikke kaffe?» «Jo!» (Yes I do!) / «Det er jo sant.» (It's true, as you know.)"},
    {"word":"da","meaning":{"en":"'then'; also a soft emphasis/urging at sentence end","es":"'entonces'; también énfasis suave al final","no":"'da'"},
     "example":"«Kom igjen da!» (Come on then!) / «Ha det da.» (Bye then.)"},
    {"word":"vel","meaning":{"en":"'well / I suppose'; seeks mild agreement","es":"'bueno / supongo'; busca acuerdo leve","no":"'vel'"},
     "example":"«Det går vel bra?» (It'll be fine, right?)"},
    {"word":"altså","meaning":{"en":"'so / I mean / that is'; filler + clarifier","es":"'o sea / es decir'; muletilla + aclaración","no":"'altså'"},
     "example":"«Jeg mener, altså, det er komplisert.» (I mean, like, it's complicated.)"},
    {"word":"nok","meaning":{"en":"'probably / I dare say'; also 'enough'","es":"'probablemente / me atrevo a decir'; también 'suficiente'","no":"'nok'"},
     "example":"«Han kommer nok snart.» (He'll probably come soon.)"},
    {"word":"nå","meaning":{"en":"'now'; also a soft interjection / attention-getter","es":"'ahora'; también interjección suave","no":"'nå'"},
     "example":"«Nå, hva synes du?» (Now, what do you think?)"},
    {"word":"jaha / jaså","meaning":{"en":"'I see / oh really'; acknowledgement","es":"'ya veo / ah, ¿sí?'; reconocimiento","no":"'jaha/jaså'"},
     "example":"«Jaså, så du reiser i morgen?» (Oh, so you're leaving tomorrow?)"},
    {"word":"liksom","meaning":{"en":"'like / sort of'; hedge (informal, youth)","es":"'como / en plan'; atenuador (informal, juvenil)","no":"'liksom'"},
     "example":"«Det var liksom ikke gøy.» (It wasn't really fun, like.)"},
    {"word":"visst","meaning":{"en":"'apparently / I hear'; reported/hearsay","es":"'al parecer / según dicen'; indirecto","no":"'visst'"},
     "example":"«Han er visst syk.» (He's ill, apparently.)"},
    {"word":"jommen / jaggu","meaning":{"en":"'indeed / by golly'; mild emphatic","es":"'ciertamente / vaya'; énfasis suave","no":"'jommen/jaggu'"},
     "example":"«Det var jaggu godt!» (That was good, I must say!)"},
]


def get_smaord() -> List[Dict[str, Any]]:
    return _SMAORD


# ═══════════════════════════════════════════════════════════════════════════════
# 4 — Vocabulary (Bokmål frequency)
# ═══════════════════════════════════════════════════════════════════════════════

# Tuples: (word, pos, meaning_en, meaning_es, example, level)
_VOCAB_TUPLES = [
    ("likevel","adv","anyway, nevertheless","aun así, de todos modos","Det regnet, men vi gikk likevel.","B1"),
    ("kanskje","adv","maybe, perhaps","quizás","Kanskje han kommer i morgen.","A2"),
    ("egentlig","adv","actually, really","en realidad","Jeg er egentlig ganske trøtt.","B1"),
    ("nettopp","adv","exactly; just now","exactamente; justo ahora","Han gikk nettopp.","B1"),
    ("dessuten","adv","besides, moreover","además","Dessuten er det billig.","B1"),
    ("etter hvert","phrase","gradually, in time","poco a poco, con el tiempo","Det blir bedre etter hvert.","B1"),
    ("å bli","verb","to become; to stay","llegar a ser; quedarse","Jeg vil bli lærer.","A2"),
    ("å synes","verb","to think / find (opinion)","opinar, parecer","Jeg synes det er fint.","A2"),
    ("å slippe","verb","to avoid having to; to drop","librarse de; soltar","Du slipper å betale.","B1"),
    ("å rekke","verb","to make it in time; to reach","llegar a tiempo; alcanzar","Rekker vi bussen?","B1"),
    ("å orke","verb","to have the energy for","tener ganas/energía para","Jeg orker ikke mer.","B1"),
    ("å gidde","verb","to bother (to do)","molestarse en, tener ganas","Jeg gidder ikke å gå ut.","B1"),
    ("koselig","adj","cosy, pleasant","acogedor, agradable","For en koselig kveld!","A2"),
    ("dyktig","adj","skilled, capable","competente, hábil","Hun er veldig dyktig.","B1"),
    ("nødvendig","adj","necessary","necesario","Det er ikke nødvendig.","B1"),
    ("tilgjengelig","adj","available","disponible","Er du tilgjengelig i morgen?","B2"),
    ("sammenheng","noun","context, connection","contexto, relación","i denne sammenhengen","B2"),
    ("erfaring","noun","experience","experiencia","Jeg har lang erfaring.","B1"),
    ("mulighet","noun","possibility, opportunity","posibilidad, oportunidad","en fin mulighet","B1"),
    ("utfordring","noun","challenge","desafío, reto","en stor utfordring","B1"),
    ("løsning","noun","solution","solución","Vi fant en løsning.","B1"),
    ("forslag","noun","suggestion, proposal","propuesta, sugerencia","Har du et forslag?","B1"),
    ("ansvar","noun","responsibility","responsabilidad","Det er mitt ansvar.","B1"),
    ("hensikt","noun","purpose, intention","propósito, intención","Hva er hensikten?","B2"),
    ("sammen","adv","together","juntos","Vi jobber sammen.","A2"),
    ("å foreslå","verb","to suggest","proponer, sugerir","Jeg foreslår at vi venter.","B1"),
    ("å innebære","verb","to entail, to involve","implicar, conllevar","Hva innebærer det?","B2"),
    ("å vurdere","verb","to consider, assess","considerar, evaluar","Vi må vurdere alternativene.","B2"),
    ("å påvirke","verb","to affect, influence","afectar, influir","Det påvirker resultatet.","B2"),
    ("å utvikle","verb","to develop","desarrollar","å utvikle et produkt","B1"),
    ("tydelig","adj","clear, obvious","claro, evidente","et tydelig svar","B1"),
    ("grundig","adj","thorough","minucioso, a fondo","en grundig analyse","B2"),
    ("rimelig","adj","reasonable; cheap","razonable; barato","en rimelig pris","B1"),
    ("omtrent","adv","approximately","aproximadamente","omtrent ti personer","B1"),
    ("stort sett","phrase","mostly, by and large","en general, más o menos","Det går stort sett bra.","B1"),
    ("å tåle","verb","to tolerate, withstand","tolerar, aguantar","Jeg tåler ikke melk.","B1"),
    ("selvsagt","adv","of course","por supuesto","Selvsagt kan du komme.","B1"),
    ("faktisk","adv","actually, in fact","de hecho, en realidad","Det er faktisk sant.","B1"),
    ("bekymret","adj","worried","preocupado","Jeg er litt bekymret.","B1"),
    ("å oppleve","verb","to experience","vivir, experimentar","Jeg vil oppleve nordlyset.","B1"),
]

_VOCAB: List[Dict[str, Any]] = []
for i, t in enumerate(_VOCAB_TUPLES):
    word, pos, en, es, example, level = t
    _VOCAB.append({
        "id": f"nvocab_{i+1:03d}",
        "word": word,
        "pos": pos,
        "meaning": {"en": en, "es": es, "no": word},
        "example": example,
        "level": level,
    })

_VOCAB_MAP = {v["id"]: v for v in _VOCAB}


def get_vocab_all() -> List[Dict[str, Any]]:
    return _VOCAB


# ═══════════════════════════════════════════════════════════════════════════════
# 5 — Germanic Bridge (EN ↔ NO cognates + false friends)
# ═══════════════════════════════════════════════════════════════════════════════

_COGNATES: List[Dict[str, Any]] = [
    {"no":"hus","en":"house","note":{"en":"Same Germanic root. Note NO 'u' sounds like 'oo'.","es":"Misma raíz germánica. La 'u' noruega suena como 'oo'.","no":"Samme germanske rot."}},
    {"no":"vann","en":"water","note":{"en":"Cognate via Germanic 'watar'. NO drops the 't'.","es":"Cognado por el germánico 'watar'.","no":"Beslektet med 'water'."}},
    {"no":"bok","en":"book","note":{"en":"Direct cognate.","es":"Cognado directo.","no":"Direkte beslektet."}},
    {"no":"fisk","en":"fish","note":{"en":"Direct cognate.","es":"Cognado directo.","no":"Direkte beslektet."}},
    {"no":"sønn","en":"son","note":{"en":"Direct cognate.","es":"Cognado directo.","no":"Direkte beslektet."}},
    {"no":"vinter","en":"winter","note":{"en":"Direct cognate.","es":"Cognado directo.","no":"Direkte beslektet."}},
    {"no":"grønn","en":"green","note":{"en":"Direct cognate.","es":"Cognado directo.","no":"Direkte beslektet."}},
    {"no":"komme","en":"come","note":{"en":"Cognate verb.","es":"Verbo cognado.","no":"Beslektet verb."}},
    {"no":"drikke","en":"drink","note":{"en":"Cognate verb.","es":"Verbo cognado.","no":"Beslektet verb."}},
    {"no":"begynne","en":"begin","note":{"en":"Cognate via 'beginnen'.","es":"Cognado por 'beginnen'.","no":"Beslektet med 'begin'."}},
]

_FALSE_FRIENDS_NO: List[Dict[str, Any]] = [
    {"no":"gift","en_looks":"gift (present)","actual":{"en":"married; OR poison","es":"casado; O veneno","no":"gift = gift(et)/giftig"},
     "example":"«Er du gift?» = Are you married? (NOT 'do you have a gift'). 'Gift' also = poison."},
    {"no":"rar","en_looks":"rare","actual":{"en":"strange, odd (not 'rare')","es":"extraño, raro (no 'poco frecuente')","no":"rar = merkelig"},
     "example":"«Han er litt rar.» = He's a bit odd."},
    {"no":"spent","en_looks":"spent","actual":{"en":"excited / tense (not past of spend)","es":"emocionado / tenso (no pasado de gastar)","no":"spent = forventningsfull"},
     "example":"«Jeg er så spent!» = I'm so excited!"},
    {"no":"aktuell","en_looks":"actual","actual":{"en":"current, relevant, topical","es":"actual, relevante, de actualidad","no":"aktuell = relevant"},
     "example":"«et aktuelt tema» = a topical/current subject."},
    {"no":"eventuelt","en_looks":"eventually","actual":{"en":"possibly, if applicable","es":"posiblemente, en su caso","no":"eventuelt = muligens"},
     "example":"«Vi kan eventuelt møtes senere.» = We can possibly meet later."},
    {"no":"fart","en_looks":"fart","actual":{"en":"speed","es":"velocidad","no":"fart = hastighet"},
     "example":"«Han kjørte i høy fart.» = He drove at high speed."},
    {"no":"time","en_looks":"time","actual":{"en":"an hour; a lesson/appointment (not 'time' = tid)","es":"una hora; una clase/cita (no 'tiempo' = tid)","no":"time = én time / tid = time(engelsk)"},
     "example":"«en time» = an hour. 'Time' (concept) = 'tid'."},
    {"no":"barn","en_looks":"barn","actual":{"en":"child (a barn building = 'låve')","es":"niño (un granero = 'låve')","no":"barn = child / låve = barn(engelsk)"},
     "example":"«tre barn» = three children."},
    {"no":"full","en_looks":"full","actual":{"en":"full; but very often 'drunk'","es":"lleno; pero muy a menudo 'borracho'","no":"full = drukken / mett"},
     "example":"«Han er full.» usually = He's drunk."},
    {"no":"snill","en_looks":"(none)","actual":{"en":"kind, nice (a useful non-cognate)","es":"amable, bueno (no cognado, útil)","no":"snill = grei/vennlig"},
     "example":"«Vær så snill» = Please (lit. 'be so kind')."},
    {"no":"billig","en_looks":"billing","actual":{"en":"cheap, inexpensive","es":"barato","no":"billig = rimelig"},
     "example":"«Det var billig!» = That was cheap!"},
    {"no":"offentlig","en_looks":"(often?)","actual":{"en":"public (offentlig sektor = public sector)","es":"público (sector público)","no":"offentlig = public"},
     "example":"«offentlig transport» = public transport."},
]


def get_bridge() -> Dict[str, Any]:
    return {"cognates": _COGNATES, "false_friends": _FALSE_FRIENDS_NO}


# ═══════════════════════════════════════════════════════════════════════════════
# 6 — Kultur (with Janteloven — links to Humanizing AI Nordic Lens)
# ═══════════════════════════════════════════════════════════════════════════════

_CULTURE: List[Dict[str, Any]] = [
    {"id":"janteloven","emoji":"⛰","title":{"no":"Janteloven","en":"The Law of Jante","es":"La Ley de Jante"},
     "summary":{
        "en":"An unwritten social code (from Sandemose's 1933 novel) that discourages standing out or boasting: 'Don't think you're anything special.' It shapes Norwegian modesty and egalitarianism. Understanding it explains why Norwegians downplay achievements and value 'likhet' (equality). (This same concept powers the Nordic Lens tab in the Humanizing AI agent.)",
        "es":"Un código social no escrito (de la novela de Sandemose, 1933) que desalienta destacar o presumir: 'No creas que eres alguien especial'. Moldea la modestia y el igualitarismo noruegos. Entenderlo explica por qué los noruegos restan importancia a sus logros y valoran la 'likhet' (igualdad). (Este mismo concepto impulsa la pestaña Nordic Lens del agente Humanizing AI.)",
        "no":"En uskreven sosial kode (fra Sandemoses roman fra 1933) som fraråder å skille seg ut eller skryte."},
     "phrases":[{"no":"Du skal ikke tro at du er noe.","en":"Don't think you're anything special."},
                {"no":"likhet","en":"equality / sameness — a core Norwegian value."}]},
    {"id":"dugnad","emoji":"🤝","title":{"no":"Dugnad","en":"Communal volunteering","es":"Trabajo comunitario voluntario"},
     "summary":{
        "en":"Unpaid collective work for the common good — cleaning the shared yard, running the kids' football club, helping a neighbour move. Participation is a strong social expectation; opting out is noticed. The word has no clean English equivalent.",
        "es":"Trabajo colectivo no remunerado por el bien común — limpiar el patio compartido, gestionar el club de fútbol infantil, ayudar a un vecino a mudarse. Participar es una fuerte expectativa social; no hacerlo se nota. La palabra no tiene equivalente claro en inglés.",
        "no":"Ubetalt fellesarbeid for felles beste."},
     "phrases":[{"no":"Vi har dugnad på lørdag.","en":"We have a communal work day on Saturday."}]},
    {"id":"kos","emoji":"🕯","title":{"no":"Kos / koselig","en":"Cosiness","es":"Calidez acogedora"},
     "summary":{
        "en":"The Norwegian cousin of Danish 'hygge': warmth, candles, good company, being comfortable. 'Koselig' is one of the most-used adjectives — a dinner, a cabin, a person can all be koselig.",
        "es":"El primo noruego del 'hygge' danés: calidez, velas, buena compañía, estar a gusto. 'Koselig' es uno de los adjetivos más usados — una cena, una cabaña o una persona pueden ser koselig.",
        "no":"Den norske fetteren til dansk 'hygge'."},
     "phrases":[{"no":"Så koselig at du kom!","en":"How lovely that you came!"}]},
    {"id":"friluftsliv","emoji":"🏔","title":{"no":"Friluftsliv & allemannsretten","en":"Outdoor life & right to roam","es":"Vida al aire libre y derecho de acceso"},
     "summary":{
        "en":"'Friluftsliv' (open-air living) is near-sacred: hiking, cabins, skiing. 'Allemannsretten' (the right to roam) lets anyone walk, camp and forage on uncultivated land, even private — a legal expression of the outdoor ethic.",
        "es":"El 'friluftsliv' (vida al aire libre) es casi sagrado: senderismo, cabañas, esquí. El 'allemannsretten' (derecho de acceso) permite a cualquiera caminar, acampar y recolectar en terreno no cultivado, incluso privado — una expresión legal de la ética al aire libre.",
        "no":"'Friluftsliv' er nesten hellig; 'allemannsretten' gir alle tilgang til utmark."},
     "phrases":[{"no":"Vi drar på hytta i helgen.","en":"We're going to the cabin this weekend."}]},
    {"id":"arbeidsliv","emoji":"💼","title":{"no":"Arbeidsliv","en":"Work culture","es":"Cultura laboral"},
     "summary":{
        "en":"Flat hierarchy, first-name basis with the boss, consensus decisions, and a firm work-life boundary (people leave at 16:00 for family). 'Matpakke' (packed lunch) culture over expensive lunches. Punctuality and directness are valued; over-selling yourself is not (see Janteloven).",
        "es":"Jerarquía plana, tuteo con el jefe, decisiones por consenso y un límite firme trabajo-vida (la gente se va a las 16:00 por la familia). Cultura del 'matpakke' (fiambrera) frente a comidas caras. Se valoran la puntualidad y la franqueza; venderse en exceso no (ver Janteloven).",
        "no":"Flat struktur, fornavn på sjefen, konsensus, og tydelig grense mellom jobb og fritid."},
     "phrases":[{"no":"Vi tar det på et møte.","en":"Let's take it in a meeting."},
                {"no":"matpakke","en":"packed lunch (a cultural institution)."}]},
]


def get_culture() -> List[Dict[str, Any]]:
    return _CULTURE


# ═══════════════════════════════════════════════════════════════════════════════
# 7 — SRS (SM-2, shared pattern)
# ═══════════════════════════════════════════════════════════════════════════════

_SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 90, 180]


def _next_review_at(stage: int) -> str:
    stage = max(0, min(stage, len(_SRS_INTERVALS) - 1))
    return (datetime.now(timezone.utc) + timedelta(days=_SRS_INTERVALS[stage])).isoformat()


async def srs_due(user_id: str = DEFAULT_USER, limit: int = 20) -> List[Dict[str, Any]]:
    now_iso = datetime.now(timezone.utc).isoformat()
    if _SRS_COL is None:
        return [{**v, "stage": 0, "next_review_at": now_iso, "is_new": True} for v in _VOCAB[:limit]]
    try:
        states = await _SRS_COL.find({"user_id": user_id}).to_list(2000)
        seen_ids = {s["vocab_id"] for s in states}
        new_items = [v for v in _VOCAB if v["id"] not in seen_ids][:max(0, limit // 2)]
        due = [s for s in states if s.get("next_review_at", "") <= now_iso]
        due_items: List[Dict[str, Any]] = []
        for s in due[:limit - len(new_items)]:
            v = _VOCAB_MAP.get(s["vocab_id"])
            if v:
                due_items.append({**v, "stage": s.get("stage", 0), "next_review_at": s.get("next_review_at"), "is_new": False})
        new_payload = [{**v, "stage": 0, "next_review_at": now_iso, "is_new": True} for v in new_items]
        return new_payload + due_items
    except Exception:
        return []


async def srs_review(vocab_id: str, grade: str, user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    if vocab_id not in _VOCAB_MAP:
        return {"status": "error", "message": f"Unknown vocab id: {vocab_id}"}
    cur_stage = 0
    if _SRS_COL is not None:
        try:
            doc = await _SRS_COL.find_one({"user_id": user_id, "vocab_id": vocab_id})
            cur_stage = (doc or {}).get("stage", 0)
        except Exception:
            pass
    new_stage = {"again": max(0, cur_stage - 1), "good": cur_stage + 1, "easy": cur_stage + 2}.get(grade, cur_stage)
    new_stage = max(0, min(new_stage, len(_SRS_INTERVALS) - 1))
    next_at = _next_review_at(new_stage)
    record = {"user_id": user_id, "vocab_id": vocab_id, "stage": new_stage, "last_grade": grade,
              "next_review_at": next_at, "last_reviewed_at": datetime.now(timezone.utc).isoformat()}
    if _SRS_COL is not None:
        try:
            await _SRS_COL.update_one({"user_id": user_id, "vocab_id": vocab_id}, {"$set": record}, upsert=True)
        except Exception:
            pass
    return {"status": "ok", "stage": new_stage, "next_review_at": next_at}


async def _vocab_known_count(user_id: str = DEFAULT_USER) -> int:
    if _SRS_COL is None:
        return 0
    try:
        return await _SRS_COL.count_documents({"user_id": user_id, "stage": {"$gte": 3}})
    except Exception:
        return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 8 — Conversation (LLM-backed)
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS: Dict[str, Dict[str, str]] = {
    "cafe":       {"en":"At a café","es":"En un café","no":"På kafé","first":"Hei! Hva kan jeg hjelpe deg med?"},
    "smalltalk":  {"en":"Small talk","es":"Charla informal","no":"Small talk","first":"Hei! Hvordan går det med deg?"},
    "work":       {"en":"At work / meeting","es":"En el trabajo / reunión","no":"På jobb / møte","first":"Hei, skal vi gå gjennom agendaen?"},
    "directions": {"en":"Asking for directions","es":"Pedir direcciones","no":"Spørre om veien","first":"Unnskyld, vet du hvor T-banen er?"},
    "nav":        {"en":"Bureaucracy (NAV/kommune)","es":"Burocracia (NAV/ayuntamiento)","no":"Byråkrati (NAV/kommune)","first":"God dag. Hva gjelder det?"},
    "doctor":     {"en":"At the doctor","es":"En el médico","no":"Hos legen","first":"Hei, hva kan jeg hjelpe deg med i dag?"},
}

_LANG_NAMES = {"es": "Spanish", "en": "English", "no": "Norwegian"}


def _mentor_system_prompt(scenario: str, difficulty: str, explain_lang: str) -> str:
    lang_name = _LANG_NAMES.get(explain_lang, "Spanish")
    scen_label = SCENARIOS.get(scenario, {}).get("en", scenario)
    return (
        "You are Norsk Mester AI, an advanced Norwegian (Bokmål) conversation partner "
        "for a Spanish speaker who also knows English and is aiming for B2–C1. Reply in "
        "natural, everyday Bokmål.\n\n"
        f"SCENARIO: {scen_label}\n"
        f"LEARNER TARGET: {difficulty}\n"
        f"CORRECTION-EXPLANATION LANGUAGE: {lang_name}\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"reply":"<your natural Norwegian (Bokmål) reply>",'
        '"translation":"<short ' + lang_name + ' translation of your reply>",'
        f'"correction":"<if the learner\'s last message had an error, a short fix explained in {lang_name}, else empty>",'
        '"upgrade":"<optional: a more natural/idiomatic Norwegian way to say what the learner said>",'
        '"tip":"<optional short tip: a småord, a V2 reminder, a collocation>"}\n\n'
        "Rules:\n"
        "- Keep replies short and natural. Use everyday Bokmål, not textbook-stiff Norwegian.\n"
        "- Watch for V2 word-order errors and definite-form errors — the classic traps.\n"
        "- In `upgrade`, show a more native phrasing of THEIR Norwegian.\n"
        "- Encourage; correct only real errors."
    )


async def conversation_message(scenario: str, difficulty: str, history: List[Dict[str, str]],
                               user_text: Optional[str], lang: str = "es") -> Dict[str, Any]:
    scen = SCENARIOS.get(scenario, SCENARIOS["smalltalk"])
    if not history and not user_text:
        return {"reply": scen["first"], "translation": "", "correction": "", "upgrade": "", "tip": "",
                "is_mock": False, "scenario": scenario, "difficulty": difficulty}
    if ask_ai_unified is None:
        return _mock_reply(scenario, difficulty)
    sys_prompt = _mentor_system_prompt(scenario, difficulty, lang)
    messages: List[Dict[str, str]] = [{"role": "system", "content": sys_prompt}]
    for turn in history[-10:]:
        messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    if user_text:
        messages.append({"role": "user", "content": user_text})
    try:
        raw = await ask_ai_unified(prompt=user_text or scen["first"], task_type="dialogue",
                                   complexity="medium", max_tokens=500, messages=messages)
        if raw:
            clean = raw.strip()
            if clean.startswith("```"):
                parts = clean.split("```")
                clean = parts[1] if len(parts) > 1 else clean
                if clean.startswith("json"):
                    clean = clean[4:]
            parsed = json.loads(clean.strip())
            parsed["is_mock"] = False
            parsed["scenario"] = scenario
            parsed["difficulty"] = difficulty
            for k in ("translation", "correction", "upgrade", "tip", "reply"):
                parsed.setdefault(k, "")
            return parsed
    except Exception:
        pass
    return _mock_reply(scenario, difficulty)


def _mock_reply(scenario: str, difficulty: str) -> Dict[str, Any]:
    return {"reply": "Så bra! Kan du fortelle litt mer?", "translation": "Great! Can you tell me a bit more?",
            "correction": "", "upgrade": "", "tip": "[Mock — connect an AI model for live conversation.]",
            "is_mock": True, "scenario": scenario, "difficulty": difficulty}


def scenarios_catalogue(lang: str = "es") -> List[Dict[str, str]]:
    return [{"key": k, "label": v.get(lang, v["en"]), "first": v["first"]} for k, v in SCENARIOS.items()]


# ═══════════════════════════════════════════════════════════════════════════════
# 9 — Writing feedback (LLM-backed)
# ═══════════════════════════════════════════════════════════════════════════════

_MAX_WRITING_CHARS = 4000


def _writing_system_prompt(explain_lang: str, register: str) -> str:
    lang_name = _LANG_NAMES.get(explain_lang, "Spanish")
    return (
        "You are Norsk Mester AI's writing coach for a Spanish speaker (who also knows "
        "English) aiming for B2–C1 Norwegian (Bokmål). Analyse the learner's Norwegian "
        "text and return targeted, encouraging feedback — NOT a full rewrite.\n\n"
        f"TARGET REGISTER: {register}\n"
        f"EXPLANATION LANGUAGE: {lang_name}\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"corrected":"<the text with errors fixed, keeping the learner\'s voice>",'
        '"issues":[{"original":"<verbatim snippet>","fix":"<corrected>",'
        f'"type":"word_order|gender|definite_form|verb|preposition|word_choice|naturalness","note":"<short why, in {lang_name}>"}}],'
        '"upgrades":["<1-3 phrases rewritten in more natural Bokmål>"],'
        '"cefr_estimate":"<A2|B1|B2|C1>",'
        '"summary":"<one-sentence encouraging summary in ' + lang_name + '>"}\n\n'
        "Rules:\n"
        "- Quote `original` verbatim.\n"
        "- Prioritise V2 word-order, gender (en/ei/et) and definite-form errors.\n"
        "- Max ~6 issues. Don't nitpick style.\n"
        "- `upgrades` should sound like a native, not just synonyms."
    )


async def writing_feedback(text: str, register: str = "neutral", lang: str = "es",
                           user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    text = (text or "").strip()
    if not text:
        return {"error": "empty_text"}
    if len(text) > _MAX_WRITING_CHARS:
        text = text[:_MAX_WRITING_CHARS] + "…"
    if ask_ai_unified is not None:
        try:
            raw = await ask_ai_unified(prompt=text, task_type="analysis", complexity="high", max_tokens=1600,
                                       messages=[{"role": "system", "content": _writing_system_prompt(lang, register)},
                                                 {"role": "user", "content": f"Learner's text:\n\n{text}"}])
            if raw:
                clean = raw.strip()
                if clean.startswith("```"):
                    parts = clean.split("```")
                    clean = parts[1] if len(parts) > 1 else clean
                    if clean.startswith("json"):
                        clean = clean[4:]
                parsed = json.loads(clean.strip())
                parsed["is_mock"] = False
                parsed.setdefault("corrected", text)
                parsed.setdefault("issues", [])
                parsed.setdefault("upgrades", [])
                parsed.setdefault("cefr_estimate", "B1")
                parsed.setdefault("summary", "")
                return parsed
        except Exception:
            pass
    return {"corrected": text, "issues": [], "upgrades": [], "cefr_estimate": "B1",
            "summary": "[Mock — connect an AI model for detailed writing feedback.]", "is_mock": True}


# ═══════════════════════════════════════════════════════════════════════════════
# 10 — Dashboard / Overview
# ═══════════════════════════════════════════════════════════════════════════════

async def get_overview(user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    vocab_known = await _vocab_known_count(user_id)
    due_items = await srs_due(user_id, limit=100)
    srs_due_n = sum(1 for d in due_items if not d.get("is_new"))
    new_today = sum(1 for d in due_items if d.get("is_new"))
    if vocab_known >= 30:
        level = "C1 (Avansert)"
    elif vocab_known >= 12:
        level = "B2 (Øvre middels)"
    else:
        level = "B1+ (Middels)"
    mission = [
        {"type": "tonelag",      "count": 3, "label": "toneme pairs"},
        {"type": "grammatikk",   "count": 2, "label": "grammar points"},
        {"type": "smaord",       "count": 4, "label": "småord"},
        {"type": "srs",          "count": min(20, srs_due_n + new_today), "label": "vocabulary reviews"},
        {"type": "conversation", "count": 1, "label": "conversation"},
    ]
    return {
        "user_id": user_id, "level": level, "cefr_target": "C1", "streak_days": 0,
        "stats": {
            "sounds_total":       len(_SOUNDS),
            "tonemes_total":      len(_TONEMES),
            "grammar_total":      len(_GRAMMAR),
            "smaord_total":       len(_SMAORD),
            "bridge_total":       len(_COGNATES) + len(_FALSE_FRIENDS_NO),
            "culture_total":      len(_CULTURE),
            "vocab_known":        vocab_known,
            "vocab_total":        len(_VOCAB),
            "srs_due_today":      srs_due_n,
            "srs_new_today":      new_today,
        },
        "todays_mission": mission,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def health() -> Dict[str, Any]:
    return {"status": "ok", "agent": "norwegian_mentor",
            "version": NORWEGIAN_MENTOR_VERSION, "llm_available": ask_ai_unified is not None}
