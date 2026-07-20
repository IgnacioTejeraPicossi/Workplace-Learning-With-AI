"""
Self-Correcting Scaffold Loop — service
=======================================
Option B of the Future-module integration: turn the one-shot `generate_scaffold`
into a real Builder → Judge → Manager loop.

  Builder  — generates the scaffold code (LLM), with the Judge's feedback fed
             back in on each retry.
  Judge    — evaluates against GROUND TRUTH, not opinion:
               1. deterministic: does the code parse? (`ast.parse` for Python
                  scaffold types) — the real, cheap ground truth.
               2. LLM checklist: does it match the scaffold type + address the
                  feature + avoid being a bare stub.
  Manager  — if the Judge fails, send feedback to the Builder and retry, up to
             `max_iterations`. If still failing, mark `escalate=True` — that is
             the "escalate to a human" path, wired to the existing admin approve
             flow in the Feature Roadmap.

Degrades gracefully offline: when no LLM key is set, `ask_openai` returns a
"[MOCKED RESPONSE]" string; the loop then emits a deterministic stub, passes the
syntax check, and returns `is_mock=True` with a single iteration (CI-safe).
"""

import ast
import json
import re
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_openai
except Exception:  # pragma: no cover
    ask_openai = None  # type: ignore

try:
    from backend.prompts import SCAFFOLD_TYPE_PROMPT
except Exception:  # pragma: no cover
    SCAFFOLD_TYPE_PROMPT = (
        "Generate a {scaffold_type} for '{feature_name}': {feature_summary}. "
        "Output only code."
    )

SCAFFOLD_LOOP_VERSION = "1.0.0"
MAX_ITERATIONS_DEFAULT = 3
MAX_ITERATIONS_CAP = 5

# Scaffold types whose output is Python and can be syntax-checked with ast.
_PYTHON_TYPES = {"API Route", "DB Model", "Background Job", "Unit Test"}


def _is_mock_response(text: Optional[str]) -> bool:
    return isinstance(text, str) and text.strip().startswith("[MOCKED RESPONSE]")


def _strip_code_fences(code: str) -> str:
    """LLMs often wrap code in ```python fences — remove them."""
    s = (code or "").strip()
    if s.startswith("```"):
        parts = s.split("```")
        if len(parts) >= 2:
            s = parts[1]
        s = re.sub(r"^(python|py|javascript|js|json)\n", "", s.strip(), flags=re.IGNORECASE)
    return s.strip()


def _deterministic_stub(feature_name: str, feature_summary: str, scaffold_type: str) -> str:
    """Offline fallback stub (valid Python, so the syntax gate passes)."""
    slug = re.sub(r"[^a-z0-9]+", "_", (feature_name or "feature").lower()).strip("_") or "feature"
    cls = slug.title().replace("_", "")
    header = (
        f"# {scaffold_type} for: {feature_name}\n"
        f"# {feature_summary}\n"
        "# (offline stub — no LLM key; replace with real logic)\n\n"
    )
    if scaffold_type == "DB Model":
        return header + (
            "from pydantic import BaseModel, Field\n"
            "from datetime import datetime\n\n"
            f"class {cls}(BaseModel):\n"
            "    id: str | None = None\n"
            "    created_at: datetime = Field(default_factory=datetime.utcnow)\n"
        )
    if scaffold_type == "Background Job":
        return header + (
            f"async def {slug}_job(payload: dict) -> None:\n"
            "    \"\"\"Do the background work here.\"\"\"\n"
            "    ...\n"
        )
    return header + (
        "from fastapi import APIRouter\n"
        "from pydantic import BaseModel\n\n"
        f"router = APIRouter(prefix='/api/{slug}')\n\n"
        f"class {cls}Request(BaseModel):\n"
        "    pass\n\n"
        "@router.post('/')\n"
        f"async def create_{slug}(body: {cls}Request):\n"
        "    return {'ok': True}\n"
    )


def _syntax_ground_truth(code: str, scaffold_type: str) -> Dict[str, Any]:
    """Deterministic ground truth: does the code parse? Returns pass/fail + reason."""
    if scaffold_type not in _PYTHON_TYPES:
        return {"pass": True, "reason": "non-Python scaffold; syntax check skipped"}
    try:
        ast.parse(code)
        return {"pass": True, "reason": "parses as valid Python"}
    except SyntaxError as e:
        return {"pass": False, "reason": f"SyntaxError: {e.msg} (line {e.lineno})"}


def _build(feature_name: str, feature_summary: str, scaffold_type: str,
           feedback: Optional[str]) -> str:
    """Builder role: generate scaffold code, optionally repairing prior issues."""
    prompt = SCAFFOLD_TYPE_PROMPT.format(
        scaffold_type=scaffold_type,
        feature_name=feature_name,
        feature_summary=feature_summary,
    )
    if feedback:
        prompt += (
            "\n\nYour previous attempt was rejected by a reviewer for these "
            f"reasons:\n{feedback}\nReturn a corrected version. Output only code."
        )
    # 4096: reasoning models starve output on a small completion budget.
    raw = ask_openai(prompt=prompt, task_type="code_generation", complexity="high", max_tokens=4096)
    return raw or ""


