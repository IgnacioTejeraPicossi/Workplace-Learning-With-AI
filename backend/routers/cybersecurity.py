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
    ScanResult, SeverityLevel, ComplianceUpdateRequest, CoachTopic,
    DrillScenario, DrillStep, DrillSession, KnowledgeArticle
)
import uuid

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
    # NIST CSF controls (6)
    ControlMap(id="NIST-CSF:GV.OC-1", title="Organizational Context", framework="NIST-CSF",
               description="The organizational mission is understood and informs cybersecurity risk management.",
               tags=["governance", "strategy"], implementation_guidance="Document organizational mission, stakeholders, and legal requirements."),
    ControlMap(id="NIST-CSF:ID.AM-1", title="Asset Management", framework="NIST-CSF",
               description="Inventories of hardware, software, and data are maintained.",
               tags=["inventory", "assets"], implementation_guidance="Maintain automated asset discovery and CMDB."),
    ControlMap(id="NIST-CSF:PR.AC-1", title="Access Control—Identity Management", framework="NIST-CSF",
               description="Establish and manage identities and access.",
               tags=["access-control", "identity", "authentication"], implementation_guidance="Implement MFA and role-based access control."),
    ControlMap(id="NIST-CSF:PR.DS-1", title="Data Security", framework="NIST-CSF",
               description="Data-at-rest is protected.",
               tags=["encryption", "data-protection"], implementation_guidance="Encrypt sensitive data at rest using AES-256 or equivalent."),
    ControlMap(id="NIST-CSF:DE.CM-1", title="Continuous Monitoring", framework="NIST-CSF",
               description="Networks and network services are monitored to detect potential cybersecurity events.",
               tags=["monitoring", "detection"], implementation_guidance="Deploy SIEM and network monitoring with alerting."),
    ControlMap(id="NIST-CSF:RS.RP-1", title="Response Planning", framework="NIST-CSF",
               description="Response processes and procedures are executed and maintained.",
               tags=["incident-response", "planning"], implementation_guidance="Maintain and test incident response playbooks quarterly."),
    # ISO 27001 controls (4)
    ControlMap(id="ISO-27001:A.5.1", title="Information Security Policies", framework="ISO-27001",
               description="A set of policies for information security shall be defined and approved.",
               tags=["policy", "governance"], implementation_guidance="Create, publish, and review information security policies annually."),
    ControlMap(id="ISO-27001:A.8.1", title="Responsibility for Assets", framework="ISO-27001",
               description="Assets associated with information shall be identified and an inventory maintained.",
               tags=["assets", "ownership"], implementation_guidance="Assign ownership and classify all information assets."),
    ControlMap(id="ISO-27001:A.9.1", title="Business Requirements of Access Control", framework="ISO-27001",
               description="Access to networks and network services shall be controlled.",
               tags=["access-control", "network"], implementation_guidance="Define and enforce access control policy based on business need."),
    ControlMap(id="ISO-27001:A.12.4", title="Logging and Monitoring", framework="ISO-27001",
               description="Event logs recording user activities and security events shall be produced and kept.",
               tags=["logging", "monitoring", "audit"], implementation_guidance="Centralize logs, retain for 90+ days, and review regularly."),
    # CIS controls (4)
    ControlMap(id="CIS:1.1", title="Inventory of Enterprise Assets", framework="CIS",
               description="Actively manage all enterprise assets connected to the network.",
               tags=["inventory", "assets"], implementation_guidance="Use automated tools to maintain an accurate asset inventory."),
    ControlMap(id="CIS:2.1", title="Inventory of Software Assets", framework="CIS",
               description="Actively manage all software on the network.",
               tags=["software", "inventory"], implementation_guidance="Maintain a software inventory with authorized/unauthorized classifications."),
    ControlMap(id="CIS:4.1", title="Secure Configuration of Enterprise Assets", framework="CIS",
               description="Establish and maintain secure configuration processes.",
               tags=["hardening", "configuration"], implementation_guidance="Apply CIS Benchmarks or equivalent hardening guides."),
    ControlMap(id="CIS:8.1", title="Audit Log Management", framework="CIS",
               description="Establish and maintain audit log management processes.",
               tags=["logging", "audit"], implementation_guidance="Collect, centralize, and retain audit logs per policy."),
    # OWASP ASVS controls (3)
    ControlMap(id="OWASP-ASVS:2.1", title="Authentication Design", framework="OWASP-ASVS",
               description="Design and verify authentication mechanisms.",
               tags=["authentication", "design"], implementation_guidance="Use strong protocols and secure session management."),
    ControlMap(id="OWASP-ASVS:3.1", title="Session Management", framework="OWASP-ASVS",
               description="Verify session management requirements.",
               tags=["session", "tokens"], implementation_guidance="Use secure, httpOnly cookies with appropriate expiration."),
    ControlMap(id="OWASP-ASVS:5.1", title="Input Validation", framework="OWASP-ASVS",
               description="Verify that input is validated and sanitized.",
               tags=["input-validation", "sanitization"], implementation_guidance="Validate all input on the server side; use allowlists."),
    # OWASP Top 10 controls (5)
    ControlMap(id="OWASP-TOP10:A01", title="Broken Access Control", framework="OWASP-TOP10",
               description="Restrictions on what authenticated users are allowed to do are not properly enforced.",
               tags=["access-control", "authorization"], implementation_guidance="Deny by default; enforce server-side access checks."),
    ControlMap(id="OWASP-TOP10:A02", title="Cryptographic Failures", framework="OWASP-TOP10",
               description="Failures related to cryptography leading to data exposure.",
               tags=["crypto", "encryption"], implementation_guidance="Use strong algorithms (AES-256, RSA-2048+); never roll your own crypto."),
    ControlMap(id="OWASP-TOP10:A03", title="Injection", framework="OWASP-TOP10",
               description="User-supplied data is sent to an interpreter as part of a command or query.",
               tags=["injection", "input-validation"], implementation_guidance="Use parameterized queries and ORM; validate all input."),
    ControlMap(id="OWASP-TOP10:A05", title="Security Misconfiguration", framework="OWASP-TOP10",
               description="Missing or incorrect security configuration.",
               tags=["configuration", "hardening"], implementation_guidance="Automate configuration management; remove default credentials."),
    ControlMap(id="OWASP-TOP10:A09", title="Security Logging and Monitoring Failures", framework="OWASP-TOP10",
               description="Insufficient logging, detection, monitoring, and active response.",
               tags=["logging", "monitoring"], implementation_guidance="Log security events; implement alerting and review processes."),
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

# In-memory compliance status store (keyed by "framework:control_id")
_COMPLIANCE_STATUS: Dict[str, ComplianceStatus] = {}

