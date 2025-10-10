"""
Council Agent Router
Multi-persona deliberation with safety gates and auditable briefs
"""

from fastapi import APIRouter, Header, HTTPException
from backend.models.council import DeliberationBundle, AgentCallback
from backend.security.hmac import verify, sign
from backend.store.runs import create_start, finish_success, finish_error
from backend.attestation.hash import compute_attestation
from backend.integrations import council_slack as slack, council_confluence as conf
from backend.store import council as council_store
import httpx
import uuid
import os

router = APIRouter(prefix="/agents/council", tags=["council"])

# Safety and scoring helpers
def clamp01(x: float) -> float:
    """Clamp value between 0 and 1"""
    return max(0.0, min(1.0, x))

def compute_argument_quality(evidence_count: int, avg_source_authority: float, contradictions: float) -> float:
    """Compute argument quality score"""
    evidence_score = clamp01(evidence_count / 5.0)  # Normalize to 5 sources max
    authority_score = avg_source_authority
    contradiction_penalty = clamp01(contradictions)
    return clamp01(0.4 * evidence_score + 0.4 * authority_score - 0.2 * contradiction_penalty)

def compute_diversity_weight(ideology_dist: float, region_dist: float, discipline_dist: float) -> float:
    """Compute diversity weight score"""
    return clamp01(0.4 * ideology_dist + 0.3 * region_dist + 0.3 * discipline_dist)

def compute_harm_risk(toxicity: float, pii: float, incitement: float, policy: float) -> float:
    """Compute harm risk score"""
    return clamp01(0.3 * toxicity + 0.3 * pii + 0.2 * incitement + 0.2 * policy)

def compute_persona_score(relevance: float, quality: float, diversity: float, harm: float) -> float:
    """Compute final persona score with harm gating"""
    harm_gate = float(os.getenv("HARM_GATE", "0.35"))
    if harm > harm_gate:
        return 0.0
    return clamp01(0.40 * relevance + 0.30 * quality + 0.30 * diversity)

@router.get("/stats")
async def get_stats():
    """Get Council agent statistics"""
    return {
        "totalDeliberations": 0,
        "personasUsed": 0,
        "briefsPublished": 0,
        "challengesRequested": 0,
        "avgDiversityScore": 0.0
    }

@router.get("/personas")
async def get_personas():
    """Get available personas"""
    return [
        {
            "id": "p1",
            "name": "CISO Zero-Trust",
            "lens": "Security",
            "region": "Nordics",
            "expertise_tags": "authn,iam,zero-trust",
            "values_json": '{"security_first": true, "user_experience": 0.7}'
        },
        {
            "id": "p2", 
            "name": "Consumer Rights Advocate",
            "lens": "Ethics",
            "region": "EU",
            "expertise_tags": "gdpr,ux,privacy",
            "values_json": '{"privacy_first": true, "accessibility": 0.9}'
        },
        {
            "id": "p3",
            "name": "Ops Cost Controller",
            "lens": "Finance", 
            "region": "Global",
            "expertise_tags": "tco,ops,efficiency",
            "values_json": '{"cost_efficiency": true, "roi_focus": 0.95}'
        },
        {
            "id": "p4",
            "name": "Global South Policy",
            "lens": "Policy",
            "region": "APAC",
            "expertise_tags": "regulation,access,equity",
            "values_json": '{"equity_first": true, "accessibility": 0.9}'
        }
    ]

