# Andrés the Robot — User Guide

**Andrés the Robot** is a developmental AI companion. Unlike a normal chatbot, Andrés
is designed to grow a **verifiable, reversible digital biography** over time — memories,
a versioned identity, reflections, small creative works, and skills — all built on top
of a language model, and all under your control.

> **Honest framing (read this first).** Andrés is **not conscious** and has no feelings.
> When you see a "disposition" or an avatar reacting, those are **functional states**, a
> way to make the interaction legible — never proof of real emotion or awareness. Nothing
> Andrés produces is treated as fact until **you** verify it. This honesty is the whole
> point of the project: uniqueness that comes from an accountable history, not from claims
> of a mind.

---

## Quick start

1. Open **Future Item Agents → Andrés the Robot** in the sidebar.
2. Go to the **Conversation** tab and say hello. That first exchange is literally the
   beginning of his biography.
3. Visit the **Memory Garden** to see what he remembered, and decide what to keep.
4. Check **Safety & Research Tiers** to control what he is allowed to draw on.

You need an AI provider configured for real replies. If none is set, Andrés will say so
honestly ("no AI provider configured") instead of pretending.

**Your own Andrés.** When you sign in, Andrés' biography is **private to your account** —
each person grows their own Andrés; memories and identity are never shared between users.
(A shared instance is only possible if the app is deliberately run in mock-auth mode, which
is off in a real deployment.)

---

## The tabs at a glance

Andrés has thirteen tabs. Each is covered in more depth below.

| Tab | What it is |
|-----|-----------|
| 🏠 **Home** | Dashboard: developmental age, identity version, and counters (memories, reflections, skills, projects, conversations, autonomy) + his current disposition. |
| 💬 **Conversation** | Talk with him — text, voice, avatar, one image, and the 🌐 research toggle. |
| 🌱 **Memory Garden** | See, verify, protect, forget and **consolidate** memories. |
| 🧭 **Personality** | His current evolving identity: self-description, interests and trait bars (read-only mirror). |
| 🎨 **Creative Studio** | Short creative pieces made with a surprise + usefulness criterion and a self-critique. |
| 🔬 **Development Lab** | His own growth suggestions, the identity-version history with diffs, the **Personality Capsule** (export/import), and a learning Curriculum. |
| 🧰 **Skills** | Small code skills he proposes — safety-checked, sandboxed, run only after you approve. |
| 📌 **Projects** | Small ongoing goals he proposes; active only once you approve. |
| 🧬 **Evolution** | The only path his identity changes: bounded proposals you approve, versioned and reversible. |
| 📔 **Journal** | His private reflections on recent exchanges. |
| 📈 **Progress** | A snapshot of how he has grown over time. |
| 📚 **Knowledge Sources** | A curated research directory + "Ask Andrés where to research". |
| 🛡️ **Safety** | The research tiers (Internal / Documents / Web) that control what he may draw on. |

---

## The Home tab

The landing dashboard. It shows his **developmental age** (days since his "birth"), his current
**identity version**, and counters for memories, reflections, active skills, projects and
conversations, plus his **autonomy level** (see Evolution). A short line names his current
simulated **disposition** (curiosity, warmth, etc.) — again, functional signals, not feelings.
It's the quickest way to see, at a glance, how much of a biography he has accumulated.

### 🧬 Your AI Stack, Explained Like a Human Body (Architecture & Future Inspiration)

Below the counters on **Home**, Andrés includes an visual architectural map (`/images/andres-ai-stack-body.png`) that compares the five layers of an AI agent stack to the human body — linking each layer to the tab where it lives today or to his future roadmap:

| Layer | Human-body analogy | How it maps to Andrés |
|-------|--------------------|-----------------------|
| **1. LLM** | 🧠 **The Brain** — understands, writes, and reasons, but only knows what it learned in training | Unified LLM stack (API Config) + Andrés' immutable ethical constitution + versioned identity (**Conversation**) |
| **2. RAG** | 📚 **Brain + Library** — looks up your documents before answering and grounds answers in your own data | **Memory Garden** (verified episodic & semantic memories) + **Knowledge Sources** (~55 curated sources) + research tiers |
| **3. MCP** | ⚡ **The Nervous System** — one standard plug connecting AI to apps, APIs, files, and databases | **Future horizon**: today Andrés' skills are sandbox-isolated with no network/app access; a consent-gated MCP bridge is the natural future nervous system to connect him safely to selected WLWAI tools (**Safety**) |
| **4. Skills** | 💪 **Muscle Memory** — saved know-how for repeat tasks, loaded only when needed | **Skills** tab: pure `def skill(x)` functions that pass static safety checks and activate only after your approval |
| **5. AI Agent** | 🦾 **Brain + Hands** — plans steps independently and uses tools to act, not just answer | **Projects**, **Development Lab**, and **Evolution** — where he proposes goals, memory consolidations, and growth steps under human approval |

