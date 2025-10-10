"""
Operations Efficiency Agent Data Models
For Posten Bring - Anne Gjerstad
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
from enum import Enum

# Enums
class ActionMode(str, Enum):
    AUTO = "Auto"
    ONECLICK = "OneClick"

class InvoiceStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    HOLD = "hold"
    REJECTED = "rejected"

class AllocationStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    CANCELLED = "cancelled"

# Action Models
class InvoiceAction(BaseModel):
    type: Literal["invoice.approve", "invoice.hold", "notify.slack", "notify.email"]
    payload: Dict[str, Any]
    mode: ActionMode = ActionMode.ONECLICK

class AllocationAction(BaseModel):
    type: Literal["cost.allocate", "notify.slack", "notify.email"]
    payload: Dict[str, Any]
    mode: ActionMode = ActionMode.ONECLICK

class AtsAction(BaseModel):
    type: Literal["ats.rank", "notify.slack", "sheets.appendRow"]
    payload: Dict[str, Any]

# Bundle Model
class OpsxBundle(BaseModel):
    run_id: str
    topic: str
    summary_md: str
    actions: List[Dict[str, Any]]
    callback_url: str

# Invoice Models
class InvoiceLine(BaseModel):
    line_number: int
    description: str
    quantity: float
    unit_price: float
    amount: float
    gl_account: Optional[str] = None
    cost_center: Optional[str] = None

class Invoice(BaseModel):
    invoice_id: str
    vendor: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    total_amount: float
    currency: str = "NOK"
    status: InvoiceStatus = InvoiceStatus.PENDING
    lines: List[InvoiceLine] = []
    po_number: Optional[str] = None
    gr_number: Optional[str] = None
    variance_percent: Optional[float] = None
    variance_amount: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Allocation Models
class AllocationLine(BaseModel):
    amount: float
    gl_account: str
    cost_center: str
    project: Optional[str] = None
    note: Optional[str] = None

class CostAllocation(BaseModel):
    allocation_id: str
    document_id: str
    vendor: str
    description: str
    total_amount: float
    lines: List[AllocationLine]
    status: AllocationStatus = AllocationStatus.DRAFT
    confidence_score: float = Field(ge=0.0, le=1.0)
    rationale: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# ATS Models
class Candidate(BaseModel):
    candidate_id: str
    name: str
    email: Optional[str] = None
    cv_text: str
    cv_url: Optional[str] = None
    score: float = Field(ge=0.0, le=1.0)
    highlights: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.now)

class JobCriteria(BaseModel):
    job_id: str
    title: str
    requirements: List[str]
    skills: List[str]
    experience_years: Optional[int] = None
    location: Optional[str] = None

class RankingResult(BaseModel):
    job_id: str
    criteria: JobCriteria
    candidates: List[Candidate]
    total_candidates: int
    created_at: datetime = Field(default_factory=datetime.now)

# Response Models
class OpsxStats(BaseModel):
    total_invoices: int
    auto_approved: int
    manual_hold: int
    total_allocations: int
    posted_allocations: int
    total_candidates: int
    ranked_candidates: int
    avg_confidence: float

class OpsxHealth(BaseModel):
    status: str
    erp_connected: bool
    ats_connected: bool
    slack_connected: bool
    sheets_connected: bool
    last_run: Optional[datetime] = None
    errors: List[str] = []
