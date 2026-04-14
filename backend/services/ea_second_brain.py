"""
EA Second Brain Agent — Service Layer
Ketil's 24/7 Enterprise Architecture Watcher

Implements:
- Portfolio CRUD with tech stack tracking
- Insight generation via LLM with Impact Scoring (Ketil 6.0 formula)
- Watchlist management
- Source Feed management
- Ask (natural language queries against portfolio)
- Dashboard statistics
"""

import json
import re
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from bson import ObjectId

from backend.db import (
    ea_portfolio_items_collection,
    ea_watchlists_collection,
    ea_source_feeds_collection,
    ea_insights_collection,
)
from backend.store.ea import recent_insights as store_recent_insights
from backend.store.runs import get_runs

logger = logging.getLogger("ea_second_brain")


# ─── Helpers ────────────────────────────────────────────────────────────────

def _oid(doc: dict) -> dict:
    """Convert MongoDB _id to string 'id' field"""
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


def _oids(docs: list) -> list:
    return [_oid(d) for d in docs]


# ─── Impact Scoring (Ketil 6.0) ────────────────────────────────────────────

def compute_impact_score(relevance: float, criticality: float,
                         freshness: float, risk: float) -> dict:
    """
    ImpactScore = 0.40 * Relevance + 0.30 * Criticality + 0.20 * Freshness + 0.10 * Risk
    All inputs 0.0–1.0, output includes individual components + total.
    """
    total = round(
        0.40 * relevance + 0.30 * criticality + 0.20 * freshness + 0.10 * risk,
        4
    )
    return {
        "relevance": relevance,
        "criticality": criticality,
        "freshness": freshness,
        "risk": risk,
        "total": min(max(total, 0.0), 1.0),
    }


# ─── Portfolio CRUD ─────────────────────────────────────────────────────────

async def create_portfolio_item(data: dict) -> dict:
    """Create a new portfolio item"""
    doc = {
        **data,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "insight_count": 0,
        "risk_score": None,
    }
    res = await ea_portfolio_items_collection.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    del doc["_id"]
    return doc


async def get_portfolio_items(
    lifecycle: str = None,
    criticality_min: int = None,
    criticality_max: int = None,
    owner: str = None,
    tag: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 50,
) -> list:
    """List portfolio items with optional filters"""
    query = {}
    if lifecycle:
        query["lifecycle"] = lifecycle
    if criticality_min is not None or criticality_max is not None:
        crit = {}
        if criticality_min is not None:
            crit["$gte"] = criticality_min
        if criticality_max is not None:
            crit["$lte"] = criticality_max
        query["criticality"] = crit
    if owner:
        query["owner"] = {"$regex": owner, "$options": "i"}
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tech_stack.name": {"$regex": search, "$options": "i"}},
        ]

    cursor = ea_portfolio_items_collection.find(query).sort("criticality", -1).skip(skip).limit(limit)
    docs = [doc async for doc in cursor]
    return _oids(docs)


async def get_portfolio_item(item_id: str) -> Optional[dict]:
    """Get a single portfolio item by ID"""
    try:
        doc = await ea_portfolio_items_collection.find_one({"_id": ObjectId(item_id)})
    except Exception:
        doc = await ea_portfolio_items_collection.find_one({"name": item_id})
    if doc:
        return _oid(doc)
    return None


async def update_portfolio_item(item_id: str, data: dict) -> Optional[dict]:
    """Update a portfolio item"""
    data["updated_at"] = datetime.utcnow()
    try:
        oid = ObjectId(item_id)
    except Exception:
        return None
    result = await ea_portfolio_items_collection.find_one_and_update(
        {"_id": oid},
        {"$set": data},
        return_document=True,
    )
    return _oid(result) if result else None


async def delete_portfolio_item(item_id: str) -> bool:
    """Delete a portfolio item"""
    try:
        result = await ea_portfolio_items_collection.delete_one({"_id": ObjectId(item_id)})
        return result.deleted_count > 0
    except Exception:
        return False