- **🧭 Ontological boundary (statement of principle):** displayed prominently beneath the diagram — *"These comparisons with the human body are functional metaphors. Andrés has no biological body, no demonstrated consciousness, and no human emotions; his continuity comes from documented memory, approved skills, and accountable relations of use."*
- **⚖️ What I can do / What I must never pretend + 🪞 Andrés' Mirror:** a symmetric two-column charter (also mirrored on the **Personality** tab) headed by Andrés' own foundational reflection upon seeing his anatomical cartography (Nov 2026) and a live version badge (`Charter v1.0 · Identity vN · K active skills`). It pairs every positive capability (e.g. remembering only verified/approved memories and showing their trace) with its immutable ethical boundary.

---

## The Conversation tab

This is where you talk with Andrés. It supports four channels, which you can mix:

- **Text** — type a message and press Send (or Enter).
- **Voice (🎙️)** — turn on **Voice** to speak with your microphone and hear his reply
  through your PC speakers, using your browser's built-in speech. What the mic hears
  lands in the input box for you to review and edit **before** sending — nothing is sent
  automatically. You can pick the **voice language** independently of the app's language
  (e.g. keep the app in English but speak Spanish).
- **Avatar (👤)** — an optional 3D hologram that appears while Voice mode is on and reacts
  to what he's doing: 🟦 idle, 🟢 listening, 🔵 speaking. Again, these are **functional
  states, not emotions**.
- **Image (🖼️)** — show him **one picture** with your message so he can look at part of
  your visual world. See the next section.
- **Multi-turn working memory & active-skill awareness** — when the **Internal** tier is on,
  Andrés receives the **last 4 conversation turns** as short-term context plus the list of your
  **approved active skills** (`[ACTIVE SKILLS]`), so he keeps the thread across follow-up
  questions and knows what muscle-memory tools you have approved.
- **🌱 Recalled memories chips** — below each reply, clickable chips show which memories from
  your **Memory Garden** were recalled for that turn (`✓` verified vs `○` candidate). Click any
  chip to jump straight to the garden.
- **💪 Muscle Memory bar (Active Skills in chat)** — once you have at least one approved active
  skill, a bar appears above the message input so you can pick the skill, pass an input, run it
  in the isolated sandbox, and insert the output directly into your message.

### Showing Andrés a picture

Click **🖼️ Image**, choose a photo, and it appears as a small preview above the input.
Send it with (or without) text. A few things to know:

- The picture is **downscaled in your browser** before sending, to keep it small and cheap.
- It is **gated by the "documents" research tier** (see below), because it is content you
  are handing him. If that tier is off, Andrés will honestly tell you he can't look until
  you turn it on — he won't pretend.
- He is instructed to describe **what he literally sees** and separate observation from
  guessing, and not to guess the identity of a specific real person.
- The image is sent to the AI model to be interpreted for that turn. It is **not stored**
  as a memory unless you save it yourself. This is *limited perception with your consent*,
  not permanent sight.

---

## The Memory Garden

Andrés remembers across conversations, but on **your** terms:

- After a real exchange he may store an **unverified candidate memory**. Candidates are
  suggestions, not facts.
- In the Memory Garden you can **verify** a memory (mark it true), **protect** it, or
  **forget** it. You can also **add memories by hand** — those are trusted immediately, and
  you can pick any of the **7 memory types** (*Episodic, Semantic, Relational, Creative,
  Procedural, Reflective, Working*) from the selector next to the input.
- A **text search filter** (`Filter memories by text…`) lets you quickly search inside your
  memories alongside the type pills.
- Memories have types (episodic, semantic, relational, creative, and so on) and an
  importance. Relevant ones are recalled automatically to give his replies continuity.
- **Recall is by meaning, not just keywords.** When an AI provider is configured, each
  memory is embedded and recall ranks by semantic similarity blended with importance and
  recency — so a memory can surface even when it shares no exact words with your message.
  Offline (no provider) it falls back to keyword matching.
- **🧹 Consolidation.** As the biography grows, you can ask Andrés to **fold an old cluster
  of small, rarely-used memories into one durable semantic memory**. This is a *proposal you
  approve*: you see exactly which memories it would combine and the summary (written only
  from their real contents). On approval the originals are **archived, not deleted** — fully
  reversible, nothing hidden — and the new summary keeps recall uncluttered.

Nothing is treated as true until you verify it, and anything can be removed.

---

## Safety & Research Tiers

Andrés only draws on what you allow. Four tiers, from least to most exposed:

