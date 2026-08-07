import { auth } from './firebase';
import { apiFetch, setAccessToken } from './api/apiInterceptor';

// Unified authentication function that works with both Firebase and MongoDB tokens
export async function fetchWithAuth(url, options = {}) {
  // First try to get MongoDB JWT token from our interceptor
  const mongoToken = localStorage.getItem('mongodb_access_token');
  
  // Inject API Config headers from localStorage so backend knows the selected provider
  try {
    const apiProvider = localStorage.getItem('apiProvider');
    const openaiKey = localStorage.getItem('openaiKey');
    const openrouterKey = localStorage.getItem('openrouterKey');
    const itemaiUrl = localStorage.getItem('itemaiUrl');
    const itemserveraiUrl = localStorage.getItem('itemserveraiUrl');
    options.headers = {
      ...options.headers,
      ...(apiProvider ? { 'x-api-provider': apiProvider } : {}),
      ...(openaiKey ? { 'x-openai-key': openaiKey } : {}),
      ...(openrouterKey ? { 'x-openrouter-key': openrouterKey } : {}),
      ...(itemaiUrl ? { 'x-itemai-url': itemaiUrl } : {}),
      ...(itemserveraiUrl ? { 'x-itemserverai-url': itemserveraiUrl } : {}),
    };
  } catch (_) {
    // no-op: if localStorage is blocked we simply skip header injection
  }

  if (mongoToken) {
    // Use MongoDB JWT token
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${mongoToken}`,
    };
    return fetch(url, options);
  }
  
  // Fallback to Firebase token
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

// Centralized API base URL: prefer env var set at build time
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

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

// (Removed the unused `webSearch` wrapper — the Web Search UI uses `webSearchAi`
// below, and KnowledgeMap calls /api/simple-search directly. 1.30.8)

// AI + Internet: fresh search + AI-synthesized, cited answer. Returns
// { query, answer, citations, results, is_mock, provider, fallback_url }.
// Reusable by other modules that need current, grounded information.
export async function webSearchAi(query, limit = 6) {
  const res = await fetchWithAuth(`${API_BASE}/api/web-search-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: query, limit }),
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

// Historical saved analyses for a team (newest first) → { analytics: [...] }.
export async function getTeamAnalyticsHistory(teamId) {
  return apiCall(`/teams/${teamId}/analytics`, "GET");
}

