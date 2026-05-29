import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Shared layout for Web Lab placeholder pages (V0 · 1.16.0).
 *
 * Both Item.no web and Redcross.no web render the same structure:
 *   - Hero with icon + title + subtitle
 *   - V0 status badge
 *   - "What this module will do" intent list (shared across both pages)
 *   - Per-project meta (production URL, planned local port)
 *   - Optional "Related agent" cross-link (used by Redcross.no → RC QA Agent)
 *   - Roadmap (V0 → V3)
 *
 * Strings come from common.json `webLab.*` so EN/NO/ES stay in sync.
 */
export default function WebLabPage({
  icon,
  gradient,
  accentColor,
  titleKey,
  subtitleKey,
  productionUrl,
  plannedLocalPort,
  // i18n keys for the meta labels (each project page passes its own so we
  // can localise differently per project if ever needed — currently they
  // all resolve to "Production URL" / "Planned local port")
  productionUrlLabelKey,
  plannedLocalPortLabelKey,
  relatedAgentKey,         // optional — only Redcross.no uses this
  relatedAgentHintKey,     // optional
  onOpenRelatedAgent,      // optional click handler (sets active section)
}) {
  const { t } = useTranslation();

  const intentItems = ['i1', 'i2', 'i3', 'i4', 'i5'];
  const roadmapPhases = ['v0', 'v1', 'v2', 'v3'];

  return (
    <div style={styles.shell}>
      {/* Hero */}
      <div style={{ ...styles.hero, background: gradient }}>
        <div style={styles.heroIconWrap}>
          <span style={styles.heroIcon}>{icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.heroBadge}>
            {t('webLab.statusBadge')}
          </div>
          <h1 style={styles.heroTitle}>{t(titleKey)}</h1>
          <p style={styles.heroSubtitle}>{t(subtitleKey)}</p>
        </div>
      </div>

      {/* Status hint */}
      <div style={{ ...styles.panel, borderLeft: `4px solid ${accentColor}` }}>
        <p style={styles.statusHint}>
          {t('webLab.statusHint')}
        </p>
      </div>

      {/* Project meta */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>📍 {t('webLab.moduleTitle')}</h3>
        <div style={styles.metaGrid}>
          <MetaItem
            label={t(productionUrlLabelKey)}
            value={productionUrl}
            isLink
            color={accentColor}
          />
          <MetaItem
            label={t(plannedLocalPortLabelKey)}
            value={plannedLocalPort}
            color={accentColor}
          />
        </div>
      </div>

      {/* Intent — what this module will do */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>🎯 {t('webLab.intent')}</h3>
        <ul style={styles.intentList}>
          {intentItems.map(k => (
            <li key={k} style={styles.intentItem}>
              {t(`webLab.intentItems.${k}`)}
            </li>
          ))}
        </ul>
      </div>

      {/* Optional cross-reference to a related agent (used by Redcross page) */}
      {relatedAgentKey && (
        <div style={{ ...styles.panel, backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626' }}>
          <h3 style={styles.panelTitle}>
            🔗 {t(relatedAgentKey)}
          </h3>
          <p style={styles.relatedHint}>
            {t(relatedAgentHintKey)}
          </p>
          {onOpenRelatedAgent && (
            <button onClick={onOpenRelatedAgent} style={styles.relatedBtn}>
              → {t(relatedAgentKey)}
            </button>
          )}
        </div>
      )}

      {/* Roadmap */}
      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>🗺️ {t('webLab.roadmap')}</h3>
        <ol style={styles.roadmapList}>
          {roadmapPhases.map((k, i) => (
            <li key={k} style={{
              ...styles.roadmapItem,
              ...(i === 0 ? styles.roadmapItemCurrent : {}),
            }}>
              {t(`webLab.roadmapPhases.${k}`)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────
const MetaItem = ({ label, value, isLink, color }) => (
  <div style={{
    padding: '12px 14px', borderRadius: 10,
    backgroundColor: `${color}08`, border: `1px solid ${color}30`,
  }}>
    <div style={{
      fontSize: 10, color, textTransform: 'uppercase',
      fontWeight: 700, letterSpacing: 0.4, marginBottom: 4,
    }}>{label}</div>
    {isLink ? (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{
        fontSize: 14, fontWeight: 600, color: '#1e293b',
        fontFamily: 'ui-monospace, monospace', textDecoration: 'none',
        wordBreak: 'break-all',
      }}>{value} ↗</a>
    ) : (
      <div style={{
        fontSize: 14, fontWeight: 600, color: '#1e293b',
        fontFamily: 'ui-monospace, monospace',
      }}>{value}</div>
    )}
  </div>
);

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  shell: {
    padding: 24, backgroundColor: '#f8fafc', minHeight: '100%',
    display: 'grid', gap: 18,
  },
  hero: {
    display: 'flex', alignItems: 'center', gap: 18,
    padding: 28, borderRadius: 16, color: 'white',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  heroIcon: { fontSize: 36 },
  heroBadge: {
    display: 'inline-block', padding: '4px 10px', borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)', color: 'white',
    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 8,
  },
  heroTitle: { margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1.2 },
  heroSubtitle: { margin: '6px 0 0', fontSize: 14, opacity: 0.9, lineHeight: 1.5 },
  panel: {
    backgroundColor: 'white', borderRadius: 12, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
  },
  panelTitle: { margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1e293b' },
  statusHint: { margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.55 },
  metaGrid: {
    display: 'grid', gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  },
  intentList: {
    margin: 0, paddingLeft: 0, listStyle: 'none',
    display: 'grid', gap: 8,
  },
  intentItem: {
    padding: '10px 14px', borderRadius: 8,
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    fontSize: 13, color: '#334155', lineHeight: 1.45,
  },
  roadmapList: { margin: 0, paddingLeft: 22, display: 'grid', gap: 6 },
  roadmapItem: { fontSize: 13, color: '#475569', lineHeight: 1.5 },
  roadmapItemCurrent: { color: '#15803d', fontWeight: 600 },
  relatedHint: { margin: '0 0 12px', fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 },
  relatedBtn: {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    backgroundColor: '#dc2626', color: 'white',
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  },
};
