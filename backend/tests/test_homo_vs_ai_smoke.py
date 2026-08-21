"""Pytest wrapper that turns the Homo-vs-AI workshop smoke scripts into a CI gate.

Companion to test_red_cross_qa_smoke.py. The "Homo Sapiens vs. AI in Testing"
workshop module (backend/services/homo_vs_ai_service.py + istqb RAG) shipped its
checks as standalone `python -m backend.tests.smoke_*` scripts guarded by
`if __name__ == "__main__"`, so pytest never collected them and CI never ran them.

This wrapper invokes each script's `main()` from a real pytest test. Runs fully
offline and fast — `conftest.py` sets AI_FORCE_MOCK + a fast-failing MONGO_URI.

Calling conventions:
  - smoke_feedback_log.main()          -> async, returns int exit code (0 == pass)
  - smoke_prompt_evolution.main()      -> async, returns int exit code (0 == pass)
  - smoke_istqb_rag_translation.main() -> sync,  returns int exit code (0 == pass)
"""
import asyncio

from backend.tests.smoke_feedback_log import main as feedback_log_main
from backend.tests.smoke_prompt_evolution import main as prompt_evolution_main
from backend.tests.smoke_istqb_rag_translation import main as istqb_rag_main


def test_feedback_log_smoke():
    rc = asyncio.run(feedback_log_main())
    assert rc == 0, f"smoke_feedback_log main() returned non-zero exit code {rc}"


def test_prompt_evolution_smoke():
    rc = asyncio.run(prompt_evolution_main())
    assert rc == 0, f"smoke_prompt_evolution main() returned non-zero exit code {rc}"


def test_istqb_rag_translation_smoke():
    rc = istqb_rag_main()  # synchronous main()
    assert rc == 0, f"smoke_istqb_rag_translation main() returned non-zero exit code {rc}"
