export type Turn = { 
  role: 'user'|'assistant'|'tool', 
  content?: string, 
  tool_call?: any, 
  tool_result?: any, 
  ts?: string 
};

export type Runner = 'n8n';

export class AgentOpsClient {
  constructor(private base = '/api/gateway') {}

  async chat(runId: string, payload: any, meta: any = {}) {
    await this._checkpoint(runId, { 
      role:'user', 
      content: payload.userPrompt, 
      ts:new Date().toISOString() 
    }, meta);
    
    const r = await fetch(`${this.base}/chat`, {
      method:'POST', 
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ run_id: runId, payload, meta })
    });
    
    const data = await r.json();
    
    await this._checkpoint(runId, { 
      role:'assistant', 
      content: data.output, 
      ts:new Date().toISOString() 
    }, meta);
    
    return data;
  }

  async triggerFlow(runId: string, runner: Runner, flowId: string, inputs: any, meta: any = {}) {
    await this._checkpoint(runId, { 
      role:'tool', 
      tool_call:{runner, flowId, inputs}, 
      ts:new Date().toISOString() 
    }, meta);
    
    const r = await fetch(`${this.base}/flow/trigger`, {
      method:'POST', 
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ run_id: runId, runner, flow_id: flowId, inputs, meta })
    });
    
    const data = await r.json();
    
    await this._checkpoint(runId, { 
      role:'tool', 
      tool_result: data, 
      ts:new Date().toISOString() 
    }, meta);
    
    return data;
  }

  private async _checkpoint(runId: string, turn: Turn, meta:any) {
    try {
      await fetch(`${this.base}/checkpoint`, {
        method:'POST', 
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ run_id: runId, turn, meta })
      });
    } catch (error) {
      console.warn('Checkpoint failed:', error);
    }
  }
}

export const agentOpsClient = new AgentOpsClient();
