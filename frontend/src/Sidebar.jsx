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
    play: "▶️",
    "user-check": "👤",
    "bar-chart": "📊",
    archive: "📦",
    layers: "📋",
    globe: "🌐",
    team: "👥",
    users: "👥",
    award: "🏆",
    trophy: "🏆",
    user: "👤",
    "chevron-left": "◀️",
    "chevron-right": "▶️",
    test: "🧪",
    robot: "🤖",
    microphone: "🎤",
    presentation: "🎤",
    shield: "🛡️",
    rocket: "🚀",
    "chevron-down": "⬇️",
    "chevron-up": "⬆️",
    help: "❓",
    map: "🗺️",
    "graduation-cap": "🎓",
    building: "🏢",
    temple: "🏛️",
    settings: "⚙️",
    document: "📄",
    "document-text": "📝"
  };

  return (
    <span style={{ fontSize: size, display: "inline-block", width: size, textAlign: "center" }}>
      {icons[name] || "📄"}
    </span>
  );
};

const navItems = [
  // Dashboard - Módulo principal que se muestra al entrar
  { key: "dashboard", label: "Dashboard", icon: "house", group: "main" },
  
  // Grupo 1: Módulos de aprendizaje (expandible)
  { key: "learning-modules", label: "Learning Modules", icon: "book", group: "learning", isExpandable: true, subItems: [
    { key: "video-lessons", label: "Video Lessons", icon: "play" },
    { key: "micro-lessons", label: "Micro-lessons", icon: "book" },
    { key: "simulations", label: "Simulations", icon: "play" },
    { key: "web-search", label: "Web Search", icon: "globe" },
    { key: "team-dynamics", label: "Team Dynamics", icon: "users" },
    { key: "certifications", label: "Certifications", icon: "trophy" },
    { key: "ai-career-coach", label: "AI Career Coach", icon: "user" },
    { key: "skills-forecast", label: "Skills Forecast", icon: "bar-chart" },
    { key: "ai-learning", label: "AI Learning & Training", icon: "robot" },
    { key: "babel-library", label: "Babel Library", icon: "temple" }
  ]},
  
  // Mapa de conocimiento (opción especial que permanece visible)
  { key: "knowledge-map", label: "Map of Knowledge", icon: "globe", group: "learning" },
  
  // Grupo 1.5: Análisis de repositorios (expandible)
  { key: "repository-analyzer", label: "Repository Analyzer", icon: "archive", group: "learning", isExpandable: true, subItems: [
    { key: "repo-analyzer", label: "Repo Analyzer", icon: "archive" },
    { key: "repo-analyzer-cursor", label: "Repo Analyzer Cursor AI", icon: "robot" },
    { key: "agent-cursor-ai", label: "Agent Cursor AI", icon: "robot" },
    { key: "learning-repo", label: "Learning Repo", icon: "graduation-cap" }
  ]},
  
  // Grupo 1.6: Document Analyzer (nuevo módulo)
  { key: "document-analyzer", label: "Document Analyzer", icon: "document", group: "learning", isExpandable: true, subItems: [
    { key: "documents-analyzer", label: "Documents Analyzer", icon: "document-text" },
    { key: "learning-document", label: "Learning Document", icon: "book" }
  ]},
  
  // Grupo 1.7: Enterprise Architecture (expandible)
  { key: "enterprise-architecture", label: "Enterprise Architecture", icon: "🏢", group: "learning", isExpandable: true, subItems: [
    { key: "ea-home", label: "EA Dashboard", icon: "🏢" },
    { key: "process-designer", label: "Process Designer", icon: "🔄" },
    { key: "catalog-manager", label: "Catalog Manager", icon: "📋" }
  ]},
  
  // Grupo 2: Ayuda del sistema (fondo verde)
  { key: "help", label: "Help", icon: "help", group: "help", isExpandable: true, subItems: [
    { key: "presentation-agent", label: "Presentation Agent", icon: "presentation" },
    { key: "ai-study-buddy", label: "AI Study Buddy", icon: "robot" }
  ]},
  
  // Grupo 3: Herramientas de desarrollo (fondo azul)
  { key: "security", label: "Security", icon: "shield", group: "developer" },
  { key: "run-test", label: "Run Test", icon: "play", group: "developer" },
  { key: "api-config", label: "API Config", icon: "settings", group: "developer" },
  
  // Grupo 4: Funcionalidades futuras (expandible)
  { key: "future", label: "Future", icon: "rocket", group: "developer", isExpandable: true, subItems: [
    { key: "future-app", label: "Future App", icon: "rocket" },
    { key: "idea-log", label: "Idea Log", icon: "lightbulb" },
    { key: "feature-roadmap", label: "Feature Roadmap", icon: "map" }
  ]}
];

