from __future__ import annotations
import io
import os
from datetime import datetime
from typing import List, Optional, Literal, Dict, Any

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse

# ---- parsers ----
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

# ---- LLM integration ----
try:
    from .llm import ask_openai
except ImportError:
    try:
        from llm import ask_openai
    except ImportError:
        # Fallback for when running from root directory
        from backend.llm import ask_openai

router = APIRouter(prefix="/document-analyzer", tags=["Document Analyzer"])

# ========= Pydantic models =========
class SummaryRequest(BaseModel):
    length: Literal["short", "medium", "long"] = "medium"
    combine_across_files: bool = True

class DocSummary(BaseModel):
    filename: str
    chars: int
    chunks: int
    summary: str

class SummaryResponse(BaseModel):
    summaries: List[DocSummary]
    combined_summary: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)

# ========= Save to Database Models =========
class SaveAnalysisRequest(BaseModel):
    filename: str
    summary: str
    chars: int
    chunks: int
    length: str
    user_id: Optional[str] = None

class SaveAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis_id: Optional[str] = None

# ========= MongoDB Storage =========
# Import MongoDB collection for persistent storage
from backend.db import document_analyses_collection

# ========= Helpers =========
TEXT_EXTS = {".txt", ".md", ".markdown"}
DOC_EXTS = {".docx"}
PDF_EXTS = {".pdf"}

def _ext(name: str) -> str:
    name = (name or "").lower()
    dot = name.rfind(".")
    return name[dot:] if dot >= 0 else ""

def read_text_from_upload(file: UploadFile) -> str:
    """Extract text from uploaded file with memory management"""
    ext = _ext(file.filename)
    
    try:
        # Read file in chunks to manage memory
        data = b""
        chunk_size = 1024 * 1024  # 1MB chunks
        
        while True:
            chunk = file.file.read(chunk_size)
            if not chunk:
                break
            data += chunk
            
        if not data:
            return ""

        # PDF processing
        if ext in PDF_EXTS or (file.content_type or "").endswith("pdf"):
            if PdfReader is None:
                raise HTTPException(status_code=400, detail="PDF processing not available. Install pypdf")
            
            try:
                reader = PdfReader(io.BytesIO(data))
                parts = []
                for page in reader.pages:
                    try:
                        text = page.extract_text() or ""
                        if text.strip():  # Only add non-empty pages
                            parts.append(text)
                    except Exception:
                        continue
                return "\n".join(parts).strip()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"PDF processing error: {str(e)}")

        # DOCX processing
        if ext in DOC_EXTS or (file.content_type or "").endswith("wordprocessingml.document"):
            if DocxDocument is None:
                raise HTTPException(status_code=400, detail="DOCX processing not available. Install python-docx")
            
            try:
                doc = DocxDocument(io.BytesIO(data))
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"DOCX processing error: {str(e)}")

        # Text files
        try:
            return data.decode("utf-8", errors="ignore")
        except Exception:
            return data.decode("latin-1", errors="ignore")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
    finally:
        # Ensure file is closed
        try:
            file.file.close()
        except Exception:
            pass

def chunk_text(text: str, max_chars: int = 1500, overlap: int = 50) -> List[str]:
    """Memory-optimized text chunking with strict limits"""
    text = text.strip()
    if not text:
        return []
    
    chunks = []
    i = 0
    n = len(text)
    
    while i < n:
        j = min(i + max_chars, n)
        chunk = text[i:j]
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk)
        i = j - overlap
        if i < 0:
            i = 0
        
        # Memory management: strict limit on number of chunks
        if len(chunks) >= 20:  # Reduced from unlimited to 20 for better memory management
            print(f"Warning: Text truncated at {len(chunks)} chunks to prevent memory issues")
            break
    
    return chunks

def length_instructions(length: str) -> str:
    if length == "short":
        return "Return 3-5 concise bullet points and one-sentence summary."
    if length == "long":
        return "Return a detailed outline with: Overview, Key Findings, Data/Methods, Action Items. Keep under 500 words."
    return "Return a compact executive summary (100-150 words) plus 3 bullet highlights."

