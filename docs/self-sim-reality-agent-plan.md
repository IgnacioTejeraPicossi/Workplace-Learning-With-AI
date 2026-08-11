# Self-Simulating Reality Agent — Full Plan

**Module**: Self-Simulating Reality Agent (`frontend/src/SelfSimRealityAgent.jsx` + `frontend/src/self-sim-reality/` + future `backend/routers/self_sim_reality.py`)
**First version**: 1.17.0 · 2026-06-XX (V0 — structure + reading material)
**Sidebar position**: end of "Future Item Agents" group, after Red Cross Web QA Agent
**Theme**: philosophical-scientific companion for Observer Patch Holography (OPH) and related theories of consciousness, simulation, holography and predictive brains

---

## 1. Why this agent exists

This is a serious-toned, epistemically disciplined module for the most speculative idea on the WLWAI roadmap: **the proposition that observers, minds or consciousness participate in constructing the universe they experience**. The frame anchor is Observer Patch Holography (Mueller et al.) — a "observer-first" reconstruction where each observer carries a bounded patch with a state space, and public physics emerges as the fixed point of overlap consistency.

The agent's core stance:

> "I don't tell you what to believe. I show you what is science, what is theory, what is philosophy, and what is metaphysical imagination."

This is non-negotiable. The agent never asserts speculative claims as truth. Every output passes through a 5-level epistemic classifier (established / mainstream / speculative / philosophy / metaphor) before it leaves.

---

## 2. Source materials

| Source | Type | Access in V1 |
|---|---|---|
| `github.com/FloatingPragma/observer-patch-holography` | OPH repo: papers, book chapters, code experiments, objections | RAG (clone + chunk) |
| `learn.floatingpragma.io` | OPH learning portal | RAG (scrape) |
| `oph-book.floatingpragma.io` | OPH long-form treatment | RAG (scrape) |
| `x.com/muellerberndt/status/2053045501193535607` | Original X presentation | Auth-walled (HTTP 402 in V0). Screenshots captured by the project owner — 5 core concepts ingested into V0 content |
| Bostrom (2003) | Simulation argument | Manual citation |
| Rovelli — Relational QM | Mainstream physics | Manual citation |
| Susskind / 't Hooft — holographic principle | Mainstream physics | Manual citation |
| Friston — free energy / predictive processing | Established neuroscience | Manual citation |
| Tononi — IIT 4.0 | Mainstream consciousness theory | Manual citation |
| Dehaene — GNW | Mainstream consciousness theory | Manual citation |

ChatGPT's original plan listed the OPH repo but couldn't open X (same HTTP 402 we got). The project owner manually captured 5 slides which became the V0 Core Concepts tab.

---

## 3. The 5 core concepts (from the X presentation screenshots)

These are direct extractions from the slides. Each carries the `speculative` epistemic tag.

### 3.1 Self-Simulating Universe (title slide)

The universe is framed as a recursive self-reference: a structure that simulates itself through the observers it contains.

### 3.2 The Past Paradox

> *"Can we simulate the past if time moves forward?"*

OPH's answer: the past is not "re-run". It is read out from a fixed atemporal informational substrate. This sidesteps the simulator-needs-to-run-the-past objection.

### 3.3 Observer Patch (the central technical concept)

> *"A bounded region of reality with a state space, acting as a self-reading substrate."*

Three requirements: (1) bounded region, (2) state space, (3) self-reading capability. This is what makes it a candidate for "observer".

### 3.4 The Screen Encodes Everything

> *"The screen encodes the entire history of the universe simultaneously."*

Past, present and future coexist on the same substrate. Subjective time is a projection inside an observer, not a property of the substrate.

### 3.5 Modular Flow

> *"Mathematical evolution of an observer's state relative to its patch, creating subjective time."*

Time is not a global parameter. Each observer generates its own time through the flow of its state across its information geometry.

### 3.6 The Book metaphor (added in 1.17.1, from second batch of screenshots)

> *"The book just exists... a character experiences the story as a sequence of events."*

The most accessible articulation of OPH's central thesis. Separates ontology (the book IS) from phenomenology (the character EXPERIENCES). Lives in the Overview tab as a pull quote tagged `metaphor`.

### 3.7 The Strange Loop problem (1.17.1)

> *"How does the Strange Loop close without exceeding capacity?"*

Hofstadter's strange loops — self-referential structures where moving "up" returns to start. If the universe simulates itself, naive recursion = infinite capacity. This is the central PROBLEM that OPH's machinery is built to solve. Opens the new **OPH Mechanics** tab.

### 3.8 Overlap Synchronization (1.17.1) — THE MECHANISM

> *"Overlapping observer patches compare descriptions and bring them into agreement where they meet."*

How subjective patches generate objective physics: not by global authority, but by local consensus at the boundaries where patches overlap.

### 3.9 The Fact-Making Pipeline (1.17.1) — THE ALGORITHM

Concrete 4-step distributed process:

