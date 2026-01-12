from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Query, Body
from typing import List, Tuple, Dict, Any
from io import BytesIO
import re
from datetime import datetime
from fastapi.responses import StreamingResponse

try:
    from docx import Document  # python-docx
except Exception:
    Document = None

try:
    # Prefer the unified LLM used across the app
    from backend.llm import ask_ai_unified_sync
except Exception:
    ask_ai_unified_sync = None

router = APIRouter(prefix="/api/j-messages", tags=["J-messages Analyzer"])

try:
    # Lazy import DB to avoid import cycles during tool runs
    from backend.db import database
    j_messages_collection = database.get_collection("j_messages")
except Exception:
    j_messages_collection = None

def _simple_slug(value: str) -> str:
    """
    Simple slug generator to avoid external deps.
    Lowercase, replace non-alphanum with hyphens, collapse repeats.
    """
    value = value.lower()
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[^\w\-]", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "section"


def read_docx_paragraphs(file_bytes: bytes) -> List[str]:
    if Document is None:
        raise HTTPException(status_code=500, detail="python-docx not available on server")
    doc = Document(BytesIO(file_bytes))
    paragraphs: List[str] = []
    for p in doc.paragraphs:
        text = (p.text or "").strip()
        if text:
            paragraphs.append(text)
    return paragraphs


def read_pdf_text(file_bytes: bytes) -> str:
    """
    Extract text from PDF using pypdf/PyPDF2 if available, otherwise pdfminer.six.
    """
    # 1) Try pypdf / PyPDF2
    try:
        try:
            from pypdf import PdfReader as _Reader  # type: ignore
        except Exception:
            from PyPDF2 import PdfReader as _Reader  # type: ignore
        reader = _Reader(BytesIO(file_bytes))
        parts: List[str] = []
        for page in getattr(reader, "pages", []):
            try:
                text = page.extract_text() or ""
                if text.strip():
                    parts.append(text)
            except Exception:
                continue
        text = "\n".join(parts).strip()
        if text:
            return text
    except Exception:
        pass

    # 2) Fallback: pdfminer.six
    try:
        from pdfminer.high_level import extract_text  # type: ignore
        text = extract_text(BytesIO(file_bytes)) or ""
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"PDF processing not available. Please install one of: pypdf, PyPDF2, or pdfminer.six. Error: {e}"
        )


def split_header_body(paragraphs: List[str]) -> Tuple[str, str]:
    """
    Split at the common marker 'Forskriften lyder etter dette'.
    If not found, treat everything as body.
    """
    marker = "Forskriften lyder etter dette"
    header_lines: List[str] = []
    body_lines: List[str] = []
    found = False
    for line in paragraphs:
        if not found:
            header_lines.append(line)
            if marker in line:
                found = True
        else:
            body_lines.append(line)
    if not found:
        return "", "\n".join(paragraphs)
    return "\n".join(header_lines), "\n".join(body_lines)


