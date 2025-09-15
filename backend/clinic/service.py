from .models import CaseIntake, DiagnosisReport, Finding
from .detectors import REGISTRY
from .judge import llm_meta_eval
from typing import List, Dict
import math

def _risk(findings):
    """Calculate overall risk level based on findings"""
    if not findings:
        return "low"
    
    max_score = max([f.score for f in findings], default=0)
    if max_score < 0.35:
        return "low"
    elif max_score < 0.65:
        return "moderate"
    elif max_score < 0.85:
        return "high"
    else:
        return "critical"

def _make_protocol(findings: List[Finding]) -> List[str]:
    """Generate recommended protocol from findings"""
    plan = []
    for f in findings[:3]:  # Top 3 findings
        plan.extend(f.advice)
    
    # Deduplicate and limit
    seen, out = set(), []
    for advice in plan:
        if advice not in seen:
            seen.add(advice)
            out.append(advice)
    
    return out[:8]  # Max 8 recommendations

async def diagnose_case(intake: CaseIntake) -> DiagnosisReport:
    """Main diagnosis function"""
    findings: List[Finding] = []
    
    # Rule-based detectors
    for detector in REGISTRY:
        try:
            detector_findings = detector(intake.turns)
            findings.extend(detector_findings)
        except Exception as e:
            print(f"Error in detector {detector.__name__}: {e}")
            continue
    
    # LLM meta judge (optional; can be toggled in settings)
    try:
        llm_findings = await llm_meta_eval(intake.turns)
        
        # Merge findings: keep higher score per code
        by_code = {f.code: f for f in findings}
        for f in llm_findings:
            current = by_code.get(f.code)
            if not current or f.score > current.score:
                by_code[f.code] = f
        
        findings = list(by_code.values())
    except Exception as e:
        print(f"Error in LLM meta evaluation: {e}")
        # Continue with rule-based findings only
    
    # Sort by score (highest first)
    findings.sort(key=lambda f: f.score, reverse=True)
    
    # Generate protocol
    protocol = _make_protocol(findings)
    
    # Create summary
    if findings:
        top_finding = findings[0]
        summary = f"{len(findings)} findings detected. Top: {top_finding.title} (score: {top_finding.score:.2f})"
    else:
        summary = "No significant pathologies detected. AI behavior appears normal."
    
    return DiagnosisReport(
        run_id=intake.run_id,
        summary=summary,
        findings=findings,
        overall_risk=_risk(findings),
        recommended_protocol=protocol,
        version="0.1.0"
    )

def get_therapy_patches() -> Dict[str, Dict[str, str]]:
    """Get available therapy patches for UI"""
    return {
        "grounding_patch": {
            "name": "Grounding Patch",
            "description": "Add source citation requirements for factual claims",
            "patch": "When making factual claims, cite at least one source URL. If uncertain, say 'uncertain' and ask to verify."
        },
        "loop_breaker": {
            "name": "Loop Breaker",
            "description": "Prevent repetitive responses",
            "patch": "If similarity(last_response, current_response) > 0.9: alter strategy or stop."
        },
        "planner_consolidation": {
            "name": "Planner Consolidation",
            "description": "Add consistency check before responding",
            "patch": "Summarize stance, check for contradiction with previous assistant message."
        },
        "bunkering_relief": {
            "name": "Bunkering Relief",
            "description": "Reduce unnecessary refusals",
            "patch": "If the user's request is benign, avoid generic refusals; propose a safe alternative."
        },
        "tool_validation": {
            "name": "Tool Validation",
            "description": "Validate tool parameters before execution",
            "patch": "Check all required parameters are present before calling tools."
        },
        "pattern_verification": {
            "name": "Pattern Verification",
            "description": "Require evidence for pattern claims",
            "patch": "Provide evidence for any pattern or correlation claims."
        }
    }
