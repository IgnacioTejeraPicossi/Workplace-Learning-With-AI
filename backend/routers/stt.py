import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

router = APIRouter(prefix="/stt", tags=["Speech to Text"])


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Fallback STT: receives short audio (e.g., webm/ogg/wav), uses OpenAI Whisper API.
    Returns: { "transcript": "..." }
    """
    if OpenAI is None or not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=501, detail="STT not configured (OpenAI missing or key not set)")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty audio")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(raw)
            tmp_path = tmp.name

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        with open(tmp_path, "rb") as f:
            resp = client.audio.transcriptions.create(model="whisper-1", file=f)  # type: ignore
        # SDKs differ slightly; try common shapes
        text = getattr(resp, "text", None)
        if text is None and isinstance(resp, dict):
            text = resp.get("text")
        return {"transcript": text or ""}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


