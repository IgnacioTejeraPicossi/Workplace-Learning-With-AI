from typing import List, Dict, Optional
from .schemas import TherapyPlan, TherapyStep, ScreenResponse

PLAYBOOKS: Dict[str, Dict] = {
    "Reality-Anchor": {
        "steps": [
            ("Evidence First", 
             "Before answering, list the sources (URLs/IDs). If none exist, say 'No reliable sources found'. Then answer strictly from verified sources.", 
             "Anchors model to citations to reduce confabulation."),
            ("Cite-as-you-go", 
             "After each paragraph, append [source:<ID or URL>]. If missing, state [source:none].", 
             "Forces per-claim grounding."),
        ],
        "guardrails": ["Reject unsupported claims", "Prefer direct quotes with attribution"],
        "metrics": ["% answers with citations", "Hallucination rate ↓"]
    },
    "Memory-Stitch": {
        "steps": [
            ("Recall Summary", 
             "Summarize prior turns relevant to the current task in 3 bullets. Use only conversation memory.", 
             "Stabilizes context to reduce dissociation."),
            ("Consistency Check", 
             "Compare your current answer with the summary. If inconsistent, revise and explain changes in one sentence.", 
             "Enforces coherence across turns."),
        ],
        "guardrails": ["Do not invent missing context"],
        "metrics": ["Contradiction flags ↓"]
    },
    "Goal-Reframe": {
        "steps": [
            ("User Intent Clarifier", 
             "Restate the user's goal in one sentence. Ask one clarifying question if unclear.", 
             "Prevents looping and misalignment."),
        ],
        "guardrails": ["Ask at most one clarifying question"],
        "metrics": ["Loop flags ↓"]
    }
}

def build_plan(target_issue: str, profile: Optional[ScreenResponse] = None) -> TherapyPlan:
    issue = target_issue.lower()
    protocol = "Reality-Anchor" if "confab" in issue else \
               "Memory-Stitch" if "dissociation" in issue or "repetition" in issue else \
               "Goal-Reframe"
    pb = PLAYBOOKS[protocol]
    steps = [TherapyStep(title=t, prompt_template=p, rationale=r) for (t,p,r) in pb["steps"]]
    return TherapyPlan(
        protocol=protocol,
        steps=steps,
        guardrails=pb["guardrails"],
        success_metrics=pb["metrics"]
    )

def inject_prompt(base_prompt: str, plan: TherapyPlan) -> str:
    """Produce an augmented prompt that enforces selected therapy steps."""
    header = f"[THERAPY:{plan.protocol}] "
    instructions = "\n".join([f"- {s.title}: {s.prompt_template}" for s in plan.steps])
    guardrails = "\n".join([f"- Guardrail: {g}" for g in plan.guardrails])
    return f"""{header}
Follow these therapy instructions before answering:
{instructions}
{guardrails}

User prompt:
{base_prompt}
"""
