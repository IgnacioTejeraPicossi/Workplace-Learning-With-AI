"""
EA Second Brain Agent - Data Models
Ketil's 24/7 Enterprise Architecture Watcher
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class Evidence(BaseModel):
    """Evidence from sources (internal tools or open data)"""
    url: str
    source: str
    snippet: Optional[str] = None
    published_at: Optional[datetime] = None

class PortfolioMatch(BaseModel):
    """Matched portfolio items (apps, capabilities, projects)"""
    id: str
    name: str
    score: float = Field(ge=0.0, le=1.0)
    reason: Optional[str] = None

class NextAction(BaseModel):
    """Recommended next action"""
    title: str
    detail: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class Action(BaseModel):
    """Executable action (Jira, Slack, Confluence, Sheets)"""
    type: Literal[
        "jira.createIssue",
        "slack.postMessage",
        "confluence.updatePage",
        "sheets.appendRow"
    ]
    payload: Dict[str, Any]

class InsightBundle(BaseModel):
    """Complete insight bundle for execution"""
    run_id: str
    topic: str
    summary_md: str
    evidence: List[Evidence] = []
    portfolio_matches: List[PortfolioMatch] = []
    recommended_actions: List[NextAction] = []
    actions: List[Action] = []
    callback_url: str

class AgentCallback(BaseModel):
    """Callback from executor"""
    run_id: str
    status: Literal["RUNNING", "DONE", "FAILED"]
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None

class EAInsight(BaseModel):
    """Stored insight for review"""
    insight_id: str
    topic: str
    summary_md: str
    impact_score: float = Field(ge=0.0, le=1.0)
    urgency_score: float = Field(ge=0.0, le=1.0)
    evidence: List[Evidence] = []
    portfolio_matches: List[PortfolioMatch] = []
    recommended_actions: List[NextAction] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["pending", "sent", "dismissed"] = "pending"