# ========= LLM calls =========
def summarize_text(text: str, length: str = "medium") -> str:
    """Summarize text using the unified AI system (ItemAI → OpenRouter → OpenAI)"""
    try:
        instr = length_instructions(length)
        
        prompt = (
            f"Summarize the following document. {instr}\n\n"
            "=== DOCUMENT START ===\n"
            f"{text}\n"
            "=== DOCUMENT END ==="
        )
        
        # Use the unified AI system from llm.py (ItemAI → OpenRouter → OpenAI)
        try:
            # Try different import paths for the unified system
            try:
                from llm import ask_ai_unified_sync
            except ImportError:
                try:
                    from backend.llm import ask_ai_unified_sync
                except ImportError:
                    from ..llm import ask_ai_unified_sync
            
            # The unified system will try ItemAI → OpenRouter → OpenAI automatically
            response = ask_ai_unified_sync(prompt, task_type="document_analysis", complexity="medium", max_tokens=800)
            if response and not response.startswith("[MOCKED RESPONSE"):
                print("✅ Document Analyzer: Unified AI system successful")
                return response.strip()
            
        except Exception as e:
            print(f"❌ Document Analyzer: Unified AI system failed: {e}")
        
        # Final fallback to mock response
        print("❌ Document Analyzer: All AI providers failed, using mock response")
        return f"[MOCKED RESPONSE] This would be the AI's answer to: {prompt[:100]}..."
        
    except Exception as e:
        return f"[MOCKED RESPONSE - Error: {str(e)}] This would be the AI's answer to: {prompt[:100]}..."

