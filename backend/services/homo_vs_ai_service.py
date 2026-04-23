"""Live 'Homo Sapiens vs. KI i Test' workshop service.

Powers the ten side-by-side testing challenges used during the SOCO workshop,
aligned 1:1 with the Activity Matrix on the same page:
  1) scenarios        — generate test scenarios from a requirement
  2) risk             — risk-based prioritisation of a release scope
  3) ambiguities      — detect ambiguities / contradictions in a user story
  4) exploratory      — design exploratory test charters
  5) followups        — propose clarifying follow-up questions for a bug report
  6) automation       — turn acceptance criteria into automation code skeleton
  7) testData         — generate varied test data with sensitivity markers
  8) oracle           — enumerate candidate correct behaviours for an ambiguous spec
  9) triage           — bug severity / priority triage with reasoning split
 10) accessibility    — a11y + UX heuristics review with mechanical/human split

Legacy (kept for backward compatibility, not shown in the live demo grid):
  - tests_from_code   — propose test cases from a code snippet

Design notes:
- Every prompt enforces a *testing-literate* voice (ISTQB + context-driven
  testing vocabulary: risk, oracle, exploratory, heuristics).
- Prompts are bilingual-friendly: they tell the model to answer in the same
  language as the user's input unless a `language` hint is supplied.
- Output is plain markdown on purpose — it's rendered side-by-side with the
  prewritten human answer, and markdown makes the demo more visual than JSON.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional


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
    "risk": {
        "label": "Risk-based prioritisation of a release scope",
        "system": (
            "You are a senior test lead doing risk-based prioritisation in the "
            "Rex Black / James Bach tradition. Given a release scope (features, "
            "fixes, bugs, infra), produce:\n"
            "  • A prioritised test plan using P1/P2/P3 labels\n"
            "  • For each item: a one-line rationale tying it to likelihood × impact\n"
            "  • Explicit call-outs of what needs POLITICAL / DOMAIN context that "
            "only a human stakeholder can provide (regulatory weight, VIP customers, "
            "known fragile modules, executive signals)\n"
            "  • One concrete oracle question the tester should take back to the PO/CFO/PM\n"
            "Avoid generic advice. If the scope mentions a stakeholder (CFO, Legal), "
            "weight their concern explicitly. Answer in the same language as the user input."
        ),
        "user_prefix": "Release scope to prioritise:\n\n",
    },
    "exploratory": {
        "label": "Design exploratory test charters",
        "system": (
            "You are an exploratory testing coach in the James Bach / Elisabeth "
            "Hendrickson tradition. Given a product or feature description, "
            "produce 3-4 exploratory test charters using the canonical format:\n"
            "  'Explore <area> with <resources> to discover <information>'\n"
            "For each charter: time-box (in minutes), suggested heuristics or "
            "tours (landmark, garbage, interruption, variability…), and one "
            "concrete 'smell' the tester should chase.\n"
            "Finish with one short note about what ONLY a human tester can "
            "contribute to this exploration (intuition, emotional tone, "
            "domain empathy). Answer in the same language as the user input."
        ),
        "user_prefix": "Product / feature to explore:\n\n",
    },
    "automation": {
        "label": "From acceptance criteria to automation code skeleton",
        "system": (
            "You are a senior test automation engineer fluent in Playwright, "
            "Cypress and Selenium. Given acceptance criteria and a stack hint, "
            "produce a pragmatic automation plan (NOT a giant script):\n"
            "  • Arrange — preferred setup via API / fixtures, not UI\n"
            "  • Page object contract — methods the test will call\n"
            "  • Core assertions — what to wait for, avoiding hard sleeps\n"
            "  • Timing/flakiness risks and how to mitigate them\n"
            "  • Teardown — clean state, avoid coupling between tests\n"
            "  • One paragraph: what ARCHITECTURAL decisions the human must "
            "still make (selector strategy, test pyramid placement, "
            "acceptable flakiness bound).\n"
            "Keep it under 25 lines. Answer in the same language as the user input."
        ),
        "user_prefix": "Flow / acceptance criteria to automate:\n\n",
    },
    "testData": {
        "label": "Generate varied test data with sensitivity markers",
        "system": (
            "You are a test data specialist. Given a schema or domain, produce "
            "a compact table (8-12 rows) of test data that covers:\n"
            "  • Happy path — realistic, typical\n"
            "  • Boundaries — min/max lengths, numeric edges\n"
            "  • Locale edges — unicode, RTL, diacritics, currency, dates\n"
            "  • Suspicious / abusive — SQLi, XSS, null bytes, very long strings\n"
            "  • Consent / privacy variants — opt-out, GDPR-sensitive\n"
            "Format as a markdown list or table. For each row: a one-line "
            "reason. FLAG loudly any field that must NEVER come from production "
            "(PII, health, payment, national IDs). End with one oracle question "
            "about dataset ownership and versioning. "
            "Answer in the same language as the user input."
        ),
        "user_prefix": "Schema / domain for test data:\n\n",
    },
    "oracle": {
        "label": "Oracle problem — enumerate candidate correct behaviours",
        "system": (
            "You are a context-driven tester in the Cem Kaner / James Bach school. "
            "Given an ambiguous, silent or self-contradictory spec, enumerate "
            "3-5 CANDIDATE correct behaviours. For each candidate:\n"
            "  • A one-line description of the behaviour\n"
            "  • Its ORACLE SOURCE (contract, similar product, standard, heuristic, "
            "precedent, current implementation)\n"
            "Then explicitly mark:\n"
            "  • Which behaviour the current spec IMPLIES (if any)\n"
            "  • What ONLY a human stakeholder can decide, and the exact question "
            "to ask them\n"
            "  • An interim test strategy until the oracle is resolved "
            "(usually: characterisation tests, no code change).\n"
            "Refuse to pick a winner unless the spec clearly says so. "
            "Answer in the same language as the user input."
        ),
        "user_prefix": "Ambiguous specification or behaviour:\n\n",
    },
    "triage": {
        "label": "Bug triage & severity with reasoning split",
        "system": (
            "You are a bug triage coach. Given a bug report, produce:\n"
            "  • Severity (S1-S4) based on symptoms — this part is "
            "AI-classifiable; justify with the observable facts.\n"
            "  • Priority (P1-P3) based on business weight — call out "
            "explicitly which factors require HUMAN judgement (VIP customer, "
            "regulatory risk, reputational exposure, executive signal).\n"
            "  • Any extra risk the reporter probably missed (blast radius, "
            "correlation with recent deploys, similar past tickets).\n"
            "  • A 'do not close until' checklist.\n"
            "  • Final line: one thing the HUMAN tester knows that is NOT in "
            "the bug description but changes the priority.\n"
            "Be direct. Answer in the same language as the user input."
        ),
        "user_prefix": "Bug to triage:\n\n",
    },
    "accessibility": {
        "label": "Accessibility & UX heuristics review",
        "system": (
            "You are an accessibility / UX auditor fluent in WCAG 2.1 AA and "
            "Nielsen's 10 heuristics. Given a UI description or HTML snippet, "
            "produce a review split into three buckets:\n"
            "  • MECHANICAL (AI-automatable) — contrast, alt text, roles, "
            "keyboard order, labels, ARIA, colour-only signalling. Reference "
            "the specific WCAG rule when possible (e.g. 1.4.3, 1.4.1, 4.1.2).\n"
            "  • NIELSEN HEURISTICS — visibility, match with real world, "
            "error prevention, error recovery, consistency.\n"
            "  • HUMAN-ONLY — tone of errors, cultural nuance, emotional "
            "appropriateness, clarity for novices. Explicitly note that "
            "automated checkers DO NOT catch these.\n"
            "Finish with the 80/20 reminder: AI catches the 80 % mechanical; "
            "a human catches the 20 % that actually hurts real users. "
            "Answer in the same language as the user input."
        ),
        "user_prefix": "UI / component to review:\n\n",
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


# ---------------------------------------------------------------------------
# Problem Router — pick the best of the 10 live rounds for a free-form problem
# ---------------------------------------------------------------------------

# Tasks exposed to the Problem Router. `tests_from_code` is intentionally
# omitted — it is retained for backward compatibility but not part of the
# 10-row Activity Matrix that the router is aligned with.
ROUTABLE_TASKS: List[str] = [
    "scenarios",
    "risk",
    "ambiguities",
    "exploratory",
    "followups",
    "automation",
    "testData",
    "oracle",
    "triage",
    "accessibility",
]


# Sharper, distinguishing descriptions. Each entry explains WHEN THIS WINS
# over adjacent options — not just what it does. This is deliberately worded
# to reduce routing confusion between overlapping tasks (e.g. scenarios vs
# ambiguities, both of which technically consume user stories as input).
_ROUTER_TASK_CARD = {
    "scenarios": (
        "Produce a prioritised set of test cases/scenarios from a requirement or user story. "
        "PICK THIS when the tester wants to know WHAT TO TEST for a single feature. "
        "Default choice for any well-formed user story or requirement that is NOT obviously vague."
    ),
    "risk": (
        "Prioritise what to test FIRST given a release SCOPE with MULTIPLE items "
        "(features + fixes + bugs + infra). PICK THIS only when the input lists several items "
        "or the tester asks 'where do I focus?' with limited time / multiple stakeholders."
    ),
    "ambiguities": (
        "Review a user story to find HIDDEN AMBIGUITIES and IMPROVE THE STORY. "
        "PICK THIS only when the story contains obviously vague terms (fast, relevant, secure, "
        "done, quickly, properly) OR when the tester explicitly asks 'what is unclear here?'. "
        "DO NOT pick this just because the input starts with 'As a user' — most user stories "
        "route to scenarios."
    ),
    "exploratory": (
        "Design exploratory test CHARTERS (Bach/Hendrickson format) for open-ended product areas. "
        "PICK THIS when the tester wants to EXPLORE without a script — usually a product area, "
        "not a single requirement."
    ),
    "followups": (
        "Generate follow-up QUESTIONS for a vague BUG REPORT before reproducing it. "
        "PICK THIS when the input is a bug/error/failure report that lacks reproduction detail. "
        "Keywords: 'error', 'fails', 'broken', 'ticket', 'crash'."
    ),
    "automation": (
        "Turn acceptance criteria into a Playwright/Cypress/Selenium automation SKELETON. "
        "PICK THIS when the input is acceptance criteria AND mentions a specific framework, "
        "page-object pattern, or 'automate this'."
    ),
    "testData": (
        "Generate a compact test DATASET with boundaries, locale edges and sensitivity markers. "
        "PICK THIS when the input describes a SCHEMA, FIELDS or a DOMAIN and the ask is for data."
    ),
    "oracle": (
        "Resolve the ORACLE PROBLEM — enumerate candidate 'correct' behaviours when a spec is "
        "SILENT, SELF-CONTRADICTORY, or the tester asks 'what should happen when X?'. "
        "DIFFERENT from 'ambiguities': oracle is about the BEHAVIOUR being undefined; "
        "ambiguities is about TERMS being vague."
    ),
    "triage": (
        "Assign severity (S1-S4) and priority (P1-P3) to a bug, splitting AI-classifiable "
        "facts from human-judgement factors (business value, regulatory, VIP). "
        "PICK THIS when the input is a bug and the question is 'how bad is it?'. "
        "DIFFERENT from 'followups': triage = how-bad; followups = what-do-I-ask."
    ),
    "accessibility": (
        "Review a UI for WCAG 2.1 AA + Nielsen heuristics. "
        "PICK THIS when the input is HTML, a UI description, a component, or mentions "
        "accessibility/WCAG/contrast/screen reader."
    ),
}


# Few-shot examples covering the most common mis-routing failure modes.
# Each example is deliberately short and language-matched to the prompt's
# {{language}} placeholder.
_ROUTER_FEW_SHOT = [
    {
        "problem": "Som bruker ønsker jeg å logge inn med Google, slik at jeg slipper å huske enda et passord.",
        "answer": {
            "recommended": "scenarios",
            "rationale": "This is a concrete, well-formed user story about a specific feature (Google SSO). The tester needs a prioritised test plan, not a review of the story itself — the terms are clear enough.",
            "runner_ups": [
                {"task": "risk", "why": "Useful if SSO is part of a larger release with multiple items competing for test time."},
                {"task": "oracle", "why": "Useful if the spec is silent on edge cases (account linking, disabled Google accounts)."},
            ],
        },
    },
    {
        "problem": "We ship Release 24.3 in 7 days. Scope: 2FA for admins, CSV export, PG 14→15 upgrade, React 17→18. CFO wants no invoice regressions.",
        "answer": {
            "recommended": "risk",
            "rationale": "Multiple competing items, explicit time pressure, and a stakeholder signal (CFO). The tester needs prioritisation, not a single-feature test plan.",
            "runner_ups": [
                {"task": "scenarios", "why": "Useful as a follow-up per high-priority item once ordering is agreed."},
                {"task": "triage", "why": "Useful for any incoming bugs during the release window."},
            ],
        },
    },
    {
        "problem": "Checkout fails sometimes with a 500. Happened yesterday buying two items. Message said 'something went wrong'. Please fix.",
        "answer": {
            "recommended": "followups",
            "rationale": "A bug report missing reproduction detail. The tester needs the high-signal follow-up questions before they can triage or reproduce.",
            "runner_ups": [
                {"task": "triage", "why": "After follow-ups reveal scope, triage decides S/P labels."},
                {"task": "oracle", "why": "If 'something went wrong' hides a spec gap about error messaging."},
            ],
        },
    },
    {
        "problem": "The search must return 'relevant' results 'fast' for customers. Acceptance criteria: search works quickly.",
        "answer": {
            "recommended": "ambiguities",
            "rationale": "The story is full of testably-vague terms (relevant, fast, quickly, customers). Fix the story first; otherwise every test is a guess.",
            "runner_ups": [
                {"task": "oracle", "why": "If the PO cannot clarify, 'relevant' becomes an oracle problem."},
                {"task": "scenarios", "why": "Useful once the ambiguities are resolved."},
            ],
        },
    },
]


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Best-effort JSON extraction from LLM output.

    Handles fenced code blocks, leading/trailing prose and mild malformations.
    Returns None if nothing parseable is found.
    """
    if not text:
        return None
    # 1) try as-is
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    # 2) strip ```json fences
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass
    # 3) grab the widest {...} block
    widest = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if widest:
        try:
            return json.loads(widest.group(0))
        except Exception:
            return None
    return None


