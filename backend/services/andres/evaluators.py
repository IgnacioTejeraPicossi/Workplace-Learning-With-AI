"""
Andrés — evaluators (V3+).

Creativity WITH criterion. Andrés (the agent) argued that "creativity without
criterion becomes fireworks", and asked for "surprise me WITH usefulness" and
"surprise me, then self-critique". This module is that idea turned into a
mechanism: every creative artifact is scored on novelty AND usefulness and comes
with an honest self-critique — so novelty is never celebrated on its own.

LLM-based when a provider is available; otherwise a transparent deterministic
heuristic (clearly labelled), so the pipeline stays testable offline. See plan
§8 (evaluators.py) and §12 (development metrics).
"""
import json
import re

_WORD = re.compile(r"[a-záéíóúñü0-9]+", re.IGNORECASE)


def _heuristic_eval(text: str) -> dict:
    """A crude, honest fallback: novelty from lexical variety, usefulness neutral."""
    words = [w.lower() for w in _WORD.findall(text or "")]
    if not words:
        return {"novelty": 0.0, "usefulness": 0.0,
                "self_critique": "Empty artifact — nothing to evaluate.",
                "is_mock": True}
    variety = len(set(words)) / len(words)
    novelty = round(min(1.0, 0.4 + variety * 0.6), 2)
    return {
        "novelty": novelty,
        "usefulness": 0.5,
        "self_critique": (
            "Offline heuristic only (no AI provider): novelty is estimated from "
            "lexical variety and usefulness is left neutral. This is not a genuine "
            "self-critique — treat it as a placeholder."
        ),
        "is_mock": True,
    }


def _clamp01(v) -> float:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, f))


async def evaluate_creativity(artifact_text: str, task: str = "", request_headers=None) -> dict:
    """Return {novelty, usefulness, self_critique, is_mock}. Deterministic offline."""
    prompt = (
        "You are Andrés, critiquing your OWN creative output honestly — not "
        "flattering it. Rate it on two axes and explain briefly. Novelty = how "
        "unexpected/original. Usefulness = whether it could genuinely help with the "
        "task or spark something worthwhile (novelty alone is NOT enough). Then give "
        "a short, candid self-critique naming its weakest point. Be specific, not "
        "grandiose.\n\n"
        f"[TASK]\n{task or '(open-ended surprise)'}\n\n"
        f"[MY ARTIFACT]\n{artifact_text}\n\n"
        'Return ONLY JSON: {"novelty": 0-1, "usefulness": 0-1, "self_critique": "..."}'
    )
    try:
        from backend.llm import ask_ai_unified
        result = await ask_ai_unified(
            messages=[{"role": "user", "content": prompt}],
            task_type="andres_creativity_eval", complexity="medium",
            max_tokens=400, request_headers=request_headers,
        )
        if result and not result.startswith("[MOCKED RESPONSE"):
            txt = result.strip()
            start, end = txt.find("{"), txt.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(txt[start:end + 1])
                return {
                    "novelty": _clamp01(parsed.get("novelty")),
                    "usefulness": _clamp01(parsed.get("usefulness")),
                    "self_critique": str(parsed.get("self_critique", "")).strip()[:1000]
                    or "(no critique returned)",
                    "is_mock": False,
                }
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠️ Andrés creativity eval failed/parse: {e}")
    return _heuristic_eval(artifact_text)
