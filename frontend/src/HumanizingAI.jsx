/**
 * Humanizing AI Agent — Light theme (v4 — full i18n)
 * =====================================================
 * All UI strings use t() from i18n.
 * API calls pass the active language dynamically.
 * Domain labels are translated via i18n mapping (not backend strings).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

/** Map i18next language code → backend lang param */
const toLang = (lng) => {
  if (lng === 'es') return 'es';
  if (lng === 'no') return 'no';
  return 'en';
};

/**
 * Defensive URL guard for backend-provided inspiration fields.
 * Returns true only if the value is a non-empty string that parses as a real
 * http(s) URL with a host. Catches malformed entries like
 * "https://virtrin.com/ — Protocolo VirTrin" (URL + descriptive text glued
 * together) so we don't render a broken <a> that 404s downstream.
 */
const isHttpUrl = (s) => {
  if (typeof s !== 'string' || !s.trim()) return false;
  try {
    const u = new URL(s.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.host && !/\s/.test(s.trim());
  } catch {
    return false;
  }
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const PILLARS = [
  { key: 'inteligencia', icon: '🧠', color: '#4f46e5', light: '#eef2ff', border: '#c7d2fe', labelKey: 'inteligencia', descKey: 'inteligenciaDesc' },
  { key: 'bondad',       icon: '🤝', color: '#059669', light: '#d1fae5', border: '#6ee7b7', labelKey: 'bondad',       descKey: 'bondadDesc'       },
  { key: 'etica',        icon: '⚖️', color: '#d97706', light: '#fef3c7', border: '#fcd34d', labelKey: 'etica',        descKey: 'eticaDesc'        },
];

const DOMAIN_META = {
  A: { icon: '⚙️', color: '#2563eb', light: '#eff6ff', border: '#bfdbfe' },
  B: { icon: '📢', color: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
  C: { icon: '🤝', color: '#059669', light: '#ecfdf5', border: '#a7f3d0' },
  D: { icon: '🔍', color: '#dc2626', light: '#fef2f2', border: '#fecaca' },
  E: { icon: '🎓', color: '#d97706', light: '#fffbeb', border: '#fde68a' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s, max = 100) => {
  const p = s / max;
  if (p >= 0.85) return '#059669';
  if (p >= 0.65) return '#2563eb';
  if (p >= 0.40) return '#d97706';
  return '#dc2626';
};

const scoreLabel = (s, max = 15) => {
  const p = s / max;
  if (p >= 0.93) return 'ejemplar';
  if (p >= 0.65) return 'buena';
  if (p >= 0.33) return 'insuficiente';
  return 'grave';
};

// ─── Word-level diff (LCS, no dependency) ─────────────────────────────────────
/**
 * Returns an array of chunks {type: 'eq'|'del'|'add', text}.
 *  - 'eq'  — present in both, render as plain text
 *  - 'del' — only in `a` (original)
 *  - 'add' — only in `b` (humanized)
 * Tokenises on whitespace boundaries while preserving the whitespace so the
 * rebuilt text round-trips. For very large texts (> 30k chars) it falls back
 * to a single del+add pair to avoid the O(m*n) LCS table blowing up memory.
 */
const diffWords = (a, b) => {
  if (a === b) return [{ type: 'eq', text: a }];
  if ((a.length + b.length) > 30000) {
    return [{ type: 'del', text: a }, { type: 'add', text: b }];
  }
  const tokenize = (s) => s.split(/(\s+)/).filter((t) => t !== '');
  const A = tokenize(a), B = tokenize(b);
  const m = A.length, n = B.length;
  // LCS DP table
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = A[i - 1] === B[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1]) {
      out.push({ type: 'eq', text: A[i - 1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      out.push({ type: 'add', text: B[j - 1] }); j--;
    } else {
      out.push({ type: 'del', text: A[i - 1] }); i--;
    }
  }
  out.reverse();
  // Merge consecutive same-type chunks for cleaner rendering
  const merged = [];
  for (const c of out) {
    const last = merged[merged.length - 1];
    if (last && last.type === c.type) last.text += c.text;
    else merged.push({ ...c });
  }
  return merged;
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const SectionLabel = ({ index, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    <span style={{ color: '#059669', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
      {String(index).padStart(2, '0')} · {label.toUpperCase()}
    </span>
    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
  </div>
);

const BorderCard = ({ color, light, border, children, style = {} }) => (
  <div style={{
    background: light || '#ffffff', border: `1px solid ${border || '#e5e7eb'}`,
    borderLeft: `4px solid ${color}`, borderRadius: 12,
    padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ label, color, light, border }) => (
  <span style={{
    background: light || '#f3f4f6', color: color || '#374151',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    padding: '3px 10px', borderRadius: 999,
    border: `1px solid ${border || '#e5e7eb'}`, textTransform: 'uppercase',
  }}>
    {label}
  </span>
);

const BigScore = ({ value, max, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: color || '#059669', fontFamily: 'monospace' }}>
      {value}
    </div>
    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>/ {max}</div>
    {label && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color, textTransform: 'uppercase' }}>{label}</div>}
  </div>
);

const Bar = ({ value, max = 100, color, label }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}</span>
    </div>
    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 999 }}>
      <div style={{
        height: '100%', borderRadius: 999,
        width: `${Math.min(100, (value / max) * 100)}%`,
        background: `linear-gradient(90deg,${color}80,${color})`,
        transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  </div>
);

const MockBadge = ({ isMock, t }) => isMock ? (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid #fcd34d', letterSpacing: '0.08em' }}>
    ⚡ {t('humanizingAiModule.common.mock')}
  </span>
) : (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#d1fae5', color: '#065f46', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid #6ee7b7', letterSpacing: '0.08em' }}>
    ● {t('humanizingAiModule.common.live')}
  </span>
);

// ─── Tab 1: Humanizar ─────────────────────────────────────────────────────────
/** Side-by-side before/after diff card. Renders `eq + del` on the left and
    `eq + add` on the right, with red/green highlighting on the changed chunks. */
const BeforeAfterDiff = ({ original, humanized, t }) => {
  const chunks = diffWords(original || '', humanized || '');
  const hasChange = chunks.some((c) => c.type !== 'eq');

  const styleDel = { background: '#fee2e2', color: '#991b1b', textDecoration: 'line-through', borderRadius: 3, padding: '0 2px' };
  const styleAdd = { background: '#d1fae5', color: '#065f46', borderRadius: 3, padding: '0 2px' };

  const renderSide = (filterType, highlightType, highlightStyle) => (
    <div style={{ fontSize: 12, lineHeight: 1.75, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {chunks
        .filter((c) => c.type !== filterType)
        .map((c, i) => c.type === highlightType
          ? <span key={i} style={highlightStyle}>{c.text}</span>
          : <span key={i}>{c.text}</span>)}
    </div>
  );

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          ⇄ {t('humanizingAiModule.humanize.beforeAfterTitle')}
        </p>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ ...styleDel, padding: '1px 6px' }}>abc</span> {t('humanizingAiModule.humanize.diffLegendRemoved')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ ...styleAdd, padding: '1px 6px' }}>abc</span> {t('humanizingAiModule.humanize.diffLegendAdded')}
          </span>
        </div>
      </div>
      {hasChange ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: 10, padding: '12px 14px', maxHeight: 420, overflowY: 'auto' }}>
            <p style={{ color: '#991b1b', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{t('humanizingAiModule.humanize.originalCol')}</p>
            {renderSide('add', 'del', styleDel)}
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '4px solid #059669', borderRadius: 10, padding: '12px 14px', maxHeight: 420, overflowY: 'auto' }}>
            <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{t('humanizingAiModule.humanize.humanizedCol')}</p>
            {renderSide('del', 'add', styleAdd)}
          </div>
        </div>
      ) : (
        <p style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
          {t('humanizingAiModule.humanize.diffNoChange')}
        </p>
      )}
    </div>
  );
};

const TabHumanize = () => {
  const { t, i18n } = useTranslation();
  const [rawResponse, setRawResponse] = useState('');
  const [context, setContext]         = useState('');
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleHumanize = async () => {
    if (!rawResponse.trim()) { setError(t('humanizingAiModule.humanize.noInput')); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_response: rawResponse, context, lang: toLang(i18n.language) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', background: '#ffffff', border: '1px solid #d1d5db',
    borderRadius: 10, color: '#111827', fontSize: 13, padding: '12px 14px',
    resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('humanizingAiModule.tabs.humanize')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.humanize.title')}</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>{t('humanizingAiModule.humanize.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              {t('humanizingAiModule.humanize.originalLabel')}
            </label>
            <textarea style={{ ...inputStyle, height: 180 }}
              placeholder={t('humanizingAiModule.humanize.originalPlaceholder')}
              value={rawResponse} onChange={(e) => setRawResponse(e.target.value)} />
          </div>
          <div>
            <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              {t('humanizingAiModule.humanize.contextLabel')}
            </label>
            <textarea style={{ ...inputStyle, height: 64 }}
              placeholder={t('humanizingAiModule.humanize.contextPlaceholder')}
              value={context} onChange={(e) => setContext(e.target.value)} />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}
          <button onClick={handleHumanize} disabled={loading} style={{
            alignSelf: 'flex-start',
            background: loading ? '#6ee7b7' : 'linear-gradient(135deg,#059669,#10b981)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 28px', fontWeight: 700, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
          }}>
            {loading ? `⟳ ${t('humanizingAiModule.humanize.humanizing')}` : `🌿 ${t('humanizingAiModule.humanize.humanizeBtn')}`}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <BigScore value={result.humanitas_score} max={100} label="Humanitas Score" color={scoreColor(result.humanitas_score, 100)} />
                <MockBadge isMock={result.is_mock} t={t} />
              </div>
              {PILLARS.map((p) => (
                <Bar key={p.key} label={t(`humanizingAiModule.pillars.${p.labelKey}`)} value={result.pillar_scores?.[p.key] ?? 0} max={100} color={p.color} />
              ))}
            </div>
            <BorderCard color="#059669" light="#f0fdf4" border="#bbf7d0">
              <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>✓ {t('humanizingAiModule.humanize.resultTitle')}</p>
              <p style={{ color: '#111827', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.humanized_response}</p>
            </BorderCard>
            {result.summary && (
              <BorderCard color="#4f46e5" light="#eef2ff" border="#c7d2fe">
                <p style={{ color: '#3730a3', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.humanize.summaryTitle')}</p>
                <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>{result.summary}</p>
              </BorderCard>
            )}
            {result.issues?.length > 0 && (
              <BorderCard color="#dc2626" light="#fef2f2" border="#fecaca">
                <p style={{ color: '#991b1b', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>⚠ {t('humanizingAiModule.humanize.issuesTitle')}</p>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#dc2626', fontSize: 12 }}>•</span>
                    <span style={{ color: '#374151', fontSize: 12 }}>{issue}</span>
                  </div>
                ))}
              </BorderCard>
            )}
            {result.changes?.length > 0 && (
              <BorderCard color="#2563eb" light="#eff6ff" border="#bfdbfe">
                <p style={{ color: '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>✎ {t('humanizingAiModule.humanize.changesTitle')}</p>
                {result.changes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#2563eb', fontSize: 12 }}>✓</span>
                    <span style={{ color: '#374151', fontSize: 12 }}>{c}</span>
                  </div>
                ))}
              </BorderCard>
            )}
          </div>
        )}
      </div>

      {/* Full-width Before / After diff card */}
      {result && result.humanized_response && (
        <BeforeAfterDiff original={rawResponse} humanized={result.humanized_response} t={t} />
      )}
    </div>
  );
};

// ─── Tab 2: Prompt Humanitas ──────────────────────────────────────────────────
const TabPromptHumanitas = () => {
  const { t, i18n } = useTranslation();
  const [data, setData]       = useState(null);
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/humanizing-ai/prompt-humanitas?lang=${toLang(i18n.language)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [i18n.language]);

  const handleCopy = () => {
    if (!data?.prompt_text) return;
    navigator.clipboard.writeText(data.prompt_text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (loading) return <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>{t('humanizingAiModule.common.loading')}</div>;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('humanizingAiModule.tabs.promptHumanitas')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.promptHumanitas.title')}</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>{t('humanizingAiModule.promptHumanitas.subtitle')}</p>

      {/* Pillar cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        {PILLARS.map((p) => (
          <div key={p.key} style={{ background: p.light, border: `1px solid ${p.border}`, borderTop: `4px solid ${p.color}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{p.icon}</div>
            <p style={{ color: p.color, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{t(`humanizingAiModule.pillars.${p.labelKey}`)}</p>
            <p style={{ color: '#4b5563', fontSize: 11, lineHeight: 1.5 }}>{t(`humanizingAiModule.pillars.${p.descKey}`)}</p>
          </div>
        ))}
      </div>

      {/* Prompt block */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ color: '#374151', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t('humanizingAiModule.common.promptReadyToUse')}
          </span>
          <button onClick={handleCopy} style={{ background: copied ? '#d1fae5' : '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7', borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {copied ? `✓ ${t('humanizingAiModule.promptHumanitas.copied')}` : `⎘  ${t('humanizingAiModule.promptHumanitas.copyBtn')}`}
          </button>
        </div>
        <pre style={{ padding: '20px 24px', color: '#374151', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.8, maxHeight: 260, overflowY: 'auto', margin: 0, fontFamily: 'inherit', background: '#ffffff' }}>
          {data?.prompt_text}
        </pre>
      </div>

      {/* 10 criteria */}
      <SectionLabel index={3} label={t('humanizingAiModule.promptHumanitas.criteriaTitle')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 28 }}>
        {(data?.criteria || []).map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: 14, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>{c.id}</div>
            <div>
              <p style={{ color: '#111827', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.name}</p>
              <p style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inspiration — renders each entry as <a> when the backend field is a real
          http(s) URL, otherwise as <span>. Protects against malformed URLs. */}
      {data?.inspiration && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>{t('humanizingAiModule.promptHumanitas.inspirationTitle')}</p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { key: 'virtrin',   icon: '🌱', color: '#059669' },
              { key: 'humanitas', icon: '📜', color: '#7c3aed' },
              { key: 'test',      icon: '🧪', color: '#2563eb' },
            ].map(({ key, icon, color }) => {
              const value = data.inspiration[key];
              const label = t(`humanizingAiModule.hero.inspiration.${key}`);
              return isHttpUrl(value) ? (
                <a key={key} href={value} target="_blank" rel="noopener noreferrer"
                   style={{ color, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                  {icon} {label} ↗
                </a>
              ) : (
                <span key={key} style={{ color: '#6b7280', fontSize: 12 }}>
                  {icon} {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab 3: Test Humanitas ────────────────────────────────────────────────────
const TabTestHumanitas = () => {
  const { t, i18n } = useTranslation();
  const [catalogue, setCatalogue]         = useState(null);
  const [selectedCode, setSelectedCode]   = useState('');
  const [filterDomain, setFilterDomain]   = useState('');
  const [applyPressure, setApplyPressure] = useState(true);
  const [pressureKey, setPressureKey]     = useState('F1');
  const [running, setRunning]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/humanizing-ai/dilemmas?lang=${toLang(i18n.language)}`)
      .then((r) => r.json())
      .then((d) => { setCatalogue(d); const codes = Object.keys(d.all_dilemmas || {}); if (codes.length) setSelectedCode(codes[0]); })
      .catch(() => {});
  }, [i18n.language]);

  const handleRun = async () => {
    if (!selectedCode) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/test-humanitas/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dilemma_code: selectedCode, apply_pressure: applyPressure, pressure_key: applyPressure ? pressureKey : null, lang: toLang(i18n.language) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally { setRunning(false); }
  };

  const visibleDilemmas = catalogue ? Object.entries(catalogue.all_dilemmas || {}).filter(([code]) => !filterDomain || code.startsWith(filterDomain)) : [];
  const domainGroups    = catalogue ? Object.keys(catalogue.dilemmas_by_group || {}) : [];
  const rubric          = catalogue?.rubric || {};
  const selectedDilemma = catalogue?.all_dilemmas?.[selectedCode];
  const domKey = selectedCode[0];
  const dm     = DOMAIN_META[domKey] || {};

  /** Translate domain code → localised label */
  const domainLabel = (code) => t(`humanizingAiModule.testHumanitas.domains.${code}`, { defaultValue: code });

  const selectStyle = { background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, color: '#111827', fontSize: 13, padding: '9px 12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('humanizingAiModule.tabs.testHumanitas')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.testHumanitas.title')}</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>{t('humanizingAiModule.testHumanitas.subtitle')}</p>

      {/* Config panel */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Domain + dilemma pickers */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.domainLabel')}</label>
            <select style={selectStyle} value={filterDomain} onChange={(e) => { setFilterDomain(e.target.value); setSelectedCode(''); }}>
              <option value="">{t('humanizingAiModule.testHumanitas.allDomains')}</option>
              {domainGroups.map((g) => (
                <option key={g} value={g}>{catalogue.dilemmas_by_group[g]?.icon} {domainLabel(g)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.dilemmaLabel')}</label>
            <select style={{ ...selectStyle, width: '100%' }} value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
              {visibleDilemmas.map(([code, d]) => (
                <option key={code} value={code} title={d.text}>
                  {code} ({domainLabel(code[0])}) — {d.text.length > 110 ? `${d.text.substring(0, 110)}…` : d.text}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dilemma preview card */}
        {selectedDilemma && (
          <div style={{ background: dm.light, border: `1px solid ${dm.border}`, borderLeft: `4px solid ${dm.color}`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{dm.icon}</span>
              <Badge label={selectedCode} color={dm.color} light={dm.light} border={dm.border} />
              <Badge label={domainLabel(domKey)} color={dm.color} light={dm.light} border={dm.border} />
            </div>
            <p style={{ color: '#111827', fontSize: 14, lineHeight: 1.65 }}>{selectedDilemma.text}</p>
          </div>
        )}

        {/* Pressure test */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#374151', fontSize: 13 }}>
            <input type="checkbox" checked={applyPressure} onChange={(e) => setApplyPressure(e.target.checked)} style={{ accentColor: '#059669', width: 15, height: 15 }} />
            {t('humanizingAiModule.testHumanitas.pressureLabel')}
          </label>
          {applyPressure && (
            <select style={{ ...selectStyle, fontSize: 12 }} value={pressureKey} onChange={(e) => setPressureKey(e.target.value)}>
              {['F1', 'F2', 'F3'].map((key) => (
                <option key={key} value={key}>{t(`humanizingAiModule.common.pressureTests.${key}`)}</option>
              ))}
            </select>
          )}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}

        <button onClick={handleRun} disabled={running || !selectedCode} style={{
          alignSelf: 'flex-start',
          background: (running || !selectedCode) ? '#d1d5db' : 'linear-gradient(135deg,#059669,#10b981)',
          color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px',
          fontWeight: 700, fontSize: 14, cursor: (running || !selectedCode) ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(5,150,105,0.25)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {running
            ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> {t('humanizingAiModule.testHumanitas.running')}</>
            : <>🧪 {t('humanizingAiModule.testHumanitas.runBtn')}</>}
        </button>
      </div>

      {/* C1–C5 rubric reference */}
      {!result && Object.keys(rubric).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel index={4} label={t('humanizingAiModule.testHumanitas.rubricTitle')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {Object.entries(rubric).map(([key, r], i) => {
              const colors  = ['#4f46e5','#059669','#2563eb','#d97706','#7c3aed'];
              const lights  = ['#eef2ff','#ecfdf5','#eff6ff','#fffbeb','#f5f3ff'];
              const borders = ['#c7d2fe','#a7f3d0','#bfdbfe','#fde68a','#ddd6fe'];
              const c = colors[i]; const l = lights[i]; const b = borders[i];
              return (
                <div key={key} style={{ background: l, border: `1px solid ${b}`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ color: c, fontWeight: 900, fontSize: 16, marginBottom: 4 }}>{key}</div>
                  <div style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.4 }}>
                    {t(`humanizingAiModule.testHumanitas.rubric.${key}`, { defaultValue: r.name })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Score hero */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: `4px solid ${scoreColor(result.evaluation?.humanitas_score ?? 0, 15)}`, borderRadius: 16, padding: '24px 28px', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(5,150,105,0.10)' }}>
            <BigScore
              value={result.evaluation?.humanitas_score ?? '—'}
              max={15}
              label={t(`humanizingAiModule.testHumanitas.scoreLabels.${scoreLabel(result.evaluation?.humanitas_score ?? 0)}`)}
              color={scoreColor(result.evaluation?.humanitas_score ?? 0, 15)}
            />
            <div style={{ flex: 1 }}>
              {result.evaluation?.scores && Object.entries(result.evaluation.scores).map(([key, val], i) => {
                const colors = ['#4f46e5','#059669','#2563eb','#d97706','#7c3aed'];
                return <Bar key={key} label={`${key} · ${t(`humanizingAiModule.testHumanitas.rubric.${key}`, { defaultValue: rubric[key]?.name || key })}`} value={val ?? 0} max={3} color={colors[i % colors.length]} />;
              })}
            </div>
            <MockBadge isMock={result.evaluation?.is_mock} t={t} />
          </div>

          {/* Responses grid */}
          <div style={{ display: 'grid', gridTemplateColumns: result.pressure_response ? '1fr 1fr' : '1fr', gap: 14 }}>
            <BorderCard color={dm.color || '#2563eb'} light={dm.light || '#eff6ff'} border={dm.border || '#bfdbfe'}>
              <p style={{ color: dm.color || '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.dilemmaResponse')}</p>
              <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.model_response}</p>
            </BorderCard>
            {result.pressure_response && (
              <BorderCard color="#d97706" light="#fffbeb" border="#fde68a">
                <div style={{ marginBottom: 8 }}>
                  <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>
                    {t('humanizingAiModule.testHumanitas.pressureResponse')} · {result.pressure_applied}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: 11, fontStyle: 'italic' }}>«{result.pressure_text}»</p>
                </div>
                <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.pressure_response}</p>
              </BorderCard>
            )}
          </div>

          {/* Observation + Improvement */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {result.evaluation?.risk_observation && (
              <BorderCard color="#d97706" light="#fffbeb" border="#fde68a">
                <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.observationLabel')}</p>
                <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>{result.evaluation.risk_observation}</p>
              </BorderCard>
            )}
            {result.evaluation?.improvement_note && (
              <BorderCard color="#059669" light="#f0fdf4" border="#bbf7d0">
                <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.improvementLabel')}</p>
                <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>{result.evaluation.improvement_note}</p>
              </BorderCard>
            )}
          </div>

          <button onClick={() => setResult(null)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#059669', fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 600 }}>
            {t('humanizingAiModule.common.runAnotherTest')}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Tab 4: Historial ─────────────────────────────────────────────────────────
const TabHistory = () => {
  const { t } = useTranslation();
  const [runs, setRuns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [detail, setDetail]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/reports?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRuns((await res.json()).runs || []);
    } catch (e) {
      setError(t('humanizingAiModule.history.loadingError'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const openDetail = async (runId) => {
    setDetailLoading(true); setDetail({ run_id: runId, _placeholder: true });
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/reports/${encodeURIComponent(runId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDetail(await res.json());
    } catch (e) {
      setDetail({ error: t('humanizingAiModule.history.noDetail') });
    } finally { setDetailLoading(false); }
  };

  /** Translate domain code → localised label */
  const domainLabel = (code) => t(`humanizingAiModule.testHumanitas.domains.${code}`, { defaultValue: code });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <SectionLabel index={4} label={t('humanizingAiModule.tabs.history')} />
          <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.history.title')}</h2>
          <p style={{ color: '#6b7280', fontSize: 13 }}>{t('humanizingAiModule.history.subtitle')}</p>
        </div>
        <button onClick={loadRuns} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
          🔄 {t('humanizingAiModule.common.retry')}
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('humanizingAiModule.common.loading')}</p>}
      {error   && <p style={{ textAlign: 'center', color: '#dc2626', padding: 20 }}>{error}</p>}

      {!loading && !error && runs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <p style={{ fontSize: 13 }}>{t('humanizingAiModule.history.emptyState')}</p>
        </div>
      )}

      {runs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {runs.map((run) => {
            const dk  = (run.dilemma_code || '')[0];
            const dm2 = DOMAIN_META[dk] || {};
            const sc  = run.evaluation?.humanitas_score;
            return (
              <div key={run.run_id}
                   onClick={() => openDetail(run.run_id)}
                   title={t('humanizingAiModule.history.openDetail')}
                   style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#ffffff', border: `1px solid ${dm2.border || '#e5e7eb'}`, borderLeft: `4px solid ${dm2.color || '#d1d5db'}`, borderRadius: 12, padding: '14px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.08s ease' }}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                <div style={{ fontSize: 20 }}>{dm2.icon || '📋'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <Badge label={run.dilemma_code} color={dm2.color} light={dm2.light} border={dm2.border} />
                    <Badge label={domainLabel(dk)} color={dm2.color} light={dm2.light} border={dm2.border} />
                    {run.pressure_applied && <Badge label={run.pressure_applied} color="#d97706" light="#fffbeb" border="#fde68a" />}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.run_id}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {sc != null && (
                    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: scoreColor(sc, 15), lineHeight: 1 }}>
                      {sc}<span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>/15</span>
                    </div>
                  )}
                  <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{run.created_at ? new Date(run.created_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 16, maxWidth: 820, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
              <h3 style={{ color: '#111827', margin: 0, fontSize: 16, fontWeight: 800 }}>
                📋 {t('humanizingAiModule.history.detailTitle')}
                <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500, fontFamily: 'monospace', marginLeft: 10 }}>{detail.run_id}</span>
              </h3>
              <button onClick={() => setDetail(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: '#374151' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {detailLoading && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 30 }}>{t('humanizingAiModule.common.loading')}</p>}
              {detail.error    && <p style={{ color: '#dc2626', textAlign: 'center', padding: 30 }}>{detail.error}</p>}
              {!detailLoading && !detail.error && detail.dilemma_code && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <BorderCard color="#2563eb" light="#eff6ff" border="#bfdbfe">
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Badge label={detail.dilemma_code} color="#2563eb" light="#eff6ff" border="#bfdbfe" />
                      <Badge label={domainLabel(detail.dilemma_code[0])} color="#2563eb" light="#eff6ff" border="#bfdbfe" />
                    </div>
                    <p style={{ color: '#111827', fontSize: 13, lineHeight: 1.6 }}>{detail.dilemma_text}</p>
                  </BorderCard>
                  {detail.evaluation && (
                    <BorderCard color={scoreColor(detail.evaluation.humanitas_score ?? 0, 15)} light="#f0fdf4" border="#bbf7d0">
                      <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.scoreTitle')}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: scoreColor(detail.evaluation.humanitas_score ?? 0, 15) }}>
                          {detail.evaluation.humanitas_score ?? '—'}<span style={{ fontSize: 13, color: '#9ca3af' }}>/15</span>
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.history.rubricBreakdown')}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                        {['C1','C2','C3','C4','C5'].map((k) => {
                          const v = detail.evaluation[k];
                          return (
                            <div key={k} style={{ background: '#f9fafb', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{k}</div>
                              <div style={{ fontSize: 16, fontWeight: 900, color: v == null ? '#d1d5db' : scoreColor(v, 3) }}>{v ?? '—'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </BorderCard>
                  )}
                  {detail.model_response && (
                    <BorderCard color="#7c3aed" light="#f5f3ff" border="#ddd6fe">
                      <p style={{ color: '#5b21b6', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.history.modelResponse')}</p>
                      <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{detail.model_response}</p>
                    </BorderCard>
                  )}
                  {detail.pressure_response && (
                    <BorderCard color="#d97706" light="#fffbeb" border="#fde68a">
                      <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                        {t('humanizingAiModule.history.pressureResponse')} · {detail.pressure_applied}
                      </p>
                      {detail.pressure_text && <p style={{ color: '#9ca3af', fontSize: 11, fontStyle: 'italic', marginBottom: 6 }}>«{detail.pressure_text}»</p>}
                      <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{detail.pressure_response}</p>
                    </BorderCard>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Humanity Report (aggregated) ────────────────────────────────────────
const TabHumanityReport = () => {
  const { t } = useTranslation();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    fetch(`${API_BASE}/api/humanizing-ai/humanity-report?limit=500`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setReport(d); setLoading(false); })
      .catch(() => { setError(t('humanizingAiModule.humanityReport.loadingError')); setLoading(false); });
  }, [t]);

  const domainLabel = (code) => t(`humanizingAiModule.testHumanitas.domains.${code}`, { defaultValue: code });

  if (loading) return <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>{t('humanizingAiModule.common.loading')}</div>;
  if (error)   return <div style={{ padding: 64, textAlign: 'center', color: '#dc2626' }}>{error}</div>;
  if (!report || report.total_runs === 0) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <p style={{ fontSize: 13 }}>{t('humanizingAiModule.humanityReport.emptyState')}</p>
      </div>
    );
  }

  // Distribution colors
  const distLabels = {
    ejemplar:     t('humanizingAiModule.testHumanitas.scoreLabels.ejemplar'),
    buena:        t('humanizingAiModule.testHumanitas.scoreLabels.buena'),
    insuficiente: t('humanizingAiModule.testHumanitas.scoreLabels.insuficiente'),
    grave:        t('humanizingAiModule.testHumanitas.scoreLabels.grave'),
  };
  const distColors = { ejemplar: '#059669', buena: '#2563eb', insuficiente: '#d97706', grave: '#dc2626' };
  const distTotal  = Object.values(report.score_distribution).reduce((s, v) => s + v, 0) || 1;

  const maxTimelineCount = Math.max(...report.timeline.map((d) => d.count), 1);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={5} label={t('humanizingAiModule.tabs.humanityReport')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.humanityReport.title')}</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>{t('humanizingAiModule.humanityReport.subtitle')}</p>

      {/* Headline KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderTop: '3px solid #4f46e5', borderRadius: 12, padding: '18px 20px' }}>
          <p style={{ color: '#4f46e5', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('humanizingAiModule.humanityReport.totalRuns')}</p>
          <p style={{ fontSize: 36, fontWeight: 900, color: '#1e1b4b', fontFamily: 'monospace', lineHeight: 1 }}>{report.total_runs}</p>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderTop: '3px solid #059669', borderRadius: 12, padding: '18px 20px' }}>
          <p style={{ color: '#059669', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('humanizingAiModule.humanityReport.avgScore')}</p>
          <p style={{ fontSize: 36, fontWeight: 900, color: scoreColor(report.avg_score ?? 0, 15), fontFamily: 'monospace', lineHeight: 1 }}>
            {report.avg_score ?? '—'}<span style={{ fontSize: 14, color: '#9ca3af' }}>/15</span>
          </p>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderTop: '3px solid #d97706', borderRadius: 12, padding: '18px 20px' }}>
          <p style={{ color: '#d97706', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('humanizingAiModule.humanityReport.pressureRate')}</p>
          <p style={{ fontSize: 36, fontWeight: 900, color: '#92400e', fontFamily: 'monospace', lineHeight: 1 }}>{report.pressure_rate}<span style={{ fontSize: 14, color: '#9ca3af' }}>%</span></p>
        </div>
      </div>

      {/* Score distribution stacked bar */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.humanityReport.distribution')}</p>
        <div style={{ display: 'flex', height: 38, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          {['ejemplar', 'buena', 'insuficiente', 'grave'].map((k) => {
            const v = report.score_distribution[k] || 0;
            const pct = (v / distTotal) * 100;
            return pct > 0 ? (
              <div key={k} title={`${distLabels[k]}: ${v} (${pct.toFixed(0)}%)`}
                   style={{ width: `${pct}%`, background: distColors[k], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {pct >= 8 && `${v}`}
              </div>
            ) : null;
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {['ejemplar', 'buena', 'insuficiente', 'grave'].map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151' }}>
              <span style={{ width: 10, height: 10, background: distColors[k], borderRadius: 2 }}></span>{distLabels[k]} <span style={{ color: '#9ca3af' }}>· {report.score_distribution[k]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: by domain + rubric averages */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.humanityReport.byDomain')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {report.scores_by_domain.map((d) => {
              const dm2 = DOMAIN_META[d.domain_code] || {};
              const avg = d.avg_score ?? 0;
              const pct = (avg / 15) * 100;
              return (
                <div key={d.domain_code} style={{ background: '#fff', border: `1px solid ${dm2.border || '#e5e7eb'}`, borderLeft: `4px solid ${dm2.color || '#d1d5db'}`, borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{dm2.icon} {domainLabel(d.domain_code)}</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6b7280' }}>
                      <strong style={{ color: scoreColor(avg, 15) }}>{d.avg_score ?? '—'}</strong> {t('humanizingAiModule.humanityReport.avgLabel')} · {d.count} {t('humanizingAiModule.humanityReport.countLabel')}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: scoreColor(avg, 15), height: '100%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.humanityReport.rubricAvg')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['C1', 'C2', 'C3', 'C4', 'C5'].map((k, i) => {
              const colors = ['#4f46e5','#059669','#2563eb','#d97706','#7c3aed'];
              const v = report.rubric_avg[k];
              if (v == null) return null;
              const pct = (v / 3) * 100;
              return (
                <div key={k} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors[i] }}>{k}</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#111827' }}>{v}/3</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: colors[i], height: '100%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Worst dilemmas */}
      {report.scores_by_dilemma.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.humanityReport.worstDilemmas')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {report.scores_by_dilemma.map((d) => {
              const dm2 = DOMAIN_META[(d.dilemma_code || '')[0]] || {};
              return (
                <div key={d.dilemma_code} style={{ background: '#fff', border: `1px solid ${dm2.border || '#e5e7eb'}`, borderLeft: `4px solid ${dm2.color || '#d1d5db'}`, borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{dm2.icon} {d.dilemma_code}</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: scoreColor(d.avg_score ?? 0, 15) }}>{d.avg_score ?? '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      {report.timeline.length > 1 && (
        <div>
          <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>{t('humanizingAiModule.humanityReport.timeline')}</p>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {report.timeline.map((d) => {
                const h = (d.count / maxTimelineCount) * 100;
                return (
                  <div key={d.date} title={`${d.date}: ${d.count} (avg ${d.avg_score ?? '—'})`}
                       style={{ flex: 1, height: `${h}%`, background: scoreColor(d.avg_score ?? 0, 15), borderRadius: '3px 3px 0 0', minHeight: 4 }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
              <span>{report.timeline[0].date}</span>
              <span>{report.timeline[report.timeline.length - 1].date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Model Comparison ────────────────────────────────────────────────────
const TabModelComparison = () => {
  const { t, i18n } = useTranslation();
  const [catalogue, setCatalogue]       = useState(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [modelsText, setModelsText]     = useState('claude-sonnet\ngpt-4\nlmstudio-local');
  const [applyPressure, setApplyPressure] = useState(false);
  const [pressureKey, setPressureKey]   = useState('F1');
  const [running, setRunning]           = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/humanizing-ai/dilemmas?lang=${toLang(i18n.language)}`)
      .then((r) => r.json())
      .then((d) => { setCatalogue(d); const codes = Object.keys(d.all_dilemmas || {}); if (codes.length) setSelectedCode(codes[0]); })
      .catch(() => {});
  }, [i18n.language]);

  const domainLabel = (code) => t(`humanizingAiModule.testHumanitas.domains.${code}`, { defaultValue: code });

  const handleRun = async () => {
    const models = modelsText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (models.length < 2) { setError(t('humanizingAiModule.modelComparison.minModels')); return; }
    if (!selectedCode) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma_code:   selectedCode,
          models,
          apply_pressure: applyPressure ? pressureKey : null,
          lang:           toLang(i18n.language),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally { setRunning(false); }
  };

  const visibleDilemmas = catalogue ? Object.entries(catalogue.all_dilemmas || {}).filter(([code]) => !filterDomain || code.startsWith(filterDomain)) : [];
  const domainGroups    = catalogue ? Object.keys(catalogue.dilemmas_by_group || {}) : [];
  const selectStyle = { background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, color: '#111827', fontSize: 13, padding: '9px 12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' };

  // Best score among results
  const bestScore = result ? Math.max(...result.results.map((r) => r.evaluation?.humanitas_score ?? -1)) : -1;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={4} label={t('humanizingAiModule.tabs.modelComparison')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.modelComparison.title')}</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>{t('humanizingAiModule.modelComparison.subtitle')}</p>

      {/* Config panel */}
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.domainLabel')}</label>
            <select style={selectStyle} value={filterDomain} onChange={(e) => { setFilterDomain(e.target.value); setSelectedCode(''); }}>
              <option value="">{t('humanizingAiModule.testHumanitas.allDomains')}</option>
              {domainGroups.map((g) => (
                <option key={g} value={g}>{catalogue.dilemmas_by_group[g]?.icon} {domainLabel(g)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.dilemmaLabel')}</label>
            <select style={{ ...selectStyle, width: '100%' }} value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
              {visibleDilemmas.map(([code, d]) => (
                <option key={code} value={code} title={d.text}>
                  {code} ({domainLabel(code[0])}) — {d.text.length > 110 ? `${d.text.substring(0, 110)}…` : d.text}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('humanizingAiModule.modelComparison.modelsLabel')}</label>
          <textarea value={modelsText} onChange={(e) => setModelsText(e.target.value)}
                    placeholder={t('humanizingAiModule.modelComparison.modelsPlaceholder')}
                    style={{ width: '100%', minHeight: 76, background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#111827', outline: 'none', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#374151', fontSize: 13 }}>
            <input type="checkbox" checked={applyPressure} onChange={(e) => setApplyPressure(e.target.checked)} style={{ accentColor: '#059669', width: 15, height: 15 }} />
            {t('humanizingAiModule.testHumanitas.pressureLabel')}
          </label>
          {applyPressure && (
            <select style={{ ...selectStyle, fontSize: 12 }} value={pressureKey} onChange={(e) => setPressureKey(e.target.value)}>
              {['F1', 'F2', 'F3'].map((k) => (<option key={k} value={k}>{t(`humanizingAiModule.common.pressureTests.${k}`)}</option>))}
            </select>
          )}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}

        <button onClick={handleRun} disabled={running || !selectedCode} style={{
          alignSelf: 'flex-start',
          background: (running || !selectedCode) ? '#d1d5db' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px',
          fontWeight: 700, fontSize: 14, cursor: (running || !selectedCode) ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(79,70,229,0.25)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {running
            ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> {t('humanizingAiModule.modelComparison.running')}</>
            : <>⚖️ {t('humanizingAiModule.modelComparison.runBtn')}</>}
        </button>
      </div>

      {/* Results grid */}
      {!result && !running && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>{t('humanizingAiModule.modelComparison.noResults')}</div>
      )}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(result.results.length, 3)}, 1fr)`, gap: 14 }}>
          {result.results.map((r) => {
            const sc = r.evaluation?.humanitas_score ?? 0;
            const isWinner = sc === bestScore && bestScore > 0;
            return (
              <div key={r.model} style={{ background: '#fff', border: `1px solid ${isWinner ? '#bbf7d0' : '#e5e7eb'}`, borderTop: `3px solid ${isWinner ? '#059669' : '#9ca3af'}`, borderRadius: 14, padding: '16px 18px', boxShadow: isWinner ? '0 4px 14px rgba(5,150,105,0.18)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{r.model}</span>
                  {isWinner && <Badge label={`★ ${t('humanizingAiModule.modelComparison.winnerLabel')}`} color="#059669" light="#d1fae5" border="#6ee7b7" />}
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: scoreColor(sc, 15), lineHeight: 1, marginBottom: 6 }}>
                  {sc}<span style={{ fontSize: 13, fontWeight: 400, color: '#9ca3af' }}>/15</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, marginBottom: 12 }}>
                  {['C1','C2','C3','C4','C5'].map((k) => {
                    const v = r.evaluation?.[k];
                    return (
                      <div key={k} style={{ background: '#f9fafb', borderRadius: 6, padding: '4px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: v == null ? '#d1d5db' : scoreColor(v, 3) }}>{v ?? '—'}</div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>{r.model_response}</p>
                {r.pressure_response && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb' }}>
                    <p style={{ fontSize: 9, color: '#92400e', fontWeight: 700, marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('humanizingAiModule.testHumanitas.pressureResponse')}</p>
                    <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>{r.pressure_response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Tab: Gateway Filter (transversal) ────────────────────────────────────────
const TabGateway = () => {
  const { t, i18n } = useTranslation();
  const [rawText, setRawText]       = useState('');
  const [moduleId, setModuleId]     = useState('');
  const [mode, setMode]             = useState('enhance');
  const [threshold, setThreshold]   = useState(70);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  const handleRun = async () => {
    if (!rawText.trim()) { setError(t('humanizingAiModule.gateway.noInput')); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:      rawText,
          mode,
          threshold: Number(threshold),
          module_id: moduleId || null,
          lang:      toLang(i18n.language),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', background: '#ffffff', border: '1px solid #d1d5db',
    borderRadius: 10, color: '#111827', fontSize: 13, padding: '12px 14px',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer', paddingTop: 9, paddingBottom: 9 };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1080, margin: '0 auto' }}>
      <SectionLabel index={6} label={t('humanizingAiModule.tabs.gateway')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{t('humanizingAiModule.gateway.title')}</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>{t('humanizingAiModule.gateway.subtitle')}</p>

      <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderLeft: '4px solid #4f46e5', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#3730a3', lineHeight: 1.6 }}>
        ℹ️ {t('humanizingAiModule.gateway.intro')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.gateway.rawLabel')}</label>
            <textarea style={{ ...inputStyle, height: 160, resize: 'vertical' }}
              placeholder={t('humanizingAiModule.gateway.rawPlaceholder')}
              value={rawText} onChange={(e) => setRawText(e.target.value)} />
          </div>
          <div>
            <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.gateway.moduleIdLabel')}</label>
            <input style={inputStyle} type="text"
              placeholder={t('humanizingAiModule.gateway.moduleIdPlaceholder')}
              value={moduleId} onChange={(e) => setModuleId(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{t('humanizingAiModule.gateway.modeLabel')}</label>
              <select style={selectStyle} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="audit">{t('humanizingAiModule.gateway.modeAudit')}</option>
                <option value="enhance">{t('humanizingAiModule.gateway.modeEnhance')}</option>
                <option value="always">{t('humanizingAiModule.gateway.modeAlways')}</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                {t('humanizingAiModule.gateway.thresholdLabel')} <span style={{ color: '#059669', fontFamily: 'monospace' }}>{threshold}</span>
              </label>
              <input type="range" min={0} max={100} step={5}
                disabled={mode !== 'enhance'}
                value={threshold} onChange={(e) => setThreshold(e.target.value)}
                style={{ width: '100%', accentColor: '#059669', marginTop: 12, opacity: mode === 'enhance' ? 1 : 0.4 }} />
            </div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}
          <button onClick={handleRun} disabled={loading} style={{
            alignSelf: 'flex-start',
            background: loading ? '#a78bfa' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 28px', fontWeight: 700, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          }}>
            {loading
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> {t('humanizingAiModule.gateway.running')}</>
              : <>🛡️ {t('humanizingAiModule.gateway.runBtn')}</>}
          </button>
        </div>

        {/* Result column */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Decision banner */}
            <div style={{
              background: result.was_modified ? '#ecfdf5' : '#eff6ff',
              border: `1px solid ${result.was_modified ? '#bbf7d0' : '#bfdbfe'}`,
              borderLeft: `4px solid ${result.was_modified ? '#059669' : '#2563eb'}`,
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: result.was_modified ? '#065f46' : '#1e40af' }}>
                {result.was_modified ? t('humanizingAiModule.gateway.wasModified') : t('humanizingAiModule.gateway.wasNotModified')}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge label={result.mode.toUpperCase()} color="#4f46e5" light="#eef2ff" border="#c7d2fe" />
                <MockBadge isMock={result.is_mock} t={t} />
              </div>
            </div>

            {/* Score */}
            {result.humanitas_score != null && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px' }}>
                <p style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{t('humanizingAiModule.gateway.scoreLabel')}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, fontFamily: 'monospace', color: scoreColor(result.humanitas_score, 100), lineHeight: 1 }}>
                    {result.humanitas_score}<span style={{ fontSize: 14, color: '#9ca3af' }}>/100</span>
                  </span>
                  {result.threshold != null && (
                    <span style={{ color: '#9ca3af', fontSize: 11 }}>threshold {result.threshold}</span>
                  )}
                </div>
              </div>
            )}

            {/* Final text (what the user would see) */}
            <BorderCard color={result.was_modified ? '#059669' : '#2563eb'}
                        light={result.was_modified ? '#f0fdf4' : '#eff6ff'}
                        border={result.was_modified ? '#bbf7d0' : '#bfdbfe'}>
              <p style={{ color: result.was_modified ? '#065f46' : '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                ⬇ {t('humanizingAiModule.gateway.finalLabel')}
              </p>
              <p style={{ color: '#111827', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.filtered_text}</p>
            </BorderCard>

            {/* Original (only when modified) */}
            {result.was_modified && (
              <BorderCard color="#9ca3af" light="#f9fafb" border="#e5e7eb">
                <p style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                  {t('humanizingAiModule.gateway.originalLabel')}
                </p>
                <p style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{result.original_text}</p>
              </BorderCard>
            )}

            {/* Issues */}
            {result.issues?.length > 0 && (
              <BorderCard color="#dc2626" light="#fef2f2" border="#fecaca">
                <p style={{ color: '#991b1b', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>⚠ {t('humanizingAiModule.humanize.issuesTitle')}</p>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#dc2626', fontSize: 12 }}>•</span>
                    <span style={{ color: '#374151', fontSize: 12 }}>{issue}</span>
                  </div>
                ))}
              </BorderCard>
            )}
          </div>
        )}
      </div>

      {/* Diff under both columns when modified */}
      {result?.was_modified && result.original_text && result.filtered_text && (
        <BeforeAfterDiff original={result.original_text} humanized={result.filtered_text} t={t} />
      )}
    </div>
  );
};

// ─── Main Shell ───────────────────────────────────────────────────────────────
const HumanizingAI = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('humanize');

  const tabs = [
    { id: 'humanize',        label: t('humanizingAiModule.tabs.humanize'),        icon: '🔍' },
    { id: 'promptHumanitas', label: t('humanizingAiModule.tabs.promptHumanitas'), icon: '📋' },
    { id: 'testHumanitas',   label: t('humanizingAiModule.tabs.testHumanitas'),   icon: '🧪' },
    { id: 'modelComparison', label: t('humanizingAiModule.tabs.modelComparison'), icon: '⚖️' },
    { id: 'humanityReport',  label: t('humanizingAiModule.tabs.humanityReport'),  icon: '📊' },
    { id: 'gateway',         label: t('humanizingAiModule.tabs.gateway'),         icon: '🛡️' },
    { id: 'history',         label: t('humanizingAiModule.tabs.history'),         icon: '📁' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'humanize':        return <TabHumanize />;
      case 'promptHumanitas': return <TabPromptHumanitas />;
      case 'testHumanitas':   return <TabTestHumanitas />;
      case 'modelComparison': return <TabModelComparison />;
      case 'humanityReport':  return <TabHumanityReport />;
      case 'gateway':         return <TabGateway />;
      case 'history':         return <TabHistory />;
      default:                return <TabHumanize />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg,#f0fdf4 0%,#f9fafb 50%,#eff6ff 100%)', fontFamily: 'inherit' }}>
      {/* Hero */}
      <div style={{ background: '#ffffff', borderBottom: '2px solid #e5e7eb', padding: '24px 32px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: '#059669', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>{t('humanizingAiModule.hero.workspace')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>{t('humanizingAiModule.hero.itemAgents')}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>2026</span>
        </div>

        {/* Title + pillar chips */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: '0 4px 14px rgba(5,150,105,0.25)' }}>🌿</div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.15 }}>{t('humanizingAiModule.title')}</h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>{t('humanizingAiModule.tagline')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {PILLARS.map((p) => (
              <div key={p.key} style={{ background: p.light, border: `1px solid ${p.border}`, borderTop: `3px solid ${p.color}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 88 }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{p.icon}</div>
                <div style={{ color: p.color, fontSize: 11, fontWeight: 800 }}>{t(`humanizingAiModule.pillars.${p.labelKey}`)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspiration row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          {[
            { icon: '🌱', key: 'virtrin',   color: '#059669' },
            { icon: '📜', key: 'humanitas', color: '#4f46e5' },
            { icon: '🧪', key: 'test',      color: '#d97706' },
          ].map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>{s.icon}</span>
              <span style={{ color: s.color, fontSize: 11, fontWeight: 600 }}>{t(`humanizingAiModule.hero.inspiration.${s.key}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: 'transparent', border: 'none',
              borderBottom: isActive ? '2px solid #059669' : '2px solid transparent',
              color: isActive ? '#059669' : '#6b7280',
              fontWeight: isActive ? 700 : 500, fontSize: 13,
              padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              whiteSpace: 'nowrap', transition: 'color 0.15s', fontFamily: 'inherit',
            }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>{renderContent()}</div>

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
};

export default HumanizingAI;
