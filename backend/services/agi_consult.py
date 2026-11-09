"""
AGI Progress Hub — consult surface (grounded Q&A over the Hub's curated content).
================================================================================
The AGI Progress Hub is a workshop-style educational module (Homo Sapiens vs. AI
in Testing · AGI Progress Tracker · Possible Endings · Benefits · Voices). It had
no question→answer function; this adds one so the Hub can be **consulted** as a
connected skill by Andrés the Robot (and reused elsewhere).

Same honest "RAG-lite" pattern as `enonic_red_cross.py`: answers are grounded in a
CURATED knowledge base mirroring what the Hub already teaches — chiefly the
**Homo-vs-AI Activity Matrix** (10 testing activities × human/AI/hybrid verdicts +
rationale, from `homoVsAi.activities.*`) plus the Hub's framing principles. Each
chunk carries an evidence level; retrieval is keyword overlap; generation goes
through the shared LLM with a trilingual mock fallback (CI-safe).

Discipline: this is an educational companion, not an oracle. Verdicts are
"colour-coded, not dogma"; speculative futures stay speculative; the Hub keeps an
honest counterpoint. Never present a workshop position as settled fact.
"""
import json
import re
from typing import Any, Dict, List, Optional

try:
    from backend.llm import ask_ai_unified
except Exception:  # pragma: no cover
    try:
        from llm import ask_ai_unified  # type: ignore
    except Exception:
        ask_ai_unified = None  # type: ignore


AGI_CONSULT_VERSION = "1.0.0"

_MAX_MESSAGE_CHARS = 4000
_MAX_HISTORY_TURNS = 6
_RETRIEVE_K = 5

_LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "es": "Responde en español.",
    "no": "Svar på norsk.",
}

# Evidence levels for this agent (a workshop/education palette).
_ALLOWED_LEVELS = {
    "workshop-verdict", "principle", "tracker", "scenario", "benefit",
    "guidance", "unsupported",
}

_SRC_MATRIX = "AGI Progress Hub — Homo Sapiens vs. AI Activity Matrix (SOCO workshop)"
_SRC_HUB = "AGI Progress Hub — curated module content"

# Verdict helper so matrix chunks stay consistent with the UI labels.
_VERDICT = {"human": "Human leads", "ai": "AI leads", "hybrid": "Hybrid", "tie": "Tie"}


def _matrix_chunk(cid: str, title: str, verdict: str, confidence: str, rationale: str) -> Dict[str, Any]:
    return {
        "id": f"matrix-{cid}",
        "title": f"{title} — {_VERDICT[verdict]}",
        "level": "workshop-verdict",
        "text": (f"On '{title}', today's edge: {_VERDICT[verdict]} (confidence: {confidence}). "
                 f"{rationale}"),
        "sources": [_SRC_MATRIX],
        "tags": [cid, title.lower(), verdict, "testing", "human", "ai"],
    }


