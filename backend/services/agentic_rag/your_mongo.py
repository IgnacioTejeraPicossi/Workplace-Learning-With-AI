# your_mongo.py
import os, datetime
from typing import Any, Dict, List, Optional
from pymongo import MongoClient, ASCENDING

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("MONGODB_DB",  "ai_learning")

_client = MongoClient(MONGO_URI)
_db = _client[DB_NAME]

documents = _db["documents"]
chunks    = _db["chunks"]      # árbol: doc_id + path + level + text/title
runs      = _db["agentic_runs"]
evals     = _db["agentic_evals"]
analyses  = _db["agentic_analyses"]  # historial de preguntas/respuestas

# Índices mínimos
chunks.create_index([("doc_id", ASCENDING), ("level", ASCENDING), ("path", ASCENDING)])
runs.create_index([("created_at", ASCENDING)])
analyses.create_index([("created_at", ASCENDING)])
analyses.create_index([("doc_id", ASCENDING)])

def save_document(doc_id: str, filename: str) -> None:
    documents.update_one({"_id": doc_id},
                         {"$set": {"_id": doc_id, "filename": filename, "updated_at": datetime.datetime.utcnow()}},
                         upsert=True)

def save_chunks_tree(doc_id: str, chunks_tree: List[Dict[str, Any]]) -> None:
    # chunks_tree: [{mega: Chunk, subs: [Chunk,...]}, ...]
    # limpiamos lo previo del doc
    chunks.delete_many({"doc_id": doc_id})
    to_insert = []
    for node in chunks_tree:
        mega = node["mega"]
        to_insert.append({
            "doc_id": doc_id, "id": mega.id, "level": mega.level, "path": mega.path,
            "title": mega.title, "text": mega.text
        })
        for s in node["subs"]:
            to_insert.append({
                "doc_id": doc_id, "id": s.id, "level": s.level, "path": s.path,
                "title": s.title, "text": s.text
            })
    if to_insert:
        chunks.insert_many(to_insert)

def get_chunks_tree(doc_id: Optional[str]=None, level: Optional[int]=None, path_prefix: Optional[List[str]]=None):
    q: Dict[str, Any] = {}
    if doc_id: q["doc_id"] = doc_id
    if level is not None: q["level"] = level
    if path_prefix:
        q["path"] = {"$regex": f"^{'.'.join(path_prefix)}"}
    return list(chunks.find(q))

def save_run(run_doc: Dict[str, Any]) -> None:
    run_doc["created_at"] = datetime.datetime.utcnow()
    runs.insert_one(run_doc)

def save_eval(run_id: str, scores: Dict[str, Any]) -> None:
    evals.insert_one({"run_id": run_id, **scores, "created_at": datetime.datetime.utcnow()})

def save_analysis(analysis_data: Dict[str, Any]) -> str:
    """Save complete analysis (question + answer + metadata) to database"""
    analysis_data["created_at"] = datetime.datetime.utcnow()
    result = analyses.insert_one(analysis_data)
    return str(result.inserted_id)

def get_analyses(doc_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Get analysis history, optionally filtered by document"""
    query = {}
    if doc_id:
        query["doc_id"] = doc_id
    
    cursor = analyses.find(query).sort("created_at", -1).limit(limit)
    analyses_list = []
    
    for analysis in cursor:
        # Convert ObjectId to string for JSON serialization
        analysis["_id"] = str(analysis["_id"])
        analyses_list.append(analysis)
    
    return analyses_list

def delete_analysis(analysis_id: str) -> bool:
    """Delete an analysis by ID"""
    try:
        from bson import ObjectId
        # Convert string ID to ObjectId for MongoDB query
        object_id = ObjectId(analysis_id)
        result = analyses.delete_one({"_id": object_id})
        print(f"🗑️ Deleting analysis {analysis_id} -> ObjectId: {object_id}, deleted: {result.deleted_count}")
        return result.deleted_count > 0
    except Exception as e:
        print(f"❌ Error deleting analysis {analysis_id}: {e}")
        return False
