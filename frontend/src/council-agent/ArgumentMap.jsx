import React, { useState, useEffect } from 'react';

const ArgumentMap = () => {
  const [deliberations, setDeliberations] = useState([]);
  const [selectedDeliberation, setSelectedDeliberation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliberations();
  }, []);

  const loadDeliberations = async () => {
    try {
      const response = await fetch('/agents/council/runs?limit=20');
      if (response.ok) {
        const data = await response.json();
        setDeliberations(data.items || data || []);
      }
    } catch (error) {
      console.error("Failed to load deliberations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliberationDetails = async (runId) => {
    try {
      const response = await fetch(`/agents/council/deliberation/${runId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedDeliberation(data);
      }
    } catch (error) {
      console.error("Failed to load deliberation details:", error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getConsensusStrength = (agreements, disagreements) => {
    const total = agreements + disagreements;
    if (total === 0) return 0;
    return agreements / total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Argument Map</h2>
          <p className="text-gray-600">Visualize agreements, disagreements, and unknowns across deliberations</p>
        </div>
        <button
          onClick={loadDeliberations}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Deliberations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliberations</h3>
        <div className="space-y-3">
          {deliberations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No deliberations found</p>
          ) : (
            deliberations.map((deliberation, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => loadDeliberationDetails(deliberation.run_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{deliberation.run_id}</h4>
                    <p className="text-sm text-gray-600">
                      {deliberation.created_at ? new Date(deliberation.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deliberation.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      deliberation.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deliberation.status}
                    </span>
                    {deliberation.attestation_hash && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        Attested
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Deliberation Details */}
      {selectedDeliberation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Argument Analysis</h3>
          
          {/* Consensus Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-900">Agreements</h4>
                <span className="text-2xl font-bold text-green-600">
                  {selectedDeliberation.agreements?.length || 0}
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Areas of consensus
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-red-900">Disagreements</h4>
                <span className="text-2xl font-bold text-red-600">
                  {selectedDeliberation.disagreements?.length || 0}
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Areas of conflict
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-yellow-900">Unknowns</h4>
                <span className="text-2xl font-bold text-yellow-600">
                  {selectedDeliberation.unknowns?.length || 0}
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Areas needing research
              </p>
            </div>
          </div>

          {/* Persona Scores */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Persona Performance Scores</h4>
            <div className="space-y-3">
              {selectedDeliberation.persona_arguments?.map((persona, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{persona.persona_name}</h5>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(persona.scores.final)}`}>
                        Final: {(persona.scores.final * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-600">Relevance</div>
                      <div className={`px-2 py-1 rounded ${getScoreColor(persona.scores.relevance)}`}>
                        {(persona.scores.relevance * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Quality</div>
                      <div className={`px-2 py-1 rounded ${getScoreColor(persona.scores.quality)}`}>
                        {(persona.scores.quality * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Diversity</div>
                      <div className={`px-2 py-1 rounded ${getScoreColor(persona.scores.diversity)}`}>
                        {(persona.scores.diversity * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Harm Risk</div>
                      <div className={`px-2 py-1 rounded ${getScoreColor(1 - persona.scores.harm)}`}>
                        {(persona.scores.harm * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Arguments */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Detailed Arguments</h4>
            
            {/* Agreements */}
            {selectedDeliberation.agreements?.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Agreements</h5>
                <ul className="space-y-2">
                  {selectedDeliberation.agreements.map((agreement, index) => (
                    <li key={index} className="text-sm text-green-700">
                      <div className="flex items-center justify-between">
                        <span>{agreement.statement}</span>
                        <span className="text-xs text-green-600">
                          Confidence: {(agreement.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Disagreements */}
            {selectedDeliberation.disagreements?.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h5 className="font-medium text-red-900 mb-2">Disagreements</h5>
                <ul className="space-y-2">
                  {selectedDeliberation.disagreements.map((disagreement, index) => (
                    <li key={index} className="text-sm text-red-700">
                      <div className="flex items-center justify-between">
                        <span>{disagreement.statement}</span>
                        <span className="text-xs text-red-600">
                          Confidence: {(disagreement.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Unknowns */}
            {selectedDeliberation.unknowns?.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="font-medium text-yellow-900 mb-2">Unknowns</h5>
                <ul className="space-y-2">
                  {selectedDeliberation.unknowns.map((unknown, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      <div className="flex items-center justify-between">
                        <span>{unknown.statement}</span>
                        <span className="text-xs text-yellow-600">
                          Uncertainty: {(unknown.uncertainty_level * 100).toFixed(0)}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArgumentMap;
