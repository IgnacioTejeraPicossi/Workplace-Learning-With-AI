// Thin REST client for /api/qa/security/* (Phase H · Pack 2).
// Keeps the React components free of fetch boilerplate and centralises the
// base URL + error handling. All functions return a plain JS object that
// matches the Pydantic schemas in backend/schemas/qa_security.py.

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/qa/security`;

async function jsonOrThrow(res, action) {
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data?.detail || '';
    } catch (_) { /* ignore */ }
    throw new Error(detail || `${action} failed (${res.status})`);
  }
  return res.json();
}

export const securityApi = {
  status(environment = 'test') {
    const qs = new URLSearchParams({ environment }).toString();
    return fetch(`${API}/status?${qs}`).then(r => jsonOrThrow(r, 'status'));
  },
  checks(environment = 'test', lang = 'en') {
    const qs = new URLSearchParams({ environment, lang }).toString();
    return fetch(`${API}/checks?${qs}`).then(r => jsonOrThrow(r, 'checks'));
  },
  checkDetail(checkId, environment = 'test', lang = 'en') {
    const qs = new URLSearchParams({ environment, lang }).toString();
    return fetch(`${API}/checks/${encodeURIComponent(checkId)}?${qs}`)
      .then(r => jsonOrThrow(r, 'check-detail'));
  },
  scan({ environment = 'test', lang = 'en', actor = 'workshop-host', trigger = 'manual' } = {}) {
    return fetch(`${API}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment, lang, actor, trigger }),
    }).then(r => jsonOrThrow(r, 'scan'));
  },
  findings({ status, severity, checkId, limit = 200 } = {}) {
    const params = new URLSearchParams();
    if (status)   params.set('status', status);
    if (severity) params.set('severity', severity);
    if (checkId)  params.set('check_id', checkId);
    if (limit)    params.set('limit', String(limit));
    const qs = params.toString();
    return fetch(`${API}/findings${qs ? `?${qs}` : ''}`)
      .then(r => jsonOrThrow(r, 'findings'));
  },
  patchFinding(findingId, patch) {
    return fetch(`${API}/findings/${encodeURIComponent(findingId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch || {}),
    }).then(r => jsonOrThrow(r, 'patch-finding'));
  },
  history({ limit = 5, environment } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (environment) params.set('environment', environment);
    return fetch(`${API}/history?${params.toString()}`).then(r => jsonOrThrow(r, 'history'));
  },
  dpia: {
    get() {
      return fetch(`${API}/dpia`).then(r => jsonOrThrow(r, 'dpia-get'));
    },
    save(body) {
      return fetch(`${API}/dpia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      }).then(r => jsonOrThrow(r, 'dpia-save'));
    },
    patch(patch) {
      return fetch(`${API}/dpia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch || {}),
      }).then(r => jsonOrThrow(r, 'dpia-patch'));
    },
  },

  // ── Pack 3 additions ────────────────────────────────────────────────
  exportMarkdown({ environment = 'test', includeDpia = true, includeHistory = true,
                    sprintName = null, lang = 'en' } = {}) {
    return fetch(`${API}/export/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        environment,
        include_dpia: includeDpia,
        include_history: includeHistory,
        sprint_name: sprintName,
        lang,
      }),
    }).then(r => jsonOrThrow(r, 'export-markdown'));
  },

  dispatchAdo(findingId, { environment = 'test', actor = 'workshop-host', lang = 'en' } = {}) {
    return fetch(`${API}/findings/${encodeURIComponent(findingId)}/dispatch-ado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment, actor, lang }),
    }).then(r => jsonOrThrow(r, 'dispatch-ado'));
  },

  diff({ fromScan = null, toScan = null, environment = null } = {}) {
    const params = new URLSearchParams();
    if (fromScan)    params.set('from_scan', fromScan);
    if (toScan)      params.set('to_scan', toScan);
    if (environment) params.set('environment', environment);
    const qs = params.toString();
    return fetch(`${API}/diff${qs ? `?${qs}` : ''}`).then(r => jsonOrThrow(r, 'diff'));
  },

  verify(findingId, { environment = 'test', actor = 'workshop-host', lang = 'en' } = {}) {
    return fetch(`${API}/findings/${encodeURIComponent(findingId)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment, actor, lang }),
    }).then(r => jsonOrThrow(r, 'verify'));
  },

  environments() {
    return fetch(`${API}/environments`).then(r => jsonOrThrow(r, 'environments'));
  },
};
