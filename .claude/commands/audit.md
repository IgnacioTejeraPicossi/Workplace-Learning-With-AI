# /audit — Read-Only Repository Audit

Perform a **read-only** quality audit of the WLWAI repository.

## Instructions

You are in **read-only audit mode**. Do NOT modify any files.

Follow this sequence:

1. Read `.claude/PROJECT_MAP.md`, `.claude/ARCHITECTURE.md`, `.claude/MODULES_REFERENCE.md`
2. Read `docs/AGENTS.md`, `docs/llms.txt`, `docs/TESTING.md`
3. Inspect the specific area requested by the user, or default to a full audit

## Audit Report Format

Produce a structured report covering:

### 1. Architecture Consistency
- Are service boundaries respected?
- Are imports/dependencies clean across modules?
- Any circular dependencies or unexpected coupling?

### 2. Code Quality
- Obvious anti-patterns or dangerous code
- Missing error handling at system boundaries
- Insecure patterns (injection, hardcoded secrets, etc.)

### 3. Test Coverage
- Which modules have tests? Which don't?
- Are critical paths validated?
- Suggested missing quality gates

### 4. Fragile Areas
- Code that would break silently if changed
- Missing null checks at system boundaries
- Auth/security gaps (e.g., Firebase fallback mock user)

### 5. Documentation Gaps
- Undocumented endpoints or modules
- Stale docs that don't match code

### 6. High-Risk Dependencies
- External services without fallbacks
- Deprecated or pinned-old dependencies

### 7. Quick Wins
- Low-risk, high-value improvements
- Missing test IDs, obvious null handling, etc.

### 8. Suggested Safe Follow-up Actions
- Ordered by risk and value
- Include validation command for each

## Change Risk Classification
- **Low risk**: docs, comments, small helpers, UI text fixes
- **Medium risk**: endpoint internals, prompt logic, frontend state
- **High risk**: schemas, manifest contracts, auth changes, cross-service refactors

Only propose changes after explicit user approval.
