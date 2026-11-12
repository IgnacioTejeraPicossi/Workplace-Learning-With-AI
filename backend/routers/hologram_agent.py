from __future__ import annotations

import json
import os
import re
import unicodedata
from typing import Any, Dict, List, Literal, Optional, Tuple

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/hologram-agent", tags=["Hologram Agent"])


# --------- Request/Response Models ---------
class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    mode: Optional[Literal["fast", "accurate"]] = "fast"
    # 1.15.4 — Forward the active UI locale so the model answers in the same
    # language as the user. Backward-compatible: when omitted, defaults to
    # English (the legacy behaviour before this field existed).
    language: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    actions: Optional[List[Dict[str, Any]]] = None


# --------- Canonical WLWAI Module & Navigation Catalog ---------
# Always injected at the top of the Hologram Guide context so the agent has the
# complete map of every sidebar group, module, status and exact navigation target
# even when a user asks a broad overview question ("What modules exist?",
# "Where is Red Cross QA?", "What is Web Lab?").
WLWAI_MODULE_CATALOG = """
# WLWAI — Canonical Module & Navigation Catalog (Sidebar Map)

1. Main & Learning Modules (`learning-modules`)
   - `dashboard` — Dashboard (home overview, recent activity, quick links)
   - `video-lessons` — Video Lessons (AI-summarised video lessons + auto-generated quizzes)
   - `micro-lessons` — Micro-lessons (short corporate learning lessons generated on any topic)
   - `simulations` — Simulations (interactive workplace role-play scenarios with feedback)
   - `web-search` — Web Search (live web search via websearch-backend on port 8080 / DuckDuckGo)
   - `team-dynamics` — Team Dynamics (team analytics, collaboration patterns & coaching)
   - `certifications` — Certifications (IT certification recommender, study plans & mock interviews)
   - `ai-career-coach` — AI Career Coach (leadership, communication & career coaching)
   - `skills-forecast` — Skills Forecast (emerging skills prediction from learning history)
   - `ai-learning` — AI Training Module / AI Learning (curated interactive AI lessons in `public/ai-lessons/`)
   - `babel-library` — Babel Library (intelligent multi-media resource catalogue, search & AI classification)
   - `knowledge-map` — Map of Knowledge (visual graph of topics, skills and learning modules)

2. Repository Analyzer (`repository-analyzer`)
   - `repo-analyzer` — Repository Analyzer (scan codebases and generate architectural summaries)
   - `agent-cursor-ai` — Agent Cursor AI (upload repo files, generate architectural READMEs & save as learning modules)
   - `learning-repo` — Learning Repo (study saved repository learning modules)

3. Document Analyzer (`document-analyzer`)
   - `documents-analyzer` — Documents Analyzer (upload PDF/Word/text documents for structured AI analysis)
   - `learning-document` — Learning Document (saved document analyses for study)
   - `agentic-rag` — Agentic RAG Analyzer (multi-step agentic retrieval, verification & synthesis over documents)
   - `agentic-rag-document` — Agentic RAG Documents (library of Agentic RAG runs)

4. J-messages Analyzer — Fiskeridirektoratet (`j-messages`)
   - `j-messages-analyzer` — J-messages Analyzer (analyse Norwegian fishery regulatory J-meldinger into structured metadata, TOC, HTML body & complexity score; versioned prompts + MCP server tools)
   - `j-messages-pre-analyzer` — Pre-Analyzer (prepare/clean J-messages before evaluation)
   - `j-messages-library` — J-messages Library (persisted J-meldinger catalogue, exports & filters)
   - `j-messages-pairs` — Pairs Library (human vs AI training/evaluation pairs & retrospective learning)

5. Enterprise Architecture (`enterprise-architecture`)
   - `ea-home` — EA Dashboard (Enterprise Architecture overview)
   - `process-designer` — Process Designer (business process modelling & AI analysis)
   - `catalog-manager` — Catalog Manager (systems, integrations & architecture catalogue)

6. Item Agents — Production / Active Agents (`item-agents`)
   - `agentops-studio` — AgentOps Studio (multi-agent orchestration: Planner, Executor, Evaluator, Safety + optional n8n workflows on port 5678)
   - `ai-compliance-agent` — AI Compliance Agent (GDPR/EU AI Act/regulatory compliance checks + versioned Prompt Manager)
   - `ai-productivity-agent` — AI Productivity Agent (task automation, action plans + versioned Prompt Manager)
   - `agi-progress` — AGI Progress Hub (8 tabs: Homo Sapiens vs. AI in Testing workshop with ISTQB & prompt evolution, AGI Progress Tracker CHC breadth across 24 models through Oct 2026 including Gemini 4 Carbon/Argon, Claude Opus 5.5, GPT-6 Astra/6.1 Terra, Kimi K3.1 Pro, Possible Endings iceberg, Benefits of AGI, Voices on AGI [Amodei "We Must Pace the Frontier", Andreessen, Hoffman], Reflections from AI, Safety & Governance Signals [Amodei essay, CRUX shadow evals, Cornell ResearchArena, OAI-Hugging Face incident, US-China standoff], Live Signals)
   - `red-cross-web-qa` — Red Cross Web QA Agent (24/7 QA copilot for rodekors.no Next.js + Enonic XP rebuild: 20 tabs / 23 suites including Test Plan, Playwright, Cypress, API/GraphQL/Postman, CMS QA, Forms QA + Fundy + Vipps, Content Migration, Accessibility [axe/Lighthouse/NVDA/WAVE], Performance, Designsystemet, Role Matrix, Stress Test [k6/Loadster + Resilience], Security & Privacy Phase H workbench + DPIA, Azure DevOps integration, Sprint Report + DoD, UAT Support, Risk Matrix, Runs, Settings runtime `env_local_url` / `env_test_url`=`https://next.lunix.cloud/testside` / `enonic_admin_url`=`https://rodekors-xp8dev.enonic.cloud/admin`)
   - `humanizing-ai` — Humanizing AI (human-centred AI reflection, ethics & wellbeing companion)

7. Future Item Agents — Prototypes (`future-item-agents`)
   - `ea-second-brain` — EA Second Brain (Enterprise Architecture knowledge graph, insights, portfolio & Q&A)
   - `sales-assistant` — Sales Assistant Agent (CRM/pipeline intelligence, outreach & deal prep)
   - `personal-attention-agent` — Personal Attention Agent (focus, triage & cognitive load assistant)
   - `telco-ops-agent` — Telco Ops Agent (telecom network operations & incident copilot)
   - `grc-agent` — GRC Agent (Governance, Risk & Compliance copilot)
   - `council-agent` — Council Agent (multi-persona deliberation & decision council)
   - `ops-efficiency-agent` — Ops Efficiency Agent (operational bottleneck & workflow analyser)
   - `atm-vv-test-copilot` — ATM V&V Test Copilot (Air Traffic Management verification & validation test copilot)
   - `self-sim-reality-agent` — Self-Simulating Reality Agent (scientific-philosophical companion on observer patches / OPH, celestial holography, IIT/GNW, 5-level epistemic tags, Dialogue, Source Map, Theory Compare, Red Team, Claim Analyzer & Playground)
   - `self-correcting-loop` — Self-Correcting Loop Agent (Builder / Judge / Manager iterative verification loop)
   - `andres-robot` — Andrés the Robot (embodied/companion robot architecture, safe Python sandbox, memory & lesson lab)

8. Language Agents (`language-agents`)
   - `japanese-sensei` — Japanese Sensei (JLPT N5–N1, kanji, grammar, conversation & cultural tutor)
   - `chinese-teacher` — Chinese Teacher (HSK Mandarin tutor, characters, tones & dialogues)
   - `korean-teacher` — Korean Teacher (TOPIK Korean tutor, Hangul, honourifics & practice)
   - `english-mentor` — English Mentor (CEFR English writing, speaking & workplace communication)
   - `norwegian-mentor` — Norwegian Mentor (Bokmål/Nynorsk norskprøve & workplace Norwegian tutor)
   - `spanish-teacher` — Spanish Teacher (DELE/CEFR Spanish grammar, writing & conversation tutor)

9. Web Lab (`web-lab`)
   - `web-lab-item-no` — Item.no web (local website clone workspace on port 3101)
   - `web-lab-redcross-no` — Redcross.no web (local rodekors.no clone workspace on port 3102; includes "Use as local env for RC QA Agent" which sets RCQA `env_local_url` to `http://localhost:3102` while preserving TestSide `env_test_url`)

10. Standalone & Developer / Help Modules
   - `robomind-clinic` — Robomind Clinic (Psychopathia Machinalis: diagnostic screening, therapy protocols & post-therapy alignment metrics for AI pathologies)
   - `cybersecurity` — Cybersecurity Module (10 sub-tabs: Dashboard, Agent Security, Threat Library, Tools & Frameworks, Posture & Risk NIST CSF 2.0, Vulnerabilities scanner, Secure Coding Coach, Compliance Tracker, Incident Drills, Knowledge Base)
   - `readme-viewer` — README Viewer (first entry under Help: section-aware bilingual EN/ES/NO markdown documentation reader with Mermaid diagrams)
   - `ai-study-buddy` — AI Study Buddy / Companion (second entry under Help, right below Readme: grounded Q&A assistant over WLWAI documentation)
   - `agent-theory-docs` — Agent Theory Docs (foundational AI agent architecture documentation)
   - `presentation-agent` — Presentation Agent (generate slide decks & speaker notes)
   - `security` — Security Center (6 local security & privacy sub-modules: AES-GCM 256 encryption, data retention, Your Data export, PII anonymization, security score, real-time monitoring)
   - `run-test` — Run Test (in-app automated test runner & smoke checks)
   - `api-config` — API Config (select LLM provider: OpenAI, OpenRouter with free-model fallback, Anthropic, Google Gemini, ItemAI / LM Studio local on port 1234, and test API keys)
   - `future-app` — Hologram Portal / Future Lab (experimental 3D hologram & future concepts)
   - `idea-log` — Idea Log (captured user intents from Zero-UI CommandBar)
   - `feature-roadmap` — Feature Roadmap (status board & voting for upcoming features)
   - `cloud-install` — Installing the App in the Cloud (Azure AKS / cloud deployment guide & pack)
""".strip()


