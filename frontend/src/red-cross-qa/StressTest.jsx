import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const PROFILES = [
  { key: 'profileSmoke',    icon: '💨', color: '#10b981' },
  { key: 'profileNormal',   icon: '🚶', color: '#3b82f6' },
  { key: 'profileCampaign', icon: '📣', color: '#f59e0b' },
  { key: 'profileCrisis',   icon: '🚨', color: '#dc2626' },
  { key: 'profileSoak',     icon: '⏳', color: '#8b5cf6' },
];

// Phase D — Load-testing tool selector. k6 (existing) is protocol-level HTTP;
// Loadster runs real browsers so it captures JS hydration + SPA navigation,
// which matters for the NextJS + Designsystemet front-end where editorial
// "slowness" usually lives in client-side code, not in HTTP throughput.
const TOOLS = [
  { key: 'k6',       icon: '🔥', color: '#ea580c',
    endpoints: { generate: 'generate-k6-script', run: 'run-k6' } },
  { key: 'loadster', icon: '🌐', color: '#2563eb',
    endpoints: { generate: 'generate-loadster-script', run: 'run-loadster' } },
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
  const [tool, setTool] = useState('k6');  // Phase D: 'k6' | 'loadster'
  const [profile, setProfile] = useState('profileNormal');
  const [scenarios, setScenarios] = useState(['scenarioDonation']);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Resilience — Trine separates ytelse from resilience
  const [resilienceRunning, setResilienceRunning] = useState(false);
  const [resilience, setResilience] = useState(null);

  const activeTool = TOOLS.find(t => t.key === tool) || TOOLS[0];

  const toggleScenario = (s) => setScenarios(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const call = async (action, setter) => {
    setter(true); setResult(null);
    const path = activeTool.endpoints[action];
    try {
      const res = await fetch(`${API}/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scenarios, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setter(false); }
  };

  const handleResilience = async () => {
    setResilienceRunning(true); setResilience(null);
    try {
      const res = await fetch(`${API}/run-resilience-check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scenarios, environment, lang: i18n.language }),
      });
      setResilience(await res.json());
    } catch { setResilience({ status: 'error', message: 'Network error' }); }
    finally { setResilienceRunning(false); }
  };

  const r = resilience?.resilience || {};
  const score = r.resilience_score;
  const scoreColor =
    score == null ? '#64748b' :
    score >= 80   ? '#047857' :
    score >= 60   ? '#f59e0b' : '#b91c1c';

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

        <AiUsagePolicy variant="compact" />

        {/* Phase D — Load-testing tool selector (k6 vs Loadster) */}
        <div style={panel}>
          <h3 style={panelTitle}>🛠️ {t('redCrossWebQaModule.stressTest.toolTitle')}</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
            {t('redCrossWebQaModule.stressTest.toolHint')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {TOOLS.map(tl => {
              const active = tool === tl.key;
              return (
                <label key={tl.key} onClick={() => { setTool(tl.key); setResult(null); }}
                       style={{
                         display: 'flex', alignItems: 'center', gap: 12,
                         padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                         backgroundColor: active ? `${tl.color}15` : '#f8fafc',
                         border: `1px solid ${active ? `${tl.color}80` : '#e2e8f0'}`,
                         transition: 'all 0.2s',
                       }}>
                  <input type="radio" name="loadTool" value={tl.key}
                    checked={active} onChange={() => setTool(tl.key)}
                    style={{ accentColor: tl.color }} />
                  <span style={{ fontSize: 22 }}>{tl.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600,
                                  color: active ? tl.color : '#1e293b' }}>
                      {t(`redCrossWebQaModule.stressTest.tool_${tl.key}`)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                      {t(`redCrossWebQaModule.stressTest.tool_${tl.key}_hint`)}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

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
            <button onClick={() => call('generate', setGenerating)} disabled={generating}
                    style={primaryBtn(generating, activeTool.color)}>
              {generating ? t('redCrossWebQaModule.common.generating')
                          : `${activeTool.icon} ${t(`redCrossWebQaModule.stressTest.btnGenerate_${tool}`)}`}
            </button>
            {executionMode === 'execute' && (
              <button onClick={() => call('run', setRunning)} disabled={running} style={secondaryBtn(running)}>
                {running ? t('redCrossWebQaModule.common.running')
                         : t(`redCrossWebQaModule.stressTest.btnRun_${tool}`)}
              </button>
            )}
          </div>
        </div>

        {result?.status === 'ok' && result.script && (
          <div style={panel}>
            <h3 style={panelTitle}>
              📄 {result.filename || (result.tool === 'loadster' ? 'loadster.lhx.json' : 'k6-script.js')}
              {result.tool === 'loadster' && result.engines && (
                <span style={enginesPill}>{result.engines} engine{result.engines > 1 ? 's' : ''}</span>
              )}
            </h3>
            <div style={codeBlock}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.script}</pre>
            </div>
            {result.notes && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                {result.notes}
              </div>
            )}
          </div>
        )}

        {result?.status === 'ok' && result.results && (
          <div style={panel}>
            <h3 style={panelTitle}>
              📈 {result.tool === 'loadster' ? 'Loadster' : 'k6'} Results
            </h3>
            {result.differentiator && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
                fontSize: 12, color: '#1e3a8a', lineHeight: 1.5,
              }}>
                <strong>ℹ️ {t('redCrossWebQaModule.stressTest.differentiator')}:</strong> {result.differentiator}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {Object.entries(result.results).map(([k, v]) => {
                const isLoadster = result.tool === 'loadster';
                return (
                  <div key={k} style={{
                    padding: 14, borderRadius: 10,
                    backgroundColor: isLoadster ? '#eff6ff' : '#fff7ed',
                    border: `1px solid ${isLoadster ? '#bfdbfe' : '#fed7aa'}`,
                  }}>
                    <div style={{ fontSize: 11,
                                  color: isLoadster ? '#1d4ed8' : '#c2410c',
                                  textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                      {String(v)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {result?.status === 'error' && <div style={errorBox}>{result.message}</div>}

        {/* ── Resilience / lasttesting eksplisitt — Trine separates ytelse from resilience ── */}
        <div style={{ ...panel, borderTop: '3px solid #7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>
              💪 {t('redCrossWebQaModule.resilience.header')}
            </h3>
            {score != null && (
              <div style={{
                padding: '6px 14px', borderRadius: 999,
                backgroundColor: `${scoreColor}15`, border: `1px solid ${scoreColor}50`,
                color: scoreColor, fontSize: 12, fontWeight: 700,
              }}>
                {t('redCrossWebQaModule.resilience.score')}: {score}/100
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
            {t('redCrossWebQaModule.resilience.subheader')}
          </p>

          {r._distinction && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14,
              backgroundColor: '#faf5ff', border: '1px solid #e9d5ff',
              fontSize: 12, color: '#6b21a8', lineHeight: 1.5,
            }}>
              <strong>ℹ️ {t('redCrossWebQaModule.resilience.distinction')}:</strong> {r._distinction}
            </div>
          )}

          <button onClick={handleResilience} disabled={resilienceRunning} style={resilienceBtn(resilienceRunning)}>
            {resilienceRunning ? t('redCrossWebQaModule.common.running')
                               : t('redCrossWebQaModule.resilience.btnRun')}
          </button>

          {resilience?.status === 'ok' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 }}>
              <ResMetric
                label={t('redCrossWebQaModule.resilience.breakpointVu')}
                value={r.breakpoint_vu != null ? `${r.breakpoint_vu} VU` : '—'}
                hint={t('redCrossWebQaModule.resilience.breakpointVuHint')}
              />
              <ResMetric
                label={t('redCrossWebQaModule.resilience.recovery')}
                value={r.recovery_seconds != null ? `${r.recovery_seconds}s` : '—'}
                hint={t('redCrossWebQaModule.resilience.recoveryHint')}
              />
              <ResMetric
                label={t('redCrossWebQaModule.resilience.errorRatePeak')}
                value={r.error_rate_peak_pct != null ? `${r.error_rate_peak_pct}%` : '—'}
                hint={t('redCrossWebQaModule.resilience.errorRatePeakHint')}
              />
              <ResMetric
                label={t('redCrossWebQaModule.resilience.memoryDrift')}
                value={r.memory_drift_pct != null ? `${r.memory_drift_pct}%` : '—'}
                hint={t('redCrossWebQaModule.resilience.memoryDriftHint')}
              />
            </div>
          )}

          {Array.isArray(r.findings) && r.findings.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                🔎 {t('redCrossWebQaModule.resilience.findings')}
              </h4>
              <div style={{ display: 'grid', gap: 6 }}>
                {r.findings.map((f, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 8,
                    backgroundColor: '#faf5ff', border: '1px solid #e9d5ff',
                    fontSize: 12, color: '#581c87',
                  }}>
                    <strong>{f.title || f.category || '—'}</strong>{f.message ? ` — ${f.message}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resilience?.status === 'error' && <div style={errorBox}>{resilience.message}</div>}
        </div>
      </div>
    </div>
  );
};

const ResMetric = ({ label, value, hint }) => (
  <div style={{
    padding: 14, borderRadius: 10,
    backgroundColor: '#faf5ff', border: '1px solid #e9d5ff',
  }}>
    <div style={{ fontSize: 11, color: '#7c3aed', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{value}</div>
    {hint && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
  </div>
);

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
// Phase D: primaryBtn now accepts a tool-specific color so the generate
// button stays orange for k6 and turns blue when Loadster is selected.
const primaryBtn = (disabled, color = '#ea580c') => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#cbd5e1' : color, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const enginesPill = {
  marginLeft: 10, padding: '2px 10px', borderRadius: 999,
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd',
};
const secondaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#94a3b8' : '#1e293b', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const resilienceBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#c4b5fd' : '#7c3aed', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default StressTest;
