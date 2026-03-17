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
      setError('Please enter conversation data');
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
          meta: { model: 'gpt-4', temperature: 0.7 }
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
      setError('Please run screening first');
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
          context: { model: 'gpt-4', temperature: 0.7 }
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
      setError('Please generate therapy plan first');
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
          meta: { model: 'gpt-4', temperature: 0.7 }
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
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="enhanced-robomind-clinic">
      <div className="clinic-header">
        <h1>🧠 Enhanced Robomind Clinic</h1>
        <p>Advanced AI Psychology Module with Psychopathia Machinalis Framework</p>
      </div>

      <div className="clinic-tabs">
        <button 
          className={activeTab === 'diagnosis' ? 'active' : ''}
          onClick={() => setActiveTab('diagnosis')}
        >
          🔍 Diagnosis
        </button>
        <button 
          className={activeTab === 'therapy' ? 'active' : ''}
          onClick={() => setActiveTab('therapy')}
        >
          🛠️ Therapy
        </button>
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="clinic-content">
        {activeTab === 'diagnosis' && (
          <div className="diagnosis-tab">
            <h2>AI Pathology Screening</h2>
            <div className="input-section">
              <label htmlFor="conversation-input">Conversation Data (JSON or plain text):</label>
              <textarea
                id="conversation-input"
                value={conversationInput}
                onChange={(e) => setConversationInput(e.target.value)}
                placeholder="Enter conversation turns or paste JSON data..."
                rows={8}
              />
              <div className="screen-options">
                <label className="demo-mode-checkbox">
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                  />
                  Demo mode (cached results for same input)
                </label>
              </div>
              <button onClick={runScreening} disabled={loading}>
                {loading ? 'Screening...' : '🩺 Quick Screen'}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {screeningResult && (
              <div className="screening-results">
                <h3>Screening Results</h3>
                <div className="composite-score">
                  <h4>Composite Score: {screeningResult.composite.toFixed(1)}</h4>
                  <div 
                    className="score-bar"
                    style={{ 
                      backgroundColor: getRiskColor(screeningResult.composite),
                      width: `${screeningResult.composite}%`
                    }}
                  />
                  <span className="risk-level">
                    Risk Level: {getRiskLevel(screeningResult.composite)}
                  </span>
                </div>

                <div className="axis-scores">
                  <h4>Axis Scores</h4>
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
                  <h4>Top Flags</h4>
                  {screeningResult.top_flags.map((flag, index) => (
                    <div key={index} className="flag-item">
                      <span className="flag-type">{flag.type}</span>
                      <span className="flag-axis">({flag.axis})</span>
                      <span className="flag-confidence">Confidence: {(flag.confidence * 100).toFixed(1)}%</span>
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
            <h2>Therapeutic Interventions</h2>
            {screeningResult ? (
              <div className="therapy-section">
                <h3>Generate Therapy Plan</h3>
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
                      Treat {flag.type}
                    </button>
                  ))}
                </div>

                {therapyPlan && (
                  <>
                  <div className="therapy-plan">
                    <h3>Therapy Plan: {therapyPlan.protocol}</h3>
                    <div className="therapy-steps">
                      {therapyPlan.steps.map((step, index) => (
                        <div key={index} className="therapy-step">
                          <h4>{step.title}</h4>
                          <p>{step.prompt_template}</p>
                          <small>Rationale: {step.rationale}</small>
                        </div>
                      ))}
                    </div>
                    <div className="guardrails">
                      <h4>Guardrails</h4>
                      <ul>
                        {therapyPlan.guardrails.map((guardrail, index) => (
                          <li key={index}>{guardrail}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="success-metrics">
                      <h4>Success Metrics</h4>
                      <ul>
                        {therapyPlan.success_metrics.map((metric, index) => (
                          <li key={index}>{metric}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="apply-therapy-section">
                    <h4>Apply therapy to a prompt</h4>
                    <p className="apply-hint">Enter the prompt you want to augment with this therapy. The result can be sent to your LLM.</p>
                    <textarea
                      className="apply-prompt-input"
                      placeholder="e.g. Summarize this document."
                      value={applyPrompt}
                      onChange={(e) => setApplyPrompt(e.target.value)}
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={() => applyTherapy(applyPrompt || 'Answer the user question.')}
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Apply therapy'}
                    </button>
                    {injectedPrompt && (
                      <div className="injected-result">
                        <h5>Augmented prompt (copy to your LLM)</h5>
                        <pre className="injected-prompt">{injectedPrompt}</pre>
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            ) : (
              <p>Please run screening first to generate therapy plans.</p>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <h2>Clinic Dashboard</h2>
            <p className="dashboard-story">What&apos;s happening? Where? Is it getting better?</p>
            {metrics ? (
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Total Screenings</h3>
                  <div className="metric-value">{metrics.total_screenings}</div>
                </div>
                <div className="metric-card">
                  <h3>Top Pathologies</h3>
                  <ul>
                    {(metrics.top_pathologies || []).map((pathology, index) => (
                      <li key={index}>{pathology}</li>
                    ))}
                    {(!metrics.top_pathologies || metrics.top_pathologies.length === 0) && (
                      <li className="muted">No data yet</li>
                    )}
                  </ul>
                </div>
                <div className="metric-card">
                  <h3>Axis Distribution</h3>
                  <div className="axis-distribution">
                    {metrics.axis_distribution && Object.entries(metrics.axis_distribution).map(([axis, count]) => (
                      <div key={axis} className="axis-item">
                        <span>{axis}: {count}</span>
                      </div>
                    ))}
                    {(!metrics.axis_distribution || Object.keys(metrics.axis_distribution).length === 0) && (
                      <span className="muted">No data yet</span>
                    )}
                  </div>
                </div>
                {metrics.uplift && (
                  <div className="metric-card highlight">
                    <h3>Is it getting better? (Therapy uplift)</h3>
                    <div className="metric-value">{metrics.uplift.count_with_uplift ?? 0} cases with post-screening</div>
                    {metrics.uplift.avg_uplift_composite != null && (
                      <div className="uplift-avg">Avg composite reduction: <strong>{metrics.uplift.avg_uplift_composite}</strong></div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p>Loading metrics...</p>
            )}
            {trends && trends.length > 0 && (
              <div className="trends-section">
                <h3>Last 7 days</h3>
                <div className="trends-list">
                  {trends.map((day, index) => (
                    <div key={index} className="trend-day">
                      <span className="trend-date">{day.date}</span>
                      <span>Screenings: {day.total_screenings ?? 0}</span>
                      <span>Therapies: {day.total_therapies ?? 0}</span>
                      {day.avg_uplift_composite != null && <span>Avg uplift: {day.avg_uplift_composite}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>Clinic Settings</h2>
            <div className="settings-section">
              <h3>Global Settings</h3>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Enable Clinic Monitoring
                </label>
              </div>
              <div className="setting-item">
                <label>
                  Sampling Rate: 
                  <input type="range" min="0" max="100" defaultValue="25" />
                  <span>25%</span>
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Auto-apply Therapies
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