function Sidebar({ selected, onSelect }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const { colors } = useTheme();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleExpanded = (itemKey) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
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
        {navItems.map(item => {
          // Determinar el fondo según el grupo
          let backgroundColor = "transparent";
          if (selected === item.key) {
            backgroundColor = colors.primaryLight;
          } else if (item.group === "main") {
            backgroundColor = "#fff3e0"; // Naranja muy claro para el módulo principal
          } else if (item.group === "help") {
            backgroundColor = "#e8f5e8"; // Verde claro para ayuda del sistema
          } else if (item.group === "developer") {
            backgroundColor = "#e3f2fd"; // Azul claro para operaciones del programador
          } else if (item.group === "learning") {
            backgroundColor = "#f3e5f5"; // Púrpura muy claro para módulos de aprendizaje
          }

          const isExpanded = expandedItems.has(item.key);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.key}>
              <button
                data-testid={`sidebar-${item.key}`}
                className={selected === item.key ? 'active' : ''}
                onClick={() => {
                  if (hasSubItems) {
                    toggleExpanded(item.key);
                  } else {
                    onSelect(item.key);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isCollapsed ? 0 : 12,
                  width: "100%",
                  background: backgroundColor,
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
                    // Restaurar el fondo original según el grupo
                    let originalBackground = "transparent";
                    if (item.group === "main") {
                      originalBackground = "#fff3e0"; // Naranja muy claro para el módulo principal
                    } else if (item.group === "help") {
                      originalBackground = "#e8f5e8"; // Verde claro
                    } else if (item.group === "developer") {
                      originalBackground = "#e3f2fd"; // Azul claro
                    } else if (item.group === "learning") {
                      originalBackground = "#f3e5f5"; // Púrpura muy claro para módulos de aprendizaje
                    }
                    
                    e.target.style.background = originalBackground;
                    e.target.style.color = colors.text;
                    e.target.style.transform = "translateX(0px)";
                  }
                }}
              >
                <Icon name={item.icon} size={isCollapsed ? 18 : 20} />
                {!isCollapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    {hasSubItems && (
                      <Icon 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </>
                )}
                {isCollapsed && hasSubItems && (
                  <Icon 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={14} 
                  />
                )}
              </button>

              {/* Renderizar subelementos si están expandidos */}
              {hasSubItems && isExpanded && !isCollapsed && (
                <div style={{ marginLeft: 24, marginBottom: 4 }}>
                  {item.subItems.map(subItem => {
                    const isSubItemSelected = selected === subItem.key;
                    let subItemBackground = "transparent";
                    if (isSubItemSelected) {
                      subItemBackground = colors.primaryLight;
                    } else {
                      subItemBackground = "#f0f8ff"; // Azul muy claro para subelementos
                    }

                    return (
                      <button
                        key={subItem.key}
                        data-testid={`sidebar-${subItem.key}`}
                        className={isSubItemSelected ? 'active' : ''}
                        onClick={() => onSelect(subItem.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          background: subItemBackground,
                          color: isSubItemSelected ? colors.primary : colors.textSecondary,
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 16px",
                          fontWeight: 400,
                          fontSize: 14,
                          cursor: "pointer",
                          marginBottom: 2,
                          transition: "all 0.2s ease",
                          justifyContent: "flex-start",
                          borderLeft: `3px solid ${colors.border}`,
                          ":hover": {
                            background: isSubItemSelected ? colors.primaryLight : colors.primaryLight,
                            color: colors.primary,
                            transform: "translateX(4px)"
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubItemSelected) {
                            e.target.style.background = colors.primaryLight;
                            e.target.style.color = colors.primary;
                            e.target.style.transform = "translateX(4px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubItemSelected) {
                            e.target.style.background = isSubItemSelected ? colors.primaryLight : "#f0f8ff";
                            e.target.style.color = isSubItemSelected ? colors.primary : colors.textSecondary;
                            e.target.style.transform = "translateX(0px)";
                          }
                        }}
                      >
                        <Icon name={subItem.icon} size={16} />
                        {subItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
    </aside>
  );
}

export default Sidebar; 