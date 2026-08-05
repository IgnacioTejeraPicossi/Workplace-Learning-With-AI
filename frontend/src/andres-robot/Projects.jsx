import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  getAndresProjects, createAndresProject, updateAndresProject, deleteAndresProject,
} from "../api";

/**
 * Andrés — Projects tab (V2).
 *
 * Small projects Andrés pursues with the user. Active projects are injected into
 * the chat prompt's [CURRENT PROJECTS] layer, so they actually shape how he shows
 * up. Fully user-editable and reversible.
 */
const STATUSES = ["active", "paused", "done", "abandoned"];

export default function Projects({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getAndresProjects(); setProjects(r.projects || []); }
    catch (e) { setProjects([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    try {
      await createAndresProject({ title: title.trim(), description: description.trim() });
      setTitle(""); setDescription("");
      await load();
      onProfileChange && onProfileChange();
    } catch (e) { /* offline */ }
  };

  const setStatus = async (p, status) => {
    try { await updateAndresProject(p._id, { status }); await load(); onProfileChange && onProfileChange(); }
    catch (e) { /* offline */ }
  };

  const remove = async (p) => {
    try { await deleteAndresProject(p._id); await load(); onProfileChange && onProfileChange(); }
    catch (e) { /* offline */ }
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };
  const input = {
    padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
    background: colors.background, color: colors.text, width: "100%", boxSizing: "border-box",
  };

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
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary }}>
          {t("andresRobotModule.common.loading")}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.projects.empty")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {projects.map((p) => (
            <div key={p._id} style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ color: colors.text }}>{p.title}</strong>
                <span style={{ fontSize: 11, color: colors.textSecondary }}>
                  {t(`andresRobotModule.projects.status.${p.status}`, p.status)}
                </span>
              </div>
              {p.description && (
                <p style={{ color: colors.textSecondary, fontSize: 14, margin: "6px 0 0", lineHeight: 1.5 }}>{p.description}</p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {STATUSES.filter((s) => s !== p.status).map((s) => (
                  <button key={s} onClick={() => setStatus(p, s)}
                          style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.textSecondary, borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                    → {t(`andresRobotModule.projects.status.${s}`, s)}
                  </button>
                ))}
                <button onClick={() => remove(p)}
                        style={{ background: "transparent", border: 0, color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                  {t("andresRobotModule.projects.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
