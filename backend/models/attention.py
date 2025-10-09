"""
Personal Attention Agent Data Models
Handles multi-channel signal processing and routing
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class Evidence(BaseModel):
    url: str
    source: str
    snippet: Optional[str] = None
    published_at: Optional[datetime] = None

class NextAction(BaseModel):
    title: str
    detail: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class Action(BaseModel):
    type: Literal[
        "teams.sendCard", "slack.postMessage",
        "calendar.createEvent", "email.sendDigest"
    ]
    payload: Dict[str, Any]

class AttentionActionBundle(BaseModel):
    run_id: str
    topic: str
    summary_md: str
    evidence: List[Evidence] = []
    recommended_actions: List[NextAction] = []
    actions: List[Action] = []
    callback_url: str

class AgentCallback(BaseModel):
    run_id: str
    status: Literal["RUNNING","DONE","FAILED"]
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None

# Additional models for data persistence
class ChannelSource(BaseModel):
    type: Literal["slack", "teams", "webex", "sharepoint", "rss", "workplace"]
    urlOrId: str
    authRef: Optional[str] = None
    active: bool = True
    pullIntervalMin: int = 15
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Signal(BaseModel):
    sourceId: str
    externalId: str
    title: str
    body: str
    url: Optional[str] = None
    author: Optional[str] = None
    postedAt: datetime
    hash: str  # SHA256(title+body+url+postedAt)
    sentiment: Optional[float] = None
    entities: List[str] = []
    channelType: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Cluster(BaseModel):
    topic: str
    summaryMd: str
    firstSeen: datetime
    lastSeen: datetime
    volume: int = 1
    dedupKey: str
    score: float = 0.0
    signals: List[str] = []  # Signal IDs
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Preference(BaseModel):
    ownerUser: str
    mustHave: List[str] = []
    muteTerms: List[str] = []
    teams: List[str] = []
    priorityBoostJson: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Alert(BaseModel):
    clusterId: str
    priority: Literal["low", "medium", "high", "urgent"]
    assignedTo: Optional[str] = None
    status: Literal["pending", "sent", "acknowledged", "resolved"] = "pending"
    dispatchedVia: List[str] = []
    artifacts: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.utcnow)
