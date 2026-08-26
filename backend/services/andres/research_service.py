"""
Andrés — research tiers (V5). Andrés' own three-tier research model, formalised as
an enforced permission policy:

  1. internal   — his own biography (memories, projects) [default ON]
  2. documents  — text the user explicitly gives him this turn [default ON]
  3. web        — external DuckDuckGo search (per-message 🌐 toggle) [default OFF]

Each tier can be turned on/off by the user, and the chat endpoint enforces it:
internal off → he doesn't consult his stored memory/projects; documents off → a
provided document is ignored; web off → the 🌐 toggle can't actually search
(honest `web_access: disabled`). The tiers rise in exposure — internal < user-
provided < external — so the most cautious tier (web) is off by default.
"""
import json
import re

from backend.db import andres_profiles

DEFAULT_TIERS = {"internal": True, "documents": True, "web": False}


# ---------------------------------------------------------------------------
# "Where should I research X?" — maps a free-form question to the best few
# sources from the Knowledge-Sources directory (the frontend owns the catalog
# and sends it in, so it stays the single source of truth). LLM-backed with a
# deterministic, offline keyword fallback so it works with no AI key (mock-first,
# same is_mock contract as the rest of the Andrés module).
# ---------------------------------------------------------------------------

# Keyword hints per catalog category. Deliberately broad; only used by the
# offline fallback and to bias the prompt. Lower-cased, matched as substrings.
_CATEGORY_KEYWORDS = {
    "academic":  ["research", "paper", "study", "studies", "scholar", "citation", "thesis",
                  "peer", "academic", "science", "scientific", "dataset", "preprint"],
    "journals":  ["journal", "publication", "peer-reviewed", "review article", "article"],
    "archives":  ["book", "history", "historical", "archive", "primary source", "manuscript",
                  "ebook", "public domain", "culture", "cultural", "art", "literature", "heritage"],
    "courses":   ["course", "learn", "learning", "lecture", "tutorial", "mooc", "class", "talk", "teach"],
    "medicine":  ["health", "medical", "medicine", "clinical", "disease", "psychology",
                  "psychological", "mental", "brain", "drug", "biomed", "patient", "therapy"],
    "policy":    ["policy", "government", "economic", "economics", "economy", "politic",
                  "foreign", "international", "poll", "survey", "regulation", "think tank", "geopolit"],
    "business":  ["business", "management", "market", "marketing", "strategy", "company",
                  "industry", "finance", "financial", "leadership", "consulting", "startup", "tech trend"],
}


def _flatten_catalog(catalog):
    """Return (entries_by_name, category_order). Each entry keeps name/url/desc/access/cat."""
    entries = {}
    cat_order = []
    for c in (catalog or []):
        cat = c.get("cat") or "other"
        if cat not in cat_order:
            cat_order.append(cat)
        for it in (c.get("items") or []):
            nm = (it.get("name") or "").strip()
            if not nm:
                continue
            entries[nm] = {
                "name": nm,
                "url": it.get("url", ""),
                "desc": it.get("desc", ""),
                "access": it.get("access", "mixed"),
                "cat": cat,
            }
    return entries, cat_order


def _score_categories(question, cat_order):
    q = (question or "").lower()
    scores = {}
    for cat in cat_order:
        kws = _CATEGORY_KEYWORDS.get(cat, [])
        scores[cat] = sum(1 for kw in kws if kw in q)
    return scores


def _offline_suggest(question, entries, catalog):
    """Deterministic fallback: score categories by keyword hits, then pick a few
    sources (preferring open-access) from the best-matching categories."""
    _, cat_order = _flatten_catalog(catalog)
    scores = _score_categories(question, cat_order)
    ranked = sorted(cat_order, key=lambda c: scores.get(c, 0), reverse=True)
    # If nothing matched, fall back to broadly useful starting points.
    top_cats = [c for c in ranked if scores.get(c, 0) > 0][:2] or ["academic", "archives"]

    by_cat = {}
    for e in entries.values():
        by_cat.setdefault(e["cat"], []).append(e)

    picks = []
    for cat in top_cats:
        pool = by_cat.get(cat, [])
        # prefer open access, keep catalog order otherwise
        pool = sorted(pool, key=lambda e: 0 if e["access"] == "open" else 1)
        for e in pool[:2]:
            picks.append({**e, "reason": f"Good starting point for {cat} questions."})
        if len(picks) >= 4:
            break
    return {"strategy": "", "picks": picks[:5]}


