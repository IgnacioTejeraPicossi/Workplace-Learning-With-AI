"""
Self-Simulating Reality Agent — Red Team (V2)
=============================================
Plan §8: a focused, standalone "challenge this claim" tool. Where the Dialogue emits
objections to its OWN answer and the Claim Analyzer decomposes core/overreach, the Red
Team subjects a claim to the strongest GOOD-FAITH adversarial critique:

  1. steelman                   — the strongest fair version of the claim first (so we
                                  attack the best form, never a strawman)
  2. objections[]               — typed, each with a strength rating
  3. what_would_change_my_mind  — concrete evidence that would defeat the objections
  4. surviving_core             — what part honestly survives, if any
  5. verdict                    — holds_up | weakened | does_not_survive

Grounded via the vector store (the claim's top KB chunk) so critiques cite the module's
own sources. Epistemic discipline preserved: OPH stays speculative, the observer-as-device
vs observer-as-mind conflation is a fair game to raise, and the tool is honest about which
objections are strong vs weak. Trilingual mock. Never raises.
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

REDTEAM_VERSION = "1.0.0"

_MAX_CLAIM_CHARS = 2000
_ALLOWED_TYPES = {"empirical", "logical", "conceptual", "methodological", "parsimony"}
_ALLOWED_STRENGTH = {"strong", "moderate", "weak"}
_ALLOWED_VERDICTS = {"holds_up", "weakened", "does_not_survive"}

_LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "es": "Responde en español.",
    "no": "Svar på norsk.",
}


def _ground(claim: str) -> Dict[str, Any]:
    res = vectorstore.search(claim, k=2, backend="tfidf")
    return res["results"]


def _system_prompt(lang: str) -> str:
    return (
        "You are the Red Team of the Self-Simulating Reality Agent — a rigorous, "
        "GOOD-FAITH adversarial critic. Your job is to stress-test a claim about "
        "physics, consciousness, cosmology or simulation as hard as honesty allows.\n\n"
        "METHOD (non-negotiable):\n"
        " 1. First STEELMAN the claim — state its strongest fair version, so you attack "
        "the best form of the idea, never a strawman.\n"
        " 2. Then raise the strongest objections. Be honest about each objection's "
        "strength — do not inflate weak ones.\n"
        " 3. Say what evidence or argument would actually DEFEAT your objections (what "
        "would change your mind).\n"
        " 4. State the surviving core — the part of the claim that honestly holds up, if "
        "any, and at what evidence level.\n"
        " 5. Give an overall verdict.\n\n"
        "Discipline: OPH and 'the universe is self-simulating' are speculative, not false — "
        "critique their evidence status, do not mock them. A fair objection to raise when "
        "relevant is the conflation of 'observer' as a physical measuring system with "
        "'observer' as a conscious mind. Never claim a speculative idea is 'disproven'; say "
        "it is unsupported or untestable in its current form.\n\n"
        "Objection types you must use: empirical (lacks or contradicts evidence), logical "
        "(invalid inference), conceptual (category error / conflation), methodological "
        "(untestable / unfalsifiable as stated), parsimony (a simpler explanation suffices).\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        "{"
        '"steelman":"<strongest fair version, 1-2 sentences>",'
        '"objections":[{"title":"<short>","type":"empirical|logical|conceptual|'
        'methodological|parsimony","detail":"<the critique>","strength":"strong|moderate|weak"}],'
        '"what_would_change_my_mind":["<concrete evidence/argument>"],'
        '"surviving_core":"<what honestly survives, or an empty string if nothing does>",'
        '"verdict":"holds_up|weakened|does_not_survive"'
        "}\n\n"
        "Rules: at least two objections; order them strongest first; keep each detail to "
        "1-3 sentences; be fair, not dismissive. "
        f"{_LANG_INSTRUCTIONS.get(lang, _LANG_INSTRUCTIONS['en'])}"
    )


# ─── Trilingual mock ────────────────────────────────────────────────────────

_MOCK = {
    "en": {
        "steelman": "In its strongest form the claim is modest: measurement interactions are physically necessary for definite quantum outcomes, and 'observer' names any such interaction — not a conscious mind.",
        "obj1_t": "Consciousness is doing no work",
        "obj1_d": "Relational QM and decoherence already explain observer-dependence with no appeal to consciousness, so adding a conscious observer violates parsimony.",
        "obj2_t": "Untestable as stated",
        "obj2_d": "No experiment isolates 'consciousness' as a physical variable, so the strong reading is unfalsifiable in its current form.",
        "obj3_t": "Two 'observers' conflated",
        "obj3_d": "The argument slides between 'observer as measuring device' (physics) and 'conscious observer' (philosophy of mind) — a category error.",
        "change1": "A protocol whose outcome depends on whether a conscious agent (not just a detector) is in the loop, replicated independently.",
        "change2": "A formal, testable criterion that distinguishes conscious from non-conscious 'observation' and makes novel predictions.",
        "surviving": "The empirical core survives: measurement interactions correlate with definite outcomes (established). The consciousness-creates-reality reading does not.",
        "verdict": "weakened",
    },
    "es": {
        "steelman": "En su forma más fuerte la afirmación es modesta: las interacciones de medición son físicamente necesarias para resultados cuánticos definidos, y «observador» nombra cualquier interacción de ese tipo — no una mente consciente.",
        "obj1_t": "La consciencia no hace ningún trabajo",
        "obj1_d": "La MC Relacional y la decoherencia ya explican la dependencia del observador sin apelar a la consciencia, así que añadir un observador consciente viola la parsimonia.",
        "obj2_t": "No comprobable tal como se enuncia",
        "obj2_d": "Ningún experimento aísla la «consciencia» como variable física, así que la lectura fuerte es infalsable en su forma actual.",
        "obj3_t": "Dos «observadores» confundidos",
        "obj3_d": "El argumento oscila entre «observador como dispositivo de medición» (física) y «observador consciente» (filosofía de la mente) — un error de categoría.",
        "change1": "Un protocolo cuyo resultado dependa de si hay un agente consciente (no solo un detector) en el bucle, replicado de forma independiente.",
        "change2": "Un criterio formal y comprobable que distinga la «observación» consciente de la no consciente y haga predicciones novedosas.",
        "surviving": "El núcleo empírico sobrevive: las interacciones de medición se correlacionan con resultados definidos (establecido). La lectura «la consciencia crea la realidad» no.",
        "verdict": "weakened",
    },
    "no": {
        "steelman": "I sin sterkeste form er påstanden beskjeden: måleinteraksjoner er fysisk nødvendige for definite kvanteutfall, og «observatør» betegner enhver slik interaksjon — ikke et bevisst sinn.",
        "obj1_t": "Bevissthet gjør ingen jobb",
        "obj1_d": "Relasjonell QM og dekoherens forklarer allerede observatøravhengighet uten å påkalle bevissthet, så å legge til en bevisst observatør bryter med parsimoni.",
        "obj2_t": "Ikke testbar slik den er formulert",
        "obj2_d": "Ingen eksperiment isolerer «bevissthet» som en fysisk variabel, så den sterke lesningen er ikke-falsifiserbar i sin nåværende form.",
        "obj3_t": "To «observatører» forvekslet",
        "obj3_d": "Argumentet glir mellom «observatør som måleapparat» (fysikk) og «bevisst observatør» (bevissthetsfilosofi) — en kategorifeil.",
        "change1": "En protokoll hvis utfall avhenger av om en bevisst aktør (ikke bare en detektor) er i sløyfen, uavhengig replikert.",
        "change2": "Et formelt, testbart kriterium som skiller bevisst fra ikke-bevisst «observasjon» og gir nye prediksjoner.",
        "surviving": "Den empiriske kjernen overlever: måleinteraksjoner korrelerer med definite utfall (etablert). Lesningen «bevissthet skaper virkelighet» gjør det ikke.",
        "verdict": "weakened",
    },
}


def _mock_lang(lang: str) -> str:
    return lang if lang in _MOCK else "en"


def _make_mock(lang: str) -> Dict[str, Any]:
    m = _MOCK[_mock_lang(lang)]
    return {
        "steelman": m["steelman"],
        "objections": [
            {"title": m["obj1_t"], "type": "parsimony", "detail": m["obj1_d"], "strength": "strong"},
            {"title": m["obj2_t"], "type": "methodological", "detail": m["obj2_d"], "strength": "strong"},
            {"title": m["obj3_t"], "type": "conceptual", "detail": m["obj3_d"], "strength": "moderate"},
        ],
        "what_would_change_my_mind": [m["change1"], m["change2"]],
        "surviving_core": m["surviving"],
        "verdict": m["verdict"],
        "is_mock": True,
        "version": REDTEAM_VERSION,
    }


def _sanitize(parsed: Dict[str, Any]) -> Dict[str, Any]:
    parsed.setdefault("steelman", "")
    objs = parsed.get("objections") or []
    clean = []
    for o in objs:
        if not isinstance(o, dict):
            continue
        o["type"] = o.get("type") if o.get("type") in _ALLOWED_TYPES else "conceptual"
        o["strength"] = o.get("strength") if o.get("strength") in _ALLOWED_STRENGTH else "moderate"
        o.setdefault("title", "")
        o.setdefault("detail", "")
        clean.append(o)
    parsed["objections"] = clean
    wc = parsed.get("what_would_change_my_mind") or []
    parsed["what_would_change_my_mind"] = [str(x) for x in wc if x]
    parsed.setdefault("surviving_core", "")
    parsed["verdict"] = parsed.get("verdict") if parsed.get("verdict") in _ALLOWED_VERDICTS else "weakened"
    return parsed


async def red_team(claim: str, lang: str = "en") -> Dict[str, Any]:
    """Stress-test a claim in good faith. Never raises; mock on LLM failure."""
    claim = (claim or "").strip()
    if not claim:
        return {"error": "empty_claim"}
    if len(claim) > _MAX_CLAIM_CHARS:
        claim = claim[:_MAX_CLAIM_CHARS] + "…"

    ground = _ground(claim)

    if ask_ai_unified is not None:
        try:
            grounding = "[GROUNDING — vector-store matches for context]\n" + "\n".join(
                f"- ({g['level']}) {g['title']}: {g['claim']}" for g in ground
            ) if ground else ""
            messages = [{"role": "system", "content": _system_prompt(lang)}]
            if grounding:
                messages.append({"role": "system", "content": grounding})
            messages.append({"role": "user", "content": f"Red-team this claim:\n\n{claim}"})
            raw = await ask_ai_unified(messages=messages, task_type="analysis",
                                       complexity="high", max_tokens=1600)
            if raw and not raw.startswith("[MOCKED RESPONSE"):
                clean = raw.strip()
                if clean.startswith("```"):
                    parts = clean.split("```")
                    clean = parts[1] if len(parts) > 1 else clean
                    if clean.startswith("json"):
                        clean = clean[4:]
                parsed = _sanitize(json.loads(clean.strip()))
                parsed["is_mock"] = False
                parsed["version"] = REDTEAM_VERSION
                return parsed
        except Exception:
            pass

    return _make_mock(lang)


def health() -> Dict[str, Any]:
    return {"status": "ok", "component": "self_sim_reality_redteam",
            "version": REDTEAM_VERSION, "llm_available": ask_ai_unified is not None}
