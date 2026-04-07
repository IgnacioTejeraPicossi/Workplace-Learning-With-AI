"""
Babel Library Intelligence Service — Phase 1
Automatic classification, LLM-powered tagging, and semantic search via embeddings.
"""
import asyncio
import json
import math
import re
from datetime import datetime, timezone
from functools import lru_cache
from typing import List, Optional

from backend.db import babel_ai_metadata_collection, database
from backend.services.agentic_rag.your_embeddings import embed_small

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_DOMAINS = [
    "AI & Machine Learning", "Cloud Computing", "Web Development",
    "Data Science", "Cybersecurity", "DevOps", "Leadership",
    "Business Strategy", "Software Engineering", "Workplace Innovation", "Other"
]

VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"]

CLASSIFY_SYSTEM_PROMPT = """You are a library content classifier. Given a resource's title, description, and type, return ONLY a valid JSON object with this exact structure:
{
  "domain": "<one of: AI & Machine Learning, Cloud Computing, Web Development, Data Science, Cybersecurity, DevOps, Leadership, Business Strategy, Software Engineering, Workplace Innovation, Other>",
  "difficulty": "<beginner|intermediate|advanced>",
  "audience": "<developers|data scientists|managers|researchers|students|general>",
  "tags": ["tag1", "tag2", "tag3"]
}
Rules:
- tags: lowercase, hyphenated if multi-word, 3-7 tags
- Return ONLY the JSON object, no markdown, no explanation"""

# Maps MongoDB collection names to field extraction info
RESOURCE_COLLECTIONS = {
    "saved_videos":        {"title_field": "title",     "desc_field": "description", "type": "video"},
    "certifications":      {"title_field": "title",     "desc_field": "description", "type": "course"},
    "micro_lessons":       {"title_field": "title",     "desc_field": "content",     "type": "article"},
    "web_search":          {"title_field": "title",     "desc_field": "snippet",     "type": "article"},
    "skills_forecasts":    {"title_field": "title",     "desc_field": "description", "type": "article"},
    "career_coach":        {"title_field": "title",     "desc_field": "content",     "type": "simulation"},
    "simulation_results":  {"title_field": "title",     "desc_field": "description", "type": "simulation"},
    "document_analyses":   {"title_field": "filename",  "desc_field": "summary",     "type": "analysis"},
    "repo_analyses":       {"title_field": "repo_name", "desc_field": "summary",     "type": "analysis"},
}

# Batch processing state (in-memory, single-process)
_batch_state = {"running": False, "total": 0, "processed": 0, "failed": 0, "skipped": 0}


# ---------------------------------------------------------------------------
# LLM Classification + Tagging
# ---------------------------------------------------------------------------

async def classify_and_tag(title: str, description: str, resource_type: str,
                           request_headers: dict = None) -> Optional[dict]:
    """Classify and tag a resource using the LLM. Returns dict or None on failure."""
    try:
        from backend.llm import ask_ai_unified
    except ImportError:
        from llm import ask_ai_unified

    user_prompt = (
        f"Resource type: {resource_type}\n"
        f"Title: {title}\n"
        f"Description: {description[:500] if description else 'No description'}"
    )

    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=256,
            temperature=0.1,
            request_headers=request_headers
        )

        if not result or result.startswith("[MOCKED RESPONSE"):
            return None

        return _parse_classification(result)
    except Exception as e:
        print(f"[BabelIntel] Classification error: {e}")
        return None


def _parse_classification(raw: str) -> Optional[dict]:
    """Extract and validate JSON classification from LLM response."""
    # Try direct parse first
    try:
        data = json.loads(raw.strip())
        return _validate_classification(data)
    except json.JSONDecodeError:
        pass

    # Regex fallback: find first {...}
    match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            return _validate_classification(data)
        except json.JSONDecodeError:
            pass

    # Try to find JSON in markdown code block
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            return _validate_classification(data)
        except json.JSONDecodeError:
            pass

    print(f"[BabelIntel] Failed to parse LLM response: {raw[:200]}")
    return None


