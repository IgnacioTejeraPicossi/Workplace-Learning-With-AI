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
