"""
Self-Correcting AI Loop — Customize service
===========================================
Takes the user's specific task (plus a task type) and returns a tailored
Builder / Judge / Manager scaffold + a hard stop-condition block for that task.

Uses ask_ai_unified with JSON structured output. Falls back to a deterministic
scaffold (the generic template with the user's task injected) so the tab keeps
working when the LLM key is missing — flagged with is_mock=True.

Design rule (mirrors the agent's own teaching): the Judge block must always
name a ground truth, and the stop block must be hard logic (max iterations,
measurable threshold, cost ceiling) — never "good enough".
"""

import json
from typing import Any, Dict

try:
    from backend.llm import ask_ai_unified
except Exception:  # pragma: no cover
    ask_ai_unified = None  # type: ignore

SCL_VERSION = "1.0.0"

VALID_TASK_TYPES = ("writing", "code", "research", "custom")
_MAX_TASK_CHARS = 2000

_LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "es": "Responde en español.",
    "no": "Svar på norsk.",
}

# Ground truth hint per task type — steers the Judge block.
_GROUND_TRUTH = {
    "writing": "the original source material + the brief (every claim must trace to the source; every brief requirement must be met)",
    "code": "the test suite, the real run output, lint/type-check, and build status (did it actually pass when executed)",
    "research": "the actual source documents / search results (every claim traceable to a specific named source)",
    "custom": "a written standard you define — a checklist, a source, or a test the output can be mechanically checked against",
}


def _lang_instruction(lang: str) -> str:
    return _LANG_INSTRUCTIONS.get(lang, _LANG_INSTRUCTIONS["en"])


def _system_prompt(task_type: str, lang: str) -> str:
    gt = _GROUND_TRUTH.get(task_type, _GROUND_TRUTH["custom"])
    return (
        "You are the Loop Builder for the Self-Correcting AI Loop agent. Turn "
        "the user's specific task into a concrete, ready-to-use scaffold for a "
        "self-correcting Builder / Judge / Manager loop.\n\n"
        "The three roles:\n"
        " - Builder: produces a first attempt at the output. Most latitude.\n"
        " - Judge: evaluates the Builder's output against a WRITTEN standard, "
        "using a ground truth OUTSIDE the Builder's own reasoning. Returns a "
        "per-check PASS/FAIL with the specific reason.\n"
        " - Manager: reads the verdict and routes (return with specific "
        "feedback / escalate / mark complete). Holds the stop condition.\n\n"
        f"For this task type, the Judge's ground truth is: {gt}.\n\n"
        "The stop block must be HARD LOGIC, never 'good enough': a max iteration "
        "count, a measurable quality threshold, and a cost/time ceiling.\n\n"
        "Return ONLY valid JSON, no markdown, with exactly these string keys:\n"
        '{"builder":"<the Builder prompt, tailored to the task>",'
        '"judge":"<the Judge checklist with per-check PASS/FAIL, naming the '
        'ground truth>","manager":"<the Manager routing rules>",'
        '"stop":"<the hard stop conditions with concrete example numbers>"}\n\n'
        "Keep each value practical and copy-pasteable. Use the task's real "
        "specifics, not placeholders, wherever the user gave enough detail.\n\n"
        f"{_lang_instruction(lang)}"
    )


def _fallback(task_type: str, task_description: str) -> Dict[str, Any]:
    """Deterministic scaffold when the LLM is unavailable. Injects the user's
    task into a generic Builder/Judge/Manager/stop structure."""
    gt = _GROUND_TRUTH.get(task_type, _GROUND_TRUTH["custom"])
    task = task_description.strip() or "[describe your task]"
    return {
        "builder": (
            f"ROLE: Builder ({task_type}).\n"
            f"TASK: {task}\n\n"
            "Produce a strong first attempt (not perfection). Return a structured "
            "handoff:\n"
            "Deliverable: [the output]\n"
            "Confidence: [high / medium / low]\n"
            "Known uncertainties: [...]\n"
            "Assumptions made: [...]"
        ),
        "judge": (
            f"ROLE: Judge ({task_type}). You build nothing.\n"
            f"Evaluate the Builder's output against this ground truth: {gt}.\n"
            "Give a per-check PASS/FAIL with the specific reason attached.\n"
            "Verdict: [PASS / FAIL / NEEDS REVISION]\n"
            "Checked against: [name the ground truth above]"
        ),
        "manager": (
            "ROLE: Manager. Read the structured verdict (not the raw content):\n"
            "- PASS -> mark complete, deliver.\n"
            "- FAIL / NEEDS REVISION -> return to Builder with the Judge's "
            "specific issues attached; increment the revision counter.\n"
            "- Revision counter > N -> stop and escalate to a human with the "
            "full history."
        ),
        "stop": (
            "STOP CONDITIONS (hard logic in the Manager, not a soft prompt)\n"
            "- Max revisions: 3. On the 3rd failed verdict, stop and escalate.\n"
            "- Quality threshold: every Judge check must show PASS (not "
            "'close enough').\n"
            "- Budget ceiling: if the task exceeds [X] tokens or [Y] minutes, "
            "stop immediately and report done vs. remaining."
        ),
        "is_mock": True,
        "version": SCL_VERSION,
    }


async def customize_loop(task_type: str, task_description: str, lang: str = "en") -> Dict[str, Any]:
    """Return a tailored Builder/Judge/Manager/stop scaffold for the task.

    Never raises. On LLM failure returns the deterministic fallback with
    is_mock=True.
    """
    task_type = task_type if task_type in VALID_TASK_TYPES else "custom"
    task_description = (task_description or "").strip()
    if not task_description:
        return {"error": "empty_task"}
    if len(task_description) > _MAX_TASK_CHARS:
        task_description = task_description[:_MAX_TASK_CHARS] + "…"

    if ask_ai_unified is not None:
        try:
            raw = await ask_ai_unified(
                prompt=task_description,
                task_type="analysis",
                complexity="medium",
                max_tokens=1300,
                messages=[
                    {"role": "system", "content": _system_prompt(task_type, lang)},
                    {"role": "user", "content": f"My task:\n\n{task_description}"},
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
                # Require the four expected keys; else fall back.
                if all(k in parsed and isinstance(parsed[k], str) and parsed[k].strip()
                       for k in ("builder", "judge", "manager", "stop")):
                    return {
                        "builder": parsed["builder"],
                        "judge": parsed["judge"],
                        "manager": parsed["manager"],
                        "stop": parsed["stop"],
                        "is_mock": False,
                        "version": SCL_VERSION,
                    }
        except Exception:
            pass

    return _fallback(task_type, task_description)


def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "agent": "self_correcting_loop",
        "version": SCL_VERSION,
        "llm_available": ask_ai_unified is not None,
    }
