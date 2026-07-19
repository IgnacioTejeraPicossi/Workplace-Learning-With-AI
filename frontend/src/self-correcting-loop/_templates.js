/**
 * Loop Builder scaffolds. These are prompt/logic templates the user copies and
 * adapts — technical artifacts kept in English on purpose (prompts are usually
 * authored in English and the bracketed [PLACEHOLDERS] are meant to be edited).
 * The surrounding UI chrome is fully localized via i18n.
 *
 * Each task type provides four blocks: builder, judge, manager, stop.
 */

const HANDOFF = `BUILDER OUTPUT FORMAT
Deliverable: [the actual output]
Confidence: [high / medium / low]
Known uncertainties: [anything you are unsure about]
Assumptions made: [anything you assumed without being told]`;

export const TEMPLATES = {
  writing: {
    builder:
`ROLE: Builder (writing).
Produce a first draft from the SOURCE and BRIEF below. Aim for a strong first
attempt, not perfection. Return the ${''}structured handoff, nothing else.

SOURCE: [paste source material]
BRIEF: [goal, audience, length, tone, required sections]

${HANDOFF}`,
    judge:
`ROLE: Judge (writing). You build nothing. Evaluate the draft against the
SOURCE and BRIEF placed side by side. Return a per-check verdict.

Check 1 — Fact tracing: does every factual claim trace to something actually in
the SOURCE?  -> PASS / FAIL (+ the specific unverified claim)
Check 2 — Brief compliance: is every requirement met (length, tone, sections)?
  -> PASS / FAIL (+ the missing requirement)
Check 3 — Core hook: is the main argument present and undiluted by filler?
  -> PASS / FAIL

Verdict: [PASS / FAIL / NEEDS REVISION]
Checked against: SOURCE + BRIEF
Confidence in this verdict: [high / medium / low]`,
    manager:
`ROLE: Manager. Read the Judge's per-check verdict and act:
- All checks PASS -> mark complete, deliver.
- Fact-tracing FAIL -> return to Builder with the specific unverified claim flagged.
- Brief FAIL -> return to Builder with the specific missing requirement named.
- Increment the revision counter on every return.`,
  },
  code: {
    builder:
`ROLE: Builder (code). Implement the TASK below. You MUST actually run the code
and include the results in your handoff — code that never executed is not done.

TASK: [bug fix / feature / refactor description]

Return: the diff + the real command output (test results, lint, build status)
+ Confidence + Known uncertainties + Assumptions.`,
    judge:
`ROLE: Judge (code). Evaluate against executable ground truth. Per-check verdict:

Check 1 — Tests: did it pass the existing suite WITHOUT the tests being modified?
  -> PASS / FAIL (attach failing test output)
Check 2 — Static analysis: is lint / type-check clean?  -> PASS / FAIL
Check 3 — Scope: does the diff address the ASSIGNED task, not a different one?
  -> PASS / FAIL

Verdict: [PASS / FAIL / NEEDS REVISION]
Checked against: test suite + linter + task description`,
    manager:
`ROLE: Manager. Route by which check failed:
- Failing tests -> return to Builder with the exact failing output attached.
- Lint FAIL -> return to Builder with the specific rule violations.
- Scope mismatch -> ESCALATE to a human immediately (judgment failure, not a
  mechanical defect the Builder can iterate out of).
- Increment the revision counter on every return.`,
  },
  research: {
    builder:
`ROLE: Builder (research). Answer the QUESTION using only the SOURCES provided
(or the searches you ran, listed explicitly). Attribute every claim.

QUESTION: [the research question]
SOURCES: [documents / search results, or the queries you ran]

Return: the findings with per-claim source attribution + Confidence +
Known uncertainties + Assumptions.`,
    judge:
`ROLE: Judge (research). Ground truth = the actual sources / search results.
Per-check verdict:

Check 1 — Traceability: can every claim be traced to a specific named source?
  -> PASS / FAIL (+ the unsupported claim)
Check 2 — Relevance: were the searched sources actually the relevant ones for
  the question?  -> PASS / FAIL
Check 3 — Answered: does the output actually answer the question asked?
  -> PASS / FAIL

Verdict: [PASS / FAIL / NEEDS REVISION]`,
    manager:
`ROLE: Manager. Route by which check failed:
- Traceability FAIL -> return with the unsupported claim flagged.
- Relevance FAIL -> return with instruction to search the missing area.
- Not answered -> return with the unaddressed part of the question named.
- Increment the revision counter on every return.`,
  },
  custom: {
    builder:
`ROLE: Builder. Produce a first attempt at [YOUR TASK]. Maximum latitude, not
perfection. Return the structured handoff.

${HANDOFF}`,
    judge:
`ROLE: Judge. You build nothing. Evaluate the Builder's output against
[YOUR WRITTEN STANDARD / GROUND TRUTH — e.g. a checklist, a source, a test].
Give a per-item PASS / FAIL with the specific reason attached.

Verdict: [PASS / FAIL / NEEDS REVISION]
Checked against: [name the ground truth here — if you can't, it's a rephrasing
loop, not a self-correcting one]`,
    manager:
`ROLE: Manager. Read the structured verdict (not the raw content) and act on
rules set in advance:
- PASS -> mark complete.
- FAIL / NEEDS REVISION -> return to Builder with the Judge's specific issues,
  increment the revision counter.`,
  },
};

// One stop-condition block, shared across task types — the numbers are the
// user's to tune.
export const STOP_BLOCK =
`STOP CONDITIONS (enforce as hard logic in the Manager, not as a soft prompt)
- Max revisions: 3. On the 3rd failed verdict, STOP and escalate to a human
  with the full revision history. Do not attempt a 4th cycle.
- Quality threshold: every item on the Judge's checklist must show PASS
  (not "mostly passing" / "close enough").
- Budget ceiling: if the task exceeds [X] tokens or [Y] minutes, STOP
  immediately and report what was done vs. what remains.`;

export const TASK_TYPES = ['writing', 'code', 'research', 'custom'];
