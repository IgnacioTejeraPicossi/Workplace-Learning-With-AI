const BASE = process.env.REACT_APP_API_BASE_URL || "";

export function qs(params = {}) {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, typeof v === "boolean" ? String(v) : v]);
  return entries.length ? "?" + new URLSearchParams(entries).toString() : "";
}

export async function get(path) {
  const res = await fetch(`${BASE}/api/agentops${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function post(path, body) {
  const res = await fetch(`${BASE}/api/agentops${path}`, {
    method: "POST", 
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patch(path, body) {
  const res = await fetch(`${BASE}/api/agentops${path}`, {
    method: "PATCH", 
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function del(path) {
  const res = await fetch(`${BASE}/api/agentops${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function download(path, filename) {
  const res = await fetch(`${BASE}/api/agentops${path}`);
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; 
  a.download = filename;
  document.body.appendChild(a); 
  a.click(); 
  a.remove();
  window.URL.revokeObjectURL(url);
}
