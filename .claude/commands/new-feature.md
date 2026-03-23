# /new-feature — Implement a New Feature

Guided workflow for safely implementing a new feature in WLWAI.

## Instructions

Follow this sequence for every new feature:

### Phase 1: Understand before acting
1. Read `.claude/PROJECT_MAP.md` and `.claude/MODULES_REFERENCE.md`
2. Identify the target module(s) and service boundary
3. Read existing relevant files — do NOT guess how things work
4. Check `docs/AGENTS.md` for module-specific guardrails

### Phase 2: State plan
Before writing code, state:
- What the feature does
- Which files will be changed
- What new files (if any) are needed
- What API contract changes (if any) — and who the consumers are
- What validation you will run after

### Phase 3: Implement (minimal changes)
- Keep edits focused and explainable
- One logical change at a time
- Preserve existing code style
- Do not add features beyond what was asked
- Do not add docstrings/comments to code you didn't change

### Phase 4: Validate
Pick the right validation gate:

| What changed | Validation |
|-------------|-----------|
| Backend endpoint internals | `/backend-smoke` + relevant `curl` |
| Backend schema | Trace all consumers + `/test` |
| Robomind module | `pytest test_robomind_api_contracts.py` |
| MCP integration | `/mcp-validate` |
| Frontend component | Manual smoke: load page, check no crash |
| Prompt logic | Test-preview flow in UI |

### Phase 5: Report
Always summarize:
- Files changed (exact paths)
- Reason for each change
- Commands run and results
- Remaining risks
- Suggested next step

## Change Risk Levels
- **Low**: docs, comments, UI text, small helpers — proceed freely
- **Medium**: endpoint internals, prompt logic, state flow — explain risk first
- **High**: schema changes, auth, cross-service, manifest contracts — explicit user approval required

## What NOT to do
- No broad rewrites unless explicitly requested
- No speculative cleanup in unrelated files
- No renaming modules/folders without explicit request
- No adding features beyond what was asked
- No removing backward-compatible code without tracing impact
