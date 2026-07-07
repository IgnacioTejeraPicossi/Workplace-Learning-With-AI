"""
Trim the leaked reference prefix from cached Spanish example WAVs.
================================================================
Qwen voice cloning prepends the profile's (long) reference audio before each
generated phrase. This trims that prefix using silence detection + a speech-rate
validation (see services.voice_examples.trim_leading_prefix), keeping a backup
of every original under backend/data/voice_examples/es/_raw/.

Files that FAIL validation (the trim would cut into the target) are left intact
and reported. With --regen-failures they are regenerated from scratch and
re-trimmed (a fresh generation usually has a cleaner boundary).

Usage (from repo ROOT):
    python -m backend.scripts.trim_voice_examples
    python -m backend.scripts.trim_voice_examples --regen-failures
    python -m backend.scripts.trim_voice_examples --only enc_seeyou --regen-failures
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import shutil
import sys
import wave
from typing import Dict, List, Optional

from backend.services.voice_examples import (
    VOICE_EXAMPLES,
    VOICE_EXAMPLES_DIR,
    MANIFEST_PATH,
    RAW_BACKUP_DIRNAME,
    example_wav_path,
    load_manifest,
    trim_leading_prefix,
)

_TEXT_BY_ID = {e["id"]: e["text"] for e in VOICE_EXAMPLES}
_RAW_DIR = os.path.join(VOICE_EXAMPLES_DIR, RAW_BACKUP_DIRNAME)


def _wav_seconds(path: str) -> float:
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


def _backup_original(example_id: str, path: str) -> str:
    """Copy the untrimmed original to _raw/ the FIRST time only (so re-running
    the trimmer never overwrites the pristine original with a trimmed one)."""
    os.makedirs(_RAW_DIR, exist_ok=True)
    raw_path = os.path.join(_RAW_DIR, os.path.basename(path))
    if not os.path.exists(raw_path):
        shutil.copy2(path, raw_path)
    return raw_path


def trim_all(only: Optional[set]) -> List[str]:
    """Trim every cached example (from its pristine original). Returns the list
    of ids that FAILED validation and were left untouched."""
    manifest = load_manifest()
    items: Dict[str, dict] = manifest.setdefault("items", {})
    failures: List[str] = []

    for e in VOICE_EXAMPLES:
        eid, text = e["id"], e["text"]
        if only and eid not in only:
            continue
        path = example_wav_path(eid)
        if not os.path.exists(path) or eid not in items:
            continue

        raw_path = _backup_original(eid, path)
        # Always trim from the pristine ORIGINAL so trims are idempotent.
        with open(raw_path, "rb") as f:
            original = f.read()

        out, info = trim_leading_prefix(original, expected_chars=len(text))
        if not info["ok"]:
            print(f"[SKIP] {eid}: {info['reason']} "
                  f"(orig={info['orig_sec']}s) — left intact", flush=True)
            failures.append(eid)
            continue

        with open(path, "wb") as f:
            f.write(out)
        items[eid]["duration"] = round(info["new_sec"], 2)
        items[eid]["bytes"] = len(out)
        items[eid]["trimmed"] = True
        items[eid]["trimmed_at"] = datetime.datetime.now().isoformat(timespec="seconds")
        print(f"[OK]   {eid}: {info['orig_sec']}s → {info['new_sec']}s "
              f"(cut {info['boundary_sec']}s prefix)", flush=True)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    return failures


def regen_and_retrim(ids: List[str], profile: str, attempts: int = 1) -> List[str]:
    """Regenerate the given ids from scratch, then trim again. Each id is retried
    up to `attempts` times until the trim passes the voiced-content validation
    (generation is stochastic, so a retry often succeeds). Returns ids that still
    fail after all attempts."""
    import httpx
    from backend.scripts.pregenerate_voice_examples import resolve_base, generate_one

    still_failing: List[str] = []
    manifest = load_manifest()
    items: Dict[str, dict] = manifest.setdefault("items", {})

    with httpx.Client() as client:
        base = resolve_base(client)
        if base is None:
            print("[ERROR] Voicebox not reachable — cannot regenerate.", file=sys.stderr)
            return ids
        for eid in ids:
            text = _TEXT_BY_ID[eid]
            succeeded = False
            last_bytes = None
            last_info = None
            for attempt in range(1, attempts + 1):
                print(f"[regen] {eid} (attempt {attempt}/{attempts}): {text[:36]!r} ...", flush=True)
                try:
                    wav_bytes, _dur = generate_one(client, base, profile, text)
                except Exception as ex:
                    print(f"    [FAIL regen] {eid}: {ex}", file=sys.stderr, flush=True)
                    continue
                out, info = trim_leading_prefix(wav_bytes, expected_chars=len(text))
                last_bytes, last_info = (out if info["ok"] else wav_bytes), info
                if info["ok"]:
                    os.makedirs(_RAW_DIR, exist_ok=True)
                    with open(os.path.join(_RAW_DIR, f"{eid}.wav"), "wb") as f:
                        f.write(wav_bytes)
                    with open(example_wav_path(eid), "wb") as f:
                        f.write(out)
                    items[eid].update(duration=round(info["new_sec"], 2), bytes=len(out), trimmed=True,
                                      trimmed_at=datetime.datetime.now().isoformat(timespec="seconds"))
                    print(f"    [OK] {eid}: → {info['new_sec']}s (voiced={info.get('voiced_frac')})", flush=True)
                    succeeded = True
                    break
                print(f"    [retry] {eid}: {info['reason']}", flush=True)

            if not succeeded:
                # Keep the best (last) fresh generation untrimmed so it at least plays.
                if last_bytes is not None:
                    with open(example_wav_path(eid), "wb") as f:
                        f.write(last_bytes)
                    items[eid].update(duration=round((last_info.get("orig_sec") or 0), 2), trimmed=False)
                print(f"    [still bad after {attempts}] {eid}", flush=True)
                still_failing.append(eid)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    return still_failing


def main() -> int:
    ap = argparse.ArgumentParser(description="Trim the leaked reference prefix from example WAVs.")
    ap.add_argument("--only", default="", help="Comma-separated ids to trim")
    ap.add_argument("--regen-failures", action="store_true", help="Regenerate + retrim files that fail validation")
    ap.add_argument("--attempts", type=int, default=1, help="Max regeneration attempts per failed file")
    ap.add_argument("--profile", default="f6f43a53-8b13-4d63-9ac6-6ab9ba0177b6", help="Voicebox profile id for regeneration")
    args = ap.parse_args()

    only = {s.strip() for s in args.only.split(",") if s.strip()} or None
    print(f"[info] trimming (backup dir: {_RAW_DIR})")
    failures = trim_all(only)

    if failures and args.regen_failures:
        print(f"\n[info] regenerating {len(failures)} failed file(s) up to {args.attempts}x: {failures}")
        failures = regen_and_retrim(failures, args.profile, attempts=args.attempts)

    print(f"\n[done] remaining failures: {failures or 'none'}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