# ========= Routes =========
@router.post("/analyze", response_model=SummaryResponse)
async def analyze_documents(
    files: List[UploadFile] = File(..., description="One or more files"),
    length: Literal["short", "medium", "long"] = Form("medium"),
    combine_across_files: bool = Form(True),
) -> SummaryResponse:
    """Analyze uploaded documents and return summaries"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    
    if len(files) > 5:  # Limit number of files to prevent memory issues
        raise HTTPException(status_code=400, detail="Maximum 5 files allowed per request.")

    results: List[DocSummary] = []

    for f in files:
        try:
            raw_text = read_text_from_upload(f)
            
            if not raw_text:
                results.append(DocSummary(
                    filename=f.filename or "unnamed", 
                    chars=0, 
                    chunks=0, 
                    summary="(empty or unreadable)"
                ))
                continue

            # Chunk the text for processing
            chunks = chunk_text(raw_text)
            
            if not chunks:
                results.append(DocSummary(
                    filename=f.filename or "unnamed",
                    chars=len(raw_text),
                    chunks=0,
                    summary="(no content to summarize)"
                ))
                continue

            # Process chunks and create summary
            if len(chunks) == 1:
                # Single chunk - summarize directly
                summary = summarize_text(chunks[0], length=length)
            else:
                # Multiple chunks - summarize each and combine
                chunk_summaries = []
                for idx, chunk in enumerate(chunks, 1):
                    try:
                        chunk_prompt = (
                            f"Part {idx}/{len(chunks)} of a larger document. "
                            f"Summarize this part briefly. {length_instructions(length)}\n\n{chunk}"
                        )
                        chunk_summary = summarize_text(chunk_prompt, length=length)
                        chunk_summaries.append(chunk_summary)
                    except Exception as e:
                        chunk_summaries.append(f"Error processing part {idx}: {str(e)}")

                # Combine chunk summaries
                if chunk_summaries:
                    combine_prompt = (
                        "Combine these partial summaries into a single coherent summary. "
                        f"{length_instructions(length)}\n\n"
                        "PARTIAL SUMMARIES:\n" + "\n\n---\n".join(chunk_summaries)
                    )
                    summary = summarize_text(combine_prompt, length=length)
                else:
                    summary = "Error: Could not process document chunks"

            results.append(DocSummary(
                filename=f.filename or "unnamed",
                chars=len(raw_text),
                chunks=len(chunks),
                summary=summary,
            ))

        except Exception as e:
            results.append(DocSummary(
                filename=f.filename or "unnamed",
                chars=0,
                chunks=0,
                summary=f"Error processing file: {str(e)}"
            ))

    # Generate combined summary if requested and multiple files
    combined: Optional[str] = None
    if combine_across_files and len(results) > 1 and all(r.summary and not r.summary.startswith("Error") for r in results):
        try:
            combined_prompt = (
                "You are given summaries of multiple documents. Produce a unified summary that "
                "highlights common themes, key differences, and actionable insights.\n\n"
                + "\n\n====\n".join([f"FILE: {r.filename}\nSUMMARY:\n{r.summary}" for r in results])
            )
            combined = summarize_text(combined_prompt, length=length)
        except Exception as e:
            combined = f"Error generating combined summary: {str(e)}"

    return SummaryResponse(
        summaries=results,
        combined_summary=combined,
        meta={
            "files_processed": len(files),
            "length": length,
            "combine_across_files": combine_across_files
        },
    )

@router.get("/health")
async def health():
    """Health check endpoint"""
    return JSONResponse({
        "status": "ok", 
        "module": "document-analyzer",
        "pdf_support": PdfReader is not None,
        "docx_support": DocxDocument is not None
    })

@router.get("/supported-formats")
async def supported_formats():
    """Get list of supported file formats"""
    formats = {
        "text": list(TEXT_EXTS),
        "documents": list(DOC_EXTS),
        "pdf": list(PDF_EXTS)
    }
    
    return JSONResponse({
        "supported_formats": formats,
        "max_files_per_request": 5,
        "max_file_size_mb": 5
    })

@router.post("/save-analysis", response_model=SaveAnalysisResponse)
async def save_analysis(request: SaveAnalysisRequest):
    """Save document analysis to in-memory storage for Learning Document module"""
    try:
        # Create analysis document
        analysis_data = {
            "id": f"analysis_{int(datetime.now().timestamp())}",
            "filename": request.filename,
            "summary": request.summary,
            "chars": request.chars,
            "chunks": request.chunks,
            "length": request.length,
            "user_id": request.user_id or "anonymous",
            "created_at": datetime.now().isoformat(),
            "module": "document_analyzer"
        }
        
        # Save to MongoDB for persistent storage
        try:
            # Create a proper ObjectId for MongoDB
            from bson import ObjectId
            analysis_data["_id"] = ObjectId()
            # Keep the original string ID for reference
            analysis_data["original_id"] = analysis_data["id"]
            
            # Insert into MongoDB collection
            result = await document_analyses_collection.insert_one(analysis_data)
            
            if not result.inserted_id:
                raise Exception("Failed to save to MongoDB")
                
            print(f"✅ Document analysis saved to MongoDB with ID: {result.inserted_id}")
            
        except Exception as db_error:
            print(f"❌ MongoDB save error: {db_error}")
            # Fallback to in-memory storage if MongoDB fails
            global _saved_analyses
            if '_saved_analyses' not in globals():
                _saved_analyses = {}
            _saved_analyses[analysis_data["id"]] = analysis_data
            print("⚠️ Fallback to in-memory storage")
        
        return SaveAnalysisResponse(
            success=True,
            message=f"Analysis saved successfully for {request.filename}",
            analysis_id=analysis_data["id"]
        )
        
    except Exception as e:
        return SaveAnalysisResponse(
            success=False,
            message=f"Failed to save analysis: {str(e)}",
            analysis_id=None
        )

@router.get("/get-saved-analyses")
async def get_saved_analyses():
    """Get all saved document analyses from MongoDB for Learning Document module"""
    try:
        # Get analyses from MongoDB
        cursor = document_analyses_collection.find({})
        analyses_list = []
        
        async for analysis in cursor:
            # Convert ObjectId to string for JSON serialization
            analysis["id"] = str(analysis["_id"])
            del analysis["_id"]  # Remove ObjectId from response
            analyses_list.append(analysis)
        
        # If no MongoDB data, try fallback to in-memory storage
        if not analyses_list:
            global _saved_analyses
            if '_saved_analyses' in globals():
                analyses_list = list(_saved_analyses.values())
                print("⚠️ Using fallback in-memory storage")
        
        return JSONResponse({
            "success": True,
            "analyses": analyses_list,
            "total": len(analyses_list)
        })
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e),
            "analyses": [],
            "total": 0
        })

@router.delete("/delete-analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete a saved document analysis from MongoDB"""
    try:
        from bson import ObjectId
        
        # Try to delete from MongoDB
        result = await document_analyses_collection.delete_one({"_id": ObjectId(analysis_id)})
        
        if result.deleted_count > 0:
            print(f"✅ Document analysis deleted from MongoDB: {analysis_id}")
            return JSONResponse({
                "success": True,
                "message": f"Analysis {analysis_id} deleted successfully"
            })
        else:
            # Try fallback to in-memory storage
            global _saved_analyses
            if '_saved_analyses' in globals() and analysis_id in _saved_analyses:
                del _saved_analyses[analysis_id]
                print(f"⚠️ Deleted from fallback in-memory storage: {analysis_id}")
                return JSONResponse({
                    "success": True,
                    "message": f"Analysis {analysis_id} deleted from fallback storage"
                })
            else:
                return JSONResponse({
                    "success": False,
                    "message": f"Analysis {analysis_id} not found"
                })
                
    except Exception as e:
        print(f"❌ Delete error: {e}")
        return JSONResponse({
            "success": False,
            "message": f"Failed to delete analysis: {str(e)}"
        })

