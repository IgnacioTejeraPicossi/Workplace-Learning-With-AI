from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import httpx, os, time, hmac, hashlib, json

router = APIRouter(prefix="/api/productivity", tags=["productivity"])

OUTSYSTEMS_ENDPOINT = os.getenv("OUTSYSTEMS_PRODUCTIVITY_URL")
HMAC_SECRET = os.getenv("AGENTOPS_HMAC_SECRET", "change-me")

def sign(b: bytes) -> str:
    import hashlib, hmac
    return hmac.new(HMAC_SECRET.encode(), b, hashlib.sha256).hexdigest()

class NextAction(BaseModel):
    title: str
    detail: Optional[str] = ""
    assignee: Optional[str] = None

class ProductivitySpec(BaseModel):
    brief_title: str
    primary_url: Optional[str] = None
    summary_md: str
    next_actions: List[NextAction] = []
    actions: List[Dict[str, Any]]  # same shape as in compliance
    metadata: Dict[str, Any] = {}

class UrlAnalysisRequest(BaseModel):
    url: str
    analysis_type: str = "productivity"  # productivity, research, competitive

class UrlAnalysisResponse(BaseModel):
    success: bool
    summary: str
    next_actions: List[NextAction]
    url: str
    analysis_type: str
    error: Optional[str] = None

@router.post("/analyze-url", response_model=UrlAnalysisResponse)
async def analyze_url(request: UrlAnalysisRequest, http_request: Request):
    """Analyze a URL and extract productivity insights and actionable tasks"""
    try:
        # Use the unified AI system to analyze the URL
        from backend.llm import ask_ai_unified_sync
        
        # Create a comprehensive prompt for productivity analysis
        prompt = f"""
        Analyze the following URL for productivity insights and create actionable team tasks:
        URL: {request.url}
        
        Please provide:
        1. A comprehensive summary of the content
        2. Top 5 actionable next steps that a team can implement
        
        Format your response as:
        SUMMARY: [Your summary here]
        
        ACTIONS:
        1. [First actionable step]
        2. [Second actionable step]
        3. [Third actionable step]
        4. [Fourth actionable step]
        5. [Fifth actionable step]
        """
        
        # Get AI analysis using the unified system
        analysis_result = ask_ai_unified_sync(
            prompt=prompt,
            task_type="analysis",
            complexity="high",
            max_tokens=1000,
            request_headers=http_request.headers
        )
        
        # Parse the response
        summary = ""
        next_actions = []
        
        if analysis_result:
            # Extract summary
            summary_match = analysis_result.split("ACTIONS:")[0].replace("SUMMARY:", "").strip()
            summary = summary_match if summary_match else f"Analysis of {request.url}: This content provides valuable insights for team productivity and strategic planning."
            
            # Extract actions
            actions_section = analysis_result.split("ACTIONS:")[1] if "ACTIONS:" in analysis_result else ""
            if actions_section:
                action_lines = [line.strip() for line in actions_section.split('\n') if line.strip() and line.strip()[0].isdigit()]
                next_actions = [
                    NextAction(
                        title=action.split('.', 1)[1].strip() if '.' in action else action,
                        detail=f"Action extracted from {request.url} analysis",
                        assignee=None
                    )
                    for action in action_lines[:5]
                ]
        
        # Fallback if no actions extracted
        if not next_actions:
            next_actions = [
                NextAction(title="Review and prioritize findings", detail="Analyze the key insights from the research", assignee=None),
                NextAction(title="Create action plan", detail="Develop a structured plan based on findings", assignee=None),
                NextAction(title="Assign team members", detail="Distribute tasks to appropriate team members", assignee=None),
                NextAction(title="Set deadlines", detail="Establish realistic timelines for each action", assignee=None),
                NextAction(title="Track progress", detail="Monitor implementation and adjust as needed", assignee=None)
            ]
        
        return UrlAnalysisResponse(
            success=True,
            summary=summary,
            next_actions=next_actions,
            url=request.url,
            analysis_type=request.analysis_type
        )
        
    except Exception as e:
        print(f"❌ Error analyzing URL {request.url}: {e}")
        return UrlAnalysisResponse(
            success=False,
            summary=f"Error analyzing {request.url}",
            next_actions=[],
            url=request.url,
            analysis_type=request.analysis_type,
            error=str(e)
        )

@router.post("/dispatch")
async def dispatch(spec: ProductivitySpec):
    if not OUTSYSTEMS_ENDPOINT:
        raise HTTPException(500, "OUTSYSTEMS_PRODUCTIVITY_URL not configured")

    run_id = f"prod-{int(time.time())}"
    
    # Create initial run record in database
    from backend.models.agent_runs import AgentRun, save_run
    initial_run = AgentRun(
        run_id=run_id,
        module="productivity",
        topic=f"[Productivity] {spec.brief_title}",
        status="RUNNING"
    )
    await save_run(initial_run)
    
    bundle = {
        "run_id": run_id,
        "topic": f"[Productivity] {spec.brief_title}",
        "summary_md": spec.summary_md,
        "next_actions": [na.dict() for na in spec.next_actions],
        "primary_url": spec.primary_url,
        "actions": spec.actions,
        "callback_url": os.getenv("OUTSYSTEMS_CALLBACK_URL", "http://localhost:8000/api/agent-runs/callback")
    }
    body = json.dumps(bundle).encode()
    headers = {"X-Signature": sign(body), "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(OUTSYSTEMS_ENDPOINT, content=body, headers=headers)
    if r.status_code >= 300:
        # Update status to FAILED if OutSystems call fails
        from backend.models.agent_runs import update_run
        await update_run(run_id, status="FAILED", error=f"OutSystems error: {r.text}")
        raise HTTPException(r.status_code, f"OutSystems error: {r.text}")
    return {"ok": True, "run_id": run_id}
