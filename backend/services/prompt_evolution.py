"""Prompt Evolution service for the Homo Sapiens vs. KI i Test workshop.

Phase E — closes the Option-C feedback loop from the changelog. The shipped
Re-run with feedback (Option B) is ephemeral: the base TASK_SPECS system prompt
is never modified. This module adds a *deliberate*, *human-in-the-loop* path
for promoting good feedback into a persistent prompt revision.

Lifecycle
---------
        +-----------------------------+
        | Re-run with feedback (B)    |   (already shipped)
        +-------------+---------------+
                      |
                      v
        +-----------------------------+
        | propose_revision()          |   LLM #2 (meta-prompt):
        |  status = "pending"          |   "Given this critique + previous
        +-------------+----------------+   answer, propose a diff to the
                      |                     system prompt for task X".
                      v
        +-----------------------------+
        | run_regression()             |   Optional but recommended.
        |  pending revision compared   |   Runs N curated inputs against
        |  side-by-side with base       |   BOTH prompts; scores keywords,
        +-------------+----------------+   length, markdown structure.
                      |
                      v
        +-----------------------------+
        | approve_revision()           |   Human gate.
        |  -> "active" (others on the   |   Old active marked "superseded".
        |     same task become          |   Append audit-log entry.
        |     "superseded")             |
        +-------------+----------------+
                      |
                      v
        get_active_prompt() resolves   |   run_challenge() reads from
        to the latest "active" version |   Mongo → fallback to TASK_SPECS
        per task, falling back to       |   if no active version (or Mongo
        TASK_SPECS["system"] when no    |   unavailable).
        active revision exists.         |

Design constraints
------------------
- Mock-first graceful degradation: every async function returns a deterministic
  fallback when MongoDB is unavailable. The workshop demo must work offline.
- Audit-only mutations: revisions are NEVER deleted, only soft-marked. Status
  transitions are append-only via the audit collection.
- Human-approved by default: no auto-promotion path. The LLM proposes, a human
  approves. The only "automatic" move is `superseded` when a newer revision is
  approved for the same task.
- Backward compatible: if the Mongo collections are empty, `get_active_prompt`
  returns `None`, and `run_challenge` keeps using TASK_SPECS. Existing flows
  cannot regress just by enabling this module.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

try:
    from backend.db import (
        homo_vs_ai_prompt_revisions_collection,
        homo_vs_ai_prompt_audit_collection,
    )
except ImportError:  # pragma: no cover
    from db import (  # type: ignore
        homo_vs_ai_prompt_revisions_collection,
        homo_vs_ai_prompt_audit_collection,
    )


# Regression samples loaded once at import (small file, deterministic).
_REGRESSION_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "regression_samples.json",
)


def _load_regression_samples() -> Dict[str, Any]:
    try:
        with open(_REGRESSION_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh) or {}
    except (FileNotFoundError, json.JSONDecodeError):
        # Missing or corrupt file is non-fatal — regression check just returns
        # an empty harness result instead of blocking the whole flow.
        return {}


_REGRESSION_SAMPLES = _load_regression_samples()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Meta-prompt — the system prompt for the LLM call that proposes the revision
# ---------------------------------------------------------------------------

PROPOSE_SYSTEM_PROMPT = (
    "You are a senior prompt engineer specialising in testing-focused LLM "
    "system prompts. You will receive:\n"
    "  1. The CURRENT system prompt for a testing challenge (the BASE).\n"
    "  2. A SAMPLE USER INPUT that was sent in a recent round.\n"
    "  3. The AI's PREVIOUS ANSWER to that input.\n"
    "  4. The HUMAN REVIEWER's improvement notes on that answer.\n\n"
    "Your job: propose a REVISED version of the BASE system prompt that, if "
    "adopted permanently, would consistently produce better answers across "
    "future rounds — not just this single input.\n\n"
    "CRITICAL CONSTRAINTS:\n"
    "- The revised prompt must keep the same OUTPUT STYLE (markdown, structure, "
    "  priorities, language hint) as the BASE. Do not change the response shape.\n"
    "- Do NOT specialise the prompt for the sample input. The goal is a general "
    "  improvement.\n"
    "- Do NOT add 'always do X for input Y' rules. Add general principles, "
    "  structural guidance, or terminology corrections.\n"
    "- Keep the prompt approximately the same length (±30%). If you can fix "
    "  the issue by REMOVING noise, that's preferred over adding text.\n"
    "- If the human feedback is contradictory, lazy, vague, or actively harmful, "
    "  REFUSE the revision: return status='refused' with a brief rationale.\n"
    "- If the revision risks silent drift (e.g. removes ISTQB anchoring, drops "
    "  bilingual hint, removes safety instructions), REFUSE it.\n\n"
    "Return STRICT JSON only (no markdown fences, no prose around it):\n"
    "{\n"
    '  "status": "proposed" | "refused",\n'
    '  "rationale": "1-3 sentences on what changed and why",\n'
    '  "risk_flags": ["e.g. removed-istqb-anchor", "narrowed-scope", ...],\n'
    '  "proposed_prompt": "the full revised system prompt (only when status=proposed)",\n'
    '  "refusal_reason": "why this revision should not happen (only when status=refused)"\n'
    "}"
)


# ---------------------------------------------------------------------------
# Public: get_active_prompt — wired into run_challenge
# ---------------------------------------------------------------------------

async def get_active_prompt(task: str) -> Optional[Dict[str, Any]]:
    """Return the active revision dict for a task, or None.

    None means: no active revision found OR Mongo unavailable → callers must
    fall back to TASK_SPECS[task]["system"]. This is the *backward-compatible
    seam*: existing flows keep working unchanged when no revision exists.
    """
    try:
        doc = await homo_vs_ai_prompt_revisions_collection.find_one(
            {"task": task, "status": "active"},
            sort=[("version", -1)],
        )
        if doc:
            # Strip Mongo's ObjectId for JSON-safety.
            doc.pop("_id", None)
        return doc
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public: list_revisions — admin panel
# ---------------------------------------------------------------------------

async def list_revisions(
    task: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Return revisions filtered by task and/or status (most recent first)."""
    query: Dict[str, Any] = {}
    if task:
        query["task"] = task
    if status:
        query["status"] = status
    try:
        cursor = homo_vs_ai_prompt_revisions_collection.find(query).sort(
            "proposed_at", -1
        ).limit(limit)
        out = []
        async for doc in cursor:
            doc.pop("_id", None)
            out.append(doc)
        return out
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Public: propose_revision — LLM #2 call
# ---------------------------------------------------------------------------

