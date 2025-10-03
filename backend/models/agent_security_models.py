"""
Agent Security Models
Advanced security monitoring and threat detection for AI agents
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class ThreatSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AgentStatus(str, Enum):
    SECURE = "secure"
    AT_RISK = "at_risk"
    CRITICAL = "critical"
    OFFLINE = "offline"

class IncidentStatus(str, Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    MITIGATED = "mitigated"
    RESOLVED = "resolved"

class ThreatType(str, Enum):
    PROMPT_INJECTION = "prompt_injection"
    MODEL_POISONING = "model_poisoning"
    DATA_EXFILTRATION = "data_exfiltration"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MODEL_DRIFT = "model_drift"
    ZERO_DAY_VULNERABILITY = "zero_day_vulnerability"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    SIDE_CHANNEL_ATTACK = "side_channel_attack"

# Base Models
class AgentSecurityStatus(BaseModel):
    agent_name: str
    status: AgentStatus
    security_score: int = Field(ge=0, le=100)
    last_scan: datetime
    vulnerabilities_count: int = Field(ge=0)
    threats_detected: int = Field(ge=0)
    zero_trust_compliance: bool
    model_integrity_score: int = Field(ge=0, le=100)
    data_protection_score: int = Field(ge=0, le=100)
    access_control_score: int = Field(ge=0, le=100)
    monitoring_active: bool
    last_incident: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class SecurityIncident(BaseModel):
    incident_id: str
    agent_name: str
    threat_type: ThreatType
    severity: ThreatSeverity
    timestamp: datetime
    status: IncidentStatus
    description: str
    detection_method: str
    affected_components: List[str] = []
    mitigation_actions: List[str] = []
    evidence: Optional[Dict[str, Any]] = None
    resolved_at: Optional[datetime] = None
    false_positive: bool = False

class SecurityMetrics(BaseModel):
    prompt_injection_attempts: int = Field(ge=0)
    model_poisoning_detected: int = Field(ge=0)
    unauthorized_access_attempts: int = Field(ge=0)
    data_exfiltration_attempts: int = Field(ge=0)
    zero_day_vulnerabilities: int = Field(ge=0)
    privilege_escalation_attempts: int = Field(ge=0)
    side_channel_attacks: int = Field(ge=0)
    model_drift_incidents: int = Field(ge=0)
    total_threats_blocked: int = Field(ge=0)
    average_response_time_ms: int = Field(ge=0)

class ZeroTrustStatus(BaseModel):
    total_checks: int = Field(ge=0)
    passed_checks: int = Field(ge=0)
    failed_checks: int = Field(ge=0)
    compliance_rate: float = Field(ge=0, le=100)
    last_assessment: datetime
    next_assessment: datetime
    critical_failures: List[str] = []
    recommendations: List[str] = []

class AgentSecurityReport(BaseModel):
    report_id: str
    agent_name: str
    generated_at: datetime
    overall_score: int = Field(ge=0, le=100)
    security_status: AgentStatus
    vulnerabilities: List[Dict[str, Any]] = []
    threats_detected: List[SecurityIncident] = []
    zero_trust_compliance: bool
    recommendations: List[str] = []
    risk_level: str
    next_scan_scheduled: datetime

# Input Models
class SecurityScanRequest(BaseModel):
    agent_name: str
    scan_type: str = "full"  # full, quick, deep
    include_zero_trust: bool = True
    include_model_integrity: bool = True
    include_data_protection: bool = True

class ThreatDetectionRequest(BaseModel):
    agent_name: str
    input_data: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class IncidentResponseRequest(BaseModel):
    incident_id: str
    action: str  # investigate, mitigate, resolve, escalate
    notes: Optional[str] = None
    assigned_to: Optional[str] = None

# Response Models
class AgentSecurityOverview(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    total_agents: int = Field(ge=0)
    secure_agents: int = Field(ge=0)
    at_risk_agents: int = Field(ge=0)
    critical_agents: int = Field(ge=0)
    critical_alerts: int = Field(ge=0)
    recent_incidents: List[SecurityIncident] = []
    agent_security_status: List[AgentSecurityStatus] = []
    security_metrics: SecurityMetrics
    zero_trust_status: ZeroTrustStatus
    last_updated: datetime

class ThreatDetectionResponse(BaseModel):
    threat_detected: bool
    threat_type: Optional[ThreatType] = None
    severity: Optional[ThreatSeverity] = None
    confidence_score: float = Field(ge=0, le=1)
    detection_details: Optional[Dict[str, Any]] = None
    recommended_actions: List[str] = []
    incident_id: Optional[str] = None

class SecurityScanResponse(BaseModel):
    scan_id: str
    agent_name: str
    scan_status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    security_score: int = Field(ge=0, le=100)
    vulnerabilities_found: int = Field(ge=0)
    threats_detected: int = Field(ge=0)
    zero_trust_compliance: bool
    recommendations: List[str] = []
    detailed_report: Optional[Dict[str, Any]] = None

# Advanced Models for Hackathon Demo
class AgentBehaviorAnalysis(BaseModel):
    agent_name: str
    analysis_timestamp: datetime
    normal_behavior_patterns: Dict[str, Any]
    current_behavior_score: float = Field(ge=0, le=1)
    anomalies_detected: List[Dict[str, Any]] = []
    risk_indicators: List[str] = []
    behavioral_drift_score: float = Field(ge=0, le=1)

class ModelIntegrityCheck(BaseModel):
    agent_name: str
    check_timestamp: datetime
    model_hash: str
    expected_hash: str
    integrity_score: float = Field(ge=0, le=1)
    tampering_detected: bool
    model_size: int
    parameter_count: int
    last_training_date: Optional[datetime] = None

class DataProtectionAudit(BaseModel):
    agent_name: str
    audit_timestamp: datetime
    data_encryption_status: bool
    data_anonymization_score: float = Field(ge=0, le=1)
    pii_detection_count: int = Field(ge=0)
    data_retention_compliance: bool
    access_logs_analyzed: int = Field(ge=0)
    unauthorized_access_attempts: int = Field(ge=0)

class RealTimeThreatFeed(BaseModel):
    threat_id: str
    threat_type: ThreatType
    severity: ThreatSeverity
    description: str
    indicators: List[str] = []
    affected_agents: List[str] = []
    detection_timestamp: datetime
    source: str
    confidence: float = Field(ge=0, le=1)
    mitigation_guidance: List[str] = []
