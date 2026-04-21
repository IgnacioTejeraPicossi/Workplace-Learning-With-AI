"""Router for the 'Homo Sapiens vs. KI i Test' workshop tab.

Single endpoint that dispatches to one of four prewritten testing challenges.
All computation is delegated to backend.services.homo_vs_ai_service.
"""

from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.services.homo_vs_ai_service import TASK_SPECS, run_challenge

router = APIRouter(prefix="/api/agi/homo-vs-ai", tags=["Homo vs AI Testing"])


TaskLiteral = Literal["scenarios", "ambiguities", "followups", "tests_from_code"]


class ChallengeRequest(BaseModel):
    task: TaskLiteral = Field(..., description="Which testing challenge to run.")
    input: str = Field(..., min_length=3, description="Requirement, user story, bug report or code snippet to analyse.")
    language: Optional[str] = Field(
        default=None,
        description="Optional hint: 'en' or 'no'. If omitted, the model answers in the same language as the input.",
    )


class ChallengeResponse(BaseModel):
    task: str
    label: str
    output: str


@router.get("/tasks")
async def list_tasks():
    """Lightweight discovery endpoint — useful for the frontend's prompt hints."""
    return {k: v["label"] for k, v in TASK_SPECS.items()}


@router.post("/challenge", response_model=ChallengeResponse)
async def run_challenge_endpoint(body: ChallengeRequest, request: Request):
    keys = (
        "x-api-provider", "x-openai-key", "x-openrouter-key",
        "x-itemai-endpoint", "x-itemai-model", "x-itemai-url", "x-itemserverai-url",
    )
    hdrs = {k: v for k in keys if (v := request.headers.get(k))}
    try:
        result = await run_challenge(
            task=body.task,
            user_input=body.input,
            language=body.language,
            request_headers=hdrs,
        )
        return ChallengeResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI challenge failed: {e}")