def _validate_classification(data: dict) -> dict:
    """Normalize and validate classification fields."""
    domain = data.get("domain", "Other")
    if domain not in VALID_DOMAINS:
        domain = "Other"

    difficulty = data.get("difficulty", "intermediate").lower()
    if difficulty not in VALID_DIFFICULTIES:
        difficulty = "intermediate"

    audience = data.get("audience", "general")
    tags = data.get("tags", [])
    if not isinstance(tags, list):
        tags = []
    tags = [str(t).lower().strip() for t in tags[:10] if t]

    return {
        "classification": {
            "domain": domain,
            "difficulty": difficulty,
            "audience": audience
        },
        "tags": tags
    }


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------

def generate_embedding(text: str) -> tuple:
    """Generate embedding for text. Returns (vector, model_name, dimensions)."""
    combined = text[:1000]  # Limit input length
    vector = embed_small(combined)
    dim = len(vector)
    model_name = "all-MiniLM-L6-v2" if dim == 384 else "sha256-hash-fallback"
    return vector, model_name, dim


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

async def semantic_search(query: str, limit: int = 20,
                          resource_types: List[str] = None,
                          min_score: float = 0.25) -> List[dict]:
    """Semantic search using cosine similarity on stored embeddings."""
    query_vec, _, query_dim = generate_embedding(query)

    # Load metadata from MongoDB
    filter_q = {"embedding": {"$exists": True}, "embedding_dim": query_dim}
    if resource_types:
        filter_q["resource_type"] = {"$in": resource_types}

    cursor = babel_ai_metadata_collection.find(filter_q)
    docs = await cursor.to_list(length=5000)

    scored = []
    for doc in docs:
        emb = doc.get("embedding")
        if not emb or len(emb) != query_dim:
            continue
        score = cosine_similarity(query_vec, emb)
        if score >= min_score:
            scored.append({
                "resource_id": doc.get("resource_id"),
                "resource_type": doc.get("resource_type"),
                "title": doc.get("title", ""),
                "description": doc.get("description", ""),
                "classification": doc.get("classification"),
                "tags": doc.get("tags", []),
                "semantic_score": round(score, 4)
            })

    scored.sort(key=lambda x: x["semantic_score"], reverse=True)
    return scored[:limit]


def _keyword_score(resource: dict, query: str) -> float:
    """Simple keyword scoring (normalized 0-1)."""
    words = query.lower().split()
    if not words:
        return 0.0
    title = (resource.get("title") or "").lower()
    desc = (resource.get("description") or "").lower()
    tags = " ".join(resource.get("tags") or []).lower()

    score = 0
    for w in words:
        if w in title:
            score += 10
        if w in desc:
            score += 4
        if w in tags:
            score += 7
    # Normalize: max reasonable score per word is ~21
    max_possible = len(words) * 21
    return min(score / max_possible, 1.0) if max_possible > 0 else 0.0


async def hybrid_search(query: str, limit: int = 20,
                        resource_types: List[str] = None) -> dict:
    """Combine semantic (0.6) + keyword (0.4) scoring."""
    semantic_results = await semantic_search(query, limit=100, resource_types=resource_types, min_score=0.15)

    if not semantic_results:
        return {"results": [], "insights": _build_insights([], query), "mode": "no-embeddings"}

    # Compute hybrid scores
    for r in semantic_results:
        kw_score = _keyword_score(r, query)
        r["keyword_score"] = round(kw_score, 4)
        r["_score"] = round(r["semantic_score"] * 0.6 + kw_score * 0.4, 4)

    semantic_results.sort(key=lambda x: x["_score"], reverse=True)
    results = semantic_results[:limit]

    return {
        "results": results,
        "insights": _build_insights(results, query),
        "mode": "hybrid"
    }


