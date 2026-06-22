"""
Maestro Coreano IA — Service
=============================
Functional V1 for the Korean language learning agent.

Eight modules:
  1. Hangul Trainer        — 14 consonants + 10 vowels + 5 doubles + compound vowels
  2. Syllable Builder      — algorithmic Hangul block composition / decomposition
  3. Batchim & Pronunciation — 7 batchim groups + linking + sound changes
  4. Vocabulary SRS        — 150 TOPIK1 words with SM-2 spaced repetition
  5. Grammar Path          — 12 TOPIK1 grammar points
  6. Conversation Seonsaeng — LLM-backed scenarios (Hangul + romanization + ES)
  7. CJK Bridge            — Hanja ↔ Hanzi ↔ Kanji (extends _KANJI_MAP from
                              japanese_sensei + chinese_teacher)
  8. Dashboard             — aggregated stats + today's mission

Single-user model (user_id='default') matching the Japanese/Chinese pattern.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from backend.llm import ask_ai_unified
except Exception:
    ask_ai_unified = None  # type: ignore

# Cross-import Japanese kanji map for the CJK Bridge
try:
    from backend.services.japanese_sensei import _KANJI_MAP as _JA_KANJI_MAP
except Exception:
    try:
        from services.japanese_sensei import _KANJI_MAP as _JA_KANJI_MAP  # type: ignore
    except Exception:
        _JA_KANJI_MAP = {}

try:
    from backend.db import database
    _JAMO_COL    = database.get_collection("korean_hangul_progress")
    _BATCHIM_COL = database.get_collection("korean_batchim_progress")
    _SRS_COL     = database.get_collection("korean_srs_reviews")
    _CONV_COL    = database.get_collection("korean_conversation_runs")
    _SYLL_COL    = database.get_collection("korean_syllable_attempts")
except Exception:
    _JAMO_COL = _BATCHIM_COL = _SRS_COL = _CONV_COL = _SYLL_COL = None

DEFAULT_USER = "default"


# ═══════════════════════════════════════════════════════════════════════════════
# 1 — Hangul Trainer
# ═══════════════════════════════════════════════════════════════════════════════
# Standard Modern Hangul has 24 basic letters: 14 consonants + 10 vowels.
# Plus 5 double consonants (쌍자음) and common compound vowels (이중모음).

# 14 basic consonants (자음)
_CONSONANTS: List[Dict[str, Any]] = [
    {"jamo": "ㄱ", "name": "기역", "romaji": "giyeok", "sound_initial": "g/k", "sound_final": "k"},
    {"jamo": "ㄴ", "name": "니은", "romaji": "nieun",  "sound_initial": "n",   "sound_final": "n"},
    {"jamo": "ㄷ", "name": "디귿", "romaji": "digeut", "sound_initial": "d/t", "sound_final": "t"},
    {"jamo": "ㄹ", "name": "리을", "romaji": "rieul",  "sound_initial": "r/l", "sound_final": "l"},
    {"jamo": "ㅁ", "name": "미음", "romaji": "mieum",  "sound_initial": "m",   "sound_final": "m"},
    {"jamo": "ㅂ", "name": "비읍", "romaji": "bieup",  "sound_initial": "b/p", "sound_final": "p"},
    {"jamo": "ㅅ", "name": "시옷", "romaji": "siot",   "sound_initial": "s",   "sound_final": "t"},
    {"jamo": "ㅇ", "name": "이응", "romaji": "ieung",  "sound_initial": "(silent)", "sound_final": "ng"},
    {"jamo": "ㅈ", "name": "지읒", "romaji": "jieut",  "sound_initial": "j",   "sound_final": "t"},
    {"jamo": "ㅊ", "name": "치읓", "romaji": "chieut", "sound_initial": "ch",  "sound_final": "t"},
    {"jamo": "ㅋ", "name": "키읔", "romaji": "kieuk",  "sound_initial": "k (aspirated)", "sound_final": "k"},
    {"jamo": "ㅌ", "name": "티읕", "romaji": "tieut",  "sound_initial": "t (aspirated)", "sound_final": "t"},
    {"jamo": "ㅍ", "name": "피읖", "romaji": "pieup",  "sound_initial": "p (aspirated)", "sound_final": "p"},
    {"jamo": "ㅎ", "name": "히읗", "romaji": "hieut",  "sound_initial": "h",   "sound_final": "t"},
]

# 5 double consonants (쌍자음 — tense)
_DOUBLE_CONSONANTS: List[Dict[str, Any]] = [
    {"jamo": "ㄲ", "name": "쌍기역", "romaji": "ssang-giyeok", "sound_initial": "kk (tense)"},
    {"jamo": "ㄸ", "name": "쌍디귿", "romaji": "ssang-digeut", "sound_initial": "tt (tense)"},
    {"jamo": "ㅃ", "name": "쌍비읍", "romaji": "ssang-bieup",  "sound_initial": "pp (tense)"},
    {"jamo": "ㅆ", "name": "쌍시옷", "romaji": "ssang-siot",   "sound_initial": "ss (tense)"},
    {"jamo": "ㅉ", "name": "쌍지읒", "romaji": "ssang-jieut",  "sound_initial": "jj (tense)"},
]

# 10 basic vowels (모음)
_VOWELS: List[Dict[str, Any]] = [
    {"jamo": "ㅏ", "name": "아", "romaji": "a",  "sound": "a (as in 'father')"},
    {"jamo": "ㅑ", "name": "야", "romaji": "ya", "sound": "ya"},
    {"jamo": "ㅓ", "name": "어", "romaji": "eo", "sound": "eo (as in 'son')"},
    {"jamo": "ㅕ", "name": "여", "romaji": "yeo","sound": "yeo"},
    {"jamo": "ㅗ", "name": "오", "romaji": "o",  "sound": "o (as in 'oh')"},
    {"jamo": "ㅛ", "name": "요", "romaji": "yo", "sound": "yo"},
    {"jamo": "ㅜ", "name": "우", "romaji": "u",  "sound": "u (as in 'food')"},
    {"jamo": "ㅠ", "name": "유", "romaji": "yu", "sound": "yu"},
    {"jamo": "ㅡ", "name": "으", "romaji": "eu", "sound": "eu (as in 'put')"},
    {"jamo": "ㅣ", "name": "이", "romaji": "i",  "sound": "i (as in 'see')"},
]

# Common compound vowels (이중모음)
_COMPOUND_VOWELS: List[Dict[str, Any]] = [
    {"jamo": "ㅐ", "name": "애", "romaji": "ae", "sound": "ae (as in 'cat')"},
    {"jamo": "ㅒ", "name": "얘", "romaji": "yae","sound": "yae"},
    {"jamo": "ㅔ", "name": "에", "romaji": "e",  "sound": "e (as in 'bed')"},
    {"jamo": "ㅖ", "name": "예", "romaji": "ye", "sound": "ye"},
    {"jamo": "ㅘ", "name": "와", "romaji": "wa", "sound": "wa"},
    {"jamo": "ㅙ", "name": "왜", "romaji": "wae","sound": "wae"},
    {"jamo": "ㅚ", "name": "외", "romaji": "oe", "sound": "we"},
    {"jamo": "ㅝ", "name": "워", "romaji": "wo", "sound": "wo"},
    {"jamo": "ㅞ", "name": "웨", "romaji": "we", "sound": "we"},
    {"jamo": "ㅟ", "name": "위", "romaji": "wi", "sound": "wi"},
    {"jamo": "ㅢ", "name": "의", "romaji": "ui", "sound": "ui"},
]


def get_hangul_deck() -> Dict[str, Any]:
    return {
        "consonants":        _CONSONANTS,
        "double_consonants": _DOUBLE_CONSONANTS,
        "vowels":            _VOWELS,
        "compound_vowels":   _COMPOUND_VOWELS,
        "counts": {
            "consonants":        len(_CONSONANTS),
            "double_consonants": len(_DOUBLE_CONSONANTS),
            "vowels":            len(_VOWELS),
            "compound_vowels":   len(_COMPOUND_VOWELS),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2 — Syllable Builder (algorithmic, leverages Unicode Hangul block math)
# ═══════════════════════════════════════════════════════════════════════════════
# Hangul Syllables block: U+AC00..U+D7A3
# Formula:   code = 0xAC00 + (initial × 588) + (medial × 28) + final
# Where:
#   initial ∈ 0..18  (19 leading consonants — "choseong")
#   medial  ∈ 0..20  (21 vowels — "jungseong")
#   final   ∈ 0..27  (28 trailing consonants incl. 0 = none — "jongseong")

_HANGUL_BASE = 0xAC00

# Choseong (initial consonants, in standard order)
_CHOSEONG: List[str] = [
    "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ",
    "ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
]
_CHOSEONG_INDEX = {c: i for i, c in enumerate(_CHOSEONG)}

# Jungseong (medial vowels)
_JUNGSEONG: List[str] = [
    "ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ",
    "ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ",
]
_JUNGSEONG_INDEX = {v: i for i, v in enumerate(_JUNGSEONG)}

# Jongseong (final consonants — index 0 = no batchim)
_JONGSEONG: List[str] = [
    "", "ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ",
    "ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
]
_JONGSEONG_INDEX = {c: i for i, c in enumerate(_JONGSEONG)}


def compose_syllable(initial: str, medial: str, final: str = "") -> Optional[str]:
    """Algorithmic Hangul block composition.
    initial: jamo (e.g. 'ㄱ')
    medial:  jamo (e.g. 'ㅏ')
    final:   optional jamo (e.g. 'ㄴ' or '')
    Returns the composed Hangul block, or None if any jamo is invalid.
    """
    i = _CHOSEONG_INDEX.get(initial)
    m = _JUNGSEONG_INDEX.get(medial)
    f = _JONGSEONG_INDEX.get(final, 0) if final else 0
    if i is None or m is None or f is None:
        return None
    code = _HANGUL_BASE + (i * 588) + (m * 28) + f
    return chr(code)


def decompose_syllable(block: str) -> Optional[Dict[str, Any]]:
    """Inverse of compose: pulls jamo back from a Hangul block."""
    if not block or len(block) != 1:
        return None
    code = ord(block)
    if code < _HANGUL_BASE or code > 0xD7A3:
        return None
    offset = code - _HANGUL_BASE
    i = offset // 588
    rem = offset % 588
    m = rem // 28
    f = rem % 28
    return {
        "block":   block,
        "initial": _CHOSEONG[i],
        "medial":  _JUNGSEONG[m],
        "final":   _JONGSEONG[f],
        "has_batchim": f != 0,
        "romanization": _romanize_block(_CHOSEONG[i], _JUNGSEONG[m], _JONGSEONG[f]),
    }


# Very pragmatic romanization for V1 — Revised Romanization (RR), simplified.
_ROMANIZE_INITIAL = {
    "ㄱ":"g","ㄲ":"kk","ㄴ":"n","ㄷ":"d","ㄸ":"tt","ㄹ":"r","ㅁ":"m",
    "ㅂ":"b","ㅃ":"pp","ㅅ":"s","ㅆ":"ss","ㅇ":"","ㅈ":"j","ㅉ":"jj",
    "ㅊ":"ch","ㅋ":"k","ㅌ":"t","ㅍ":"p","ㅎ":"h",
}
_ROMANIZE_MEDIAL = {
    "ㅏ":"a","ㅐ":"ae","ㅑ":"ya","ㅒ":"yae","ㅓ":"eo","ㅔ":"e","ㅕ":"yeo",
    "ㅖ":"ye","ㅗ":"o","ㅘ":"wa","ㅙ":"wae","ㅚ":"oe","ㅛ":"yo","ㅜ":"u",
    "ㅝ":"wo","ㅞ":"we","ㅟ":"wi","ㅠ":"yu","ㅡ":"eu","ㅢ":"ui","ㅣ":"i",
}
_ROMANIZE_FINAL = {
    "":"","ㄱ":"k","ㄲ":"k","ㄳ":"k","ㄴ":"n","ㄵ":"n","ㄶ":"n","ㄷ":"t",
    "ㄹ":"l","ㄺ":"k","ㄻ":"m","ㄼ":"l","ㄽ":"l","ㄾ":"l","ㄿ":"p","ㅀ":"l",
    "ㅁ":"m","ㅂ":"p","ㅄ":"p","ㅅ":"t","ㅆ":"t","ㅇ":"ng","ㅈ":"t","ㅊ":"t",
    "ㅋ":"k","ㅌ":"t","ㅍ":"p","ㅎ":"t",
}


def _romanize_block(initial: str, medial: str, final: str) -> str:
    return (_ROMANIZE_INITIAL.get(initial, "")
            + _ROMANIZE_MEDIAL.get(medial, "")
            + _ROMANIZE_FINAL.get(final, ""))


def romanize_word(word: str) -> str:
    """Best-effort RR romanization of a Korean word (no morphophonemic rules)."""
    parts: List[str] = []
    for ch in word:
        d = decompose_syllable(ch)
        if d:
            parts.append(d["romanization"])
        else:
            parts.append(ch)
    return "".join(parts)


# Curated seed blocks for the trainer (50 common syllables).
_SEED_SYLLABLES: List[Tuple[str, str, str, str]] = [
    # (initial, medial, final, meaning_hint)
    ("ㄱ","ㅏ","",   "ga"),
    ("ㄴ","ㅏ","",   "na — I"),
    ("ㄷ","ㅏ","",   "da"),
    ("ㄹ","ㅏ","",   "ra"),
    ("ㅁ","ㅏ","",   "ma"),
    ("ㅂ","ㅏ","",   "ba"),
    ("ㅅ","ㅏ","",   "sa — buy"),
    ("ㅇ","ㅏ","",   "a"),
    ("ㅈ","ㅏ","",   "ja"),
    ("ㄱ","ㅗ","",   "go"),
    ("ㅎ","ㅏ","",   "ha — do"),
    ("ㅎ","ㅏ","ㄴ", "han — one / Korea"),
    ("ㄱ","ㅡ","ㄹ", "geul — writing"),
    ("ㅎ","ㅏ","ㄴ", "han"),
    ("ㄱ","ㅡ","ㄱ", "guk — country"),
    ("ㅁ","ㅏ","ㄹ", "mal — speech"),
    ("ㅅ","ㅏ","ㄴ", "san — mountain"),
    ("ㅁ","ㅜ","ㄹ", "mul — water"),
    ("ㅂ","ㅏ","ㅂ", "bap — rice"),
    ("ㅈ","ㅣ","ㅂ", "jip — house"),
    ("ㅅ","ㅏ","ㄹ", "sal — flesh"),
    ("ㅁ","ㅗ","ㄱ", "mok — neck"),
    ("ㅈ","ㅏ","ㄱ", "jak — small"),
    ("ㅇ","ㅣ","ㄹ", "il — one / work"),
    ("ㅅ","ㅣ","",   "si — city"),
    ("ㄱ","ㅗ","ㅇ", "gong — ball"),
    ("ㅇ","ㅏ","ㄹ", "al — egg"),
    ("ㅂ","ㅏ","ㅁ", "bam — night"),
    ("ㅈ","ㅏ","ㅂ", "jap — catch"),
    ("ㅂ","ㅗ","",   "bo — see"),
    ("ㅅ","ㅗ","",   "so — cow"),
    ("ㅇ","ㅗ","",   "o — five"),
    ("ㄱ","ㅏ","ㄴ", "gan — interval"),
    ("ㄴ","ㅏ","ㄹ", "nal — day"),
    ("ㅁ","ㅏ","ㅁ", "mam — heart"),
    ("ㅎ","ㅡ","ㄱ", "heuk — soil"),
    ("ㅍ","ㅏ","",   "pa — green onion"),
    ("ㅌ","ㅏ","",   "ta — ride"),
    ("ㅊ","ㅏ","",   "cha — tea / car"),
    ("ㅋ","ㅏ","",   "ka"),
    ("ㄱ","ㅏ","ㅁ", "gam — persimmon"),
    ("ㅂ","ㅓ","ㅅ", "beot — friend"),
    ("ㄱ","ㅗ","ㅁ", "gom — bear"),
    ("ㄴ","ㅜ","ㄴ", "nun — eye / snow"),
    ("ㅁ","ㅓ","ㄴ", "meon — far"),
    ("ㅈ","ㅓ","ㅁ", "jeom — point"),
    ("ㅎ","ㅗ","ㅇ", "hong — red"),
    ("ㅂ","ㅏ","ㅇ", "bang — room"),
    ("ㅅ","ㅏ","ㅇ", "sang — table / award"),
    ("ㅇ","ㅏ","ㅇ", "ang — '-ang' suffix"),
]


def get_seed_syllables() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for i, m, f, hint in _SEED_SYLLABLES:
        block = compose_syllable(i, m, f)
        if not block:
            continue
        items.append({
            "block": block, "initial": i, "medial": m, "final": f,
            "romanization": _romanize_block(i, m, f),
            "hint": hint,
        })
    return items


# ═══════════════════════════════════════════════════════════════════════════════
# 3 — Batchim & Pronunciation
# ═══════════════════════════════════════════════════════════════════════════════
# In Korean, multiple final-consonant jamo collapse to one of 7 sounds:
# ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ. This is the heart of batchim pronunciation.

_BATCHIM_GROUPS: List[Dict[str, Any]] = [
    {"sound": "ㄱ", "name": "k-group",
     "jamo_set": ["ㄱ","ㄲ","ㅋ","ㄳ","ㄺ"],
     "explanation": {
        "en": "All these finals sound like /k/ (unreleased). e.g. 책 (chaek 'book') ends in /k/.",
        "es": "Todos estos finales suenan como /k/ (no liberado). p.ej. 책 (chaek 'libro') termina en /k/.",
        "no": "Alle disse endingene høres ut som /k/ (uavslutta). f.eks. 책 (chaek 'bok') ender på /k/."},
     "examples": [
         {"hangul":"책","rom":"chaek","mean":"book"},
         {"hangul":"부엌","rom":"bueok","mean":"kitchen"},
         {"hangul":"한국","rom":"hanguk","mean":"Korea"},
     ]},
    {"sound": "ㄴ", "name": "n-group",
     "jamo_set": ["ㄴ","ㄵ","ㄶ"],
     "explanation": {
        "en": "All sound like /n/.",
        "es": "Todos suenan como /n/.",
        "no": "Alle høres ut som /n/."},
     "examples": [
         {"hangul":"눈","rom":"nun","mean":"eye / snow"},
         {"hangul":"산","rom":"san","mean":"mountain"},
         {"hangul":"안","rom":"an","mean":"inside"},
     ]},
    {"sound": "ㄷ", "name": "t-group",
     "jamo_set": ["ㄷ","ㅅ","ㅆ","ㅈ","ㅊ","ㅌ","ㅎ"],
     "explanation": {
        "en": "Seven different jamo all collapse to the same /t/ (unreleased) sound at the end of a syllable. This is the largest batchim group.",
        "es": "Siete jamo diferentes colapsan al mismo sonido /t/ (no liberado) al final de sílaba. Es el mayor grupo batchim.",
        "no": "Syv ulike jamo kollapser til samme /t/-lyd (uavslutta) på slutten av en stavelse. Den største batchim-gruppen."},
     "examples": [
         {"hangul":"옷","rom":"ot","mean":"clothes"},
         {"hangul":"낮","rom":"nat","mean":"daytime"},
         {"hangul":"빛","rom":"bit","mean":"light"},
         {"hangul":"있다","rom":"itda","mean":"to be (exist)"},
     ]},
    {"sound": "ㄹ", "name": "l-group",
     "jamo_set": ["ㄹ","ㄼ","ㄽ","ㄾ","ㅀ"],
     "explanation": {
        "en": "All sound like /l/ at the end of a syllable.",
        "es": "Todos suenan como /l/ al final de sílaba.",
        "no": "Alle høres ut som /l/ på slutten av en stavelse."},
     "examples": [
         {"hangul":"물","rom":"mul","mean":"water"},
         {"hangul":"말","rom":"mal","mean":"speech / horse"},
         {"hangul":"길","rom":"gil","mean":"road"},
     ]},
    {"sound": "ㅁ", "name": "m-group",
     "jamo_set": ["ㅁ","ㄻ"],
     "explanation": {
        "en": "Both sound like /m/.",
        "es": "Ambos suenan como /m/.",
        "no": "Begge høres ut som /m/."},
     "examples": [
         {"hangul":"밤","rom":"bam","mean":"night"},
         {"hangul":"이름","rom":"ireum","mean":"name"},
     ]},
    {"sound": "ㅂ", "name": "p-group",
     "jamo_set": ["ㅂ","ㅍ","ㄿ","ㅄ"],
     "explanation": {
        "en": "All sound like /p/ (unreleased).",
        "es": "Todos suenan como /p/ (no liberado).",
        "no": "Alle høres ut som /p/ (uavslutta)."},
     "examples": [
         {"hangul":"밥","rom":"bap","mean":"rice"},
         {"hangul":"입","rom":"ip","mean":"mouth"},
         {"hangul":"잎","rom":"ip","mean":"leaf"},
     ]},
    {"sound": "ㅇ", "name": "ng-group",
     "jamo_set": ["ㅇ"],
     "explanation": {
        "en": "Only ㅇ produces the /ŋ/ sound (as in English 'sing') at the end of a syllable. As an initial it's silent.",
        "es": "Solo ㅇ produce el sonido /ŋ/ (como en inglés 'sing') al final de sílaba. Como inicial es silencioso.",
        "no": "Bare ㅇ gir /ŋ/-lyden (som i engelsk 'sing') på slutten av en stavelse. Som initial er den stum."},
     "examples": [
         {"hangul":"강","rom":"gang","mean":"river"},
         {"hangul":"방","rom":"bang","mean":"room"},
         {"hangul":"한국","rom":"hanguk","mean":"Korea"},
     ]},
]

# Sound change rules — V1 covers the most common
_SOUND_CHANGES: List[Dict[str, Any]] = [
    {"id":"linking","title":{
        "en":"Linking (연음)","es":"Enlace (연음)","no":"Sammenbinding (연음)"},
     "rule":{
        "en":"When a syllable ending in a batchim is followed by a syllable starting with ㅇ, the batchim 'moves' to the next syllable: 한국어 → han-gu-geo (not han-guk-eo).",
        "es":"Cuando una sílaba con batchim va seguida de una sílaba que empieza por ㅇ, el batchim 'salta' a la siguiente: 한국어 → han-gu-geo (no han-guk-eo).",
        "no":"Når en stavelse med batchim følges av en stavelse som begynner med ㅇ, 'hopper' batchim til neste stavelse: 한국어 → han-gu-geo (ikke han-guk-eo)."},
     "examples":[
        {"written":"한국어","spoken":"한구거","rom":"hangugeo"},
        {"written":"음악","spoken":"으막","rom":"eumak"},
     ]},
    {"id":"nasalisation","title":{
        "en":"Nasalisation (비음화)","es":"Nasalización (비음화)","no":"Nasalisering (비음화)"},
     "rule":{
        "en":"ㄱ/ㄷ/ㅂ before ㄴ/ㅁ becomes ㅇ/ㄴ/ㅁ. e.g. 학년 sounds like 항년 (hangnyeon).",
        "es":"ㄱ/ㄷ/ㅂ ante ㄴ/ㅁ se convierte en ㅇ/ㄴ/ㅁ. p.ej. 학년 suena como 항년 (hangnyeon).",
        "no":"ㄱ/ㄷ/ㅂ foran ㄴ/ㅁ blir til ㅇ/ㄴ/ㅁ. f.eks. 학년 høres ut som 항년 (hangnyeon)."},
     "examples":[
        {"written":"학년","spoken":"항년","rom":"hangnyeon"},
        {"written":"입니다","spoken":"임니다","rom":"imnida"},
     ]},
    {"id":"aspiration","title":{
        "en":"Aspiration (격음화)","es":"Aspiración (격음화)","no":"Aspirering (격음화)"},
     "rule":{
        "en":"ㅎ + ㄱ/ㄷ/ㅂ/ㅈ becomes ㅋ/ㅌ/ㅍ/ㅊ. e.g. 좋다 → 조타 (jota).",
        "es":"ㅎ + ㄱ/ㄷ/ㅂ/ㅈ se convierte en ㅋ/ㅌ/ㅍ/ㅊ. p.ej. 좋다 → 조타 (jota).",
        "no":"ㅎ + ㄱ/ㄷ/ㅂ/ㅈ blir til ㅋ/ㅌ/ㅍ/ㅊ. f.eks. 좋다 → 조타 (jota)."},
     "examples":[
        {"written":"좋다","spoken":"조타","rom":"jota"},
        {"written":"백화점","spoken":"배콰점","rom":"baekhwajeom"},
     ]},
]


def get_batchim_deck() -> Dict[str, Any]:
    return {
        "groups": _BATCHIM_GROUPS,
        "sound_changes": _SOUND_CHANGES,
        "count_groups": len(_BATCHIM_GROUPS),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 4 — Vocabulary (150 TOPIK1 words)
# ═══════════════════════════════════════════════════════════════════════════════
# Tuples: (hangul, romanization, meaning_en, meaning_es, meaning_no, tags, hanja|None)

_VOCAB_TUPLES = [
    # Greetings
    ("안녕하세요","annyeonghaseyo","hello (polite)","hola (formal)","hei (høflig)",["greeting"], None),
    ("안녕","annyeong","hi","hola","hei",["greeting"], None),
    ("감사합니다","gamsahamnida","thank you (formal)","gracias (formal)","tusen takk",["greeting"], "感謝"),
    ("고마워요","gomawoyo","thanks","gracias","takk",["greeting"], None),
    ("죄송합니다","joesonghamnida","I'm sorry (formal)","lo siento (formal)","beklager (formelt)",["greeting"], "罪悚"),
    ("미안해요","mianhaeyo","sorry","perdón","unnskyld",["greeting"], None),
    ("괜찮아요","gwaenchanayo","it's OK","está bien","det går bra",["greeting"], None),
    ("처음 뵙겠습니다","cheoeum boepgetseumnida","nice to meet you","encantado","hyggelig å møte deg",["greeting"], None),
    ("안녕히 가세요","annyeonghi gaseyo","goodbye (to one leaving)","adiós (al que se va)","ha det",["greeting"], None),
    ("안녕히 계세요","annyeonghi gyeseyo","goodbye (to one staying)","adiós (al que se queda)","ha det",["greeting"], None),
    # Pronouns
    ("저","jeo","I (humble)","yo (humilde)","jeg (ydmyk)",["pronoun"], None),
    ("나","na","I (casual)","yo (casual)","jeg (uformell)",["pronoun"], None),
    ("당신","dangsin","you (formal/intimate)","tú (formal/íntimo)","du (formelt/intimt)",["pronoun"], "當身"),
    ("너","neo","you (casual)","tú (casual)","du (uformell)",["pronoun"], None),
    ("우리","uri","we / our","nosotros / nuestro","vi / vår",["pronoun"], None),
    ("그","geu","he / that","él / ese","han / den",["pronoun"], None),
    ("그녀","geunyeo","she","ella","hun",["pronoun"], None),
    # Question words
    ("뭐","mwo","what (casual)","qué (casual)","hva (uformell)",["question"], None),
    ("무엇","mueot","what","qué","hva",["question"], None),
    ("누구","nugu","who","quién","hvem",["question"], None),
    ("어디","eodi","where","dónde","hvor",["question"], None),
    ("언제","eonje","when","cuándo","når",["question"], None),
    ("왜","wae","why","por qué","hvorfor",["question"], None),
    ("어떻게","eotteoke","how","cómo","hvordan",["question"], None),
    ("얼마","eolma","how much","cuánto","hvor mye",["question"], None),
    ("몇","myeot","how many","cuántos","hvor mange",["question"], None),
    # Numbers (sino-Korean)
    ("일","il","one (sino)","uno (sino)","en (sino)",["number","sino"], "一"),
    ("이","i","two (sino)","dos (sino)","to (sino)",["number","sino"], "二"),
    ("삼","sam","three (sino)","tres (sino)","tre (sino)",["number","sino"], "三"),
    ("사","sa","four (sino)","cuatro (sino)","fire (sino)",["number","sino"], "四"),
    ("오","o","five (sino)","cinco (sino)","fem (sino)",["number","sino"], "五"),
    ("육","yuk","six (sino)","seis (sino)","seks (sino)",["number","sino"], "六"),
    ("칠","chil","seven (sino)","siete (sino)","syv (sino)",["number","sino"], "七"),
    ("팔","pal","eight (sino)","ocho (sino)","åtte (sino)",["number","sino"], "八"),
    ("구","gu","nine (sino)","nueve (sino)","ni (sino)",["number","sino"], "九"),
    ("십","sip","ten (sino)","diez (sino)","ti (sino)",["number","sino"], "十"),
    ("백","baek","hundred (sino)","cien (sino)","hundre (sino)",["number","sino"], "百"),
    ("천","cheon","thousand (sino)","mil (sino)","tusen (sino)",["number","sino"], "千"),
    # Numbers (native Korean)
    ("하나","hana","one (native)","uno (nativo)","en (innfødt)",["number","native"], None),
    ("둘","dul","two (native)","dos (nativo)","to (innfødt)",["number","native"], None),
    ("셋","set","three (native)","tres (nativo)","tre (innfødt)",["number","native"], None),
    ("넷","net","four (native)","cuatro (nativo)","fire (innfødt)",["number","native"], None),
    ("다섯","daseot","five (native)","cinco (nativo)","fem (innfødt)",["number","native"], None),
    ("여섯","yeoseot","six (native)","seis (nativo)","seks (innfødt)",["number","native"], None),
    ("일곱","ilgop","seven (native)","siete (nativo)","syv (innfødt)",["number","native"], None),
    ("여덟","yeodeol","eight (native)","ocho (nativo)","åtte (innfødt)",["number","native"], None),
    ("아홉","ahop","nine (native)","nueve (nativo)","ni (innfødt)",["number","native"], None),
    ("열","yeol","ten (native)","diez (nativo)","ti (innfødt)",["number","native"], None),
    # Family
    ("가족","gajok","family","familia","familie",["family"], "家族"),
    ("아버지","abeoji","father","padre","far",["family"], None),
    ("어머니","eomeoni","mother","madre","mor",["family"], None),
    ("아빠","appa","dad","papá","pappa",["family"], None),
    ("엄마","eomma","mum","mamá","mamma",["family"], None),
    ("형","hyeong","older brother (of male)","hermano mayor (de hombre)","eldre bror (av mann)",["family"], None),
    ("오빠","oppa","older brother (of female)","hermano mayor (de mujer)","eldre bror (av kvinne)",["family"], None),
    ("누나","nuna","older sister (of male)","hermana mayor (de hombre)","eldre søster (av mann)",["family"], None),
    ("언니","eonni","older sister (of female)","hermana mayor (de mujer)","eldre søster (av kvinne)",["family"], None),
    ("동생","dongsaeng","younger sibling","hermano menor","yngre søsken",["family"], "同生"),
    ("아들","adeul","son","hijo","sønn",["family"], None),
    ("딸","ttal","daughter","hija","datter",["family"], None),
    # People
    ("사람","saram","person","persona","person",["people"], None),
    ("친구","chingu","friend","amigo","venn",["people"], "親舊"),
    ("선생님","seonsaengnim","teacher","profesor","lærer",["people"], "先生"),
    ("학생","haksaeng","student","estudiante","student",["people"], "學生"),
    ("의사","uisa","doctor","médico","lege",["people"], "醫師"),
    ("이름","ireum","name","nombre","navn",["people"], None),
    # Places
    ("집","jip","house","casa","hus",["place"], None),
    ("학교","hakgyo","school","escuela","skole",["place"], "學校"),
    ("한국","hanguk","Korea","Corea","Korea",["place"], "韓國"),
    ("서울","seoul","Seoul","Seúl","Seoul",["place"], None),
    ("가게","gage","shop","tienda","butikk",["place"], None),
    ("식당","sikdang","restaurant","restaurante","restaurant",["place"], "食堂"),
    ("회사","hoesa","company","empresa","selskap",["place"], "會社"),
    ("나라","nara","country","país","land",["place"], None),
    # Food
    ("물","mul","water","agua","vann",["food"], None),
    ("차","cha","tea","té","te",["food"], "茶"),
    ("커피","keopi","coffee","café","kaffe",["food"], None),
    ("밥","bap","cooked rice / meal","arroz / comida","kokt ris / måltid",["food"], None),
    ("김치","gimchi","kimchi","kimchi","kimchi",["food"], None),
    ("불고기","bulgogi","bulgogi","bulgogi","bulgogi",["food"], None),
    ("비빔밥","bibimbap","bibimbap","bibimbap","bibimbap",["food"], None),
    ("라면","ramyeon","ramyeon","ramyeon","ramyeon",["food"], None),
    ("빵","ppang","bread","pan","brød",["food"], None),
    ("과일","gwail","fruit","fruta","frukt",["food"], None),
    ("고기","gogi","meat","carne","kjøtt",["food"], None),
    # Verbs (dictionary form -다)
    ("이다","ida","to be","ser","å være",["verb"], None),
    ("있다","itda","to exist / have","existir / tener","å være / ha",["verb"], None),
    ("없다","eopda","to not exist / not have","no existir / no tener","ikke være / ikke ha",["verb"], None),
    ("가다","gada","to go","ir","å gå",["verb"], None),
    ("오다","oda","to come","venir","å komme",["verb"], None),
    ("하다","hada","to do","hacer","å gjøre",["verb"], None),
    ("보다","boda","to see","ver","å se",["verb"], None),
    ("듣다","deutda","to listen","escuchar","å lytte",["verb"], None),
    ("말하다","malhada","to speak","hablar","å snakke",["verb"], None),
    ("먹다","meokda","to eat","comer","å spise",["verb"], None),
    ("마시다","masida","to drink","beber","å drikke",["verb"], None),
    ("자다","jada","to sleep","dormir","å sove",["verb"], None),
    ("일어나다","ireonada","to get up","levantarse","å stå opp",["verb"], None),
    ("사다","sada","to buy","comprar","å kjøpe",["verb"], None),
    ("팔다","palda","to sell","vender","å selge",["verb"], None),
    ("공부하다","gongbuhada","to study","estudiar","å studere",["verb"], "工夫"),
    ("일하다","ilhada","to work","trabajar","å jobbe",["verb"], None),
    ("쉬다","swida","to rest","descansar","å hvile",["verb"], None),
    ("좋아하다","joahada","to like","gustar","å like",["verb"], None),
    ("사랑하다","saranghada","to love","amar","å elske",["verb"], None),
    ("알다","alda","to know","saber","å vite",["verb"], None),
    ("모르다","moreuda","to not know","no saber","ikke å vite",["verb"], None),
    ("배우다","baeuda","to learn","aprender","å lære",["verb"], None),
    ("가르치다","gareuchida","to teach","enseñar","å lære bort",["verb"], None),
    # Adjectives (dictionary form -다)
    ("좋다","jota","good","bueno","god",["adj"], None),
    ("나쁘다","nappeuda","bad","malo","dårlig",["adj"], None),
    ("크다","keuda","big","grande","stor",["adj"], None),
    ("작다","jakda","small","pequeño","liten",["adj"], None),
    ("많다","manta","many","mucho","mange",["adj"], None),
    ("적다","jeokda","few","poco","få",["adj"], None),
    ("덥다","deopda","hot","caliente","varm",["adj"], None),
    ("춥다","chupda","cold","frío","kald",["adj"], None),
    ("높다","nopda","high","alto","høy",["adj"], None),
    ("낮다","natda","low","bajo","lav",["adj"], None),
    ("빠르다","ppareuda","fast","rápido","rask",["adj"], None),
    ("느리다","neurida","slow","lento","sakte",["adj"], None),
    ("비싸다","bissada","expensive","caro","dyr",["adj"], None),
    ("싸다","ssada","cheap","barato","billig",["adj"], None),
    ("예쁘다","yeppeuda","pretty","bonito","pen",["adj"], None),
    ("재미있다","jaemiitda","interesting / fun","interesante / divertido","interessant / morsom",["adj"], None),
    # Time
    ("오늘","oneul","today","hoy","i dag",["time"], None),
    ("어제","eoje","yesterday","ayer","i går",["time"], None),
    ("내일","naeil","tomorrow","mañana","i morgen",["time"], "來日"),
    ("지금","jigeum","now","ahora","nå",["time"], "只今"),
    ("년","nyeon","year","año","år",["time"], "年"),
    ("월","wol","month","mes","måned",["time"], "月"),
    ("일","il","day","día","dag",["time"], "日"),
    ("시","si","hour","hora","time",["time"], "時"),
    ("분","bun","minute","minuto","minutt",["time"], "分"),
    ("주","ju","week","semana","uke",["time"], "週"),
    # Particles & connectors
    ("은","eun","topic (after consonant)","tópico (tras consonante)","tema (etter konsonant)",["particle"], None),
    ("는","neun","topic (after vowel)","tópico (tras vocal)","tema (etter vokal)",["particle"], None),
    ("이","i","subject (after consonant)","sujeto (tras consonante)","subjekt (etter konsonant)",["particle"], None),
    ("가","ga","subject (after vowel)","sujeto (tras vocal)","subjekt (etter vokal)",["particle"], None),
    ("을","eul","object (after consonant)","objeto (tras consonante)","objekt (etter konsonant)",["particle"], None),
    ("를","reul","object (after vowel)","objeto (tras vocal)","objekt (etter vokal)",["particle"], None),
    ("에","e","at / to","en / a","på / til",["particle"], None),
    ("에서","eseo","at / from (action)","en / desde (acción)","på / fra (handling)",["particle"], None),
    ("도","do","also","también","også",["particle"], None),
    ("의","ui","possessive","posesivo","eierskap",["particle"], None),
    ("와","wa","and / with (after vowel)","y / con (tras vocal)","og / med (etter vokal)",["particle"], None),
    ("과","gwa","and / with (after consonant)","y / con (tras consonante)","og / med (etter konsonant)",["particle"], None),
    # Demonstratives
    ("이","i","this","este","denne",["demon"], None),
    ("그","geu","that","ese","den",["demon"], None),
    ("저","jeo","that (over there)","aquel","den der borte",["demon"], None),
    ("이것","igeot","this thing","esta cosa","denne tingen",["demon"], None),
    ("그것","geugeot","that thing","esa cosa","den tingen",["demon"], None),
    ("저것","jeogeot","that thing (over there)","aquella cosa","den tingen der borte",["demon"], None),
    # Body
    ("손","son","hand","mano","hånd",["body"], "手"),
    ("발","bal","foot","pie","fot",["body"], None),
    ("눈","nun","eye","ojo","øye",["body"], None),
    ("입","ip","mouth","boca","munn",["body"], None),
    ("귀","gwi","ear","oreja","øre",["body"], None),
    # Transport / objects
    ("자동차","jadongcha","car","coche","bil",["object"], "自動車"),
    ("기차","gicha","train","tren","tog",["object"], "汽車"),
    ("버스","beoseu","bus","autobús","buss",["object"], None),
    ("지하철","jihacheol","subway","metro","t-bane",["object"], "地下鐵"),
    ("전화","jeonhwa","telephone","teléfono","telefon",["object"], "電話"),
    ("책","chaek","book","libro","bok",["object"], "冊"),
    ("돈","don","money","dinero","penger",["object"], None),
    ("컴퓨터","keompyuteo","computer","ordenador","datamaskin",["object"], None),
    # Weather
    ("날씨","nalssi","weather","tiempo","vær",["weather"], None),
    ("비","bi","rain","lluvia","regn",["weather"], None),
    ("눈","nun","snow","nieve","snø",["weather"], None),
    # Languages
    ("한국어","hangugeo","Korean (language)","coreano","koreansk",["language"], "韓國語"),
    ("영어","yeongeo","English (language)","inglés","engelsk",["language"], "英語"),
    ("스페인어","seupeineo","Spanish (language)","español","spansk",["language"], None),
    ("일본어","ilboneo","Japanese (language)","japonés","japansk",["language"], "日本語"),
    ("중국어","junggugeo","Chinese (language)","chino","kinesisk",["language"], "中國語"),
    # Misc
    ("네","ne","yes","sí","ja",["adv"], None),
    ("아니요","aniyo","no","no","nei",["adv"], None),
    ("많이","mani","a lot","mucho","mye",["adv"], None),
    ("조금","jogeum","a little","un poco","litt",["adv"], None),
    ("아주","aju","very","muy","veldig",["adv"], None),
    ("정말","jeongmal","really","de verdad","virkelig",["adv"], None),
]

_VOCAB: List[Dict[str, Any]] = []
for i, t in enumerate(_VOCAB_TUPLES):
    hangul, rom, en, es, no, tags, hanja = t
    _VOCAB.append({
        "id": f"topik1_{i+1:03d}",
        "hangul": hangul,
        "romanization": rom,
        "meaning": {"en": en, "es": es, "no": no},
        "level": "TOPIK1",
        "tags": tags,
        "hanja": hanja,
    })

_VOCAB_MAP = {v["id"]: v for v in _VOCAB}


def get_vocab_all() -> List[Dict[str, Any]]:
    return _VOCAB


# ═══════════════════════════════════════════════════════════════════════════════
# 5 — SRS (SM-2 inspired, same pattern as Japanese/Chinese)
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


async def _vocab_known_count(user_id: str = DEFAULT_USER) -> int:
    if _SRS_COL is None:
        return 0
    try:
        return await _SRS_COL.count_documents({"user_id": user_id, "stage": {"$gte": 3}})
    except Exception:
        return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 6 — Grammar Path (12 TOPIK1 points)
# ═══════════════════════════════════════════════════════════════════════════════

_GRAMMAR: List[Dict[str, Any]] = [
    {"id":"g1","topik":"TOPIK1","title":"이다 / 입니다 — to be",
     "pattern":"Noun + 이다 (casual) / 입니다 (polite-formal) / 이에요 ~ 예요 (polite-informal)",
     "explanation":{
        "en":"이다 is the copula 'to be' for nouns. Three politeness levels: 입니다 (polite-formal) is for business/initial meetings; 이에요/예요 (polite-informal) is the default conversational form. 예요 follows a vowel, 이에요 follows a consonant.",
        "es":"이다 es la cópula 'ser' para sustantivos. Tres niveles de cortesía: 입니다 (cortés-formal) para negocios/primer encuentro; 이에요/예요 (cortés-informal) es el habla diaria. 예요 tras vocal, 이에요 tras consonante.",
        "no":"이다 er kopulaen 'å være' for substantiv. Tre høflighetsnivåer: 입니다 (høflig-formelt) for forretninger/første møte; 이에요/예요 (høflig-uformelt) er hverdagstale. 예요 etter vokal, 이에요 etter konsonant."},
     "examples":[
        {"hangul":"저는 학생입니다.","rom":"jeoneun haksaengimnida.","en":"I am a student. (formal)","es":"Soy estudiante. (formal)","no":"Jeg er student. (formelt)"},
        {"hangul":"저는 Ignacio예요.","rom":"jeoneun Ignacio-yeyo.","en":"I am Ignacio.","es":"Soy Ignacio.","no":"Jeg er Ignacio."}],
     "commonMistake":{
        "en":"Don't use 입니다 for everyday conversation — it sounds stiff. Use 예요/이에요 with friends and family.",
        "es":"No uses 입니다 en conversación cotidiana — suena rígido. Usa 예요/이에요 con amigos y familia.",
        "no":"Ikke bruk 입니다 i daglig samtale — det høres stivt ut. Bruk 예요/이에요 med venner og familie."}},

    {"id":"g2","topik":"TOPIK1","title":"은/는 — topic particle",
     "pattern":"Noun ending in consonant + 은  |  Noun ending in vowel + 는",
     "explanation":{
        "en":"Marks the TOPIC of a sentence (what we're talking about). Contrasts with 이/가 (subject). Use 은 after a consonant, 는 after a vowel.",
        "es":"Marca el TÓPICO de la oración (de qué hablamos). Contrasta con 이/가 (sujeto). Usa 은 tras consonante, 는 tras vocal.",
        "no":"Markerer TEMAET i setningen (hva vi snakker om). Står i kontrast til 이/가 (subjekt). Bruk 은 etter konsonant, 는 etter vokal."},
     "examples":[
        {"hangul":"저는 한국 사람이에요.","rom":"jeoneun hanguk saramieyo.","en":"As for me, I'm Korean.","es":"En cuanto a mí, soy coreano.","no":"Hva meg angår, jeg er koreaner."},
        {"hangul":"이 책은 재미있어요.","rom":"i chaegeun jaemiisseoyo.","en":"This book is fun.","es":"Este libro es divertido.","no":"Denne boken er morsom."}],
     "commonMistake":{
        "en":"은/는 introduces a topic; 이/가 picks out a specific subject. 'I am the student' (specifically me) uses 가; 'As for me, I'm a student' uses 는.",
        "es":"은/는 introduce un tópico; 이/가 destaca un sujeto específico. 'Soy yo el estudiante' usa 가; 'En cuanto a mí, soy estudiante' usa 는.",
        "no":"은/는 introduserer et tema; 이/가 plukker ut et spesifikt subjekt."}},

    {"id":"g3","topik":"TOPIK1","title":"이/가 — subject particle",
     "pattern":"Noun ending in consonant + 이  |  Noun ending in vowel + 가",
     "explanation":{
        "en":"Marks the grammatical SUBJECT of a sentence, often introducing new information or answering 'who/what?'. 이 follows a consonant, 가 follows a vowel.",
        "es":"Marca el SUJETO gramatical de la oración, a menudo presentando información nueva o respondiendo a '¿quién/qué?'. 이 tras consonante, 가 tras vocal.",
        "no":"Markerer det grammatiske SUBJEKTET i setningen, ofte introduserer ny informasjon. 이 etter konsonant, 가 etter vokal."},
     "examples":[
        {"hangul":"누가 와요?","rom":"nuga wayo?","en":"Who is coming?","es":"¿Quién viene?","no":"Hvem kommer?"},
        {"hangul":"친구가 와요.","rom":"chinguga wayo.","en":"A friend is coming.","es":"Viene un amigo.","no":"En venn kommer."}],
     "commonMistake":{
        "en":"누구 + 가 contracts to 누가 (not 누구가).",
        "es":"누구 + 가 se contrae a 누가 (no 누구가).",
        "no":"누구 + 가 trekkes sammen til 누가 (ikke 누구가)."}},

    {"id":"g4","topik":"TOPIK1","title":"을/를 — object particle",
     "pattern":"Noun ending in consonant + 을  |  Noun ending in vowel + 를",
     "explanation":{
        "en":"Marks the direct OBJECT of an action verb. 을 after consonant, 를 after vowel. Often dropped in casual speech, kept for clarity in formal speech.",
        "es":"Marca el OBJETO directo de un verbo de acción. 을 tras consonante, 를 tras vocal. Se omite a menudo en lengua casual.",
        "no":"Markerer det direkte OBJEKTET til et handlingsverb. 을 etter konsonant, 를 etter vokal. Ofte droppet i uformell tale."},
     "examples":[
        {"hangul":"저는 책을 읽어요.","rom":"jeoneun chaegeul ilgeoyo.","en":"I read a book.","es":"Leo un libro.","no":"Jeg leser en bok."},
        {"hangul":"저는 커피를 마셔요.","rom":"jeoneun keopireul masyeoyo.","en":"I drink coffee.","es":"Bebo café.","no":"Jeg drikker kaffe."}],
     "commonMistake":{
        "en":"In casual speech 을/를 are often dropped: 밥 먹어요 instead of 밥을 먹어요.",
        "es":"En lengua casual se omiten a menudo 을/를: 밥 먹어요 en vez de 밥을 먹어요.",
        "no":"I uformell tale droppes ofte 을/를: 밥 먹어요 i stedet for 밥을 먹어요."}},

    {"id":"g5","topik":"TOPIK1","title":"에 — location / direction",
     "pattern":"Place/time + 에",
     "explanation":{
        "en":"Marks static location ('at home') or direction ('to school'). Also marks time ('at 3 o'clock').",
        "es":"Marca ubicación estática ('en casa') o dirección ('a la escuela'). También marca tiempo ('a las 3').",
        "no":"Markerer statisk sted ('hjemme'), retning ('til skolen'), eller tid ('klokken 3')."},
     "examples":[
        {"hangul":"저는 집에 있어요.","rom":"jeoneun jibe isseoyo.","en":"I'm at home.","es":"Estoy en casa.","no":"Jeg er hjemme."},
        {"hangul":"학교에 가요.","rom":"hakgyoe gayo.","en":"I'm going to school.","es":"Voy a la escuela.","no":"Jeg går til skolen."}],
     "commonMistake":{
        "en":"에 is for static location and destination. For the LOCATION OF AN ACTION ('I eat AT the restaurant'), use 에서.",
        "es":"에 es para ubicación estática y destino. Para LUGAR DE UNA ACCIÓN ('como EN el restaurante'), usa 에서.",
        "no":"에 er for statisk sted og destinasjon. For HANDLINGSSTED ('jeg spiser PÅ restauranten'), bruk 에서."}},

    {"id":"g6","topik":"TOPIK1","title":"에서 — at (action) / from",
     "pattern":"Place + 에서 + action verb",
     "explanation":{
        "en":"Marks the location where an action happens, or origin/starting point ('from'). Pairs with action verbs (eat, work, study).",
        "es":"Marca el lugar donde sucede una acción, o el origen ('desde'). Va con verbos de acción (comer, trabajar, estudiar).",
        "no":"Markerer stedet der en handling skjer, eller opprinnelse ('fra'). Brukes med handlingsverb."},
     "examples":[
        {"hangul":"식당에서 밥을 먹어요.","rom":"sikdangeseo babeul meogeoyo.","en":"I eat at a restaurant.","es":"Como en un restaurante.","no":"Jeg spiser på en restaurant."},
        {"hangul":"저는 스페인에서 왔어요.","rom":"jeoneun seupeineseo wasseoyo.","en":"I come from Spain.","es":"Vengo de España.","no":"Jeg kommer fra Spania."}],
     "commonMistake":{
        "en":"With 있다 (to be/exist) use 에, NOT 에서: 집에 있어요 ✓ NOT 집에서 있어요 ✗",
        "es":"Con 있다 usa 에, NO 에서: 집에 있어요 ✓ NO 집에서 있어요 ✗",
        "no":"Med 있다 bruk 에, IKKE 에서: 집에 있어요 ✓ IKKE 집에서 있어요 ✗"}},

    {"id":"g7","topik":"TOPIK1","title":"있어요 / 없어요 — existence",
     "pattern":"Subject + 있어요 (exists / has) | Subject + 없어요 (doesn't exist / doesn't have)",
     "explanation":{
        "en":"있다 means both 'to exist' (there is) and 'to have' (I have). 없다 is its opposite. 있어요/없어요 are the polite-informal forms.",
        "es":"있다 significa 'existir / haber' y 'tener'. 없다 es lo opuesto. 있어요/없어요 son las formas cortés-informales.",
        "no":"있다 betyr 'å eksistere' (det finnes) og 'å ha'. 없다 er det motsatte. 있어요/없어요 er de høflig-uformelle formene."},
     "examples":[
        {"hangul":"저는 친구가 있어요.","rom":"jeoneun chinguga isseoyo.","en":"I have a friend.","es":"Tengo un amigo.","no":"Jeg har en venn."},
        {"hangul":"시간이 없어요.","rom":"sigani eopseoyo.","en":"I don't have time.","es":"No tengo tiempo.","no":"Jeg har ikke tid."}],
     "commonMistake":{
        "en":"있다 covers both English 'to have' and 'there is'. Korean uses the same verb for both senses.",
        "es":"있다 cubre tanto 'tener' como 'haber'. El coreano usa el mismo verbo para ambos.",
        "no":"있다 dekker både 'å ha' og 'det er'. Koreansk bruker samme verb for begge."}},

    {"id":"g8","topik":"TOPIK1","title":"-아요 / -어요 / -해요 — present polite",
     "pattern":"Verb stem + 아요 (if last vowel = ㅏ/ㅗ) / 어요 (others) / 해요 (하다 verbs)",
     "explanation":{
        "en":"The polite-informal present tense — the most common everyday ending. 해요 style. Vowel harmony rule: stems with last vowel ㅏ/ㅗ take 아요, others take 어요.",
        "es":"El presente cortés-informal — la terminación más común del día a día. Estilo 해요. Armonía vocálica: raíces con última vocal ㅏ/ㅗ toman 아요, las demás 어요.",
        "no":"Den høflig-uformelle presens — den vanligste hverdagsendelsen. 해요-stil."},
     "examples":[
        {"hangul":"저는 한국어를 배워요.","rom":"jeoneun hangugeoreul baewoyo.","en":"I learn Korean.","es":"Aprendo coreano.","no":"Jeg lærer koreansk."},
        {"hangul":"오늘 학교에 가요.","rom":"oneul hakgyoe gayo.","en":"I go to school today.","es":"Hoy voy a la escuela.","no":"Jeg går til skolen i dag."}],
     "commonMistake":{
        "en":"하다 verbs always become 해요 (not 하아요). 공부하다 → 공부해요, 일하다 → 일해요.",
        "es":"Verbos en 하다 siempre se vuelven 해요 (no 하아요). 공부하다 → 공부해요.",
        "no":"하다-verb blir alltid 해요. 공부하다 → 공부해요."}},

    {"id":"g9","topik":"TOPIK1","title":"-았어요 / -었어요 — past polite",
     "pattern":"Verb stem + 았어요 (ㅏ/ㅗ stem) / 었어요 (others) / 했어요 (하다)",
     "explanation":{
        "en":"The polite-informal past tense. Same vowel-harmony rule as the present. 하다 → 했어요.",
        "es":"El pasado cortés-informal. Misma regla de armonía vocálica que el presente. 하다 → 했어요.",
        "no":"Den høflig-uformelle fortid. Samme vokalharmoni-regel som presens."},
     "examples":[
        {"hangul":"어제 친구를 만났어요.","rom":"eoje chingureul mannasseoyo.","en":"I met a friend yesterday.","es":"Ayer me encontré con un amigo.","no":"I går møtte jeg en venn."},
        {"hangul":"한국어를 공부했어요.","rom":"hangugeoreul gongbuhaesseoyo.","en":"I studied Korean.","es":"Estudié coreano.","no":"Jeg studerte koreansk."}],
     "commonMistake":{
        "en":"Past tense in Korean is straightforward — there's no irregular conjugation list like in Spanish or English.",
        "es":"El pasado en coreano es directo — no hay lista de conjugaciones irregulares como en español o inglés.",
        "no":"Fortid på koreansk er rett frem — ingen lang liste med uregelmessige bøyninger."}},

    {"id":"g10","topik":"TOPIK1","title":"-(으)ㄹ 거예요 — future / probability",
     "pattern":"Verb stem + ㄹ 거예요 (after vowel) / 을 거예요 (after consonant)",
     "explanation":{
        "en":"Marks future tense or probability ('will / probably will'). Combines a 'future modifier' with 거예요 ('thing-is').",
        "es":"Marca futuro o probabilidad ('haré / probablemente haré'). Combina un 'modificador de futuro' con 거예요 ('cosa-es').",
        "no":"Markerer fremtid eller sannsynlighet ('vil / sannsynligvis vil')."},
     "examples":[
        {"hangul":"내일 학교에 갈 거예요.","rom":"naeil hakgyoe gal geoyeyo.","en":"I'll go to school tomorrow.","es":"Mañana iré a la escuela.","no":"I morgen skal jeg på skolen."},
        {"hangul":"비가 올 거예요.","rom":"biga ol geoyeyo.","en":"It will probably rain.","es":"Probablemente llueva.","no":"Det vil sannsynligvis regne."}],
     "commonMistake":{
        "en":"After ㄹ-final stems (살다 → live), use ㄹ 거예요, not 을 거예요. Don't double the ㄹ.",
        "es":"Tras raíces que terminan en ㄹ (살다), usa ㄹ 거예요, no 을 거예요. No dupliques la ㄹ.",
        "no":"Etter ㄹ-stammer, bruk ㄹ 거예요, ikke 을 거예요."}},

    {"id":"g11","topik":"TOPIK1","title":"-고 싶어요 — want to",
     "pattern":"Verb stem + 고 싶어요",
     "explanation":{
        "en":"Expresses 'want to do' for the speaker (1st person). For 3rd person desire, use 고 싶어해요.",
        "es":"Expresa 'querer hacer' para el hablante (1ª persona). Para 3ª persona, usa 고 싶어해요.",
        "no":"Uttrykker 'å ville gjøre' for taleren (1. person). For 3. person, bruk 고 싶어해요."},
     "examples":[
        {"hangul":"한국에 가고 싶어요.","rom":"hanguge gago sipeoyo.","en":"I want to go to Korea.","es":"Quiero ir a Corea.","no":"Jeg vil dra til Korea."},
        {"hangul":"커피를 마시고 싶어요.","rom":"keopireul masigo sipeoyo.","en":"I want to drink coffee.","es":"Quiero beber café.","no":"Jeg vil drikke kaffe."}],
     "commonMistake":{
        "en":"Use 고 싶어요 only when YOU are the wanter. For 'he wants to go', use 가고 싶어해요.",
        "es":"Usa 고 싶어요 sólo cuando TÚ deseas. Para 'él quiere ir', usa 가고 싶어해요.",
        "no":"Bruk 고 싶어요 kun når DU er den som vil. For 'han vil dra', bruk 가고 싶어해요."}},

    {"id":"g12","topik":"TOPIK1","title":"Honorifics — -(으)시-",
     "pattern":"Verb stem + (으)시 + ending  (also: special honorific words)",
     "explanation":{
        "en":"To show respect for the subject of the sentence (often older / higher status), insert -(으)시- between the stem and the ending. Some verbs/nouns have suppletive honorific forms: 먹다 → 드시다 (eat), 자다 → 주무시다 (sleep), 집 → 댁 (home), 이름 → 성함 (name).",
        "es":"Para mostrar respeto al sujeto de la oración (mayor / superior), inserta -(으)시- entre la raíz y la terminación. Algunos verbos/sustantivos tienen formas honoríficas especiales: 먹다 → 드시다 (comer), 자다 → 주무시다 (dormir), 집 → 댁 (casa), 이름 → 성함 (nombre).",
        "no":"For å vise respekt for setningens subjekt (eldre / høyere status), sett inn -(으)시- mellom stamme og endelse. Noen verb/substantiv har egne honorifikkformer: 먹다 → 드시다, 자다 → 주무시다."},
     "examples":[
        {"hangul":"선생님이 가르치세요.","rom":"seonsaengnimi gareuchiseyo.","en":"The teacher is teaching. (honorific)","es":"El profesor enseña. (honorífico)","no":"Læreren underviser. (honorifikk)"},
        {"hangul":"할머니께서 진지를 드세요.","rom":"halmeonikkeseo jinjireul deuseyo.","en":"Grandmother is eating. (high honorific)","es":"La abuela come. (honorífico alto)","no":"Bestemor spiser. (høy honorifikk)"}],
     "commonMistake":{
        "en":"Never use -(으)시- when YOU are the subject — it would be self-elevating. Only use it for someone you respect.",
        "es":"Nunca uses -(으)시- cuando TÚ eres el sujeto — sería elevarte a ti mismo. Sólo para alguien a quien respetas.",
        "no":"Bruk aldri -(으)시- når DU er subjektet — det ville være selvopphøyende. Kun for noen du respekterer."}},
]

_GRAMMAR_MAP = {g["id"]: g for g in _GRAMMAR}


def get_grammar_path(topik_level: str = "TOPIK1") -> List[Dict[str, Any]]:
    return [g for g in _GRAMMAR if g["topik"] == topik_level]


def get_grammar_point(point_id: str) -> Optional[Dict[str, Any]]:
    return _GRAMMAR_MAP.get(point_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 7 — Conversation Seonsaeng (LLM-backed)
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS: Dict[str, Dict[str, str]] = {
    "intro":      {"en":"Introducing yourself", "es":"Presentarte",       "no":"Presentere deg",
                   "first":"안녕하세요! 이름이 뭐예요?"},
    "cafe":       {"en":"Ordering at a café",   "es":"Pedir en un café",  "no":"Bestille på kafé",
                   "first":"어서 오세요! 뭐 드시겠어요?"},
    "directions": {"en":"Asking for directions","es":"Pedir direcciones",  "no":"Spørre om veien",
                   "first":"실례합니다, 지하철역이 어디예요?"},
    "taxi":       {"en":"Taking a taxi",        "es":"Coger un taxi",      "no":"Ta taxi",
                   "first":"어디로 가세요?"},
    "restaurant": {"en":"At a restaurant",      "es":"En el restaurante",  "no":"På restaurant",
                   "first":"안녕하세요! 몇 분이세요?"},
    "shopping":   {"en":"Shopping",             "es":"De compras",         "no":"Handle",
                   "first":"이거 얼마예요?"},
    "kdrama":     {"en":"K-drama small talk",   "es":"Conversación K-drama","no":"K-drama-prat",
                   "first":"한국 드라마 좋아하세요?"},
    "travel":     {"en":"Travel to Seoul",      "es":"Viaje a Seúl",       "no":"Reise til Seoul",
                   "first":"서울에 처음 오셨어요?"},
}

_LANG_NAMES = {"es":"Spanish", "en":"English", "no":"Norwegian"}


def _seonsaeng_system_prompt(scenario: str, difficulty: str, lang: str) -> str:
    explain_lang = _LANG_NAMES.get(lang, "English")
    scen_label = SCENARIOS.get(scenario, {}).get("en", scenario)
    return (
        f"You are Maestro Coreano IA (한국어 선생 AI), a patient, precise and encouraging Korean tutor.\n\n"
        f"SCENARIO: {scen_label}\n"
        f"LEARNER LEVEL: {difficulty} (TOPIK1 vocabulary by default)\n"
        f"EXPLANATION LANGUAGE: {explain_lang}\n\n"
        f"Strict response format — return JSON only, no markdown:\n"
        f'{{"hangul":"<your Korean reply (Hangul only)>",'
        f'"romanization":"<Revised Romanization>",'
        f'"translation":"<natural {explain_lang} translation>",'
        f'"hint":"<short cultural or grammar tip in {explain_lang}, optional>",'
        f'"correction":"<gentle correction of the learner\'s last message if needed, in {explain_lang}, optional>"}}\n\n'
        f"Rules:\n"
        f"- For Beginner (TOPIK1): use only TOPIK1 vocabulary and basic patterns (이에요/예요, 은/는, 이/가, 을/를, 에/에서, 있어요/없어요, 해요).\n"
        f"- For Intermediate (TOPIK2): introduce -았어요, -(으)ㄹ 거예요, -고 싶어요, -아/어 주세요.\n"
        f"- For Advanced (TOPIK3+): use natural conversational Korean including honorifics and casual speech contrasts.\n"
        f"- ALWAYS include accurate romanization.\n"
        f"- Keep `hangul` short and natural for the level.\n"
        f"- Never claim Korean is the same as Japanese or Chinese.\n"
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
            "hangul": opener,
            "romanization": romanize_word(opener),
            "translation": "",
            "hint": "", "correction": "",
            "is_mock": False, "scenario": scenario, "difficulty": difficulty,
        }
    if ask_ai_unified is None:
        return _mock_seonsaeng_reply(scenario, difficulty, user_text or "", lang)
    sys_prompt = _seonsaeng_system_prompt(scenario, difficulty, lang)
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
            # Normalize key aliases the LLM might use
            if "hz" in parsed and "hangul" not in parsed:
                parsed["hangul"] = parsed.pop("hz")
            if "rom" in parsed and "romanization" not in parsed:
                parsed["romanization"] = parsed.pop("rom")
            return parsed
    except Exception:
        pass
    return _mock_seonsaeng_reply(scenario, difficulty, user_text or "", lang)


def _mock_seonsaeng_reply(scenario: str, difficulty: str, user_text: str, lang: str) -> Dict[str, Any]:
    mocks = {
        "es": ("그래요? 다시 한 번 말씀해 주세요.", "geuraeyo? dasi han beon malsseumhae juseyo.",
               "¿Ah sí? Por favor, dilo otra vez."),
        "en": ("그래요? 다시 한 번 말씀해 주세요.", "geuraeyo? dasi han beon malsseumhae juseyo.",
               "Oh really? Please say that again."),
        "no": ("그래요? 다시 한 번 말씀해 주세요.", "geuraeyo? dasi han beon malsseumhae juseyo.",
               "Å, jaså? Vennligst si det igjen."),
    }
    hangul, rom, tr = mocks.get(lang, mocks["en"])
    return {
        "hangul": hangul, "romanization": rom, "translation": tr,
        "hint": "[Mock seonsaeng — connect an AI model for live conversation.]",
        "correction": "", "is_mock": True,
        "scenario": scenario, "difficulty": difficulty,
    }


def scenarios_catalogue(lang: str = "es") -> List[Dict[str, str]]:
    return [{"key": k, "label": v.get(lang, v["en"]), "first": v["first"]}
            for k, v in SCENARIOS.items()]


# ═══════════════════════════════════════════════════════════════════════════════
# 8 — CJK Bridge — THE DIFFERENTIATOR
# ═══════════════════════════════════════════════════════════════════════════════
# Each entry maps a SHARED CONCEPT across:
#   Chinese (hanzi / pinyin)
#   Japanese (kanji / on'yomi / kun'yomi)
#   Korean   (hangul / romanization / hanja)

_CJK_BRIDGE: List[Dict[str, Any]] = [
    {"concept_id":"mountain","meaning":{"en":"mountain","es":"montaña","no":"fjell"},
     "chinese":{"hanzi":"山","pinyin":"shān"},
     "japanese":{"kanji":"山","on":["サン"],"kun":["やま"],"romaji":"yama / san"},
     "korean":{"hangul":"산","romanization":"san","hanja":"山"},
     "note":{"en":"Same pictograph (three peaks). Pronunciations differ but meaning is identical.",
             "es":"Mismo pictograma (tres picos). Pronunciaciones diferentes pero significado idéntico.",
             "no":"Samme piktogram (tre topper). Ulik uttale men samme betydning."}},
    {"concept_id":"person","meaning":{"en":"person","es":"persona","no":"person"},
     "chinese":{"hanzi":"人","pinyin":"rén"},
     "japanese":{"kanji":"人","on":["ジン","ニン"],"kun":["ひと"],"romaji":"hito / jin"},
     "korean":{"hangul":"인","romanization":"in","hanja":"人"},
     "note":{"en":"Pictograph of a standing person. Korean reuses 인 as a noun-suffix: 한국인 = Korean person.",
             "es":"Pictograma de una persona de pie. El coreano reutiliza 인 como sufijo: 한국인 = persona coreana.",
             "no":"Piktogram av en stående person. Koreansk gjenbruker 인 som suffiks: 한국인 = koreaner."}},
    {"concept_id":"country","meaning":{"en":"country","es":"país","no":"land"},
     "chinese":{"hanzi":"国 / 國","pinyin":"guó"},
     "japanese":{"kanji":"国","on":["コク"],"kun":["くに"],"romaji":"kuni / koku"},
     "korean":{"hangul":"국","romanization":"guk","hanja":"國"},
     "note":{"en":"한국 = 韓國 = Korea. 中国 = China. 日本 also uses 国 for 'country'. The simplified Chinese 国 matches the modern Japanese form.",
             "es":"한국 = 韓國 = Corea. 中国 = China. 日本 también usa 国. El chino simplificado 国 coincide con la forma japonesa moderna.",
             "no":"한국 = 韓國 = Korea. Forenklet kinesisk 国 matcher den moderne japanske formen."}},
    {"concept_id":"learn","meaning":{"en":"to learn / study","es":"aprender / estudiar","no":"å lære / studere"},
     "chinese":{"hanzi":"学 / 學","pinyin":"xué"},
     "japanese":{"kanji":"学","on":["ガク"],"kun":["まな"],"romaji":"manabu / gaku"},
     "korean":{"hangul":"학","romanization":"hak","hanja":"學"},
     "note":{"en":"학교 = 学校 = 学校 = school (the same word across all three languages historically).",
             "es":"학교 = 学校 = 学校 = escuela (la misma palabra en las tres lenguas históricamente).",
             "no":"학교 = 学校 = 学校 = skole (samme ord på alle tre språk historisk)."}},
    {"concept_id":"school","meaning":{"en":"school","es":"escuela","no":"skole"},
     "chinese":{"hanzi":"学校","pinyin":"xuéxiào"},
     "japanese":{"kanji":"学校","on":[],"kun":[],"romaji":"gakkō"},
     "korean":{"hangul":"학교","romanization":"hakgyo","hanja":"學校"},
     "note":{"en":"Compound of 'learn' + 'institution'. Identical hanja/kanji.",
             "es":"Compuesto de 'aprender' + 'institución'. Hanja/kanji idénticos.",
             "no":"Sammensetning av 'lære' + 'institusjon'. Identiske hanja/kanji."}},
    {"concept_id":"water","meaning":{"en":"water","es":"agua","no":"vann"},
     "chinese":{"hanzi":"水","pinyin":"shuǐ"},
     "japanese":{"kanji":"水","on":["スイ"],"kun":["みず"],"romaji":"mizu / sui"},
     "korean":{"hangul":"수","romanization":"su","hanja":"水"},
     "note":{"en":"In modern Korean, 'water' as a noun is 물 (mul, native), but the Sino-Korean 수 appears in compounds: 수영 = swimming, 음수 = drinking water.",
             "es":"En coreano moderno, 'agua' como sustantivo es 물 (mul, nativo), pero el sino-coreano 수 aparece en compuestos: 수영 = natación.",
             "no":"På moderne koreansk er 'vann' som substantiv 물 (mul, innfødt), men det sino-koreanske 수 forekommer i sammensetninger: 수영 = svømming."}},
    {"concept_id":"fire","meaning":{"en":"fire","es":"fuego","no":"ild"},
     "chinese":{"hanzi":"火","pinyin":"huǒ"},
     "japanese":{"kanji":"火","on":["カ"],"kun":["ひ"],"romaji":"hi / ka"},
     "korean":{"hangul":"화","romanization":"hwa","hanja":"火"},
     "note":{"en":"화요일 = 火曜日 = Tuesday (lit. 'fire day') across Korean and Japanese.",
             "es":"화요일 = 火曜日 = martes (lit. 'día del fuego') en coreano y japonés.",
             "no":"화요일 = 火曜日 = tirsdag (bokstavelig 'ildens dag') i koreansk og japansk."}},
    {"concept_id":"tree","meaning":{"en":"tree, wood","es":"árbol, madera","no":"tre, ved"},
     "chinese":{"hanzi":"木","pinyin":"mù"},
     "japanese":{"kanji":"木","on":["モク","ボク"],"kun":["き"],"romaji":"ki / moku"},
     "korean":{"hangul":"목","romanization":"mok","hanja":"木"},
     "note":{"en":"목요일 = 木曜日 = Thursday. Korean native word for 'tree' is 나무.",
             "es":"목요일 = 木曜日 = jueves. La palabra nativa coreana para 'árbol' es 나무.",
             "no":"목요일 = 木曜日 = torsdag. Innfødt koreansk ord for 'tre' er 나무."}},
    {"concept_id":"sun","meaning":{"en":"sun, day","es":"sol, día","no":"sol, dag"},
     "chinese":{"hanzi":"日","pinyin":"rì"},
     "japanese":{"kanji":"日","on":["ニチ","ジツ"],"kun":["ひ"],"romaji":"hi / nichi"},
     "korean":{"hangul":"일","romanization":"il","hanja":"日"},
     "note":{"en":"日本 = Japan (lit. 'sun origin'). 일요일 = 日曜日 = Sunday. 일 is also Sino-Korean for the number 1.",
             "es":"日本 = Japón (lit. 'origen del sol'). 일요일 = domingo. 일 también es '1' sino-coreano.",
             "no":"日本 = Japan (bokstavelig 'solens opprinnelse'). 일요일 = søndag. 일 er også sino-koreansk for '1'."}},
    {"concept_id":"moon","meaning":{"en":"moon, month","es":"luna, mes","no":"måne, måned"},
     "chinese":{"hanzi":"月","pinyin":"yuè"},
     "japanese":{"kanji":"月","on":["ゲツ","ガツ"],"kun":["つき"],"romaji":"tsuki / getsu"},
     "korean":{"hangul":"월","romanization":"wol","hanja":"月"},
     "note":{"en":"월요일 = 月曜日 = Monday. 1월 = January. The same character carries the meaning 'moon' and 'month' in all three.",
             "es":"월요일 = lunes. 1월 = enero. Mismo carácter para 'luna' y 'mes' en las tres lenguas.",
             "no":"월요일 = mandag. 1월 = januar. Samme tegn for 'måne' og 'måned' i alle tre."}},
    {"concept_id":"middle","meaning":{"en":"middle, centre","es":"medio, centro","no":"midten"},
     "chinese":{"hanzi":"中","pinyin":"zhōng"},
     "japanese":{"kanji":"中","on":["チュウ"],"kun":["なか"],"romaji":"naka / chū"},
     "korean":{"hangul":"중","romanization":"jung","hanja":"中"},
     "note":{"en":"中国 = 中國 = China (Middle Kingdom). Korean 중 is used in many compounds: 중간 = midway, 집중 = concentration.",
             "es":"中国 = 中國 = China (Reino del Medio). El coreano 중 aparece en compuestos: 중간 = a medio camino.",
             "no":"中国 = 中國 = Kina (Midtens rike). Koreansk 중 finnes i mange sammensetninger."}},
    {"concept_id":"big","meaning":{"en":"big","es":"grande","no":"stor"},
     "chinese":{"hanzi":"大","pinyin":"dà"},
     "japanese":{"kanji":"大","on":["ダイ","タイ"],"kun":["おお"],"romaji":"ō / dai"},
     "korean":{"hangul":"대","romanization":"dae","hanja":"大"},
     "note":{"en":"대학 = 大学 = university (lit. 'big learning'). Native Korean 큰 (keun) is used as the adjective.",
             "es":"대학 = universidad (lit. 'gran aprendizaje'). El nativo coreano 큰 (keun) se usa como adjetivo.",
             "no":"대학 = universitet (bokstavelig 'stor læring'). Innfødt koreansk 큰 (keun) brukes som adjektiv."}},
    {"concept_id":"small","meaning":{"en":"small","es":"pequeño","no":"liten"},
     "chinese":{"hanzi":"小","pinyin":"xiǎo"},
     "japanese":{"kanji":"小","on":["ショウ"],"kun":["ちい"],"romaji":"chiisai / shō"},
     "korean":{"hangul":"소","romanization":"so","hanja":"小"},
     "note":{"en":"소학교 (an older term for primary school) = 小学校 = elementary school.",
             "es":"소학교 (término antiguo) = 小学校 = escuela primaria.",
             "no":"소학교 (eldre uttrykk) = 小学校 = barneskole."}},
    {"concept_id":"name","meaning":{"en":"name","es":"nombre","no":"navn"},
     "chinese":{"hanzi":"名","pinyin":"míng"},
     "japanese":{"kanji":"名","on":["メイ"],"kun":["な"],"romaji":"na / mei"},
     "korean":{"hangul":"명","romanization":"myeong","hanja":"名"},
     "note":{"en":"유명하다 = 有名 + 하다 = to be famous (lit. 'have name'). Common Sino-Korean root.",
             "es":"유명하다 = 有名 + 하다 = ser famoso (lit. 'tener nombre').",
             "no":"유명하다 = 有名 + 하다 = å være berømt (bokstavelig 'ha navn')."}},
    {"concept_id":"life","meaning":{"en":"life, raw, student (in 学生)","es":"vida; estudiante (en 学生)","no":"liv; student (i 学生)"},
     "chinese":{"hanzi":"生","pinyin":"shēng"},
     "japanese":{"kanji":"生","on":["セイ","ショウ"],"kun":["い","う"],"romaji":"sei / iku"},
     "korean":{"hangul":"생","romanization":"saeng","hanja":"生"},
     "note":{"en":"학생 = 学生 = 学生 = student in all three. Same compositional logic.",
             "es":"학생 = 学生 = 学生 = estudiante en las tres lenguas.",
             "no":"학생 = 学生 = 学生 = student på alle tre."}},
    {"concept_id":"teacher","meaning":{"en":"teacher (preceding term)","es":"maestro (término precedente)","no":"lærer (forutgående term)"},
     "chinese":{"hanzi":"先生","pinyin":"xiānsheng"},
     "japanese":{"kanji":"先生","on":[],"kun":[],"romaji":"sensei"},
     "korean":{"hangul":"선생","romanization":"seonsaeng","hanja":"先生"},
     "note":{"en":"Same word, three pronunciations: xiānsheng (Mr. / husband) in Chinese, sensei (teacher) in Japanese, seonsaeng (teacher) in Korean. Beware the meaning shift in Chinese!",
             "es":"Misma palabra, tres pronunciaciones: xiānsheng (Sr. / esposo) en chino, sensei (profesor) en japonés, seonsaeng (profesor) en coreano. ¡Cuidado con el cambio de significado en chino!",
             "no":"Samme ord, tre uttaler: xiānsheng (Hr. / mann) på kinesisk, sensei (lærer) på japansk, seonsaeng (lærer) på koreansk. Betydningsskifte på kinesisk!"}},
    {"concept_id":"language","meaning":{"en":"language, word","es":"lengua, palabra","no":"språk, ord"},
     "chinese":{"hanzi":"语 / 語","pinyin":"yǔ"},
     "japanese":{"kanji":"語","on":["ゴ"],"kun":["かた"],"romaji":"go / kataru"},
     "korean":{"hangul":"어","romanization":"eo","hanja":"語"},
     "note":{"en":"한국어 = 韓國語 = Korean language. 일본어 = 日本語 = Japanese. 중국어 = 中國語 = Chinese.",
             "es":"한국어 = idioma coreano. 일본어 = japonés. 중국어 = chino.",
             "no":"한국어 = koreansk språk. 일본어 = japansk. 중국어 = kinesisk."}},
    {"concept_id":"home","meaning":{"en":"home, family, house","es":"casa, familia","no":"hjem, familie"},
     "chinese":{"hanzi":"家","pinyin":"jiā"},
     "japanese":{"kanji":"家","on":["カ","ケ"],"kun":["いえ"],"romaji":"ie / ka"},
     "korean":{"hangul":"가","romanization":"ga","hanja":"家"},
     "note":{"en":"가족 = 家族 = family in Korean and Japanese alike. Native Korean for 'house' is 집 (jip).",
             "es":"가족 = familia tanto en coreano como en japonés. Nativo coreano para 'casa' es 집 (jip).",
             "no":"가족 = familie på både koreansk og japansk. Innfødt koreansk for 'hus' er 집 (jip)."}},
    {"concept_id":"day_unit","meaning":{"en":"day (counter)","es":"día (clasificador)","no":"dag (teller)"},
     "chinese":{"hanzi":"日","pinyin":"rì"},
     "japanese":{"kanji":"日","on":["ニチ"],"kun":["ひ"],"romaji":"hi / nichi"},
     "korean":{"hangul":"일","romanization":"il","hanja":"日"},
     "note":{"en":"내일 = 來日 = tomorrow (lit. 'coming day'). 일 = day-counter in dates.",
             "es":"내일 = mañana (lit. 'día venidero'). 일 = clasificador de día en fechas.",
             "no":"내일 = i morgen (bokstavelig 'kommende dag'). 일 = dag-teller i datoer."}},
    {"concept_id":"year","meaning":{"en":"year","es":"año","no":"år"},
     "chinese":{"hanzi":"年","pinyin":"nián"},
     "japanese":{"kanji":"年","on":["ネン"],"kun":["とし"],"romaji":"toshi / nen"},
     "korean":{"hangul":"년","romanization":"nyeon","hanja":"年"},
     "note":{"en":"2026년 = year 2026. Same character used in all three for year-counting.",
             "es":"2026년 = año 2026. Mismo carácter en las tres lenguas.",
             "no":"2026년 = år 2026. Samme tegn brukt i alle tre."}},
    {"concept_id":"electric","meaning":{"en":"electric","es":"eléctrico","no":"elektrisk"},
     "chinese":{"hanzi":"电 / 電","pinyin":"diàn"},
     "japanese":{"kanji":"電","on":["デン"],"kun":[],"romaji":"den"},
     "korean":{"hangul":"전","romanization":"jeon","hanja":"電"},
     "note":{"en":"전화 = 電話 = 电话 = telephone (lit. 'electric talk'). 전기 = 電氣 = electricity.",
             "es":"전화 = teléfono (lit. 'habla eléctrica'). 전기 = electricidad.",
             "no":"전화 = telefon (bokstavelig 'elektrisk tale'). 전기 = elektrisitet."}},
    {"concept_id":"talk","meaning":{"en":"talk, speech","es":"habla, palabra","no":"tale, prat"},
     "chinese":{"hanzi":"话 / 話","pinyin":"huà"},
     "japanese":{"kanji":"話","on":["ワ"],"kun":["はな"],"romaji":"hanashi / wa"},
     "korean":{"hangul":"화","romanization":"hwa","hanja":"話"},
     "note":{"en":"전화 = 電話 = telephone. 회화 = 會話 = conversation.",
             "es":"전화 = teléfono. 회화 = conversación.",
             "no":"전화 = telefon. 회화 = samtale."}},
    {"concept_id":"car","meaning":{"en":"car, vehicle","es":"coche, vehículo","no":"bil, kjøretøy"},
     "chinese":{"hanzi":"车 / 車","pinyin":"chē"},
     "japanese":{"kanji":"車","on":["シャ"],"kun":["くるま"],"romaji":"kuruma / sha"},
     "korean":{"hangul":"차","romanization":"cha","hanja":"車"},
     "note":{"en":"자동차 = 自動車 = automobile (lit. 'self-moving vehicle'). Same compositional logic across all three.",
             "es":"자동차 = automóvil (lit. 'vehículo que se mueve solo'). Misma composición en las tres lenguas.",
             "no":"자동차 = bil (bokstavelig 'selvbevegelig kjøretøy'). Samme komposisjon på alle tre."}},
    {"concept_id":"book","meaning":{"en":"book","es":"libro","no":"bok"},
     "chinese":{"hanzi":"书 / 書","pinyin":"shū"},
     "japanese":{"kanji":"書","on":["ショ"],"kun":["か"],"romaji":"kaku / sho"},
     "korean":{"hangul":"서","romanization":"seo","hanja":"書"},
     "note":{"en":"도서관 = 圖書館 = library. Native Korean for 'book' is 책 (chaek, from 冊).",
             "es":"도서관 = biblioteca. Nativo coreano para 'libro' es 책 (chaek, de 冊).",
             "no":"도서관 = bibliotek. Innfødt koreansk for 'bok' er 책 (chaek, fra 冊)."}},
    {"concept_id":"hand","meaning":{"en":"hand","es":"mano","no":"hånd"},
     "chinese":{"hanzi":"手","pinyin":"shǒu"},
     "japanese":{"kanji":"手","on":["シュ"],"kun":["て"],"romaji":"te / shu"},
     "korean":{"hangul":"수","romanization":"su","hanja":"手"},
     "note":{"en":"수영 = 水泳 = swimming uses the 'water' 수, but 수 from 手 'hand' appears in 가수 = 歌手 = singer.",
             "es":"수영 (natación) usa el 수 de 'agua', pero 수 de 手 'mano' aparece en 가수 = cantante.",
             "no":"수영 (svømming) bruker 수 fra 'vann', men 수 fra 手 'hånd' finnes i 가수 = sanger."}},
    {"concept_id":"mouth","meaning":{"en":"mouth, opening","es":"boca","no":"munn"},
     "chinese":{"hanzi":"口","pinyin":"kǒu"},
     "japanese":{"kanji":"口","on":["コウ"],"kun":["くち"],"romaji":"kuchi / kō"},
     "korean":{"hangul":"구","romanization":"gu","hanja":"口"},
     "note":{"en":"인구 = 人口 = population (lit. 'people mouths'). Native Korean for 'mouth' is 입 (ip).",
             "es":"인구 = población (lit. 'bocas de personas'). Nativo coreano para 'boca' es 입 (ip).",
             "no":"인구 = befolkning (bokstavelig 'folkets munner'). Innfødt koreansk for 'munn' er 입 (ip)."}},
    {"concept_id":"bright","meaning":{"en":"bright, clear","es":"brillante, claro","no":"lys, klar"},
     "chinese":{"hanzi":"明","pinyin":"míng"},
     "japanese":{"kanji":"明","on":["メイ","ミョウ"],"kun":["あか"],"romaji":"akarui / mei"},
     "korean":{"hangul":"명","romanization":"myeong","hanja":"明"},
     "note":{"en":"日 + 月 = 明 (sun + moon = bright). Beautiful compositional logic shared across all three.",
             "es":"日 + 月 = 明 (sol + luna = brillante). Preciosa lógica de composición en las tres lenguas.",
             "no":"日 + 月 = 明 (sol + måne = lys). Vakker komposisjonslogikk på alle tre."}},
    {"concept_id":"thanks","meaning":{"en":"to thank, gratitude","es":"agradecer, gratitud","no":"å takke, takknemlighet"},
     "chinese":{"hanzi":"感谢 / 感謝","pinyin":"gǎnxiè"},
     "japanese":{"kanji":"感謝","on":[],"kun":[],"romaji":"kansha"},
     "korean":{"hangul":"감사","romanization":"gamsa","hanja":"感謝"},
     "note":{"en":"감사합니다 = 感謝 + 합니다 = thank you (formal). Same hanja/kanji root across all three.",
             "es":"감사합니다 = gracias (formal). Misma raíz hanja/kanji en las tres.",
             "no":"감사합니다 = takk (formelt). Samme hanja/kanji-rot på alle tre."}},
    {"concept_id":"Korea","meaning":{"en":"Korea","es":"Corea","no":"Korea"},
     "chinese":{"hanzi":"韩国 / 韓國","pinyin":"Hánguó"},
     "japanese":{"kanji":"韓国","on":[],"kun":[],"romaji":"Kankoku"},
     "korean":{"hangul":"한국","romanization":"hanguk","hanja":"韓國"},
     "note":{"en":"Same name, three reads. Hán (China) · Kan (Japan) · Han (Korea). The 韓 character refers to the ancient Han Confederacy.",
             "es":"Mismo nombre, tres lecturas. Hán · Kan · Han. El carácter 韓 alude a la antigua Confederación Han.",
             "no":"Samme navn, tre lesninger. Hán · Kan · Han. Tegnet 韓 refererer til den gamle Han-konføderasjonen."}},
]

_CJK_BRIDGE_MAP = {c["concept_id"]: c for c in _CJK_BRIDGE}


def get_cjk_bridge_entries() -> List[Dict[str, Any]]:
    return _CJK_BRIDGE


def get_cjk_bridge_entry(concept_id: str) -> Optional[Dict[str, Any]]:
    return _CJK_BRIDGE_MAP.get(concept_id)


def get_hanja_lookup(character: str) -> Optional[Dict[str, Any]]:
    """Look up a Hanja character against our curated bridge + japanese map."""
    # First check curated bridge
    for c in _CJK_BRIDGE:
        if c["korean"].get("hanja") == character or c["chinese"]["hanzi"].endswith(character) or c["japanese"]["kanji"] == character:
            return c
    # Fall back to japanese kanji map
    ja = _JA_KANJI_MAP.get(character)
    if ja:
        return {
            "concept_id": f"auto_{character}",
            "meaning": {"en": ja.get("meaning", ""), "es": "", "no": ""},
            "chinese": {"hanzi": character, "pinyin": ""},
            "japanese": {"kanji": character, "on": ja.get("onyomi", []),
                         "kun": ja.get("kunyomi", []), "romaji": ""},
            "korean": {"hangul": "", "romanization": "", "hanja": character},
            "note": {"en": "Auto-detected from Japanese kanji map. Korean reading not curated.",
                     "es": "Auto-detectado del mapa de kanji japonés.",
                     "no": "Auto-oppdaget fra japansk kanji-kart."},
            "source": "auto",
        }
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# 9 — Jamo progress & Syllable attempts (lightweight tracking)
# ═══════════════════════════════════════════════════════════════════════════════

async def jamo_mark(jamo: str, status: str, user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    """status: 'learning' | 'known' | 'review'."""
    if _JAMO_COL is None:
        return {"status": "ok", "persisted": False}
    try:
        await _JAMO_COL.update_one(
            {"user_id": user_id, "jamo": jamo},
            {"$set": {"status": status,
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"status": "ok", "persisted": True}
    except Exception:
        return {"status": "ok", "persisted": False}


async def _jamo_known_count(user_id: str = DEFAULT_USER) -> int:
    if _JAMO_COL is None:
        return 0
    try:
        return await _JAMO_COL.count_documents({"user_id": user_id, "status": "known"})
    except Exception:
        return 0


async def syllable_attempt(initial: str, medial: str, final: str,
                           user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    block = compose_syllable(initial, medial, final)
    if not block:
        return {"status": "error", "message": "Invalid jamo combination"}
    record = {
        "user_id": user_id,
        "initial": initial, "medial": medial, "final": final,
        "block": block,
        "romanization": _romanize_block(initial, medial, final),
        "at": datetime.now(timezone.utc).isoformat(),
    }
    if _SYLL_COL is not None:
        try:
            await _SYLL_COL.insert_one(record)
            return {"status": "ok", "persisted": True, **record}
        except Exception:
            pass
    return {"status": "ok", "persisted": False, **record}


# ═══════════════════════════════════════════════════════════════════════════════
# 10 — Dashboard / Overview
# ═══════════════════════════════════════════════════════════════════════════════

async def get_overview(user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    jamo_known = await _jamo_known_count(user_id)
    vocab_known = await _vocab_known_count(user_id)
    due_items = await srs_due(user_id, limit=100)
    srs_due_n = sum(1 for d in due_items if not d.get("is_new"))
    new_today = sum(1 for d in due_items if d.get("is_new"))
    total_jamo = (len(_CONSONANTS) + len(_DOUBLE_CONSONANTS)
                  + len(_VOWELS) + len(_COMPOUND_VOWELS))
    if jamo_known >= 25 and vocab_known >= 80:
        level, target = "Beginner+", "TOPIK1"
    elif jamo_known >= 14 or vocab_known >= 40:
        level, target = "Beginner", "TOPIK1"
    else:
        level, target = "Starter", "TOPIK1"
    mission = [
        {"type": "jamo",      "count": 5, "label": "Hangul letters"},
        {"type": "syllable",  "count": 10,"label": "syllable blocks"},
        {"type": "batchim",   "count": 5, "label": "batchim words"},
        {"type": "srs",       "count": min(20, srs_due_n + new_today), "label": "vocabulary reviews"},
        {"type": "conv",      "count": 1, "label": "mini-dialogue"},
    ]
    return {
        "user_id": user_id, "level": level, "topik_target": target,
        "streak_days": 0,
        "stats": {
            "jamo_known":         jamo_known,
            "jamo_total":         total_jamo,
            "consonants_total":   len(_CONSONANTS),
            "vowels_total":       len(_VOWELS),
            "syllable_seeds":     len(_SEED_SYLLABLES),
            "batchim_groups":     len(_BATCHIM_GROUPS),
            "vocab_known":        vocab_known,
            "vocab_total":        len(_VOCAB),
            "grammar_total":      len(_GRAMMAR),
            "cjk_bridge_total":   len(_CJK_BRIDGE),
            "srs_due_today":      srs_due_n,
            "srs_new_today":      new_today,
        },
        "todays_mission": mission,
        "generated_at":   datetime.now(timezone.utc).isoformat(),
    }
