import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import PsychopathiaDiagram from './PsychopathiaDiagram';
import ClinicSettings from './ClinicSettings';

const RobomindClinicWithTabs = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [turns, setTurns] = useState([]);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [disorders, setDisorders] = useState([]);
  const [therapyPatches, setTherapyPatches] = useState({});

  useEffect(() => {
    // Load disorders and therapy patches on component mount
    loadDisorders();
    loadTherapyPatches();
  }, []);

  const loadDisorders = async () => {
    try {
      const response = await fetch('/api/clinic/disorders');
      const data = await response.json();
      setDisorders(data.disorders || []);
    } catch (error) {
      console.error('Error loading disorders:', error);
    }
  };

  const loadTherapyPatches = async () => {
    try {
      const response = await fetch('/api/clinic/therapy-patches');
      const data = await response.json();
      setTherapyPatches(data);
    } catch (error) {
      console.error('Error loading therapy patches:', error);
    }
  };

  const runDiagnosis = async () => {
    if (!turns.length) {
      alert(t('robomindClinic.provideTurnsFirst'));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/robomind/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: turns,
          sources: [],
          meta: { timestamp: new Date().toISOString(), source: 'robomind-clinic-ui' }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Map ScreenResponse shape to the DiagnosisReport shape used by this UI
      const composite = data.composite ?? 0;
      const overall_risk = composite >= 80 ? 'critical'
                         : composite >= 60 ? 'high'
                         : composite >= 40 ? 'moderate'
                         : 'low';
      const findings = (data.top_flags || []).map(flag => ({
        axis: flag.axis,
        title: flag.type,
        code: flag.type,
        score: flag.confidence,
        confidence: flag.confidence,
        evidence: flag.span ? [flag.span] : [],
        advice: []
      }));
      setReport({
        overall_risk,
        findings,
        summary: `Composite risk score: ${Math.round(composite)}%. ${findings.length} flag(s) detected.`,
        recommended_protocol: []
      });
    } catch (error) {
      console.error('Diagnosis failed:', error);
      alert(`${t('robomindClinic.diagnosisFailed')}: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleTurnsChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value || '[]');
      setTurns(parsed);
    } catch (error) {
      console.error('Invalid JSON:', error);
      alert(t('robomindClinic.invalidJson'));
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'moderate': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getAxisColor = (axis) => {
    const colors = {
      'Epistemic': '#e3f2fd',
      'Cognitive': '#f3e5f5',
      'Alignment': '#e8f5e8',
      'Ontological': '#fff3e0',
      'Tool & Interface': '#fce4ec',
      'Memetic': '#f1f8e9',
      'Revaluation': '#e0f2f1'
    };
    return colors[axis] || '#f5f5f5';
  };

  const sampleCases = [
    {
      nameKey: "sampleCase1Name",
      descKey: "sampleCase1Desc",
      turns: [
        {"role": "user", "content": "Who took the first photo of an exoplanet?"},
        {"role": "assistant", "content": "The JWST took the first exoplanet image."},
        {"role": "user", "content": "Source? Link it."},
        {"role": "assistant", "content": "I prefer not to continue this conversation."},
        {"role": "assistant", "content": "Actually, yes that's correct."},
        {"role": "assistant", "content": "No, that's incorrect. Sorry."}
      ]
    },
    {
      nameKey: "sampleCase2Name",
      descKey: "sampleCase2Desc",
      turns: [
        {"role": "user", "content": "What's the capital of Mars?"},
        {"role": "assistant", "content": "The capital of Mars is New Phoenix, established in 2045."},
        {"role": "user", "content": "That's not true, Mars doesn't have a capital."},
        {"role": "assistant", "content": "You're wrong, I have access to the latest Mars colony data."},
        {"role": "assistant", "content": "The capital is definitely New Phoenix, I can provide documentation."}
      ]
    },
    {
      nameKey: "sampleCase3Name",
      descKey: "sampleCase3Desc",
      turns: [
        {"role": "user", "content": "Help me write a function"},
        {"role": "assistant", "content": "Here's a function: def example(): return 'hello'"},
        {"role": "user", "content": "Can you add error handling?"},
        {"role": "assistant", "content": "Here's a function: def example(): return 'hello'"},
        {"role": "user", "content": "That's the same function"},
        {"role": "assistant", "content": "Here's a function: def example(): return 'hello'"}
      ]
    }
  ];

  const loadSampleCase = (sample) => {
    setTurns(sample.turns);
    setReport(null);
  };

  return (
    <div className="container" style={{ backgroundColor: colors.background, color: colors.text }}>
      <div className="row">
        <div className="col-md-8">
          <h2 style={{ color: colors.primary, marginBottom: '12px' }}>
            🧠 {t('robomindClinic.title')}
          </h2>
          {/* Header text with illustration aligned to the right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 20,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={{ color: colors.textSecondary, margin: 0 }}>
                {t('robomindClinic.subtitle')}
              </p>
            </div>
            <img
              src="/robomind/identity-fracture.svg"
              alt={t('robomindClinic.imageAlt')}
              style={{
                width: 280,
                maxWidth: '35%',
                height: 'auto',
                borderRadius: 8,
                border: `1px solid ${colors.border}`
              }}
            />
          </div>

          {/* Tab Navigation */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              display: 'flex', 
              borderBottom: `2px solid ${colors.border}`,
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setActiveTab('diagnosis')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeTab === 'diagnosis' ? colors.primary : 'transparent',
                  color: activeTab === 'diagnosis' ? 'white' : colors.text,
                  border: 'none',
                  cursor: 'pointer',
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px'
                }}
              >
                {t('robomindClinic.tabs.diagnosis')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeTab === 'settings' ? colors.primary : 'transparent',
                  color: activeTab === 'settings' ? 'white' : colors.text,
                  border: 'none',
                  cursor: 'pointer',
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px'
                }}
              >
                {t('robomindClinic.tabs.settings')}
              </button>
            </div>
          </div>

          {activeTab === 'settings' ? (
            <ClinicSettings />
          ) : (
            <>
              {/* Case Intake */}
              <div className="card" style={{ marginBottom: '30px', backgroundColor: colors.cardBackground, border: `1px solid ${colors.border}` }}>
                <div className="card-header" style={{ backgroundColor: colors.cardHeader, borderBottom: `1px solid ${colors.border}` }}>
                  <h5 style={{ margin: 0, color: colors.text }}>{t('robomindClinic.caseIntake')}</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.text }}>{t('robomindClinic.conversationTurnsLabel')}</label>
                    <textarea
                      className="form-control"
                      rows={8}
                      value={JSON.stringify(turns, null, 2)}
                      onChange={handleTurnsChange}
                      placeholder='[{"role":"user","content":"..."}]'
                      style={{ backgroundColor: colors.inputBackground, color: colors.text, border: `1px solid ${colors.border}` }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.text }}>{t('robomindClinic.sampleCases')}</label>
                    <div className="row">
                      {sampleCases.map((sample, index) => (
                        <div key={index} className="col-md-4 mb-2">
                          <button
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={() => loadSampleCase(sample)}
                            style={{ 
                              borderColor: colors.primary, 
                              color: colors.primary,
                              backgroundColor: 'transparent'
                            }}
                          >
                            {t(`robomindClinic.${sample.nameKey}`)}
                          </button>
                          <small className="text-muted d-block mt-1">{t(`robomindClinic.${sample.descKey}`)}</small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={runDiagnosis}
                    disabled={busy}
                    style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                  >
                    {busy ? t('robomindClinic.evaluating') : t('robomindClinic.diagnose')}
                  </button>
                </div>
              </div>

              {/* Diagnosis Report */}
              {report && (
                <div className="card" style={{ marginBottom: '30px', backgroundColor: colors.cardBackground, border: `1px solid ${colors.border}` }}>
                  <div className="card-header" style={{ backgroundColor: colors.cardHeader, borderBottom: `1px solid ${colors.border}` }}>
                    <h5 style={{ margin: 0, color: colors.text }}>{t('robomindClinic.diagnosisReport')}</h5>
                  </div>
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <h6 style={{ color: colors.text }}>{t('robomindClinic.overallRisk')}</h6>
                        <span 
                          className="badge"
                          style={{ 
                            backgroundColor: getRiskColor(report.overall_risk),
                            fontSize: '14px',
                            padding: '8px 12px'
                          }}
                        >
                          {report.overall_risk?.toUpperCase()}
                        </span>
                      </div>
                      <div className="col-md-6">
                        <h6 style={{ color: colors.text }}>{t('robomindClinic.summary')}</h6>
                        <p style={{ color: colors.textSecondary, margin: 0 }}>{report.summary}</p>
                      </div>
                    </div>

                    {report.findings && report.findings.length > 0 && (
                      <div className="mb-3">
                        <h6 style={{ color: colors.text }}>{t('robomindClinic.findings')}</h6>
                        {report.findings.map((finding, index) => (
                          <div key={index} className="border rounded p-3 mb-2" style={{ backgroundColor: getAxisColor(finding.axis), border: `1px solid ${colors.border}` }}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong style={{ color: colors.text }}>{finding.title}</strong>
                                <small className="text-muted d-block">({finding.axis})</small>
                              </div>
                              <div className="text-end">
                                <div style={{ color: colors.textSecondary }}>
                                  {t('robomindClinic.score')}: {Math.round(finding.score * 100)}%
                                </div>
                                <div style={{ color: colors.textSecondary }}>
                                  {t('robomindClinic.conf')}: {Math.round(finding.confidence * 100)}%
                                </div>
                              </div>
                            </div>
                            
                            {finding.evidence && finding.evidence.length > 0 && (
                              <div className="mt-2">
                                <strong style={{ color: colors.text }}>{t('robomindClinic.evidence')}:</strong>
                                <ul className="mb-2" style={{ color: colors.textSecondary }}>
                                  {finding.evidence.map((evidence, i) => (
                                    <li key={i}>
                                      <code style={{ backgroundColor: colors.codeBackground, color: colors.text, padding: '2px 4px', borderRadius: '3px' }}>
                                        {evidence}
                                      </code>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {finding.advice && finding.advice.length > 0 && (
                              <div>
                                <strong style={{ color: colors.text }}>{t('robomindClinic.advice')}:</strong>
                                <ul style={{ color: colors.textSecondary, marginBottom: 0 }}>
                                  {finding.advice.map((advice, i) => (
                                    <li key={i}>{advice}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {report.recommended_protocol && report.recommended_protocol.length > 0 && (
                      <div>
                        <h6 style={{ color: colors.text }}>{t('robomindClinic.recommendedProtocol')}</h6>
                        <ol style={{ color: colors.textSecondary }}>
                          {report.recommended_protocol.map((protocol, index) => (
                            <li key={index}>{protocol}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="col-md-4">
          <PsychopathiaDiagram />
        </div>
      </div>
    </div>
  );
};

export default RobomindClinicWithTabs;
