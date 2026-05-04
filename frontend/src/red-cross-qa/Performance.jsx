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

const Performance = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-lighthouse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input value={url} onChange={e => setUrl(e.target.value)} style={{ ...input, flex: 1, minWidth: 240 }} />
            <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.performance.btnRunLighthouse')}
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
const listStyle = { margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569', display: 'grid', gap: 4 };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default Performance;