def _init_compliance():
    """Seed compliance status for all controls."""
    seed = {
        "NIST-CSF:GV.OC-1": ("implemented", "Mission statement and risk appetite documented", "CISO"),
        "NIST-CSF:ID.AM-1": ("implemented", "Automated asset discovery deployed", "IT Operations"),
        "NIST-CSF:PR.AC-1": ("implemented", "MFA enabled for all users", "Security Team"),
        "NIST-CSF:PR.DS-1": ("partial", "Encryption at rest for databases; file shares pending", "Data Team"),
        "NIST-CSF:DE.CM-1": ("partial", "SIEM deployed; tuning in progress", "SOC Team"),
        "NIST-CSF:RS.RP-1": ("partial", "Playbooks drafted; not yet tested", "Security Team"),
        "ISO-27001:A.5.1": ("implemented", "ISMS policy published and reviewed annually", "CISO"),
        "ISO-27001:A.8.1": ("implemented", "Asset register with owners maintained", "IT Operations"),
        "ISO-27001:A.9.1": ("partial", "Network access policy defined; enforcement gaps remain", "Network Team"),
        "ISO-27001:A.12.4": ("implemented", "Centralized logging with 90-day retention", "SOC Team"),
        "CIS:1.1": ("implemented", "Asset inventory maintained in CMDB", "IT Operations"),
        "CIS:2.1": ("partial", "Software inventory 80% complete; shadow IT gaps", "IT Operations"),
        "CIS:4.1": ("not_implemented", "CIS Benchmarks not yet applied to all systems", "Infra Team"),
        "CIS:8.1": ("implemented", "Audit logs centralized and retained", "SOC Team"),
        "OWASP-ASVS:2.1": ("implemented", "Strong authentication with MFA", "Dev Team"),
        "OWASP-ASVS:3.1": ("partial", "Secure cookies; token rotation pending", "Dev Team"),
        "OWASP-ASVS:5.1": ("partial", "Server-side validation on main endpoints; gaps in legacy APIs", "Dev Team"),
        "OWASP-TOP10:A01": ("partial", "RBAC implemented; some endpoints missing checks", "Dev Team"),
        "OWASP-TOP10:A02": ("implemented", "AES-256 and TLS 1.3 in use", "Security Team"),
        "OWASP-TOP10:A03": ("implemented", "Parameterized queries and ORM used", "Dev Team"),
        "OWASP-TOP10:A05": ("not_implemented", "Default configs remain on some services", "DevOps"),
        "OWASP-TOP10:A09": ("partial", "Basic logging; alerting not fully configured", "SOC Team"),
    }
    for key, (status, evidence, reviewer) in seed.items():
        fw, ctrl = key.split(":", 1)
        _COMPLIANCE_STATUS[key] = ComplianceStatus(
            framework=fw, control_id=ctrl, status=status,
            evidence=evidence, reviewer=reviewer,
        )

_init_compliance()


@router.get("/compliance/status", response_model=List[ComplianceStatus])
async def get_compliance_status(framework: Optional[str] = None):
    """Get compliance status for all controls, optionally filtered by framework."""
    statuses = list(_COMPLIANCE_STATUS.values())
    if framework:
        statuses = [s for s in statuses if s.framework == framework]
    return statuses


@router.put("/compliance/{framework}/{control_id}")
async def update_compliance_status(framework: str, control_id: str, request: ComplianceUpdateRequest):
    """Update the compliance status for a specific control."""
    key = f"{framework}:{control_id}"
    existing = _COMPLIANCE_STATUS.get(key)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Control {key} not found")
    existing.status = request.status
    if request.evidence is not None:
        existing.evidence = request.evidence
    if request.reviewer is not None:
        existing.reviewer = request.reviewer
    existing.last_reviewed = datetime.utcnow()
    return existing


@router.get("/compliance/summary")
async def get_compliance_summary():
    """Get compliance summary with counts per framework and overall percentages."""
    by_framework: Dict[str, Dict[str, int]] = {}
    for s in _COMPLIANCE_STATUS.values():
        fw = s.framework
        if fw not in by_framework:
            by_framework[fw] = {"total": 0, "implemented": 0, "partial": 0, "not_implemented": 0, "not_applicable": 0}
        by_framework[fw]["total"] += 1
        by_framework[fw][s.status] = by_framework[fw].get(s.status, 0) + 1

    frameworks = []
    for fw, counts in by_framework.items():
        total = counts["total"]
        implemented = counts.get("implemented", 0)
        partial = counts.get("partial", 0)
        pct = round(((implemented + partial * 0.5) / max(total, 1)) * 100, 1)
        frameworks.append({"framework": fw, "counts": counts, "completion_pct": pct})

    total_all = len(_COMPLIANCE_STATUS)
    impl_all = sum(1 for s in _COMPLIANCE_STATUS.values() if s.status == "implemented")
    partial_all = sum(1 for s in _COMPLIANCE_STATUS.values() if s.status == "partial")
    overall_pct = round(((impl_all + partial_all * 0.5) / max(total_all, 1)) * 100, 1)

    return {
        "total_controls": total_all,
        "implemented": impl_all,
        "partial": partial_all,
        "not_implemented": sum(1 for s in _COMPLIANCE_STATUS.values() if s.status == "not_implemented"),
        "overall_completion_pct": overall_pct,
        "by_framework": frameworks,
    }

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


# --- Secure Coding Coach catalog & history ---

_COACH_TOPICS = [
    CoachTopic(id="injection", title="Preventing Injection Attacks", category="injection",
               difficulty="beginner", estimated_minutes=7,
               description="SQL injection, command injection, and how parameterized queries prevent them."),
    CoachTopic(id="auth-bypass", title="Authentication & Session Security", category="auth",
               difficulty="intermediate", estimated_minutes=8,
               description="Secure password storage, MFA, session tokens, and common bypass techniques."),
    CoachTopic(id="xss", title="Cross-Site Scripting (XSS) Prevention", category="injection",
               difficulty="beginner", estimated_minutes=6,
               description="Reflected, stored, and DOM-based XSS with encoding and CSP defenses."),
    CoachTopic(id="crypto", title="Cryptography Best Practices", category="crypto",
               difficulty="intermediate", estimated_minutes=10,
               description="Choosing algorithms, key management, TLS configuration, and common pitfalls."),
    CoachTopic(id="secrets", title="Secrets Management", category="config",
               difficulty="beginner", estimated_minutes=5,
               description="Environment variables, vault integration, and avoiding hardcoded secrets."),
    CoachTopic(id="dependency", title="Dependency Security", category="config",
               difficulty="beginner", estimated_minutes=6,
               description="Supply chain risks, lockfiles, automated audits (npm audit, pip-audit)."),
    CoachTopic(id="api-security", title="Secure API Design", category="auth",
               difficulty="advanced", estimated_minutes=10,
               description="Rate limiting, input validation, auth tokens, CORS, and API versioning."),
    CoachTopic(id="logging", title="Security Logging & Monitoring", category="monitoring",
               difficulty="intermediate", estimated_minutes=7,
               description="What to log, log injection prevention, SIEM integration, and alerting."),
    CoachTopic(id="error-handling", title="Secure Error Handling", category="general",
               difficulty="beginner", estimated_minutes=5,
               description="Information disclosure through errors, stack traces, and debug endpoints."),
    CoachTopic(id="zero-trust", title="Zero Trust Architecture", category="general",
               difficulty="advanced", estimated_minutes=12,
               description="Principles of zero trust, microsegmentation, and continuous verification."),
]

