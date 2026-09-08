import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";
import { getAndresTimeline } from "../api";

/**
 * Andrés — Development timeline / progress (P4).
 *
 * A read-only snapshot of how Andrés has grown for this user: age, identity
 * versions, memory counts by type, reflections, skills/projects, and a recent
 * day-by-day activity series. Intended to help the owner (and a research
 * collaborator) measure and document the biography's development over time.
 */
export default function Progress() {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(false);
    getAndresTimeline(14)
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 18,
  };
  const label = (s) => t(`andresRobotModule.progress.${s}`, { defaultValue: s });

  if (loading) return <div style={{ ...card, textAlign: "center", color: colors.textSecondary }}>{label("loading")}</div>;
  if (error || !data) return <div style={{ ...card, textAlign: "center", color: "#b91c1c" }}>{label("error")}</div>;

  const totals = data.totals || {};
  const byType = totals.memories_by_type || {};
  const maxType = Math.max(1, ...Object.values(byType));
  const activity = data.activity || [];
  const maxAct = Math.max(1, ...activity.map((a) => (a.memories || 0) + (a.reflections || 0)));

  const Stat = ({ big, small }) => (
    <div style={{ ...card, textAlign: "center", padding: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: colors.primary, fontFamily: "monospace", lineHeight: 1 }}>{big}</div>
      <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 6 }}>{small}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={card}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, color: colors.text }}>📈 {label("title")}</h2>
        <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary }}>{label("subtitle")}</p>
      </div>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        <Stat big={data.age_days} small={label("ageDays")} />
        <Stat big={`v${totals.identity_versions ?? 1}`} small={label("identity")} />
        <Stat big={totals.memories ?? 0} small={label("memories")} />
        <Stat big={totals.reflections ?? 0} small={label("reflections")} />
        <Stat big={`${totals.skills_active ?? 0}/${totals.skills_total ?? 0}`} small={label("skills")} />
        <Stat big={`${totals.projects_active ?? 0}/${totals.projects_total ?? 0}`} small={label("projects")} />
        <Stat big={totals.creative_artifacts ?? 0} small={label("creative")} />
        <Stat big={totals.conversations ?? 0} small={label("conversations")} />
      </div>

      {/* Memory by type */}
      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.primary }}>{label("byType")}</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {Object.entries(byType).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([type, n]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 92, fontSize: 12, color: colors.textSecondary, textTransform: "capitalize" }}>{type}</div>
              <div style={{ flex: 1, background: colors.background, borderRadius: 6, overflow: "hidden", height: 16 }}>
                <div style={{ width: `${(n / maxType) * 100}%`, height: "100%", background: colors.primary }} />
              </div>
              <div style={{ width: 32, textAlign: "right", fontSize: 12, fontWeight: 700, color: colors.text }}>{n}</div>
            </div>
          ))}
          {Object.values(byType).every((n) => !n) && (
            <div style={{ fontSize: 12.5, color: colors.textSecondary }}>{label("empty")}</div>
          )}
        </div>
      </div>

      {/* Recent activity (last 14 days) */}
      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.primary }}>{label("activity")}</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90 }}>
          {activity.map((a) => {
            const total = (a.memories || 0) + (a.reflections || 0);
            return (
              <div key={a.date} title={`${a.date}: ${a.memories}m · ${a.reflections}r`}
                   style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
                <div style={{ width: "70%", height: `${(total / maxAct) * 70}px`, minHeight: total ? 3 : 0,
                              background: colors.primary, borderRadius: 2 }} />
                <div style={{ fontSize: 8, color: colors.textSecondary }}>{a.date.slice(5)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 8 }}>{label("activityHint")}</div>
      </div>

      {/* Identity versions */}
      {Array.isArray(data.identity_versions) && data.identity_versions.length > 0 && (
        <div style={card}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: colors.primary }}>{label("identityHistory")}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {data.identity_versions.map((v) => (
              <div key={v.version} style={{ display: "flex", gap: 10, alignItems: "baseline",
                                            padding: "8px 10px", background: colors.background, borderRadius: 8 }}>
                <span style={{ fontWeight: 800, color: colors.primary, fontFamily: "monospace" }}>v{v.version}</span>
                <span style={{ fontSize: 11, color: colors.textSecondary }}>{(v.created_at || "").slice(0, 10)}</span>
                <span style={{ fontSize: 12.5, color: colors.text, flex: 1 }}>{v.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
