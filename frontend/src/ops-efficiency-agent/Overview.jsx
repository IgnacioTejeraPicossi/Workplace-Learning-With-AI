import React, { useState, useEffect } from 'react';
import agentDescriptor from '../configs/agents/ops-efficiency-agent.json';

const Overview = () => {
  const [stats, setStats] = useState({
    total_invoices: 0,
    auto_approved: 0,
    manual_hold: 0,
    total_allocations: 0,
    posted_allocations: 0,
    total_candidates: 0,
    ranked_candidates: 0,
    avg_confidence: 0.0
  });
  const [health, setHealth] = useState({
    status: 'unknown',
    erp_connected: false,
    ats_connected: false,
    slack_connected: false,
    sheets_connected: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchStats(), fetchHealth()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchJsonSafe = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return null; // caller handles fallback
    }
  };

  const fetchStats = async () => {
    // Prefer /agents/ops; fallback to /agents/opsx
    const data = await (fetchJsonSafe('/agents/ops/stats') || fetchJsonSafe('/agents/opsx/stats'));
    if (data) setStats(data);
  };

  const fetchHealth = async () => {
    const data = await (fetchJsonSafe('/agents/ops/health') || fetchJsonSafe('/agents/opsx/health'));
    if (data) setHealth(data);
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  };

  const StatCard = ({ title, value, subtitle, icon }) => (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ padding: 12, borderRadius: 9999, background: '#e0e7ff', marginRight: 12 }}>
          <span style={{ color: '#2563eb', fontSize: 18 }}>{icon}</span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{title}</p>
          <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{value}</p>
          {subtitle && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const HealthIndicator = ({ label, connected }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'white', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 12, height: 12, borderRadius: 9999, marginRight: 8, background: connected ? '#22c55e' : '#ef4444' }}></div>
        <span style={{ fontSize: 12, color: '#64748b' }}>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>Loading...</div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Hero */}
        <div style={{ borderRadius: 16, padding: 24, color: 'white', background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 9999, background: 'rgba(255,255,255,0.2)', marginRight: 12 }}>
              <span style={{ fontSize: 22 }}>⚙️</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{agentDescriptor.name}</h2>
              <p style={{ margin: '6px 0 0', opacity: 0.9 }}>{agentDescriptor.description}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ padding: '6px 10px', background: '#dcfce7', color: '#047857', borderRadius: 999, fontSize: 12 }}>MCP Enabled</span>
            <span style={{ padding: '6px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, fontSize: 12 }}>v{agentDescriptor.version}</span>
            <span style={{ padding: '6px 10px', background: health.status === 'healthy' ? '#dcfce7' : '#fef3c7', color: health.status === 'healthy' ? '#047857' : '#92400e', borderRadius: 999, fontSize: 12 }}>{health.status === 'healthy' ? 'Healthy' : 'Degraded'}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <StatCard title="Total Invoices" value={stats.total_invoices} subtitle={`${stats.auto_approved} auto-approved`} icon="📄" />
          <StatCard title="Manual Holds" value={stats.manual_hold} subtitle="Requiring review" icon="⚠️" />
          <StatCard title="Cost Allocations" value={stats.total_allocations} subtitle={`${stats.posted_allocations} posted`} icon="💰" />
          <StatCard title="Candidates Ranked" value={stats.total_candidates} subtitle={`${(stats.avg_confidence * 100).toFixed(1)}% avg confidence`} icon="👥" />
        </div>

        {/* Health & Capabilities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>System Health</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <HealthIndicator label="ERP System" connected={health.erp_connected} />
              <HealthIndicator label="ATS System" connected={health.ats_connected} />
              <HealthIndicator label="Slack Notifications" connected={health.slack_connected} />
              <HealthIndicator label="Google Sheets" connected={health.sheets_connected} />
            </div>
          </div>

          <div style={card}>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Capabilities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {agentDescriptor.capabilities.map((capability, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', padding: 8, background: '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: '#334155' }}>{capability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={card}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { icon: '📄', label: 'Process Invoice' },
              { icon: '💰', label: 'Suggest Allocation' },
              { icon: '👥', label: 'Rank Candidates' }
            ].map((a) => (
              <button key={a.label} style={{ padding: 16, borderRadius: 12, border: '2px dashed #cbd5e1', background: 'white', cursor: 'pointer' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 20, marginBottom: 6 }}>{a.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{a.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
