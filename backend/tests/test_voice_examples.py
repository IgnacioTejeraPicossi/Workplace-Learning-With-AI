"""
Contract/smoke tests for the Spanish native-voice example subsystem.
Offline — never touches Voicebox. Validates the phrase set, the response
builder, id safety, and the two API endpoints (manifest + audio 404 paths).
"""

import os

from fastapi.testclient import TestClient

import io
import wave

from backend.services.voice_examples import (
    VOICE_EXAMPLES,
    CATEGORY_ORDER,
    VALID_EXAMPLE_IDS,
    build_examples_response,
    example_wav_path,
    load_manifest,
    trim_leading_prefix,
)


def _make_wav(segments, sr=24000):
    """Build a mono 16-bit WAV from (amplitude, seconds) segments.
    amplitude 0 => silence; >0 => a simple loud tone-ish block."""
    import struct
    frames = bytearray()
    for amp, secs in segments:
        for _ in range(int(sr * secs)):
            frames += struct.pack("<h", amp)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(bytes(frames))
    return buf.getvalue()


def test_phrase_set_integrity():
    """Every phrase has the required keys, a known category, and a unique id."""
    assert len(VOICE_EXAMPLES) >= 8, "expected a non-trivial phrase set"
    ids = [e["id"] for e in VOICE_EXAMPLES]
    assert len(ids) == len(set(ids)), "example ids must be unique"
    for e in VOICE_EXAMPLES:
        assert e.get("id") and e.get("text"), f"missing id/text: {e}"
        assert e["category"] in CATEGORY_ORDER, f"unknown category: {e['category']}"
    assert VALID_EXAMPLE_IDS == frozenset(ids)


def test_ids_are_filename_safe():
    """Ids feed a filename + a URL path — no separators / traversal chars."""
    for eid in VALID_EXAMPLE_IDS:
        assert "/" not in eid and "\\" not in eid and ".." not in eid


def test_build_response_shape():
    resp = build_examples_response()
    assert resp["total"] == len(VOICE_EXAMPLES)
    assert resp["language"] == "es"
    assert resp["categories"] == CATEGORY_ORDER
    assert isinstance(resp["items"], list) and len(resp["items"]) == len(VOICE_EXAMPLES)
    for it in resp["items"]:
        assert set(it) >= {"id", "category", "text", "cached", "audio_url"}
        # audio_url present iff cached
        assert (it["audio_url"] is not None) == it["cached"]
        if it["cached"]:
            assert it["audio_url"] == f"/api/voice/examples/{it['id']}/audio"
    # cached_count matches the number of cached items
    assert resp["cached_count"] == sum(1 for it in resp["items"] if it["cached"])


def test_manifest_never_raises():
    """A missing/corrupt manifest yields an empty skeleton, not an exception."""
    m = load_manifest()
    assert isinstance(m, dict) and "items" in m


def test_trim_removes_leading_prefix():
    """A [prefix tone][silence gap][target tone] clip is cut at the gap so the
    trimmed audio starts at the target (roughly the target's duration)."""
    wav = _make_wav([(12000, 4.0), (0, 1.0), (12000, 2.0)])  # 4s prefix, 1s gap, 2s target
    out, info = trim_leading_prefix(wav, expected_chars=20)
    assert info["ok"], info
    # New length should be ~2s (the target) plus the small lead-in, not ~7s.
    assert 1.8 <= info["new_sec"] <= 3.2
    assert info["boundary_sec"] > 3.5  # cut somewhere in/after the 4s prefix
    with wave.open(io.BytesIO(out), "rb") as w:
        assert w.getnframes() / w.getframerate() < 4.0


def test_trim_validation_rejects_overcut():
    """When expected_chars implies an impossible speech rate for the trimmed
    length, trimming is rejected and the original bytes come back untouched."""
    wav = _make_wav([(12000, 5.0), (0, 1.0), (12000, 0.6)])  # tiny target
    out, info = trim_leading_prefix(wav, expected_chars=60)  # 60 chars in ~0.6s -> absurd
    assert not info["ok"]
    assert out == wav


def test_trim_no_boundary_returns_original():
    """Audio with no qualifying silence gap is returned unchanged."""
    wav = _make_wav([(12000, 3.0)])
    out, info = trim_leading_prefix(wav, expected_chars=20)
    assert not info["ok"]
    assert out == wav


def _client() -> TestClient:
    from backend.app import app
    return TestClient(app)


def test_endpoint_examples_manifest():
    r = _client().get("/api/voice/examples")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == len(VOICE_EXAMPLES)
    assert len(body["items"]) == len(VOICE_EXAMPLES)


def test_endpoint_audio_unknown_id_404():
    r = _client().get("/api/voice/examples/not_a_real_id/audio")
    assert r.status_code == 404
    assert "unknown" in r.json().get("error", "").lower()


def test_endpoint_audio_known_but_ungenerated_is_404_or_ok():
    """For a valid id: 404 'not generated yet' when the WAV is absent, or a real
    audio response when the pre-generation has already produced it."""
    eid = next(iter(VALID_EXAMPLE_IDS))
    r = _client().get(f"/api/voice/examples/{eid}/audio")
    if os.path.exists(example_wav_path(eid)):
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("audio/")
    else:
        assert r.status_code == 404
        assert r.json().get("error") == "not generated yet"
