import React, { useState, useEffect } from 'react';

const Policies = () => {
  const [policy, setPolicy] = useState({
    max_auto_impact: 1000,
    sod_required_roles: ['controller', 'procurement-approver'],
    confidence_threshold: 0.7,
    severity_threshold: 0.5,
    materiality_threshold: 0.3
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const response = await fetch('/agents/grc/policy');
      if (response.ok) {
        const data = await response.json();
        setPolicy(data);
      }
    } catch (error) {
      console.error("Failed to load policy:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const response = await fetch('/agents/grc/policy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policy)
      });

      if (response.ok) {
        alert('Policy updated successfully!');
      } else {
        alert('Failed to update policy');
      }
    } catch (error) {
      console.error("Failed to save policy:", error);
      alert('Error saving policy');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdChange = (key, value) => {
    setPolicy(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
  };

  const handleRoleChange = (index, value) => {
    const newRoles = [...policy.sod_required_roles];
    newRoles[index] = value;
    setPolicy(prev => ({
      ...prev,
      sod_required_roles: newRoles
    }));
  };

  const addRole = () => {
    setPolicy(prev => ({
      ...prev,
      sod_required_roles: [...prev.sod_required_roles, '']
    }));
  };

  const removeRole = (index) => {
    setPolicy(prev => ({
      ...prev,
      sod_required_roles: prev.sod_required_roles.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">GRC Policies</h2>
        <p className="text-gray-600">Configure Responsible AI guardrails, thresholds, and approval workflows</p>
      </div>

      {/* Policy Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Configuration</h3>
        
        <div className="space-y-6">
          {/* Thresholds */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Risk Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Threshold
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={policy.confidence_threshold}
                    onChange={(e) => handleThresholdChange('confidence_threshold', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {(policy.confidence_threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum confidence for auto-execution</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Threshold
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={policy.severity_threshold}
                    onChange={(e) => handleThresholdChange('severity_threshold', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {(policy.severity_threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum severity for action</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materiality Threshold
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={policy.materiality_threshold}
                    onChange={(e) => handleThresholdChange('materiality_threshold', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {(policy.materiality_threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum materiality for action</p>
              </div>
            </div>
          </div>

          {/* Auto Impact Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Auto Impact (€)
            </label>
            <input
              type="number"
              value={policy.max_auto_impact}
              onChange={(e) => setPolicy(prev => ({ ...prev, max_auto_impact: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum monetary impact for automatic execution</p>
          </div>

          {/* Separation of Duties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Separation of Duties - Required Roles
            </label>
            <div className="space-y-2">
              {policy.sod_required_roles.map((role, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleRoleChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role name"
                  />
                  <button
                    onClick={() => removeRole(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Role
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Roles required for approval of high-impact actions</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={savePolicy}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      </div>

      {/* Policy Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Policy Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>These policies ensure Responsible AI principles are maintained:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>Provenance:</strong> All actions are tracked with full audit trails</li>
                <li><strong>Separation of Duties:</strong> High-impact actions require multiple approvals</li>
                <li><strong>Confidence Thresholds:</strong> Only high-confidence decisions are auto-executed</li>
                <li><strong>PII Minimization:</strong> Personal data is handled according to privacy policies</li>
                <li><strong>Attestation:</strong> All executions are cryptographically attested</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
