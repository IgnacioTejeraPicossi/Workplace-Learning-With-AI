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
        cats = data.get("categories") or []
        if cats: meta_lines.append(f"Categories: {', '.join(cats)}")
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


