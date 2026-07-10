import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const SCOPES = [
  { key: 'scopeNavigation',    icon: '🧭', color: '#3b82f6' },
  { key: 'scopeForms',         icon: '📝', color: '#8b5cf6' },
  { key: 'scopeSearch',        icon: '🔎', color: '#06b6d4' },
  { key: 'scopeDonation',      icon: '💝', color: '#dc2626' },
  { key: 'scopeVolunteer',     icon: '🙋', color: '#10b981' },
  { key: 'scopeCmsPreview',    icon: '👁️', color: '#f59e0b' },
  { key: 'scopeAccessibility', icon: '♿', color: '#0891b2' },
  { key: 'scopeVisual',        icon: '🖼️', color: '#ec4899' },
  { key: 'scopeApiMock',       icon: '🔌', color: '#6366f1' },
  // Phase F — Tom (Tech leder, Røde Kors, 2026-05-12):
  // 'Playwright er bundlet med Storybook, så vi bruker det i stedet for
  // Cypress, siden verktøy-integrasjonen er på plass allerede.'
  { key: 'scenarioStorybook',  icon: '📚', color: '#a16207' },
];

const Playwright = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(['scopeNavigation', 'scopeDonation', 'scopeAccessibility']);
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
    <div style={page}>
      <div style={grid}>
        <PageHero
          icon="🎭"
          title={t('redCrossWebQaModule.playwright.header')}
          subtitle={t('redCrossWebQaModule.playwright.subheader')}
          environment={environment}
          mode={executionMode}
          gradient="linear-gradient(135deg, #b91c1c 0%, #be185d 50%, #6b21a8 100%)"
        />

        <AiUsagePolicy variant="compact" />

        {/* Phase F — Tom's tooling tip banner (NextJS + Storybook + Playwright) */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
          color: '#854d0e', fontSize: 13, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>
            💡 {t('redCrossWebQaModule.playwright.tomTipLabel')}
          </span>
          {t('redCrossWebQaModule.playwright.tomTipText')}
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🎯 Scopes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
            {SCOPES.map(s => {
              const active = selected.includes(s.key);
              return (
                <label
                  key={s.key}
                  onClick={() => toggle(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: active ? `${s.color}20` : '#f8fafc',
                    border: `1px solid ${active ? `${s.color}80` : '#e2e8f0'}`,
                    fontSize: 13, color: active ? s.color : '#475569',
                    fontWeight: active ? 600 : 500, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span>{t(`redCrossWebQaModule.playwright.${s.key}`)}</span>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => call('generate-playwright-tests', setGenerating)} disabled={generating} style={primaryBtn(generating, '#dc2626')}>
              {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.playwright.btnGenerate')}
            </button>
            {executionMode === 'execute' && (
              <button onClick={() => call('run-playwright', setRunning)} disabled={running} style={secondaryBtn(running)}>
                {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.playwright.btnRun')}
              </button>
            )}
          </div>
        </div>

        {result?.status === 'ok' && result.scripts && (
          <div style={panel}>
            <h3 style={panelTitle}>📄 {t('redCrossWebQaModule.playwright.generatedFile')}</h3>
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

        {result?.status === 'error' && <ErrorBox message={result.message} />}
      </div>
    </div>
  );
};

// ── shared inline styles ──────────────────────────────────────────
const page = { padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' };
const grid = { display: 'grid', gap: 24 };
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
const primaryBtn = (disabled, bg = '#dc2626') => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fca5a5' : bg, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const secondaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#94a3b8' : '#1e293b', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const ErrorBox = ({ message }) => (
  <div style={{
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
    borderRadius: 8, padding: 14, fontSize: 13,
  }}>{message}</div>
);

export default Playwright;
