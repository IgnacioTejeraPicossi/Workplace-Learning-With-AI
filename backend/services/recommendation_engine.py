"""
Recommendation Engine — Phase 2
Personalized recommendations blending mastery gaps, interest alignment,
type/difficulty match, and freshness/diversity signals.
"""
import math
from datetime import datetime, timezone
from typing import List, Optional

from backend.db import babel_ai_metadata_collection
from backend.services.learning_profile import get_profile
from backend.services.babel_intelligence import (
    cosine_similarity,
    generate_embedding,
    semantic_search,
)

# Signal weights
W_MASTERY = 0.30
W_INTEREST = 0.30
W_TYPE_DIFF = 0.15
W_FRESHNESS = 0.25

DIFFICULTY_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}


# ---------------------------------------------------------------------------
# Main recommendation function
# ---------------------------------------------------------------------------

async def get_recommendations(user_id: str, limit: int = 12) -> dict:
    """Get personalized recommendations for a user."""
    profile = await get_profile(user_id)

    if not profile or not profile.get("interactions"):
        popular = await get_popular_recommendations(limit)
        return {
            "recommendations": popular,
            "mode": "popular",
            "profile_summary": {"status": "new_user", "total_interactions": 0}
        }

    derived = profile.get("derived") or {}
    interactions = profile.get("interactions", [])

    # Get mastery scores from Knowledge Map
    mastery = await _get_mastery_scores(user_id)

    # Compute user interest vector from recent interaction embeddings
    interest_vector = await _compute_interest_vector(interactions)

    # Get viewed resource IDs for freshness penalty
    viewed = _get_viewed_map(interactions)

    # Score all metadata resources
    cursor = babel_ai_metadata_collection.find({"embedding": {"$exists": True}})
    docs = await cursor.to_list(length=5000)

    scored = []
    for doc in docs:
        score = _score_resource(doc, mastery, derived, interest_vector, viewed)
        scored.append({
            "resource_id": doc.get("resource_id"),
            "resource_type": doc.get("resource_type"),
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "classification": doc.get("classification"),
            "tags": doc.get("tags", []),
            "match_score": round(score * 100),
            "_raw_score": score
        })

    scored.sort(key=lambda x: x["_raw_score"], reverse=True)

    # Diversity pass: ensure no single type dominates top results
    diversified = _diversify(scored, limit)

    # Clean internal fields
    for r in diversified:
        r.pop("_raw_score", None)

    return {
        "recommendations": diversified,
        "mode": "personalized",
        "profile_summary": {
            "status": "active",
            "total_interactions": derived.get("total_interactions", 0),
            "top_interests": list((derived.get("topic_interest_scores") or {}).keys())[:3],
            "preferred_difficulty": derived.get("preferred_difficulty", "intermediate"),
            "preferred_types": derived.get("preferred_types", {})
        }
    }


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def _score_resource(doc: dict, mastery: dict, derived: dict,
                    interest_vector: Optional[list], viewed: dict) -> float:
    """Compute blended score for a single resource."""
    cls = doc.get("classification") or {}
    domain = cls.get("domain", "Other")
    difficulty = cls.get("difficulty", "intermediate")
    rtype = doc.get("resource_type", "article")
    rid = doc.get("resource_id", "")

    # 1. Mastery gap (higher score for topics user hasn't mastered)
    mastery_score = 0.5  # default if no mastery data
    if mastery:
        # Map domain to closest mastery topic
        domain_mastery = _match_domain_to_mastery(domain, mastery)
        if domain_mastery is not None:
            mastery_score = 1.0 - domain_mastery
            # Small penalty for completely unknown topics (might not be interested)
            if domain_mastery == 0:
                mastery_score *= 0.8

    # 2. Interest alignment (cosine similarity with user's interest vector)
    interest_score = 0.3  # default
    if interest_vector and doc.get("embedding"):
        emb = doc["embedding"]
        if len(emb) == len(interest_vector):
            interest_score = max(0, cosine_similarity(interest_vector, emb))

    # Also boost if domain is in user's topic interests
    topic_interests = derived.get("topic_interest_scores") or {}
    if domain in topic_interests:
        interest_score = min(1.0, interest_score + topic_interests[domain] * 0.3)

    # 3. Type/difficulty match
    type_diff_score = 0.5
    pref_types = derived.get("preferred_types") or {}
    if rtype in pref_types:
        type_diff_score = 0.5 + pref_types[rtype] * 0.5  # 0.5 base + up to 0.5 bonus

    pref_diff = derived.get("preferred_difficulty", "intermediate")
    diff_distance = abs(DIFFICULTY_ORDER.get(difficulty, 1) - DIFFICULTY_ORDER.get(pref_diff, 1))
    type_diff_score += (1.0 - diff_distance * 0.4) * 0.3  # up to 0.3 bonus

    type_diff_score = min(1.0, type_diff_score)

    # 4. Freshness/diversity (penalize recently viewed)
    freshness_score = 1.0
    if rid in viewed:
        days_ago = viewed[rid]
        if days_ago <= 7:
            freshness_score = 0.3
        elif days_ago <= 30:
            freshness_score = 0.6
        elif days_ago <= 90:
            freshness_score = 0.85

    return (W_MASTERY * mastery_score +
            W_INTEREST * interest_score +
            W_TYPE_DIFF * type_diff_score +
            W_FRESHNESS * freshness_score)


