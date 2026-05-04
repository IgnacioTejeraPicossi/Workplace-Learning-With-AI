import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/atm-copilot';

const SCENARIO_TYPES = [
  'conflict_detection', 'sector_handover', 'trajectory_update',
  'degraded_surveillance', 'conformance_monitoring', 'alert_timing', 'contingency_fallback'
];

const RISK_LEVELS = ['low', 'medium', 'high'];

const ScenarioBuilder = ({ initialScenarioType, onScenarioTypeConsumed }) => {
  const { t, i18n } = useTranslation();
  const [scenarioType, setScenarioType] = useState(initialScenarioType || 'conflict_detection');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [includeEdge, setIncludeEdge] = useState(true);
  const [includeFallbacks, setIncludeFallbacks] = useState(true);
  const [customParams, setCustomParams] = useState('');
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState(null);
  const [matrices, setMatrices] = useState([]);

  useEffect(() => { loadMatrices(); }, []);

  // When navigated from Overview with a pre-selected scenario type
  useEffect(() => {
    if (initialScenarioType && SCENARIO_TYPES.includes(initialScenarioType)) {
      setScenarioType(initialScenarioType);
      if (onScenarioTypeConsumed) onScenarioTypeConsumed();
    }
  }, [initialScenarioType]);

  const loadMatrices = () => {
    fetch(`${API}/scenarios?limit=20`).then(r => r.json()).then(setMatrices).catch(() => {});
  };

  const handleBuild = async () => {
    setBuilding(true);
    setResult(null);
    let params = {};
    if (customParams.trim()) {
      try { params = JSON.parse(customParams); } catch { params = {}; }
    }
    try {
      const res = await fetch(`${API}/scenarios/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: scenarioType,
          risk_level: riskLevel,
          include_edge_cases: includeEdge,
          include_fallbacks: includeFallbacks,
          parameters: params,
          lang: i18n.language,
        }),
      });
      const data = await res.json();
      setResult(data);
      loadMatrices();
    } catch {
      setResult({ status: 'error', message: 'Network error' });
    } finally {
      setBuilding(false);
    }
  };

  const handleExportMd = (id) => {
    window.open(`${API}/scenarios/${id}/export/markdown`, '_blank');
  };

  const riskColor = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

  const cardStyle = {
    backgroundColor: 'white', borderRadius: '12px', padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
  };

  const renderScenarioList = (scenarios, label, icon, color) => {
    if (!scenarios || scenarios.length === 0) return null;
    return (
      <div style={{ marginTop: '16px' }}>
        <h5 style={{ margin: '0 0 8px', color, fontWeight: 600 }}>{icon} {label} ({scenarios.length})</h5>
        {scenarios.map((s, i) => (
          <div key={i} style={{
            padding: '12px', borderRadius: '8px', backgroundColor: `${color}08`,
            border: `1px solid ${color}20`, marginBottom: '8px'
          }}>
            <strong>{s.name}</strong>
            {s.variables && Object.keys(s.variables).length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {Object.entries(s.variables).map(([k, v], j) => (
                  <span key={j} style={{
                    fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: '#f1f5f9', color: '#475569'
                  }}>{k}: {String(v)}</span>
                ))}
              </div>
            )}
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569' }}>
              <strong>{t('atmCopilotModule.scenario.expectedOutcome')}:</strong> {s.expectedOutcome}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '380px 1fr' }}>
        {/* Left: Configuration */}
        <div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              🗺️ {t('atmCopilotModule.scenario.configTitle')}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.scenario.typeLabel')}
              </label>
              <select style={inputStyle} value={scenarioType} onChange={e => setScenarioType(e.target.value)}>
                {SCENARIO_TYPES.map(st => (
                  <option key={st} value={st}>{t(`atmCopilotModule.scenarioTypes.${st}`)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.scenario.riskLabel')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {RISK_LEVELS.map(rl => (
                  <button key={rl} onClick={() => setRiskLevel(rl)} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: '2px solid',
                    borderColor: riskLevel === rl ? riskColor[rl] : '#e2e8f0',
                    backgroundColor: riskLevel === rl ? `${riskColor[rl]}15` : 'white',
                    color: riskColor[rl], fontWeight: 600, cursor: 'pointer', fontSize: '13px',
                    textTransform: 'capitalize'
                  }}>{t(`atmCopilotModule.riskLevels.${rl}`)}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeEdge} onChange={e => setIncludeEdge(e.target.checked)} />
                {t('atmCopilotModule.scenario.includeEdge')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeFallbacks} onChange={e => setIncludeFallbacks(e.target.checked)} />
                {t('atmCopilotModule.scenario.includeFallbacks')}
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.scenario.customParams')}
              </label>
              <textarea style={{ ...inputStyle, minHeight: '80px', fontFamily: 'monospace', fontSize: '12px' }}
                value={customParams} onChange={e => setCustomParams(e.target.value)}
                placeholder='{"flightCount": 5, "altitudeBand": "FL350-FL390"}' />
            </div>

            <button onClick={handleBuild} disabled={building}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: '#7c3aed', color: 'white', fontWeight: 600,
                cursor: building ? 'wait' : 'pointer', fontSize: '14px',
                opacity: building ? 0.6 : 1
              }}>
              {building ? t('atmCopilotModule.scenario.building') : t('atmCopilotModule.scenario.buildBtn')}
            </button>
          </div>

          {/* Recent Matrices */}
          {matrices.length > 0 && (
            <div style={{ ...cardStyle, marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>
                📋 {t('atmCopilotModule.scenario.recentMatrices')} ({matrices.length})
              </h3>
              {matrices.map(m => (
                <div key={m._id} style={{
                  padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px' }}>{m.title || m.scenarioType}</strong>
                    <span style={{
                      marginLeft: '8px', fontSize: '11px', padding: '2px 6px',
                      borderRadius: '4px', backgroundColor: `${riskColor[m.riskLevel] || '#94a3b8'}15`,
                      color: riskColor[m.riskLevel] || '#94a3b8'
                    }}>{m.riskLevel}</span>
                  </div>
                  <button onClick={() => handleExportMd(m._id)}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db',
                      backgroundColor: 'white', cursor: 'pointer', fontSize: '11px' }}>
                    📄 MD
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          {building && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗺️</div>
              <p style={{ color: '#64748b' }}>{t('atmCopilotModule.scenario.building')}</p>
            </div>
          )}

          {result && result.status === 'ok' && result.matrix && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  🗺️ {result.matrix.title || t('atmCopilotModule.scenario.matrixResult')}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                    backgroundColor: `${riskColor[result.matrix.riskLevel]}15`,
                    color: riskColor[result.matrix.riskLevel], fontWeight: 600
                  }}>{t(`atmCopilotModule.riskLevels.${result.matrix.riskLevel}`)}</span>
                  <button onClick={() => handleExportMd(result.matrix._id)}
                    style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
                      backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>
                    📄 {t('atmCopilotModule.export.markdown')}
                  </button>
                </div>
              </div>

              {result.matrix.preconditions?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>
                    {t('atmCopilotModule.scenario.preconditions')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.matrix.preconditions.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {renderScenarioList(result.matrix.nominalScenarios, t('atmCopilotModule.scenario.nominal'), '✅', '#10b981')}
              {renderScenarioList(result.matrix.degradedScenarios, t('atmCopilotModule.scenario.degraded'), '⚠️', '#f59e0b')}
              {renderScenarioList(result.matrix.edgeCases, t('atmCopilotModule.scenario.edgeCases'), '🔶', '#ef4444')}

              {result.matrix.riskNotes?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>
                    🛡️ {t('atmCopilotModule.scenario.riskNotes')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.matrix.riskNotes.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              {result.matrix.automationNotes?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>
                    🤖 {t('atmCopilotModule.scenario.automationNotes')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.matrix.automationNotes.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result && result.status === 'fallback' && (
            <div style={{ ...cardStyle, backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
              <p>⚠️ {result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioBuilder;
