# Enonic 'Red Cross' — Help

The **Enonic 'Red Cross'** agent is a project knowledge and testing assistant for the
Norwegian Red Cross **Enonic XP 8 / Content Studio 6** installation. You'll find it in the
sidebar under **Item Agents → Enonic Red Cross**, just below Humanizing AI.

It helps you (and anyone new to this installation) understand the platform and the Red Cross
project, and prepare, explain and troubleshoot its tests. It does **not** run tests, edit the
CMS or write to Azure DevOps — the separate **Red Cross Web QA Agent** remains the execution
and reporting workspace.

## What it does

- Explains the Enonic platform with version-aware documentation links (XP 8 / Content Studio 6,
  kept separate from the older XP 7).
- Answers project-specific questions grounded **only** in a curated, source-credited knowledge
  base — it never makes up facts.
- Lets you search the imported test catalog by id, title, persona, result and sprint.
- Drafts proposed manual test procedures — clearly labelled, with local draft ids, never
  invented Azure DevOps ids.

## The tabs

- **Overview** — what the agent is, the evidence legend, and its limits.
- **Assistant** — a grounded chat. Ask about the platform or the installation and how to test
  it. Every answer comes back with cited sources, an evidence status (supported / partial /
  insufficient) and, when relevant, a list of missing information and a suggested follow-up.
  Type your question (Ctrl/Cmd+Enter sends), or click a suggested question.
- **Knowledge** — the curated facts the assistant may cite, each tagged by evidence level with
  its source.
- **Test Catalog** — the imported test cases. Filter by text, persona (Sluttbruker / Redaktør),
  result and sprint. **Click a case id** to jump to the Assistant with "How should I test case
  N?" already asked.
- **Project Context** — environment URLs, architecture, the Azure DevOps coordinates and the
  "known unknowns" still to collect.

## Evidence levels

Every claim the assistant makes is tagged, so you always know how solid it is:

- **Platform doc** — Enonic product documentation.
- **Project fact** — a confirmed fact about this specific installation.
- **Observation** — a dated, environment-specific result (not a live status).
- **Test recipe** — a how-to step distilled from running tests.
- **Guidance** — a general suggestion, not established project fact.

The assistant never presents speculation as fact, never claims to have opened Content Studio or
executed a test, and never invents official test steps. A past "Passed/Active" result is an
observation at that time, not a statement about today.

## The test catalog

The catalog holds the team's test cases across sprints, imported from the Azure DevOps Test
Plan as **observations** (recorded outcomes), not official step definitions and not live status.
Results map like this:

- **Passed → pass** ✅, **Failed → fail** ❌, **Blocked → blocked** ⛔, **Active (not yet run)
  → planned** 🗓️, and **partial** 🟡 where a case passed with a caveat.

A single test case can belong to several sprint suites, so the catalog is keyed by **(case id,
sprint)** — the same id may appear once per sprint. A few cases also carry a note from a
hands-on test session that goes deeper than the official outcome; the note explains the finding.

## What it does not do (yet)

It does not edit the CMS, publish, execute tests or write to Azure DevOps. A generated test or
defect draft is not an executed test. Uploading your own documents (an ingestion/approval
pipeline) and read-only live connectors to Enonic / Azure DevOps are planned for a later
version — see `docs/enonic-red-cross-agent-plan.md`.

## Languages & configuration

The agent answers in English, Norwegian or Spanish, following the app's language. It uses the
same shared LLM configuration as the rest of the app (set under API Config); no separate key is
needed. If no model is reachable it falls back to an offline placeholder answer, clearly marked.

## Adding more test data

New sprints are added by widening the catalog in `backend/services/enonic_red_cross.py` (each
case carries its `sprint`). Because the Red Cross keeps Azure DevOps private, sprint data is
transcribed from screenshots rather than fetched live.
