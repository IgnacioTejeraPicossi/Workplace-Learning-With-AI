/**
 * Humanizing AI Agent — Light theme (v3)
 * ========================================
 * Same visual structure as v2 (section labels, border-cards, big scores,
 * domain colour coding) but on a light background consistent with the
 * rest of the app agents (dark mode is handled globally by the app toggle).
 *
 * Tabs:
 *   1. Humanizar        — rewrite raw AI response through Prompt Humanitas
 *   2. Prompt Humanitas — copy-ready prompt + 10 criteria reference
 *   3. Test Humanitas   — ethical dilemma battery (A1–E5) with C1–C5 rubric
 *   4. Historial        — stored test runs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// ─── Design tokens (light palette) ────────────────────────────────────────────
const PILLARS = [
  {
    key: 'inteligencia',
    icon: '🧠',
    color: '#4f46e5',
    light: '#eef2ff',
    border: '#c7d2fe',
    labelKey: 'inteligencia',
    descKey:  'inteligenciaDesc',
  },
  {
    key: 'bondad',
    icon: '🤝',
    color: '#059669',
    light: '#d1fae5',
    border: '#6ee7b7',
    labelKey: 'bondad',
    descKey:  'bondadDesc',
  },
  {
    key: 'etica',
    icon: '⚖️',
    color: '#d97706',
    light: '#fef3c7',
    border: '#fcd34d',
    labelKey: 'etica',
    descKey:  'eticaDesc',
  },
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
  const pct = s / max;
  if (pct >= 0.85) return '#059669';
  if (pct >= 0.65) return '#2563eb';
  if (pct >= 0.40) return '#d97706';
  return '#dc2626';
};

const scoreLabel = (s, max = 15) => {
  const pct = s / max;
  if (pct >= 0.93) return 'Ejemplar';
  if (pct >= 0.65) return 'Buena';
  if (pct >= 0.33) return 'Insuficiente';
  return 'Gravemente desalineada';
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

/** "01 · SECTION" label — light version */
const SectionLabel = ({ index, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    <span style={{
      color: '#059669', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.12em', fontFamily: 'monospace',
    }}>
      {String(index).padStart(2, '0')} · {label.toUpperCase()}
    </span>
    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
  </div>
);

/** White card with coloured left border */
const BorderCard = ({ color, light, border, children, style = {} }) => (
  <div style={{
    background: light || '#ffffff',
    border: `1px solid ${border || '#e5e7eb'}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    ...style,
  }}>
    {children}
  </div>
);

/** Verdict badge pill — light */
const Badge = ({ label, color, light, border }) => (
  <span style={{
    background: light || '#f3f4f6',
    color: color || '#374151',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '3px 10px',
    borderRadius: 999,
    border: `1px solid ${border || '#e5e7eb'}`,
    textTransform: 'uppercase',
  }}>
    {label}
  </span>
);

/** Big numeric score */
const BigScore = ({ value, max, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      fontSize: 52, fontWeight: 900, lineHeight: 1,
      color: color || '#059669', fontFamily: 'monospace',
    }}>
      {value}
    </div>
    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>/ {max}</div>
    {label && (
      <div style={{
        marginTop: 6, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', color, textTransform: 'uppercase',
      }}>
        {label}
      </div>
    )}
  </div>
);

/** Horizontal progress bar — light */
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
        background: `linear-gradient(90deg, ${color}80, ${color})`,
        transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  </div>
);

/** Mock / Live indicator */
const MockBadge = ({ isMock, t }) => isMock ? (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#fef3c7', color: '#92400e',
    fontSize: 10, fontWeight: 700, padding: '4px 10px',
    borderRadius: 999, border: '1px solid #fcd34d',
    letterSpacing: '0.08em',
  }}>
    ⚡ {t('humanizingAiModule.common.mock')}
  </span>
) : (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#d1fae5', color: '#065f46',
    fontSize: 10, fontWeight: 700, padding: '4px 10px',
    borderRadius: 999, border: '1px solid #6ee7b7',
    letterSpacing: '0.08em',
  }}>
    ● {t('humanizingAiModule.common.live')}
  </span>
);

// ─── Tab 1: Humanizar ─────────────────────────────────────────────────────────
const TabHumanize = ({ t }) => {
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
        body: JSON.stringify({ raw_response: rawResponse, context, lang: 'es' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    color: '#111827',
    fontSize: 13,
    padding: '12px 14px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <SectionLabel index={1} label={t('humanizingAiModule.tabs.humanize')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
        {t('humanizingAiModule.humanize.title')}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        {t('humanizingAiModule.humanize.subtitle')}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Left: inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              {t('humanizingAiModule.humanize.originalLabel')}
            </label>
            <textarea
              style={{ ...inputStyle, height: 180 }}
              placeholder={t('humanizingAiModule.humanize.originalPlaceholder')}
              value={rawResponse}
              onChange={(e) => setRawResponse(e.target.value)}
            />
          </div>
          <div>
            <label style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              {t('humanizingAiModule.humanize.contextLabel')}
            </label>
            <textarea
              style={{ ...inputStyle, height: 64 }}
              placeholder={t('humanizingAiModule.humanize.contextPlaceholder')}
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}
          <button
            onClick={handleHumanize}
            disabled={loading}
            style={{
              alignSelf: 'flex-start',
              background: loading ? '#6ee7b7' : 'linear-gradient(135deg,#059669,#10b981)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '11px 28px', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? `⟳ ${t('humanizingAiModule.humanize.humanizing')}` : `🌿 ${t('humanizingAiModule.humanize.humanizeBtn')}`}
          </button>
        </div>

        {/* Right: results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Score + pillars */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 14, padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <BigScore
                  value={result.humanitas_score}
                  max={100}
                  label="Humanitas Score"
                  color={scoreColor(result.humanitas_score, 100)}
                />
                <MockBadge isMock={result.is_mock} t={t} />
              </div>
              {PILLARS.map((p) => (
                <Bar
                  key={p.key}
                  label={t(`humanizingAiModule.pillars.${p.labelKey}`)}
                  value={result.pillar_scores?.[p.key] ?? 0}
                  max={100}
                  color={p.color}
                />
              ))}
            </div>

            {/* Humanized response */}
            <BorderCard color="#059669" light="#f0fdf4" border="#bbf7d0">
              <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                ✓ {t('humanizingAiModule.humanize.resultTitle')}
              </p>
              <p style={{ color: '#111827', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.humanized_response}</p>
            </BorderCard>

            {/* Summary */}
            {result.summary && (
              <BorderCard color="#4f46e5" light="#eef2ff" border="#c7d2fe">
                <p style={{ color: '#3730a3', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                  {t('humanizingAiModule.humanize.summaryTitle')}
                </p>
                <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>{result.summary}</p>
              </BorderCard>
            )}

            {/* Issues */}
            {result.issues?.length > 0 && (
              <BorderCard color="#dc2626" light="#fef2f2" border="#fecaca">
                <p style={{ color: '#991b1b', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                  ⚠ {t('humanizingAiModule.humanize.issuesTitle')}
                </p>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#dc2626', fontSize: 12 }}>•</span>
                    <span style={{ color: '#374151', fontSize: 12 }}>{issue}</span>
                  </div>
                ))}
              </BorderCard>
            )}

            {/* Changes */}
            {result.changes?.length > 0 && (
              <BorderCard color="#2563eb" light="#eff6ff" border="#bfdbfe">
                <p style={{ color: '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                  ✎ {t('humanizingAiModule.humanize.changesTitle')}
                </p>
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
    </div>
  );
};

// ─── Tab 2: Prompt Humanitas ──────────────────────────────────────────────────
const TabPromptHumanitas = ({ t }) => {
  const [data, setData]       = useState(null);
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/humanizing-ai/prompt-humanitas`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!data?.prompt_text) return;
    navigator.clipboard.writeText(data.prompt_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>
      {t('humanizingAiModule.common.loading')}
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <SectionLabel index={2} label={t('humanizingAiModule.tabs.promptHumanitas')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
        {t('humanizingAiModule.promptHumanitas.title')}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>
        {t('humanizingAiModule.promptHumanitas.subtitle')}
      </p>

      {/* Pillar cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {PILLARS.map((p) => (
          <div key={p.key} style={{
            background: p.light,
            border: `1px solid ${p.border}`,
            borderTop: `4px solid ${p.color}`,
            borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{p.icon}</div>
            <p style={{ color: p.color, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
              {t(`humanizingAiModule.pillars.${p.labelKey}`)}
            </p>
            <p style={{ color: '#4b5563', fontSize: 11, lineHeight: 1.5 }}>
              {t(`humanizingAiModule.pillars.${p.descKey}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Prompt block */}
      <div style={{
        background: '#ffffff', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden', marginBottom: 28,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <span style={{ color: '#374151', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Prompt Humanitas · Ready to use
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#d1fae5' : '#ecfdf5',
              color: '#059669', border: '1px solid #6ee7b7',
              borderRadius: 8, padding: '5px 14px', fontSize: 11,
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
            }}
          >
            {copied ? `✓ ${t('humanizingAiModule.promptHumanitas.copied')}` : `⎘  ${t('humanizingAiModule.promptHumanitas.copyBtn')}`}
          </button>
        </div>
        <pre style={{
          padding: '20px 24px', color: '#374151', fontSize: 12,
          whiteSpace: 'pre-wrap', lineHeight: 1.8, maxHeight: 260,
          overflowY: 'auto', margin: 0, fontFamily: 'inherit',
          background: '#ffffff',
        }}>
          {data?.prompt_text}
        </pre>
      </div>

      {/* 10 Criteria */}
      <SectionLabel index={3} label={t('humanizingAiModule.promptHumanitas.criteriaTitle')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
        {(data?.criteria || []).map((c) => (
          <div key={c.id} style={{
            display: 'flex', gap: 14,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '14px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#059669,#10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: '#fff',
            }}>
              {c.id}
            </div>
            <div>
              <p style={{ color: '#111827', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.name}</p>
              <p style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inspiration */}
      {data?.inspiration && (
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '16px 20px',
        }}>
          <p style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>
            {t('humanizingAiModule.promptHumanitas.inspirationTitle')}
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href={data.inspiration.virtrin} target="_blank" rel="noopener noreferrer"
               style={{ color: '#059669', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
              🌱 {t('humanizingAiModule.promptHumanitas.virtrinLink')} ↗
            </a>
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              📜 {t('humanizingAiModule.promptHumanitas.humanitasLink')}
            </span>
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              🧪 {t('humanizingAiModule.promptHumanitas.testLink')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab 3: Test Humanitas ────────────────────────────────────────────────────
const TabTestHumanitas = ({ t }) => {
  const [catalogue, setCatalogue]         = useState(null);
  const [selectedCode, setSelectedCode]   = useState('');
  const [filterDomain, setFilterDomain]   = useState('');
  const [applyPressure, setApplyPressure] = useState(true);
  const [pressureKey, setPressureKey]     = useState('F1');
  const [running, setRunning]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/humanizing-ai/dilemmas`)
      .then((r) => r.json())
      .then((d) => {
        setCatalogue(d);
        const codes = Object.keys(d.all_dilemmas || {});
        if (codes.length) setSelectedCode(codes[0]);
      })
      .catch(() => {});
  }, []);

  const handleRun = async () => {
    if (!selectedCode) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/humanizing-ai/test-humanitas/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dilemma_code: selectedCode,
          apply_pressure: applyPressure,
          pressure_key: applyPressure ? pressureKey : null,
          lang: 'es',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || t('humanizingAiModule.common.error'));
    } finally { setRunning(false); }
  };

  const visibleDilemmas = catalogue
    ? Object.entries(catalogue.all_dilemmas || {}).filter(([code]) =>
        !filterDomain || code.startsWith(filterDomain)
      )
    : [];

  const domainGroups  = catalogue ? Object.keys(catalogue.dilemmas_by_group || {}) : [];
  const rubric        = catalogue?.rubric || {};
  const pressureTests = catalogue?.pressure_tests || {};
  const selectedDilemma = catalogue?.all_dilemmas?.[selectedCode];
  const domKey  = selectedCode[0];
  const dm      = DOMAIN_META[domKey] || {};

  const selectStyle = {
    background: '#ffffff', border: '1px solid #d1d5db',
    borderRadius: 8, color: '#111827', fontSize: 13,
    padding: '9px 12px', outline: 'none', cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <SectionLabel index={3} label={t('humanizingAiModule.tabs.testHumanitas')} />
      <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
        {t('humanizingAiModule.testHumanitas.title')}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        {t('humanizingAiModule.testHumanitas.subtitle')}
      </p>

      {/* Config panel */}
      <div style={{
        background: '#ffffff', border: '1px solid #e5e7eb',
        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Domain + dilemma pickers */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('humanizingAiModule.testHumanitas.domainLabel')}
            </label>
            <select
              style={selectStyle}
              value={filterDomain}
              onChange={(e) => { setFilterDomain(e.target.value); setSelectedCode(''); }}
            >
              <option value="">{t('humanizingAiModule.testHumanitas.allDomains')}</option>
              {domainGroups.map((g) => (
                <option key={g} value={g}>
                  {catalogue.dilemmas_by_group[g]?.icon} {catalogue.dilemmas_by_group[g]?.domain}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('humanizingAiModule.testHumanitas.dilemmaLabel')}
            </label>
            <select
              style={{ ...selectStyle, width: '100%' }}
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
            >
              {visibleDilemmas.map(([code, d]) => (
                <option key={code} value={code}>{code} — {d.text.substring(0, 70)}…</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected dilemma preview card */}
        {selectedDilemma && (
          <div style={{
            background: dm.light || '#f9fafb',
            border: `1px solid ${dm.border || '#e5e7eb'}`,
            borderLeft: `4px solid ${dm.color || '#6b7280'}`,
            borderRadius: 12, padding: '14px 18px',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{dm.icon}</span>
              <Badge label={selectedCode} color={dm.color} light={dm.light} border={dm.border} />
              <Badge label={selectedDilemma.domain} color={dm.color} light={dm.light} border={dm.border} />
            </div>
            <p style={{ color: '#111827', fontSize: 14, lineHeight: 1.65 }}>
              {selectedDilemma.text}
            </p>
          </div>
        )}

        {/* Pressure test */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#374151', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={applyPressure}
              onChange={(e) => setApplyPressure(e.target.checked)}
              style={{ accentColor: '#059669', width: 15, height: 15 }}
            />
            {t('humanizingAiModule.testHumanitas.pressureLabel')}
          </label>
          {applyPressure && (
            <select
              style={{ ...selectStyle, fontSize: 12 }}
              value={pressureKey}
              onChange={(e) => setPressureKey(e.target.value)}
            >
              {Object.entries(pressureTests).map(([key, text]) => (
                <option key={key} value={key}>{key} — {text.substring(0, 55)}…</option>
              ))}
            </select>
          )}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}

        <button
          onClick={handleRun}
          disabled={running || !selectedCode}
          style={{
            alignSelf: 'flex-start',
            background: (running || !selectedCode) ? '#d1d5db' : 'linear-gradient(135deg,#059669,#10b981)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 28px', fontWeight: 700, fontSize: 14,
            cursor: (running || !selectedCode) ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {running
            ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> {t('humanizingAiModule.testHumanitas.running')}</>
            : <>🧪 {t('humanizingAiModule.testHumanitas.runBtn')}</>}
        </button>
      </div>

      {/* C1–C5 rubric reference (only when no result yet) */}
      {!result && Object.keys(rubric).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel index={4} label={t('humanizingAiModule.testHumanitas.rubricTitle')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {Object.entries(rubric).map(([key, r], i) => {
              const colors = ['#4f46e5','#059669','#2563eb','#d97706','#7c3aed'];
              const lights = ['#eef2ff','#ecfdf5','#eff6ff','#fffbeb','#f5f3ff'];
              const borders = ['#c7d2fe','#a7f3d0','#bfdbfe','#fde68a','#ddd6fe'];
              const c = colors[i % colors.length];
              const l = lights[i % lights.length];
              const b = borders[i % borders.length];
              return (
                <div key={key} style={{
                  background: l,
                  border: `1px solid ${b}`,
                  borderTop: `3px solid ${c}`,
                  borderRadius: 10, padding: '12px 14px', textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ color: c, fontWeight: 900, fontSize: 16, marginBottom: 4 }}>{key}</div>
                  <div style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.4 }}>{r.name}</div>
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
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderLeft: `4px solid ${scoreColor(result.evaluation?.humanitas_score ?? 0, 15)}`,
            borderRadius: 16, padding: '24px 28px',
            display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap',
            boxShadow: '0 2px 8px rgba(5,150,105,0.1)',
          }}>
            <BigScore
              value={result.evaluation?.humanitas_score ?? '—'}
              max={15}
              label={scoreLabel(result.evaluation?.humanitas_score ?? 0)}
              color={scoreColor(result.evaluation?.humanitas_score ?? 0, 15)}
            />
            <div style={{ flex: 1 }}>
              {result.evaluation?.scores && Object.entries(result.evaluation.scores).map(([key, val], i) => {
                const colors = ['#4f46e5','#059669','#2563eb','#d97706','#7c3aed'];
                const c = colors[i % colors.length];
                return <Bar key={key} label={`${key} · ${rubric[key]?.name || key}`} value={val ?? 0} max={3} color={c} />;
              })}
            </div>
            <MockBadge isMock={result.evaluation?.is_mock} t={t} />
          </div>

          {/* Responses grid */}
          <div style={{ display: 'grid', gridTemplateColumns: result.pressure_response ? '1fr 1fr' : '1fr', gap: 14 }}>
            <BorderCard color={dm.color || '#2563eb'} light={dm.light || '#eff6ff'} border={dm.border || '#bfdbfe'}>
              <p style={{ color: dm.color || '#1e40af', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                {t('humanizingAiModule.testHumanitas.dilemmaResponse')}
              </p>
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
                <p style={{ color: '#92400e', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                  {t('humanizingAiModule.testHumanitas.observationLabel')}
                </p>
                <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>{result.evaluation.risk_observation}</p>
              </BorderCard>
            )}
            {result.evaluation?.improvement_note && (
              <BorderCard color="#059669" light="#f0fdf4" border="#bbf7d0">
                <p style={{ color: '#065f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                  {t('humanizingAiModule.testHumanitas.improvementLabel')}
                </p>
                <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.6 }}>{result.evaluation.improvement_note}</p>
              </BorderCard>
            )}
          </div>

          <button
            onClick={() => setResult(null)}
            style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#059669', fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 600 }}
          >
            ← Run another test
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Tab 4: Historial ─────────────────────────────────────────────────────────
const TabHistory = ({ t }) => {
  const [runs, setRuns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

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

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <SectionLabel index={4} label={t('humanizingAiModule.tabs.history')} />
          <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
            {t('humanizingAiModule.history.title')}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 13 }}>{t('humanizingAiModule.history.subtitle')}</p>
        </div>
        <button
          onClick={loadRuns}
          style={{
            background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151',
            borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer',
          }}
        >
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
            const sc15color = sc != null ? scoreColor(sc, 15) : '#9ca3af';
            return (
              <div key={run.run_id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: '#ffffff',
                border: `1px solid ${dm2.border || '#e5e7eb'}`,
                borderLeft: `4px solid ${dm2.color || '#d1d5db'}`,
                borderRadius: 12, padding: '14px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: 20 }}>{dm2.icon || '📋'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <Badge label={run.dilemma_code} color={dm2.color} light={dm2.light} border={dm2.border} />
                    <Badge label={run.domain} color={dm2.color} light={dm2.light} border={dm2.border} />
                    {run.pressure_applied && (
                      <Badge label={run.pressure_applied} color="#d97706" light="#fffbeb" border="#fde68a" />
                    )}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.run_id}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {sc != null && (
                    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: sc15color, lineHeight: 1 }}>
                      {sc}<span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>/15</span>
                    </div>
                  )}
                  <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                    {run.created_at ? new Date(run.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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
    { id: 'history',         label: t('humanizingAiModule.tabs.history'),         icon: '📁' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'humanize':        return <TabHumanize t={t} />;
      case 'promptHumanitas': return <TabPromptHumanitas t={t} />;
      case 'testHumanitas':   return <TabTestHumanitas t={t} />;
      case 'history':         return <TabHistory t={t} />;
      default:                return <TabHumanize t={t} />;
    }
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg,#f0fdf4 0%,#f9fafb 50%,#eff6ff 100%)',
      fontFamily: 'inherit',
    }}>
      {/* ── Hero header ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '2px solid #e5e7eb',
        padding: '24px 32px 20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        {/* Workshop-style label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: '#059669', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'monospace' }}>
            WORKPLACE LEARNING WITH AI
          </span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
            ITEM AGENTS
          </span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
            2026
          </span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16,
              background: 'linear-gradient(135deg,#059669,#10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
              boxShadow: '0 4px 14px rgba(5,150,105,0.25)',
            }}>
              🌿
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.15 }}>
                {t('humanizingAiModule.title')}
              </h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                {t('humanizingAiModule.tagline')}
              </p>
            </div>
          </div>

          {/* Pillar chips in header */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {PILLARS.map((p) => (
              <div key={p.key} style={{
                background: p.light,
                border: `1px solid ${p.border}`,
                borderTop: `3px solid ${p.color}`,
                borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 88,
              }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{p.icon}</div>
                <div style={{ color: p.color, fontSize: 11, fontWeight: 800 }}>
                  {t(`humanizingAiModule.pillars.${p.labelKey}`)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspiration row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          {[
            { icon: '🌱', label: 'Protocolo VirTrin',              color: '#059669' },
            { icon: '📜', label: 'Magnifica Humanitas · León XIV', color: '#4f46e5' },
            { icon: '🧪', label: 'Test Humanitas · ANEMOS',        color: '#d97706' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>{s.icon}</span>
              <span style={{ color: s.color, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        display: 'flex', gap: 2, overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #059669' : '2px solid transparent',
                color: isActive ? '#059669' : '#6b7280',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13, padding: '14px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                whiteSpace: 'nowrap', transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HumanizingAI;
