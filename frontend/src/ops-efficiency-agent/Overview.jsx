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
    fetchStats();
    fetchHealth();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/agents/opsx/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/agents/opsx/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <span className={`text-${color}-600 text-xl`}>{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const HealthIndicator = ({ label, status, connected }) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <span className="text-blue-600 text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agentDescriptor.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{agentDescriptor.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            MCP Enabled
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            v{agentDescriptor.version}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            health.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Invoices"
          value={stats.total_invoices}
          subtitle={`${stats.auto_approved} auto-approved`}
          icon="📄"
          color="blue"
        />
        <StatCard
          title="Manual Holds"
          value={stats.manual_hold}
          subtitle="Requiring review"
          icon="⚠️"
          color="yellow"
        />
        <StatCard
          title="Cost Allocations"
          value={stats.total_allocations}
          subtitle={`${stats.posted_allocations} posted`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Candidates Ranked"
          value={stats.total_candidates}
          subtitle={`${(stats.avg_confidence * 100).toFixed(1)}% avg confidence`}
          icon="👥"
          color="purple"
        />
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <HealthIndicator label="ERP System" status={health.status} connected={health.erp_connected} />
            <HealthIndicator label="ATS System" status={health.status} connected={health.ats_connected} />
            <HealthIndicator label="Slack Notifications" status={health.status} connected={health.slack_connected} />
            <HealthIndicator label="Google Sheets" status={health.status} connected={health.sheets_connected} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Capabilities</h3>
          <div className="grid grid-cols-2 gap-3">
            {agentDescriptor.capabilities.map((capability, index) => (
              <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">📄</span>
              <span className="text-sm font-medium text-gray-700">Process Invoice</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">💰</span>
              <span className="text-sm font-medium text-gray-700">Suggest Allocation</span>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">👥</span>
              <span className="text-sm font-medium text-gray-700">Rank Candidates</span>
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Overview;
