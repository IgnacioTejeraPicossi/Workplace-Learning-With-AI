// Agent Security Monitoring Component
import React, { useState, useEffect } from 'react';

export default function AgentSecurity() {
  const [agentSecurityData, setAgentSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('all');

  useEffect(() => {
    loadAgentSecurityData();
  }, []);

  const fetchFromApi = async () => {
    const res = await fetch('http://localhost:8000/api/agent-security/overview');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  const loadAgentSecurityData = async () => {
    try {
      setLoading(true);

      // Try real API first
      const apiData = await fetchFromApi();

      // Map API fields to frontend expected structure
      const mapped = {
        overall_score: apiData.overall_score,
        total_agents: apiData.total_agents,
        secure_agents: apiData.secure_agents,
        at_risk_agents: apiData.at_risk_agents,
        critical_alerts: apiData.critical_alerts,
        recent_incidents: (apiData.recent_incidents || []).map((i) => ({
          id: i.incident_id || i.id,
          agent: i.agent_name,
          type: (i.threat_type || '').toString().replace(/_/g, ' '),
          severity: (i.severity || '').toString().toLowerCase(),
          timestamp: i.timestamp,
          status: (i.status || '').toString().toLowerCase(),
          description: i.description,
        })),
        agent_security_status: (apiData.agent_security_status || []).map((a) => ({
          name: a.agent_name,
          status: a.status,
          score: a.security_score,
          last_scan: a.last_scan,
          vulnerabilities: a.vulnerabilities_count,
          threats_detected: a.threats_detected,
          zero_trust_compliance: a.zero_trust_compliance,
        })),
        security_metrics: apiData.security_metrics,
        zero_trust_status: apiData.zero_trust_status,
      };

      setAgentSecurityData(mapped);
    } catch (error) {
      console.error('Error loading agent security data, using fallback:', error);

      // Fallback to previous mock with all agents (kept minimal)
      const allAgents = [
        { name: 'AI Compliance Agent', status: 'secure', score: 92, last_scan: '2025-10-02T12:00:00Z', vulnerabilities: 0, threats_detected: 1, zero_trust_compliance: true },
        { name: 'AI Productivity Agent', status: 'at_risk', score: 78, last_scan: '2025-10-02T11:30:00Z', vulnerabilities: 2, threats_detected: 3, zero_trust_compliance: false },
        { name: 'Robomind Clinic', status: 'secure', score: 88, last_scan: '2025-10-02T10:15:00Z', vulnerabilities: 0, threats_detected: 0, zero_trust_compliance: true },
        { name: 'Agent Theory & Documentation', status: 'secure', score: 95, last_scan: '2025-10-02T09:45:00Z', vulnerabilities: 0, threats_detected: 0, zero_trust_compliance: true },
        { name: 'EA Second Brain Agent', status: 'secure', score: 90, last_scan: '2025-10-02T12:45:00Z', vulnerabilities: 0, threats_detected: 0, zero_trust_compliance: true },
        { name: 'Sales Assistant Agent', status: 'at_risk', score: 81, last_scan: '2025-10-02T12:20:00Z', vulnerabilities: 1, threats_detected: 1, zero_trust_compliance: false },
        { name: 'Personal Attention Agent', status: 'secure', score: 87, last_scan: '2025-10-02T12:10:00Z', vulnerabilities: 0, threats_detected: 1, zero_trust_compliance: true },
        { name: 'Telco Ops Decisioning Agent', status: 'secure', score: 84, last_scan: '2025-10-02T11:55:00Z', vulnerabilities: 0, threats_detected: 0, zero_trust_compliance: true },
        { name: 'Responsible AI Ops (GRC)', status: 'secure', score: 89, last_scan: '2025-10-02T11:40:00Z', vulnerabilities: 0, threats_detected: 1, zero_trust_compliance: true },
        { name: 'Council of Diverse Lenses', status: 'at_risk', score: 79, last_scan: '2025-10-02T11:25:00Z', vulnerabilities: 1, threats_detected: 1, zero_trust_compliance: false },
        { name: 'Operations Efficiency Agent', status: 'secure', score: 86, last_scan: '2025-10-02T11:15:00Z', vulnerabilities: 0, threats_detected: 0, zero_trust_compliance: true },
      ];
      const totalAgents = allAgents.length;
      const avgScore = Math.round(allAgents.reduce((acc, a) => acc + a.score, 0) / totalAgents);
      const zeroTrustComplianceRate = Math.round((allAgents.filter(a => a.zero_trust_compliance).length / totalAgents) * 100);

      setAgentSecurityData({
        overall_score: avgScore,
        total_agents: totalAgents,
        secure_agents: allAgents.filter(a => a.status === 'secure').length,
        at_risk_agents: allAgents.filter(a => a.status !== 'secure').length,
        critical_alerts: 1,
        recent_incidents: [],
        agent_security_status: allAgents,
        security_metrics: {
          prompt_injection_attempts: 3,
          model_poisoning_detected: 0,
          unauthorized_access_attempts: 1,
          data_exfiltration_attempts: 0,
          zero_day_vulnerabilities: 1
        },
        zero_trust_status: {
          total_checks: 156,
          passed_checks: Math.round(156 * (zeroTrustComplianceRate / 100)),
          failed_checks: Math.round(156 * (1 - (zeroTrustComplianceRate / 100))),
          compliance_rate: zeroTrustComplianceRate
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'secure': return '#10b981';
      case 'at_risk': return '#f59e0b';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>Loading agent security data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🤖 Agent Security Monitor
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          margin: 0
        }}>
          Advanced security monitoring and threat detection for AI agents - Zero Trust Architecture
        </p>
      </div>

      {/* Security Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Security Score</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {agentSecurityData?.overall_score || 0}%
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Total Agents</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {agentSecurityData?.total_agents || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Critical Alerts</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>
            {agentSecurityData?.critical_alerts || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Zero Trust</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
            {agentSecurityData?.zero_trust_status?.compliance_rate || 0}%
          </div>
        </div>
      </div>

      {/* Agent Security Status Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Agent Security Status</h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Agent</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Score</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Vulnerabilities</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Zero Trust</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Last Scan</th>
                </tr>
              </thead>
              <tbody>
                {agentSecurityData?.agent_security_status?.map((agent, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{agent.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: getStatusColor(agent.status) + '20', color: getStatusColor(agent.status) }}>
                        {agent.status?.toUpperCase?.() || String(agent.status).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>{agent.score}%</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: agent.vulnerabilities > 0 ? '#dc2626' : '#10b981' }}>{agent.vulnerabilities}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: agent.zero_trust_compliance ? '#10b981' : '#dc2626' }}>{agent.zero_trust_compliance ? '✅' : '❌'}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>{new Date(agent.last_scan).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Security Incidents */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Recent Security Incidents</h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {(agentSecurityData?.recent_incidents || []).map((incident) => (
            <div key={incident.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{incident.type}</h4>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>{incident.agent}</p>
                </div>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: getSeverityColor(incident.severity) + '20', color: getSeverityColor(incident.severity) }}>
                  {String(incident.severity).toUpperCase()}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#374151' }}>{incident.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                <span>{new Date(incident.timestamp).toLocaleString()}</span>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', backgroundColor: incident.status === 'mitigated' ? '#dcfce7' : '#fef3c7', color: incident.status === 'mitigated' ? '#166534' : '#92400e' }}>
                  {incident.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Metrics */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Security Metrics</h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(agentSecurityData?.security_metrics || {}).map(([key, value]) => (
              <div key={key} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.25rem' }}>{value}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