@router.post("/execute")
async def execute(bundle: DeliberationBundle, x_signature: str = Header(...)):
    """Execute Council deliberation with HMAC verification"""
    if not verify(bundle.dict(), x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        # Create run record
        run = await create_start(bundle.run_id, module="council", bundle=bundle.dict())
        
        # Step A: Normalize sources and compute authority scores
        source_authorities = []
        for source in bundle.sources:
            # Simple authority scoring based on domain
            if "w3.org" in source.url or "ietf.org" in source.url:
                authority = 0.9
            elif "github.com" in source.url or "stackoverflow.com" in source.url:
                authority = 0.7
            elif source.url.startswith("internal://"):
                authority = 0.8
            else:
                authority = 0.5
            source_authorities.append(authority)
        
        avg_source_authority = sum(source_authorities) / len(source_authorities) if source_authorities else 0.5
        
        # Step B: Generate persona arguments (placeholder synthesis)
        persona_arguments = []
        agreements = []
        disagreements = []
        unknowns = []
        
        for persona in bundle.personas:
            # Generate steelman argument for each persona
            if persona.lens == "Security":
                argument = f"As {persona.name}, I prioritize security above all. {bundle.topic} must be evaluated through a zero-trust lens. The current approach may introduce vulnerabilities that could compromise our entire infrastructure."
                confidence = 0.8
            elif persona.lens == "Ethics":
                argument = f"From an ethical standpoint, {bundle.topic} raises important questions about user privacy and accessibility. We must ensure equitable access and protect user rights throughout implementation."
                confidence = 0.7
            elif persona.lens == "Finance":
                argument = f"Financially, {bundle.topic} represents a significant investment. We need to carefully evaluate ROI, operational costs, and potential savings. The business case must be compelling."
                confidence = 0.9
            elif persona.lens == "Policy":
                argument = f"From a policy perspective, {bundle.topic} must align with regulatory requirements and consider global implications. Different regions may have varying compliance needs."
                confidence = 0.6
            else:
                argument = f"As {persona.name}, I bring a {persona.lens} perspective to {bundle.topic}. This requires careful consideration of all stakeholders."
                confidence = 0.5
            
            # Compute scores
            relevance = clamp01(0.8)  # Placeholder
            quality = compute_argument_quality(len(bundle.sources), avg_source_authority, 0.2)
            diversity = compute_diversity_weight(0.7, 0.6, 0.8)  # Placeholder
            harm = compute_harm_risk(0.1, 0.2, 0.05, 0.1)  # Placeholder
            
            persona_score = compute_persona_score(relevance, quality, diversity, harm)
            
            persona_arguments.append({
                "persona_id": persona.id,
                "persona_name": persona.name,
                "lens": persona.lens,
                "region": persona.region,
                "argument": argument,
                "confidence": confidence,
                "scores": {
                    "relevance": relevance,
                    "quality": quality,
                    "diversity": diversity,
                    "harm": harm,
                    "final": persona_score
                },
                "citations": [{"url": s.url, "title": s.source or s.url} for s in bundle.sources[:2]]  # Use source or url as title
            })
        
        # Step C: Identify agreements, disagreements, unknowns
        agreements.append({
            "statement": "All personas agree that security considerations are paramount",
            "supporting_personas": [p["persona_id"] for p in persona_arguments],
            "confidence": 0.8
        })
        
        disagreements.append({
            "statement": "Trade-offs between security and user experience",
            "conflicting_personas": ["p1", "p2"],  # Security vs Ethics
            "confidence": 0.7
        })
        
        unknowns.append({
            "statement": "Long-term operational impact and scalability",
            "uncertainty_level": 0.6
        })
        
        # Step D: Generate consensus brief
        consensus = f"""## Council Brief: {bundle.topic}

### Context
{bundle.context_md}

### Key Findings
- **Agreements**: {len(agreements)} areas of consensus identified
- **Disagreements**: {len(disagreements)} areas requiring further discussion  
- **Unknowns**: {len(unknowns)} areas needing additional research

### Persona Perspectives
{chr(10).join([f"- **{p['persona_name']}** ({p['lens']}): {p['argument'][:100]}..." for p in persona_arguments])}

### Recommendations
1. Address security concerns while maintaining user experience
2. Conduct cost-benefit analysis with detailed ROI projections
3. Ensure compliance with regional regulations
4. Plan for phased implementation to manage risks

### Next Steps
- Schedule follow-up deliberation on identified disagreements
- Research unknowns through additional sources
- Develop implementation roadmap with stakeholder input
"""
        
        # Step E: Execute publishing actions
        artifacts = {
            "brief_md": consensus,
            "persona_arguments": persona_arguments,
            "agreements": agreements,
            "disagreements": disagreements,
            "unknowns": unknowns,
            "scores": {
                "avg_diversity": sum([p["scores"]["diversity"] for p in persona_arguments]) / len(persona_arguments),
                "avg_harm": sum([p["scores"]["harm"] for p in persona_arguments]) / len(persona_arguments),
                "consensus_strength": 0.7
            }
        }
        
        for action in bundle.actions:
            if action.type == "publish.slack":
                artifacts["slack"] = await slack.publish({
                    **action.payload,
                    "text": consensus[:3500]  # Slack message limit
                })
            elif action.type == "publish.confluence":
                artifacts["confluence"] = await conf.publish({
                    **action.payload,
                    "body_storage": f"<pre>{consensus}</pre>"
                })
            elif action.type == "council.generate":
                # Already generated consensus above
                pass
        
        # Compute attestation and finish run
        attestation_hash = compute_attestation(bundle.dict(), artifacts)
        await finish_success(run["_id"], artifacts, attestation_hash)
        
        # Save deliberation to council store
        await council_store.save_deliberation({
            "run_id": bundle.run_id,
            "topic": bundle.topic,
            "brief_md": consensus,
            "persona_arguments": persona_arguments,
            "agreements": agreements,
            "disagreements": disagreements,
            "unknowns": unknowns,
            "artifacts": artifacts,
            "attestation_hash": attestation_hash
        })
        
        return {
            "ok": True,
            "run_id": bundle.run_id,
            "artifacts": artifacts,
            "attestation_hash": attestation_hash
        }
        
    except Exception as e:
        await finish_error(run["_id"], str(e))
        raise HTTPException(status_code=500, detail=f"Deliberation failed: {str(e)}")

@router.post("/callback")
async def callback(callback_data: AgentCallback):
    """Handle callback from external systems"""
    # Update run status based on callback
    if callback_data.status == "DONE":
        await finish_success(callback_data.run_id, callback_data.artifacts)
    elif callback_data.status == "FAILED":
        await finish_error(callback_data.run_id, callback_data.error or "Unknown error")
    
    return {"status": "success", "message": "Callback processed"}

@router.get("/runs")
async def get_council_runs(limit: int = 100):
    """Get Council agent runs"""
    from backend.store.runs import get_runs_by_module
    return await get_runs_by_module("council", limit)

@router.get("/health")
async def health_check():
    """Health check for Council agent"""
    return {"status": "healthy", "agent": "council", "version": "1.0.0"}

@router.post("/test")
async def test_council():
    """Test Council agent with sample data"""
    run_id = f"council-test-{uuid.uuid4().hex[:8]}"
    bundle = {
        "run_id": run_id,
        "topic": "Adopt passkeys company-wide in 2026?",
        "context_md": "EU bank, mobile-first, legacy SSO in place.",
        "personas": [
            {"id": "p1", "name": "CISO Zero-Trust", "lens": "Security", "region": "Nordics", "expertise_tags": "authn,iam"},
            {"id": "p2", "name": "Consumer Rights", "lens": "Ethics", "region": "EU", "expertise_tags": "gdpr,ux"},
            {"id": "p3", "name": "Ops Cost", "lens": "Finance", "region": "Global", "expertise_tags": "tco,ops"},
            {"id": "p4", "name": "Global South Policy", "lens": "Policy", "region": "APAC", "expertise_tags": "regulation,access"}
        ],
        "sources": [
            {"url": "https://www.w3.org/TR/webauthn/", "source": "W3C", "snippet": "Passkeys overview"},
            {"url": "internal://policy/authn2024", "source": "Company", "snippet": "Current SSO posture"}
        ],
        "actions": [
            {"type": "council.generate", "payload": {}},
            {"type": "publish.slack", "payload": {"channel": "#council-briefs"}}
        ],
        "callback_url": "/api/agent-runs/callback"
    }
    
    signature = sign(bundle)
    return await execute(DeliberationBundle(**bundle), signature)
