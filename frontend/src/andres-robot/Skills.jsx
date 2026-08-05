import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  draftAndresSkill, proposeAndresSkill, getAndresSkills, getAndresSkillMetrics,
  approveAndresSkill, rejectAndresSkill, runAndresSkill, deleteAndresSkill,
} from "../api";

/**
 * Andrés — Skills tab (V4). A bounded, auditable skill library.
 *
 * Per Andrés' own V4 ask: strict sandbox, comprehensible metrics, proposal
 * traceability, human approval. Every skill is a pure `def skill(x)` that must
 * pass a static safety check before it can be stored as runnable, and must be
 * user-approved before it counts as active. Skills run only in the sandbox.
 */
const STATUS_COLORS = {
  active: "#16a34a", pending: "#d97706", blocked: "#dc2626", rejected: "#6b7280",
};

export default function Skills({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [skills, setSkills] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [task, setTask] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [runInputs, setRunInputs] = useState({});   // skillId -> raw JSON string
  const [runResults, setRunResults] = useState({});  // skillId -> result

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        getAndresSkills().catch(() => ({ skills: [] })),
        getAndresSkillMetrics().catch(() => null),
      ]);
      setSkills(s.skills || []);
      setMetrics(m);
    } catch (e) { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const draft = async () => {
    if (!task.trim()) return;
    setBusy(true);
    try {
      const d = await draftAndresSkill(task.trim());
      setName(d.name || "skill");
      setDescription(d.description || "");
      setCode(d.code || "");
    } catch (e) { /* offline */ }
    setBusy(false);
  };

  const propose = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await proposeAndresSkill({ name: name.trim() || "skill", description: description.trim(), code });
      setName(""); setDescription(""); setCode(""); setTask("");
      await load();
    } catch (e) { /* offline */ }
    setBusy(false);
  };

  const act = async (fn, s) => {
    try { await fn(s._id); await load(); onProfileChange && onProfileChange(); }
    catch (e) { /* offline */ }
  };

  const run = async (s) => {
    let input = runInputs[s._id];
    try { input = JSON.parse(input); } catch (e) { /* pass raw string */ }
    try {
      const res = await runAndresSkill(s._id, input);
      setRunResults((r) => ({ ...r, [s._id]: res }));
      await load();
    } catch (e) {
      setRunResults((r) => ({ ...r, [s._id]: { ok: false, error: e?.message || "error" } }));
    }
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };
  const input = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
    background: colors.background, color: colors.text, width: "100%", boxSizing: "border-box",
  };
  const mono = { fontFamily: "monospace", fontSize: 13 };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ ...card, lineHeight: 1.6 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.skills.title")}</strong>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "6px 0 0" }}>
          {t("andresRobotModule.skills.intro")}
        </p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
          {[
            ["active", metrics.active], ["pending", metrics.pending],
            ["blocked", metrics.blocked], ["runs", metrics.runs],
          ].map(([k, v]) => (
            <div key={k} style={{ ...card, textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.primary }}>{v ?? 0}</div>
              <div style={{ fontSize: 11, color: colors.textSecondary }}>{t(`andresRobotModule.skills.metrics.${k}`)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Draft + propose */}
      <div style={{ ...card, display: "grid", gap: 8 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.skills.proposeTitle")}</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...input, flex: 1, minWidth: 180 }} value={task} onChange={(e) => setTask(e.target.value)}
                 placeholder={t("andresRobotModule.skills.taskPlaceholder")} />
          <button onClick={draft} disabled={busy || !task.trim()}
                  style={{ background: "transparent", border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: 8, padding: "9px 16px", fontWeight: 600, cursor: busy || !task.trim() ? "not-allowed" : "pointer", opacity: busy || !task.trim() ? 0.6 : 1 }}>
            {busy ? "…" : t("andresRobotModule.skills.draft")}
          </button>
        </div>
        <input style={input} value={name} onChange={(e) => setName(e.target.value)}
               placeholder={t("andresRobotModule.skills.namePlaceholder")} />
        <input style={input} value={description} onChange={(e) => setDescription(e.target.value)}
               placeholder={t("andresRobotModule.skills.descPlaceholder")} />
        <textarea style={{ ...input, ...mono, minHeight: 120, resize: "vertical" }} value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={"def skill(x):\n    return x"} />
        <div style={{ fontSize: 11, color: colors.textSecondary }}>{t("andresRobotModule.skills.safetyNote")}</div>
        <div>
          <button onClick={propose} disabled={busy || !code.trim()}
                  style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: busy || !code.trim() ? "not-allowed" : "pointer", opacity: busy || !code.trim() ? 0.6 : 1 }}>
            {t("andresRobotModule.skills.propose")}
          </button>
        </div>
      </div>

      {/* Skill list */}
      {skills.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.skills.empty")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {skills.map((s) => {
            const runnable = s.status === "pending" || s.status === "active";
            const res = runResults[s._id];
            return (
              <div key={s._id} style={{ ...card, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ color: colors.text, ...mono }}>{s.name}</strong>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[s.status] || colors.textSecondary }}>
                    {t(`andresRobotModule.skills.status.${s.status}`, s.status)}
                  </span>
                </div>
                {s.description && <p style={{ color: colors.textSecondary, fontSize: 13, margin: "4px 0 8px" }}>{s.description}</p>}
                <pre style={{ ...mono, background: colors.background, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, overflowX: "auto", color: colors.text, margin: 0 }}>{s.code}</pre>

                {/* safety verdict */}
                {s.safety && !s.safety.ok && (
                  <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px dashed #dc2626" }}>
                    <strong style={{ fontSize: 12, color: "#991b1b" }}>🛡️ {t("andresRobotModule.skills.blockedTitle")}</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "#991b1b", fontSize: 12 }}>
                      {s.safety.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {/* run box */}
                {runnable && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input style={{ ...input, ...mono, flex: 1, minWidth: 160 }}
                           value={runInputs[s._id] ?? ""}
                           onChange={(e) => setRunInputs((r) => ({ ...r, [s._id]: e.target.value }))}
                           placeholder={t("andresRobotModule.skills.inputPlaceholder")} />
                    <button onClick={() => run(s)}
                            style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>
                      {t("andresRobotModule.skills.run")}
                    </button>
                  </div>
                )}
                {res && (
                  <div style={{ marginTop: 8, ...mono, fontSize: 12, color: res.ok ? colors.text : "#dc2626" }}>
                    {res.ok
                      ? `→ ${JSON.stringify(res.output)}  (${res.duration_ms}ms)`
                      : `✗ ${res.error}`}
                  </div>
                )}

                {/* actions */}
                <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                  {s.status === "pending" && (
                    <>
                      <button onClick={() => act(approveAndresSkill, s)}
                              style={{ background: "#16a34a", color: "#fff", border: 0, borderRadius: 8, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>
                        {t("andresRobotModule.skills.approve")}
                      </button>
                      <button onClick={() => act(rejectAndresSkill, s)}
                              style={{ background: "transparent", color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        {t("andresRobotModule.skills.reject")}
                      </button>
                    </>
                  )}
                  <button onClick={() => act(deleteAndresSkill, s)}
                          style={{ background: "transparent", border: 0, color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                    {t("andresRobotModule.skills.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
