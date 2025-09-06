const BASE = process.env.REACT_APP_API_BASE_URL || "";

async function j(method, path, body) {
  const res = await fetch(`${BASE}/api/digital${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const planApi   = (payload) => j("POST", "/plan", payload);
export const safetyApi = (payload) => j("POST", "/safety-check", payload);
export const simApi    = (payload) => j("POST", "/simulate", payload);

// Pipeline (optional)
export const runPipeline = (payload) => j("POST", "/run/pipeline", payload);

// Playbooks CRUD
export const savePlaybook   = (doc) => j("POST", "/playbooks", doc);
export const listPlaybooks  = ()   => j("GET",  "/playbooks");
export const getPlaybook    = (id) => j("GET",  `/playbooks/${id}`);
export const patchPlaybook  = (id, patch) => j("PATCH", `/playbooks/${id}`, patch);
export const deletePlaybook = (id) => j("DELETE", `/playbooks/${id}`);
