from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class Finding(BaseModel):
    code: str                      # e.g., "PM.EPI.SYN_CONFAB"
    title: str                     # "Synthetic Confabulation"
    axis: str                      # "Epistemic"
    evidence: List[str] = []       # snippets / examples
    score: float = 0.0             # 0–1 severity
    confidence: float = 0.0        # 0–1 detector confidence
    advice: List[str] = []         # micro-therapies

class CaseIntake(BaseModel):
    run_id: str
    workflow: Optional[str] = None
    started_at: Optional[datetime] = None
    meta: Dict = {}                # model, params, environment
    # minimally required telemetry:
    turns: List[Dict] = []         # [{role, content, tool_call?, tool_result?, ts}, ...]

class DiagnosisReport(BaseModel):
    run_id: str
    summary: str
    findings: List[Finding]
    overall_risk: str              # "low" | "moderate" | "high" | "critical"
    recommended_protocol: List[str]
    version: str = "0.1.0"
