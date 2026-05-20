import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const METRICS = [
  { key: 'metricLcp',        icon: '🖼️', color: '#3b82f6' },
  { key: 'metricCls',        icon: '📐', color: '#8b5cf6' },
  { key: 'metricInp',        icon: '👆', color: '#06b6d4' },
  { key: 'metricTtfb',       icon: '⏱️', color: '#f59e0b' },
  { key: 'metricBundleSize', icon: '📦', color: '#ec4899' },
  { key: 'metricImageOpt',   icon: '🎨', color: '#10b981' },
  { key: 'metricFontLoad',   icon: '🔤', color: '#6366f1' },
  { key: 'metricServerResp', icon: '🖥️', color: '#0891b2' },
  { key: 'metricGraphQL',    icon: '🔌', color: '#7c3aed' },
  { key: 'metricCacheHit',   icon: '⚡', color: '#f97316' },
];

const STATUS_BORDER = { pass: '#6ee7b7', warn: '#fcd34d', fail: '#fca5a5', pending: '#cbd5e1' };
const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const ENONIC_CHECKS = [
  { key: 'checkGraphqlWaterfall',  icon: '🌊' },
  { key: 'checkGraphqlNplusOne',   icon: '🔁' },
  { key: 'checkGuillotineFields',  icon: '🪞' },
  { key: 'checkIsrLatency',        icon: '⏲️' },
  { key: 'checkIsrCascading',      icon: '🌳' },
  { key: 'checkImageService',      icon: '🖼️' },
  { key: 'checkPublishLatency',    icon: '🚀' },
  { key: 'checkBulkPublish',       icon: '📚' },
  { key: 'checkPartRender',        icon: '🧩' },
  { key: 'checkCacheInvalidation', icon: '♻️' },
  // Phase H+ (Enonic skill 0.1.0) — three server-side perf checks added.
  { key: 'checkRefreshStrategy',     icon: '🔄' },
  { key: 'checkChangeDetectionPerf', icon: '⚖️' },
  { key: 'checkConnectionPooling',   icon: '🪢' },
];
const PRIORITY_COLOR = { high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

// URL presets — quick targets for the rodekors.no rebuild stack.
// `lunixHello` is Tom's NextJS + Enonic XP + GraphQL "hello world" preview
// shared 2026-05-08 (test.lunix.cloud) — perfect smoke for the Enonic-specific
// performance suite (Guillotine waterfall / N+1 / overfetch).
const URL_PRESETS = [
  {
    key: 'rodekorsProd',
    url: 'https://www.rodekors.no/',
    icon: '❤️‍🩹',
    color: '#dc2626',
  },
  {
    key: 'lunixHello',
    url: 'https://test.lunix.cloud/',
    icon: '🧪',
    color: '#7c3aed',
    badge: 'Tom · NextJS + XP + GraphQL',
  },
  {
    key: 'localDev',
    url: 'http://localhost:3000/',
    icon: '💻',
    color: '#0891b2',
  },
];

const Performance = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [enonicRunning, setEnonicRunning] = useState(false);
  const [enonicReport, setEnonicReport] = useState(null);

  const runLighthouseOn = async (target) => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-lighthouse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const runEnonicOn = async (target) => {
    setEnonicRunning(true); setEnonicReport(null);
    try {
      const res = await fetch(`${API}/run-enonic-performance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, environment, lang: i18n.language }),
      });
      setEnonicReport(await res.json());
    } catch { setEnonicReport({ status: 'error', message: 'Network error' }); }
    finally { setEnonicRunning(false); }
  };

  const handleRun = () => runLighthouseOn(url);
  const handleEnonicRun = () => runEnonicOn(url);

  // Run both Lighthouse + Enonic-specific against the current URL (or an
  // optional override). Used by the URL-preset chips so a single click on
  // "Tom · test.lunix.cloud" gives a complete picture of the NextJS + XP
  // + Guillotine GraphQL stack.
  const handleRunBoth = async (override) => {
    const target = override || url;
    if (override) setUrl(override);
    await runLighthouseOn(target);
    await runEnonicOn(target);
  };

  const score = report?.lighthouse_score ?? null;
  const scoreColor = score === null ? '#94a3b8' : score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#dc2626';

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="⚡"
          title={t('redCrossWebQaModule.performance.header')}
          subtitle={t('redCrossWebQaModule.performance.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #b45309 0%, #d97706 50%, #c2410c 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🌐 Target URL</h3>

          {/* URL presets — one-click chips. Tom's lunix.cloud preview runs
              Lighthouse + Enonic-specific in one go (NextJS + XP + GraphQL). */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, color: '#64748b', textTransform: 'uppercase',
              fontWeight: 600, letterSpacing: 0.4, marginBottom: 8,
            }}>
              {t('redCrossWebQaModule.performance.presetsTitle')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {URL_PRESETS.map(p => {
                const active = url === p.url;
                const busy = running || enonicRunning;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleRunBoth(p.url)}
                    disabled={busy}
                    title={p.url}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 999,
                      backgroundColor: active ? `${p.color}15` : '#f8fafc',
                      border: `1px solid ${active ? `${p.color}80` : '#e2e8f0'}`,
                      color: active ? p.color : '#475569',
                      fontSize: 12, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
                      opacity: busy ? 0.6 : 1, transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span>{t(`redCrossWebQaModule.performance.preset_${p.key}`)}</span>
                    {p.badge && (
                      <span style={{
                        marginLeft: 4, padding: '2px 8px', borderRadius: 999,
                        backgroundColor: `${p.color}20`, color: p.color,
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>
                        {p.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input value={url} onChange={e => setUrl(e.target.value)} style={{ ...input, flex: 1, minWidth: 240 }} />
            <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.performance.btnRunLighthouse')}
            </button>
            <button onClick={() => handleRunBoth()} disabled={running || enonicRunning} style={runBothBtn(running || enonicRunning)}>
              {(running || enonicRunning)
                ? t('redCrossWebQaModule.common.running')
                : t('redCrossWebQaModule.performance.btnRunBoth')}
            </button>
          </div>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>📊 Core Web Vitals + Bundles</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            {METRICS.map(m => {
              const v = report?.metrics?.[m.key];
              const status = v?.status || 'pending';
              return (
                <div key={m.key} style={{
                  padding: 14, borderRadius: 10,
                  backgroundColor: `${m.color}10`,
                  border: `1px solid ${STATUS_BORDER[status]}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: m.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    {t(`redCrossWebQaModule.performance.${m.key}`)}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginTop: 6 }}>
                    {v?.value || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ ...panel, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('redCrossWebQaModule.performance.lighthouseScore')}
            </p>
            <p style={{ margin: '12px 0 0', fontSize: 48, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {score === null ? '—' : score}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Lighthouse</p>
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>🚧 {t('redCrossWebQaModule.performance.bottlenecks')}</h3>
            <ul style={listStyle}>
              {(report?.bottlenecks || []).map((b, i) => <li key={i}>{typeof b === 'string' ? b : b.title || JSON.stringify(b)}</li>)}
              {(!report?.bottlenecks || report.bottlenecks.length === 0) && <li style={{ listStyle: 'none', color: '#94a3b8' }}>{t('redCrossWebQaModule.common.noData')}</li>}
            </ul>
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>💡 {t('redCrossWebQaModule.performance.optimizations')}</h3>
            <ul style={listStyle}>
              {(report?.optimizations || []).map((o, i) => <li key={i}>{typeof o === 'string' ? o : o.title || JSON.stringify(o)}</li>)}
              {(!report?.optimizations || report.optimizations.length === 0) && <li style={{ listStyle: 'none', color: '#94a3b8' }}>{t('redCrossWebQaModule.common.noData')}</li>}
            </ul>
          </div>
        </div>

        {report?.status === 'error' && <div style={errorBox}>{report.message}</div>}

        {/* ── Enonic-specific Performance ────────────────────────────── */}
        <div style={{ ...panel, borderTop: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>🔌 {t('redCrossWebQaModule.performance.enonicTitle')}</h3>
            <button onClick={handleEnonicRun} disabled={enonicRunning} style={enonicBtn(enonicRunning)}>
              {enonicRunning ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.performance.btnRunEnonic')}
            </button>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
            {t('redCrossWebQaModule.performance.enonicSubheader')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {ENONIC_CHECKS.map(c => {
              const item = enonicReport?.checks?.[c.key];
              const status = item?.status || 'pending';
              const s = STATUS_STYLES[status];
              const metric = item?.p95_ms != null ? `p95 ${item.p95_ms}ms`
                : item?.p95_seconds != null ? `p95 ${item.p95_seconds}s`
                : item?.duplicate_queries != null ? `${item.duplicate_queries} dup`
                : item?.queries != null ? `${item.queries} q`
                : item?.overfetched_fields != null ? `${item.overfetched_fields} extra`
                : null;
              return (
                <div key={c.key} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      {t(`redCrossWebQaModule.performance.${c.key}`)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                  </div>
                  {metric && <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{metric}</div>}
                  {item?.note && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>{item.note}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {Array.isArray(enonicReport?.hot_queries) && enonicReport.hot_queries.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🔥 {t('redCrossWebQaModule.performance.hotQueriesTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({enonicReport.hot_queries.length})</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>Query</th>
                    <th style={th}>p95 (ms)</th>
                    <th style={th}>Queries</th>
                    <th style={th}>Duplicates</th>
                    <th style={th}>{t('redCrossWebQaModule.performance.fixHint')}</th>
                  </tr>
                </thead>
                <tbody>
                  {enonicReport.hot_queries.map((q, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#1e293b', fontWeight: 600 }}>{q.name}</td>
                      <td style={{ ...td, color: q.p95_ms > 400 ? '#b91c1c' : '#475569', fontWeight: 600 }}>{q.p95_ms}</td>
                      <td style={td}>{q.queries}</td>
                      <td style={{ ...td, color: q.duplicates > 0 ? '#92400e' : '#10b981', fontWeight: 600 }}>{q.duplicates}</td>
                      <td style={{ ...td, fontSize: 12, color: '#7c3aed', fontStyle: 'italic' }}>{q.fix_hint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {Array.isArray(enonicReport?.recommendations) && enonicReport.recommendations.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>💡 {t('redCrossWebQaModule.performance.recommendationsTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({enonicReport.recommendations.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {enonicReport.recommendations.map((r, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: PRIORITY_COLOR[r.priority] || '#64748b',
                    }}>{r.priority}</span>
                    {r.category && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: '#7c3aed15', color: '#7c3aed', border: '1px solid #7c3aed40',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>{r.category}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{r.title}</strong>
                  </div>
                  {r.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>{r.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {enonicReport?.status === 'error' && <div style={errorBox}>{enonicReport.message}</div>}
      </div>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const input = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
  fontSize: 14, fontFamily: 'inherit', color: '#1e293b',
};
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fcd34d' : '#d97706', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const enonicBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#c4b5fd' : '#7c3aed', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
// Run-both button — gradient that visually combines the two suite colors
// (Lighthouse amber #d97706 + Enonic violet #7c3aed) so users immediately
// see it triggers both runs.
const runBothBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  background: disabled
    ? 'linear-gradient(135deg, #fcd34d 0%, #c4b5fd 100%)'
    : 'linear-gradient(135deg, #d97706 0%, #7c3aed 100%)',
  color: 'white', fontWeight: 600, fontSize: 14,
  cursor: disabled ? 'default' : 'pointer',
});
const th = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4,
  backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0',
};
const td = { padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13, color: '#475569' };
const listStyle = { margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569', display: 'grid', gap: 4 };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default Performance;
