"""
Native-voice example phrases — Spanish Teacher
==============================================
The Spanish Teacher showcases a NATIVE cloned voice (the repo owner, a native
Spanish speaker). Live Voicebox synthesis is too slow on CPU (~1-3 min/phrase),
so instead we PRE-GENERATE a fixed, curated set of example phrases ONCE (offline,
slow) and cache the resulting WAV files. The agent then plays them INSTANTLY.

This module is the single source of truth for:
  - the curated phrase set (id / category / text)
  - where the cached WAVs + manifest live on disk
  - loading the manifest

Generation is done by `backend/scripts/pregenerate_voice_examples.py`.
Serving is done by the /api/voice/examples* endpoints in routers/voicebox.py.

Nothing here talks to Voicebox — keep it dependency-free so the endpoints and
smoke tests can import it without a running TTS engine.
"""

from __future__ import annotations

import io
import json
import os
import wave
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Storage locations. Cached audio lives under backend/data/voice_examples/es/.
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_THIS_DIR)
VOICE_EXAMPLES_DIR = os.path.join(_BACKEND_DIR, "data", "voice_examples", "es")
MANIFEST_PATH = os.path.join(VOICE_EXAMPLES_DIR, "manifest.json")

# Language + engine the phrases are meant to be generated with. The cloned
# profile id is NOT hard-coded here — it is passed to the generation script,
# so the same phrase set can be re-generated for any cloned native profile.
EXAMPLE_LANGUAGE = "es"
EXAMPLE_ENGINE = "qwen"
EXAMPLE_MODEL_SIZE = "0.6B"

# ---------------------------------------------------------------------------
# Curated phrase set. Kept small (high value, reasonable total generation time).
# Categories group them in the UI. `text` is what gets synthesised; `gloss` is a
# short English hint shown to non-Spanish speakers (optional, UI-only).
# ---------------------------------------------------------------------------
VOICE_EXAMPLES: List[Dict[str, str]] = [
    # — Greetings ————————————————————————————————————————————————
    {"id": "greet_welcome",  "category": "greeting",
     "text": "Hola, soy Ignacio, tu profesor de español. ¡Bienvenido a clase!",
     "gloss": "Hi, I'm Ignacio, your Spanish teacher. Welcome to class!"},
    {"id": "greet_howareyou", "category": "greeting",
     "text": "¿Qué tal? ¿Cómo estás hoy?",
     "gloss": "How's it going? How are you today?"},

    # — Classroom instructions ——————————————————————————————————————
    {"id": "instr_repeat",   "category": "instruction",
     "text": "Escucha con atención y repite después de mí.",
     "gloss": "Listen carefully and repeat after me."},
    {"id": "instr_again",    "category": "instruction",
     "text": "Otra vez, por favor. Más despacio.",
     "gloss": "Again, please. More slowly."},
    {"id": "instr_yourturn", "category": "instruction",
     "text": "Ahora te toca a ti. Inténtalo.",
     "gloss": "Now it's your turn. Give it a try."},

    # — Pronunciation showcase (tricky Spanish sounds) ————————————————————
    {"id": "pron_rr",        "category": "pronunciation",
     "text": "El perro de Rodrigo corre rápido por la carretera.",
     "gloss": "Rolling 'rr' showcase."},
    {"id": "pron_ñ",         "category": "pronunciation",
     "text": "La niña pequeña sueña con una montaña en España.",
     "gloss": "The 'ñ' sound showcase."},
    {"id": "pron_jg",        "category": "pronunciation",
     "text": "El gigante Jorge dibuja jirafas en la página.",
     "gloss": "The 'j' / soft 'g' sound showcase."},
    {"id": "pron_ll",        "category": "pronunciation",
     "text": "La lluvia cae sobre las llaves amarillas del castillo.",
     "gloss": "The 'll' sound showcase."},

    # — Encouragement / feedback ——————————————————————————————————————
    {"id": "enc_verygood",   "category": "encouragement",
     "text": "¡Muy bien! Tu pronunciación es excelente.",
     "gloss": "Very good! Your pronunciation is excellent."},
    {"id": "enc_keepgoing",  "category": "encouragement",
     "text": "¡Sigue así! Cada día hablas mejor.",
     "gloss": "Keep it up! You speak better every day."},
    {"id": "enc_seeyou",     "category": "encouragement",
     "text": "¡Hasta la próxima clase! Buen trabajo hoy.",
     "gloss": "See you next class! Good work today."},
]

