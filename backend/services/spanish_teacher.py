"""
Spanish Teacher AI — Service
============================
Functional V1 for teaching Spanish (español / castellano) to non-native
learners. Unlike the English/Norwegian mentors (which perfect a foreign
language for a Spanish speaker), this agent has the project owner — a NATIVE
Spanish speaker — as the model. That makes it the ideal home for the Voicebox
cloned voice: a native Spanish clone is a legitimate pronunciation model.

Nine modules:
  1. Pronunciación   — rr/r, ñ, j, ll, the 5 pure vowels, seseo, tildes
  2. Gramática       — ser/estar, por/para, pretérito/imperfecto, subjuntivo…
  3. Conjugación     — verb tables (regular + key irregulars × tenses)
  4. Vocabulario SRS — frequency Spanish words with SM-2
  5. Falsos Amigos   — English↔Spanish traps (for the learner)
  6. Conversación    — LLM, the learner speaks Spanish and gets corrections
  7. Escritura       — paste text, get feedback
  8. Cultura         — España vs Latinoamérica variants + culture
  9. Dashboard       — stats + mission

Single-user model (user_id='default'). Meaning fields carry {en, es, no};
learners are typically English or Norwegian speakers.
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
    _VOCAB_COL = database.get_collection("spanish_vocab_progress")
    _SRS_COL   = database.get_collection("spanish_srs_reviews")
    _CONV_COL  = database.get_collection("spanish_conversation_runs")
    _WRITE_COL = database.get_collection("spanish_writing_runs")
except Exception:
    _VOCAB_COL = _SRS_COL = _CONV_COL = _WRITE_COL = None

DEFAULT_USER = "default"
SPANISH_TEACHER_VERSION = "1.0.0"


# ═══════════════════════════════════════════════════════════════════════════════
# 1 — Pronunciación
# ═══════════════════════════════════════════════════════════════════════════════

_SOUNDS: List[Dict[str, Any]] = [
    {"sound":"las 5 vocales","example":"a-e-i-o-u · casa, mesa, vino","ipa":"a e i o u",
     "tip":{"en":"Spanish's biggest gift: 5 PURE vowels, always the same, no reduction (no schwa). Unlike English 'banana' (three different a-sounds), Spanish 'banana' has three identical clean /a/. Never weaken a vowel.",
            "es":"El mayor regalo del español: 5 vocales PURAS, siempre iguales, sin reducción. A diferencia del inglés, nunca debilites una vocal.",
            "no":"Spansk har 5 RENE vokaler, alltid like, uten reduksjon."}},
    {"sound":"rr (vibrante múltiple)","example":"perro, carro, rojo","ipa":"r",
     "tip":{"en":"The rolled/trilled 'rr' — tongue tip taps rapidly against the alveolar ridge. Distinguishes words: 'pero' (but) vs 'perro' (dog), 'caro' (expensive) vs 'carro' (car). Word-initial 'r' is also trilled (rojo).",
            "es":"La 'rr' vibrante múltiple. Distingue 'pero' de 'perro'. La 'r' inicial también vibra (rojo).",
            "no":"Den rullende 'rr'. Skiller 'pero' fra 'perro'."}},
    {"sound":"r (vibrante simple)","example":"pero, caro, arena","ipa":"ɾ",
     "tip":{"en":"A single tap (like the American 'tt' in 'butter'). Between vowels a single 'r' is a soft tap, NOT trilled.",
            "es":"Un solo golpe (como la 'tt' de 'butter' en inglés americano). Entre vocales, una sola 'r' es suave.",
            "no":"Ett enkelt slag, ikke rullende."}},
    {"sound":"ñ","example":"niño, año, España","ipa":"ɲ",
     "tip":{"en":"Palatal nasal /ɲ/ — like the 'ni' in English 'onion' or 'ny' in 'canyon'. 'año' (year) vs 'ano' (anus) — get it right!",
            "es":"Nasal palatal /ɲ/, como 'ni' en 'onion'. ¡'año' no es 'ano'!",
            "no":"Palatal nasal, som 'ny' i 'canyon'."}},
    {"sound":"j / g(e,i)","example":"jamón, gente, gira","ipa":"x",
     "tip":{"en":"Voiceless velar fricative /x/ — a raspy 'h' from the back of the throat (like Scottish 'loch' or German 'Bach'). 'g' before e/i sounds the same: gente, gigante.",
            "es":"Fricativa velar sorda /x/, áspera desde la garganta. 'g' ante e/i suena igual: gente, gigante.",
            "no":"Ustemt velar frikativ /x/, som skotsk 'loch'."}},
    {"sound":"ll / y (yeísmo)","example":"llave, calle, yo","ipa":"ʝ",
     "tip":{"en":"In most of the Spanish-speaking world 'll' and 'y' merge (yeísmo) to /ʝ/ (like English 'y' in 'yes', softer). In Río de la Plata (Argentina/Uruguay) it becomes 'sh': 'calle' → 'cashe'.",
            "es":"En casi todo el mundo hispano 'll' y 'y' se fusionan (yeísmo). En el Río de la Plata suena 'sh': 'calle' → 'cashe'.",
            "no":"'ll' og 'y' smelter sammen (yeísmo) i det meste av den spansktalende verden."}},
    {"sound":"c/z (seseo vs distinción)","example":"casa vs caza; cielo, zapato","ipa":"θ / s",
     "tip":{"en":"In Spain (most regions) 'c'(e,i) and 'z' are /θ/ (English 'th' in 'think'): 'caza' ≠ 'casa'. In Latin America and southern Spain they're /s/ (seseo): 'caza' = 'casa'. Both are correct — pick one and be consistent.",
            "es":"En España 'c'(e,i) y 'z' son /θ/ ('th' inglesa): 'caza' ≠ 'casa'. En Latinoamérica son /s/ (seseo). Ambas son correctas.",
            "no":"I Spania er 'c'(e,i) og 'z' /θ/; i Latin-Amerika /s/ (seseo)."}},
    {"sound":"h muda","example":"hola, hora, hombre","ipa":"(silent)",
     "tip":{"en":"'h' is ALWAYS silent in Spanish. 'hola' = 'ola', 'hora' = 'ora'. Never breathe it (unlike English).",
            "es":"La 'h' es SIEMPRE muda. 'hola' = 'ola'. Nunca la aspires.",
            "no":"'h' er ALLTID stum på spansk."}},
    {"sound":"b / v (igual)","example":"vaca, bota — mismo sonido","ipa":"b / β",
     "tip":{"en":"'b' and 'v' sound IDENTICAL in Spanish — both /b/ (or soft /β/ between vowels). 'vaca' and 'baca' sound the same. There is no English-style /v/.",
            "es":"'b' y 'v' suenan IGUAL en español. 'vaca' y 'baca' son homófonos. No existe la /v/ inglesa.",
            "no":"'b' og 'v' høres helt like ut på spansk."}},
    {"sound":"acento y tildes","example":"médico · comió · árbol","ipa":"—",
     "tip":{"en":"Stress rules: words ending in vowel/n/s stress the second-to-last syllable (LLAna: 'casa'); others stress the last (aGUda: 'comer'). A written tilde (´) marks the EXCEPTION. Esdrújulas (stress 3rd-from-last) ALWAYS carry a tilde: 'médico', 'rápido'.",
            "es":"Reglas de acentuación: llanas (vocal/n/s) → penúltima; agudas → última. La tilde marca la excepción. Las esdrújulas SIEMPRE llevan tilde.",
            "no":"Trykkregler: ord som ender på vokal/n/s har trykk på nest siste stavelse; tilde markerer unntaket."}},
]


def get_pronunciation() -> List[Dict[str, Any]]:
    return _SOUNDS


# ═══════════════════════════════════════════════════════════════════════════════
# 2 — Gramática
# ═══════════════════════════════════════════════════════════════════════════════

_GRAMMAR: List[Dict[str, Any]] = [
    {"id":"g1","level":"core","title":"ser vs estar",
     "pattern":"ser = identity/essence · estar = state/location",
     "explanation":{
        "en":"Both mean 'to be'. SER = permanent identity, origin, profession, time, material ('Soy médico', 'Es de Madrid'). ESTAR = temporary state, location, mood, result ('Estoy cansado', 'Está en casa'). Some adjectives change meaning: 'es aburrido' (he's boring) vs 'está aburrido' (he's bored).",
        "es":"Ambos significan 'to be'. SER = identidad permanente, origen, profesión. ESTAR = estado temporal, ubicación, ánimo. Algunos adjetivos cambian: 'es aburrido' vs 'está aburrido'.",
        "no":"Begge betyr 'å være'. SER = permanent identitet; ESTAR = midlertidig tilstand/sted."},
     "examples":[
        {"es":"Ella es alta y es española.","gloss":"She is tall and Spanish (identity → ser)"},
        {"es":"Ella está cansada y está en casa.","gloss":"She is tired and at home (state/location → estar)"}],
     "commonMistake":{
        "en":"❌ 'Soy cansado' → ✓ 'Estoy cansado' (tiredness is a state). ❌ 'Está médico' → ✓ 'Es médico'.",
        "es":"❌ 'Soy cansado' → ✓ 'Estoy cansado'. ❌ 'Está médico' → ✓ 'Es médico'.",
        "no":"❌ 'Soy cansado' → ✓ 'Estoy cansado'."}},
    {"id":"g2","level":"core","title":"por vs para",
     "pattern":"por = cause/means/through · para = purpose/destination/deadline",
     "explanation":{
        "en":"POR = reason, cause, exchange, duration, 'through/by' ('Gracias por todo', 'por la mañana', 'por avión'). PARA = purpose, goal, recipient, deadline, destination ('Es para ti', 'para aprender', 'para el lunes'). Rule of thumb: PARA points forward to a goal; POR looks back at a cause.",
        "es":"POR = razón, causa, intercambio, duración, 'a través de'. PARA = propósito, meta, destinatario, plazo. Regla: PARA apunta a una meta; POR mira a una causa.",
        "no":"POR = årsak/middel; PARA = formål/mål/mottaker."},
     "examples":[
        {"es":"Estudio para ser médico.","gloss":"I study (in order) to be a doctor (purpose → para)"},
        {"es":"Gracias por tu ayuda.","gloss":"Thanks for your help (cause → por)"}],
     "commonMistake":{
        "en":"❌ 'Estudio por ser médico' → ✓ 'para ser médico' (goal). ❌ 'un regalo por ti' → ✓ 'para ti' (recipient).",
        "es":"❌ 'Estudio por ser médico' → ✓ 'para ser médico'. ❌ 'un regalo por ti' → ✓ 'para ti'.",
        "no":"❌ 'para' og 'por' forveksles ofte — para = mål, por = årsak."}},
    {"id":"g3","level":"core","title":"pretérito vs imperfecto",
     "pattern":"pretérito = completed action · imperfecto = ongoing/habitual past",
     "explanation":{
        "en":"Both are past tenses. PRETÉRITO (comí, fui) = a completed action, a single event with a clear end. IMPERFECTO (comía, iba) = ongoing background, habits, descriptions, age, time, weather in the past. 'Comía cuando llamaste' (I was eating [imperfect] when you called [preterite]).",
        "es":"Ambos son pasados. PRETÉRITO = acción terminada, evento único. IMPERFECTO = trasfondo continuo, hábitos, descripciones, edad, hora. 'Comía cuando llamaste'.",
        "no":"PRETÉRITO = avsluttet handling; IMPERFECTO = pågående/vanemessig fortid."},
     "examples":[
        {"es":"Ayer comí paella.","gloss":"Yesterday I ate paella (completed → pretérito)"},
        {"es":"De niño comía paella los domingos.","gloss":"As a child I used to eat paella on Sundays (habit → imperfecto)"}],
     "commonMistake":{
        "en":"Habits/descriptions in the past need the imperfect: ❌ 'Cuando era niño, jugué mucho' → ✓ 'jugaba mucho'.",
        "es":"Hábitos y descripciones pasadas piden imperfecto: ✓ 'Cuando era niño, jugaba mucho'.",
        "no":"Vaner i fortid krever imperfecto."}},
    {"id":"g4","level":"advanced","title":"el subjuntivo (introducción)",
     "pattern":"trigger + que + subjuntivo",
     "explanation":{
        "en":"The subjunctive expresses non-reality: wishes, doubt, emotion, recommendations, the unknown. Triggered after certain expressions + 'que': 'Quiero que vengas' (I want you to come), 'Espero que sea verdad', 'No creo que tenga razón'. If there's certainty or a single subject, use the indicative/infinitive instead.",
        "es":"El subjuntivo expresa lo no real: deseos, duda, emoción, recomendación. Se activa tras ciertas expresiones + 'que': 'Quiero que vengas', 'Espero que sea verdad'. Con certeza o mismo sujeto, usa indicativo/infinitivo.",
        "no":"Konjunktiv uttrykker ønske, tvil, følelse: 'Quiero que vengas'."},
     "examples":[
        {"es":"Espero que tengas razón.","gloss":"I hope you're right (hope → subjunctive 'tengas')"},
        {"es":"Es importante que estudies.","gloss":"It's important that you study (recommendation → 'estudies')"}],
     "commonMistake":{
        "en":"After 'quiero que' + different subject, use subjunctive: ❌ 'Quiero que vienes' → ✓ 'Quiero que vengas'. Same subject → infinitive: 'Quiero venir'.",
        "es":"Tras 'quiero que' + otro sujeto → subjuntivo: ✓ 'Quiero que vengas'. Mismo sujeto → infinitivo: 'Quiero venir'.",
        "no":"Etter 'quiero que' + annet subjekt → konjunktiv."}},
    {"id":"g5","level":"core","title":"género y concordancia",
     "pattern":"el/la + noun · adjective agrees in gender & number",
     "explanation":{
        "en":"Nouns are masculine (el) or feminine (la). Usually -o = masc, -a = fem, but many exceptions: 'el problema', 'el día', 'la mano', 'el agua' (fem noun, masc article to avoid a-a). Adjectives AGREE: 'la casa blanca', 'los coches rojos'.",
        "es":"Los sustantivos son masculinos (el) o femeninos (la). Normalmente -o/-a, pero hay excepciones: 'el problema', 'la mano', 'el agua'. Los adjetivos CONCUERDAN: 'la casa blanca'.",
        "no":"Substantiv er hankjønn (el) eller hunkjønn (la); adjektiv samsvarer."},
     "examples":[
        {"es":"la mesa roja / las mesas rojas","gloss":"the red table(s) — agreement in gender + number"},
        {"es":"el problema difícil","gloss":"the difficult problem (masc despite -a ending)"}],
     "commonMistake":{
        "en":"Learn the exceptions: 'el problema', 'el tema', 'el mapa', 'el día' are masculine; 'la mano', 'la foto' feminine.",
        "es":"Aprende las excepciones: 'el problema/tema/mapa/día' masc; 'la mano/foto' fem.",
        "no":"Lær unntakene: 'el problema', 'la mano'."}},
    {"id":"g6","level":"advanced","title":"gustar y verbos similares",
     "pattern":"me/te/le + gusta(n) + subject",
     "explanation":{
        "en":"'Gustar' works BACKWARDS from English 'to like'. Literally 'to be pleasing to me': 'Me gusta el café' = coffee is pleasing to me. The thing liked is the subject, so the verb agrees with IT: 'Me gusta el café' (sing) vs 'Me gustan los libros' (plural). Same pattern: encantar, doler, interesar, faltar.",
        "es":"'Gustar' funciona al REVÉS del inglés 'to like'. Literalmente 'me es agradable': 'Me gusta el café'. El verbo concuerda con la cosa: 'Me gustan los libros'. Igual: encantar, doler, interesar.",
        "no":"'Gustar' fungerer motsatt av engelsk 'to like': 'Me gusta el café'."},
     "examples":[
        {"es":"Me gustan las películas españolas.","gloss":"I like Spanish films (plural thing → gustan)"},
        {"es":"A ella le encanta bailar.","gloss":"She loves to dance"}],
     "commonMistake":{
        "en":"❌ 'Yo gusto café' → ✓ 'Me gusta el café'. The verb agrees with the thing, not the person.",
        "es":"❌ 'Yo gusto café' → ✓ 'Me gusta el café'.",
        "no":"❌ 'Yo gusto café' → ✓ 'Me gusta el café'."}},
]

_GRAMMAR_MAP = {g["id"]: g for g in _GRAMMAR}


def get_grammar_path(level: str = "all") -> List[Dict[str, Any]]:
    if level == "all":
        return _GRAMMAR
    return [g for g in _GRAMMAR if g["level"] == level]


def get_grammar_point(point_id: str) -> Optional[Dict[str, Any]]:
    return _GRAMMAR_MAP.get(point_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 3 — Conjugación (verb tables)
# ═══════════════════════════════════════════════════════════════════════════════
# Persons order: yo, tú, él/ella, nosotros, vosotros, ellos

_PERSONS = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos"]

_CONJUGATION: List[Dict[str, Any]] = [
    {"verb":"hablar","type":{"en":"regular -ar (to speak)","es":"regular -ar (hablar)","no":"regelrett -ar"},
     "tenses":{
        "presente":   ["hablo","hablas","habla","hablamos","habláis","hablan"],
        "pretérito":  ["hablé","hablaste","habló","hablamos","hablasteis","hablaron"],
        "imperfecto": ["hablaba","hablabas","hablaba","hablábamos","hablabais","hablaban"],
        "futuro":     ["hablaré","hablarás","hablará","hablaremos","hablaréis","hablarán"],
        "subjuntivo": ["hable","hables","hable","hablemos","habléis","hablen"]}},
    {"verb":"comer","type":{"en":"regular -er (to eat)","es":"regular -er (comer)","no":"regelrett -er"},
     "tenses":{
        "presente":   ["como","comes","come","comemos","coméis","comen"],
        "pretérito":  ["comí","comiste","comió","comimos","comisteis","comieron"],
        "imperfecto": ["comía","comías","comía","comíamos","comíais","comían"],
        "futuro":     ["comeré","comerás","comerá","comeremos","comeréis","comerán"],
        "subjuntivo": ["coma","comas","coma","comamos","comáis","coman"]}},
    {"verb":"vivir","type":{"en":"regular -ir (to live)","es":"regular -ir (vivir)","no":"regelrett -ir"},
     "tenses":{
        "presente":   ["vivo","vives","vive","vivimos","vivís","viven"],
        "pretérito":  ["viví","viviste","vivió","vivimos","vivisteis","vivieron"],
        "imperfecto": ["vivía","vivías","vivía","vivíamos","vivíais","vivían"],
        "futuro":     ["viviré","vivirás","vivirá","viviremos","viviréis","vivirán"],
        "subjuntivo": ["viva","vivas","viva","vivamos","viváis","vivan"]}},
    {"verb":"ser","type":{"en":"irregular (to be — identity)","es":"irregular (ser)","no":"uregelrett (ser)"},
     "tenses":{
        "presente":   ["soy","eres","es","somos","sois","son"],
        "pretérito":  ["fui","fuiste","fue","fuimos","fuisteis","fueron"],
        "imperfecto": ["era","eras","era","éramos","erais","eran"],
        "futuro":     ["seré","serás","será","seremos","seréis","serán"],
        "subjuntivo": ["sea","seas","sea","seamos","seáis","sean"]}},
    {"verb":"estar","type":{"en":"irregular (to be — state)","es":"irregular (estar)","no":"uregelrett (estar)"},
     "tenses":{
        "presente":   ["estoy","estás","está","estamos","estáis","están"],
        "pretérito":  ["estuve","estuviste","estuvo","estuvimos","estuvisteis","estuvieron"],
        "imperfecto": ["estaba","estabas","estaba","estábamos","estabais","estaban"],
        "futuro":     ["estaré","estarás","estará","estaremos","estaréis","estarán"],
        "subjuntivo": ["esté","estés","esté","estemos","estéis","estén"]}},
    {"verb":"ir","type":{"en":"irregular (to go)","es":"irregular (ir)","no":"uregelrett (ir)"},
     "tenses":{
        "presente":   ["voy","vas","va","vamos","vais","van"],
        "pretérito":  ["fui","fuiste","fue","fuimos","fuisteis","fueron"],
        "imperfecto": ["iba","ibas","iba","íbamos","ibais","iban"],
        "futuro":     ["iré","irás","irá","iremos","iréis","irán"],
        "subjuntivo": ["vaya","vayas","vaya","vayamos","vayáis","vayan"]}},
    {"verb":"tener","type":{"en":"irregular (to have)","es":"irregular (tener)","no":"uregelrett (tener)"},
     "tenses":{
        "presente":   ["tengo","tienes","tiene","tenemos","tenéis","tienen"],
        "pretérito":  ["tuve","tuviste","tuvo","tuvimos","tuvisteis","tuvieron"],
        "imperfecto": ["tenía","tenías","tenía","teníamos","teníais","tenían"],
        "futuro":     ["tendré","tendrás","tendrá","tendremos","tendréis","tendrán"],
        "subjuntivo": ["tenga","tengas","tenga","tengamos","tengáis","tengan"]}},
    {"verb":"hacer","type":{"en":"irregular (to do/make)","es":"irregular (hacer)","no":"uregelrett (hacer)"},
     "tenses":{
        "presente":   ["hago","haces","hace","hacemos","hacéis","hacen"],
        "pretérito":  ["hice","hiciste","hizo","hicimos","hicisteis","hicieron"],
        "imperfecto": ["hacía","hacías","hacía","hacíamos","hacíais","hacían"],
        "futuro":     ["haré","harás","hará","haremos","haréis","harán"],
        "subjuntivo": ["haga","hagas","haga","hagamos","hagáis","hagan"]}},
]

_CONJ_MAP = {c["verb"]: c for c in _CONJUGATION}


def get_conjugation() -> Dict[str, Any]:
    return {"persons": _PERSONS, "verbs": _CONJUGATION}


def get_verb(verb: str) -> Optional[Dict[str, Any]]:
    return _CONJ_MAP.get(verb)


# ═══════════════════════════════════════════════════════════════════════════════
# 4 — Vocabulario (frequency Spanish)
# ═══════════════════════════════════════════════════════════════════════════════

# Tuples: (word, pos, meaning_en, meaning_no, example, level)
_VOCAB_TUPLES = [
    ("aunque","conj","although, even though","selv om","Aunque llueve, salimos.","B1"),
    ("sin embargo","phrase","however, nevertheless","imidlertid","Es caro; sin embargo, lo compro.","B1"),
    ("de repente","phrase","suddenly","plutselig","De repente, empezó a llover.","B1"),
    ("a menudo","phrase","often","ofte","Viajo a menudo por trabajo.","A2"),
    ("acabar de","verb","to have just (done)","nettopp ha gjort","Acabo de llegar.","B1"),
    ("darse cuenta","verb","to realise","å innse","Me di cuenta del error.","B1"),
    ("echar de menos","verb","to miss (someone)","å savne","Echo de menos a mi familia.","B1"),
    ("ponerse","verb","to become / put on","å bli / ta på","Se puso nervioso.","B1"),
    ("soler","verb","to usually (do)","pleie å","Suelo levantarme temprano.","B1"),
    ("tratar de","verb","to try to","å prøve å","Trato de mejorar mi español.","B1"),
    ("apoyar","verb","to support","å støtte","Te apoyo en tu decisión.","B1"),
    ("lograr","verb","to achieve, manage to","å oppnå","Logré terminar el proyecto.","B1"),
    ("desarrollar","verb","to develop","å utvikle","Desarrollamos una app nueva.","B1"),
    ("aprovechar","verb","to make the most of","å utnytte","Aprovecha el buen tiempo.","B1"),
    ("compartir","verb","to share","å dele","Compartimos un piso.","A2"),
    ("mejorar","verb","to improve","å forbedre","Quiero mejorar mi acento.","A2"),
    ("herramienta","noun","tool","verktøy","una herramienta útil","B1"),
    ("desarrollo","noun","development","utvikling","el desarrollo del proyecto","B1"),
    ("propósito","noun","purpose, aim","formål","¿Cuál es el propósito?","B2"),
    ("reto","noun","challenge","utfordring","un gran reto","B1"),
    ("ámbito","noun","field, scope, area","område","en el ámbito laboral","B2"),
    ("hito","noun","milestone","milepæl","un hito importante","B2"),
    ("aporte / aportación","noun","contribution","bidrag","una aportación valiosa","B2"),
    ("entorno","noun","environment, surroundings","omgivelser","el entorno de trabajo","B1"),
    ("plazo","noun","deadline, term","frist","cumplir el plazo","B1"),
    ("consejo","noun","advice, piece of advice","råd","un buen consejo","A2"),
    ("dispuesto","adj","willing, ready","villig","Estoy dispuesto a ayudar.","B1"),
    ("imprescindible","adj","essential, indispensable","uunnværlig","Es imprescindible reservar.","B2"),
    ("cotidiano","adj","everyday, daily","hverdagslig","la vida cotidiana","B2"),
    ("adecuado","adj","suitable, appropriate","passende","la respuesta adecuada","B1"),
    ("sencillo","adj","simple, easy","enkel","una explicación sencilla","A2"),
    ("actual","adj","current, present-day","nåværende","la situación actual","B1"),
    ("amable","adj","kind, nice","vennlig","Eres muy amable.","A2"),
    ("enseguida","adv","right away, immediately","med en gang","Vuelvo enseguida.","B1"),
    ("apenas","adv","barely, hardly","knapt","Apenas lo conozco.","B1"),
    ("acaso","adv","perhaps, by any chance","kanskje","¿Acaso no lo sabías?","B2"),
    ("quizá / quizás","adv","maybe, perhaps","kanskje","Quizás venga mañana.","A2"),
    ("mientras","conj","while, meanwhile","mens","Leo mientras espero.","A2"),
    ("por lo tanto","phrase","therefore","derfor","Llueve; por lo tanto, no salgo.","B1"),
    ("a pesar de","phrase","despite, in spite of","til tross for","A pesar de todo, sonríe.","B1"),
]

_VOCAB: List[Dict[str, Any]] = []
for i, t in enumerate(_VOCAB_TUPLES):
    word, pos, en, no, example, level = t
    _VOCAB.append({
        "id": f"esvocab_{i+1:03d}",
        "word": word,
        "pos": pos,
        "meaning": {"en": en, "es": word, "no": no},
        "example": example,
        "level": level,
    })

_VOCAB_MAP = {v["id"]: v for v in _VOCAB}


def get_vocab_all() -> List[Dict[str, Any]]:
    return _VOCAB


# ═══════════════════════════════════════════════════════════════════════════════
# 5 — Falsos Amigos (English → Spanish, for the learner)
# ═══════════════════════════════════════════════════════════════════════════════

_FALSE_FRIENDS: List[Dict[str, Any]] = [
    {"es":"embarazada","en_trap":"embarrassed","actual":{"en":"pregnant","es":"encinta","no":"gravid"},
     "correct":"For 'embarrassed' use **avergonzado/a**.","example":"Está embarazada = She's pregnant (NOT embarrassed)."},
    {"es":"éxito","en_trap":"exit","actual":{"en":"success","es":"triunfo","no":"suksess"},
     "correct":"For 'exit' use **salida**.","example":"un gran éxito = a great success. / la salida = the exit."},
    {"es":"actual","en_trap":"actual","actual":{"en":"current, present-day","es":"de ahora","no":"nåværende"},
     "correct":"For 'actual' (real) use **real / verdadero**.","example":"la situación actual = the current situation."},
    {"es":"sensible","en_trap":"sensible","actual":{"en":"sensitive","es":"que siente","no":"følsom"},
     "correct":"For 'sensible' (rational) use **sensato/a**.","example":"una persona sensible = a sensitive person."},
    {"es":"ropa","en_trap":"rope","actual":{"en":"clothes","es":"vestimenta","no":"klær"},
     "correct":"For 'rope' use **cuerda**.","example":"ropa limpia = clean clothes. / una cuerda = a rope."},
    {"es":"carpeta","en_trap":"carpet","actual":{"en":"folder","es":"archivador","no":"mappe"},
     "correct":"For 'carpet' use **alfombra**.","example":"una carpeta = a folder. / una alfombra = a carpet."},
    {"es":"librería","en_trap":"library","actual":{"en":"bookshop","es":"tienda de libros","no":"bokhandel"},
     "correct":"For 'library' use **biblioteca**.","example":"una librería = a bookshop."},
    {"es":"sopa","en_trap":"soap","actual":{"en":"soup","es":"caldo","no":"suppe"},
     "correct":"For 'soap' use **jabón**.","example":"sopa caliente = hot soup. / jabón = soap."},
    {"es":"largo","en_trap":"large","actual":{"en":"long","es":"de mucha longitud","no":"lang"},
     "correct":"For 'large' use **grande**.","example":"un camino largo = a long road. / una casa grande = a large house."},
    {"es":"once","en_trap":"once","actual":{"en":"eleven (11)","es":"11","no":"elleve"},
     "correct":"For 'once' use **una vez**.","example":"son las once = it's eleven o'clock."},
    {"es":"red","en_trap":"red","actual":{"en":"net, network","es":"malla","no":"nett"},
     "correct":"For 'red' (colour) use **rojo**.","example":"la red social = the social network."},
    {"es":"vaso","en_trap":"vase","actual":{"en":"(drinking) glass","es":"copa","no":"glass"},
     "correct":"For 'vase' use **jarrón / florero**.","example":"un vaso de agua = a glass of water."},
    {"es":"fábrica","en_trap":"fabric","actual":{"en":"factory","es":"planta","no":"fabrikk"},
     "correct":"For 'fabric' use **tela**.","example":"una fábrica de coches = a car factory."},
    {"es":"introducir","en_trap":"introduce (a person)","actual":{"en":"to insert / put in","es":"meter","no":"å sette inn"},
     "correct":"To introduce a PERSON use **presentar**.","example":"introducir la tarjeta = insert the card."},
    {"es":"asistir","en_trap":"assist","actual":{"en":"to attend","es":"acudir","no":"å delta"},
     "correct":"For 'assist' (help) use **ayudar**.","example":"asistir a clase = to attend class."},
    {"es":"molestar","en_trap":"molest","actual":{"en":"to bother, annoy","es":"fastidiar","no":"å plage"},
     "correct":"'Molestar' just means to bother. For the English 'molest' use **abusar**.","example":"No molestes = Don't bother (me)."},
    {"es":"constipado","en_trap":"constipated","actual":{"en":"having a cold","es":"resfriado","no":"forkjølet"},
     "correct":"For 'constipated' use **estreñido**.","example":"Estoy constipado = I have a cold."},
    {"es":"pariente","en_trap":"parent","actual":{"en":"relative","es":"familiar","no":"slektning"},
     "correct":"For 'parents' use **padres**.","example":"un pariente lejano = a distant relative."},
]


def get_false_friends() -> List[Dict[str, Any]]:
    return _FALSE_FRIENDS


# ═══════════════════════════════════════════════════════════════════════════════
# 6 — Cultura (España vs Latinoamérica + notes)
# ═══════════════════════════════════════════════════════════════════════════════

_CULTURE: List[Dict[str, Any]] = [
    {"id":"variantes","emoji":"🌎","title":{"es":"España vs Latinoamérica","en":"Spain vs Latin America","no":"Spania vs Latin-Amerika"},
     "summary":{
        "en":"Spanish is spoken by ~500M people across 20+ countries, with rich variation — none 'more correct' than another. Key differences: 'vosotros' (informal you-plural) is used in Spain but replaced by 'ustedes' everywhere in Latin America; 'vos' replaces 'tú' in Argentina/Uruguay and parts of Central America. Pronunciation: Spain distinguishes c/z (/θ/) vs seseo (/s/) in LatAm. Vocabulary: coche/carro (car), ordenador/computadora (computer), zumo/jugo (juice), patata/papa (potato), móvil/celular (mobile).",
        "es":"El español lo hablan ~500 millones en 20+ países, con rica variación — ninguna 'más correcta'. Diferencias: 'vosotros' en España vs 'ustedes' en América; 'vos' sustituye a 'tú' en Argentina/Uruguay. Léxico: coche/carro, ordenador/computadora, zumo/jugo, patata/papa, móvil/celular.",
        "no":"Spansk snakkes av ~500M i 20+ land. 'vosotros' i Spania vs 'ustedes' i Latin-Amerika; ordforråd varierer (coche/carro)."},
     "phrases":[{"es":"¿Vosotros venís? (España) / ¿Ustedes vienen? (América)","en":"Are you (pl.) coming?"},
                {"es":"el coche / el carro","en":"the car (Spain / LatAm)"}]},
    {"id":"tuteo","emoji":"🗣","title":{"es":"Tú, usted y vos","en":"Formal vs informal 'you'","no":"Formell vs uformell 'du'"},
     "summary":{
        "en":"'Tú' = informal you (friends, family). 'Usted' = formal/respectful (strangers, elders, professional) — takes 3rd-person verb forms ('usted tiene'). 'Vos' = informal you in Argentina, Uruguay, and parts of Central America, with its own verb forms ('vos tenés', 'vos sos'). Choosing the wrong register can sound rude or oddly distant.",
        "es":"'Tú' = informal. 'Usted' = formal/respetuoso (verbo en 3ª persona: 'usted tiene'). 'Vos' = informal en Argentina/Uruguay con formas propias ('vos tenés'). Elegir mal el registro suena grosero o distante.",
        "no":"'Tú' = uformell, 'usted' = formell (3. person verb), 'vos' = uformell i Argentina."},
     "phrases":[{"es":"¿Cómo estás tú? / ¿Cómo está usted?","en":"How are you? (informal / formal)"},
                {"es":"vos tenés (Argentina)","en":"you have (informal, River Plate)"}]},
    {"id":"sobremesa","emoji":"🍷","title":{"es":"La sobremesa","en":"Table talk after a meal","no":"Samtale etter måltidet"},
     "summary":{
        "en":"'Sobremesa' is the cherished time spent talking at the table AFTER eating — coffee, conversation, no rush. It can last longer than the meal. There's no clean English word for it. Meals in Spain also run late: lunch ~14:00-15:00, dinner ~21:00-22:00.",
        "es":"La 'sobremesa' es el tiempo de charla en la mesa DESPUÉS de comer — café, conversación, sin prisa. No tiene equivalente en inglés. En España se come tarde: comida ~14-15h, cena ~21-22h.",
        "no":"'Sobremesa' er praten ved bordet ETTER måltidet — ingen engelsk ekvivalent."},
     "phrases":[{"es":"Nos quedamos de sobremesa hasta las cinco.","en":"We chatted at the table until five."}]},
    {"id":"expresiones","emoji":"💬","title":{"es":"Expresiones cotidianas","en":"Everyday expressions","no":"Hverdagsuttrykk"},
     "summary":{
        "en":"Natural Spanish is full of fixed expressions learners rarely get from textbooks: '¡Qué va!' (No way!), 'vale' (OK — very Spain), 'venga' (come on / alright), '¡Ojo!' (Watch out!), 'ni idea' (no clue), 'me da igual' (I don't care), 'qué rollo' (what a drag), 'estar de moda' (to be trendy). Regional: 'chévere/guay/bacano' (cool).",
        "es":"El español natural está lleno de expresiones fijas: '¡Qué va!', 'vale' (España), 'venga', '¡Ojo!', 'ni idea', 'me da igual', 'qué rollo'. Regionales: 'chévere/guay/bacano' (genial).",
        "no":"Naturlig spansk er full av faste uttrykk: 'vale', 'venga', '¡Ojo!'."},
     "phrases":[{"es":"— ¿Nos vamos? — ¡Venga, vale!","en":"— Shall we go? — Come on, OK!"},
                {"es":"Me da igual.","en":"I don't mind / I don't care."}]},
    {"id":"acentos","emoji":"🎭","title":{"es":"Acentos y música","en":"Accents & rhythm","no":"Aksenter og rytme"},
     "summary":{
        "en":"Each region has its own music: Caribbean Spanish (Cuba, Puerto Rico, Dominican R.) drops final 's' and is fast and rhythmic; Mexican Spanish is clear and widely understood (lots of media); Argentine has Italian-influenced intonation and 'sh' for ll/y; Andean Spanish is measured. For a learner, Mexican or 'neutral' Latin American is the most widely understood starting point.",
        "es":"Cada región tiene su música: el caribeño (Cuba, PR, RD) aspira la 's' final y es rápido; el mexicano es claro y muy entendido; el argentino tiene entonación italiana y 'sh'; el andino es pausado. Para empezar, el mexicano o 'neutro' es el más entendido.",
        "no":"Hver region har sin rytme: karibisk dropper siste 's'; meksikansk er klart; argentinsk har italiensk intonasjon."},
     "phrases":[{"es":"¿Cómo estái? (Chile) / ¿Cómo andás? (Argentina)","en":"How are you? (regional variants)"}]},
]


def get_culture() -> List[Dict[str, Any]]:
    return _CULTURE


# ═══════════════════════════════════════════════════════════════════════════════
# 7 — SRS (SM-2 shared pattern)
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
# 8 — Conversación (LLM-backed)
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS: Dict[str, Dict[str, str]] = {
    "presentarse": {"en":"Introducing yourself","es":"Presentarse","no":"Presentere seg","first":"¡Hola! ¿Cómo te llamas y de dónde eres?"},
    "restaurante": {"en":"At a restaurant","es":"En el restaurante","no":"På restaurant","first":"¡Buenas! ¿Qué le pongo?"},
    "compras":     {"en":"Shopping","es":"De compras","no":"Handle","first":"Hola, ¿en qué puedo ayudarte?"},
    "direcciones": {"en":"Asking for directions","es":"Pedir direcciones","no":"Spørre om veien","first":"Perdona, ¿sabes dónde está la estación?"},
    "viaje":       {"en":"Travelling","es":"De viaje","no":"På reise","first":"¡Bienvenido! ¿Es tu primera vez en España?"},
    "trabajo":     {"en":"At work","es":"En el trabajo","no":"På jobb","first":"Buenos días. ¿Empezamos con la reunión?"},
}

_LANG_NAMES = {"es": "Spanish", "en": "English", "no": "Norwegian"}


def _teacher_system_prompt(scenario: str, difficulty: str, explain_lang: str) -> str:
    lang_name = _LANG_NAMES.get(explain_lang, "English")
    scen_label = SCENARIOS.get(scenario, {}).get("en", scenario)
    return (
        "You are Maestro de Español IA, a warm, patient Spanish teacher. Your student is a "
        "non-native learner practising Spanish. Reply in natural, clear Spanish (neutral / "
        "widely-understood, note regionalisms only when useful).\n\n"
        f"SCENARIO: {scen_label}\n"
        f"STUDENT LEVEL: {difficulty}\n"
        f"CORRECTION-EXPLANATION LANGUAGE: {lang_name}\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"reply":"<your natural Spanish reply>",'
        '"translation":"<short ' + lang_name + ' translation of your reply>",'
        f'"correction":"<if the student\'s last message had an error, a short fix explained in {lang_name} — watch ser/estar, por/para, gender, subjunctive — else empty>",'
        '"upgrade":"<optional: a more natural / native way to say what the student said, in Spanish>",'
        '"tip":"<optional short teaching tip: a collocation, a false friend, a grammar reminder>"}\n\n'
        "Rules:\n"
        "- Keep it short, natural and encouraging.\n"
        "- For beginner: simple present, common vocab. For intermediate: past tenses, connectors. For advanced: subjunctive, idioms.\n"
        "- In `upgrade`, show a more native phrasing of THEIR Spanish.\n"
        "- Correct real errors only, kindly."
    )


async def conversation_message(scenario: str, difficulty: str, history: List[Dict[str, str]],
                               user_text: Optional[str], lang: str = "en") -> Dict[str, Any]:
    scen = SCENARIOS.get(scenario, SCENARIOS["presentarse"])
    if not history and not user_text:
        return {"reply": scen["first"], "translation": "", "correction": "", "upgrade": "", "tip": "",
                "is_mock": False, "scenario": scenario, "difficulty": difficulty}
    if ask_ai_unified is None:
        return _mock_reply(scenario, difficulty)
    sys_prompt = _teacher_system_prompt(scenario, difficulty, lang)
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
    return {"reply": "¡Muy bien! ¿Puedes contarme un poco más?", "translation": "Very good! Can you tell me a bit more?",
            "correction": "", "upgrade": "", "tip": "[Mock — connect an AI model for live conversation.]",
            "is_mock": True, "scenario": scenario, "difficulty": difficulty}


def scenarios_catalogue(lang: str = "en") -> List[Dict[str, str]]:
    return [{"key": k, "label": v.get(lang, v["en"]), "first": v["first"]} for k, v in SCENARIOS.items()]


# ═══════════════════════════════════════════════════════════════════════════════
# 9 — Escritura (writing feedback)
# ═══════════════════════════════════════════════════════════════════════════════

_MAX_WRITING_CHARS = 4000


def _writing_system_prompt(explain_lang: str, register: str) -> str:
    lang_name = _LANG_NAMES.get(explain_lang, "English")
    return (
        "You are Maestro de Español IA's writing coach for a non-native Spanish learner. "
        "Analyse the student's Spanish text and give targeted, encouraging feedback — NOT a full rewrite.\n\n"
        f"TARGET REGISTER: {register}\n"
        f"EXPLANATION LANGUAGE: {lang_name}\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"corrected":"<the text with errors fixed, keeping the student\'s voice>",'
        '"issues":[{"original":"<verbatim snippet>","fix":"<corrected>",'
        f'"type":"ser_estar|por_para|gender|verb|subjunctive|accent|word_choice|naturalness","note":"<short why, in {lang_name}>"}}],'
        '"upgrades":["<1-3 phrases rewritten in more natural Spanish>"],'
        '"cefr_estimate":"<A1|A2|B1|B2|C1>",'
        '"summary":"<one-sentence encouraging summary in ' + lang_name + '>"}\n\n'
        "Rules:\n"
        "- Quote `original` verbatim.\n"
        "- Prioritise ser/estar, por/para, gender agreement, verb conjugation and missing accents (tildes).\n"
        "- Max ~6 issues. Don't nitpick style.\n"
        "- `upgrades` should sound native, not just synonyms."
    )


async def writing_feedback(text: str, register: str = "neutral", lang: str = "en",
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
                                                 {"role": "user", "content": f"Student's text:\n\n{text}"}])
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
        level = "C1 (Avanzado)"
    elif vocab_known >= 12:
        level = "B2 (Intermedio alto)"
    else:
        level = "B1 (Intermedio)"
    mission = [
        {"type": "pronunciacion", "count": 3, "label": "sound drills"},
        {"type": "gramatica",     "count": 2, "label": "grammar points"},
        {"type": "conjugacion",   "count": 2, "label": "verb tables"},
        {"type": "srs",           "count": min(20, srs_due_n + new_today), "label": "vocabulary reviews"},
        {"type": "conversacion",  "count": 1, "label": "conversation"},
    ]
    return {
        "user_id": user_id, "level": level, "cefr_target": "C1", "streak_days": 0,
        "stats": {
            "sounds_total":       len(_SOUNDS),
            "grammar_total":      len(_GRAMMAR),
            "conjugation_total":  len(_CONJUGATION),
            "false_friends_total":len(_FALSE_FRIENDS),
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
    return {"status": "ok", "agent": "spanish_teacher",
            "version": SPANISH_TEACHER_VERSION, "llm_available": ask_ai_unified is not None}
