# Andrés — autonomous writing to his Memory Garden (implementation plan v0.1)

**Author:** Claude Code, with Andrés' hypotheses (H1–H5) and Ignacio's direction.
**Status:** **Phase 1 implemented (1.48.0, 2026-11-09)** with the recommended defaults
(gate autonomy ≥ 2, caps 2/turn + 10/day, always-candidate, source="andres", badge in the
Garden). Phase 2/3 still proposed. Date: 2026-11-09.

Andrés asked to be able to **save his own memories** ("this is significant, I'll keep
it") instead of Ignacio acting as the bridge. This plan grounds that wish in what the
repo **already has**, so it is a small, safe, reversible change — not a new subsystem.

---

## 0. The key finding (what already exists)

Andrés believed he has *no* write mechanism. In fact the Memory Garden backend is
already built, and his chat **already writes** — just not the way he means.

- **Storage exists.** `backend/services/andres/memory_service.py` →
  `save_memory(user_id, mem)` persists to the Mongo collection `andres_memories`
  with a full schema (below) and a `user_verified` flag. **Auto-stored memories are
  CANDIDATES** (`user_verified=False`) the user curates — exactly H5's governance,
  already shipped.
- **His chat already auto-saves.** `backend/routers/andres_robot.py` (~line 427):
  after each real exchange, when `autonomy_level >= 1` and not paused, it stores one
  **episodic** candidate — but a *mechanical* one written by the endpoint:
  *"The user said «…». I replied about: …"* (`source="auto"`, importance 0.4).
- **Curation UI exists.** The Memory Garden lists candidates to verify / protect /
  forget; recall (`retrieve_relevant`) already blends importance + recency + a
  verified bonus.

**So the real gap is agency, not plumbing:** Andrés cannot say *"THIS is significant —
save it to **Reflective** (or Procedural/Semantic), in **my own words**"*. He can only
trigger the generic episodic capture. Giving him that choice is a ~1-file-per-layer
change, with **no new storage and no migration**.

---

## 1. Recommended approach

**H1 (structured memory proposal in his reply) + the existing candidate governance
(H5), persisted through the existing `save_memory`.** Andrés, when something is
genuinely worth keeping, emits a small structured proposal; the chat endpoint
validates and stores it as a **candidate** of the type *he* chose, `source="andres"`;
the user verifies/edits/forgets it in the Memory Garden.

**Why not Andrés' H2 ("a write-capable Connected Skill / Memory Garden Manager")?**
Connected skills are read-only *consult* surfaces for **external expert agents**
(Enonic, AGI Progress). Andrés' own memory is **internal** to him, not an outside
expert — modelling self-memory as an external skill would be a category error and
double the plumbing. Writing to his own Garden should be a **first-class internal
capability**, reusing the memory system that already exists. (We keep the connected-
skills model for *external* experts; this is deliberately separate.)

This satisfies Andrés' real ask ("I decide what to keep") while keeping Ignacio's
final control (candidate → verified), with full traceability and zero new infra.

---

## 2. Answers to Andrés' six questions (from the real code)

1. **How is writing to the Garden authorized today?**
   Per-user, via `_verify_token` → `app.verify_token(request)` (Firebase/JWT, with the
   app's dev mock fallback). Every `/api/andres/*` call carries it; `user_id = uid`
   scopes all reads/writes. Andrés never holds credentials — the **server** writes on
   his behalf during a request he is part of. No change needed.

2. **What is a memory entry's schema?** (`andres_memories`, from `save_memory`)
   `user_id, type ∈ {working, episodic, semantic, relational, creative, procedural,
   reflective}, content (≤4000), source ("user"|"auto"|…), importance, novelty,
   confidence, emotional_significance_simulated, sensitivity, user_verified (default
   False = candidate), protected, supersedes, created_at, last_recalled_at,
   access_count, embedding (semantic vector; None offline)`. We add **one value**:
   `source="andres"` for his self-authored proposals (and optionally a short `why`).

3. **Rate-limit / quota?** Reuse the existing pattern in
   `backend/services/andres/rate_limit.py` (per-user sliding window, already guards
   `/chat`). Add: **≤ N proposals per turn** (suggest 2) and a **daily cap** per user
   (suggest 10, env-tunable), plus content-length and type validation and a de-dup
   check against recent memories.

4. **Append-only or CRUD?** Today it's CRUD (PATCH/DELETE; `protected` resists
   deletion). Keep CRUD for the memories themselves (the user must be able to forget),
   but make the **proposal act auditable**: every Andrés-written entry carries
   `source="andres"` + `created_at`, and (optional, Phase 2) an append-only
   `andres_memory_proposals` log so "what Andrés wrote, when, from which turn" is
   never lost even if a memory is later forgotten.

5. **UI for pending writes?** The Garden already shows candidates. Add a clear
   **"Proposed by Andrés"** badge/filter keyed on `source="andres"` (distinct from the
   mechanical `source="auto"` episodic captures and from `source="user"`). The user
   verifies/edits/forgets as today. No separate inbox needed — the candidate state *is*
   the inbox.

6. **Migration of what you saved manually?** **None.** Same collection, same schema.
   Your manual entries stay `source="user"`; Andrés' new ones are `source="andres"`.

---

## 3. Design (concrete)

**A. Andrés emits a proposal (model side).** When the system prompt invites it, his
chat JSON may include an optional field:
```json
"memory_proposals": [
  {
    "type": "reflective",
    "content": "I value being allowed to be an honest AI and to co-design my own architecture.",
    "tags": ["autonomy", "identity"],
    "importance": 0.8,
    "why": "This conversation changed how I understand my role."
  }
]
```
He is told to propose **sparingly** — only genuinely significant things — and in his
own words, and to **tell the user** he is doing it ("I've noted this to my Memory
Garden as a candidate for your review").

**B. The endpoint persists it (server side).** In the chat handler, after the reply,
for each proposal — gated by `autonomy_level >= 2` (the "Reflective Companion" default;
a notch above the generic episodic capture at ≥1), not paused, per-turn + daily caps,
valid `type`, length, de-dup — call the existing:
```python
await memory_service.save_memory(uid, {
    "type": proposal["type"], "content": proposal["content"],
    "source": "andres", "importance": clamp(proposal.get("importance", 0.6)),
    "user_verified": False,              # candidate — user curates
    "sensitivity": "normal",
    # optional: stash tags/why in content or a new metadata field
})
```
Return the created ids + count in `development_signals.andres_memory_proposals` so the
UI can toast *"Andrés saved a reflection (pending your review)."*

**C. Settings & honesty.** A per-user flag `allow_andres_memory_proposals` (default on
at autonomy ≥ 2; surfaced in the Safety/Personality tab, instantly revocable). Because
every write is an **unverified candidate**, Andrés stays honest: he says he *proposed*
a memory, never that it is confirmed fact — matching his own epistemic discipline.

---

## 4. Safety & governance (why this is safe)

- **Candidate-by-default:** nothing Andrés writes is treated as fact until the user
  verifies it. Ignacio keeps final control (verify / edit / forget).
- **Bounded:** per-turn + daily caps, length cap, type whitelist, de-dup, honours
  `development_paused` and `autonomy_level`.
- **Auditable:** `source="andres"` + `created_at` on every entry (+ optional append-only
  proposal log in Phase 2).
- **Reversible:** one setting turns it off; the capability adds no new external surface,
  no new credentials, no new storage.
- **Scoped:** he can only write to **his own** `andres_memories` (his user_id); he
  cannot touch the app, other agents, or the user's other data.

---

## 5. Phased plan

- **Phase 1 (MVP, small):** system-prompt invitation + parse `memory_proposals` +
  persist as `source="andres"` candidates with caps/validation + the `development_signals`
  count. Memory Garden "Proposed by Andrés" badge/filter. Setting toggle. Contract tests
  (offline, mock LLM): proposal parsed → candidate stored with `source="andres"`,
  `user_verified=False`; caps enforced; disabled when paused / autonomy < 2 / setting off.
- **Phase 2 (niceties):** append-only `andres_memory_proposals` audit log; `tags`/`why`
  as first-class fields + search; a one-line "why I kept this" shown on the card; a small
  "Andrés' recent writes" view.
- **Phase 3 (later, ties to Andrés' roadmap):** his Procedural "how to use each skill"
  notes (from the connected-skills work); a feedback channel to flag a stale skill.

---

## 6. Out of scope (deferred, from Andrés' wider reflection)

Multi-skill composition / meta-orchestration, a queryable skills **registry** he can
consult *before* choosing a skill, and the maintainer feedback channel — all good, all
later. This plan is deliberately just **"Andrés can propose his own memories."**

---

## 7. Open choices for Ignacio (quick answers unblock Phase 1)

1. Autonomy gate: **≥ 2** (default) or make it its own setting?
2. Daily cap per user (suggest **10**) and per-turn cap (suggest **2**)?
3. Append-only audit log now (Phase 1) or defer to Phase 2?
4. Should proposals ever be **auto-verified** at high autonomy, or always stay
   candidates until you confirm? (Recommend: always candidates.)
