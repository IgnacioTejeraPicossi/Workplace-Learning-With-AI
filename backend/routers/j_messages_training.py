"""
J-messages Training Pairs API
Handles original + human-analyzed document pairs for retrospective learning
"""
from fastapi import APIRouter, HTTPException, Request, Query, Body
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

# Import evaluator service with fallbacks (supports both execution modes)
try:
    from backend.services.j_messages_evaluator import get_evaluator
    EVALUATOR_AVAILABLE = True
except ImportError:
    try:
        from services.j_messages_evaluator import get_evaluator
        EVALUATOR_AVAILABLE = True
    except ImportError as e:
        logger.warning(f"Could not import evaluator service: {e}")
        EVALUATOR_AVAILABLE = False

# Import prompt suggestion service with fallbacks
try:
    from backend.services.prompt_suggestion_service import get_prompt_suggestion_service
    PROMPT_SUGGESTION_AVAILABLE = True
except ImportError:
    try:
        from services.prompt_suggestion_service import get_prompt_suggestion_service
        PROMPT_SUGGESTION_AVAILABLE = True
    except ImportError as e:
        logger.warning(f"Could not import prompt suggestion service: {e}")
        PROMPT_SUGGESTION_AVAILABLE = False

router = APIRouter(prefix="/api/j-messages/training", tags=["J-messages Training"])

# Pydantic models
class OriginalDocument(BaseModel):
    doc_url: Optional[str] = None
    doc_type: Optional[str] = None  # "docx", "pdf"
    stored_file_path: Optional[str] = None
    text_excerpt: Optional[str] = None

class StructuredContent(BaseModel):
    metadata: Optional[Dict[str, Any]] = None
    toc: Optional[List[Dict[str, Any]]] = None
    body_html: Optional[str] = None

class AIStructuredContent(StructuredContent):
    last_run_prompt_id: Optional[str] = None
    last_run_at: Optional[str] = None

class FieldAccuracy(BaseModel):
    j_id: Optional[float] = None
    title: Optional[float] = None
    valid_from: Optional[float] = None
    valid_to: Optional[float] = None
    categories: Optional[float] = None
    status: Optional[float] = None

class Evaluation(BaseModel):
    last_evaluated_at: Optional[str] = None
    field_accuracy: Optional[FieldAccuracy] = None
    overall_score: Optional[float] = None
    comment: Optional[str] = None

class JMessagePair(BaseModel):
    j_id: str
    source_system_id: Optional[str] = None
    title: str
    original: Optional[OriginalDocument] = None
    human_structured: Optional[StructuredContent] = None
    ai_structured: Optional[AIStructuredContent] = None
    evaluation: Optional[Evaluation] = None
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ImportBatch(BaseModel):
    items: List[Dict[str, Any]]
    source: str = "manual-import"

# Database connection
try:
    from backend.db import database
    training_pairs_collection = database.get_collection("j_message_pairs")
    j_messages_collection = database.get_collection("j_messages")
except Exception:
    training_pairs_collection = None
    j_messages_collection = None

# Helper functions
def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc:
        doc["id"] = str(doc.pop("_id", ""))
    return doc

