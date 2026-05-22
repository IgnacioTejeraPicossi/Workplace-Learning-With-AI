"""Smoke test for the 1.15.3 NO→EN translate-then-BM25 layer.

Validates the Option 3 implementation that closes the Norwegian-query
retrieval gap discovered in the 1.15.2 RAG diagnostic:

  Before 1.15.3: NO conceptual queries returned only NO glossary
    fragments (coincidental language overlap, not topic overlap).
  After 1.15.3:  same queries land on EN syllabus chunks (real testing
    guidance), via a small NO→EN ISTQB term dictionary applied to the
    query before tokenization.

The test is index-independent — it exercises the language detection
and translation logic directly, plus the metadata surface in
build_rag_context_block.

Mock-first: works without docs-ISTQB PDFs present (returns empty
chunk list but the translation helpers still validate).
"""

import sys

from backend.services.istqb_local_rag import (
    _is_norwegian_query,
    _translate_query_if_norwegian,
    _NO_EN_ISTQB_TERMS,
    _NO_STOPWORDS_TO_DROP,
)


def main() -> int:
    failures: list[str] = []

    # ── 1. Detection — three signals (æøå, function words, dict hits) ──
    detection_cases = [
        # (text, expected_is_norwegian, label)
        ("boundary value analysis",                          False, "EN keyword query"),
        ("How do I test?",                                   False, "EN question — 'I' is also Norwegian-spelled but only 1 hit"),
        ("risk-based testing",                               False, "EN with dash"),
        ("Hvordan tester jeg dette?",                        True,  "NO with 3 function words"),
        ("kjøre testen igjen",                               True,  "NO with æ/ø/å"),
        ("utforskende testing",                              True,  "NO term-only — 2 dict hits"),
        ("utforskende testing testdesign teknikker",         True,  "NO term-only — 4 dict hits"),
        ("risikoanalyse og tvetydigheter",                   True,  "NO terms + 'og' function word"),
    ]
    for text, expected, label in detection_cases:
        actual = _is_norwegian_query(text)
        if actual != expected:
            failures.append(
                f"detection wrong on {label!r} ({text!r}): "
                f"expected {expected}, got {actual}"
            )
    print(f"[OK] Language detection ({len(detection_cases)} cases, all pass)")

    # ── 2. Translation behaviour — EN passthrough ──────────────────────
    en_query = "boundary value analysis test design technique"
    out, meta = _translate_query_if_norwegian(en_query)
    if out != en_query:
        failures.append(f"EN query should pass through unchanged: got {out!r}")
    if meta["detected"] != "en":
        failures.append(f"EN metadata wrong: {meta}")
    if meta["applied"]:
        failures.append(f"EN should NOT trigger translation: {meta}")
    print(f"[OK] EN passthrough (no translation, metadata.detected=en)")

    # ── 3. Translation behaviour — NO term-only query ──────────────────
    no_terms = "utforskende testing testdesign teknikker"
    out, meta = _translate_query_if_norwegian(no_terms)
    if meta["detected"] != "no":
        failures.append(f"NO terms not detected: {meta}")
    if not meta["applied"]:
        failures.append(f"NO terms should trigger translation: {meta}")
    for needle in ("exploratory", "test design", "techniques"):
        if needle not in out.lower():
            failures.append(f"translated NO query missing {needle!r}: {out!r}")
    # No Norwegian stop-word leakage (term-only query has none anyway, but check).
    print(f"[OK] NO term-only translation "
          f"({len(meta['translated_terms'])} terms swapped: "
          f"{', '.join(p['no']+'→'+p['en'] for p in meta['translated_terms'][:3])}…)")

    # ── 4. Translation behaviour — NO full sentence (stopword filter) ──
    no_sentence = "Hvordan tester jeg en betalingsflyt med uklare krav?"
    out, meta = _translate_query_if_norwegian(no_sentence)
    if meta["detected"] != "no":
        failures.append(f"NO sentence not detected: {meta}")
    if not meta["applied"]:
        failures.append(f"NO sentence should trigger translation: {meta}")
    # Stop-words filtered: 'jeg', 'en', 'med' must be GONE from the output.
    # The translated query should be EN-leaning enough that BM25 redirects
    # away from the NO glossary toward EN syllabi.
    out_lower = out.lower()
    for stopword in ("jeg", "en ", " med "):
        if stopword in (" " + out_lower + " "):
            failures.append(
                f"NO stopword {stopword.strip()!r} not filtered from translated "
                f"query: {out!r}"
            )
    # Translated terms must include the high-value swaps.
    expected_pairs = {("hvordan", "how"), ("tester", "test"),
                       ("betalingsflyt", "payment flow"),
                       ("uklare", "unclear"), ("krav", "requirements")}
    actual_pairs = {(p["no"], p["en"]) for p in meta["translated_terms"]}
    missing_pairs = expected_pairs - actual_pairs
    if missing_pairs:
        failures.append(f"NO sentence missing term translations: {missing_pairs}")
    print(f"[OK] NO full-sentence translation "
          f"(stopwords filtered, {len(meta['translated_terms'])} ISTQB terms swapped)")

    # ── 5. Dictionary sanity — no duplicate keys, all values are EN-ish ─
    if len(_NO_EN_ISTQB_TERMS) < 40:
        failures.append(
            f"NO→EN dict suspiciously small ({len(_NO_EN_ISTQB_TERMS)}); "
            f"expected ≥40 to cover workshop vocabulary"
        )
    # Sanity: self-maps are OK for technical cognates (`testing`, `triage`,
    # `scenario`) — they exist as the same word in both NO and EN. We just
    # cap the count so a future contributor doesn't accidentally fill the
    # dict with identity mappings instead of real translations.
    self_maps = [(k, v) for k, v in _NO_EN_ISTQB_TERMS.items() if k == v]
    if len(self_maps) > 5:
        failures.append(
            f"too many self-maps in NO→EN dict ({len(self_maps)}); "
            f"expected ≤5 technical cognates, got: {self_maps}"
        )
    # Stopwords set: every entry should NOT also be in the term dict.
    overlap = _NO_STOPWORDS_TO_DROP & set(_NO_EN_ISTQB_TERMS.keys())
    if overlap:
        failures.append(
            f"_NO_STOPWORDS_TO_DROP overlaps _NO_EN_ISTQB_TERMS: {overlap} "
            "(stopwords would get translated instead of dropped)"
        )
    print(f"[OK] Dictionary sanity "
          f"({len(_NO_EN_ISTQB_TERMS)} ISTQB terms, "
          f"{len(_NO_STOPWORDS_TO_DROP)} stopwords, no overlaps)")

    # ── 6. build_rag_context_block surfaces query_translation ────────────
    from backend.services.istqb_local_rag import build_rag_context_block
    # Without local provider headers → anchors_only mode, but metadata
    # shape must still include query_translation.
    block, meta = build_rag_context_block(
        request_headers={"x-api-provider": "openai"},
        query="Hvordan tester jeg dette?",
    )
    if "query_translation" not in meta:
        failures.append(
            "build_rag_context_block metadata must include query_translation field"
        )
    elif meta["query_translation"]["detected"] not in ("en", "no"):
        failures.append(
            f"query_translation.detected invalid: {meta['query_translation']}"
        )
    # With local provider headers → mode flips to local_rag (or
    # local_rag_unavailable if no PDFs). Translation metadata populates
    # regardless.
    block, meta = build_rag_context_block(
        request_headers={"x-api-provider": "itemai"},
        query="Hvordan tester jeg dette?",
    )
    if meta["query_translation"]["detected"] != "no":
        failures.append(
            f"local provider with NO query — query_translation.detected should be 'no', "
            f"got {meta['query_translation']}"
        )
    print(f"[OK] build_rag_context_block surfaces query_translation "
          f"(mode={meta['mode']}, detected={meta['query_translation']['detected']})")

    if failures:
        print()
        print("[FAIL] Smoke check failures:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print()
    print("[PASS] ALL ISTQB RAG TRANSLATION SMOKE CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