def _build_insights(results: list, query: str) -> dict:
    """Build insights dict for the frontend."""
    if not results:
        return {"totalFound": 0, "coverage": 0, "topType": None, "topTopic": None, "relatedTopics": []}

    type_counts = {}
    domain_counts = {}
    all_tags = []
    for r in results:
        rtype = r.get("resource_type", "unknown")
        type_counts[rtype] = type_counts.get(rtype, 0) + 1
        cls = r.get("classification") or {}
        domain = cls.get("domain", "Other")
        domain_counts[domain] = domain_counts.get(domain, 0) + 1
        all_tags.extend(r.get("tags", []))

    top_type = max(type_counts, key=type_counts.get) if type_counts else None
    top_domain = max(domain_counts, key=domain_counts.get) if domain_counts else None

    # Suggest related tags not in query
    query_lower = query.lower()
    related = list({t for t in all_tags if t not in query_lower})[:5]

    return {
        "totalFound": len(results),
        "coverage": round(len(results) / max(1, len(results)) * 100),
        "topType": {"name": top_type, "count": type_counts.get(top_type, 0)} if top_type else None,
        "topTopic": {"name": top_domain, "count": domain_counts.get(top_domain, 0)} if top_domain else None,
        "relatedTopics": related
    }


# ---------------------------------------------------------------------------
# Process (classify + embed) single resource
# ---------------------------------------------------------------------------

async def process_single_resource(
    resource_id: str,
    resource_type: str,
    title: str,
    description: str,
    source_collection: str = "",
    request_headers: dict = None
) -> dict:
    """Classify, tag, embed, and upsert metadata for one resource."""
    text_for_embedding = f"{title}. {description or ''}"
    embedding, model_name, dim = generate_embedding(text_for_embedding)

    classification_data = await classify_and_tag(title, description, resource_type, request_headers)

    doc = {
        "resource_id": resource_id,
        "resource_type": resource_type,
        "source_collection": source_collection,
        "title": title,
        "description": (description or "")[:500],
        "classification": classification_data.get("classification") if classification_data else None,
        "tags": classification_data.get("tags", []) if classification_data else [],
        "embedding": embedding,
        "embedding_model": model_name,
        "embedding_dim": dim,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "llm_classified": classification_data is not None,
        "version": 1
    }

    await babel_ai_metadata_collection.update_one(
        {"resource_id": resource_id, "resource_type": resource_type},
        {"$set": doc},
        upsert=True
    )

    return doc


# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------

def get_batch_status() -> dict:
    return dict(_batch_state)


async def process_all_resources(request_headers: dict = None, delay: float = 0.3):
    """Batch-process all resources across all known collections."""
    global _batch_state
    if _batch_state["running"]:
        return {"error": "Batch already running"}

    _batch_state.update({"running": True, "total": 0, "processed": 0, "failed": 0, "skipped": 0})

    try:
        # Count total resources first
        total = 0
        for col_name in RESOURCE_COLLECTIONS:
            collection = database.get_collection(col_name)
            total += await collection.count_documents({})
        _batch_state["total"] = total

        # Process each collection
        for col_name, mapping in RESOURCE_COLLECTIONS.items():
            collection = database.get_collection(col_name)
            cursor = collection.find({})
            docs = await cursor.to_list(length=5000)

            for doc in docs:
                rid = str(doc.get("_id", ""))
                title = doc.get(mapping["title_field"], "") or ""
                desc = doc.get(mapping["desc_field"], "") or ""
                rtype = mapping["type"]

                if not title:
                    _batch_state["skipped"] += 1
                    continue

                try:
                    await process_single_resource(
                        resource_id=rid,
                        resource_type=rtype,
                        title=title,
                        description=desc,
                        source_collection=col_name,
                        request_headers=request_headers
                    )
                    _batch_state["processed"] += 1
                except Exception as e:
                    print(f"[BabelIntel] Batch error on {rid}: {e}")
                    _batch_state["failed"] += 1

                if delay > 0:
                    await asyncio.sleep(delay)

    finally:
        _batch_state["running"] = False

    return get_batch_status()


async def get_stats() -> dict:
    """Get stats about classified/embedded resources."""
    total = await babel_ai_metadata_collection.count_documents({})
    classified = await babel_ai_metadata_collection.count_documents({"llm_classified": True})
    embedded = await babel_ai_metadata_collection.count_documents({"embedding": {"$exists": True}})
    return {
        "total_metadata": total,
        "llm_classified": classified,
        "embedded": embedded,
        "pending_classification": total - classified
    }
