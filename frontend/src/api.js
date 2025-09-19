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

const API_BASE = "/api";

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
  
  console.log(`🔍 [API] Making ${method} request to: ${url}`);
  if (data) {
    console.log(`🔍 [API] Request data:`, data);
  }
  
  try {
    const response = await fetchWithAuth(url, options);
    
    console.log(`🔍 [API] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API] Error response:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ [API] Success response:`, result);
    return result;
  } catch (error) {
    console.error(`❌ [API] Request failed:`, error);
    throw error;
  }
}

export async function fetchConcepts() {
  const res = await fetchWithAuth(`${API_BASE}/concepts`);
  return res.json();
}

export async function fetchMicroLesson(topic) {
  const res = await fetchWithAuth(`${API_BASE}/micro-lesson`, {
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
  const res = await fetchWithAuth(`${API_BASE}/simulation-step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, user_input }),
  });
  return res.json();
}

export async function postCareerCoach(body) {
  const res = await fetchWithAuth(`${API_BASE}/career-coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function postSkillsForecast(input) {
  const res = await fetchWithAuth(`${API_BASE}/skills-forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

// Removed old lesson APIs - now using MongoDB micro-lessons API

export async function webSearch(query) {
  const res = await fetchWithAuth(`${API_BASE}/web-search`, {
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

// Removed duplicate function - using the new one below

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

// Function for video summary without authentication (backend endpoint doesn't require it)
export async function generateVideoSummaryNoAuth(transcript) {
  const response = await fetch(`${API_BASE}/video-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function askStream({ prompt, messages, model = "gpt-4", max_tokens = 512 }, onData) {
  const response = await fetch(`${API_BASE}/llm-stream`, {
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

// Old saveMicroLesson function - replaced by new one below

// Saved Videos API functions
export async function fetchSavedVideos() {
  return apiCall('/api/saved-videos', 'GET');
}

export async function saveVideo(videoData) {
  return apiCall('/api/saved-videos', 'POST', videoData);
}

export async function deleteSavedVideo(videoId) {
  return apiCall(`/api/saved-videos/${videoId}`, 'DELETE');
}

export async function updateSavedVideo(videoId, data) {
  return apiCall(`/api/saved-videos/${videoId}`, "PUT", data);
}

// Repo Analyzer Cursor AI API Functions
export async function analyzeRepository(repoUrl, branch = null) {
  return apiCall("/api/analyze-repo", "POST", {
    repo_url: repoUrl,
    branch: branch
  });
}

export async function detectRepositoryBranches(repoUrl) {
  const encodedUrl = encodeURIComponent(repoUrl);
  return apiCall(`/api/detect-branch/${encodedUrl}`, "GET");
}

export async function getRepoTemplates() {
  return apiCall("/api/repo-templates", "GET");
}

export async function getSavedAnalyses(limit = 10) {
  return apiCall(`/api/saved-analyses?limit=${limit}`, "GET");
}

export async function getSavedAnalysis(analysisId) {
  return apiCall(`/api/saved-analyses/${analysisId}`, "GET");
}

export async function deleteSavedAnalysis(analysisId) {
  return apiCall(`/api/saved-analyses/${analysisId}`, "DELETE");
}

export async function getUserAnalyses(userId, limit = 10) {
  return apiCall(`/api/user-analyses/${userId}?limit=${limit}`, "GET");
}

// Cursor AI README Generator API Functions
export async function generateCursorReadme(files, template = "professional") {
  return apiCall("/api/cursor-readme/generate", "POST", {
    files: files,
    template: template
  });
}

export async function getCursorReadmeTemplates() {
  return apiCall("/api/cursor-readme/templates", "GET");
}

export async function saveCursorReadme(readmeData) {
  return apiCall("/api/cursor-readme/save", "POST", readmeData);
}

export async function getCursorReadmeHistory() {
  return apiCall("/api/cursor-readme/history", "GET");
}

// Certifications API functions
export async function fetchCertifications() {
  return apiCall('/api/certifications/', 'GET');
}

export async function saveCertification(certificationData) {
  return apiCall('/api/certifications/', 'POST', certificationData);
}

export async function deleteCertification(certificationId) {
  return apiCall(`/api/certifications/${certificationId}`, 'DELETE');
}

export async function updateCertification(certificationId, data) {
  return apiCall(`/api/certifications/${certificationId}`, "PUT", data);
}

// Micro-lessons API functions
export async function fetchMicroLessons() {
  return apiCall('/api/micro-lessons/', 'GET');
}

export async function saveMicroLesson(microLessonData) {
  return apiCall('/api/micro-lessons/', 'POST', microLessonData);
}

export async function deleteMicroLesson(microLessonId) {
  return apiCall(`/api/micro-lessons/${microLessonId}`, 'DELETE');
}

export async function updateMicroLesson(microLessonId, data) {
  return apiCall(`/api/micro-lessons/${microLessonId}`, 'PUT', data);
}

// Web Search API functions
export const fetchWebSearchResults = async () => {
  try {
    return apiCall('/api/web-search/');
  } catch (error) {
    console.error('Error fetching web search results:', error);
    return [];
  }
};

export const saveWebSearchResult = async (resultData) => {
  return apiCall('/api/web-search/', 'POST', resultData);
};

export const deleteWebSearchResult = async (resultId) => {
  return apiCall(`/api/web-search/${resultId}`, "DELETE");
};

// Skills Forecast API functions
export const fetchSkillsForecasts = async () => {
  try {
    return apiCall('/api/skills-forecast/');
  } catch (error) {
    console.error('Error fetching skills forecasts:', error);
    return [];
  }
};

export const saveSkillsForecast = async (forecastData) => {
  return apiCall('/api/skills-forecast/', "POST", forecastData);
};

export const deleteSkillsForecast = async (forecastId) => {
  return apiCall(`/api-skills-forecast/${forecastId}`, "DELETE");
};

// AI Career Coach API functions
export const fetchCareerCoachSessions = async () => {
  try {
    return apiCall('/api/career-coach/');
  } catch (error) {
    console.error('Error fetching career coach sessions:', error);
    return [];
  }
};

export const saveCareerCoachSession = async (sessionData) => {
  return apiCall('/api/career-coach', "POST", sessionData);
};

export const deleteCareerCoachSession = async (sessionId) => {
  return apiCall(`/api/career-coach/${sessionId}`, "DELETE");
};

export const updateCareerCoachSession = async (sessionId, data) => {
  return apiCall(`/api/career-coach/${sessionId}`, "PUT", data);
};

// Simulation Results API functions
export const fetchSimulationResults = async () => {
  try {
    return apiCall('/api/simulation-results/');
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    return [];
  }
};

export const saveSimulationResult = async (resultData) => {
  return apiCall('/api/simulation-results/', "POST", resultData);
};

export const deleteSimulationResult = async (resultId) => {
  return apiCall(`/api/simulation-results/${resultId}`, "DELETE");
};

export const updateSimulationResult = async (resultId, data) => {
  return apiCall(`/api/simulation-results/${resultId}`, "PUT", data);
};

// Document Analysis API functions
export const fetchDocumentAnalyses = async () => {
  try {
    return apiCall('/api/document-analyzer/get-saved-analyses');
  } catch (error) {
    console.error('Error fetching document analyses:', error);
    return [];
  }
};

// Repository Analysis API functions
export const fetchRepositoryAnalyses = async () => {
  try {
    return apiCall('/api/saved-analyses?limit=50');
  } catch (error) {
    console.error('Error fetching repository analyses:', error);
    return [];
  }
};

// Agentic RAG Analysis API functions
export const fetchAgenticRAGAnalyses = async () => {
  try {
    return apiCall('/api/agentic-rag/get-analyses?limit=50');
  } catch (error) {
    console.error('Error fetching agentic RAG analyses:', error);
    return [];
  }
};