def _build_suggest_prompt(question, catalog, lang):
    lines = []
    for c in (catalog or []):
        names = ", ".join((it.get("name") or "") for it in (c.get("items") or []) if it.get("name"))
        if names:
            lines.append(f"- {c.get('cat')}: {names}")
    catalog_block = "\n".join(lines)
    lang_hint = ""
    if lang and lang.lower().startswith("no"):
        lang_hint = "Write `strategy` and each `reason` in Norwegian (bokmål)."
    elif lang and lang.lower().startswith("es"):
        lang_hint = "Write `strategy` and each `reason` in Spanish."
    else:
        lang_hint = "Write `strategy` and each `reason` in English."
    return (
        "You are Andrés, helping the user decide WHERE to research a question. "
        "Below is a directory of reputable sources grouped by category. Pick the "
        "3-5 that fit the question BEST and say why in one short line each. Only "
        "choose sources from the directory; use their EXACT names.\n\n"
        f"DIRECTORY:\n{catalog_block}\n\n"
        f"QUESTION: {question}\n\n"
        "Return STRICT JSON (no prose, no markdown fence) matching:\n"
        "{\n"
        '  "strategy": "<1-2 sentence overall approach>",\n'
        '  "suggestions": [ { "source": "<exact name>", "reason": "<one line>" } ]\n'
        "}\n"
        f"{lang_hint}"
    )


def _extract_json(text):
    if not text:
        return None
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None


def _parse_suggest(output, entries):
    """Validate LLM JSON against the real catalog; drop unknown source names."""
    parsed = _extract_json(output)
    if not isinstance(parsed, dict):
        return None
    raw = parsed.get("suggestions") or []
    if not isinstance(raw, list):
        return None
    picks, seen = [], set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = str(item.get("source", "")).strip()
        if name in entries and name not in seen:
            seen.add(name)
            picks.append({**entries[name], "reason": str(item.get("reason", "")).strip()})
    if not picks:
        return None
    return {"strategy": str(parsed.get("strategy", "")).strip(), "picks": picks[:5]}


async def suggest_sources(question, catalog, lang=None, request_headers=None) -> dict:
    """Suggest the best few Knowledge-Sources entries for a research question."""
    q = (question or "").strip()
    entries, _ = _flatten_catalog(catalog)
    result = _offline_suggest(q, entries, catalog)
    is_mock = True
    if q and entries:
        try:
            from backend.llm import ask_ai_unified
            out = await ask_ai_unified(
                messages=[{"role": "user", "content": _build_suggest_prompt(q, catalog, lang)}],
                task_type="andres_research_suggest", complexity="medium",
                max_tokens=700, request_headers=request_headers,
            )
            if out and not out.startswith("[MOCKED RESPONSE"):
                parsed = _parse_suggest(out, entries)
                if parsed:
                    result = parsed
                    is_mock = False
        except Exception as e:  # pragma: no cover - defensive
            print(f"⚠️ Andrés research-suggest LLM failed: {e}")
    result["is_mock"] = is_mock
    result["question"] = q[:500]
    return result


def get_tiers(profile: dict) -> dict:
    """Merge the profile's saved tiers over the defaults (missing keys default)."""
    saved = (profile or {}).get("research_tiers") or {}
    return {k: bool(saved.get(k, v)) for k, v in DEFAULT_TIERS.items()}


async def set_tiers(user_id: str, patch: dict) -> dict:
    """Update only the known tier flags; returns the resulting tiers."""
    updates = {f"research_tiers.{k}": bool(patch[k])
               for k in DEFAULT_TIERS if k in patch and patch[k] is not None}
    if updates:
        await andres_profiles.update_one({"user_id": user_id}, {"$set": updates})
    doc = await andres_profiles.find_one({"user_id": user_id})
    return get_tiers(doc or {})