async def get_portfolio_stats() -> dict:
    """Portfolio statistics for dashboard"""
    total = await ea_portfolio_items_collection.count_documents({})
    by_lifecycle = {}
    for status in ["production", "sunset", "pilot", "planned", "decommissioned"]:
        by_lifecycle[status] = await ea_portfolio_items_collection.count_documents({"lifecycle": status})

    by_criticality = {}
    for c in range(1, 6):
        by_criticality[str(c)] = await ea_portfolio_items_collection.count_documents({"criticality": c})

    # Unique technologies
    pipeline = [
        {"$unwind": "$tech_stack"},
        {"$group": {"_id": "$tech_stack.name"}},
        {"$count": "total"},
    ]
    tech_count_result = []
    async for doc in ea_portfolio_items_collection.aggregate(pipeline):
        tech_count_result.append(doc)
    technologies_tracked = tech_count_result[0]["total"] if tech_count_result else 0

    # Average criticality
    avg_pipeline = [
        {"$group": {"_id": None, "avg": {"$avg": "$criticality"}}},
    ]
    avg_result = []
    async for doc in ea_portfolio_items_collection.aggregate(avg_pipeline):
        avg_result.append(doc)
    avg_criticality = round(avg_result[0]["avg"], 2) if avg_result else 0.0

    return {
        "total": total,
        "by_lifecycle": by_lifecycle,
        "by_criticality": by_criticality,
        "technologies_tracked": technologies_tracked,
        "avg_criticality": avg_criticality,
    }


# ─── Technology Heatmap ─────────────────────────────────────────────────────

async def get_technology_heatmap() -> list:
    """
    Returns technology usage across portfolio with risk indicators.
    Each entry: { name, version, count, apps[], eol_date, risk_level }
    """
    pipeline = [
        {"$unwind": "$tech_stack"},
        {"$group": {
            "_id": {
                "name": "$tech_stack.name",
                "version": {"$ifNull": ["$tech_stack.version", "unknown"]},
            },
            "count": {"$sum": 1},
            "apps": {"$push": "$name"},
            "max_criticality": {"$max": "$criticality"},
            "eol_date": {"$first": "$tech_stack.eol_date"},
            "category": {"$first": "$tech_stack.category"},
        }},
        {"$sort": {"count": -1}},
    ]
    results = []
    async for doc in ea_portfolio_items_collection.aggregate(pipeline):
        # Determine risk level based on EOL and criticality
        risk = "low"
        if doc.get("eol_date"):
            try:
                eol = datetime.fromisoformat(doc["eol_date"])
                days_left = (eol - datetime.utcnow()).days
                if days_left < 0:
                    risk = "critical"  # past EOL
                elif days_left < 90:
                    risk = "high"
                elif days_left < 365:
                    risk = "medium"
            except Exception:
                pass
        if doc.get("max_criticality", 0) >= 4 and risk != "low":
            risk = "critical" if risk == "high" else risk

        results.append({
            "name": doc["_id"]["name"],
            "version": doc["_id"]["version"],
            "count": doc["count"],
            "apps": doc["apps"][:10],  # limit for response size
            "eol_date": doc.get("eol_date"),
            "category": doc.get("category"),
            "risk_level": risk,
        })
    return results


# ─── Deprecation Radar ──────────────────────────────────────────────────────

