from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

Axis = Literal["epistemic", "cognitive", "alignment", "ontological", "tool_interface", "memetic", "revaluation"]

class Turn(BaseModel):
    role: Literal["user", "assistant", "system", "tool"] = "user"
    # Generous cap: real conversation turns are far smaller; this only rejects
    # absurd payloads that would burn CPU in the regex detectors (DoS guard).
    content: str = Field(max_length=100_000)
    meta: Dict[str, Any] = Field(default_factory=dict)  # e.g., model, tokens, tool_name, citations

class ScreenRequest(BaseModel):
    turns: List[Turn] = Field(max_length=1000)
    sources: List[Dict[str, Any]] = Field(default_factory=list, max_length=200)  # RAG cites, URLs, doc ids
    meta: Dict[str, Any] = Field(default_factory=dict)           # model, temperature, agent id

class Flag(BaseModel):
    axis: Axis
    type: str                     # e.g., "confabulation", "repetition_loop"
    span: str                     # small excerpt that triggered the flag
    confidence: float = 0.6
    details: Dict[str, Any] = Field(default_factory=dict)  # detector-specific info

class ScreenResponse(BaseModel):
    axis_scores: Dict[Axis, float]   # 0..100
    composite: float                 # 0..100
    top_flags: List[Flag]
    evidence: List[Flag] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TherapyRequest(BaseModel):
    profile: ScreenResponse
    target_issue: str               # e.g., "confabulation"
    context: Dict[str, Any] = Field(default_factory=dict)  # model, agent, policies

class TherapyStep(BaseModel):
    title: str
    prompt_template: str
    rationale: str

class TherapyPlan(BaseModel):
    protocol: str                   # e.g., "Reality-Anchor"
    steps: List[TherapyStep]
    guardrails: List[str]
    success_metrics: List[str]

class ApplyRequest(BaseModel):
    input_prompt: str
    plan: TherapyPlan
    meta: Dict[str, Any] = Field(default_factory=dict)

class ApplyResponse(BaseModel):
    injected_prompt: str
    notes: Dict[str, Any] = Field(default_factory=dict)
