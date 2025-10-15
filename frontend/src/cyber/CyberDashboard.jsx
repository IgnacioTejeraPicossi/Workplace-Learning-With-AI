// Cybersecurity Dashboard Component
import React, { useState, useEffect } from 'react';

export default function CyberDashboard() {
  const [riskScore, setRiskScore] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [riskResponse, kpisResponse, vulnsResponse] = await Promise.all([
        fetch('http://localhost:8000/api/cyber/risk/score'),
        fetch('http://localhost:8000/api/cyber/posture/kpis'),
        fetch('http://localhost:8000/api/cyber/vulnerabilities')
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
      const response = await fetch('http://localhost:8000/api/cyber/vulnerabilities/scan', {
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
        <p>Loading cybersecurity dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
          🔒 Cybersecurity Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Monitor security posture, vulnerabilities, and compliance status
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>Security Risk Score</h2>
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
            {scanning ? 'Scanning...' : 'Run Scans'}
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
                  Overall Risk Score
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
                Based on vulnerabilities, patch latency, and compliance coverage
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
          Recent Vulnerabilities
        </h2>
        
        {vulnerabilities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <p>No vulnerabilities found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Severity</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Package</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Risk Score</th>
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
          📚 Cybersecurity 101 Reference
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Comprehensive overview of cybersecurity concepts, threats, frameworks, and ecosystem
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
                🎯 Top 15 Cybersecurity Threats
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div>1. Ransomware Attacks</div>
                <div>2. IoT Vulnerabilities</div>
                <div>3. State-Sponsored Attacks</div>
                <div>4. Supply Chain Attacks</div>
                <div>5. AI-Powered Attacks</div>
                <div>6. Phishing</div>
                <div>7. Zero-Day Exploits</div>
                <div>8. Cloud Misconfigurations</div>
                <div>9. Home Network Vulnerabilities</div>
                <div>10. Insider Threats</div>
                <div>11. Data Breaches</div>
                <div>12. Data Exfiltration</div>
                <div>13. Malware</div>
                <div>14. DDoS Attacks</div>
                <div>15. Business Email Compromise</div>
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
                🔺 CIA Triad
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Confidentiality:</strong> Ensuring sensitive information is accessed only by authorized individuals
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Integrity:</strong> Maintaining accuracy and completeness of data, preventing unauthorized alterations
                </div>
                <div>
                  <strong>Availability:</strong> Ensuring information and resources are available to authorized users when needed
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
                🛡️ Defense Layers
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div>• Physical: Locks, fences, security guards</div>
                <div>• Perimeter: Firewall, VPN, packet filters</div>
                <div>• Policies: Password policies, data classification</div>
                <div>• Internal Network: Firewall, intrusion detection</div>
                <div>• Host: OS patches, malware protection</div>
                <div>• Application: SSO, authentication</div>
                <div>• Data: Database security, encryption</div>
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
                📋 Key Frameworks
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>NIST CSF 2.0:</strong> Govern, Identify, Protect, Detect, Respond, Recover
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Zero Trust:</strong> Verify every access attempt
                </div>
                <div>
                  <strong>Cybersecurity Mesh:</strong> Distributed security architecture
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
              📊 Why Cybersecurity Matters
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '1rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>$4.35M</div>
                <div>Average cost of data breach (2022)</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>579→1287</div>
                <div>Password attacks per second (since Sep 2021)</div>
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>65T</div>
                <div>Signals analyzed daily by Microsoft</div>
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
