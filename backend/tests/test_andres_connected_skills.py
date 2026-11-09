"""
Andrés — connected skills contract tests (offline, CI-safe).

Connected skills are specialized expert agents Andrés can CONSULT on demand — not
sandboxed code, not his memory. These tests exercise the registry, the in-process
consult of the Enonic 'Red Cross' expert (its own offline mock when no LLM), the
attribution envelope, the error paths, and the prompt-awareness block. No network
or model access.

Run: python -m pytest backend/tests/test_andres_connected_skills.py -v
"""
import pytest
from fastapi import HTTPException

from backend.services.andres import connected_skills as cs
from backend.services.andres.prompt_assembler import assemble_system_prompt


def test_registry_lists_experts_with_availability():
    skills = cs.list_connected()
    ids = [s["id"] for s in skills]
    assert "enonic-red-cross" in ids and "agi-progress" in ids
    for sk in skills:
        assert sk["health"]["available"] is True     # backing services import
        assert sk["name"] and sk["domain"] and sk["description"]
        assert isinstance(sk.get("suggested_use"), list) and sk["suggested_use"]


@pytest.mark.asyncio
async def test_consult_agi_progress_expert():
    res = await cs.consult("agi-progress", "Who wins at exploratory testing, human or AI?", "en")
    assert res["skill_id"] == "agi-progress"
    assert "AGI" in res["skill_name"]
    ans = res["answer"]
    assert set(("short_answer", "sections", "evidence_status", "is_mock")).issubset(ans.keys())
    # every section carries one of the AGI expert's own evidence levels
    allowed = {"workshop-verdict", "principle", "tracker", "scenario", "benefit", "guidance", "unsupported"}
    assert all(s["level"] in allowed for s in ans["sections"])


@pytest.mark.asyncio
async def test_consult_returns_attributed_expert_answer():
    res = await cs.consult("enonic-red-cross", "How should I test case 29376?", "es")
    assert res["skill_id"] == "enonic-red-cross"
    assert "Red Cross" in res["skill_name"]
    # attribution must make clear the knowledge is the expert's, not Andrés'
    assert "not to Andr" in res["attribution"] or "not Andr" in res["attribution"]
    ans = res["answer"]
    # the expert's own grounded shape is preserved verbatim
    assert set(("short_answer", "sections", "evidence_status", "is_mock")).issubset(ans.keys())
    assert ans["evidence_status"] in {"supported", "partial", "insufficient"}


@pytest.mark.asyncio
async def test_consult_unknown_skill_and_empty_question():
    with pytest.raises(HTTPException) as e1:
        await cs.consult("does-not-exist", "hi", "en")
    assert e1.value.status_code == 404
    with pytest.raises(HTTPException) as e2:
        await cs.consult("enonic-red-cross", "   ", "en")
    assert e2.value.status_code == 400


def test_prompt_block_makes_andres_aware_and_honest():
    block = cs.prompt_block()
    assert "CONNECTED SKILLS" in block
    assert "Red Cross" in block
    # honesty rail: never present the expert's knowledge as his own
    assert "never present its knowledge as your own" in block
    # and it threads into the assembled system prompt
    prompt = assemble_system_prompt({"identity": {}}, connected_skills_block=block)
    assert "CONNECTED SKILLS" in prompt
