import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = 'http://localhost:8000/api/red-cross-qa';

const SCOPES = [
  { key: 'scopeComponent',          icon: '🧩', color: '#10b981' },
  { key: 'scopeFrontendRegression', icon: '🔁', color: '#0ea5e9' },
  { key: 'scopeQuickDebug',         icon: '🐛', color: '#f59e0b' },
];

const Cypress = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(['scopeComponent']);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (k) => setSelected(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);

  const call = async (path, setter) => {
    setter(true); setResult(null);
    try {
      const res = await fetch(`${API}/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: selected, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setter(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🌲"
          title={t('redCrossWebQaModule.cypress.header')}
          subtitle={t('redCrossWebQaModule.cypress.subheader')}
          environment={environment}
          mode={executionMode}
          gradient="linear-gradient(135deg, #047857 0%, #0f766e 50%, #115e59 100%)"
        />

        <AiUsagePolicy variant="compact" />

        {/* Phase F — Tom (Tech leder) recommends Playwright for this project
            since Storybook bundling is already in place. Cypress stays as a
            secondary tool for ad-hoc / non-Storybook needs. */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          backgroundColor: '#fffbeb', border: '1px solid #fde68a',
          color: '#92400e', fontSize: 13, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>
            ⚠️ {t('redCrossWebQaModule.cypress.tomNoticeLabel')}
          </span>
          {t('redCrossWebQaModule.cypress.tomNoticeText')}
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🎯 Scopes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 18 }}>
            {SCOPES.map(s => {
              const active = selected.includes(s.key);
              return (
                <label
                  key={s.key}
                  onClick={() => toggle(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: active ? `${s.color}20` : '#f8fafc',
                    border: `1px solid ${active ? `${s.color}80` : '#e2e8f0'}`,
                    fontSize: 13, color: active ? s.color : '#475569',
                    fontWeight: active ? 600 : 500, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span>{t(`redCrossWebQaModule.cypress.${s.key}`)}</span>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => call('generate-cypress-tests', setGenerating)} disabled={generating} style={primaryBtn(generating, '#059669')}>
              {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.cypress.btnGenerate')}
            </button>
            {executionMode === 'execute' && (
              <button onClick={() => call('run-cypress', setRunning)} disabled={running} style={secondaryBtn(running)}>
                {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.cypress.btnRun')}
              </button>
            )}
          </div>
        </div>

        {result?.status === 'ok' && result.scripts && (
          <div style={panel}>
            <h3 style={panelTitle}>📄 {t('redCrossWebQaModule.cypress.generatedFile')}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {result.scripts.map((s, i) => (
                <div key={i} style={codeBlock}>
                  <div style={{ color: '#94a3b8', marginBottom: 6 }}>{`// ${s.filename}`}</div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{s.content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {result?.status === 'error' && (
          <div style={errorBox}>{result.message}</div>
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
const codeBlock = {
  backgroundColor: '#0f172a', color: '#86efac', borderRadius: 8,
  padding: 14, fontFamily: 'ui-monospace, monospace', fontSize: 12,
  overflowX: 'auto',
};
const primaryBtn = (disabled, bg) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#86efac' : bg, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const secondaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#94a3b8' : '#1e293b', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default Cypress;
