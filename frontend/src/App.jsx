// React app skeleton for AI Workplace Learning
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Concepts from "./Concepts";
import MicroLesson from "./MicroLesson";
import Recommendation from "./Recommendation";
import Simulator from "./Simulator";
import Dashboard from "./Dashboard";
import WebSearch from "./WebSearch";
import CareerCoach from "./CareerCoach";
import SkillsForecast from "./SkillsForecast";
import TeamDynamics from "./TeamDynamics";
import Certifications from "./Certifications";
import GlobalSearch from "./GlobalSearch";
import RunTest from "./RunTest";
import PresentationAgent from "./PresentationAgent";
import AITrainingModule from "./AITrainingModule";
import BabelLibrary from './BabelLibrary';
import APIConfig from './APIConfig';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './Auth';
import Sidebar from './Sidebar';
import { ThemeProvider, useTheme } from './ThemeContext';
import CommandBar from "./CommandBar";
import VideoLesson from "./VideoLesson";
import IdeaLog from "./IdeaLog";
import FeatureRoadmap from "./FeatureRoadmap";
import FutureApp from "./FutureApp";
import AIStudyBuddy from "./AIStudyBuddy";
import KnowledgeMap from "./KnowledgeMap";
import TopBarLanguageMenu from "./components/TopBarLanguageMenu";
import RepoAnalyzer from "./RepoAnalyzer";
import AgentCursorAI from "./AgentCursorAI";
import LearningRepo from "./LearningRepo";
import DocumentsAnalyzer from "./DocumentsAnalyzer";
import LearningDocument from "./LearningDocument";
import AgenticRAG from "./AgenticRAG";
import AgenticRAGDocument from "./AgenticRAGDocument";
import EAHome from "./ea/EAHome";
import ProcessDesigner from "./ea/ProcessDesigner";
import SecurityPanel from "./SecurityPanel";
import CatalogManager from "./ea/CatalogManager";
import AgentOpsStudio from "./AgentOpsStudio/AgentOpsStudio";
import RobomindClinic from "./RobomindClinic/RobomindClinicWithTabs";
import AgentTheoryDocs from "./components/AgentTheoryDocs/AgentTheoryDocs";
import AIComplianceAgent from "./AIComplianceAgent";
import AIProductivityAgent from "./AIProductivityAgent";
import EASecondBrain from "./EASecondBrain";
import SalesAssistant from "./SalesAssistant";
import Cybersecurity from "./cyber/Cybersecurity";

