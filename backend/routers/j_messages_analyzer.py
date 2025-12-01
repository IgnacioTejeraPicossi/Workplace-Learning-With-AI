from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Query, Body
from typing import List, Tuple, Dict, Any
from io import BytesIO
import re
from datetime import datetime

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

    for raw in lines:
        line = raw.strip()
        if line.startswith("Kapittel "):
            anchor = _simple_slug(line)
            item = {"level": 1, "title": line, "anchor": anchor, "children": []}
            toc.append(item)
            last_h1 = item
            html_parts.append(f'<h1 id="{anchor}">{line}</h1>')
        elif line.startswith("§"):
            anchor = _simple_slug(line.replace("§", "paragraf"))
            h2 = {"level": 2, "title": line, "anchor": anchor}
            if last_h1:
                last_h1.setdefault("children", []).append(h2)
            else:
                toc.append(h2)
            html_parts.append(f'<h2 id="{anchor}">{line}</h2>')
        else:
            html_parts.append(f"<p>{line}</p>")

    return toc, "\n".join(html_parts)


def build_metadata_prompt(header_text: str, body_text: str) -> str:
    return f"""
Du er en assistent som analyserer norske forskrifter fra Fiskeridirektoratet.
Du får teksten fra en J-melding (header + starten på forskriften).
Trekk ut metadata og returner KUN STRICT JSON uten kommentarer.
Felt:
- j_id
- title
- replaces_id
- status
- valid_from
- valid_to
- categories

Tekst:
\"\"\"{header_text}\n\n{body_text[:4000]}\"\"\"
"""


@router.post("/analyze")
async def analyze_j_message(
    request: Request,
    file: UploadFile = File(...),
    summary_length: str = Query(None, description="short|medium|long to include an AI summary")
):
    """
    Accept a .docx J-melding and return structured JSON with:
    - metadata (LLM-extracted)
    - toc (from detected headings)
    - body_html (with ids matching toc anchors)
    - raw_text (body only)
    """
    if not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx is supported for now")

    file_bytes = await file.read()
    try:
        paragraphs = read_docx_paragraphs(file_bytes)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse .docx: {e}")

    header_text, body_text = split_header_body(paragraphs)
    toc, body_html = build_toc_and_body_html(body_text)

    metadata: Dict[str, Any] = {
        "j_id": None,
        "title": None,
        "replaces_id": None,
        "status": None,
        "valid_from": None,
        "valid_to": None,
        "categories": []
    }

    summary_text: str = ""

    # Prefer unified LLM pipeline if available; otherwise, return without metadata
    try:
        if ask_ai_unified_sync:
            prompt = build_metadata_prompt(header_text, body_text)
            # Ask model for STRICT JSON
            response = ask_ai_unified_sync(
                prompt=prompt + "\nGi svaret som STRICT JSON.",
                task_type="extraction",
                complexity="low",
                max_tokens=600,
                messages=None,
                request_headers=dict(request.headers)
            )
            # Attempt to parse JSON
            try:
                import json
                parsed = json.loads(response)
                if isinstance(parsed, dict):
                    metadata.update(parsed)
            except Exception:
                # Leave defaults if parsing fails; front-end can still render
                pass
            # Optional summary
            if summary_length:
                sum_prompt = f"""
Lag en {summary_length} oppsummering av forskriften nedenfor. 
Returner ren tekst, uten markers eller Markdown.
Tekst:
\"\"\"{body_text[:12000]}\"\"\"
"""
                try:
                    summary_text = ask_ai_unified_sync(
                        prompt=sum_prompt,
                        task_type="summarization",
                        complexity="low",
                        max_tokens=700,
                        messages=None,
                        request_headers=dict(request.headers)
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
        "categories": metadata.get("categories") or [],
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
            "categories": data.get("categories") or [],
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
async def list_j_messages():
    """
    List saved J-messages from MongoDB.
    """
    if j_messages_collection is None:
        return {"success": True, "items": [], "total": 0}
    items: List[Dict[str, Any]] = []
    async for doc in j_messages_collection.find({}).sort("created_at", -1):
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return {"success": True, "items": items, "total": len(items)}


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


