import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './ImpactAnalysis.css';

export default function ImpactAnalysis() {
  const { t } = useTranslation();
  const [processes, setProcesses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [impactResults, setImpactResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisType, setAnalysisType] = useState('process');
  const [changeType, setChangeType] = useState('modification');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [processesRes, applicationsRes, capabilitiesRes] = await Promise.allSettled([
        axios.get('/api/ea/processes'),
        axios.get('/api/ea/applications'),
        axios.get('/api/ea/capabilities')
      ]);

      if (processesRes.status === 'fulfilled') {
        setProcesses(processesRes.value.data || []);
      }
      if (applicationsRes.status === 'fulfilled') {
        setApplications(applicationsRes.value.data || []);
      }
      if (capabilitiesRes.status === 'fulfilled') {
        setCapabilities(capabilitiesRes.value.data || []);
      }

    } catch (err) {
      console.error('Error loading impact analysis data:', err);
      setError(t('enterpriseArchitectureModule.errorLoadData'));
    } finally {
      setLoading(false);
    }
  };

  // Generate sample data for demo
  const generateSampleData = () => {
    const sampleProcesses = [
      { 
        id: 1, 
        name: 'Order Processing', 
        risk: 25, 
        maturity: 4, 
        category: 'Operations',
        dependencies: ['ERP System', 'Payment Gateway'],
        impacts: ['Customer Experience', 'Revenue']
      },
      { 
        id: 2, 
        name: 'Payment Processing', 
        risk: 75, 
        maturity: 2, 
        category: 'Finance',
        dependencies: ['Payment Gateway', 'Banking API'],
        impacts: ['Financial Operations', 'Compliance']
      },
      { 
        id: 3, 
        name: 'User Authentication', 
        risk: 45, 
        maturity: 5, 
        category: 'IT',
        dependencies: ['Identity Provider', 'LDAP'],
        impacts: ['Security', 'User Access']
      }
    ];

    const sampleApplications = [
      { 
        id: 1, 
        name: 'ERP System', 
        risk: 35, 
        maturity: 4, 
        lifecycle: 'Production',
        dependencies: ['Database', 'Authentication Service'],
        impacts: ['Business Operations', 'Data Management']
      },
      { 
        id: 2, 
        name: 'Payment Gateway', 
        risk: 55, 
        maturity: 3, 
        lifecycle: 'Production',
        dependencies: ['Security Service', 'Banking API'],
        impacts: ['Financial Transactions', 'Customer Trust']
      }
    ];

    setProcesses(sampleProcesses);
    setApplications(sampleApplications);
    setCapabilities([
      { id: 1, name: 'Customer Management', risk: 30, maturity: 4 },
      { id: 2, name: 'Financial Operations', risk: 70, maturity: 2 },
      { id: 3, name: 'IT Infrastructure', risk: 50, maturity: 3 }
    ]);
  };

  // BFS Algorithm for Impact Analysis
  const analyzeImpact = (itemId, itemType, changeType) => {
    if (!itemId) return;

    const item = itemType === 'process' 
      ? processes.find(p => p.id === itemId)
      : applications.find(a => a.id === itemId);

    if (!item) return;

    const visited = new Set();
    const queue = [{ item, level: 0, path: [item.name] }];
    const impactTree = [];
    const riskScore = calculateRiskScore(item, changeType);

    while (queue.length > 0) {
      const { item: currentItem, level, path } = queue.shift();
      
      if (visited.has(currentItem.name)) continue;
      visited.add(currentItem.name);

      impactTree.push({
        name: currentItem.name,
        type: itemType,
        level,
        path: [...path],
        risk: currentItem.risk || 0,
        impact: currentItem.impacts || [],
        dependencies: currentItem.dependencies || []
      });

      // Find related items (BFS expansion)
      const relatedItems = findRelatedItems(currentItem, itemType);
      
      for (const related of relatedItems) {
        if (!visited.has(related.name) && level < 3) { // Limit depth to 3 levels
          queue.push({
            item: related,
            level: level + 1,
            path: [...path, related.name]
          });
        }
      }
    }

    // Calculate impact metrics
    const impactMetrics = calculateImpactMetrics(impactTree, riskScore);
    
    setImpactResults({
      item,
      changeType,
      impactTree,
      impactMetrics,
      riskScore
    });
  };

  const findRelatedItems = (item, itemType) => {
    const related = [];
    
    if (itemType === 'process') {
      // Find applications that support this process
      const supportingApps = applications.filter(app => 
        app.dependencies && app.dependencies.some(dep => 
          item.dependencies && item.dependencies.includes(dep)
        )
      );
      related.push(...supportingApps);

      // Find related processes
      const relatedProcesses = processes.filter(proc => 
        proc.id !== item.id && 
        proc.dependencies && 
        proc.dependencies.some(dep => 
          item.dependencies && item.dependencies.includes(dep)
        )
      );
      related.push(...relatedProcesses);
    } else {
      // Find processes that depend on this application
      const dependentProcesses = processes.filter(proc => 
        proc.dependencies && proc.dependencies.includes(item.name)
      );
      related.push(...dependentProcesses);

      // Find related applications
      const relatedApps = applications.filter(app => 
        app.id !== item.id && 
        app.dependencies && 
        app.dependencies.some(dep => 
          item.dependencies && item.dependencies.includes(dep)
        )
      );
      related.push(...relatedApps);
    }

    return related;
  };

  const calculateRiskScore = (item, changeType) => {
    let baseRisk = item.risk || 50;
    
    switch (changeType) {
      case 'deletion':
        return Math.min(100, baseRisk * 1.5);
      case 'modification':
        return Math.min(100, baseRisk * 1.2);
      case 'addition':
        return Math.min(100, baseRisk * 0.8);
      default:
        return baseRisk;
    }
  };

  const calculateImpactMetrics = (impactTree, baseRisk) => {
    const totalItems = impactTree.length;
    const highRiskItems = impactTree.filter(item => item.risk >= 70).length;
    const mediumRiskItems = impactTree.filter(item => item.risk >= 40 && item.risk < 70).length;
    const lowRiskItems = impactTree.filter(item => item.risk < 40).length;
    
    const maxDepth = Math.max(...impactTree.map(item => item.level));
    const avgRisk = impactTree.reduce((sum, item) => sum + item.risk, 0) / totalItems;
    
    return {
      totalItems,
      highRiskItems,
      mediumRiskItems,
      lowRiskItems,
      maxDepth,
      avgRisk: Math.round(avgRisk),
      overallRisk: Math.round((baseRisk + avgRisk) / 2)
    };
  };

  const clearResults = () => {
    setImpactResults(null);
    setSelectedItem(null);
  };

  const getRiskColor = (risk) => {
    if (risk >= 70) return '#dc3545';
    if (risk >= 40) return '#ffc107';
    return '#28a745';
  };

  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'deletion': return '#dc3545';
      case 'modification': return '#ffc107';
      case 'addition': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="impact-loading">
        <div className="loading-spinner"></div>
        <p>{t('enterpriseArchitectureModule.loading')}</p>
      </div>
    );
  }

  return (
    <div className="impact-analysis">
      <div className="impact-header">
        <h2>💥 {t('enterpriseArchitectureModule.impactTitle')}</h2>
        <p>{t('enterpriseArchitectureModule.impactSubtitle')}</p>
      </div>

      {error && (
        <div className="impact-error">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Demo Data Button */}
      <div className="demo-controls">
        <button onClick={generateSampleData} className="demo-btn">
          🎯 {t('enterpriseArchitectureModule.btnLoadDemoData')}
        </button>
        <button onClick={loadData} className="refresh-btn">
          🔄 {t('enterpriseArchitectureModule.btnRefreshData')}
        </button>
      </div>

      {/* Analysis Configuration */}
      <div className="analysis-config">
        <div className="config-section">
          <label>{t('enterpriseArchitectureModule.labelAnalysisType')}</label>
          <select 
            value={analysisType} 
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <option value="process">🔄 {t('enterpriseArchitectureModule.optProcess')}</option>
            <option value="application">💻 {t('enterpriseArchitectureModule.optApplication')}</option>
          </select>
        </div>

        <div className="config-section">
          <label>{t('enterpriseArchitectureModule.labelChangeType')}</label>
          <select 
            value={changeType} 
            onChange={(e) => setChangeType(e.target.value)}
          >
            <option value="modification">✏️ {t('enterpriseArchitectureModule.optModification')}</option>
            <option value="deletion">🗑️ {t('enterpriseArchitectureModule.optDeletion')}</option>
            <option value="addition">➕ {t('enterpriseArchitectureModule.optAddition')}</option>
          </select>
        </div>

        <div className="config-section">
          <label>{t('enterpriseArchitectureModule.labelSelectItem')}</label>
          <select 
            value={selectedItem || ''} 
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">{t('enterpriseArchitectureModule.placeholderChooseItem')}</option>
            {analysisType === 'process' 
              ? processes.map(proc => (
                  <option key={proc.id} value={proc.id}>
                    🔄 {proc.name} ({t('enterpriseArchitectureModule.labelRisk')}: {proc.risk}%)
                  </option>
                ))
              : applications.map(app => (
                  <option key={app.id} value={app.id}>
                    💻 {app.name} ({t('enterpriseArchitectureModule.labelRisk')}: {app.risk}%)
                  </option>
                ))
            }
          </select>
        </div>

        <button 
          className="analyze-btn"
          onClick={() => analyzeImpact(selectedItem, analysisType, changeType)}
          disabled={!selectedItem}
        >
          🔍 {t('enterpriseArchitectureModule.btnAnalyzeImpact')}
        </button>
      </div>

      {/* Impact Results */}
      {impactResults && (
        <div className="impact-results">
          <div className="results-header">
            <h3>📊 {t('enterpriseArchitectureModule.impactResultsTitle')}</h3>
            <button onClick={clearResults} className="clear-btn">✕ {t('enterpriseArchitectureModule.btnClear')}</button>
          </div>

          {/* Summary Metrics */}
          <div className="impact-metrics">
            <div className="metric-card primary">
              <div className="metric-icon">🎯</div>
              <div className="metric-value">{impactResults.item.name}</div>
              <div className="metric-label">{t('enterpriseArchitectureModule.metricTargetItem')}</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🔄</div>
              <div className="metric-value">{impactResults.changeType}</div>
              <div className="metric-label">{t('enterpriseArchitectureModule.metricChangeType')}</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">⚠️</div>
              <div className="metric-value">{impactResults.riskScore}%</div>
              <div className="metric-label">{t('enterpriseArchitectureModule.metricRiskScore')}</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-value">{impactResults.impactMetrics.totalItems}</div>
              <div className="metric-label">{t('enterpriseArchitectureModule.metricTotalImpacted')}</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🌊</div>
              <div className="metric-value">{impactResults.impactMetrics.maxDepth}</div>
              <div className="metric-label">{t('enterpriseArchitectureModule.metricMaxDepth')}</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">⚡</div>
              <div className="metric-value">{impactResults.impactMetrics.overallRisk}%</div>
              <div className="metric-label">{t('enterpriseArchitectureModule.metricOverallRisk')}</div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="risk-distribution">
            <h4>📊 {t('enterpriseArchitectureModule.riskDistribution')}</h4>
            <div className="risk-bars">
              <div className="risk-bar">
                <div className="risk-label">{t('enterpriseArchitectureModule.riskHigh')}</div>
                <div className="risk-bar-container">
                  <div 
                    className="risk-bar-fill high" 
                    style={{ width: `${(impactResults.impactMetrics.highRiskItems / impactResults.impactMetrics.totalItems) * 100}%` }}
                  ></div>
                </div>
                <div className="risk-count">{impactResults.impactMetrics.highRiskItems}</div>
              </div>
              
              <div className="risk-bar">
                <div className="risk-label">{t('enterpriseArchitectureModule.riskMedium')}</div>
                <div className="risk-bar-container">
                  <div 
                    className="risk-bar-fill medium" 
                    style={{ width: `${(impactResults.impactMetrics.mediumRiskItems / impactResults.impactMetrics.totalItems) * 100}%` }}
                  ></div>
                </div>
                <div className="risk-count">{impactResults.impactMetrics.mediumRiskItems}</div>
              </div>
              
              <div className="risk-bar">
                <div className="risk-label">{t('enterpriseArchitectureModule.riskLow')}</div>
                <div className="risk-bar-container">
                  <div 
                    className="risk-bar-fill low" 
                    style={{ width: `${(impactResults.impactMetrics.lowRiskItems / impactResults.impactMetrics.totalItems) * 100}%` }}
                  ></div>
                </div>
                <div className="risk-count">{impactResults.impactMetrics.lowRiskItems}</div>
              </div>
            </div>
          </div>

          {/* Impact Tree */}
          <div className="impact-tree">
            <h4>🌳 {t('enterpriseArchitectureModule.impactTree')}</h4>
            <div className="tree-container">
              {impactResults.impactTree.map((item, index) => (
                <div 
                  key={index} 
                  className={`tree-item level-${item.level}`}
                  style={{ 
                    marginLeft: `${item.level * 40}px`,
                    borderLeftColor: getRiskColor(item.risk)
                  }}
                >
                  <div className="tree-item-header">
                    <span className="item-name">{item.name}</span>
                    <span className="item-risk" style={{ color: getRiskColor(item.risk) }}>
                      {t('enterpriseArchitectureModule.labelRisk')}: {item.risk}%
                    </span>
                  </div>
                  
                  <div className="tree-item-details">
                    <div className="item-path">
                      <strong>{t('enterpriseArchitectureModule.labelPath')}</strong> {item.path.join(' → ')}
                    </div>
                    
                    {item.dependencies.length > 0 && (
                      <div className="item-dependencies">
                        <strong>{t('enterpriseArchitectureModule.labelDependencies')}</strong> {item.dependencies.join(', ')}
                      </div>
                    )}
                    
                    {item.impacts.length > 0 && (
                      <div className="item-impacts">
                        <strong>{t('enterpriseArchitectureModule.labelImpacts')}</strong> {item.impacts.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="impact-recommendations">
            <h4>💡 {t('enterpriseArchitectureModule.impactRecommendations')}</h4>
            <div className="recommendations-list">
              {impactResults.impactMetrics.overallRisk >= 70 && (
                <div className="recommendation high-risk">
                  <span className="rec-icon">🚨</span>
                  <span>{t('enterpriseArchitectureModule.recHighRisk')}</span>
                </div>
              )}
              
              {impactResults.impactMetrics.highRiskItems > 0 && (
                <div className="recommendation medium-risk">
                  <span className="rec-icon">⚠️</span>
                  <span>{t('enterpriseArchitectureModule.recHighRiskItems', { count: impactResults.impactMetrics.highRiskItems })}</span>
                </div>
              )}
              
              {impactResults.impactMetrics.maxDepth >= 3 && (
                <div className="recommendation medium-risk">
                  <span className="rec-icon">🌊</span>
                  <span>{t('enterpriseArchitectureModule.recDeepChain')}</span>
                </div>
              )}
              
              <div className="recommendation low-risk">
                <span className="rec-icon">✅</span>
                <span>{t('enterpriseArchitectureModule.recMonitor')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!impactResults && (
        <div className="impact-instructions">
          <h3>📋 {t('enterpriseArchitectureModule.howToTitle')}</h3>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <h4>{t('enterpriseArchitectureModule.howToStep1Title')}</h4>
              <p>{t('enterpriseArchitectureModule.howToStep1Desc')}</p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">2</div>
              <h4>{t('enterpriseArchitectureModule.howToStep2Title')}</h4>
              <p>{t('enterpriseArchitectureModule.howToStep2Desc')}</p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">3</div>
              <h4>{t('enterpriseArchitectureModule.howToStep3Title')}</h4>
              <p>{t('enterpriseArchitectureModule.howToStep3Desc')}</p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">4</div>
              <h4>{t('enterpriseArchitectureModule.howToStep4Title')}</h4>
              <p>{t('enterpriseArchitectureModule.howToStep4Desc')}</p>
            </div>
          </div>
          
          <div className="algorithm-info">
            <h4>🔍 {t('enterpriseArchitectureModule.bfsTitle')}</h4>
            <p>{t('enterpriseArchitectureModule.bfsDesc')}</p>
            <ul>
              <li><strong>{t('enterpriseArchitectureModule.bfsLevel0')}</strong></li>
              <li><strong>{t('enterpriseArchitectureModule.bfsLevel1')}</strong></li>
              <li><strong>{t('enterpriseArchitectureModule.bfsLevel2')}</strong></li>
              <li><strong>{t('enterpriseArchitectureModule.bfsLevel3')}</strong></li>
            </ul>
            <p>{t('enterpriseArchitectureModule.bfsRiskDesc')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