function AppContent() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState("dashboard");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isDark, toggleTheme, colors } = useTheme();
  const [activeModule, setActiveModule] = useState(null);
  const [userQuery, setUserQuery] = useState("");
  const [isAIFullScreen, setIsAIFullScreen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Listen for navigation events from Babel Library
  useEffect(() => {
    const handleNavigateToModule = (event) => {
      const { module, resourceId, resourceTitle, targetPage, action, autoExpand } = event.detail;
      console.log(`🚀 Navigating to ${module} with resource ID: ${resourceId}, title: "${resourceTitle}", target page: ${targetPage}, action: ${action}, autoExpand: ${autoExpand}`);
      
      // Set the section to navigate to the module
      setSection(module);
      setActiveModule(null); // Clear active module to use section navigation
      
      // Store additional navigation info for the module to use
      if (resourceId) {
        localStorage.setItem('editResourceId', resourceId);
      }
      if (resourceTitle) {
        localStorage.setItem('editResourceTitle', resourceTitle);
      }
      if (targetPage) {
        localStorage.setItem('targetPage', targetPage);
      }
      if (action) {
        localStorage.setItem('action', action);
      }
      if (autoExpand) {
        localStorage.setItem('autoExpand', autoExpand);
      }
    };

    window.addEventListener('navigateToModule', handleNavigateToModule);
    return () => window.removeEventListener('navigateToModule', handleNavigateToModule);
  }, []);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchNavigate = (sectionId) => {
    setSection(sectionId);
  };

  const handleRoute = (module, query) => {
    console.log(`🚀 handleRoute called with:`, module, query);
    setUserQuery(query);
    setActiveModule(module);
    setIsAIFullScreen(false); // Exit full-screen mode when a module is selected
    console.log(`✅ State updated: activeModule = ${module}, userQuery = ${query}`);
  };

  const handleAIFullScreen = () => {
    setIsAIFullScreen(true);
    setActiveModule(null);
  };

  const handleBackToApp = () => {
    setIsAIFullScreen(false);
    setActiveModule(null);
  };

  return (
    <div style={{ 
      fontFamily: "sans-serif", 
      background: colors.background, 
      minHeight: "100vh", 
      padding: 0, 
      display: "flex",
      color: colors.text,
      overflowX: "hidden",
      width: "100vw",
      boxSizing: "border-box"
    }}>
      {!isAIFullScreen && <Sidebar selected={section} onSelect={(key) => { setSection(key); setActiveModule(null); }} />}
      <div style={{ 
        flex: 1, 
        minWidth: 0, 
        maxWidth: isAIFullScreen ? "100vw" : "calc(100vw - 220px)", // Full width when AI full screen
        overflowX: "hidden"
      }}>
        <header style={{ 
          background: colors.primary, 
          color: "#fff", 
          padding: "1rem 0", 
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
          position: isAIFullScreen ? "fixed" : "relative",
          top: isAIFullScreen ? 0 : "auto",
          left: isAIFullScreen ? 0 : "auto",
          right: isAIFullScreen ? 0 : "auto",
          zIndex: isAIFullScreen ? 1000 : "auto"
        }}>
          <div style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 1rem",
            maxWidth: "100%",
            boxSizing: "border-box"
          }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{isAIFullScreen ? `🤖 ${t('askAI.title')}` : "Workplace Learning With AI"}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Search Button */}
              {!isAIFullScreen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s"
                  }}
                  title="Search all sections (Ctrl+K)"
                >
                  🔍
                </button>
              )}
              {/* Ask AI Button */}
              <button
                onClick={handleAIFullScreen}
                style={{
                  background: isAIFullScreen ? "rgba(255,255,255,0.2)" : "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "all 0.2s"
                }}
                title={t('askAI.title')}
              >
                🤖
              </button>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  transition: "all 0.2s"
                }}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? "☀️" : "🌙"}
              </button>
              {/* Language Selector */}
              <TopBarLanguageMenu />
            </div>
          </div>
        </header>
        {isAIFullScreen ? (
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 80px)",
            padding: "2rem",
            paddingTop: "calc(2rem + 60px)", // Add space for fixed header
            overflow: "hidden"
          }}>
            {/* Left Side Background Messages */}
            <div
              style={{
                position: "absolute",
                left: "2rem",
                top: "20%",
                fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                fontWeight: 600,
                color: "rgba(135, 206, 235, 0.6)", // Light blue with reduced intensity
                lineHeight: 1.5,
                zIndex: 0,
                pointerEvents: "none",
                userSelect: "none",
                maxWidth: "300px",
                textAlign: "left",
                textShadow: "0 1px 3px rgba(0,0,0,0.1)",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "20px",
                borderRadius: "12px",
                border: "2px solid rgba(135, 206, 235, 0.2)"
              }}
            >
              <strong>{t('askAI.quotes.ignacio')}</strong>
              <br /><br />
              <span style={{ fontStyle: "italic", fontSize: "1em", color: "rgba(135, 206, 235, 0.8)" }}>— Ignacio Tejera</span>
            </div>
            
            {/* Top Right Background Message */}
            <div
              style={{
                position: "absolute",
                right: "2rem",
                top: "15%",
                fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                fontWeight: 600,
                color: "rgba(135, 206, 235, 0.6)", // Light blue with reduced intensity
                lineHeight: 1.5,
                zIndex: 0,
                pointerEvents: "none",
                userSelect: "none",
                maxWidth: "320px",
                textAlign: "right",
                textShadow: "0 1px 3px rgba(0,0,0,0.1)",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "20px",
                borderRadius: "12px",
                border: "2px solid rgba(135, 206, 235, 0.2)"
              }}
            >
              <strong>{t('askAI.quotes.jensen')}</strong>
              <br /><br />
              <span style={{ fontStyle: "italic", fontSize: "1em", color: "rgba(135, 206, 235, 0.8)" }}>{t('askAI.quotes.jensenAuthor')}</span>
            </div>
            {/* Main Content */}
            <div style={{
              maxWidth: 600,
              width: "100%",
              textAlign: "center",
              zIndex: 1
            }}>
              {!user && (
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                  <h2 style={{ marginBottom: "1rem", fontSize: "2rem", color: colors.text }}>
                    🤖 {t('askAI.title')}
                  </h2>
                  <p style={{ marginBottom: "2rem", fontSize: "1rem", color: colors.text, opacity: 0.8 }}>
                    {t('askAI.subtitle')}
                  </p>
                  <Auth user={user} setUser={setUser} />
                  <p style={{ color: colors.textSecondary, marginTop: 12 }}>{t('askAI.signInMessage')}</p>
                  <button
                    onClick={handleBackToApp}
                    style={{
                      marginTop: "2rem",
                      padding: "0.5rem 1rem",
                      background: "transparent",
                      border: `1px solid ${colors.primary}`,
                      color: colors.primary,
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    {t('askAI.backToApp')}
                  </button>
                </div>
              )}
              <div style={{
                maxWidth: 600,
                width: "100%",
                textAlign: "center"
              }}>
                {user && (
                  <>
                    <h2 style={{ marginBottom: "2rem", fontSize: "2rem", color: colors.text }}>
                      🤖 {t('askAI.title')}
                    </h2>
                    <p style={{ marginBottom: "2rem", fontSize: "1rem", color: colors.text, opacity: 0.8 }}>
                      {t('askAI.subtitle')}
                    </p>
                    <CommandBar onRoute={handleRoute} inputPlaceholder={t('askAI.inputPlaceholder')} />
                    <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
                      <div style={{ padding: "0.5rem 1rem", background: colors.primaryLight, borderRadius: "20px", fontSize: "0.9rem", color: colors.primary }}>
                        💡 "{t('askAI.suggestions.videoLesson')}"
                      </div>
                      <div style={{ padding: "0.5rem 1rem", background: colors.primaryLight, borderRadius: "20px", fontSize: "0.9rem", color: colors.primary }}>
                        💡 "{t('askAI.suggestions.microLesson')}"
                      </div>
                      <div style={{ padding: "0.5rem 1rem", background: colors.primaryLight, borderRadius: "20px", fontSize: "0.9rem", color: colors.primary }}>
                        💡 "{t('askAI.suggestions.whatNext')}"
                      </div>
                    </div>
                    <button
                      onClick={handleBackToApp}
                      style={{
                        marginTop: "2rem",
                        padding: "0.5rem 1rem",
                        background: "transparent",
                        border: `1px solid ${colors.primary}`,
                        color: colors.primary,
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      {t('askAI.backToApp')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            width: "100%", 
            padding: "0.5rem", 
            background: colors.cardBackground, 
            borderRadius: 12, 
            boxShadow: colors.shadow, 
            margin: 0,
            minHeight: "calc(100vh - 80px)",
            overflowX: "hidden",
            boxSizing: "border-box",
            maxWidth: "100%"
          }}>
            <Auth user={user} setUser={setUser} />
            {/* Debug info */}
            {console.log(`🔍 Current state: activeModule=${activeModule}, section=${section}`)}
            {/* Render the routed module if set, otherwise fall back to section navigation */}
            {activeModule === 'ai-concepts' && <Concepts query={userQuery} />}
            {activeModule === 'micro-lessons' && <MicroLesson query={userQuery} user={user} />}
            {activeModule === 'simulations' && <Simulator query={userQuery} />}
            {activeModule === 'recommendation' && <Recommendation query={userQuery} />}
            {activeModule === 'ai-career-coach' && <CareerCoach query={userQuery} />}
            {activeModule === 'skills-forecast' && <SkillsForecast query={userQuery} />}
            {activeModule === 'certifications' && <Certifications query={userQuery} />}
            {activeModule === 'video-lessons' && <VideoLesson query={userQuery} user={user} />}
            {activeModule === 'presentation-agent' && <PresentationAgent query={userQuery} />}
            {activeModule === 'ai-study-buddy' && <AIStudyBuddy user={user} query={userQuery} />}
            {activeModule === 'ai-learning' && <AITrainingModule query={userQuery} />}
            {activeModule === 'babel-library' && <BabelLibrary />}
        {activeModule === 'api-config' && <APIConfig />}
            {!activeModule && section === "dashboard" && <Dashboard user={user} onSectionSelect={setSection} />}
            {!activeModule && section === "ai-concepts" && <Concepts />}
            {!activeModule && section === "micro-lessons" && <MicroLesson user={user} />}
            {!activeModule && section === "recommendation" && <Recommendation />}
            {!activeModule && section === "simulations" && <Simulator />}
            {!activeModule && section === "web-search" && <WebSearch />}
            {!activeModule && section === "team-dynamics" && <TeamDynamics />}
            {!activeModule && section === "certifications" && <Certifications />}
            {!activeModule && section === "ai-career-coach" && <CareerCoach />}
            {!activeModule && section === "skills-forecast" && <SkillsForecast />}
            {!activeModule && section === "ai-learning" && <AITrainingModule user={user} />}
            {!activeModule && section === "babel-library" && <BabelLibrary />}
        {!activeModule && section === "api-config" && <APIConfig />}
            {!activeModule && section === "video-lessons" && <VideoLesson user={user} />}
            {!activeModule && section === "knowledge-map" && <KnowledgeMap />}
            {!activeModule && section === "repo-analyzer" && <RepoAnalyzer />}
            {!activeModule && section === "repository-analyzer" && <RepoAnalyzer />}
            {!activeModule && section === "agent-cursor-ai" && <AgentCursorAI />}
            {!activeModule && section === "learning-repo" && <LearningRepo />}
            {!activeModule && section === "documents-analyzer" && <DocumentsAnalyzer />}
            {!activeModule && section === "learning-document" && <LearningDocument />}
{!activeModule && section === "agentic-rag" && <AgenticRAG />}
{!activeModule && section === "agentic-rag-document" && <AgenticRAGDocument />}
            {!activeModule && section === "ea-home" && <EAHome />}
            {!activeModule && section === "process-designer" && <ProcessDesigner />}
            {!activeModule && section === "catalog-manager" && <CatalogManager />}
            {!activeModule && section === "agentops-studio" && <AgentOpsStudio />}
            {!activeModule && section === "robomind-clinic" && <RobomindClinic />}
            {!activeModule && section === "agent-theory-docs" && <AgentTheoryDocs />}
            {!activeModule && section === "ai-compliance-agent" && <AIComplianceAgent />}
            {!activeModule && section === "ai-productivity-agent" && <AIProductivityAgent />}
            {!activeModule && section === "ea-second-brain" && <EASecondBrain />}
            {!activeModule && section === "sales-assistant" && <SalesAssistant />}
            {!activeModule && section === "cybersecurity" && <Cybersecurity />}
            {!activeModule && section === "presentation-agent" && <PresentationAgent />}
            {!activeModule && section === "ai-study-buddy" && <AIStudyBuddy user={user} />}
            {!activeModule && section === "run-test" && <RunTest />}
            {!activeModule && section === "security" && <SecurityPanel />}
            {!activeModule && section === "idea-log" && <IdeaLog />}
            {!activeModule && section === "feature-roadmap" && <FeatureRoadmap />}
            {!activeModule && section === "future-app" && <FutureApp onSectionSelect={setSection} />}
{!activeModule && section === "help" && <div style={{ padding: "2rem", textAlign: "center" }}>Help section - Select a specific tool from the sidebar</div>}
{!activeModule && section === "learning-modules" && <div style={{ padding: "2rem", textAlign: "center" }}>Learning Modules - Select a specific module from the sidebar</div>}
{!activeModule && section === "future" && <div style={{ padding: "2rem", textAlign: "center" }}>Future section - Select a specific feature from the sidebar</div>}
          </div>
        )}
      </div>
      
      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App; 