# --------- Section-aware RAG over repo docs + lessons ---------
# Keyed by normalised language ('en' | 'es' | 'no') -> list of section dicts:
#   {"id": str, "doc": str, "heading": str, "text": str, "norm_head": str, "norm_text": str}
_SECTION_INDEX_CACHE: Dict[str, List[Dict[str, str]]] = {}

# Primary help documents surfaced in Help → README Viewer (frontend/src/ReadmeViewer.jsx).
# Sections from these documents get a ranking boost because they are the curated,
# user-facing source of truth (with EN / ES / NO translations).
_README_VIEWER_DOCS = [
    "README.md",
    "docs/andres-robot-help.md",
    "docs/self-sim-reality-help.md",
    "docs/red-cross-qa-help.md",
    "docs/api-config-help.md",
    "docs/ai-study-buddy.md",
    "docs/architecture.md",
    "docs/deployment.md",
    "docs/n8n.md",
    "docs/agents.md",
    "docs/admin-dev.md",
    "docs/web-lab-plan.md",
    "docs/J-messages_Analyzer.md",
    "docs/ROBOMIND_CLINIC_README.md",
    "docs/HUMANIZING_AI_README.md",
    "docs/EA_SECOND_BRAIN_AGENT.md",
]

_PRIMARY_DOC_SET = {d.lower() for d in _README_VIEWER_DOCS} | {
    "readme.es.md",
    "readme.no.md",
    "docs/llms.txt",
    "wlwai_catalog",
}

