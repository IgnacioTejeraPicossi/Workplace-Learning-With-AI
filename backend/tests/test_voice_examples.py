"""
Contract/smoke tests for the Spanish native-voice example subsystem.
Offline — never touches Voicebox. Validates the phrase set, the response
builder, id safety, and the two API endpoints (manifest + audio 404 paths).
"""

import os

from fastapi.testclient import TestClient

from backend.services.voice_examples import (
    VOICE_EXAMPLES,
    CATEGORY_ORDER,
    VALID_EXAMPLE_IDS,
    build_examples_response,
    example_wav_path,
    load_manifest,
)


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
