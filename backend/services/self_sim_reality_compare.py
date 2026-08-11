"""
Self-Simulating Reality Agent — Compare Theories (V2)
=====================================================
Plan §8: a side-by-side comparison of two theories / positions. Each side is first
**grounded via the vector store** (the top KB chunk for that query supplies its title
and epistemic level), then an LLM produces a structured, epistemically-disciplined
comparison: agreements, differences, the relation between them, and an honest note on
what neither settles.

Preserves the module rule: every side carries an evidence level, OPH is always
speculative, and the tool never declares one theory "true". Trilingual mock keeps the
tab alive offline. Never raises.
"""

import json
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_ai_unified
except Exception:  # pragma: no cover
    try:
        from llm import ask_ai_unified  # type: ignore
    except Exception:
        ask_ai_unified = None  # type: ignore

from backend.services import self_sim_reality_vectorstore as vectorstore

COMPARE_VERSION = "1.0.0"

_MAX_QUERY_CHARS = 200
_ALLOWED_LEVELS = {"established", "mainstream", "speculative", "philosophy", "metaphor", "unsupported"}
_ALLOWED_RELATIONS = {"competing", "complementary", "nested", "orthogonal", "unrelated"}

_LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "es": "Responde en español.",
    "no": "Svar på norsk.",
}


def _ground(query: str) -> Dict[str, Any]:
    """Vector-store the best KB chunk for a side → its title + level as grounding."""
    res = vectorstore.search(query, k=1, backend="tfidf")
    if res["results"]:
        top = res["results"][0]
        return {"matched_title": top["title"], "level": top["level"],
                "claim": top["claim"], "sources": top["sources"]}
    return {"matched_title": query, "level": "speculative", "claim": "", "sources": []}