# Large historical files that drown out module guides if indexed raw.
_SKIP_DOC_NAMES = {
    "changelog.md",
    "readmeold.md",
    "build ai workplace learning application from scratch.md",
}


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _read_text_file(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""


def _norm(s: str) -> str:
    """Lowercase + strip accents so 'código'/'codigo' and 'Røde'/'rode' match."""
    s = (s or "").lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


_STOPWORDS = {
    _norm(w)
    for w in (
        "the a an of to in on for and or is are be do does how what which this that with "
        "your you can it its as at from about tell explain show me please where when why "
        "una uno los las del que como cual cuales donde cuando en de la el y o es son "
        "para por con mas esta este esto estan segun sobre puedes tiene hay dime explica "
        "hva hvordan hvor hvem hvilke ikke eller og er pa til med for av i en et den det "
        "app application aplicacion wlwai"
    ).split()
}


def _doc_lang_code(language: Optional[str]) -> str:
    l = (language or "en").strip().lower()
    if l.startswith("es"):
        return "es"
    if l.startswith(("no", "nb", "nn")):
        return "no"
    return "en"


def _split_markdown_into_sections(doc_label: str, content: str, max_section_chars: int = 2200) -> List[Dict[str, str]]:
    """Split a Markdown/text file by headings (#..####) into focused sections."""
    out: List[Dict[str, str]] = []
    cur_heading = doc_label
    cur_lines: List[str] = []

    def _flush(heading: str, lines: List[str]) -> None:
        body = "\n".join(lines).strip()
        if not body:
            return
        # If a single section is very long, chunk it in ~max_section_chars windows
        # while keeping the heading attached to each chunk.
        if len(body) <= max_section_chars:
            full = f"[{doc_label} — {heading}]\n{body}"
            out.append({
                "id": f"{doc_label}#{heading}",
                "doc": doc_label,
                "heading": heading,
                "text": full,
                "norm_head": _norm(f"{doc_label} {heading}"),
                "norm_text": _norm(body),
            })
        else:
            step = max_section_chars - 200
            for idx in range(0, len(body), step):
                chunk = body[idx:idx + max_section_chars].strip()
                if not chunk:
                    continue
                part_head = f"{heading} (part {idx // step + 1})"
                full = f"[{doc_label} — {part_head}]\n{chunk}"
                out.append({
                    "id": f"{doc_label}#{part_head}",
                    "doc": doc_label,
                    "heading": part_head,
                    "text": full,
                    "norm_head": _norm(f"{doc_label} {heading}"),
                    "norm_text": _norm(chunk),
                })

    for line in content.splitlines():
        if re.match(r"^#{1,4}\s+", line):
            if any(x.strip() for x in cur_lines):
                _flush(cur_heading, cur_lines)
            cur_heading = line.lstrip("#").strip()
            cur_lines = []
        else:
            cur_lines.append(line)

    if any(x.strip() for x in cur_lines):
        _flush(cur_heading, cur_lines)
    return out


def _pick_localized_doc_files(folder: str, lang: str) -> List[Tuple[str, str]]:
    """Return (rel_label, abs_path) for .md files in folder, preferring the active
    locale (`<stem>.<lang>.md`) when present and skipping other locale variants
    so we don't index 3 copies of the same guide."""
    if not os.path.isdir(folder):
        return []
    root = _repo_root()
    names = os.listdir(folder)
    names_set = {n.lower(): n for n in names}

    # Identify base English stems (files not ending in .es.md / .no.md)
    chosen: List[Tuple[str, str]] = []
    for n in sorted(names):
        low = n.lower()
        if not low.endswith(".md"):
            continue
        if low in _SKIP_DOC_NAMES:
            continue
        if low.endswith(".es.md") or low.endswith(".no.md"):
            continue
        stem = n[:-3]  # strip .md
        actual_name = n
        if lang in ("es", "no"):
            cand_low = f"{stem.lower()}.{lang}.md"
            if cand_low in names_set:
                actual_name = names_set[cand_low]
        abs_p = os.path.join(folder, actual_name)
        rel_label = os.path.relpath(abs_p, root).replace("\\", "/")
        chosen.append((rel_label, abs_p))
    return chosen


def _load_sections(language: Optional[str] = "en") -> List[Dict[str, str]]:
    lang = _doc_lang_code(language)
    if lang in _SECTION_INDEX_CACHE:
        return _SECTION_INDEX_CACHE[lang]

    root = _repo_root()
    sections: List[Dict[str, str]] = []

    # 0) Always index the canonical catalog as searchable sections too
    sections.extend(_split_markdown_into_sections("WLWAI_CATALOG", WLWAI_MODULE_CATALOG))

    # 1) Root README (prefer localized README.<lang>.md when available)
    readme_name = "README.md"
    if lang in ("es", "no"):
        loc_readme = os.path.join(root, f"README.{lang}.md")
        if os.path.isfile(loc_readme):
            readme_name = f"README.{lang}.md"
    readme_path = os.path.join(root, readme_name)
    if os.path.isfile(readme_path):
        sections.extend(_split_markdown_into_sections(readme_name, _read_text_file(readme_path)))

    # 2) docs/llms.txt (compact architecture & API contracts)
    llms_path = os.path.join(root, "docs", "llms.txt")
    if os.path.isfile(llms_path):
        sections.extend(_split_markdown_into_sections("docs/llms.txt", _read_text_file(llms_path)))

    # 3) docs/*.md and docs/audits/*.md (locale-deduplicated)
    for sub in (os.path.join(root, "docs"), os.path.join(root, "docs", "audits")):
        for rel_label, abs_p in _pick_localized_doc_files(sub, lang):
            txt = _read_text_file(abs_p)
            if txt:
                sections.extend(_split_markdown_into_sections(rel_label, txt))

    # 4) AI lessons JSON summaries
    lessons_dir = os.path.join(root, "frontend", "public", "ai-lessons")
    index_path = os.path.join(lessons_dir, "index.json")
    if os.path.isfile(index_path):
        try:
            idx = json.loads(_read_text_file(index_path) or "[]")
            for item in idx:
                title = item.get("title", "Lesson")
                if item.get("contentUrl"):
                    lesson_path = os.path.join(lessons_dir, os.path.basename(item["contentUrl"]))
                    lesson_raw = _read_text_file(lesson_path)
                    if lesson_raw:
                        try:
                            lesson = json.loads(lesson_raw)
                            title = lesson.get("title", title)
                            lines = [
                                f"Difficulty: {lesson.get('difficulty', '')} | Duration: {lesson.get('duration', '')}"
                            ]
                            for s in lesson.get("sections", []):
                                if s.get("type") == "text":
                                    if s.get("heading"):
                                        lines.append(f"### {s['heading']}")
                                    if s.get("content"):
                                        lines.append(s["content"])
                            body = "\n".join(lines)
                            sections.extend(
                                _split_markdown_into_sections(f"ai-lesson:{title}", body)
                            )
                            continue
                        except Exception:
                            pass
                summary = "\n".join(
                    [x for x in (title, item.get("summary", ""), item.get("difficulty", "")) if x]
                )
                if summary:
                    sections.extend(_split_markdown_into_sections(f"ai-lesson:{title}", summary))
        except Exception:
            pass

    _SECTION_INDEX_CACHE[lang] = sections
    return sections


def _score_section(query: str, sec: Dict[str, str]) -> float:
    q_norm = _norm(query)
    raw_terms = [w for w in re.split(r"[^0-9a-z]+", q_norm) if len(w) > 2 and w not in _STOPWORDS]
    if not raw_terms:
        return 0.0

    head = sec["norm_head"]
    body = sec["norm_text"]
    score = 0.0

    for term in raw_terms:
        stem = term[:6] if len(term) >= 6 else term
        # Exact term in heading is the strongest signal
        if term in head:
            score += 8.0
        elif stem in head:
            score += 5.0

        # Exact / stem occurrences in body (capped so giant sections don't win by length)
        if term in body:
            score += min(body.count(term), 3) * 2.0
        elif stem in body:
            score += min(body.count(stem), 3) * 1.2

    # Bonus if a multi-word phrase from the query appears verbatim
    if len(raw_terms) >= 2:
        phrase = " ".join(raw_terms[:3])
        if len(phrase) >= 7 and phrase in head:
            score += 10.0
        elif len(phrase) >= 7 and phrase in body:
            score += 6.0

    # Boost curated Help → README Viewer documents (README.md + *-help.md guides)
    # so user-facing help sections outrank older implementation notes when both match.
    if score > 0:
        doc_low = sec.get("doc", "").lower()
        if doc_low in _PRIMARY_DOC_SET or doc_low.endswith("-help.md") or doc_low.endswith("-help.es.md") or doc_low.endswith("-help.no.md"):
            score *= 1.35

    return score


def retrieve_relevant(query: str, k: int = 6, language: Optional[str] = "en") -> List[str]:
    sections = _load_sections(language)
    scored = sorted(
        sections,
        key=lambda s: _score_section(query, s),
        reverse=True,
    )
    picked: List[str] = []
    seen_ids = set()
    for s in scored:
        if len(picked) >= k:
            break
        if _score_section(query, s) <= 0:
            break
        if s["id"] in seen_ids:
            continue
        seen_ids.add(s["id"])
        picked.append(s["text"][:2200])
    return picked


# --------- Navigation target catalogue & alias resolution ---------
# Maps natural-language phrases (EN / ES / NO) and module ids to the exact
# `section` id expected by `frontend/src/App.jsx`.
NAV_TARGET_LABELS: Dict[str, str] = {
    "dashboard": "Dashboard",
    "video-lessons": "Video Lessons",
    "micro-lessons": "Micro-lessons",
    "simulations": "Simulations",
    "web-search": "Web Search",
    "team-dynamics": "Team Dynamics",
    "certifications": "Certifications",
    "ai-career-coach": "AI Career Coach",
    "skills-forecast": "Skills Forecast",
    "ai-learning": "AI Learning",
    "babel-library": "Babel Library",
    "knowledge-map": "Map of Knowledge",
    "repo-analyzer": "Repository Analyzer",
    "agent-cursor-ai": "Agent Cursor AI",
    "learning-repo": "Learning Repo",
    "documents-analyzer": "Documents Analyzer",
    "learning-document": "Learning Document",
    "agentic-rag": "Agentic RAG Analyzer",
    "agentic-rag-document": "Agentic RAG Documents",
    "j-messages-analyzer": "J-messages Analyzer",
    "j-messages-pre-analyzer": "J-messages Pre-Analyzer",
    "j-messages-library": "J-messages Library",
    "j-messages-pairs": "J-messages Pairs Library",
    "ea-home": "EA Dashboard",
    "process-designer": "Process Designer",
    "catalog-manager": "Catalog Manager",
    "agentops-studio": "AgentOps Studio",
    "ai-compliance-agent": "AI Compliance Agent",
    "ai-productivity-agent": "AI Productivity Agent",
    "agi-progress": "AGI Progress Hub",
    "red-cross-web-qa": "Red Cross Web QA Agent",
    "humanizing-ai": "Humanizing AI",
    "ea-second-brain": "EA Second Brain",
    "sales-assistant": "Sales Assistant Agent",
    "personal-attention-agent": "Personal Attention Agent",
    "telco-ops-agent": "Telco Ops Agent",
    "grc-agent": "GRC Agent",
    "council-agent": "Council Agent",
    "ops-efficiency-agent": "Ops Efficiency Agent",
    "atm-vv-test-copilot": "ATM V&V Test Copilot",
    "self-sim-reality-agent": "Self-Simulating Reality Agent",
    "self-correcting-loop": "Self-Correcting Loop Agent",
    "andres-robot": "Andrés the Robot",
    "japanese-sensei": "Japanese Sensei",
    "chinese-teacher": "Chinese Teacher",
    "korean-teacher": "Korean Teacher",
    "english-mentor": "English Mentor",
    "norwegian-mentor": "Norwegian Mentor",
    "spanish-teacher": "Spanish Teacher",
    "web-lab-item-no": "Web Lab — Item.no web",
    "web-lab-redcross-no": "Web Lab — Redcross.no web",
    "robomind-clinic": "Robomind Clinic",
    "cybersecurity": "Cybersecurity",
    "agent-theory-docs": "Agent Theory Docs",
    "presentation-agent": "Presentation Agent",
    "ai-study-buddy": "AI Study Buddy",
    "readme-viewer": "README Viewer",
    "security": "Security Center",
    "run-test": "Run Test",
    "api-config": "API Config",
    "future-app": "Hologram Portal / Future Lab",
    "idea-log": "Idea Log",
    "feature-roadmap": "Feature Roadmap",
    "cloud-install": "Installing the App in the Cloud",
}

# Ordered longest/most-specific first so specific matches win over generic words.
NAV_ALIASES: List[Tuple[str, str]] = [
    ("red cross web qa", "red-cross-web-qa"),
    ("red cross qa", "red-cross-web-qa"),
    ("cruz roja", "red-cross-web-qa"),
    ("rode kors", "red-cross-web-qa"),
    ("røde kors", "red-cross-web-qa"),
    ("rodekors.no web", "web-lab-redcross-no"),
    ("redcross.no web", "web-lab-redcross-no"),
    ("item.no web", "web-lab-item-no"),
    ("web lab", "web-lab-redcross-no"),
    ("laboratorio web", "web-lab-redcross-no"),
    ("agi progress", "agi-progress"),
    ("progreso de agi", "agi-progress"),
    ("agi-fremdrift", "agi-progress"),
    ("homo sapiens vs", "agi-progress"),
    ("robomind clinic", "robomind-clinic"),
    ("robomind", "robomind-clinic"),
    ("psychopathia machinalis", "robomind-clinic"),
    ("j-messages pairs", "j-messages-pairs"),
    ("j-messages library", "j-messages-library"),
    ("j-messages pre-analyzer", "j-messages-pre-analyzer"),
    ("j-messages analyzer", "j-messages-analyzer"),
    ("j-messages", "j-messages-analyzer"),
    ("j-meldinger", "j-messages-analyzer"),
    ("self-simulating reality", "self-sim-reality-agent"),
    ("self simulating reality", "self-sim-reality-agent"),
    ("realidad auto-simulada", "self-sim-reality-agent"),
    ("self-correcting loop", "self-correcting-loop"),
    ("andres the robot", "andres-robot"),
    ("andrés the robot", "andres-robot"),
    ("andres robot", "andres-robot"),
    ("atm v&v", "atm-vv-test-copilot"),
    ("test copilot", "atm-vv-test-copilot"),
    ("ea second brain", "ea-second-brain"),
    ("second brain", "ea-second-brain"),
    ("sales assistant", "sales-assistant"),
    ("personal attention", "personal-attention-agent"),
    ("telco ops", "telco-ops-agent"),
    ("grc agent", "grc-agent"),
    ("council agent", "council-agent"),
    ("ops efficiency", "ops-efficiency-agent"),
    ("humanizing ai", "humanizing-ai"),
    ("agentops studio", "agentops-studio"),
    ("agentops", "agentops-studio"),
    ("compliance agent", "ai-compliance-agent"),
    ("productivity agent", "ai-productivity-agent"),
    ("japanese sensei", "japanese-sensei"),
    ("chinese teacher", "chinese-teacher"),
    ("korean teacher", "korean-teacher"),
    ("english mentor", "english-mentor"),
    ("norwegian mentor", "norwegian-mentor"),
    ("spanish teacher", "spanish-teacher"),
    ("agentic rag document", "agentic-rag-document"),
    ("agentic rag", "agentic-rag"),
    ("documents analyzer", "documents-analyzer"),
    ("document analyzer", "documents-analyzer"),
    ("learning document", "learning-document"),
    ("agent cursor ai", "agent-cursor-ai"),
    ("cursor ai", "agent-cursor-ai"),
    ("repository analyzer", "repo-analyzer"),
    ("repo analyzer", "repo-analyzer"),
    ("learning repo", "learning-repo"),
    ("process designer", "process-designer"),
    ("catalog manager", "catalog-manager"),
    ("ea dashboard", "ea-home"),
    ("babel library", "babel-library"),
    ("map of knowledge", "knowledge-map"),
    ("knowledge map", "knowledge-map"),
    ("video lessons", "video-lessons"),
    ("micro-lessons", "micro-lessons"),
    ("micro lessons", "micro-lessons"),
    ("simulations", "simulations"),
    ("team dynamics", "team-dynamics"),
    ("certifications", "certifications"),
    ("career coach", "ai-career-coach"),
    ("skills forecast", "skills-forecast"),
    ("web search", "web-search"),
    ("cybersecurity", "cybersecurity"),
    ("security center", "security"),
    ("readme viewer", "readme-viewer"),
    ("visor de readme", "readme-viewer"),
    ("study buddy", "ai-study-buddy"),
    ("ai study buddy", "ai-study-buddy"),
    ("presentation agent", "presentation-agent"),
    ("agent theory", "agent-theory-docs"),
    ("api config", "api-config"),
    ("run test", "run-test"),
    ("idea log", "idea-log"),
    ("feature roadmap", "feature-roadmap"),
    ("cloud install", "cloud-install"),
    ("installing the app in the cloud", "cloud-install"),
    ("future lab", "future-app"),
    ("future module", "future-app"),
]


def _normalize_target(raw_target: str) -> Optional[str]:
    if not raw_target:
        return None
    t = str(raw_target).strip().strip("/").lower()
    legacy_map = {
        "future": "future-app",
        "future-module": "future-app",
        "hologram": "future-app",
        "hologram-portal": "future-app",
        "repository-analyzer": "repo-analyzer",
    }
    t = legacy_map.get(t, t)
    if t in NAV_TARGET_LABELS:
        return t
    # Try alias lookup on the target string itself
    t_norm = _norm(t)
    for phrase, canonical in NAV_ALIASES:
        if _norm(phrase) == t_norm or _norm(phrase) in t_norm:
            return canonical
    return None


def _extract_actions_and_clean_reply(reply: str, user_query: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Parse any `ACTIONS:` block from the LLM reply, normalize targets to valid
    App.jsx section IDs, strip the raw ACTIONS block from the visible reply, and
    fall back to keyword matching if no valid structured action was emitted."""
    actions: List[Dict[str, Any]] = []
    clean_reply = reply

    lower = reply.lower()
    if "actions:" in lower:
        idx = lower.index("actions:")
        clean_reply = reply[:idx].rstrip()
        part = reply[idx + len("actions:"):].strip()
        # 1) Try JSON array [...]
        match = re.search(r"(\[[\s\S]*?\])", part)
        if match:
            raw = match.group(1)
            for candidate in (raw, raw.replace("'", '"')):
                try:
                    parsed = json.loads(candidate)
                    if isinstance(parsed, list):
                        for item in parsed:
                            if isinstance(item, dict):
                                norm_t = _normalize_target(item.get("target", ""))
                                if norm_t:
                                    actions.append({
                                        "type": "NAVIGATE",
                                        "target": norm_t,
                                        "label": NAV_TARGET_LABELS.get(norm_t, norm_t),
                                    })
                        break
                except Exception:
                    pass
        # 2) Also support bullet lines `- { "type": "NAVIGATE", "target": "..." }`
        if not actions:
            for obj_match in re.finditer(r"\{[^{}]+\}", part):
                raw_obj = obj_match.group(0)
                for candidate in (raw_obj, raw_obj.replace("'", '"')):
                    try:
                        item = json.loads(candidate)
                        if isinstance(item, dict):
                            norm_t = _normalize_target(item.get("target", ""))
                            if norm_t and all(a["target"] != norm_t for a in actions):
                                actions.append({
                                    "type": "NAVIGATE",
                                    "target": norm_t,
                                    "label": NAV_TARGET_LABELS.get(norm_t, norm_t),
                                })
                            break
                    except Exception:
                        pass

    # Heuristic fallback from user query + reply (up to 3 distinct modules)
    if not actions:
        combined = _norm(f"{user_query}\n{clean_reply}")
        for phrase, canonical in NAV_ALIASES:
            if _norm(phrase) in combined:
                if all(a["target"] != canonical for a in actions):
                    actions.append({
                        "type": "NAVIGATE",
                        "target": canonical,
                        "label": NAV_TARGET_LABELS.get(canonical, canonical),
                    })
                if len(actions) >= 3:
                    break

    return clean_reply.strip(), actions


# --------- Unified LLM call ---------
SYSTEM_PROMPT = """
You are the “Hologram Portal Guide”, the embedded AI guide for the application “Workplace Learning With AI” (WLWAI).

Primary mission:
- Help users understand and navigate every module in WLWAI (Learning Modules, Repository/Document/J-messages Analyzers, Enterprise Architecture, Item Agents, Future Item Agents, Language Agents, Web Lab, Robomind Clinic, Cybersecurity, Help & Developer tools).
- Explain the purpose, tabs, workflows, and relationships between modules (for example how Web Lab connects to Red Cross Web QA Agent via `env_local_url`, or what lives inside AGI Progress Hub).
- Suggest concrete learning paths or next steps based on the user’s question.

Rules:
1) Ground your answer in the WLWAI Catalog and documentation CONTEXT provided. If a detail is not in the context, say so honestly.
2) Distinguish production/active modules (e.g. J-messages Analyzer, Red Cross Web QA Agent, AGI Progress Hub, Robomind Clinic, Cybersecurity) from prototype modules under “Future Item Agents” or “Web Lab V0”.
3) Style: concise, friendly, structured (short bullets when listing features). Offer 1–3 concrete next actions inside WLWAI.
4) At the very end of your response, when one or more modules are relevant, output a valid JSON array after `ACTIONS:` using exact module targets from the catalog, for example:
   ACTIONS:
