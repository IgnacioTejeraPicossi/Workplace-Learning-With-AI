from pydantic import BaseModel
from typing import Any, Dict, Optional

class Checkpoint(BaseModel):
    run_id: str
    turn: Dict[str, Any]
    meta: Dict[str, Any] = {}

class ChatReq(BaseModel):
    run_id: str
    payload: Dict[str, Any]
    meta: Dict[str, Any] = {}

class FlowReq(BaseModel):
    run_id: str
    runner: str   # 'n8n'|'outsystems'|'temporal'|'lmstudio'
    flow_id: str
    inputs: Dict[str, Any]
    meta: Dict[str, Any] = {}