# Routes
@router.get("/")
async def list_training_pairs(
    j_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    has_human: Optional[bool] = Query(None),
    has_ai: Optional[bool] = Query(None),
    evaluated: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    skip: int = Query(0)
):
    """
    List training pairs with filters
    """
    if training_pairs_collection is None:
        return {"success": True, "items": [], "total": 0}
    
    # Build query
    query: Dict[str, Any] = {}
    
    if j_id:
        query["j_id"] = {"$regex": j_id, "$options": "i"}
    
    if status:
        query["human_structured.metadata.status"] = status
    
    if has_human is not None:
        if has_human:
            query["human_structured"] = {"$exists": True, "$ne": None}
        else:
            query["human_structured"] = {"$exists": False}
    
    if has_ai is not None:
        if has_ai:
            query["ai_structured"] = {"$exists": True, "$ne": None}
        else:
            query["ai_structured"] = {"$exists": False}
    
    if evaluated is not None:
        if evaluated:
            query["evaluation.last_evaluated_at"] = {"$exists": True, "$ne": None}
        else:
            query["evaluation.last_evaluated_at"] = {"$exists": False}
    
    # Get total count
    total = await training_pairs_collection.count_documents(query)
    
    # Get items
    items: List[Dict[str, Any]] = []
    cursor = training_pairs_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    
    async for doc in cursor:
        items.append(serialize_doc(doc))
    
    return {
        "success": True,
        "items": items,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.get("/{pair_id}")
async def get_training_pair(pair_id: str):
    """
    Get a single training pair by ID
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        from bson import ObjectId
        doc = await training_pairs_collection.find_one({"_id": ObjectId(pair_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Training pair not found")
        
        return {
            "success": True,
            "item": serialize_doc(doc)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_training_pair(pair: JMessagePair):
    """
    Create a new training pair
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Check if pair already exists
        existing = await training_pairs_collection.find_one({
            "j_id": pair.j_id,
            "source_system_id": pair.source_system_id
        })
        
        if existing:
            raise HTTPException(
                status_code=409, 
                detail=f"Training pair already exists for j_id={pair.j_id}, source_system_id={pair.source_system_id}"
            )
        
        # Create document
        doc = pair.dict()
        doc["created_at"] = datetime.utcnow().isoformat()
        doc["updated_at"] = datetime.utcnow().isoformat()
        
        result = await training_pairs_collection.insert_one(doc)
        
        return {
            "success": True,
            "id": str(result.inserted_id),
            "j_id": pair.j_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-empty")
async def create_empty_training_pair():
    """
    Create a new empty training pair that can be populated later with documents.
    Returns a new pair with default values.
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        from bson import ObjectId
        import uuid
        
        # Generate a unique j_id for the new pair
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4())[:8].upper()
        new_j_id = f"J-NEW-{timestamp}-{unique_id}"
        
        # Create empty pair document
        doc = {
            "j_id": new_j_id,
            "source_system_id": "manual-creation",
            "title": "New Training Pair",
            "original": None,
            "human_structured": None,
            "ai_structured": None,
            "evaluation": None,
            "tags": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await training_pairs_collection.insert_one(doc)
        
        # Retrieve the created document
        created_doc = await training_pairs_collection.find_one({"_id": result.inserted_id})
        
        return {
            "success": True,
            "item": serialize_doc(created_doc)
        }
    except Exception as e:
        logger.error(f"Error creating empty training pair: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{pair_id}")
async def update_training_pair(pair_id: str, updates: Dict[str, Any] = Body(...)):
    """
    Update a training pair (partial update)
    Handles nested objects like 'original' and 'human_structured' correctly.
    Sets whole nested objects (not dot notation) to avoid MongoDB error when
    the field is null: "Cannot create field 'X' in element {original: null}".
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        from bson import ObjectId
        
        # Fetch current document when we need to merge nested objects that may be null
        doc = None
        if "original" in updates or "human_structured" in updates or "ai_structured" in updates:
            doc = await training_pairs_collection.find_one({"_id": ObjectId(pair_id)})
            if not doc:
                raise HTTPException(status_code=404, detail="Training pair not found")
        
        set_operation = {}
        
        # Set whole nested object (merge with existing if it's a dict). Using dot notation
        # like original.doc_type fails when original is null (MongoDB err 28).
        if "original" in updates:
            original_updates = updates.pop("original")
            if isinstance(original_updates, dict):
                existing = doc.get("original") if doc else None
                merged = {**existing, **original_updates} if isinstance(existing, dict) else original_updates
                set_operation["original"] = merged
        
        if "human_structured" in updates:
            human_updates = updates.pop("human_structured")
            if isinstance(human_updates, dict):
                existing = doc.get("human_structured") if doc else None
                merged = {**existing, **human_updates} if isinstance(existing, dict) else human_updates
                set_operation["human_structured"] = merged
        
        if "ai_structured" in updates:
            ai_updates = updates.pop("ai_structured")
            if isinstance(ai_updates, dict):
                existing = doc.get("ai_structured") if doc else None
                merged = {**existing, **ai_updates} if isinstance(existing, dict) else ai_updates
                set_operation["ai_structured"] = merged
        
        # Add remaining top-level updates
        for key, value in updates.items():
            if key != "updated_at":  # We'll add this separately
                set_operation[key] = value
        
        # Add updated timestamp
        set_operation["updated_at"] = datetime.utcnow().isoformat()
        
        result = await training_pairs_collection.update_one(
            {"_id": ObjectId(pair_id)},
            {"$set": set_operation}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Training pair not found")
        
        logger.info(f"Updated training pair {pair_id}, modified {result.modified_count} field(s)")
        
        return {
            "success": True,
            "modified_count": result.modified_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating training pair {pair_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pair_id}")
async def delete_training_pair(pair_id: str):
    """
    Delete a training pair by ID
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        from bson import ObjectId
        
        result = await training_pairs_collection.delete_one({"_id": ObjectId(pair_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Training pair not found")
        
        logger.info(f"Deleted training pair: {pair_id}")
        
        return {
            "success": True,
            "deleted_count": result.deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_training_batch(batch: ImportBatch):
    """
    Import multiple training pairs from external source (e.g., Enonic)
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        results = {
            "success": True,
            "source": batch.source,
            "total": len(batch.items),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": []
        }
        
        for item in batch.items:
            try:
                # Validate required fields
                if "j_id" not in item or "title" not in item:
                    results["skipped"] += 1
                    results["errors"].append({
                        "item": item.get("j_id", "unknown"),
                        "error": "Missing required fields: j_id or title"
                    })
                    continue
                
                # Validate that at least original OR human_structured exists
                has_original = "original" in item and item["original"]
                has_human = "human_structured" in item and item["human_structured"]
                
                if not has_original and not has_human:
                    results["skipped"] += 1
                    results["errors"].append({
                        "item": item.get("j_id", "unknown"),
                        "error": "Must have at least 'original' or 'human_structured'"
                    })
                    continue
                
                # Validate original structure if present
                if has_original:
                    original = item["original"]
                    if not original.get("doc_url") and not original.get("text_excerpt"):
                        results["skipped"] += 1
                        results["errors"].append({
                            "item": item.get("j_id", "unknown"),
                            "error": "original must have 'doc_url' or 'text_excerpt'"
                        })
                        continue
                
                # Check if exists
                existing = await training_pairs_collection.find_one({
                    "j_id": item["j_id"],
                    "source_system_id": item.get("source_system_id")
                })
                
                if existing:
                    # Skip duplicates (default behavior for safety)
                    # Future: add update_mode parameter to allow updates
                    results["skipped"] += 1
                    logger.info(f"Skipped duplicate: {item['j_id']} (source: {item.get('source_system_id')})")
                else:
                    # Create new
                    item["created_at"] = datetime.utcnow().isoformat()
                    item["updated_at"] = datetime.utcnow().isoformat()
                    
                    # Add source tag if not already present
                    item_tags = item.get("tags", [])
                    if batch.source not in item_tags:
                        item["tags"] = item_tags + [batch.source]
                    
                    await training_pairs_collection.insert_one(item)
                    results["created"] += 1
                    logger.info(f"Created training pair: {item['j_id']}")
                    
            except Exception as e:
                results["skipped"] += 1
                results["errors"].append({
                    "item": item.get("j_id", "unknown"),
                    "error": str(e)
                })
                logger.error(f"Error importing {item.get('j_id', 'unknown')}: {str(e)}")
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/summary")
async def get_training_stats():
    """
    Get summary statistics about training pairs
    """
    if training_pairs_collection is None:
        return {
            "success": True,
            "total_pairs": 0,
            "with_human": 0,
            "with_ai": 0,
            "evaluated": 0,
            "avg_accuracy": None
        }
    
    try:
        total = await training_pairs_collection.count_documents({})
        
        with_human = await training_pairs_collection.count_documents({
            "human_structured": {"$exists": True, "$ne": None}
        })
        
        with_ai = await training_pairs_collection.count_documents({
            "ai_structured": {"$exists": True, "$ne": None}
        })
        
        evaluated = await training_pairs_collection.count_documents({
            "evaluation.last_evaluated_at": {"$exists": True, "$ne": None}
        })
        
        # Calculate average accuracy for evaluated pairs
        pipeline = [
            {"$match": {"evaluation.overall_score": {"$exists": True}}},
            {"$group": {
                "_id": None,
                "avg_score": {"$avg": "$evaluation.overall_score"}
            }}
        ]
        
        avg_result = await training_pairs_collection.aggregate(pipeline).to_list(length=1)
        avg_accuracy = avg_result[0]["avg_score"] if avg_result else None
        
        return {
            "success": True,
            "total_pairs": total,
            "with_human": with_human,
            "with_ai": with_ai,
            "evaluated": evaluated,
            "avg_accuracy": round(avg_accuracy, 2) if avg_accuracy else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# EPIC 3: RETROSPECTIVE LEARNING & EVALUATION
# ============================================================================

@router.post("/{pair_id}/evaluate")
async def evaluate_training_pair(
    pair_id: str,
    request: Request,
    body: Optional[Dict[str, Any]] = Body(None, description="Optional: complexity (low/medium/high), temperature (0.0-2.0) to match Analyze file")
):
    """
    Run AI evaluation on a specific training pair
    Compares AI analysis with human-analyzed version.
    Pass complexity and temperature in body to use same model params as J-messages Analyzer.
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    if not EVALUATOR_AVAILABLE:
        raise HTTPException(status_code=503, detail="Evaluator service not available")
    
    try:
        from bson import ObjectId
        
        # Get the training pair
        pair_doc = await training_pairs_collection.find_one({"_id": ObjectId(pair_id)})
        
        if not pair_doc:
            raise HTTPException(status_code=404, detail="Training pair not found")
        
        # Use same API config as frontend (Analyze file): pass request headers so
        # x-api-provider, x-itemserverai-url, x-openai-key, etc. are used by the LLM
        api_config = {k.lower(): v for k, v in request.headers.items()} if request else {}
        
        # If pair has only body (no header), try to get full document from library so Evaluate = Analyze file
        marker = "Forskriften lyder etter dette"
        original = pair_doc.get("original") or {}
        text_excerpt = (original.get("text_excerpt") or "").strip()
        if pair_doc.get("j_id") and j_messages_collection is not None and marker not in text_excerpt and text_excerpt:
            try:
                lib_doc = await j_messages_collection.find_one({"j_id": pair_doc["j_id"]})
                if lib_doc and lib_doc.get("header_text"):
                    full_text = (lib_doc.get("header_text") or "").strip()
                    raw = (lib_doc.get("raw_text") or "").strip()
                    if full_text or raw:
                        full_text = f"{full_text}\n\n{raw}".strip() if raw else full_text
                        pair_doc = dict(pair_doc)
                        pair_doc["original"] = {**(pair_doc.get("original") or {}), "text_excerpt": full_text}
                        logger.info(f"Using full document from library for {pair_doc.get('j_id')} (header+body)")
            except Exception as e:
                logger.warning(f"Could not fetch full doc from library for evaluate: {e}")
        
        # Same model params as Analyze file (complexity, temperature from body)
        opts = body or {}
        complexity = opts.get("complexity") if isinstance(opts.get("complexity"), str) else None
        temperature = opts.get("temperature")
        if temperature is not None and not isinstance(temperature, (int, float)):
            try:
                temperature = float(temperature)
            except (TypeError, ValueError):
                temperature = None
        
        # Run evaluation
        evaluator = get_evaluator()
        evaluation_result = await evaluator.run_evaluation(
            pair_doc, api_config, complexity=complexity, temperature=temperature
        )
        
        if not evaluation_result.get('success'):
            raise HTTPException(status_code=500, detail=evaluation_result.get('error', 'Evaluation failed'))
        
        # Update the pair with evaluation results
        update_data = {
            "ai_structured": evaluation_result.get('ai_structured'),
            "evaluation": {
                "last_evaluated_at": evaluation_result.get('evaluated_at'),
                "metrics": evaluation_result.get('metrics'),
                "comparison": evaluation_result.get('comparison'),
                "overall_score": evaluation_result.get('metrics', {}).get('overall_accuracy', 0)
            },
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await training_pairs_collection.update_one(
            {"_id": ObjectId(pair_id)},
            {"$set": update_data}
        )
        
        logger.info(f"Evaluation complete for pair {pair_id}: {evaluation_result.get('metrics', {}).get('overall_accuracy', 0):.2%}")
        
        return {
            "success": True,
            "pair_id": pair_id,
            "j_id": evaluation_result.get('j_id'),
            "metrics": evaluation_result.get('metrics'),
            "evaluation_summary": evaluation_result.get('metrics', {}).get('evaluation_summary', '')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating pair {pair_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-batch")
async def evaluate_multiple_pairs(
    request: Request,
    pair_ids: List[str] = Body(..., description="List of pair IDs to evaluate"),
    limit: int = Body(10, description="Maximum number of pairs to evaluate"),
    complexity: Optional[str] = Body(None, description="AI complexity (low/medium/high), same as Analyze file"),
    temperature: Optional[float] = Body(None, description="Sampling temperature (0.0-2.0), same as Analyze file")
):
    """
    Run evaluation on multiple training pairs
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    if not EVALUATOR_AVAILABLE:
        raise HTTPException(status_code=503, detail="Evaluator service not available")
    
    try:
        from bson import ObjectId
        
        # Limit the number of pairs
        pair_ids = pair_ids[:limit]
        
        results = {
            "success": True,
            "total_requested": len(pair_ids),
            "evaluated": 0,
            "failed": 0,
            "results": []
        }
        
        evaluator = get_evaluator()
        api_config = {k.lower(): v for k, v in request.headers.items()} if request else {}
        
        for pair_id in pair_ids:
            try:
                pair_doc = await training_pairs_collection.find_one({"_id": ObjectId(pair_id)})
                
                if not pair_doc:
                    results["failed"] += 1
                    results["results"].append({
                        "pair_id": pair_id,
                        "success": False,
                        "error": "Pair not found"
                    })
                    continue
                
                # Run evaluation (same complexity/temperature as Analyze file)
                eval_result = await evaluator.run_evaluation(
                    pair_doc, api_config, complexity=complexity, temperature=temperature
                )
                
                if eval_result.get('success'):
                    # Update pair
                    update_data = {
                        "ai_structured": eval_result.get('ai_structured'),
                        "evaluation": {
                            "last_evaluated_at": eval_result.get('evaluated_at'),
                            "metrics": eval_result.get('metrics'),
                            "comparison": eval_result.get('comparison'),
                            "overall_score": eval_result.get('metrics', {}).get('overall_accuracy', 0)
                        },
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    
                    await training_pairs_collection.update_one(
                        {"_id": ObjectId(pair_id)},
                        {"$set": update_data}
                    )
                    
                    results["evaluated"] += 1
                    results["results"].append({
                        "pair_id": pair_id,
                        "j_id": eval_result.get('j_id'),
                        "success": True,
                        "accuracy": eval_result.get('metrics', {}).get('overall_accuracy', 0)
                    })
                else:
                    results["failed"] += 1
                    results["results"].append({
                        "pair_id": pair_id,
                        "success": False,
                        "error": eval_result.get('error', 'Unknown error')
                    })
                    
            except Exception as e:
                logger.error(f"Error evaluating pair {pair_id}: {str(e)}")
                results["failed"] += 1
                results["results"].append({
                    "pair_id": pair_id,
                    "success": False,
                    "error": str(e)
                })
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pair_id}/evaluation")
async def get_pair_evaluation(pair_id: str):
    """
    Get evaluation results for a specific training pair
    """
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        from bson import ObjectId
        
        pair_doc = await training_pairs_collection.find_one({"_id": ObjectId(pair_id)})
        
        if not pair_doc:
            raise HTTPException(status_code=404, detail="Training pair not found")
        
        evaluation = pair_doc.get('evaluation')
        
        if not evaluation:
            return {
                "success": True,
                "has_evaluation": False,
                "message": "This pair has not been evaluated yet"
            }
        
        return {
            "success": True,
            "has_evaluation": True,
            "pair_id": pair_id,
            "j_id": pair_doc.get('j_id'),
            "evaluation": evaluation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prompt/suggest")
async def suggest_prompt_improvements(
    request: Request,
    current_prompt: Optional[str] = Body(None),
    num_examples: int = Body(5, ge=1, le=20),
    focus_on_errors: bool = Body(True)
):
    """
    Generate AI-assisted prompt improvement suggestions based on evaluation results.
    
    This endpoint analyzes evaluated training pairs and uses an LLM to suggest
    improvements to the current analysis prompt.
    
    Parameters:
    - current_prompt: The current prompt to improve (if None, uses default)
    - num_examples: Number of training examples to analyze (1-20, default 5)
    - focus_on_errors: If True, prioritize low-accuracy pairs (default True)
    
    Returns:
    - suggested_prompt: The improved prompt text
    - notes: List of explanations for the changes
    - based_on_pairs: IDs of the training pairs used
    """
    if not PROMPT_SUGGESTION_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Prompt suggestion service not available"
        )
    
    if training_pairs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        logger.info(
            f"Generating prompt suggestion with {num_examples} examples, "
            f"focus_on_errors={focus_on_errors}"
        )
        
        # Get current prompt if not provided
        if not current_prompt:
            # Use the default J-messages analyzer prompt
            current_prompt = """Du er en assistent som analyserer norske forskrifter fra Fiskeridirektoratet.
Du får teksten fra en J-melding (header + starten på forskriften).
Trekk ut metadata og returner KUN STRICT JSON uten kommentarer.

Felt:
- j_id: J-meldingens ID (e.g., "J-195-2025")
- title: Tittel på forskriften
- replaces_id: ID til erstattet J-melding (hvis finnes)
- status: "Fastsatt" eller "Utgått"
- valid_from: Gyldig fra dato (YYYY-MM-DD)
- valid_to: Gyldig til dato (YYYY-MM-DD eller null)
- categories: Array av kategorier (e.g., ["Torsk", "Nordsjøen"])

Returner KUN JSON uten kommentarer."""
        
        # Fetch evaluated training pairs
        pairs_cursor = training_pairs_collection.find({
            "evaluation": {"$exists": True},
            "evaluation.overall_score": {"$exists": True}
        }).limit(100)  # Limit to prevent overwhelming
        
        pairs_list = []
        async for doc in pairs_cursor:
            # Convert ObjectId to string for JSON serialization
            doc['_id'] = str(doc['_id'])
            pairs_list.append(doc)
        
        if not pairs_list:
            raise HTTPException(
                status_code=400,
                detail="No evaluated training pairs found. Please run evaluation first."
            )
        
        logger.info(f"Found {len(pairs_list)} evaluated pairs")
        
        # Call prompt suggestion service
        service = get_prompt_suggestion_service()
        result = await service.generate_suggestion(
            current_prompt=current_prompt,
            training_pairs=pairs_list,
            num_examples=num_examples,
            focus_on_errors=focus_on_errors
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate suggestion")
            )
        
        logger.info("Successfully generated prompt suggestion")
        
        return {
            "success": True,
            "suggestion": {
                "suggested_prompt": result.get("suggested_prompt"),
                "notes": result.get("notes", []),
                "based_on_pairs": result.get("based_on_pairs", []),
                "num_examples": result.get("num_examples", 0),
                "generated_at": result.get("generated_at"),
                "original_prompt": current_prompt
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating prompt suggestion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

