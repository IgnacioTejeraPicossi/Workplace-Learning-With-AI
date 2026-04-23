"""Router for the 'Homo Sapiens vs. KI i Test' workshop tab.

Two endpoints, both delegating to backend.services.homo_vs_ai_service:
  - POST /challenge — runs one of the prewritten testing challenges.
  - POST /route     — given a free-form problem description, asks the LLM to
                      pick the most appropriate challenge (1 of 10) and explain
                      why. Used by the "Problem Router" panel at the top of
                      Section 03 in the frontend.
"""

from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.services.homo_vs_ai_service import TASK_SPECS, route_problem, run_challenge

router = APIRouter(prefix="/api/agi/homo-vs-ai", tags=["Homo vs AI Testing"])


TaskLiteral = Literal[
    "scenarios",
    "risk",
    "ambiguities",
    "exploratory",
    "followups",
    "automation",
    "testData",
    "oracle",
    "triage",
    "accessibility",
    "tests_from_code",
]


_FORWARDED_HEADERS = (
    "x-api-provider", "x-openai-key", "x-openrouter-key",
    "x-itemai-endpoint", "x-itemai-model", "x-itemai-url", "x-itemserverai-url",
)


def _collect_llm_headers(request: Request) -> dict:
    return {k: v for k in _FORWARDED_HEADERS if (v := request.headers.get(k))}


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


class RouteRequest(BaseModel):
    problem: str = Field(..., min_length=10, description="Free-form description of the testing problem to route.")
    language: Optional[str] = Field(
        default=None,
        description="Optional hint: 'en' or 'no' — drives the language of the rationale only.",
    )


class RouteRunnerUp(BaseModel):
    task: str
    why: str


class RouteResponse(BaseModel):
    recommended: str = Field(..., description="The task key best suited for the problem (one of the 10 active tasks).")
    rationale: str = Field(..., description="1-3 sentence explanation, written in the requested language.")
    runner_ups: List[RouteRunnerUp] = Field(default_factory=list, description="Up to 2 alternative tasks with a one-line 'why'.")
    raw: Optional[str] = Field(
        default=None,
        description="Raw LLM output — populated only when JSON parsing failed, useful for debugging.",
    )


@router.get("/tasks")
async def list_tasks():
    """Lightweight discovery endpoint — useful for the frontend's prompt hints."""
    return {k: v["label"] for k, v in TASK_SPECS.items()}


@router.post("/challenge", response_model=ChallengeResponse)
async def run_challenge_endpoint(body: ChallengeRequest, request: Request):
    hdrs = _collect_llm_headers(request)
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


@router.post("/route", response_model=RouteResponse)
async def route_problem_endpoint(body: RouteRequest, request: Request):
    hdrs = _collect_llm_headers(request)
    try:
        result = await route_problem(
            problem=body.problem,
            language=body.language,
            request_headers=hdrs,
        )
        return RouteResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI routing failed: {e}")
