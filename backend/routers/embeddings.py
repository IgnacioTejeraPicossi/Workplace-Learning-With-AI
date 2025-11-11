from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import requests

router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])


class EmbedRequest(BaseModel):
    text: str
    provider: str | None = "openai"
    model: str | None = "text-embedding-3-small"


def _call_openai(model: str, text: str):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None  # indicate no config
    resp = requests.post(
        "https://api.openai.com/v1/embeddings",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        data=json.dumps({"model": model, "input": text}),
        timeout=30,
    )
    return resp


def _call_lmstudio(model: str, text: str):
    """
    LM Studio provides an OpenAI‑compatible endpoint at {BASE}/embeddings (no auth by default).
    Base URL can be configured via LMSTUDIO_BASE_URL (default http://localhost:1234/v1).
    """
    base = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1")
    url = f"{base.rstrip('/')}/embeddings"
    resp = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps({"model": model, "input": text}),
        timeout=30,
    )
    return resp


@router.post("")
def create_embedding(req: EmbedRequest):
    """
    Generate an embedding for the provided text using OpenAI or LM Studio (ItemAI API).
    Provider selection:
      - provider='openai' (default): uses OPENAI_API_KEY; if missing, falls back to LM Studio.
      - provider='itemai': direct call to LM Studio base URL.
    """
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    provider = (req.provider or "openai").lower()
    model = req.model or "text-embedding-3-small"

    try:
        resp = None
        if provider == "itemai":
            resp = _call_lmstudio(model, text)
        else:
            # try openai first
            resp = _call_openai(model, text)
            if resp is None:
                # no key, fallback to LM Studio
                resp = _call_lmstudio(model, text)

        if resp is None:
            raise HTTPException(status_code=500, detail="No embedding provider available")
        if resp.status_code >= 300:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        data = resp.json()
        emb = data["data"][0]["embedding"]
        return {"embedding": emb, "model": data.get("model") or model}
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Embedding request failed: {e}")

