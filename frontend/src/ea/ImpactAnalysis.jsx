import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './ImpactAnalysis.css';

export default function ImpactAnalysis() {
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
      setError('Failed to load data');
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
        <p>Loading impact analysis data...</p>
      </div>
    );
  }

  return (
    <div className="impact-analysis">
      <div className="impact-header">
        <h2>💥 Impact Analysis</h2>
        <p>Analyze the cascading impact of changes using BFS algorithm</p>
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
          🎯 Load Demo Data
        </button>
        <button onClick={loadData} className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>

      {/* Analysis Configuration */}
      <div className="analysis-config">
        <div className="config-section">
          <label>Analysis Type:</label>
          <select 
            value={analysisType} 
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <option value="process">🔄 Process</option>
            <option value="application">💻 Application</option>
          </select>
        </div>

        <div className="config-section">
          <label>Change Type:</label>
          <select 
            value={changeType} 
            onChange={(e) => setChangeType(e.target.value)}
          >
            <option value="modification">✏️ Modification</option>
            <option value="deletion">🗑️ Deletion</option>
            <option value="addition">➕ Addition</option>
          </select>
        </div>

        <div className="config-section">
          <label>Select Item:</label>
          <select 
            value={selectedItem || ''} 
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Choose an item...</option>
            {analysisType === 'process' 
              ? processes.map(proc => (
                  <option key={proc.id} value={proc.id}>
                    🔄 {proc.name} (Risk: {proc.risk}%)
                  </option>
                ))
              : applications.map(app => (
                  <option key={app.id} value={app.id}>
                    💻 {app.name} (Risk: {app.risk}%)
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
          🔍 Analyze Impact
        </button>
      </div>

      {/* Impact Results */}
      {impactResults && (
        <div className="impact-results">
          <div className="results-header">
            <h3>📊 Impact Analysis Results</h3>
            <button onClick={clearResults} className="clear-btn">✕ Clear</button>
          </div>

          {/* Summary Metrics */}
          <div className="impact-metrics">
            <div className="metric-card primary">
              <div className="metric-icon">🎯</div>
              <div className="metric-value">{impactResults.item.name}</div>
              <div className="metric-label">Target Item</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🔄</div>
              <div className="metric-value">{impactResults.changeType}</div>
              <div className="metric-label">Change Type</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">⚠️</div>
              <div className="metric-value">{impactResults.riskScore}%</div>
              <div className="metric-label">Risk Score</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-value">{impactResults.impactMetrics.totalItems}</div>
              <div className="metric-label">Total Impacted</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🌊</div>
              <div className="metric-value">{impactResults.impactMetrics.maxDepth}</div>
              <div className="metric-label">Max Depth</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">⚡</div>
              <div className="metric-value">{impactResults.impactMetrics.overallRisk}%</div>
              <div className="metric-label">Overall Risk</div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="risk-distribution">
            <h4>📊 Risk Distribution</h4>
            <div className="risk-bars">
              <div className="risk-bar">
                <div className="risk-label">High Risk (≥70%)</div>
                <div className="risk-bar-container">
                  <div 
                    className="risk-bar-fill high" 
                    style={{ width: `${(impactResults.impactMetrics.highRiskItems / impactResults.impactMetrics.totalItems) * 100}%` }}
                  ></div>
                </div>
                <div className="risk-count">{impactResults.impactMetrics.highRiskItems}</div>
              </div>
              
              <div className="risk-bar">
                <div className="risk-label">Medium Risk (40-69%)</div>
                <div className="risk-bar-container">
                  <div 
                    className="risk-bar-fill medium" 
                    style={{ width: `${(impactResults.impactMetrics.mediumRiskItems / impactResults.impactMetrics.totalItems) * 100}%` }}
                  ></div>
                </div>
                <div className="risk-count">{impactResults.impactMetrics.mediumRiskItems}</div>
              </div>
              
              <div className="risk-bar">
                <div className="risk-label">Low Risk (&lt;40%)</div>
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
            <h4>🌳 Impact Tree (BFS Traversal)</h4>
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
                      Risk: {item.risk}%
                    </span>
                  </div>
                  
                  <div className="tree-item-details">
                    <div className="item-path">
                      <strong>Path:</strong> {item.path.join(' → ')}
                    </div>
                    
                    {item.dependencies.length > 0 && (
                      <div className="item-dependencies">
                        <strong>Dependencies:</strong> {item.dependencies.join(', ')}
                      </div>
                    )}
                    
                    {item.impacts.length > 0 && (
                      <div className="item-impacts">
                        <strong>Impacts:</strong> {item.impacts.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="impact-recommendations">
            <h4>💡 Recommendations</h4>
            <div className="recommendations-list">
              {impactResults.impactMetrics.overallRisk >= 70 && (
                <div className="recommendation high-risk">
                  <span className="rec-icon">🚨</span>
                  <span>High risk change detected. Consider phased implementation or rollback plan.</span>
                </div>
              )}
              
              {impactResults.impactMetrics.highRiskItems > 0 && (
                <div className="recommendation medium-risk">
                  <span className="rec-icon">⚠️</span>
                  <span>Review {impactResults.impactMetrics.highRiskItems} high-risk impacted items before proceeding.</span>
                </div>
              )}
              
              {impactResults.impactMetrics.maxDepth >= 3 && (
                <div className="recommendation medium-risk">
                  <span className="rec-icon">🌊</span>
                  <span>Deep impact chain detected. Monitor cascading effects carefully.</span>
                </div>
              )}
              
              <div className="recommendation low-risk">
                <span className="rec-icon">✅</span>
                <span>Implement change monitoring and establish rollback procedures.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!impactResults && (
        <div className="impact-instructions">
          <h3>📋 How to Use Impact Analysis</h3>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <h4>Select Analysis Type</h4>
              <p>Choose whether to analyze impact on a Process or Application</p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">2</div>
              <h4>Choose Change Type</h4>
              <p>Specify if you're adding, modifying, or deleting the item</p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">3</div>
              <h4>Select Target Item</h4>
              <p>Pick the specific process or application to analyze</p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">4</div>
              <h4>Run Analysis</h4>
              <p>Click "Analyze Impact" to run the BFS algorithm</p>
            </div>
          </div>
          
          <div className="algorithm-info">
            <h4>🔍 BFS Algorithm Details</h4>
            <p>
              The analysis uses <strong>Breadth-First Search</strong> to traverse dependencies and calculate cascading impact:
            </p>
            <ul>
              <li><strong>Level 0:</strong> Direct target item</li>
              <li><strong>Level 1:</strong> Direct dependencies and dependents</li>
              <li><strong>Level 2:</strong> Secondary dependencies</li>
              <li><strong>Level 3:</strong> Tertiary dependencies</li>
            </ul>
            <p>
              Risk scores are calculated considering the change type and propagated through the dependency tree.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
