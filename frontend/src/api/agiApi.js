export async function fetchAGIProgress() {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  const res = await fetch(`${API_BASE}/api/agi/progress`);
  if (!res.ok) throw new Error('Failed to load AGI progress');
  return res.json();
}


