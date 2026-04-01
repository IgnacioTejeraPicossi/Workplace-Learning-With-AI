"""
Cybersecurity Router
Provides endpoints for threat management, vulnerability scanning, and compliance tracking
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
import asyncio
import json
import subprocess
import shlex
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

from backend.models.cyber_models import (
    Threat, ControlMap, Vulnerability, PostureKPI, RiskScore,
    ComplianceStatus, VulnerabilityScanRequest, CyberRAGRequest,
    SecureCodingLessonRequest, CyberRAGResponse, SecureCodingLessonResponse,
    ScanResult, SeverityLevel
)

router = APIRouter(prefix="/api/cyber", tags=["Cybersecurity"])

# Mock data for initial implementation
_MOCK_THREATS = [
    Threat(
        id="T001",
        name="Phishing Attacks",
        category="social_engineering",
        cia_impact={"C": 7, "I": 6, "A": 3},
        description="Email/web lures to steal credentials and sensitive information.",
        controls=["NIST-CSF:PR.AC-1", "OWASP-ASVS:2.1"],
        tags=["email", "social-engineering", "credential-theft"]
    ),
    Threat(
        id="T002",
        name="Ransomware",
        category="malware",
        cia_impact={"C": 5, "I": 7, "A": 9},
        description="Malware that encrypts data and demands payment for decryption.",
        controls=["CIS:1.1", "NIST-CSF:PR.DS-1"],
        tags=["malware", "encryption", "extortion"]
    ),
    Threat(
        id="T003",
        name="SQL Injection",
        category="vulnerability",
        cia_impact={"C": 8, "I": 9, "A": 4},
        description="Code injection technique used to attack data-driven applications.",
        controls=["OWASP-TOP10:A03", "NIST-CSF:PR.DS-2"],
        tags=["injection", "database", "web-application"]
    ),
    Threat(
        id="T004",
        name="Supply Chain Attacks",
        category="supply_chain",
        cia_impact={"C": 6, "I": 8, "A": 5},
        description="Attacks that target software supply chains and dependencies.",
        controls=["NIST-CSF:PR.IP-1", "CIS:8.1"],
        tags=["supply-chain", "dependencies", "third-party"]
    )
]

_MOCK_CONTROLS = [
    ControlMap(
        id="NIST-CSF:PR.AC-1",
        title="Access Control—Identity Management",
        framework="NIST-CSF",
        description="Establish and manage identities and access.",
        tags=["access-control", "identity", "authentication"],
        implementation_guidance="Implement multi-factor authentication and role-based access control."
    ),
    ControlMap(
        id="OWASP-ASVS:2.1",
        title="Authentication Design",
        framework="OWASP-ASVS",
        description="Design and verify authentication mechanisms.",
        tags=["authentication", "design", "verification"],
        implementation_guidance="Use strong authentication protocols and secure session management."
    ),
    ControlMap(
        id="CIS:1.1",
        title="Inventory of Enterprise Assets",
        framework="CIS",
        description="Actively manage enterprise assets.",
        tags=["inventory", "assets", "management"],
        implementation_guidance="Maintain an accurate inventory of all enterprise assets."
    ),
    ControlMap(
        id="OWASP-TOP10:A03",
        title="Injection",
        framework="OWASP-TOP10",
        description="Prevent injection vulnerabilities.",
        tags=["injection", "input-validation", "sanitization"],
        implementation_guidance="Use parameterized queries and input validation."
    )
]

_MOCK_VULNERABILITIES = [
    Vulnerability(
        id="vuln-001",
        source="npm-audit",
        severity="HIGH",
        package="lodash",
        version="4.17.15",
        title="Prototype Pollution in lodash",
        description="A vulnerability that allows prototype pollution attacks.",
        recommendation="Update to lodash version 4.17.21 or later.",
        project="default",
        risk_score=7.5
    ),
    Vulnerability(
        id="vuln-002",
        source="pip-audit",
        severity="MEDIUM",
        package="requests",
        version="2.25.1",
        title="Insecure SSL/TLS certificate verification",
        description="Requests library allows insecure SSL connections.",
        recommendation="Update to requests version 2.28.0 or later.",
        project="default",
        risk_score=5.2
    )
]

_MOCK_KPIS = [
    PostureKPI(
        date=datetime.utcnow(),
        kpi="patch_latency_days",
        value=6.2,
        target=3.0,
        meta={"unit": "days", "description": "Average time to patch vulnerabilities"}
    ),
    PostureKPI(
        date=datetime.utcnow(),
        kpi="open_high_vulns",
        value=3,
        target=0,
        meta={"unit": "count", "description": "Number of open high/critical vulnerabilities"}
    ),
    PostureKPI(
        date=datetime.utcnow(),
        kpi="compliance_coverage",
        value=78.5,
        target=90.0,
        meta={"unit": "percentage", "description": "Percentage of security controls implemented"}
    )
]

@router.get("/threats", response_model=List[Threat])
async def list_threats():
    """Get all cybersecurity threats"""
    return _MOCK_THREATS

@router.get("/threats/{threat_id}", response_model=Threat)
async def get_threat(threat_id: str):
    """Get a specific threat by ID"""
    for threat in _MOCK_THREATS:
        if threat.id == threat_id:
            return threat
    raise HTTPException(status_code=404, detail="Threat not found")

@router.get("/controls", response_model=List[ControlMap])
async def list_controls(framework: Optional[str] = None):
    """Get security controls, optionally filtered by framework"""
    if framework:
        return [control for control in _MOCK_CONTROLS if control.framework == framework]
    return _MOCK_CONTROLS

@router.get("/controls/{control_id}", response_model=ControlMap)
async def get_control(control_id: str):
    """Get a specific control by ID"""
    for control in _MOCK_CONTROLS:
        if control.id == control_id:
            return control
    raise HTTPException(status_code=404, detail="Control not found")

@router.get("/vulnerabilities", response_model=List[Vulnerability])
async def list_vulnerabilities(project: str = "default", severity: Optional[str] = None):
    """Get vulnerabilities for a project"""
    vulns = [v for v in _MOCK_VULNERABILITIES if v.project == project]
    if severity:
        vulns = [v for v in vulns if v.severity == severity]
    return vulns

@router.post("/vulnerabilities/scan", response_model=Dict[str, ScanResult])
async def scan_vulnerabilities(request: VulnerabilityScanRequest):
    """Run real vulnerability scans for a project.

    Attempts to execute actual CLI tools (npm audit, pip-audit). Falls back
    to mock results if tools are not installed or fail to run.
    """
    results = {}

    for scan_type in request.scan_types:
        start_time = datetime.utcnow()

        if scan_type == "npm":
            results[scan_type] = await _run_npm_audit()
        elif scan_type == "pip":
            results[scan_type] = await _run_pip_audit()
        elif scan_type == "secrets":
            results[scan_type] = await _run_secret_scan()
        else:
            results[scan_type] = ScanResult(
                scan_type=scan_type,
                vulnerabilities_found=0,
                execution_time=0.0,
                success=False,
                error_message=f"Unknown scan type: {scan_type}"
            )

    return results


async def _run_npm_audit() -> ScanResult:
    """Run npm audit --json in the frontend directory. Falls back to mock."""
    start = datetime.utcnow()
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    if not os.path.isdir(frontend_dir):
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")

    try:
        proc = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: subprocess.run(
                ["npm", "audit", "--json"],
                cwd=frontend_dir,
                capture_output=True,
                text=True,
                timeout=60,
                shell=os.name == "nt",  # shell=True on Windows for npm.cmd
            )
        )
        # npm audit exits non-zero when vulnerabilities exist — that's expected
        data = json.loads(proc.stdout) if proc.stdout else {}
        vuln_count = len(data.get("vulnerabilities", {}))
        elapsed = (datetime.utcnow() - start).total_seconds()
        logger.info("npm audit completed: %d vulnerabilities found", vuln_count)
        return ScanResult(
            scan_type="npm-audit",
            vulnerabilities_found=vuln_count,
            execution_time=round(elapsed, 2),
            success=True
        )
    except FileNotFoundError:
        logger.warning("npm not found — returning mock npm audit result")
        return ScanResult(scan_type="npm-audit", vulnerabilities_found=2,
                          execution_time=0.5, success=True,
                          error_message="npm not found; mock result returned")
    except Exception as e:
        logger.warning("npm audit failed: %s — returning mock result", e)
        return ScanResult(scan_type="npm-audit", vulnerabilities_found=2,
                          execution_time=0.5, success=True,
                          error_message=f"npm audit error: {e}; mock result returned")


async def _run_pip_audit() -> ScanResult:
    """Run pip-audit -f json. Falls back to mock."""
    start = datetime.utcnow()
    try:
        proc = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: subprocess.run(
                ["pip-audit", "-f", "json"],
                capture_output=True,
                text=True,
                timeout=120,
            )
        )
        items = json.loads(proc.stdout) if proc.stdout else []
        vuln_count = sum(len(item.get("vulns", [])) for item in items)
        elapsed = (datetime.utcnow() - start).total_seconds()
        logger.info("pip-audit completed: %d vulnerabilities found", vuln_count)
        return ScanResult(
            scan_type="pip-audit",
            vulnerabilities_found=vuln_count,
            execution_time=round(elapsed, 2),
            success=True
        )
    except FileNotFoundError:
        logger.warning("pip-audit not found — returning mock result")
        return ScanResult(scan_type="pip-audit", vulnerabilities_found=1,
                          execution_time=0.3, success=True,
                          error_message="pip-audit not installed; mock result returned")
    except Exception as e:
        logger.warning("pip-audit failed: %s — returning mock result", e)
        return ScanResult(scan_type="pip-audit", vulnerabilities_found=1,
                          execution_time=0.3, success=True,
                          error_message=f"pip-audit error: {e}; mock result returned")


async def _run_secret_scan() -> ScanResult:
    """Scan for secrets in the repository using regex patterns.

    Checks common secret patterns (API keys, tokens, passwords) in tracked
    files. Does not require external tools — uses git ls-files + regex.
    """
    start = datetime.utcnow()
    import re

    secret_patterns = [
        re.compile(r"(?i)(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['\"]?[A-Za-z0-9\-_/+=]{10,}", re.I),
        re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),                       # OpenAI key
        re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b"),  # GitHub token
        re.compile(r"(?i)password\s*[:=]\s*['\"][^'\"]{6,}['\"]"),     # hardcoded password
    ]
    # Files to skip
    skip_extensions = {".lock", ".svg", ".png", ".jpg", ".ico", ".woff", ".ttf", ".map"}

    findings = 0
    try:
        proc = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: subprocess.run(
                ["git", "ls-files"],
                capture_output=True, text=True, timeout=15,
            )
        )
        files = [f.strip() for f in (proc.stdout or "").splitlines() if f.strip()]
        # Only scan a reasonable number of small text files
        for fpath in files[:500]:
            ext = os.path.splitext(fpath)[1].lower()
            if ext in skip_extensions:
                continue
            # Skip node_modules and large files
            if "node_modules" in fpath or ".min." in fpath:
                continue
            full = os.path.join(os.getcwd(), fpath)
            try:
                if os.path.getsize(full) > 100_000:  # skip files > 100KB
                    continue
                with open(full, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                for pattern in secret_patterns:
                    if pattern.search(content):
                        findings += 1
                        break  # one finding per file is enough
            except Exception:
                continue
        elapsed = (datetime.utcnow() - start).total_seconds()
        logger.info("Secret scan completed: %d files with potential secrets", findings)
        return ScanResult(
            scan_type="secret-scan",
            vulnerabilities_found=findings,
            execution_time=round(elapsed, 2),
            success=True
        )
    except Exception as e:
        logger.warning("Secret scan failed: %s", e)
        return ScanResult(scan_type="secret-scan", vulnerabilities_found=0,
                          execution_time=0.1, success=True,
                          error_message=f"Secret scan error: {e}")

@router.get("/posture/kpis", response_model=List[PostureKPI])
async def get_posture_kpis():
    """Get security posture KPIs"""
    return _MOCK_KPIS

@router.get("/risk/score", response_model=RiskScore)
async def get_risk_score():
    """Calculate and return current risk score"""
    # Simple risk calculation based on KPIs
    kpis = await get_posture_kpis()
    factors = {}
    
    for kpi in kpis:
        factors[kpi.kpi] = kpi.value
    
    # Calculate overall risk score (0-100, where 100 is best)
    base_score = 100.0
    penalty = 0.0
    
    # Penalize for open vulnerabilities
    if "open_high_vulns" in factors:
        penalty += factors["open_high_vulns"] * 10
    
    # Penalize for patch latency
    if "patch_latency_days" in factors:
        penalty += factors["patch_latency_days"] * 2
    
    # Reward for compliance coverage
    if "compliance_coverage" in factors:
        penalty -= (100 - factors["compliance_coverage"]) * 0.5
    
    overall_score = max(0.0, min(100.0, base_score - penalty))
    
    # Determine trend (simplified)
    trend = "stable"
    if overall_score > 80:
        trend = "improving"
    elif overall_score < 40:
        trend = "degrading"
    
    return RiskScore(
        overall=overall_score,
        factors=factors,
        trend=trend
    )

@router.post("/rag/ask", response_model=CyberRAGResponse)
async def ask_cyber_rag(request: CyberRAGRequest):
    """Ask cybersecurity questions using RAG"""
    # This will integrate with your existing Agentic RAG system
    # For now, return a mock response
    
    start_time = datetime.utcnow()
    
    # Simulate RAG processing
    await asyncio.sleep(0.3)
    
    # Mock response based on question
    if "phishing" in request.question.lower():
        answer = "Phishing is a social engineering attack that uses deceptive emails or websites to steal sensitive information. Key prevention measures include user training, email filtering, and multi-factor authentication."
        sources = ["NIST Cybersecurity Framework", "OWASP Top 10"]
    elif "vulnerability" in request.question.lower():
        answer = "Vulnerabilities are weaknesses in systems that can be exploited by attackers. Regular vulnerability scanning, patch management, and secure coding practices are essential for mitigation."
        sources = ["CVE Database", "NIST Guidelines"]
    else:
        answer = "This is a general cybersecurity question. Please refer to established frameworks like NIST CSF, ISO 27001, or OWASP for comprehensive guidance."
        sources = ["Cybersecurity Best Practices"]
    
    processing_time = (datetime.utcnow() - start_time).total_seconds()
    
    return CyberRAGResponse(
        answer=answer,
        sources=sources,
        confidence=0.85,
        processing_time=processing_time
    )

@router.post("/coach/lesson", response_model=SecureCodingLessonResponse)
async def generate_secure_coding_lesson(request: SecureCodingLessonRequest):
    """Generate a secure coding micro-lesson"""
    # Get vulnerabilities for the project
    vulns = await list_vulnerabilities(request.project)
    
    # Focus on most critical vulnerabilities
    critical_vulns = [v for v in vulns if v.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)]
    
    if not critical_vulns:
        critical_vulns = vulns[:3]  # Take first 3 if no critical ones
    
    # Generate lesson content
    lesson_title = f"Secure Coding: {critical_vulns[0].title}" if critical_vulns else "General Secure Coding Practices"
    
    content = f"""
    # {lesson_title}
    
    ## Overview
    This lesson covers secure coding practices to prevent common vulnerabilities.
    
    ## Key Vulnerabilities to Address
    """
    
    for vuln in critical_vulns[:3]:
        content += f"""
    ### {vuln.title}
    - **Severity**: {vuln.severity}
    - **Description**: {vuln.description}
    - **Recommendation**: {vuln.recommendation}
    """
    
    content += """
    ## Best Practices
    1. Input validation and sanitization
    2. Parameterized queries
    3. Regular dependency updates
    4. Secure authentication mechanisms
    5. Error handling without information disclosure
    """
    
    return SecureCodingLessonResponse(
        title=lesson_title,
        content=content,
        duration_minutes=7,
        focus_vulnerabilities=[v.title for v in critical_vulns[:3]],
        code_examples=[
            "// Good: Parameterized query\nSELECT * FROM users WHERE id = ?",
            "// Bad: String concatenation\nSELECT * FROM users WHERE id = '<user_id>'"
        ],
        references=[
            "OWASP Secure Coding Practices",
            "NIST Secure Software Development",
            "CWE Top 25 Most Dangerous Software Errors"
        ]
    )

@router.get("/compliance/status", response_model=List[ComplianceStatus])
async def get_compliance_status(framework: Optional[str] = None):
    """Get compliance status for security controls"""
    # Mock compliance data
    mock_status = [
        ComplianceStatus(
            framework="NIST-CSF",
            control_id="PR.AC-1",
            status="implemented",
            evidence="MFA enabled for all users",
            reviewer="Security Team"
        ),
        ComplianceStatus(
            framework="OWASP-ASVS",
            control_id="2.1",
            status="partial",
            evidence="Basic authentication implemented, MFA pending",
            reviewer="Dev Team"
        ),
        ComplianceStatus(
            framework="CIS",
            control_id="1.1",
            status="implemented",
            evidence="Asset inventory maintained in CMDB",
            reviewer="IT Operations"
        )
    ]
    
    if framework:
        return [status for status in mock_status if status.framework == framework]
    
    return mock_status

@router.get("/vulnerabilities/summary")
async def get_vulnerability_summary(project: str = "default"):
    """Get vulnerability counts by severity for summary cards."""
    vulns = [v for v in _MOCK_VULNERABILITIES if v.project == project]
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    for v in vulns:
        sev = v.severity.value if hasattr(v.severity, "value") else str(v.severity)
        counts[sev] = counts.get(sev, 0) + 1
    return {
        "total": len(vulns),
        "open": sum(1 for v in vulns if not v.fixed),
        "fixed": sum(1 for v in vulns if v.fixed),
        "by_severity": counts,
    }


@router.get("/posture/nist-domains")
async def get_nist_domain_scores():
    """Get scores per NIST CSF 2.0 domain for radar/posture visualization.

    Domains: Govern, Identify, Protect, Detect, Respond, Recover.
    Scores are 0-100 (higher = better posture in that domain).
    """
    # In a production system these would be computed from compliance data,
    # vulnerability counts, incident metrics, etc. For now, realistic defaults
    # derived from the existing KPIs and controls.
    kpis = {k.kpi: k.value for k in _MOCK_KPIS}
    compliance = kpis.get("compliance_coverage", 78.5)

    # Derive scores: Protect penalised by open vulns, Detect by patch latency, etc.
    open_vulns_penalty = min(30, kpis.get("open_high_vulns", 0) * 10)
    patch_penalty = min(20, kpis.get("patch_latency_days", 0) * 3)

    domains = {
        "Govern":   round(min(100, compliance + 5), 1),
        "Identify": round(min(100, compliance + 2), 1),
        "Protect":  round(max(40, 90 - open_vulns_penalty), 1),
        "Detect":   round(max(40, 85 - patch_penalty), 1),
        "Respond":  75.0,   # based on incident response readiness (static for now)
        "Recover":  70.0,   # based on backup/DR readiness (static for now)
    }
    return {
        "domains": domains,
        "overall": round(sum(domains.values()) / len(domains), 1),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/health")
async def health_check():
    """Health check endpoint for cybersecurity module"""
    return {
        "status": "healthy",
        "module": "cybersecurity",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
