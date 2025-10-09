import React, { useEffect, useState } from 'react';
import descriptor from '../configs/agents/telco-ops-agent.json';

const Overview = () => {
  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    lastRun: null,
    autoExecutions: 0,
    oneClickApprovals: 0
  });

  useEffect(() => {
    // Load stats from API
    fetch('/api/agent-runs')
      .then((res) => res.json())
      .then((data) => {
        // Extract items from response and filter runs for ops module
        const allRuns = data.items || [];
        const opsRuns = allRuns.filter(run => run.module === 'ops');
        const total = opsRuns.length;
        const successful = opsRuns.filter((r) => r.status === 'DONE').length;
        const successRate = total > 0 ? (successful / total) * 100 : 0;
        const lastRun = opsRuns[0];
        
        // Count execution modes (mock data for now)
        const autoExecutions = opsRuns.filter((r) => r.bundle?.mode === 'auto').length;
        const oneClickApprovals = opsRuns.filter((r) => r.bundle?.mode === 'one_click').length;

        setStats({
          totalRuns: total,
          successRate: successRate.toFixed(1),
          lastRun: lastRun?.started_at,
          autoExecutions,
          oneClickApprovals
        });
      })
      .catch((err) => console.error('Failed to load stats:', err));
  }, []);

  const StatCard = ({ label, value, icon, color }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div
            className={`text-4xl bg-gradient-to-br ${colorClasses[color]} p-4 rounded-2xl shadow-lg`}
          >
            <span className="filter drop-shadow-lg">{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center space-x-4 mb-4">
          <div className="text-5xl">📡</div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{descriptor.name}</h1>
            <p className="text-blue-100 text-lg">
              Data-driven telco operations with TMF APIs and safe autonomy
            </p>
          </div>
        </div>
        <p className="text-white/90 mt-4">
          {descriptor.description}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          label="Total Runs"
          value={stats.totalRuns}
          icon="🔄"
          color="blue"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate}%`}
          icon="✅"
          color="green"
        />
        <StatCard
          label="Auto Executions"
          value={stats.autoExecutions}
          icon="🤖"
          color="purple"
        />
        <StatCard
          label="One-Click Approvals"
          value={stats.oneClickApprovals}
          icon="👆"
          color="orange"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Capabilities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-gray-900">Capabilities</h2>
          </div>
          <div className="space-y-3">
            {descriptor.capabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
              >
                <span className="text-xl">
                  {cap.includes('order') ? '📦' :
                   cap.includes('subscription') ? '📋' :
                   cap.includes('appointment') ? '📅' :
                   cap.includes('comm') ? '📧' :
                   cap.includes('crm') ? '🎫' : '🔧'}
                </span>
                <span className="text-sm font-medium text-gray-700">{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Integrations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🔌</span>
            <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(descriptor.integrations).map(([key, value], i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {key.includes('tmf622') ? '📦' :
                     key.includes('tmf679') ? '✅' :
                     key.includes('appoint') ? '📅' :
                     key.includes('comm') ? '📧' :
                     key.includes('crm') ? '🎫' : '🔧'}
                  </span>
                  <span className="font-medium text-gray-700">{key.toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-500">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">✨</span>
          <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {descriptor.features.map((feature, i) => (
            <div
              key={i}
              className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
            >
              <span className="text-blue-500 mt-1">✓</span>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Info */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">🛡️</span>
          <h2 className="text-xl font-bold">Policy Guardrails</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-white/90 mb-2">Max Auto Value: €{descriptor.policy.max_auto_value}</p>
            <p className="text-white/90 mb-2">Confidence Threshold: {descriptor.policy.confidence_threshold * 100}%</p>
          </div>
          <div>
            <p className="text-white/90 mb-2">Risk Threshold: {descriptor.policy.risk_threshold}%</p>
            <p className="text-white/90">Approval Roles: {descriptor.policy.required_approval_roles.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