@router.get("/debug-storage")
async def debug_storage():
    """Debug endpoint to check storage status"""
    try:
        # Check MongoDB collection
        mongo_count = await document_analyses_collection.count_documents({})
        
        # Check in-memory storage
        global _saved_analyses
        memory_count = len(_saved_analyses) if '_saved_analyses' in globals() else 0
        
        # Get sample data from MongoDB
        sample_docs = []
        cursor = document_analyses_collection.find({}).limit(3)
        async for doc in cursor:
            sample_docs.append({
                "id": str(doc["_id"]),
                "filename": doc.get("filename", "Unknown"),
                "created_at": doc.get("created_at", "Unknown")
            })
        
        return JSONResponse({
            "success": True,
            "storage_status": {
                "mongodb": {
                    "count": mongo_count,
                    "sample_documents": sample_docs
                },
                "memory": {
                    "count": memory_count,
                    "available": '_saved_analyses' in globals()
                }
            },
            "message": f"MongoDB: {mongo_count} docs, Memory: {memory_count} docs"
        })
        
    except Exception as e:
        return JSONResponse({
            "success": False,
            "error": str(e),
            "message": "Debug storage check failed"
        })

# New endpoint for JSON-based file uploads (base64 encoded)
@router.post("/analyze-json", response_model=SummaryResponse)
async def analyze_documents_json(
    request: dict
) -> SummaryResponse:
    """Analyze documents sent as base64-encoded JSON instead of FormData"""
    files_data = request.get("files", [])
    length = request.get("length", "medium")
    combine_across_files = request.get("combine_across_files", True)
    
    if not files_data:
        raise HTTPException(status_code=400, detail="No files provided.")
    
    # Add file size limit (5MB for base64 content)
    for file_data in files_data:
        content = file_data.get("content", "")
        if len(content) > 5 * 1024 * 1024:  # 5MB limit for base64
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        # Additional validation for empty content
        if not content or len(content.strip()) == 0:
            raise HTTPException(status_code=400, detail="File content is empty")
    
    results: List[DocSummary] = []
    
    for file_data in files_data:
        filename = file_data.get("filename", "unnamed")
        content = file_data.get("content", "")
        file_type = file_data.get("type", "")
        
        if not content:
            results.append(DocSummary(filename=filename, chars=0, chunks=0, summary="(empty or unreadable)"))
            continue
        
        try:
            # Decode base64 content
            import base64
            file_bytes = base64.b64decode(content)
            
            # Create a mock UploadFile object for compatibility
            from io import BytesIO
            mock_file = type('MockFile', (), {
                'filename': filename,
                'content_type': file_type,
                'file': BytesIO(file_bytes)
            })()
            
            raw_text = read_text_from_upload(mock_file)
            
        except Exception as e:
            results.append(DocSummary(filename=filename, chars=0, chunks=0, summary=f"(error reading file: {str(e)})"))
            continue

        if not raw_text:
            results.append(DocSummary(filename=filename, chars=0, chunks=0, summary="(empty or unreadable)"))
            continue

        chunks = chunk_text(raw_text)
        chunk_summaries = []
        for idx, ch in enumerate(chunks, 1):
            chunk_prompt = (
                f"Part {idx}/{len(chunks)} of a larger document. "
                f"Summarize this part briefly. {length_instructions(length)}\n\n{ch}"
            )
            try:
                s = summarize_text(chunk_prompt, length=length)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"LLM error: {e}")
            chunk_summaries.append(s)

        stitching_prompt = (
            "Combine the following partial summaries into a single coherent summary. "
            f"{length_instructions(length)}\n\n"
            "PARTIAL SUMMARIES:\n" + "\n\n---\n".join(chunk_summaries)
        )
        final_summary = summarize_text(stitching_prompt, length=length)

        results.append(
            DocSummary(
                filename=filename,
                chars=len(raw_text),
                chunks=len(chunks),
                summary=final_summary,
            )
        )

    combined: Optional[str] = None
    if combine_across_files and len(results) > 1 and all(r.summary and not r.summary.startswith("Error") for r in results):
        try:
            combined_prompt = (
                "You are given summaries of multiple documents. Produce a unified summary that "
                "highlights common themes, key differences, and actionable insights.\n\n"
                + "\n\n====\n".join([f"FILE: {r.filename}\nSUMMARY:\n{r.summary}" for r in results])
            )
            combined = summarize_text(combined_prompt, length=length)
        except Exception as e:
            combined = f"Error generating combined summary: {str(e)}"

    return SummaryResponse(
        summaries=results,
        combined_summary=combined,
        meta={
            "files_processed": len(files_data),
            "length": length,
            "combine_across_files": combine_across_files
        },
    )
