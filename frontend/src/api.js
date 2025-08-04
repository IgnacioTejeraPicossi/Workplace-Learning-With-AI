import { auth } from './firebase';

export async function fetchWithAuth(url, options = {}) {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return fetch(url, options);
}

const API_BASE = "http://127.0.0.1:8000";

// Generic API call function
export async function apiCall(endpoint, method = "GET", data = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetchWithAuth(url, options);
  return response.json();
}

export async function fetchConcepts() {
  const res = await fetchWithAuth(`${API_BASE}/concepts`);
  return res.json();
}

export async function fetchMicroLesson(topic) {
  const res = await fetchWithAuth("http://localhost:8000/micro-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  return res.json();
}

export async function fetchSimulation() {
  const res = await fetchWithAuth(`${API_BASE}/simulation`);
  return res.json();
}

export async function fetchRecommendation(skill_gap) {
  const res = await fetchWithAuth(`${API_BASE}/recommendation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill_gap }),
  });
  return res.json();
}

export async function fetchSimulationStep(history, user_input) {
  const res = await fetchWithAuth("http://127.0.0.1:8000/simulation-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, user_input }),
  });
  return res.json();
}

export async function postCareerCoach(body) {
  const res = await fetchWithAuth("http://127.0.0.1:8000/career-coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function postSkillsForecast(input) {
  const res = await fetchWithAuth("http://127.0.0.1:8000/skills-forecast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function fetchLessons() {
  const res = await fetchWithAuth(`${API_BASE}/lessons`);
  return res.json();
}

export async function deleteLesson(id) {
  const res = await fetchWithAuth(`${API_BASE}/lessons/${id}`, {
    method: "DELETE"
  });
  return res;
}

export async function updateLesson(id, data) {
  const res = await fetchWithAuth(`${API_BASE}/lessons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res;
}

export async function webSearch(query) {
  const res = await fetchWithAuth("http://localhost:8080/web-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function fetchCareerSessions() {
  const res = await fetchWithAuth(`${API_BASE}/user/career-sessions`);
  return res.json();
}

export async function fetchSkillsForecasts() {
  const res = await fetchWithAuth(`${API_BASE}/user/skills-forecasts`);
  return res.json();
}

// Team Management API Functions
export async function createTeam(teamData) {
  return apiCall("/teams", "POST", teamData);
}

export async function getTeams() {
  return apiCall("/teams", "GET");
}

export async function getTeam(teamId) {
  return apiCall(`/teams/${teamId}`, "GET");
}

export async function updateTeam(teamId, teamData) {
  return apiCall(`/teams/${teamId}`, "PUT", teamData);
}

export async function deleteTeam(teamId) {
  return apiCall(`/teams/${teamId}`, "DELETE");
}

export async function addTeamMember(teamId, memberData) {
  return apiCall(`/teams/${teamId}/members`, "POST", memberData);
}

export async function updateTeamMember(teamId, memberId, memberData) {
  return apiCall(`/teams/${teamId}/members/${memberId}`, "PUT", memberData);
}

export async function removeTeamMember(teamId, memberId) {
  return apiCall(`/teams/${teamId}/members/${memberId}`, "DELETE");
}

export async function generateTeamAnalytics(teamId, metrics) {
  return apiCall(`/teams/${teamId}/analytics`, "POST", {
    team_id: teamId,
    metrics
  });
}

export async function getTeamAnalytics(teamId) {
  return apiCall(`/teams/${teamId}/analytics`, "GET");
}

// Certification API Functions
export async function saveUserProfile(profile) {
  return apiCall("/certifications/save-profile", "POST", profile);
}

export async function getUserProfile() {
  return apiCall("/certifications/user-profile", "GET");
}

export async function recommendCertifications(profile) {
  return apiCall("/certifications/recommend", "POST", profile);
}

export async function generateStudyPlan(studyPlan) {
  return apiCall("/certifications/study-plan", "POST", studyPlan);
}

export async function startCertificationSimulation(simulation) {
  return apiCall("/certifications/simulate", "POST", simulation);
}

export async function getUserCertifications() {
  return apiCall("/certifications/user-recommendations", "GET");
}

export async function postRoute(prompt) {
  return apiCall('/route', 'POST', { prompt });
}

export async function generateVideoQuiz(summary) {
  return apiCall('/video-quiz', 'POST', { summary });
}

export async function generateVideoSummary(transcript) {
  return apiCall('/video-summary', 'POST', { transcript });
}

export async function askStream({ prompt, messages, model = "gpt-4", max_tokens = 512 }, onData) {
  const response = await fetch("http://127.0.0.1:8000/llm-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, messages, model, max_tokens })
  });
  
  // Check if response is ok
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      if (onData) onData(result, chunk);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
  
  // Check if the result contains an error message
  if (result.includes('[MOCKED STREAMING ERROR:') || result.includes('[Errno 2]')) {
    // Extract the actual response from the error
    const mockResponse = `I'm your AI Study Buddy! Here's a helpful response to your question:

"${prompt || 'Hello'}"

This is a mock response since no OpenAI API key is configured. In a real environment, I would provide detailed, AI-powered answers about workplace learning, micro-lessons, career development, and other topics.

To get real AI responses, please configure your OPENAI_API_KEY in the .env file.

For now, here are some general tips:
- Micro-lessons are bite-sized learning modules designed for quick consumption
- AI can help personalize learning paths based on your goals
- Skills forecasting uses data to predict future learning needs
- Scenario simulations provide hands-on practice in safe environments

Would you like to know more about any specific feature?`;
    
    // Return the mock response instead of the error
    return mockResponse;
  }
  
  return result;
}

export async function saveMicroLesson(topic, lesson) {
  return apiCall('/micro-lesson', 'POST', { topic, lesson });
}
