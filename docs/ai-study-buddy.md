# AI Study Buddy — how it works

The **AI Study Buddy** (Help → *AI Study Buddy*) is an in-app assistant that
answers questions about **this application** — *Workplace Learning With AI
(WLWAI)* — its modules, its agents, its features and how to use them. It is
grounded in the project's own documentation, so it should not invent features.

## What it knows (its context)

On every question the Buddy builds a context from these sources and sends it to
the language model together with your question:

1. **App overview** — a compact repo map (`docs/llms.txt`): what the app is, its
   services, ports and rules. Always included.
2. **Agent catalogue** — the full list of agents (name + short description) from
   `/api/agents/catalog`. Always included, so it can answer "which agents does
   the app have?".
3. **Relevant help sections** — the most relevant sections of the help docs for
   *your specific question* (see *How it finds information* below).
4. **README excerpt** — the start of the README, added when the **Use README
   context** checkbox is on (on by default).

## How it finds information (retrieval)

The Buddy does a lightweight **keyword search** over a curated set of help
documents — `README.md`, `architecture`, `deployment`, `agents`, `admin-dev`,
`n8n`, `J-messages_Analyzer`, `MCP_TESTING_GUIDE`, `TESTING` — via the
`GET /api/help/search` endpoint. It:

- splits each doc into sections by heading, in your current language (es/no/en);
- ranks sections by keyword overlap with your question, weighting **heading**
  matches highly and capping each section's body score so a long document can't
  win by sheer length;
- normalises accents (`cómo` → `como`) and matches word **stems**
  (`despliega` → finds `despliegue`);
- returns the top few sections plus an **index** of the available docs.

Those sections are injected into the context, so answers can cite real content
(files, commands, steps) from the documentation.

## Controls

- **Use README context** (checkbox) — includes an excerpt of the README. On by
  default. The preview box shows the first lines of the README in your language.
- **Agent** (dropdown) — pick a single agent to get a **focused** answer about
  just that agent. Leave it on *Select an agent…* to ask general questions.

## Layout

The input field sits **above** the answers panel. Your typed question stays in
the field after you send it (it is not cleared), and it is **not** echoed inside
the answers panel — so it is never duplicated. Answers appear in the panel below.

## Tips — good questions

- "Which agents does this app have?"
- "How is the app deployed to the cloud?"
- "How does the architecture / backend work?"
- "How do I configure n8n?"
- "Explain the J-messages Analyzer" (or pick it from the Agent dropdown)

## Limitations

- It answers **only from documented information**. If something isn't written in
  the docs, it will say so rather than invent an answer.
- The keyword search does **not** cross languages: a question in one language may
  not match a document that exists only in another. The localised curated docs
  cover the common cases; full cross-lingual recall would need embeddings, which
  the project avoids to keep dependencies light.
- Full answers require a connected AI model (the Buddy streams via `/llm-stream`).
  Without one, replies are generic placeholders.
