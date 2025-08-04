import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { apiCall, getUserProfile, saveUserProfile, askStream } from "./api";

function Certifications() {
  const [profile, setProfile] = useState({
    role: "",
    experience_level: "advanced",
    skills: [],
    goals: ""
  });
  const [studyPlan, setStudyPlan] = useState({
    certification_name: "",
    current_skills: [],
    target_skills: [],
    study_plan: ""
  });
  const [activeTab, setActiveTab] = useState("recommend");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [autoFillStatus, setAutoFillStatus] = useState("");
  const [currentSkillInput, setCurrentSkillInput] = useState("");
  const [studyPlanResult, setStudyPlanResult] = useState("");
  const [simulation, setSimulation] = useState("");
  const [history, setHistory] = useState([]);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const { colors } = useTheme();

  const experienceLevels = [
    { value: "beginner", label: "Beginner (0-2 years)" },
    { value: "intermediate", label: "Intermediate (2-5 years)" },
    { value: "advanced", label: "Advanced (5+ years)" }
  ];

  useEffect(() => {
    // Auto-fill profile from saved user profile
    async function fetchUserProfile() {
      try {
        setAutoFillStatus("Loading your profile...");
        console.log("Fetching user profile...");
        
        const res = await getUserProfile();
        console.log("Profile response:", res);
        
        if (res && res.profile) {
          console.log("Setting profile:", res.profile);
          setProfile({
            role: res.profile.role || "",
            skills: res.profile.skills || [],
            goals: res.profile.goals || "",
            experience_level: res.profile.experience_level || "beginner"
          });
          
          // Also populate the study plan current skills from the saved profile
          setStudyPlan(prev => ({
            ...prev,
            current_skills: res.profile.skills || []
          }));
          
          setAutoFillStatus("Profile loaded successfully!");
          setTimeout(() => setAutoFillStatus(""), 3000);
        } else {
          console.log("No profile found in response:", res);
          setAutoFillStatus("No saved profile found. Fill in your details to get started.");
          setTimeout(() => setAutoFillStatus(""), 5000);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
        setAutoFillStatus("Could not load saved profile. You can still fill in your details.");
        setTimeout(() => setAutoFillStatus(""), 5000);
      }
    }
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Fetch study plan history
    async function fetchHistory() {
      try {
        const res = await apiCall("/certifications/user-recommendations", "GET");
        if (res && res.study_plans) {
          setHistory(res.study_plans);
        }
      } catch (e) {}
    }
    fetchHistory();
  }, []);

  const handleGetRecommendations = async () => {
    if (!profile.role || !profile.goals) return;
    
    try {
      setLoading(true);
      
      // Save the profile first for auto-fill
      console.log("Saving profile:", profile);
      const saveResult = await saveUserProfile(profile);
      console.log("Save result:", saveResult);
      
      // Get recommendations (streamed)
      setRecommendation("");
      await askStream({ prompt: `Based on my role (${profile.role}), experience (${profile.experience_level}), skills (${profile.skills.join(", ")}), and goals (${profile.goals}), recommend the best certifications and why.` }, (output) => setRecommendation(output));
      
      setAutoFillStatus("Profile saved! Your details will be auto-filled next time.");
      setTimeout(() => setAutoFillStatus(""), 3000);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setAutoFillStatus("Error getting recommendations. Please try again.");
      setTimeout(() => setAutoFillStatus(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!studyPlan.certification_name || studyPlan.current_skills.length === 0) return;
    
    try {
      setLoading(true);
      setStudyPlanResult("");
      await askStream({ prompt: `Generate a personalized study plan for the ${studyPlan.certification_name} certification. My current skills: ${studyPlan.current_skills.join(", ")}. I can study ${studyPlan.study_time} hours/week. Target date: ${studyPlan.target_date}.` }, (output) => setStudyPlanResult(output));
    } catch (error) {
      console.error("Error generating study plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    if (!studyPlan.certification_name) return;
    
    try {
      setLoading(true);
      setSimulation("");
      await askStream({ prompt: `Simulate a certification interview for ${studyPlan.certification_name}. Ask me realistic questions and provide feedback.` }, (output) => setSimulation(output));
    } catch (error) {
      console.error("Error starting simulation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to parse skills from text (handles commas, semicolons, etc.)
  const parseSkillsFromText = (text) => {
    return text
      .split(/[,;]/) // Split by comma or semicolon
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const addSkill = (skill) => {
    // Split by comma and trim each skill
    const skillsToAdd = parseSkillsFromText(skill);
    
    skillsToAdd.forEach(singleSkill => {
      if (singleSkill && !profile.skills.includes(singleSkill)) {
        setProfile(prev => ({
          ...prev,
          skills: [...prev.skills, singleSkill]
        }));
      }
    });
  };

  const removeSkill = (index) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addCurrentSkill = (skill) => {
    // Split by comma and trim each skill
    const skillsToAdd = parseSkillsFromText(skill);
    
    skillsToAdd.forEach(singleSkill => {
      if (singleSkill && !studyPlan.current_skills.includes(singleSkill)) {
        setStudyPlan(prev => ({
          ...prev,
          current_skills: [...prev.current_skills, singleSkill]
        }));
      }
    });
  };

  const removeCurrentSkill = (index) => {
    setStudyPlan(prev => ({
      ...prev,
      current_skills: prev.current_skills.filter((_, i) => i !== index)
    }));
  };

  // Function to sync skills from profile to study plan
  const syncSkillsToStudyPlan = () => {
    if (profile.skills.length > 0) {
      setStudyPlan(prev => ({
        ...prev,
        current_skills: [...new Set([...prev.current_skills, ...profile.skills])]
      }));
    }
  };

  // Handle tab switching with skill sync
  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    
    // When switching to study plan, sync skills from profile
    if (tabKey === "study-plan") {
      syncSkillsToStudyPlan();
    }
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text, marginBottom: 24 }}>Certification Path Recommendation</h2>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        marginBottom: 24,
        borderBottom: `1px solid ${colors.border}`
      }}>
        {[
          { key: "recommend", label: "Get Recommendations", icon: "🎯", title: "Get AI-powered certification suggestions based on your role, skills, and goals." },
          { key: "study-plan", label: "Study Plan", icon: "📚", title: "Generate a personalized weekly study plan for your selected certification." },
          { key: "simulation", label: "Practice Test", icon: "🧪", title: "Practice with realistic certification interview questions and scenarios." },
          { key: "history", label: "History", icon: "🕑", title: "View your previous study plans and revisit details." }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabSwitch(tab.key)}
            title={tab.title}
            style={{
              background: activeTab === tab.key ? colors.primary : "transparent",
              color: activeTab === tab.key ? "#fff" : colors.text,
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 16
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendation Tab */}
      {activeTab === "recommend" && (
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24, 
          boxShadow: colors.shadow,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Get AI-Powered Certification Recommendations</h3>
          
          {/* Auto-fill Status Message */}
          {autoFillStatus && (
            <div style={{
              padding: "8px 12px",
              marginBottom: 16,
              borderRadius: 6,
              fontSize: 14,
              background: autoFillStatus.includes("Error") ? "#ffebee" : colors.primaryLight,
              color: autoFillStatus.includes("Error") ? "#d32f2f" : colors.primary,
              border: `1px solid ${autoFillStatus.includes("Error") ? "#d32f2f" : colors.primary}`
            }}>
              {autoFillStatus}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
                Your Role
              </label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Backend Developer, DevOps Engineer"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 16
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
                Experience Level
              </label>
              <select
                value={profile.experience_level}
                onChange={(e) => setProfile(prev => ({ ...prev, experience_level: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 16
                }}
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
              Current Skills
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={currentSkillInput}
                onChange={(e) => setCurrentSkillInput(e.target.value)}
                placeholder="Add a skill... (or paste multiple skills separated by commas)"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addSkill(e.target.value);
                    setCurrentSkillInput("");
                  }
                }}
                onPaste={(e) => {
                  // Handle paste events for multiple skills
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.includes(',') || pastedText.includes(';')) {
                    e.preventDefault();
                    addSkill(pastedText);
                    setCurrentSkillInput("");
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 14
                }}
              />
              <button
                onClick={() => {
                  if (currentSkillInput.trim()) {
                    addSkill(currentSkillInput);
                    setCurrentSkillInput("");
                  }
                }}
                style={{
                  background: colors.primaryLight,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
                title="Add the skills you typed"
              >
                🧪 Quick Add
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.primary,
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
              Career Goals
            </label>
            <textarea
              value={profile.goals}
              onChange={(e) => setProfile(prev => ({ ...prev, goals: e.target.value }))}
              placeholder="Describe your career goals and what you want to achieve..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                fontSize: 16,
                resize: "vertical"
              }}
            />
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={loading || !profile.role || !profile.goals}
            title="Get AI-powered certification recommendations based on your profile and goals"
            style={{
              background: colors.buttonPrimary,
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 16,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Getting Recommendations..." : "Get Recommendations"}
          </button>

          {recommendation && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>AI Recommendations</h4>
              <div style={{ 
                color: colors.textSecondary, 
                fontSize: 14, 
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>
                {recommendation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Study Plan Tab */}
      {activeTab === "study-plan" && (
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24, 
          boxShadow: colors.shadow,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Generate Personalized Study Plan</h3>
          
          {/* Auto-fill Status Message for Study Plan */}
          {profile.skills.length > 0 && studyPlan.current_skills.length > 0 && (
            <div style={{
              padding: "8px 12px",
              marginBottom: 16,
              borderRadius: 6,
              fontSize: 14,
              background: colors.primaryLight,
              color: colors.primary,
              border: `1px solid ${colors.primary}`
            }}>
              ✅ Skills auto-filled from your profile: {profile.skills.join(", ")}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
                Certification Name
              </label>
              <input
                type="text"
                value={studyPlan.certification_name}
                onChange={(e) => setStudyPlan(prev => ({ ...prev, certification_name: e.target.value }))}
                placeholder="e.g., AWS Solutions Architect Associate"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 16
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
                Study Time (hours/week)
              </label>
              <input
                type="number"
                value={studyPlan.study_time}
                onChange={(e) => setStudyPlan(prev => ({ ...prev, study_time: parseInt(e.target.value) || 0 }))}
                min="1"
                max="40"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 16
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
              Target Completion Date
            </label>
            <input
              type="date"
              value={studyPlan.target_date}
              onChange={(e) => setStudyPlan(prev => ({ ...prev, target_date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                fontSize: 16
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
              Current Skills (for this certification)
            </label>
            
            {/* Sync Skills Button */}
            {profile.skills.length > 0 && (
              <button
                onClick={syncSkillsToStudyPlan}
                style={{
                  background: colors.primaryLight,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                  marginBottom: 8
                }}
              >
                🔄 Sync Skills from Profile ({profile.skills.length} skills)
              </button>
            )}
            
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Add a skill... (or paste multiple skills separated by commas)"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addCurrentSkill(e.target.value);
                    e.target.value = "";
                  }
                }}
                onPaste={(e) => {
                  // Handle paste events for multiple skills
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.includes(',') || pastedText.includes(';')) {
                    e.preventDefault();
                    addCurrentSkill(pastedText);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {studyPlan.current_skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {skill}
                  <button
                    onClick={() => removeCurrentSkill(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.primary,
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateStudyPlan}
            disabled={loading || !studyPlan.certification_name || !studyPlan.target_date}
            title="Generate a personalized study plan for your selected certification"
            style={{
              background: colors.buttonSuccess,
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 16,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Generating Study Plan..." : "Generate Study Plan"}
          </button>

          {studyPlanResult && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>Your Study Plan</h4>
              <div style={{ 
                color: colors.textSecondary, 
                fontSize: 14, 
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>
                {studyPlanResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulation Tab */}
      {activeTab === "simulation" && (
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 24, 
          boxShadow: colors.shadow,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Practice Certification Interview</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
              Certification to Practice
            </label>
            <input
              type="text"
              value={studyPlan.certification_name}
              onChange={(e) => setStudyPlan(prev => ({ ...prev, certification_name: e.target.value }))}
              placeholder="e.g., AWS Solutions Architect Associate"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                fontSize: 16
              }}
            />
          </div>

          <button
            onClick={handleStartSimulation}
            disabled={loading || !studyPlan.certification_name}
            title="Start a realistic certification interview simulation to test your knowledge"
            style={{
              background: colors.buttonPrimary,
              color: "#fff",
              border: 0,
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Starting Simulation..." : "Start Practice Test"}
          </button>

          {simulation && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>Certification Interview</h4>
              <div style={{ 
                color: colors.textSecondary, 
                fontSize: 14, 
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>
                {simulation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div style={{ background: colors.cardBackground, borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: colors.shadow, border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: colors.text, marginTop: 0 }}>Study Plan History</h3>
          {history.length === 0 ? (
            <div style={{ color: colors.textSecondary }}>No study plans found.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {history.map(plan => (
                <li key={plan._id} style={{ marginBottom: 16, borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{plan.certification_name}</strong>
                      <span style={{ color: colors.textSecondary, marginLeft: 12, fontSize: 13 }}>
                        {plan.created_at ? new Date(plan.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedPlan(expandedPlan === plan._id ? null : plan._id)}
                      style={{
                        background: colors.buttonSecondary,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 6,
                        padding: "6px 16px",
                        cursor: "pointer",
                        fontSize: 14
                      }}
                    >
                      {expandedPlan === plan._id ? "Hide" : "View"}
                    </button>
                  </div>
                  {expandedPlan === plan._id && (
                    <div style={{ marginTop: 12, background: colors.primaryLight, borderRadius: 8, padding: 16, color: colors.textSecondary, fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {plan.study_plan}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {autoFillStatus && (
        <div style={{ 
          background: colors.primaryLight, 
          color: colors.primary, 
          padding: "12px 20px", 
          borderRadius: 8, 
          marginTop: 24, 
          border: `1px solid ${colors.border}`
        }}>
          {autoFillStatus}
        </div>
      )}
    </div>
  );
}

export default Certifications; 