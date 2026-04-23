"""ISTQB anchors loader for the Homo Sapiens vs. KI i Test workshop module.

This loads `backend/data/istqb_anchors.json` once at import and exposes two
helpers used by `homo_vs_ai_service.py`:

- `get_anchors(kind, key=None)` — retrieve the anchors for a given kind:
    - kind="task",   key=<task_id>    → anchors for one of the 10 testing rounds
    - kind="router", key=None         → anchors for the Problem Router
    - kind="judge",  key=None         → anchors for the AI Judge
  Returns an empty dict if nothing is found (by design — the module must keep
  working if the JSON is missing or malformed).

- `build_istqb_prompt_block(kind, key=None, language=None)` — produce a short,
  token-budget-aware string to append to a system prompt. Example output:

      ISTQB REFERENCES (advisory, concise):
      - CTFL v4.0 §4.2 Black-Box Test Techniques — Derive test cases via equivalence
        partitioning, boundary value analysis, decision tables and state transition.
      - CTFL v4.0 §5.1.5 Test Case Prioritization — Prioritise by risk, change
        frequency, complexity and coverage.
      - CT-AI v1.0 §11.3 Using AI for Test Case Generation — LLMs can generate
        cases, but the oracle problem remains: a human validates expected results.
      Key terms: equivalence partitioning, boundary value analysis, test case,
      acceptance criteria.
      NO terminology (ISTQB-NO v2.4): testtilfelle (test case), grenseverdianalyse
        (boundary value analysis), ekvivalensklasseinndeling (equivalence partitioning).

Design notes:
- The block is deliberately advisory — the LLM is told "you MAY anchor your
  reasoning in these references". It is not a mandate. This keeps the tone
  credible without forcing the model to parrot section numbers.
- NO terminology is only appended when language hint is Norwegian, to avoid
  bloating English-language runs.
- Token footprint is kept around 80–150 tokens per prompt.
- Loader is tolerant: missing file, malformed JSON or missing keys all degrade
  gracefully to an empty block (the module still runs).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "istqb_anchors.json"
_CACHE: Optional[Dict[str, Any]] = None


def _load() -> Dict[str, Any]:
    """Load the anchors JSON once; cache subsequent calls.

    Returns {} on any error so the caller can keep working without ISTQB context.
    """
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    try:
        with _DATA_PATH.open("r", encoding="utf-8") as fh:
            _CACHE = json.load(fh) or {}
    except FileNotFoundError:
        logger.warning("ISTQB anchors file not found at %s — prompts will run without ISTQB anchoring", _DATA_PATH)
        _CACHE = {}
    except json.JSONDecodeError as e:
        logger.error("ISTQB anchors file is malformed (%s). Ignoring. Error: %s", _DATA_PATH, e)
        _CACHE = {}
    except Exception as e:
        logger.error("Unexpected error loading ISTQB anchors: %s", e)
        _CACHE = {}
    return _CACHE


def get_anchors(kind: str, key: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve the anchors block for a given kind (task/router/judge).

    Returns an empty dict if the kind/key is unknown — the caller must be
    defensive. See module docstring for expected kinds.
    """
    data = _load()
    if not data:
        return {}
    if kind == "task":
        return (data.get("tasks") or {}).get(key or "", {}) or {}
    if kind == "router":
        return data.get("router") or {}
    if kind == "judge":
        return data.get("judge") or {}
    return {}


def _norwegian_terms_for_task(task_key: str) -> List[str]:
    """Pull the subset of the NO glossary that is relevant to a task.

    Looks at the task's `key_terms` field and maps each to its Norwegian
    translation from `glossary_no`. Returns a list of compact
    '<norwegian> (<english>)' strings — empty if nothing matches.
    """
    data = _load()
    if not data:
        return []
    task = (data.get("tasks") or {}).get(task_key, {}) or {}
    glossary: Dict[str, Dict[str, Any]] = data.get("glossary_no") or {}
    out: List[str] = []
    for term in task.get("key_terms") or []:
        entry = glossary.get(term)
        if entry and entry.get("no"):
            out.append(f"{entry['no']} ({term})")
    return out


def build_istqb_prompt_block(kind: str, key: Optional[str] = None, language: Optional[str] = None) -> str:
    """Produce a short ISTQB anchor block to append to a system prompt.

    kind: 'task' | 'router' | 'judge'
    key:  task id when kind='task', otherwise None
    language: 'no' / 'en' / None — controls whether NO terminology is appended

    Returns '' (empty string) when no anchors are available — caller can safely
    concatenate unconditionally.
    """
    block = get_anchors(kind, key)
    anchors = block.get("anchors") or []
    if not anchors:
        return ""

    lines: List[str] = ["", "ISTQB REFERENCES (advisory, concise — you MAY anchor your reasoning in these):"]
    for a in anchors[:3]:
        syl = a.get("syllabus", "?")
        sec = a.get("section", "?")
        summary = (a.get("summary") or "").strip()
        lines.append(f"- {syl} {sec} — {summary}")

    if kind == "task" and key:
        key_terms = (block.get("key_terms") or [])[:4]
        if key_terms:
            lines.append(f"Key terms: {', '.join(key_terms)}.")
        if language and language.lower().startswith("no"):
            no_terms = _norwegian_terms_for_task(key)[:4]
            if no_terms:
                lines.append(f"NO terminology (ISTQB-NO v2.4): {', '.join(no_terms)}.")

    return "\n".join(lines)


def anchors_summary_for_response(kind: str, key: Optional[str] = None) -> List[Dict[str, str]]:
    """Return a JSON-serialisable list of anchors for the API response.

    Used by challenge/route/judge endpoints so the frontend can render the
    '📚 ISTQB-anchored' badge with the real references on hover.

    Shape: [{syllabus, section, summary}, ...]
    """
    block = get_anchors(kind, key)
    anchors = block.get("anchors") or []
    return [
        {
            "syllabus": str(a.get("syllabus", "")),
            "section": str(a.get("section", "")),
            "summary": str(a.get("summary", "")),
        }
        for a in anchors
    ]
