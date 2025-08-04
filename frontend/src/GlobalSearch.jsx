import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeContext";

const GlobalSearch = ({ onNavigate, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const { colors } = useTheme();

  // Define all searchable sections
  const searchableSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "View your learning progress and overview",
      icon: "🏠",
      keywords: ["dashboard", "progress", "overview", "home", "main"]
    },
    {
      id: "ai-concepts",
      title: "AI Concepts",
      description: "Explore innovative AI learning concepts",
      icon: "💡",
      keywords: ["ai", "concepts", "innovation", "ideas", "artificial intelligence"]
    },
    {
      id: "micro-lessons",
      title: "Micro-lessons",
      description: "Create and manage bite-sized learning lessons",
      icon: "📚",
      keywords: ["micro", "lessons", "learning", "education", "training", "bite-sized"]
    },
    {
      id: "video-lessons",
      title: "Video Lessons",
      description: "Learn from videos with AI-generated quizzes",
      icon: "🎥",
      keywords: ["video", "lessons", "youtube", "quiz", "multimedia"]
    },
    {
      id: "recommendation",
      title: "Recommendation",
      description: "Get personalized learning recommendations",
      icon: "⭐",
      keywords: ["recommendation", "suggestions", "personalized", "advice"]
    },
    {
      id: "simulations",
      title: "Simulations",
      description: "Practice with interactive workplace scenarios",
      icon: "🎮",
      keywords: ["simulation", "scenarios", "practice", "interactive", "workplace"]
    },
    {
      id: "web-search",
      title: "Web Search",
      description: "Search the web for up-to-date information",
      icon: "🌐",
      keywords: ["web", "search", "internet", "online", "information"]
    },
    {
      id: "team-dynamics",
      title: "Team Dynamics",
      description: "Analyze and improve team collaboration",
      icon: "👥",
      keywords: ["team", "dynamics", "collaboration", "group", "workforce"]
    },
    {
      id: "certifications",
      title: "Certifications",
      description: "Get certification recommendations and study plans",
      icon: "🏆",
      keywords: ["certification", "certificates", "study", "exams", "credentials"]
    },
    {
      id: "coach",
      title: "AI Career Coach",
      description: "Get career guidance and professional advice",
      icon: "👨‍💼",
      keywords: ["coach", "career", "guidance", "advice", "professional"]
    },
    {
      id: "skills-forecast",
      title: "Skills Forecast",
      description: "Predict future skills and career trends",
      icon: "📊",
      keywords: ["skills", "forecast", "prediction", "trends", "future"]
    },
    {
      id: "presentation-agent",
      title: "Presentation Agent",
      description: "AI-powered presentation and Q&A for demos",
      icon: "🎤",
      keywords: ["presentation", "agent", "demo", "pitch", "speech", "hackathon", "q&a"]
    },
    {
      id: "saved-lessons",
      title: "Saved Lessons",
      description: "View and manage your saved micro-lessons",
      icon: "📦",
      keywords: ["saved", "lessons", "bookmarks", "favorites", "history"]
    },
    {
      id: "idea-log",
      title: "Idea Log",
      description: "View and manage user-submitted feature ideas",
      icon: "💡",
      keywords: ["idea", "log", "feedback", "suggestions", "features"]
    },
    {
      id: "feature-roadmap",
      title: "Feature Roadmap",
      description: "Vote on and track upcoming features",
      icon: "⭐",
      keywords: ["feature", "roadmap", "vote", "upcoming", "planning"]
    },
    {
      id: "future-app",
      title: "Future App",
      description: "Explore the vision and development roadmap",
      icon: "🔮",
      keywords: ["future", "vision", "roadmap", "development", "phases"]
    },
    {
      id: "run-test",
      title: "Run Test",
      description: "Comprehensive testing suite for the application",
      icon: "🧪",
      keywords: ["test", "testing", "cypress", "manual", "api"]
    }
  ];

  // Filter results based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = searchableSections.filter(section => {
      const searchText = `${section.title} ${section.description} ${section.keywords.join(" ")}`.toLowerCase();
      return searchText.includes(query);
    });

    setFilteredResults(results);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredResults.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            handleSelect(filteredResults[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (section) => {
    onNavigate(section.id);
    onClose();
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingTop: "100px"
    }} onClick={onClose}>
      <div 
        data-testid="global-search-modal"
        style={{
          background: colors.cardBackground,
          borderRadius: 12,
          padding: 20,
          width: "90%",
          maxWidth: "600px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          border: `1px solid ${colors.border}`
        }} onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16
        }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all sections..."
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              fontSize: 16,
              outline: "none"
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: colors.textSecondary,
              cursor: "pointer",
              fontSize: 18,
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div 
            data-testid="search-results"
            style={{ maxHeight: "400px", overflowY: "auto" }}>
            {filteredResults.length > 0 ? (
              filteredResults.map((section, index) => (
                <div
                  key={section.id}
                  onClick={() => handleSelect(section)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: index === selectedIndex ? colors.primaryLight : "transparent",
                    border: index === selectedIndex ? `1px solid ${colors.primary}` : "none",
                    marginBottom: 4
                  }}
                >
                  <span style={{ fontSize: 20 }}>{section.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      color: colors.text,
                      marginBottom: 4
                    }}>
                      {section.title}
                    </div>
                    <div style={{
                      fontSize: 14,
                      color: colors.textSecondary
                    }}>
                      {section.description}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: "20px",
                textAlign: "center",
                color: colors.textSecondary
              }}>
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        {!searchQuery && (
          <div style={{
            padding: "16px",
            background: colors.primaryLight,
            borderRadius: 8,
            marginTop: 16,
            fontSize: 14,
            color: colors.textSecondary
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Keyboard Shortcuts:</div>
            <div>• Use ↑↓ arrows to navigate</div>
            <div>• Press Enter to select</div>
            <div>• Press Escape to close</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch; 