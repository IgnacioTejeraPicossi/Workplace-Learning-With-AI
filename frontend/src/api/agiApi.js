import { fetchWithAuth } from '../api';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export async function fetchAGIProgress() {
  const res = await fetch(`${API_BASE}/api/agi/progress`);
  if (!res.ok) throw new Error('Failed to load AGI progress');
  return res.json();
}

// --- AI Enrichment (non-destructive suggestions via web + LLM) -------------
//
// Each function posts the CURRENT panel data to the backend which:
//   1. Queries websearch-backend (port 8080) → DuckDuckGo fallback → none
//   2. Calls ask_ai_unified with the current data + fresh web context
//   3. Returns { source, suggestions[], raw? }
//
// Uses fetchWithAuth so the backend receives the selected API provider
// (ItemAI / OpenAI / OpenRouter) + keys from localStorage via the standard
// x-api-provider / x-*-key headers.

async function _postEnrich(path, body) {
  const res = await fetchWithAuth(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data.detail || '';
    } catch (_) { /* ignore parse errors */ }
    throw new Error(detail || `AI enrichment failed (${res.status})`);
  }
  return res.json();
}

export function enrichTracker(currentModels) {
  return _postEnrich('/api/agi/ai-enrich/tracker', { current_models: currentModels });
}

export function enrichEndings(endings, pdoomEstimates) {
  return _postEnrich('/api/agi/ai-enrich/endings', {
    endings,
    pdoom_estimates: pdoomEstimates,
  });
}

export function enrichBenefits(benefits) {
  return _postEnrich('/api/agi/ai-enrich/benefits', { benefits });
}

// --- Homo Sapiens vs. KI i Test (workshop challenges) ----------------------
// Task must be one of the 10 active tasks (matching the Activity Matrix rows):
// 'scenarios' | 'risk' | 'ambiguities' | 'exploratory' | 'followups' |
// 'automation' | 'testData' | 'oracle' | 'triage' | 'accessibility'
// (legacy 'tests_from_code' is still accepted by the backend for backward compat)
export async function runTestingChallenge({ task, input, language, previousAiOutput, feedback }) {
  const body = { task, input, language };
  if (previousAiOutput != null && String(previousAiOutput).trim()) {
    body.previous_ai_output = String(previousAiOutput).trim();
  }
  if (feedback != null && String(feedback).trim()) {
    body.feedback = String(feedback).trim();
  }
  const res = await fetchWithAuth(`${API_BASE}/api/agi/homo-vs-ai/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data.detail || '';
    } catch (_) { /* ignore */ }
    throw new Error(detail || `Challenge failed (${res.status})`);
  }
  return res.json();
}

// Problem Router — asks the LLM to pick the best of the 10 active rounds
// for a free-form problem description. Used by the "Step 0" panel at the
// top of Section 03 in the workshop tab.
// Returns: { recommended, rationale, runner_ups: [{task, why}], raw? }
export async function routeTestingProblem({ problem, language }) {
  const res = await fetchWithAuth(`${API_BASE}/api/agi/homo-vs-ai/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, language }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data.detail || '';
    } catch (_) { /* ignore */ }
    throw new Error(detail || `Routing failed (${res.status})`);
  }
  return res.json();
}

// AI Judge — ADVISORY verdict for a head-to-head round. The judge compares
// the human tester's answer against the AI assistant's answer for the same
// input and returns a structured opinion. The UI surfaces this next to the
// human vote buttons; the scoreboard still counts ONLY the human presenter's
// click. See /backend/services/homo_vs_ai_service.py for the prompt design
// (explicit self-preference bias warning + task-specific quality rubric).
// Returns:
//   { verdict: 'human'|'ai'|'tie',
//     confidence: 'low'|'medium'|'high',
//     rationale: string,
//     criteria: { accuracy, coverage, practical_value },
//     raw?: string }
export async function judgeTestingRound({ task, humanAnswer, aiAnswer, userInput, language }) {
  const res = await fetchWithAuth(`${API_BASE}/api/agi/homo-vs-ai/judge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task,
      human_answer: humanAnswer,
      ai_answer: aiAnswer,
      user_input: userInput || '',
      language,
    }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data.detail || '';
    } catch (_) { /* ignore */ }
    throw new Error(detail || `Judging failed (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Phase E — Prompt Evolution (governance).
//
// 6 endpoints exposed under /api/agi/homo-vs-ai/prompt-evolution/*. The flow
// is intentionally human-in-the-loop: the human writes feedback during a
// re-run, then clicks "Propose prompt revision" to ask LLM #2 for a permanent
// improvement to the task's base system prompt. Pending revisions can be
// approved, rejected or rolled back from the governance panel inside the
// HomoSapiensVsAI tab.
// ---------------------------------------------------------------------------

async function _peJson(method, path, body) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetchWithAuth(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data.detail || '';
    } catch (_) { /* ignore */ }
    throw new Error(detail || `Prompt evolution call failed (${res.status})`);
  }
  return res.json();
}

export function proposePromptRevision({ task, userInput, previousAiOutput, humanFeedback, actor }) {
  return _peJson('POST', '/api/agi/homo-vs-ai/prompt-evolution/propose', {
    task,
    user_input: userInput,
    previous_ai_output: previousAiOutput,
    human_feedback: humanFeedback,
    actor: actor || 'workshop-host',
  });
}

export function listPromptRevisions({ task, status, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (task) params.set('task', task);
  if (status) params.set('status', status);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  const path = `/api/agi/homo-vs-ai/prompt-evolution/revisions${qs ? `?${qs}` : ''}`;
  return _peJson('GET', path);
}

export function approvePromptRevision(revisionId, { approver, note } = {}) {
  return _peJson('POST', `/api/agi/homo-vs-ai/prompt-evolution/${revisionId}/approve`, {
    approver: approver || 'workshop-host',
    note: note || '',
  });
}

export function rejectPromptRevision(revisionId, { reviewer, reason } = {}) {
  return _peJson('POST', `/api/agi/homo-vs-ai/prompt-evolution/${revisionId}/reject`, {
    reviewer: reviewer || 'workshop-host',
    reason: reason || '',
  });
}

export function rollbackPromptRevision(revisionId, { actor, reason } = {}) {
  return _peJson('POST', `/api/agi/homo-vs-ai/prompt-evolution/${revisionId}/rollback`, {
    actor: actor || 'workshop-host',
    reason: reason || '',
  });
}

export function runRegressionHarness(revisionId, { maxSamples = 3 } = {}) {
  return _peJson('POST', `/api/agi/homo-vs-ai/prompt-evolution/${revisionId}/regression`, {
    max_samples: maxSamples,
  });
}

export function getActivePromptForTask(task) {
  return _peJson('GET', `/api/agi/homo-vs-ai/prompt-evolution/active/${encodeURIComponent(task)}`);
}
