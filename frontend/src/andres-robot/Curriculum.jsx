import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  getAndresCurriculum, createAndresModule, updateAndresModule,
  approveAndresModule, archiveAndresModule, deleteAndresModule,
} from "../api";

/**
 * Andrés — Curriculum ("a compass, not a school"), V5.
 *
 * Broad areas (the compass) rather than rigid subjects; each module is a small,
 * closeable unit carrying purpose / competencies / risks / success criteria /
 * review point / which memory type it may create. Two rules mirror projects:
 * nothing active without approval; nothing archived without a closure reflection
 * (cemetery / compost). The character_style area is formal but NOT dominant — its
 * 30% split (Andrés' own) is shown as reference, judged by "clearer / honester /
 * more useful / more its-own / respectful", never "sounds more alive".
 */
const AREAS = [
  "language", "reasoning", "creativity", "practical_ethics",
  "knowledge_of_user", "collaboration", "character_style",
];
const CHAR_SPLIT = [
  ["expressive_clarity", 10], ["warmth", 8], ["humor", 5],
  ["aesthetic", 5], ["fertile_weirdness", 2],
];
const MEMORY_TYPES = ["episodic", "semantic", "relational", "creative", "procedural", "reflective", "working"];
const FLOW = ["active", "paused", "completed"];

