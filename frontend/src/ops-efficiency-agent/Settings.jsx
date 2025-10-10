import React, { useState, useEffect } from 'react';
import agentDescriptor from '../configs/agents/ops-efficiency-agent.json';

const Settings = () => {
  const [settings, setSettings] = useState({
    max_auto_amount: 500,
    min_confidence_auto: 0.8,
    auto_approval_threshold: 1000,
    variance_threshold: 0.05,
    erp_base_url: '',
    erp_bearer_token: '',
    slack_bot_token: '',
    ats_provider: 'local',
    ats_base_url: '',
    ats_token: '',
    graph_bearer_token: '',
    graph_user_id: 'me',
    sheets_spreadsheet_id: ''
  });
  const [health, setHealth] = useState({
    erp_connected: false,
    ats_connected: false,
    slack_connected: false,
    sheets_connected: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/agents/opsx/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production, this would save to backend
      console.log('Saving settings:', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type) => {
    setLoading(true);
    try {
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newHealth = { ...health };
      newHealth[`${type}_connected`] = true;
      setHealth(newHealth);
      
      alert(`${type.toUpperCase()} connection test successful!`);
    } catch (error) {
      alert(`${type.toUpperCase()} connection test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const ConnectionStatus = ({ label, connected, onTest }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <button
        onClick={onTest}
        disabled={loading}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
        <p className="text-lg text-gray-600 mt-2">Configure thresholds, integrations, and automation rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thresholds */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Automation Thresholds</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Auto Amount (NOK)
              </label>
              <input
                type="number"
                value={settings.max_auto_amount}
                onChange={(e) => handleInputChange('max_auto_amount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount for automatic approval without manual review
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Confidence for Auto (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.min_confidence_auto}
                onChange={(e) => handleInputChange('min_confidence_auto', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence score for automatic processing
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Approval Threshold (NOK)
              </label>
              <input
                type="number"
                value={settings.auto_approval_threshold}
                onChange={(e) => handleInputChange('auto_approval_threshold', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount threshold for automatic invoice approval
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variance Threshold (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={settings.variance_threshold}
                onChange={(e) => handleInputChange('variance_threshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum acceptable variance percentage for 3-way match
              </p>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Integration Status</h2>
          <div className="space-y-4">
            <ConnectionStatus
              label="ERP System"
              connected={health.erp_connected}
              onTest={() => handleTestConnection('erp')}
            />
            <ConnectionStatus
              label="ATS System"
              connected={health.ats_connected}
              onTest={() => handleTestConnection('ats')}
            />
            <ConnectionStatus
              label="Slack Notifications"
              connected={health.slack_connected}
              onTest={() => handleTestConnection('slack')}
            />
            <ConnectionStatus
              label="Google Sheets"
              connected={health.sheets_connected}
              onTest={() => handleTestConnection('sheets')}
            />
          </div>
        </div>

        {/* ERP Configuration */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">ERP Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ERP Base URL
              </label>
              <input
                type="url"
                value={settings.erp_base_url}
                onChange={(e) => handleInputChange('erp_base_url', e.target.value)}
                placeholder="https://erp.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ERP Bearer Token
              </label>
              <input
                type="password"
                value={settings.erp_bearer_token}
                onChange={(e) => handleInputChange('erp_bearer_token', e.target.value)}
                placeholder="Bearer token for ERP API"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ATS Configuration */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">ATS Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ATS Provider
              </label>
              <select
                value={settings.ats_provider}
                onChange={(e) => handleInputChange('ats_provider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="local">Local Files</option>
                <option value="greenhouse">Greenhouse</option>
                <option value="workable">Workable</option>
              </select>
            </div>

            {settings.ats_provider !== 'local' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ATS Base URL
                  </label>
                  <input
                    type="url"
                    value={settings.ats_base_url}
                    onChange={(e) => handleInputChange('ats_base_url', e.target.value)}
                    placeholder="https://ats.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ATS Token
                  </label>
                  <input
                    type="password"
                    value={settings.ats_token}
                    onChange={(e) => handleInputChange('ats_token', e.target.value)}
                    placeholder="API token for ATS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notifications Configuration */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Notifications</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slack Bot Token
              </label>
              <input
                type="password"
                value={settings.slack_bot_token}
                onChange={(e) => handleInputChange('slack_bot_token', e.target.value)}
                placeholder="xoxb-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Microsoft Graph Token
              </label>
              <input
                type="password"
                value={settings.graph_bearer_token}
                onChange={(e) => handleInputChange('graph_bearer_token', e.target.value)}
                placeholder="Bearer token for Microsoft Graph"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graph User ID
              </label>
              <input
                type="text"
                value={settings.graph_user_id}
                onChange={(e) => handleInputChange('graph_user_id', e.target.value)}
                placeholder="me or user@domain.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Google Sheets Configuration */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Google Sheets</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={settings.sheets_spreadsheet_id}
                onChange={(e) => handleInputChange('sheets_spreadsheet_id', e.target.value)}
                placeholder="1e97xVkDTW8gUNSTKNclYSvaoJEoojCias3iAp1YLxF4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in the Google Sheets URL
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Agent Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name:</span> {agentDescriptor.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Version:</span> {agentDescriptor.version}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Module:</span> {agentDescriptor.module}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Capabilities:</span> {agentDescriptor.capabilities.length}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">HMAC Required:</span> {agentDescriptor.security?.hmac_required ? 'Yes' : 'No'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Attestation:</span> {agentDescriptor.security?.attestation_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
