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
// Task must be one of: 'scenarios' | 'ambiguities' | 'followups' | 'tests_from_code'
export async function runTestingChallenge({ task, input, language }) {
  const res = await fetchWithAuth(`${API_BASE}/api/agi/homo-vs-ai/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input, language }),
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