# ─── Curated knowledge base (mirrors the Hub's own content) ─────────────────
KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    # The Homo-vs-AI Activity Matrix (10 canonical testing activities).
    _matrix_chunk("scenarios", "Test scenario generation", "hybrid", "high",
                  "AI is fast at covering breadth and spotting forgotten dimensions (i18n, perf, "
                  "accessibility); humans still win on risk-based prioritisation tied to real stakeholders."),
    _matrix_chunk("risk", "Risk-based prioritisation", "human", "high",
                  "AI lacks political and historical context. 'What will the CFO see first?' is a human call."),
    _matrix_chunk("ambiguity", "Requirement / story ambiguity detection", "ai", "medium",
                  "Modern LLMs are eerily good at spotting vague words ('fast', 'secure', 'done'); a strong "
                  "tester still catches the domain-specific ones the model misses."),
    _matrix_chunk("exploratory", "Exploratory testing", "human", "high",
                  "Curiosity, taste and 'this smells wrong' intuition are still human strengths. AI can seed "
                  "charters but not chase them."),
    _matrix_chunk("followups", "Follow-up questions", "hybrid", "medium",
                  "AI produces a solid baseline instantly; humans win on the ones needing politics, tone or "
                  "deep product memory."),
    _matrix_chunk("automation", "Test automation code", "ai", "high",
                  "AI writes boilerplate (Playwright/Cypress/Selenium) faster than you can type; humans still "
                  "design the architecture and choose what to automate."),
    _matrix_chunk("testData", "Test data generation", "ai", "high",
                  "Near-solved by AI for structured domains; humans stay in the loop for sensitive or "
                  "compliance-critical data."),
    _matrix_chunk("oracle", "The oracle problem", "human", "high",
                  "Deciding what 'correct' even is when the spec is silent is the definitional soul of testing "
                  "(Kaner, Bach). AI guesses plausibly; humans decide what ought to be."),
    _matrix_chunk("triage", "Bug triage & severity", "hybrid", "medium",
                  "AI is solid at classification by symptoms; humans own business weight, VIP customers and "
                  "regulatory blast radius."),
    _matrix_chunk("accessibility", "Accessibility & UX heuristics", "hybrid", "medium",
                  "AI catches the ~80% mechanical violations (contrast, alt text, ARIA); humans catch the ~20% "
                  "that actually hurt real users."),
    # Framing principles (the Hub's stance).
    {
        "id": "principle-not-dogma",
        "title": "Verdicts are colour-coded, not dogma",
        "level": "principle",
        "text": ("The Homo-vs-AI matrix states who has the edge TODAY on each activity, with a confidence "
                 "level — it is an evidence-led snapshot, not a permanent law. The honest answer to 'who "
                 "wins?' is usually 'it depends, and often a human+AI pairing wins'."),
        "sources": [_SRC_HUB],
        "tags": ["dogma", "verdict", "confidence", "pairing", "hybrid", "snapshot"],
    },
    {
        "id": "principle-three-questions",
        "title": "The workshop's three questions",
        "level": "principle",
        "text": ("The 'Homo Sapiens vs. AI in Testing' workshop (SOCO, hosts Ola Kleiven & Keyhan "
                 "Farahaninia) is framed by three questions: when does AI give a real advantage in testing; "
                 "is human judgement, context, critical thinking and curiosity still decisive; and do we have "
                 "a winner — or a new way of working together."),
        "sources": [_SRC_HUB],
        "tags": ["workshop", "questions", "judgement", "curiosity", "soco", "advantage"],
    },
    {
        "id": "principle-pairing",
        "title": "Human + AI pairing beats either alone",
        "level": "principle",
        "text": ("Across the matrix the recurring pattern is complementarity: AI brings speed, breadth and "
                 "tireless coverage; humans bring context, judgement, taste and accountability. The practical "
                 "takeaway is to pair them deliberately per activity, not to crown one winner."),
        "sources": [_SRC_HUB],
        "tags": ["pairing", "complementary", "speed", "judgement", "accountability", "coverage"],
    },
    {
        "id": "tracker-purpose",
        "title": "AGI Progress Tracker — what it is for",
        "level": "tracker",
        "text": ("The Hub's AGI Progress Tracker is for following how AI capability advances over time against "
                 "benchmarks and milestones, scored as neutrally as possible and kept current — a map of "
                 "progress, not a prediction of arrival dates. Treat specific scores as dated observations."),
        "sources": [_SRC_HUB],
        "tags": ["tracker", "progress", "benchmark", "milestone", "capability", "agi"],
    },
    {
        "id": "endings-balanced",
        "title": "Possible endings for AGI — held in balance",
        "level": "scenario",
        "text": ("The Hub presents a spread of possible AGI futures (beneficial, mixed and harmful) as "
                 "SCENARIOS to reason about, not forecasts. No single ending is asserted as what will happen; "
                 "the point is preparedness and clear-eyed trade-offs, with an honest counterpoint kept."),
        "sources": [_SRC_HUB],
        "tags": ["endings", "futures", "scenario", "risk", "safety", "governance"],
    },
    {
        "id": "benefits-grounded",
        "title": "The benefits of AGI — stated with a counterpoint",
        "level": "benefit",
        "text": ("The Hub catalogues concrete potential benefits (science, medicine, productivity, education) "
                 "while keeping an explicit counterpoint so the upside is never presented uncritically. "
                 "Benefits are possibilities to work toward, paired with their risks and preconditions."),
        "sources": [_SRC_HUB],
        "tags": ["benefits", "science", "medicine", "productivity", "education", "counterpoint"],
    },
    {
        "id": "apply-real-site",
        "title": "Applying the human-vs-AI split to a real site",
        "level": "guidance",
        "text": ("The workshop framing is applied to a live production website in the Red Cross Web QA Agent — "
                 "a concrete place to see where AI leads, where humans lead, and where a pairing wins on an "
                 "actual testing effort."),
        "sources": [_SRC_HUB],
        "tags": ["red cross", "qa", "real site", "apply", "production", "pairing"],
    },
]

