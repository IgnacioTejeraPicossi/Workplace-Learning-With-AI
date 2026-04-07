"""
Learning Profile Service — Phase 2
Tracks user learning behavior and computes derived preferences.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from collections import Counter

from backend.db import learning_profiles_collection, babel_ai_metadata_collection


# ---------------------------------------------------------------------------
# Record interactions
# ---------------------------------------------------------------------------

async def record_interaction(user_id: str, interaction: dict) -> dict:
    """Record a resource interaction and recompute derived profile."""
    interaction["timestamp"] = datetime.now(timezone.utc).isoformat()

    # Enrich from babel_ai_metadata if classification fields missing
    if not interaction.get("domain") and interaction.get("resource_id"):
        meta = await babel_ai_metadata_collection.find_one({
            "resource_id": interaction["resource_id"],
            "resource_type": interaction.get("resource_type", "")
        })
        if meta:
            cls = meta.get("classification") or {}
            interaction.setdefault("domain", cls.get("domain"))
            interaction.setdefault("difficulty", cls.get("difficulty"))
            interaction.setdefault("tags", meta.get("tags", []))

    # Push interaction (capped at 500)
    await learning_profiles_collection.update_one(
        {"user_id": user_id},
        {
            "$push": {"interactions": {"$each": [interaction], "$slice": -500}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
            "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat(), "search_history": []}
        },
        upsert=True
    )

    # Recompute derived profile
    await _update_derived(user_id)
    return {"status": "ok"}


async def record_search(user_id: str, query: str) -> dict:
    """Record a search event and recompute derived profile."""
    entry = {
        "query": query,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    await learning_profiles_collection.update_one(
        {"user_id": user_id},
        {
            "$push": {"search_history": {"$each": [entry], "$slice": -100}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
            "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat(), "interactions": []}
        },
        upsert=True
    )

    await _update_derived(user_id)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Read profile
# ---------------------------------------------------------------------------

async def get_profile(user_id: str) -> Optional[dict]:
    """Return full profile or None."""
    doc = await learning_profiles_collection.find_one({"user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def get_profile_summary(user_id: str) -> dict:
    """Return derived profile summary only."""
    doc = await learning_profiles_collection.find_one(
        {"user_id": user_id},
        {"derived": 1, "user_id": 1}
    )
    if not doc:
        return {"status": "new_user", "total_interactions": 0, "derived": None}

    derived = doc.get("derived") or {}
    return {
        "status": "active",
        "total_interactions": derived.get("total_interactions", 0),
        "derived": derived
    }


# ---------------------------------------------------------------------------
# Derived profile computation
# ---------------------------------------------------------------------------

async def _update_derived(user_id: str):
    """Fetch interactions + searches, recompute derived, and update."""
    doc = await learning_profiles_collection.find_one(
        {"user_id": user_id},
        {"interactions": 1, "search_history": 1}
    )
    if not doc:
        return

    derived = _recompute_derived(
        doc.get("interactions", []),
        doc.get("search_history", [])
    )

    await learning_profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": {"derived": derived}}
    )


def _recompute_derived(interactions: list, searches: list) -> dict:
    """Pure function: compute derived preferences from raw data."""
    now = datetime.now(timezone.utc)

    # --- Topic interest scores (with time decay) ---
    domain_scores = Counter()
    for ix in interactions:
        domain = ix.get("domain") or ix.get("topic") or "Other"
        weight = _time_weight(ix.get("timestamp"), now)
        domain_scores[domain] += weight

    # Also count search-derived topics
    for s in searches:
        query_words = (s.get("query") or "").lower()
        weight = _time_weight(s.get("timestamp"), now) * 0.5  # searches count less
        for domain in _DOMAIN_KEYWORDS:
            if any(kw in query_words for kw in _DOMAIN_KEYWORDS[domain]):
                domain_scores[domain] += weight

    # Normalize to 0-1
    max_score = max(domain_scores.values()) if domain_scores else 1
    topic_interest = {k: round(v / max_score, 3) for k, v in domain_scores.most_common(15)}

    # --- Preferred types ---
    type_counts = Counter(ix.get("resource_type", "article") for ix in interactions)
    total_types = sum(type_counts.values()) or 1
    preferred_types = {k: round(v / total_types, 3) for k, v in type_counts.most_common()}

    # --- Preferred difficulty ---
    diff_counts = Counter(ix.get("difficulty") for ix in interactions if ix.get("difficulty"))
    preferred_difficulty = diff_counts.most_common(1)[0][0] if diff_counts else "intermediate"

    return {
        "topic_interest_scores": topic_interest,
        "preferred_types": preferred_types,
        "preferred_difficulty": preferred_difficulty,
        "total_interactions": len(interactions),
        "last_updated": now.isoformat()
    }


def _time_weight(timestamp_str: str, now: datetime) -> float:
    """Time-decay weight: recent interactions count more."""
    if not timestamp_str:
        return 1.0
    try:
        ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        days_ago = (now - ts).days
        if days_ago <= 7:
            return 2.0
        elif days_ago <= 30:
            return 1.5
        elif days_ago <= 90:
            return 1.0
        return 0.5
    except (ValueError, TypeError):
        return 1.0


# Domain keyword mapping for search topic extraction
_DOMAIN_KEYWORDS = {
    "AI & Machine Learning": ["ai", "machine learning", "deep learning", "neural", "llm", "gpt", "transformer", "nlp"],
    "Cloud Computing": ["cloud", "aws", "azure", "gcp", "kubernetes", "docker", "serverless"],
    "Web Development": ["web", "react", "frontend", "backend", "javascript", "html", "css", "api"],
    "Data Science": ["data", "analytics", "statistics", "pandas", "visualization", "sql", "database"],
    "Cybersecurity": ["security", "cyber", "encryption", "vulnerability", "firewall", "authentication"],
    "DevOps": ["devops", "ci/cd", "pipeline", "deployment", "monitoring", "terraform", "ansible"],
    "Leadership": ["leadership", "management", "team", "strategy", "communication", "coaching"],
    "Business Strategy": ["business", "strategy", "planning", "kpi", "okr", "stakeholder"],
    "Software Engineering": ["software", "architecture", "design pattern", "testing", "agile", "scrum", "python", "java"],
}
