import React, { useState, useEffect } from 'react';
import descriptor from '../configs/agents/council-agent.json'; // Corrected import path

const Overview = () => {
  const [stats, setStats] = useState({
    totalDeliberations: 0,
    personasUsed: 0,
    briefsPublished: 0,
    challengesRequested: 0,
    avgDiversityScore: 0.0
  });

  useEffect(() => {
    // Load Council stats from API
    fetch('/agents/council/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(error => console.error("Failed to fetch Council stats:", error));
  }, []);

  return (
    <div className="p-6">
      <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🏛️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{descriptor.name}</h2>
            <p className="text-purple-100">{descriptor.description}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliberations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDeliberations}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm">🏛️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Personas Used</p>
              <p className="text-2xl font-bold text-gray-900">{stats.personasUsed}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Briefs Published</p>
              <p className="text-2xl font-bold text-gray-900">{stats.briefsPublished}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-sm">📄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Diversity Score</p>
              <p className="text-2xl font-bold text-gray-900">{(stats.avgDiversityScore * 100).toFixed(1)}%</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-sm">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs">🔍</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Multi-Persona Deliberation</h4>
              <p className="text-sm text-gray-600">Debate topics from diverse perspectives including Security, Ethics, Finance, and Policy lenses</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-xs">🛡️</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Safety Gates</h4>
              <p className="text-sm text-gray-600">Built-in harm detection and content filtering to ensure responsible AI usage</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-xs">📊</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Auditable Briefs</h4>
              <p className="text-sm text-gray-600">Complete audit trail with attestation hashes for transparency and compliance</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600 text-xs">🔗</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Integration Ready</h4>
              <p className="text-sm text-gray-600">Publish directly to Slack and Confluence with customizable templates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Personas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Personas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {descriptor.personas.map((persona, index) => (
            <div key={persona.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xs">{persona.lens.charAt(0)}</span>
                </div>
                <h4 className="font-medium text-gray-900">{persona.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{persona.lens} • {persona.region}</p>
              <p className="text-xs text-gray-500">{persona.expertise_tags}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MCP Integration Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-sm">🔌</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">MCP Integration</h3>
        </div>
        <p className="text-gray-700 mb-3">
          The Council Agent supports Model Context Protocol (MCP) for seamless integration with external AI systems and tools.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">council.generate</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">publish.slack</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">publish.confluence</span>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Overview;
