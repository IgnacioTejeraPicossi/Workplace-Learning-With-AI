import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './AIRiskAnalysis.css';

export default function AIRiskAnalysis() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [portfolioRisk, setPortfolioRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await axios.get('/api/ea/applications');
      setApplications(response.data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(t('enterpriseArchitectureModule.errorLoadApps'));
    }
  };

  const analyzeApplicationRisk = async (applicationId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/ea/ai-risk/analyze-application-risk', {
        application_id: applicationId
      });
      
      if (response.data.success) {
        setRiskAnalysis(response.data);
        setSuccess(t('enterpriseArchitectureModule.successRiskDone'));
      }
    } catch (err) {
      console.error('Error analyzing application risk:', err);
      setError(t('enterpriseArchitectureModule.errorAnalyzeApp'));
    } finally {
      setLoading(false);
    }
  };

  const analyzePortfolioRisk = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/ea/ai-risk/analyze-portfolio-risk');
      
      if (response.data.success) {
        setPortfolioRisk(response.data);
        setSuccess(t('enterpriseArchitectureModule.successPortfolioRiskDone'));
      }
    } catch (err) {
      console.error('Error analyzing portfolio risk:', err);
      setError(t('enterpriseArchitectureModule.errorAnalyzePortfolio'));
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!riskAnalysis) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/ea/ai-risk/generate-risk-recommendations', {
        risk_data: riskAnalysis
      });
      
      if (response.data.success) {
        setRiskAnalysis({
          ...riskAnalysis,
          recommendations: response.data.recommendations
        });
        setSuccess(t('enterpriseArchitectureModule.successRecsGenerated'));
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(t('enterpriseArchitectureModule.errorGenerateRecs'));
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      case 'Critical': return '#7c2d12';
      default: return '#6b7280';
    }
  };

  const renderRiskFactors = (riskFactors) => {
    if (!riskFactors) return null;

    const factors = [
      { key: 'age_risk', label: t('enterpriseArchitectureModule.factorAgeRisk'), value: riskFactors.age_risk, max: 10 },
      { key: 'dependency_risk', label: t('enterpriseArchitectureModule.factorDependencyRisk'), value: riskFactors.dependency_risk, max: 10 },
      { key: 'lifecycle_risk', label: t('enterpriseArchitectureModule.factorLifecycleRisk'), value: riskFactors.lifecycle_risk, max: 10 },
      { key: 'maturity_risk', label: t('enterpriseArchitectureModule.factorMaturityRisk'), value: riskFactors.maturity_risk, max: 10 },
      { key: 'vendor_risk', label: t('enterpriseArchitectureModule.factorVendorRisk'), value: riskFactors.vendor_risk, max: 10 }
    ];

    return (
      <div className="risk-factors-grid">
        {factors.map(factor => (
          <div key={factor.key} className="risk-factor-card">
            <div className="risk-factor-header">
              <span className="risk-factor-label">{factor.label}</span>
              <span className="risk-factor-value">{factor.value}/{factor.max}</span>
            </div>
            <div className="risk-factor-bar">
              <div 
                className="risk-factor-progress" 
                style={{ 
                  width: `${(factor.value / factor.max) * 100}%`,
                  backgroundColor: getRiskColor(getRiskLevel(factor.value))
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getRiskLevel = (score) => {
    if (score <= 2.5) return 'Low';
    if (score <= 5.0) return 'Medium';
    if (score <= 7.5) return 'High';
    return 'Critical';
  };

  const renderAIAssessment = (assessment) => {
    if (!assessment) return null;

    return (
      <div className="ai-assessment">
        <h3>🤖 {t('enterpriseArchitectureModule.aiAssessmentTitle')}</h3>
        
        {assessment.risk_evaluation && (
          <div className="assessment-section">
            <h4>📊 {t('enterpriseArchitectureModule.riskEvaluationTitle')}</h4>
            <p>{assessment.risk_evaluation}</p>
          </div>
        )}
        
        {assessment.critical_factors && assessment.critical_factors.length > 0 && (
          <div className="assessment-section">
            <h4>🚨 {t('enterpriseArchitectureModule.criticalFactorsTitle')}</h4>
            <ul>
              {assessment.critical_factors.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
        
        {assessment.immediate_recommendations && assessment.immediate_recommendations.length > 0 && (
          <div className="assessment-section">
            <h4>⚡ {t('enterpriseArchitectureModule.immediateRecsTitle')}</h4>
            <ul>
              {assessment.immediate_recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {assessment.mitigation_plan && (
          <div className="assessment-section">
            <h4>📋 {t('enterpriseArchitectureModule.mitigationPlanTitle')}</h4>
            <div className="mitigation-timeline">
              {Object.entries(assessment.mitigation_plan).map(([timeline, actions]) => (
                <div key={timeline} className="timeline-item">
                  <h5>{timeline}</h5>
                  {Array.isArray(actions) ? (
                    <ul>
                      {actions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{actions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {assessment.business_impact && (
          <div className="assessment-section">
            <h4>💼 {t('enterpriseArchitectureModule.businessImpactTitle')}</h4>
            <span className={`impact-badge ${assessment.business_impact.toLowerCase()}`}>
              {assessment.business_impact}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPortfolioRisk = (portfolioData) => {
    if (!portfolioData) return null;

    const { portfolio_metrics, ai_assessment } = portfolioData;

    return (
      <div className="portfolio-risk-analysis">
        <h3>🏢 {t('enterpriseArchitectureModule.portfolioRiskTitle')}</h3>
        
        <div className="portfolio-metrics">
          <div className="metric-card">
            <span className="metric-value">{portfolio_metrics.portfolio_health_score}/100</span>
            <span className="metric-label">{t('enterpriseArchitectureModule.portfolioHealth')}</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{portfolio_metrics.average_risk_score}/10</span>
            <span className="metric-label">{t('enterpriseArchitectureModule.avgRisk')}</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{portfolio_metrics.technology_diversity_risk}/10</span>
            <span className="metric-label">{t('enterpriseArchitectureModule.techDiversityRisk')}</span>
          </div>
        </div>
        
        <div className="risk-distribution">
          <h4>{t('enterpriseArchitectureModule.riskDistribution')}</h4>
          <div className="distribution-bars">
            {Object.entries(portfolio_metrics.risk_distribution).map(([level, count]) => (
              <div key={level} className="distribution-bar">
                <span className="level-label">{level}</span>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${(count / portfolio_metrics.total_applications) * 100}%`,
                      backgroundColor: getRiskColor(level)
                    }}
                  />
                </div>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {ai_assessment && (
          <div className="ai-portfolio-assessment">
            <h4>🤖 {t('enterpriseArchitectureModule.aiPortfolioTitle')}</h4>
            
            {ai_assessment.portfolio_status && (
              <div className="portfolio-status">
                <strong>{t('enterpriseArchitectureModule.labelStatus')}</strong> {ai_assessment.portfolio_status}
              </div>
            )}
            
            {ai_assessment.concern_areas && ai_assessment.concern_areas.length > 0 && (
              <div className="concern-areas">
                <h5>🚨 {t('enterpriseArchitectureModule.concernAreasTitle')}</h5>
                <ul>
                  {ai_assessment.concern_areas.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {ai_assessment.improvement_opportunities && ai_assessment.improvement_opportunities.length > 0 && (
              <div className="improvement-opportunities">
                <h5>💡 {t('enterpriseArchitectureModule.improvementOppsTitle')}</h5>
                <ul>
                  {ai_assessment.improvement_opportunities.map((opportunity, index) => (
                    <li key={index}>{opportunity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-risk-analysis">
      <div className="ai-risk-header">
        <h1>🤖 {t('enterpriseArchitectureModule.aiRiskTitle')}</h1>
        <p>{t('enterpriseArchitectureModule.aiRiskSubtitle')}</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="ai-risk-message error">
          <span>❌ {error}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      {success && (
        <div className="ai-risk-message success">
          <span>✅ {success}</span>
          <button onClick={clearMessages}>✕</button>
        </div>
      )}

      <div className="ai-risk-content">
        {/* Application Selection */}
        <div className="application-selection">
          <h3>📱 {t('enterpriseArchitectureModule.selectAppTitle')}</h3>
          <div className="app-grid">
            {applications.map(app => (
              <div 
                key={app._id} 
                className={`app-card ${selectedApplication?._id === app._id ? 'selected' : ''}`}
                onClick={() => setSelectedApplication(app)}
              >
                <h4>{app.name}</h4>
                <p>{app.description}</p>
                <div className="app-meta">
                  <span className={`lifecycle-badge ${app.lifecycle?.toLowerCase()}`}>
                    {app.lifecycle || 'Unknown'}
                  </span>
                  <span className="maturity-badge">{t('enterpriseArchitectureModule.labelMaturityShort')} {app.maturity || 'N/A'}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Analysis Actions */}
        <div className="risk-analysis-actions">
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => selectedApplication && analyzeApplicationRisk(selectedApplication._id)}
              disabled={!selectedApplication || loading}
            >
              {loading ? t('enterpriseArchitectureModule.btnAnalyzingAppRisk') : `🔍 ${t('enterpriseArchitectureModule.btnAnalyzeAppRisk')}`}
            </button>
            
            <button 
              className="action-btn secondary"
              onClick={analyzePortfolioRisk}
              disabled={loading}
            >
              {loading ? t('enterpriseArchitectureModule.btnAnalyzingPortfolioRisk') : `🏢 ${t('enterpriseArchitectureModule.btnAnalyzePortfolioRisk')}`}
            </button>
            
            {riskAnalysis && (
              <button 
                className="action-btn tertiary"
                onClick={generateRecommendations}
                disabled={loading}
              >
                {loading ? t('enterpriseArchitectureModule.btnGenerating') : `💡 ${t('enterpriseArchitectureModule.btnGenerateRecommendations')}`}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="ai-risk-loading">
            <div className="loading-spinner"></div>
            <p>{t('enterpriseArchitectureModule.aiAnalyzing')}</p>
          </div>
        )}

        {/* Risk Analysis Results */}
        {riskAnalysis && !loading && (
          <div className="risk-analysis-results">
            <h3>📊 {t('enterpriseArchitectureModule.riskResultsTitle')}</h3>
            
            {/* Overall Risk Score */}
            <div className="overall-risk-score">
              <div className="risk-score-display">
                <span className="risk-score-value">{riskAnalysis.risk_factors.overall_risk}/10</span>
                <span className={`risk-level-badge ${riskAnalysis.risk_factors.risk_level.toLowerCase()}`}>
                  {riskAnalysis.risk_factors.risk_level}
                </span>
              </div>
              <div className="risk-score-details">
                <p><strong>{t('enterpriseArchitectureModule.labelApplication')}</strong> {selectedApplication?.name}</p>
                <p><strong>{t('enterpriseArchitectureModule.labelAge')}</strong> {t('enterpriseArchitectureModule.labelAgeYears', { n: riskAnalysis.risk_factors.age_years })}</p>
                <p><strong>{t('enterpriseArchitectureModule.labelDependencies')}</strong> {riskAnalysis.risk_factors.dependencies_count}</p>
              </div>
            </div>
            
            {/* Risk Factors Breakdown */}
            <div className="risk-factors-section">
              <h4>🔍 {t('enterpriseArchitectureModule.riskFactorsTitle')}</h4>
              {renderRiskFactors(riskAnalysis.risk_factors)}
            </div>
            
            {/* AI Assessment */}
            {renderAIAssessment(riskAnalysis.ai_assessment)}
            
            {/* AI Recommendations */}
            {riskAnalysis.recommendations && (
              <div className="ai-recommendations">
                <h3>💡 {t('enterpriseArchitectureModule.aiRecsTitle')}</h3>
                
                {riskAnalysis.recommendations.technical_recommendations && (
                  <div className="recommendations-section">
                    <h4>🔧 {t('enterpriseArchitectureModule.technicalRecsTitle')}</h4>
                    <ul>
                      {riskAnalysis.recommendations.technical_recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {riskAnalysis.recommendations.process_recommendations && (
                  <div className="recommendations-section">
                    <h4>⚙️ {t('enterpriseArchitectureModule.processRecsTitle')}</h4>
                    <ul>
                      {riskAnalysis.recommendations.process_recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {riskAnalysis.recommendations.governance_recommendations && (
                  <div className="recommendations-section">
                    <h4>🏛️ {t('enterpriseArchitectureModule.governanceRecsTitle')}</h4>
                    <ul>
                      {riskAnalysis.recommendations.governance_recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {riskAnalysis.recommendations.implementation_timeline && (
                  <div className="recommendations-section">
                    <h4>📅 {t('enterpriseArchitectureModule.implTimelineTitle')}</h4>
                    <div className="timeline">
                      {Object.entries(riskAnalysis.recommendations.implementation_timeline).map(([phase, actions]) => (
                        <div key={phase} className="timeline-phase">
                          <h5>{phase}</h5>
                          {Array.isArray(actions) ? (
                            <ul>
                              {actions.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{actions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Portfolio Risk Results */}
        {portfolioRisk && !loading && (
          <div className="portfolio-risk-results">
            {renderPortfolioRisk(portfolioRisk)}
          </div>
        )}
      </div>
    </div>
  );
}