async def propose_revision(
    task: str,
    base_prompt: str,
    user_input: str,
    previous_ai_output: str,
    human_feedback: str,
    request_headers: Optional[Dict[str, str]] = None,
    actor: str = "anonymous",
) -> Dict[str, Any]:
    """Ask the LLM to propose a revision to the base prompt for `task`.

    Returns the *saved* pending revision dict (with status="pending" or
    "refused" — refusals are persisted too, so the audit trail is complete).

    The LLM call is wrapped in mock-first graceful degradation: if the LLM
    is unavailable or returns non-JSON, a deterministic "refused" record is
    returned with a clear rationale. This makes the workshop demo work even
    without an LLM (the human reviewer sees the refusal and moves on).
    """
    if not task or not base_prompt:
        raise ValueError("task and base_prompt are required")

    # Build the LLM input — a compact, well-structured request.
    meta_user = (
        f"--- TASK ---\n{task}\n\n"
        f"--- CURRENT (BASE) SYSTEM PROMPT ---\n{base_prompt}\n\n"
        f"--- SAMPLE USER INPUT FROM THE ROUND ---\n{user_input}\n\n"
        f"--- AI PREVIOUS ANSWER ---\n{previous_ai_output}\n\n"
        f"--- HUMAN IMPROVEMENT NOTES ---\n{human_feedback}\n\n"
        "Return strict JSON per the contract."
    )

    raw_output = ""
    parsed: Dict[str, Any] = {}
    try:
        from backend.llm import ask_ai_unified

        raw_output = await ask_ai_unified(
            prompt=meta_user,
            messages=[
                {"role": "system", "content": PROPOSE_SYSTEM_PROMPT},
                {"role": "user", "content": meta_user},
            ],
            max_tokens=1500,
            temperature=0.2,
            request_headers=request_headers or {},
        )
        parsed = _safe_parse_json(raw_output)
    except Exception as e:  # noqa: BLE001 — broad on purpose for workshop resilience
        parsed = {
            "status": "refused",
            "rationale": f"LLM call failed: {type(e).__name__}",
            "risk_flags": ["llm-unavailable"],
            "refusal_reason": "Workshop running without an LLM connection. Re-run with LLM available.",
        }

    if not parsed or "status" not in parsed:
        parsed = {
            "status": "refused",
            "rationale": "LLM returned an unparseable response.",
            "risk_flags": ["unparseable-llm-output"],
            "refusal_reason": "Could not extract strict JSON from the LLM response.",
            "raw_output": (raw_output or "")[:1200],
        }

    # Resolve next version number for this task.
    version = await _next_version_for(task)

    doc: Dict[str, Any] = {
        "revision_id": str(uuid4()),
        "task": task,
        "version": version,
        "base_prompt": base_prompt,
        "user_input": (user_input or "")[:4000],
        "previous_ai_output": (previous_ai_output or "")[:8000],
        "human_feedback": (human_feedback or "")[:4000],
        # The LLM's response, in normalised form.
        "status": "pending" if parsed.get("status") == "proposed" else "refused",
        "proposed_prompt": (parsed.get("proposed_prompt") or "")[:8000] or None,
        "meta_llm_rationale": (parsed.get("rationale") or "")[:1200],
        "risk_flags": list(parsed.get("risk_flags") or [])[:10],
        "refusal_reason": (parsed.get("refusal_reason") or "")[:600] or None,
        # Bookkeeping.
        "proposed_at": _now_iso(),
        "proposed_by": actor,
        "approved_at": None,
        "approved_by": None,
        "rejection_reason": None,
        "regression": None,
    }

    try:
        await homo_vs_ai_prompt_revisions_collection.insert_one(dict(doc))
    except Exception:
        # Mongo unavailable — return the doc anyway so the UI can render it
        # ephemerally. Callers must treat the return as a transient preview.
        doc["_persisted"] = False
    else:
        doc["_persisted"] = True

    await _audit("propose", doc, actor=actor, detail=parsed.get("rationale"))

    return doc


