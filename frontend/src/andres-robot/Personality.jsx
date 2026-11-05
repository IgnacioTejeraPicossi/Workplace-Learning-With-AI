import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";

/**
 * Andrés — Personality tab (V2, read view).
 *
 * Shows the current *evolving* identity: version, self-description, interests and
 * numeric traits as bars. The identity only ever changes through the Evolution
 * tab (user-approved proposals); this tab is a faithful mirror of the current
 * version. The immutable constitution is never shown as editable.
 */
export default function Personality({ profile }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const id = profile?.identity || {};
  const traits = id.traits || {};
  const interests = id.core_interests || [];

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };

  if (!profile) {
    return (
      <div style={{ ...card, textAlign: "center", color: colors.textSecondary }}>
        {t("andresRobotModule.personality.loading")}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <strong style={{ color: colors.text, fontSize: 16 }}>
            {t("andresRobotModule.personality.title")}
          </strong>
          <span style={{ background: colors.primaryLight, color: colors.primary, padding: "2px 10px", borderRadius: 999, fontSize: 12 }}>
            v{id.version ?? 1}
          </span>
        </div>
        <p style={{ color: colors.text, lineHeight: 1.6, marginBottom: 0 }}>{id.self_description}</p>
      </div>

      <div style={card}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.personality.interests")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {interests.length === 0 && (
            <span style={{ color: colors.textSecondary, fontStyle: "italic" }}>—</span>
          )}
          {interests.map((it) => (
            <span key={it} style={{ background: colors.primaryLight, color: colors.primary, padding: "4px 12px", borderRadius: 999, fontSize: 13 }}>
              {it}
            </span>
          ))}
        </div>
      </div>

      <div style={card}>
        <strong style={{ color: colors.text }}>{t("andresRobotModule.personality.traits")}</strong>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 12, fontStyle: "italic" }}>
          {t("andresRobotModule.personality.traitsNote")}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(traits).map(([k, v]) => (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.text, marginBottom: 3 }}>
                <span>{t(`andresRobotModule.personality.traitNames.${k}`, k)}</span>
                <span style={{ color: colors.textSecondary }}>{v}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: colors.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, v))}%`, background: colors.primary }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Andrés' Mirror & Dual Charter — also surfaced inside Personality ("how I work inside") */}
      <div style={{ ...card, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ color: colors.text }}>
            🪞 {t("andresRobotModule.home.dualCharter.title")}
          </strong>
          <span style={{
            fontSize: 11, fontWeight: 700, fontFamily: "monospace",
            padding: "2px 9px", borderRadius: 999,
            background: colors.primaryLight, color: colors.primary,
          }}>
            {t("andresRobotModule.home.dualCharter.versionBadge", {
              v: id.version ?? 1,
              skills: profile?.counters?.active_skills ?? 0,
            })}
          </span>
        </div>
        <blockquote style={{
          margin: 0, padding: "10px 14px", borderRadius: 8,
          borderLeft: `4px solid ${colors.primary}`, background: colors.background,
          color: colors.text, fontSize: 13, lineHeight: 1.55, fontStyle: "italic",
        }}>
          “{t("andresRobotModule.home.dualCharter.mirrorQuote")}”
          <div style={{ marginTop: 4, fontSize: 11.5, fontStyle: "normal", color: colors.textSecondary, fontWeight: 600 }}>
            — {t("andresRobotModule.home.dualCharter.mirrorAttribution", { v: id.version ?? 1 })}
          </div>
        </blockquote>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 6 }}>
              ✓ {t("andresRobotModule.home.dualCharter.canDoTitle")}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, color: "#14532d", fontSize: 12.5, lineHeight: 1.5 }}>
              {["c1", "c2", "c3", "c4", "c5"].map((k) => (
                <li key={k}>{t(`andresRobotModule.home.dualCharter.canDo.${k}`)}</li>
              ))}
            </ul>
          </div>
          <div style={{ padding: 12, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#991b1b", marginBottom: 6 }}>
              ✗ {t("andresRobotModule.home.dualCharter.neverPretendTitle")}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, color: "#7f1d1d", fontSize: 12.5, lineHeight: 1.5 }}>
              {["n1", "n2", "n3", "n4", "n5"].map((k) => (
                <li key={k}>{t(`andresRobotModule.home.dualCharter.neverPretend.${k}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
