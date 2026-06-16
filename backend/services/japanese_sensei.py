"""
Japanese Sensei AI — Service
=============================
Functional V1 service for the Japanese language learning agent.

Five modules:
  1. Kana Trainer       — hiragana + katakana recognition / recall / writing
  2. Kanji Dojo         — first 10 N5 kanji with meaning + readings + words
  3. Vocabulary SRS     — 50 N5 words with SM-2-inspired spaced repetition
  4. Conversation Sensei — LLM-backed tutor chat (uses ask_ai_unified)
  5. Dashboard          — aggregated stats + today's mission

Single-user model (user_id='default') matching the pattern of other agents in
WLWAI. Multi-user can be layered later via the auth system.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_ai_unified
except Exception:
    ask_ai_unified = None  # type: ignore

try:
    from backend.db import database
    _KANA_COL    = database.get_collection("japanese_kana_progress")
    _KANJI_COL   = database.get_collection("japanese_kanji_progress")
    _SRS_COL     = database.get_collection("japanese_srs_reviews")
    _CONV_COL    = database.get_collection("japanese_conversation_runs")
except Exception:
    _KANA_COL = _KANJI_COL = _SRS_COL = _CONV_COL = None

DEFAULT_USER = "default"

# ═══════════════════════════════════════════════════════════════════════════════
# 1 — Kana data (Hiragana + Katakana, 46 base each)
# ═══════════════════════════════════════════════════════════════════════════════

# (char, romaji) tuples in gojuuon order (rows: a-ka-sa-ta-na-ha-ma-ya-ra-wa)
_HIRAGANA: List[Dict[str, str]] = [
    {"char": c, "romaji": r, "type": "hiragana"} for c, r in [
        ("あ","a"),("い","i"),("う","u"),("え","e"),("お","o"),
        ("か","ka"),("き","ki"),("く","ku"),("け","ke"),("こ","ko"),
        ("さ","sa"),("し","shi"),("す","su"),("せ","se"),("そ","so"),
        ("た","ta"),("ち","chi"),("つ","tsu"),("て","te"),("と","to"),
        ("な","na"),("に","ni"),("ぬ","nu"),("ね","ne"),("の","no"),
        ("は","ha"),("ひ","hi"),("ふ","fu"),("へ","he"),("ほ","ho"),
        ("ま","ma"),("み","mi"),("む","mu"),("め","me"),("も","mo"),
        ("や","ya"),("ゆ","yu"),("よ","yo"),
        ("ら","ra"),("り","ri"),("る","ru"),("れ","re"),("ろ","ro"),
        ("わ","wa"),("を","wo"),("ん","n"),
    ]
]

_KATAKANA: List[Dict[str, str]] = [
    {"char": c, "romaji": r, "type": "katakana"} for c, r in [
        ("ア","a"),("イ","i"),("ウ","u"),("エ","e"),("オ","o"),
        ("カ","ka"),("キ","ki"),("ク","ku"),("ケ","ke"),("コ","ko"),
        ("サ","sa"),("シ","shi"),("ス","su"),("セ","se"),("ソ","so"),
        ("タ","ta"),("チ","chi"),("ツ","tsu"),("テ","te"),("ト","to"),
        ("ナ","na"),("ニ","ni"),("ヌ","nu"),("ネ","ne"),("ノ","no"),
        ("ハ","ha"),("ヒ","hi"),("フ","fu"),("ヘ","he"),("ホ","ho"),
        ("マ","ma"),("ミ","mi"),("ム","mu"),("メ","me"),("モ","mo"),
        ("ヤ","ya"),("ユ","yu"),("ヨ","yo"),
        ("ラ","ra"),("リ","ri"),("ル","ru"),("レ","re"),("ロ","ro"),
        ("ワ","wa"),("ヲ","wo"),("ン","n"),
    ]
]

_ALL_KANA = _HIRAGANA + _KATAKANA


def get_kana_deck(kana_type: str = "all") -> List[Dict[str, Any]]:
    if kana_type == "hiragana": return _HIRAGANA
    if kana_type == "katakana": return _KATAKANA
    return _ALL_KANA


# ═══════════════════════════════════════════════════════════════════════════════
# 2 — Kanji data (first 10 N5)
# ═══════════════════════════════════════════════════════════════════════════════

_KANJI: List[Dict[str, Any]] = [
    {"char":"木","meaning":"tree, wood","onyomi":["モク","ボク"],"kunyomi":["き"],
     "strokes":4,"radicals":["木"],"jlpt":"N5",
     "words":[{"word":"木","kana":"き","meaning":"tree"},
              {"word":"木曜日","kana":"もくようび","meaning":"Thursday"}],
     "sentence":{"jp":"木の下にいます。","kana":"きのしたにいます。","en":"I am under the tree."}},
    {"char":"水","meaning":"water","onyomi":["スイ"],"kunyomi":["みず"],
     "strokes":4,"radicals":["水"],"jlpt":"N5",
     "words":[{"word":"水","kana":"みず","meaning":"water"},
              {"word":"水曜日","kana":"すいようび","meaning":"Wednesday"}],
     "sentence":{"jp":"水をください。","kana":"みずをください。","en":"Water, please."}},
    {"char":"火","meaning":"fire","onyomi":["カ"],"kunyomi":["ひ"],
     "strokes":4,"radicals":["火"],"jlpt":"N5",
     "words":[{"word":"火","kana":"ひ","meaning":"fire"},
              {"word":"火曜日","kana":"かようび","meaning":"Tuesday"}],
     "sentence":{"jp":"火は熱い。","kana":"ひはあつい。","en":"Fire is hot."}},
    {"char":"土","meaning":"earth, soil","onyomi":["ド","ト"],"kunyomi":["つち"],
     "strokes":3,"radicals":["土"],"jlpt":"N5",
     "words":[{"word":"土","kana":"つち","meaning":"earth, soil"},
              {"word":"土曜日","kana":"どようび","meaning":"Saturday"}],
     "sentence":{"jp":"土曜日は休みです。","kana":"どようびはやすみです。","en":"Saturday is a day off."}},
    {"char":"金","meaning":"gold, money","onyomi":["キン"],"kunyomi":["かね"],
     "strokes":8,"radicals":["金"],"jlpt":"N5",
     "words":[{"word":"お金","kana":"おかね","meaning":"money"},
              {"word":"金曜日","kana":"きんようび","meaning":"Friday"}],
     "sentence":{"jp":"お金がありません。","kana":"おかねがありません。","en":"I have no money."}},
    {"char":"日","meaning":"sun, day","onyomi":["ニチ","ジツ"],"kunyomi":["ひ","か"],
     "strokes":4,"radicals":["日"],"jlpt":"N5",
     "words":[{"word":"日本","kana":"にほん","meaning":"Japan"},
              {"word":"日曜日","kana":"にちようび","meaning":"Sunday"}],
     "sentence":{"jp":"日本が好きです。","kana":"にほんがすきです。","en":"I like Japan."}},
    {"char":"月","meaning":"moon, month","onyomi":["ゲツ","ガツ"],"kunyomi":["つき"],
     "strokes":4,"radicals":["月"],"jlpt":"N5",
     "words":[{"word":"月","kana":"つき","meaning":"moon"},
              {"word":"月曜日","kana":"げつようび","meaning":"Monday"}],
     "sentence":{"jp":"月がきれいです。","kana":"つきがきれいです。","en":"The moon is beautiful."}},
    {"char":"人","meaning":"person","onyomi":["ジン","ニン"],"kunyomi":["ひと"],
     "strokes":2,"radicals":["人"],"jlpt":"N5",
     "words":[{"word":"人","kana":"ひと","meaning":"person"},
              {"word":"日本人","kana":"にほんじん","meaning":"Japanese person"}],
     "sentence":{"jp":"あの人は先生です。","kana":"あのひとはせんせいです。","en":"That person is a teacher."}},
    {"char":"大","meaning":"big, large","onyomi":["ダイ","タイ"],"kunyomi":["おお"],
     "strokes":3,"radicals":["大"],"jlpt":"N5",
     "words":[{"word":"大きい","kana":"おおきい","meaning":"big"},
              {"word":"大学","kana":"だいがく","meaning":"university"}],
     "sentence":{"jp":"大きい犬です。","kana":"おおきいいぬです。","en":"It's a big dog."}},
    {"char":"小","meaning":"small","onyomi":["ショウ"],"kunyomi":["ちい","こ"],
     "strokes":3,"radicals":["小"],"jlpt":"N5",
     "words":[{"word":"小さい","kana":"ちいさい","meaning":"small"},
              {"word":"小学校","kana":"しょうがっこう","meaning":"elementary school"}],
     "sentence":{"jp":"小さい猫です。","kana":"ちいさいねこです。","en":"It's a small cat."}},
]

_KANJI_MAP = {k["char"]: k for k in _KANJI}


def get_kanji_deck() -> List[Dict[str, Any]]:
    return _KANJI


def get_kanji_detail(char: str) -> Optional[Dict[str, Any]]:
    return _KANJI_MAP.get(char)


# ═══════════════════════════════════════════════════════════════════════════════
# 3 — Vocabulary (50 N5 essentials)
# ═══════════════════════════════════════════════════════════════════════════════

_VOCAB: List[Dict[str, Any]] = [
    {"id":f"n5_{i+1:03d}", "word":w, "kana":k, "romaji":r, "meaning":m, "level":"N5", "tags":t}
    for i,(w,k,r,m,t) in enumerate([
        ("水","みず","mizu","water",["noun","daily"]),
        ("火","ひ","hi","fire",["noun","daily"]),
        ("木","き","ki","tree",["noun","nature"]),
        ("日本","にほん","nihon","Japan",["noun","place"]),
        ("人","ひと","hito","person",["noun","people"]),
        ("私","わたし","watashi","I",["pronoun","essential"]),
        ("あなた","あなた","anata","you",["pronoun","essential"]),
        ("はい","はい","hai","yes",["expression","essential"]),
        ("いいえ","いいえ","iie","no",["expression","essential"]),
        ("ありがとう","ありがとう","arigatou","thank you",["expression","essential"]),
        ("すみません","すみません","sumimasen","excuse me / sorry",["expression","essential"]),
        ("こんにちは","こんにちは","konnichiwa","hello / good afternoon",["greeting","essential"]),
        ("おはよう","おはよう","ohayou","good morning",["greeting","essential"]),
        ("こんばんは","こんばんは","konbanwa","good evening",["greeting","essential"]),
        ("さようなら","さようなら","sayounara","goodbye",["greeting","essential"]),
        ("食べる","たべる","taberu","to eat",["verb","daily"]),
        ("飲む","のむ","nomu","to drink",["verb","daily"]),
        ("行く","いく","iku","to go",["verb","movement"]),
        ("来る","くる","kuru","to come",["verb","movement"]),
        ("見る","みる","miru","to see / watch",["verb","daily"]),
        ("する","する","suru","to do",["verb","essential"]),
        ("ある","ある","aru","to exist (objects)",["verb","essential"]),
        ("いる","いる","iru","to exist (people)",["verb","essential"]),
        ("家","いえ","ie","house, home",["noun","place"]),
        ("学校","がっこう","gakkou","school",["noun","place"]),
        ("会社","かいしゃ","kaisha","company",["noun","work"]),
        ("先生","せんせい","sensei","teacher",["noun","people"]),
        ("学生","がくせい","gakusei","student",["noun","people"]),
        ("友達","ともだち","tomodachi","friend",["noun","people"]),
        ("車","くるま","kuruma","car",["noun","transport"]),
        ("電車","でんしゃ","densha","train",["noun","transport"]),
        ("駅","えき","eki","station",["noun","place"]),
        ("時間","じかん","jikan","time",["noun","essential"]),
        ("今日","きょう","kyou","today",["noun","time"]),
        ("明日","あした","ashita","tomorrow",["noun","time"]),
        ("昨日","きのう","kinou","yesterday",["noun","time"]),
        ("名前","なまえ","namae","name",["noun","essential"]),
        ("お茶","おちゃ","ocha","tea",["noun","food"]),
        ("コーヒー","コーヒー","koohii","coffee",["noun","food"]),
        ("本","ほん","hon","book",["noun","object"]),
        ("猫","ねこ","neko","cat",["noun","animal"]),
        ("犬","いぬ","inu","dog",["noun","animal"]),
        ("大きい","おおきい","ookii","big",["adjective","i-adj"]),
        ("小さい","ちいさい","chiisai","small",["adjective","i-adj"]),
        ("好き","すき","suki","like (favourite)",["adjective","na-adj"]),
        ("良い","いい","ii","good",["adjective","i-adj"]),
        ("悪い","わるい","warui","bad",["adjective","i-adj"]),
        ("新しい","あたらしい","atarashii","new",["adjective","i-adj"]),
        ("古い","ふるい","furui","old (things)",["adjective","i-adj"]),
        ("何","なに","nani","what",["interrogative","essential"]),
    ])
]

_VOCAB_MAP = {v["id"]: v for v in _VOCAB}


def get_vocab_all() -> List[Dict[str, Any]]:
    return _VOCAB


# ═══════════════════════════════════════════════════════════════════════════════
# 4 — Spaced Repetition System (SM-2 inspired, simplified)
# ═══════════════════════════════════════════════════════════════════════════════

# Stage → days until next review
_SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 90, 180]


def _next_review_at(stage: int) -> str:
    stage = max(0, min(stage, len(_SRS_INTERVALS) - 1))
    delta = timedelta(days=_SRS_INTERVALS[stage])
    return (datetime.now(timezone.utc) + delta).isoformat()


async def srs_due(user_id: str = DEFAULT_USER, limit: int = 20) -> List[Dict[str, Any]]:
    """Return vocab items currently due for review. When the DB is empty, seed
    the SRS state on first call so the dashboard isn't empty."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if _SRS_COL is None:
        # Without DB: surface the first N items as "new" (stage 0, never seen)
        return [{**v, "stage": 0, "next_review_at": now_iso, "is_new": True} for v in _VOCAB[:limit]]
    try:
        states = await _SRS_COL.find({"user_id": user_id}).to_list(2000)
        seen_ids = {s["vocab_id"] for s in states}
        # New items not yet started — pick the next batch in canonical order
        new_items = [v for v in _VOCAB if v["id"] not in seen_ids][:max(0, limit // 2)]
        # Items due for review
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
    """Grade: 'again' (failed), 'good' (passed), 'easy' (passed strongly)."""
    if vocab_id not in _VOCAB_MAP:
        return {"status": "error", "message": f"Unknown vocab id: {vocab_id}"}
    cur_stage = 0
    if _SRS_COL is not None:
        try:
            doc = await _SRS_COL.find_one({"user_id": user_id, "vocab_id": vocab_id})
            cur_stage = (doc or {}).get("stage", 0)
        except Exception:
            pass
    new_stage = {
        "again": max(0, cur_stage - 1),
        "good":  cur_stage + 1,
        "easy":  cur_stage + 2,
    }.get(grade, cur_stage)
    new_stage = max(0, min(new_stage, len(_SRS_INTERVALS) - 1))
    next_at = _next_review_at(new_stage)
    record = {
        "user_id":         user_id,
        "vocab_id":        vocab_id,
        "stage":           new_stage,
        "last_grade":      grade,
        "next_review_at":  next_at,
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
# 5 — Kana progress tracking
# ═══════════════════════════════════════════════════════════════════════════════

async def kana_review(char: str, correct: bool, user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    """Record a kana review. Tracks correct/incorrect counters per character."""
    if _KANA_COL is None:
        return {"status": "ok", "persisted": False}
    try:
        await _KANA_COL.update_one(
            {"user_id": user_id, "char": char},
            {
                "$inc": {"reviews": 1, "correct": 1 if correct else 0,
                                       "wrong":   0 if correct else 1},
                "$set": {"last_reviewed_at": datetime.now(timezone.utc).isoformat()},
            },
            upsert=True,
        )
        return {"status": "ok", "persisted": True}
    except Exception:
        return {"status": "ok", "persisted": False}


async def _kana_known_count(user_id: str = DEFAULT_USER) -> int:
    """A kana is 'known' when correct >= 3 and accuracy >= 70%."""
    if _KANA_COL is None:
        return 0
    try:
        cursor = _KANA_COL.find({"user_id": user_id})
        known = 0
        async for doc in cursor:
            c = doc.get("correct", 0)
            t = doc.get("reviews", 0)
            if c >= 3 and t > 0 and (c / t) >= 0.7:
                known += 1
        return known
    except Exception:
        return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 6 — Kanji progress
# ═══════════════════════════════════════════════════════════════════════════════

async def kanji_mark(char: str, status: str, user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    """status: 'learning' | 'known' | 'review'."""
    if _KANJI_COL is None:
        return {"status": "ok", "persisted": False}
    try:
        await _KANJI_COL.update_one(
            {"user_id": user_id, "char": char},
            {"$set": {"status": status,
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"status": "ok", "persisted": True}
    except Exception:
        return {"status": "ok", "persisted": False}


async def _kanji_known_count(user_id: str = DEFAULT_USER) -> int:
    if _KANJI_COL is None:
        return 0
    try:
        return await _KANJI_COL.count_documents({"user_id": user_id, "status": "known"})
    except Exception:
        return 0


async def _vocab_known_count(user_id: str = DEFAULT_USER) -> int:
    """Words at stage 3 or higher are considered 'known'."""
    if _SRS_COL is None:
        return 0
    try:
        return await _SRS_COL.count_documents({"user_id": user_id, "stage": {"$gte": 3}})
    except Exception:
        return 0


# ═══════════════════════════════════════════════════════════════════════════════
# 7 — Dashboard / Overview
# ═══════════════════════════════════════════════════════════════════════════════

async def get_overview(user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    """Aggregate dashboard data: stats, today's mission, streak."""
    kana_known  = await _kana_known_count(user_id)
    kanji_known = await _kanji_known_count(user_id)
    vocab_known = await _vocab_known_count(user_id)
    due_items   = await srs_due(user_id, limit=100)
    srs_due_n   = sum(1 for d in due_items if not d.get("is_new"))
    new_today   = sum(1 for d in due_items if d.get("is_new"))

    # Adaptive level — very simple heuristic for V1
    if kanji_known >= 10 and vocab_known >= 40:
        level, target = "Beginner+", "N5"
    elif kanji_known >= 5 or vocab_known >= 20:
        level, target = "Beginner",  "N5"
    else:
        level, target = "Starter",   "N5"

    # Today's mission — deterministic for now (no streak persistence in V1)
    mission = [
        {"type": "kana",  "count": 10, "label": "kana reviews"},
        {"type": "kanji", "count": 3,  "label": "kanji stroke practices"},
        {"type": "srs",   "count": min(20, srs_due_n + new_today), "label": "vocabulary reviews"},
        {"type": "conv",  "count": 1,  "label": "mini-dialogue"},
    ]

    return {
        "user_id":      user_id,
        "level":        level,
        "jlpt_target":  target,
        "streak_days":  0,   # V1: not yet persisted across sessions
        "stats": {
            "kana_known":      kana_known,
            "kana_total":      len(_ALL_KANA),
            "kanji_known":     kanji_known,
            "kanji_total":     len(_KANJI),
            "vocab_known":     vocab_known,
            "vocab_total":     len(_VOCAB),
            "srs_due_today":   srs_due_n,
            "srs_new_today":   new_today,
        },
        "todays_mission":   mission,
        "generated_at":     datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 8 — Conversation Sensei (LLM-backed chat)
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS: Dict[str, Dict[str, str]] = {
    "intro":          {"en": "Introducing yourself",  "es": "Presentarte",            "no": "Presentere deg selv",
                       "first": "こんにちは。お名前は何ですか？"},
    "coffee":         {"en": "Ordering coffee",       "es": "Pedir un café",          "no": "Bestille kaffe",
                       "first": "いらっしゃいませ！ご注文は？"},
    "directions":     {"en": "Asking for directions", "es": "Pedir direcciones",      "no": "Spørre om veien",
                       "first": "すみません、駅はどこですか？"},
    "convenience":    {"en": "At the convenience store","es":"En la tienda 24h",      "no": "På nærbutikken",
                       "first": "いらっしゃいませ。袋は要りますか？"},
    "smalltalk":      {"en": "Small talk",            "es": "Charla cotidiana",       "no": "Småprat",
                       "first": "今日はいい天気ですね。"},
}

_LANG_NAMES = {"es": "Spanish", "en": "English", "no": "Norwegian"}


def _sensei_system_prompt(scenario: str, difficulty: str, lang: str) -> str:
    explain_lang = _LANG_NAMES.get(lang, "English")
    scen_label   = SCENARIOS.get(scenario, {}).get("en", scenario)
    return (
        f"You are Japanese Sensei AI, a patient, precise and encouraging Japanese tutor.\n\n"
        f"SCENARIO: {scen_label}\n"
        f"LEARNER LEVEL: {difficulty} (JLPT N5 vocabulary by default)\n"
        f"EXPLANATION LANGUAGE: {explain_lang}\n\n"
        f"Strict response format for EVERY reply — return JSON only, no markdown:\n"
        f'{{"jp":"<your Japanese reply>","kana":"<full hiragana reading>",'
        f'"romaji":"<roomaji>","translation":"<natural {explain_lang} translation>",'
        f'"hint":"<short cultural or grammar tip in {explain_lang}, optional>",'
        f'"correction":"<gentle correction of the learner\'s last message if needed, in {explain_lang}, optional>"}}\n\n'
        f"Rules:\n"
        f"- Keep `jp` short and natural for the difficulty level.\n"
        f"- For Beginner: use only N5 grammar (です/ます, は/が/を/に/で, basic verbs).\n"
        f"- For Intermediate: introduce て-form, past tense, comparison, modest casual forms.\n"
        f"- For Advanced: use natural conversational Japanese including idioms.\n"
        f"- ALWAYS include kana reading even if Japanese has no kanji.\n"
        f"- Never lecture. Stay in scenario. Encourage progress."
    )


async def conversation_message(
    scenario:    str,
    difficulty:  str,
    history:     List[Dict[str, str]],
    user_text:   Optional[str],
    lang:        str = "es",
) -> Dict[str, Any]:
    """Send one turn to the LLM. When `user_text` is None and history is empty,
    the sensei kicks off with the scenario opener."""
    scen = SCENARIOS.get(scenario, SCENARIOS["intro"])

    # Cold start — return the scripted opener (avoids burning an LLM call)
    if not history and not user_text:
        opener = scen["first"]
        return {
            "jp":          opener,
            "kana":        opener,      # already kana-rich for our openers
            "romaji":      "",
            "translation": "",
            "hint":        "",
            "correction":  "",
            "is_mock":     False,
            "scenario":    scenario,
            "difficulty":  difficulty,
        }

    if ask_ai_unified is None:
        return _mock_sensei_reply(scenario, difficulty, user_text or "", lang)

    sys_prompt = _sensei_system_prompt(scenario, difficulty, lang)
    messages: List[Dict[str, str]] = [{"role": "system", "content": sys_prompt}]
    for turn in history[-10:]:   # cap context
        messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    if user_text:
        messages.append({"role": "user", "content": user_text})

    try:
        raw = await ask_ai_unified(
            prompt=user_text or scen["first"],
            task_type="dialogue",
            complexity="medium",
            max_tokens=400,
            messages=messages,
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
            parsed["is_mock"]    = False
            parsed["scenario"]   = scenario
            parsed["difficulty"] = difficulty
            # Persist turn (best-effort)
            if _CONV_COL is not None:
                try:
                    await _CONV_COL.update_one(
                        {"scenario": scenario, "user_id": DEFAULT_USER},
                        {"$push": {"turns": {"role": "assistant", "content": parsed.get("jp",""),
                                              "ts": datetime.now(timezone.utc).isoformat()}}},
                        upsert=True,
                    )
                except Exception:
                    pass
            return parsed
    except Exception:
        pass
    return _mock_sensei_reply(scenario, difficulty, user_text or "", lang)


def _mock_sensei_reply(scenario: str, difficulty: str, user_text: str, lang: str) -> Dict[str, Any]:
    """Deterministic fallback when no LLM is available."""
    mocks = {
        "es": ("そうですか。もう一度言ってください。", "そうですか。もういちどいってください。",
               "sou desu ka. mou ichido itte kudasai.", "¿Ah sí? Por favor, dilo otra vez."),
        "en": ("そうですか。もう一度言ってください。", "そうですか。もういちどいってください。",
               "sou desu ka. mou ichido itte kudasai.", "Oh really? Please say that again."),
        "no": ("そうですか。もう一度言ってください。", "そうですか。もういちどいってください。",
               "sou desu ka. mou ichido itte kudasai.", "Å, jaså? Vennligst si det igjen."),
    }
    jp, kana, romaji, tr = mocks.get(lang, mocks["en"])
    return {
        "jp": jp, "kana": kana, "romaji": romaji, "translation": tr,
        "hint": "[Mock sensei — connect an AI model for live conversation.]",
        "correction": "", "is_mock": True,
        "scenario": scenario, "difficulty": difficulty,
    }


def scenarios_catalogue(lang: str = "es") -> List[Dict[str, str]]:
    return [
        {"key": k, "label": v.get(lang, v["en"]), "first": v["first"]}
        for k, v in SCENARIOS.items()
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# 9 — Grammar Path (N5 points, Bunpro-inspired)
# ═══════════════════════════════════════════════════════════════════════════════

_GRAMMAR_POINTS: List[Dict[str, Any]] = [
    {"id":"g1","level":"N5","title":"は (topic marker)",
     "pattern":"<noun> + は + <comment>",
     "explanation":{"en":"は marks the TOPIC of the sentence — 'as for X'. It is NOT 'is'.",
                    "es":"は marca el TEMA de la frase — 'en cuanto a X'. NO significa 'ser/estar'.",
                    "no":"は markerer SETNINGENS TEMA — 'når det gjelder X'. Det betyr IKKE 'er'."},
     "examples":[{"jp":"私は学生です。","kana":"わたしはがくせいです。","en":"As for me, (I) am a student.","es":"En cuanto a mí, soy estudiante.","no":"Når det gjelder meg, er jeg student."},
                 {"jp":"今日は寒いです。","kana":"きょうはさむいです。","en":"As for today, it's cold.","es":"En cuanto a hoy, hace frío.","no":"I dag er det kaldt."}],
     "commonMistake":{"en":"Don't translate は mechanically as 'is'. It marks the topic only.",
                      "es":"No traduzcas は mecánicamente como 'es/está'. Solo marca el tema.",
                      "no":"Ikke oversett は mekanisk som 'er'. Den markerer bare temaet."},
     "quiz":[{"prompt":"私 ___ イグナシオです。","options":["は","が","を","に"],"answer":"は"},
             {"prompt":"今日 ___ 月曜日です。","options":["を","は","で","の"],"answer":"は"}]},

    {"id":"g2","level":"N5","title":"が (subject marker)",
     "pattern":"<subject> + が + <verb/adjective>",
     "explanation":{"en":"が marks the SUBJECT — the thing that does or is. Often used to introduce NEW information.",
                    "es":"が marca el SUJETO — lo que hace o lo que es. A menudo introduce información NUEVA.",
                    "no":"が markerer SUBJEKTET — det som gjør eller er. Ofte brukt for å introdusere NY informasjon."},
     "examples":[{"jp":"猫が好きです。","kana":"ねこがすきです。","en":"I like cats. (Lit: cats are likeable)","es":"Me gustan los gatos.","no":"Jeg liker katter."},
                 {"jp":"雨が降っています。","kana":"あめがふっています。","en":"It is raining.","es":"Está lloviendo.","no":"Det regner."}],
     "commonMistake":{"en":"With 好き/きらい, use が, not を: 猫が好きです (not 猫を好きです).",
                      "es":"Con 好き/きらい, usa が, no を: 猫が好きです (no 猫を好きです).",
                      "no":"Med 好き/きらい, bruk が, ikke を: 猫が好きです (ikke 猫を好きです)."},
     "quiz":[{"prompt":"犬 ___ 好きです。","options":["を","が","は","に"],"answer":"が"},
             {"prompt":"雨 ___ 降っています。","options":["は","を","が","に"],"answer":"が"}]},

    {"id":"g3","level":"N5","title":"の (possession / connector)",
     "pattern":"<noun1> + の + <noun2>",
     "explanation":{"en":"の links two nouns: possession, type, or origin. 'X's Y' or 'X of Y'.",
                    "es":"の une dos sustantivos: posesión, tipo u origen. 'Y de X'.",
                    "no":"の forbinder to substantiver: eierskap, type eller opphav. 'X sin Y'."},
     "examples":[{"jp":"私の本","kana":"わたしのほん","en":"my book","es":"mi libro","no":"min bok"},
                 {"jp":"日本の車","kana":"にほんのくるま","en":"Japanese car","es":"coche japonés","no":"japansk bil"}],
     "commonMistake":{"en":"Don't add の between adjective and noun: 大きい家 (NOT 大きいの家).",
                      "es":"No pongas の entre adjetivo y sustantivo: 大きい家 (NO 大きいの家).",
                      "no":"Ikke legg til の mellom adjektiv og substantiv: 大きい家 (IKKE 大きいの家)."},
     "quiz":[{"prompt":"これは私 ___ 本です。","options":["は","を","の","に"],"answer":"の"},
             {"prompt":"日本 ___ 車","options":["の","は","を","で"],"answer":"の"}]},

    {"id":"g4","level":"N5","title":"を (object marker)",
     "pattern":"<noun> + を + <transitive verb>",
     "explanation":{"en":"を marks the direct OBJECT of a verb (what is being acted upon).",
                    "es":"を marca el OBJETO directo de un verbo (lo que recibe la acción).",
                    "no":"を markerer det direkte OBJEKTET for et verb."},
     "examples":[{"jp":"水を飲みます。","kana":"みずをのみます。","en":"I drink water.","es":"Bebo agua.","no":"Jeg drikker vann."},
                 {"jp":"本を読みます。","kana":"ほんをよみます。","en":"I read a book.","es":"Leo un libro.","no":"Jeg leser en bok."}],
     "commonMistake":{"en":"を is only used with transitive verbs that take an object.",
                      "es":"を solo se usa con verbos transitivos que llevan objeto.",
                      "no":"を brukes bare med transitive verb som tar et objekt."},
     "quiz":[{"prompt":"コーヒー ___ 飲みます。","options":["を","は","が","の"],"answer":"を"},
             {"prompt":"テレビ ___ 見ます。","options":["の","は","を","に"],"answer":"を"}]},

    {"id":"g5","level":"N5","title":"に / で (location & time)",
     "pattern":"<place> + に (existence/destination) | <place> + で (action location)",
     "explanation":{"en":"に = destination or location of existence. で = location where an ACTION happens.",
                    "es":"に = destino o lugar de existencia. で = lugar donde ocurre una ACCIÓN.",
                    "no":"に = mål eller eksistenssted. で = sted der en HANDLING skjer."},
     "examples":[{"jp":"学校に行きます。","kana":"がっこうにいきます。","en":"I go TO school.","es":"Voy A la escuela.","no":"Jeg går TIL skolen."},
                 {"jp":"学校で勉強します。","kana":"がっこうでべんきょうします。","en":"I study AT school.","es":"Estudio EN la escuela.","no":"Jeg studerer PÅ skolen."}],
     "commonMistake":{"en":"Going TO a place = に. Doing something AT a place = で.",
                      "es":"Ir A un lugar = に. Hacer algo EN un lugar = で.",
                      "no":"Gå TIL et sted = に. Gjøre noe PÅ et sted = で."},
     "quiz":[{"prompt":"駅 ___ 行きます。","options":["で","に","を","は"],"answer":"に"},
             {"prompt":"家 ___ 食べます。","options":["に","の","で","を"],"answer":"で"}]},

    {"id":"g6","level":"N5","title":"あります / います (existence)",
     "pattern":"<object> + が + あります | <person/animal> + が + います",
     "explanation":{"en":"あります = exists (inanimate). います = exists (animate: people, animals).",
                    "es":"あります = existe (inanimado). います = existe (animado: personas, animales).",
                    "no":"あります = eksisterer (livløs). います = eksisterer (levende: mennesker, dyr)."},
     "examples":[{"jp":"机に本があります。","kana":"つくえにほんがあります。","en":"There is a book on the desk.","es":"Hay un libro en la mesa.","no":"Det er en bok på pulten."},
                 {"jp":"猫がいます。","kana":"ねこがいます。","en":"There is a cat.","es":"Hay un gato.","no":"Det er en katt."}],
     "commonMistake":{"en":"Use います for living things — including fish and insects.",
                      "es":"Usa います para seres vivos — incluyendo peces e insectos.",
                      "no":"Bruk います for levende ting — inkludert fisk og insekter."},
     "quiz":[{"prompt":"机に本が ___ 。","options":["います","あります","です","ます"],"answer":"あります"},
             {"prompt":"犬が ___ 。","options":["あります","ます","います","です"],"answer":"います"}]},

    {"id":"g7","level":"N5","title":"て-form (linking verbs)",
     "pattern":"<verb in て-form> + <next clause>",
     "explanation":{"en":"The て-form links actions: 'and then', 'because', or makes requests with ください.",
                    "es":"La forma て conecta acciones: 'y entonces', 'porque', o forma peticiones con ください.",
                    "no":"て-formen kobler handlinger: 'og så', 'fordi', eller danner forespørsler med ください."},
     "examples":[{"jp":"朝起きて、コーヒーを飲みます。","kana":"あさおきて、コーヒーをのみます。","en":"I wake up and drink coffee.","es":"Me levanto y bebo café.","no":"Jeg våkner og drikker kaffe."},
                 {"jp":"待ってください。","kana":"まってください。","en":"Please wait.","es":"Por favor espera.","no":"Vennligst vent."}],
     "commonMistake":{"en":"て-form conjugation differs per verb group. 食べる→食べて, 飲む→飲んで, 行く→行って.",
                      "es":"La conjugación de て varía por grupo verbal. 食べる→食べて, 飲む→飲んで, 行く→行って.",
                      "no":"て-bøying varierer etter verbgruppe. 食べる→食べて, 飲む→飲んで, 行く→行って."},
     "quiz":[{"prompt":"飲む の て-form は?","options":["飲んで","飲みて","飲まて","飲った"],"answer":"飲んで"},
             {"prompt":"食べる の て-form は?","options":["食べんで","食べって","食べて","食べた"],"answer":"食べて"}]},

    {"id":"g8","level":"N5","title":"past tense (~ました / ~でした)",
     "pattern":"<verb stem> + ました | <noun/adj> + でした",
     "explanation":{"en":"Polite past: ます→ました for verbs, です→でした for nouns/な-adjectives.",
                    "es":"Pasado cortés: ます→ました para verbos, です→でした para nombres/adj. na.",
                    "no":"Høflig fortid: ます→ました for verb, です→でした for substantiv/na-adj."},
     "examples":[{"jp":"昨日寿司を食べました。","kana":"きのうすしをたべました。","en":"I ate sushi yesterday.","es":"Comí sushi ayer.","no":"Jeg spiste sushi i går."},
                 {"jp":"昨日は暇でした。","kana":"きのうはひまでした。","en":"Yesterday I was free.","es":"Ayer estaba libre.","no":"I går var jeg ledig."}],
     "commonMistake":{"en":"い-adjective past is different: 寒い → 寒かった (not 寒いでした).",
                      "es":"El pasado de adj. い es diferente: 寒い → 寒かった (no 寒いでした).",
                      "no":"Fortid av i-adjektiv er annerledes: 寒い → 寒かった (ikke 寒いでした)."},
     "quiz":[{"prompt":"昨日寿司を食べ___。","options":["ます","ました","ません","です"],"answer":"ました"},
             {"prompt":"昨日は学生 ___。","options":["でした","ました","です","だった"],"answer":"でした"}]},

    {"id":"g9","level":"N5","title":"です / ます (politeness)",
     "pattern":"<noun/adj> + です | <verb stem> + ます",
     "explanation":{"en":"です follows nouns and adjectives, ます attaches to verb stems. Both signal polite register.",
                    "es":"です sigue a nombres y adjetivos, ます se une a raíces verbales. Ambos marcan registro cortés.",
                    "no":"です følger substantiv og adjektiv, ます festes til verbstammer. Begge signaliserer høflig register."},
     "examples":[{"jp":"これはペンです。","kana":"これはペンです。","en":"This is a pen.","es":"Esto es un bolígrafo.","no":"Dette er en penn."},
                 {"jp":"日本語を勉強します。","kana":"にほんごをべんきょうします。","en":"I study Japanese.","es":"Estudio japonés.","no":"Jeg studerer japansk."}],
     "commonMistake":{"en":"Don't pair です with verbs — use ます: 食べます ✓, 食べるです ✗.",
                      "es":"No pongas です con verbos — usa ます: 食べます ✓, 食べるです ✗.",
                      "no":"Ikke kombiner です med verb — bruk ます: 食べます ✓, 食べるです ✗."},
     "quiz":[{"prompt":"これはペン ___。","options":["ます","です","でした","ました"],"answer":"です"},
             {"prompt":"日本語を勉強し ___。","options":["です","ました","ます","でした"],"answer":"ます"}]},

    {"id":"g10","level":"N5","title":"から (because / from)",
     "pattern":"<clause A> + から、<clause B>",
     "explanation":{"en":"から after a complete clause = 'because'. After a noun/time = 'from'.",
                    "es":"から tras una oración completa = 'porque'. Tras nombre/tiempo = 'desde'.",
                    "no":"から etter en hel setning = 'fordi'. Etter substantiv/tid = 'fra'."},
     "examples":[{"jp":"寒いから、コートを着ます。","kana":"さむいから、コートをきます。","en":"I wear a coat because it's cold.","es":"Me pongo un abrigo porque hace frío.","no":"Jeg tar på meg en frakk fordi det er kaldt."},
                 {"jp":"9時から働きます。","kana":"くじからはたらきます。","en":"I work from 9 o'clock.","es":"Trabajo desde las 9.","no":"Jeg jobber fra klokken 9."}],
     "commonMistake":{"en":"から needs a complete clause before it, not just a noun, for 'because'.",
                      "es":"から necesita una oración completa antes para significar 'porque', no solo un nombre.",
                      "no":"から trenger en hel setning før seg for 'fordi', ikke bare et substantiv."},
     "quiz":[{"prompt":"寒い ___、コートを着ます。","options":["で","から","の","は"],"answer":"から"},
             {"prompt":"9時 ___ 働きます。","options":["を","は","から","に"],"answer":"から"}]},
]

_GRAMMAR_MAP = {g["id"]: g for g in _GRAMMAR_POINTS}


def get_grammar_path(level: str = "N5") -> List[Dict[str, Any]]:
    return [g for g in _GRAMMAR_POINTS if g["level"] == level]


def get_grammar_point(point_id: str) -> Optional[Dict[str, Any]]:
    return _GRAMMAR_MAP.get(point_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 10 — Reading Practice (5 short N5 texts)
# ═══════════════════════════════════════════════════════════════════════════════

_READING_TEXTS: List[Dict[str, Any]] = [
    {"id":"morning","level":"N5","title":"朝のルーティン",
     "title_translations":{"en":"Morning routine","es":"Rutina matinal","no":"Morgenrutine"},
     "segments":[
         {"jp":"私は","kana":"わたしは","words":[{"w":"私","k":"わたし","m":"I"},{"w":"は","k":"は","m":"(topic)"}]},
         {"jp":"毎朝","kana":"まいあさ","words":[{"w":"毎朝","k":"まいあさ","m":"every morning"}]},
         {"jp":"七時に","kana":"しちじに","words":[{"w":"七時","k":"しちじ","m":"7 o'clock"},{"w":"に","k":"に","m":"at"}]},
         {"jp":"起きます。","kana":"おきます","words":[{"w":"起きます","k":"おきます","m":"get up"}]},
         {"jp":"そして","kana":"そして","words":[{"w":"そして","k":"そして","m":"and then"}]},
         {"jp":"コーヒーを","kana":"コーヒーを","words":[{"w":"コーヒー","k":"コーヒー","m":"coffee"},{"w":"を","k":"を","m":"(object)"}]},
         {"jp":"飲みます。","kana":"のみます","words":[{"w":"飲みます","k":"のみます","m":"drink"}]},
     ],
     "translation":{"en":"I get up at 7 every morning. Then I drink coffee.",
                    "es":"Me levanto a las 7 todas las mañanas. Después bebo café.",
                    "no":"Jeg står opp klokken 7 hver morgen. Så drikker jeg kaffe."},
     "questions":[{"q":{"en":"What time do I get up?","es":"¿A qué hora me levanto?","no":"Når står jeg opp?"},
                   "a":{"en":"7 o'clock","es":"A las 7","no":"Klokken 7"}}]},

    {"id":"school","level":"N5","title":"学校",
     "title_translations":{"en":"School","es":"La escuela","no":"Skolen"},
     "segments":[
         {"jp":"学校は","kana":"がっこうは","words":[{"w":"学校","k":"がっこう","m":"school"},{"w":"は","k":"は","m":"(topic)"}]},
         {"jp":"駅から","kana":"えきから","words":[{"w":"駅","k":"えき","m":"station"},{"w":"から","k":"から","m":"from"}]},
         {"jp":"近いです。","kana":"ちかいです","words":[{"w":"近い","k":"ちかい","m":"near"},{"w":"です","k":"です","m":"(copula)"}]},
         {"jp":"友達と","kana":"ともだちと","words":[{"w":"友達","k":"ともだち","m":"friend"},{"w":"と","k":"と","m":"with"}]},
         {"jp":"歩いて","kana":"あるいて","words":[{"w":"歩いて","k":"あるいて","m":"walk (て-form)"}]},
         {"jp":"行きます。","kana":"いきます","words":[{"w":"行きます","k":"いきます","m":"go"}]},
     ],
     "translation":{"en":"The school is close to the station. I walk there with a friend.",
                    "es":"La escuela está cerca de la estación. Voy andando con un amigo.",
                    "no":"Skolen ligger nær stasjonen. Jeg går dit sammen med en venn."},
     "questions":[{"q":{"en":"How do I go to school?","es":"¿Cómo voy a la escuela?","no":"Hvordan kommer jeg til skolen?"},
                   "a":{"en":"Walking with a friend","es":"Andando con un amigo","no":"Til fots med en venn"}}]},

    {"id":"hobby","level":"N5","title":"趣味",
     "title_translations":{"en":"Hobbies","es":"Aficiones","no":"Hobby"},
     "segments":[
         {"jp":"私の","kana":"わたしの","words":[{"w":"私","k":"わたし","m":"I"},{"w":"の","k":"の","m":"(possessive)"}]},
         {"jp":"趣味は","kana":"しゅみは","words":[{"w":"趣味","k":"しゅみ","m":"hobby"},{"w":"は","k":"は","m":"(topic)"}]},
         {"jp":"漫画を","kana":"まんがを","words":[{"w":"漫画","k":"まんが","m":"manga"},{"w":"を","k":"を","m":"(object)"}]},
         {"jp":"読む","kana":"よむ","words":[{"w":"読む","k":"よむ","m":"to read"}]},
         {"jp":"ことです。","kana":"ことです","words":[{"w":"こと","k":"こと","m":"act of"},{"w":"です","k":"です","m":"(copula)"}]},
     ],
     "translation":{"en":"My hobby is reading manga.",
                    "es":"Mi afición es leer manga.",
                    "no":"Hobbyen min er å lese manga."},
     "questions":[{"q":{"en":"What is my hobby?","es":"¿Cuál es mi afición?","no":"Hva er hobbyen min?"},
                   "a":{"en":"Reading manga","es":"Leer manga","no":"Å lese manga"}}]},

    {"id":"food","level":"N5","title":"好きな食べ物",
     "title_translations":{"en":"Favourite food","es":"Comida favorita","no":"Yndlingsmat"},
     "segments":[
         {"jp":"私は","kana":"わたしは","words":[{"w":"私","k":"わたし","m":"I"},{"w":"は","k":"は","m":"(topic)"}]},
         {"jp":"寿司が","kana":"すしが","words":[{"w":"寿司","k":"すし","m":"sushi"},{"w":"が","k":"が","m":"(subject)"}]},
         {"jp":"大好きです。","kana":"だいすきです","words":[{"w":"大好き","k":"だいすき","m":"love (favourite)"},{"w":"です","k":"です","m":"(copula)"}]},
         {"jp":"特に","kana":"とくに","words":[{"w":"特に","k":"とくに","m":"especially"}]},
         {"jp":"マグロが","kana":"マグロが","words":[{"w":"マグロ","k":"マグロ","m":"tuna"},{"w":"が","k":"が","m":"(subject)"}]},
         {"jp":"好きです。","kana":"すきです","words":[{"w":"好き","k":"すき","m":"like"},{"w":"です","k":"です","m":"(copula)"}]},
     ],
     "translation":{"en":"I love sushi. I especially like tuna.",
                    "es":"Me encanta el sushi. Especialmente me gusta el atún.",
                    "no":"Jeg elsker sushi. Spesielt liker jeg tunfisk."},
     "questions":[{"q":{"en":"Which sushi do I like most?","es":"¿Qué tipo de sushi me gusta más?","no":"Hvilken sushi liker jeg best?"},
                   "a":{"en":"Tuna","es":"Atún","no":"Tunfisk"}}]},

    {"id":"weekend","level":"N5","title":"週末",
     "title_translations":{"en":"Weekend","es":"Fin de semana","no":"Helg"},
     "segments":[
         {"jp":"週末は","kana":"しゅうまつは","words":[{"w":"週末","k":"しゅうまつ","m":"weekend"},{"w":"は","k":"は","m":"(topic)"}]},
         {"jp":"家で","kana":"いえで","words":[{"w":"家","k":"いえ","m":"home"},{"w":"で","k":"で","m":"at"}]},
         {"jp":"休みます。","kana":"やすみます","words":[{"w":"休みます","k":"やすみます","m":"rest"}]},
         {"jp":"映画を","kana":"えいがを","words":[{"w":"映画","k":"えいが","m":"movie"},{"w":"を","k":"を","m":"(object)"}]},
         {"jp":"見たり、","kana":"みたり","words":[{"w":"見たり","k":"みたり","m":"watch (and so on)"}]},
         {"jp":"本を読んだり","kana":"ほんをよんだり","words":[{"w":"本","k":"ほん","m":"book"},{"w":"読んだり","k":"よんだり","m":"read (and so on)"}]},
         {"jp":"します。","kana":"します","words":[{"w":"します","k":"します","m":"do"}]},
     ],
     "translation":{"en":"On weekends I rest at home. I watch movies, read books, and so on.",
                    "es":"Los fines de semana descanso en casa. Veo películas, leo libros y cosas así.",
                    "no":"I helgene hviler jeg hjemme. Jeg ser filmer, leser bøker og lignende."},
     "questions":[{"q":{"en":"Where do I rest on weekends?","es":"¿Dónde descanso los fines de semana?","no":"Hvor hviler jeg i helgene?"},
                   "a":{"en":"At home","es":"En casa","no":"Hjemme"}}]},
]

_READING_MAP = {r["id"]: r for r in _READING_TEXTS}


def get_reading_texts() -> List[Dict[str, Any]]:
    # Return lightweight list for picker
    return [{"id": r["id"], "title": r["title"],
             "title_translations": r["title_translations"], "level": r["level"]}
            for r in _READING_TEXTS]


def get_reading_text(text_id: str) -> Optional[Dict[str, Any]]:
    return _READING_MAP.get(text_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 11 — Speaking Lab phrases
# ═══════════════════════════════════════════════════════════════════════════════

_SPEAKING_PHRASES: List[Dict[str, Any]] = [
    {"id":"sp1","jp":"こんにちは。","kana":"こんにちは。","romaji":"konnichiwa.",
     "translations":{"en":"Hello.","es":"Hola.","no":"Hallo."},"level":"N5","tag":"greeting"},
    {"id":"sp2","jp":"おはようございます。","kana":"おはようございます。","romaji":"ohayou gozaimasu.",
     "translations":{"en":"Good morning.","es":"Buenos días.","no":"God morgen."},"level":"N5","tag":"greeting"},
    {"id":"sp3","jp":"ありがとうございます。","kana":"ありがとうございます。","romaji":"arigatou gozaimasu.",
     "translations":{"en":"Thank you.","es":"Gracias.","no":"Takk."},"level":"N5","tag":"essential"},
    {"id":"sp4","jp":"すみません。","kana":"すみません。","romaji":"sumimasen.",
     "translations":{"en":"Excuse me / Sorry.","es":"Disculpa / Perdón.","no":"Unnskyld."},"level":"N5","tag":"essential"},
    {"id":"sp5","jp":"私はイグナシオです。","kana":"わたしはイグナシオです。","romaji":"watashi wa Igunashio desu.",
     "translations":{"en":"I am Ignacio.","es":"Soy Ignacio.","no":"Jeg er Ignacio."},"level":"N5","tag":"intro"},
    {"id":"sp6","jp":"日本語を勉強しています。","kana":"にほんごをべんきょうしています。","romaji":"nihongo wo benkyou shite imasu.",
     "translations":{"en":"I am studying Japanese.","es":"Estoy estudiando japonés.","no":"Jeg studerer japansk."},"level":"N5","tag":"intro"},
    {"id":"sp7","jp":"水をください。","kana":"みずをください。","romaji":"mizu wo kudasai.",
     "translations":{"en":"Water, please.","es":"Agua, por favor.","no":"Vann, takk."},"level":"N5","tag":"request"},
    {"id":"sp8","jp":"駅はどこですか？","kana":"えきはどこですか？","romaji":"eki wa doko desu ka?",
     "translations":{"en":"Where is the station?","es":"¿Dónde está la estación?","no":"Hvor er stasjonen?"},"level":"N5","tag":"question"},
    {"id":"sp9","jp":"今日はいい天気ですね。","kana":"きょうはいいてんきですね。","romaji":"kyou wa ii tenki desu ne.",
     "translations":{"en":"Nice weather today, isn't it?","es":"Buen tiempo hoy, ¿verdad?","no":"Fint vær i dag, ikke sant?"},"level":"N5","tag":"smalltalk"},
    {"id":"sp10","jp":"また明日。","kana":"またあした。","romaji":"mata ashita.",
     "translations":{"en":"See you tomorrow.","es":"Hasta mañana.","no":"Vi ses i morgen."},"level":"N5","tag":"farewell"},
]


def get_speaking_phrases() -> List[Dict[str, Any]]:
    return _SPEAKING_PHRASES


async def speaking_attempt(phrase_id: str, transcript: str, user_id: str = DEFAULT_USER) -> Dict[str, Any]:
    """Record a speaking attempt — the user self-grades via the UI for V2.
    Backend just persists the transcript for later analysis."""
    record = {
        "user_id":    user_id,
        "phrase_id":  phrase_id,
        "transcript": transcript,
        "at":         datetime.now(timezone.utc).isoformat(),
    }
    if _KANA_COL is not None:   # reuse kana DB conn; speaking has no dedicated collection in V2
        try:
            col = _KANA_COL.database.get_collection("japanese_speaking_attempts")
            await col.insert_one(record)
            return {"status": "ok", "persisted": True}
        except Exception:
            pass
    return {"status": "ok", "persisted": False}
