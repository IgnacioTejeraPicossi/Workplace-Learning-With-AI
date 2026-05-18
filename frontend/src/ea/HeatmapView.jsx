import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
} from 'chart.js';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import axios from 'axios';
import './HeatmapView.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

export default function HeatmapView() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState('risk-maturity');
  const [processes, setProcesses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all data in parallel
      const [processesRes, applicationsRes, capabilitiesRes] = await Promise.allSettled([
        axios.get('/api/ea/processes'),
        axios.get('/api/ea/applications'),
        axios.get('/api/ea/capabilities')
      ]);

      // Handle successful responses
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
      console.error('Error loading heatmap data:', err);
      setError(t('enterpriseArchitectureModule.errorLoadHeatmap'));
    } finally {
      setLoading(false);
    }
  };

  // Generate sample data for demo purposes
  const generateSampleData = () => {
    const sampleProcesses = [
      { id: 1, name: 'Order Processing', risk: 25, maturity: 4, category: 'Operations' },
      { id: 2, name: 'Payment Processing', risk: 75, maturity: 2, category: 'Finance' },
      { id: 3, name: 'User Authentication', risk: 45, maturity: 5, category: 'IT' },
      { id: 4, name: 'Inventory Management', risk: 15, maturity: 3, category: 'Operations' },
      { id: 5, name: 'Reporting System', risk: 60, maturity: 1, category: 'IT' },
      { id: 6, name: 'HR Onboarding', risk: 30, maturity: 4, category: 'HR' },
      { id: 7, name: 'Data Backup', risk: 80, maturity: 2, category: 'IT' },
      { id: 8, name: 'Customer Support', risk: 20, maturity: 5, category: 'Operations' }
    ];

    const sampleApplications = [
      { id: 1, name: 'ERP System', risk: 35, maturity: 4, lifecycle: 'Production' },
      { id: 2, name: 'CRM Platform', risk: 55, maturity: 3, lifecycle: 'Production' },
      { id: 3, name: 'Legacy Database', risk: 85, maturity: 1, lifecycle: 'Sunset' },
      { id: 4, name: 'Cloud Storage', risk: 25, maturity: 5, lifecycle: 'Production' },
      { id: 5, name: 'Mobile App', risk: 40, maturity: 2, lifecycle: 'Pilot' }
    ];

    setProcesses(sampleProcesses);
    setApplications(sampleApplications);
    setCapabilities([
      { id: 1, name: 'Customer Management', risk: 30, maturity: 4 },
      { id: 2, name: 'Financial Operations', risk: 70, maturity: 2 },
      { id: 3, name: 'IT Infrastructure', risk: 50, maturity: 3 }
    ]);
  };

  // Risk-Maturity Matrix Chart
  const riskMaturityChartData = useMemo(() => {
    const labels = processes.map(p => p.name);
    const riskData = processes.map(p => p.risk);
    const maturityData = processes.map(p => p.maturity);

    return {
      labels,
      datasets: [
        {
          label: 'Risk Level (%)',
          data: riskData,
          backgroundColor: riskData.map(risk => {
            if (risk >= 70) return 'rgba(220, 53, 69, 0.8)'; // High risk - Red
            if (risk >= 40) return 'rgba(255, 193, 7, 0.8)'; // Medium risk - Yellow
            return 'rgba(40, 167, 69, 0.8)'; // Low risk - Green
          }),
          borderColor: riskData.map(risk => {
            if (risk >= 70) return 'rgb(220, 53, 69)';
            if (risk >= 40) return 'rgb(255, 193, 7)';
            return 'rgb(40, 167, 69)';
          }),
          borderWidth: 2,
          borderRadius: 8,
          yAxisID: 'y-risk'
        },
        {
          label: 'Maturity Level',
          data: maturityData,
          type: 'line',
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y-maturity'
        }
      ]
    };
  }, [processes]);

  const riskMaturityOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Risk vs Maturity Matrix',
        font: { size: 18, weight: 'bold' }
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const process = processes[dataIndex];
            if (process) {
              return [
                `Category: ${process.category}`,
                `Risk Level: ${process.risk}%`,
                `Maturity: ${process.maturity}/5`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Processes'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      'y-risk': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Risk Level (%)'
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      'y-maturity': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Maturity Level'
        },
        min: 1,
        max: 5,
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  };

  // Application Lifecycle Chart
  const applicationLifecycleData = useMemo(() => {
    const lifecycleCounts = applications.reduce((acc, app) => {
      acc[app.lifecycle] = (acc[app.lifecycle] || 0) + 1;
      return acc;
    }, {});

    const lifecycleRisk = applications.reduce((acc, app) => {
      if (!acc[app.lifecycle]) acc[app.lifecycle] = [];
      acc[app.lifecycle].push(app.risk);
      return acc;
    }, {});

    const avgRisk = Object.keys(lifecycleRisk).map(lifecycle => 
      lifecycleRisk[lifecycle].reduce((a, b) => a + b, 0) / lifecycleRisk[lifecycle].length
    );

    return {
      labels: Object.keys(lifecycleCounts),
      datasets: [
        {
          label: 'Number of Applications',
          data: Object.values(lifecycleCounts),
          backgroundColor: [
            'rgba(40, 167, 69, 0.8)',   // Production - Green
            'rgba(255, 193, 7, 0.8)',   // Pilot - Yellow
            'rgba(220, 53, 69, 0.8)',   // Sunset - Red
            'rgba(102, 126, 234, 0.8)'  // Development - Blue
          ],
          borderColor: [
            'rgb(40, 167, 69)',
            'rgb(255, 193, 7)',
            'rgb(220, 53, 69)',
            'rgb(102, 126, 234)'
          ],
          borderWidth: 2,
          borderRadius: 8
        },
        {
          label: 'Average Risk Level',
          data: avgRisk,
          type: 'line',
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          yAxisID: 'y-risk'
        }
      ]
    };
  }, [applications]);

  const applicationLifecycleOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Application Lifecycle Distribution & Risk',
        font: { size: 18, weight: 'bold' }
      },
      legend: {
        position: 'top',
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Lifecycle Stage'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Applications'
        },
        beginAtZero: true
      },
      'y-risk': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Risk Level (%)'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  };

  // Capability Maturity Scatter Plot
  const capabilityScatterData = useMemo(() => {
    return {
      datasets: [
        {
          label: 'Business Capabilities',
          data: capabilities.map(cap => ({
            x: cap.maturity,
            y: cap.risk,
            label: cap.name
          })),
          backgroundColor: capabilities.map(cap => {
            if (cap.risk >= 70) return 'rgba(220, 53, 69, 0.8)';
            if (cap.risk >= 40) return 'rgba(255, 193, 7, 0.8)';
            return 'rgba(40, 167, 69, 0.8)';
          }),
          borderColor: capabilities.map(cap => {
            if (cap.risk >= 70) return 'rgb(220, 53, 69)';
            if (cap.risk >= 40) return 'rgb(255, 193, 7)';
            return 'rgb(40, 167, 69)';
          }),
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 12
        }
      ]
    };
  }, [capabilities]);

  const capabilityScatterOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Capability Maturity vs Risk Scatter Plot',
        font: { size: 18, weight: 'bold' }
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const point = context.raw;
            return `${point.label}: Maturity ${point.x}/5, Risk ${point.y}%`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Maturity Level (1-5)'
        },
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Risk Level (%)'
        },
        min: 0,
        max: 100
      }
    }
  };

  // Risk Distribution Pie Chart
  const riskDistributionData = useMemo(() => {
    const highRisk = processes.filter(p => p.risk >= 70).length;
    const mediumRisk = processes.filter(p => p.risk >= 40 && p.risk < 70).length;
    const lowRisk = processes.filter(p => p.risk < 40).length;

    return {
             labels: ['High Risk (≥70%)', 'Medium Risk (40-69%)', 'Low Risk (&lt;40%)'],
      datasets: [
        {
          data: [highRisk, mediumRisk, lowRisk],
          backgroundColor: [
            'rgba(220, 53, 69, 0.8)',   // High - Red
            'rgba(255, 193, 7, 0.8)',   // Medium - Yellow
            'rgba(40, 167, 69, 0.8)'    // Low - Green
          ],
          borderColor: [
            'rgb(220, 53, 69)',
            'rgb(255, 193, 7)',
            'rgb(40, 167, 69)'
          ],
          borderWidth: 2
        }
      ]
    };
  }, [processes]);

  const riskDistributionOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Risk Distribution Overview',
        font: { size: 18, weight: 'bold' }
      },
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = processes.length;
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const clearError = () => setError('');

  if (loading) {
    return (
      <div className="heatmap-loading">
        <div className="loading-spinner"></div>
        <p>{t('enterpriseArchitectureModule.loading')}</p>
      </div>
    );
  }

  return (
    <div className="heatmap-view">
      <div className="heatmap-header">
        <h2>🗺️ {t('enterpriseArchitectureModule.tabHeatmap')}</h2>
        <p>{t('enterpriseArchitectureModule.subtitle')}</p>
      </div>

      {error && (
        <div className="heatmap-error">
          <span>❌ {error}</span>
          <button onClick={clearError}>✕</button>
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

      {/* View Selector */}
      <div className="view-selector">
        <button 
          className={`view-btn ${activeView === 'risk-maturity' ? 'active' : ''}`}
          onClick={() => setActiveView('risk-maturity')}
        >
          🔴 {t('enterpriseArchitectureModule.hmRiskMaturity')}
        </button>
        <button 
          className={`view-btn ${activeView === 'lifecycle' ? 'active' : ''}`}
          onClick={() => setActiveView('lifecycle')}
        >
          📊 Application Lifecycle
        </button>
        <button 
          className={`view-btn ${activeView === 'capabilities' ? 'active' : ''}`}
          onClick={() => setActiveView('capabilities')}
        >
          🏗️ {t('enterpriseArchitectureModule.hmCapabilities')}
        </button>
        <button 
          className={`view-btn ${activeView === 'distribution' ? 'active' : ''}`}
          onClick={() => setActiveView('distribution')}
        >
          🥧 Risk Distribution
        </button>
      </div>

      {/* Charts */}
      <div className="charts-container">
        {activeView === 'risk-maturity' && (
          <div className="chart-section">
            <h3>🔄 Process Risk vs Maturity Matrix</h3>
            <div className="chart-wrapper">
              <Bar data={riskMaturityChartData} options={riskMaturityOptions} />
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color high-risk"></span>
                <span>{t('enterpriseArchitectureModule.riskHigh')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color medium-risk"></span>
                <span>{t('enterpriseArchitectureModule.riskMedium')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color low-risk"></span>
                <span>{t('enterpriseArchitectureModule.riskLow')}</span>
              </div>
            </div>
          </div>
        )}

        {activeView === 'lifecycle' && (
          <div className="chart-section">
            <h3>💻 Application Lifecycle & Risk Analysis</h3>
            <div className="chart-wrapper">
              <Bar data={applicationLifecycleData} options={applicationLifecycleOptions} />
            </div>
          </div>
        )}

        {activeView === 'capabilities' && (
          <div className="chart-section">
            <h3>🏗️ Business Capability Maturity vs Risk</h3>
            <div className="chart-wrapper">
              <Scatter data={capabilityScatterData} options={capabilityScatterOptions} />
            </div>
          </div>
        )}

        {activeView === 'distribution' && (
          <div className="chart-section">
            <h3>📊 Overall Risk Distribution</h3>
            <div className="chart-wrapper pie-chart">
              <Bar data={riskDistributionData} options={riskDistributionOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{processes.length}</div>
          <div className="stat-label">{t('enterpriseArchitectureModule.statProcesses')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💻</div>
          <div className="stat-value">{applications.length}</div>
          <div className="stat-label">{t('enterpriseArchitectureModule.statApplications')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏗️</div>
          <div className="stat-value">{capabilities.length}</div>
          <div className="stat-label">{t('enterpriseArchitectureModule.tabCapabilities')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">
            {processes.filter(p => p.risk >= 70).length}
          </div>
          <div className="stat-label">{t('enterpriseArchitectureModule.statHighRisk')}</div>
        </div>
      </div>
    </div>
  );
}