def _match_domain_to_mastery(domain: str, mastery: dict) -> Optional[float]:
    """Map a classification domain to the closest mastery topic."""
    domain_to_mastery = {
        "AI & Machine Learning": ["machine_learning", "prompt_engineering", "ai_ethics"],
        "Data Science": ["data_analysis", "machine_learning"],
        "Leadership": ["team_leadership", "conflict_resolution", "project_management"],
        "Business Strategy": ["project_management", "sales_negotiation"],
        "Software Engineering": ["prompt_engineering", "data_analysis"],
        "Cybersecurity": [],
        "Cloud Computing": [],
        "Web Development": [],
        "DevOps": [],
        "Workplace Innovation": ["presentation_skills", "customer_service"],
    }

    candidates = domain_to_mastery.get(domain, [])
    scores = [mastery.get(t, 0) for t in candidates if t in mastery]
    return sum(scores) / len(scores) if scores else None


def _get_viewed_map(interactions: list) -> dict:
    """Build resource_id → days_ago map from interactions."""
    now = datetime.now(timezone.utc)
    viewed = {}
    for ix in interactions:
        rid = ix.get("resource_id", "")
        if not rid:
            continue
        try:
            ts = datetime.fromisoformat(ix["timestamp"].replace("Z", "+00:00"))
            days = (now - ts).days
            # Keep the most recent view
            if rid not in viewed or days < viewed[rid]:
                viewed[rid] = days
        except (ValueError, TypeError, KeyError):
            viewed[rid] = 999
    return viewed


