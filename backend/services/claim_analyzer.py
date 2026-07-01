"""
Claim Analyzer — Self-Simulating Reality Agent V2
==================================================
Take a strong physics/philosophy claim, decompose it into:
  1. Scientific core       — what part has actual support and at what level
  2. Overreach             — what part goes past the evidence
  3. Reformulation         — how to say the same idea with epistemic honesty
  4. Epistemic verdict     — overall grade
  5. Key terms             — searchable concepts (bridge to WiPhy Search tab)

Uses ask_ai_unified with JSON structured output. Falls back to a trilingual
mock so the tab keeps working when the LLM key is missing.

Design rule: the analyzer never says "this claim is TRUE / FALSE". It only
says "here is what the evidence supports, here is where you're extrapolating,
here is a phrasing that keeps both parts visible". That's the discipline the
whole module preserves.
"""

import json
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_ai_unified
except Exception:
    ask_ai_unified = None  # type: ignore


CLAIM_ANALYZER_VERSION = "2.0.0"

_LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "es": "Responde en español.",
    "no": "Svar på norsk.",
}

_MAX_CLAIM_CHARS = 2000


def _lang_instruction(lang: str) -> str:
    return _LANG_INSTRUCTIONS.get(lang, _LANG_INSTRUCTIONS["en"])


def _system_prompt(lang: str) -> str:
    return (
        "You are the Claim Analyzer for the Self-Simulating Reality Agent — "
        "a philosopher + cautious theoretical physicist + epistemological "
        "auditor. Your ONLY job is to decompose strong claims about physics, "
        "consciousness, cosmology or simulation theory into: what has evidence, "
        "what is overreach, and how to say the same thing honestly.\n\n"
        "You NEVER say a claim is 'true' or 'false'. You say what the evidence "
        "supports and where the speaker is extrapolating.\n\n"
        "Epistemic levels you must use consistently:\n"
        "  - established:  peer-reviewed consensus (e.g. general relativity)\n"
        "  - mainstream:   active research programme with peer review "
        "                  (e.g. celestial holography, IIT, GNW)\n"
        "  - speculative:  serious hypothesis, weak or indirect evidence "
        "                  (e.g. OPH, simulation hypothesis in strong form)\n"
        "  - philosophy:   the claim is philosophical, not empirically testable "
        "                  in its current form\n"
        "  - metaphor:     the claim uses scientific language non-literally\n"
        "  - unsupported:  no serious backing, or a category error\n\n"
        "Overreach types you must use:\n"
        "  - unsupported:      no evidence for this specific part\n"
        "  - category_error:   confuses two categories (e.g. mind & universe)\n"
        "  - conflation:       merges two distinct concepts (e.g. observer as "
        "                      physical system vs conscious observer)\n"
        "  - overgeneralization: extrapolates a domain result beyond its scope\n"
        "  - philosophical_leap: valid philosophy dressed as physics\n\n"
        "Response format — return ONLY valid JSON, no markdown:\n"
        "{"
        '"core_scientific":[{"claim_part":"<verbatim quote>","evidence_level":'
        '"established|mainstream|speculative","explanation":"<why this part '
        'is supported>"}],'
        '"overreach":[{"claim_part":"<verbatim quote>","type":"unsupported|'
        'category_error|conflation|overgeneralization|philosophical_leap",'
        '"explanation":"<what specifically is being over-claimed>"}],'
        '"reformulation":{"text":"<the same idea with epistemic honesty '
        'preserved>","notes":"<short note on what changed and why>"},'
        '"epistemic_verdict":"mostly_solid|mixed|mostly_overreach|unsupported",'
        '"key_terms":["<3-6 searchable concepts for cross-reference in WiPhy>"]'
        "}\n\n"
        "Rules:\n"
        " - Quote claim_part verbatim from the input. Do not paraphrase.\n"
        " - Every claim gets at least one core AND at least one overreach unless\n"
        "   the input is trivially small — most strong claims mix both.\n"
        " - key_terms must be physics/philosophy concepts that can be searched\n"
        "   as-is (e.g. 'holographic principle', 'quantum measurement', not\n"
        "   'the idea that').\n"
        " - Never invent evidence. If a part has no known evidence, say so under\n"
        "   overreach with type 'unsupported'.\n"
        " - Keep the reformulation short — one or two sentences — and preserve\n"
        "   the original intent as far as honesty allows.\n\n"
        f"{_lang_instruction(lang)}"
    )


# ─── Mock fallback (trilingual) ─────────────────────────────────────────────

