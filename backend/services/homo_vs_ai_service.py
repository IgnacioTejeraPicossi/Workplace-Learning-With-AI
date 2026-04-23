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
