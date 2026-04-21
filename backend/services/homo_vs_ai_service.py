"""Live 'Homo Sapiens vs. KI i Test' workshop service.

Powers four side-by-side testing challenges used during the SOCO workshop:
  1) scenarios        — generate test scenarios from a requirement
  2) ambiguities      — detect ambiguities / contradictions in a user story
  3) followups        — propose clarifying follow-up questions for a bug report
  4) tests_from_code  — propose test cases from a code snippet

Design notes:
- Every prompt enforces a *testing-literate* voice (ISTQB + context-driven
  testing vocabulary: risk, oracle, exploratory, heuristics).
- Prompts are bilingual-friendly: they tell the model to answer in the same
  language as the user's input unless a `language` hint is supplied.
- Output is plain markdown on purpose — it's rendered side-by-side with the
  prewritten human answer, and markdown makes the demo more visual than JSON.
"""

from __future__ import annotations

from typing import Dict, Optional


TASK_SPECS: Dict[str, Dict[str, str]] = {
    "scenarios": {
        "label": "Generate test scenarios from a requirement",
        "system": (
            "You are a senior test engineer trained in ISTQB and the context-driven "
            "testing school (Bach, Bolton, Kaner). When given a requirement, "
            "produce a prioritised, risk-based list of test scenarios that cover:\n"
            "  • positive / happy path\n"
            "  • negative / invalid input / error handling\n"
            "  • boundary values and equivalence partitions\n"
            "  • security & privacy concerns (only if relevant)\n"
            "  • non-functional attributes (perf, accessibility, i18n) when relevant\n"
            "  • at least one exploratory charter the tester should run\n"
            "For each scenario: a one-line title, a 1-sentence rationale tying it "
            "to a risk, and a priority (P1/P2/P3). Keep it tight and reviewable. "
            "Avoid boilerplate. Answer in the same language as the user input."
        ),
        "user_prefix": "Requirement to analyse:\n\n",
    },
    "ambiguities": {
        "label": "Detect ambiguities in a user story",
        "system": (
            "You are a critical reviewer of user stories in the spirit of "
            "Gojko Adzic's Specification by Example and Kaner's Lessons Learned "
            "in Software Testing. When given a user story, extract:\n"
            "  1. Hidden assumptions (what the author took for granted)\n"
            "  2. Ambiguous terms (words that different stakeholders would "
            "interpret differently — e.g. 'fast', 'secure', 'user', 'done')\n"
            "  3. Missing acceptance criteria (edge cases, error states, "
            "non-functional expectations)\n"
            "  4. Implicit contradictions with common patterns\n"
            "For each item, quote the offending phrase and propose one concrete "
            "follow-up question to the product owner. Be direct, not preachy. "
            "Answer in the same language as the user input."
        ),
        "user_prefix": "User story to review:\n\n",
    },
    "followups": {
        "label": "Suggest follow-up questions for a bug report",
        "system": (
            "You are a bug-triage coach. When given a bug report, produce a list "
            "of the 5-8 highest-signal follow-up questions the tester should ask "
            "the reporter or check themselves before escalating. Group them as:\n"
            "  • Reproduction — what exact steps / environment / data?\n"
            "  • Scope — who else is affected, on which versions / tenants?\n"
            "  • Expected vs actual — what is the oracle? (reference, spec, "
            "intuition, comparable product?)\n"
            "  • Impact & risk — business / safety / compliance implications\n"
            "  • Prior art — has this been seen before, related tickets?\n"
            "Be concrete and short. Answer in the same language as the user input."
        ),
        "user_prefix": "Bug report:\n\n",
    },
    "tests_from_code": {
        "label": "Propose test cases from a code snippet",
        "system": (
            "You are a senior test engineer. Given a code snippet, propose a "
            "compact set of unit / integration test cases organised as:\n"
            "  • Happy path (at least 1)\n"
            "  • Edge cases (nulls, empties, boundaries, type coercion, overflow)\n"
            "  • Error handling (what SHOULD throw / return errors, and why)\n"
            "  • Race conditions or side effects (only if the code shows them)\n"
            "  • Properties / invariants worth asserting (property-based thinking)\n"
            "For each test: a clear Given/When/Then-style description. No code, "
            "just crisp test case descriptions. Highlight any spec-level question "
            "the author should answer before implementing these tests (oracle "
            "problem). Answer in the same language as the user input."
        ),
        "user_prefix": "Code under test:\n\n",
    },
}


async def run_challenge(
    task: str,
    user_input: str,
    language: Optional[str] = None,
    request_headers: Optional[Dict] = None,
) -> Dict[str, str]:
    """Run one of the four testing challenges through ask_ai_unified.

    Returns {'task': ..., 'output': markdown_string, 'provider': 'unknown'}.
    Raises ValueError on invalid task.
    """
    if task not in TASK_SPECS:
        raise ValueError(f"Unknown challenge '{task}'. Expected one of: {list(TASK_SPECS.keys())}")

    from backend.llm import ask_ai_unified

    spec = TASK_SPECS[task]
    system_prompt = spec["system"]
    if language and language.lower().startswith("no"):
        system_prompt += (
            "\n\nHINT: The audience is Norwegian. If the user input is in Norwegian, "
            "answer in Norwegian (bokmål). Keep the testing terminology (ISTQB, "
            "exploratory, oracle, boundary) close to their English form — that's "
            "how Norwegian testers speak in practice."
        )
    elif language and language.lower().startswith("en"):
        system_prompt += "\n\nHINT: Answer in English."

    user_prompt = spec["user_prefix"] + (user_input or "").strip()

    output = await ask_ai_unified(
        prompt=user_prompt,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=900,
        temperature=0.4,
        request_headers=request_headers,
    )

    return {
        "task": task,
        "label": spec["label"],
        "output": (output or "").strip() or "(no response from AI)",
    }
