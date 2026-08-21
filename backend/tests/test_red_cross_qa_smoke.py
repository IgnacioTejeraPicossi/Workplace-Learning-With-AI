"""Pytest wrapper that turns the Red Cross Web QA smoke scripts into a CI gate.

Why this file exists
--------------------
`smoke_red_cross_qa.py` (~330 assertions) and `smoke_qa_security.py` were
written as standalone `python -m backend.tests.smoke_*` scripts, each guarded by
`if __name__ == "__main__"`. pytest's default `test_*` discovery therefore never
collected them, and the CI allow-list never ran them — so the two flagship QA
modules (Red Cross Web QA + the Phase-H security workbench, ~8.8k LOC) had zero
automated coverage in CI despite the assertions already existing.

This thin wrapper invokes each script's `main()` from a real pytest test, so the
existing assertions become a genuine gate without duplicating them. It runs fully
offline and fast: `conftest.py` sets `AI_FORCE_MOCK=1` (no LLM network probes) and
a fast-failing `MONGO_URI` (Mongo paths degrade to their in-memory fallback in
~0.1 s), so nothing here touches the network.

Two calling conventions are handled:
  - smoke_red_cross_qa.main()  -> async, returns None, raises AssertionError on any
    failed check (a raised assertion fails the test directly).
  - smoke_qa_security.main()   -> async, returns an int exit code (0 == all passed).
"""
import asyncio

from backend.tests.smoke_red_cross_qa import main as red_cross_main
from backend.tests.smoke_qa_security import main as qa_security_main


def test_red_cross_qa_smoke():
    # Raises AssertionError on any failed check; a clean run returns None.
    asyncio.run(red_cross_main())


def test_qa_security_smoke():
    rc = asyncio.run(qa_security_main())
    assert rc == 0, f"smoke_qa_security main() returned non-zero exit code {rc}"
