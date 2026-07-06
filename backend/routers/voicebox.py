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

import asyncio
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse, Response
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

# Voicebox v0.5.0 is ASYNCHRONOUS: POST /generate returns a generation record
# ({id, status:"generating", audio_path:""}) immediately, does the TTS work in
# the background, and the audio is fetched later from /audio/{id}. We therefore
# poll /history/{id} until the generation is terminal, then stream the audio.
#   - _GENERATE_TIMEOUT: POST /generate returns fast (it only enqueues).
#   - _POLL_INTERVAL:    seconds between /history/{id} status checks.
#   - _POLL_TIMEOUT:     hard cap on total wait. CPU synthesis of a 1.7B model
#                        can take minutes; a light model (e.g. Qwen 0.6B) is
#                        seconds. Env-tunable so ops can raise it without a deploy.
#   - _AUDIO_TIMEOUT:    fetching the finished WAV bytes.
# Terminal statuses observed from Voicebox: "completed" (ok) / "failed" (error).
_GENERATE_TIMEOUT = 15.0
_POLL_INTERVAL = float(os.getenv("VOICEBOX_POLL_INTERVAL", "1.5"))
_POLL_TIMEOUT = float(os.getenv("VOICEBOX_POLL_TIMEOUT", "180"))
_AUDIO_TIMEOUT = 30.0
_HISTORY_TIMEOUT = 8.0

_DONE_STATUSES = {"completed", "complete", "done", "success"}
_FAIL_STATUSES = {"failed", "error", "cancelled", "canceled"}

# Optional model override applied to every /generate call when the caller does
# not specify one. Lets ops pin a fast/cloning-capable model (e.g. the Qwen
# CustomVoice 0.6B) without code changes. Empty → use the profile/server default.
_DEFAULT_ENGINE = (os.getenv("VOICEBOX_ENGINE", "").strip() or None)
_DEFAULT_MODEL_SIZE = (os.getenv("VOICEBOX_MODEL_SIZE", "").strip() or None)


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    profile_id: Optional[str] = Field(None, description="Voicebox profile id or name")
    language: Optional[str] = Field(None, description="Language tag, e.g. 'no', 'en'")
    engine: Optional[str] = Field(None, description="TTS engine override, e.g. 'qwen'")
    model_size: Optional[str] = Field(None, description="Model size override, e.g. '0.6B'")


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


async def _probe_active_base(client: httpx.AsyncClient) -> Optional[str]:
    """Probe candidate URLs (desktop 17493, docker 17600) for a live Voicebox,
    remember the first that answers /profiles in the module-global _ACTIVE_BASE,
    and return it (or None if none answer). Shared by /health and /speak so that
    /speak never depends on /health having been called first — important because
    a module reload resets _ACTIVE_BASE to the first (possibly dead) candidate."""
    global _ACTIVE_BASE
    for base in _CANDIDATES:
        try:
            r = await client.get(f"{base}/profiles")
            if r.status_code == 200:
                _ACTIVE_BASE = base
                return base
        except Exception:
            continue
    return None


@router.get("/health", summary="Is a local Voicebox instance reachable?")
async def health() -> Dict[str, Any]:
    """Never raises. Probes each candidate URL (desktop 17493, docker 17600).
    Returns {available, profiles, base}. available=false when no Voicebox is
    running — the UI then falls back to the browser voice."""
    async with httpx.AsyncClient(timeout=_HEALTH_TIMEOUT) as client:
        base = await _probe_active_base(client)
        if base is not None:
            try:
                r = await client.get(f"{base}/profiles")
                return {"available": True, "profiles": _normalize_profiles(r.json()), "base": base}
            except Exception:
                pass
    return {"available": False, "profiles": [], "base": _ACTIVE_BASE}