# Category display order for the UI.
CATEGORY_ORDER = ["greeting", "instruction", "pronunciation", "encouragement"]

# Set of valid ids — used by the audio endpoint to reject arbitrary paths.
VALID_EXAMPLE_IDS = frozenset(e["id"] for e in VOICE_EXAMPLES)


# Directory (under the cache dir) where untrimmed originals are backed up before
# the reference-prefix trim is applied, so trimming is always reversible.
RAW_BACKUP_DIRNAME = "_raw"


def trim_leading_prefix(
    raw: bytes,
    expected_chars: Optional[int] = None,
    *,
    max_boundary_frac: float = 0.72,
    min_gap: float = 0.40,
    lead_in: float = 0.08,
    max_chars_per_sec: float = 22.0,
) -> Tuple[bytes, Dict[str, Any]]:
    """Remove the leaked voice-clone REFERENCE prefix from a generated WAV.

    Qwen voice cloning prepends the profile's reference audio (here: a long book
    passage) before the target phrase. The reference ends with a clear pause, so
    we cut at the END of the LARGEST silence gap found in the first
    `max_boundary_frac` of the clip (the prefix→target boundary), keeping a small
    `lead_in` so the target's first phoneme is not clipped.

    Validation: if `expected_chars` is given, the trimmed speech rate
    (chars / trimmed_seconds) must be <= `max_chars_per_sec`; a higher rate means
    we cut into the target, so we report ok=False and DO NOT trim (caller can
    regenerate). Pure/std-lib only (wave + audioop) so it is unit-testable.

    Returns (out_bytes, info). info = {ok, reason, orig_sec, new_sec, boundary_sec}.
    On any failure out_bytes is the untouched input.
    """
    import audioop  # local import: std-lib, deprecated warning kept out of import time

    fail = {"ok": False, "reason": "", "orig_sec": None, "new_sec": None, "boundary_sec": None}
    try:
        with wave.open(io.BytesIO(raw), "rb") as w:
            sr, sw, ch, n = w.getframerate(), w.getsampwidth(), w.getnchannels(), w.getnframes()
            frames = w.readframes(n)
    except Exception as e:
        fail["reason"] = f"unreadable wav: {e}"
        return raw, fail

    total = n / sr if sr else 0.0
    if total <= 0:
        fail["reason"] = "empty"
        return raw, fail
    fail["orig_sec"] = round(total, 2)

    bytes_per_frame = sw * ch
    win = max(1, int(sr * 0.03))                 # 30 ms analysis window
    peak = audioop.max(frames, sw) or 1
    thr = peak * 0.06                            # silence = 6% of peak amplitude

    # Collect silence gaps whose start is within the first max_boundary_frac.
    gaps: List[Tuple[float, float]] = []          # (start_sec, dur_sec)
    start: Optional[float] = None
    step = win * bytes_per_frame
    for i in range(0, len(frames) - step, step):
        chunk = frames[i:i + step]
        rms = audioop.rms(chunk, sw)
        tt = i / (sr * bytes_per_frame)
        if rms < thr:
            if start is None:
                start = tt
        else:
            if start is not None:
                dur = tt - start
                if dur >= min_gap and start < total * max_boundary_frac:
                    gaps.append((start, dur))
                start = None

    if not gaps:
        fail["reason"] = "no prefix boundary found"
        return raw, fail

    gap_start, gap_dur = max(gaps, key=lambda g: g[1])
    boundary = max(gap_start, gap_start + gap_dur - lead_in)
    new_sec = total - boundary
    info = {"ok": True, "reason": "", "orig_sec": round(total, 2),
            "new_sec": round(new_sec, 2), "boundary_sec": round(boundary, 2)}

    if new_sec < 0.5:
        info.update(ok=False, reason="trimmed too short")
        return raw, info
    if expected_chars and (expected_chars / new_sec) > max_chars_per_sec:
        info.update(ok=False, reason=f"validation: {expected_chars/new_sec:.1f} chars/s > {max_chars_per_sec}")
        return raw, info

    # Slice frames from the boundary to the end.
    start_frame = int(boundary * sr)
    out_frames = frames[start_frame * bytes_per_frame:]

    # Content check: the trimmed segment must actually contain SPEECH, not just
    # silence/noise. Catches defective generations where the model dropped the
    # target after a long reference (the leftover tail is near-silent) — without
    # this, the endpoint would happily serve background noise.
    voiced = 0
    windows = 0
    for i in range(0, len(out_frames) - step, step):
        windows += 1
        if audioop.rms(out_frames[i:i + step], sw) >= thr:
            voiced += 1
    voiced_frac = (voiced / windows) if windows else 0.0
    info["voiced_frac"] = round(voiced_frac, 2)
    if voiced_frac < 0.30:
        info.update(ok=False, reason=f"trimmed audio mostly silent (voiced={voiced_frac:.0%})")
        return raw, info

    buf = io.BytesIO()
    with wave.open(buf, "wb") as ow:
        ow.setnchannels(ch)
        ow.setsampwidth(sw)
        ow.setframerate(sr)
        ow.writeframes(out_frames)
    return buf.getvalue(), info


