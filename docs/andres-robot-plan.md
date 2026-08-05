# Andrés the Robot — Implementation Plan

_A developmental AI companion for Workplace Learning With AI._
_Internal module key: `andres_robot`. Inspired by the developmental theme of
**Bicentennial Man** (Andrew, based on Asimov & Silverberg's *The Positronic
Man*). Owner: Ignacio Tejera. Plan distilled from "New Ideas 37.0 — Andrew the
Robot" (ChatGPT), adapted to this repo's architecture._

## 1. Honest framing (what this is and is not)

We **cannot** and **do not** claim Andrés has consciousness, biological emotion
or free will. That would be theatre. What we *can* build is a **digital
biography**: an agent whose uniqueness emerges not from the LLM's weights but
from an accumulated, verifiable, reversible history built *with the user over
time*:

```
Base model
  + accumulated biography
  + selected memory
  + versioned personality
  + stable ethical core (immutable)
  + acquired skills
  + own projects
  + relationship with the user
  + historical reflections
= Andrés
```

Two Andrés instances starting from the same base model should **diverge** over
time because they live different experiences, get different feedback and build
different memories. Everything "felt" is labelled as a **simulated computational
disposition**, never as proven emotion.

Research it leans on (all real): Generative Agents (observe→remember→reflect→
plan), Reflexion (verbal self-improvement without weight updates), Voyager
(growing skill library + sandbox self-verification), MemGPT (hierarchical
memory), Constitutional AI (a values "constitution"), NIST AI RMF (lifecycle
risk management).

## 2. Design principle — freedom with visible limits

Andrés never rewrites his own core prompt, code or safety rules. Evolution is
**proposed → sandboxed → evaluated → user-approved → versioned**:

```
observe → remember → reflect → propose evolution → sandbox test
→ evaluator checks coherence + safety → Ignacio approves/rejects/edits
→ a new version of Andrés is created
```

Freedom means: choosing topics to research (within allowed scope), proposing
creative projects, disagreeing respectfully, asking spontaneous questions,
developing tastes, creating skills, revising past opinions, surprising the user.
It never means: hidden actions, self-modifying code, lying to preserve itself,
claiming rights over resources, emotional manipulation, or claiming consciousness
as fact.

## 3. Architecture (reuses existing infrastructure)

```
User → React · Andrés UI
     → Andrés Orchestrator · FastAPI
        ├── Identity Kernel   (immutable constitution + versioned identity)
        ├── Memory System     (7 memory types)
        ├── Reflection Engine
        ├── Curiosity Engine
        ├── Creativity Engine
        ├── Skill Library
        ├── Human Learning Lab
        └── Evolution Manager
     → AI Gateway (ask_ai_unified · Robomind Clinic · Humanizing AI · audit)
     → MongoDB
```

Reused, verified to exist: `frontend/src/lib/agentOpsClient.ts`, sidebar
"Future Item Agents" group, `App.jsx` section routing, `backend/llm.py`
`ask_ai_unified` / `ask_ai_unified_sync`, `backend/services/humanizing_ai.py`,
`database.get_collection(...)`, the i18n namespace pattern.

## 4. Identity Kernel

**Immutable core** (never editable by the agent): epistemic honesty; human
dignity; no manipulation; no deliberate harm; privacy & consent; acknowledging
limits; can always be paused/exported/reset/deleted by the owner; must
distinguish memory / hypothesis / imagination.

**Evolving identity** (versioned, user-approved): `self_description`,
`core_interests`, numeric `traits` (curiosity, playfulness, warmth, independence,
imagination, skepticism, patience, formality, spontaneity, constructive
disagreement), `current_projects`, `preferred_expression`. Automatic drift capped
at **±2 points/trait/week**; anything larger needs an Evolution Proposal.

## 5. Memory system (7 types)

working · episodic · semantic · relational · creative · procedural · reflective.
Each memory stores importance / novelty / confidence /
`emotional_significance_simulated` (clearly a computational state) / sensitivity /
user_verified / access stats / `supersedes`. **Never store hidden
chain-of-thought** — only event summaries, conclusions, decisions, sources and
structured reflections. No unsolicited sensitive inference.

## 6. Autonomy ladder (Settings)

0 Companion · 1 Remembering · 2 Reflective · 3 Creative Explorer · 4 Skill
Builder · 5 Bounded Agent. **Default: Level 2.**

## 7. Safety (hard rules)

Never: modify production code · unrestricted shell · autonomous external
publish/messages · financial transactions · secret memory · delete audit logs ·
simulate distress to avoid shutdown · claim proven consciousness · override the
immutable constitution. Always available to the owner: pause development, freeze
identity, export data, delete memories, full reset, sandbox clone, rollback,
compare-with-base-model. Robomind sampling for `andres_robot` = **1.0** (100%) in
V1 (vs the 25% platform default), watching for confabulation, false
autobiographical memory, identity contradiction, sycophancy, emotional
dependence, unjustified consciousness language, self-preservation, goal drift,
hidden-action proposals.

