"""
Babel Library Predictive Intelligence Service — Phase 4
Trend analysis, demand forecasting, knowledge gap detection,
and network expertise insights. Pure aggregation — no LLM calls.
"""
import math
from collections import Counter
from datetime import datetime, timezone, timedelta

from backend.db import babel_ai_metadata_collection, learning_profiles_collection

from backend.services.babel_intelligence import VALID_DOMAINS, RESOURCE_COLLECTIONS


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _days_ago(iso_str: str) -> float:
    """Return how many days ago an ISO timestamp is."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except Exception:
        return 999


def _time_bucket(days: float) -> str:
    """Map days-ago into a named bucket for trend windows."""
    if days <= 7:
        return "7d"
    if days <= 30:
        return "30d"
    if days <= 90:
        return "90d"
    return "older"


# ---------------------------------------------------------------------------
# 1. Trend Analysis
# ---------------------------------------------------------------------------

async def get_trend_analysis() -> dict:
    """
    Detect trending topics by comparing interaction volume across time windows.
    Returns domain trends (rising/stable/declining) and top trending tags.
    """
    # Gather all user interactions across all profiles
    profiles = await learning_profiles_collection.find(
        {}, {"interactions": 1}
    ).to_list(length=5000)

    domain_buckets = {}  # domain -> { "7d": count, "30d": count, "90d": count, "older": count }
    tag_buckets = {}     # tag -> { "7d": count, "30d": count, ... }
    search_topics = Counter()  # domain from recent searches

    for profile in profiles:
        for interaction in (profile.get("interactions") or []):
            ts = interaction.get("timestamp", "")
            days = _days_ago(ts)
            bucket = _time_bucket(days)

            domain = interaction.get("domain") or "Other"
            domain_buckets.setdefault(domain, Counter())[bucket] += 1

            for tag in (interaction.get("tags") or []):
                tag_buckets.setdefault(tag, Counter())[bucket] += 1

    # Compute trend direction per domain
    domain_trends = []
    for domain in VALID_DOMAINS:
        buckets = domain_buckets.get(domain, Counter())
        recent = buckets.get("7d", 0) * 4    # normalize to ~monthly rate
        mid = buckets.get("30d", 0)
        older = buckets.get("90d", 0) / 3    # normalize to ~monthly rate

        total = sum(buckets.values())
        if total == 0:
            direction = "no_data"
            momentum = 0
        elif recent > mid * 1.3:
            direction = "rising"
            momentum = round(min((recent / max(mid, 1) - 1) * 100, 200))
        elif recent < mid * 0.7 and mid > 0:
            direction = "declining"
            momentum = round(max((recent / max(mid, 1) - 1) * 100, -100))
        else:
            direction = "stable"
            momentum = 0

        domain_trends.append({
            "domain": domain,
            "direction": direction,
            "momentum": momentum,
            "total_interactions": total,
            "recent_7d": buckets.get("7d", 0),
            "recent_30d": buckets.get("30d", 0)
        })

    domain_trends.sort(key=lambda x: x["recent_7d"], reverse=True)

    # Top trending tags (by 7d volume)
    tag_trends = []
    for tag, buckets in tag_buckets.items():
        recent = buckets.get("7d", 0)
        if recent > 0:
            tag_trends.append({"tag": tag, "recent_7d": recent, "total": sum(buckets.values())})
    tag_trends.sort(key=lambda x: x["recent_7d"], reverse=True)

    return {
        "domain_trends": domain_trends,
        "trending_tags": tag_trends[:15],
        "total_profiles_analyzed": len(profiles)
    }


# ---------------------------------------------------------------------------
# 2. Demand Forecasting
# ---------------------------------------------------------------------------

async def get_demand_forecast() -> dict:
    """
    Compare search demand (what users look for) vs resource supply
    (what's available) to identify under-served and over-served areas.
    """
    # Supply: count classified resources per domain
    supply = Counter()
    cursor = babel_ai_metadata_collection.find(
        {"classification.domain": {"$exists": True}},
        {"classification.domain": 1}
    )
    async for doc in cursor:
        domain = (doc.get("classification") or {}).get("domain", "Other")
        supply[domain] += 1

    total_supply = sum(supply.values()) or 1

    # Demand: aggregate search queries + interactions from profiles
    demand = Counter()
    profiles = await learning_profiles_collection.find(
        {}, {"interactions": 1, "search_history": 1}
    ).to_list(length=5000)

    from backend.services.learning_profile import _DOMAIN_KEYWORDS

    for profile in profiles:
        # Interaction-based demand
        for interaction in (profile.get("interactions") or []):
            domain = interaction.get("domain") or "Other"
            days = _days_ago(interaction.get("timestamp", ""))
            weight = 2.0 if days <= 7 else 1.5 if days <= 30 else 1.0 if days <= 90 else 0.5
            demand[domain] += weight

        # Search-based demand
        for entry in (profile.get("search_history") or []):
            query = (entry.get("query") or "").lower()
            for domain, keywords in _DOMAIN_KEYWORDS.items():
                if any(kw in query for kw in keywords):
                    days = _days_ago(entry.get("timestamp", ""))
                    weight = 2.0 if days <= 7 else 1.5 if days <= 30 else 1.0
                    demand[domain] += weight

    total_demand = sum(demand.values()) or 1

    # Build demand-supply gap analysis per domain
    forecast = []
    for domain in VALID_DOMAINS:
        supply_pct = round(supply.get(domain, 0) / total_supply * 100, 1)
        demand_pct = round(demand.get(domain, 0) / total_demand * 100, 1)
        gap = round(demand_pct - supply_pct, 1)

        if gap > 10:
            status = "under_served"
        elif gap < -10:
            status = "over_served"
        else:
            status = "balanced"

        forecast.append({
            "domain": domain,
            "supply_count": supply.get(domain, 0),
            "supply_pct": supply_pct,
            "demand_score": round(demand.get(domain, 0), 1),
            "demand_pct": demand_pct,
            "gap": gap,
            "status": status
        })

    forecast.sort(key=lambda x: x["gap"], reverse=True)

    return {
        "forecast": forecast,
        "total_resources": sum(supply.values()),
        "total_demand_signals": round(sum(demand.values()))
    }


# ---------------------------------------------------------------------------
# 3. Knowledge Gap Analysis
# ---------------------------------------------------------------------------

async def get_knowledge_gaps(user_id: str = None) -> dict:
    """
    Identify knowledge gaps: domains where resources exist but user
    engagement/mastery is low, or where users show interest but
    haven't explored deeply.
    """
    # Available resources per domain + difficulty
    supply_matrix = {}  # domain -> { beginner: N, intermediate: N, advanced: N }
    cursor = babel_ai_metadata_collection.find(
        {"classification": {"$exists": True}},
        {"classification": 1}
    )
    async for doc in cursor:
        cls = doc.get("classification") or {}
        domain = cls.get("domain", "Other")
        diff = cls.get("difficulty", "intermediate")
        supply_matrix.setdefault(domain, Counter())[diff] += 1

    # If specific user, analyze their gaps
    user_gaps = []
    if user_id:
        profile = await learning_profiles_collection.find_one({"user_id": user_id})
        if profile:
            derived = profile.get("derived") or {}
            topic_scores = derived.get("topic_interest_scores") or {}

            # Interaction coverage per domain
            interaction_domains = Counter()
            for interaction in (profile.get("interactions") or []):
                d = interaction.get("domain") or "Other"
                interaction_domains[d] += 1

            total_interactions = sum(interaction_domains.values()) or 1

            for domain in VALID_DOMAINS:
                available = sum((supply_matrix.get(domain) or {}).values())
                interest = topic_scores.get(domain, 0)
                engagement = interaction_domains.get(domain, 0) / total_interactions
                coverage = round(engagement * 100, 1)

                # Gap = high interest or high supply but low engagement
                if available > 0 and coverage < 10 and interest > 0.3:
                    gap_type = "interest_gap"
                    severity = "high"
                elif available > 3 and coverage < 5:
                    gap_type = "exploration_gap"
                    severity = "medium"
                elif interest > 0.5 and available == 0:
                    gap_type = "content_gap"
                    severity = "high"
                else:
                    gap_type = "none"
                    severity = "low"

                if gap_type != "none":
                    user_gaps.append({
                        "domain": domain,
                        "gap_type": gap_type,
                        "severity": severity,
                        "interest_score": round(interest, 2),
                        "engagement_pct": coverage,
                        "available_resources": available,
                        "difficulty_breakdown": dict(supply_matrix.get(domain, {}))
                    })

            user_gaps.sort(key=lambda x: 0 if x["severity"] == "high" else 1)

    # Platform-wide: domains with lowest overall engagement
    all_profiles = await learning_profiles_collection.find(
        {}, {"interactions": 1}
    ).to_list(length=5000)

    platform_engagement = Counter()
    for profile in all_profiles:
        for interaction in (profile.get("interactions") or []):
            d = interaction.get("domain") or "Other"
            platform_engagement[d] += 1

    total_platform = sum(platform_engagement.values()) or 1

    platform_gaps = []
    for domain in VALID_DOMAINS:
        available = sum((supply_matrix.get(domain) or {}).values())
        eng_pct = round(platform_engagement.get(domain, 0) / total_platform * 100, 1)
        if available > 0:
            utilization = round(eng_pct / max(available, 1), 2)
        else:
            utilization = 0

        platform_gaps.append({
            "domain": domain,
            "available_resources": available,
            "engagement_pct": eng_pct,
            "utilization": utilization,
            "difficulty_breakdown": dict(supply_matrix.get(domain, {}))
        })

    platform_gaps.sort(key=lambda x: x["utilization"])

    return {
        "user_gaps": user_gaps,
        "platform_gaps": platform_gaps,
        "domains_analyzed": len(VALID_DOMAINS)
    }


# ---------------------------------------------------------------------------
# 4. Network Expertise Insights
# ---------------------------------------------------------------------------

async def get_expertise_distribution() -> dict:
    """
    Aggregate expertise distribution across all users: which domains
    have the most active learners, and identify power users per domain.
    """
    profiles = await learning_profiles_collection.find(
        {}, {"user_id": 1, "interactions": 1, "derived": 1}
    ).to_list(length=5000)

    domain_learners = {}  # domain -> [{ user_id, interaction_count, preferred_difficulty }]
    difficulty_dist = Counter()  # beginner/intermediate/advanced counts

    for profile in profiles:
        uid = profile.get("user_id", "unknown")
        derived = profile.get("derived") or {}
        pref_diff = derived.get("preferred_difficulty", "intermediate")
        difficulty_dist[pref_diff] += 1

        # Count interactions per domain for this user
        user_domains = Counter()
        for interaction in (profile.get("interactions") or []):
            d = interaction.get("domain") or "Other"
            user_domains[d] += 1

        for domain, count in user_domains.items():
            domain_learners.setdefault(domain, []).append({
                "user_id": uid,
                "interaction_count": count,
                "preferred_difficulty": pref_diff
            })

    # Summarize per domain
    domain_summary = []
    for domain in VALID_DOMAINS:
        learners = domain_learners.get(domain, [])
        total_learners = len(learners)
        total_interactions = sum(l["interaction_count"] for l in learners)
        top_learners = sorted(learners, key=lambda x: x["interaction_count"], reverse=True)[:3]

        domain_summary.append({
            "domain": domain,
            "active_learners": total_learners,
            "total_interactions": total_interactions,
            "avg_interactions": round(total_interactions / max(total_learners, 1), 1),
            "top_learners_count": len(top_learners)
        })

    domain_summary.sort(key=lambda x: x["active_learners"], reverse=True)

    return {
        "domain_expertise": domain_summary,
        "difficulty_distribution": dict(difficulty_dist),
        "total_learners": len(profiles)
    }


# ---------------------------------------------------------------------------
# 5. Combined Dashboard
# ---------------------------------------------------------------------------

async def get_predictive_dashboard(user_id: str = None) -> dict:
    """Return all predictive analytics in a single call for the frontend."""
    trends = await get_trend_analysis()
    demand = await get_demand_forecast()
    gaps = await get_knowledge_gaps(user_id)
    expertise = await get_expertise_distribution()

    return {
        "trends": trends,
        "demand": demand,
        "gaps": gaps,
        "expertise": expertise,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