_COACH_HISTORY: List[Dict] = []  # In-memory lesson history


@router.get("/coach/topics", response_model=List[CoachTopic])
async def list_coach_topics(category: Optional[str] = None, difficulty: Optional[str] = None):
    """List available secure coding topics for micro-lessons."""
    topics = _COACH_TOPICS
    if category:
        topics = [t for t in topics if t.category == category]
    if difficulty:
        topics = [t for t in topics if t.difficulty == difficulty]
    return topics


@router.get("/coach/history")
async def get_coach_history(limit: int = 20):
    """Get recently generated lesson history."""
    return _COACH_HISTORY[-limit:]


@router.post("/coach/lesson/topic/{topic_id}", response_model=SecureCodingLessonResponse)
async def generate_topic_lesson(topic_id: str):
    """Generate a micro-lesson for a specific topic from the catalog."""
    topic = next((t for t in _COACH_TOPICS if t.id == topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")

    # Build a structured lesson from the topic
    content = f"# {topic.title}\n\n"
    content += f"**Difficulty**: {topic.difficulty.title()} | **Estimated time**: {topic.estimated_minutes} min\n\n"
    content += f"## Overview\n{topic.description}\n\n"

    # Topic-specific content
    _TOPIC_CONTENT = {
        "injection": (
            "## What is Injection?\nInjection attacks occur when untrusted data is sent to an interpreter as part of a command or query. The attacker's hostile data tricks the interpreter into executing unintended commands.\n\n"
            "## Prevention\n1. **Use parameterized queries** (prepared statements)\n2. **Use ORM frameworks** that auto-escape\n3. **Validate all input** on the server side\n4. **Apply least privilege** to database accounts\n5. **Use allowlists** for expected input patterns\n\n"
            "## Code Example\n```python\n# BAD - vulnerable to SQL injection\nquery = f\"SELECT * FROM users WHERE id = '{user_id}'\"\n\n# GOOD - parameterized query\ncursor.execute(\"SELECT * FROM users WHERE id = %s\", (user_id,))\n```\n"
        ),
        "auth-bypass": (
            "## Authentication Security\nAuthentication is the process of verifying who a user is. Weak authentication leads to unauthorized access.\n\n"
            "## Best Practices\n1. **Use bcrypt/argon2** for password hashing (never MD5/SHA1)\n2. **Implement MFA** for sensitive operations\n3. **Use secure session tokens** (httpOnly, secure flags)\n4. **Set session timeouts** and implement token rotation\n5. **Rate-limit login attempts** to prevent brute force\n\n"
            "## Code Example\n```python\n# BAD - weak hashing\nimport hashlib\nhashed = hashlib.md5(password.encode()).hexdigest()\n\n# GOOD - strong hashing\nfrom argon2 import PasswordHasher\nph = PasswordHasher()\nhashed = ph.hash(password)\n```\n"
        ),
        "xss": (
            "## Cross-Site Scripting (XSS)\nXSS attacks inject malicious scripts into web pages viewed by other users.\n\n"
            "## Types\n- **Reflected**: Malicious input reflected back immediately\n- **Stored**: Payload stored in database, served to all users\n- **DOM-based**: Client-side JavaScript manipulation\n\n"
            "## Prevention\n1. **Escape output** in HTML context\n2. **Use Content Security Policy** (CSP) headers\n3. **Validate and sanitize** all input\n4. **Use frameworks** that auto-escape (React, Angular)\n\n"
            "## Code Example\n```javascript\n// BAD - direct HTML insertion\nelement.innerHTML = userInput;\n\n// GOOD - text content (auto-escaped)\nelement.textContent = userInput;\n```\n"
        ),
        "secrets": (
            "## Secrets Management\nHardcoded secrets in source code are one of the most common security vulnerabilities.\n\n"
            "## Best Practices\n1. **Use environment variables** for configuration\n2. **Use a secrets manager** (Vault, AWS Secrets Manager)\n3. **Never commit secrets** to version control\n4. **Rotate secrets regularly** and on exposure\n5. **Scan for secrets** in CI/CD (git-secrets, trufflehog)\n\n"
            "## Code Example\n```python\n# BAD - hardcoded secret\nAPI_KEY = \"sk-abc123secret\"\n\n# GOOD - environment variable\nimport os\nAPI_KEY = os.getenv(\"API_KEY\")\nassert API_KEY, \"API_KEY environment variable required\"\n```\n"
        ),
    }

    specific = _TOPIC_CONTENT.get(topic_id, "")
    if specific:
        content += specific
    else:
        content += f"## Key Concepts\n{topic.description}\n\n"
        content += "## Best Practices\n1. Follow the principle of least privilege\n2. Validate all input\n3. Keep dependencies up to date\n4. Monitor and log security events\n5. Conduct regular security reviews\n"

    lesson = SecureCodingLessonResponse(
        title=topic.title,
        content=content,
        duration_minutes=topic.estimated_minutes,
        focus_vulnerabilities=[topic.category],
        code_examples=[],
        references=["OWASP Secure Coding Practices", "CWE Top 25"],
    )

    # Save to history
    _COACH_HISTORY.append({
        "topic_id": topic_id, "title": topic.title,
        "generated_at": datetime.utcnow().isoformat(),
        "duration_minutes": topic.estimated_minutes,
    })

    return lesson


## ──────────────────────────────────────────────
##  Sprint 3 — Incident Response Drills
## ──────────────────────────────────────────────

_DRILL_SCENARIOS: List[DrillScenario] = [
    DrillScenario(id="ransomware-1", title="Ransomware Attack on File Server",
                  category="ransomware", difficulty="intermediate", estimated_minutes=15,
                  description="A file server has been encrypted by ransomware. Walk through containment, eradication, and recovery steps.",
                  steps_count=4),
    DrillScenario(id="phishing-1", title="Executive Phishing Campaign",
                  category="phishing", difficulty="beginner", estimated_minutes=10,
                  description="The CEO received a convincing spear-phishing email. Determine the scope of compromise and respond.",
                  steps_count=4),
    DrillScenario(id="data-breach-1", title="Customer Database Breach",
                  category="data_breach", difficulty="advanced", estimated_minutes=20,
                  description="Unauthorized access to the customer database has been detected. Manage the incident from detection through notification.",
                  steps_count=5),
    DrillScenario(id="ddos-1", title="DDoS Attack on Public API",
                  category="ddos", difficulty="intermediate", estimated_minutes=12,
                  description="Your public API is under a volumetric DDoS attack. Mitigate the attack while keeping services available.",
                  steps_count=4),
    DrillScenario(id="insider-1", title="Insider Data Exfiltration",
                  category="insider_threat", difficulty="advanced", estimated_minutes=18,
                  description="DLP alerts show a departing employee copying sensitive files. Investigate and respond without tipping off the insider.",
                  steps_count=4),
    DrillScenario(id="supply-chain-1", title="Compromised NPM Package",
                  category="supply_chain", difficulty="intermediate", estimated_minutes=14,
                  description="A popular NPM dependency in your frontend has been found to contain a backdoor. Assess impact and remediate.",
                  steps_count=4),
]

# Pre-built drill steps keyed by scenario_id
_DRILL_STEPS: Dict[str, List[DrillStep]] = {
    "ransomware-1": [
        DrillStep(step_number=1, title="Initial Detection",
                  situation="The SOC receives alerts: multiple file extensions changed to .encrypted on the file server. Users report they can't access shared documents.",
                  options=[
                    {"id": "A", "label": "Pay the ransom immediately", "description": "Contact the attacker and negotiate payment to get the decryption key."},
                    {"id": "B", "label": "Isolate the affected server", "description": "Immediately disconnect the file server from the network to prevent lateral movement."},
                    {"id": "C", "label": "Reboot the server", "description": "Restart the file server hoping it will clear the encryption process."},
                    {"id": "D", "label": "Email all employees", "description": "Send a company-wide email about the attack before investigating."},
                  ],
                  correct_option="B",
                  explanation="Isolating the affected system is the critical first step. It prevents the ransomware from spreading to other systems. Never pay the ransom as a first action, and rebooting may destroy forensic evidence."),
        DrillStep(step_number=2, title="Scope Assessment",
                  situation="The file server is isolated. You need to determine how far the ransomware has spread.",
                  options=[
                    {"id": "A", "label": "Check EDR/AV dashboards for other infections", "description": "Review endpoint detection tools for indicators of compromise across all systems."},
                    {"id": "B", "label": "Assume only one server is affected", "description": "Focus all effort on recovering the single file server."},
                    {"id": "C", "label": "Shut down the entire network", "description": "Power off all systems in the organization to stop any spread."},
                    {"id": "D", "label": "Start restoring from backup immediately", "description": "Begin backup restoration on the encrypted server right away."},
                  ],
                  correct_option="A",
                  explanation="Checking EDR/AV dashboards helps determine the full scope before taking recovery actions. Restoring from backup prematurely could reinfect if the entry point isn't identified. Shutting everything down is disproportionate without evidence of wider spread."),
        DrillStep(step_number=3, title="Eradication & Recovery",
                  situation="EDR shows the ransomware entered via a phishing email with a macro-enabled document. Only the file server and one workstation are infected.",
                  options=[
                    {"id": "A", "label": "Wipe and restore from clean backups", "description": "Rebuild the file server and workstation from known-good backups after removing the threat."},
                    {"id": "B", "label": "Run antivirus scan and resume operations", "description": "Scan the infected systems and reconnect them to the network."},
                    {"id": "C", "label": "Patch the vulnerability and move on", "description": "Apply patches and hope the ransomware doesn't reactivate."},
                    {"id": "D", "label": "Decrypt files using online tools", "description": "Search for free decryption tools matching this ransomware variant."},
                  ],
                  correct_option="A",
                  explanation="Wiping and restoring from clean backups is the most reliable eradication method. AV scans alone may miss persistence mechanisms. While free decryptors exist for some variants, they shouldn't be the primary recovery strategy."),
        DrillStep(step_number=4, title="Post-Incident Actions",
                  situation="Systems are restored and operational. What should you prioritize for post-incident activities?",
                  options=[
                    {"id": "A", "label": "Return to normal operations immediately", "description": "Close the incident and resume business as usual."},
                    {"id": "B", "label": "Conduct lessons-learned review", "description": "Run a post-incident review, update playbooks, enhance email filtering, and conduct phishing training."},
                    {"id": "C", "label": "Fire the employee who clicked the email", "description": "Terminate the user who opened the phishing email."},
                    {"id": "D", "label": "Block all email attachments", "description": "Disable all email attachments company-wide to prevent future attacks."},
                  ],
                  correct_option="B",
                  explanation="A lessons-learned review is essential for improving defenses. Update playbooks, enhance email security controls, and provide targeted phishing awareness training. Punishing users creates a culture of hiding incidents."),
    ],
    "phishing-1": [
        DrillStep(step_number=1, title="Report Received",
                  situation="The CEO's assistant reports a suspicious email asking the CEO to approve an urgent wire transfer. The email appears to come from the CFO.",
                  options=[
                    {"id": "A", "label": "Delete the email and move on", "description": "Remove the email and consider the issue resolved."},
                    {"id": "B", "label": "Analyze the email headers and links", "description": "Examine the email source, headers, and any links without clicking them."},
                    {"id": "C", "label": "Reply to the email to verify", "description": "Respond to the sender asking if they sent the email."},
                    {"id": "D", "label": "Forward it to the whole company as a warning", "description": "Send the suspicious email to all employees so they can be aware."},
                  ],
                  correct_option="B",
                  explanation="Analyzing headers and links reveals whether the email is spoofed or from a compromised account. Never reply to suspicious emails (you'd be talking to the attacker), and forwarding spreads the malicious content."),
        DrillStep(step_number=2, title="Scope Determination",
                  situation="Headers confirm the email was spoofed (external sender with forged CFO display name). You find 5 similar emails sent to other executives.",
                  options=[
                    {"id": "A", "label": "Quarantine all similar emails and check for clicks", "description": "Use the email gateway to quarantine matching emails and check proxy logs for anyone who clicked the links."},
                    {"id": "B", "label": "Only worry about the CEO's email", "description": "Since the CEO didn't click, focus only on that one email."},
                    {"id": "C", "label": "Block the sender's IP permanently", "description": "Add the sending IP to the permanent blocklist."},
                    {"id": "D", "label": "Disable all executive email accounts", "description": "Lock all executive mailboxes until the investigation is complete."},
                  ],
                  correct_option="A",
                  explanation="Quarantining all similar emails and checking for clicks determines the full impact. Blocking one IP is easily circumvented by attackers. Disabling executive accounts is disproportionate and disrupts business."),
        DrillStep(step_number=3, title="Containment",
                  situation="Proxy logs show one VP clicked the link and entered credentials on a fake login page 30 minutes ago.",
                  options=[
                    {"id": "A", "label": "Reset the VP's credentials and revoke sessions", "description": "Immediately reset the VP's password, revoke all active sessions, and enable MFA if not already active."},
                    {"id": "B", "label": "Wait and monitor for suspicious activity", "description": "Watch the VP's account for unusual behavior before taking action."},
                    {"id": "C", "label": "Ask the VP to change their own password", "description": "Send an email asking the VP to change their password at their convenience."},
                    {"id": "D", "label": "Disable the VP's laptop", "description": "Remotely wipe the VP's computer."},
                  ],
                  correct_option="A",
                  explanation="Immediate credential reset and session revocation prevents the attacker from using stolen credentials. Waiting gives the attacker more time. The VP changing their own password isn't urgent enough, and wiping the laptop is excessive for a credential compromise."),
        DrillStep(step_number=4, title="Remediation",
                  situation="The VP's credentials have been reset. No unauthorized access was detected with the stolen credentials. What are the next steps?",
                  options=[
                    {"id": "A", "label": "Close the incident — no damage done", "description": "Since no unauthorized access occurred, close the case."},
                    {"id": "B", "label": "Enhance email security and train executives", "description": "Add DMARC/DKIM enforcement, deploy anti-phishing training for executives, and update the BEC playbook."},
                    {"id": "C", "label": "Switch to a different email provider", "description": "Migrate the entire company to a new email platform."},
                    {"id": "D", "label": "Ban all external emails", "description": "Block all emails from external senders."},
                  ],
                  correct_option="B",
                  explanation="Enhancing email authentication (DMARC/DKIM/SPF), targeted executive training, and updating playbooks reduces future risk. The incident revealed a gap that should be addressed even though damage was avoided."),
    ],
    "data-breach-1": [
        DrillStep(step_number=1, title="Alert Triggered",
                  situation="Your SIEM alerts on unusual database queries: a service account is running SELECT * on the customers table and exfiltrating data to an external IP at 3 AM.",
                  options=[
                    {"id": "A", "label": "Block the external IP and revoke the service account", "description": "Immediately block outbound traffic to the IP and disable the compromised service account."},
                    {"id": "B", "label": "Monitor the activity to gather more intel", "description": "Continue watching to understand the full scope of what's being accessed."},
                    {"id": "C", "label": "Shut down the database server", "description": "Power off the database to stop any data transfer immediately."},
                    {"id": "D", "label": "Call the police immediately", "description": "Contact law enforcement before taking any technical action."},
                  ],
                  correct_option="A",
                  explanation="Blocking the exfiltration path and revoking the compromised account stops the bleeding while preserving evidence. Monitoring lets more data leak. Shutting down the DB disrupts business and may destroy evidence. Law enforcement should be contacted, but after initial containment."),
        DrillStep(step_number=2, title="Impact Assessment",
                  situation="The service account was compromised via a leaked API key in a public GitHub repo. Database logs show 50,000 customer records (names, emails, hashed passwords) were queried over 2 hours.",
                  options=[
                    {"id": "A", "label": "Assess data sensitivity and regulatory obligations", "description": "Determine what data was exposed, applicable regulations (GDPR, etc.), and notification requirements."},
                    {"id": "B", "label": "Delete the database logs to hide the breach", "description": "Remove evidence of the breach to avoid regulatory scrutiny."},
                    {"id": "C", "label": "Assume only emails were taken", "description": "Minimize the scope to just email addresses to reduce notification burden."},
                    {"id": "D", "label": "Publicly announce the breach on social media", "description": "Post about the breach on Twitter/X immediately for transparency."},
                  ],
                  correct_option="A",
                  explanation="Assessing data sensitivity and regulatory obligations is critical for proper response. GDPR requires notification within 72 hours for personal data breaches. Destroying logs is illegal in many jurisdictions. Public announcement should follow legal counsel review."),
        DrillStep(step_number=3, title="Containment & Eradication",
                  situation="The leaked API key has been rotated. You've confirmed no other credentials were exposed in the repo. What's next?",
                  options=[
                    {"id": "A", "label": "Audit all secrets, add pre-commit hooks, enable MFA on GitHub", "description": "Comprehensive secrets audit, automated secret scanning in CI/CD, and tighten repo access controls."},
                    {"id": "B", "label": "Just rotate the one leaked key", "description": "The specific key is already rotated — that's sufficient."},
                    {"id": "C", "label": "Make the GitHub repo private", "description": "Change the repository visibility to private."},
                    {"id": "D", "label": "Delete the entire GitHub repository", "description": "Remove the repo to eliminate any remaining exposed secrets."},
                  ],
                  correct_option="A",
                  explanation="A comprehensive audit finds other potential leaks. Pre-commit hooks (git-secrets, trufflehog) prevent future leaks. Making the repo private doesn't help — the key was already scraped. Deleting the repo destroys legitimate code."),
        DrillStep(step_number=4, title="Notification Planning",
                  situation="Legal confirms GDPR applies. 50,000 EU customer records were affected. 48 hours have passed since detection.",
                  options=[
                    {"id": "A", "label": "Notify the DPA within 72 hours and prepare customer notifications", "description": "File the supervisory authority notification (within GDPR's 72-hour window) and draft customer breach notifications."},
                    {"id": "B", "label": "Wait until the full investigation is complete", "description": "Delay notification until every detail is confirmed."},
                    {"id": "C", "label": "Only notify customers, skip the DPA", "description": "Inform affected customers but don't file with the data protection authority."},
                    {"id": "D", "label": "Claim the hashed passwords make this low risk", "description": "Argue that because passwords were hashed, notification isn't required."},
                  ],
                  correct_option="A",
                  explanation="GDPR Article 33 requires DPA notification within 72 hours. With 48 hours elapsed, you have 24 hours left. Names + emails constitute personal data even without passwords. Customer notification (Article 34) is likely required given the volume. Delaying risks significant fines."),
        DrillStep(step_number=5, title="Post-Breach Improvements",
                  situation="Notifications have been sent. The breach is contained. What long-term improvements should you prioritize?",
                  options=[
                    {"id": "A", "label": "Implement defense-in-depth improvements", "description": "Add database activity monitoring, encrypt PII at rest, implement secret scanning in CI/CD, and conduct a tabletop exercise."},
                    {"id": "B", "label": "Everything is fine now — resume normal operations", "description": "The breach is handled; no further action needed."},
                    {"id": "C", "label": "Outsource all security to a third party", "description": "Hire an MSSP to handle everything going forward."},
                    {"id": "D", "label": "Restrict database access to only the CEO", "description": "Limit database access to a single person."},
                  ],
                  correct_option="A",
                  explanation="Defense-in-depth (DAM, encryption, secret scanning, training) addresses root causes and reduces future risk. A single breach doesn't mean outsourcing all security. Restricting access to one person creates operational fragility."),
    ],
}

# Generate default steps for scenarios without pre-built steps
def _get_drill_steps(scenario_id: str) -> List[DrillStep]:
    if scenario_id in _DRILL_STEPS:
        return _DRILL_STEPS[scenario_id]
    # Generic steps for scenarios without specific content
    scenario = next((s for s in _DRILL_SCENARIOS if s.id == scenario_id), None)
    if not scenario:
        return []
    return [
        DrillStep(step_number=1, title="Detection & Triage",
                  situation=f"You receive an alert related to: {scenario.description} What is your first action?",
                  options=[
                    {"id": "A", "label": "Ignore the alert", "description": "Dismiss it as a false positive."},
                    {"id": "B", "label": "Assess and validate the alert", "description": "Verify the alert, check severity, and gather initial context."},
                    {"id": "C", "label": "Escalate to management immediately", "description": "Send an email to the CEO before investigating."},
                    {"id": "D", "label": "Post about it on social media", "description": "Share the alert publicly for crowd-sourced analysis."},
                  ],
                  correct_option="B",
                  explanation="Always assess and validate alerts first. Gather context before escalating or taking drastic action."),
        DrillStep(step_number=2, title="Containment",
                  situation="The alert is confirmed as a real incident. What containment strategy do you apply?",
                  options=[
                    {"id": "A", "label": "Isolate affected systems and preserve evidence", "description": "Contain the incident while maintaining forensic integrity."},
                    {"id": "B", "label": "Shut everything down", "description": "Power off all systems in the organization."},
                    {"id": "C", "label": "Do nothing and wait", "description": "Wait to see if the incident resolves itself."},
                    {"id": "D", "label": "Wipe all affected systems immediately", "description": "Reformat everything to eliminate the threat."},
                  ],
                  correct_option="A",
                  explanation="Isolating affected systems prevents spread while preserving evidence for investigation. Wholesale shutdown or wipes destroy evidence and disrupt operations."),
        DrillStep(step_number=3, title="Eradication & Recovery",
                  situation="Containment is in place. How do you proceed with eradication?",
                  options=[
                    {"id": "A", "label": "Identify root cause, remove threat, restore from clean state", "description": "Determine how the attacker got in, remove all persistence, and restore from verified backups."},
                    {"id": "B", "label": "Just restart the services", "description": "Reboot everything and hope it's fixed."},
                    {"id": "C", "label": "Pay any ransom demanded", "description": "Meet attacker demands to resolve quickly."},
                    {"id": "D", "label": "Blame a team member", "description": "Find someone to hold responsible and move on."},
                  ],
                  correct_option="A",
                  explanation="Root cause analysis ensures the threat is fully removed. Restoring from clean backups after eradication is the reliable path. Never pay ransoms as a primary strategy."),
        DrillStep(step_number=4, title="Post-Incident Review",
                  situation="The incident is resolved. What should happen next?",
                  options=[
                    {"id": "A", "label": "Conduct lessons learned and update defenses", "description": "Run a blameless post-mortem, update playbooks, improve controls, and train staff."},
                    {"id": "B", "label": "Forget it happened", "description": "Close the ticket and don't discuss it."},
                    {"id": "C", "label": "Fire the security team", "description": "Replace the entire security team."},
                    {"id": "D", "label": "Buy more security tools", "description": "Purchase new tools without understanding what failed."},
                  ],
                  correct_option="A",
                  explanation="A blameless post-mortem identifies improvements. Update playbooks, enhance controls based on findings, and provide targeted training. Tools alone don't fix process gaps."),
    ]

_DRILL_SESSIONS: Dict[str, DrillSession] = {}


@router.get("/drills/scenarios", response_model=List[DrillScenario])
async def list_drill_scenarios(category: Optional[str] = None, difficulty: Optional[str] = None):
    """List available incident response drill scenarios."""
    scenarios = _DRILL_SCENARIOS
    if category:
        scenarios = [s for s in scenarios if s.category == category]
    if difficulty:
        scenarios = [s for s in scenarios if s.difficulty == difficulty]
    return scenarios


@router.post("/drills/start/{scenario_id}")
async def start_drill(scenario_id: str):
    """Start a new drill session for a given scenario."""
    scenario = next((s for s in _DRILL_SCENARIOS if s.id == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

    steps = _get_drill_steps(scenario_id)
    session_id = str(uuid.uuid4())[:8]
    session = DrillSession(
        id=session_id,
        scenario_id=scenario_id,
        scenario_title=scenario.title,
        total_steps=len(steps),
        max_score=len(steps),
    )
    _DRILL_SESSIONS[session_id] = session

    # Return session + first step
    return {
        "session": session.dict(),
        "step": steps[0].dict() if steps else None,
    }


@router.get("/drills/{session_id}")
async def get_drill_session(session_id: str):
    """Get the current state of a drill session."""
    session = _DRILL_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Drill session not found")
    return session.dict()


@router.post("/drills/{session_id}/action")
async def submit_drill_action(session_id: str, chosen_option: str):
    """Submit an answer for the current drill step. Returns feedback and next step."""
    session = _DRILL_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Drill session not found")
    if session.completed:
        raise HTTPException(status_code=400, detail="Drill already completed")

    steps = _get_drill_steps(session.scenario_id)
    if session.current_step >= len(steps):
        raise HTTPException(status_code=400, detail="No more steps")

    current = steps[session.current_step]
    is_correct = chosen_option == current.correct_option
    if is_correct:
        session.score += 1

    session.actions.append({
        "step": session.current_step,
        "chosen": chosen_option,
        "correct": current.correct_option,
        "is_correct": is_correct,
        "timestamp": datetime.utcnow().isoformat(),
    })
    session.current_step += 1

    if session.current_step >= len(steps):
        session.completed = True

    next_step = steps[session.current_step].dict() if session.current_step < len(steps) else None

    return {
        "feedback": {
            "is_correct": is_correct,
            "correct_option": current.correct_option,
            "explanation": current.explanation,
        },
        "session": session.dict(),
        "next_step": next_step,
    }


@router.get("/drills/history/list")
async def get_drill_history(limit: int = 20):
    """Get completed drill sessions."""
    completed = [s.dict() for s in _DRILL_SESSIONS.values() if s.completed]
    return sorted(completed, key=lambda s: s["started_at"], reverse=True)[:limit]


## ──────────────────────────────────────────────
##  Sprint 3 — Knowledge Base & Enhanced RAG
## ──────────────────────────────────────────────

_KNOWLEDGE_ARTICLES: List[KnowledgeArticle] = [
    KnowledgeArticle(
        id="kb-001", title="Understanding the CIA Triad",
        category="fundamentals", difficulty="beginner", reading_minutes=4,
        summary="The three pillars of information security: Confidentiality, Integrity, and Availability.",
        tags=["cia-triad", "fundamentals", "security-principles"],
        content="""# The CIA Triad

The CIA Triad is the foundational model for information security, consisting of three core principles:

## Confidentiality
Ensuring that information is accessible only to those authorized to have access. Methods include:
- **Encryption** (AES-256, TLS)
- **Access control** (RBAC, ABAC)
- **Data classification** and handling procedures

## Integrity
Maintaining the accuracy and completeness of data. Techniques include:
- **Hashing** (SHA-256) for tamper detection
- **Digital signatures** for authenticity
- **Version control** and audit trails

## Availability
Ensuring authorized users have timely access to information. Strategies include:
- **Redundancy** and failover systems
- **DDoS protection**
- **Backup and disaster recovery** plans
- **SLA monitoring**

## Application to Security Decisions
When evaluating any security control or threat, ask:
1. Does it affect **confidentiality** of data?
2. Does it compromise **integrity** of systems or data?
3. Does it impact **availability** of services?
"""),
    KnowledgeArticle(
        id="kb-002", title="NIST Cybersecurity Framework 2.0 Overview",
        category="frameworks", difficulty="intermediate", reading_minutes=6,
        summary="The six core functions of NIST CSF 2.0: Govern, Identify, Protect, Detect, Respond, Recover.",
        tags=["nist", "csf", "framework", "governance"],
        content="""# NIST Cybersecurity Framework 2.0

NIST CSF 2.0 (released February 2024) organizes cybersecurity activities into **6 core functions**:

## 1. Govern (GV) — NEW in 2.0
Establishes the organization's cybersecurity risk management strategy, expectations, and policy.
- Risk appetite and tolerance
- Roles and responsibilities
- Supply chain risk management

## 2. Identify (ID)
Understand the organizational context, assets, and risks.
- Asset management
- Risk assessment
- Business environment understanding

## 3. Protect (PR)
Implement safeguards to ensure delivery of critical services.
- Access control and identity management
- Data security and encryption
- Security awareness training

## 4. Detect (DE)
Discover cybersecurity events in a timely manner.
- Continuous monitoring
- Anomaly detection
- Security event analysis

## 5. Respond (RS)
Take action regarding a detected cybersecurity event.
- Incident response planning
- Communications
- Analysis and mitigation

## 6. Recover (RC)
Restore capabilities impaired by a cybersecurity event.
- Recovery planning
- Improvements based on lessons learned
- Communications with stakeholders

## Key Improvement in 2.0
The addition of **Govern** as a top-level function emphasizes that cybersecurity is a board-level concern, not just a technical issue.
"""),
    KnowledgeArticle(
        id="kb-003", title="OWASP Top 10 (2021) Quick Reference",
        category="threats", difficulty="beginner", reading_minutes=5,
        summary="The ten most critical web application security risks according to OWASP.",
        tags=["owasp", "top-10", "web-security", "vulnerabilities"],
        content="""# OWASP Top 10 — 2021 Edition

## A01: Broken Access Control
94% of applications tested had some form of broken access control. Enforce least privilege and deny by default.

## A02: Cryptographic Failures
Previously "Sensitive Data Exposure." Focus on proper use of cryptography to protect data in transit and at rest.

## A03: Injection
SQL injection, NoSQL injection, OS command injection. Use parameterized queries and input validation.

## A04: Insecure Design
A new category focusing on design flaws vs implementation bugs. Use threat modeling and secure design patterns.

## A05: Security Misconfiguration
Missing security hardening, default credentials, overly permissive cloud configurations.

## A06: Vulnerable and Outdated Components
Using libraries/frameworks with known vulnerabilities. Maintain a software bill of materials (SBOM).

## A07: Identification and Authentication Failures
Weak authentication, credential stuffing, missing MFA.

## A08: Software and Data Integrity Failures
Insecure CI/CD pipelines, unsigned updates, deserialization vulnerabilities.

## A09: Security Logging and Monitoring Failures
Insufficient logging makes detection and forensics impossible.

## A10: Server-Side Request Forgery (SSRF)
Applications fetching remote resources without validating user-supplied URLs.
"""),
    KnowledgeArticle(
        id="kb-004", title="Zero Trust Architecture Principles",
        category="best_practices", difficulty="advanced", reading_minutes=7,
        summary="Core principles of Zero Trust: never trust, always verify, assume breach.",
        tags=["zero-trust", "architecture", "microsegmentation"],
        content="""# Zero Trust Architecture

## Core Principles
1. **Never trust, always verify** — Every access request is authenticated and authorized regardless of network location.
2. **Assume breach** — Design systems as if the perimeter has already been compromised.
3. **Least privilege access** — Grant minimum permissions needed for the task at hand.

## Key Components

### Identity-Centric Security
- Strong authentication (MFA, passwordless)
- Continuous identity verification
- Just-in-time and just-enough access (JIT/JEA)

### Microsegmentation
- Divide the network into small, isolated zones
- Apply policies per-segment, not just at the perimeter
- Limit lateral movement for attackers

### Device Trust
- Verify device health before granting access
- Endpoint detection and response (EDR)
- Mobile device management (MDM)

### Data-Centric Security
- Classify and label data
- Encrypt data at rest and in transit
- Apply access controls at the data layer

## Implementation Steps
1. Define the protect surface (critical data, assets, applications, services)
2. Map transaction flows
3. Build Zero Trust architecture around the protect surface
4. Create Zero Trust policies
5. Monitor and maintain

## Common Pitfall
Zero Trust is a **strategy**, not a product. No single vendor solution delivers "complete" Zero Trust.
"""),
    KnowledgeArticle(
        id="kb-005", title="Incident Response Lifecycle",
        category="incident_response", difficulty="intermediate", reading_minutes=5,
        summary="The NIST incident response lifecycle: Preparation, Detection, Containment, Eradication, Recovery, Lessons Learned.",
        tags=["incident-response", "nist", "playbooks", "forensics"],
        content="""# Incident Response Lifecycle (NIST SP 800-61)

## 1. Preparation
- Establish IR team and communication channels
- Develop and maintain IR playbooks
- Deploy monitoring and detection tools
- Conduct regular training and tabletop exercises

## 2. Detection & Analysis
- Monitor alerts from SIEM, EDR, IDS/IPS
- Validate and triage alerts (true positive vs false positive)
- Determine scope and severity
- Document initial findings with timestamps

## 3. Containment
**Short-term**: Isolate affected systems to stop the spread.
**Long-term**: Apply temporary fixes while maintaining evidence.
- Network segmentation
- Account disabling
- Firewall rules

## 4. Eradication
- Remove the root cause (malware, compromised accounts, vulnerabilities)
- Patch exploited vulnerabilities
- Verify no persistence mechanisms remain

## 5. Recovery
- Restore systems from clean backups
- Gradually return to production
- Monitor closely for re-infection
- Validate system integrity

## 6. Post-Incident Activity (Lessons Learned)
- Conduct blameless post-mortem within 1-2 weeks
- Document timeline, actions taken, and outcomes
- Update playbooks and controls
- Share relevant findings (anonymized) with the community
"""),
    KnowledgeArticle(
        id="kb-006", title="Secure Development Lifecycle (SDL)",
        category="best_practices", difficulty="intermediate", reading_minutes=5,
        summary="Integrating security into every phase of the software development lifecycle.",
        tags=["sdl", "devsecops", "secure-coding", "shift-left"],
        content="""# Secure Development Lifecycle

## Shift-Left Security
Integrate security early in development — fixing vulnerabilities in design costs 100x less than in production.

## SDL Phases

### 1. Requirements
- Define security requirements alongside functional requirements
- Classify data sensitivity
- Identify compliance obligations (GDPR, PCI-DSS, etc.)

### 2. Design
- Threat modeling (STRIDE, PASTA)
- Secure architecture patterns
- Attack surface analysis

### 3. Implementation
- Secure coding standards (OWASP Secure Coding Practices)
- IDE security plugins (linters, SAST)
- Peer code review with security checklist

### 4. Verification
- Static Application Security Testing (SAST)
- Dynamic Application Security Testing (DAST)
- Software Composition Analysis (SCA) for dependencies
- Penetration testing

### 5. Release
- Security sign-off gate
- Vulnerability disclosure policy
- Incident response plan ready

### 6. Operations
- Runtime Application Self-Protection (RASP)
- Continuous monitoring and alerting
- Regular patching and updates

## Key Metrics
- Mean time to remediate vulnerabilities
- Percentage of releases passing security gates
- Number of vulnerabilities found per phase
"""),
    KnowledgeArticle(
        id="kb-007", title="Understanding GDPR for Security Teams",
        category="compliance", difficulty="intermediate", reading_minutes=6,
        summary="Key GDPR requirements that security teams must understand: data protection, breach notification, rights.",
        tags=["gdpr", "compliance", "data-protection", "privacy"],
        content="""# GDPR for Security Teams

## Key Principles
- **Lawfulness, fairness, transparency** — Process data legally with clear purposes
- **Purpose limitation** — Collect data only for specified purposes
- **Data minimization** — Collect only what is necessary
- **Accuracy** — Keep data correct and up to date
- **Storage limitation** — Don't keep data longer than needed
- **Integrity and confidentiality** — Protect data with appropriate security

## Security-Relevant Requirements

### Article 32: Security of Processing
Implement appropriate technical and organizational measures:
- Encryption of personal data
- Ability to ensure ongoing confidentiality, integrity, availability
- Ability to restore access to data after an incident
- Regular testing of security measures

### Article 33: Breach Notification to Authority
- Notify the supervisory authority within **72 hours** of becoming aware
- Include: nature of breach, categories of data, approximate number affected, likely consequences, measures taken

### Article 34: Communication to Data Subjects
Required when the breach is **likely to result in a high risk** to individuals' rights and freedoms.

### Article 35: Data Protection Impact Assessment (DPIA)
Required for processing that is likely to result in high risk. Must include:
- Systematic description of processing
- Assessment of necessity and proportionality
- Assessment of risks to individuals
- Measures to address risks

## Penalties
- Up to **€20 million** or **4% of global annual turnover** (whichever is higher)
- Supervisory authorities have broad enforcement powers
"""),
    KnowledgeArticle(
        id="kb-008", title="Supply Chain Security Best Practices",
        category="threats", difficulty="advanced", reading_minutes=5,
        summary="Protecting your software supply chain from dependency attacks, compromised packages, and vendor risks.",
        tags=["supply-chain", "dependencies", "sbom", "vendor-risk"],
        content="""# Software Supply Chain Security

## The Threat Landscape
Supply chain attacks target the trust relationships between organizations and their suppliers/dependencies:
- **SolarWinds** (2020): Compromised build system injected backdoor into updates
- **Log4Shell** (2021): Critical vulnerability in ubiquitous logging library
- **Codecov** (2021): Compromised CI/CD tool exfiltrated secrets
- **ua-parser-js** (2021): Popular NPM package hijacked with crypto-miner

## Protection Strategies

### Dependency Management
1. **Pin exact versions** in lockfiles (package-lock.json, Pipfile.lock)
2. **Run automated audits**: `npm audit`, `pip-audit`, Snyk, Dependabot
3. **Maintain a Software Bill of Materials (SBOM)**
4. **Evaluate before adopting**: popularity, maintainers, security history

### Build Pipeline Security
1. **Reproducible builds** — same source should produce identical artifacts
2. **Sign artifacts** — verify integrity of build outputs
3. **Isolated build environments** — limit what build scripts can access
4. **Review CI/CD configurations** as code (not just application code)

### Vendor Risk Management
1. **Assess vendor security posture** before onboarding
2. **Contractual security requirements** (SLAs, breach notification)
3. **Regular vendor reviews** and questionnaires
4. **Limit vendor access** to minimum necessary (least privilege)

### Detection
- Monitor for unexpected dependency changes
- Alert on new maintainers of critical packages
- Use tools like Socket.dev for behavior analysis of packages
"""),
]


@router.get("/knowledge/articles", response_model=List[KnowledgeArticle])
async def list_knowledge_articles(category: Optional[str] = None, difficulty: Optional[str] = None, search: Optional[str] = None):
    """List knowledge base articles with optional filters."""
    articles = _KNOWLEDGE_ARTICLES
    if category:
        articles = [a for a in articles if a.category == category]
    if difficulty:
        articles = [a for a in articles if a.difficulty == difficulty]
    if search:
        q = search.lower()
        articles = [a for a in articles if q in a.title.lower() or q in a.summary.lower() or any(q in t for t in a.tags)]
    return articles


@router.get("/knowledge/articles/{article_id}", response_model=KnowledgeArticle)
async def get_knowledge_article(article_id: str):
    """Get a specific knowledge base article."""
    article = next((a for a in _KNOWLEDGE_ARTICLES if a.id == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail=f"Article '{article_id}' not found")
    return article


@router.get("/knowledge/categories")
async def get_knowledge_categories():
    """Get available knowledge base categories with article counts."""
    cats: Dict[str, int] = {}
    for a in _KNOWLEDGE_ARTICLES:
        cats[a.category] = cats.get(a.category, 0) + 1
    return [{"category": k, "count": v} for k, v in sorted(cats.items())]


@router.get("/health")
async def health_check():
    """Health check endpoint for cybersecurity module"""
    return {
        "status": "healthy",
        "module": "cybersecurity",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.1.0"
    }
