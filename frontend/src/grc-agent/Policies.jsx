import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Policies = () => {
  const { t } = useTranslation();
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
        alert(t('grcAgentModule.policyUpdatedOk'));
      } else {
        alert(t('grcAgentModule.policyUpdateFail'));
      }
    } catch (error) {
      console.error("Failed to save policy:", error);
      alert(t('grcAgentModule.policySaveError'));
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
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('grcAgentModule.policiesTitle')}</h2>
        <p className="text-gray-600">{t('grcAgentModule.policiesSubtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('grcAgentModule.policyConfiguration')}</h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">{t('grcAgentModule.riskThresholds')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('grcAgentModule.labelConfidenceThreshold')}
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
                <p className="text-xs text-gray-500 mt-1">{t('grcAgentModule.hintConfidenceThreshold')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('grcAgentModule.labelSeverityThreshold')}
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
                <p className="text-xs text-gray-500 mt-1">{t('grcAgentModule.hintSeverityThreshold')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('grcAgentModule.labelMaterialityThreshold')}
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
                <p className="text-xs text-gray-500 mt-1">{t('grcAgentModule.hintMaterialityThreshold')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('grcAgentModule.labelMaxAutoImpact')}
            </label>
            <input
              type="number"
              value={policy.max_auto_impact}
              onChange={(e) => setPolicy(prev => ({ ...prev, max_auto_impact: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
            />
            <p className="text-xs text-gray-500 mt-1">{t('grcAgentModule.hintMaxAutoImpact')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('grcAgentModule.labelSodRoles')}
            </label>
            <div className="space-y-2">
              {policy.sod_required_roles.map((role, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleRoleChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('grcAgentModule.placeholderRole')}
                  />
                  <button
                    type="button"
                    onClick={() => removeRole(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    {t('grcAgentModule.remove')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('grcAgentModule.addRole')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('grcAgentModule.hintSodRoles')}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={savePolicy}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('grcAgentModule.saving') : t('grcAgentModule.savePolicy')}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">{t('grcAgentModule.policyInfoTitle')}</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>{t('grcAgentModule.policyInfoIntro')}</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>{t('grcAgentModule.policyBulletProvenance')}</li>
                <li>{t('grcAgentModule.policyBulletSod')}</li>
                <li>{t('grcAgentModule.policyBulletConfidence')}</li>
                <li>{t('grcAgentModule.policyBulletPii')}</li>
                <li>{t('grcAgentModule.policyBulletAttestation')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
