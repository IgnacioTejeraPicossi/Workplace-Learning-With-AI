import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './RobomindClinic.css';

const EnhancedRobomindClinic = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [screeningResult, setScreeningResult] = useState(null);
  const [therapyPlan, setTherapyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationInput, setConversationInput] = useState('');
  const [metrics, setMetrics] = useState(null);

  // Load dashboard metrics on component mount
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/robomind/dashboard/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
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

      const response = await fetch('/api/robomind/screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch('/api/robomind/therapy', {
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
      setTherapyPlan(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTherapy = async (inputPrompt) => {
    if (!therapyPlan) {
      setError('Please generate therapy plan first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/robomind/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_prompt: inputPrompt,
          plan: therapyPlan,
          meta: { model: 'gpt-4', temperature: 0.7 }
        }),
      });

      if (!response.ok) {
        throw new Error(`Therapy application failed: ${response.statusText}`);
      }

      const result = await response.json();
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
                  {screeningResult.top_flags.slice(0, 3).map((flag, index) => (
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
            {metrics ? (
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>Total Screenings</h3>
                  <div className="metric-value">{metrics.total_screenings}</div>
                </div>
                <div className="metric-card">
                  <h3>Top Pathologies</h3>
                  <ul>
                    {metrics.top_pathologies.map((pathology, index) => (
                      <li key={index}>{pathology}</li>
                    ))}
                  </ul>
                </div>
                <div className="metric-card">
                  <h3>Axis Distribution</h3>
                  <div className="axis-distribution">
                    {Object.entries(metrics.axis_distribution).map(([axis, count]) => (
                      <div key={axis} className="axis-item">
                        <span>{axis}: {count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading metrics...</p>
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