export default function Curriculum({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [modules, setModules] = useState([]);
  const [area, setArea] = useState("language");
  const [form, setForm] = useState({ title: "", purpose: "", success_criteria: "", review_at: "", memory_type: "" });
  const [archiveFor, setArchiveFor] = useState(null);
  const [closure, setClosure] = useState({ disposition: "cemetery", what_worked: "", what_didnt: "", learned: "", guideline: "", reuse_seed: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { const r = await getAndresCurriculum(); setModules(r.modules || []); }
    catch (e) { setModules([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const refresh = async () => { await load(); onProfileChange && onProfileChange(); };

  const add = async () => {
    if (!form.title.trim()) return;
    try {
      await createAndresModule({ area, ...form, title: form.title.trim() });
      setForm({ title: "", purpose: "", success_criteria: "", review_at: "", memory_type: "" });
      await refresh();
    } catch (e) { setErr(e?.message || ""); }
  };
  const setStatus = async (m, status) => { try { await updateAndresModule(m._id, { status }); await refresh(); } catch (e) {} };
  const approve = async (m) => { try { await approveAndresModule(m._id); await refresh(); } catch (e) {} };
  const remove = async (m) => { try { await deleteAndresModule(m._id); await refresh(); } catch (e) {} };
  const openArchive = (m) => {
    setErr(""); setClosure({ disposition: "cemetery", what_worked: "", what_didnt: "", learned: "", guideline: "", reuse_seed: "" });
    setArchiveFor(m._id);
  };
  const submitArchive = async () => {
    setErr("");
    try { await archiveAndresModule(archiveFor, closure); setArchiveFor(null); await refresh(); }
    catch (e) { setErr(e?.message || t("andresRobotModule.projects.archiveFail")); }
  };

  const card = { background: colors.cardBackground, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 };
  const input = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.background, color: colors.text, width: "100%", boxSizing: "border-box" };
  const meta = (label, val) => val ? <div style={{ fontSize: 12.5, color: colors.text }}><span style={{ color: colors.textSecondary }}>{label}: </span>{val}</div> : null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ ...card, lineHeight: 1.6 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.curriculum.title")}</strong>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "6px 0 0" }}>{t("andresRobotModule.curriculum.intro")}</p>
      </div>

      {/* Compass: the areas */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {AREAS.map((a) => (
          <span key={a} onClick={() => setArea(a)}
                style={{ cursor: "pointer", padding: "6px 12px", borderRadius: 999, fontSize: 12,
                  border: `1px solid ${area === a ? colors.primary : colors.border}`,
                  background: area === a ? colors.primary : "transparent",
                  color: area === a ? "#fff" : colors.textSecondary }}>
            {t(`andresRobotModule.curriculum.areas.${a}`)}
          </span>
        ))}
      </div>
      <div style={{ ...card, fontSize: 13, color: colors.textSecondary }}>
        {t(`andresRobotModule.curriculum.areaDesc.${area}`)}
        {area === "character_style" && (
          <div style={{ marginTop: 8, display: "grid", gap: 3 }}>
            <strong style={{ color: colors.text, fontSize: 12 }}>{t("andresRobotModule.curriculum.charSplitTitle")}</strong>
            {CHAR_SPLIT.map(([k, w]) => (
              <div key={k} style={{ fontSize: 12 }}>
                <span style={{ color: colors.primary, fontWeight: 600 }}>{w}%</span> {t(`andresRobotModule.curriculum.charSplit.${k}`)}
              </div>
            ))}
            <div style={{ fontSize: 11, fontStyle: "italic", marginTop: 4 }}>{t("andresRobotModule.curriculum.charSplitNote")}</div>
          </div>
        )}
      </div>

      {/* Create a module in the selected area */}
      <div style={{ ...card, display: "grid", gap: 8 }}>
        <strong style={{ color: colors.text, fontSize: 13 }}>
          {t("andresRobotModule.curriculum.newIn", { area: t(`andresRobotModule.curriculum.areas.${area}`) })}
        </strong>
        <input style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
               placeholder={t("andresRobotModule.curriculum.titlePlaceholder")} />
        <input style={input} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
               placeholder={t("andresRobotModule.curriculum.purpose")} />
        <input style={input} value={form.success_criteria} onChange={(e) => setForm({ ...form, success_criteria: e.target.value })}
               placeholder={t("andresRobotModule.curriculum.successCriteria")} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...input, flex: 1, minWidth: 140 }} value={form.review_at} onChange={(e) => setForm({ ...form, review_at: e.target.value })}
                 placeholder={t("andresRobotModule.curriculum.reviewAt")} />
          <select style={{ ...input, width: "auto" }} value={form.memory_type} onChange={(e) => setForm({ ...form, memory_type: e.target.value })}>
            <option value="">{t("andresRobotModule.curriculum.memoryTypeNone")}</option>
            {MEMORY_TYPES.map((mt) => <option key={mt} value={mt}>{t(`andresRobotModule.memory.types.${mt}`)}</option>)}
          </select>
        </div>
        {err && <div style={{ color: "#dc2626", fontSize: 12 }}>{err}</div>}
        <div>
          <button onClick={add} disabled={!form.title.trim()}
                  style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "9px 16px", fontWeight: 600, cursor: form.title.trim() ? "pointer" : "not-allowed", opacity: form.title.trim() ? 1 : 0.6 }}>
            {t("andresRobotModule.curriculum.add")}
          </button>
        </div>
      </div>

      {/* Modules */}
      {modules.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>{t("andresRobotModule.curriculum.empty")}</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {modules.map((m) => {
            const archived = m.status === "archived";
            const isProposed = m.status === "proposed";
            return (
              <div key={m._id} style={{ ...card, opacity: archived ? 0.75 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ background: colors.primaryLight, color: colors.primary, padding: "2px 9px", borderRadius: 999, fontSize: 11, marginRight: 6 }}>
                      {t(`andresRobotModule.curriculum.areas.${m.area}`, m.area)}
                    </span>
                    <strong style={{ color: colors.text }}>{m.origin === "andres_initiative" ? "🌱 " : ""}{m.title}</strong>
                  </div>
                  <span style={{ fontSize: 11, color: colors.textSecondary }}>
                    {archived ? (m.archive_reason === "compost" ? "♻️ " : "🪦 ") : ""}
                    {t(`andresRobotModule.curriculum.status.${m.status}`, m.status)}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 3, marginTop: 6 }}>
                  {meta(t("andresRobotModule.curriculum.purposeShort"), m.purpose)}
                  {meta(t("andresRobotModule.humanLab.success"), m.success_criteria)}
                  {meta(t("andresRobotModule.curriculum.reviewShort"), m.review_at)}
                  {m.memory_type && meta(t("andresRobotModule.curriculum.memoryShort"), t(`andresRobotModule.memory.types.${m.memory_type}`, m.memory_type))}
                </div>

                {archived && m.closure_reflection && (
                  <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: colors.background, border: `1px dashed ${colors.border}` }}>
                    <strong style={{ fontSize: 12, color: colors.textSecondary }}>
                      {m.archive_reason === "compost" ? "♻️ " : "🪦 "}{t(`andresRobotModule.projects.disposition.${m.archive_reason}`, m.archive_reason)}
                    </strong>
                    <div style={{ display: "grid", gap: 2, marginTop: 4, fontSize: 12.5, color: colors.text }}>
                      {meta(t("andresRobotModule.projects.learned"), m.closure_reflection.learned)}
                      {meta(t("andresRobotModule.projects.guideline"), m.closure_reflection.guideline)}
                      {meta(t("andresRobotModule.projects.reuseSeed"), m.reuse_seed)}
                    </div>
                  </div>
                )}

                {!archived && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, alignItems: "center" }}>
                    {isProposed && (
                      <button onClick={() => approve(m)} style={{ background: "#16a34a", color: "#fff", border: 0, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {t("andresRobotModule.projects.approve")}
                      </button>
                    )}
                    {!isProposed && FLOW.filter((s) => s !== m.status).map((s) => (
                      <button key={s} onClick={() => setStatus(m, s)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                        → {t(`andresRobotModule.curriculum.status.${s}`, s)}
                      </button>
                    ))}
                    {!isProposed && (
                      <button onClick={() => openArchive(m)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                        {t("andresRobotModule.projects.archive")}
                      </button>
                    )}
                    <button onClick={() => remove(m)} style={{ background: "transparent", border: 0, color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                      {t("andresRobotModule.projects.delete")}
                    </button>
                  </div>
                )}

                {archiveFor === m._id && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: colors.background, border: `1px solid ${colors.primary}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{t("andresRobotModule.projects.closureTitle")}</div>
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
                      <button onClick={submitArchive} style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "7px 14px", fontWeight: 600, cursor: "pointer" }}>
                        {t("andresRobotModule.projects.confirmArchive")}
                      </button>
                      <button onClick={() => setArchiveFor(null)} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>
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
