"""
GRC Agent Data Models
Responsible AI Ops for Finance/Procurement/Supply Chain/ESG
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class Evidence(BaseModel):
    """Evidence supporting a finding or action"""
    url: Optional[str] = None
    source: Optional[str] = None
    snippet: Optional[str] = None

class Action(BaseModel):
    """Action to be executed by the GRC agent"""
    type: Literal[
        "erp.fix",           # Apply fix to ERP system
        "po.block",          # Block purchase order
        "invoice.hold",      # Hold invoice
        "esg.recalc",        # Recalculate ESG metric
        "notify.slack",      # Send Slack notification
        "notify.teams"       # Send Teams notification
    ]
    payload: Dict[str, Any]
    mode: Literal["Auto", "OneClick"] = "OneClick"

class GrcActionBundle(BaseModel):
    """Bundle of actions to be executed by GRC agent"""
    run_id: str
    object_ref: str              # e.g., PO# / Invoice# / Metric id
    topic: str
    summary_md: str
    evidence: List[Evidence] = []
    actions: List[Action]
    callback_url: str

class AgentCallback(BaseModel):
    """Callback from external systems"""
    run_id: str
    status: Literal["RUNNING", "DONE", "FAILED"]
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None

class BusinessObject(BaseModel):
    """Business object being monitored"""
    type: Literal["PO", "Invoice", "Shipment", "Material", "ESGMetric"]
    external_id: str
    system: str
    owner: str
    status: str
    last_change_at: datetime

class Signal(BaseModel):
    """Signal detected from business objects"""
    object_id: str
    kind: Literal["DataQuality", "Policy", "Risk", "ESG"]
    payload_json: Dict[str, Any]
    occurred_at: datetime

class Finding(BaseModel):
    """Finding generated from signals"""
    object_id: str
    title: str
    summary_md: str
    severity: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    materiality: float = Field(ge=0.0, le=1.0)
    category: str
    status: Literal["Open", "InProgress", "Resolved", "Closed"]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Policy(BaseModel):
    """GRC policy configuration"""
    max_auto_impact: float = 1000.0
    sod_required_roles: List[str] = ["controller", "procurement-approver"]
    confidence_threshold: float = 0.7
    severity_threshold: float = 0.5
    materiality_threshold: float = 0.3
