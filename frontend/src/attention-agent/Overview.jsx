import React, { useEffect, useState } from 'react';
import descriptor from '../configs/agents/attention-agent.json';

const Overview = () => {
  const [stats, setStats] = useState({
    activeSources: 0,
    totalSignals: 0,
    totalClusters: 0,
    pendingAlerts: 0,
    recentSignals24h: 0,
    recentClusters24h: 0,
  });

  useEffect(() => {
    // Load stats from API
    fetch('/agents/attention/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error('Failed to load stats:', err));
  }, []);

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-5xl">🎯</div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{descriptor.name}</h1>
              <p className="text-blue-100 text-lg">
                Noise→signal across channels; schedules focus holds and sends actionable briefs
              </p>
            </div>
          </div>
          <p className="text-white/90 mt-4">
            {descriptor.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard
            label="Active Sources"
            value={stats.activeSources}
            icon="📡"
            color="blue"
          />
          <StatCard
            label="Total Signals"
            value={stats.totalSignals}
            icon="📊"
            color="green"
          />
          <StatCard
            label="Pending Alerts"
            value={stats.pendingAlerts}
            icon="🚨"
            color="red"
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
                    {cap.includes('teams')
                      ? '💬'
                      : cap.includes('slack')
                      ? '💬'
                      : cap.includes('calendar')
                      ? '📅'
                      : cap.includes('email')
                      ? '📧'
                      : '🔧'}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Data Sources */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-bold text-gray-900">Data Sources</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">🔒</span>
                  Internal
                </h3>
                <ul className="space-y-2">
                  {descriptor.sources.internal.map((source, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">✓</span>
                      {source}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">🌐</span>
                  External
                </h3>
                <ul className="space-y-2">
                  {descriptor.sources.external.map((source, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">✓</span>
                      {source}
                    </li>
                  ))}
                </ul>
              </div>
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
                className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
              >
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">📈</span>
            <h2 className="text-xl font-bold text-gray-900">Recent Activity (24h)</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">New Signals</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.recentSignals24h}</p>
                </div>
                <div className="text-3xl text-blue-500">📊</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">New Clusters</p>
                  <p className="text-2xl font-bold text-green-900">{stats.recentClusters24h}</p>
                </div>
                <div className="text-3xl text-green-500">🔗</div>
              </div>
            </div>
          </div>
        </div>

        {/* MCP Info */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">🔌</span>
            <h2 className="text-xl font-bold">Model Context Protocol (MCP)</h2>
          </div>
          <p className="text-white/90 mb-4">
            This agent supports MCP for standardized tool execution
          </p>
          <div className="bg-white/10 rounded-lg p-3">
            <code className="text-sm text-white font-mono">
              {descriptor.mcp.endpoint}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div
          className={`text-4xl bg-gradient-to-br ${colorClasses[color]} p-4 rounded-xl shadow-lg`}
        >
          <span className="filter drop-shadow-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default Overview;
