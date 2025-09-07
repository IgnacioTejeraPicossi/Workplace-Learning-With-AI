# AgentOps Studio - Data Schemas
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime

# ↓ Fallback para EmailStr si email-validator no está disponible
try:
    from pydantic import EmailStr  # requiere email-validator
except Exception:
    EmailStr = str  # fallback sin validación fuerte

# Software Twin Schema
class SoftwareTwin(BaseModel):
    name: str
    description: str
    capabilities: List[str]
    policies: Dict[str, Any]
    resources: Optional[Dict[str, Any]] = None

# Task Action Schema
class TaskAction(BaseModel):
    id: str
    name: str
    description: str
    type: Literal[
        "fetch_url", "extract_text", "prompt_chain", "classify", 
        "transform", "http_request", "write_file", "send_webhook"
    ]
    estimated_duration: int
    params: Optional[Dict[str, Any]] = {}

# Task Specification Schema
class TaskSpec(BaseModel):
    name: str
    description: str
    actions: List[TaskAction]
    expected_duration: Optional[int] = None
    complexity: Optional[str] = None

# Plan Schema
class Plan(BaseModel):
    task_name: str
    steps: List[Dict[str, Any]]
    est_total_seconds: float

# Safety Report Schema
class SafetyReport(BaseModel):
    ok: bool
    findings: List[str]
    score: Optional[float] = None

# Simulation Result Schema
class SimResult(BaseModel):
    ok: bool
    preview: Optional[Dict[str, Any]] = None
    kpis: Optional[Dict[str, Any]] = None

# Judge Result Schema
class JudgeResult(BaseModel):
    score: float
    recommendations: Optional[List[str]] = None
    checks: Optional[Dict[str, Any]] = None

# Safety Policy Schema
class SafetyPolicy(BaseModel):
    respect_robots: bool = True
    allowed_domains: List[str] = []
    blocked_domains: List[str] = []
    max_chars: int = 12000
    block_toxicity: bool = True

# Prompt Run Schema
class PromptRun(BaseModel):
    system: str = "You are a concise assistant."
    user: str
    model: str = "qwen2.5-7b-instruct"
    temperature: float = 0.3
    max_tokens: int = 512
    policies: SafetyPolicy = SafetyPolicy()

# Studio Settings Schema

class StudioSettings(BaseModel):
    # Global defaults used by Playbook → Execute via AgentOps
    default_spreadsheet_id: Optional[str] = None
    default_sheet_name: Optional[str] = "Reports"

    default_slack_webhook_url: Optional[str] = None

    default_email_to: Optional[EmailStr] = None
    default_email_subject_tpl: Optional[str] = "Report ready: {{topic}}"

    # Optional UX / infra hints
    default_flow_id: Optional[str] = None             # Flow to preselect in dropdown
    lmstudio_base: Optional[str] = None               # e.g., http://localhost:1234/v1

    # Flags
    destinations_enabled_by_default: Optional[bool] = False