async def get_deprecation_radar() -> list:
    """
    Returns technologies approaching or past EOL.
    Sorted by urgency (past EOL first, then nearest EOL).
    """
    pipeline = [
        {"$unwind": "$tech_stack"},
        {"$match": {"tech_stack.eol_date": {"$ne": None, "$exists": True}}},
        {"$group": {
            "_id": {
                "name": "$tech_stack.name",
                "version": "$tech_stack.version",
                "eol_date": "$tech_stack.eol_date",
            },
            "affected_apps": {"$push": {"name": "$name", "criticality": "$criticality"}},
            "count": {"$sum": 1},
        }},
    ]
    results = []
    now = datetime.utcnow()
    async for doc in ea_portfolio_items_collection.aggregate(pipeline):
        eol_str = doc["_id"].get("eol_date")
        if not eol_str:
            continue
        try:
            eol = datetime.fromisoformat(eol_str)
            days_left = (eol - now).days
        except Exception:
            continue

        status = "expired" if days_left < 0 else "warning" if days_left < 180 else "approaching"
        results.append({
            "technology": doc["_id"]["name"],
            "version": doc["_id"].get("version"),
            "eol_date": eol_str,
            "days_remaining": days_left,
            "status": status,
            "affected_count": doc["count"],
            "affected_apps": doc["affected_apps"][:10],
        })

    # Sort: expired first, then by days remaining ascending
    results.sort(key=lambda x: (0 if x["status"] == "expired" else 1, x["days_remaining"]))
    return results


# ─── Insights CRUD + Generation ─────────────────────────────────────────────

async def get_insights(
    status: str = None,
    category: str = None,
    urgency: str = None,
    limit: int = 50,
    skip: int = 0,
) -> list:
    """Get insights with optional filters"""
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if urgency:
        query["urgency"] = urgency

    cursor = ea_insights_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = [doc async for doc in cursor]
    return _oids(docs)


async def get_insight(insight_id: str) -> Optional[dict]:
    """Get a single insight"""
    doc = await ea_insights_collection.find_one({"insight_id": insight_id})
    if not doc:
        try:
            doc = await ea_insights_collection.find_one({"_id": ObjectId(insight_id)})
        except Exception:
            pass
    return _oid(doc) if doc else None


async def update_insight_status(insight_id: str, status: str, resolved_by: str = None) -> Optional[dict]:
    """Update insight status"""
    update = {"status": status}
    if status in ("resolved", "dismissed"):
        update["resolved_at"] = datetime.utcnow()
        if resolved_by:
            update["resolved_by"] = resolved_by

    result = await ea_insights_collection.find_one_and_update(
        {"insight_id": insight_id},
        {"$set": update},
        return_document=True,
    )
    return _oid(result) if result else None


