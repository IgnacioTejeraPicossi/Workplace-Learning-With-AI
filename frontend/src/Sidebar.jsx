import React, { useState } from "react";
import { useTheme } from "./ThemeContext";

// Simple icon component using Unicode symbols
const Icon = ({ name, size = 20 }) => {
  const icons = {
    house: "🏠",
    lightbulb: "💡", 
    book: "📚",
    star: "⭐",
    "play-circle": "▶️",
    "user-check": "👤",
    "bar-chart": "📊",
    archive: "📦",
    layers: "📋",
    globe: "🌐",
    team: "👥",
    award: "🏆",
    "chevron-left": "◀️",
    "chevron-right": "▶️",
    test: "🧪",
    robot: "🤖",
    microphone: "🎤"
  };

  return (
    <span style={{ fontSize: size, display: "inline-block", width: size, textAlign: "center" }}>
      {icons[name] || "📄"}
    </span>
  );
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: "house" },
  { key: "micro-lessons", label: "Micro-lessons", icon: "book" },
  { key: "video-lessons", label: "Video Lessons", icon: "play-circle" },
  { key: "recommendation", label: "Recommendation", icon: "star" },
  { key: "simulations", label: "Simulations", icon: "play-circle" },
  { key: "web-search", label: "Web Search", icon: "globe" },
  { key: "team-dynamics", label: "Team Dynamics", icon: "team" },
  { key: "certifications", label: "Certifications", icon: "award" },
  { key: "coach", label: "AI Career Coach", icon: "user-check" },
  { key: "skills-forecast", label: "Skills Forecast", icon: "bar-chart" },
  { key: "ai-learning", label: "AI Learning & Training", icon: "robot" },
  { key: "knowledge-map", label: "Map of Knowledge", icon: "globe" },
  { key: "presentation-agent", label: "Presentation Agent", icon: "microphone" },
  { key: "ai-study-buddy", label: "AI Study Buddy", icon: "robot" },
  { key: "saved-lessons", label: "Saved Lessons", icon: "archive" },
  { key: "saved-videos", label: "Saved Videos", icon: "play-circle" },
  { key: "idea-log", label: "Idea Log", icon: "lightbulb" },
  { key: "feature-roadmap", label: "Feature Roadmap", icon: "star" },
  { key: "future-app", label: "Future App", icon: "robot" },
  { key: "run-test", label: "Run Test", icon: "test" },
];

function Sidebar({ selected, onSelect }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { colors } = useTheme();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside style={{
      width: isCollapsed ? 60 : 220,
      background: colors.sidebarBackground,
      borderRight: `1px solid ${colors.border}`,
      minHeight: "100vh",
      padding: "24px 0 0 0",
      boxShadow: colors.shadow,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "width 0.3s ease",
      position: "relative"
    }}>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          top: 16,
          right: isCollapsed ? 8 : -12,
          background: colors.primary,
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          transition: "all 0.2s"
        }}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon name={isCollapsed ? "chevron-right" : "chevron-left"} size={12} />
      </button>

      <div style={{ 
        fontWeight: 700, 
        fontSize: isCollapsed ? 16 : 22, 
        textAlign: "center", 
        marginBottom: 32, 
        color: colors.primary,
        padding: "0 8px",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}>
        {!isCollapsed && <Icon name="layers" size={20} style={{ marginRight: 8 }} />}
        {!isCollapsed && "AI Learning"}
        {isCollapsed && <Icon name="layers"></Icon>}
      </div>
      
      <nav>
        {navItems.map(item => (
          <button
            key={item.key}
            data-testid={`sidebar-${item.key}`}
            className={selected === item.key ? 'active' : ''}
            onClick={() => onSelect(item.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isCollapsed ? 0 : 12,
              width: "100%",
              background: selected === item.key ? colors.primaryLight : "transparent",
              color: selected === item.key ? colors.primary : colors.text,
              border: "none",
              borderRadius: 8,
              padding: isCollapsed ? "12px 0" : "12px 24px",
              fontWeight: 500,
              fontSize: isCollapsed ? 14 : 16,
              cursor: "pointer",
              marginBottom: 4,
              transition: "all 0.2s ease",
              justifyContent: isCollapsed ? "center" : "flex-start",
              ":hover": {
                background: selected === item.key ? colors.primaryLight : colors.primaryLight,
                color: colors.primary,
                transform: "translateX(4px)"
              }
            }}
            title={isCollapsed ? item.label : ""}
            onMouseEnter={(e) => {
              if (selected !== item.key) {
                e.target.style.background = colors.primaryLight;
                e.target.style.color = colors.primary;
                e.target.style.transform = "translateX(4px)";
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== item.key) {
                e.target.style.background = "transparent";
                e.target.style.color = colors.text;
                e.target.style.transform = "translateX(0px)";
              }
            }}
          >
            <Icon name={item.icon} size={isCollapsed ? 18 : 20} />
            {!isCollapsed && item.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
    </aside>
  );
}

export default Sidebar; 