def _router_system_prompt(language: Optional[str]) -> str:
    catalog = "\n".join(f"  - {k}: {v}" for k, v in _ROUTER_TASK_CARD.items())
    few_shot = "\n\n".join(
        f"  Example:\n  Problem: {ex['problem']}\n  Answer: {json.dumps(ex['answer'], ensure_ascii=False)}"
        for ex in _ROUTER_FEW_SHOT
    )

    base = (
        "You are a senior test lead helping a tester decide which of ten "
        "specialised testing rounds will MOST DIRECTLY advance their testing "
        "work. You MUST respond with STRICT JSON (no prose, no markdown fence, "
        "no leading/trailing text) matching this schema:\n"
        "{\n"
        "  \"recommended\": \"<one of the task keys below>\",\n"
        "  \"rationale\": \"<1-3 sentences explaining why THIS round fits better than the alternatives>\",\n"
        "  \"runner_ups\": [\n"
        "    { \"task\": \"<another task key>\", \"why\": \"<one short line>\" },\n"
        "    { \"task\": \"<another task key>\", \"why\": \"<one short line>\" }\n"
        "  ]\n"
        "}\n\n"
        "CATALOG (keys and WHEN TO PICK THEM):\n"
        f"{catalog}\n\n"
        "DECISION RUBRIC — apply in this order, stop at the FIRST match:\n"
        "  1. Input lists MULTIPLE items (features + fixes + bugs + infra) or asks "
        "     'what should I test first with limited time' → `risk`.\n"
        "  2. Input is a BUG / FAILURE / ERROR report lacking reproduction detail "
        "     ('something went wrong', 'sometimes fails', 'crashes') → `followups`.\n"
        "  3. Input is a BUG and asks 'is this P1?' / 'how bad is it?' / mentions severity → `triage`.\n"
        "  4. Input is HTML / a UI component / mentions accessibility / WCAG / contrast → `accessibility`.\n"
        "  5. Input describes a SCHEMA, FIELDS, DOMAIN and asks for DATA → `testData`.\n"
        "  6. Input is acceptance criteria AND mentions Playwright/Cypress/Selenium/page-object → `automation`.\n"
        "  7. Input describes a product AREA or asks for CHARTERS / exploration → `exploratory`.\n"
        "  8. Input describes BEHAVIOUR that is UNDEFINED or CONTRADICTORY in the spec "
        "     (e.g. a race condition, silent spec, 'what should happen when X AND Y?') → `oracle`.\n"
        "  9. Input is a user story / requirement that contains OBVIOUSLY vague terms "
        "     (fast, quickly, secure, relevant, properly, done) and the tester wants to fix the STORY → `ambiguities`.\n"
        " 10. DEFAULT: input is a requirement / user story / feature description and the tester "
        "     wants to know WHAT TO TEST → `scenarios`.\n\n"
        "CRITICAL anti-patterns to avoid:\n"
        "  - A user story starting with 'As a user' / 'Som bruker' is NOT automatically "
        "    `ambiguities`. Most user stories route to `scenarios`. Only pick `ambiguities` "
        "    when the terms are OBVIOUSLY vague AND the tester is trying to improve the story.\n"
        "  - `oracle` vs `ambiguities`: oracle = behaviour is undefined; ambiguities = terms are vague.\n"
        "  - `triage` vs `followups`: triage = how bad is it; followups = what should I ask.\n"
        "  - `risk` is only for MULTI-item scopes. A single feature goes to `scenarios`.\n\n"
        "FEW-SHOT EXAMPLES (learn the decision style):\n"
        f"{few_shot}\n\n"
        "RULES:\n"
        "  - `recommended` MUST be exactly one of the 10 keys. Never invent.\n"
        "  - `runner_ups` MUST be 1-2 entries, DIFFERENT from `recommended`.\n"
        "  - Be decisive. The `rationale` MUST explain what the input CONTAINS that drove the choice AND briefly why the runner-ups lost."
    )
    if language and language.lower().startswith("no"):
        base += (
            "\n  - Write `rationale` and each runner-up `why` in Norwegian (bokmål). "
            "Keep testing terminology (ISTQB, oracle, exploratory, boundary, WCAG) "
            "close to its English form — that's how Norwegian testers speak."
        )
    elif language and language.lower().startswith("en"):
        base += "\n  - Write `rationale` and each runner-up `why` in English."
    else:
        base += "\n  - Write `rationale` in the same language as the problem description."
    return base


