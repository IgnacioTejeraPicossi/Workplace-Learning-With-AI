/**
 * _EnonicSignals — shared presentational components for the Enonic-XP-aligned
 * signals the Red Cross QA backend already produces but the UI historically
 * ignored (audit P3, closing deferred item #3 of the 2026-05 Enonic roundup).
 *
 * All are defensive: each returns null when its field is absent/empty, so
 * callers can drop them in unconditionally without guarding every shape.
 *
 * Signals covered:
 *   - enonic_xp_pattern  (string skill-section ref)  -> <EnonicPatternBadge>
 *   - cross_tool_refs    (flat {label: value} dict)   -> <CrossToolRefs>
 *   - composite_score    (0-100 number)               -> <CompositeScore>
 *   - delta_pct          (signed % vs a baseline)     -> <DeltaPct>
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

// 🧩 Skill-section reference, e.g. "security-patterns.md §2 (Over-permissive ACL)".
// Tiny by design — a credibility cue on a finding, never the main content.
export const EnonicPatternBadge = ({ pattern, style = {} }) => {
  if (!pattern || typeof pattern !== 'string') return null;
  return (
    <span
      title={pattern}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10.5, fontWeight: 700, color: '#7c3aed',
        background: '#f5f3ff', border: '1px solid #ddd6fe',
        borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap',
        maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis',
        ...style,
      }}
    >
      🧩 {pattern}
    </span>
  );
};

// A signed percentage vs a stored baseline. `higherIsBetter` flips the colour
// semantics: perf p95 rising is bad (red), a compliance score rising is good
// (green). Renders nothing when delta is null/undefined.
export const DeltaPct = ({ delta, higherIsBetter = false, style = {} }) => {
  if (delta === null || delta === undefined || Number.isNaN(Number(delta))) return null;
  const d = Number(delta);
  const flat = Math.abs(d) < 0.05;
  const improved = flat ? null : (higherIsBetter ? d > 0 : d < 0);
  const color = flat ? '#64748b' : improved ? '#16a34a' : '#dc2626';
  const bg = flat ? '#f1f5f9' : improved ? '#f0fdf4' : '#fef2f2';
  const arrow = flat ? '→' : d > 0 ? '▲' : '▼';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 10.5, fontWeight: 700, color, background: bg,
        border: `1px solid ${color}33`, borderRadius: 999, padding: '2px 7px',
        ...style,
      }}
    >
      {arrow} {d > 0 ? '+' : ''}{d.toFixed(1)}%
    </span>
  );
};

// Composite 0-100 score pill with a red/amber/green band.
export const CompositeScore = ({ score, label, style = {} }) => {
  const { t } = useTranslation();
  if (score === null || score === undefined || Number.isNaN(Number(score))) return null;
  const s = Math.round(Number(score));
  const color = s >= 80 ? '#16a34a' : s >= 55 ? '#a16207' : '#dc2626';
  const bg = s >= 80 ? '#f0fdf4' : s >= 55 ? '#fffbeb' : '#fef2f2';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 6,
        border: `1px solid ${color}44`, background: bg, borderRadius: 10,
        padding: '6px 12px', ...style,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
        {label || t('redCrossWebQaModule.enonicSignals.compositeScore', { defaultValue: 'Composite score' })}
      </span>
      <span style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1, fontFamily: 'monospace' }}>{s}</span>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>/ 100</span>
    </span>
  );
};

// "Related tools & specs" strip built from a flat {label: value} dict. Endpoint
// values (start with "/") render as code; spec values render as-is. Purely
// informational — reduces "where do I find X?" confusion in workshop demos.
export const CrossToolRefs = ({ refs, style = {} }) => {
  const { t } = useTranslation();
  if (!refs || typeof refs !== 'object') return null;
  const entries = Object.entries(refs).filter(([, v]) => typeof v === 'string' && v.trim());
  if (entries.length === 0) return null;
  const prettyKey = (k) => k.replace(/_/g, ' ').replace(/\bendpoint\b/i, '').replace(/\bspec\b/i, '').trim();
  return (
    <div
      style={{
        marginTop: 12, padding: '10px 14px', borderRadius: 10,
        background: '#f8fafc', border: '1px dashed #cbd5e1', ...style,
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
        🔗 {t('redCrossWebQaModule.enonicSignals.relatedTools', { defaultValue: 'Related tools & specs' })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {entries.map(([k, v]) => (
          <span
            key={k}
            title={v}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#334155', background: '#fff',
              border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 9px', maxWidth: 360,
            }}
          >
            <strong style={{ color: '#0f172a', fontWeight: 700 }}>{prettyKey(k)}</strong>
            <code style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</code>
          </span>
        ))}
      </div>
    </div>
  );
};

export default { EnonicPatternBadge, DeltaPct, CompositeScore, CrossToolRefs };
