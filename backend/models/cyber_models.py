"""
Cybersecurity Data Models
Compatible with existing MongoDB setup
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class ThreatCategory(str, Enum):
    SOCIAL_ENGINEERING = "social_engineering"
    MALWARE = "malware"
    VULNERABILITY = "vulnerability"
    INSIDER_THREAT = "insider_threat"
    SUPPLY_CHAIN = "supply_chain"
    CLOUD_MISCONFIG = "cloud_misconfig"

class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class FrameworkType(str, Enum):
    NIST_CSF = "NIST-CSF"
    ISO_27001 = "ISO-27001"
    CIS = "CIS"
    OWASP_ASVS = "OWASP-ASVS"
    OWASP_TOP10 = "OWASP-TOP10"

# Base Models
class Threat(BaseModel):
    id: str
    name: str
    category: ThreatCategory
    cia_impact: Dict[str, int] = Field(default={"C": 0, "I": 0, "A": 0})  # Confidentiality, Integrity, Availability (0-10)
    description: str
    controls: List[str] = []  # Control IDs that map to frameworks
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ControlMap(BaseModel):
    id: str  # e.g., "NIST-CSF:PR.AC-1"
    title: str
    framework: FrameworkType
    description: str
    tags: List[str] = []
    implementation_guidance: Optional[str] = None

class Vulnerability(BaseModel):
    id: str
    source: str  # "npm-audit", "pip-audit", "trivy", "secret-scan"
    severity: SeverityLevel
    package: Optional[str] = None
    version: Optional[str] = None
    file: Optional[str] = None
    line: Optional[int] = None
    cve: Optional[str] = None
    title: str
    description: Optional[str] = None
    recommendation: Optional[str] = None
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    fixed: bool = False
    project: str = "default"
    risk_score: float = Field(default=0.0, ge=0.0, le=10.0)

class PostureKPI(BaseModel):
    date: datetime
    kpi: str  # e.g., "patch_latency_days", "open_high_vulns"
    value: float
    target: Optional[float] = None
    meta: Dict[str, Any] = {}

class RiskScore(BaseModel):
    overall: float = Field(ge=0.0, le=100.0)
    factors: Dict[str, float] = {}  # {"vuln": 25.5, "secrets": 10.2, "patch_latency": 15.0}
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    trend: str = "stable"  # "improving", "stable", "degrading"

class ComplianceStatus(BaseModel):
    framework: FrameworkType
    control_id: str
    status: str  # "implemented", "partial", "not_implemented", "not_applicable"
    evidence: Optional[str] = None
    last_reviewed: datetime = Field(default_factory=datetime.utcnow)
    reviewer: Optional[str] = None

# Input Models
class VulnerabilityScanRequest(BaseModel):
    project: str = "default"
    scan_types: List[str] = ["npm", "pip", "secrets"]  # Types of scans to run

class CyberRAGRequest(BaseModel):
    question: str
    context: Optional[str] = None
    max_paragraphs: int = Field(default=6, ge=1, le=20)

class SecureCodingLessonRequest(BaseModel):
    project: str = "default"
    focus_area: Optional[str] = None  # Specific vulnerability type to focus on

# Response Models
class CyberRAGResponse(BaseModel):
    answer: str
    sources: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0)
    processing_time: float

class SecureCodingLessonResponse(BaseModel):
    title: str
    content: str
    duration_minutes: int
    focus_vulnerabilities: List[str] = []
    code_examples: List[str] = []
    references: List[str] = []

class ScanResult(BaseModel):
    scan_type: str
    vulnerabilities_found: int
    execution_time: float
    success: bool
    error_message: Optional[str] = None