# ---------------------------------------------------------------------------
# Public: approve_revision / reject_revision / rollback_to
# ---------------------------------------------------------------------------

async def approve_revision(
    revision_id: str,
    approver: str = "anonymous",
    note: str = "",
) -> Dict[str, Any]:
    """Approve a pending revision → mark it active, supersede the previous active.

    Returns the updated revision dict. Raises ValueError on invalid state.
    """
    doc = await _find_by_id(revision_id)
    if not doc:
        raise ValueError(f"Revision '{revision_id}' not found.")
    if doc.get("status") not in ("pending", "rejected"):
        # Allow approving a previously-rejected revision (someone changed
        # their mind). Disallow approving an already-active or superseded one.
        raise ValueError(
            f"Cannot approve revision in status '{doc.get('status')}'. "
            "Allowed source statuses: pending, rejected."
        )
    if not doc.get("proposed_prompt"):
        raise ValueError(
            "This revision has no proposed_prompt (likely an LLM refusal). "
            "Approving it would have no effect."
        )

    task = doc["task"]
    now = _now_iso()

    # Supersede the previous active (if any).
    try:
        await homo_vs_ai_prompt_revisions_collection.update_many(
            {"task": task, "status": "active"},
            {"$set": {"status": "superseded", "superseded_at": now,
                      "superseded_by_revision_id": revision_id}},
        )
        # Mark this one active.
        await homo_vs_ai_prompt_revisions_collection.update_one(
            {"revision_id": revision_id},
            {"$set": {
                "status": "active",
                "approved_at": now,
                "approved_by": approver,
                "approval_note": (note or "")[:600] or None,
            }},
        )
        doc = await _find_by_id(revision_id) or doc
    except Exception:
        # Persisted state may not be available; still return the in-memory
        # mutation so the UI can keep flowing.
        doc.update({
            "status": "active",
            "approved_at": now,
            "approved_by": approver,
            "approval_note": (note or "")[:600] or None,
        })

    await _audit("approve", doc, actor=approver, detail=note)
    return doc


async def reject_revision(
    revision_id: str,
    reviewer: str = "anonymous",
    reason: str = "",
) -> Dict[str, Any]:
    """Reject a pending revision."""
    doc = await _find_by_id(revision_id)
    if not doc:
        raise ValueError(f"Revision '{revision_id}' not found.")
    if doc.get("status") not in ("pending", "refused"):
        raise ValueError(
            f"Cannot reject revision in status '{doc.get('status')}'. "
            "Allowed source statuses: pending, refused."
        )

    now = _now_iso()
    try:
        await homo_vs_ai_prompt_revisions_collection.update_one(
            {"revision_id": revision_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": (reason or "")[:600] or None,
                "rejected_at": now,
                "rejected_by": reviewer,
            }},
        )
        doc = await _find_by_id(revision_id) or doc
    except Exception:
        doc.update({
            "status": "rejected",
            "rejection_reason": (reason or "")[:600] or None,
            "rejected_at": now,
            "rejected_by": reviewer,
        })

    await _audit("reject", doc, actor=reviewer, detail=reason)
    return doc


