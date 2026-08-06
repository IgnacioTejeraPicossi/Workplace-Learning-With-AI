import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  getAndresProjects, createAndresProject, updateAndresProject, deleteAndresProject,
  approveAndresProject, archiveAndresProject,
} from "../api";

/**
 * Andrés — Projects tab (V2 core + V5 lifecycle).
 *
 * Lifecycle: proposed → active → paused → completed | abandoned → archived, with
 * two hard rules (Andrés' design): nothing goes active without the user's approval,
 * and nothing is archived without a closure reflection. Archiving distinguishes
 * cemetery (nothing to keep) from compost (left a reusable seed).
 */
// statuses reachable via a simple status change (archiving is closure-gated)
const FLOW = ["active", "paused", "completed", "abandoned"];

export default function Projects({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [archiveFor, setArchiveFor] = useState(null); // project id being archived
  const [closure, setClosure] = useState({ disposition: "cemetery", what_worked: "", what_didnt: "", learned: "", guideline: "", reuse_seed: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getAndresProjects(); setProjects(r.projects || []); }
    catch (e) { setProjects([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => { await load(); onProfileChange && onProfileChange(); };

  const add = async () => {
    if (!title.trim()) return;
    try {
      await createAndresProject({ title: title.trim(), description: description.trim() });
      setTitle(""); setDescription(""); await refresh();
    } catch (e) { /* offline */ }
  };
  const setStatus = async (p, status) => {
    try { await updateAndresProject(p._id, { status }); await refresh(); } catch (e) { /* offline */ }
  };
  const approve = async (p) => {
    try { await approveAndresProject(p._id); await refresh(); } catch (e) { /* offline */ }
  };
  const remove = async (p) => {
    try { await deleteAndresProject(p._id); await refresh(); } catch (e) { /* offline */ }
  };
  const openArchive = (p) => {
    setErr("");
    setClosure({ disposition: "cemetery", what_worked: "", what_didnt: "", learned: "", guideline: "", reuse_seed: "" });
    setArchiveFor(p._id);
  };
  const submitArchive = async () => {
    setErr("");
    try { await archiveAndresProject(archiveFor, closure); setArchiveFor(null); await refresh(); }
    catch (e) { setErr(e?.message || t("andresRobotModule.projects.archiveFail")); }
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };
  const input = {
    padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
    background: colors.background, color: colors.text, width: "100%", boxSizing: "border-box",
  };

  const meta = (label, val) => val ? (
    <div style={{ fontSize: 12.5, color: colors.text }}>
      <span style={{ color: colors.textSecondary }}>{label}: </span>{val}
    </div>
  ) : null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ ...card, lineHeight: 1.6 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.projects.title")}</strong>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "6px 0 0" }}>
          {t("andresRobotModule.projects.intro")}
        </p>
      </div>

      <div style={{ ...card, display: "grid", gap: 8 }}>
        <input style={input} value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder={t("andresRobotModule.projects.titlePlaceholder")} />
        <textarea style={{ ...input, minHeight: 60, resize: "vertical" }} value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("andresRobotModule.projects.descPlaceholder")} />
        <div>
          <button onClick={add} disabled={!title.trim()}
                  style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: title.trim() ? "pointer" : "not-allowed", opacity: title.trim() ? 1 : 0.6 }}>
            {t("andresRobotModule.projects.add")}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary }}>{t("andresRobotModule.common.loading")}</div>
      ) : projects.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>{t("andresRobotModule.projects.empty")}</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {projects.map((p) => {
            const archived = p.status === "archived";
            const isProposed = p.status === "proposed";
            return (
              <div key={p._id} style={{ ...card, padding: 16, opacity: archived ? 0.75 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ color: colors.text }}>
                    {p.origin === "andres_initiative" && <span title="from Andrés' initiative">🌱 </span>}
                    {p.title}
                  </strong>
                  <span style={{ fontSize: 11, color: colors.textSecondary }}>
                    {archived
                      ? (p.archive_reason === "compost" ? "♻️ " : "🪦 ") + t(`andresRobotModule.projects.status.${p.status}`, p.status)
                      : t(`andresRobotModule.projects.status.${p.status}`, p.status)}
                  </span>
                </div>
                {p.description && <p style={{ color: colors.textSecondary, fontSize: 14, margin: "6px 0 0", lineHeight: 1.5 }}>{p.description}</p>}

                <div style={{ display: "grid", gap: 3, marginTop: 8 }}>
                  {meta(t("andresRobotModule.humanLab.benefit"), p.benefit)}
                  {meta(t("andresRobotModule.humanLab.risk"), p.risk)}
                  {meta(t("andresRobotModule.humanLab.success"), p.success_criteria)}
                  {meta(t("andresRobotModule.projects.attentionBudget"), p.attention_budget)}
                </div>

                {/* closure reflection (archived) */}
                {archived && p.closure_reflection && (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: colors.background, border: `1px dashed ${colors.border}` }}>
                    <strong style={{ fontSize: 12, color: colors.textSecondary }}>
                      {p.archive_reason === "compost" ? "♻️ " : "🪦 "}
                      {t(`andresRobotModule.projects.disposition.${p.archive_reason}`, p.archive_reason)}
                    </strong>
                    <div style={{ display: "grid", gap: 2, marginTop: 4, fontSize: 12.5, color: colors.text }}>
                      {meta(t("andresRobotModule.projects.whatWorked"), p.closure_reflection.what_worked)}
                      {meta(t("andresRobotModule.projects.whatDidnt"), p.closure_reflection.what_didnt)}
                      {meta(t("andresRobotModule.projects.learned"), p.closure_reflection.learned)}
                      {meta(t("andresRobotModule.projects.guideline"), p.closure_reflection.guideline)}
                      {meta(t("andresRobotModule.projects.reuseSeed"), p.reuse_seed)}
                    </div>
                  </div>
                )}

                {/* actions */}
                {!archived && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, alignItems: "center" }}>
                    {isProposed && (
                      <button onClick={() => approve(p)}
                              style={{ background: "#16a34a", color: "#fff", border: 0, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {t("andresRobotModule.projects.approve")}
                      </button>
                    )}
                    {!isProposed && FLOW.filter((s) => s !== p.status).map((s) => (
                      <button key={s} onClick={() => setStatus(p, s)}
                              style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                        → {t(`andresRobotModule.projects.status.${s}`, s)}
                      </button>
                    ))}
                    {!isProposed && (
                      <button onClick={() => openArchive(p)}
                              style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                        {t("andresRobotModule.projects.archive")}
                      </button>
                    )}
                    <button onClick={() => remove(p)}
                            style={{ background: "transparent", border: 0, color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                      {t("andresRobotModule.projects.delete")}
                    </button>
                  </div>
                )}

                {/* archive closure form */}
                {archiveFor === p._id && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: colors.background, border: `1px solid ${colors.primary}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>
                      {t("andresRobotModule.projects.closureTitle")}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      {["cemetery", "compost"].map((d) => (
                        <span key={d} onClick={() => setClosure((c) => ({ ...c, disposition: d }))}
                              style={{ cursor: "pointer", padding: "5px 12px", borderRadius: 999, fontSize: 12,
                                border: `1px solid ${closure.disposition === d ? colors.primary : colors.border}`,
                                background: closure.disposition === d ? colors.primary : "transparent",
                                color: closure.disposition === d ? "#fff" : colors.textSecondary }}>
                          {d === "compost" ? "♻️ " : "🪦 "}{t(`andresRobotModule.projects.disposition.${d}`)}
                        </span>
                      ))}
                    </div>
                    {["what_worked", "what_didnt", "learned", "guideline"].map((f) => (
                      <input key={f} style={{ ...input, marginBottom: 6 }} value={closure[f]}
                             onChange={(e) => setClosure((c) => ({ ...c, [f]: e.target.value }))}
                             placeholder={t(`andresRobotModule.projects.closure_${f}`)} />
                    ))}
                    {closure.disposition === "compost" && (
                      <input style={{ ...input, marginBottom: 6, borderColor: colors.primary }} value={closure.reuse_seed}
                             onChange={(e) => setClosure((c) => ({ ...c, reuse_seed: e.target.value }))}
                             placeholder={t("andresRobotModule.projects.reuseSeedPlaceholder")} />
                    )}
                    {err && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 6 }}>{err}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={submitArchive}
                              style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "7px 14px", fontWeight: 600, cursor: "pointer" }}>
                        {t("andresRobotModule.projects.confirmArchive")}
                      </button>
                      <button onClick={() => setArchiveFor(null)}
                              style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>
                        {t("andresRobotModule.projects.cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
