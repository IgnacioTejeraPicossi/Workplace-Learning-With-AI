import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import {
  andresReflect, getAndresReflections,
  andresGenerateCuriosity, getAndresCuriosity, updateAndresCuriosity,
} from "../api";

/**
 * Andrés — Journal tab (V2).
 *
 * Two feeds: his honest reflections (Reflexion-style, no weight updates) and his
 * "wonderings" (curiosity queue) — spontaneous questions he'd like to explore.
 * Both are generated on demand; offline they fall back to deterministic notes and
 * are clearly labelled as such.
 */
export default function Journal({ onProfileChange }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [reflections, setReflections] = useState([]);
  const [wonderings, setWonderings] = useState([]);
  const [reflecting, setReflecting] = useState(false);
  const [wondering, setWondering] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        getAndresReflections().catch(() => ({ reflections: [] })),
        getAndresCuriosity().catch(() => ({ wonderings: [] })),
      ]);
      setReflections(r.reflections || []);
      setWonderings(c.wonderings || []);
    } catch (e) { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reflect = async () => {
    setReflecting(true);
    try { await andresReflect(); await load(); onProfileChange && onProfileChange(); }
    catch (e) { /* offline */ }
    setReflecting(false);
  };

  const wonder = async () => {
    setWondering(true);
    try { await andresGenerateCuriosity(); await load(); }
    catch (e) { /* offline */ }
    setWondering(false);
  };

  const setStatus = async (w, status) => {
    try { await updateAndresCuriosity(w._id, status); await load(); }
    catch (e) { /* offline */ }
  };

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };
  const btn = (busy) => ({
    background: colors.primary, color: "#fff", border: 0, borderRadius: 8,
    padding: "10px 18px", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Reflections */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: colors.text }}>{t("andresRobotModule.journal.reflectionsTitle")}</strong>
          <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 0" }}>
            {t("andresRobotModule.journal.reflectionsIntro")}
          </p>
        </div>
        <button onClick={reflect} disabled={reflecting} style={btn(reflecting)}>
          {reflecting ? t("andresRobotModule.journal.reflecting") : t("andresRobotModule.journal.reflectNow")}
        </button>
      </div>

      {reflections.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.journal.noReflections")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {reflections.map((r) => (
            <div key={r._id} style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
                <span>{(r.created_at || "").slice(0, 16).replace("T", " ")}</span>
                {r.is_mock && <span style={{ fontStyle: "italic" }}>{t("andresRobotModule.journal.offlineTag")}</span>}
              </div>
              <div style={{ color: colors.text, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Curiosity queue */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: colors.text }}>{t("andresRobotModule.journal.wonderingsTitle")}</strong>
          <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 0" }}>
            {t("andresRobotModule.journal.wonderingsIntro")}
          </p>
        </div>
        <button onClick={wonder} disabled={wondering} style={btn(wondering)}>
          {wondering ? t("andresRobotModule.journal.wonderingBusy") : t("andresRobotModule.journal.wonder")}
        </button>
      </div>

      {wonderings.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: colors.textSecondary, fontStyle: "italic" }}>
          {t("andresRobotModule.journal.noWonderings")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {wonderings.map((w) => (
            <div key={w._id} style={{ ...card, padding: 14, opacity: w.status === "dismissed" ? 0.5 : 1 }}>
              <div style={{ color: colors.text, fontSize: 14, lineHeight: 1.5 }}>💭 {w.question}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: colors.textSecondary }}>
                  {t(`andresRobotModule.journal.curiosityStatus.${w.status}`, w.status)}
                </span>
                {w.status !== "explored" && (
                  <button onClick={() => setStatus(w, "explored")} style={{ background: "transparent", border: 0, color: colors.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {t("andresRobotModule.journal.markExplored")}
                  </button>
                )}
                {w.status !== "dismissed" && (
                  <button onClick={() => setStatus(w, "dismissed")} style={{ background: "transparent", border: 0, color: colors.textSecondary, fontSize: 12, cursor: "pointer" }}>
                    {t("andresRobotModule.journal.dismiss")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