def build_toc_and_body_html(body_text: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Very lightweight heading detection for first implementation:
    - Lines starting with 'Kapittel ' → H1
    - Lines starting with '§' → H2
    Everything else → <p>.
    """
    lines = [l for l in body_text.split("\n") if l.strip()]
    toc: List[Dict[str, Any]] = []
    html_parts: List[str] = []
    last_h1: Dict[str, Any] = {}
    used_anchors: Dict[str, int] = {}

    def ensure_unique(anchor: str) -> str:
        """
        Guarantee unique anchors to avoid duplicate ids and React key warnings.
        If an anchor repeats, suffix with -2, -3, ...
        """
        count = used_anchors.get(anchor, 0)
        if count == 0:
            used_anchors[anchor] = 1
            return anchor
        count += 1
        used_anchors[anchor] = count
        return f"{anchor}-{count}"

    for raw in lines:
        line = raw.strip()
        if line.startswith("Kapittel "):
            anchor = ensure_unique(_simple_slug(line))
            item = {"level": 1, "title": line, "anchor": anchor, "children": []}
            toc.append(item)
            last_h1 = item
            html_parts.append(f'<h1 id="{anchor}">{line}</h1>')
        elif line.startswith("§"):
            anchor = ensure_unique(_simple_slug(line.replace("§", "paragraf")))
            h2 = {"level": 2, "title": line, "anchor": anchor}
            if last_h1:
                last_h1.setdefault("children", []).append(h2)
            else:
                toc.append(h2)
            html_parts.append(f'<h2 id="{anchor}">{line}</h2>')
        else:
            html_parts.append(f"<p>{line}</p>")

    return toc, "\n".join(html_parts)


def extract_json_from_llm_response(response: str) -> dict:
    """
    Robust JSON parser for LLM responses.
    Handles responses with extra text, XML tags, markdown, etc.
    
    Args:
        response: Raw LLM response that should contain JSON
        
    Returns:
        Parsed JSON dict, or empty dict if parsing fails
    """
    import json
    import re
    
    # Check for empty or very short responses
    if not response or len(response.strip()) < 10:
        print(f"[JSON_PARSER] ⚠️ Response is empty or too short (len={len(response)})")
        print(f"[JSON_PARSER] Raw response: '{response}'")
        return {}
    
    try:
        json_str = response.strip()
        original_length = len(json_str)
        
        # Remove XML-like tags that some models add (e.g., <think>, <answer>)
        json_str = re.sub(r'<[^>]+>', '', json_str)
        
        # Check if response was ONLY tags (nothing left after removing them)
        if len(json_str.strip()) < 5:
            print(f"[JSON_PARSER] ⚠️ Response contained only XML tags, no actual content")
            print(f"[JSON_PARSER] Original ({original_length} chars): {response[:500]}")
            return {}
        
        # Remove markdown code blocks if present
        if "```" in json_str:
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', json_str, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
            else:
                json_str = re.sub(r'```[^`]*```', '', json_str).strip()
        
        # Extract content between first '{' and last '}'
        first_brace = json_str.find('{')
        last_brace = json_str.rfind('}')
        if first_brace != -1 and last_brace != -1:
            json_str = json_str[first_brace:last_brace + 1]
        else:
            # No braces found - not valid JSON
            print(f"[JSON_PARSER] ⚠️ No JSON object found in response")
            print(f"[JSON_PARSER] Cleaned text: {json_str[:500]}...")
            return {}
        
        # Try to find JSON object if still not starting with '{'
        if not json_str.startswith('{'):
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', json_str, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
        
        parsed = json.loads(json_str)
        if isinstance(parsed, dict):
            return parsed
        else:
            print(f"[JSON_PARSER] ⚠️ Parsed value is not a dict: {type(parsed)}")
            return {}
            
    except json.JSONDecodeError as e:
        print(f"[JSON_PARSER] ❌ Failed to parse JSON: {e}")
        print(f"[JSON_PARSER] Response length: {len(response)} chars")
        print(f"[JSON_PARSER] First 500 chars: {response[:500]}")
        print(f"[JSON_PARSER] Last 200 chars: {response[-200:]}")
        return {}
    except Exception as e:
        print(f"[JSON_PARSER] ❌ Unexpected error: {e}")
        print(f"[JSON_PARSER] Response: {response[:500]}")
        return {}


def build_metadata_prompt(header_text: str, body_text: str) -> str:
    return f"""Extract metadata from this Norwegian fishing regulation document.
Return ONLY valid JSON. No explanations, no thinking, just JSON.

Required JSON format:
{{
  "j_id": "J-XXX-YYYY",
  "title": "document title",
  "replaces_id": "J-XXX-YYYY or null",
  "status": "active/inactive/repealed",
  "valid_from": "YYYY-MM-DD or null",
  "valid_to": "YYYY-MM-DD or null",
  "category": "Annet" or "Bunnfisk" or "Pelagisk fisk",
  "area": ["Andre lands soner", "Internasjonal farvann", "Nord for 62° N", "Sør for 62° N"] or []
}}

IMPORTANT RULES: 
- "category" MUST ALWAYS be one of these three values: "Annet", "Bunnfisk", or "Pelagisk fisk". NEVER use null.
  * Use "Bunnfisk" if the document mentions bottom-dwelling fish species (e.g., torsk/cod, hyse/haddock, sei/saithe, blåkveite/blue halibut, rognkjeks/lumpfish, kongekrabbe/king crab, etc.)
  * Use "Pelagisk fisk" if the document mentions pelagic fish species (e.g., makrell/mackerel, sild/herring, brisling/sprat, etc.)
  * Use "Annet" if the document does not clearly mention Bunnfisk or Pelagisk fisk species, or if it's a general regulation
- "area" must be an ARRAY containing one or more of these four values: "Andre lands soner", "Internasjonal farvann", "Nord for 62° N", "Sør for 62° N". A document can have multiple areas. If no area is found, use an empty array [].
- You MUST include both "category" and "area" fields in your JSON response. Category must always have a value (never null).
- Look for geographical references in the document to determine the areas (e.g., "nord for 62°", "sør for 62°", "internasjonalt", etc.). A document may mention multiple areas.

Document text:
\"\"\"{header_text}\n\n{body_text[:4000]}\"\"\"

JSON:"""


def analyze_text_content(text_content: str, request_headers: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Helper function to analyze J-melding text content directly (for evaluator use).
    
    Args:
        text_content: Full text of the J-melding document
        request_headers: Optional dict of request headers for API config
    
    Returns:
        Dict with metadata, toc, body_html, and raw_text
    """
    import json
    import re
    
    # Split text into lines
    paragraphs = [ln for ln in text_content.split("\n") if ln.strip()]
    
    # Split header/body
    header_text, body_text = split_header_body(paragraphs)
    
    # Build TOC and HTML
    toc, body_html = build_toc_and_body_html(body_text)
    
    # Initialize metadata
    metadata: Dict[str, Any] = {
        "j_id": None,
        "title": None,
        "replaces_id": None,
        "status": None,
        "valid_from": None,
        "valid_to": None,
        "category": "Annet",  # Default category
        "area": []
    }
    
    # Extract metadata using LLM if available
    if ask_ai_unified_sync:
        try:
            prompt = build_metadata_prompt(header_text, body_text)
            response = ask_ai_unified_sync(
                prompt=prompt + "\nGi svaret som STRICT JSON.",
                task_type="extraction",
                complexity="low",
                max_tokens=600,
                messages=None,
                request_headers=request_headers or {}
            )
            
            # Parse JSON from response
            json_str = response.strip()
            
            # Remove markdown code blocks if present
            if "```" in json_str:
                match = re.search(r'```(?:json)?\s*(.*?)\s*```', json_str, re.DOTALL)
                if match:
                    json_str = match.group(1).strip()
                else:
                    json_str = re.sub(r'```[^`]*```', '', json_str).strip()
            
            # Try to find JSON object in the string
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', json_str, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            
            parsed = json.loads(json_str)
            if isinstance(parsed, dict):
                metadata.update(parsed)
                print(f"[ANALYZER] Successfully extracted metadata: {list(parsed.keys())}")
        except Exception as e:
            print(f"[ANALYZER] Failed to extract metadata with LLM: {e}")
    
    return {
        "metadata": metadata,
        "toc": toc,
        "body_html": body_html,
        "raw_text": body_text
    }


@router.post("/analyze")
async def analyze_j_message(
    request: Request,
    file: UploadFile = File(...),
    summary_length: str = Query(None, description="short|medium|long to include an AI summary"),
    complexity: str = Query("low", description="AI complexity level: low, medium, or high")
):
    """
    Accept a .docx J-melding and return structured JSON with:
    - metadata (LLM-extracted)
    - toc (from detected headings)
    - body_html (with ids matching toc anchors)
    - raw_text (body only)
    """
    # Log incoming request info (for MCP debugging)
    request_headers_dict = dict(request.headers) if request else {}
    api_provider_header = request_headers_dict.get("x-api-provider", "NOT SET")
    itemai_url_header = request_headers_dict.get("x-itemai-url", "NOT SET")
    print(f"[J-MESSAGES ANALYZE] Request received")
    print(f"[J-MESSAGES ANALYZE]   x-api-provider: {api_provider_header}")
    print(f"[J-MESSAGES ANALYZE]   x-itemai-url: {itemai_url_header}")
    print(f"[J-MESSAGES ANALYZE]   All headers: {list(request_headers_dict.keys())}")
    
    file_bytes = await file.read()
    filename_lower = (file.filename or "").lower()

    # Read input (DOCX or PDF)
    try:
        if filename_lower.endswith(".docx"):
            paragraphs = read_docx_paragraphs(file_bytes)
            full_text = "\n".join(paragraphs)
        elif filename_lower.endswith(".pdf"):
            full_text = read_pdf_text(file_bytes)
            paragraphs = [ln for ln in full_text.split("\n") if ln.strip()]
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use .docx or .pdf")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {e}")

    header_text, body_text = split_header_body(paragraphs)
    toc, body_html = build_toc_and_body_html(body_text)

    metadata: Dict[str, Any] = {
        "j_id": None,
        "title": None,
        "replaces_id": None,
        "status": None,
        "valid_from": None,
        "valid_to": None,
        "category": "Annet",  # Default category
        "area": []
    }

    summary_text: str = ""

            # Prefer unified LLM pipeline if available; otherwise, return without metadata
    try:
        if ask_ai_unified_sync:
            prompt = build_metadata_prompt(header_text, body_text)
            # Ask model for STRICT JSON
            # Pass request headers to allow API config from frontend/MCP
            request_headers_dict = dict(request.headers) if request else {}
            
            # Debug: log API config headers (check for both x-itemai-url and x-itemai-key)
            has_api_config = any(
                k in request_headers_dict 
                for k in ["x-api-provider", "x-openai-key", "x-openrouter-key", "x-itemai-url", "x-itemai-key"]
            )
            
            if has_api_config:
                provider = request_headers_dict.get("x-api-provider", "unknown")
                print(f"[J-MESSAGES] ✅ API config headers found: provider={provider}")
                if provider == "itemai":
                    itemai_url = request_headers_dict.get("x-itemai-url", "not set")
                    print(f"[J-MESSAGES]    → ItemAI URL: {itemai_url}")
                print(f"[J-MESSAGES]    → All headers: {list(request_headers_dict.keys())}")
            else:
                print("[J-MESSAGES] ⚠️ No API config headers found, will use .env fallback")
                print(f"[J-MESSAGES]    → Available headers: {list(request_headers_dict.keys())}")
            
            # Validate and use complexity from query parameter
            complexity_level = complexity if complexity in ["low", "medium", "high"] else "low"
            
            response = ask_ai_unified_sync(
                prompt=prompt + "\nGi svaret som STRICT JSON.",
                task_type="extraction",
                complexity=complexity_level,
                max_tokens=600,
                messages=None,
                request_headers=request_headers_dict
            )
            # Parse JSON using robust helper function
            parsed = extract_json_from_llm_response(response)
            if parsed:
                # Handle legacy "categories" field - convert to "category"
                if "categories" in parsed and "category" not in parsed:
                    categories = parsed.get("categories", [])
                    if isinstance(categories, list) and len(categories) > 0:
                        parsed["category"] = categories[0]
                    elif isinstance(categories, list) and len(categories) == 0:
                        parsed["category"] = None
                    # Remove old field
                    parsed.pop("categories", None)
                
                # Ensure category always has a value (default to "Annet" if null or empty)
                if not parsed.get("category") or parsed.get("category") not in ["Annet", "Bunnfisk", "Pelagisk fisk"]:
                    parsed["category"] = "Annet"
                    print(f"[J-MESSAGES] ⚠️ Category was null or invalid, defaulting to 'Annet'")
                
                metadata.update(parsed)
                print(f"[J-MESSAGES] ✅ Successfully extracted metadata: {list(parsed.keys())}")
                print(f"[J-MESSAGES] Metadata values: id={parsed.get('j_id')}, title={parsed.get('title')[:50] if parsed.get('title') else None}, category={parsed.get('category')}, area={parsed.get('area')}")
            else:
                print(f"[J-MESSAGES] ⚠️ Failed to extract JSON from LLM response")
                # Leave defaults if parsing fails; front-end can still render
            # Optional summary
            if summary_length:
                sum_prompt = f"""
Lag en {summary_length} oppsummering av forskriften nedenfor. 
Returner ren tekst, uten markers eller Markdown.
Tekst:
\"\"\"{body_text[:12000]}\"\"\"
"""
                try:
                    # Use same complexity level for summary
                    summary_text = ask_ai_unified_sync(
                        prompt=sum_prompt,
                        task_type="summarization",
                        complexity=complexity_level,
                        max_tokens=700,
                        messages=None,
                        request_headers=request_headers_dict
                    ) or ""
                except Exception as _:
                    summary_text = ""
    except Exception as e:
        # Non-fatal; proceed with minimal payload
        print(f"[J-MESSAGES] Metadata extraction failed: {e}")

    result = {
        "id": metadata.get("j_id"),
        "title": metadata.get("title"),
        "status": metadata.get("status"),
        "valid_from": metadata.get("valid_from"),
        "valid_to": metadata.get("valid_to"),
        "replaces": metadata.get("replaces_id"),
        "category": metadata.get("category") or (metadata.get("categories") and metadata.get("categories")[0] if isinstance(metadata.get("categories"), list) and len(metadata.get("categories")) > 0 else None) or "Annet",
        "area": metadata.get("area") if isinstance(metadata.get("area"), list) else ([metadata.get("area")] if metadata.get("area") else []),
        "toc": toc,
        "body_html": body_html,
        "raw_text": body_text,
        "summary": summary_text,
        "summary_length": summary_length,
        "debug": {
            "header_text": header_text
        }
    }
    return result


