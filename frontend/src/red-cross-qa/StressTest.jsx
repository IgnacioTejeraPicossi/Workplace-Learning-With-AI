import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const PROFILES = [
  { key: 'profileSmoke',    icon: '💨', color: '#10b981' },
  { key: 'profileNormal',   icon: '🚶', color: '#3b82f6' },
  { key: 'profileCampaign', icon: '📣', color: '#f59e0b' },
  { key: 'profileCrisis',   icon: '🚨', color: '#dc2626' },
  { key: 'profileSoak',     icon: '⏳', color: '#8b5cf6' },
];

const SCENARIOS = [
  { key: 'scenarioPublic',     icon: '🌐' }, { key: 'scenarioDonation',  icon: '💝' },
  { key: 'scenarioVolunteer',  icon: '🙋' }, { key: 'scenarioSearch',    icon: '🔎' },
  { key: 'scenarioLocalPages', icon: '📍' }, { key: 'scenarioForms',     icon: '📝' },
  { key: 'scenarioRateLimit',  icon: '🚦' }, { key: 'scenarioCmsPublish',icon: '🚀' },
  { key: 'scenarioCachePurge', icon: '🧹' },
];

const StressTest = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState('profileNormal');
  const [scenarios, setScenarios] = useState(['scenarioDonation']);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const toggleScenario = (s) => setScenarios(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const call = async (path, setter) => {
    setter(true); setResult(null);
    try {
      const res = await fetch(`${API}/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scenarios, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setter(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🔥"
          title={t('redCrossWebQaModule.stressTest.header')}
          subtitle={t('redCrossWebQaModule.stressTest.subheader')}
          environment={environment}
          mode={executionMode}
          gradient="linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #b45309 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🎯 Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {PROFILES.map(p => {
              const active = profile === p.key;
              return (
                <button key={p.key} onClick={() => setProfile(p.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: active ? `${p.color}20` : '#f8fafc',
                  border: `1px solid ${active ? `${p.color}80` : '#e2e8f0'}`,
                  fontSize: 13, color: active ? p.color : '#475569',
                  fontWeight: active ? 600 : 500, textAlign: 'left', transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span>{t(`redCrossWebQaModule.stressTest.${p.key}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🌪️ Scenarios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 18 }}>
            {SCENARIOS.map(s => {
              const active = scenarios.includes(s.key);
              return (
                <label key={s.key} onClick={() => toggleScenario(s.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: active ? '#fff7ed' : '#f8fafc',
                  border: `1px solid ${active ? '#fdba74' : '#e2e8f0'}`,
                  fontSize: 13, color: active ? '#c2410c' : '#475569',
                  fontWeight: active ? 600 : 500, transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span>{t(`redCrossWebQaModule.stressTest.${s.key}`)}</span>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => call('generate-k6-script', setGenerating)} disabled={generating} style={primaryBtn(generating)}>
              {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.stressTest.btnGenerate')}
            </button>
            {executionMode === 'execute' && (
              <button onClick={() => call('run-k6', setRunning)} disabled={running} style={secondaryBtn(running)}>
                {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.stressTest.btnRun')}
              </button>
            )}
          </div>
        </div>

        {result?.status === 'ok' && result.script && (
          <div style={panel}>
            <h3 style={panelTitle}>📄 {result.filename || 'k6-script.js'}</h3>
            <div style={codeBlock}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.script}</pre>
            </div>
          </div>
        )}

        {result?.status === 'ok' && result.results && (
          <div style={panel}>
            <h3 style={panelTitle}>📈 k6 Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {Object.entries(result.results).map(([k, v]) => (
                <div key={k} style={{
                  padding: 14, borderRadius: 10,
                  backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
                }}>
                  <div style={{ fontSize: 11, color: '#c2410c', textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result?.status === 'error' && <div style={errorBox}>{result.message}</div>}
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
  backgroundColor: '#0f172a', color: '#fdba74', borderRadius: 8,
  padding: 14, fontFamily: 'ui-monospace, monospace', fontSize: 12,
  overflowX: 'auto',
};
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fdba74' : '#ea580c', color: 'white',
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

export default StressTest;