// Andrés the Robot — developmental AI companion (V0).
export async function getAndresProfile() {
  return apiCall("/api/andres/profile", "GET");
}
export async function andresChat(message, useWeb = false, document = "", image = "") {
  return apiCall("/api/andres/chat", "POST", { message, use_web: useWeb, document, image });
}
export async function getAndresResearchTiers() {
  return apiCall("/api/andres/research/tiers", "GET");
}
export async function setAndresResearchTiers(tiers) {
  return apiCall("/api/andres/research/tiers", "PATCH", tiers);
}
export async function getAndresMemories(type) {
  const q = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiCall(`/api/andres/memories${q}`, "GET");
}
export async function createAndresMemory(mem) {
  return apiCall("/api/andres/memories", "POST", mem);
}
export async function updateAndresMemory(memoryId, patch) {
  return apiCall(`/api/andres/memories/${memoryId}`, "PATCH", patch);
}
export async function deleteAndresMemory(memoryId) {
  return apiCall(`/api/andres/memories/${memoryId}`, "DELETE");
}
// Andrés V2 — reflection / curiosity / projects / evolution
export async function andresReflect() {
  return apiCall("/api/andres/reflect", "POST", {});
}
export async function getAndresReflections() {
  return apiCall("/api/andres/reflections", "GET");
}
export async function andresGenerateCuriosity() {
  return apiCall("/api/andres/curiosity/generate", "POST", {});
}
export async function getAndresCuriosity(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiCall(`/api/andres/curiosity${q}`, "GET");
}
export async function updateAndresCuriosity(itemId, status) {
  return apiCall(`/api/andres/curiosity/${itemId}`, "PATCH", { status });
}
export async function getAndresProjects() {
  return apiCall("/api/andres/projects", "GET");
}
export async function createAndresProject(project) {
  return apiCall("/api/andres/projects", "POST", project);
}
export async function updateAndresProject(projectId, patch) {
  return apiCall(`/api/andres/projects/${projectId}`, "PATCH", patch);
}
export async function deleteAndresProject(projectId) {
  return apiCall(`/api/andres/projects/${projectId}`, "DELETE");
}
export async function approveAndresProject(projectId) {
  return apiCall(`/api/andres/projects/${projectId}/approve`, "POST", {});
}
export async function archiveAndresProject(projectId, closure) {
  return apiCall(`/api/andres/projects/${projectId}/archive`, "POST", closure);
}
export async function getAndresProposals(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiCall(`/api/andres/evolution/proposals${q}`, "GET");
}
export async function getAndresVersions() {
  return apiCall("/api/andres/evolution/versions", "GET");
}
export async function proposeAndresEvolution(rationale, changes) {
  return apiCall("/api/andres/evolution/propose", "POST", { rationale, changes });
}
export async function approveAndresProposal(proposalId) {
  return apiCall(`/api/andres/evolution/${proposalId}/approve`, "POST", {});
}
export async function rejectAndresProposal(proposalId) {
  return apiCall(`/api/andres/evolution/${proposalId}/reject`, "POST", {});
}
export async function rollbackAndres(targetVersion) {
  return apiCall("/api/andres/evolution/rollback", "POST", { target_version: targetVersion });
}
// Andrés V3 — creativity
export async function andresCreate(payload) {
  return apiCall("/api/andres/creative/generate", "POST", payload);
}
export async function getAndresArtifacts() {
  return apiCall("/api/andres/creative", "GET");
}
export async function deleteAndresArtifact(artifactId) {
  return apiCall(`/api/andres/creative/${artifactId}`, "DELETE");
}
// Andrés V4 — skills
export async function draftAndresSkill(task) {
  return apiCall("/api/andres/skills/draft", "POST", { task });
}
export async function proposeAndresSkill(skill) {
  return apiCall("/api/andres/skills/propose", "POST", skill);
}
export async function getAndresSkills() {
  return apiCall("/api/andres/skills", "GET");
}
export async function getAndresSkillMetrics() {
  return apiCall("/api/andres/skills/metrics", "GET");
}
export async function approveAndresSkill(skillId) {
  return apiCall(`/api/andres/skills/${skillId}/approve`, "POST", {});
}
export async function rejectAndresSkill(skillId) {
  return apiCall(`/api/andres/skills/${skillId}/reject`, "POST", {});
}
export async function runAndresSkill(skillId, input) {
  return apiCall(`/api/andres/skills/${skillId}/run`, "POST", { input });
}
export async function deleteAndresSkill(skillId) {
  return apiCall(`/api/andres/skills/${skillId}`, "DELETE");
}
// Andrés V5 — Personality Capsule, identity history, developmental initiative
export async function exportAndresCapsule() {
  return apiCall("/api/andres/capsule/export", "GET");
}
export async function previewAndresCapsule(capsule) {
  return apiCall("/api/andres/capsule/preview", "POST", { capsule });
}
export async function importAndresCapsule(capsule) {
  return apiCall("/api/andres/capsule/import", "POST", { capsule });
}
export async function getAndresIdentityHistory() {
  return apiCall("/api/andres/identity/history", "GET");
}
export async function suggestAndresDevelopment(focus = "balanced") {
  return apiCall("/api/andres/development/suggest", "POST", { focus });
}
export async function getAndresSuggestions() {
  return apiCall("/api/andres/development/suggestions", "GET");
}
export async function actAndresSuggestion(suggestionId, action) {
  return apiCall(`/api/andres/development/suggestions/${suggestionId}`, "POST", { action });
}
// Andrés V5 — curriculum ("a compass, not a school")
export async function getAndresCurriculum() {
  return apiCall("/api/andres/curriculum/modules", "GET");
}
export async function createAndresModule(module) {
  return apiCall("/api/andres/curriculum/modules", "POST", module);
}
export async function updateAndresModule(moduleId, patch) {
  return apiCall(`/api/andres/curriculum/modules/${moduleId}`, "PATCH", patch);
}
export async function approveAndresModule(moduleId) {
  return apiCall(`/api/andres/curriculum/modules/${moduleId}/approve`, "POST", {});
}
export async function archiveAndresModule(moduleId, closure) {
  return apiCall(`/api/andres/curriculum/modules/${moduleId}/archive`, "POST", closure);
}
export async function deleteAndresModule(moduleId) {
  return apiCall(`/api/andres/curriculum/modules/${moduleId}`, "DELETE");
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

export async function askStream({ prompt, messages, model = "gpt-5.4-mini", max_tokens = 512 }, onData) {
  const response = await fetchWithAuth(`${API_BASE}/llm-stream`, {
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

// AI Learning & Training — server-side progress + quiz persistence (per user).
export async function getAiTrainingState() {
  return apiCall('/api/ai-training/state', 'GET');
}
export async function saveAiTrainingProgress(data) {
  // data: { lesson_id, section, quiz_completed }
  return apiCall('/api/ai-training/progress', 'PUT', data);
}
export async function saveAiQuizResult(data) {
  // data: { lesson_id, answers, score, timestamp }
  return apiCall('/api/ai-training/quiz-result', 'POST', data);
}

// Scenario Simulator — server-side interactive-run progress (per user).
export async function getSimulatorState() {
  return apiCall('/api/simulator/state', 'GET');
}
export async function saveSimulatorProgress(data) {
  // data: { scenario_type, custom_scenario, current_step, selected_option,
  //         simulation_response, completed }
  return apiCall('/api/simulator/progress', 'PUT', data);
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
    const response = await fetch('/api/web-search/');
    if (!response.ok) throw new Error('Failed to fetch web search results');
    return await response.json();
  } catch (error) {
    console.error('Error fetching web search results:', error);
    return [];
  }
};

export const saveWebSearchResult = async (resultData) => {
  try {
    const response = await fetch('/api/web-search/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData)
    });
    if (!response.ok) throw new Error('Failed to save web search result');
    return await response.json();
  } catch (error) {
    console.error('Error saving web search result:', error);
    throw error;
  }
};

export const deleteWebSearchResult = async (resultId) => {
  try {
    const response = await fetch(`/api/web-search/${resultId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete web search result');
    return await response.json();
  } catch (error) {
    console.error('Error deleting web search result:', error);
    throw error;
  }
};

// Skills Forecast API functions
export const fetchSkillsForecasts = async () => {
  try {
    const response = await fetch('/api/skills-forecast/');
    if (!response.ok) throw new Error('Failed to fetch skills forecasts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching skills forecasts:', error);
    return [];
  }
};

export const saveSkillsForecast = async (forecastData) => {
  try {
    const response = await fetch('/api/skills-forecast/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forecastData)
    });
    if (!response.ok) throw new Error('Failed to save skills forecast');
    return await response.json();
  } catch (error) {
    console.error('Error saving skills forecast:', error);
    throw error;
  }
};

export const deleteSkillsForecast = async (forecastId) => {
  try {
    const response = await fetch(`/api/skills-forecast/${forecastId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete skills forecast');
    return await response.json();
  } catch (error) {
    console.error('Error deleting skills forecast:', error);
    throw error;
  }
};

// AI Career Coach API functions
export const fetchCareerCoachSessions = async () => {
  try {
    const response = await fetch('/api/career-coach/');
    if (!response.ok) throw new Error('Failed to fetch career coach sessions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching career coach sessions:', error);
    return [];
  }
};

export const saveCareerCoachSession = async (sessionData) => {
  try {
    const response = await fetch('/api/career-coach/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    if (!response.ok) throw new Error('Failed to save career coach session');
    return await response.json();
  } catch (error) {
    console.error('Error saving career coach session:', error);
    throw error;
  }
};

export const deleteCareerCoachSession = async (sessionId) => {
  try {
    const response = await fetch(`/api/career-coach/${sessionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete career coach session');
    return await response.json();
  } catch (error) {
    console.error('Error deleting career coach session:', error);
    throw error;
  }
};

export const updateCareerCoachSession = async (sessionId, data) => {
  try {
    const response = await fetch(`/api/career-coach/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update career coach session');
    return await response.json();
  } catch (error) {
    console.error('Error updating career coach session:', error);
    throw error;
  }
};

// Simulation Results API functions
export const fetchSimulationResults = async () => {
  try {
    const response = await fetch('/api/simulation-results/');
    if (!response.ok) throw new Error('Failed to fetch simulation results');
    return await response.json();
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    return [];
  }
};

export const saveSimulationResult = async (resultData) => {
  try {
    const response = await fetch('/api/simulation-results/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData)
    });
    if (!response.ok) throw new Error('Failed to save simulation result');
    return await response.json();
  } catch (error) {
    console.error('Error saving simulation result:', error);
    throw error;
  }
};

export const deleteSimulationResult = async (resultId) => {
  try {
    const response = await fetch(`/api/simulation-results/${resultId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete simulation result');
    return await response.json();
  } catch (error) {
    console.error('Error deleting simulation result:', error);
    throw error;
  }
};

export const updateSimulationResult = async (resultId, data) => {
  try {
    const response = await fetch(`/api/simulation-results/${resultId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update simulation result');
    return await response.json();
  } catch (error) {
    console.error('Error updating simulation result:', error);
    throw error;
  }
};

// Document Analysis API functions
export const fetchDocumentAnalyses = async () => {
  try {
    const response = await fetch('/api/document-analyzer/get-saved-analyses');
    if (!response.ok) throw new Error('Failed to fetch document analyses');
    return await response.json();
  } catch (error) {
    console.error('Error fetching document analyses:', error);
    return [];
  }
};

// Repository Analysis API functions
export const fetchRepositoryAnalyses = async () => {
  try {
    const response = await fetch('/api/saved-analyses?limit=50');
    if (!response.ok) throw new Error('Failed to fetch repository analyses');
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository analyses:', error);
    return [];
  }
};

// Agentic RAG Analysis API functions
export const fetchAgenticRAGAnalyses = async () => {
  try {
    const response = await fetch('/api/agentic-rag/get-analyses?limit=50');
    if (!response.ok) throw new Error('Failed to fetch agentic RAG analyses');
    return await response.json();
  } catch (error) {
    console.error('Error fetching agentic RAG analyses:', error);
    return [];
  }
};