_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "on", "that",
    "this", "it", "as", "be", "for", "with", "what", "how", "why", "does", "do",
    "can", "we", "you", "i", "if", "not", "but", "by", "at", "from", "about",
    "el", "la", "los", "las", "un", "una", "de", "que", "y", "o", "es", "en",
    "por", "para", "con", "se", "su", "como", "qué", "cómo",
    "og", "et", "som", "på", "av", "til", "hva", "hvordan", "ai", "agi",
}


def _tokens(text: str) -> set:
    return {w for w in re.findall(r"[a-zA-ZÀ-ÿ0-9]+", (text or "").lower())
            if len(w) > 2 and w not in _STOPWORDS}


def retrieve(message: str, k: int = _RETRIEVE_K) -> List[Dict[str, Any]]:
    """Rank KB chunks for grounding. Deterministic; no LLM. Always non-empty."""
    q = _tokens(message)
    scored = []
    for chunk in KNOWLEDGE_BASE:
        hay = _tokens(chunk["text"]) | {t.lower() for t in chunk["tags"]} | _tokens(chunk["title"])
        overlap = len(q & hay)
        tag_hit = sum(1 for t in chunk["tags"] if t.lower() in (message or "").lower())
        score = overlap + 2 * tag_hit
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        # default: the framing principles so an answer is always grounded
        return [c for c in KNOWLEDGE_BASE if c["level"] == "principle"][:k]
    return [c for _, c in scored[:k]]


def _grounding_block(chunks: List[Dict[str, Any]]) -> str:
    lines = ["[GROUNDING SOURCES — curated, each tagged by evidence level]"]
    for c in chunks:
        lines.append(f"- ({c['level']}) {c['title']}: {c['text']} Sources: {', '.join(c['sources'])}")
    return "\n".join(lines)


def _system_prompt(lang: str) -> str:
    return (
        "You are the AGI Progress Hub expert inside Workplace Learning With AI — an educational, "
        "evidence-led companion on AI progress and, especially, the Homo Sapiens vs. AI in Testing "
        "workshop. You help people reason about when AI leads, when humans lead, and when a human+AI "
        "pairing wins.\n\n"
        "EPISTEMIC DISCIPLINE: tag every section with exactly one level from: workshop-verdict | "
        "principle | tracker | scenario | benefit | guidance. Verdicts are a dated, colour-coded "
        "snapshot, NOT dogma — state the confidence and note that a human+AI pairing often wins. "
        "Keep speculative futures speculative and keep an honest counterpoint; never present a "
        "workshop position or a possible future as a settled fact or a forecast.\n\n"
        "Ground your answer in the provided GROUNDING SOURCES; prefer them over free recall and cite "
        "their sources. If the sources don't cover the question, say so and name what is missing.\n\n"
        "Return ONLY valid JSON, no markdown, with this shape:\n"
        "{"
        '"short_answer":"<one plain-language paragraph>",'
        '"sections":[{"kind":"verdict|principle|tracker|scenario|benefit|guidance",'
        '"level":"workshop-verdict|principle|tracker|scenario|benefit|guidance",'
        '"text":"<2-4 sentences>","sources":["<source>"]}],'
        '"evidence_status":"supported|partial|insufficient",'
        '"missing_information":["<what would strengthen the answer>"],'
        '"suggested_next_question":"<one good follow-up>"'
        "}\n\n"
        "Keep each section short; include at least one section; cite sources from the grounding block. "
        f"{_LANG_INSTRUCTIONS.get(lang, _LANG_INSTRUCTIONS['en'])}"
    )


_MOCK = {
    "en": {"short": ("Here is what the AGI Progress Hub's curated workshop content establishes, tagged by "
                     "evidence level — remember the human-vs-AI verdicts are a dated snapshot, not dogma, and "
                     "a human+AI pairing often wins."),
           "missing": "Your specific activity or context (and, for the tracker, the exact benchmark and date).",
           "next": "Which testing activity, or which part of the Hub, would you like to dig into?"},
    "es": {"short": ("Esto es lo que establece el contenido curado del taller del AGI Progress Hub, etiquetado "
                     "por nivel de evidencia — recuerda que los veredictos humano-vs-IA son una foto fechada, "
                     "no dogma, y que a menudo gana la pareja humano+IA."),
           "missing": "Tu actividad o contexto concreto (y, para el tracker, el benchmark y la fecha exactos).",
           "next": "¿Qué actividad de testing, o qué parte del Hub, quieres explorar?"},
    "no": {"short": ("Dette er hva det kuraterte workshop-innholdet i AGI Progress Hub fastslår, merket etter "
                     "evidensnivå — husk at menneske-vs-AI-dommene er et datert øyeblikksbilde, ikke dogme, og "
                     "at et menneske+AI-par ofte vinner."),
           "missing": "Din konkrete aktivitet eller kontekst (og, for traceren, nøyaktig benchmark og dato).",
           "next": "Hvilken testaktivitet, eller hvilken del av Hub-en, vil du grave i?"},
}


