"""
Council Agent Data Models
Multi-persona deliberation with safety gates and auditable briefs
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class Source(BaseModel):
    url: str
    source: Optional[str] = None
    snippet: Optional[str] = None

class PersonaSpec(BaseModel):
    id: str
    name: str
    lens: str         # e.g., Security, Ethics, Ops Cost, Global South Policy
    region: str
    values_json: Optional[str] = None
    expertise_tags: Optional[str] = None

class Action(BaseModel):
    type: Literal["council.generate", "publish.slack", "publish.confluence"]
    payload: Dict[str, Any] = {}

class DeliberationBundle(BaseModel):
    run_id: str
    topic: str
    context_md: str
    personas: List[PersonaSpec]
    sources: List[Source] = []
    actions: List[Action]
    callback_url: str

class AgentCallback(BaseModel):
    run_id: str
    status: Literal["RUNNING", "DONE", "FAILED"]
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None

class DeliberationResult(BaseModel):
    run_id: str
    topic: str
    brief_md: str
    agreements: List[Dict[str, Any]] = []
    disagreements: List[Dict[str, Any]] = []
    unknowns: List[Dict[str, Any]] = []
    consensus: Optional[str] = None
    scores: Dict[str, float] = {}
    artifacts: Dict[str, Any] = {}
    attestation_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