def _diversify(scored: list, limit: int) -> list:
    """Ensure type diversity in top results (max 40% of any single type)."""
    result = []
    type_counts = {}
    max_per_type = max(2, limit * 2 // 5)  # 40%

    for r in scored:
        rtype = r.get("resource_type", "article")
        if type_counts.get(rtype, 0) < max_per_type:
            result.append(r)
            type_counts[rtype] = type_counts.get(rtype, 0) + 1
        if len(result) >= limit:
            break

    # Fill remaining if diversity filter was too strict
    if len(result) < limit:
        remaining = [r for r in scored if r not in result]
        result.extend(remaining[:limit - len(result)])

    return result


# ---------------------------------------------------------------------------
# Interest vector
# ---------------------------------------------------------------------------

_interest_cache = {}  # user_id -> (vector, timestamp)
CACHE_TTL = 300  # 5 minutes

async def _compute_interest_vector(interactions: list) -> Optional[list]:
    """Compute weighted average of embeddings from user's recent interactions."""
    recent = interactions[-50:]  # Last 50
    if not recent:
        return None

    resource_ids = [(ix.get("resource_id"), ix.get("resource_type")) for ix in recent if ix.get("resource_id")]
    if not resource_ids:
        return None

    # Fetch embeddings from metadata
    vectors = []
    for rid, rtype in resource_ids:
        meta = await babel_ai_metadata_collection.find_one(
            {"resource_id": rid, "resource_type": rtype or ""},
            {"embedding": 1, "embedding_dim": 1}
        )
        if meta and meta.get("embedding"):
            vectors.append(meta["embedding"])

    if not vectors:
        return None

    # Weighted average (more recent = higher weight)
    dim = len(vectors[0])
    avg = [0.0] * dim
    total_weight = 0
    for i, vec in enumerate(vectors):
        if len(vec) != dim:
            continue
        w = 1.0 + i * 0.1  # Later (more recent) interactions get more weight
        for j in range(dim):
            avg[j] += vec[j] * w
        total_weight += w

    if total_weight > 0:
        avg = [v / total_weight for v in avg]

    # Normalize
    norm = math.sqrt(sum(v * v for v in avg))
    if norm > 0:
        avg = [v / norm for v in avg]

    return avg


# ---------------------------------------------------------------------------
# Mastery scores (direct call to Knowledge Map)
# ---------------------------------------------------------------------------

async def _get_mastery_scores(user_id: str) -> dict:
    """Get mastery scores from Knowledge Map endpoint handler."""
    try:
        from backend.app import get_user_knowledge_map
        result = await get_user_knowledge_map(user_id)
        return result.get("mastery_scores", {})
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# Popular recommendations (fallback for new users)
# ---------------------------------------------------------------------------

async def get_popular_recommendations(limit: int = 12) -> list:
    """Return most recently processed resources, diverse types."""
    cursor = babel_ai_metadata_collection.find(
        {"embedding": {"$exists": True}},
        {"embedding": 0}  # Exclude large field
    ).sort("processed_at", -1).limit(limit * 2)

    docs = await cursor.to_list(length=limit * 2)

    results = []
    type_counts = {}
    max_per_type = max(2, limit // 3)

    for doc in docs:
        rtype = doc.get("resource_type", "article")
        if type_counts.get(rtype, 0) >= max_per_type:
            continue
        results.append({
            "resource_id": doc.get("resource_id"),
            "resource_type": rtype,
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "classification": doc.get("classification"),
            "tags": doc.get("tags", []),
            "match_score": 50  # Neutral score for popular items
        })
        type_counts[rtype] = type_counts.get(rtype, 0) + 1
        if len(results) >= limit:
            break

    return results


# ---------------------------------------------------------------------------
# Learning path generation
# ---------------------------------------------------------------------------

async def generate_learning_path(user_id: str, goal_topic: str,
                                 max_steps: int = 8) -> dict:
    """Generate an ordered learning path for a goal topic."""
    # Find relevant resources via semantic search (Phase 1)
    resources = await semantic_search(goal_topic, limit=30, min_score=0.15)

    if not resources:
        return {"steps": [], "goal": goal_topic, "message": "No resources found for this topic"}

    # Get user's completed resources to filter out
    profile = await get_profile(user_id)
    completed_ids = set()
    if profile:
        for ix in profile.get("interactions", []):
            if ix.get("action") == "complete":
                completed_ids.add(ix.get("resource_id"))

    # Filter out completed
    resources = [r for r in resources if r.get("resource_id") not in completed_ids]

    # Sort by difficulty tier, then by semantic score within tier
    def sort_key(r):
        cls = r.get("classification") or {}
        diff = DIFFICULTY_ORDER.get(cls.get("difficulty", "intermediate"), 1)
        return (diff, -(r.get("semantic_score", 0)))

    resources.sort(key=sort_key)

    # Interleave types for variety
    path = _interleave_types(resources, max_steps)

    # Build steps with reasons
    steps = []
    for i, r in enumerate(path):
        cls = r.get("classification") or {}
        difficulty = cls.get("difficulty", "intermediate")
        steps.append({
            "step": i + 1,
            "resource_id": r.get("resource_id"),
            "title": r.get("title", ""),
            "resource_type": r.get("resource_type", "article"),
            "difficulty": difficulty,
            "domain": cls.get("domain", ""),
            "tags": r.get("tags", [])[:3],
            "semantic_score": r.get("semantic_score", 0),
            "reason": _step_reason(i, difficulty, r.get("resource_type", ""), goal_topic)
        })

    return {"steps": steps, "goal": goal_topic}


def _interleave_types(resources: list, max_steps: int) -> list:
    """Select resources avoiding 3+ consecutive same-type entries."""
    result = []
    last_types = []

    for r in resources:
        rtype = r.get("resource_type", "article")
        # Avoid 3 consecutive same type
        if len(last_types) >= 2 and all(t == rtype for t in last_types[-2:]):
            continue
        result.append(r)
        last_types.append(rtype)
        if len(result) >= max_steps:
            break

    return result


def _step_reason(index: int, difficulty: str, rtype: str, goal: str) -> str:
    """Generate a brief reason for this step in the path."""
    if index == 0:
        return f"Start here: {difficulty} {rtype} to build your foundation in {goal}"
    elif difficulty == "beginner":
        return f"Build fundamentals with this {rtype}"
    elif difficulty == "advanced":
        return f"Deepen your expertise with this advanced {rtype}"
    else:
        return f"Continue your {goal} journey with this {rtype}"