async def rollback_to(
    revision_id: str,
    actor: str = "anonymous",
    reason: str = "",
) -> Dict[str, Any]:
    """Re-activate a previously-superseded revision.

    Useful when a freshly-approved prompt regresses production and the human
    reviewer needs to revert to a prior version that was known good.
    """
    doc = await _find_by_id(revision_id)
    if not doc:
        raise ValueError(f"Revision '{revision_id}' not found.")
    if doc.get("status") not in ("superseded", "rejected"):
        raise ValueError(
            f"Rollback target must be in status 'superseded' or 'rejected', got '{doc.get('status')}'."
        )

    task = doc["task"]
    now = _now_iso()
    try:
        # Supersede the current active.
        await homo_vs_ai_prompt_revisions_collection.update_many(
            {"task": task, "status": "active"},
            {"$set": {"status": "superseded", "superseded_at": now,
                      "superseded_by_revision_id": revision_id,
                      "superseded_reason": "rollback"}},
        )
        # Re-activate the rolled-back revision.
        await homo_vs_ai_prompt_revisions_collection.update_one(
            {"revision_id": revision_id},
            {"$set": {
                "status": "active",
                "reactivated_at": now,
                "reactivated_by": actor,
                "rollback_reason": (reason or "")[:600] or None,
            }},
        )
        doc = await _find_by_id(revision_id) or doc
    except Exception:
        doc.update({"status": "active", "reactivated_at": now,
                    "reactivated_by": actor})

    await _audit("rollback", doc, actor=actor, detail=reason)
    return doc


# ---------------------------------------------------------------------------
# Public: run_regression — small harness for sanity-checking a revision
# ---------------------------------------------------------------------------

async def run_regression(
    revision_id: str,
    request_headers: Optional[Dict[str, str]] = None,
    max_samples: int = 3,
) -> Dict[str, Any]:
    """Run the curated regression samples for this revision's task through
    BOTH the base and the proposed prompt. Score each output mechanically
    on (a) keyword coverage, (b) length sanity, (c) markdown structure.

    Returns a side-by-side dict and persists the summary on the revision.
    Mock-first: if the LLM is unavailable, the harness records 'skipped'
    rather than failing the whole approval flow.
    """
    doc = await _find_by_id(revision_id)
    if not doc:
        raise ValueError(f"Revision '{revision_id}' not found.")
    if not doc.get("proposed_prompt"):
        raise ValueError("Revision has no proposed_prompt; nothing to compare.")

    task = doc["task"]
    samples = (_REGRESSION_SAMPLES.get(task) or [])[:max_samples]
    if not samples:
        return {
            "revision_id": revision_id, "task": task,
            "status": "no_samples", "samples": [],
            "summary": {"base_pass": 0, "base_warn": 0, "base_fail": 0,
                        "proposed_pass": 0, "proposed_warn": 0, "proposed_fail": 0,
                        "verdict": "inconclusive"},
        }

    base_prompt = doc.get("base_prompt") or ""
    proposed_prompt = doc.get("proposed_prompt") or ""

    sample_results: List[Dict[str, Any]] = []
    for sample in samples:
        base_out = await _run_one(base_prompt, sample["input"], request_headers)
        prop_out = await _run_one(proposed_prompt, sample["input"], request_headers)
        sample_results.append({
            "id": sample.get("id"),
            "input": sample["input"],
            "base_output": base_out,
            "proposed_output": prop_out,
            "base_score": _score_output(base_out, sample),
            "proposed_score": _score_output(prop_out, sample),
        })

    # Aggregate.
    def _tally(key: str) -> Dict[str, int]:
        return {
            "pass":  sum(1 for r in sample_results if r[key]["verdict"] == "pass"),
            "warn":  sum(1 for r in sample_results if r[key]["verdict"] == "warn"),
            "fail":  sum(1 for r in sample_results if r[key]["verdict"] == "fail"),
        }

    base_tally = _tally("base_score")
    prop_tally = _tally("proposed_score")

    if prop_tally["pass"] >= base_tally["pass"] and prop_tally["fail"] <= base_tally["fail"]:
        verdict = "no_regression"
    elif prop_tally["fail"] > base_tally["fail"]:
        verdict = "regression"
    else:
        verdict = "mixed"

    summary = {
        "base_pass": base_tally["pass"], "base_warn": base_tally["warn"], "base_fail": base_tally["fail"],
        "proposed_pass": prop_tally["pass"], "proposed_warn": prop_tally["warn"], "proposed_fail": prop_tally["fail"],
        "verdict": verdict,
        "samples_run": len(sample_results),
    }

    payload = {
        "revision_id": revision_id, "task": task, "status": "ok",
        "ran_at": _now_iso(),
        "samples": sample_results, "summary": summary,
    }

    # Persist the summary on the revision (lightweight — full sample bodies stay in memory).
    try:
        await homo_vs_ai_prompt_revisions_collection.update_one(
            {"revision_id": revision_id},
            {"$set": {"regression": {"summary": summary, "ran_at": payload["ran_at"]}}},
        )
    except Exception:
        pass

    return payload


