import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import { andresCreate, getAndresArtifacts, deleteAndresArtifact } from "../api";

/**
 * Andrés — Creative Studio tab (V3).
 *
 * Creativity WITH criterion — Andrés' own design ask. Every artifact is generated
 * AND evaluated (novelty + usefulness + honest self-critique), so novelty is never
 * celebrated on its own. Modes: Surprise, Surprise WITH usefulness, Surprise then
 * self-critique, and Blend two concepts.
 */
const MODES = ["surprise_useful", "surprise", "self_critique", "blend"];

function ScoreBar({ label, value, colors }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.textSecondary, marginBottom: 3 }}>
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: colors.border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: colors.primary }} />
      </div>
    </div>
  );
}

export default function Creative({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [mode, setMode] = useState("surprise_useful");
  const [seed, setSeed] = useState("");
  const [conceptA, setConceptA] = useState("");
  const [conceptB, setConceptB] = useState("");
  const [busy, setBusy] = useState(false);
  const [artifacts, setArtifacts] = useState([]);

  const load = useCallback(async () => {
    try { const r = await getAndresArtifacts(); setArtifacts(r.artifacts || []); }
    catch (e) { setArtifacts([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      await andresCreate({ mode, seed: seed.trim(), concept_a: conceptA.trim(), concept_b: conceptB.trim() });
      await load();
      onProfileChange && onProfileChange();
    } catch (e) { /* offline */ }
    setBusy(false);
  };

  const remove = async (a) => {
    try { await deleteAndresArtifact(a._id); await load(); onProfileChange && onProfileChange(); }
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
  const chip = (active) => ({
    padding: "6px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
    border: `1px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primary : "transparent",
    color: active ? "#fff" : colors.textSecondary,
  });
  const canGo = mode === "blend" ? (conceptA.trim() && conceptB.trim()) : true;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ ...card, lineHeight: 1.6 }}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.creative.title")}</strong>
        <p style={{ fontSize: 13, color: colors.textSecondary, margin: "6px 0 0" }}>
          {t("andresRobotModule.creative.intro")}
        </p>
      </div>

      <div style={{ ...card, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MODES.map((m) => (
            <span key={m} style={chip(mode === m)} onClick={() => setMode(m)}>
              {t(`andresRobotModule.creative.modes.${m}`)}
            </span>
          ))}
        </div>
        {mode === "blend" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input style={{ ...input, flex: 1, minWidth: 140 }} value={conceptA} onChange={(e) => setConceptA(e.target.value)}
                   placeholder={t("andresRobotModule.creative.conceptA")} />
            <span style={{ alignSelf: "center", color: colors.textSecondary }}>+</span>
            <input style={{ ...input, flex: 1, minWidth: 140 }} value={conceptB} onChange={(e) => setConceptB(e.target.value)}
                   placeholder={t("andresRobotModule.creative.conceptB")} />
          </div>
        ) : (
          <input style={input} value={seed} onChange={(e) => setSeed(e.target.value)}
                 placeholder={t("andresRobotModule.creative.seedPlaceholder")} />
        )}
        <div>
          <button onClick={create} disabled={busy || !canGo}
                  style={{ background: colors.primary, color: "#fff", border: 0, borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: busy || !canGo ? "not-allowed" : "pointer", opacity: busy || !canGo ? 0.6 : 1 }}>
            {busy ? t("andresRobotModule.creative.creating") : t("andresRobotModule.creative.create")}
          </button>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.creative.empty")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {artifacts.map((a) => (
            <div key={a._id} style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                <span style={{ background: colors.primaryLight, color: colors.primary, padding: "2px 10px", borderRadius: 999, fontSize: 11 }}>
                  {t(`andresRobotModule.creative.modes.${a.mode}`, a.mode)}
                </span>
                {a.is_mock && (
                  <span style={{ fontSize: 11, color: colors.textSecondary, fontStyle: "italic" }}>
                    {t("andresRobotModule.creative.offlineTag")}
                  </span>
                )}
              </div>
              <div style={{ color: colors.text, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.content}</div>

              <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                <ScoreBar label={t("andresRobotModule.creative.novelty")} value={a.novelty} colors={colors} />
                <ScoreBar label={t("andresRobotModule.creative.usefulness")} value={a.usefulness} colors={colors} />
              </div>

              {a.self_critique && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: colors.background, border: `1px dashed ${colors.border}` }}>
                  <strong style={{ fontSize: 12, color: colors.textSecondary }}>🪞 {t("andresRobotModule.creative.selfCritique")}</strong>
                  <div style={{ fontSize: 13, color: colors.text, marginTop: 4, lineHeight: 1.5 }}>{a.self_critique}</div>
                </div>
              )}

              <div style={{ marginTop: 10, textAlign: "right" }}>
                <button onClick={() => remove(a)} style={{ background: "transparent", border: 0, color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {t("andresRobotModule.creative.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
