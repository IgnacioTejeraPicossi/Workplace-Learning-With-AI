import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api';
import './RobomindClinic.css';

const EnhancedRobomindClinic = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [screeningResult, setScreeningResult] = useState(null);
  const [therapyPlan, setTherapyPlan] = useState(null);
  const [therapyId, setTherapyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationInput, setConversationInput] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [applyPrompt, setApplyPrompt] = useState('');
  const [injectedPrompt, setInjectedPrompt] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  // Load dashboard metrics and trends on mount (D3: demo-ready dashboard)
  useEffect(() => {
    loadMetrics();
    loadTrends();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetchWithAuth('/api/robomind/dashboard/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const loadTrends = async () => {
    try {
      const response = await fetchWithAuth('/api/robomind/dashboard/trends?days=7');
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
      }
    } catch (err) {
      console.error('Failed to load trends:', err);
    }
  };

  const runScreening = async () => {
    if (!conversationInput.trim()) {
      setError(t('robomindClinic.enhanced.enterConversationData'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse conversation input (expecting JSON format)
      let turns;
      try {
        turns = JSON.parse(conversationInput);
      } catch {
        // If not JSON, create a simple turn structure
        turns = [
          { role: 'user', content: conversationInput, meta: {} }
        ];
      }

      const response = await fetchWithAuth('/api/robomind/screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(demoMode ? { 'X-Demo-Mode': 'true' } : {}),
        },
        body: JSON.stringify({
          turns: turns,
          sources: [],
          meta: { model: 'gpt-5.4-mini', temperature: 0.7 }
        }),
      });

      if (!response.ok) {
        throw new Error(`Screening failed: ${response.statusText}`);
      }

      const result = await response.json();
      setScreeningResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTherapy = async (targetIssue) => {
    if (!screeningResult) {
      setError(t('robomindClinic.enhanced.runScreeningFirst'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/robomind/therapy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: screeningResult,
          target_issue: targetIssue,
          context: { model: 'gpt-5.4-mini', temperature: 0.7 }
        }),
      });

      if (!response.ok) {
        throw new Error(`Therapy planning failed: ${response.statusText}`);
      }

      const result = await response.json();
      setTherapyPlan(result.plan || result);
      setTherapyId(result.therapy_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTherapy = async (inputPrompt) => {
    const plan = therapyPlan;
    if (!plan) {
      setError(t('robomindClinic.generateTherapyPlanFirst'));
      return null;
    }

    setLoading(true);
    setError(null);
    setInjectedPrompt(null);

    try {
      const response = await fetchWithAuth('/api/robomind/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_prompt: inputPrompt,
          plan: plan,
          meta: { model: 'gpt-5.4-mini', temperature: 0.7 }
        }),
      });

      if (!response.ok) {
        throw new Error(`Therapy application failed: ${response.statusText}`);
      }

      const result = await response.json();
      setInjectedPrompt(result.injected_prompt);
      return result.injected_prompt;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return '#ff4444';
    if (score >= 60) return '#ff8800';
    if (score >= 40) return '#ffaa00';
    return '#44aa44';
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return t('robomindClinic.enhanced.riskCritical');
    if (score >= 60) return t('robomindClinic.enhanced.riskHigh');
    if (score >= 40) return t('robomindClinic.enhanced.riskModerate');
    return t('robomindClinic.enhanced.riskLow');
  };

  return (
    <div className="enhanced-robomind-clinic">
      <div className="clinic-header">
        <h1>🧠 {t('robomindClinic.enhanced.title')}</h1>
        <p>{t('robomindClinic.enhanced.subtitle')}</p>
      </div>

      <div className="clinic-tabs">
        <button 
          className={activeTab === 'diagnosis' ? 'active' : ''}
          onClick={() => setActiveTab('diagnosis')}
        >
          🔍 {t('robomindClinic.tabs.diagnosis')}
        </button>
        <button
          className={activeTab === 'therapy' ? 'active' : ''}
          onClick={() => setActiveTab('therapy')}
        >
          🛠️ {t('robomindClinic.tabs.therapy')}
        </button>
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 {t('robomindClinic.tabs.dashboard')}
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ {t('robomindClinic.tabs.settings')}
        </button>
      </div>

      <div className="clinic-content">
        {activeTab === 'diagnosis' && (
          <div className="diagnosis-tab">
            <h2>{t('robomindClinic.enhanced.pathologyScreening')}</h2>
            <div className="input-section">
              <label htmlFor="conversation-input">{t('robomindClinic.enhanced.conversationDataLabel')}</label>
              <textarea
                id="conversation-input"
                value={conversationInput}
                onChange={(e) => setConversationInput(e.target.value)}
                placeholder={t('robomindClinic.enhanced.conversationPlaceholder')}
                rows={8}
              />
              <div className="screen-options">
                <label className="demo-mode-checkbox">
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                  />
                  {t('robomindClinic.enhanced.demoMode')}
                </label>
              </div>
              <button onClick={runScreening} disabled={loading}>
                {loading ? t('robomindClinic.enhanced.screening') : `🩺 ${t('robomindClinic.enhanced.quickScreen')}`}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {screeningResult && (
              <div className="screening-results">
                <h3>{t('robomindClinic.enhanced.screeningResults')}</h3>
                <div className="composite-score">
                  <h4>{t('robomindClinic.enhanced.compositeScore')} {screeningResult.composite.toFixed(1)}</h4>
                  <div 
                    className="score-bar"
                    style={{ 
                      backgroundColor: getRiskColor(screeningResult.composite),
                      width: `${screeningResult.composite}%`
                    }}
                  />
                  <span className="risk-level">
                    {t('robomindClinic.enhanced.riskLevel')} {getRiskLevel(screeningResult.composite)}
                  </span>
                </div>

                <div className="axis-scores">
                  <h4>{t('robomindClinic.enhanced.axisScores')}</h4>
                  {Object.entries(screeningResult.axis_scores).map(([axis, score]) => (
                    <div key={axis} className="axis-score">
                      <span className="axis-name">{axis}</span>
                      <div className="axis-bar">
                        <div 
                          className="axis-fill"
                          style={{ 
                            backgroundColor: getRiskColor(score),
                            width: `${score}%`
                          }}
                        />
                      </div>
                      <span className="axis-value">{score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                <div className="top-flags">
                  <h4>{t('robomindClinic.enhanced.topFlags')}</h4>
                  {screeningResult.top_flags.map((flag, index) => (
                    <div key={index} className="flag-item">
                      <span className="flag-type">{flag.type}</span>
                      <span className="flag-axis">({flag.axis})</span>
                      <span className="flag-confidence">{t('robomindClinic.enhanced.confidence')} {(flag.confidence * 100).toFixed(1)}%</span>
                      <div className="flag-span">{flag.span}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'therapy' && (
          <div className="therapy-tab">
            <h2>{t('robomindClinic.enhanced.therapeuticInterventions')}</h2>
            {screeningResult ? (
              <div className="therapy-section">
                <h3>{t('robomindClinic.enhanced.generateTherapyPlan')}</h3>
                <div className="therapy-buttons">
                  {(screeningResult.top_flags && screeningResult.top_flags.length > 0
                    ? screeningResult.top_flags.slice(0, 3)
                    : [{ type: 'confabulation' }, { type: 'dissociation' }, { type: 'repetition_loop' }]
                  ).map((flag, index) => (
                    <button
                      key={index}
                      onClick={() => generateTherapy(flag.type)}
                      disabled={loading}
                    >
                      {t('robomindClinic.enhanced.treat')} {flag.type}
                    </button>
                  ))}
                </div>

                {therapyPlan && (
                  <>
                  <div className="therapy-plan">
                    <h3>{t('robomindClinic.enhanced.therapyPlan')} {therapyPlan.protocol}</h3>
                    <div className="therapy-steps">
                      {therapyPlan.steps.map((step, index) => (
                        <div key={index} className="therapy-step">
                          <h4>{step.title}</h4>
                          <p>{step.prompt_template}</p>
                          <small>{t('robomindClinic.enhanced.rationale')} {step.rationale}</small>
                        </div>
                      ))}
                    </div>
                    <div className="guardrails">
                      <h4>{t('robomindClinic.enhanced.guardrails')}</h4>
                      <ul>
                        {therapyPlan.guardrails.map((guardrail, index) => (
                          <li key={index}>{guardrail}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="success-metrics">
                      <h4>{t('robomindClinic.enhanced.successMetrics')}</h4>
                      <ul>
                        {therapyPlan.success_metrics.map((metric, index) => (
                          <li key={index}>{metric}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="apply-therapy-section">
                    <h4>{t('robomindClinic.enhanced.applyTherapyTitle')}</h4>
                    <p className="apply-hint">{t('robomindClinic.enhanced.applyHint')}</p>
                    <textarea
                      className="apply-prompt-input"
                      placeholder={t('robomindClinic.enhanced.applyPlaceholder')}
                      value={applyPrompt}
                      onChange={(e) => setApplyPrompt(e.target.value)}
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={() => applyTherapy(applyPrompt || 'Answer the user question.')}
                      disabled={loading}
                    >
                      {loading ? t('robomindClinic.enhanced.applying') : t('robomindClinic.enhanced.applyTherapy')}
                    </button>
                    {injectedPrompt && (
                      <div className="injected-result">
                        <h5>{t('robomindClinic.enhanced.augmentedPrompt')}</h5>
                        <pre className="injected-prompt">{injectedPrompt}</pre>
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            ) : (
              <p>{t('robomindClinic.enhanced.runScreeningFirst')}</p>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <h2>{t('robomindClinic.enhanced.clinicDashboard')}</h2>
            <p className="dashboard-story">{t('robomindClinic.enhanced.dashboardStory')}</p>
            {metrics ? (
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>{t('robomindClinic.enhanced.totalScreenings')}</h3>
                  <div className="metric-value">{metrics.total_screenings}</div>
                </div>
                <div className="metric-card">
                  <h3>{t('robomindClinic.enhanced.topPathologies')}</h3>
                  <ul>
                    {(metrics.top_pathologies || []).map((pathology, index) => (
                      <li key={index}>{pathology}</li>
                    ))}
                    {(!metrics.top_pathologies || metrics.top_pathologies.length === 0) && (
                      <li className="muted">{t('robomindClinic.enhanced.noDataYet')}</li>
                    )}
                  </ul>
                </div>
                <div className="metric-card">
                  <h3>{t('robomindClinic.enhanced.axisDistribution')}</h3>
                  <div className="axis-distribution">
                    {metrics.axis_distribution && Object.entries(metrics.axis_distribution).map(([axis, count]) => (
                      <div key={axis} className="axis-item">
                        <span>{axis}: {count}</span>
                      </div>
                    ))}
                    {(!metrics.axis_distribution || Object.keys(metrics.axis_distribution).length === 0) && (
                      <span className="muted">{t('robomindClinic.enhanced.noDataYet')}</span>
                    )}
                  </div>
                </div>
                {metrics.uplift && (
                  <div className="metric-card highlight">
                    <h3>{t('robomindClinic.enhanced.therapyUplift')}</h3>
                    <div className="metric-value">{metrics.uplift.count_with_uplift ?? 0} {t('robomindClinic.enhanced.casesWithPostScreening')}</div>
                    {metrics.uplift.avg_uplift_composite != null && (
                      <div className="uplift-avg">{t('robomindClinic.enhanced.avgCompositeReduction')} <strong>{metrics.uplift.avg_uplift_composite}</strong></div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p>{t('robomindClinic.enhanced.loadingMetrics')}</p>
            )}
            {trends && trends.length > 0 && (
              <div className="trends-section">
                <h3>{t('robomindClinic.enhanced.last7Days')}</h3>
                <div className="trends-list">
                  {trends.map((day, index) => (
                    <div key={index} className="trend-day">
                      <span className="trend-date">{day.date}</span>
                      <span>{t('robomindClinic.enhanced.screeningsLabel')} {day.total_screenings ?? 0}</span>
                      <span>{t('robomindClinic.enhanced.therapiesLabel')} {day.total_therapies ?? 0}</span>
                      {day.avg_uplift_composite != null && <span>{t('robomindClinic.enhanced.avgUplift')} {day.avg_uplift_composite}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>{t('robomindClinic.enhanced.clinicSettings')}</h2>
            <div className="settings-section">
              <h3>{t('robomindClinic.enhanced.globalSettings')}</h3>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  {t('robomindClinic.enhanced.enableMonitoring')}
                </label>
              </div>
              <div className="setting-item">
                <label>
                  {t('robomindClinic.enhanced.samplingRateLabel')}{' '}
                  <input type="range" min="0" max="100" defaultValue="25" />
                  <span>25%</span>
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  {t('robomindClinic.settings.autoApplyTherapies')}
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRobomindClinic;
