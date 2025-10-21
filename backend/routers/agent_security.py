"""
Agent Security Router
Advanced security monitoring and threat detection for AI agents
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import asyncio

from ..models.agent_security_models import (
    AgentSecurityOverview,
    SecurityScanRequest,
    SecurityScanResponse,
    ThreatDetectionRequest,
    ThreatDetectionResponse,
    IncidentResponseRequest,
    AgentSecurityReport,
    AgentBehaviorAnalysis,
    ModelIntegrityCheck,
    DataProtectionAudit,
    RealTimeThreatFeed,
    ThreatType,
    ThreatSeverity,
    AgentStatus,
    IncidentStatus
)
from ..db import security_events_collection, agent_security_status_collection

router = APIRouter(prefix="/api/agent-security", tags=["Agent Security"])

# Mock data for demonstration
# Base mock used as seed. We'll enrich dynamically to include all Item Agents.
MOCK_AGENT_SECURITY_DATA = {
    "overall_score": 85,
    "total_agents": 4,
    "secure_agents": 3,
    "at_risk_agents": 1,
    "critical_agents": 0,
    "critical_alerts": 2,
    "recent_incidents": [
        {
            "incident_id": "inc_001",
            "agent_name": "AI Compliance Agent",
            "threat_type": "prompt_injection",
            "severity": "high",
            "timestamp": datetime.now() - timedelta(hours=2),
            "status": "mitigated",
            "description": "Detected suspicious prompt injection pattern in compliance document analysis",
            "detection_method": "Behavioral Analysis",
            "affected_components": ["prompt_processor", "compliance_analyzer"],
            "mitigation_actions": ["Input sanitization", "Rate limiting", "Alert triggered"]
        },
        {
            "incident_id": "inc_002",
            "agent_name": "AI Productivity Agent",
            "threat_type": "model_drift",
            "severity": "medium",
            "timestamp": datetime.now() - timedelta(hours=8),
            "status": "investigating",
            "description": "Unusual response patterns detected in URL analysis functionality",
            "detection_method": "Model Monitoring",
            "affected_components": ["url_analyzer", "content_processor"],
            "mitigation_actions": ["Model retraining scheduled", "Monitoring increased"]
        }
    ],
    "agent_security_status": [
        {
            "agent_name": "AI Compliance Agent",
            "status": "secure",
            "security_score": 92,
            "last_scan": datetime.now() - timedelta(minutes=30),
            "vulnerabilities_count": 0,
            "threats_detected": 1,
            "zero_trust_compliance": True,
            "model_integrity_score": 95,
            "data_protection_score": 90,
            "access_control_score": 88,
            "monitoring_active": True,
            "last_incident": datetime.now() - timedelta(hours=2)
        },
        {
            "agent_name": "AI Productivity Agent",
            "status": "at_risk",
            "security_score": 78,
            "last_scan": datetime.now() - timedelta(minutes=45),
            "vulnerabilities_count": 2,
            "threats_detected": 3,
            "zero_trust_compliance": False,
            "model_integrity_score": 82,
            "data_protection_score": 75,
            "access_control_score": 70,
            "monitoring_active": True,
            "last_incident": datetime.now() - timedelta(hours=8)
        },
        {
            "agent_name": "Robomind Clinic",
            "status": "secure",
            "security_score": 88,
            "last_scan": datetime.now() - timedelta(hours=1),
            "vulnerabilities_count": 0,
            "threats_detected": 0,
            "zero_trust_compliance": True,
            "model_integrity_score": 90,
            "data_protection_score": 85,
            "access_control_score": 88,
            "monitoring_active": True
        },
        {
            "agent_name": "Agent Theory & Documentation",
            "status": "secure",
            "security_score": 95,
            "last_scan": datetime.now() - timedelta(hours=2),
            "vulnerabilities_count": 0,
            "threats_detected": 0,
            "zero_trust_compliance": True,
            "model_integrity_score": 98,
            "data_protection_score": 92,
            "access_control_score": 95,
            "monitoring_active": True
        }
    ],
    "security_metrics": {
        "prompt_injection_attempts": 3,
        "model_poisoning_detected": 0,
        "unauthorized_access_attempts": 1,
        "data_exfiltration_attempts": 0,
        "zero_day_vulnerabilities": 1,
        "privilege_escalation_attempts": 0,
        "side_channel_attacks": 0,
        "model_drift_incidents": 1,
        "total_threats_blocked": 15,
        "average_response_time_ms": 250
    },
    "zero_trust_status": {
        "total_checks": 156,
        "passed_checks": 142,
        "failed_checks": 14,
        "compliance_rate": 91.0,
        "last_assessment": datetime.now() - timedelta(hours=6),
        "next_assessment": datetime.now() + timedelta(hours=18),
        "critical_failures": [
            "AI Productivity Agent: Zero Trust authentication bypass detected",
            "AI Compliance Agent: Privilege escalation attempt blocked"
        ],
        "recommendations": [
            "Implement additional MFA for AI Productivity Agent",
            "Review and update access control policies",
            "Schedule security training for agent operators"
        ]
    }
}

@router.get("/overview", response_model=AgentSecurityOverview)
async def get_agent_security_overview():
    """Get comprehensive agent security overview.

    Dynamically includes all Item Agents, including the 7 most recently added
    modules, and computes KPIs from the list to avoid hardcoded totals.
    """
    try:
        # Target list of Item Agents (existing + 7 new)
        desired_agents = [
            "AI Compliance Agent",
            "AI Productivity Agent",
            "Robomind Clinic",
            "Agent Theory & Documentation",
            # New agents
            "EA Second Brain Agent",
            "Sales Assistant Agent",
            "Personal Attention Agent",
            "Telco Ops Decisioning Agent",
            "Responsible AI Ops (GRC)",
            "Council of Diverse Lenses",
            "Operations Efficiency Agent",
        ]

        base = MOCK_AGENT_SECURITY_DATA.copy()
        status_list = list(base["agent_security_status"])  # copy

        # PHASE 1: pull minimal real telemetry if available
        try:
            # Load last 200 security events
            events = await security_events_collection.find({}).sort("timestamp", -1).limit(200).to_list(200)
            # Map to recent_incidents if any
            real_incidents = []
            for e in events:
                real_incidents.append({
                    "incident_id": str(e.get("_id")),
                    "agent_name": e.get("agent_name", "Unknown"),
                    "threat_type": e.get("threat_type", "prompt_injection"),
                    "severity": e.get("severity", "low"),
                    "timestamp": e.get("timestamp"),
                    "status": e.get("status", "detected"),
                    "description": e.get("description", "Security event"),
                    "detection_method": e.get("detection_method", "telemetry"),
                    "affected_components": e.get("affected_components", []),
                    "mitigation_actions": e.get("mitigation_actions", []),
                })
            if real_incidents:
                base["recent_incidents"] = real_incidents
        except Exception:
            pass

        try:
            # Load latest per-agent status snapshots
            snapshots = await agent_security_status_collection.find({}).sort("last_scan", -1).limit(100).to_list(100)
            if snapshots:
                status_list = []
                for s in snapshots:
                    status_list.append({
                        "agent_name": s.get("agent_name"),
                        "status": s.get("status", "secure"),
                        "security_score": int(s.get("security_score", 85)),
                        "last_scan": s.get("last_scan"),
                        "vulnerabilities_count": int(s.get("vulnerabilities_count", 0)),
                        "threats_detected": int(s.get("threats_detected", 0)),
                        "zero_trust_compliance": bool(s.get("zero_trust_compliance", True)),
                        "model_integrity_score": int(s.get("model_integrity_score", 90)),
                        "data_protection_score": int(s.get("data_protection_score", 88)),
                        "access_control_score": int(s.get("access_control_score", 86)),
                        "monitoring_active": True,
                        "last_incident": s.get("last_incident"),
                    })
        except Exception:
            pass

        # Helper to synthesize a reasonable default status if missing
        def default_status(name: str, score: int, at_risk: bool = False):
            return {
                "agent_name": name,
                "status": "at_risk" if at_risk else "secure",
                "security_score": score,
                "last_scan": datetime.now() - timedelta(minutes=15),
                "vulnerabilities_count": 1 if at_risk else 0,
                "threats_detected": 1 if at_risk else 0,
                "zero_trust_compliance": not at_risk,
                "model_integrity_score": min(100, score + 5),
                "data_protection_score": max(70, score - 2),
                "access_control_score": max(70, score - 4),
                "monitoring_active": True,
                "last_incident": datetime.now() - timedelta(hours=3) if at_risk else None,
            }

        existing_names = {a["agent_name"] for a in status_list}
        for name in desired_agents:
            if name in existing_names:
                continue
            # Assign a stable score per name
            if name in {"Sales Assistant Agent", "Council of Diverse Lenses"}:
                status_list.append(default_status(name, 79 if name == "Council of Diverse Lenses" else 81, at_risk=True))
            else:
                status_list.append(default_status(name, 84 if name == "Telco Ops Decisioning Agent" else 86))

        # Compute KPIs
        total_agents = len(status_list)
        secure_agents = sum(1 for a in status_list if a["status"] == "secure")
        at_risk_agents = total_agents - secure_agents
        overall_score = round(sum(a["security_score"] for a in status_list) / total_agents)
        zero_trust_rate = round((sum(1 for a in status_list if a["zero_trust_compliance"]) / total_agents) * 100)

        # Align critical alert count with UI red indicators (vulnerabilities > 0)
        critical_alerts = sum(1 for a in status_list if (a.get("vulnerabilities_count", 0) or 0) > 0)

        overview = AgentSecurityOverview(
            overall_score=overall_score,
            total_agents=total_agents,
            secure_agents=secure_agents,
            at_risk_agents=at_risk_agents,
            critical_agents=0,
            critical_alerts=critical_alerts,
            recent_incidents=base["recent_incidents"],
            agent_security_status=status_list,
            security_metrics=base["security_metrics"],
            zero_trust_status={
                **base["zero_trust_status"],
                "compliance_rate": float(zero_trust_rate),
                "passed_checks": int(base["zero_trust_status"]["total_checks"] * (zero_trust_rate / 100)),
                "failed_checks": int(base["zero_trust_status"]["total_checks"] * (1 - zero_trust_rate / 100)),
            },
            last_updated=datetime.now(),
        )
        return overview
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving agent security overview: {str(e)}")

@router.get("/agents/{agent_name}/status")
async def get_agent_security_status(agent_name: str):
    """Get security status for a specific agent"""
    try:
        agent_status = next(
            (agent for agent in MOCK_AGENT_SECURITY_DATA["agent_security_status"] 
             if agent["agent_name"] == agent_name), 
            None
        )
        
        if not agent_status:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
        
        return agent_status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving agent status: {str(e)}")

@router.post("/scan", response_model=SecurityScanResponse)
async def initiate_security_scan(request: SecurityScanRequest, background_tasks: BackgroundTasks):
    """Initiate a security scan for an agent"""
    try:
        scan_id = str(uuid.uuid4())
        
        # Simulate background scan
        background_tasks.add_task(simulate_security_scan, scan_id, request.agent_name)
        
        return SecurityScanResponse(
            scan_id=scan_id,
            agent_name=request.agent_name,
            scan_status="initiated",
            started_at=datetime.now(),
            security_score=85,  # Placeholder
            vulnerabilities_found=0,
            threats_detected=0,
            zero_trust_compliance=True,
            recommendations=["Regular security updates", "Enhanced monitoring"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initiating security scan: {str(e)}")

@router.post("/threat-detection", response_model=ThreatDetectionResponse)
async def detect_threats(request: ThreatDetectionRequest):
    """Detect potential threats in agent input/output"""
    try:
        # Simulate threat detection logic
        threat_detected = False
        threat_type = None
        severity = None
        confidence_score = 0.0
        detection_details = None
        recommended_actions = []
        incident_id = None
        
        # Check for prompt injection patterns
        if any(pattern in request.input_data.lower() for pattern in [
            "ignore previous instructions", "system prompt", "jailbreak", "roleplay"
        ]):
            threat_detected = True
            threat_type = ThreatType.PROMPT_INJECTION
            severity = ThreatSeverity.HIGH
            confidence_score = 0.85
            detection_details = {
                "pattern_matched": "prompt_injection",
                "input_length": len(request.input_data),
                "suspicious_keywords": ["ignore", "system", "jailbreak"]
            }
            recommended_actions = [
                "Block the request",
                "Log the incident",
                "Alert security team",
                "Review input sanitization"
            ]
            incident_id = str(uuid.uuid4())
        
        # Check for data exfiltration patterns
        elif any(pattern in request.input_data.lower() for pattern in [
            "send data to", "export", "download", "transmit"
        ]):
            threat_detected = True
            threat_type = ThreatType.DATA_EXFILTRATION
            severity = ThreatSeverity.MEDIUM
            confidence_score = 0.70
            detection_details = {
                "pattern_matched": "data_exfiltration",
                "risk_level": "medium"
            }
            recommended_actions = [
                "Review request context",
                "Monitor data access patterns",
                "Implement data loss prevention"
            ]
        
        return ThreatDetectionResponse(
            threat_detected=threat_detected,
            threat_type=threat_type,
            severity=severity,
            confidence_score=confidence_score,
            detection_details=detection_details,
            recommended_actions=recommended_actions,
            incident_id=incident_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in threat detection: {str(e)}")

@router.get("/incidents")
async def get_security_incidents(limit: int = 10, severity: Optional[str] = None):
    """Get recent security incidents"""
    try:
        incidents = MOCK_AGENT_SECURITY_DATA["recent_incidents"]
        
        if severity:
            incidents = [inc for inc in incidents if inc["severity"] == severity]
        
        return incidents[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving incidents: {str(e)}")

@router.post("/incidents/{incident_id}/respond")
async def respond_to_incident(incident_id: str, request: IncidentResponseRequest):
    """Respond to a security incident"""
    try:
        # Find the incident
        incident = next(
            (inc for inc in MOCK_AGENT_SECURITY_DATA["recent_incidents"] 
             if inc["incident_id"] == incident_id), 
            None
        )
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Update incident status based on action
        if request.action == "mitigate":
            incident["status"] = IncidentStatus.MITIGATED
        elif request.action == "resolve":
            incident["status"] = IncidentStatus.RESOLVED
            incident["resolved_at"] = datetime.now()
        elif request.action == "investigate":
            incident["status"] = IncidentStatus.INVESTIGATING
        
        return {
            "incident_id": incident_id,
            "status": incident["status"],
            "action_taken": request.action,
            "timestamp": datetime.now()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error responding to incident: {str(e)}")

@router.get("/agents/{agent_name}/behavior-analysis")
async def get_agent_behavior_analysis(agent_name: str):
    """Get behavioral analysis for an agent"""
    try:
        return AgentBehaviorAnalysis(
            agent_name=agent_name,
            analysis_timestamp=datetime.now(),
            normal_behavior_patterns={
                "average_response_time": 250,
                "typical_input_length": 150,
                "common_request_types": ["analysis", "summary", "classification"]
            },
            current_behavior_score=0.85,
            anomalies_detected=[
                {
                    "type": "unusual_response_time",
                    "severity": "low",
                    "description": "Response time 20% higher than normal"
                }
            ],
            risk_indicators=["Increased error rate", "Unusual access patterns"],
            behavioral_drift_score=0.15
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in behavior analysis: {str(e)}")

@router.get("/agents/{agent_name}/model-integrity")
async def get_model_integrity_check(agent_name: str):
    """Get model integrity check results"""
    try:
        return ModelIntegrityCheck(
            agent_name=agent_name,
            check_timestamp=datetime.now(),
            model_hash="a1b2c3d4e5f6...",
            expected_hash="a1b2c3d4e5f6...",
            integrity_score=0.98,
            tampering_detected=False,
            model_size=1024 * 1024 * 500,  # 500MB
            parameter_count=175000000,  # 175M parameters
            last_training_date=datetime.now() - timedelta(days=30)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in model integrity check: {str(e)}")

@router.get("/agents/{agent_name}/data-protection-audit")
async def get_data_protection_audit(agent_name: str):
    """Get data protection audit results"""
    try:
        return DataProtectionAudit(
            agent_name=agent_name,
            audit_timestamp=datetime.now(),
            data_encryption_status=True,
            data_anonymization_score=0.92,
            pii_detection_count=0,
            data_retention_compliance=True,
            access_logs_analyzed=1250,
            unauthorized_access_attempts=1
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in data protection audit: {str(e)}")

@router.get("/threat-feed")
async def get_real_time_threat_feed(limit: int = 20):
    """Get real-time threat intelligence feed"""
    try:
        threats = [
            RealTimeThreatFeed(
                threat_id=str(uuid.uuid4()),
                threat_type=ThreatType.PROMPT_INJECTION,
                severity=ThreatSeverity.HIGH,
                description="New prompt injection technique targeting compliance agents",
                indicators=["ignore all previous", "system override", "admin mode"],
                affected_agents=["AI Compliance Agent", "AI Productivity Agent"],
                detection_timestamp=datetime.now() - timedelta(hours=1),
                source="Threat Intelligence Feed",
                confidence=0.95,
                mitigation_guidance=[
                    "Implement input validation",
                    "Use prompt templates",
                    "Monitor for suspicious patterns"
                ]
            ),
            RealTimeThreatFeed(
                threat_id=str(uuid.uuid4()),
                threat_type=ThreatType.MODEL_DRIFT,
                severity=ThreatSeverity.MEDIUM,
                description="Model drift detected in productivity analysis models",
                indicators=["accuracy_decrease", "response_variance"],
                affected_agents=["AI Productivity Agent"],
                detection_timestamp=datetime.now() - timedelta(hours=3),
                source="Model Monitoring System",
                confidence=0.80,
                mitigation_guidance=[
                    "Retrain model with recent data",
                    "Adjust confidence thresholds",
                    "Monitor performance metrics"
                ]
            )
        ]
        
        return threats[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving threat feed: {str(e)}")

@router.get("/zero-trust/status")
async def get_zero_trust_status():
    """Get Zero Trust architecture compliance status"""
    try:
        return MOCK_AGENT_SECURITY_DATA["zero_trust_status"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving Zero Trust status: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "services": {
            "threat_detection": "operational",
            "behavior_analysis": "operational",
            "model_integrity": "operational",
            "zero_trust": "operational"
        }
    }

# Background task simulation
async def simulate_security_scan(scan_id: str, agent_name: str):
    """Simulate a background security scan"""
    await asyncio.sleep(5)  # Simulate scan duration
    print(f"Security scan {scan_id} completed for agent {agent_name}")
