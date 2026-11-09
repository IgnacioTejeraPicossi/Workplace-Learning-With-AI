# Enonic 'Red Cross' Agent — implementation plan & status

**Status:** V1 shipped (1.46.0, 2026-11-09). Grounded project-knowledge & testing
assistant for the Norwegian Red Cross **Enonic XP 8 / Content Studio 6** install.
Placed in **Item Agents**, directly below **Humanizing AI**.

This doc is the *improved* version of the ChatGPT handoff plan
(`docs-md/New Ideas 38.0 Enonic Redd Cross agent.docx`). The original plan was sound
but sized for a full document-ingestion product. We right-sized V1 to the pattern the
other agents in this app actually shipped with (self-sim-reality, cyber, EA-brain):
**a curated, source-credited knowledge base + grounded chat with offline fallback** —
then documented the ingestion pipeline as a deferred V2. We already have real,
first-hand knowledge of this install (several sprints of executed tests), so the V1
knowledge base is genuinely useful on day one, not an empty shell.

---

## 1. What V1 does

- Explains the **Enonic platform** with version-aware documentation links (XP 8 /
  Content Studio 6 kept separate from XP 7).
- Answers **project-specific** questions grounded only in a curated, cited KB.
- Searches a **seed catalog of Sprint-7 cases** by id / title / persona / result.
- Drafts **proposed** manual test procedures — labelled, with local draft ids.

**Epistemic discipline (non-negotiable).** Every claim is tagged with one of
`platform-doc | project-fact | project-observation | test-recipe | guidance`. The agent
never presents speculation as fact, never says it opened Content Studio or executed a
test, never invents official steps or Azure DevOps ids, and treats a past "Passed/Active"
observation as dated — not a live-status claim.

**Out of scope for V1 (by design):** editing the CMS, publishing, executing tests,
writing to Azure DevOps, and the document upload/approval ingestion pipeline. A generated
test/defect draft is not an executed test.

---

## 2. Architecture (as built)

Same shape as the other grounded agents. "RAG-lite": a curated KB, each chunk carrying an
epistemic level + sources, retrieved by exact test-id + keyword overlap and injected into a
**server-owned** prompt; generation delegated to the shared `ask_ai_unified` gateway.

```
frontend/src/enonic-red-cross/EnonicRedCross.jsx   # 5 tabs, EN/NO/ES, cited answers
        │  fetch
        ▼
/api/enonic-red-cross/*  (backend/routers/enonic_red_cross.py)
        │
        ▼
backend/services/enonic_red_cross.py               # KB + catalog + retrieve + answer()
        │  messages (system prompt + grounding block)
        ▼
backend/llm.py :: ask_ai_unified                   # shared provider/model + fallback
```

**Endpoints** (`/api/enonic-red-cross/`): `GET /health`, `GET /knowledge`,
`GET /test-catalog` (filters: query/persona/result), `GET /project-context`,
`POST /chat` (`{message, lang, history}` → `{short_answer, sections[], evidence_status,
missing_information[], suggested_next_question, sources_consulted, is_mock}`).

**Grounding sources (17 KB chunks):** Enonic platform docs; the 7 deployed content types;
public URL patterns; the publish flow; the new-slug propagation behaviour; district vs
local-branch contact data; toppbanner image-vs-buttons; Fakta/Listeside; required-field
publish-block; and test recipes (create content, CKEditor save, verify on the public
frontend, existing-page workaround, drafting from a title).

**Seed catalog (24 cases):** executed Sprint-7 Sluttbruker + Redaktør cases, each kept as
a dated **observation** with the result we saw. The full Azure DevOps export (official steps
+ expected results) is still to be imported.

**LLM config.** V1 uses the server-side shared config (as self-sim-reality does). Forwarding
the per-request API-config headers (`x-openai-key`, model selector) is a trivial later add if
the global selector should drive this module per request.

---

## 3. Validation

- `backend/tests/test_enonic_red_cross_contracts.py` — 8 offline contract tests (retrieval
  grounding incl. exact test-id, KB/catalog well-formedness, level/status clamping, both the
  mock and the LLM-parse chat paths). CI-safe (no network/model).
- Frontend `npm run build` passes; i18n EN/NO/ES parity.
- Manual smoke: `curl http://localhost:8000/api/enonic-red-cross/health`.

---

## 4. V2 roadmap (deferred, from the original plan)

Build these **only after** V1 is in use, each as an additive capability:

1. **Document ingestion pipeline** — upload/fetch → validate → extract (MD/PDF/DOCX/TXT) →
   preview → reviewer approval → index → active; keep raw + extracted text with hash,
   author/reviewer, revision; dedup; deactivation invalidates retrieval. Fetch only approved
   documentation domains; reject private-network/redirect targets.
2. **Mongo persistence** — `erc_sources`, `erc_source_revisions`, `erc_cases`, `erc_points`,
   `erc_results`, `erc_conversations`. A case definition, a test point and a test result are
   separate records; authorize every read/export/citation lookup.
3. **Structured test import** — CSV/JSON mapping preview; preserve case ids, revision,
   Norwegian titles and ordered action/expected pairs; reimport is idempotent.
4. **Real retrieval** — start with lexical/BM25 + exact-id (already the seam in `retrieve()`);
   add embeddings only if it does not become a new paid dependency or leak project data.
5. **Read-only connectors (later)** — approved Enonic (Guillotine) + Azure DevOps read
   connectors; then an explicit, permissioned handoff to the Red Cross Web QA runner (which
   must return real run ids/evidence — the assistant never manufactures them). Credentials via
   the app's server-side secrets; never in prompts/logs.

**Definition of done (V2):** authorized users maintain sources; answers are traceable to
active revisions; access-control and unsupported-claim gates pass; ≥90% correct evidence
retrieval on answerable questions with zero fabricated references (human-reviewed).

---

## 5. Inputs still to collect (non-blocking)

- Exact installed XP / Content Studio / Red Cross app minor+patch versions.
- Full Azure DevOps export (official steps + expected results, both personas).
- Approved content schemas, role matrix and acceptance criteria.
- Project data policy: which configured LLM providers may receive internal material.
- Which of the new 30xxx features are actually merged/deployed to xp8dev.