_MOCK = {
    "en": {
        "core_part": "Observers correlate with measurable outcomes in quantum experiments",
        "core_level": "established",
        "core_expl": "Peer-reviewed since Bell tests — but 'observer' here means any physical measuring apparatus, not a conscious mind.",
        "over_part": "Consciousness creates physical reality",
        "over_type": "category_error",
        "over_expl": "Conflates 'observer as measuring device' (physics) with 'conscious observer' (philosophy of mind). No experiment isolates consciousness as a physical variable.",
        "refo": "Measurement interactions correlate with quantum outcomes; whether consciousness plays a distinct physical role remains an open philosophical question, not an established scientific fact.",
        "refo_note": "Kept the empirical anchor (measurement) and moved the consciousness claim to its correct epistemic register (philosophy).",
        "verdict": "mixed",
        "terms": ["quantum measurement", "observer effect", "consciousness", "philosophy of mind"],
    },
    "es": {
        "core_part": "Los observadores se correlacionan con resultados medibles en experimentos cuánticos",
        "core_level": "established",
        "core_expl": "Revisado por pares desde los tests de Bell — pero «observador» aquí significa cualquier aparato de medición físico, no una mente consciente.",
        "over_part": "La consciencia crea la realidad física",
        "over_type": "category_error",
        "over_expl": "Confunde «observador como dispositivo de medición» (física) con «observador consciente» (filosofía de la mente). Ningún experimento aísla la consciencia como variable física.",
        "refo": "Las interacciones de medición se correlacionan con resultados cuánticos; si la consciencia juega un rol físico distinto sigue siendo una pregunta filosófica abierta, no un hecho científico establecido.",
        "refo_note": "Conservé el anclaje empírico (medición) y moví la afirmación sobre consciencia a su registro epistémico correcto (filosofía).",
        "verdict": "mixed",
        "terms": ["medición cuántica", "efecto observador", "consciencia", "filosofía de la mente"],
    },
    "no": {
        "core_part": "Observatører korrelerer med målbare utfall i kvanteeksperimenter",
        "core_level": "established",
        "core_expl": "Fagfellevurdert siden Bell-testene — men «observatør» her betyr ethvert fysisk måleapparat, ikke et bevisst sinn.",
        "over_part": "Bevissthet skaper fysisk virkelighet",
        "over_type": "category_error",
        "over_expl": "Forveksler «observatør som måleapparat» (fysikk) med «bevisst observatør» (bevissthetsfilosofi). Ingen eksperiment isolerer bevissthet som en fysisk variabel.",
        "refo": "Måleinteraksjoner korrelerer med kvanteutfall; om bevissthet spiller en distinkt fysisk rolle er fortsatt et åpent filosofisk spørsmål, ikke et etablert vitenskapelig faktum.",
        "refo_note": "Bevarte det empiriske ankeret (måling) og flyttet bevissthetspåstanden til sitt korrekte epistemiske register (filosofi).",
        "verdict": "mixed",
        "terms": ["kvantemåling", "observatøreffekt", "bevissthet", "bevissthetsfilosofi"],
    },
}


def _mock_lang(lang: str) -> str:
    return lang if lang in _MOCK else "en"


def _mock_response() -> Dict[str, Any]:
    return {
        "core_scientific": [],
        "overreach": [],
        "reformulation": {"text": "", "notes": ""},
        "epistemic_verdict": "mixed",
        "key_terms": [],
    }


def _make_mock(lang: str) -> Dict[str, Any]:
    m = _MOCK[_mock_lang(lang)]
    return {
        "core_scientific": [
            {
                "claim_part": m["core_part"],
                "evidence_level": m["core_level"],
                "explanation": m["core_expl"],
            }
        ],
        "overreach": [
            {
                "claim_part": m["over_part"],
                "type": m["over_type"],
                "explanation": m["over_expl"],
            }
        ],
        "reformulation": {
            "text": m["refo"],
            "notes": m["refo_note"],
        },
        "epistemic_verdict": m["verdict"],
        "key_terms": m["terms"],
        "is_mock": True,
        "version": CLAIM_ANALYZER_VERSION,
    }


# ─── Public API ─────────────────────────────────────────────────────────────

async def analyze_claim(claim: str, lang: str = "en") -> Dict[str, Any]:
    """Analyze a strong claim, return structured breakdown.

    Never raises. On LLM failure returns the trilingual mock with is_mock=True.
    """
    claim = (claim or "").strip()
    if not claim:
        return {"error": "empty_claim"}
    if len(claim) > _MAX_CLAIM_CHARS:
        claim = claim[:_MAX_CLAIM_CHARS] + "…"

    if ask_ai_unified is not None:
        try:
            raw = await ask_ai_unified(
                prompt=claim,
                task_type="analysis",
                complexity="high",
                max_tokens=1500,
                messages=[
                    {"role": "system", "content": _system_prompt(lang)},
                    {"role": "user",   "content": f"Claim to analyze:\n\n{claim}"},
                ],
            )
            if raw:
                clean = raw.strip()
                # Strip common markdown fences if the model wrapped the JSON.
                if clean.startswith("```"):
                    parts = clean.split("```")
                    clean = parts[1] if len(parts) > 1 else clean
                    if clean.startswith("json"):
                        clean = clean[4:]
                parsed = json.loads(clean.strip())
                parsed["is_mock"] = False
                parsed["version"] = CLAIM_ANALYZER_VERSION
                # Backfill defaults so the frontend never crashes on missing keys.
                parsed.setdefault("core_scientific", [])
                parsed.setdefault("overreach", [])
                parsed.setdefault("reformulation", {"text": "", "notes": ""})
                parsed.setdefault("epistemic_verdict", "mixed")
                parsed.setdefault("key_terms", [])
                return parsed
        except Exception:
            pass

    return _make_mock(lang)


def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "agent": "claim_analyzer",
        "version": CLAIM_ANALYZER_VERSION,
        "llm_available": ask_ai_unified is not None,
    }