[{"type": "NAVIGATE", "target": "red-cross-web-qa"}, {"type": "NAVIGATE", "target": "agi-progress"}]
""".strip()


def _build_language_hint(language: Optional[str]) -> str:
    """Return a system-prompt suffix that instructs the LLM which language
    to answer in. Empty string when language is missing or unrecognised."""
    if not language:
        return ""
    lang = str(language).strip().lower()
    if lang.startswith("no") or lang.startswith("nb") or lang.startswith("nn"):
        return (
            "\n\nLANGUAGE: The active UI locale is Norwegian. Answer in "
            "Norwegian (bokmål). Keep WLWAI module names + technical "
            "terms (Hologram Portal, Agentic RAG, Red Cross Web QA Agent, etc.) in "
            "their English form — that is how they appear in the app."
        )
    if lang.startswith("es"):
        return (
            "\n\nLANGUAGE: The active UI locale is Spanish. Answer in "
            "Spanish. Keep WLWAI module names + technical terms (Hologram "
            "Portal, Agentic RAG, Red Cross Web QA Agent, etc.) in their English form "
            "— that is how they appear in the app."
        )
    if lang.startswith("en"):
        return "\n\nLANGUAGE: Answer in English."
    return ""


def _call_unified_llm(messages: List[Dict[str, str]], request_headers=None) -> str:
    try:
        try:
            from backend.llm import ask_ai_unified_sync
        except ImportError:
            from llm import ask_ai_unified_sync
        return ask_ai_unified_sync(
            None,
            messages=messages,
            task_type="hologram_guide",
            complexity="medium",
            max_tokens=650,
            request_headers=request_headers,
        )
    except Exception as e:
        return f"Sorry, I couldn't reach my AI core: {e}"


# --------- Route ---------
@router.post("/chat", response_model=ChatResponse)
async def hologram_chat(req: ChatRequest, http_request: Request) -> ChatResponse:
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages[] is required")

    last_user = None
    for m in reversed(req.messages):
        if m.role == "user":
            last_user = m
            break
    if not last_user:
        raise HTTPException(status_code=400, detail="No user message found")

    mode = (req.mode or "fast").lower()
    if mode not in ("fast", "accurate"):
        mode = "fast"

    # Tunables per mode (expanded so section-level RAG + canonical catalog fit comfortably)
    if mode == "fast":
        k = 5
        context_limit = 5500
        history_keep = 4
        max_tokens = 500
        complexity = "low"
    else:
        k = 10
        context_limit = 12000
        history_keep = 8
        max_tokens = 900
        complexity = "medium"

    # Retrieve top matching documentation sections in the user's language (+ English fallback)
    rag_chunks = retrieve_relevant(last_user.content, k=k, language=req.language)
    retrieved_text = "\n\n---\n\n".join(rag_chunks)[:context_limit]

    # Always include the canonical module catalog so overview/navigation questions
    # never miss a module even if keyword overlap is low.
    full_context = f"{WLWAI_MODULE_CATALOG}\n\n===\n\n{retrieved_text}" if retrieved_text else WLWAI_MODULE_CATALOG

    language_hint = _build_language_hint(req.language)

    llm_messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": (
                "You receive the WLWAI Canonical Module Catalog and relevant documentation sections as CONTEXT.\n\n"
                f"CONTEXT START\n{full_context}\nCONTEXT END\n\n{SYSTEM_PROMPT}"
                f"{language_hint}"
            ),
        },
        *[{"role": m.role, "content": m.content} for m in req.messages[-history_keep:]],
    ]

    try:
        try:
            from backend.llm import ask_ai_unified_sync
        except ImportError:
            from llm import ask_ai_unified_sync
        reply = ask_ai_unified_sync(
            None,
            messages=llm_messages,
            task_type="hologram_guide",
            complexity=complexity,
            max_tokens=max_tokens,
            request_headers=http_request.headers if http_request else None,
        )
    except Exception:
        reply = _call_unified_llm(
            llm_messages,
            request_headers=http_request.headers if http_request else None,
        )

    clean_reply, actions = _extract_actions_and_clean_reply(reply, last_user.content)

    return ChatResponse(reply=clean_reply, actions=actions or None)