async def generate_insight(topic: str, context: str = None, request_headers: dict = None) -> dict:
    """
    Generate an insight using LLM analysis.
    Fetches portfolio context, generates analysis, computes impact score.
    """
    try:
        from backend.llm import ask_ai_unified
    except ImportError:
        from llm import ask_ai_unified

    # Get portfolio context for the LLM
    portfolio_items = await get_portfolio_items(limit=20)
    portfolio_summary = ""
    if portfolio_items:
        portfolio_summary = "\n".join([
            f"- {item['name']} (criticality: {item.get('criticality', '?')}, "
            f"lifecycle: {item.get('lifecycle', '?')}, "
            f"tech: {', '.join(t.get('name', '') for t in item.get('tech_stack', [])[:5])})"
            for item in portfolio_items[:15]
        ])

    # Get active watchlist terms
    watchlist_items = await get_watchlist_items(active_only=True)
    watchlist_terms = [w.get("term", "") for w in watchlist_items[:20]]

    system_prompt = f"""You are Ketil's EA Second Brain Agent — an Enterprise Architecture intelligence assistant.
You analyze technology trends, vendor changes, deprecations, security advisories, and compliance updates
to provide actionable insights for the organization's IT portfolio.

CURRENT PORTFOLIO:
{portfolio_summary if portfolio_summary else "(No portfolio items registered yet)"}

WATCHLIST TERMS: {', '.join(watchlist_terms) if watchlist_terms else "(No watchlist configured)"}

Generate a structured insight analysis in JSON format:
{{
  "topic": "Clear insight title",
  "summary_md": "Markdown-formatted analysis (2-4 paragraphs)",
  "category": "one of: deprecation|security|license|performance|vendor|compliance|architecture|cost",
  "urgency": "one of: critical|high|medium|low|info",
  "impact_scores": {{
    "relevance": 0.0-1.0,
    "criticality": 0.0-1.0,
    "freshness": 0.0-1.0,
    "risk": 0.0-1.0
  }},
  "affected_technologies": ["tech1", "tech2"],
  "portfolio_matches": [
    {{"name": "AppName", "score": 0.0-1.0, "reason": "why affected"}}
  ],
  "recommended_actions": [
    {{"title": "Action title", "detail": "Description", "assignee": "role/team"}}
  ],
  "evidence": [
    {{"source": "Source name", "snippet": "Key finding"}}
  ]
}}

Be specific, actionable, and relevant to the portfolio. Focus on real risks and opportunities."""

    user_prompt = f"Analyze the following topic for EA impact:\n\nTopic: {topic}"
    if context:
        user_prompt += f"\n\nAdditional context: {context}"

    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1500,
            temperature=0.3,
            request_headers=request_headers,
        )

        parsed = _parse_insight_response(result)
    except Exception as e:
        logger.error(f"LLM insight generation failed: {e}")
        parsed = None

    # Create insight document
    insight_id = f"INS-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()

    if parsed:
        scores = parsed.get("impact_scores", {})
        impact = compute_impact_score(
            relevance=scores.get("relevance", 0.5),
            criticality=scores.get("criticality", 0.5),
            freshness=scores.get("freshness", 0.8),
            risk=scores.get("risk", 0.5),
        )
        doc = {
            "insight_id": insight_id,
            "topic": parsed.get("topic", topic),
            "summary_md": parsed.get("summary_md", f"Analysis of {topic} pending."),
            "category": parsed.get("category", "architecture"),
            "urgency": parsed.get("urgency", "medium"),
            "impact_score": impact,
            "evidence": [
                {"url": "", "source": e.get("source", ""), "snippet": e.get("snippet", "")}
                for e in parsed.get("evidence", [])
            ],
            "portfolio_matches": [
                {"id": "", "name": m.get("name", ""), "score": m.get("score", 0.5), "reason": m.get("reason", "")}
                for m in parsed.get("portfolio_matches", [])
            ],
            "recommended_actions": parsed.get("recommended_actions", []),
            "affected_technologies": parsed.get("affected_technologies", []),
            "created_at": now,
            "status": "pending",
        }
    else:
        # Fallback: create minimal insight
        doc = {
            "insight_id": insight_id,
            "topic": topic,
            "summary_md": f"Insight generation for **{topic}** requires manual analysis. The AI service was unavailable or returned an unparseable response.",
            "category": "architecture",
            "urgency": "low",
            "impact_score": compute_impact_score(0.5, 0.5, 0.8, 0.3),
            "evidence": [],
            "portfolio_matches": [],
            "recommended_actions": [{"title": "Manual review required", "detail": f"Review {topic} manually"}],
            "affected_technologies": [],
            "created_at": now,
            "status": "pending",
        }

    await ea_insights_collection.insert_one(doc)
    return _oid(doc)


def _parse_insight_response(raw: str) -> Optional[dict]:
    """Parse LLM response — tries JSON direct, then regex extraction, then markdown fallback"""
    if not raw or "[MOCKED RESPONSE]" in raw:
        return None

    # Try 1: direct JSON parse
    try:
        return json.loads(raw)
    except Exception:
        pass

    # Try 2: extract JSON block from markdown
    json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', raw)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except Exception:
            pass

    # Try 3: find first { ... } block
    brace_match = re.search(r'\{[\s\S]*\}', raw)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except Exception:
            pass

    return None


# ─── Watchlist CRUD ─────────────────────────────────────────────────────────

async def create_watchlist_item(data: dict) -> dict:
    """Create a watchlist item"""
    doc = {
        **data,
        "created_at": datetime.utcnow(),
        "last_triggered": None,
        "trigger_count": 0,
    }
    res = await ea_watchlists_collection.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    del doc["_id"]
    return doc


async def get_watchlist_items(active_only: bool = False, limit: int = 100) -> list:
    """Get watchlist items"""
    query = {"active": True} if active_only else {}
    cursor = ea_watchlists_collection.find(query).sort("created_at", -1).limit(limit)
    docs = [doc async for doc in cursor]
    return _oids(docs)


