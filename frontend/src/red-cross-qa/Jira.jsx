import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const PRIORITY_COLOR = {
  Critical: '#b91c1c', High: '#dc2626', Medium: '#f59e0b', Low: '#10b981',
};

const Jira = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [bundle, setBundle] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/jira-bundle-preview?environment=${environment}`);
        const data = await res.json();
        if (data.status === 'ok') setBundle(data.bundle);
      } catch { /* offline */ }
    })();
  }, [environment]);

  const handleDispatch = async () => {
    setDispatching(true); setResult(null);
    try {
      const res = await fetch(`${API}/create-jira-issues`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setDispatching(false); }
  };

  const handleOutSystems = async () => {
    setSending(true); setResult(null);
    try {
      const res = await fetch(`${API}/dispatch-to-outsystems`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setSending(false); }
  };

  const issues = bundle?.issues || [];

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🎯"
          title={t('redCrossWebQaModule.jira.header')}
          subtitle={t('redCrossWebQaModule.jira.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🏷️ Bundle config</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <ConfigChip label={t('redCrossWebQaModule.jira.projectKey')} value={bundle?.project_key || 'ITEM'} color="#2563eb" mono />
            <ConfigChip label={t('redCrossWebQaModule.jira.component')} value={bundle?.component || 'Web QA'} color="#7c3aed" />
            <ConfigChip label={t('redCrossWebQaModule.jira.labels')} value={(bundle?.labels || ['red-cross-qa']).join(', ')} color="#0891b2" mono />
          </div>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>📋 {t('redCrossWebQaModule.jira.previewTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({issues.length})</span></h3>
          {issues.length === 0 ? (
            <p style={empty}>{t('redCrossWebQaModule.common.noData')}</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {issues.map((iss, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: PRIORITY_COLOR[iss.priority] || '#64748b',
                    }}>{iss.priority || 'Medium'}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{iss.type || 'Bug'}</span>
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{iss.title}</strong>
                  </div>
                  {iss.description && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{iss.description}</p>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <button onClick={handleDispatch} disabled={dispatching || issues.length === 0} style={primaryBtn(dispatching || issues.length === 0, '#2563eb')}>
              {dispatching ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.jira.btnDispatch')}
            </button>
            <button onClick={handleOutSystems} disabled={sending || issues.length === 0} style={primaryBtn(sending || issues.length === 0, '#4f46e5')}>
              {sending ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.jira.btnSendToOutsystems')}
            </button>
          </div>
        </div>

        {result?.status === 'ok' && (
          <div style={{
            padding: 14, borderRadius: 10,
            backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', color: '#047857',
            fontSize: 13, fontWeight: 500,
          }}>
            ✅ {t('redCrossWebQaModule.jira.dispatched')}: {result.created_count ?? result.dispatched_count ?? 0}
          </div>
        )}
        {result?.status === 'error' && <div style={errorBox}>{result.message}</div>}
      </div>
    </div>
  );
};

const ConfigChip = ({ label, value, color, mono }) => (
  <div style={{
    padding: '8px 12px', borderRadius: 10,
    backgroundColor: `${color}10`, border: `1px solid ${color}30`,
  }}>
    <div style={{ fontSize: 11, color, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', marginTop: 2 }}>{value}</div>
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const primaryBtn = (disabled, bg) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#cbd5e1' : bg, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const empty = { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default Jira;
