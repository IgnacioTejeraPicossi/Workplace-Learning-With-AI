import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";
import { getUserProfile, saveUserProfile, askStream, saveCertification, fetchCertifications } from "./api";

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
  const [certifications, setCertifications] = useState([]);
  const [autoExpandTarget, setAutoExpandTarget] = useState(null);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const experienceLevels = useMemo(
    () => [
      { value: "beginner", label: t("certificationsModule.recommend.experience.beginner") },
      { value: "intermediate", label: t("certificationsModule.recommend.experience.intermediate") },
      { value: "advanced", label: t("certificationsModule.recommend.experience.advanced") }
    ],
    [t]
  );

  const tabsConfig = useMemo(
    () => [
      {
        key: "recommend",
        label: t("certificationsModule.tabs.recommend.label"),
        icon: "🎯",
        title: t("certificationsModule.tabs.recommend.title")
      },
      {
        key: "study-plan",
        label: t("certificationsModule.tabs.studyPlan.label"),
        icon: "📚",
        title: t("certificationsModule.tabs.studyPlan.title")
      },
      {
        key: "simulation",
        label: t("certificationsModule.tabs.simulation.label"),
        icon: "🧪",
        title: t("certificationsModule.tabs.simulation.title")
      },
      {
        key: "history",
        label: t("certificationsModule.tabs.history.label"),
        icon: "🕑",
        title: t("certificationsModule.tabs.history.title")
      }
    ],
    [t]
  );

  // Load certifications from MongoDB (used by BabelLibrary and for refreshing after save)
  const loadCertifications = async () => {
    try {
      const data = await fetchCertifications();
      if (data) {
        setCertifications(data);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
    }
  };

  // Fetch study plan history from MongoDB
  const fetchHistory = async () => {
    try {
      // Use the certifications from MongoDB instead of the old endpoint
      const data = await fetchCertifications();
      if (data) {
        // Transform MongoDB data to match the expected format
        const transformedHistory = data.map(cert => ({
          id: cert.id,
          certification_name: cert.title,
          created_at: cert.created_at,
          status: cert.status,
          level: cert.level,
          topics: cert.topics,
          study_plan: cert.study_plan || ""  // Translated fallback at render time
        }));
        setHistory(transformedHistory);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  };

  useEffect(() => {
    // Auto-fill profile from saved user profile
    async function fetchUserProfile() {
      try {
        setAutoFillStatus(t("certificationsModule.profileStatus.loading"));
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
          
          setAutoFillStatus(t("certificationsModule.profileStatus.loaded"));
          setTimeout(() => setAutoFillStatus(""), 3000);
        } else {
          console.log("No profile found in response:", res);
          setAutoFillStatus(t("certificationsModule.profileStatus.noProfile"));
          setTimeout(() => setAutoFillStatus(""), 5000);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
        setAutoFillStatus(t("certificationsModule.profileStatus.loadError"));
        setTimeout(() => setAutoFillStatus(""), 5000);
      }
    }
    fetchUserProfile();
    
    // Load certifications from MongoDB
    loadCertifications();
    
    // Fetch study plan history from MongoDB
    fetchHistory();
    // Intentionally run once on mount; `t` is stable for initial locale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation intelligence from Babel Library
  useEffect(() => {
    // Check for navigation instructions from Babel Library
    const checkNavigationInstructions = () => {
      const targetPage = localStorage.getItem('targetPage');
      const action = localStorage.getItem('action');
      const resourceId = localStorage.getItem('editResourceId');
      const resourceTitle = localStorage.getItem('editResourceTitle');
      const autoExpand = localStorage.getItem('autoExpand');
      
      console.log(`🔍 Checking for navigation instructions:`, {
        targetPage,
        action,
        resourceId,
        resourceTitle,
        autoExpand
      });
      
      if (targetPage && action && resourceId) {
        console.log(`🎯 Navigation instructions found:`, {
          targetPage,
          action,
          resourceId,
          resourceTitle,
          autoExpand
        });
        
        // Navigate to the specified tab
        if (targetPage === 'history') {
          setActiveTab('history');
          
          // If autoExpand is enabled, find and expand the specific certification
          if (autoExpand === 'true' && resourceTitle) {
            // Set a flag to auto-expand after certifications are loaded
            setAutoExpandTarget({ id: resourceId, title: resourceTitle });
          }
        }
        
        // Clear the navigation instructions from localStorage
        localStorage.removeItem('targetPage');
        localStorage.removeItem('editResourceId');
        localStorage.removeItem('editResourceTitle');
        localStorage.removeItem('autoExpand');
        
        console.log(`🧹 Navigation instructions cleared from localStorage`);
      } else {
        console.log(`ℹ️ No navigation instructions found in localStorage`);
      }
    };
    
    // Check for navigation instructions after a short delay to ensure component is fully loaded
    const timer = setTimeout(checkNavigationInstructions, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-expand specific certification when certifications are loaded
  useEffect(() => {
    if (autoExpandTarget && certifications.length > 0) {
      console.log(`🔍 Looking for certification to auto-expand:`, autoExpandTarget);
      
      // Find the certification by title (more reliable than ID)
      const targetCert = certifications.find(cert => 
        cert.title.toLowerCase().includes(autoExpandTarget.title.toLowerCase()) ||
        autoExpandTarget.title.toLowerCase().includes(cert.title.toLowerCase())
      );
      
      if (targetCert) {
        console.log(`✅ Found certification to expand:`, targetCert);
        
        // Find the corresponding history entry
        const historyEntry = history.find(h => 
          h.certification_name === targetCert.title
        );
        
        if (historyEntry) {
          console.log(`📚 Expanding history entry:`, historyEntry);
          setExpandedPlan(historyEntry.id);
          
          // Show success message briefly
          setAutoFillStatus(t("certificationsModule.profileStatus.autoExpanded", { title: targetCert.title }));
          setTimeout(() => setAutoFillStatus(""), 3000);
          
          // Scroll to the expanded certification after a short delay
          setTimeout(() => {
            const expandedElement = document.querySelector(`[data-plan-id="${historyEntry.id}"]`);
            if (expandedElement) {
              expandedElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 100);
          
          // Clear the auto-expand target
          setAutoExpandTarget(null);
        }
      }
    }
  }, [certifications, history, autoExpandTarget, t]);

  // Additional navigation check when activeTab changes
  useEffect(() => {
    if (activeTab === 'history' && autoExpandTarget) {
      console.log(`🔄 Active tab changed to history, checking for auto-expand target:`, autoExpandTarget);
      // The auto-expand will be handled by the previous useEffect when certifications are loaded
    }
  }, [activeTab, autoExpandTarget]);

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
      
      setAutoFillStatus(t("certificationsModule.profileStatus.saved"));
      setTimeout(() => setAutoFillStatus(""), 3000);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setAutoFillStatus(t("certificationsModule.profileStatus.recommendError"));
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
      
      // Generate the study plan with AI FIRST
      let generatedPlan = "";
      await askStream({ 
        prompt: `Generate a personalized study plan for the ${studyPlan.certification_name} certification. My current skills: ${studyPlan.current_skills.join(", ")}. I can study ${studyPlan.study_time} hours/week. Target date: ${studyPlan.target_date}.` 
      }, (output) => {
        generatedPlan = output; // Store the generated plan
        setStudyPlanResult(output); // Update UI
      });
      
      // NOW save the certification to MongoDB with the COMPLETE study plan
      const certificationData = {
        title: studyPlan.certification_name,
        description: `Study plan for ${studyPlan.certification_name} certification`,
        level: profile.experience_level,
        duration: studyPlan.study_time ? `${studyPlan.study_time} hours/week` : 'Flexible',
        topics: studyPlan.current_skills,
        status: 'in_progress',
        study_plan: generatedPlan  // Use the stored generated plan
      };
      
      console.log('Saving certification with study plan:', certificationData);
      const savedCert = await saveCertification(certificationData);
      console.log('Certification saved:', savedCert);
      
      // Reload certifications to update the list in both Certifications and Babel Library
      await loadCertifications();
      await fetchHistory(); // Also refresh the history list
      
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
      <h2 style={{ color: colors.text, marginBottom: 24 }}>{t("certificationsModule.pageTitle")}</h2>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        gap: 8, 
        marginBottom: 24,
        borderBottom: `1px solid ${colors.border}`
      }}>
        {tabsConfig.map(tab => (
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
          <h3 style={{ color: colors.text, marginTop: 0 }}>{t("certificationsModule.recommend.sectionTitle")}</h3>
          
          {/* Auto-fill Status Message */}
          {autoFillStatus && (
            <div style={{
              padding: "8px 12px",
              marginBottom: 16,
              borderRadius: 6,
              fontSize: 14,
              background: (autoFillStatus.includes("Error") || autoFillStatus.includes("Feil")) ? "#ffebee" : colors.primaryLight,
              color: (autoFillStatus.includes("Error") || autoFillStatus.includes("Feil")) ? "#d32f2f" : colors.primary,
              border: `1px solid ${(autoFillStatus.includes("Error") || autoFillStatus.includes("Feil")) ? "#d32f2f" : colors.primary}`
            }}>
              {autoFillStatus}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
                {t("certificationsModule.recommend.yourRole")}
              </label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                placeholder={t("certificationsModule.recommend.rolePlaceholder")}
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
                {t("certificationsModule.recommend.experienceLevel")}
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
              {t("certificationsModule.recommend.currentSkills")}
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={currentSkillInput}
                onChange={(e) => setCurrentSkillInput(e.target.value)}
                placeholder={t("certificationsModule.recommend.skillPlaceholder")}
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
                title={t("certificationsModule.recommend.quickAddTitle")}
              >
                {t("certificationsModule.recommend.quickAdd")}
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
              {t("certificationsModule.recommend.careerGoals")}
            </label>
            <textarea
              value={profile.goals}
              onChange={(e) => setProfile(prev => ({ ...prev, goals: e.target.value }))}
              placeholder={t("certificationsModule.recommend.goalsPlaceholder")}
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
            title={t("certificationsModule.recommend.getRecommendationsTitle")}
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
            {loading ? t("certificationsModule.recommend.gettingRecommendations") : t("certificationsModule.recommend.getRecommendations")}
          </button>

          {recommendation && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>{t("certificationsModule.recommend.aiRecommendations")}</h4>
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
          <h3 style={{ color: colors.text, marginTop: 0 }}>{t("certificationsModule.studyPlan.sectionTitle")}</h3>
          
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
              {t("certificationsModule.studyPlan.skillsAutoFilled", { skills: profile.skills.join(", ") })}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
                {t("certificationsModule.studyPlan.certificationName")}
              </label>
              <input
                type="text"
                value={studyPlan.certification_name}
                onChange={(e) => setStudyPlan(prev => ({ ...prev, certification_name: e.target.value }))}
                placeholder={t("certificationsModule.studyPlan.certPlaceholder")}
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
                {t("certificationsModule.studyPlan.studyTimePerWeek")}
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
              {t("certificationsModule.studyPlan.targetDate")}
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
              {t("certificationsModule.studyPlan.currentSkillsForCert")}
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
                {t("certificationsModule.studyPlan.syncSkills", { count: profile.skills.length })}
              </button>
            )}
            
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder={t("certificationsModule.recommend.skillPlaceholder")}
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
            title={t("certificationsModule.studyPlan.generateStudyPlanTitle")}
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
            {loading ? t("certificationsModule.studyPlan.generatingStudyPlan") : t("certificationsModule.studyPlan.generateStudyPlan")}
          </button>

          {studyPlanResult && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>{t("certificationsModule.studyPlan.yourStudyPlan")}</h4>
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
          <h3 style={{ color: colors.text, marginTop: 0 }}>{t("certificationsModule.practice.sectionTitle")}</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, color: colors.text, fontWeight: 600 }}>
              {t("certificationsModule.practice.certToPractice")}
            </label>
            <input
              type="text"
              value={studyPlan.certification_name}
              onChange={(e) => setStudyPlan(prev => ({ ...prev, certification_name: e.target.value }))}
              placeholder={t("certificationsModule.studyPlan.certPlaceholder")}
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
            title={t("certificationsModule.practice.startPracticeTitle")}
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
            {loading ? t("certificationsModule.practice.startingSimulation") : t("certificationsModule.practice.startPractice")}
          </button>

          {simulation && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: colors.primaryLight, 
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ color: colors.text, marginTop: 0, marginBottom: 12 }}>{t("certificationsModule.practice.interviewHeading")}</h4>
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
          <h3 style={{ color: colors.text, marginTop: 0 }}>{t("certificationsModule.history.sectionTitle")}</h3>
          
          {/* Navigation status message */}
          {autoExpandTarget && (
            <div style={{ 
              background: colors.primaryLight, 
              color: colors.primary, 
              padding: "12px 16px", 
              borderRadius: 8, 
              marginBottom: 16, 
              border: `1px solid ${colors.primary}`,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {t("certificationsModule.history.navigatingTo", { title: autoExpandTarget.title })}
            </div>
          )}
          {history.length === 0 ? (
            <div style={{ color: colors.textSecondary }}>{t("certificationsModule.history.empty")}</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {history.map(plan => (
                <li 
                  key={plan.id} 
                  data-plan-id={plan.id}
                  style={{ marginBottom: 16, borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{plan.certification_name}</strong>
                      <span style={{ color: colors.textSecondary, marginLeft: 12, fontSize: 13 }}>
                        {plan.created_at ? new Date(plan.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
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
                      {expandedPlan === plan.id ? t("certificationsModule.history.hide") : t("certificationsModule.history.view")}
                    </button>
                  </div>
                  {expandedPlan === plan.id && (
                    <div style={{ marginTop: 12, background: colors.primaryLight, borderRadius: 8, padding: 16, color: colors.textSecondary, fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {plan.study_plan || t("certificationsModule.fallbackNoPlan")}
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