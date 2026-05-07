import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

// ADO priority is 1 (highest) → 4 (lowest)
const PRIORITY_COLOR = {
  1: '#b91c1c', 2: '#dc2626', 3: '#f59e0b', 4: '#10b981',
};

// Tag colour for the test-level taxonomy (per Teststrategi 30.3 §5)
const TEST_LEVEL_COLOR = {
  unit: '#2563eb',
  sit: '#7c3aed',
  system: '#0891b2',
  uat: '#10b981',
  performance: '#f59e0b',
};

const AzureDevOps = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [bundle, setBundle] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/ado-bundle-preview?environment=${environment}`);
        const data = await res.json();
        if (data.status === 'ok') setBundle(data.bundle);
      } catch { /* offline */ }
    })();
  }, [environment]);

  const handleDispatch = async () => {
    setDispatching(true); setResult(null);
    try {
      const res = await fetch(`${API}/create-ado-work-items`, {
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

  const items = bundle?.work_items || [];

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🎯"
          title={t('redCrossWebQaModule.ado.header')}
          subtitle={t('redCrossWebQaModule.ado.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🏷️ {t('redCrossWebQaModule.ado.bundleConfig')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <ConfigChip label={t('redCrossWebQaModule.ado.organization')} value={bundle?.organization || 'rodekors'} color="#2563eb" mono />
            <ConfigChip label={t('redCrossWebQaModule.ado.project')} value={bundle?.project || 'rodekors-web'} color="#7c3aed" />
            <ConfigChip label={t('redCrossWebQaModule.ado.areaPath')} value={bundle?.area_path || 'rodekors-web\\Web QA'} color="#0891b2" mono />
            <ConfigChip label={t('redCrossWebQaModule.ado.iterationPath')} value={bundle?.iteration_path || 'rodekors-web\\Sprint 1'} color="#0d9488" mono />
            <ConfigChip label={t('redCrossWebQaModule.ado.tags')} value={(bundle?.tags || ['red-cross-qa']).join(', ')} color="#f59e0b" mono />
          </div>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>📋 {t('redCrossWebQaModule.ado.previewTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({items.length})</span></h3>
          {items.length === 0 ? (
            <p style={empty}>{t('redCrossWebQaModule.common.noData')}</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {items.map((wi, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: PRIORITY_COLOR[wi.priority] || '#64748b',
                    }}>P{wi.priority || 3}</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{wi.work_item_type || 'Bug'}</span>
                    {wi.severity && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6,
                        fontSize: 10, color: '#64748b',
                        backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                      }}>Sev {wi.severity}</span>
                    )}
                    {wi.severity_dev && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6,
                        fontSize: 10, color: '#7c2d12',
                        backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
                      }}>Sev{wi.severity_dev} (dev)</span>
                    )}
                    {wi.category_ops && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6,
                        fontSize: 10, color: '#1e3a8a',
                        backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
                      }}>Kat {wi.category_ops} (drift)</span>
                    )}
                    {wi.test_level && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        fontSize: 10, color: 'white', fontWeight: 700,
                        backgroundColor: TEST_LEVEL_COLOR[wi.test_level] || '#64748b',
                      }}>{wi.test_level}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{wi.title}</strong>
                  </div>
                  {wi.description && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{wi.description}</p>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <button onClick={handleDispatch} disabled={dispatching || items.length === 0} style={primaryBtn(dispatching || items.length === 0, '#2563eb')}>
              {dispatching ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.ado.btnDispatch')}
            </button>
            <button onClick={handleOutSystems} disabled={sending || items.length === 0} style={primaryBtn(sending || items.length === 0, '#4f46e5')}>
              {sending ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.ado.btnSendToOutsystems')}
            </button>
          </div>
        </div>

        {result?.status === 'ok' && (
          <div style={{
            padding: 14, borderRadius: 10,
            backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', color: '#047857',
            fontSize: 13, fontWeight: 500,
          }}>
            ✅ {t('redCrossWebQaModule.ado.dispatched')}: {result.created_count ?? result.dispatched_count ?? 0}
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

export default AzureDevOps;
