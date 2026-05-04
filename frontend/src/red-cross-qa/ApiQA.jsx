import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  { key: 'checkQueryCorrectness',  icon: '✅' },
  { key: 'checkPagination',        icon: '📄' },
  { key: 'checkFiltering',         icon: '🔍' },
  { key: 'checkLocalization',      icon: '🌍' },
  { key: 'checkPreviewVsPublished',icon: '👁️' },
  { key: 'checkCaching',           icon: '⚡' },
  { key: 'checkPerfBudget',        icon: '⏱️' },
  { key: 'checkSchemaDrift',       icon: '📐' },
  { key: 'checkRateLimit',         icon: '🚦' },
  { key: 'checkErrorHandling',     icon: '⚠️' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const ApiQA = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [endpoint, setEndpoint] = useState('/site/api/graphql');
  const [method, setMethod] = useState('POST');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!endpoint.trim()) return;
    setAnalyzing(true); setReport(null);
    try {
      const res = await fetch(`${API}/analyze-api`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setAnalyzing(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🔌"
          title={t('redCrossWebQaModule.apiQa.header')}
          subtitle={t('redCrossWebQaModule.apiQa.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #312e81 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🎯 Endpoint</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, marginBottom: 14 }}>
            <input value={endpoint} onChange={e => setEndpoint(e.target.value)} style={input} />
            <select value={method} onChange={e => setMethod(e.target.value)} style={input}>
              {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={handleAnalyze} disabled={analyzing} style={primaryBtn(analyzing)}>
            {analyzing ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.apiQa.btnAnalyze')}
          </button>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🩺 {t('redCrossWebQaModule.apiQa.checks')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {CHECKS.map(c => {
              const status = report?.checks?.[c.key] || 'pending';
              const s = STATUS_STYLES[status];
              return (
                <div key={c.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 10, padding: '12px 14px', borderRadius: 10,
                  backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    {t(`redCrossWebQaModule.apiQa.${c.key}`)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {report?.status === 'error' && (
          <div style={errorBox}>{report.message}</div>
        )}
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
  backgroundColor: disabled ? '#93c5fd' : '#2563eb', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default ApiQA;