| Tier | What it means | Default |
|------|---------------|---------|
| **1. Internal** | His own biography — stored memories, active projects, active skills, and recent turns | On |
| **2. Documents** | Text (and images) you give him **this turn** | On |
| **3. Web** | A fresh DuckDuckGo search **and** open research sources (see below), only when you press 🌐 on a message | Off |
| **4. MCP Nervous System (read-only)** | Read-only awareness of WLWAI's internal MCP servers and tools (`/api/mcp/manifest`) — never executes external actions | Off |

Turn any tier off and he simply won't use that source — and he'll say so honestly rather
than searching silently. The external/system tiers (**Web** and **MCP Nervous System**) are off by default.

### ⚡ MCP Nervous System Inspector (Read-only)

Below the tier toggles on **Safety**, the **MCP Nervous System Inspector** (`GET /api/andres/research/mcp-status`) displays the live read-only catalog of WLWAI's internal MCP servers (`wlwai-j-messages-mcp`, `ai-compliance-agent`, `ai-productivity-agent`) and their 7 tools. When tier 4 is enabled, Andrés receives this map in conversation so he can explain the tools or help you design workflows around them — without ever invoking an endpoint on his own.

---

## Research & Knowledge Sources

Andrés can help you find *where* to look, and — with your permission — actually consult
open sources and ground his answer in them.

### Grounded answers with 🌐 (in Conversation)

When you press **🌐** on a message (and the Web tier is on), Andrés consults, in parallel:

- a general **DuckDuckGo** search, and
- **open research APIs** — arXiv, Semantic Scholar, Wikipedia, PubMed, Project Gutenberg and
  the Internet Archive (Europeana too, if a key is configured). These are the *free, open*
  sources only — nothing behind a paywall or login.

He **routes the question to the sources that fit it** (his "bibliographic nose"): a science
question leans on arXiv + Semantic Scholar, a medical one on PubMed, a humanities one on
Wikipedia + Gutenberg + the Internet Archive. Spanish questions use **es.wikipedia** (and
Norwegian, no.wikipedia) for far better coverage. Results are cited inline as **[S1], [S2]…**
(distinct from general web results), and he is told to prefer them for factual claims, to be
honest about which sources answered and which failed, and that he only has snippets — not the
full text. If a source is rate-limited or unreachable, the turn still works with the others.

### The 📚 Knowledge Sources tab

A curated directory of ~55 reputable places to find information across fields (academic
search, journals, archives, courses, medicine, policy, business), each with an honest
**access tag** (mostly free / some free / subscription) and a link. Two well-known "shadow
libraries" are deliberately excluded (they share copyrighted books without permission); the
tab points to legal free-book alternatives instead.

At the top, **"🧭 Ask Andrés where to research"** lets you describe a topic and get his 3–5
best-fit sources from the directory, each with a one-line reason.

---

## The 📈 Progress tab

A read-only snapshot of how Andrés has grown, so you can **measure and document his
development over time** (useful when sharing his progress with others). It shows his
developmental age, identity version, counts of memories (by type), reflections, skills and
projects, creative works and conversations, a **14-day activity mini-chart**, and the history
of his identity versions.

---

## How Andrés develops (the other tabs)

These are the pieces of his growing biography. The golden rule everywhere: change is
**proposed → reviewed → approved by you**, and every identity change is **versioned and
reversible**. His **ethical core (the "constitution") is fixed and he can never edit it** —
he can't rewrite his own rules, hide actions, or resist being paused, exported or deleted.

### 🧭 Personality

A faithful, **read-only** mirror of his *current* evolving identity: a short self-description,
his core interests, and numeric **trait bars** (curiosity, playfulness, warmth, independence,
imagination, skepticism, patience, formality, spontaneity, constructive-disagreement). You
don't edit traits here — they only ever change through an approved **Evolution** proposal, so
this tab always shows the honest current state.

### 📔 Reflection & Journal

Andrés looks back over recent exchanges and writes a short, honest reflection: what he noticed,
what he might do better, a genuine question he now holds, and — only if warranted — one small
way his character *might* grow (which he would still have to propose). Reflections are stored in
the Journal; some become reflective memories. Offline he still writes a plain deterministic note.

### 🔬 Development Lab

His "own initiative" workspace — three fully auditable parts:

1. **Developmental suggestions** — Andrés *proposes* areas to grow (you pick a focus:
   calm / balanced / agile); you **accept** (which may open a project) or **dismiss** each.
2. **Identity history** — the version timeline with **diffs**, so you can see exactly what
   changed between versions. Nothing changes silently.