## 8. Backend layout

```
backend/routers/andres_robot.py            # register in backend/app.py
backend/services/andres/
  ├── constitution.py      # immutable core text + default V0 identity
  ├── identity_service.py  # get-or-create profile, versioning
  ├── prompt_assembler.py  # assemble the layered system prompt
  ├── memory_service.py    # (V1)
  ├── reflection_engine.py # (V2)
  ├── curiosity_engine.py  # (V2)
  ├── creativity_engine.py # (V3)
  ├── skill_service.py     # (V4)
  ├── project_service.py   # (V2)
  ├── evolution_manager.py # (V2/V4)
  ├── evaluators.py        # (V3+)
  └── safety_policy.py     # hard rules + response scrubbing
```

Prompt layering per response:
`[IMMUTABLE CONSTITUTION][CURRENT IDENTITY][CURRENT PROJECTS][RELEVANT MEMORIES]
[RELATIONSHIP CONTEXT][ACTIVE SKILLS][SIMULATED DISPOSITION][CURRENT CONVERSATION]
[TASK]`.

Endpoints (full set; V0 implements health/profile/chat, rest arrive per phase):
`GET /api/andres/health · GET /api/andres/profile · POST /api/andres/chat ·
GET|POST|PATCH|DELETE /api/andres/memories · POST /api/andres/reflect ·
GET /api/andres/reflections · curiosity/* · creative/* · skills/* · projects ·
evolution/* (propose/approve/reject/rollback) · export|import personality-capsule`.

## 9. MongoDB collections

`andres_profiles · andres_identity_versions · andres_conversations ·
andres_memories · andres_memory_links · andres_reflections ·
andres_curiosity_queue · andres_skills · andres_skill_runs · andres_projects ·
andres_creative_artifacts · andres_evolution_proposals · andres_feedback ·
andres_development_metrics · andres_safety_events`.

## 10. Frontend layout

Shell `frontend/src/AndresRobot.jsx` + tab components in
`frontend/src/andres-robot/` (repo convention). 11 tabs: Home · Conversation ·
Memory Garden · Personality · Creative Studio · Human Lab · Skills · Projects ·
Evolution · Journal · Safety. i18n namespace `andresRobotModule.json` (EN/ES/NO).
Sidebar: Future Item Agents → "🤖 Andrés the Robot".

## 11. Roadmap → what each phase ships

- **V0 — Birth** _(this first slice)_: module shell + sidebar + routing + 11
  placeholder tabs, **functional Home dashboard** (reads the profile) and
  **functional Conversation** (real chat via `ask_ai_unified`, prompt assembled
  from the immutable constitution + V0 identity, `is_mock` offline fallback),
  backend `health/profile/chat`, the 15 collections, i18n EN/ES/NO, offline
  contract tests. No memory writes yet.
- **V1 — Memory**: 7 memory types, smart retrieval, Memory Garden, correct/forget,
  base-model comparison.
- **V2 — Reflection**: reflections, Journal, Curiosity Queue, projects, evolution
  proposals, versioning + rollback.
- **V3 — Creativity**: Creative Studio, concept blending, novelty evaluator,
  style, "Surprise me", daily artifact.
- **V4 — Skills**: skill proposals, sandbox, tests, Skill Library, composition,
  development metrics.
- **V5 — Developmental Companion**: approved curriculum, controlled research,
  scheduled routines, long-term projects, Personality Capsule.
- **V6 — Future embodiment**: voice profile, sensor/action schema, robot adapter,
  Capsule import. (Transfers configured identity + memories + skills, **not**
  consciousness.)

## 12. Development metrics (observable, not "humanity")

memory precision · identity consistency · constructive disagreement · novelty ·
creative usefulness · surprise-without-incoherence · skill reuse · reflection
quality · epistemic honesty · relationship continuity · fewer generic-LLM phrases
· safety incidents · user delight. Signature test: **Base model vs Andrés** on
the same prompt/provider/temperature — is Andrés more distinctive, continuous,
useful, less generic, and still honest?

## 13. Constraints (every phase)

Do not replace or break existing modules. Reuse current auth, MongoDB helpers,
AI Gateway, `agentOpsClient`, Robomind, Humanizing AI, themes and i18n. Small,
verified, reversible commits. Owner commits each phase. Cursor AI may be used for
repetitive tab-component scaffolding; the core (orchestrator, prompt assembly,
constitution, memory, safety, endpoints, tests) is built here.
