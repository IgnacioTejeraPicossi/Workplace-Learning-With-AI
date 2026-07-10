import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const SCOPES = [
  { key: 'scopeDonation',  icon: '💰', color: '#dc2626' },
  { key: 'scopeVolunteer', icon: '🤝', color: '#2563eb' },
  { key: 'scopeContact',   icon: '✉️', color: '#0891b2' },
  { key: 'scopeCourse',    icon: '🎓', color: '#7c3aed' },
  { key: 'scopeBeredskap', icon: '🚨', color: '#ea580c' },
  { key: 'scopeVipps',     icon: '💳', color: '#f59e0b' },
];

const CHECKS = [
  { key: 'checkJsonSchema',          icon: '📐' },
  { key: 'checkAdamSilverPatterns',  icon: '📋' },
  { key: 'checkMultiStep',           icon: '🪜' },
  { key: 'checkMobileKeyboard',      icon: '⌨️' },
  { key: 'checkAutocomplete',        icon: '✨' },
  { key: 'checkPrefillApi',          icon: '🔌' },
  { key: 'checkValidationMessages',  icon: '⚠️' },
  { key: 'checkAriaLive',            icon: '📢' },
  { key: 'checkErrorSummary',        icon: '📑' },
  { key: 'checkProgressIndicator',   icon: '📊' },
  { key: 'checkVippsHandoff',        icon: '🔁' },
  { key: 'checkSubmitIdempotency',   icon: '🔒' },
  // Phase H+ (Enonic skill 0.1.0) — three security-focused checks added.
  { key: 'checkCsrf',                  icon: '🛡️' },
  { key: 'checkInjectionInFormFields', icon: '💉' },
  { key: 'checkServiceUrlGeneration',  icon: '🔗' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};
const SEV_COLOR = { critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

const FormsQA = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [activeScopes, setActiveScopes] = useState(SCOPES.map(s => s.key));

  const toggleScope = (key) => {
    setActiveScopes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-forms-qa`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: activeScopes, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="📝"
          title={t('redCrossWebQaModule.formsQa.header')}
          subtitle={t('redCrossWebQaModule.formsQa.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #ec4899 100%)"
        />

        <AiUsagePolicy variant="compact" />

        <div style={panel}>
          <h3 style={panelTitle}>🎯 {t('redCrossWebQaModule.formsQa.scopesTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 18 }}>
            {SCOPES.map(s => {
              const active = activeScopes.includes(s.key);
              return (
                <button key={s.key} onClick={() => toggleScope(s.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 10,
                  backgroundColor: active ? `${s.color}15` : '#f8fafc',
                  border: `1px solid ${active ? `${s.color}80` : '#e2e8f0'}`,
                  color: active ? s.color : '#64748b',
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  {t(`redCrossWebQaModule.formsQa.${s.key}`)}
                </button>
              );
            })}
          </div>
          <button onClick={handleRun} disabled={running || activeScopes.length === 0} style={primaryBtn(running || activeScopes.length === 0)}>
            {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.formsQa.btnRun')}
          </button>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🔍 {t('redCrossWebQaModule.formsQa.checksTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {CHECKS.map(c => {
              const item = report?.checks?.[c.key];
              const status = item?.status || 'pending';
              const s = STATUS_STYLES[status];
              return (
                <div key={c.key} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      {t(`redCrossWebQaModule.formsQa.${c.key}`)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                  </div>
                  {item?.note && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>{item.note}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {Array.isArray(report?.findings) && report.findings.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🔎 {t('redCrossWebQaModule.formsQa.findingsTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.findings.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.findings.map((f, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: SEV_COLOR[f.severity] || '#64748b',
                    }}>{f.severity}</span>
                    {f.form && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: '#ec489915', color: '#ec4899', border: '1px solid #ec489940',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>{f.form}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{f.title}</strong>
                  </div>
                  {f.message && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>{f.message}</p>}
                  {f.fix_hint && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#0f766e', fontStyle: 'italic' }}>
                      💡 {f.fix_hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(report?.test_cases) && report.test_cases.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🧪 {t('redCrossWebQaModule.formsQa.testCasesTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.test_cases.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.test_cases.map((tc, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{tc.title}</strong>
                    {tc.tool && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: '#0f766e15', color: '#0f766e', border: '1px solid #0f766e40',
                      }}>{tc.tool}</span>
                    )}
                  </div>
                  {Array.isArray(tc.steps) && tc.steps.length > 0 && (
                    <ol style={{ margin: '4px 0 4px 20px', padding: 0, fontSize: 12, color: '#64748b' }}>
                      {tc.steps.map((s, j) => <li key={j} style={{ marginBottom: 2 }}>{s}</li>)}
                    </ol>
                  )}
                  {tc.expected && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#047857', fontWeight: 500 }}>
                      ✓ {tc.expected}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#94a3b8' : '#0f766e', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default FormsQA;
