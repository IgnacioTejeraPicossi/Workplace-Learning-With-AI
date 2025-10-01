from fastapi import APIRouter
from backend.db import document_analyses_collection
from backend.services.agentic_rag.your_mongo import documents

router = APIRouter()

@router.get("/unified-documents")
async def get_unified_documents():
    """Get all documents from both Document Analyzer and Agentic RAG"""
    try:
        # Get documents from Document Analyzer
        doc_analyzer_docs = await document_analyses_collection.find({}).to_list(length=None)
        
        # Get documents from Agentic RAG (synchronous)
        agentic_rag_cursor = documents.find({}).limit(100)
        agentic_rag_docs = list(agentic_rag_cursor)
        
        # Combine and format documents
        unified_docs = []
        
        # Add Document Analyzer documents
        for doc in doc_analyzer_docs:
            unified_docs.append({
                "id": str(doc["_id"]),
                "title": doc.get("filename", "Untitled Document"),
                "summary": doc.get("summary", ""),
                "source": "document_analyzer",
                "created_at": doc.get("created_at", ""),
                "module": doc.get("module", "document_analyzer")
            })
        
        # Add Agentic RAG documents
        for doc in agentic_rag_docs:
            unified_docs.append({
                "id": str(doc["_id"]),
                "title": doc.get("filename", doc.get("title", "Untitled Document")),
                "summary": doc.get("summary", ""),
                "source": "agentic_rag",
                "created_at": doc.get("created_at", ""),
                "module": doc.get("module", "agentic_rag")
            })
        
        # Sort by creation date (newest first) - handle mixed types
        def get_sort_key(doc):
            created_at = doc.get("created_at", "")
            if isinstance(created_at, str):
                return created_at
            elif hasattr(created_at, 'isoformat'):
                return created_at.isoformat()
            else:
                return str(created_at)
        
        unified_docs.sort(key=get_sort_key, reverse=True)
        
        return {
            "success": True,
            "documents": unified_docs,
            "total": len(unified_docs),
            "sources": {
                "document_analyzer": len(doc_analyzer_docs),
                "agentic_rag": len(agentic_rag_docs)
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting unified documents: {e}")
        return {
            "success": False,
            "message": f"Error getting unified documents: {str(e)}",
            "documents": [],
            "total": 0
        }
