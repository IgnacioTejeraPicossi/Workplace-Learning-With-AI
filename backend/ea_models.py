"""
Enterprise Architecture Data Models
Compatible with existing MongoDB setup
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class NodeType(str, Enum):
    START = "start"
    TASK = "task"
    DECISION = "decision"
    SYSTEM = "system"
    DATA = "data"
    END = "end"

class ProcessStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    DEPRECATED = "deprecated"

class LifecycleStatus(str, Enum):
    PROD = "prod"
    SUNSET = "sunset"
    PILOT = "pilot"

# Base Models
class Node(BaseModel):
    id: str
    type: NodeType
    label: str
    appId: Optional[str] = None
    sopDocId: Optional[str] = None
    trainingModuleId: Optional[str] = None
    riskScore: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    position: Optional[Dict[str, float]] = None  # x, y coordinates
    metadata: Optional[Dict[str, Any]] = None

class Edge(BaseModel):
    id: str
    from_: str = Field(alias="from")
    to: str
    label: Optional[str] = None
    condition: Optional[str] = None  # For decision nodes

# Input Models
class ProcessCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    owner: str
    category: Optional[str] = "General"
    nodes: List[Node]
    edges: List[Edge]
    linkedApps: List[str] = []
    linkedCapabilities: List[str] = []
    maturity: int = Field(default=3, ge=1, le=5)
    risk: float = Field(default=0.0, ge=0.0, le=100.0)
    status: ProcessStatus = ProcessStatus.DRAFT
    tags: List[str] = []

class ProcessUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    nodes: Optional[List[Node]] = None
    edges: Optional[List[Edge]] = None
    linkedApps: Optional[List[str]] = None
    linkedCapabilities: Optional[List[str]] = None
    maturity: Optional[int] = Field(None, ge=1, le=5)
    risk: Optional[float] = Field(None, ge=0.0, le=100.0)
    status: Optional[ProcessStatus] = None
    tags: Optional[List[str]] = None

# Catalog Models
class CapabilityCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    level: str = "L1"  # L1, L2, L3
    owner: List[str] = []
    tags: List[str] = []

class ApplicationCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    vendor: Optional[str] = None
    lifecycle: LifecycleStatus = LifecycleStatus.PROD
    owners: List[str] = []
    capabilities: List[str] = []
    dataClasses: List[str] = []  # PII, PCI, etc.
    costBucket: Optional[float] = None
    tags: List[str] = []

# Change Request Models
class ChangeRequestCreate(BaseModel):
    entityType: str  # "process" or "application"
    entityId: str
    change: Dict[str, Any]  # from, to, diff
    requester: str
    description: Optional[str] = ""

# Response Models
class ProcessResponse(BaseModel):
    _id: str
    name: str
    description: str
    owner: str
    category: str
    nodes: List[Node]
    edges: List[Edge]
    linkedApps: List[str]
    linkedCapabilities: List[str]
    maturity: int
    risk: float
    status: ProcessStatus
    tags: List[str]
    version: int
    createdAt: datetime
    updatedAt: datetime

class ImpactAnalysis(BaseModel):
    sourceId: str
    sourceType: str
    impacted: List[Dict[str, Any]]
    impactScore: float
    riskLevel: str

# Heatmap Data
class HeatmapData(BaseModel):
    processes: List[Dict[str, Any]]
    applications: List[Dict[str, Any]]
    capabilities: List[Dict[str, Any]]