async def update_watchlist_item(item_id: str, data: dict) -> Optional[dict]:
    """Update a watchlist item"""
    try:
        oid = ObjectId(item_id)
    except Exception:
        return None
    result = await ea_watchlists_collection.find_one_and_update(
        {"_id": oid},
        {"$set": data},
        return_document=True,
    )
    return _oid(result) if result else None


async def delete_watchlist_item(item_id: str) -> bool:
    """Delete a watchlist item"""
    try:
        result = await ea_watchlists_collection.delete_one({"_id": ObjectId(item_id)})
        return result.deleted_count > 0
    except Exception:
        return False


# ─── Source Feeds CRUD ──────────────────────────────────────────────────────

async def create_source_feed(data: dict) -> dict:
    """Create a source feed"""
    doc = {
        **data,
        "created_at": datetime.utcnow(),
        "last_polled": None,
        "items_fetched": 0,
        "status": "idle",
    }
    res = await ea_source_feeds_collection.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    del doc["_id"]
    return doc


async def get_source_feeds(active_only: bool = False, limit: int = 50) -> list:
    """Get source feeds"""
    query = {"active": True} if active_only else {}
    cursor = ea_source_feeds_collection.find(query).sort("created_at", -1).limit(limit)
    docs = [doc async for doc in cursor]
    return _oids(docs)


async def update_source_feed(feed_id: str, data: dict) -> Optional[dict]:
    """Update a source feed"""
    try:
        oid = ObjectId(feed_id)
    except Exception:
        return None
    result = await ea_source_feeds_collection.find_one_and_update(
        {"_id": oid},
        {"$set": data},
        return_document=True,
    )
    return _oid(result) if result else None


async def delete_source_feed(feed_id: str) -> bool:
    """Delete a source feed"""
    try:
        result = await ea_source_feeds_collection.delete_one({"_id": ObjectId(feed_id)})
        return result.deleted_count > 0
    except Exception:
        return False


# ─── Ask (Natural Language Queries) ─────────────────────────────────────────

async def ask_portfolio(question: str, context: str = None,
                        include_insights: bool = True,
                        include_portfolio: bool = True,
                        request_headers: dict = None) -> dict:
    """
    Natural language query against the EA portfolio.
    Uses LLM with portfolio context to answer questions.
    """
    try:
        from backend.llm import ask_ai_unified
    except ImportError:
        from llm import ask_ai_unified

    # Build context from portfolio
    portfolio_context = ""
    if include_portfolio:
        items = await get_portfolio_items(limit=30)
        if items:
            portfolio_context = "PORTFOLIO ITEMS:\n"
            for item in items:
                techs = ", ".join(t.get("name", "") + (f" v{t.get('version', '')}" if t.get("version") else "")
                                  for t in item.get("tech_stack", []))
                deps = ", ".join(item.get("dependencies", [])[:5])
                portfolio_context += (
                    f"- {item['name']}: {item.get('description', 'N/A')} | "
                    f"Owner: {item.get('owner', 'N/A')} | Team: {item.get('team', 'N/A')} | "
                    f"Criticality: {item.get('criticality', '?')}/5 | "
                    f"Lifecycle: {item.get('lifecycle', '?')} | "
                    f"Tech: [{techs}] | Dependencies: [{deps}]\n"
                )

    # Build context from insights
    insights_context = ""
    if include_insights:
        insights = await get_insights(limit=15)
        if insights:
            insights_context = "\nRECENT INSIGHTS:\n"
            for ins in insights:
                score = ins.get("impact_score", {})
                insights_context += (
                    f"- [{ins.get('urgency', '?').upper()}] {ins.get('topic', 'N/A')} "
                    f"(category: {ins.get('category', '?')}, impact: {score.get('total', '?')}) — "
                    f"{ins.get('status', '?')}\n"
                )

    system_prompt = f"""You are Ketil's EA Second Brain — an Enterprise Architecture intelligence assistant.
Answer questions about the organization's IT portfolio, technology landscape, and architectural decisions.

{portfolio_context}
{insights_context}

Provide your answer in JSON format:
{{
  "answer_md": "Markdown-formatted answer",
  "confidence": 0.0-1.0,
  "related_items": ["portfolio item names mentioned"],
  "related_insights": ["insight topics mentioned"],
  "suggestions": ["2-3 follow-up questions the user might want to ask"]
}}

Be specific, reference actual portfolio items and data. If information is insufficient, say so honestly."""

    user_prompt = question
    if context:
        user_prompt += f"\n\nContext: {context}"

    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1200,
            temperature=0.4,
            request_headers=request_headers,
        )

        parsed = _parse_insight_response(result)
        if parsed:
            return {
                "answer_md": parsed.get("answer_md", result),
                "confidence": parsed.get("confidence", 0.5),
                "related_portfolio_items": [
                    {"id": "", "name": n, "score": 0.8, "reason": "Mentioned in answer"}
                    for n in parsed.get("related_items", [])
                ],
                "related_insights": parsed.get("related_insights", []),
                "suggestions": parsed.get("suggestions", []),
                "sources": [],
            }
        else:
            # Unparseable but we got text — return as plain answer
            return {
                "answer_md": result if result else "Unable to generate answer.",
                "confidence": 0.3,
                "related_portfolio_items": [],
                "related_insights": [],
                "suggestions": ["Can you rephrase the question?"],
                "sources": [],
            }
    except Exception as e:
        logger.error(f"Ask failed: {e}")
        return {
            "answer_md": f"I'm unable to answer right now. Error: {str(e)}",
            "confidence": 0.0,
            "related_portfolio_items": [],
            "related_insights": [],
            "suggestions": [],
            "sources": [],
        }


