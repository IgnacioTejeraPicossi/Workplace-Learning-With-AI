"""
Sales Assistant Agent Data Models
Compatible with existing MongoDB setup
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class TargetRef(BaseModel):
    type: Literal["Opportunity", "Contact", "Account"]
    crm_id: str
    name: Optional[str] = None

class NextAction(BaseModel):
    title: str
    detail: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class Action(BaseModel):
    type: Literal[
        "crm.updateOpportunity",
        "crm.createTask", 
        "email.createDraft",
        "slack.postMessage"
    ]
    payload: Dict[str, Any]

class SalesActionBundle(BaseModel):
    run_id: str
    topic: str
    summary_md: str
    targets: List[TargetRef] = []
    recommended_actions: List[NextAction] = []
    actions: List[Action]
    callback_url: str

class AgentCallback(BaseModel):
    run_id: str
    status: Literal["RUNNING", "DONE", "FAILED"]
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None

# Additional models for sales data
class SalesOpportunity(BaseModel):
    crm_id: str
    name: str
    owner: str
    stage: str
    amount: Optional[float] = None
    close_date: Optional[datetime] = None
    next_activity_date: Optional[datetime] = None
    hygiene_score: float = Field(default=0.0, ge=0.0, le=100.0)
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    potential_score: float = Field(default=0.0, ge=0.0, le=100.0)
    missing_fields: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SalesSignal(BaseModel):
    signal_id: str
    opportunity_id: str
    signal_type: Literal["email", "meeting", "stage_change", "calendar"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sentiment: Optional[str] = None
    entities: List[str] = []

class EmailDraft(BaseModel):
    draft_id: str
    opportunity_id: str
    subject: str
    html_content: str
    recipients: List[Dict[str, str]]
    status: Literal["Draft", "Approved", "Sent"] = "Draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
