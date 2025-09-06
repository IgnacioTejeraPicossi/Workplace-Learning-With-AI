# Human+Humanoid Lab Schemas - Data Models
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Twin(BaseModel):
    """Digital twin representing human operator"""
    human_role: str
    skills: List[str] = []
    constraints: Dict[str, float] = {}  # e.g., {"max_load": 8.0, "max_reach": 1.1}
    environment: Dict[str, Any] = {}    # e.g., {"zone": "A1", "shelf_height": 1.6}

class TaskSpec(BaseModel):
    """Task specification for humanoid operations"""
    name: str
    description: str
    steps_hint: Optional[List[str]] = None
    safety_requirements: Optional[List[str]] = None

class PlanRequest(BaseModel):
    """Request for generating a task plan"""
    twin: Twin
    task: TaskSpec
    quality_goal: str = "balanced"  # "min_time", "min_errors", "balanced"

class Step(BaseModel):
    """Individual step in a task plan"""
    index: int
    action: str
    est_seconds: float

class Plan(BaseModel):
    """Generated task plan"""
    task_name: str
    steps: List[Step]
    est_total_seconds: float

class SimulationResult(BaseModel):
    """Result of task simulation"""
    ok: bool
    sim_total_seconds: float
    telemetry: List[Dict[str, Any]]
    kpis: Dict[str, Any]

class SafetyReport(BaseModel):
    """Safety evaluation report"""
    ok: bool
    findings: List[str]

class JudgeScore(BaseModel):
    """Performance evaluation score"""
    score: float
    explain: Dict[str, Any]

class HumanoidRun(BaseModel):
    """Complete humanoid run record"""
    plan: Optional[Plan] = None
    sim: Optional[SimulationResult] = None
    safety: Optional[SafetyReport] = None
    judge: Optional[JudgeScore] = None
    created_at: Optional[datetime] = None

class TeleopCommand(BaseModel):
    """Teleoperation command"""
    type: str  # "move", "grip_open", "grip_close", "home", "stop"
    args: Dict[str, Any] = {}
    dry_run: bool = True

class FilterParams(BaseModel):
    """Parameters for filtering runs"""
    start: Optional[str] = None
    end: Optional[str] = None
    min_score: Optional[float] = None
    safety_ok: Optional[bool] = None
    task: Optional[str] = None
    min_time_ratio: Optional[float] = None
    max_time_ratio: Optional[float] = None
    only_minor_events: Optional[bool] = None
    limit: int = 20