def _system_prompt(lang: str) -> str:
    return (
        "You are the Compare-Theories tool of the Self-Simulating Reality Agent — a "
        "cautious theoretical physicist + philosopher of science. Compare TWO theories "
        "or positions about physics, consciousness, cosmology or simulation.\n\n"
        "EPISTEMIC DISCIPLINE (non-negotiable): tag each side with exactly one evidence "
        "level — established | mainstream | speculative | philosophy | metaphor. Use the "
        "GROUNDING level provided for each side unless it is clearly wrong. NEVER declare "
        "one theory 'true' or 'the winner'. OPH and 'the universe is self-simulating' are "
        "always 'speculative'. Do not conflate 'observer' as a physical system with "
        "'observer' as a conscious mind.\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        "{"
        '"a":{"title":"<short canonical name>","level":"<level>","summary":"<1-2 sentences>"},'
        '"b":{"title":"<short canonical name>","level":"<level>","summary":"<1-2 sentences>"},'
        '"agreements":["<where they actually agree>"],'
        '"differences":[{"point":"<the axis>","a":"<A\'s stance>","b":"<B\'s stance>"}],'
        '"relation":"competing|complementary|nested|orthogonal|unrelated",'
        '"relation_note":"<one honest sentence on how they relate>",'
        '"honest_note":"<what neither settles / the key open question>"'
        "}\n\n"
        "Rules: at least one agreement (or state honestly there are none) and at least one "
        "difference; keep summaries short; 'nested' means one is a special case of the "
        "other; 'orthogonal' means they answer different questions. "
        f"{_LANG_INSTRUCTIONS.get(lang, _LANG_INSTRUCTIONS['en'])}"
    )


# ─── Trilingual mock ────────────────────────────────────────────────────────

_MOCK = {
    "en": {
        "a_sum": "IIT identifies consciousness with integrated information (Φ) in a system — a mathematically formulated but debated theory.",
        "b_sum": "GNW says conscious access happens when information is broadcast across a fronto-parietal workspace — empirically engaged, also not settled.",
        "agree": "Both are serious, mainstream theories of consciousness that treat it as a natural phenomenon amenable to scientific study.",
        "diff_point": "What consciousness fundamentally is",
        "diff_a": "An intrinsic property measured by integration (Φ), present wherever integration is high.",
        "diff_b": "A functional broadcast — consciousness is global availability of information for report and control.",
        "relation": "competing",
        "relation_note": "They compete as explanations of the same target (conscious access) and make different empirical predictions being tested now.",
        "honest_note": "Neither is established; there is no agreed measurement that decisively separates them, and both leave the hard problem open.",
    },
    "es": {
        "a_sum": "La IIT identifica la consciencia con la información integrada (Φ) de un sistema — una teoría formulada matemáticamente pero debatida.",
        "b_sum": "El GNW dice que el acceso consciente ocurre cuando la información se difunde por un espacio de trabajo fronto-parietal — con base empírica, tampoco resuelta.",
        "agree": "Ambas son teorías serias y mainstream de la consciencia que la tratan como un fenómeno natural estudiable científicamente.",
        "diff_point": "Qué es fundamentalmente la consciencia",
        "diff_a": "Una propiedad intrínseca medida por la integración (Φ), presente allí donde la integración es alta.",
        "diff_b": "Una difusión funcional — la consciencia es la disponibilidad global de información para reporte y control.",
        "relation": "competing",
        "relation_note": "Compiten como explicaciones del mismo objetivo (el acceso consciente) y hacen predicciones empíricas distintas que se están probando.",
        "honest_note": "Ninguna está establecida; no hay una medición acordada que las separe de forma decisiva, y ambas dejan abierto el problema difícil.",
    },
    "no": {
        "a_sum": "IIT identifiserer bevissthet med integrert informasjon (Φ) i et system — en matematisk formulert, men omdiskutert teori.",
        "b_sum": "GNW sier at bevisst tilgang skjer når informasjon kringkastes over et fronto-parietalt arbeidsområde — empirisk engasjert, heller ikke avgjort.",
        "agree": "Begge er seriøse, mainstream teorier om bevissthet som behandler den som et naturlig fenomen som kan studeres vitenskapelig.",
        "diff_point": "Hva bevissthet fundamentalt er",
        "diff_a": "En iboende egenskap målt ved integrasjon (Φ), til stede der integrasjonen er høy.",
        "diff_b": "En funksjonell kringkasting — bevissthet er global tilgjengelighet av informasjon for rapport og kontroll.",
        "relation": "competing",
        "relation_note": "De konkurrerer som forklaringer på det samme målet (bevisst tilgang) og gir ulike empiriske prediksjoner som testes nå.",
        "honest_note": "Ingen er etablert; det finnes ingen omforent måling som skiller dem avgjørende, og begge lar det harde problemet stå åpent.",
    },
}


def _mock_lang(lang: str) -> str:
    return lang if lang in _MOCK else "en"


def _make_mock(lang: str, ga: Dict[str, Any], gb: Dict[str, Any],
               a_query: str, b_query: str) -> Dict[str, Any]:
    m = _MOCK[_mock_lang(lang)]
    return {
        "a": {"title": ga["matched_title"] or a_query, "level": ga["level"], "summary": m["a_sum"]},
        "b": {"title": gb["matched_title"] or b_query, "level": gb["level"], "summary": m["b_sum"]},
        "agreements": [m["agree"]],
        "differences": [{"point": m["diff_point"], "a": m["diff_a"], "b": m["diff_b"]}],
        "relation": m["relation"],
        "relation_note": m["relation_note"],
        "honest_note": m["honest_note"],
        "is_mock": True,
        "version": COMPARE_VERSION,
    }


def _sanitize(parsed: Dict[str, Any], ga: Dict[str, Any], gb: Dict[str, Any]) -> Dict[str, Any]:
    for side, g in (("a", ga), ("b", gb)):
        s = parsed.get(side) or {}
        if not isinstance(s, dict):
            s = {}
        lvl = s.get("level")
        s["level"] = lvl if lvl in _ALLOWED_LEVELS else g["level"]
        s.setdefault("title", g["matched_title"])
        s.setdefault("summary", "")
        parsed[side] = s
    parsed.setdefault("agreements", [])
    diffs = parsed.get("differences") or []
    parsed["differences"] = [d for d in diffs if isinstance(d, dict)]
    rel = parsed.get("relation")
    parsed["relation"] = rel if rel in _ALLOWED_RELATIONS else "competing"
    parsed.setdefault("relation_note", "")
    parsed.setdefault("honest_note", "")
    return parsed


async def compare(a_query: str, b_query: str, lang: str = "en") -> Dict[str, Any]:
    """Compare two theories/positions. Never raises; mock on LLM failure."""
    a_query = (a_query or "").strip()[:_MAX_QUERY_CHARS]
    b_query = (b_query or "").strip()[:_MAX_QUERY_CHARS]
    if not a_query or not b_query:
        return {"error": "two_queries_required"}

    ga, gb = _ground(a_query), _ground(b_query)

    if ask_ai_unified is not None:
        try:
            grounding = (
                "[GROUNDING — vector-store matches, use their evidence levels]\n"
                f"A ('{a_query}') → ({ga['level']}) {ga['matched_title']}: {ga['claim']}\n"
                f"B ('{b_query}') → ({gb['level']}) {gb['matched_title']}: {gb['claim']}"
            )
            raw = await ask_ai_unified(
                messages=[
                    {"role": "system", "content": _system_prompt(lang)},
                    {"role": "system", "content": grounding},
                    {"role": "user", "content": f"Compare A = «{a_query}» with B = «{b_query}»."},
                ],
                task_type="analysis", complexity="high", max_tokens=1600,
            )
            if raw and not raw.startswith("[MOCKED RESPONSE"):
                clean = raw.strip()
                if clean.startswith("```"):
                    parts = clean.split("```")
                    clean = parts[1] if len(parts) > 1 else clean
                    if clean.startswith("json"):
                        clean = clean[4:]
                parsed = _sanitize(json.loads(clean.strip()), ga, gb)
                parsed["is_mock"] = False
                parsed["version"] = COMPARE_VERSION
                return parsed
        except Exception:
            pass

    return _make_mock(lang, ga, gb, a_query, b_query)


def health() -> Dict[str, Any]:
    return {"status": "ok", "component": "self_sim_reality_compare",
            "version": COMPARE_VERSION, "llm_available": ask_ai_unified is not None}