@router.post("/save")
async def save_j_message(data: Dict[str, Any] = Body(...)):
    """
    Save analyzed J-message to MongoDB.
    Expects JSON payload similar to /analyze result and optional filename.
    """
    if j_messages_collection is None:
        raise HTTPException(status_code=500, detail="MongoDB not configured")
    try:
        doc: Dict[str, Any] = {
            "title": data.get("title"),
            "j_id": data.get("id"),
            "status": data.get("status"),
            "valid_from": data.get("valid_from"),
            "valid_to": data.get("valid_to"),
            "replaces": data.get("replaces"),
            "category": data.get("category") or (data.get("categories") and data.get("categories")[0] if isinstance(data.get("categories"), list) and len(data.get("categories")) > 0 else None) or "Annet",
            "area": data.get("area") if isinstance(data.get("area"), list) else ([data.get("area")] if data.get("area") else []),
            "toc": data.get("toc") or [],
            "body_html": data.get("body_html") or "",
            "summary": data.get("summary") or "",
            "summary_length": data.get("summary_length"),
            "raw_text": data.get("raw_text") or "",
            "filename": data.get("filename") or "",
            "created_at": datetime.utcnow(),
            "module": "j_messages"
        }
        result = await j_messages_collection.insert_one(doc)
        return {"success": True, "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {e}")