def _judge_llm(code: str, feature_name: str, scaffold_type: str) -> Dict[str, Any]:
    """LLM Judge: check the code against a written checklist. Returns
    {pass: bool, issues: [str]}. Falls back to pass on parse failure (the
    deterministic syntax gate is the hard requirement; the LLM check is advisory)."""
    system = (
        "You are a strict code reviewer (the Judge in a self-correcting loop). "
        "Evaluate the SCAFFOLD below against these checks and return ONLY JSON:\n"
        '{"pass": true|false, "issues": ["specific problem", ...]}\n'
        "Checks:\n"
        f"1. Is it actually a {scaffold_type} (right shape/framework)?\n"
        f"2. Does it plausibly address the feature: '{feature_name}'?\n"
        "3. Is it more than a bare empty stub (has real structure)?\n"
        "Fail if any check fails; list the specific issue(s)."
    )
    raw = ask_openai(
        prompt=None, task_type="analysis", complexity="medium", max_tokens=400,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"SCAFFOLD:\n{code}"},
        ],
    )
    if _is_mock_response(raw):
        return {"pass": True, "issues": []}
    try:
        clean = _strip_code_fences(raw)
        parsed = json.loads(clean)
        return {
            "pass": bool(parsed.get("pass", True)),
            "issues": [str(i) for i in (parsed.get("issues") or [])][:5],
        }
    except Exception:
        # Judge output unparseable — don't block on it; the syntax gate stands.
        return {"pass": True, "issues": []}


def generate_scaffold_loop(feature_name: str, feature_summary: str,
                           scaffold_type: str = "API Route",
                           max_iterations: int = MAX_ITERATIONS_DEFAULT) -> Dict[str, Any]:
    """Run the Builder→Judge→Manager loop. Never raises.

    Returns: code, is_mock, iterations, verdict ('pass'|'escalate'), escalate,
    judge_notes (list of per-iteration verdicts), version.
    """
    feature_name = (feature_name or "").strip() or "feature"
    max_iterations = max(1, min(int(max_iterations or MAX_ITERATIONS_DEFAULT), MAX_ITERATIONS_CAP))

    # Offline short-circuit: no LLM → deterministic stub, syntax passes, done.
    probe = ask_openai(prompt="ping", task_type="classification", complexity="low", max_tokens=5) if ask_openai else None
    if ask_openai is None or _is_mock_response(probe):
        code = _deterministic_stub(feature_name, feature_summary, scaffold_type)
        gt = _syntax_ground_truth(code, scaffold_type)
        return {
            "code": code,
            "is_mock": True,
            "iterations": 1,
            "verdict": "pass" if gt["pass"] else "escalate",
            "escalate": not gt["pass"],
            "fell_back_to_stub": True,
            "judge_notes": [{"iteration": 1, "syntax": gt, "llm": {"pass": True, "issues": []}}],
            "version": SCAFFOLD_LOOP_VERSION,
        }

    notes: List[Dict[str, Any]] = []
    feedback: Optional[str] = None
    code = ""
    for i in range(1, max_iterations + 1):
        code = _strip_code_fences(_build(feature_name, feature_summary, scaffold_type, feedback))
        if not code.strip():
            # Builder produced nothing (e.g. the model returned empty content).
            # Treat as a hard fail so the Manager can retry / escalate.
            gt = {"pass": False, "reason": "Builder returned empty output"}
            judge = {"pass": False, "issues": ["No code was produced."]}
        else:
            gt = _syntax_ground_truth(code, scaffold_type)
            judge = _judge_llm(code, feature_name, scaffold_type) if gt["pass"] else {"pass": False, "issues": []}
        passed = gt["pass"] and judge["pass"]
        notes.append({"iteration": i, "syntax": gt, "llm": judge})
        if passed:
            return {
                "code": code, "is_mock": False, "iterations": i,
                "verdict": "pass", "escalate": False, "fell_back_to_stub": False,
                "judge_notes": notes, "version": SCAFFOLD_LOOP_VERSION,
            }
        # Manager: assemble feedback for the Builder's next attempt.
        issues = []
        if not gt["pass"]:
            issues.append(f"Syntax: {gt['reason']}")
        issues.extend(judge.get("issues") or [])
        feedback = "\n".join(f"- {x}" for x in issues) or "- The output did not meet the scaffold requirements."

    # Manager: max iterations reached without a clean pass → escalate to human
    # (the existing admin-approve flow in the Feature Roadmap). If the loop never
    # produced usable code (empty, or doesn't parse for a Python scaffold),
    # deliver a deterministic stub so the admin gets something buildable instead
    # of an empty box or broken code.
    final_usable = bool(code.strip()) and _syntax_ground_truth(code, scaffold_type)["pass"]
    fell_back = not final_usable
    if fell_back:
        code = _deterministic_stub(feature_name, feature_summary, scaffold_type)
    return {
        "code": code, "is_mock": False, "iterations": max_iterations,
        "verdict": "escalate", "escalate": True, "fell_back_to_stub": fell_back,
        "judge_notes": notes, "version": SCAFFOLD_LOOP_VERSION,
    }


def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "scaffold_loop",
        "version": SCAFFOLD_LOOP_VERSION,
        "llm_available": ask_openai is not None,
    }