@router.post("/speak", summary="Synthesise text via Voicebox (native or cloned profile)")
async def speak(body: SpeakRequest):
    """Proxy to Voicebox and stream the finished audio back to the browser.

    Voicebox v0.5.0 is asynchronous, so this does three steps behind one call:
      1. POST /generate            → enqueue, get a generation {id, status}
      2. poll GET /history/{id}    → until status is terminal (completed/failed)
      3. GET /audio/{id}           → stream the WAV bytes to the browser

    Every failure path returns JSON with a machine-readable flag (never audio),
    so the frontend's useVoiceEngine can fall back to the browser voice:
      - 503 {available:false}      → Voicebox not reachable
      - 502 {generation_failed}    → Voicebox reported a failed generation
      - 504 {timeout}              → generation did not finish within _POLL_TIMEOUT
    A build that returns audio synchronously is still supported (short-circuit).
    """
    payload: Dict[str, Any] = {"text": body.text}
    if body.profile_id:
        # Voicebox /generate uses profile_id; some builds accept profile. Send
        # both so we work regardless of which the running build expects.
        payload["profile_id"] = body.profile_id
        payload["profile"] = body.profile_id
    if body.language:
        payload["language"] = body.language
    # Model selection: explicit request wins, else the ops-configured default.
    engine = body.engine or _DEFAULT_ENGINE
    model_size = body.model_size or _DEFAULT_MODEL_SIZE
    if engine:
        payload["engine"] = engine
    if model_size:
        payload["model_size"] = model_size

    async with httpx.AsyncClient() as client:
        # Resolve a live Voicebox base first — a module reload resets _ACTIVE_BASE
        # to the first candidate (desktop 17493), which may be dead while only the
        # docker instance (17600) is up. Probing here makes /speak self-sufficient.
        base = await _probe_active_base(client)
        if base is None:
            return JSONResponse(status_code=503, content={"available": False, "error": "Voicebox not reachable on any candidate port"})

        # --- Step 1: enqueue the generation ---------------------------------
        try:
            r = await client.post(f"{base}/generate", json=payload, timeout=_GENERATE_TIMEOUT)
        except Exception as e:
            return JSONResponse(status_code=503, content={"available": False, "error": str(e)})

        if r.status_code != 200:
            detail = ""
            try:
                detail = r.text[:400]
            except Exception:
                pass
            return JSONResponse(status_code=502, content={"available": True, "voicebox_status": r.status_code, "detail": detail})

        content_type = r.headers.get("content-type", "")
        if content_type.startswith("audio/"):
            # Synchronous build: audio came straight back. Stream it.
            return Response(content=r.content, media_type=content_type)

        try:
            gen = r.json()
        except Exception:
            return JSONResponse(status_code=200, content={"available": True, "non_audio": True, "raw": r.text[:400]})

        gen_id = gen.get("id") if isinstance(gen, dict) else None
        if not gen_id:
            # No id and no audio — nothing to poll. Pass through untouched.
            return JSONResponse(status_code=200, content={"available": True, "non_audio": True, "payload": gen})

        # --- Step 2: poll until the generation is terminal ------------------
        status = (gen.get("status") or "").lower()
        deadline = time.monotonic() + _POLL_TIMEOUT
        while status not in _DONE_STATUSES and status not in _FAIL_STATUSES:
            if time.monotonic() > deadline:
                return JSONResponse(status_code=504, content={
                    "available": True, "timeout": True,
                    "generation_id": gen_id, "status": status or "generating",
                    "waited_seconds": round(_POLL_TIMEOUT, 1),
                })
            await asyncio.sleep(_POLL_INTERVAL)
            try:
                hr = await client.get(f"{base}/history/{gen_id}", timeout=_HISTORY_TIMEOUT)
                if hr.status_code == 200:
                    gen = hr.json()
                    status = (gen.get("status") or "").lower()
            except Exception:
                # Transient blip — keep polling until the deadline.
                continue

        if status in _FAIL_STATUSES:
            return JSONResponse(status_code=502, content={
                "available": True, "generation_failed": True,
                "generation_id": gen_id, "error": gen.get("error"),
            })

        # --- Step 3: fetch and stream the finished audio --------------------
        try:
            ar = await client.get(f"{base}/audio/{gen_id}", timeout=_AUDIO_TIMEOUT)
        except Exception as e:
            return JSONResponse(status_code=503, content={"available": True, "audio_fetch_error": str(e), "generation_id": gen_id})

        ar_ct = ar.headers.get("content-type", "")
        if ar.status_code == 200 and ar_ct.startswith("audio/"):
            return Response(content=ar.content, media_type=ar_ct)

        return JSONResponse(status_code=502, content={
            "available": True, "audio_fetch_failed": True,
            "generation_id": gen_id, "audio_status": ar.status_code,
        })


# ═══════════════════════════════════════════════════════════════════════════
# Pre-generated native-voice examples (Spanish Teacher)
# ---------------------------------------------------------------------------
# Live CPU synthesis is too slow (~1-3 min/phrase), so a curated set of Spanish
# example phrases is generated ONCE offline (see scripts/pregenerate_voice_
# examples.py) with the owner's cloned native voice and cached as WAV files.
# These endpoints expose the manifest and serve the cached audio for INSTANT
# playback — no Voicebox round-trip at request time.
# ═══════════════════════════════════════════════════════════════════════════
@router.get("/examples", summary="List pre-generated native-voice example phrases")
async def voice_examples() -> Dict[str, Any]:
    """Return the curated phrase set merged with cache state. Never raises; when
    nothing has been generated yet, items come back with cached=false and the UI
    simply shows them as pending."""
    from backend.services.voice_examples import build_examples_response
    return build_examples_response()


@router.get("/examples/{example_id}/audio", summary="Serve a cached example WAV")
async def voice_example_audio(example_id: str):
    """Stream a cached example WAV. 404 if the id is unknown or not yet generated.
    The id is validated against the known phrase set so it can never be used to
    read arbitrary files."""
    from backend.services.voice_examples import VALID_EXAMPLE_IDS, example_wav_path

    if example_id not in VALID_EXAMPLE_IDS:
        return JSONResponse(status_code=404, content={"error": "unknown example id"})
    path = example_wav_path(example_id)
    if not os.path.exists(path):
        return JSONResponse(status_code=404, content={"error": "not generated yet", "example_id": example_id})
    return FileResponse(path, media_type="audio/x-wav", filename=f"{example_id}.wav")
