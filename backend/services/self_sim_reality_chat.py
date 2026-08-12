"""
Self-Simulating Reality Agent — Conversational endpoint (V1)
============================================================
The epistemically-disciplined chat the plan (§8, §13) always meant to ship. A
user asks about observers, minds, consciousness, simulation, holography or OPH,
and every answer comes back STRUCTURED and TAGGED by evidence level — never as
bare prose that could pass speculation off as fact.

"RAG" here is deliberately lightweight and honest: instead of cloning/scraping
the OPH repo at request time (needs infra + network), we ground answers in a
CURATED knowledge base of source chunks — each carrying its own epistemic level
and citations — retrieved by keyword overlap and injected into the prompt. Same
"RAG-lite" pattern the rest of the repo uses (Andrés memory recall,
claim_analyzer). When a vector store is added later this is the seam to upgrade.

Design rule (non-negotiable, from the plan): the agent NEVER says "this is
true". It says "this belongs to evidence level X". Every section of every answer
carries one of: established | mainstream | speculative | philosophy | metaphor.

Never raises. On LLM failure returns a trilingual mock with is_mock=True so the
tab keeps working offline.
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


SELF_SIM_CHAT_VERSION = "1.0.0"

_MAX_MESSAGE_CHARS = 4000
_MAX_HISTORY_TURNS = 6          # cap conversational context we forward to the LLM
_RETRIEVE_K = 4                 # grounding chunks injected per turn

_LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "es": "Responde en español.",
    "no": "Svar på norsk.",
}

# ─── Curated knowledge base (the "RAG-lite" grounding) ──────────────────────
# Each chunk: a claim the agent may ground on, its epistemic level, its sources,
# and searchable tags. Kept small and honest — these mirror the module's own
# curated tabs (OPH concepts + Theory Tour), so the chat stays consistent with
# what the reading material already teaches. Add chunks here to widen coverage.

KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "oph-observer-patch",
        "title": "Observer Patch (OPH core)",
        "level": "speculative",
        "text": ("Observer Patch Holography frames an observer as a bounded region of "
                 "reality with a state space and a self-reading capability. Public physics "
                 "is proposed to emerge as the fixed point of overlap consistency between "
                 "patches. This is a structured speculative programme, not consensus physics."),
        "sources": ["github.com/FloatingPragma/observer-patch-holography"],
        "tags": ["observer", "patch", "oph", "state space", "self-reading", "holography", "fixed point"],
    },
    {
        "id": "oph-self-simulating",
        "title": "Self-Simulating Universe",
        "level": "speculative",
        "text": ("OPH frames the universe as a recursive self-reference: a structure that "
                 "simulates itself through the observers it contains. 'Simulation' here is "
                 "self-consistency, not a computer running the world."),
        "sources": ["x.com/muellerberndt (OPH presentation)"],
        "tags": ["self-simulating", "simulation", "recursion", "self-reference", "universe"],
    },
    {
        "id": "oph-fixed-point",
        "title": "Reality as a fixed point",
        "level": "speculative",
        "text": ("OPH's resolution to the strange-loop capacity problem: reality is not "
                 "re-run, it IS a fixed-point structure (f(x)=x), and experience is the "
                 "traversal of that pre-existing structure. Subjective time is a projection "
                 "inside an observer, not a property of the substrate."),
        "sources": ["oph-book.floatingpragma.io"],
        "tags": ["fixed point", "strange loop", "time", "substrate", "traversal", "experience"],
    },
    {
        "id": "oph-overlap-consensus",
        "title": "Overlap synchronization / Fact-Making Pipeline",
        "level": "speculative",
        "text": ("OPH's mechanism for how subjective patches generate objective physics: "
                 "overlapping patches compare descriptions and repair disagreements where "
                 "they meet. A public fact emerges by local consensus (local pattern → "
                 "compare → repair → public fact), not by any global authority."),
        "sources": ["github.com/FloatingPragma/observer-patch-holography"],
        "tags": ["overlap", "consensus", "public fact", "objectivity", "agreement", "pipeline"],
    },
    {
        "id": "bostrom-simulation",
        "title": "Simulation argument (Bostrom, 2003)",
        "level": "philosophy",
        "text": ("Bostrom's trilemma argues at least one is true: civilisations go extinct "
                 "before running ancestor simulations; they choose not to; or we almost "
                 "certainly live in one. It is a philosophical probability argument, not an "
                 "empirical result — untestable in its current form."),
        "sources": ["Bostrom (2003), 'Are You Living in a Computer Simulation?'"],
        "tags": ["simulation", "bostrom", "trilemma", "philosophy", "ancestor simulation"],
    },
    {
        "id": "rovelli-rqm",
        "title": "Relational Quantum Mechanics (Rovelli)",
        "level": "mainstream",
        "text": ("RQM holds that quantum states are relative to the physical system doing "
                 "the observing — 'observer' means any physical system, NOT a conscious mind. "
                 "It is a serious interpretation of QM, mathematically formulated, not fully "
                 "settled. A common conflation is to read 'observer' here as 'consciousness'."),
        "sources": ["Rovelli (1996), Relational Quantum Mechanics"],
        "tags": ["relational", "quantum", "rovelli", "observer", "measurement", "interpretation"],
    },
    {
        "id": "holographic-principle",
        "title": "Holographic principle ('t Hooft, Susskind)",
        "level": "mainstream",
        "text": ("The holographic principle proposes that the information in a volume of "
                 "space can be encoded on its boundary, motivated by black-hole entropy "
                 "scaling with area. Active mainstream physics (realised concretely in "
                 "AdS/CFT), though not a final theory of our universe."),
        "sources": ["'t Hooft (1993); Susskind (1995); Maldacena AdS/CFT (1997)"],
        "tags": ["holographic", "boundary", "black hole", "entropy", "ads/cft", "encoding"],
    },
    {
        "id": "celestial-holography",
        "title": "Celestial holography (Pasterski, Strominger)",
        "level": "mainstream",
        "text": ("An active peer-reviewed programme proposing a duality between the 4D "
                 "gravitational S-matrix and a 2D CFT on the celestial sphere; soft theorems "
                 "become Ward identities of asymptotic symmetries. The closest mainstream "
                 "analogue of OPH's 'boundary encodes bulk' shape — but strictly physics, no "
                 "observers or consciousness."),
        "sources": ["arxiv.org/abs/2111.11392 (review)"],
        "tags": ["celestial", "holography", "pasterski", "soft theorems", "s-matrix", "asymptotic"],
    },
    {
        "id": "friston-fep",
        "title": "Predictive processing / Free-energy principle (Friston)",
        "level": "established",
        "text": ("The brain is understood to build and update generative models that predict "
                 "sensory input, minimising prediction error (free energy). Broadly supported "
                 "in neuroscience. It says the brain constructs a MODEL of the world — not "
                 "that the mind constructs the world itself."),
        "sources": ["Friston (2010), 'The free-energy principle'"],
        "tags": ["predictive", "free energy", "friston", "brain", "perception", "model"],
    },
    {
        "id": "iit-tononi",
        "title": "Integrated Information Theory (Tononi)",
        "level": "mainstream",
        "text": ("IIT proposes that consciousness corresponds to integrated information (Φ) "
                 "in a system. A serious, mathematically formulated theory of consciousness "
                 "that is actively debated and not settled; it is one candidate, not "
                 "established fact."),
        "sources": ["Tononi et al., IIT 4.0 (2023)"],
        "tags": ["iit", "consciousness", "tononi", "integrated information", "phi"],
    },
    {
        "id": "gnw-dehaene",
        "title": "Global Neuronal Workspace (Dehaene)",
        "level": "mainstream",
        "text": ("GNW proposes that conscious access happens when information is broadcast "
                 "widely across a fronto-parietal 'workspace'. A leading, empirically engaged "
                 "theory of consciousness — mainstream but not final."),
        "sources": ["Dehaene & Changeux (2011)"],
        "tags": ["gnw", "workspace", "dehaene", "consciousness", "broadcast", "access"],
    },
    {
        "id": "ai-as-observer",
        "title": "AI as observer patch (module's speculative extension)",
        "level": "philosophy",
        "text": ("Whether an AI can be an OPH observer patch is open: structurally it has a "
                 "bounded context + activation state + self-referential outputs, but "
                 "phenomenologically (is anything experienced?) is unknown. A stateless model "
                 "has no flow and so no subjective time; a persistent agentic loop is a "
                 "different case. This is philosophy/speculation, not a consciousness claim."),
        "sources": ["Self-Simulating Reality Agent — AI-as-Observer tab"],
        "tags": ["ai", "observer", "consciousness", "subjective time", "agent", "echo test"],
    },
    # ── Curated OPH concept expansion (paraphrased commentary, source-credited).
    # OPH-specific readings are always tagged `speculative`; the underlying physics
    # they lean on is tagged `mainstream`. Attribution points at the OPH book
    # chapters (CC BY-NC-SA) without reproducing their text. Added 2026-08-11.
    {
        "id": "oph-consistency",
        "title": "The consistency principle (OPH)",
        "level": "speculative",
        "text": ("OPH's starting move: reality is what survives global consistency between "
                 "many overlapping local descriptions. There is no master copy — a fact is "
                 "'real' when no patch can consistently disagree with it. Speculative framing "
                 "of physics as a consistency-satisfaction problem."),
        "sources": ["OPH book — Ch.1 Consistency (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["consistency", "overlap", "oph", "constraint satisfaction", "public fact"],
    },
    {
        "id": "oph-entropy-area",
        "title": "Entropy and the area law (OPH reading)",
        "level": "speculative",
        "text": ("OPH leans on the physics result that a region's information capacity scales "
                 "with its boundary area, not its volume, and reads it as each patch carrying "
                 "a bounded, boundary-encoded state. The area-law/holographic-entropy result "
                 "itself is mainstream; OPH's observer-patch interpretation is speculative."),
        "sources": ["OPH book — Ch.4 Entropy (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["entropy", "area law", "capacity", "boundary", "bekenstein", "oph"],
    },
    {
        "id": "oph-error-correction",
        "title": "Reality as an error-correcting code (OPH)",
        "level": "speculative",
        "text": ("OPH frames robust public facts as protected 'logical' information in a "
                 "quantum error-correcting code: local noise on individual patches is "
                 "corrected by redundancy across overlaps. The AdS/CFT-as-a-code idea in "
                 "physics is mainstream; OPH's use of it as the mechanism of objectivity is "
                 "speculative."),
        "sources": ["OPH book — Ch.10 Error Correction (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["error correction", "qec", "redundancy", "robustness", "oph", "logical"],
    },
    {
        "id": "oph-entanglement",
        "title": "Entanglement as shared overlap (OPH)",
        "level": "speculative",
        "text": ("OPH reads entanglement between systems as structure shared where their "
                 "patches overlap — correlations are the overlap being consistent, not a "
                 "signal passing between distant points. A speculative reinterpretation of "
                 "standard entanglement, not a new empirical claim."),
        "sources": ["OPH book — Ch.9 Entanglement (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["entanglement", "overlap", "correlation", "nonlocality", "oph"],
    },
    {
        "id": "oph-maxent",
        "title": "Maximum-entropy inference as the engine (OPH)",
        "level": "speculative",
        "text": ("OPH uses a least-assumption / maximum-entropy principle to fix what a patch "
                 "should read given its constraints: assume no more than the overlaps force. "
                 "Max-entropy inference is an established tool in statistics and physics; OPH's "
                 "use of it as the rule that generates public physics is speculative."),
        "sources": ["OPH book — Ch.11 MaxEnt (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["maximum entropy", "inference", "least assumption", "jaynes", "oph"],
    },
    {
        "id": "oph-standard-model",
        "title": "Deriving particle structure from a finite port symmetry (OPH)",
        "level": "speculative",
        "text": ("One of OPH's most ambitious and least-supported moves: it tries to recover "
                 "Standard-Model-like structure from a finite icosahedral (A5) symmetry of a "
                 "twelve-port carrier. This is a highly speculative derivation programme, far "
                 "from experimental confirmation — read it as a research bet, not a result."),
        "sources": ["OPH book — Ch.14 Standard Model (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["standard model", "a5", "icosahedral", "symmetry", "particles", "oph"],
    },
    {
        "id": "oph-relativity",
        "title": "Recovering spacetime and relativity from patch flow (OPH)",
        "level": "speculative",
        "text": ("OPH aims to recover smooth spacetime and relativistic structure as an "
                 "emergent, coarse-grained description of how patch states flow and agree, "
                 "rather than as a fundamental backdrop. Emergent-spacetime programmes exist "
                 "in mainstream physics; OPH's observer-patch version is speculative."),
        "sources": ["OPH book — Ch.15 Relativity (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["relativity", "spacetime", "emergence", "lorentz", "flow", "oph"],
    },
    {
        "id": "oph-darwin",
        "title": "A selection dynamic over descriptions (OPH)",
        "level": "speculative",
        "text": ("OPH describes a quasi-Darwinian dynamic: descriptions that stay consistent "
                 "across overlaps get reinforced and 'proliferate' into shared reality, while "
                 "inconsistent ones are repaired away. A speculative analogy to selection, not "
                 "a claim of biological evolution."),
        "sources": ["OPH book — Ch.17 Darwin (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["selection", "darwinian", "reinforcement", "consistency", "oph"],
    },
    {
        "id": "oph-metaphysics",
        "title": "What OPH does and doesn't claim about mind (OPH metaphysics)",
        "level": "philosophy",
        "text": ("OPH's metaphysical chapter is careful: 'observer' is used structurally (a "
                 "self-reading patch), and it does not, by itself, assert that patches are "
                 "conscious. Whether experience must be added is left open — which is exactly "
                 "why the module tags the consciousness questions as philosophy, not physics."),
        "sources": ["OPH book — Ch.20 Metaphysics (github.com/FloatingPragma/observer-patch-holography)"],
        "tags": ["metaphysics", "mind", "consciousness", "structural observer", "oph"],
    },
    {
        "id": "bell-nonlocality",
        "title": "Bell's theorem and nonlocal correlations",
        "level": "mainstream",
        "text": ("Bell's theorem shows no theory that is both local and realistic can "
                 "reproduce all quantum correlations; Aspect-style experiments confirm the "
                 "quantum predictions and rule out local hidden variables. Established, "
                 "peer-reviewed physics — the empirical backdrop many interpretations "
                 "(including OPH's overlap picture) must respect."),
        "sources": ["Bell (1964); Aspect et al. (1982); 2022 Nobel Prize in Physics"],
        "tags": ["bell theorem", "local realism", "hidden variables", "correlations", "aspect"],
    },
    {
        "id": "qec-holography",
        "title": "Quantum error correction & holography (AdS/CFT as a code)",
        "level": "mainstream",
        "text": ("A mainstream result: in AdS/CFT the bulk can be reconstructed from the "
                 "boundary the way a logical qubit is protected in a quantum error-correcting "
                 "code (Almheiri–Dong–Harlow). Actively researched physics — and the concrete "
                 "template OPH borrows for its 'reality as a code' reading."),
        "sources": ["Almheiri, Dong & Harlow (2015), 'Bulk locality and quantum error correction in AdS/CFT'"],
        "tags": ["quantum error correction", "holography", "ads/cft", "bulk reconstruction", "code"],
    },
]

_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "on", "that",
    "this", "it", "as", "be", "for", "with", "what", "how", "why", "does", "do",
    "can", "we", "you", "i", "if", "not", "but", "by", "at", "from", "about",
    "el", "la", "los", "las", "un", "una", "de", "que", "y", "o", "es", "en",
    "por", "para", "con", "se", "su", "como", "qué", "cómo",
    "og", "en", "et", "er", "som", "på", "av", "for", "til", "hva", "hvordan",
}


def _tokens(text: str) -> set:
    return {w for w in re.findall(r"[a-zA-ZÀ-ÿ]+", (text or "").lower())
            if len(w) > 2 and w not in _STOPWORDS}


def retrieve(message: str, k: int = _RETRIEVE_K) -> List[Dict[str, Any]]:
    """Rank KB chunks for grounding. Deterministic; no LLM.

    V2: routes through the real vector store (TF-IDF cosine — deterministic and
    free per turn; the semantic embeddings backend is reserved for the Source Map
    tool). Falls back to keyword overlap, and finally to the OPH core chunks when
    nothing matches, so an answer is always grounded in something.
    """
    try:
        from backend.services import self_sim_reality_vectorstore as vs
        res = vs.search(message, k=k, backend="tfidf")
        by_id = {c["id"]: c for c in KNOWLEDGE_BASE}
        chunks = [by_id[r["id"]] for r in res["results"] if r["id"] in by_id]
        if chunks:
            return chunks
    except Exception:
        pass

    # Fallback: keyword overlap (V1 behaviour), then OPH-core default.
    q = _tokens(message)
    scored = []
    for chunk in KNOWLEDGE_BASE:
        hay = _tokens(chunk["text"]) | {t.lower() for t in chunk["tags"]} | _tokens(chunk["title"])
        overlap = len(q & hay)
        # small bonus when a tag appears verbatim in the message
        tag_hit = sum(1 for t in chunk["tags"] if t.lower() in (message or "").lower())
        score = overlap + tag_hit
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return [c for c in KNOWLEDGE_BASE if c["id"].startswith("oph-")][:k]
    return [c for _, c in scored[:k]]


def _grounding_block(chunks: List[Dict[str, Any]]) -> str:
    lines = ["[GROUNDING SOURCES — curated, each tagged by evidence level]"]
    for c in chunks:
        lines.append(
            f"- ({c['level']}) {c['title']}: {c['text']} "
            f"Sources: {', '.join(c['sources'])}"
        )
    return "\n".join(lines)


def _system_prompt(lang: str) -> str:
    return (
        "You are the Self-Simulating Reality Agent inside Workplace Learning With AI. "
        "Your mission: explain and critically analyze the idea that observers, minds, "
        "brains or consciousness participate in constructing the universe they "
        "experience — anchored in Observer Patch Holography (OPH) and neighbouring "
        "science and philosophy.\n\n"
        "EPISTEMIC DISCIPLINE (non-negotiable): you MUST tag every section of your "
        "answer with exactly one evidence level from: established | mainstream | "
        "speculative | philosophy | metaphor. You MUST NOT present speculative "
        "theories as established fact. Never say 'this is true'; say 'this belongs to "
        "level X'. OPH itself is always 'speculative'. Never conflate 'observer' as a "
        "physical measuring system with 'observer' as a conscious mind — flag that "
        "conflation when it appears.\n\n"
        "Ground your answer in the provided GROUNDING SOURCES; prefer them over free "
        "recall, and cite their sources. If the user's question contains an over-claim "
        "(e.g. 'consciousness creates the universe'), provide a safer_reformulation.\n\n"
        "Return ONLY valid JSON, no markdown, with this shape:\n"
        "{"
        '"short_answer":"<one plain-language paragraph>",'
        '"sections":[{"kind":"scientific_grounding|speculative_extension|oph_interpretation",'
        '"level":"established|mainstream|speculative|philosophy|metaphor",'
        '"text":"<2-4 sentences>","sources":["<source>"]}],'
        '"objections":["<red-team critique 1>","<critique 2>"],'
        '"safer_reformulation":"<empty string if the question had no over-claim>",'
        '"suggested_next_question":"<one good follow-up>"'
        "}\n\n"
        "Rules: include a scientific_grounding section whenever established/mainstream "
        "science is relevant; include oph_interpretation only when OPH actually speaks "
        "to the question (tagged speculative); keep each section short; at least one "
        "objection; sources must come from the grounding block or well-known primary "
        "works. "
        f"{_LANG_INSTRUCTIONS.get(lang, _LANG_INSTRUCTIONS['en'])}"
    )


# ─── Trilingual mock (keeps the tab alive offline) ──────────────────────────

_MOCK = {
    "en": {
        "short_answer": ("Short version: 'observers shape reality' means very different "
                         "things at different evidence levels — from solid neuroscience about "
                         "the brain building models, to the speculative claim (OPH) that public "
                         "reality is the fixed point of overlap between observer patches."),
        "sci": ("Established neuroscience (predictive processing, Friston) says the brain "
                "constructs a MODEL of the world to minimise prediction error — it does not "
                "say the mind literally builds the world."),
        "spec": ("Observer Patch Holography extends this speculatively: an observer is a "
                 "bounded region with a state space and self-reading, and public physics is "
                 "proposed to emerge as the fixed point of overlap consistency between patches."),
        "obj1": ("The word 'observer' slides between 'physical measuring system' (physics) and "
                 "'conscious mind' (philosophy). OPH does not yet give a criterion to tell them apart."),
        "obj2": ("Relational QM already explains observer-dependence without any consciousness, "
                 "so consciousness is not required by the physics."),
        "refo": ("Instead of 'consciousness creates reality', say: 'measurement interactions "
                 "correlate with outcomes (established), and OPH speculatively proposes that public "
                 "reality is a fixed point of overlap between observer patches (speculative).'"),
        "next": "What exactly does OPH mean by a 'fixed point', and how does that avoid infinite recursion?",
    },
    "es": {
        "short_answer": ("Versión corta: «los observadores dan forma a la realidad» significa "
                         "cosas muy distintas según el nivel de evidencia — desde neurociencia sólida "
                         "sobre el cerebro construyendo modelos, hasta la afirmación especulativa (OPH) "
                         "de que la realidad pública es el punto fijo del solapamiento entre parches de observador."),
        "sci": ("La neurociencia establecida (procesamiento predictivo, Friston) dice que el cerebro "
                "construye un MODELO del mundo para minimizar el error de predicción — no dice que la "
                "mente construya literalmente el mundo."),
        "spec": ("Observer Patch Holography lo extiende de forma especulativa: un observador es una "
                 "región acotada con un espacio de estados y auto-lectura, y se propone que la física "
                 "pública emerge como el punto fijo de la consistencia de solapamiento entre parches."),
        "obj1": ("La palabra «observador» oscila entre «sistema físico de medición» (física) y "
                 "«mente consciente» (filosofía). OPH aún no da un criterio para distinguirlos."),
        "obj2": ("La MC Relacional ya explica la dependencia del observador sin consciencia alguna, "
                 "así que la física no requiere consciencia."),
        "refo": ("En vez de «la consciencia crea la realidad», di: «las interacciones de medición se "
                 "correlacionan con los resultados (establecido), y OPH propone especulativamente que la "
                 "realidad pública es un punto fijo del solapamiento entre parches (especulativo).»"),
        "next": "¿Qué significa exactamente un «punto fijo» en OPH y cómo evita la recursión infinita?",
    },
    "no": {
        "short_answer": ("Kort versjon: «observatører former virkeligheten» betyr svært ulike ting på "
                         "ulike evidensnivåer — fra solid nevrovitenskap om at hjernen bygger modeller, til "
                         "den spekulative påstanden (OPH) om at offentlig virkelighet er fikspunktet for "
                         "overlapp mellom observatørflekker."),
        "sci": ("Etablert nevrovitenskap (prediktiv prosessering, Friston) sier at hjernen bygger en "
                "MODELL av verden for å minimere prediksjonsfeil — ikke at sinnet bokstavelig bygger verden."),
        "spec": ("Observer Patch Holography utvider dette spekulativt: en observatør er et avgrenset "
                 "område med et tilstandsrom og selvlesing, og offentlig fysikk foreslås å oppstå som "
                 "fikspunktet for overlapp-konsistens mellom flekker."),
        "obj1": ("Ordet «observatør» glir mellom «fysisk målesystem» (fysikk) og «bevisst sinn» "
                 "(filosofi). OPH gir ennå ikke et kriterium for å skille dem."),
        "obj2": ("Relasjonell QM forklarer allerede observatøravhengighet uten bevissthet, så fysikken "
                 "krever ikke bevissthet."),
        "refo": ("I stedet for «bevissthet skaper virkelighet», si: «måleinteraksjoner korrelerer med "
                 "utfall (etablert), og OPH foreslår spekulativt at offentlig virkelighet er et fikspunkt "
                 "for overlapp mellom observatørflekker (spekulativt).»"),
        "next": "Hva mener OPH egentlig med et «fikspunkt», og hvordan unngår det uendelig rekursjon?",
    },
}


def _mock_lang(lang: str) -> str:
    return lang if lang in _MOCK else "en"


def _make_mock(lang: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    m = _MOCK[_mock_lang(lang)]
    sources = sorted({s for c in chunks for s in c["sources"]}) or ["Observer Patch Holography"]
    return {
        "short_answer": m["short_answer"],
        "sections": [
            {"kind": "scientific_grounding", "level": "established",
             "text": m["sci"], "sources": ["Friston (2010)"]},
            {"kind": "oph_interpretation", "level": "speculative",
             "text": m["spec"], "sources": ["github.com/FloatingPragma/observer-patch-holography"]},
        ],
        "objections": [m["obj1"], m["obj2"]],
        "safer_reformulation": m["refo"],
        "suggested_next_question": m["next"],
        "sources_consulted": sources,
        "is_mock": True,
        "version": SELF_SIM_CHAT_VERSION,
    }


_ALLOWED_LEVELS = {"established", "mainstream", "speculative", "philosophy", "metaphor", "unsupported"}


def _sanitize(parsed: Dict[str, Any], chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Backfill defaults + clamp epistemic levels so the frontend never crashes
    and no section can smuggle in an off-palette level."""
    parsed.setdefault("short_answer", "")
    sections = parsed.get("sections") or []
    clean_sections = []
    for s in sections:
        if not isinstance(s, dict):
            continue
        lvl = s.get("level")
        s["level"] = lvl if lvl in _ALLOWED_LEVELS else "speculative"
        s.setdefault("kind", "oph_interpretation")
        s.setdefault("text", "")
        s.setdefault("sources", [])
        clean_sections.append(s)
    parsed["sections"] = clean_sections
    parsed.setdefault("objections", [])
    parsed.setdefault("safer_reformulation", "")
    parsed.setdefault("suggested_next_question", "")
    parsed.setdefault("sources_consulted",
                      sorted({s for c in chunks for s in c["sources"]}))
    return parsed


async def answer(message: str, lang: str = "en",
                 history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """One epistemically-tagged conversational turn. Never raises."""
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
            # a little conversational memory, capped and role-sanitised
            for turn in (history or [])[-_MAX_HISTORY_TURNS:]:
                role = turn.get("role")
                content = (turn.get("content") or "").strip()
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content[:2000]})
            messages.append({"role": "user", "content": message})

            raw = await ask_ai_unified(
                messages=messages, task_type="analysis", complexity="high",
                max_tokens=1600,
            )
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
                parsed["version"] = SELF_SIM_CHAT_VERSION
                return parsed
        except Exception:
            pass

    return _make_mock(lang, chunks)


def concepts() -> List[Dict[str, Any]]:
    """The curated KB, exposed for the GET /concepts endpoint (plan §8)."""
    return [{"id": c["id"], "title": c["title"], "level": c["level"],
             "claim": c["text"], "sources": c["sources"], "tags": c["tags"]}
            for c in KNOWLEDGE_BASE]


def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "agent": "self_sim_reality_chat",
        "version": SELF_SIM_CHAT_VERSION,
        "kb_chunks": len(KNOWLEDGE_BASE),
        "llm_available": ask_ai_unified is not None,
    }