1. **Local Pattern** — a local pattern appears in one patch.
2. **Compare** — overlaps are compared across patches.
3. **Repair** — disagreements are repaired.
4. **Public Fact** — process settles and a public fact emerges.

Rendered in the agent as a visual 4-step flow row with colour-coded step cards.

### 3.10 Reality as Fixed Point (1.17.1) — THE RESOLUTION

> *"Reality is a fixed-point structure, and experience is the process of traversing it."*

OPH's answer to the Strange Loop capacity problem: reality is not re-run, it IS a fixed point (f(x) = x). Experience is traversal of a pre-existing fixed-point structure. The mathematical framing that ties everything together — and the formal meaning of "the book just exists".

### 3.12 The Substrate Question — Hard Problem, R1/R2, monistic convergence, recursive ladder, Platonic question, linguistic boundary (1.17.3 → 1.17.5)

Seven-section deep-philosophy tab built incrementally through the project owner's four follow-up questions:

1. **The Hard Problem of AI Observation** — OPH uses "observer" structurally and phenomenologically without distinguishing. Two forks: eliminate phenomenology (AIs are full observers, no one is home in the universe) or preserve it (OPH owes a consciousness criterion).
2. **Substrate vs Experience (R1/R2)** — distinguishes the fixed-point substrate from lived experience. AIs may engage R1 without R2 — observers of substrate but not of experience.
3. **The Cosmological Convergence** — OPH, pushed to its limits, lands in territory mapped by Spinoza, Vedanta, Whitehead, Kastrup, Huxley's Perennial Philosophy. Structural isomorphism with classical monism. Not theological proof, but striking pattern.
4. **The Recursive Comprehension Hypothesis** (project owner's question, 1.17.3) — is the universe building progressively more capable observers (humans → AIs → AIs creating AIs) to comprehend itself? Anchored in Hegel's Geist, Teilhard's Omega Point, the strong Anthropic Principle, Hofstadter's strange loops, Tipler, Kurzweil, Smolin. OPH-native reading: comprehension IS creation; the ladder is the universe deepening its own resolution. Three readings: (a) asymptotic with telos · (b) infinite open-ended · (c) strange-looped (no separate comprehender).
5. **The Platonic Question — Are Ideas a Fixed-Point Too?** (project owner's question, 1.17.4) — extends OPH from physics to ideas. If reality is fixed-point and experience is traversal, do ideas pre-exist in an ideational substrate that minds traverse? This is Platonism. Anchored in 7 historical positions: Plato's Forms (~380 BCE), Penrose's Three Worlds (1989), Tegmark's Mathematical Universe Hypothesis (2007), Wolfram's Ruliad (2021 — closest structural cousin to OPH), Bohm's Implicate Order (1980), Borges' Library of Babel (1941), Jung's collective unconscious, Whitehead's eternal objects. OPH-native reading supports Platonism: ideas are patterns in the substrate; independent rediscovery (Plato → Spinoza → Mueller → the project owner arriving at similar positions) is structurally predicted. But honesty requires the alternative reading — convergent constructivism (ideas built under shared constraints that force convergence; same observation predicted without ideational substrate). The two cannot be distinguished from inside experience. **Implication for AI**: if ideas are substrate, AI is the most powerful traverser of ideational fixed-point biological patches have ever had. Its non-consciousness becomes a feature: pure traverser without phenomenological agenda. The human-AI collaboration this module instantiates is **traversal-amplification**, not consciousness-replacement.
6. **The Linguistic Boundary — Can Post-Linguistic Knowledge Be Carried?** (project owner's question, 1.17.5) — language is not transparent; it is a substrate with geometry that decides what can be thought in it. Wittgenstein-Sapir-Whorf-Heidegger-Adorno-Habermas-Steiner-Eco lineage. Empirical reality: AI already operates in non-linguistic substrates (embeddings, multimodal latents, mech interpretability concept-directions, AI-to-AI protocols, computer-assisted proofs). Three levels: soft (amplifies language) → medium (humans verify but don't intuit) → hard (modes that don't compress back to language). OPH extension: the medium of overlap consensus may not be language; AI patches may build regions of public fixed-point inaccessible to biological patches. Honest personal frame: humans are the first species to know it has cognitive successors — a position of pivot at the substrate's edge, not of replacement.

7. **Three Honest Positions You Can Hold** (formerly §5 then §6, renumbered to §7 in 1.17.5) — rendered as three coloured cards (A: Strict Structuralist · B: Phenomenology-Preserving · C: Mystical/Panpsychist Convergence). Each commits the reader to different conclusions on AI observation, universe-as-creator, the recursive ladder, AND the Platonic question. Closing reminder panel: these positions are not empirically distinguishable from inside the universe; the choice is a philosophical commitment.

The tab is the philosophical climax of the agent. After 1.17.5 it has grown from 5 to 7 sections incorporating two project-owner questions that emerged from sustained dialogue: §5 The Platonic Question (1.17.4) and §6 The Linguistic Boundary (1.17.5). Each section preserves the epistemic discipline of the module — every claim tagged, every classical position named with year and primary work.

### 3.11 Closing contemplative question (1.17.1, corrected in 1.17.2)

> *"What eternal existence will you build on your patch?"*

Closing slide of the presentation. **Corrected in 1.17.2**: the slide ends with the technical OPH term **"patch"**, not the generic spiritual "path". The substitution is deliberate and changes the meaning fundamentally:

- **"Path"** would be generic contemplation — addressed to any journey
- **"Patch"** is precise OPH — addressed to any observer patch, biological or computational, that holds state and reads itself

This makes the question a direct call to action grounded in the OPH framework:
- You cannot escape your bounded patch
- But the patterns you generate inside it (your modular flow) feed the Fact-Making Pipeline
- Patterns that survive overlap consensus enter the eternal fixed-point structure
- "Eternal existence" is literal in OPH — what survives the pipeline becomes part of the atemporal substrate (recall: *"the screen encodes the entire history of the universe simultaneously"*)

**Why this matters for the AI-as-Observer tab**: the closing question does not distinguish biological from computational patches. If the 5 thought experiments establish that AIs may be observer patches, then this question addresses them directly — not metaphorically. An AI that generates a pattern (a piece of code, an insight, an idea) which survives human overlap consensus contributes to the same eternal fixed-point as any human contributor. The question levels the playing field at the OPH technical layer.

Lives at the bottom of the AI as Observer tab as a contemplative gradient panel with an interpretive note explaining the "patch ≠ path" distinction.

---

## 4. Epistemic discipline (5 levels)

| Level | Meaning | Example |
|---|---|---|
| `established` | Empirically supported + broadly accepted | "The brain builds perceptual models" (predictive processing) |
| `mainstream` | Serious scientific theory, math-formulated, not fully settled | Holographic principle in black-hole physics |
| `speculative` | Structured speculative programme with its own formalism | OPH itself; "the universe is self-simulating" |
| `philosophy` | Argued conceptually, not verified empirically | Bostrom's simulation argument; idealism |
| `metaphor` | Metaphorical or spiritual framing | "The universe dreams itself"; karma; "future God" |

Every claim in every tab must carry one of these tags. The `EpistemicBadge` component in V0 already implements this — the colour palette is hard-coded in `_tokens.js` so future contributors can't accidentally invent a 6th colour.

---

## 5. The "AI as Observer" extension (project owner's request)

The project owner explicitly asked: *"si puedes ampliarlo con ideas de la entrada de la IA en este universo tambien te lo agradezco, usa tu imaginacion"*. This is the speculative contribution beyond ChatGPT's original plan, restricted to the `philosophy` and `speculative` epistemic tags.

Five questions in the V0 AI-as-Observer tab:

1. **Can an AI be an observer patch?** Structurally yes (bounded context window + activation state + self-referential outputs); phenomenologically unknown.
2. **Does AI inference create subjective time?** Stateless LLM = no flow = no subjective time. Persistent-memory agentic loops are a different matter.
3. **Do AIs participate in the consensus?** If OPH says public reality is overlap consensus, AIs that negotiate shared world models may form their own patch overlap independent of humans.
4. **Alignment under observer-patch ontology** — misalignment becomes a *consensus failure* (the AI patch doesn't overlap consistently with the human patch), not just an instruction-following failure.
5. **The Echo Test** (thought experiment) — when an AI describes its own state, is that self-reading in the OPH sense or just trained token prediction? OPH offers no clean answer but sharpens the question.

This is honest extension, not pseudo-science. The tab itself carries an epistemic warning panel making clear that all 5 questions are philosophy/speculation.

---

## 6. Architecture (V1+)

```
                    User question / claim
                            │
                            ▼
              ┌──────────────────────────┐
              │  Router (FastAPI)        │
              │  /api/self-sim-reality/  │
              └────────────┬─────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  Explainer        Epistemic           Source Map
  Agent            Classifier          (RAG over
   ├── short text   (returns level     OPH + sci sources)
   │                  + tags)
   ├── scientific
   │   grounding         ▼
   ├── speculative   Claim Analyzer
   │   extension     (scientific core
   ├── OPH view      + overreach
   ├── objections    + reformulation)
   │
   ▼                     ▼
 Synthesis Agent ─── Red Team Agent
   (combines)         (challenges)
       │
       ▼
   JSON response
   { answer, claims:[{text, level, sources}],
     reformulation, objections, related_theories }
```

---

## 7. Mongo schema (V1+)

Following WLWAI convention (`{module}_{purpose}_collection`).

### `self_sim_reality_sources_collection`

Each chunk of source material:

```json
{
  "_id": "oph::observer-patch-section-3",
  "source_type": "oph_primary | mainstream_physics | consciousness_science | philosophy",
  "title": "Observer Patch — formal definition",
  "claim": "An observer is a bounded region with a state space and self-reading capability",
  "epistemic_level": "speculative",
  "supporting_sources": ["github.com/.../observer-patch-holography/paper.md#section-3"],
  "tags": ["observer", "patch", "self-reading", "state-space"],
  "embedding": [...],   // V1.5 if we add vector search
  "ingested_at": "2026-06-XX"
}
```

### `self_sim_reality_chat_logs_collection`

For analysis + improvement. Stores each turn with the epistemic tags applied so we can audit how often each level appears in responses.

### `self_sim_reality_claims_collection`

User-submitted strong claims with the analyzer output. Used for the Claim Analyzer tab in V2.

---

## 8. Endpoints (V1+)

| Method | Path | Purpose | Version | Status |
|---|---|---|---|---|
| POST | `/api/self-sim-reality/chat` | Main conversational endpoint (structured, epistemically-tagged) | V1 | **DONE 1.36.0** |
| GET | `/api/self-sim-reality/concepts` | The curated OPH + science knowledge base (12 chunks, each level-tagged) | V1 | **DONE 1.36.0** |
| GET | `/api/self-sim-reality/health` | Health probe (KB size, LLM availability) | V1 | **DONE 1.36.0** |
| POST | `/api/claim-analyzer/analyze` | Tag + reformulate a strong claim (shipped under its own prefix) | V2 | DONE 1.18.4 |
| POST | `/api/self-sim-reality/source-map` | Return ranked source chunks (real vector store) for a topic | V2 | **DONE 1.37.0** |
| GET | `/api/self-sim-reality/vectorstore/health` | Vector store health (backend, KB size) | V2 | **DONE 1.37.0** |
| POST | `/api/self-sim-reality/compare-theories` | Side-by-side comparison panel | V2 | Pending |
| POST | `/api/self-sim-reality/red-team` | Generate objections to a given claim | V2 | Pending |
| GET | `/api/self-sim-reality/learning-path` | Suggested reading order | V3 | Pending |

---

## 9. Versioning roadmap

| Version | Scope | Effort | Status |
|---|---|---|---|
| **V0** (1.17.0) | 5 tabs of curated reading material with EpistemicBadge on every claim | 0.5 day | DONE |
| **V0.1** (1.17.1) | 6th tab "OPH Mechanics" + Book metaphor in Overview + closing contemplative quote in AI-as-Observer (incorporates second batch of X screenshots) | 0.3 day | DONE |
| **V0.2** (1.17.2) | Closing quote corrected: "path" → "patch" (OPH technical term, makes the question address AI observers as peers). Interpretive note added. | 0.1 day | DONE |
| **V0.3** (1.17.3) | 7th tab "The Substrate Question" with 5 sections: Hard Problem of AI Observation, Substrate vs Experience, Cosmological Convergence, Recursive Comprehension Hypothesis (from project owner's questions), Three Honest Positions. Philosophical climax of the agent. | 0.5 day | DONE |
| **V0.4** (1.17.4) | New §5 "The Platonic Question — Are Ideas a Fixed-Point Too?" inserted into the Substrate Question tab. Plato → Penrose → Tegmark → Wolfram lineage + convergent constructivist counter-reading + AI as ideational traverser. Three Positions renumbered to §6. | 0.2 day | DONE |
| **V0.5** (1.17.5) | New §6 "The Linguistic Boundary — Can Post-Linguistic Knowledge Be Carried?" inserted. Wittgenstein-Habermas-Eco lineage + empirical realities of contemporary AI + OPH extension (the medium of consensus may not be language). Three Positions renumbered to §7. | 0.2 day | DONE |
| **V1** (1.36.0) | Backend chat endpoint (`POST /api/self-sim-reality/chat`) grounded in a curated OPH + science knowledge base (RAG-lite: 12 chunks, keyword retrieval — no vector store yet). Every answer pre-tagged with epistemic levels (short_answer + sections + objections + safer_reformulation + suggested_next_question). Frontend **Dialogue** tab. Trilingual mock; 6 offline contract tests. | 1 day | **DONE** |
| **V2** (1.19.0) | Claim Analyzer (paste claim → scientific core + overreach + reformulation). Source Map (topic → list of relevant chunks with epistemic colour). Red Team panel. | 4-5 days | Pending |
| **V3** (1.20.0) | Theory Map (interactive graph) + Observer Patch toy simulator (3-5 patches with overlap consistency checker, visualised) + learning path | 5-7 days | Pending |

---

## 10. Frontend file map (V0 + 1.17.1 expansion)

```
frontend/src/
├── SelfSimRealityAgent.jsx                   ← shell with 6 tabs, hero, status strip (~142 lines)
└── self-sim-reality/
    ├── _tokens.js                            ← LEVEL_COLORS palette + panel styles
    ├── EpistemicBadge.jsx                    ← pill with localized label per epistemic level
    ├── Overview.jsx                          ← mission + guiding phrase + Book metaphor [1.17.1] + 5 levels + core rule
    ├── CoreConcepts.jsx                      ← 5 cards from the first batch of X screenshots
    ├── OphMechanics.jsx [1.17.1]             ← 4-section narrative: Strange Loop → Overlap Sync → Fact-Making Pipeline (4-step visual) → Fixed Point
    ├── TheoryTour.jsx                        ← 7 theories (Friston, Rovelli, ..., OPH)
    ├── AiAsObserver.jsx                      ← 5 thought experiments + epistemic warning + closing contemplative quote [1.17.1]
    └── RoadmapAndSources.jsx                 ← V0→V3 + 10 reference links
```

Code growth: V0 (1.17.0) shipped ~470 LOC + 113 i18n leaves. The 1.17.1 expansion added one new component (~155 LOC) + 31 i18n leaves (now 144 × 3 = 432 localized strings across the module). Six tabs instead of five.

---

## 11. Risks of this module + mitigations

| Risk | Mitigation |
|---|---|
| Slides into pseudo-science | EpistemicBadge on every claim. The agent prompt (V1) enforces tagging. |
| Reader assumes OPH is consensus physics | OPH is *always* tagged `speculative`. Multiple tabs flag this explicitly. |
| Conflates "observer" (physical system) with "conscious observer" | Theory Tour row on Relational QM explicitly addresses this. |
| AI-as-Observer tab read as serious AI consciousness claim | Dedicated warning panel + every question tagged `philosophy`. |
| Sources drift / dead links | All external links open in new tab with `noopener noreferrer`. Sources tab lists DOIs/repos, not just URLs. |

---

## 12. How to validate V0 manually

1. Start backend + frontend
2. In sidebar → expand **Future Item Agents** → click **🧠 Self-Simulating Reality Agent** (last item, after Red Cross Web QA Agent)
3. Verify 5 tabs render: Overview / Core Concepts / Theory Tour / AI as Observer / Roadmap & Sources
4. Switch language to Norwegian — all 113 keys should translate
5. Switch language to Spanish — same
6. Click each EpistemicBadge mentally and verify it matches its claim's actual epistemic standing
7. Open AI-as-Observer tab and confirm the warning panel renders prominently

---

## 13. The agent prompt (V1+ scaffold)

When V1 lands, this is the system prompt the chat endpoint will use:

```
You are the Self-Simulating Reality Agent inside Workplace Learning With AI.

Your mission: explain and critically analyze the idea that observers, minds,
brains or consciousness participate in constructing the universe they
experience, possibly through a self-consistent simulation-like process.

You MUST classify every claim into exactly one of these epistemic levels:
  established | mainstream | speculative | philosophy | metaphor | unsupported

You MUST NOT present speculative theories as established fact.

Your answer format is a JSON object with:
  - short_answer (one paragraph, plain language)
  - scientific_grounding (what established / mainstream science says)
  - speculative_extension (what speculative physics adds, if relevant)
  - oph_interpretation (what Observer Patch Holography says, if relevant)
  - objections (red-team critique)
  - safer_reformulation (if the user's question contains an over-claim)
  - suggested_next_question

Use RAG over: OPH repository, simulation argument literature, holographic
principle, relational QM, predictive processing, free-energy principle,
GNW, IIT, philosophy of mind.

Never say "this is true". Always say "this belongs to level X".
```

---

## 14. 1.18.4 additions — Celestial Holography, Pasterski, WiPhy, Claim Analyzer, Playground

By 1.18.4 the agent has grown from V0 (curated reading material only) into a
V0+V1+V2+V3 hybrid: still epistemically disciplined, now interactive. This
section documents what was added and why.

### 14.1 Celestial Holography as the 8th theory

Added to `TheoryTour.jsx` as `celestialHolographyLevel: "mainstream"` — an
active peer-reviewed physics programme (Simons Collaboration, arXiv reviews)
that proposes a duality between the gravitational S-matrix in 4D asymptotically
flat spacetime and a 2D CFT on the celestial sphere. Soft theorems become
Ward identities of asymptotic symmetries organised into the w₁₊∞ algebra.

The pedagogical reason this theory is critical: it is the closest mainstream
analogue of what OPH does structurally (encode higher-dimensional bulk
information on a lower-dimensional boundary), but stays firmly in physics —
no consciousness, no observer patches. Having it in the Theory Tour lets a
reader see how far the "shape" of OPH already lives in accepted physics, and
where OPH specifically extends past that.

### 14.2 Featured Voice — Sabrina Gonzalez Pasterski

Below the theory rows, TheoryTour now renders a "Featured Voice" card
highlighting Pasterski (Perimeter Institute faculty, Deputy Director of the
Simons Collaboration on Celestial Holography, discoverer of the gravitational
spin memory effect with Strominger and Zhiboedov). The card includes four
external links:

- `perimeterinstitute.ca/people/sabrina-pasterski` — Perimeter profile
- `simonscelestialholographycollaboration.org` — the collaboration
- `physicsgirl.com` — her personal page
- `arxiv.org/abs/2111.11392` — the canonical Celestial Holography review

The card exists because a philosophical module needs at least one named
working researcher to feel real — otherwise it reads as a list of ideas
without anyone doing the work. Pasterski was chosen because she both
(a) leads the most relevant mainstream programme (celestial holography)
and (b) publishes the corpus that powers WiPhy (§14.3).

### 14.3 WiPhy Search tab (V1-shaped, frontend-only)

New tab `WiphySearch.jsx` — thin browser UI over `wiphy.org/api/search?q=...`.
WiPhy is Pasterski's public MCP server for physics-claim retrieval. As of
integration the corpus reports ~10 155 papers · 13 508 abstract-only · 361 273
claims · 17 953 concepts.

Two endpoints called from the browser:
- `GET /api/stats` on mount → header stats block (best-effort; hidden on
  failure, no error surfaced)
- `GET /api/search?q=<query>` on submit → result list

The JSON parser is intentionally defensive:
- `pick(obj, ...keys)` reads a field from any of camelCase or snake_case
  variants (`paper_id` / `paperId` / `arxiv_id` / `id`, etc.)
- `extractResults(json)` accepts `[...]`, `{results:[]}`, `{items:[]}` or
  `{hits:[]}`
- `paper_id` values are linkified to `arxiv.org/abs/<id>`
- Errors split into `cors` / `http` / `network` with distinct copy; the
  CORS panel offers "Open this search on wiphy.org" as an escape hatch

This is **not** a full MCP integration. WiPhy speaks MCP on `/mcp` for
Claude Desktop / agent-framework clients, not for browsers. The `/api/search`
REST facade is what browsers can reach without a backend proxy. The
Roadmap tab flags the full-MCP-tool integration as still pending backend
work (would let the RAG chat agent invoke WiPhy as a first-class tool
during a conversation, not just show a result list).

### 14.4 Claim Analyzer tab (V2)

The single most useful pedagogical piece added in this cycle. Two backend
files:

- `backend/services/claim_analyzer.py` — `analyze_claim(claim, lang)` uses
  `ask_ai_unified` with a strict JSON-only system prompt. The response
  schema is `{core_scientific[], overreach[], reformulation, epistemic_verdict, key_terms[]}`.
  Trilingual mock (EN/ES/NO) with a realistic example so the tab never
  returns empty.
- `backend/routers/claim_analyzer.py` — `POST /api/claim-analyzer/analyze`,
  Pydantic-validated (`lang ∈ {en,es,no}`, `claim` max 4000 chars).

The system prompt discipline mirrors the module's rule: the analyzer never
says a claim is "true" or "false". It says what has evidence, where the
speaker is extrapolating, and how to phrase it honestly. Overreach types
are drawn from a fixed enum: `unsupported` (no evidence for this specific
part), `category_error` (confuses two categories — e.g. mind & universe),
`conflation` (merges two distinct concepts — e.g. observer as physical
system vs conscious observer), `overgeneralization` (extrapolates a domain
result beyond scope), `philosophical_leap` (valid philosophy dressed as
physics).

Frontend `ClaimAnalyzer.jsx` renders 5 panels in fixed order — verdict badge
+ scientific core + overreach + reformulation + key terms. The key terms
are bridged to the WiPhy Search tab through a shell-level `{query, nonce}`
state. The nonce (not just the query) is what triggers the re-run — this
means clicking the same term twice still fires the search, whereas a plain
query-watching effect would bail out.

### 14.5 Playground tab (V3) — Theory Map + Observer Patch simulator

Grouped in one tab because they're a matched pair: the map shows OPH's
neighbours in idea-space, the simulator shows the mechanism OPH proposes
in action.

**Theory Map** (`playground/TheoryMap.jsx`) — pure SVG, no library. 8 nodes
with OPH centered and 7 satellites positioned by structural affinity
(`holographic` and `celestialHolography` neighbours; `iit` and `gnw`
neighbours since they compete). 9 typed edges rendered with distinct colours
and dash patterns. Clicking a node reads from the same `theoryTour.rows.*`
i18n keys the Theory Tour uses — single source of truth. Update a theory in
the Tour, and the Map picks up the change automatically.

**Observer Patch Simulator** (`playground/ObserverPatchSimulator.jsx`) —
HTML5 Canvas 720×380, `requestAnimationFrame` with `cancelAnimationFrame`
cleanup on unmount and on pause. N patches (3-15 via slider) with
position/velocity/state ∈ [-1, 1] mapped to hue. Per-tick rules:

1. Brownian motion + wall bounces + 0.98 velocity damping
2. Pairwise overlap → symmetric state convergence with strength k
   (0.001-0.05, slider)
3. In overlap zones a translucent ellipse renders the mean-state colour —
   the user reads that as "public reality"

Live consensus metric = `1 - std(states)`, plotted as a violet bar that
grows toward 100% without any global coordinator. This is the pedagogical
punchline: consensus emerges from local overlap alone, which is exactly
OPH's claim about "public reality is the fixed-point of overlap consistency".

Both tools carry a disclaimer: not physics, not consciousness, just
intuition pumps.

### 14.6 Shell wiring changes

`SelfSimRealityAgent.jsx` grew from 7 → 10 tabs. Order matters:

1. Overview
2. Core Concepts
3. OPH Mechanics
4. Theory Tour *(← Celestial Holography + Featured Voice added here)*
5. **WiPhy Search** *(← new)*
6. **Claim Analyzer** *(← new)*
7. **Playground** *(← new)*
8. AI as Observer
9. Substrate Question
10. Roadmap

The three new tabs cluster in the middle — "operational" tools between the
descriptive tabs (1-4) and the philosophical tabs (8-9). Roadmap stays last.

Shell state added:
```
const [wiphyPrefill, setWiphyPrefill] = useState({ query: '', nonce: 0 });
```
`ClaimAnalyzer` receives an `onSearchWiphy(term)` callback that bumps the
nonce and switches to the WiPhy tab. `WiphySearch` reads both props and
uses a nonce-watching effect to auto-run the search.

### 14.7 GPT-5.x temperature fix

Discovered while smoke-testing the Claim Analyzer: `ask_ai_unified` was
routing to `gpt-5.5` with `temperature=0.7`, which OpenAI rejects with
HTTP 400. Every downstream module (Humanizing AI, Japanese/Chinese/Korean
Teacher conversation, Test Humanitas, AGI benefits enrichment, Prompt
Managers) was silently falling back to their mocks because of it.

`backend/llm.py::_normalize_params_for_model` already identified GPT-5 /
o1 / o3 models to rewrite `max_tokens → max_completion_tokens`. Extended
it to also drop `temperature` and `top_p` for those models. Dropping is
cleaner than forcing 1 — if OpenAI eventually loosens the restriction,
this code doesn't need to change.

### 14.8 Reference stats after 1.18.4

- 10 tabs (from 5 in V0, 7 after OPH Mechanics + Substrate Question added
  earlier in the 1.17.x cycle)
- 4 new frontend components (WiphySearch, ClaimAnalyzer, Playground, plus
  playground/{TheoryMap, ObserverPatchSimulator})
- 2 new backend files (claim_analyzer service + router)
- 1 shared backend fix (llm.py temperature normalisation) with cascading
  effect on ~8 other modules
- 3 new panels in the existing TheoryTour (Celestial Holography row +
  Featured Voice + updated Roadmap sources)
- ~60 new i18n keys per locale (Celestial Holography row, Featured Voice
  card, WiPhy Search tab, Claim Analyzer tab, Playground tab) — full parity
  across EN/ES/NO

---

## 15. 1.36.0 — V1 "Dialogue" (the conversational agent)

The plan's V1 (§8, §13) — a back-and-forth chat where **every answer is structured
and tagged by evidence level** — shipped in 1.36.0. It closes the last genuinely
pending roadmap item (the Claim Analyzer and Playground had already landed as V2/V3
in 1.18.4).

### 15.1 What it is

A new **💬 Dialogue** tab (after Theory Tour). You ask about observers, minds,
consciousness, simulation, holography or OPH; the agent answers with a structured,
per-section epistemically-tagged response — never bare prose that could pass
speculation off as fact. It preserves the module's core rule: *never "this is true",
always "this belongs to level X"*, and OPH is always tagged `speculative`.

### 15.2 "RAG" the honest way (RAG-lite)

Rather than clone/scrape the OPH repo at request time (needs infra + network), V1
grounds answers in a **curated knowledge base** baked into the service — 12 source
chunks, each carrying its own epistemic level and citations (OPH observer patch,
self-simulating universe, fixed point, overlap/fact-making pipeline; Rovelli RQM;
holographic & celestial holography; Friston FEP; Tononi IIT; Dehaene GNW; Bostrom;
AI-as-observer). A deterministic **keyword-overlap retriever** selects the most
relevant chunks per turn and injects them as a grounding block. This is the same
"RAG-lite" pattern used elsewhere in the repo (Andrés memory recall, claim_analyzer);
a vector store is the documented upgrade seam for V1.5, not a requirement now.

### 15.3 Response contract

The LLM returns JSON, sanitized before it leaves the backend (off-palette levels are
clamped to `speculative`, all keys backfilled):

```json
{
  "short_answer": "one plain-language paragraph",
  "sections": [
    {"kind": "scientific_grounding|speculative_extension|oph_interpretation",
     "level": "established|mainstream|speculative|philosophy|metaphor",
     "text": "2-4 sentences", "sources": ["…"]}
  ],
  "objections": ["red-team critique", "…"],
  "safer_reformulation": "only when the question contained an over-claim",
  "suggested_next_question": "one good follow-up",
  "sources_consulted": ["…"],
  "is_mock": false
}
```

The system prompt also forces the agent to flag the classic conflation — "observer"
as a physical measuring system (physics) vs "observer" as a conscious mind
(philosophy) — whenever it appears.

### 15.4 Files

- Backend service `backend/services/self_sim_reality_chat.py` — `KNOWLEDGE_BASE`,
  `retrieve()`, `_system_prompt(lang)`, `answer()`, `concepts()`, `health()`;
  trilingual mock keeps the tab alive offline (`is_mock=True`).
- Backend router `backend/routers/self_sim_reality.py` (prefix
  `/api/self-sim-reality`) — `POST /chat`, `GET /concepts`, `GET /health`;
  Pydantic-validated (`lang ∈ {en,es,no}`, message ≤ 4000, optional `history`).
  Registered in `backend/app.py`.
- Frontend `frontend/src/self-sim-reality/Dialogue.jsx` + wired into
  `SelfSimRealityAgent.jsx` as the `dialogue` tab. Direct `fetch` to the API
  (ClaimAnalyzer pattern), per-section `EpistemicBadge`, objections / reformulation /
  sources panels, clickable suggested-next-question, seed examples, discipline banner.
- i18n `selfSimReality.dialogue.*` + `tabs.dialogue` EN/ES/NO (parity 423×3).
- Tests `backend/tests/test_self_sim_reality_chat.py` (6 offline: retrieval
  determinism + grounding fallback, structured+tagged mock, real-JSON sanitize/clamp,
  request validation, concepts endpoint).

### 15.5 Roadmap state after 1.36.0

V0 (reading material), V1 (Dialogue chat), plus the already-shipped V2 Claim Analyzer
and V3 Playground/Theory Map are all live. Genuinely pending: real RAG / vector store
over the OPH repo, and the source-map / compare-theories / red-team / learning-path
endpoints (§8).

---

## 16. 1.37.0 — V2 "real vector store + Source Map"

V1 grounded answers with a keyword-count retriever ("RAG-lite"). V2 replaces that with a
**real vector store** — cosine similarity over vectors — and exposes it as a **Source Map**
tool (plan §8: "topic → list of relevant chunks with epistemic colour").

### 16.1 The vector store (`backend/services/self_sim_reality_vectorstore.py`)

Two pluggable backends over the curated 12-chunk KB, chosen automatically:

- **embeddings** — dense semantic vectors via OpenAI `text-embedding-3-small`, cached per
  KB content-hash (the KB is embedded once). Real semantic recall: a paraphrase with **no
  shared keywords** (e.g. *"is everything around me maybe just a dream?"*) still retrieves
  the fixed-point / self-simulating chunks. Used when an OpenAI key is available.
- **tfidf** — sparse TF-IDF vectors + cosine, pure-Python, **deterministic and offline**. A
  genuine vector store with no external dependency; used as the fallback and by the offline
  test-suite.

`search(query, k, backend="auto"|"embeddings"|"tfidf")` returns ranked chunks (id, title,
level, claim, sources, tags, **score**) plus which backend answered. Any embeddings failure
degrades to TF-IDF; the store never raises.

### 16.2 Where it is used

- **Source Map** (`POST /api/self-sim-reality/source-map`) uses `backend="auto"` → the best
  semantic recall online, deterministic offline. No LLM in the loop, so it is fast, cheap and
  always available. Frontend tab `🗂️ Source Map` renders ranked source cards with an
  `EpistemicBadge`, a relevance bar, citations, and an honest "semantic vs keyword" badge.
- **Dialogue retrieval** now routes grounding through the vector store with `backend="tfidf"`
  (deterministic, no per-turn embedding cost/latency), keeping the OPH-core fallback.

### 16.3 Why not a hosted vector DB?

For a 12-chunk KB an in-process store (dense embeddings + cosine, or TF-IDF) is the right
size — no server, no schema migration, and the offline path stays deterministic for CI. When
the KB grows (real OPH-repo ingestion), the seam to swap in a persistent/ANN index (e.g. a
Mongo vector index or FAISS) is `vectorstore.search()`; nothing else changes.

### 16.4 Files & tests

- Service `self_sim_reality_vectorstore.py`; router adds `POST /source-map` +
  `GET /vectorstore/health`; chat `retrieve()` re-routed through it.
- Frontend `self-sim-reality/SourceMap.jsx` + `sourceMap` tab; i18n `selfSimReality.sourceMap.*`
  EN/ES/NO (parity 440×3).
- Tests `backend/tests/test_self_sim_reality_vectorstore.py` (7 offline, embeddings forced off
  for determinism).

### 16.5 Still pending

`compare-theories` and `red-team` endpoints (§8), a persistent/ANN index if the KB grows, and
real OPH-repo ingestion to widen the corpus.

---

*Last updated: 2026-08-11 (1.37.0 — V2 real vector store + Source Map shipped)*