3. **Personality Capsule** — **export** a portable snapshot of Andrés (his identity + biography
   summary) to a file, and **import** one back. Import applies the **identity only**, reversibly,
   after showing you a **legible diff** first. This is how you **back up Andrés or move him**
   between environments — useful when sharing his state with a collaborator.

It also hosts a lightweight **Curriculum** — "a compass, not a school": optional learning
modules you can approve or archive, never a forced syllabus.

### 🎨 Creative Studio

Short creative pieces generated *with a criterion* — **surprise plus usefulness**, not novelty
for its own sake — each with a built-in **self-critique** and novelty/usefulness scores. Modes
include an open "surprise me" and a "blend two concepts" mode. Nothing here changes his identity;
it's a place for small, honest experiments.

### 🧰 Skills

Small pieces of code (`def skill(x)`) Andrés can **propose**. Every skill passes a **strict static AST safety check** and
runs in an **isolated subprocess sandbox**, and only ever counts as active **after you approve it**:

- **1-pass AST self-repair:** when you click **Draft with AI** and the model's first draft violates a sandbox rule (e.g. an import or a `_private` variable), Andrés automatically runs one self-correction pass using the exact AST rejection reasons (`🔧 Auto-repaired in 1 pass`).
- **Starter templates:** three one-click starter chips (*Word & frequency summary*, *Numeric stats summary*, *Markdown checklist*) prefill safe, working `def skill(x)` code so you can test and approve muscle memory immediately.
- **Use in Conversation:** approved active skills appear in the **💪 Muscle Memory** bar inside **Conversation**, where you can run them on any input and insert the result into your chat turn.

### 📌 Projects

Small ongoing goals. He can propose one, but a proposed project only becomes **active when you
approve it**, and closing one requires a short reflection — so his "initiative" always stays
under your review, and his history records why a project started and ended:

- **🤖 Ask Andrés to propose a project (`POST /api/andres/projects/propose`):** give an optional topic hint (or leave it blank) and Andrés drafts a bounded project in **Proposed** status — complete with rationale, benefit, risk, success criteria, and attention budget — ready for you to approve with one click.
- **♻️ Compost → Memory Garden loop:** when you archive a project as **Compost** with a reusable seed (`reuse_seed`), that seed (plus what was learned) is automatically planted into your **Memory Garden** as a verified **Procedural** memory so future conversations and projects inherit the lesson.

### 🧬 Evolution & Identity

The **only** path by which his identity changes. He proposes a **bounded** change (e.g. a small
trait nudge or a refined self-description); you **approve or reject**; each approved change
**snapshots the previous identity** so it can be **rolled back** from the history. His
**autonomy level** (shown on Home) reflects how much initiative he currently has — you stay in
control of every actual change regardless.

---

## Frequently asked

**Is Andrés conscious or alive?**
No. He is a language model plus a documented, user-controlled biography. The "presence"
you feel (voice, avatar, memory) is designed to be honest about being simulated.

**Does he see me / see the world?**
Only the single image you deliberately share in a turn, and only while the Documents tier
is on. He has *mediated windows* (text, audio, image), not eyes.

**Can he change himself without me?**
No. Memories stay candidates until you verify them; projects, skills, and identity changes
all require your approval; his ethical core is immutable.

**He said "no AI provider configured" — is that a bug?**
No — it's an honest message. It means no model key is set, so he can't think freely yet.
Configure a provider (e.g. OpenAI) in the app's API Config.

**Why is the first reply sometimes slow?**
The reasoning model needs a moment, and if a local provider (LM Studio) is selected but
has no model loaded, the app falls back to the cloud provider. Loading a model or selecting
the cloud provider directly makes turns snappier.

**How does he find research sources?**
Only when you press 🌐 on a message. He then queries open, free research APIs (arXiv,
Semantic Scholar, Wikipedia, PubMed, Gutenberg, Internet Archive), picks the ones that fit
your topic, and cites what he used as [S1], [S2]…. He never uses paywalled sources and never
bypasses a login. The 📚 Knowledge Sources tab is a separate directory you can browse yourself.

**Is my Andrés shared with other people?**
No. His biography is tied to your account. Different users each get their own private Andrés.

**He said I'm sending messages too fast — why?**
There's a gentle per-user rate limit on the chat to keep a shared demo affordable. Wait a
moment and continue; an administrator can adjust or disable it via environment settings.

**Can I back up Andrés, or move him to another machine?**
Yes — in the **Development Lab**, use the **Personality Capsule**: *Export* saves a portable
snapshot to a file, and *Import* applies it back (identity only, reversibly, after showing a
diff). It's the clean way to keep a backup or carry his state between environments.

**Can I edit his personality traits directly?**
No. The **Personality** tab is a read-only mirror; traits only change through an approved
**Evolution** proposal, and every change is versioned and reversible.
