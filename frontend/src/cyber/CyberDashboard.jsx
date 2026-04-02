// Cybersecurity Dashboard Component
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function CyberDashboard() {
  const [riskScore, setRiskScore] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const [riskResponse, kpisResponse, vulnsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/cyber/risk/score`),
        fetch(`${API_BASE}/api/cyber/posture/kpis`),
        fetch(`${API_BASE}/api/cyber/vulnerabilities`)
      ]);

      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRiskScore(riskData);
      }

      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData);
      }

      if (vulnsResponse.ok) {
        const vulnsData = await vulnsResponse.json();
        setVulnerabilities(vulnsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runVulnerabilityScan = async () => {
    try {
      setScanning(true);
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/cyber/vulnerabilities/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: 'default',
          scan_types: ['npm', 'pip', 'secrets']
        })
      });

      if (response.ok) {
        const results = await response.json();
        console.log('Scan results:', results);
        // Reload data after scan
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error running vulnerability scan:', error);
    } finally {
      setScanning(false);
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>{t('cyber.dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          🔒 {t('cyber.dashboard.title')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          {t('cyber.dashboard.subtitle')}
        </p>
      </div>

      {/* Risk Score Card */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '0.75rem', 
        padding: '1.5rem', 
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{t('cyber.dashboard.riskScore')}</h2>
          <button
            onClick={runVulnerabilityScan}
            disabled={scanning}
            style={{
              backgroundColor: scanning ? '#9ca3af' : '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: scanning ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {scanning ? t('cyber.dashboard.scanning') : t('cyber.dashboard.runScans')}
          </button>
        </div>
        
        {riskScore && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: getRiskScoreColor(riskScore.overall),
              textAlign: 'center',
              minWidth: '120px'
            }}>
              {Math.round(riskScore.overall)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {t('cyber.dashboard.overallRiskScore')}
                </span>
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: riskScore.trend === 'improving' ? '#dcfce7' : 
                                 riskScore.trend === 'degrading' ? '#fee2e2' : '#f3f4f6',
                  color: riskScore.trend === 'improving' ? '#166534' : 
                        riskScore.trend === 'degrading' ? '#991b1b' : '#374151'
                }}>
                  {riskScore.trend}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {t('cyber.dashboard.riskBasis')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        {kpis.map((kpi, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                {kpi.kpi.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {kpi.value}
                {kpi.meta?.unit && (
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.25rem' }}>
                    {kpi.meta.unit}
                  </span>
                )}
              </div>
            </div>
            {kpi.target && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Target: {kpi.target} {kpi.meta?.unit || ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vulnerabilities Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          {t('cyber.dashboard.recentVulns')}
        </h2>
        
        {vulnerabilities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <p>{t('cyber.dashboard.noVulns')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>{t('cyber.common.title')}</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>{t('cyber.common.severity')}</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>{t('cyber.dashboard.package')}</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>{t('cyber.common.source')}</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>{t('cyber.dashboard.riskScore2')}</th>
                </tr>
              </thead>
              <tbody>
                {vulnerabilities.map((vuln) => (
                  <tr key={vuln.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>{vuln.title}</div>
                      {vuln.description && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {vuln.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: getSeverityColor(vuln.severity) + '20',
                        color: getSeverityColor(vuln.severity)
                      }}>
                        {vuln.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                      {vuln.package && vuln.version ? `${vuln.package}@${vuln.version}` : vuln.package || '—'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {vuln.source}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                      {vuln.risk_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cybersecurity 101 Reference Diagram */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginTop: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          📚 {t('cyber.dashboard.reference.title')}
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {t('cyber.dashboard.reference.subtitle')}
        </p>
        
        {/* Cybersecurity 101 Visual Diagram + Content */}
        <div style={{ 
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>

          {/* Threat Categories Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Top 15 Threats */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ color: '#059669', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                🎯 {t('cyber.dashboard.reference.top15')}
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                  <div key={n}>{n}. {t(`cyber.dashboard.reference.threat${n}`)}</div>
                ))}
              </div>
            </div>

            {/* CIA Triad */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ color: '#dc2626', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                🔺 {t('cyber.dashboard.reference.ciaTriad')}
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  {t('cyber.dashboard.reference.confidentiality')}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  {t('cyber.dashboard.reference.integrity')}
                </div>
                <div>
                  {t('cyber.dashboard.reference.availability')}
                </div>
              </div>
            </div>

            {/* Defense Mechanisms */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ color: '#2563eb', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                🛡️ {t('cyber.dashboard.reference.defenseLayers')}
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div>{t('cyber.dashboard.reference.physical')}</div>
                <div>{t('cyber.dashboard.reference.perimeter')}</div>
                <div>{t('cyber.dashboard.reference.policies')}</div>
                <div>{t('cyber.dashboard.reference.internalNetwork')}</div>
                <div>{t('cyber.dashboard.reference.host')}</div>
                <div>{t('cyber.dashboard.reference.application')}</div>
                <div>{t('cyber.dashboard.reference.data')}</div>
              </div>
            </div>

            {/* Frameworks */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ color: '#7c3aed', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                📋 {t('cyber.dashboard.reference.keyFrameworks')}
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  {t('cyber.dashboard.reference.nistCsf')}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  {t('cyber.dashboard.reference.zeroTrust')}
                </div>
                <div>
                  {t('cyber.dashboard.reference.cyberMesh')}
                </div>
              </div>
            </div>
          </div>

          {/* Key Statistics */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#dc2626', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              📊 {t('cyber.dashboard.reference.whyMatters')}
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '1rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>$4.35M</div>
                <div>{t('cyber.dashboard.reference.avgCost')}</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>579→1287</div>
                <div>{t('cyber.dashboard.reference.passwordAttacks')}</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>65T</div>
                <div>{t('cyber.dashboard.reference.signalsAnalyzed')}</div>
              </div>
            </div>
          </div>

          {/* Cybersecurity 101 Diagram Image moved to bottom */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <img 
              src="/images/cybersecurity-101-diagram.png" 
              alt="Cybersecurity 101 Comprehensive Diagram"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
