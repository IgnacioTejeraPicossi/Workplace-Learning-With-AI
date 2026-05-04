import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/atm-copilot';

const ARTIFACT_TYPES = ['log', 'json', 'xml', 'screenshot', 'console_output'];

const RunAnalyzer = () => {
  const { t, i18n } = useTranslation();
  const [runId, setRunId] = useState('');
  const [artifacts, setArtifacts] = useState([{ type: 'log', content: '' }]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => { loadAnalyses(); }, []);

  const loadAnalyses = () => {
    fetch(`${API}/runs?limit=20`).then(r => r.json()).then(setAnalyses).catch(() => {});
  };

  const addArtifact = () => {
    setArtifacts([...artifacts, { type: 'log', content: '' }]);
  };

  const removeArtifact = (idx) => {
    setArtifacts(artifacts.filter((_, i) => i !== idx));
  };

  const updateArtifact = (idx, field, value) => {
    const updated = [...artifacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setArtifacts(updated);
  };

  const handleAnalyze = async () => {
    if (!runId.trim() || artifacts.every(a => !a.content.trim())) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/runs/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId.trim(),
          artifacts: artifacts.filter(a => a.content.trim()),
          lang: i18n.language,
        }),
      });
      const data = await res.json();
      setResult(data);
      loadAnalyses();
    } catch {
      setResult({ status: 'error', message: t('atmCopilotModule.reqLab.networkError') });
    } finally {
      setAnalyzing(false);
    }
  };

  const severityColor = {
    critical: '#dc2626', high: '#ef4444', medium: '#f59e0b', low: '#10b981'
  };

  const confidenceIcon = { high: '🔴', medium: '🟡', low: '🟢' };

  const cardStyle = {
    backgroundColor: 'white', borderRadius: '12px', padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '400px 1fr' }}>
        {/* Left: Upload */}
        <div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              🔍 {t('atmCopilotModule.runAnalyzer.uploadTitle')}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.runAnalyzer.runIdLabel')}
              </label>
              <input style={inputStyle} value={runId} onChange={e => setRunId(e.target.value)}
                placeholder={t('atmCopilotModule.runAnalyzer.runIdPlaceholder')} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                  {t('atmCopilotModule.runAnalyzer.artifactsLabel')} ({artifacts.length})
                </label>
                <button onClick={addArtifact} style={{
                  padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db',
                  backgroundColor: 'white', cursor: 'pointer', fontSize: '12px'
                }}>+ {t('atmCopilotModule.runAnalyzer.addArtifact')}</button>
              </div>

              {artifacts.map((art, idx) => (
                <div key={idx} style={{
                  padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  marginBottom: '8px', backgroundColor: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <select style={{ ...inputStyle, width: 'auto' }}
                      value={art.type} onChange={e => updateArtifact(idx, 'type', e.target.value)}>
                      {ARTIFACT_TYPES.map(at => (
                        <option key={at} value={at}>{t(`atmCopilotModule.artifactTypes.${at}`)}</option>
                      ))}
                    </select>
                    {artifacts.length > 1 && (
                      <button onClick={() => removeArtifact(idx)} style={{
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid #fecaca',
                        backgroundColor: '#fff1f2', color: '#dc2626', cursor: 'pointer', fontSize: '12px'
                      }}>✕</button>
                    )}
                  </div>
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', fontFamily: 'monospace', fontSize: '12px' }}
                    value={art.content} onChange={e => updateArtifact(idx, 'content', e.target.value)}
                    placeholder={t('atmCopilotModule.runAnalyzer.artifactPlaceholder')} />
                </div>
              ))}
            </div>

            <button onClick={handleAnalyze}
              disabled={analyzing || !runId.trim() || artifacts.every(a => !a.content.trim())}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: '#dc2626', color: 'white', fontWeight: 600,
                cursor: analyzing ? 'wait' : 'pointer', fontSize: '14px',
                opacity: analyzing ? 0.6 : 1
              }}>
              {analyzing ? t('atmCopilotModule.runAnalyzer.analyzing') : t('atmCopilotModule.runAnalyzer.analyzeBtn')}
            </button>
          </div>

          {/* Recent Analyses */}
          {analyses.length > 0 && (
            <div style={{ ...cardStyle, marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>
                📋 {t('atmCopilotModule.runAnalyzer.recentAnalyses')} ({analyses.length})
              </h3>
              {analyses.map(a => (
                <div key={a._id} style={{
                  padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  marginBottom: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px' }}>Run: {a.runId}</strong>
                    {a.severityProposal && (
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                        backgroundColor: `${severityColor[a.severityProposal]}15`,
                        color: severityColor[a.severityProposal], fontWeight: 600
                      }}>{a.severityProposal}</span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                    {a.artifactCount} artifacts | {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Analysis Results */}
        <div>
          {analyzing && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
              <p style={{ color: '#64748b' }}>{t('atmCopilotModule.runAnalyzer.analyzing')}</p>
            </div>
          )}

          {result && result.status === 'ok' && result.analysis && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  🔍 {t('atmCopilotModule.runAnalyzer.analysisResult')}
                </h3>
                {result.analysis.severityProposal && (
                  <span style={{
                    fontSize: '13px', padding: '6px 14px', borderRadius: '8px',
                    backgroundColor: `${severityColor[result.analysis.severityProposal]}15`,
                    color: severityColor[result.analysis.severityProposal],
                    fontWeight: 700, textTransform: 'uppercase'
                  }}>{result.analysis.severityProposal}</span>
                )}
              </div>

              {/* Run Summary */}
              <div style={{
                padding: '14px', borderRadius: '8px', backgroundColor: '#f1f5f9',
                marginBottom: '16px', fontSize: '14px', lineHeight: 1.6
              }}>
                {result.analysis.runSummary}
              </div>

              {/* Failure Signals */}
              {result.analysis.primaryFailureSignals?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>
                    🚨 {t('atmCopilotModule.runAnalyzer.failureSignals')}
                  </h5>
                  {result.analysis.primaryFailureSignals.map((fs, i) => (
                    <div key={i} style={{
                      padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca', marginBottom: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '13px' }}>{fs.signal}</strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>x{fs.count}</span>
                      </div>
                      {fs.affectedComponents?.length > 0 && (
                        <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {fs.affectedComponents.map((c, j) => (
                            <span key={j} style={{
                              fontSize: '11px', padding: '1px 6px', borderRadius: '4px',
                              backgroundColor: '#fee2e2', color: '#991b1b'
                            }}>{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Root Causes */}
              {result.analysis.probableRootCauses?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#7c3aed' }}>
                    🎯 {t('atmCopilotModule.runAnalyzer.rootCauses')}
                  </h5>
                  {result.analysis.probableRootCauses.map((rc, i) => (
                    <div key={i} style={{
                      padding: '10px', borderRadius: '8px', backgroundColor: '#faf5ff',
                      border: '1px solid #e9d5ff', marginBottom: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{confidenceIcon[rc.confidence] || '⚪'}</span>
                        <strong style={{ fontSize: '13px' }}>{rc.cause}</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>({rc.confidence})</span>
                      </div>
                      {rc.affectedTests?.length > 0 && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {t('atmCopilotModule.runAnalyzer.affectedTests')}: {rc.affectedTests.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Repeated Patterns */}
              {result.analysis.repeatedPatterns?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>
                    🔁 {t('atmCopilotModule.runAnalyzer.repeatedPatterns')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.analysis.repeatedPatterns.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* Affected Areas */}
              {result.analysis.affectedAreas?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>
                    📍 {t('atmCopilotModule.runAnalyzer.affectedAreas')}
                  </h5>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {result.analysis.affectedAreas.map((a, i) => (
                      <span key={i} style={{
                        fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                        backgroundColor: '#dbeafe', color: '#1e40af'
                      }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {result.analysis.suggestedNextSteps?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                    ➡️ {t('atmCopilotModule.runAnalyzer.nextSteps')}
                  </h5>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.analysis.suggestedNextSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}

              {/* Regression Scope */}
              {result.analysis.suggestedRegressionScope?.length > 0 && (
                <div>
                  <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>
                    🔄 {t('atmCopilotModule.runAnalyzer.regressionScope')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {result.analysis.suggestedRegressionScope.map((r, i) => <li key={i}>{r}</li>)}
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

export default RunAnalyzer;