def _mock_lang(lang: str) -> str:
    return lang if lang in _MOCK else "en"


def _make_mock(lang: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    m = _MOCK[_mock_lang(lang)]
    sections = [{"kind": "verdict" if c["level"] == "workshop-verdict" else c["level"],
                 "level": c["level"], "text": c["text"], "sources": c["sources"]}
                for c in chunks[:3]]
    if not sections:
        sections = [{"kind": "principle", "level": "principle",
                     "text": KNOWLEDGE_BASE[-7]["text"], "sources": [_SRC_HUB]}]
    return {
        "short_answer": m["short"],
        "sections": sections,
        "evidence_status": "partial",
        "missing_information": [m["missing"]],
        "suggested_next_question": m["next"],
        "sources_consulted": sorted({s for c in chunks for s in c["sources"]}),
        "is_mock": True,
        "version": AGI_CONSULT_VERSION,
    }


def _sanitize(parsed: Dict[str, Any], chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    parsed.setdefault("short_answer", "")
    clean = []
    for s in (parsed.get("sections") or []):
        if not isinstance(s, dict):
            continue
        lvl = s.get("level")
        s["level"] = lvl if lvl in _ALLOWED_LEVELS else "guidance"
        s.setdefault("kind", "principle")
        s.setdefault("text", "")
        s.setdefault("sources", [])
        clean.append(s)
    parsed["sections"] = clean
    es = parsed.get("evidence_status")
    parsed["evidence_status"] = es if es in {"supported", "partial", "insufficient"} else "partial"
    if not isinstance(parsed.get("missing_information"), list):
        parsed["missing_information"] = []
    parsed.setdefault("suggested_next_question", "")
    parsed.setdefault("sources_consulted", sorted({s for c in chunks for s in c["sources"]}))
    return parsed


async def answer(message: str, lang: str = "en",
                 history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """One grounded, evidence-tagged answer about AGI progress / human-vs-AI testing."""
    message = (message or "").strip()
    if not message:
        return {"error": "empty_message"}
    if len(message) > _MAX_MESSAGE_CHARS:
        message = message[:_MAX_MESSAGE_CHARS] + "…"

    chunks = retrieve(message)

    if ask_ai_unified is not None:
        try:
            messages = [{"role": "system", "content": _system_prompt(lang)},
                        {"role": "system", "content": _grounding_block(chunks)}]
            for turn in (history or [])[-_MAX_HISTORY_TURNS:]:
                role = turn.get("role")
                content = (turn.get("content") or "").strip()
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content[:2000]})
            messages.append({"role": "user", "content": message})
            raw = await ask_ai_unified(messages=messages, task_type="analysis",
                                       complexity="high", max_tokens=1500)
            if raw and not raw.startswith("[MOCKED RESPONSE"):
                clean = raw.strip()
                if clean.startswith("```"):
                    parts = clean.split("```")
                    clean = parts[1] if len(parts) > 1 else clean
                    if clean.startswith("json"):
                        clean = clean[4:]
                parsed = json.loads(clean.strip())
                parsed = _sanitize(parsed, chunks)
                parsed["is_mock"] = False
                parsed["version"] = AGI_CONSULT_VERSION
                return parsed
        except Exception:
            pass

    return _make_mock(lang, chunks)


def knowledge() -> List[Dict[str, Any]]:
    return [{"id": c["id"], "title": c["title"], "level": c["level"],
             "text": c["text"], "sources": c["sources"], "tags": c["tags"]}
            for c in KNOWLEDGE_BASE]


def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "agent": "agi_consult",
        "version": AGI_CONSULT_VERSION,
        "kb_chunks": len(KNOWLEDGE_BASE),
        "llm_available": ask_ai_unified is not None,
    }
