// Humanoid Lab API Helper
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

// Helper function to build query strings
export function qs(params = {}) {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, typeof v === "boolean" ? String(v) : v]);
  return entries.length ? "?" + new URLSearchParams(entries).toString() : "";
}

// GET request helper
export async function get(path) {
  const url = `${API_BASE_URL}/api/humanoid${path}`;
  console.log(`🔍 [Humanoid API] GET: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Humanoid API] Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ [Humanoid API] Success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ [Humanoid API] Request failed:`, error);
    throw error;
  }
}

// POST request helper
export async function post(path, body) {
  const url = `${API_BASE_URL}/api/humanoid${path}`;
  console.log(`🔍 [Humanoid API] POST: ${url}`, body);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Humanoid API] Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ [Humanoid API] Success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ [Humanoid API] Request failed:`, error);
    throw error;
  }
}

// Download helper
export async function download(path, filename) {
  const url = `${API_BASE_URL}/api/humanoid${path}`;
  console.log(`🔍 [Humanoid API] Download: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log(`✅ [Humanoid API] Download complete: ${filename}`);
  } catch (error) {
    console.error(`❌ [Humanoid API] Download failed:`, error);
    throw error;
  }
}

// Specific API functions for Humanoid Lab
export const humanoidApi = {
  // Planning
  async generatePlan(planRequest) {
    return await post("/plan", planRequest);
  },
  
  // Simulation
  async runSimulation(simulationPayload) {
    return await post("/simulate", simulationPayload);
  },
  
  // Safety
  async checkSafety(safetyPayload) {
    return await post("/safety-check", safetyPayload);
  },
  
  // Judging
  async judgeRun(judgePayload) {
    return await post("/judge", judgePayload);
  },
  
  // Teleoperation
  async sendCommand(command) {
    return await post("/teleop", command);
  },
  
  // Data management
  async getRuns(filters = {}) {
    const query = qs(filters);
    return await get(`/runs${query}`);
  },
  
  async getRunsSummary(filters = {}) {
    const query = qs(filters);
    return await get(`/runs/summary${query}`);
  },
  
  async exportRuns(format = "csv", filters = {}) {
    const params = { format, ...filters };
    const query = qs(params);
    const filename = format === "json" ? "humanoid_runs.json" : "humanoid_runs.csv";
    return await download(`/runs/export${query}`, filename);
  },
  
  // Health check
  async healthCheck() {
    return await get("/health");
  }
};