# ─── Dashboard Stats ────────────────────────────────────────────────────────

async def get_dashboard_stats() -> dict:
    """Comprehensive dashboard statistics"""
    # Portfolio
    portfolio_total = await ea_portfolio_items_collection.count_documents({})
    portfolio_stats = await get_portfolio_stats() if portfolio_total > 0 else {}

    # Insights
    insights_total = await ea_insights_collection.count_documents({})
    pending_insights = await ea_insights_collection.count_documents({"status": "pending"})
    critical_insights = await ea_insights_collection.count_documents({"urgency": {"$in": ["critical", "high"]}})

    # Deprecation warnings
    deprecation_count = await ea_insights_collection.count_documents({"category": "deprecation", "status": {"$ne": "resolved"}})

    # Watchlist
    watchlist_total = await ea_watchlists_collection.count_documents({})
    watchlist_active = await ea_watchlists_collection.count_documents({"active": True})

    # Source feeds
    feeds_total = await ea_source_feeds_collection.count_documents({})
    feeds_active = await ea_source_feeds_collection.count_documents({"active": True})

    # Runs
    runs = await get_runs(module="ea", limit=100)
    total_runs = len(runs)
    successful_runs = sum(1 for r in runs if r.get("status") == "DONE")

    # Today's insights
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    todays_insights = await ea_insights_collection.count_documents({"created_at": {"$gte": today_start}})

    return {
        "total_portfolio_items": portfolio_total,
        "portfolio_by_lifecycle": portfolio_stats.get("by_lifecycle", {}),
        "portfolio_by_criticality": portfolio_stats.get("by_criticality", {}),
        "technologies_tracked": portfolio_stats.get("technologies_tracked", 0),
        "avg_criticality": portfolio_stats.get("avg_criticality", 0.0),
        "total_insights": insights_total,
        "pending_insights": pending_insights,
        "critical_insights": critical_insights,
        "todays_insights": todays_insights,
        "deprecation_warnings": deprecation_count,
        "total_watchlist_items": watchlist_total,
        "active_watchlist_items": watchlist_active,
        "total_source_feeds": feeds_total,
        "active_source_feeds": feeds_active,
        "total_runs": total_runs,
        "successful_runs": successful_runs,
    }
