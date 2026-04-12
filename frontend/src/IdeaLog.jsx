import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";

function useIdeaLogDisplay(t) {
  return useMemo(() => {
    const modulesMap = t("ideaLogModule.modules", { returnObjects: true });
    const phrasesMap = t("ideaLogModule.backendPhrases", { returnObjects: true });
    const safeModules =
      modulesMap && typeof modulesMap === "object" && !Array.isArray(modulesMap) ? modulesMap : {};
    const safePhrases =
      phrasesMap && typeof phrasesMap === "object" && !Array.isArray(phrasesMap) ? phrasesMap : {};

    const moduleLabelKeys = (raw) => {
      const n = raw.trim().toLowerCase();
      const keys = [n, n.replace(/\s+/g, "-"), n.replace(/-/g, " ")];
      return [...new Set(keys)];
    };

    const resolveModuleLabel = (mod) => {
      if (!mod) return "";
      for (const key of moduleLabelKeys(mod)) {
        if (safeModules[key]) return safeModules[key];
      }
      return mod;
    };

    const displayModuleMatch = (mod) => resolveModuleLabel(mod);

    const displayConfidence = (level) => {
      if (!level) return "";
      const k = level.toLowerCase();
      if (k === "high" || k === "medium" || k === "low") {
        return t(`ideaLogModule.confidence.${k}`);
      }
      return level;
    };

    const translatePhrase = (text) => {
      if (!text) return text;
      return safePhrases[text] || text;
    };

    const translateIntent = (text) => {
      if (!text) return text;
      if (safePhrases[text]) return safePhrases[text];
      const match = text.match(/^user wants to access\s+/i);
      if (match) {
        const label = text.slice(match[0].length).trim();
        const moduleDisplay = resolveModuleLabel(label);
        return t("ideaLogModule.intentUserWantsAccess", { module: moduleDisplay });
      }
      return text;
    };

    return { displayModuleMatch, displayConfidence, translatePhrase, translateIntent };
  }, [t]);
}

function IdeaLog() {
  const { t, i18n } = useTranslation();
  const { displayModuleMatch, displayConfidence, translatePhrase, translateIntent } =
    useIdeaLogDisplay(t);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const { colors } = useTheme();

  const dateLocale = i18n.language?.startsWith("no") ? "nb-NO" : undefined;

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
        const res = await fetch(`${API_BASE}/admin/unknown-intents`);
        const data = await res.json();
        setIdeas(data.ideas || []);
        setError(null);
      } catch (err) {
        setError(t("ideaLogModule.fetchError"));
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, [t]);

  const handleDelete = async (id) => {
    if (!window.confirm(t("ideaLogModule.confirmDelete"))) return;
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      await fetch(`${API_BASE}/admin/unknown-intents/${id}`, { method: "DELETE" });
      setIdeas((prev) => prev.filter((idea) => idea._id !== id));
    } catch (err) {
      alert(t("ideaLogModule.deleteFailed"));
    }
  };

  const confidenceLevels = Array.from(
    new Set(ideas.map((i) => i.classification?.confidence).filter(Boolean))
  );
  const moduleMatches = Array.from(
    new Set(ideas.map((i) => i.classification?.module_match).filter(Boolean))
  );

  const confidenceColor = (level) => {
    if (!level) return colors.border;
    const l = level.toLowerCase();
    if (l === "high") return "#2ecc40";
    if (l === "medium") return "#f4b400";
    if (l === "low") return "#e74c3c";
    return colors.border;
  };
  const moduleColor = (mod) => {
    if (!mod) return colors.border;
    return "#1976d2";
  };

  const filteredIdeas = ideas.filter((idea) => {
    const conf = idea.classification?.confidence || "";
    const mod = idea.classification?.module_match || "";
    const userInput = idea.user_input?.toLowerCase() || "";
    const intent = idea.classification?.intent?.toLowerCase() || "";
    return (
      (!confidenceFilter || conf === confidenceFilter) &&
      (!moduleFilter || mod === moduleFilter) &&
      (!search || userInput.includes(search.toLowerCase()) || intent.includes(search.toLowerCase()))
    );
  });

  return (
    <div style={{ color: colors.text, padding: 24 }}>
      <h2 style={{ color: colors.text }}>{t("ideaLogModule.pageTitle")}</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          {t("ideaLogModule.labelConfidence")}
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">{t("ideaLogModule.filterAll")}</option>
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>
                {displayConfidence(level)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("ideaLogModule.labelModule")}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">{t("ideaLogModule.filterAll")}</option>
            {moduleMatches.map((mod) => (
              <option key={mod} value={mod}>
                {displayModuleMatch(mod)}
              </option>
            ))}
          </select>
        </label>
        <input
          type="text"
          placeholder={t("ideaLogModule.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: 16, padding: 4, borderRadius: 4, border: `1px solid ${colors.border}` }}
        />
      </div>
      {loading ? (
        <div>{t("ideaLogModule.loading")}</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ background: colors.primaryLight }}>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thUserInput")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thIntent")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thModuleMatch")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thNewFeature")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thConfidence")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thFollowUp")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thTimestamp")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("ideaLogModule.thActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredIdeas.map((idea, idx) => (
              <tr
                key={idea._id || idx}
                style={{ background: idx % 2 === 0 ? colors.cardBackground : colors.background }}
              >
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.user_input}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {translateIntent(idea.classification?.intent)}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.classification?.module_match && (
                    <span
                      style={{
                        background: moduleColor(idea.classification?.module_match),
                        color: "#fff",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: 13,
                      }}
                    >
                      {displayModuleMatch(idea.classification.module_match)}
                    </span>
                  )}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {translatePhrase(idea.classification?.new_feature)}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.classification?.confidence && (
                    <span
                      style={{
                        background: confidenceColor(idea.classification?.confidence),
                        color: "#fff",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: 13,
                      }}
                    >
                      {displayConfidence(idea.classification.confidence)}
                    </span>
                  )}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {translatePhrase(idea.classification?.follow_up_question)}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.created_at ? new Date(idea.created_at).toLocaleString(dateLocale) : "-"}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(idea._id)}
                    style={{
                      background: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    title={t("ideaLogModule.deleteTitle")}
                  >
                    🗑️ {t("ideaLogModule.deleteButton")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default IdeaLog;
