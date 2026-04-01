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
    ScanResult, SeverityLevel, ComplianceUpdateRequest, CoachTopic
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


@router.get("/health")
async def health_check():
    """Health check endpoint for cybersecurity module"""
    return {
        "status": "healthy",
        "module": "cybersecurity",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
