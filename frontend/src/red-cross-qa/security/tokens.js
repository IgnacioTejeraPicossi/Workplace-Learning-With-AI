// Shared visual tokens for the Sikkerhet og personvern workbench
// (Phase H · Pack 2). Centralised so the 7 components stay consistent
// with the rest of the Red Cross QA module (inline-style design system,
// no Tailwind here — matches the existing convention).

export const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7', label: 'PASS' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d', label: 'WARN' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5', label: 'FAIL' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1', label: '—'   },
};

export const SEV_COLOR = {
  critical: '#7f1d1d',
  high:     '#b91c1c',
  medium:   '#f59e0b',
  low:      '#10b981',
  info:     '#64748b',
};

export const FINDING_STATUS_STYLES = {
  open:           { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  accepted_risk:  { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fixed:          { bg: '#dbeafe', fg: '#1d4ed8', border: '#93c5fd' },
  verified:       { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
};

export const SCAN_TYPE_STYLES = {
  automatic:        { icon: '🤖', color: '#0891b2' },
  'semi-automatic': { icon: '⚙️',  color: '#7c3aed' },
  manual:           { icon: '🧑',  color: '#a16207' },
};

export const CATEGORY_STYLES = {
  security: { icon: '🛡️',  color: '#1e293b', bg: '#f1f5f9' },
  privacy:  { icon: '🔐',  color: '#1e3a8a', bg: '#eff6ff' },
  dpia:     { icon: '⚖️',  color: '#6b21a8', bg: '#f5f3ff' },
};

export const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
export const panelTitle = {
  margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b',
};
export const subTitle = {
  margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#334155',
};
export const hint = { fontSize: 12, color: '#64748b', margin: '0 0 10px' };

export const inputCss = {
  padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
  fontSize: 13, fontFamily: 'inherit', color: '#1e293b', width: '100%',
  boxSizing: 'border-box',
};

export const primaryBtn = (disabled, color = '#0891b2') => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#cbd5e1' : color, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
export const ghostBtn = (color) => ({
  padding: '6px 12px', borderRadius: 6, border: `1px solid ${color}`,
  backgroundColor: 'white', color, fontWeight: 600, fontSize: 12,
  cursor: 'pointer',
});

export const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 12, fontSize: 13,
};

export function formatTimestamp(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch (_) {
    return iso;
  }
}
