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
  **forget** it. You can also **add memories by hand** — those are trusted immediately.
- Memories have types (episodic, semantic, relational, creative, and so on) and an
  importance. Relevant ones are recalled automatically to give his replies continuity.

Nothing is treated as true until you verify it, and anything can be removed.

---

## Safety & Research Tiers

Andrés only draws on what you allow. Three tiers, from least to most exposed:

| Tier | What it means | Default |
|------|---------------|---------|
| **Internal** | His own biography — stored memories and active projects | On |
| **Documents** | Text (and images) you give him **this turn** | On |
| **Web** | A fresh DuckDuckGo search, only when you press 🌐 on a message | Off |

Turn any tier off and he simply won't use that source — and he'll say so honestly rather
than searching silently. The most exposed tier (Web) is off by default.

---

## How Andrés develops (the other tabs)

These are the pieces of his growing biography. All change is **proposed → reviewed →
approved by you**, and every identity change is **versioned and reversible**.

- **Reflection & Journal** — he reviews recent exchanges and notes what he could do
  better, sometimes forming a reflective memory.
- **Curiosity** — open questions he "wonders" about; you can let him explore or dismiss them.
- **Projects** — small ongoing goals. He can propose one, but proposed projects only
  become active when **you** approve them, and closing one requires a short reflection.
- **Creativity** — short creative pieces generated *with a criterion* (surprise **plus**
  usefulness) and a built-in self-critique, so it isn't just novelty for its own sake.
- **Skills** — small pieces of code he can propose. Every skill passes a strict safety
  check and runs in an isolated sandbox, and only runs after you approve it. Unsafe code
  is blocked and can never be approved.
- **Evolution & Identity** — the only path his identity changes. He proposes a bounded
  change (e.g. a small trait nudge), you approve or reject, and each approved change
  snapshots the previous identity so it can be rolled back. His **ethical core is fixed
  and can never be edited by him**.

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
