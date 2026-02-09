# Claude Code – WLWAI Instructions

## Project context
This repository is the "Workplace Learning With AI" platform.
It is a multi-module system with frontend (React/Tailwind),
backend (FastAPI/Python), and documentation in Markdown.

## Rules
- Do NOT invent files or folders.
- Always respect existing structure.
- Prefer modifying existing code over creating new abstractions.
- Do NOT break backward compatibility unless explicitly asked.
- All changes must leave tests and lint in a green state.

## Testing
- Backend: pytest if tests exist.
- Frontend: do not break existing components.
- If unsure, explain before changing.

## Output
- After finishing, summarize:
  - files changed
  - why changes were made
  - commands executed