import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";

/** Route id → i18n key under globalSearch.sections */
const SEARCH_SECTION_CONFIG = [
  { id: "dashboard", sectionKey: "dashboard", icon: "🏠" },
  { id: "ai-concepts", sectionKey: "aiConcepts", icon: "💡" },
  { id: "micro-lessons", sectionKey: "microLessons", icon: "📚" },
  { id: "video-lessons", sectionKey: "videoLessons", icon: "🎥" },
  { id: "recommendation", sectionKey: "recommendation", icon: "⭐" },
  { id: "simulations", sectionKey: "simulations", icon: "🎮" },
  { id: "web-search", sectionKey: "webSearch", icon: "🌐" },
  { id: "team-dynamics", sectionKey: "teamDynamics", icon: "👥" },
  { id: "certifications", sectionKey: "certifications", icon: "🏆" },
  { id: "coach", sectionKey: "coach", icon: "👨‍💼" },
  { id: "skills-forecast", sectionKey: "skillsForecast", icon: "📊" },
  { id: "presentation-agent", sectionKey: "presentationAgent", icon: "🎤" },
  { id: "saved-lessons", sectionKey: "savedLessons", icon: "📦" },
  { id: "idea-log", sectionKey: "ideaLog", icon: "💡" },
  { id: "feature-roadmap", sectionKey: "featureRoadmap", icon: "⭐" },
  { id: "future-app", sectionKey: "futureApp", icon: "🔮" },
  { id: "run-test", sectionKey: "runTest", icon: "🧪" }
];

const GlobalSearch = ({ onNavigate, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const { colors } = useTheme();

  const searchableSections = useMemo(() => {
    return SEARCH_SECTION_CONFIG.map(({ id, sectionKey, icon }) => {
      const base = `globalSearch.sections.${sectionKey}`;
      const kw = t(`${base}.keywords`, { returnObjects: true });
      const keywords = Array.isArray(kw) ? kw : [];
      return {
        id,
        title: t(`${base}.title`),
        description: t(`${base}.description`),
        icon,
        keywords
      };
    });
  }, [t]);

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
  }, [searchQuery, searchableSections]);

  const handleSelect = useCallback((section) => {
    onNavigate(section.id);
    onClose();
    setSearchQuery("");
  }, [onNavigate, onClose]);

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
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose, handleSelect]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

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
            placeholder={t('globalSearch.placeholder')}
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
                {t('globalSearch.noResults', { query: searchQuery })}
              </div>
            )}
          </div>
        )}

        {!searchQuery && (
          <div style={{
            padding: "16px",
            background: colors.primaryLight,
            borderRadius: 8,
            marginTop: 16,
            fontSize: 14,
            color: colors.textSecondary
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('globalSearch.shortcutsTitle')}</div>
            <div>• {t('globalSearch.shortcutNav')}</div>
            <div>• {t('globalSearch.shortcutEnter')}</div>
            <div>• {t('globalSearch.shortcutEscape')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
