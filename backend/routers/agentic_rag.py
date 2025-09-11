# routers/agentic_rag.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List, Optional
from pydantic import BaseModel

# Since backend is run from root with: uvicorn backend.app:app --reload --port 8000
# The imports should be relative to the root directory
try:
    from services.agentic_rag.agentic_rag_service import (
        build_or_update_index, ask_agentic, summarize_agentic
    )
    from services.agentic_rag.your_mongo import save_analysis, get_analyses, delete_analysis
    print("✅ Successfully imported agentic_rag_service from services.agentic_rag")
except ImportError as e:
    print(f"❌ Error importing from services.agentic_rag: {e}")
    try:
        # Fallback: try direct import
        from services.agentic_rag.agentic_rag_service import (
            build_or_update_index, ask_agentic, summarize_agentic
        )
        from services.agentic_rag.your_mongo import save_analysis, get_analyses, delete_analysis
        print("✅ Successfully imported agentic_rag_service from services.agentic_rag")
    except ImportError as e2:
        print(f"❌ Error importing from services.agentic_rag: {e2}")
        # Final fallback: mock functions for testing
        print("⚠️ Using mock functions for testing")
        def build_or_update_index(filename: str, content: bytes):
            return {"doc_id": "test_123", "filename": filename, "mega_chunks": 1}
        
        def ask_agentic(**kwargs):
            return {"answer": "Test response", "citations": [], "scores": {"faithfulness": 8, "relevance": 8, "completeness": 8}}
        
        def summarize_agentic(doc_ids, length):
            return {"summary": "Test summary", "length": length}
        
        def save_analysis(analysis_data):
            return "mock_analysis_id"
        
        def get_analyses(doc_id=None, limit=50):
            return []
        
        def delete_analysis(analysis_id):
            return True

router = APIRouter(prefix="/agentic-rag", tags=["Agentic RAG"])

class AskPayload(BaseModel):
    doc_ids: List[str]
    question: str
    depth: int = 2
    k_init: int = 8
    use_hybrid: bool = True
    max_paragraphs: int = 12

class SaveAnalysisRequest(BaseModel):
    doc_id: str
    filename: str
    question: str
    answer: str
    citations: List[dict]
    scores: dict
    parameters: dict
    # Additional fields for complete analysis storage
    metrics: Optional[dict] = None
    router_selected: Optional[List[str]] = None
    used_paragraphs: Optional[List[str]] = None
    run_id: Optional[str] = None
    elapsed_sec: Optional[float] = None
    user_id: Optional[str] = None

class AnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis_id: Optional[str] = None

@router.post("/index")
async def index_documents(files: List[UploadFile] = File(...)):
    print("🚀 ===== INDEX ENDPOINT CALLED =====")
    print(f"📊 Request received with {len(files)} files")
    
    try:
        print(f"🔄 Starting indexing process for {len(files)} files...")
        docs = []
        
        for i, f in enumerate(files):
            print(f"📁 Processing file {i+1}/{len(files)}: {f.filename}")
            print(f"📏 File size: {len(await f.read())} bytes")
            f.file.seek(0)  # Reset file pointer
            
            content = await f.read()
            print(f"📄 Content length: {len(content)} bytes")
            
            result = build_or_update_index(filename=f.filename, content=content)
            print(f"✅ File indexed successfully: {result}")
            docs.append(result)
        
        print(f"🎉 Successfully indexed {len(docs)} documents")
        print(f"📤 Returning response: {docs}")
        return {"ok": True, "documents": docs}
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in index_documents: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Indexing failed: {str(e)}")

@router.post("/ask")
async def ask(payload: AskPayload):
    print("🤖 ===== ASK ENDPOINT CALLED =====")
    print(f"📊 Payload received: {payload.model_dump()}")
    
    try:
        print("🧠 Calling ask_agentic function...")
        result = ask_agentic(**payload.model_dump())
        print(f"✅ ask_agentic completed successfully: {result}")
        
        # Check if there was an error in the result
        if "error" in result:
            print(f"❌ Agentic RAG returned error: {result['error']}")
            raise HTTPException(500, f"Analysis failed: {result['error']}")
        
        return result
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in ask endpoint: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Question processing failed: {str(e)}")

@router.post("/save-analysis", response_model=AnalysisResponse)
async def save_analysis_endpoint(request: SaveAnalysisRequest):
    """Save analysis to database for later viewing"""
    try:
        analysis_data = {
            "doc_id": request.doc_id,
            "filename": request.filename,
            "question": request.question,
            "answer": request.answer,
            "citations": request.citations,
            "scores": request.scores,
            "parameters": request.parameters,
            # Store all additional analysis data
            "metrics": request.metrics,
            "router_selected": request.router_selected,
            "used_paragraphs": request.used_paragraphs,
            "run_id": request.run_id,
            "elapsed_sec": request.elapsed_sec,
            "user_id": request.user_id or "anonymous",
            "module": "agentic_rag"
        }
        
        analysis_id = save_analysis(analysis_data)
        print(f"✅ Analysis saved with ID: {analysis_id}")
        
        return AnalysisResponse(
            success=True,
            message=f"Analysis saved successfully for {request.filename}",
            analysis_id=analysis_id
        )
        
    except Exception as e:
        print(f"❌ Error saving analysis: {e}")
        return AnalysisResponse(
            success=False,
            message=f"Failed to save analysis: {str(e)}",
            analysis_id=None
        )

@router.get("/get-analyses")
async def get_analyses_endpoint(doc_id: Optional[str] = None, limit: int = 50):
    """Get analysis history, optionally filtered by document"""
    try:
        analyses_list = get_analyses(doc_id=doc_id, limit=limit)
        print(f"✅ Retrieved {len(analyses_list)} analyses")
        
        return {
            "success": True,
            "analyses": analyses_list,
            "total": len(analyses_list)
        }
        
    except Exception as e:
        print(f"❌ Error retrieving analyses: {e}")
        return {
            "success": False,
            "error": str(e),
            "analyses": [],
            "total": 0
        }

@router.delete("/delete-analysis/{analysis_id}")
async def delete_analysis_endpoint(analysis_id: str):
    """Delete an analysis by ID"""
    print(f"🗑️ ===== DELETE ANALYSIS ENDPOINT CALLED =====")
    print(f"📊 Analysis ID to delete: {analysis_id}")
    print(f"🔍 Type of analysis_id: {type(analysis_id)}")
    
    try:
        success = delete_analysis(analysis_id)
        print(f"✅ Delete operation result: {success}")
        
        if success:
            return {"success": True, "message": "Analysis deleted successfully"}
        else:
            return {"success": False, "message": "Analysis not found"}
    except Exception as e:
        print(f"❌ CRITICAL ERROR in delete endpoint: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": f"Error deleting analysis: {str(e)}"}

@router.post("/summarize")
async def summarize(doc_ids: List[str] = Form(...), length: str = Form("medium")):
    try:
        return summarize_agentic(doc_ids, length)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify the router is working"""
    return {"message": "✅ Agentic RAG router is working!", "status": "ok"}