async def route_problem(
    problem: str,
    language: Optional[str] = None,
    request_headers: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Given a free-form problem description, ask the LLM to pick the best
    of the 10 active challenges and explain why.

    Returns a dict matching RouteResponse in the router. On JSON parse failure
    or invalid recommended key, falls back to `scenarios` with the raw LLM
    text attached under `raw` so the frontend can surface it for debugging.
    """
    from backend.llm import ask_ai_unified

    system_prompt = _router_system_prompt(language)
    user_prompt = "Problem to route:\n\n" + (problem or "").strip()

    output = await ask_ai_unified(
        prompt=user_prompt,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=450,
        temperature=0.1,  # Routing is a classification task — we want determinism, not creativity.
        request_headers=request_headers,
    )

    parsed = _extract_json(output or "")

    # Validate strictly; fall back gracefully otherwise.
    if not parsed or not isinstance(parsed, dict):
        return {
            "recommended": "scenarios",
            "rationale": "(fallback) The AI did not return valid JSON. Using 'scenarios' as a safe default.",
            "runner_ups": [],
            "raw": (output or "").strip() or None,
        }

    recommended = str(parsed.get("recommended", "")).strip()
    if recommended not in ROUTABLE_TASKS:
        return {
            "recommended": "scenarios",
            "rationale": "(fallback) The AI returned an unknown task key. Using 'scenarios' as a safe default.",
            "runner_ups": [],
            "raw": (output or "").strip() or None,
        }

    rationale = str(parsed.get("rationale", "")).strip() or "(no rationale provided)"

    runner_ups_raw = parsed.get("runner_ups") or []
    runner_ups: List[Dict[str, str]] = []
    seen = {recommended}
    if isinstance(runner_ups_raw, list):
        for item in runner_ups_raw[:2]:
            if not isinstance(item, dict):
                continue
            task_key = str(item.get("task", "")).strip()
            why = str(item.get("why", "")).strip()
            if task_key in ROUTABLE_TASKS and task_key not in seen and why:
                runner_ups.append({"task": task_key, "why": why})
                seen.add(task_key)

    return {
        "recommended": recommended,
        "rationale": rationale,
        "runner_ups": runner_ups,
        "raw": None,
    }


# ---------------------------------------------------------------------------
# AI Judge — compare human answer vs AI answer for a given round (advisory)
# ---------------------------------------------------------------------------
#
# Design notes:
#   * This endpoint is ADVISORY only. The UI wires the verdict into a panel
#     next to the human vote buttons; the scoreboard still counts ONLY what
#     the human presenter clicks. The AI's opinion is logged alongside the
#     human vote purely for retrospective ("did the AI agree or disagree?").
#   * The prompt explicitly warns the model about self-preference bias
#     (LLMs tend to favour longer / more structured answers from other LLMs).
#     This is ALIGNED with the workshop's critical-thinking framing: the bias,
#     when visible, becomes a didactic moment rather than a silent poison of
#     the scoreboard.
#   * Criteria per task are concise and grounded in the existing TASK_SPECS
#     system prompts. They are NOT duplicated verbatim to avoid drift.

# Short, task-specific quality rubric the judge uses to anchor its verdict.
# One paragraph per task — just enough to push the judge away from generic
# "looks nice" assessments. Must stay in sync with TASK_SPECS above.
JUDGE_CRITERIA: Dict[str, str] = {
    "scenarios": (
        "A strong SCENARIOS answer: risk-anchored priorities (P1/P2/P3), "
        "boundary & equivalence coverage, at least one exploratory charter, "
        "clear oracle references. Penalise generic 'test that it works' lines."
    ),
    "risk": (
        "A strong RISK PRIORITISATION answer: weighs likelihood × impact, "
        "acknowledges stakeholder signals (CFO, VIP, regulatory), and calls "
        "out what ONLY a human can judge (politics, reputation, morale)."
    ),
    "ambiguities": (
        "A strong AMBIGUITIES answer: quotes the exact vague word/phrase, "
        "proposes a concrete follow-up question to the PO, and covers "
        "assumptions / ambiguous terms / missing AC / implicit contradictions."
    ),
    "exploratory": (
        "A strong EXPLORATORY answer: uses the 'Explore X with Y to discover Z' "
        "Bach/Hendrickson format, time-boxes each charter in minutes, names "
        "a heuristic/tour, and flags what only human intuition contributes."
    ),
    "followups": (
        "A strong FOLLOW-UPS answer: groups questions by reproduction / scope / "
        "oracle / impact / prior-art, stays concrete (no 'please provide more "
        "info'), and produces 5-8 high-signal items."
    ),
    "automation": (
        "A strong AUTOMATION answer: prefers API/fixture setup over UI, "
        "defines a page-object contract, calls out flakiness risks + "
        "mitigations, and flags architectural decisions the human still owns."
    ),
    "testData": (
        "A strong TEST-DATA answer: covers happy / boundary / locale / abuse / "
        "consent rows, FLAGS PII/health/payment fields that must not come "
        "from production, ends with a data-ownership question."
    ),
    "oracle": (
        "A strong ORACLE answer: enumerates 3-5 candidate correct behaviours, "
        "names the oracle source for each (contract, standard, heuristic, "
        "precedent), refuses to pick a winner if the spec doesn't say so."
    ),
    "triage": (
        "A strong TRIAGE answer: splits AI-classifiable severity (S1-S4) from "
        "human-judgement priority (P1-P3), surfaces missed blast radius, ends "
        "with one human-only factor that changes priority."
    ),
    "accessibility": (
        "A strong ACCESSIBILITY answer: splits mechanical WCAG findings (with "
        "rule IDs like 1.4.3) from Nielsen heuristics, explicitly flags "
        "human-only judgement (tone of errors, cultural nuance)."
    ),
    "tests_from_code": (
        "A strong TESTS-FROM-CODE answer: covers happy / edge / error / race / "
        "invariants in Given-When-Then form, surfaces spec-level oracle "
        "questions the author must answer before implementing."
    ),
}


def _judge_system_prompt(task: str, language: Optional[str]) -> str:
    """System prompt for the advisory AI judge.

    Explicitly calls out self-preference bias — the known tendency of LLMs
    to rate other LLMs' outputs more highly because of surface features
    (length, bullet density, structure). Asking the model to be aware of
    this substantially reduces (but doesn't eliminate) the effect.
    """
    spec = TASK_SPECS.get(task) or {"label": task}
    label = spec.get("label", task)
    criteria = JUDGE_CRITERIA.get(task, "A strong answer addresses the task directly and stays concrete.")

    base = (
        "You are an experienced test lead asked to JUDGE a head-to-head duel "
        "between a human tester and an AI assistant on the testing task below. "
        "Your verdict will be displayed as ADVISORY — the human presenter "
        "still casts the scoreboard vote; your job is to contribute a "
        "well-reasoned opinion a thinking tester can accept or reject.\n\n"
        f"TASK: {label}\n"
        f"QUALITY RUBRIC: {criteria}\n\n"
        "META-RULES — read these carefully, they prevent common judge errors:\n"
        "  1. SELF-PREFERENCE BIAS: you are an AI judging another AI's output. "
        "Research (Anthropic, Berkeley, Stanford 2023-2024) shows LLMs tend to "
        "favour answers that are LONGER, more STRUCTURED, or more BULLET-HEAVY. "
        "Do NOT be swayed by surface features. Reward substance, not form.\n"
        "  2. A terse 6-bullet human answer is often more valuable than a "
        "30-line AI answer if it shows real testing intuition, risk awareness, "
        "domain empathy, or stakeholder knowledge the AI cannot have.\n"
        "  3. Penalise generic boilerplate REGARDLESS of who wrote it ('cover "
        "all edge cases', 'make sure it works', 'test thoroughly').\n"
        "  4. Check that each answer actually addresses the ORIGINAL INPUT, "
        "not an adjacent task. A beautifully written answer to the wrong "
        "question loses.\n"
        "  5. When the two answers are roughly equivalent in PRACTICAL VALUE "
        "to a tester shipping today, pick 'tie'. Do not invent a winner.\n\n"
        "RETURN STRICT JSON (no prose, no markdown fence, no leading/trailing "
        "text), matching this schema exactly:\n"
        "{\n"
        "  \"verdict\": \"human\" | \"ai\" | \"tie\",\n"
        "  \"confidence\": \"low\" | \"medium\" | \"high\",\n"
        "  \"rationale\": \"<2-4 sentences, anchored in the rubric above>\",\n"
        "  \"criteria\": {\n"
        "    \"accuracy\": \"<one sentence — does each answer address the real input?>\",\n"
        "    \"coverage\": \"<one sentence — which answer covers more of the rubric?>\",\n"
        "    \"practical_value\": \"<one sentence — which answer actually helps a tester ship safely today?>\"\n"
        "  }\n"
        "}"
    )

    if language and language.lower().startswith("no"):
        base += (
            "\n\nHINT: Write `rationale` and each field in `criteria` in Norwegian "
            "(bokmål). Keep testing terminology (ISTQB, oracle, exploratory, "
            "boundary, WCAG) close to its English form — that is how Norwegian "
            "testers speak. Keep the JSON keys themselves in English."
        )
    elif language and language.lower().startswith("en"):
        base += "\n\nHINT: Write `rationale` and `criteria` values in English."
    else:
        base += "\n\nHINT: Write `rationale` and `criteria` values in the same language as the original input."

    return base


async def judge_round(
    task: str,
    human_answer: str,
    ai_answer: str,
    user_input: str = "",
    language: Optional[str] = None,
    request_headers: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Ask the LLM to judge a head-to-head round (advisory verdict).

    Returns a dict matching JudgeResponse in the router. On JSON parse
    failure or invalid verdict/confidence, falls back to 'tie' + low
    confidence with the raw LLM text attached under `raw` for debugging.
    """
    if task not in TASK_SPECS:
        raise ValueError(f"Unknown challenge '{task}'. Expected one of: {list(TASK_SPECS.keys())}")

    from backend.llm import ask_ai_unified

    system_prompt = _judge_system_prompt(task, language)

    # Build the user prompt. We DO include the original input because a
    # beautifully written answer to the wrong question should lose — the
    # judge needs to verify each answer actually addresses the prompt.
    parts: List[str] = []
    if (user_input or "").strip():
        parts.append("ORIGINAL INPUT the tester was given:\n" + user_input.strip())
    parts.append("HUMAN TESTER'S ANSWER:\n" + (human_answer or "").strip())
    parts.append("AI ASSISTANT'S ANSWER:\n" + (ai_answer or "").strip())
    user_prompt = "\n\n---\n\n".join(parts) + "\n\n---\n\nNow return STRICT JSON per the schema above."

    output = await ask_ai_unified(
        prompt=user_prompt,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=500,
        temperature=0.1,  # Judgement is a classification task — determinism over flair.
        request_headers=request_headers,
    )

    parsed = _extract_json(output or "")

    _valid_verdicts = {"human", "ai", "tie"}
    _valid_confidence = {"low", "medium", "high"}

    def _fallback(reason: str) -> Dict[str, Any]:
        return {
            "verdict": "tie",
            "confidence": "low",
            "rationale": f"(fallback) {reason}",
            "criteria": {"accuracy": "", "coverage": "", "practical_value": ""},
            "raw": (output or "").strip() or None,
        }

    if not parsed or not isinstance(parsed, dict):
        return _fallback("The AI did not return valid JSON.")

    verdict = str(parsed.get("verdict", "")).strip().lower()
    if verdict not in _valid_verdicts:
        return _fallback(f"Invalid verdict '{verdict}', expected one of human/ai/tie.")

    confidence = str(parsed.get("confidence", "")).strip().lower()
    if confidence not in _valid_confidence:
        confidence = "medium"  # silent coerce — not worth a fallback

    rationale = str(parsed.get("rationale", "")).strip() or "(no rationale provided)"

    criteria_raw = parsed.get("criteria") or {}
    if not isinstance(criteria_raw, dict):
        criteria_raw = {}
    criteria = {
        "accuracy": str(criteria_raw.get("accuracy", "")).strip(),
        "coverage": str(criteria_raw.get("coverage", "")).strip(),
        "practical_value": str(criteria_raw.get("practical_value", criteria_raw.get("practicalValue", ""))).strip(),
    }

    return {
        "verdict": verdict,
        "confidence": confidence,
        "rationale": rationale,
        "criteria": criteria,
        "raw": None,
    }
