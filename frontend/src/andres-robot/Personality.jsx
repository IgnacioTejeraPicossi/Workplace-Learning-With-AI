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
    </div>
  );
}