def example_wav_filename(example_id: str) -> str:
    """Deterministic filename for a phrase's cached WAV."""
    return f"{example_id}.wav"


def example_wav_path(example_id: str) -> str:
    return os.path.join(VOICE_EXAMPLES_DIR, example_wav_filename(example_id))


def load_manifest() -> Dict[str, Any]:
    """Return the cache manifest, or an empty skeleton if nothing generated yet.

    Shape: {"profile_id": str|None, "generated_at": str|None,
            "items": {example_id: {"filename", "duration", "generated_at"}}}.
    Never raises — a missing/corrupt manifest yields an empty one so the UI and
    smoke tests degrade gracefully.
    """
    if not os.path.exists(MANIFEST_PATH):
        return {"profile_id": None, "generated_at": None, "items": {}}
    try:
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {"profile_id": None, "generated_at": None, "items": {}}
        data.setdefault("items", {})
        return data
    except Exception:
        return {"profile_id": None, "generated_at": None, "items": {}}


def build_examples_response() -> Dict[str, Any]:
    """Merge the static phrase set with the cache manifest into the shape the
    frontend consumes. Each item carries whether its audio is `cached` and, if
    so, the URL to fetch it. Ordered by CATEGORY_ORDER then declaration order."""
    manifest = load_manifest()
    cached_items = manifest.get("items", {}) or {}

    def _sort_key(e: Dict[str, str]) -> tuple:
        cat = e.get("category", "")
        cat_idx = CATEGORY_ORDER.index(cat) if cat in CATEGORY_ORDER else len(CATEGORY_ORDER)
        return (cat_idx, VOICE_EXAMPLES.index(e))

    items: List[Dict[str, Any]] = []
    for e in sorted(VOICE_EXAMPLES, key=_sort_key):
        eid = e["id"]
        entry = cached_items.get(eid) or {}
        # Audio is playable only if the manifest lists it AND the file exists.
        is_cached = bool(entry) and os.path.exists(example_wav_path(eid))
        items.append({
            "id": eid,
            "category": e["category"],
            "text": e["text"],
            "gloss": e.get("gloss"),
            "cached": is_cached,
            "audio_url": f"/api/voice/examples/{eid}/audio" if is_cached else None,
            "duration": entry.get("duration") if is_cached else None,
        })

    total = len(VOICE_EXAMPLES)
    cached_count = sum(1 for it in items if it["cached"])
    return {
        "profile_id": manifest.get("profile_id"),
        "generated_at": manifest.get("generated_at"),
        "language": EXAMPLE_LANGUAGE,
        "total": total,
        "cached_count": cached_count,
        "categories": CATEGORY_ORDER,
        "items": items,
    }
