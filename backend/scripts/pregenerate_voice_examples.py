"""
Pre-generate Spanish native-voice example WAVs (OFFLINE, SLOW)
=============================================================
Generates each curated phrase from `backend.services.voice_examples` with a
cloned Voicebox profile and caches the resulting WAV under
backend/data/voice_examples/es/, plus a manifest.json the API serves.

Why a script and not an endpoint: CPU synthesis is ~1-3 min/phrase, so the full
set can take 20-40 min. This is a one-time job; the agent then plays the cached
audio instantly. Safe to re-run — already-cached phrases are skipped unless
--force is given, so an interrupted run just resumes.

Usage (from the repo ROOT):
    python -m backend.scripts.pregenerate_voice_examples
    python -m backend.scripts.pregenerate_voice_examples --profile <voicebox-profile-id>
    python -m backend.scripts.pregenerate_voice_examples --force        # regenerate all
    python -m backend.scripts.pregenerate_voice_examples --only greet_welcome,pron_rr

Voicebox must be running locally (docker 17600 or desktop 17493). The target
profile must be a CLONED voice (voice_type: cloned) for a native model.
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
import time
from typing import Dict, List, Optional, Tuple

import httpx

from backend.services.voice_examples import (
    VOICE_EXAMPLES,
    VOICE_EXAMPLES_DIR,
    MANIFEST_PATH,
    RAW_BACKUP_DIRNAME,
    example_wav_path,
    example_wav_filename,
    load_manifest,
    trim_leading_prefix,
    EXAMPLE_LANGUAGE,
    EXAMPLE_ENGINE,
    EXAMPLE_MODEL_SIZE,
)

# The owner's cloned Spanish voice (created in Voicebox). Override with --profile.
DEFAULT_PROFILE = "f6f43a53-8b13-4d63-9ac6-6ab9ba0177b6"

_CANDIDATES = [u for u in [
    os.getenv("VOICEBOX_URL", "").rstrip("/"),
    "http://127.0.0.1:17600",   # docker compose (host-mapped)
    "http://127.0.0.1:17493",   # desktop app
] if u]

_DONE = {"completed", "complete", "done", "success"}
_FAIL = {"failed", "error", "cancelled", "canceled"}

_GENERATE_TIMEOUT = 20.0
_POLL_INTERVAL = 3.0
_POLL_TIMEOUT = 360.0   # generous: CPU synthesis of one phrase can take minutes
_AUDIO_TIMEOUT = 30.0


def resolve_base(client: httpx.Client) -> Optional[str]:
    for base in _CANDIDATES:
        try:
            r = client.get(f"{base}/profiles", timeout=3.0)
            if r.status_code == 200:
                return base
        except Exception:
            continue
    return None


def profile_exists(client: httpx.Client, base: str, profile_id: str) -> bool:
    try:
        r = client.get(f"{base}/profiles", timeout=5.0)
        if r.status_code != 200:
            return False
        for p in r.json() or []:
            if isinstance(p, dict) and p.get("id") == profile_id:
                return True
    except Exception:
        pass
    return False


def generate_one(client: httpx.Client, base: str, profile_id: str, text: str) -> Tuple[bytes, float]:
    """Generate one phrase and return (wav_bytes, audio_duration_seconds).
    Raises RuntimeError on any failure (caller decides whether to continue)."""
    payload = {
        "text": text,
        "profile_id": profile_id,
        "language": EXAMPLE_LANGUAGE,
        "engine": EXAMPLE_ENGINE,
        "model_size": EXAMPLE_MODEL_SIZE,
    }
    r = client.post(f"{base}/generate", json=payload, timeout=_GENERATE_TIMEOUT)
    if r.status_code != 200:
        raise RuntimeError(f"/generate HTTP {r.status_code}: {r.text[:200]}")
    gen = r.json()
    gen_id = gen.get("id")
    if not gen_id:
        raise RuntimeError(f"/generate returned no id: {gen}")

    status = (gen.get("status") or "").lower()
    deadline = time.monotonic() + _POLL_TIMEOUT
    while status not in _DONE and status not in _FAIL:
        if time.monotonic() > deadline:
            raise RuntimeError(f"timed out after {_POLL_TIMEOUT:.0f}s (last status={status!r})")
        time.sleep(_POLL_INTERVAL)
        try:
            hr = client.get(f"{base}/history/{gen_id}", timeout=8.0)
            if hr.status_code == 200:
                gen = hr.json()
                status = (gen.get("status") or "").lower()
        except Exception:
            continue

    if status in _FAIL:
        raise RuntimeError(f"generation failed: {gen.get('error')}")

    duration = float(gen.get("duration") or 0.0)
    ar = client.get(f"{base}/audio/{gen_id}", timeout=_AUDIO_TIMEOUT)
    if ar.status_code != 200 or not ar.headers.get("content-type", "").startswith("audio/"):
        raise RuntimeError(f"/audio HTTP {ar.status_code} ct={ar.headers.get('content-type')}")
    return ar.content, duration


def main() -> int:
    ap = argparse.ArgumentParser(description="Pre-generate Spanish native-voice example WAVs.")
    ap.add_argument("--profile", default=DEFAULT_PROFILE, help="Voicebox cloned profile id")
    ap.add_argument("--force", action="store_true", help="Regenerate even if already cached")
    ap.add_argument("--only", default="", help="Comma-separated example ids to (re)generate")
    args = ap.parse_args()

    only_ids = {s.strip() for s in args.only.split(",") if s.strip()} or None

    os.makedirs(VOICE_EXAMPLES_DIR, exist_ok=True)
    manifest = load_manifest()
    manifest["profile_id"] = args.profile
    items: Dict[str, dict] = manifest.setdefault("items", {})

    with httpx.Client() as client:
        base = resolve_base(client)
        if base is None:
            print("[ERROR] Voicebox not reachable on any candidate port "
                  f"({', '.join(_CANDIDATES)}). Is it running?", file=sys.stderr)
            return 2
        print(f"[info] Voicebox base: {base}")
        if not profile_exists(client, base, args.profile):
            print(f"[ERROR] profile {args.profile} not found in Voicebox. "
                  "Create/clone the voice first, or pass --profile.", file=sys.stderr)
            return 3
        print(f"[info] profile ok: {args.profile}")

        targets = [e for e in VOICE_EXAMPLES if (only_ids is None or e["id"] in only_ids)]
        print(f"[info] {len(targets)} phrase(s) to consider "
              f"(engine={EXAMPLE_ENGINE} {EXAMPLE_MODEL_SIZE}, lang={EXAMPLE_LANGUAGE})")

        ok, skipped, failed = 0, 0, 0
        for i, e in enumerate(targets, 1):
            eid, text = e["id"], e["text"]
            wav_path = example_wav_path(eid)
            already = os.path.exists(wav_path) and eid in items
            if already and not args.force:
                print(f"[{i}/{len(targets)}] skip (cached): {eid}")
                skipped += 1
                continue

            print(f"[{i}/{len(targets)}] generating: {eid} — {text[:48]!r} ...", flush=True)
            t0 = time.time()
            try:
                wav_bytes, duration = generate_one(client, base, args.profile, text)
            except Exception as ex:
                print(f"    [FAIL] {eid}: {ex}", file=sys.stderr, flush=True)
                failed += 1
                continue

            # Qwen cloning prepends the reference audio — trim it. Keep the
            # untrimmed original under _raw/ so the trim stays reversible, and
            # fall back to the untrimmed audio if validation rejects the cut.
            raw_dir = os.path.join(VOICE_EXAMPLES_DIR, RAW_BACKUP_DIRNAME)
            os.makedirs(raw_dir, exist_ok=True)
            with open(os.path.join(raw_dir, example_wav_filename(eid)), "wb") as f:
                f.write(wav_bytes)
            trimmed_bytes, tinfo = trim_leading_prefix(wav_bytes, expected_chars=len(text))
            out_bytes = trimmed_bytes if tinfo["ok"] else wav_bytes
            with open(wav_path, "wb") as f:
                f.write(out_bytes)
            items[eid] = {
                "filename": example_wav_filename(eid),
                "duration": round((tinfo["new_sec"] if tinfo["ok"] else duration) or 0, 2),
                "bytes": len(out_bytes),
                "trimmed": bool(tinfo["ok"]),
                "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
            }
            if not tinfo["ok"]:
                print(f"    [warn] {eid}: prefix trim skipped ({tinfo['reason']}) — kept full audio", flush=True)
            manifest["generated_at"] = datetime.datetime.now().isoformat(timespec="seconds")
            # Persist after EACH phrase so an interruption keeps partial progress.
            with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)
            print(f"    [OK] {eid}: {len(wav_bytes)} bytes, {duration:.1f}s audio, "
                  f"{time.time()-t0:.0f}s gen", flush=True)
            ok += 1

    print(f"\n[done] generated={ok} skipped={skipped} failed={failed} "
          f"→ manifest: {MANIFEST_PATH}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