@router.get("/list")
async def list_j_messages(
    status: str = Query(None, description="Filter by status (e.g., 'Gjeldende', 'Utgått')"),
    category: str = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search in title or content")
):
    """
    List saved J-messages from MongoDB.
    Supports MCP tool: list_j_meldinger
    """
    if j_messages_collection is None:
        return {"success": True, "items": [], "total": 0}
    
    # Build query filter
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if category:
        # Support both old (array) and new (string) format
        query["$or"] = [
            {"category": category},
            {"categories": {"$in": [category]}}
        ]
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"j_id": {"$regex": search, "$options": "i"}},
            {"raw_text": {"$regex": search, "$options": "i"}}
        ]
    
    items: List[Dict[str, Any]] = []
    async for doc in j_messages_collection.find(query).sort("created_at", -1):
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return {"success": True, "items": items, "total": len(items)}


@router.put("/update/{doc_id}")
async def update_j_message(doc_id: str, data: Dict[str, Any] = Body(...)):
    """
    Update an existing J-message in MongoDB.
    """
    if j_messages_collection is None:
        raise HTTPException(status_code=500, detail="MongoDB not configured")
    try:
        from bson import ObjectId
        update_doc: Dict[str, Any] = {
            "updated_at": datetime.utcnow()
        }
        # Only update fields that are provided
        if "title" in data:
            update_doc["title"] = data.get("title")
        if "j_id" in data:
            update_doc["j_id"] = data.get("j_id")
        if "status" in data:
            update_doc["status"] = data.get("status")
        if "valid_from" in data:
            update_doc["valid_from"] = data.get("valid_from")
        if "valid_to" in data:
            update_doc["valid_to"] = data.get("valid_to")
        if "replaces" in data:
            update_doc["replaces"] = data.get("replaces")
        # Track fields to unset separately
        unset_fields = {}
        
        if "category" in data:
            category_value = data.get("category")
            # Treat empty string as null
            if category_value == "":
                update_doc["category"] = None
            else:
                update_doc["category"] = category_value
            # Remove old categories field if it exists
            unset_fields["categories"] = ""
        elif "categories" in data:
            # Legacy support: convert array to single category
            cats = data.get("categories") or []
            if isinstance(cats, list) and len(cats) > 0:
                update_doc["category"] = cats[0]
            unset_fields["categories"] = ""
        if "area" in data:
            area_value = data.get("area")
            # Ensure area is always an array
            if isinstance(area_value, list):
                update_doc["area"] = area_value
            elif area_value:
                update_doc["area"] = [area_value]
            else:
                update_doc["area"] = []
        if "toc" in data:
            update_doc["toc"] = data.get("toc") or []
        if "body_html" in data:
            update_doc["body_html"] = data.get("body_html") or ""
        if "summary" in data:
            update_doc["summary"] = data.get("summary") or ""
        if "summary_length" in data:
            update_doc["summary_length"] = data.get("summary_length")
        if "raw_text" in data:
            update_doc["raw_text"] = data.get("raw_text") or ""
        if "filename" in data:
            update_doc["filename"] = data.get("filename") or ""
        
        # Build update operation with both $set and $unset if needed
        update_operation = {}
        if update_doc:
            update_operation["$set"] = update_doc
        if unset_fields:
            update_operation["$unset"] = unset_fields
        
        result = await j_messages_collection.update_one(
            {"_id": ObjectId(doc_id)},
            update_operation if update_operation else {"$set": {"updated_at": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="J-message not found")
        return {"success": True, "id": doc_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")


@router.delete("/delete/{doc_id}")
async def delete_j_message(doc_id: str):
    if j_messages_collection is None:
        raise HTTPException(status_code=500, detail="MongoDB not configured")
    try:
        from bson import ObjectId
        res = await j_messages_collection.delete_one({"_id": ObjectId(doc_id)})
        return {"success": res.deleted_count == 1}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete failed: {e}")


def build_note_prompt(body_text: str) -> str:
    return f"""Extract note metadata from this Norwegian J-melding addendum document.
Return ONLY valid JSON. No explanations, no thinking, just JSON.

Required JSON format:
{{
  "target_j_id": "J-XXX-YYYY",
  "note_type": "addendum",
  "valid_from": "YYYY-MM-DD",
  "valid_to": "YYYY-MM-DD",
  "affected_sections": ["Chapter 1", "§ 7"],
  "actions": ["amend", "replace"],
  "summary": "Brief change description"
}}

Document text:
\"\"\"{body_text[:12000]}\"\"\"

JSON:"""


@router.post("/analyze-note")
async def analyze_j_note(
    request: Request, 
    file: UploadFile = File(...),
    complexity: str = Query("low", description="AI complexity level: low, medium, or high")
):
    """
    Analyze a J-melding 'note' document (DOCX/PDF). Returns structured 'note' fields.
    """
    file_bytes = await file.read()
    filename_lower = (file.filename or "").lower()

    # Read text from file
    try:
        if filename_lower.endswith(".docx"):
            paragraphs = read_docx_paragraphs(file_bytes)
            full_text = "\n".join(paragraphs)
        elif filename_lower.endswith(".pdf"):
            full_text = read_pdf_text(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use .docx or .pdf")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {e}")

    # Use LLM to extract note structure
    note_data: Dict[str, Any] = {
        "target_j_id": None,
        "note_type": None,
        "valid_from": None,
        "valid_to": None,
        "affected_sections": [],
        "actions": [],
        "summary": ""
    }
    try:
        if ask_ai_unified_sync:
            prompt = build_note_prompt(full_text)
            # Validate and use complexity from query parameter
            complexity_level = complexity if complexity in ["low", "medium", "high"] else "low"
            
            resp = ask_ai_unified_sync(
                prompt=prompt,
                task_type="extraction",
                complexity=complexity_level,
                max_tokens=600,
                messages=None,
                request_headers=dict(request.headers)
            )
            # Parse JSON using robust helper function
            parsed = extract_json_from_llm_response(resp)
            if parsed:
                note_data.update(parsed)
                print(f"[J-MESSAGES NOTE] ✅ Successfully parsed note data")
            else:
                print(f"[J-MESSAGES NOTE] ⚠️ Failed to extract JSON from LLM response")
    except Exception as e:
        print(f"[J-MESSAGES NOTE] extraction failed: {e}")

    return {
        "type": "note",
        "note": note_data,
        "raw_text": full_text
    }


@router.post("/export-docx")
async def export_docx(data: Dict[str, Any] = Body(...)):
    """
    Build a simple .docx from the analyzed J-message.
    Uses title, metadata, optional summary and raw_text/body_html (as plain text).
    """
    if Document is None:
        raise HTTPException(status_code=500, detail="python-docx not available on server")
    try:
        # Prefer raw_text to avoid HTML parsing; fallback to stripped body_html
        body_text = data.get("raw_text") or ""
        if not body_text and data.get("body_html"):
            # Very naive HTML → text fallback
            body_text = re.sub("<[^>]+>", " ", data.get("body_html") or "")
            body_text = re.sub(r"\s+", " ", body_text).strip()

        doc = Document()
        title = data.get("title") or data.get("id") or "J-message"
        doc.add_heading(title, 0)

        # Metadata
        meta_lines: List[str] = []
        if data.get("id"): meta_lines.append(f"ID: {data.get('id')}")
        if data.get("status"): meta_lines.append(f"Status: {data.get('status')}")
        if data.get("valid_from"): meta_lines.append(f"Valid from: {data.get('valid_from')}")
        if data.get("valid_to"): meta_lines.append(f"Valid to: {data.get('valid_to')}")
        if data.get("replaces"): meta_lines.append(f"Replaces: {data.get('replaces')}")
        # Support both old (array) and new (string) format
        category = data.get("category")
        if not category:
            cats = data.get("categories") or []
            if isinstance(cats, list) and len(cats) > 0:
                category = cats[0]
        if category: meta_lines.append(f"Category: {category}")
        area = data.get("area")
        if isinstance(area, list) and len(area) > 0:
            meta_lines.append(f"Area: {', '.join(area)}")
        elif area and not isinstance(area, list):
            meta_lines.append(f"Area: {area}")
        if meta_lines:
            p = doc.add_paragraph()
            for line in meta_lines:
                p.add_run(line).italic = True
                p.add_run("\n")

        # Summary
        if data.get("summary"):
            doc.add_heading("Executive Summary", level=1)
            for line in str(data.get("summary")).split("\n"):
                doc.add_paragraph(line)

        # Body
        doc.add_heading("Body", level=1)
        for line in (body_text or "").split("\n"):
            if line.strip():
                doc.add_paragraph(line.strip())

        # Stream as response
        bio = BytesIO()
        doc.save(bio)
        bio.seek(0)
        filename = f"{(data.get('id') or 'j-message').replace(' ', '_')}.docx"
        return StreamingResponse(
            bio,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")