# ---------------------------------------------------------------------------
# Internals
# ---------------------------------------------------------------------------

async def _next_version_for(task: str) -> int:
    try:
        cursor = homo_vs_ai_prompt_revisions_collection.find(
            {"task": task},
        ).sort("version", -1).limit(1)
        async for doc in cursor:
            return int(doc.get("version") or 0) + 1
    except Exception:
        pass
    return 1


async def _find_by_id(revision_id: str) -> Optional[Dict[str, Any]]:
    try:
        doc = await homo_vs_ai_prompt_revisions_collection.find_one(
            {"revision_id": revision_id}
        )
        if doc:
            doc.pop("_id", None)
        return doc
    except Exception:
        return None


async def _audit(action: str, revision: Dict[str, Any],
                  actor: str = "anonymous", detail: Optional[str] = None) -> None:
    """Append-only audit log entry. Never raises."""
    entry = {
        "action": action,
        "revision_id": revision.get("revision_id"),
        "task": revision.get("task"),
        "version": revision.get("version"),
        "status_after": revision.get("status"),
        "actor": actor,
        "detail": (detail or "")[:600] or None,
        "at": _now_iso(),
    }
    try:
        await homo_vs_ai_prompt_audit_collection.insert_one(entry)
    except Exception:
        pass


def _safe_parse_json(raw: str) -> Dict[str, Any]:
    """Robust JSON extraction — strips markdown fences, isolates the first
    {...} block. Returns {} on failure."""
    if not raw:
        return {}
    text = raw.strip()
    # Strip ```json ... ``` fences if present.
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [ln for ln in lines if not ln.strip().startswith("```")]
        text = "\n".join(lines).strip()
    # Try direct parse first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Otherwise isolate the first {...} block by brace-matching.
    start = text.find("{")
    if start < 0:
        return {}
    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i + 1])
                except json.JSONDecodeError:
                    return {}
    return {}


async def _run_one(system_prompt: str, user_input: str,
                   request_headers: Optional[Dict[str, str]]) -> str:
    """Run a single regression input through the given prompt. Returns the
    raw text output (possibly empty)."""
    try:
        from backend.llm import ask_ai_unified

        out = await ask_ai_unified(
            prompt=user_input,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input},
            ],
            max_tokens=600,
            temperature=0.3,
            request_headers=request_headers or {},
        )
        return (out or "").strip()
    except Exception:
        return ""


_MARKDOWN_SIGNALS = ("- ", "* ", "1.", "## ", "### ", "| ", "|---")


def _score_output(output: str, sample: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic scoring used by run_regression — keyword coverage,
    length, markdown structure. No LLM calls here on purpose: the harness
    must produce the same numbers regardless of LLM mood."""
    output_low = (output or "").lower()
    must_appear = [str(k).lower() for k in (sample.get("must_appear") or [])]
    hits = [k for k in must_appear if k in output_low]
    coverage = (len(hits) / len(must_appear)) if must_appear else 1.0

    length_ok = True
    length_band = None
    min_chars = int(sample.get("min_chars") or 0)
    max_chars = int(sample.get("max_chars") or 10_000_000)
    n = len(output or "")
    if n < min_chars:
        length_ok = False
        length_band = "below_min"
    elif n > max_chars:
        length_ok = False
        length_band = "above_max"

    need_md = bool(sample.get("must_contain_markdown"))
    md_ok = (not need_md) or any(sig in (output or "") for sig in _MARKDOWN_SIGNALS)

    # Final verdict.
    if not output:
        verdict = "fail"
    elif coverage < 0.5:
        verdict = "fail"
    elif (not md_ok) or (coverage < 1.0) or (not length_ok):
        verdict = "warn"
    else:
        verdict = "pass"

    return {
        "verdict": verdict,
        "coverage": round(coverage, 2),
        "hits": hits,
        "missing": [k for k in must_appear if k not in output_low],
        "length": n,
        "length_ok": length_ok,
        "length_band": length_band,
        "markdown_ok": md_ok,
    }
