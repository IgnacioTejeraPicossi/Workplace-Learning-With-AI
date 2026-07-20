import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";
import ModalDialog from "./ModalDialog";

const isAdmin = true;

const STATUS_ORDER = ["Idea", "Planned", "In Review", "Coming Soon", "Implemented"];

const STATUS_TO_I18N = {
  Idea: "idea",
  Planned: "planned",
  "In Review": "inReview",
  "Coming Soon": "comingSoon",
  Implemented: "implemented",
};

const statusColors = {
  Idea: "#bdbdbd",
  Planned: "#1976d2",
  "In Review": "#f4b400",
  "Coming Soon": "#e67e22",
  Implemented: "#2ecc40",
};

const SCAFFOLD_TYPES = [
  { value: "API Route", i18nKey: "apiRoute" },
  { value: "DB Model", i18nKey: "dbModel" },
  { value: "Background Job", i18nKey: "backgroundJob" },
  { value: "Unit Test", i18nKey: "unitTest" },
  { value: "Cypress Test", i18nKey: "cypressTest" },
  { value: "Docs", i18nKey: "docs" },
];

function FeatureRoadmap() {
  const { t, i18n } = useTranslation();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState("");
  const [upvoting, setUpvoting] = useState("");
  const [statusUpdating, setStatusUpdating] = useState("");
  const [scaffoldModal, setScaffoldModal] = useState({ open: false, code: "", feature: null });
  const [sortBy, setSortBy] = useState("upvotes");
  const [sortDir, setSortDir] = useState("desc");
  const [scaffoldType, setScaffoldType] = useState("API Route");
  const [historyModal, setHistoryModal] = useState({ open: false, idea: null, history: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Self-Correcting Loop integration: turn a roadmap feature into a
  // Builder/Judge/Manager scaffold via the Self-Correcting Loop agent's endpoint.
  const [loopModal, setLoopModal] = useState({ open: false, idea: null, data: null, loading: false, error: false });
  const { colors } = useTheme();

  const dateLocale = i18n.language?.startsWith("no") ? "nb-NO" : undefined;

  const translateStatus = useCallback(
    (apiValue) => {
      const k = STATUS_TO_I18N[apiValue];
      if (k) return t(`featureRoadmapModule.status.${k}`);
      return apiValue;
    },
    [t]
  );

  const scaffoldLabel = useCallback(
    (value) => {
      const row = SCAFFOLD_TYPES.find((s) => s.value === value);
      if (row) return t(`featureRoadmapModule.scaffold.${row.i18nKey}.label`);
      return value;
    },
    [t]
  );

  const scaffoldPreview = useMemo(() => {
    const row = SCAFFOLD_TYPES.find((s) => s.value === scaffoldType);
    if (row) return t(`featureRoadmapModule.scaffold.${row.i18nKey}.preview`);
    return "";
  }, [scaffoldType, t]);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/admin/unknown-intents`);
      const data = await res.json();
      setFeatures(data.ideas || []);
      setError(null);
    } catch (err) {
      setError(t("featureRoadmapModule.fetchError"));
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleUpvote = async (id) => {
    setUpvoting(id);
    const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
    await fetch(`${API_BASE}/admin/unknown-intents/${id}/upvote`, { method: "POST" });
    await fetchFeatures();
    setUpvoting("");
  };

  const handleSubscribe = async (id) => {
    setSubscribing(id);
    const email = prompt(t("featureRoadmapModule.promptSubscribeEmail"));
    if (email) {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      await fetch(`${API_BASE}/admin/unknown-intents/${id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      alert(t("featureRoadmapModule.subscribed"));
    }
    setSubscribing("");
  };

  const handleStatusChange = async (id, status) => {
    setStatusUpdating(id);
    const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
    await fetch(`${API_BASE}/admin/unknown-intents/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchFeatures();
    setStatusUpdating("");
  };

  const handleGenerateScaffold = async (idea) => {
    let codeStub = "";
    const featureName = idea.classification?.new_feature || idea.user_input;
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/generate-scaffold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_name: featureName,
          feature_summary: idea.classification?.intent || idea.user_input,
          scaffold_type: scaffoldType,
        }),
      });
      const data = await res.json();
      codeStub = data.code || t("featureRoadmapModule.noCodeGenerated");
    } catch (err) {
      const mockHead = t("featureRoadmapModule.scaffoldMockHead", { name: featureName });
      codeStub = `${mockHead}\nimport React from 'react';\nfunction Feature() { return <div>Feature scaffold</div>; }\nexport default Feature;`;
    }
    setScaffoldModal({ open: true, code: codeStub, feature: idea, loop: null });
  };

  // Option B: self-correcting scaffold. Runs the Builder→Judge→Manager loop on
  // the backend (ast syntax ground truth + LLM checklist) and shows the result
  // plus loop metadata (iterations / verdict / escalate) in the scaffold modal.
  const handleSelfCorrectingScaffold = async (idea) => {
    const featureName = idea.classification?.new_feature || idea.user_input;
    setScaffoldModal({ open: true, code: "", feature: idea, loop: { loading: true } });
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/generate-scaffold-loop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_name: featureName,
          feature_summary: idea.classification?.intent || idea.user_input,
          scaffold_type: scaffoldType,
          max_iterations: 3,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setScaffoldModal({ open: true, code: data.code || "", feature: idea, loop: data });
    } catch (err) {
      setScaffoldModal({
        open: true, code: "", feature: idea,
        loop: { error: true },
      });
    }
  };

  const loopLang = () => {
    const l = (i18n.language || "en").slice(0, 2);
    return ["en", "no", "es"].includes(l) ? l : "en";
  };

  // Ask the Self-Correcting AI Loop agent to turn this feature into a
  // Builder / Judge / Manager scaffold + hard stop conditions. Reuses the
  // agent's already-tested endpoint (validated, offline fallback, read-only).
  const handleDesignLoop = async (idea) => {
    const featureName = idea.classification?.new_feature || idea.user_input;
    const summary = idea.classification?.intent || idea.user_input || "";
    setLoopModal({ open: true, idea, data: null, loading: true, error: false });
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/api/self-correcting-loop/customize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: "code",
          task_description: `Build this app feature: ${featureName}. ${summary}`.slice(0, 2000),
          lang: loopLang(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLoopModal({ open: true, idea, data, loading: false, error: false });
    } catch (err) {
      console.error("design-loop failed:", err);
      setLoopModal({ open: true, idea, data: null, loading: false, error: true });
    }
  };

  const handleShowHistory = async (idea) => {
    setLoadingHistory(true);
    setHistoryModal({ open: true, idea, history: [] });
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(
        `${API_BASE}/scaffold-history/${encodeURIComponent(idea.classification?.new_feature || idea.user_input)}`
      );
      const data = await res.json();
      setHistoryModal({ open: true, idea, history: data.history || [] });
    } catch (err) {
      setHistoryModal({ open: true, idea, history: [] });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleApproveScaffold = async (scaffold) => {
    const admin_comment = prompt(t("featureRoadmapModule.promptApprovalComment"), "");
    const approved_by = "admin";
    const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
    const res = await fetch(`${API_BASE}/scaffold-history/${scaffold._id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_comment, approved_by }),
    });
    const data = await res.json();
    if (data.success) {
      handleShowHistory(historyModal.idea);
    } else {
      alert(t("featureRoadmapModule.approveFailed"));
    }
  };

  const sortedFeatures = [...features].sort((a, b) => {
    let aVal;
    let bVal;
    if (sortBy === "upvotes") {
      aVal = a.upvotes || 0;
      bVal = b.upvotes || 0;
    } else if (sortBy === "date") {
      aVal = new Date(a.created_at || 0).getTime();
      bVal = new Date(b.created_at || 0).getTime();
    } else if (sortBy === "status") {
      aVal = STATUS_ORDER.indexOf(a.status || "Idea");
      bVal = STATUS_ORDER.indexOf(b.status || "Idea");
    } else {
      aVal = 0;
      bVal = 0;
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir(col === "upvotes" || col === "date" ? "desc" : "asc");
    }
  };

  const featureDisplayName = (idea) =>
    idea.classification?.new_feature || t("featureRoadmapModule.noFeatureName");

  const modalName = (idea) =>
    idea?.classification?.new_feature || idea?.user_input || t("featureRoadmapModule.modalFeatureFallback");

  return (
    <div style={{ color: colors.text, padding: 24 }}>
      <h2 style={{ color: colors.text }}>{t("featureRoadmapModule.pageTitle")}</h2>
      <p style={{ color: colors.textSecondary, marginBottom: 24 }}>{t("featureRoadmapModule.intro")}</p>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 600, marginRight: 12 }}>{t("featureRoadmapModule.statusLegend")}</span>
        {STATUS_ORDER.map((opt) => (
          <span
            key={opt}
            style={{
              background: statusColors[opt],
              color: "#fff",
              borderRadius: 6,
              padding: "2px 10px",
              marginRight: 8,
              fontSize: 13,
            }}
          >
            {translateStatus(opt)}
          </span>
        ))}
      </div>
      {loading ? (
        <div>{t("featureRoadmapModule.loading")}</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ background: colors.primaryLight }}>
              <th
                style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: "pointer" }}
                onClick={() => handleSort("feature")}
              >
                {t("featureRoadmapModule.thFeatureName")}
              </th>
              <th
                style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: "pointer" }}
                onClick={() => handleSort("status")}
              >
                {t("featureRoadmapModule.thStatus")}{" "}
                {sortBy === "status" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("featureRoadmapModule.thSummary")}
              </th>
              <th
                style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: "pointer" }}
                onClick={() => handleSort("upvotes")}
              >
                {t("featureRoadmapModule.thUpvotes")}{" "}
                {sortBy === "upvotes" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("featureRoadmapModule.thNotifications")}
              </th>
              <th
                style={{ padding: 8, border: `1px solid ${colors.border}`, cursor: "pointer" }}
                onClick={() => handleSort("date")}
              >
                {t("featureRoadmapModule.thSubmitted")}{" "}
                {sortBy === "date" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>
                {t("featureRoadmapModule.thAdmin")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFeatures.map((idea, idx) => (
              <tr
                key={idea._id || idx}
                style={{ background: idx % 2 === 0 ? colors.cardBackground : colors.background }}
              >
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {featureDisplayName(idea)}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <span
                    style={{
                      background: statusColors[idea.status || "Idea"],
                      color: "#fff",
                      borderRadius: 6,
                      padding: "2px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {isAdmin ? (
                      <select
                        value={idea.status || "Idea"}
                        onChange={(e) => handleStatusChange(idea._id, e.target.value)}
                        disabled={statusUpdating === idea._id}
                        style={{
                          padding: 4,
                          borderRadius: 4,
                          background: statusColors[idea.status || "Idea"],
                          color: "#fff",
                          fontWeight: 600,
                          border: "none",
                        }}
                      >
                        {STATUS_ORDER.map((opt) => (
                          <option key={opt} value={opt}>
                            {translateStatus(opt)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      translateStatus(idea.status || "Idea")
                    )}
                  </span>
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.classification?.intent || idea.user_input}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <button
                    type="button"
                    onClick={() => handleUpvote(idea._id)}
                    disabled={upvoting === idea._id}
                    style={{
                      background: "#eee",
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      padding: "2px 10px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    title={t("featureRoadmapModule.titleUpvote")}
                  >
                    👍 {idea.upvotes || 0}
                  </button>
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <button
                    type="button"
                    onClick={() => handleSubscribe(idea._id)}
                    disabled={subscribing === idea._id}
                    style={{
                      background: "#eee",
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      padding: "2px 10px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    title={t("featureRoadmapModule.titleNotify")}
                  >
                    🔔 {t("featureRoadmapModule.notifyMe")}
                  </button>
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  {idea.created_at ? new Date(idea.created_at).toLocaleString(dateLocale) : "-"}
                </td>
                <td style={{ padding: 8, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <select
                      value={scaffoldType}
                      onChange={(e) => setScaffoldType(e.target.value)}
                      style={{ marginBottom: 4, padding: 4, borderRadius: 4 }}
                    >
                      {SCAFFOLD_TYPES.map(({ value, i18nKey }) => (
                        <option key={value} value={value}>
                          {t(`featureRoadmapModule.scaffold.${i18nKey}.label`)}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4, minHeight: 18 }}>
                      {scaffoldPreview}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateScaffold(idea)}
                      style={{
                        background: "#eee",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        padding: "2px 10px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      title={t("featureRoadmapModule.titleGenerateScaffold")}
                    >
                      🛠️ {t("featureRoadmapModule.generateScaffold")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelfCorrectingScaffold(idea)}
                      style={{
                        background: "#6d28d9",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "2px 10px",
                        cursor: "pointer",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                      title={t("featureRoadmapModule.scaffoldLoop.buttonTitle")}
                    >
                      🔁 {t("featureRoadmapModule.scaffoldLoop.button")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShowHistory(idea)}
                      style={{
                        background: "#f4e2b8",
                        color: "#8a6d1b",
                        border: "none",
                        borderRadius: 6,
                        padding: "2px 10px",
                        cursor: "pointer",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                      title={t("featureRoadmapModule.titleHistory")}
                    >
                      📜 {t("featureRoadmapModule.history")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDesignLoop(idea)}
                      style={{
                        background: "#0d9488",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "2px 10px",
                        cursor: "pointer",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                      title={t("featureRoadmapModule.loop.buttonTitle")}
                    >
                      🔄 {t("featureRoadmapModule.loop.button")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ModalDialog
        isOpen={scaffoldModal.open}
        onRequestClose={() => setScaffoldModal({ open: false, code: "", feature: null })}
        title={t("featureRoadmapModule.modalScaffoldTitle", {
          name: modalName(scaffoldModal.feature),
        })}
      >
        {scaffoldModal.loop && (
          scaffoldModal.loop.loading ? (
            <div style={{ marginBottom: 12 }}>{t("featureRoadmapModule.scaffoldLoop.loading")}</div>
          ) : scaffoldModal.loop.error ? (
            <div style={{ marginBottom: 12, color: "#b91c1c" }}>{t("featureRoadmapModule.scaffoldLoop.error")}</div>
          ) : (
            <div style={{
              marginBottom: 12, padding: "10px 12px", borderRadius: 8,
              background: scaffoldModal.loop.verdict === "pass" ? "#ecfdf5" : "#fffbeb",
              border: `1px solid ${scaffoldModal.loop.verdict === "pass" ? "#6ee7b7" : "#fde68a"}`,
              fontSize: 13, color: colors.text, lineHeight: 1.6,
            }}>
              <b>{scaffoldModal.loop.verdict === "pass"
                ? `✅ ${t("featureRoadmapModule.scaffoldLoop.pass")}`
                : `⚠️ ${t("featureRoadmapModule.scaffoldLoop.escalate")}`}</b>
              {" — "}
              {t("featureRoadmapModule.scaffoldLoop.iterations", { n: scaffoldModal.loop.iterations })}
              {scaffoldModal.loop.fell_back_to_stub && (
                <div style={{ marginTop: 4, color: "#92400e" }}>
                  ↳ {t("featureRoadmapModule.scaffoldLoop.fellBack")}
                </div>
              )}
            </div>
          )
        )}
        <pre
          style={{
            background: "#f4f4f4",
            padding: 16,
            borderRadius: 8,
            fontSize: 14,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {scaffoldModal.code}
        </pre>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(scaffoldModal.code);
            alert(t("featureRoadmapModule.codeCopied"));
          }}
          style={{
            marginTop: 16,
            background: "#1976d2",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {t("featureRoadmapModule.copyCode")}
        </button>
      </ModalDialog>
      <ModalDialog
        isOpen={loopModal.open}
        onRequestClose={() => setLoopModal({ open: false, idea: null, data: null, loading: false, error: false })}
        title={t("featureRoadmapModule.loop.modalTitle", { name: modalName(loopModal.idea) })}
      >
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
          {t("featureRoadmapModule.loop.modalLead")}
        </div>
        {loopModal.loading ? (
          <div>{t("featureRoadmapModule.loop.loading")}</div>
        ) : loopModal.error ? (
          <div style={{ color: "#b91c1c" }}>{t("featureRoadmapModule.loop.error")}</div>
        ) : loopModal.data ? (
          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            <span style={{
              display: "inline-block", marginBottom: 12, padding: "2px 10px", borderRadius: 999,
              fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
              background: loopModal.data.is_mock ? "#fef3c7" : "#d1fae5",
              color: loopModal.data.is_mock ? "#92400e" : "#065f46",
              border: `1px solid ${loopModal.data.is_mock ? "#fde68a" : "#6ee7b7"}`,
            }}>
              {loopModal.data.is_mock
                ? t("featureRoadmapModule.loop.mockBadge")
                : t("featureRoadmapModule.loop.aiBadge")}
            </span>
            {[
              { key: "builder", icon: "🔨" },
              { key: "judge", icon: "⚖️" },
              { key: "manager", icon: "🧭" },
              { key: "stop", icon: "🛑" },
            ].map(({ key, icon }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 4,
                }}>
                  <b style={{ fontSize: 13.5, color: colors.text }}>
                    {icon} {t(`featureRoadmapModule.loop.${key}Label`)}
                  </b>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(loopModal.data[key] || "");
                      alert(t("featureRoadmapModule.codeCopied"));
                    }}
                    style={{
                      background: "#0d9488", color: "#fff", border: 0, borderRadius: 6,
                      padding: "2px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer",
                    }}
                  >
                    📋 {t("featureRoadmapModule.loop.copy")}
                  </button>
                </div>
                <pre style={{
                  background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 6,
                  fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowX: "auto",
                  margin: 0,
                }}>
                  {loopModal.data[key]}
                </pre>
              </div>
            ))}
          </div>
        ) : null}
      </ModalDialog>
      <ModalDialog
        isOpen={historyModal.open}
        onRequestClose={() => setHistoryModal({ open: false, idea: null, history: [] })}
        title={t("featureRoadmapModule.modalHistoryTitle", { name: modalName(historyModal.idea) })}
      >
        {loadingHistory ? (
          <div>{t("featureRoadmapModule.loading")}</div>
        ) : historyModal.history.length === 0 ? (
          <div style={{ color: colors.textSecondary }}>{t("featureRoadmapModule.noHistory")}</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {historyModal.history.map((entry, idx) => (
              <div
                key={entry._id || idx}
                style={{ marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 12 }}
              >
                <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
                  <b>{t("featureRoadmapModule.historyMetaType")}</b> {scaffoldLabel(entry.scaffold_type)}{" "}
                  &nbsp; | &nbsp;
                  <b>{t("featureRoadmapModule.historyMetaUser")}</b> {entry.user} &nbsp; | &nbsp;
                  <b>{t("featureRoadmapModule.historyMetaDate")}</b>{" "}
                  {new Date(entry.created_at).toLocaleString(dateLocale)}
                  {entry.approved && (
                    <span style={{ color: "#2ecc40", fontWeight: 600, marginLeft: 8 }}>
                      {t("featureRoadmapModule.historyApprovedBy", {
                        user: entry.approved_by,
                        at: entry.approved_at
                          ? ` — ${new Date(entry.approved_at).toLocaleString(dateLocale)}`
                          : "",
                      })}
                    </span>
                  )}
                </div>
                <pre
                  style={{
                    background: "#f4f4f4",
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {entry.code}
                </pre>
                {entry.admin_comment && (
                  <div style={{ fontSize: 13, color: "#1976d2", marginBottom: 4 }}>
                    <b>{t("featureRoadmapModule.adminComment")}</b> {entry.admin_comment}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(entry.code);
                    alert(t("featureRoadmapModule.codeCopied"));
                  }}
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: 0,
                    borderRadius: 6,
                    padding: "6px 16px",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {t("featureRoadmapModule.copyCode")}
                </button>
                {!entry.approved && (
                  <button
                    type="button"
                    onClick={() => handleApproveScaffold(entry)}
                    style={{
                      background: "#2ecc40",
                      color: "#fff",
                      border: 0,
                      borderRadius: 6,
                      padding: "6px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                      marginLeft: 8,
                    }}
                  >
                    {t("featureRoadmapModule.approve")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ModalDialog>
    </div>
  );
}

export default FeatureRoadmap;
