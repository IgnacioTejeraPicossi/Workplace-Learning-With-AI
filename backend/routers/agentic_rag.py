# routers/agentic_rag.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
from pydantic import BaseModel

# Since backend is run from root with: uvicorn backend.app:app --reload --port 8000
# The imports should be relative to the root directory
try:
    from backend.services.agentic_rag.agentic_rag_service import (
        build_or_update_index, ask_agentic, summarize_agentic
    )
    print("✅ Successfully imported agentic_rag_service from backend.services.agentic_rag")
except ImportError as e:
    print(f"❌ Error importing from backend.services.agentic_rag: {e}")
    try:
        # Fallback: try direct import
        from services.agentic_rag.agentic_rag_service import (
            build_or_update_index, ask_agentic, summarize_agentic
        )
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

router = APIRouter(prefix="/agentic-rag", tags=["Agentic RAG"])

class AskPayload(BaseModel):
    doc_ids: List[str]
    question: str
    depth: int = 2
    k_init: int = 8
    use_hybrid: bool = True
    max_paragraphs: int = 12

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
        return result
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in ask endpoint: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Question processing failed: {str(e)}")

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
