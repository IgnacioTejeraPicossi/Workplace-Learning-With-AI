// AgentOps Studio - API Helper
const BASE = process.env.REACT_APP_API_BASE_URL || "";

const apiCall = async (method, path, body) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    throw new Error(await response.text());
  }
  
  return response.json();
};

// Digital Lab API
export const Digital = {
  plan: (payload) => apiCall("POST", "/api/digital/plan", payload),
  safety: (payload) => apiCall("POST", "/api/digital/safety-check", payload),
  sim: (payload) => apiCall("POST", "/api/digital/simulate", payload),
  pipeline: (payload) => apiCall("POST", "/api/digital/run/pipeline", payload),
  execute: (payload) => apiCall("POST", "/api/digital/execute", payload)
};

// Prompt Lab API
export const Prompt = {
  run: (payload) => apiCall("POST", "/api/prompt/run", payload)
};

// Playbooks API
export const Playbooks = {
  save: (doc) => apiCall("POST", "/api/playbooks", doc),
  list: () => apiCall("GET", "/api/playbooks"),
  get: (id) => apiCall("GET", `/api/playbooks/${id}`),
  patch: (id, patch) => apiCall("PATCH", `/api/playbooks/${id}`, patch),
  delete: (id) => apiCall("DELETE", `/api/playbooks/${id}`)
};

// Flows API
export const Flows = {
  create: (doc) => apiCall("POST", "/api/flows", doc),
  list: () => apiCall("GET", "/api/flows"),
  get: (id) => apiCall("GET", `/api/flows/${id}`),
  patch: (id, patch) => apiCall("PATCH", `/api/flows/${id}`, patch),
  delete: (id) => apiCall("DELETE", `/api/flows/${id}`)
};

// Runs API
export const Runs = {
  start: (payload) => apiCall("POST", "/api/runs/start", payload),
  list: (params) => apiCall("GET", "/api/runs" + buildQueryString(params)),
  summary: () => apiCall("GET", "/api/runs/summary"),
  export: (params) => fetch(`${BASE}/api/runs/export${buildQueryString(params)}`)
};

// Settings API
export const Settings = {
  get:  ()      => apiCall("GET",  "/api/settings"),
  put:  (body)  => apiCall("PUT",  "/api/settings", body),
  patch:(patch) => apiCall("PATCH","/api/settings", patch),
};

// Utility function for query strings
export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};
