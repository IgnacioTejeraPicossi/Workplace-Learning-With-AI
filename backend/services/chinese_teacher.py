"""
Maestro Chino IA — Service
===========================
Functional V1+ for the Mandarin Chinese learning agent.

Eight modules:
  1. Pinyin & Tones      — 21 initials, 35 finals, 5 tones, syllables
  2. Hanzi Dojo          — 50 HSK1 simplified hanzi with pinyin/meaning/words
  3. Radicals            — 20 common radicals + example characters
  4. Vocabulary SRS      — 150 HSK1 words with SM-2 spaced repetition
  5. Grammar Path        — 10 HSK1 grammar points
  6. Conversation Sensei — LLM-backed scenarios with hanzi/pinyin/translation
  7. Kanji-Hanzi Bridge  — cross-reference vs. Japanese Sensei kanji map +
                            20 curated entries (the differentiator!)
  8. Dashboard           — aggregated stats + today's mission

Single-user model (user_id='default') matching the Japanese Sensei pattern.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_ai_unified
except Exception:
    ask_ai_unified = None  # type: ignore

# Cross-import the Japanese kanji map for the dynamic Bridge lookup
try:
    from backend.services.japanese_sensei import _KANJI_MAP as _JA_KANJI_MAP
except Exception:
    try:
        from services.japanese_sensei import _KANJI_MAP as _JA_KANJI_MAP  # type: ignore
    except Exception:
        _JA_KANJI_MAP = {}

try:
    from backend.db import database
    _PINYIN_COL  = database.get_collection("chinese_pinyin_progress")
    _HANZI_COL   = database.get_collection("chinese_hanzi_progress")
    _SRS_COL     = database.get_collection("chinese_srs_reviews")
    _CONV_COL    = database.get_collection("chinese_conversation_runs")
except Exception:
    _PINYIN_COL = _HANZI_COL = _SRS_COL = _CONV_COL = None

DEFAULT_USER = "default"


# ═══════════════════════════════════════════════════════════════════════════════
# 1 — Pinyin (initials, finals, tones, common syllables)
# ═══════════════════════════════════════════════════════════════════════════════

_INITIALS: List[Dict[str, str]] = [
    {"char": x, "category": "initial"} for x in [
        "b","p","m","f","d","t","n","l","g","k","h","j","q","x",
        "zh","ch","sh","r","z","c","s",
    ]
]

_FINALS: List[Dict[str, str]] = [
    {"char": x, "category": "final"} for x in [
        "a","o","e","i","u","ü",
        "ai","ei","ao","ou",
        "an","en","ang","eng","ong",
        "ia","ie","iao","iou","ian","in","iang","ing","iong",
        "ua","uo","uai","uei","uan","uen","uang","ueng",
        "üe","üan","ün",
    ]
]

_TONES: List[Dict[str, Any]] = [
    {"num": 1, "name": "1st (flat)",       "mark": "ā", "example": "mā", "meaning": "mother"},
    {"num": 2, "name": "2nd (rising)",     "mark": "á", "example": "má", "meaning": "hemp / numb"},
    {"num": 3, "name": "3rd (falling-rising)", "mark": "ǎ", "example": "mǎ", "meaning": "horse"},
    {"num": 4, "name": "4th (falling)",    "mark": "à", "example": "mà", "meaning": "to scold"},
    {"num": 5, "name": "Neutral (no tone)", "mark": "a", "example": "ma", "meaning": "question particle"},
]

# 50 common pinyin syllables to seed the trainer
_SYLLABLES: List[Dict[str, str]] = [
    {"syllable": s, "tone": "1"} for s in
    ["nǐ", "hǎo", "wǒ", "shì", "bù", "yǒu", "tā", "men", "de", "le",
     "zài", "hěn", "kàn", "tīng", "shuō", "xiě", "chī", "hē", "lái", "qù",
     "shén", "me", "míng", "zì", "jiào", "shuí", "nǎ", "lǐ", "zhōng", "guó",
     "rén", "dà", "xiǎo", "duō", "shǎo", "hǎo", "ma", "jiā", "xué", "shēng",
     "lǎo", "shī", "péng", "yǒu", "yī", "èr", "sān", "sì", "wǔ", "liù"]
]


def get_pinyin_deck() -> Dict[str, Any]:
    return {
        "initials":  _INITIALS,
        "finals":    _FINALS,
        "tones":     _TONES,
        "syllables": _SYLLABLES,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2 — Hanzi (50 HSK1, simplified)
# ═══════════════════════════════════════════════════════════════════════════════
# Each entry: char (simplified) + traditional (when different) + pinyin + tone +
# meaning (en/es/no) + radicals + 2 example words + 1 sentence.

_HANZI: List[Dict[str, Any]] = [
    {"char":"我","trad":"我","pinyin":"wǒ","tone":3,"strokes":7,"hsk":"1",
     "meaning":{"en":"I, me","es":"yo","no":"jeg"},
     "radicals":["戈","手"],
     "words":[{"w":"我们","p":"wǒmen","m":"we"},
              {"w":"我的","p":"wǒde","m":"my, mine"}],
     "sentence":{"hz":"我是学生。","py":"Wǒ shì xuésheng.",
                 "en":"I am a student.","es":"Soy estudiante.","no":"Jeg er student."}},
    {"char":"你","trad":"你","pinyin":"nǐ","tone":3,"strokes":7,"hsk":"1",
     "meaning":{"en":"you","es":"tú","no":"du"},
     "radicals":["亻"],
     "words":[{"w":"你好","p":"nǐ hǎo","m":"hello"},
              {"w":"你们","p":"nǐmen","m":"you (plural)"}],
     "sentence":{"hz":"你好吗？","py":"Nǐ hǎo ma?",
                 "en":"How are you?","es":"¿Cómo estás?","no":"Hvordan har du det?"}},
    {"char":"他","trad":"他","pinyin":"tā","tone":1,"strokes":5,"hsk":"1",
     "meaning":{"en":"he, him","es":"él","no":"han"},
     "radicals":["亻"],
     "words":[{"w":"他们","p":"tāmen","m":"they (male/mixed)"}],
     "sentence":{"hz":"他是我朋友。","py":"Tā shì wǒ péngyou.",
                 "en":"He is my friend.","es":"Es mi amigo.","no":"Han er vennen min."}},
    {"char":"她","trad":"她","pinyin":"tā","tone":1,"strokes":6,"hsk":"1",
     "meaning":{"en":"she, her","es":"ella","no":"hun"},
     "radicals":["女"],
     "words":[{"w":"她们","p":"tāmen","m":"they (female)"}],
     "sentence":{"hz":"她是老师。","py":"Tā shì lǎoshī.",
                 "en":"She is a teacher.","es":"Es profesora.","no":"Hun er lærer."}},
    {"char":"是","trad":"是","pinyin":"shì","tone":4,"strokes":9,"hsk":"1",
     "meaning":{"en":"to be","es":"ser/estar","no":"å være"},
     "radicals":["日"],
     "words":[{"w":"不是","p":"bú shì","m":"is not"}],
     "sentence":{"hz":"我是西班牙人。","py":"Wǒ shì Xībānyárén.",
                 "en":"I am Spanish.","es":"Soy español.","no":"Jeg er spansk."}},
    {"char":"不","trad":"不","pinyin":"bù","tone":4,"strokes":4,"hsk":"1",
     "meaning":{"en":"not, no","es":"no","no":"ikke"},
     "radicals":["一"],
     "words":[{"w":"不要","p":"bú yào","m":"don't want"},
              {"w":"不好","p":"bù hǎo","m":"not good"}],
     "sentence":{"hz":"我不是学生。","py":"Wǒ bú shì xuésheng.",
                 "en":"I am not a student.","es":"No soy estudiante.","no":"Jeg er ikke student."}},
    {"char":"的","trad":"的","pinyin":"de","tone":5,"strokes":8,"hsk":"1",
     "meaning":{"en":"possessive particle","es":"partícula de posesión","no":"eierskap-partikkel"},
     "radicals":["白"],
     "words":[{"w":"我的","p":"wǒde","m":"my"},
              {"w":"好的","p":"hǎode","m":"OK"}],
     "sentence":{"hz":"这是我的书。","py":"Zhè shì wǒde shū.",
                 "en":"This is my book.","es":"Este es mi libro.","no":"Dette er min bok."}},
    {"char":"了","trad":"了","pinyin":"le","tone":5,"strokes":2,"hsk":"1",
     "meaning":{"en":"completed action particle","es":"partícula de acción completada","no":"fullført-partikkel"},
     "radicals":["乙"],
     "words":[{"w":"好了","p":"hǎo le","m":"OK, ready"}],
     "sentence":{"hz":"我吃了。","py":"Wǒ chī le.",
                 "en":"I have eaten.","es":"He comido.","no":"Jeg har spist."}},
    {"char":"有","trad":"有","pinyin":"yǒu","tone":3,"strokes":6,"hsk":"1",
     "meaning":{"en":"to have","es":"tener","no":"å ha"},
     "radicals":["月"],
     "words":[{"w":"没有","p":"méi yǒu","m":"don't have"}],
     "sentence":{"hz":"我有一个哥哥。","py":"Wǒ yǒu yí ge gēge.",
                 "en":"I have an older brother.","es":"Tengo un hermano mayor.","no":"Jeg har en eldre bror."}},
    {"char":"在","trad":"在","pinyin":"zài","tone":4,"strokes":6,"hsk":"1",
     "meaning":{"en":"at, in; to be at","es":"en, estar en","no":"i, på; å være"},
     "radicals":["土"],
     "words":[{"w":"现在","p":"xiànzài","m":"now"}],
     "sentence":{"hz":"我在家。","py":"Wǒ zài jiā.",
                 "en":"I am at home.","es":"Estoy en casa.","no":"Jeg er hjemme."}},
    {"char":"个","trad":"個","pinyin":"gè","tone":4,"strokes":3,"hsk":"1",
     "meaning":{"en":"general classifier","es":"clasificador general","no":"generell teller"},
     "radicals":["人"],
     "words":[{"w":"一个","p":"yí ge","m":"one (item)"}],
     "sentence":{"hz":"这个好。","py":"Zhège hǎo.",
                 "en":"This one is good.","es":"Este es bueno.","no":"Denne er bra."}},
    {"char":"这","trad":"這","pinyin":"zhè","tone":4,"strokes":7,"hsk":"1",
     "meaning":{"en":"this","es":"este","no":"denne"},
     "radicals":["辶"],
     "words":[{"w":"这个","p":"zhège","m":"this one"}],
     "sentence":{"hz":"这是什么？","py":"Zhè shì shénme?",
                 "en":"What is this?","es":"¿Qué es esto?","no":"Hva er dette?"}},
    {"char":"那","trad":"那","pinyin":"nà","tone":4,"strokes":6,"hsk":"1",
     "meaning":{"en":"that","es":"ese, aquel","no":"den"},
     "radicals":["阝"],
     "words":[{"w":"那个","p":"nàge","m":"that one"}],
     "sentence":{"hz":"那是我的。","py":"Nà shì wǒde.",
                 "en":"That is mine.","es":"Eso es mío.","no":"Det er mitt."}},
    {"char":"什","trad":"什","pinyin":"shén","tone":2,"strokes":4,"hsk":"1",
     "meaning":{"en":"what (in 什么)","es":"qué (en 什么)","no":"hva (i 什么)"},
     "radicals":["亻"],
     "words":[{"w":"什么","p":"shénme","m":"what"}],
     "sentence":{"hz":"你叫什么？","py":"Nǐ jiào shénme?",
                 "en":"What is your name?","es":"¿Cómo te llamas?","no":"Hva heter du?"}},
    {"char":"么","trad":"麼","pinyin":"me","tone":5,"strokes":3,"hsk":"1",
     "meaning":{"en":"interrogative suffix","es":"sufijo interrogativo","no":"spørresuffiks"},
     "radicals":["丿"],
     "words":[{"w":"什么","p":"shénme","m":"what"},
              {"w":"怎么","p":"zěnme","m":"how"}],
     "sentence":{"hz":"为什么？","py":"Wèishénme?",
                 "en":"Why?","es":"¿Por qué?","no":"Hvorfor?"}},
    {"char":"人","trad":"人","pinyin":"rén","tone":2,"strokes":2,"hsk":"1",
     "meaning":{"en":"person, people","es":"persona","no":"person"},
     "radicals":["人"],
     "words":[{"w":"中国人","p":"Zhōngguórén","m":"Chinese person"},
              {"w":"三个人","p":"sān ge rén","m":"three people"}],
     "sentence":{"hz":"我是西班牙人。","py":"Wǒ shì Xībānyárén.",
                 "en":"I am Spanish.","es":"Soy español.","no":"Jeg er spansk."}},
    {"char":"大","trad":"大","pinyin":"dà","tone":4,"strokes":3,"hsk":"1",
     "meaning":{"en":"big, large","es":"grande","no":"stor"},
     "radicals":["大"],
     "words":[{"w":"大学","p":"dàxué","m":"university"}],
     "sentence":{"hz":"我家很大。","py":"Wǒ jiā hěn dà.",
                 "en":"My home is big.","es":"Mi casa es grande.","no":"Hjemmet mitt er stort."}},
    {"char":"小","trad":"小","pinyin":"xiǎo","tone":3,"strokes":3,"hsk":"1",
     "meaning":{"en":"small","es":"pequeño","no":"liten"},
     "radicals":["小"],
     "words":[{"w":"小学","p":"xiǎoxué","m":"primary school"}],
     "sentence":{"hz":"小猫很可爱。","py":"Xiǎo māo hěn kě'ài.",
                 "en":"Small cats are cute.","es":"Los gatitos son adorables.","no":"Små katter er søte."}},
    {"char":"中","trad":"中","pinyin":"zhōng","tone":1,"strokes":4,"hsk":"1",
     "meaning":{"en":"middle, centre","es":"medio, centro","no":"midten"},
     "radicals":["丨","口"],
     "words":[{"w":"中国","p":"Zhōngguó","m":"China"},
              {"w":"中文","p":"Zhōngwén","m":"Chinese language"}],
     "sentence":{"hz":"我学中文。","py":"Wǒ xué Zhōngwén.",
                 "en":"I study Chinese.","es":"Estudio chino.","no":"Jeg studerer kinesisk."}},
    {"char":"国","trad":"國","pinyin":"guó","tone":2,"strokes":8,"hsk":"1",
     "meaning":{"en":"country","es":"país","no":"land"},
     "radicals":["囗"],
     "words":[{"w":"中国","p":"Zhōngguó","m":"China"},
              {"w":"外国","p":"wàiguó","m":"foreign country"}],
     "sentence":{"hz":"中国很大。","py":"Zhōngguó hěn dà.",
                 "en":"China is big.","es":"China es grande.","no":"Kina er stort."}},
    {"char":"日","trad":"日","pinyin":"rì","tone":4,"strokes":4,"hsk":"1",
     "meaning":{"en":"sun, day","es":"sol, día","no":"sol, dag"},
     "radicals":["日"],
     "words":[{"w":"日本","p":"Rìběn","m":"Japan"},
              {"w":"星期日","p":"xīngqīrì","m":"Sunday"}],
     "sentence":{"hz":"今天是好日子。","py":"Jīntiān shì hǎo rìzi.",
                 "en":"Today is a good day.","es":"Hoy es un buen día.","no":"I dag er en god dag."}},
    {"char":"月","trad":"月","pinyin":"yuè","tone":4,"strokes":4,"hsk":"1",
     "meaning":{"en":"moon, month","es":"luna, mes","no":"måne, måned"},
     "radicals":["月"],
     "words":[{"w":"月亮","p":"yuèliang","m":"the moon"}],
     "sentence":{"hz":"这个月很忙。","py":"Zhège yuè hěn máng.",
                 "en":"This month is busy.","es":"Este mes estoy ocupado.","no":"Denne måneden er travel."}},
    {"char":"年","trad":"年","pinyin":"nián","tone":2,"strokes":6,"hsk":"1",
     "meaning":{"en":"year","es":"año","no":"år"},
     "radicals":["干"],
     "words":[{"w":"今年","p":"jīnnián","m":"this year"},
              {"w":"去年","p":"qùnián","m":"last year"}],
     "sentence":{"hz":"今年是2026年。","py":"Jīnnián shì 2026 nián.",
                 "en":"This year is 2026.","es":"Este año es 2026.","no":"I år er 2026."}},
    {"char":"学","trad":"學","pinyin":"xué","tone":2,"strokes":8,"hsk":"1",
     "meaning":{"en":"to learn, study","es":"aprender, estudiar","no":"å lære"},
     "radicals":["子"],
     "words":[{"w":"学生","p":"xuésheng","m":"student"},
              {"w":"大学","p":"dàxué","m":"university"}],
     "sentence":{"hz":"我学中文。","py":"Wǒ xué Zhōngwén.",
                 "en":"I learn Chinese.","es":"Aprendo chino.","no":"Jeg lærer kinesisk."}},
    {"char":"生","trad":"生","pinyin":"shēng","tone":1,"strokes":5,"hsk":"1",
     "meaning":{"en":"life, raw; student","es":"vida; estudiante","no":"liv; student"},
     "radicals":["生"],
     "words":[{"w":"学生","p":"xuésheng","m":"student"},
              {"w":"生日","p":"shēngrì","m":"birthday"}],
     "sentence":{"hz":"今天是我的生日。","py":"Jīntiān shì wǒde shēngrì.",
                 "en":"Today is my birthday.","es":"Hoy es mi cumpleaños.","no":"I dag er bursdagen min."}},
    {"char":"老","trad":"老","pinyin":"lǎo","tone":3,"strokes":6,"hsk":"1",
     "meaning":{"en":"old; honorific prefix","es":"viejo; prefijo respetuoso","no":"gammel; ærestittel"},
     "radicals":["耂"],
     "words":[{"w":"老师","p":"lǎoshī","m":"teacher"},
              {"w":"老人","p":"lǎorén","m":"elderly person"}],
     "sentence":{"hz":"老师很好。","py":"Lǎoshī hěn hǎo.",
                 "en":"The teacher is great.","es":"El profesor es genial.","no":"Læreren er flott."}},
    {"char":"师","trad":"師","pinyin":"shī","tone":1,"strokes":6,"hsk":"1",
     "meaning":{"en":"teacher, master","es":"maestro","no":"lærer, mester"},
     "radicals":["巾"],
     "words":[{"w":"老师","p":"lǎoshī","m":"teacher"}],
     "sentence":{"hz":"他是我的老师。","py":"Tā shì wǒde lǎoshī.",
                 "en":"He is my teacher.","es":"Es mi maestro.","no":"Han er læreren min."}},
    {"char":"水","trad":"水","pinyin":"shuǐ","tone":3,"strokes":4,"hsk":"1",
     "meaning":{"en":"water","es":"agua","no":"vann"},
     "radicals":["水"],
     "words":[{"w":"喝水","p":"hē shuǐ","m":"to drink water"}],
     "sentence":{"hz":"我喝水。","py":"Wǒ hē shuǐ.",
                 "en":"I drink water.","es":"Bebo agua.","no":"Jeg drikker vann."}},
    {"char":"火","trad":"火","pinyin":"huǒ","tone":3,"strokes":4,"hsk":"1",
     "meaning":{"en":"fire","es":"fuego","no":"ild"},
     "radicals":["火"],
     "words":[{"w":"火车","p":"huǒchē","m":"train"}],
     "sentence":{"hz":"火很热。","py":"Huǒ hěn rè.",
                 "en":"Fire is hot.","es":"El fuego es caliente.","no":"Ild er varmt."}},
    {"char":"木","trad":"木","pinyin":"mù","tone":4,"strokes":4,"hsk":"1",
     "meaning":{"en":"tree, wood","es":"árbol, madera","no":"tre, ved"},
     "radicals":["木"],
     "words":[{"w":"木头","p":"mùtou","m":"wood, log"}],
     "sentence":{"hz":"这是木头。","py":"Zhè shì mùtou.",
                 "en":"This is wood.","es":"Esto es madera.","no":"Dette er tre."}},
    {"char":"山","trad":"山","pinyin":"shān","tone":1,"strokes":3,"hsk":"1",
     "meaning":{"en":"mountain","es":"montaña","no":"fjell"},
     "radicals":["山"],
     "words":[{"w":"山水","p":"shānshuǐ","m":"landscape"}],
     "sentence":{"hz":"我喜欢山。","py":"Wǒ xǐhuān shān.",
                 "en":"I like mountains.","es":"Me gustan las montañas.","no":"Jeg liker fjell."}},
    {"char":"口","trad":"口","pinyin":"kǒu","tone":3,"strokes":3,"hsk":"1",
     "meaning":{"en":"mouth, opening","es":"boca","no":"munn"},
     "radicals":["口"],
     "words":[{"w":"门口","p":"ménkǒu","m":"doorway"}],
     "sentence":{"hz":"门口有人。","py":"Ménkǒu yǒu rén.",
                 "en":"There is someone at the door.","es":"Hay alguien en la puerta.","no":"Det er noen ved døren."}},
    {"char":"手","trad":"手","pinyin":"shǒu","tone":3,"strokes":4,"hsk":"1",
     "meaning":{"en":"hand","es":"mano","no":"hånd"},
     "radicals":["手"],
     "words":[{"w":"手机","p":"shǒujī","m":"mobile phone"}],
     "sentence":{"hz":"我的手机。","py":"Wǒde shǒujī.",
                 "en":"My phone.","es":"Mi móvil.","no":"Mobilen min."}},
    {"char":"家","trad":"家","pinyin":"jiā","tone":1,"strokes":10,"hsk":"1",
     "meaning":{"en":"home, family","es":"casa, familia","no":"hjem, familie"},
     "radicals":["宀","豕"],
     "words":[{"w":"家人","p":"jiārén","m":"family member"}],
     "sentence":{"hz":"我家很温暖。","py":"Wǒ jiā hěn wēnnuǎn.",
                 "en":"My home is warm.","es":"Mi casa es cálida.","no":"Hjemmet mitt er varmt."}},
    {"char":"朋","trad":"朋","pinyin":"péng","tone":2,"strokes":8,"hsk":"1",
     "meaning":{"en":"friend (in 朋友)","es":"amigo (en 朋友)","no":"venn (i 朋友)"},
     "radicals":["月"],
     "words":[{"w":"朋友","p":"péngyou","m":"friend"}],
     "sentence":{"hz":"他是我的好朋友。","py":"Tā shì wǒde hǎo péngyou.",
                 "en":"He is my good friend.","es":"Es mi buen amigo.","no":"Han er min gode venn."}},
    {"char":"友","trad":"友","pinyin":"yǒu","tone":3,"strokes":4,"hsk":"1",
     "meaning":{"en":"friend (in 朋友)","es":"amigo (en 朋友)","no":"venn (i 朋友)"},
     "radicals":["又"],
     "words":[{"w":"朋友","p":"péngyou","m":"friend"}],
     "sentence":{"hz":"友谊很重要。","py":"Yǒuyì hěn zhòngyào.",
                 "en":"Friendship is important.","es":"La amistad es importante.","no":"Vennskap er viktig."}},
    {"char":"吃","trad":"吃","pinyin":"chī","tone":1,"strokes":6,"hsk":"1",
     "meaning":{"en":"to eat","es":"comer","no":"å spise"},
     "radicals":["口"],
     "words":[{"w":"吃饭","p":"chī fàn","m":"to have a meal"}],
     "sentence":{"hz":"我吃米饭。","py":"Wǒ chī mǐfàn.",
                 "en":"I eat rice.","es":"Como arroz.","no":"Jeg spiser ris."}},
    {"char":"喝","trad":"喝","pinyin":"hē","tone":1,"strokes":12,"hsk":"1",
     "meaning":{"en":"to drink","es":"beber","no":"å drikke"},
     "radicals":["口"],
     "words":[{"w":"喝茶","p":"hē chá","m":"to drink tea"}],
     "sentence":{"hz":"我喝茶。","py":"Wǒ hē chá.",
                 "en":"I drink tea.","es":"Bebo té.","no":"Jeg drikker te."}},
    {"char":"看","trad":"看","pinyin":"kàn","tone":4,"strokes":9,"hsk":"1",
     "meaning":{"en":"to look, watch, read","es":"mirar, ver, leer","no":"å se, lese"},
     "radicals":["目","手"],
     "words":[{"w":"看书","p":"kàn shū","m":"to read"}],
     "sentence":{"hz":"我看书。","py":"Wǒ kàn shū.",
                 "en":"I read.","es":"Leo.","no":"Jeg leser."}},
    {"char":"听","trad":"聽","pinyin":"tīng","tone":1,"strokes":7,"hsk":"1",
     "meaning":{"en":"to listen","es":"escuchar","no":"å lytte"},
     "radicals":["口"],
     "words":[{"w":"听音乐","p":"tīng yīnyuè","m":"to listen to music"}],
     "sentence":{"hz":"我听音乐。","py":"Wǒ tīng yīnyuè.",
                 "en":"I listen to music.","es":"Escucho música.","no":"Jeg lytter til musikk."}},
    {"char":"说","trad":"說","pinyin":"shuō","tone":1,"strokes":9,"hsk":"1",
     "meaning":{"en":"to speak, say","es":"decir, hablar","no":"å si, snakke"},
     "radicals":["讠","兑"],
     "words":[{"w":"说话","p":"shuō huà","m":"to talk"}],
     "sentence":{"hz":"我说中文。","py":"Wǒ shuō Zhōngwén.",
                 "en":"I speak Chinese.","es":"Hablo chino.","no":"Jeg snakker kinesisk."}},
    {"char":"好","trad":"好","pinyin":"hǎo","tone":3,"strokes":6,"hsk":"1",
     "meaning":{"en":"good, fine","es":"bueno, bien","no":"god, fin"},
     "radicals":["女","子"],
     "words":[{"w":"你好","p":"nǐ hǎo","m":"hello"},
              {"w":"好吃","p":"hǎochī","m":"delicious"}],
     "sentence":{"hz":"你好！","py":"Nǐ hǎo!",
                 "en":"Hello!","es":"¡Hola!","no":"Hei!"}},
    {"char":"很","trad":"很","pinyin":"hěn","tone":3,"strokes":9,"hsk":"1",
     "meaning":{"en":"very","es":"muy","no":"veldig"},
     "radicals":["彳"],
     "words":[{"w":"很好","p":"hěn hǎo","m":"very good"}],
     "sentence":{"hz":"今天很热。","py":"Jīntiān hěn rè.",
                 "en":"Today is very hot.","es":"Hoy hace mucho calor.","no":"I dag er det veldig varmt."}},
    {"char":"也","trad":"也","pinyin":"yě","tone":3,"strokes":3,"hsk":"1",
     "meaning":{"en":"also, too","es":"también","no":"også"},
     "radicals":["乙"],
     "words":[{"w":"我也","p":"wǒ yě","m":"me too"}],
     "sentence":{"hz":"我也是学生。","py":"Wǒ yě shì xuésheng.",
                 "en":"I am also a student.","es":"También soy estudiante.","no":"Jeg er også student."}},
    {"char":"来","trad":"來","pinyin":"lái","tone":2,"strokes":7,"hsk":"1",
     "meaning":{"en":"to come","es":"venir","no":"å komme"},
     "radicals":["木"],
     "words":[{"w":"来这里","p":"lái zhèlǐ","m":"come here"}],
     "sentence":{"hz":"请你来。","py":"Qǐng nǐ lái.",
                 "en":"Please come.","es":"Por favor ven.","no":"Vennligst kom."}},
    {"char":"去","trad":"去","pinyin":"qù","tone":4,"strokes":5,"hsk":"1",
     "meaning":{"en":"to go","es":"ir","no":"å gå"},
     "radicals":["土"],
     "words":[{"w":"去学校","p":"qù xuéxiào","m":"go to school"}],
     "sentence":{"hz":"我去学校。","py":"Wǒ qù xuéxiào.",
                 "en":"I go to school.","es":"Voy a la escuela.","no":"Jeg går til skolen."}},
    {"char":"今","trad":"今","pinyin":"jīn","tone":1,"strokes":4,"hsk":"1",
     "meaning":{"en":"now, today (in 今天)","es":"hoy (en 今天)","no":"nå, i dag (i 今天)"},
     "radicals":["人"],
     "words":[{"w":"今天","p":"jīntiān","m":"today"},
              {"w":"今年","p":"jīnnián","m":"this year"}],
     "sentence":{"hz":"今天天气好。","py":"Jīntiān tiānqì hǎo.",
                 "en":"Today the weather is good.","es":"Hoy hace buen tiempo.","no":"I dag er været bra."}},
    {"char":"天","trad":"天","pinyin":"tiān","tone":1,"strokes":4,"hsk":"1",
     "meaning":{"en":"day, sky","es":"día, cielo","no":"dag, himmel"},
     "radicals":["大"],
     "words":[{"w":"今天","p":"jīntiān","m":"today"},
              {"w":"明天","p":"míngtiān","m":"tomorrow"}],
     "sentence":{"hz":"明天见！","py":"Míngtiān jiàn!",
                 "en":"See you tomorrow!","es":"¡Hasta mañana!","no":"Vi ses i morgen!"}},
    {"char":"明","trad":"明","pinyin":"míng","tone":2,"strokes":8,"hsk":"1",
     "meaning":{"en":"bright; tomorrow (in 明天)","es":"brillante; mañana (en 明天)","no":"lys; i morgen (i 明天)"},
     "radicals":["日","月"],
     "words":[{"w":"明天","p":"míngtiān","m":"tomorrow"}],
     "sentence":{"hz":"明月很亮。","py":"Míng yuè hěn liàng.",
                 "en":"The bright moon is shining.","es":"La luna brilla mucho.","no":"Den lyse månen skinner."}},
    {"char":"车","trad":"車","pinyin":"chē","tone":1,"strokes":4,"hsk":"1",
     "meaning":{"en":"vehicle, car","es":"vehículo, coche","no":"kjøretøy, bil"},
     "radicals":["车"],
     "words":[{"w":"火车","p":"huǒchē","m":"train"},
              {"w":"汽车","p":"qìchē","m":"automobile"}],
     "sentence":{"hz":"我有车。","py":"Wǒ yǒu chē.",
                 "en":"I have a car.","es":"Tengo coche.","no":"Jeg har bil."}},
    {"char":"门","trad":"門","pinyin":"mén","tone":2,"strokes":3,"hsk":"1",
     "meaning":{"en":"door, gate","es":"puerta","no":"dør, port"},
     "radicals":["门"],
     "words":[{"w":"门口","p":"ménkǒu","m":"doorway"}],
     "sentence":{"hz":"请关门。","py":"Qǐng guān mén.",
                 "en":"Please close the door.","es":"Por favor cierra la puerta.","no":"Vennligst lukk døren."}},
]

_HANZI_MAP = {h["char"]: h for h in _HANZI}


def get_hanzi_deck() -> List[Dict[str, Any]]:
    return _HANZI


def get_hanzi_detail(char: str) -> Optional[Dict[str, Any]]:
    return _HANZI_MAP.get(char)


# ═══════════════════════════════════════════════════════════════════════════════
# 3 — Radicals (20 most common)
# ═══════════════════════════════════════════════════════════════════════════════

_RADICALS: List[Dict[str, Any]] = [
    {"radical":"氵","name":"water","pinyin":"shuǐ","examples":["河","海","江","汉"]},
    {"radical":"亻","name":"person","pinyin":"rén","examples":["你","他","们","住"]},
    {"radical":"口","name":"mouth","pinyin":"kǒu","examples":["吃","喝","叫","名"]},
    {"radical":"木","name":"tree, wood","pinyin":"mù","examples":["林","森","本","样"]},
    {"radical":"心","name":"heart","pinyin":"xīn","examples":["想","怎","念","急"]},
    {"radical":"忄","name":"heart (compressed)","pinyin":"xīn","examples":["快","怕","慢","懂"]},
    {"radical":"日","name":"sun, day","pinyin":"rì","examples":["明","时","昨","早"]},
    {"radical":"月","name":"moon, flesh","pinyin":"yuè","examples":["朋","期","脚","脸"]},
    {"radical":"女","name":"woman","pinyin":"nǚ","examples":["她","妈","好","姓"]},
    {"radical":"言","name":"speech (trad)","pinyin":"yán","examples":["說","語","話","記"]},
    {"radical":"讠","name":"speech (simp)","pinyin":"yán","examples":["说","话","请","谁"]},
    {"radical":"金","name":"metal, gold","pinyin":"jīn","examples":["钱","银","钟","铁"]},
    {"radical":"火","name":"fire","pinyin":"huǒ","examples":["热","烧","灯","烟"]},
    {"radical":"土","name":"earth","pinyin":"tǔ","examples":["地","场","坐","在"]},
    {"radical":"宀","name":"roof","pinyin":"mián","examples":["家","它","完","定"]},
    {"radical":"艹","name":"grass","pinyin":"cǎo","examples":["花","茶","草","菜"]},
    {"radical":"辶","name":"walking","pinyin":"chuò","examples":["这","过","进","送"]},
    {"radical":"目","name":"eye","pinyin":"mù","examples":["看","睡","眼","直"]},
    {"radical":"手","name":"hand","pinyin":"shǒu","examples":["拿","打","挂","找"]},
    {"radical":"扌","name":"hand (compressed)","pinyin":"shǒu","examples":["把","拉","换","接"]},
]


def get_radicals() -> List[Dict[str, Any]]:
    return _RADICALS


# ═══════════════════════════════════════════════════════════════════════════════
# 4 — Vocabulary (150 HSK1) — generated from hanzi + compound words
# ═══════════════════════════════════════════════════════════════════════════════

# Comprehensive HSK1 word list. Tuples: (id, hanzi, pinyin, meaning_en/es/no, tags)
_VOCAB_TUPLES = [
    # Greetings
    ("你好","nǐ hǎo","hello","hola","hei",["greeting"]),
    ("再见","zàijiàn","goodbye","adiós","ha det",["greeting"]),
    ("谢谢","xièxie","thank you","gracias","takk",["greeting"]),
    ("不客气","bú kèqi","you're welcome","de nada","bare hyggelig",["greeting"]),
    ("对不起","duìbuqǐ","sorry","perdón","unnskyld",["greeting"]),
    ("没关系","méi guānxi","it's OK","no pasa nada","det går bra",["greeting"]),
    ("早上好","zǎoshang hǎo","good morning","buenos días","god morgen",["greeting"]),
    ("晚上好","wǎnshang hǎo","good evening","buenas noches","god kveld",["greeting"]),
    # Pronouns
    ("我","wǒ","I, me","yo","jeg",["pronoun"]),
    ("你","nǐ","you","tú","du",["pronoun"]),
    ("他","tā","he","él","han",["pronoun"]),
    ("她","tā","she","ella","hun",["pronoun"]),
    ("我们","wǒmen","we","nosotros","vi",["pronoun"]),
    ("你们","nǐmen","you (plural)","vosotros","dere",["pronoun"]),
    ("他们","tāmen","they","ellos","de",["pronoun"]),
    # Question words
    ("什么","shénme","what","qué","hva",["question"]),
    ("谁","shéi","who","quién","hvem",["question"]),
    ("哪","nǎ","which","cuál","hvilken",["question"]),
    ("哪里","nǎlǐ","where","dónde","hvor",["question"]),
    ("怎么","zěnme","how","cómo","hvordan",["question"]),
    ("为什么","wèishénme","why","por qué","hvorfor",["question"]),
    ("多少","duōshao","how many","cuánto","hvor mye",["question"]),
    # Numbers
    ("一","yī","one","uno","en",["number"]),
    ("二","èr","two","dos","to",["number"]),
    ("三","sān","three","tres","tre",["number"]),
    ("四","sì","four","cuatro","fire",["number"]),
    ("五","wǔ","five","cinco","fem",["number"]),
    ("六","liù","six","seis","seks",["number"]),
    ("七","qī","seven","siete","syv",["number"]),
    ("八","bā","eight","ocho","åtte",["number"]),
    ("九","jiǔ","nine","nueve","ni",["number"]),
    ("十","shí","ten","diez","ti",["number"]),
    ("百","bǎi","hundred","cien","hundre",["number"]),
    ("千","qiān","thousand","mil","tusen",["number"]),
    # Family
    ("爸爸","bàba","dad","papá","far",["family"]),
    ("妈妈","māma","mum","mamá","mor",["family"]),
    ("哥哥","gēge","older brother","hermano mayor","eldre bror",["family"]),
    ("姐姐","jiějie","older sister","hermana mayor","eldre søster",["family"]),
    ("弟弟","dìdi","younger brother","hermano menor","yngre bror",["family"]),
    ("妹妹","mèimei","younger sister","hermana menor","yngre søster",["family"]),
    ("儿子","érzi","son","hijo","sønn",["family"]),
    ("女儿","nǚ'ér","daughter","hija","datter",["family"]),
    # People
    ("人","rén","person","persona","person",["people"]),
    ("朋友","péngyou","friend","amigo","venn",["people"]),
    ("老师","lǎoshī","teacher","profesor","lærer",["people"]),
    ("学生","xuésheng","student","estudiante","student",["people"]),
    ("先生","xiānsheng","mister, sir","señor","herre",["people"]),
    ("小姐","xiǎojie","miss","señorita","frøken",["people"]),
    ("医生","yīshēng","doctor","médico","lege",["people"]),
    # Places
    ("家","jiā","home, family","casa","hjem",["place"]),
    ("学校","xuéxiào","school","escuela","skole",["place"]),
    ("中国","Zhōngguó","China","China","Kina",["place"]),
    ("北京","Běijīng","Beijing","Pekín","Beijing",["place"]),
    ("商店","shāngdiàn","shop","tienda","butikk",["place"]),
    ("饭馆","fànguǎn","restaurant","restaurante","restaurant",["place"]),
    # Food
    ("水","shuǐ","water","agua","vann",["food"]),
    ("茶","chá","tea","té","te",["food"]),
    ("米饭","mǐfàn","cooked rice","arroz","kokt ris",["food"]),
    ("面条","miàntiáo","noodles","fideos","nudler",["food"]),
    ("苹果","píngguǒ","apple","manzana","eple",["food"]),
    ("菜","cài","vegetable, dish","verdura, plato","grønnsak",["food"]),
    ("肉","ròu","meat","carne","kjøtt",["food"]),
    ("鱼","yú","fish","pescado","fisk",["food"]),
    ("鸡","jī","chicken","pollo","kylling",["food"]),
    # Verbs
    ("是","shì","to be","ser, estar","å være",["verb"]),
    ("有","yǒu","to have","tener","å ha"  ,["verb"]),
    ("在","zài","to be at","estar en","å være",["verb"]),
    ("吃","chī","to eat","comer","å spise",["verb"]),
    ("喝","hē","to drink","beber","å drikke",["verb"]),
    ("看","kàn","to look, read","mirar, leer","å se",["verb"]),
    ("听","tīng","to listen","escuchar","å lytte",["verb"]),
    ("说","shuō","to speak","decir","å si",["verb"]),
    ("学","xué","to learn","aprender","å lære",["verb"]),
    ("写","xiě","to write","escribir","å skrive",["verb"]),
    ("读","dú","to read","leer","å lese",["verb"]),
    ("做","zuò","to do, make","hacer","å gjøre",["verb"]),
    ("去","qù","to go","ir","å gå",["verb"]),
    ("来","lái","to come","venir","å komme",["verb"]),
    ("买","mǎi","to buy","comprar","å kjøpe",["verb"]),
    ("叫","jiào","to be called","llamarse","å hete",["verb"]),
    ("住","zhù","to live","vivir","å bo",["verb"]),
    ("睡","shuì","to sleep","dormir","å sove",["verb"]),
    ("想","xiǎng","to want, think","querer, pensar","å ville",["verb"]),
    ("喜欢","xǐhuān","to like","gustar","å like",["verb"]),
    ("爱","ài","to love","amar","å elske",["verb"]),
    # Adjectives
    ("大","dà","big","grande","stor",["adj"]),
    ("小","xiǎo","small","pequeño","liten",["adj"]),
    ("多","duō","many","mucho","mange",["adj"]),
    ("少","shǎo","few","pocos","få",["adj"]),
    ("好","hǎo","good","bueno","god",["adj"]),
    ("热","rè","hot","caliente","varm",["adj"]),
    ("冷","lěng","cold","frío","kald",["adj"]),
    ("高","gāo","tall, high","alto","høy",["adj"]),
    ("快","kuài","fast","rápido","rask",["adj"]),
    ("慢","màn","slow","lento","sakte",["adj"]),
    ("贵","guì","expensive","caro","dyr",["adj"]),
    ("便宜","piányi","cheap","barato","billig",["adj"]),
    # Time
    ("今天","jīntiān","today","hoy","i dag",["time"]),
    ("明天","míngtiān","tomorrow","mañana","i morgen",["time"]),
    ("昨天","zuótiān","yesterday","ayer","i går",["time"]),
    ("现在","xiànzài","now","ahora","nå",["time"]),
    ("年","nián","year","año","år",["time"]),
    ("月","yuè","month","mes","måned",["time"]),
    ("日","rì","day, sun","día","dag",["time"]),
    ("星期","xīngqī","week","semana","uke",["time"]),
    ("点","diǎn","o'clock","en punto","klokken",["time"]),
    ("分","fēn","minute","minuto","minutt",["time"]),
    # Particles & connectors
    ("的","de","possessive particle","de (posesivo)","eierskap",["particle"]),
    ("了","le","completion particle","partícula completiva","fullføring",["particle"]),
    ("吗","ma","question particle","partícula interrogativa","spørsmål",["particle"]),
    ("不","bù","not","no","ikke",["particle"]),
    ("没","méi","not (have)","no (tener)","ikke (ha)",["particle"]),
    ("和","hé","and","y","og",["particle"]),
    ("也","yě","also","también","også",["particle"]),
    ("都","dōu","all","todos","alle",["particle"]),
    ("很","hěn","very","muy","veldig",["particle"]),
    # Demonstratives & classifiers
    ("这","zhè","this","este","denne",["demon"]),
    ("那","nà","that","ese, aquel","den",["demon"]),
    ("个","gè","general classifier","clasificador","teller",["classifier"]),
    ("本","běn","book classifier","clasificador (libros)","bok-teller",["classifier"]),
    # Body
    ("手","shǒu","hand","mano","hånd",["body"]),
    ("口","kǒu","mouth","boca","munn",["body"]),
    ("眼睛","yǎnjing","eye","ojo","øye",["body"]),
    # Transport / objects
    ("车","chē","vehicle","coche","bil",["object"]),
    ("电脑","diànnǎo","computer","ordenador","datamaskin",["object"]),
    ("手机","shǒujī","mobile phone","móvil","mobil",["object"]),
    ("书","shū","book","libro","bok",["object"]),
    ("名字","míngzi","name","nombre","navn",["object"]),
    ("电话","diànhuà","telephone","teléfono","telefon",["object"]),
    ("钱","qián","money","dinero","penger",["object"]),
    ("门","mén","door","puerta","dør",["object"]),
    # Conjunctions / location
    ("上","shàng","up, on","arriba, en","oppe",["location"]),
    ("下","xià","down, below","abajo","nede",["location"]),
    ("里","lǐ","inside","dentro","inne",["location"]),
    ("外","wài","outside","fuera","ute",["location"]),
    # Weather
    ("天气","tiānqì","weather","tiempo","vær",["weather"]),
    ("雨","yǔ","rain","lluvia","regn",["weather"]),
    ("雪","xuě","snow","nieve","snø",["weather"]),
    # Misc
    ("中文","Zhōngwén","Chinese language","chino","kinesisk",["language"]),
    ("英文","Yīngwén","English language","inglés","engelsk",["language"]),
    ("西班牙语","Xībānyáyǔ","Spanish language","español","spansk",["language"]),
    ("会","huì","can, will, know how","saber, poder","å kunne",["verb"]),
    ("能","néng","able to","poder","å kunne",["verb"]),
    ("可以","kěyǐ","may, can","poder","å kunne",["verb"]),
    ("一点","yìdiǎn","a little","un poco","litt",["adv"]),
    ("非常","fēicháng","extremely","extremadamente","ekstremt",["adv"]),
]

_VOCAB: List[Dict[str, Any]] = []
for i, t in enumerate(_VOCAB_TUPLES):
    word, pinyin, en, es, no, tags = t
    _VOCAB.append({
        "id": f"hsk1_{i+1:03d}",
        "word": word,
        "pinyin": pinyin,
        "meaning": {"en": en, "es": es, "no": no},
        "level": "HSK1",
        "tags": tags,
    })

_VOCAB_MAP = {v["id"]: v for v in _VOCAB}


def get_vocab_all() -> List[Dict[str, Any]]:
    return _VOCAB


# ═══════════════════════════════════════════════════════════════════════════════
# 5 — SRS (SM-2 inspired, same pattern as Japanese Sensei)
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
                                  "next_review_at": s.get("next_review_at"),
                                  "is_new": False})
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
    new_stage = {"again": max(0, cur_stage - 1),
                 "good":  cur_stage + 1,
                 "easy":  cur_stage + 2}.get(grade, cur_stage)
    new_stage = max(0, min(new_stage, len(_SRS_INTERVALS) - 1))
    next_at = _next_review_at(new_stage)
    record = {
        "user_id": user_id, "vocab_id": vocab_id,
        "stage": new_stage, "last_grade": grade,
        "next_review_at": next_at,
        "last_reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    if _SRS_COL is not None:
        try:
            await _SRS_COL.update_one(
                {"user_id": user_id, "vocab_id": vocab_id},
                {"$set": record}, upsert=True,
            )
        except Exception:
            pass
    return {"status": "ok", "stage": new_stage, "next_review_at": next_at}


# ═══════════════════════════════════════════════════════════════════════════════
# 6 — Hanzi progress tracking
# ═══════════════════════════════════════════════════════════════════════════════

async def hanzi_mark(char: str, status: str, user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    """status: 'learning' | 'known' | 'review'."""
    if _HANZI_COL is None:
        return {"status": "ok", "persisted": False}
    try:
        await _HANZI_COL.update_one(
            {"user_id": user_id, "char": char},
            {"$set": {"status": status,
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"status": "ok", "persisted": True}
    except Exception:
        return {"status": "ok", "persisted": False}


async def _hanzi_known_count(user_id: str = DEFAULT_USER) -> int:
    if _HANZI_COL is None:
        return 0
    try:
        return await _HANZI_COL.count_documents({"user_id": user_id, "status": "known"})
    except Exception:
        return 0


async def _vocab_known_count(user_id: str = DEFAULT_USER) -> int:
    if _SRS_COL is None:
        return 0
    try:
        return await _SRS_COL.count_documents({"user_id": user_id, "stage": {"$gte": 3}})
    except Exception:
        return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 7 — Grammar Path (10 HSK1 points)
# ═══════════════════════════════════════════════════════════════════════════════

_GRAMMAR: List[Dict[str, Any]] = [
    {"id":"g1","hsk":"HSK1","title":"是 — to be",
     "pattern":"Subject + 是 + Noun",
     "explanation":{
        "en":"是 (shì) links a subject with a noun: 'A is B'. Not used with adjectives — for those use 很 (hěn).",
        "es":"是 (shì) une un sujeto con un sustantivo: 'A es B'. No se usa con adjetivos — para eso usa 很 (hěn).",
        "no":"是 (shì) forbinder et subjekt med et substantiv: 'A er B'. Brukes ikke med adjektiv — bruk 很 (hěn) for det."},
     "examples":[{"hz":"我是学生。","py":"Wǒ shì xuésheng.","en":"I am a student.","es":"Soy estudiante.","no":"Jeg er student."},
                 {"hz":"他是老师。","py":"Tā shì lǎoshī.","en":"He is a teacher.","es":"Es profesor.","no":"Han er lærer."}],
     "commonMistake":{
        "en":"Don't use 是 with adjectives: 我很高 ✓ (I am tall), NOT 我是高 ✗",
        "es":"No uses 是 con adjetivos: 我很高 ✓ (soy alto), NO 我是高 ✗",
        "no":"Ikke bruk 是 med adjektiv: 我很高 ✓ (jeg er høy), IKKE 我是高 ✗"},
     "quiz":[{"prompt":"我 ___ 学生。","options":["很","是","在","有"],"answer":"是"},
             {"prompt":"她 ___ 老师。","options":["不","在","是","了"],"answer":"是"}]},

    {"id":"g2","hsk":"HSK1","title":"不 — negation",
     "pattern":"不 + verb/adjective (changes tone to bú before 4th tone)",
     "explanation":{
        "en":"不 (bù) negates verbs and adjectives. Changes to bú before a 4th tone: 不是 → bú shì, 不去 → bú qù.",
        "es":"不 (bù) niega verbos y adjetivos. Cambia a bú ante 4º tono: 不是 → bú shì, 不去 → bú qù.",
        "no":"不 (bù) negerer verb og adjektiver. Endres til bú før 4. tone: 不是 → bú shì."},
     "examples":[{"hz":"我不是学生。","py":"Wǒ bú shì xuésheng.","en":"I am not a student.","es":"No soy estudiante.","no":"Jeg er ikke student."},
                 {"hz":"今天不冷。","py":"Jīntiān bù lěng.","en":"Today is not cold.","es":"Hoy no hace frío.","no":"I dag er det ikke kaldt."}],
     "commonMistake":{
        "en":"For 'don't have', use 没有 (méi yǒu), not 不有.",
        "es":"Para 'no tener', usa 没有 (méi yǒu), no 不有.",
        "no":"For 'har ikke', bruk 没有 (méi yǒu), ikke 不有."},
     "quiz":[{"prompt":"我 ___ 喜欢喝茶。","options":["不","没","是","了"],"answer":"不"},
             {"prompt":"他 ___ 有钱。","options":["不","是","没","在"],"answer":"没"}]},

    {"id":"g3","hsk":"HSK1","title":"很 — adjective intensifier",
     "pattern":"Subject + 很 + adjective",
     "explanation":{
        "en":"In Chinese, adjectives act like verbs. 很 (hěn) links subjects with adjectives. Often translates as 'is/are' rather than literally 'very'.",
        "es":"En chino, los adjetivos funcionan como verbos. 很 (hěn) une sujetos con adjetivos. A menudo se traduce como 'es/está' más que como 'muy'.",
        "no":"På kinesisk fungerer adjektiver som verb. 很 (hěn) forbinder subjekt med adjektiv. Oversettes ofte som 'er' i stedet for bokstavelig 'veldig'."},
     "examples":[{"hz":"我很好。","py":"Wǒ hěn hǎo.","en":"I am fine.","es":"Estoy bien.","no":"Jeg har det bra."},
                 {"hz":"今天很热。","py":"Jīntiān hěn rè.","en":"Today is hot.","es":"Hoy hace calor.","no":"I dag er det varmt."}],
     "commonMistake":{
        "en":"Don't combine 是 + adjective. 我是好 ✗ → 我很好 ✓",
        "es":"No combines 是 + adjetivo. 我是好 ✗ → 我很好 ✓",
        "no":"Ikke kombiner 是 + adjektiv. 我是好 ✗ → 我很好 ✓"},
     "quiz":[{"prompt":"我 ___ 累。","options":["是","很","了","的"],"answer":"很"},
             {"prompt":"她 ___ 漂亮。","options":["了","在","是","很"],"answer":"很"}]},

    {"id":"g4","hsk":"HSK1","title":"吗 — yes/no question",
     "pattern":"Statement + 吗?",
     "explanation":{
        "en":"Add 吗 (ma) to the end of a statement to turn it into a yes/no question. Tone is neutral.",
        "es":"Añade 吗 (ma) al final de una afirmación para convertirla en una pregunta de sí/no. El tono es neutro.",
        "no":"Legg 吗 (ma) til slutten av en påstand for å gjøre den til et ja/nei-spørsmål. Tonen er nøytral."},
     "examples":[{"hz":"你好吗？","py":"Nǐ hǎo ma?","en":"How are you?","es":"¿Cómo estás?","no":"Hvordan har du det?"},
                 {"hz":"你是学生吗？","py":"Nǐ shì xuésheng ma?","en":"Are you a student?","es":"¿Eres estudiante?","no":"Er du student?"}],
     "commonMistake":{
        "en":"Don't use 吗 with question words (什么, 谁, 哪): 你是谁? ✓, NOT 你是谁吗? ✗",
        "es":"No uses 吗 con palabras de pregunta (什么, 谁, 哪): 你是谁? ✓, NO 你是谁吗? ✗",
        "no":"Ikke bruk 吗 med spørreord (什么, 谁, 哪): 你是谁? ✓, IKKE 你是谁吗? ✗"},
     "quiz":[{"prompt":"你喝茶 ___?","options":["吗","什么","谁","哪"],"answer":"吗"},
             {"prompt":"他是老师 ___?","options":["谁","吗","什么","了"],"answer":"吗"}]},

    {"id":"g5","hsk":"HSK1","title":"的 — possessive & modifier",
     "pattern":"Noun1 + 的 + Noun2",
     "explanation":{
        "en":"的 (de) connects a modifier to a noun: 我的书 = 'my book'. Often omitted with close relationships: 我妈妈 (my mum) is more natural than 我的妈妈.",
        "es":"的 (de) conecta un modificador con un sustantivo: 我的书 = 'mi libro'. A menudo se omite con relaciones cercanas: 我妈妈 (mi madre) es más natural que 我的妈妈.",
        "no":"的 (de) forbinder en modifikator med et substantiv: 我的书 = 'min bok'. Ofte utelatt ved nære relasjoner: 我妈妈 (mor min) er mer naturlig enn 我的妈妈."},
     "examples":[{"hz":"这是我的书。","py":"Zhè shì wǒde shū.","en":"This is my book.","es":"Este es mi libro.","no":"Dette er min bok."},
                 {"hz":"老师的电话。","py":"Lǎoshī de diànhuà.","en":"The teacher's phone.","es":"El teléfono del profesor.","no":"Lærerens telefon."}],
     "commonMistake":{
        "en":"For pronouns + family/close people, you can drop 的: 我爸爸 instead of 我的爸爸.",
        "es":"Para pronombres + familia/personas cercanas, puedes omitir 的: 我爸爸 en vez de 我的爸爸.",
        "no":"For pronomen + familie/nære personer kan du droppe 的: 我爸爸 i stedet for 我的爸爸."},
     "quiz":[{"prompt":"这是我 ___ 书。","options":["了","的","在","吗"],"answer":"的"},
             {"prompt":"老师 ___ 电话。","options":["也","和","的","不"],"answer":"的"}]},

    {"id":"g6","hsk":"HSK1","title":"个 — general classifier",
     "pattern":"Number + 个 + noun",
     "explanation":{
        "en":"Chinese requires a classifier between a number and a noun. 个 (gè) is the most general — works with people and most objects.",
        "es":"El chino requiere un clasificador entre número y sustantivo. 个 (gè) es el más general — sirve para personas y la mayoría de objetos.",
        "no":"Kinesisk krever en teller mellom tall og substantiv. 个 (gè) er den mest generelle — fungerer for mennesker og de fleste objekter."},
     "examples":[{"hz":"一个朋友。","py":"Yí ge péngyou.","en":"One friend.","es":"Un amigo.","no":"En venn."},
                 {"hz":"三个学生。","py":"Sān ge xuésheng.","en":"Three students.","es":"Tres estudiantes.","no":"Tre studenter."}],
     "commonMistake":{
        "en":"Books use 本: 一本书 ✓. Vehicles use 辆. Each noun has a preferred classifier — start with 个 and learn the exceptions.",
        "es":"Libros usan 本: 一本书 ✓. Vehículos usan 辆. Cada sustantivo tiene clasificador preferido — empieza con 个 y aprende las excepciones.",
        "no":"Bøker bruker 本: 一本书 ✓. Kjøretøy bruker 辆. Hvert substantiv har en foretrukket teller — start med 个 og lær unntakene."},
     "quiz":[{"prompt":"一 ___ 人。","options":["本","个","辆","只"],"answer":"个"},
             {"prompt":"三 ___ 学生。","options":["个","本","辆","只"],"answer":"个"}]},

    {"id":"g7","hsk":"HSK1","title":"有 — to have / there is",
     "pattern":"Subject + 有 + object  |  Place + 有 + thing",
     "explanation":{
        "en":"有 (yǒu) means 'to have' (possession) or 'there is/are' (existence). Negated with 没 not 不: 没有 (méi yǒu).",
        "es":"有 (yǒu) significa 'tener' (posesión) o 'hay' (existencia). Se niega con 没 no 不: 没有 (méi yǒu).",
        "no":"有 (yǒu) betyr 'å ha' (eierskap) eller 'det er/finnes' (eksistens). Negeres med 没, ikke 不: 没有 (méi yǒu)."},
     "examples":[{"hz":"我有一只猫。","py":"Wǒ yǒu yì zhī māo.","en":"I have a cat.","es":"Tengo un gato.","no":"Jeg har en katt."},
                 {"hz":"家里有人。","py":"Jiā lǐ yǒu rén.","en":"Someone is at home.","es":"Hay alguien en casa.","no":"Det er noen hjemme."}],
     "commonMistake":{
        "en":"Negation of 有 is ALWAYS 没有, never 不有.",
        "es":"La negación de 有 es SIEMPRE 没有, nunca 不有.",
        "no":"Negasjon av 有 er ALLTID 没有, aldri 不有."},
     "quiz":[{"prompt":"我 ___ 一本书。","options":["有","是","在","吗"],"answer":"有"},
             {"prompt":"我 ___ 钱。","options":["不有","没有","不是","没是"],"answer":"没有"}]},

    {"id":"g8","hsk":"HSK1","title":"在 — at / to be at",
     "pattern":"Subject + 在 + Place  |  Subject + 在 + Place + Verb",
     "explanation":{
        "en":"在 (zài) means 'to be at' (location) or 'at' (preposition). When followed by a verb, it indicates action AT a location.",
        "es":"在 (zài) significa 'estar en' (ubicación) o 'en' (preposición). Cuando va seguido de un verbo, indica acción EN un lugar.",
        "no":"在 (zài) betyr 'å være på' (sted) eller 'på' (preposisjon). Når det følges av et verb, indikerer det handling PÅ et sted."},
     "examples":[{"hz":"我在家。","py":"Wǒ zài jiā.","en":"I am at home.","es":"Estoy en casa.","no":"Jeg er hjemme."},
                 {"hz":"我在家吃饭。","py":"Wǒ zài jiā chī fàn.","en":"I eat at home.","es":"Como en casa.","no":"Jeg spiser hjemme."}],
     "commonMistake":{
        "en":"在 comes BEFORE the verb: 我在家吃饭 ✓, NOT 我吃饭在家 ✗",
        "es":"在 va ANTES del verbo: 我在家吃饭 ✓, NO 我吃饭在家 ✗",
        "no":"在 kommer FØR verbet: 我在家吃饭 ✓, IKKE 我吃饭在家 ✗"},
     "quiz":[{"prompt":"我 ___ 学校。","options":["是","在","和","也"],"answer":"在"},
             {"prompt":"他 ___ 家做饭。","options":["和","在","到","上"],"answer":"在"}]},

    {"id":"g9","hsk":"HSK1","title":"想 — to want to / think",
     "pattern":"Subject + 想 + verb (phrase)",
     "explanation":{
        "en":"想 (xiǎng) before a verb expresses desire: 'want to'. Also means 'to think' or 'to miss someone'.",
        "es":"想 (xiǎng) antes de un verbo expresa deseo: 'querer'. También significa 'pensar' o 'echar de menos'.",
        "no":"想 (xiǎng) før et verb uttrykker ønske: 'å ville'. Betyr også 'å tenke' eller 'å savne'."},
     "examples":[{"hz":"我想喝茶。","py":"Wǒ xiǎng hē chá.","en":"I want to drink tea.","es":"Quiero beber té.","no":"Jeg vil drikke te."},
                 {"hz":"我想我妈妈。","py":"Wǒ xiǎng wǒ māma.","en":"I miss my mum.","es":"Echo de menos a mi madre.","no":"Jeg savner mor."}],
     "commonMistake":{
        "en":"For 'I want X' (object): 我要 X (wǒ yào). 想 is more about desire/wishing; 要 is firmer want.",
        "es":"Para 'quiero X' (objeto): 我要 X (wǒ yào). 想 es más deseo; 要 es voluntad más firme.",
        "no":"For 'jeg vil ha X' (objekt): 我要 X (wǒ yào). 想 er mer ønske; 要 er fastere vilje."},
     "quiz":[{"prompt":"我 ___ 去中国。","options":["想","是","在","了"],"answer":"想"},
             {"prompt":"她 ___ 吃苹果。","options":["了","想","是","也"],"answer":"想"}]},

    {"id":"g10","hsk":"HSK1","title":"了 — completion / change",
     "pattern":"Verb + 了 (completed action) | Sentence + 了 (change of state)",
     "explanation":{
        "en":"了 (le) marks completed actions or signals a change of state. After a verb: action finished. At sentence end: situation changed.",
        "es":"了 (le) marca acciones completadas o un cambio de estado. Tras un verbo: acción terminada. Al final de la frase: situación cambiada.",
        "no":"了 (le) markerer fullførte handlinger eller signaliserer endring av tilstand. Etter et verb: fullført handling. På setningsslutt: endret situasjon."},
     "examples":[{"hz":"我吃了。","py":"Wǒ chī le.","en":"I have eaten.","es":"He comido.","no":"Jeg har spist."},
                 {"hz":"下雨了。","py":"Xià yǔ le.","en":"It started raining.","es":"Empezó a llover.","no":"Det begynte å regne."}],
     "commonMistake":{
        "en":"了 is NOT a past tense marker — it marks COMPLETION, which can be future too: 明天我吃了饭就来 = 'Tomorrow after I finish eating I'll come'.",
        "es":"了 NO es marca de pasado — marca COMPLETUD, que puede ser futura: 明天我吃了饭就来 = 'Mañana tras comer vengo'.",
        "no":"了 er IKKE en fortidsmarkør — den markerer FULLFØRELSE, som også kan være fremtidig: 明天我吃了饭就来 = 'I morgen kommer jeg etter å ha spist'."},
     "quiz":[{"prompt":"我 喝 ___ 茶。","options":["了","在","是","吗"],"answer":"了"},
             {"prompt":"他 来 ___ 。","options":["吗","了","和","也"],"answer":"了"}]},
]

_GRAMMAR_MAP = {g["id"]: g for g in _GRAMMAR}


def get_grammar_path(hsk_level: str = "HSK1") -> List[Dict[str, Any]]:
    return [g for g in _GRAMMAR if g["hsk"] == hsk_level]


def get_grammar_point(point_id: str) -> Optional[Dict[str, Any]]:
    return _GRAMMAR_MAP.get(point_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 8 — Conversation Sensei (LLM-backed)
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS: Dict[str, Dict[str, str]] = {
    "intro":      {"en":"Introducing yourself", "es":"Presentarte",       "no":"Presentere deg",
                   "first":"你好！你叫什么名字？"},
    "tea":        {"en":"Ordering tea or coffee","es":"Pedir té o café",  "no":"Bestille te eller kaffe",
                   "first":"欢迎光临！您想喝什么？"},
    "directions": {"en":"Asking for directions","es":"Pedir direcciones",  "no":"Spørre om veien",
                   "first":"请问，地铁站在哪里？"},
    "taxi":       {"en":"Taking a taxi",        "es":"Coger un taxi",      "no":"Ta taxi",
                   "first":"师傅，去机场。"},
    "restaurant": {"en":"At a restaurant",      "es":"En el restaurante",  "no":"På restaurant",
                   "first":"您好，几位？"},
}

_LANG_NAMES = {"es":"Spanish", "en":"English", "no":"Norwegian"}


def _shifu_system_prompt(scenario: str, difficulty: str, lang: str) -> str:
    explain_lang = _LANG_NAMES.get(lang, "English")
    scen_label = SCENARIOS.get(scenario, {}).get("en", scenario)
    return (
        f"You are Maestro Chino IA, a patient, precise and encouraging Mandarin Chinese tutor.\n\n"
        f"SCENARIO: {scen_label}\n"
        f"LEARNER LEVEL: {difficulty} (HSK1 vocabulary by default)\n"
        f"EXPLANATION LANGUAGE: {explain_lang}\n\n"
        f"Strict response format — return JSON only, no markdown:\n"
        f'{{"hz":"<your Chinese reply (simplified hanzi)>",'
        f'"py":"<full pinyin with tone marks>",'
        f'"translation":"<natural {explain_lang} translation>",'
        f'"hint":"<short cultural or grammar tip in {explain_lang}, optional>",'
        f'"correction":"<gentle correction of the learner\'s last message if needed, in {explain_lang}, optional>"}}\n\n'
        f"Rules:\n"
        f"- For Beginner (HSK1): use only HSK1 vocabulary and basic patterns (是, 不, 很, 吗, 的, 个, 有, 在, 想, 了).\n"
        f"- For Intermediate (HSK2-3): introduce 了, 过, 在 + verb, 把, comparison.\n"
        f"- For Advanced (HSK4+): use natural conversational Mandarin including idioms.\n"
        f"- ALWAYS include pinyin with tone marks.\n"
        f"- Keep `hz` short and natural for the difficulty level.\n"
        f"- Stay in scenario. Encourage progress."
    )


async def conversation_message(
    scenario: str, difficulty: str,
    history: List[Dict[str, str]], user_text: Optional[str],
    lang: str = "es",
) -> Dict[str, Any]:
    scen = SCENARIOS.get(scenario, SCENARIOS["intro"])
    if not history and not user_text:
        opener = scen["first"]
        return {
            "hz": opener, "py": "", "translation": "",
            "hint": "", "correction": "",
            "is_mock": False, "scenario": scenario, "difficulty": difficulty,
        }
    if ask_ai_unified is None:
        return _mock_shifu_reply(scenario, difficulty, user_text or "", lang)
    sys_prompt = _shifu_system_prompt(scenario, difficulty, lang)
    messages: List[Dict[str, str]] = [{"role": "system", "content": sys_prompt}]
    for turn in history[-10:]:
        messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    if user_text:
        messages.append({"role": "user", "content": user_text})
    try:
        raw = await ask_ai_unified(
            prompt=user_text or scen["first"],
            task_type="dialogue", complexity="medium",
            max_tokens=400, messages=messages,
        )
        if raw:
            import json
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
            return parsed
    except Exception:
        pass
    return _mock_shifu_reply(scenario, difficulty, user_text or "", lang)


def _mock_shifu_reply(scenario: str, difficulty: str, user_text: str, lang: str) -> Dict[str, Any]:
    mocks = {
        "es": ("是吗？请再说一遍。", "shì ma? qǐng zài shuō yí biàn.",
               "¿Ah sí? Por favor, dilo otra vez."),
        "en": ("是吗？请再说一遍。", "shì ma? qǐng zài shuō yí biàn.",
               "Oh really? Please say that again."),
        "no": ("是吗？请再说一遍。", "shì ma? qǐng zài shuō yí biàn.",
               "Å, jaså? Vennligst si det igjen."),
    }
    hz, py, tr = mocks.get(lang, mocks["en"])
    return {
        "hz": hz, "py": py, "translation": tr,
        "hint": "[Mock shifu — connect an AI model for live conversation.]",
        "correction": "", "is_mock": True,
        "scenario": scenario, "difficulty": difficulty,
    }


def scenarios_catalogue(lang: str = "es") -> List[Dict[str, str]]:
    return [{"key": k, "label": v.get(lang, v["en"]), "first": v["first"]}
            for k, v in SCENARIOS.items()]


# ═══════════════════════════════════════════════════════════════════════════════
# 9 — Kanji-Hanzi Bridge — THE DIFFERENTIATOR
# ═══════════════════════════════════════════════════════════════════════════════
# Combines:
#   (a) dynamic cross-reference: any hanzi in our HSK1 deck that also exists in
#       the Japanese Sensei's _KANJI_MAP is automatically bridged.
#   (b) 20 curated entries with simplified vs traditional vs Japanese + notes.

_BRIDGE_CURATED: List[Dict[str, Any]] = [
    {"hanzi":"山","trad":"山","ja":"山",
     "zh_pinyin":"shān","zh_meaning":"mountain",
     "ja_on":["サン"],"ja_kun":["やま"],"ja_meaning":"mountain",
     "relation":"identical",
     "note":{"en":"Same character, same meaning. Pictograph of three mountain peaks.",
             "es":"Mismo carácter, mismo significado. Pictograma de tres picos de montaña.",
             "no":"Samme tegn, samme betydning. Piktogram av tre fjelltopper."}},
    {"hanzi":"人","trad":"人","ja":"人",
     "zh_pinyin":"rén","zh_meaning":"person",
     "ja_on":["ジン","ニン"],"ja_kun":["ひと"],"ja_meaning":"person",
     "relation":"identical",
     "note":{"en":"Pictograph of a person standing. The same in both languages.",
             "es":"Pictograma de una persona de pie. Idéntico en ambos idiomas.",
             "no":"Piktogram av en stående person. Identisk på begge språk."}},
    {"hanzi":"大","trad":"大","ja":"大",
     "zh_pinyin":"dà","zh_meaning":"big",
     "ja_on":["ダイ","タイ"],"ja_kun":["おお"],"ja_meaning":"big",
     "relation":"identical",
     "note":{"en":"Person stretching arms wide. Same meaning, same shape.",
             "es":"Persona con los brazos extendidos. Mismo significado, misma forma.",
             "no":"Person som strekker armene ut. Samme betydning, samme form."}},
    {"hanzi":"小","trad":"小","ja":"小",
     "zh_pinyin":"xiǎo","zh_meaning":"small",
     "ja_on":["ショウ"],"ja_kun":["ちい","こ"],"ja_meaning":"small",
     "relation":"identical","note":{"en":"Three small dots — abstract representation of smallness.","es":"Tres puntos pequeños — representación abstracta de pequeñez.","no":"Tre små prikker — abstrakt representasjon av smålighet."}},
    {"hanzi":"水","trad":"水","ja":"水",
     "zh_pinyin":"shuǐ","zh_meaning":"water",
     "ja_on":["スイ"],"ja_kun":["みず"],"ja_meaning":"water",
     "relation":"identical","note":{"en":"Pictograph of flowing water. The radical 氵 is the compressed form.","es":"Pictograma de agua corriente. El radical 氵 es la forma comprimida.","no":"Piktogram av rennende vann. Radikalen 氵 er den komprimerte formen."}},
    {"hanzi":"火","trad":"火","ja":"火",
     "zh_pinyin":"huǒ","zh_meaning":"fire",
     "ja_on":["カ"],"ja_kun":["ひ"],"ja_meaning":"fire",
     "relation":"identical","note":{"en":"Flames rising — same character in Chinese and Japanese.","es":"Llamas ascendiendo — mismo carácter en chino y japonés.","no":"Flammer som stiger — samme tegn på kinesisk og japansk."}},
    {"hanzi":"木","trad":"木","ja":"木",
     "zh_pinyin":"mù","zh_meaning":"tree, wood",
     "ja_on":["モク","ボク"],"ja_kun":["き"],"ja_meaning":"tree, wood",
     "relation":"identical","note":{"en":"Pictograph of a tree with branches and roots.","es":"Pictograma de un árbol con ramas y raíces.","no":"Piktogram av et tre med greiner og røtter."}},
    {"hanzi":"月","trad":"月","ja":"月",
     "zh_pinyin":"yuè","zh_meaning":"moon, month",
     "ja_on":["ゲツ","ガツ"],"ja_kun":["つき"],"ja_meaning":"moon, month",
     "relation":"identical","note":{"en":"Crescent moon. Both languages also use it for 'month'.","es":"Luna creciente. Ambos idiomas lo usan también para 'mes'.","no":"Halvmåne. Begge språkene bruker det også for 'måned'."}},
    {"hanzi":"日","trad":"日","ja":"日",
     "zh_pinyin":"rì","zh_meaning":"sun, day",
     "ja_on":["ニチ","ジツ"],"ja_kun":["ひ","か"],"ja_meaning":"sun, day",
     "relation":"identical","note":{"en":"Sun symbol. 日本 = Japan (lit. 'sun origin').","es":"Símbolo del sol. 日本 = Japón (lit. 'origen del sol').","no":"Sol-symbol. 日本 = Japan (bokstavelig 'solens opprinnelse')."}},
    {"hanzi":"中","trad":"中","ja":"中",
     "zh_pinyin":"zhōng","zh_meaning":"middle, China (in 中国)",
     "ja_on":["チュウ"],"ja_kun":["なか"],"ja_meaning":"middle, inside",
     "relation":"identical","note":{"en":"Arrow piercing the centre of a target. 中国 (zhōngguó) = Middle Kingdom = China.","es":"Flecha atravesando el centro de un objetivo. 中国 (zhōngguó) = Reino del Medio = China.","no":"Pil som gjennomborer midten av en blink. 中国 (zhōngguó) = Midtens rike = Kina."}},
    {"hanzi":"国","trad":"國","ja":"国",
     "zh_pinyin":"guó","zh_meaning":"country",
     "ja_on":["コク"],"ja_kun":["くに"],"ja_meaning":"country",
     "relation":"simplification",
     "note":{"en":"⚠ Chinese simplified 国 matches Japanese 国. The traditional form 國 (jade enclosed by borders) is rarer in modern Japan but still used in formal contexts.",
             "es":"⚠ El simplificado chino 国 coincide con el japonés 国. La forma tradicional 國 (jade rodeado de fronteras) es rara en el Japón moderno pero aún se usa en contextos formales.",
             "no":"⚠ Forenklet kinesisk 国 matcher japansk 国. Den tradisjonelle formen 國 (jade omsluttet av grenser) er sjelden i moderne Japan, men brukes fortsatt formelt."}},
    {"hanzi":"学","trad":"學","ja":"学",
     "zh_pinyin":"xué","zh_meaning":"to study, learn",
     "ja_on":["ガク"],"ja_kun":["まな"],"ja_meaning":"study, learn",
     "relation":"simplification",
     "note":{"en":"Chinese simplified 学 = Japanese 学. The traditional form 學 has additional strokes representing learning. Both share the same root meaning.",
             "es":"Simplificado chino 学 = japonés 学. La forma tradicional 學 tiene más trazos que representan el aprendizaje. Ambos comparten la misma raíz.",
             "no":"Forenklet kinesisk 学 = japansk 学. Den tradisjonelle formen 學 har flere strøk som representerer læring. Begge deler samme rotbetydning."}},
    {"hanzi":"生","trad":"生","ja":"生",
     "zh_pinyin":"shēng","zh_meaning":"life, raw, student (in 学生)",
     "ja_on":["セイ","ショウ"],"ja_kun":["い","う","なま","は"],"ja_meaning":"life, birth, raw",
     "relation":"identical",
     "note":{"en":"Same character, both languages use it for 'student' in 学生 (xuésheng / がくせい).",
             "es":"Mismo carácter, ambos idiomas lo usan para 'estudiante' en 学生 (xuésheng / がくせい).",
             "no":"Samme tegn, begge språk bruker det for 'student' i 学生 (xuésheng / がくせい)."}},
    {"hanzi":"口","trad":"口","ja":"口",
     "zh_pinyin":"kǒu","zh_meaning":"mouth, opening",
     "ja_on":["コウ","ク"],"ja_kun":["くち"],"ja_meaning":"mouth",
     "relation":"identical","note":{"en":"Square representing an open mouth.","es":"Cuadrado que representa una boca abierta.","no":"Firkant som representerer en åpen munn."}},
    {"hanzi":"手","trad":"手","ja":"手",
     "zh_pinyin":"shǒu","zh_meaning":"hand",
     "ja_on":["シュ"],"ja_kun":["て"],"ja_meaning":"hand",
     "relation":"identical","note":{"en":"Pictograph of a hand with fingers. 手机 (shǒujī) = mobile phone in Chinese.","es":"Pictograma de una mano con dedos. 手机 (shǒujī) = móvil en chino.","no":"Piktogram av en hånd med fingre. 手机 (shǒujī) = mobil på kinesisk."}},
    {"hanzi":"车","trad":"車","ja":"車",
     "zh_pinyin":"chē","zh_meaning":"vehicle, car",
     "ja_on":["シャ"],"ja_kun":["くるま"],"ja_meaning":"vehicle, car",
     "relation":"simplification",
     "note":{"en":"⚠ Chinese simplified 车 vs Japanese 車 (same as traditional). 車 still depicts an ancient cart.",
             "es":"⚠ Simplificado chino 车 vs japonés 車 (igual al tradicional). 車 aún representa una carreta antigua.",
             "no":"⚠ Forenklet kinesisk 车 vs japansk 車 (samme som tradisjonell). 車 viser fortsatt en gammel kjerre."}},
    {"hanzi":"门","trad":"門","ja":"門",
     "zh_pinyin":"mén","zh_meaning":"door, gate",
     "ja_on":["モン"],"ja_kun":["かど"],"ja_meaning":"gate",
     "relation":"simplification",
     "note":{"en":"⚠ Chinese simplified 门 vs Japanese 門. Japanese kept the traditional double-door pictograph.",
             "es":"⚠ Simplificado chino 门 vs japonés 門. El japonés conservó el pictograma tradicional de doble puerta.",
             "no":"⚠ Forenklet kinesisk 门 vs japansk 門. Japansk beholdt det tradisjonelle pictogrammet med dobbel dør."}},
    {"hanzi":"明","trad":"明","ja":"明",
     "zh_pinyin":"míng","zh_meaning":"bright, clear; tomorrow (明天)",
     "ja_on":["メイ","ミョウ"],"ja_kun":["あか","あき"],"ja_meaning":"bright, clear",
     "relation":"identical",
     "note":{"en":"Sun 日 + Moon 月 = 'bright'. Beautiful compositional logic — same in both.",
             "es":"Sol 日 + Luna 月 = 'brillante'. Lógica de composición preciosa — igual en ambos.",
             "no":"Sol 日 + Måne 月 = 'lys'. Vakker komposisjonslogikk — samme på begge."}},
    {"hanzi":"年","trad":"年","ja":"年",
     "zh_pinyin":"nián","zh_meaning":"year",
     "ja_on":["ネン"],"ja_kun":["とし"],"ja_meaning":"year",
     "relation":"identical","note":{"en":"Same shape and same meaning in both languages.","es":"Misma forma y mismo significado en ambos idiomas.","no":"Samme form og samme betydning på begge språk."}},
    {"hanzi":"家","trad":"家","ja":"家",
     "zh_pinyin":"jiā","zh_meaning":"home, family",
     "ja_on":["カ","ケ"],"ja_kun":["いえ","や"],"ja_meaning":"home, family, house",
     "relation":"identical",
     "note":{"en":"Roof 宀 over pig 豕 — historically the wealth of a household included livestock.",
             "es":"Tejado 宀 sobre cerdo 豕 — históricamente la riqueza familiar incluía ganado.",
             "no":"Tak 宀 over gris 豕 — historisk inkluderte husholdningsrikdom husdyr."}},
]

_BRIDGE_MAP = {b["hanzi"]: b for b in _BRIDGE_CURATED}


def get_bridge_entries() -> List[Dict[str, Any]]:
    """Combine curated entries with dynamic lookup against Japanese Sensei kanji.
    Hanzi in our HSK1 deck that also exist in _JA_KANJI_MAP are auto-bridged."""
    entries: List[Dict[str, Any]] = []
    seen = set()
    # 1) Curated first (richer notes)
    for b in _BRIDGE_CURATED:
        entries.append({**b, "source": "curated"})
        seen.add(b["hanzi"])
    # 2) Dynamic: any Chinese hanzi that exists in Japanese kanji map
    for h in _HANZI:
        char = h["char"]
        if char in seen:
            continue
        ja = _JA_KANJI_MAP.get(char)
        if not ja:
            continue
        entries.append({
            "hanzi":       char,
            "trad":        h.get("trad", char),
            "ja":          char,
            "zh_pinyin":   h["pinyin"],
            "zh_meaning":  h["meaning"]["en"],
            "ja_on":       ja.get("onyomi", []),
            "ja_kun":      ja.get("kunyomi", []),
            "ja_meaning":  ja.get("meaning", ""),
            "relation":    "identical",
            "note":{"en": f"Auto-detected: present in both HSK1 and JLPT N5 decks.",
                    "es": f"Auto-detectado: presente en HSK1 y JLPT N5.",
                    "no": f"Auto-oppdaget: finnes i både HSK1 og JLPT N5."},
            "source":      "auto",
        })
    return entries


def get_bridge_entry(char: str) -> Optional[Dict[str, Any]]:
    return _BRIDGE_MAP.get(char)


# ═══════════════════════════════════════════════════════════════════════════════
# 10 — Dashboard / Overview
# ═══════════════════════════════════════════════════════════════════════════════

async def get_overview(user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    hanzi_known = await _hanzi_known_count(user_id)
    vocab_known = await _vocab_known_count(user_id)
    due_items = await srs_due(user_id, limit=100)
    srs_due_n = sum(1 for d in due_items if not d.get("is_new"))
    new_today = sum(1 for d in due_items if d.get("is_new"))
    if hanzi_known >= 30 and vocab_known >= 80:
        level, target = "Beginner+", "HSK1"
    elif hanzi_known >= 15 or vocab_known >= 40:
        level, target = "Beginner", "HSK1"
    else:
        level, target = "Starter", "HSK1"
    mission = [
        {"type": "pinyin",  "count": 5,  "label": "pinyin syllables"},
        {"type": "tones",   "count": 5,  "label": "tone drills"},
        {"type": "hanzi",   "count": 3,  "label": "hanzi practices"},
        {"type": "srs",     "count": min(20, srs_due_n + new_today), "label": "vocabulary reviews"},
        {"type": "conv",    "count": 1,  "label": "mini-dialogue"},
    ]
    return {
        "user_id": user_id, "level": level, "hsk_target": target,
        "streak_days": 0,
        "stats": {
            "pinyin_total":   len(_SYLLABLES),
            "tones_total":    len(_TONES),
            "hanzi_known":    hanzi_known,
            "hanzi_total":    len(_HANZI),
            "radicals_total": len(_RADICALS),
            "vocab_known":    vocab_known,
            "vocab_total":    len(_VOCAB),
            "srs_due_today":  srs_due_n,
            "srs_new_today":  new_today,
        },
        "todays_mission": mission,
        "generated_at":   datetime.now(timezone.utc).isoformat(),
    }
