import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { useTranslation } from 'react-i18next';

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
    "document-text": "📝",
    "refresh-cw": "🔄",
    "refresh": "🔄",
    "process": "🔄",
    "catalog": "📋",
    "list": "📋",
    "brain": "🧠",
    "broadcast": "📡"
  };

  return (
    <span style={{ 
      fontSize: size <= 16 ? '0.75em' : size <= 18 ? '0.85em' : '1em',
      display: "inline-block", 
      width: size, 
      textAlign: "center",
      lineHeight: 1,
      verticalAlign: 'middle'
    }}>
      {icons[name] || "📄"}
    </span>
  );
};

// Function to get navigation items with translations
const getNavItems = (t) => [
  // Dashboard - Módulo principal que se muestra al entrar
  { key: "dashboard", label: t('sidebar.dashboard'), icon: "house", group: "main" },
  
  // Grupo 1: Módulos de aprendizaje (expandible)
  { key: "learning-modules", label: t('sidebar.learningModules'), icon: "book", group: "learning", isExpandable: true, subItems: [
    { key: "video-lessons", label: t('sidebar.learningModulesSubmenu.videoLessons'), icon: "play" },
    { key: "micro-lessons", label: t('sidebar.learningModulesSubmenu.microLessons'), icon: "book" },
    { key: "simulations", label: t('sidebar.learningModulesSubmenu.simulations'), icon: "play" },
    { key: "web-search", label: t('sidebar.learningModulesSubmenu.webSearch'), icon: "globe" },
    { key: "team-dynamics", label: t('sidebar.learningModulesSubmenu.teamDynamics'), icon: "users" },
    { key: "certifications", label: t('sidebar.learningModulesSubmenu.certifications'), icon: "trophy" },
    { key: "ai-career-coach", label: t('sidebar.learningModulesSubmenu.aiCareerCoach'), icon: "user" },
    { key: "skills-forecast", label: t('sidebar.learningModulesSubmenu.skillsForecast'), icon: "bar-chart" },
    { key: "ai-learning", label: t('sidebar.learningModulesSubmenu.aiLearning'), icon: "robot" },
    { key: "babel-library", label: t('sidebar.learningModulesSubmenu.babelLibrary'), icon: "temple" }
  ]},
  
  // Mapa de conocimiento (opción especial que permanece visible)
  { key: "knowledge-map", label: t('sidebar.mapOfKnowledge'), icon: "globe", group: "learning" },
  
  // Grupo 1.5: Análisis de repositorios (expandible)
  { key: "repository-analyzer", label: t('sidebar.repositoryAnalyzer'), icon: "archive", group: "learning", isExpandable: true, subItems: [
    { key: "repo-analyzer", label: t('sidebar.repositoryAnalyzerSubmenu.repoAnalyzer'), icon: "archive" },
    { key: "agent-cursor-ai", label: t('sidebar.repositoryAnalyzerSubmenu.agentCursorAI'), icon: "robot" },
    { key: "learning-repo", label: t('sidebar.repositoryAnalyzerSubmenu.learningRepo'), icon: "graduation-cap" }
  ]},
  
  // Grupo 1.6: Document Analyzer (nuevo módulo)
  { key: "document-analyzer", label: t('sidebar.documentAnalyzer'), icon: "document", group: "learning", isExpandable: true, subItems: [
    { key: "documents-analyzer", label: t('sidebar.documentAnalyzerSubmenu.documentsAnalyzer'), icon: "document-text" },
    { key: "learning-document", label: t('sidebar.documentAnalyzerSubmenu.learningDocument'), icon: "book" },
    { key: "agentic-rag", label: t('sidebar.documentAnalyzerSubmenu.agenticRAGAnalyzer'), icon: "🚀" },
    { key: "agentic-rag-document", label: t('sidebar.documentAnalyzerSubmenu.agenticRAGDocuments'), icon: "📋" }
  ]},
  
  // J-messages Analyzer (nuevo módulo con librería)
  { key: "j-messages", label: t('sidebar.jMessagesAnalyzer.title'), icon: "document", group: "learning", isExpandable: true, subItems: [
    { key: "j-messages-analyzer", label: t('sidebar.jMessagesAnalyzer.submenu.analyzer'), icon: "document-text" },
    { key: "j-messages-pre-analyzer", label: t('sidebar.jMessagesAnalyzer.submenu.preAnalyzer'), icon: "edit" },
    { key: "j-messages-library", label: t('sidebar.jMessagesAnalyzer.submenu.library'), icon: "book" },
    { key: "j-messages-pairs", label: t('sidebar.jMessagesAnalyzer.submenu.pairsLibrary'), icon: "document-duplicate" }
  ]},
  
  // Grupo 1.7: Enterprise Architecture (expandible)
  { key: "enterprise-architecture", label: t('sidebar.enterpriseArchitecture'), icon: "building", group: "learning", isExpandable: true, subItems: [
    { key: "ea-home", label: t('sidebar.enterpriseArchitectureSubmenu.eaDashboard'), icon: "building" },
    { key: "process-designer", label: t('sidebar.enterpriseArchitectureSubmenu.processDesigner'), icon: "process" },
    { key: "catalog-manager", label: t('sidebar.enterpriseArchitectureSubmenu.catalogManager'), icon: "catalog" }
  ]},
  
  // Grupo 1.8: Item Agents (implementados)
  { key: "item-agents", label: t('sidebar.itemAgents'), icon: "robot", group: "learning", isExpandable: true, subItems: [
    { key: "agentops-studio", label: t('sidebar.agentopsStudio'), icon: "robot" },
    { key: "ai-compliance-agent", label: t('sidebar.aiComplianceAgent'), icon: "shield" },
    { key: "ai-productivity-agent", label: t('sidebar.aiProductivityAgent'), icon: "rocket" }
  ]},

  // Nuevo grupo: Future Item Agents (prototipos)
  { key: "future-item-agents", label: t('sidebar.futureItemAgents'), icon: "rocket", group: "learning", isExpandable: true, subItems: [
    { key: "ea-second-brain", label: t('sidebar.eaSecondBrain'), icon: "brain" },
    { key: "sales-assistant", label: t('sidebar.salesAssistant'), icon: "briefcase" },
    { key: "personal-attention-agent", label: t('sidebar.personalAttentionAgent'), icon: "target" },
    { key: "telco-ops-agent", label: t('sidebar.telcoOpsAgent'), icon: "broadcast" },
    { key: "grc-agent", label: t('sidebar.grcAgent'), icon: "shield" },
    { key: "council-agent", label: t('sidebar.councilAgent'), icon: "users" },
    { key: "ops-efficiency-agent", label: t('sidebar.opsEfficiencyAgent'), icon: "settings" },
    { key: "atm-vv-test-copilot", label: t('sidebar.atmVvTestCopilot'), icon: "plane" }
  ]},
  
  // Robomind Clinic (moved out of Item Agents, placed above Cybersecurity)
  { key: "robomind-clinic", label: t('sidebar.robomindClinic'), icon: "brain", group: "learning" },
  
  // Grupo 1.9: Cybersecurity (nuevo grupo para seguridad)
  { key: "cybersecurity", label: t('sidebar.cybersecurity'), icon: "shield", group: "learning" },
  
  // Grupo 2: Ayuda del sistema (fondo verde)
  { key: "help", label: t('sidebar.help'), icon: "help", group: "help", isExpandable: true, subItems: [
    { key: "agent-theory-docs", label: t('sidebar.agentTheoryDocs'), icon: "book" },
    { key: "presentation-agent", label: t('sidebar.presentationAgent'), icon: "presentation" },
    { key: "ai-study-buddy", label: t('sidebar.aiStudyBuddy'), icon: "robot" },
    { key: "readme-viewer", label: t('sidebar.readmeViewer'), icon: "doc" },
    { key: "agi-progress", label: t('sidebar.agiProgress'), icon: "chart" }
  ]},
  
  // Grupo 3: Herramientas de desarrollo (fondo azul)
  { key: "security", label: t('sidebar.security'), icon: "shield", group: "developer" },
  { key: "run-test", label: t('sidebar.runTest'), icon: "play", group: "developer" },
  { key: "api-config", label: t('sidebar.apiConfig'), icon: "settings", group: "developer" },
  
  // Grupo 4: Funcionalidades futuras (expandible)
  { key: "future", label: t('sidebar.future'), icon: "rocket", group: "developer", isExpandable: true, subItems: [
    { key: "future-app", label: t('sidebar.futureSubmenu.futureApp'), icon: "rocket" },
    { key: "idea-log", label: t('sidebar.futureSubmenu.ideaLog'), icon: "lightbulb" },
    { key: "feature-roadmap", label: t('sidebar.futureSubmenu.featureRoadmap'), icon: "map" }
  ]}
];

function Sidebar({ selected, onSelect }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const { colors } = useTheme();
  const { t } = useTranslation('common');

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
        {getNavItems(t).map(item => {
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