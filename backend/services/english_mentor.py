"""
English Mastery AI — Service
============================
Functional V1 for the advanced-English mentor, aimed at a Spanish speaker
who already communicates well and wants to reach C1 → C2.

This is NOT a "learn the alphabet" agent (contrast the CJK agents). It is a
*perfection* tool. Nine modules:

  1. False Friends       — Spanish→English traps (sensible≠sensible, etc.)
  2. Collocations        — make/take a decision, ask/make a question
  3. Phrasal Verbs       — the classic C1→C2 wall
  4. Idioms              — natural idiomatic English
  5. Grammar Nuance      — perfect aspects, inversion, articles, reported speech
  6. Pronunciation Lab   — minimal pairs (th, ship/sheep), word stress
  7. Vocabulary SRS      — C1/C2 words with SM-2 spaced repetition
  8. Conversation        — LLM-backed, register-aware
  9. Writing & Style     — paste text, get C2-level feedback

Single-user model (user_id='default') matching the language-agent pattern.
Meaning fields carry {en, es, no}; es is the primary gloss for the learner.
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
    _VOCAB_COL = database.get_collection("english_vocab_progress")
    _SRS_COL   = database.get_collection("english_srs_reviews")
    _CONV_COL  = database.get_collection("english_conversation_runs")
    _WRITE_COL = database.get_collection("english_writing_runs")
except Exception:
    _VOCAB_COL = _SRS_COL = _CONV_COL = _WRITE_COL = None

DEFAULT_USER = "default"
ENGLISH_MENTOR_VERSION = "1.0.0"


# ═══════════════════════════════════════════════════════════════════════════════
# 1 — False Friends (Spanish → English)
# ═══════════════════════════════════════════════════════════════════════════════
# Each: the English word a Spanish speaker misuses, what they THINK it means
# (the Spanish false cognate), what it ACTUALLY means, and the correct English
# for the intended Spanish meaning.

_FALSE_FRIENDS: List[Dict[str, Any]] = [
    {"en":"sensible","es_trap":"sensible (sensitive)","actual":{"en":"practical, showing good judgement","es":"sensato, práctico","no":"fornuftig"},
     "correct":"For 'sensible' (emotional) use **sensitive**.",
     "example":"She's a sensible manager (sensata). / He's very sensitive (sensible/emocional)."},
    {"en":"actually","es_trap":"actualmente (currently)","actual":{"en":"in fact, really","es":"en realidad, de hecho","no":"faktisk"},
     "correct":"For 'actualmente' use **currently / at the moment**.",
     "example":"Actually, I disagree (en realidad). / I'm currently working from home (actualmente)."},
    {"en":"assist","es_trap":"asistir (to attend)","actual":{"en":"to help","es":"ayudar","no":"å hjelpe"},
     "correct":"For 'asistir a' (be present) use **attend**.",
     "example":"A nurse assisted the doctor (ayudó). / I attended the meeting (asistí)."},
    {"en":"embarrassed","es_trap":"embarazada (pregnant)","actual":{"en":"ashamed, self-conscious","es":"avergonzado","no":"flau"},
     "correct":"For 'embarazada' use **pregnant**.",
     "example":"I was embarrassed (avergonzado). / She is pregnant (embarazada)."},
    {"en":"realize","es_trap":"realizar (to carry out)","actual":{"en":"to become aware of","es":"darse cuenta","no":"å innse"},
     "correct":"For 'realizar' use **carry out / perform / do**.",
     "example":"I realized my mistake (me di cuenta). / We carried out the plan (realizamos)."},
    {"en":"library","es_trap":"librería (bookshop)","actual":{"en":"place to borrow books","es":"biblioteca","no":"bibliotek"},
     "correct":"For 'librería' use **bookshop / bookstore**.",
     "example":"I study at the library (biblioteca). / I bought it at a bookshop (librería)."},
    {"en":"carpet","es_trap":"carpeta (folder)","actual":{"en":"floor covering","es":"alfombra","no":"teppe"},
     "correct":"For 'carpeta' use **folder / file**.",
     "example":"a soft carpet (alfombra). / Put it in the folder (carpeta)."},
    {"en":"exit","es_trap":"éxito (success)","actual":{"en":"way out","es":"salida","no":"utgang"},
     "correct":"For 'éxito' use **success**.",
     "example":"the emergency exit (salida). / a huge success (un gran éxito)."},
    {"en":"constipated","es_trap":"constipado (having a cold)","actual":{"en":"unable to pass stool","es":"estreñido","no":"forstoppelse"},
     "correct":"For 'constipado' use **to have a cold**.",
     "example":"I have a cold (constipado). / He's constipated (estreñido)."},
    {"en":"introduce","es_trap":"introducir (to insert)","actual":{"en":"to present a person","es":"presentar a alguien","no":"å presentere"},
     "correct":"For 'introducir' (insert) use **insert / put in**.",
     "example":"Let me introduce my colleague (presentar). / Insert the card (introducir)."},
    {"en":"eventually","es_trap":"eventualmente (occasionally)","actual":{"en":"in the end, finally","es":"finalmente, con el tiempo","no":"til slutt"},
     "correct":"For 'eventualmente' use **possibly / occasionally**.",
     "example":"Eventually she agreed (al final). / We occasionally meet (eventualmente)."},
    {"en":"support","es_trap":"soportar (to tolerate)","actual":{"en":"to back, to hold up","es":"apoyar, sostener","no":"å støtte"},
     "correct":"For 'soportar' (endure) use **to bear / stand / tolerate**.",
     "example":"I support your idea (apoyo). / I can't stand the noise (no soporto)."},
    {"en":"advertisement","es_trap":"advertencia (warning)","actual":{"en":"a commercial promotion","es":"anuncio publicitario","no":"reklame"},
     "correct":"For 'advertencia' use **warning / caution**.",
     "example":"a TV advertisement (anuncio). / a health warning (advertencia)."},
    {"en":"argument","es_trap":"argumento (plot / reasoning)","actual":{"en":"a disagreement / a reason","es":"discusión; razón","no":"krangel; argument"},
     "correct":"For a film's 'argumento' use **plot**.",
     "example":"We had an argument (discusión). / The film's plot (el argumento)."},
    {"en":"fabric","es_trap":"fábrica (factory)","actual":{"en":"cloth, material","es":"tela","no":"stoff"},
     "correct":"For 'fábrica' use **factory / plant**.",
     "example":"soft fabric (tela). / a car factory (fábrica)."},
    {"en":"molest","es_trap":"molestar (to bother)","actual":{"en":"to abuse sexually","es":"abusar","no":"å forgripe seg"},
     "correct":"For 'molestar' use **to bother / annoy / disturb**.",
     "example":"Don't bother him (no le molestes) — NEVER 'don't molest him'."},
    {"en":"career","es_trap":"carrera (university degree / race)","actual":{"en":"professional life over time","es":"trayectoria profesional","no":"karriere"},
     "correct":"For university 'carrera' use **degree / studies**; for a race use **race**.",
     "example":"a long career (trayectoria). / I studied a law degree (la carrera de derecho)."},
    {"en":"pretend","es_trap":"pretender (to intend / aim)","actual":{"en":"to fake, to feign","es":"fingir","no":"å late som"},
     "correct":"For 'pretender' use **to intend / to try / to expect**.",
     "example":"He pretended to sleep (fingió). / I intend to finish today (pretendo)."},
    {"en":"sympathetic","es_trap":"simpático (nice/likeable)","actual":{"en":"understanding, compassionate","es":"comprensivo","no":"forståelsesfull"},
     "correct":"For 'simpático' use **nice / friendly / likeable**.",
     "example":"a sympathetic listener (comprensivo). / a nice person (simpático)."},
    {"en":"discuss","es_trap":"discutir (to quarrel)","actual":{"en":"to talk about (neutral)","es":"tratar, hablar de","no":"å diskutere"},
     "correct":"'Discuss' has NO 'no preposition' — never 'discuss about'.",
     "example":"Let's discuss the plan (tratar/hablar de) — NOT 'discuss about the plan'."},
    {"en":"large","es_trap":"largo (long)","actual":{"en":"big in size","es":"grande","no":"stor"},
     "correct":"For 'largo' use **long**.",
     "example":"a large house (grande). / a long corridor (largo)."},
    {"en":"remove","es_trap":"remover (to stir)","actual":{"en":"to take away","es":"quitar, eliminar","no":"å fjerne"},
     "correct":"For 'remover' (stir) use **to stir**.",
     "example":"Remove your shoes (quítate). / Stir the soup (remueve)."},
    {"en":"rope","es_trap":"ropa (clothes)","actual":{"en":"thick cord","es":"cuerda","no":"tau"},
     "correct":"For 'ropa' use **clothes / clothing**.",
     "example":"a climbing rope (cuerda). / warm clothes (ropa)."},
    {"en":"contest","es_trap":"contestar (to answer)","actual":{"en":"a competition","es":"concurso, competición","no":"konkurranse"},
     "correct":"For 'contestar' use **to answer / reply**.",
     "example":"a singing contest (concurso). / Answer the question (contesta)."},
    {"en":"delicate","es_trap":"delicado — ok, but note 'delito'","actual":{"en":"fragile, subtle","es":"delicado, frágil","no":"delikat, skjør"},
     "correct":"Don't confuse with **crime = delito** (not 'delict').",
     "example":"a delicate situation (delicada). / He committed a crime (un delito)."},
    {"en":"quit","es_trap":"quitar (to remove)","actual":{"en":"to leave / stop","es":"dejar, abandonar","no":"å slutte"},
     "correct":"For 'quitar' use **to remove / take away**.",
     "example":"I quit my job (dejé). / Remove the lid (quita la tapa)."},
    {"en":"lecture","es_trap":"lectura (reading)","actual":{"en":"a talk / class","es":"conferencia, clase","no":"forelesning"},
     "correct":"For 'lectura' use **reading**.",
     "example":"a physics lecture (clase magistral). / bedtime reading (lectura)."},
    {"en":"parents","es_trap":"parientes (relatives)","actual":{"en":"mother and father","es":"padres","no":"foreldre"},
     "correct":"For 'parientes' use **relatives**.",
     "example":"my parents (mis padres). / distant relatives (parientes lejanos)."},
    {"en":"envy","es_trap":"enviar (to send)","actual":{"en":"jealousy","es":"envidia","no":"misunnelse"},
     "correct":"For 'enviar' use **to send**.",
     "example":"green with envy (envidia). / send an email (enviar)."},
    {"en":"complexion","es_trap":"complexión (build/physique)","actual":{"en":"skin appearance","es":"tez, cutis","no":"hudfarge"},
     "correct":"For body 'complexión' use **build / physique**.",
     "example":"a fair complexion (tez). / an athletic build (complexión atlética)."},
]


def get_false_friends() -> List[Dict[str, Any]]:
    return _FALSE_FRIENDS


# ═══════════════════════════════════════════════════════════════════════════════
# 2 — Collocations (verb + noun the Spanish speaker gets wrong)
# ═══════════════════════════════════════════════════════════════════════════════

_COLLOCATIONS: List[Dict[str, Any]] = [
    {"right":"make a decision","wrong":"take a decision","note":{"en":"'take a decision' is a direct calque of 'tomar una decisión'.","es":"'take a decision' es un calco de 'tomar una decisión'.","no":"'take a decision' er en direkte oversettelse."},"example":"We need to make a decision by Friday."},
    {"right":"ask a question","wrong":"make a question","note":{"en":"You ASK questions in English, not 'make'.","es":"En inglés se 'ask' (hacer) preguntas, no 'make'.","no":"Man 'ask' spørsmål på engelsk."},"example":"Can I ask you a question?"},
    {"right":"do homework","wrong":"make homework","note":{"en":"'do' for tasks/duties; 'make' for creating.","es":"'do' para tareas; 'make' para crear.","no":"'do' for oppgaver."},"example":"Have you done your homework?"},
    {"right":"make a mistake","wrong":"do a mistake","note":{"en":"Mistakes are 'made', not 'done'.","es":"Los errores se 'make'.","no":"Feil blir 'made'."},"example":"Everyone makes mistakes."},
    {"right":"take a photo","wrong":"make a photo","note":{"en":"You 'take' photos in English.","es":"Las fotos se 'take'.","no":"Bilder blir 'taken'."},"example":"Let me take a photo of you."},
    {"right":"have breakfast","wrong":"take breakfast","note":{"en":"Meals are 'had', not 'taken'.","es":"Las comidas se 'have'.","no":"Måltider blir 'had'."},"example":"I have breakfast at 7."},
    {"right":"pay attention","wrong":"put attention","note":{"en":"'prestar atención' → pay attention.","es":"'prestar atención' → pay attention.","no":"'gi oppmerksomhet' → pay attention."},"example":"Please pay attention to the details."},
    {"right":"make an effort","wrong":"do an effort","note":{"en":"Effort is 'made'.","es":"El esfuerzo se 'make'.","no":"Innsats blir 'made'."},"example":"She made a real effort to improve."},
    {"right":"do business","wrong":"make business","note":{"en":"'do business with someone'.","es":"'hacer negocios' → do business.","no":"'gjøre forretninger' → do business."},"example":"We do business across Europe."},
    {"right":"take a shower","wrong":"make/give a shower","note":{"en":"Showers are 'taken' (US) or 'had' (UK).","es":"'darse una ducha' → take/have a shower.","no":"'ta en dusj' → take a shower."},"example":"I take a shower every morning."},
    {"right":"heavy rain","wrong":"strong rain","note":{"en":"Rain is 'heavy', wind is 'strong'.","es":"La lluvia es 'heavy', el viento 'strong'.","no":"Regn er 'heavy'."},"example":"Heavy rain is forecast tonight."},
    {"right":"strong coffee","wrong":"hard coffee","note":{"en":"Coffee is 'strong', not 'hard'.","es":"El café es 'strong'.","no":"Kaffe er 'strong'."},"example":"I need a strong coffee."},
    {"right":"make friends","wrong":"do friends","note":{"en":"'hacer amigos' → make friends.","es":"'hacer amigos' → make friends.","no":"'få venner' → make friends."},"example":"He makes friends easily."},
    {"right":"tell the truth","wrong":"say the truth","note":{"en":"You 'tell' the truth/a lie.","es":"'decir la verdad' → tell the truth.","no":"'si sannheten' → tell the truth."},"example":"Just tell me the truth."},
    {"right":"take place","wrong":"have place","note":{"en":"Events 'take place'.","es":"'tener lugar' → take place.","no":"'finne sted' → take place."},"example":"The event takes place in May."},
    {"right":"catch a cold","wrong":"take a cold","note":{"en":"You 'catch' a cold.","es":"'coger un resfriado' → catch a cold.","no":"'bli forkjølet' → catch a cold."},"example":"I caught a cold last week."},
    {"right":"make sense","wrong":"have sense","note":{"en":"Something 'makes sense'.","es":"'tener sentido' → make sense.","no":"'gi mening' → make sense."},"example":"That doesn't make sense."},
    {"right":"do the dishes","wrong":"wash up the dishes (calque)","note":{"en":"'do the dishes' (US) / 'wash up' (UK).","es":"'fregar los platos' → do the dishes.","no":"'ta oppvasken' → do the dishes."},"example":"Can you do the dishes tonight?"},
    {"right":"keep a promise","wrong":"maintain a promise","note":{"en":"Promises are 'kept'.","es":"'mantener una promesa' → keep a promise.","no":"'holde et løfte' → keep a promise."},"example":"He always keeps his promises."},
    {"right":"run a business","wrong":"lead a business (calque)","note":{"en":"You 'run' a business/company.","es":"'llevar/dirigir un negocio' → run a business.","no":"'drive en bedrift' → run a business."},"example":"She runs a successful business."},
    {"right":"make progress","wrong":"do progress","note":{"en":"Progress is 'made'.","es":"'hacer progresos' → make progress.","no":"'gjøre fremskritt' → make progress."},"example":"You're making great progress."},
    {"right":"break the law","wrong":"skip the law (calque)","note":{"en":"Laws are 'broken'.","es":"'saltarse la ley' → break the law.","no":"'bryte loven' → break the law."},"example":"They broke the law."},
    {"right":"meet a deadline","wrong":"reach a deadline (nuance)","note":{"en":"You 'meet' (satisfy) a deadline.","es":"'cumplir un plazo' → meet a deadline.","no":"'overholde en frist' → meet a deadline."},"example":"We met the deadline."},
    {"right":"raise a question","wrong":"lift a question (calque)","note":{"en":"You 'raise' (bring up) a question/issue.","es":"'plantear una pregunta' → raise a question.","no":"'ta opp et spørsmål' → raise a question."},"example":"She raised an important question."},
    {"right":"draw a conclusion","wrong":"take a conclusion (calque)","note":{"en":"Conclusions are 'drawn'.","es":"'sacar una conclusión' → draw a conclusion.","no":"'trekke en konklusjon' → draw a conclusion."},"example":"What conclusion can we draw?"},
]


def get_collocations() -> List[Dict[str, Any]]:
    return _COLLOCATIONS


# ═══════════════════════════════════════════════════════════════════════════════
# 3 — Phrasal Verbs (C1/C2)
# ═══════════════════════════════════════════════════════════════════════════════

_PHRASAL_VERBS: List[Dict[str, Any]] = [
    {"pv":"put off","meaning":{"en":"to postpone","es":"posponer, aplazar","no":"utsette"},"register":"neutral","sep":True,"example":"Don't put off the meeting again."},
    {"pv":"bring up","meaning":{"en":"to raise a topic; to raise a child","es":"sacar un tema; criar","no":"ta opp; oppdra"},"register":"neutral","sep":True,"example":"She brought up an interesting point."},
    {"pv":"carry out","meaning":{"en":"to perform / execute","es":"llevar a cabo","no":"gjennomføre"},"register":"formal","sep":True,"example":"We carried out a full review."},
    {"pv":"come across","meaning":{"en":"to find by chance; to seem","es":"encontrarse con; parecer","no":"komme over; virke"},"register":"neutral","sep":False,"example":"I came across an old photo."},
    {"pv":"get by","meaning":{"en":"to manage / survive","es":"arreglárselas","no":"klare seg"},"register":"informal","sep":False,"example":"We can get by on very little."},
    {"pv":"look into","meaning":{"en":"to investigate","es":"investigar","no":"undersøke"},"register":"neutral","sep":False,"example":"I'll look into the problem."},
    {"pv":"put up with","meaning":{"en":"to tolerate","es":"aguantar, soportar","no":"tolerere"},"register":"informal","sep":False,"example":"I can't put up with the noise."},
    {"pv":"turn out","meaning":{"en":"to end up / prove to be","es":"resultar (ser)","no":"vise seg"},"register":"neutral","sep":False,"example":"It turned out to be a great idea."},
    {"pv":"call off","meaning":{"en":"to cancel","es":"cancelar","no":"avlyse"},"register":"neutral","sep":True,"example":"They called off the wedding."},
    {"pv":"work out","meaning":{"en":"to solve; to exercise; to end well","es":"resolver; entrenar; salir bien","no":"løse; trene"},"register":"neutral","sep":True,"example":"Let's work out a solution."},
    {"pv":"get away with","meaning":{"en":"to escape blame","es":"salirse con la suya","no":"slippe unna"},"register":"informal","sep":False,"example":"He got away with cheating."},
    {"pv":"go over","meaning":{"en":"to review carefully","es":"repasar","no":"gå gjennom"},"register":"neutral","sep":False,"example":"Let's go over the report."},
    {"pv":"set up","meaning":{"en":"to establish / arrange","es":"establecer, montar","no":"opprette"},"register":"neutral","sep":True,"example":"They set up a new company."},
    {"pv":"come up with","meaning":{"en":"to think of / produce","es":"idear, ocurrírsele","no":"finne på"},"register":"neutral","sep":False,"example":"She came up with a brilliant plan."},
    {"pv":"back up","meaning":{"en":"to support; to copy data","es":"respaldar","no":"støtte; sikkerhetskopiere"},"register":"neutral","sep":True,"example":"The data backs up the claim."},
    {"pv":"figure out","meaning":{"en":"to understand / solve","es":"averiguar, entender","no":"finne ut"},"register":"informal","sep":True,"example":"I can't figure out how it works."},
    {"pv":"point out","meaning":{"en":"to indicate / note","es":"señalar","no":"påpeke"},"register":"neutral","sep":True,"example":"She pointed out a flaw."},
    {"pv":"rule out","meaning":{"en":"to exclude","es":"descartar","no":"utelukke"},"register":"formal","sep":True,"example":"We can't rule out that option."},
    {"pv":"sort out","meaning":{"en":"to resolve / organise","es":"solucionar, ordenar","no":"ordne opp"},"register":"informal","sep":True,"example":"I'll sort out the mess."},
    {"pv":"take on","meaning":{"en":"to accept (work); to hire","es":"asumir; contratar","no":"påta seg; ansette"},"register":"neutral","sep":True,"example":"She took on too much work."},
    {"pv":"wear off","meaning":{"en":"to gradually disappear","es":"pasarse (efecto)","no":"avta"},"register":"neutral","sep":False,"example":"The painkiller wore off."},
    {"pv":"drop out","meaning":{"en":"to quit (a course)","es":"abandonar (estudios)","no":"droppe ut"},"register":"informal","sep":False,"example":"He dropped out of university."},
    {"pv":"stand out","meaning":{"en":"to be noticeable","es":"destacar","no":"skille seg ut"},"register":"neutral","sep":False,"example":"Her work really stands out."},
    {"pv":"cut down on","meaning":{"en":"to reduce","es":"reducir","no":"kutte ned på"},"register":"neutral","sep":False,"example":"I'm cutting down on sugar."},
    {"pv":"look forward to","meaning":{"en":"to anticipate with pleasure","es":"esperar con ilusión","no":"glede seg til"},"register":"neutral","sep":False,"example":"I look forward to hearing from you."},
    {"pv":"break down","meaning":{"en":"to stop working; to collapse emotionally","es":"averiarse; derrumbarse","no":"bryte sammen"},"register":"neutral","sep":False,"example":"The car broke down."},
]


def get_phrasal_verbs() -> List[Dict[str, Any]]:
    return _PHRASAL_VERBS


# ═══════════════════════════════════════════════════════════════════════════════
# 4 — Idioms
# ═══════════════════════════════════════════════════════════════════════════════

_IDIOMS: List[Dict[str, Any]] = [
    {"idiom":"a blessing in disguise","meaning":{"en":"a good thing that seemed bad at first","es":"no hay mal que por bien no venga","no":"held i uhell"},"example":"Losing that job was a blessing in disguise."},
    {"idiom":"the ball is in your court","meaning":{"en":"it's your decision now","es":"te toca a ti decidir","no":"ballen ligger hos deg"},"example":"I've made my offer — the ball is in your court."},
    {"idiom":"bite the bullet","meaning":{"en":"to face something unpleasant","es":"apretar los dientes","no":"bite i det sure eplet"},"example":"I bit the bullet and told her the truth."},
    {"idiom":"cut corners","meaning":{"en":"to do something cheaply/poorly","es":"hacer chapuzas, ahorrar a costa de la calidad","no":"ta snarveier"},"example":"Don't cut corners on safety."},
    {"idiom":"get cold feet","meaning":{"en":"to lose nerve at the last moment","es":"echarse atrás","no":"få kalde føtter"},"example":"He got cold feet before the presentation."},
    {"idiom":"hit the nail on the head","meaning":{"en":"to be exactly right","es":"dar en el clavo","no":"treffe spikeren på hodet"},"example":"You hit the nail on the head."},
    {"idiom":"once in a blue moon","meaning":{"en":"very rarely","es":"de higos a brevas, muy rara vez","no":"en sjelden gang"},"example":"We meet once in a blue moon."},
    {"idiom":"the last straw","meaning":{"en":"the final problem that breaks patience","es":"la gota que colma el vaso","no":"dråpen som får begeret til å renne over"},"example":"That was the last straw."},
    {"idiom":"under the weather","meaning":{"en":"slightly ill","es":"pachucho, indispuesto","no":"litt dårlig"},"example":"I'm feeling a bit under the weather."},
    {"idiom":"pull someone's leg","meaning":{"en":"to joke / tease","es":"tomar el pelo","no":"å tulle med noen"},"example":"Relax, I'm just pulling your leg."},
    {"idiom":"beat around the bush","meaning":{"en":"to avoid the point","es":"andarse por las ramas","no":"gå rundt grøten"},"example":"Stop beating around the bush."},
    {"idiom":"break the ice","meaning":{"en":"to ease initial tension","es":"romper el hielo","no":"bryte isen"},"example":"A joke helped break the ice."},
    {"idiom":"on the same page","meaning":{"en":"in agreement / aligned","es":"en la misma sintonía","no":"på samme side"},"example":"Let's make sure we're on the same page."},
    {"idiom":"a piece of cake","meaning":{"en":"very easy","es":"pan comido","no":"lett som en lek"},"example":"The exam was a piece of cake."},
    {"idiom":"cost an arm and a leg","meaning":{"en":"to be very expensive","es":"costar un ojo de la cara","no":"koste skjorta"},"example":"That car cost an arm and a leg."},
    {"idiom":"speak of the devil","meaning":{"en":"said when someone appears just as mentioned","es":"hablando del rey de Roma","no":"når man snakker om sola"},"example":"Speak of the devil — here she is!"},
    {"idiom":"burn the midnight oil","meaning":{"en":"to work late into the night","es":"quemarse las pestañas","no":"jobbe til langt på natt"},"example":"I burned the midnight oil to finish it."},
    {"idiom":"the tip of the iceberg","meaning":{"en":"a small visible part of a big problem","es":"la punta del iceberg","no":"toppen av isfjellet"},"example":"These complaints are just the tip of the iceberg."},
]


def get_idioms() -> List[Dict[str, Any]]:
    return _IDIOMS


# ═══════════════════════════════════════════════════════════════════════════════
# 5 — Grammar Nuance (C1/C2 points)
# ═══════════════════════════════════════════════════════════════════════════════

_GRAMMAR: List[Dict[str, Any]] = [
    {"id":"g1","level":"C1","title":"Present Perfect vs Past Simple",
     "pattern":"have/has + past participle  vs  V-ed",
     "explanation":{
        "en":"Spanish 'pretérito perfecto' (he hecho) does NOT map 1:1. Use Present Perfect for actions connected to now (unfinished time, life experience, recent result). Use Past Simple with finished time markers (yesterday, in 2020, last week).",
        "es":"El pretérito perfecto español NO se traduce 1:1. Usa Present Perfect para acciones conectadas al presente (tiempo no terminado, experiencia, resultado reciente). Usa Past Simple con marcadores de tiempo terminado (yesterday, in 2020).",
        "no":"Bruk Present Perfect for handlinger knyttet til nå; Past Simple med avsluttet tid."},
     "examples":[
        {"en":"I have lived here for ten years. (still living)","note":"unfinished — connected to now"},
        {"en":"I lived in Madrid in 2015. (finished)","note":"finished time marker"}],
     "commonMistake":{
        "en":"❌ 'I have seen him yesterday' → ✓ 'I saw him yesterday' (finished time forbids present perfect).",
        "es":"❌ 'I have seen him yesterday' → ✓ 'I saw him yesterday'.",
        "no":"❌ 'I have seen him yesterday' → ✓ 'I saw him yesterday'."}},
    {"id":"g2","level":"C1","title":"Articles: a / the / zero",
     "pattern":"a/an (first mention) · the (specific) · Ø (general plural/uncountable)",
     "explanation":{
        "en":"Spanish uses 'el/la' for generalisations ('Los perros son leales'); English drops the article ('Dogs are loyal'). Use 'the' only for something specific/known.",
        "es":"El español usa 'el/la' para generalizar ('Los perros son leales'); el inglés omite el artículo ('Dogs are loyal'). Usa 'the' solo para algo específico/conocido.",
        "no":"Engelsk dropper artikkel ved generaliseringer: 'Dogs are loyal'."},
     "examples":[
        {"en":"Dogs are loyal. (dogs in general — no article)","note":"generalisation → zero article"},
        {"en":"The dog next door barks. (specific)","note":"specific → the"}],
     "commonMistake":{
        "en":"❌ 'The life is hard' → ✓ 'Life is hard' (abstract general noun).",
        "es":"❌ 'The life is hard' → ✓ 'Life is hard'.",
        "no":"❌ 'The life is hard' → ✓ 'Life is hard'."}},
    {"id":"g3","level":"C2","title":"Inversion for emphasis",
     "pattern":"Negative adverbial + auxiliary + subject",
     "explanation":{
        "en":"After fronted negative/limiting adverbials (Never, Rarely, Not only, Hardly, No sooner, Little), the subject and auxiliary invert — a hallmark of formal/literary C2 English.",
        "es":"Tras adverbios negativos al inicio (Never, Rarely, Not only, Hardly), el sujeto y el auxiliar se invierten — sello del inglés formal/literario C2.",
        "no":"Etter negative adverbialer først i setningen inverteres subjekt og hjelpeverb."},
     "examples":[
        {"en":"Never have I seen such a mess.","note":"= I have never seen..."},
        {"en":"Not only did she win, but she also broke the record.","note":"formal emphasis"}],
     "commonMistake":{
        "en":"Remember the auxiliary: ❌ 'Never I have seen' → ✓ 'Never have I seen'.",
        "es":"Recuerda el auxiliar: ❌ 'Never I have seen' → ✓ 'Never have I seen'.",
        "no":"Husk hjelpeverbet: ✓ 'Never have I seen'."}},
    {"id":"g4","level":"C1","title":"Reported speech & backshift",
     "pattern":"say/tell + that + backshifted tense",
     "explanation":{
        "en":"When reporting, tenses usually shift back one step (present→past, will→would, can→could). 'Tell' takes an object (tell me), 'say' doesn't (say to me).",
        "es":"Al referir, los tiempos retroceden un paso (present→past, will→would). 'Tell' lleva objeto (tell me); 'say' no (say to me).",
        "no":"Ved indirekte tale flyttes tid ett steg tilbake."},
     "examples":[
        {"en":"\"I am tired.\" → He said (that) he was tired.","note":"present → past"},
        {"en":"\"I will call.\" → She said she would call.","note":"will → would"}],
     "commonMistake":{
        "en":"❌ 'He said me' → ✓ 'He told me' / 'He said to me'.",
        "es":"❌ 'He said me' → ✓ 'He told me'.",
        "no":"❌ 'He said me' → ✓ 'He told me'."}},
    {"id":"g5","level":"C1","title":"Third & mixed conditionals",
     "pattern":"If + past perfect, would have + participle (+ mixed variants)",
     "explanation":{
        "en":"Third conditional = unreal past ('If I had known, I would have come'). Mixed conditional links an unreal past to a present result ('If I had studied medicine, I would be a doctor now').",
        "es":"El tercer condicional expresa pasado irreal. El condicional mixto une pasado irreal con resultado presente ('If I had studied medicine, I would be a doctor now').",
        "no":"Tredje kondisjonal = uvirkelig fortid; blandet kondisjonal knytter fortid til nåtidsresultat."},
     "examples":[
        {"en":"If I had left earlier, I wouldn't have missed the train.","note":"pure third conditional"},
        {"en":"If I had saved money, I would be rich now.","note":"mixed: past cause → present result"}],
     "commonMistake":{
        "en":"❌ 'If I would have known' → ✓ 'If I had known' (no 'would' in the if-clause).",
        "es":"❌ 'If I would have known' → ✓ 'If I had known'.",
        "no":"❌ 'If I would have known' → ✓ 'If I had known'."}},
    {"id":"g6","level":"C1","title":"Gerund vs infinitive",
     "pattern":"verb + -ing  vs  verb + to-infinitive",
     "explanation":{
        "en":"Some verbs change meaning: 'stop to smoke' (pause in order to smoke) vs 'stop smoking' (quit). 'Remember to do' (not forget) vs 'remember doing' (recall). Spanish uses the infinitive for both, so this is a frequent trap.",
        "es":"Algunos verbos cambian de significado: 'stop to smoke' (pararse para fumar) vs 'stop smoking' (dejar de fumar). El español usa el infinitivo para ambos, de ahí el error.",
        "no":"Noen verb endrer betydning med gerundium vs infinitiv."},
     "examples":[
        {"en":"I stopped smoking. (quit)","note":"gerund = the activity"},
        {"en":"I stopped to smoke. (paused in order to)","note":"infinitive = purpose"}],
     "commonMistake":{
        "en":"❌ 'I enjoy to read' → ✓ 'I enjoy reading' (enjoy + gerund).",
        "es":"❌ 'I enjoy to read' → ✓ 'I enjoy reading'.",
        "no":"❌ 'I enjoy to read' → ✓ 'I enjoy reading'."}},
    {"id":"g7","level":"C2","title":"Cleft sentences (It / What)",
     "pattern":"It was X that… · What I need is…",
     "explanation":{
        "en":"Cleft sentences split a clause to focus attention — a C2 device for emphasis and cohesion. 'It was John who called' focuses on John; 'What surprised me was the price' focuses on the price.",
        "es":"Las oraciones hendidas dividen la frase para enfocar la atención — recurso C2. 'It was John who called' enfoca a John.",
        "no":"Kløyvde setninger fremhever et element for fokus."},
     "examples":[
        {"en":"It was the noise that woke me.","note":"focus on 'the noise'"},
        {"en":"What I really want is a break.","note":"focus on 'a break'"}],
     "commonMistake":{
        "en":"Use for emphasis, not by default — overuse sounds unnatural.",
        "es":"Úsalas para enfatizar, no por defecto — abusar suena poco natural.",
        "no":"Bruk for vektlegging, ikke som standard."}},
    {"id":"g8","level":"C1","title":"Modal verbs of deduction",
     "pattern":"must / can't / might + have + participle",
     "explanation":{
        "en":"Express certainty about the past: 'must have' (certain positive), 'can't have' (certain negative), 'might/could have' (possible). Spanish 'debe de haber' maps to 'must have'.",
        "es":"Expresan certeza sobre el pasado: 'must have' (seguro que sí), 'can't have' (seguro que no), 'might have' (posible).",
        "no":"Uttrykker sikkerhet om fortiden: must have / can't have / might have."},
     "examples":[
        {"en":"She must have left already. (certain)","note":"logical certainty"},
        {"en":"He can't have known. (certain negative)","note":"impossibility"}],
     "commonMistake":{
        "en":"❌ 'must to have' → ✓ 'must have' (no 'to' after modals).",
        "es":"❌ 'must to have' → ✓ 'must have'.",
        "no":"❌ 'must to have' → ✓ 'must have'."}},
    {"id":"g9","level":"C1","title":"Prepositions after adjectives/verbs",
     "pattern":"depend ON · consist OF · good AT · interested IN",
     "explanation":{
        "en":"English preposition choices rarely match Spanish. 'Depend on' (not 'of'), 'consist of', 'good at' (not 'in'), 'married to' (not 'with'), 'dream of/about'.",
        "es":"Las preposiciones inglesas rara vez coinciden con el español: 'depend on' (no 'of'), 'good at' (no 'in'), 'married to' (no 'with').",
        "no":"Engelske preposisjoner samsvarer sjelden med spansk."},
     "examples":[
        {"en":"It depends on the weather. (not 'of')","note":"depend ON"},
        {"en":"She's married to a doctor. (not 'with')","note":"married TO"}],
     "commonMistake":{
        "en":"❌ 'depends of' → ✓ 'depends on'; ❌ 'good in maths' → ✓ 'good at maths'.",
        "es":"❌ 'depends of' → ✓ 'depends on'.",
        "no":"❌ 'depends of' → ✓ 'depends on'."}},
    {"id":"g10","level":"C2","title":"Subjunctive & unreal 'were'",
     "pattern":"I wish / if only / were + …",
     "explanation":{
        "en":"After 'wish', 'if only', and in formal conditionals, use 'were' for all persons ('If I were you'). After 'wish + past perfect' expresses regret about the past.",
        "es":"Tras 'wish', 'if only' y en condicionales formales, usa 'were' para todas las personas ('If I were you'). 'wish + past perfect' expresa arrepentimiento.",
        "no":"Etter 'wish' og 'if only' brukes 'were' for alle personer."},
     "examples":[
        {"en":"If I were you, I'd accept. (not 'was')","note":"formal subjunctive"},
        {"en":"I wish I had studied harder. (regret)","note":"wish + past perfect"}],
     "commonMistake":{
        "en":"❌ 'I wish I would have' → ✓ 'I wish I had' (past perfect for past regret).",
        "es":"❌ 'I wish I would have' → ✓ 'I wish I had'.",
        "no":"❌ 'I wish I would have' → ✓ 'I wish I had'."}},
]

_GRAMMAR_MAP = {g["id"]: g for g in _GRAMMAR}


def get_grammar_path(level: str = "all") -> List[Dict[str, Any]]:
    if level == "all":
        return _GRAMMAR
    return [g for g in _GRAMMAR if g["level"] == level]


def get_grammar_point(point_id: str) -> Optional[Dict[str, Any]]:
    return _GRAMMAR_MAP.get(point_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 6 — Pronunciation minimal pairs
# ═══════════════════════════════════════════════════════════════════════════════

_MINIMAL_PAIRS: List[Dict[str, Any]] = [
    {"group":"/ɪ/ vs /iː/","a":"ship","b":"sheep","ipa_a":"ʃɪp","ipa_b":"ʃiːp",
     "tip":{"en":"Short /ɪ/ (relaxed) vs long /iː/ (smiling). Spanish has only one 'i'.","es":"/ɪ/ corta (relajada) vs /iː/ larga (sonriente). El español solo tiene una 'i'.","no":"Kort /ɪ/ vs lang /iː/."}},
    {"group":"/æ/ vs /e/","a":"bad","b":"bed","ipa_a":"bæd","ipa_b":"bed",
     "tip":{"en":"/æ/ is an open, flat 'a'; /e/ is closer to Spanish 'e'.","es":"/æ/ es una 'a' abierta y plana; /e/ se parece a la 'e' española.","no":"/æ/ er åpen; /e/ likner norsk e."}},
    {"group":"θ vs t/s","a":"think","b":"sink / tink","ipa_a":"θɪŋk","ipa_b":"sɪŋk",
     "tip":{"en":"Voiceless 'th' /θ/: tongue between teeth. Spanish speakers often say /t/ or /s/.","es":"'th' sorda /θ/: lengua entre los dientes. Los hispanohablantes suelen decir /t/ o /s/.","no":"Ustemt 'th' /θ/: tunge mellom tennene."}},
    {"group":"ð vs d","a":"this","b":"dis","ipa_a":"ðɪs","ipa_b":"dɪs",
     "tip":{"en":"Voiced 'th' /ð/: tongue between teeth, vocal cords on. Not a hard /d/.","es":"'th' sonora /ð/: lengua entre los dientes con voz. No es una /d/ dura.","no":"Stemt 'th' /ð/."}},
    {"group":"/ʌ/ vs /ɑː/","a":"cup","b":"carp","ipa_a":"kʌp","ipa_b":"kɑːp",
     "tip":{"en":"/ʌ/ is a short central vowel (Spanish has nothing quite like it).","es":"/ʌ/ es una vocal central corta (el español no tiene un equivalente exacto).","no":"/ʌ/ er en kort sentral vokal."}},
    {"group":"/b/ vs /v/","a":"berry","b":"very","ipa_a":"ˈberi","ipa_b":"ˈveri",
     "tip":{"en":"English /v/ is labiodental (teeth on lip). Spanish merges b/v — keep them distinct.","es":"La /v/ inglesa es labiodental (dientes sobre el labio). El español fusiona b/v.","no":"Engelsk /v/ er labiodental."}},
    {"group":"/h/ (aspirated)","a":"hello","b":"(no silent h)","ipa_a":"həˈloʊ","ipa_b":"—",
     "tip":{"en":"English 'h' is pronounced (breathed). Spanish 'h' is silent — don't drop it.","es":"La 'h' inglesa se pronuncia (soplada). La 'h' española es muda — no la omitas.","no":"Engelsk 'h' uttales."}},
    {"group":"word stress","a":"PREsent (noun)","b":"preSENT (verb)","ipa_a":"ˈprezənt","ipa_b":"prɪˈzent",
     "tip":{"en":"Stress can change word class/meaning. English stress is unpredictable — learn it per word.","es":"El acento puede cambiar la categoría/significado. El acento inglés es impredecible.","no":"Trykk kan endre ordklasse."}},
    {"group":"schwa /ə/","a":"about","b":"—","ipa_a":"əˈbaʊt","ipa_b":"—",
     "tip":{"en":"Unstressed vowels reduce to /ə/ (schwa). Spanish keeps vowels full — reduce them in English.","es":"Las vocales átonas se reducen a /ə/ (schwa). El español mantiene vocales plenas.","no":"Ubetonte vokaler reduseres til /ə/."}},
    {"group":"silent letters","a":"knee /niː/","b":"—","ipa_a":"niː","ipa_b":"—",
     "tip":{"en":"Many English letters are silent: k in 'knee', b in 'debt', l in 'salmon', gh in 'though'.","es":"Muchas letras inglesas son mudas: k en 'knee', b en 'debt', l en 'salmon'.","no":"Mange stumme bokstaver på engelsk."}},
]


def get_minimal_pairs() -> List[Dict[str, Any]]:
    return _MINIMAL_PAIRS


# ═══════════════════════════════════════════════════════════════════════════════
# 7 — Vocabulary SRS (C1/C2 words)
# ═══════════════════════════════════════════════════════════════════════════════

# Tuples: (word, pos, meaning_en, meaning_es, meaning_no, example, level)
_VOCAB_TUPLES = [
    ("ubiquitous","adj","present everywhere","omnipresente","allestedsnærværende","Smartphones are now ubiquitous.","C1"),
    ("meticulous","adj","very careful and precise","meticuloso","omhyggelig","a meticulous researcher","C1"),
    ("resilient","adj","able to recover quickly","resiliente, resistente","robust","a resilient economy","C1"),
    ("cumbersome","adj","awkward, unwieldy","engorroso, aparatoso","tungvint","a cumbersome process","C1"),
    ("pragmatic","adj","practical rather than idealistic","pragmático","pragmatisk","a pragmatic approach","C1"),
    ("nuance","noun","a subtle difference","matiz","nyanse","the nuances of meaning","C1"),
    ("scrutiny","noun","careful examination","escrutinio, examen minucioso","gransking","under close scrutiny","C1"),
    ("plausible","adj","seeming reasonable/probable","plausible, verosímil","plausibel","a plausible explanation","C1"),
    ("inherent","adj","existing as a natural part","inherente","iboende","the inherent risks","C1"),
    ("compelling","adj","convincing, gripping","convincente, irresistible","overbevisende","a compelling argument","C1"),
    ("mitigate","verb","to make less severe","mitigar","dempe","to mitigate the damage","C1"),
    ("advocate","verb/noun","to support publicly / a supporter","abogar por / defensor","forkjempe","She advocates reform.","C1"),
    ("undermine","verb","to weaken gradually","socavar, minar","undergrave","to undermine trust","C1"),
    ("comprehensive","adj","complete, thorough","exhaustivo, completo","omfattende","a comprehensive review","C1"),
    ("discrepancy","noun","a lack of consistency","discrepancia","avvik","a discrepancy in the figures","C1"),
    ("tentative","adj","not certain, provisional","provisional, tentativo","foreløpig","a tentative agreement","C1"),
    ("intricate","adj","very detailed/complex","intrincado, complejo","innfløkt","an intricate design","C1"),
    ("prevalent","adj","widespread, common","predominante, extendido","utbredt","a prevalent belief","C1"),
    ("substantiate","verb","to provide evidence for","corroborar, fundamentar","underbygge","to substantiate a claim","C2"),
    ("ambivalent","adj","having mixed feelings","ambivalente","ambivalent","ambivalent about the offer","C2"),
    ("juxtapose","verb","to place side by side for contrast","yuxtaponer","sidestille","to juxtapose two ideas","C2"),
    ("ostensibly","adv","apparently but perhaps not really","aparentemente, supuestamente","tilsynelatende","ostensibly neutral","C2"),
    ("quintessential","adj","the most perfect example","por excelencia, quintaesencial","selve innbegrepet","the quintessential gentleman","C2"),
    ("innocuous","adj","harmless","inocuo, inofensivo","harmløs","an innocuous remark","C2"),
    ("prolific","adj","producing much","prolífico","produktiv","a prolific writer","C2"),
    ("candid","adj","frank, honest","franco, sincero","åpenhjertig","a candid interview","C1"),
    ("adept","adj","highly skilled","experto, hábil","dyktig","adept at negotiation","C1"),
    ("scarce","adj","in short supply","escaso","knapp","scarce resources","C1"),
    ("vindicate","verb","to prove right / clear of blame","reivindicar, exonerar","rettferdiggjøre","The results vindicated her.","C2"),
    ("pertinent","adj","relevant to the matter","pertinente","relevant","a pertinent question","C1"),
    ("elicit","verb","to draw out (a response)","provocar, suscitar","fremkalle","to elicit a reaction","C1"),
    ("mundane","adj","ordinary, dull","mundano, rutinario","hverdagslig","mundane tasks","C1"),
    ("astute","adj","shrewd, perceptive","astuto, perspicaz","skarpsindig","an astute observer","C2"),
    ("redundant","adj","superfluous / laid off","redundante; despedido","overflødig","a redundant phrase","C1"),
    ("coherent","adj","logical and consistent","coherente","sammenhengende","a coherent strategy","C1"),
    ("feasible","adj","possible to do","factible, viable","gjennomførbar","a feasible plan","C1"),
    ("arbitrary","adj","based on whim, not reason","arbitrario","vilkårlig","an arbitrary decision","C1"),
    ("succinct","adj","brief and clear","sucinto, conciso","konsis","a succinct summary","C2"),
    ("obsolete","adj","out of date","obsoleto","foreldet","obsolete technology","C1"),
    ("empirical","adj","based on observation/experiment","empírico","empirisk","empirical evidence","C1"),
]

_VOCAB: List[Dict[str, Any]] = []
for i, t in enumerate(_VOCAB_TUPLES):
    word, pos, en, es, no, example, level = t
    _VOCAB.append({
        "id": f"cvocab_{i+1:03d}",
        "word": word,
        "pos": pos,
        "meaning": {"en": en, "es": es, "no": no},
        "example": example,
        "level": level,
    })

_VOCAB_MAP = {v["id"]: v for v in _VOCAB}


def get_vocab_all() -> List[Dict[str, Any]]:
    return _VOCAB


# ═══════════════════════════════════════════════════════════════════════════════
# 8 — SRS (SM-2 inspired) — shared pattern with the CJK agents
# ═══════════════════════════════════════════════════════════════════════════════

_SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 90, 180]


def _next_review_at(stage: int) -> str:
    stage = max(0, min(stage, len(_SRS_INTERVALS) - 1))
    delta = timedelta(days=_SRS_INTERVALS[stage])
    return (datetime.now(timezone.utc) + delta).isoformat()


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
                due_items.append({**v, "stage": s.get("stage", 0),
                                  "next_review_at": s.get("next_review_at"), "is_new": False})
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
    record = {
        "user_id": user_id, "vocab_id": vocab_id, "stage": new_stage,
        "last_grade": grade, "next_review_at": next_at,
        "last_reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
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
# 9 — Conversation (LLM-backed, register-aware)
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS: Dict[str, Dict[str, str]] = {
    "smalltalk":  {"en":"Small talk & networking","es":"Charla informal y networking","no":"Small talk",
                   "first":"So, how's your week been treating you?"},
    "business":   {"en":"Business meeting","es":"Reunión de negocios","no":"Forretningsmøte",
                   "first":"Thanks for joining. Shall we run through the agenda?"},
    "interview":  {"en":"Job interview","es":"Entrevista de trabajo","no":"Jobbintervju",
                   "first":"Tell me a little about yourself and why you applied."},
    "debate":     {"en":"Opinion & debate","es":"Opinión y debate","no":"Debatt",
                   "first":"Some say remote work kills company culture. What's your take?"},
    "complaint":  {"en":"Handling a complaint","es":"Gestionar una queja","no":"Håndtere en klage",
                   "first":"I'm afraid I'm not happy with the service I received."},
    "presentation":{"en":"Giving a presentation","es":"Dar una presentación","no":"Holde en presentasjon",
                   "first":"Great to have you all here. Today I'll be covering three points."},
}

_LANG_NAMES = {"es": "Spanish", "en": "English", "no": "Norwegian"}


def _mentor_system_prompt(scenario: str, difficulty: str, explain_lang: str) -> str:
    lang_name = _LANG_NAMES.get(explain_lang, "Spanish")
    scen_label = SCENARIOS.get(scenario, {}).get("en", scenario)
    return (
        "You are English Mastery AI, an advanced English conversation partner for a "
        "Spanish-speaking learner aiming for C1–C2. Stay in natural, register-appropriate "
        "English.\n\n"
        f"SCENARIO: {scen_label}\n"
        f"LEARNER TARGET: {difficulty} (C1 default)\n"
        f"CORRECTION-EXPLANATION LANGUAGE: {lang_name}\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"reply":"<your natural English reply>",'
        '"register":"<formal|neutral|informal>",'
        f'"correction":"<if the learner\'s last message had an error, a short fix explained in {lang_name}, else empty>",'
        '"upgrade":"<optional: a more advanced/idiomatic way to say what the learner said, in English>",'
        '"tip":"<optional short C1/C2 tip: a collocation, phrasal verb or nuance>"}\n\n'
        "Rules:\n"
        "- Reply naturally and keep the conversation going.\n"
        "- For C1: use idiomatic but clear English. For C2: use nuance, idioms, hedging.\n"
        "- In `upgrade`, show the learner a more native-like phrasing of THEIR message.\n"
        "- Be encouraging; correct sparingly (only real errors), not stylistic preferences."
    )


async def conversation_message(
    scenario: str, difficulty: str, history: List[Dict[str, str]],
    user_text: Optional[str], lang: str = "es",
) -> Dict[str, Any]:
    scen = SCENARIOS.get(scenario, SCENARIOS["smalltalk"])
    if not history and not user_text:
        return {"reply": scen["first"], "register": "neutral", "correction": "",
                "upgrade": "", "tip": "", "is_mock": False,
                "scenario": scenario, "difficulty": difficulty}
    if ask_ai_unified is None:
        return _mock_reply(scenario, difficulty, user_text or "", lang)
    sys_prompt = _mentor_system_prompt(scenario, difficulty, lang)
    messages: List[Dict[str, str]] = [{"role": "system", "content": sys_prompt}]
    for turn in history[-10:]:
        messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    if user_text:
        messages.append({"role": "user", "content": user_text})
    try:
        raw = await ask_ai_unified(
            prompt=user_text or scen["first"], task_type="dialogue",
            complexity="medium", max_tokens=500, messages=messages,
        )
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
            parsed.setdefault("register", "neutral")
            for k in ("correction", "upgrade", "tip", "reply"):
                parsed.setdefault(k, "")
            return parsed
    except Exception:
        pass
    return _mock_reply(scenario, difficulty, user_text or "", lang)


def _mock_reply(scenario: str, difficulty: str, user_text: str, lang: str) -> Dict[str, Any]:
    return {
        "reply": "That's a fair point. Could you expand on that a little?",
        "register": "neutral",
        "correction": "",
        "upgrade": "",
        "tip": "[Mock — connect an AI model for live conversation, corrections and upgrades.]",
        "is_mock": True, "scenario": scenario, "difficulty": difficulty,
    }


def scenarios_catalogue(lang: str = "es") -> List[Dict[str, str]]:
    return [{"key": k, "label": v.get(lang, v["en"]), "first": v["first"]}
            for k, v in SCENARIOS.items()]


# ═══════════════════════════════════════════════════════════════════════════════
# 10 — Writing & Style feedback (LLM-backed)
# ═══════════════════════════════════════════════════════════════════════════════

_MAX_WRITING_CHARS = 4000


def _writing_system_prompt(explain_lang: str, register: str) -> str:
    lang_name = _LANG_NAMES.get(explain_lang, "Spanish")
    return (
        "You are English Mastery AI's writing coach for a Spanish-speaking learner "
        "aiming for C1–C2. Analyse the learner's English text and return targeted, "
        "encouraging feedback — NOT a rewrite of everything.\n\n"
        f"TARGET REGISTER: {register}\n"
        f"EXPLANATION LANGUAGE: {lang_name}\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"corrected":"<the text with grammar/spelling errors fixed, keeping the learner\'s voice>",'
        '"issues":[{"original":"<verbatim snippet>","fix":"<the corrected version>",'
        f'"type":"grammar|collocation|register|word_choice|naturalness","note":"<short why, in {lang_name}>"}}],'
        '"upgrades":["<1-3 phrases rewritten in a more native / C2 way>"],'
        '"cefr_estimate":"<B2|C1|C2>",'
        '"summary":"<one-sentence encouraging summary in ' + lang_name + '>"}\n\n'
        "Rules:\n"
        "- Quote `original` verbatim from the input.\n"
        "- Focus on the highest-impact issues (max ~6). Don't nitpick style preferences.\n"
        "- `upgrades` should show more idiomatic/precise phrasing, not just synonyms.\n"
        "- Be honest but encouraging in the cefr_estimate."
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
            raw = await ask_ai_unified(
                prompt=text, task_type="analysis", complexity="high", max_tokens=1600,
                messages=[
                    {"role": "system", "content": _writing_system_prompt(lang, register)},
                    {"role": "user", "content": f"Learner's text:\n\n{text}"},
                ],
            )
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
                parsed.setdefault("cefr_estimate", "C1")
                parsed.setdefault("summary", "")
                return parsed
        except Exception:
            pass

    return {
        "corrected": text,
        "issues": [],
        "upgrades": [],
        "cefr_estimate": "C1",
        "summary": "[Mock — connect an AI model for detailed writing feedback.]",
        "is_mock": True,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 11 — Dashboard / Overview
# ═══════════════════════════════════════════════════════════════════════════════

async def get_overview(user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    vocab_known = await _vocab_known_count(user_id)
    due_items = await srs_due(user_id, limit=100)
    srs_due_n = sum(1 for d in due_items if not d.get("is_new"))
    new_today = sum(1 for d in due_items if d.get("is_new"))
    if vocab_known >= 30:
        level = "C2 (Proficiency)"
    elif vocab_known >= 12:
        level = "C1 (Advanced)"
    else:
        level = "B2+ (Upper-Int.)"
    mission = [
        {"type": "falseFriends", "count": 5, "label": "false friends"},
        {"type": "collocations", "count": 5, "label": "collocations"},
        {"type": "phrasalVerbs", "count": 5, "label": "phrasal verbs"},
        {"type": "srs",          "count": min(20, srs_due_n + new_today), "label": "vocabulary reviews"},
        {"type": "conversation", "count": 1, "label": "conversation"},
    ]
    return {
        "user_id": user_id, "level": level, "cefr_target": "C2",
        "streak_days": 0,
        "stats": {
            "false_friends_total": len(_FALSE_FRIENDS),
            "collocations_total":  len(_COLLOCATIONS),
            "phrasal_verbs_total": len(_PHRASAL_VERBS),
            "idioms_total":        len(_IDIOMS),
            "grammar_total":       len(_GRAMMAR),
            "pronunciation_total": len(_MINIMAL_PAIRS),
            "vocab_known":         vocab_known,
            "vocab_total":         len(_VOCAB),
            "srs_due_today":       srs_due_n,
            "srs_new_today":       new_today,
        },
        "todays_mission": mission,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def health() -> Dict[str, Any]:
    return {"status": "ok", "agent": "english_mentor",
            "version": ENGLISH_MENTOR_VERSION, "llm_available": ask_ai_unified is not None}
