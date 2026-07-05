"""
Voicebox proxy — Router
=======================
Thin, defensive proxy between the browser and a LOCALLY-running Voicebox
instance (jamiepine/voicebox — https://voicebox.sh). Voicebox is an
open-source, local-first voice studio (TTS + voice cloning) that exposes a
REST API on 127.0.0.1:17493 and keeps all voice data on the user's machine.

Why proxy instead of calling Voicebox directly from the browser?
  1. CORS: Voicebox's local server does not advertise Access-Control-Allow-Origin,
     so a fetch from the React app (:3000) would be blocked. Server-to-server
     from our FastAPI backend has no CORS.
  2. Single, stable surface: the frontend talks to /api/voice/* and never needs
     to know Voicebox's port or shape.

Everything degrades gracefully: if Voicebox is not running, /health returns
{available: false} (HTTP 200) so the UI simply hides the Voicebox options and
keeps using the browser Web Speech API.

Config: VOICEBOX_URL env var (default http://127.0.0.1:17493).
"""

import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/voice")

# Voicebox can run two ways, each on a different host port:
#   - Desktop app (MSI install): native port 17493
#   - Docker (docker compose up): compose maps host 17600 → container 17493
# We probe all candidates (env override first) and remember whichever answers.
_ENV_URL = os.getenv("VOICEBOX_URL", "").rstrip("/")
_CANDIDATES = [u for u in [
    _ENV_URL,
    "http://127.0.0.1:17493",   # desktop app
    "http://127.0.0.1:17600",   # docker compose
] if u]
# De-dupe preserving order.
_CANDIDATES = list(dict.fromkeys(_CANDIDATES))

# Last base URL that responded — used by /speak so it hits the live instance.
_ACTIVE_BASE = _CANDIDATES[0] if _CANDIDATES else "http://127.0.0.1:17493"

_HEALTH_TIMEOUT = 1.2
_SPEAK_TIMEOUT = 30.0


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    profile_id: Optional[str] = Field(None, description="Voicebox profile id or name")
    language: Optional[str] = Field(None, description="Language tag, e.g. 'no', 'en'")


def _normalize_profiles(raw: Any) -> List[Dict[str, Any]]:
    """Voicebox may return profiles as a list or under a key. Normalise to
    [{id, name, language}]. Defensive to unknown shapes."""
    items = []
    if isinstance(raw, dict):
        raw = raw.get("profiles") or raw.get("items") or raw.get("data") or []
    if isinstance(raw, list):
        for p in raw:
            if not isinstance(p, dict):
                continue
            items.append({
                "id":       p.get("id") or p.get("profile_id") or p.get("uuid") or p.get("name"),
                "name":     p.get("name") or p.get("label") or p.get("id") or "Profile",
                "language": p.get("language") or p.get("lang") or (p.get("languages") or [None])[0],
            })
    return items


@router.get("/health", summary="Is a local Voicebox instance reachable?")
async def health() -> Dict[str, Any]:
    """Never raises. Probes each candidate URL (desktop 17493, docker 17600).
    Returns {available, profiles, base}. available=false when no Voicebox is
    running — the UI then falls back to the browser voice."""
    global _ACTIVE_BASE
    async with httpx.AsyncClient(timeout=_HEALTH_TIMEOUT) as client:
        for base in _CANDIDATES:
            try:
                r = await client.get(f"{base}/profiles")
                if r.status_code == 200:
                    _ACTIVE_BASE = base
                    return {"available": True, "profiles": _normalize_profiles(r.json()), "base": base}
            except Exception:
                continue
    return {"available": False, "profiles": [], "base": _ACTIVE_BASE}


@router.post("/speak", summary="Synthesise text via Voicebox (native or cloned profile)")
async def speak(body: SpeakRequest):
    """Proxy to Voicebox POST /generate and stream the audio back to the browser.

    On any connection error (Voicebox not running) returns HTTP 503 with
    {available:false} so the frontend can fall back to the browser voice.
    """
    payload: Dict[str, Any] = {"text": body.text}
    if body.profile_id:
        # Voicebox /generate uses profile_id; /speak uses profile. Send both keys
        # so we work regardless of which the running build expects.
        payload["profile_id"] = body.profile_id
        payload["profile"] = body.profile_id
    if body.language:
        payload["language"] = body.language

    try:
        async with httpx.AsyncClient(timeout=_SPEAK_TIMEOUT) as client:
            r = await client.post(f"{_ACTIVE_BASE}/generate", json=payload)
    except Exception as e:
        return JSONResponse(status_code=503, content={"available": False, "error": str(e)})

    if r.status_code != 200:
        # Surface Voicebox's own error but keep a machine-readable flag.
        detail = ""
        try:
            detail = r.text[:400]
        except Exception:
            pass
        return JSONResponse(status_code=502, content={"available": True, "voicebox_status": r.status_code, "detail": detail})

    content_type = r.headers.get("content-type", "")
    if content_type.startswith("audio/"):
        # Happy path: audio bytes → stream straight to the browser <audio>.
        return Response(content=r.content, media_type=content_type)

    # Voicebox returned JSON (e.g. a job/URL/base64). Pass it through so the
    # frontend can inspect; it will fall back to the browser voice if it can't
    # play it. Kept non-fatal on purpose.
    try:
        return JSONResponse(status_code=200, content={"available": True, "non_audio": True, "payload": r.json()})
    except Exception:
        return JSONResponse(status_code=200, content={"available": True, "non_audio": True, "raw": r.text[:400]})
