import React, { useEffect, useState } from 'react';
import descriptor from '../configs/agents/ea-second-brain.json';

const Overview = () => {
  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    lastRun: null,
  });

  useEffect(() => {
    // Load stats from API
    fetch('/agents/ea/runs?limit=100')
      .then((res) => res.json())
      .then((runs) => {
        const total = runs.length;
        const successful = runs.filter((r) => r.status === 'DONE').length;
        const successRate = total > 0 ? (successful / total) * 100 : 0;
        const lastRun = runs[0];

        setStats({
          totalRuns: total,
          successRate: successRate.toFixed(1),
          lastRun: lastRun?.created_at,
        });
      })
      .catch((err) => console.error('Failed to load stats:', err));
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-6xl">🧠</div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{descriptor.name}</h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                Ketil's 24/7 Enterprise Architecture watcher for Norwegian
              </p>
            </div>
          </div>
          <p className="text-white/90 leading-relaxed mt-4">
            {descriptor.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <StatCard
            label="Total Runs"
            value={stats.totalRuns}
            icon="▶️"
            color="blue"
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            icon="✅"
            color="green"
          />
          <StatCard
            label="Capabilities"
            value={descriptor.capabilities.length}
            icon="⚡"
            color="purple"
          />
        </div>

        {/* Capabilities Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">⚡</span>
            <h2 className="text-2xl font-bold text-gray-900">Capabilities</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {descriptor.capabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-all duration-200 border border-blue-100"
              >
                <div className="text-3xl bg-white p-3 rounded-lg shadow-sm">
                  {cap.includes('jira')
                    ? '📋'
                    : cap.includes('slack')
                    ? '💬'
                    : cap.includes('confluence')
                    ? '📝'
                    : '📊'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{cap.split('.')[0]}</p>
                  <p className="text-sm text-gray-600">{cap.split('.')[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">📊</span>
            <h2 className="text-2xl font-bold text-gray-900">Data Sources</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Internal Sources</h3>
              </div>
              <div className="space-y-3">
                {descriptor.sources.internal.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <span className="text-green-600">✓</span>
                    <span className="text-sm font-medium text-gray-700">{source}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-2xl">🌐</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">External Sources (Open Data)</h3>
              </div>
              <div className="space-y-3">
                {descriptor.sources.external.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <span className="text-blue-600">✓</span>
                    <span className="text-sm font-medium text-gray-700">{source}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">✨</span>
            <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {descriptor.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100"
              >
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">✓</span>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MCP Info Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-4xl">🔌</span>
            <h2 className="text-2xl font-bold">Model Context Protocol (MCP)</h2>
          </div>
          <p className="text-white/90 mb-6 leading-relaxed">
            This agent supports MCP for standardized tool execution and interoperability with other AI systems
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-xs text-white/70 mb-2">Endpoint:</p>
            <code className="text-sm text-white font-mono">{descriptor.mcp.endpoint}</code>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {descriptor.mcp.tools.map((tool, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-sm font-semibold">{tool.name}</p>
              </div>
            ))}
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
    purple: 'from-purple-500 to-purple-600',
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

export default Overview;

