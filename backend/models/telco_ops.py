"""
Telco Ops Decisioning Agent Data Models
Compatible with existing MongoDB setup
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class ActionType(str, Enum):
    TMF622_ORDER_CREATE = "tmf622.order.create"
    TMF622_ORDER_CHANGE = "tmf622.order.change"
    SUBSCRIPTION_CHANGE = "subscription.change"
    APPOINTMENT_SCHEDULE = "appointment.schedule"
    COMM_SEND = "comm.send"
    CRM_CASE_CREATE = "crm.case.create"

class ExecutionMode(str, Enum):
    AUTO = "auto"
    ONE_CLICK = "one_click"

class RunStatus(str, Enum):
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"

# Base Models
class NextAction(BaseModel):
    title: str
    detail: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class Action(BaseModel):
    type: ActionType
    payload: Dict[str, Any]

class ActionBundle(BaseModel):
    run_id: str
    customer_id: str
    topic: str
    summary_md: str
    recommendations: List[NextAction] = []
    actions: List[Action]
    callback_url: str

class AgentCallback(BaseModel):
    run_id: str
    status: RunStatus
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None

# Customer Context Models
class CustomerContext(BaseModel):
    customer_id: str
    current_plan: Optional[str] = None
    devices: List[str] = []
    tenure: Optional[int] = None  # months
    arpu: Optional[float] = None  # Average Revenue Per User
    risk_score: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    last_order_at: Optional[datetime] = None

# Signal Models
class SignalType(str, Enum):
    USAGE = "usage"
    COMPLAINT = "complaint"
    TRAVEL = "travel"
    COVERAGE = "coverage"
    OFFER = "offer"

class Signal(BaseModel):
    type: SignalType
    source: str
    payload_json: Dict[str, Any]
    occurred_at: datetime

# Recommendation Models
class Recommendation(BaseModel):
    customer_id: str
    title: str
    reason: str
    offering_id: Optional[str] = None
    price_impact: Optional[float] = None
    expected_value: Optional[float] = None
    confidence: float = Field(ge=0.0, le=1.0)
    eligibility: bool = True
    decision_score: Optional[float] = None
    mode: ExecutionMode = ExecutionMode.ONE_CLICK
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Policy Models
class PolicyConfig(BaseModel):
    max_auto_value: float = 50.0
    confidence_threshold: float = 0.7
    risk_threshold: float = 70.0
    required_approval_roles: List[str] = ["ops-supervisor"]

# Integration Response Models
class OrderResponse(BaseModel):
    order_id: str
    status: str
    external_id: str

class AppointmentResponse(BaseModel):
    appointment_id: str
    status: str
    scheduled_time: datetime

class CommunicationResponse(BaseModel):
    message_id: str
    channel: str
    status: str

class CaseResponse(BaseModel):
    case_id: str
    status: str
    priority: str
