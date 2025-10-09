import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    maxAutoValue: 50,
    confidenceThreshold: 0.7,
    riskThreshold: 70,
    requiredApprovalRoles: ['ops-supervisor'],
    tmfBaseUrl: 'https://tmf.example.com',
    tmfAuthToken: '',
    appointBaseUrl: 'https://appointments.example.com',
    appointToken: '',
    commsProvider: 'm365',
    commsApiKey: '',
    crmBaseUrl: 'https://crm.example.com',
    crmBearerToken: '',
    graphUserId: 'me',
    graphBearerToken: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, this would load from API
      console.log('Loading settings...');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // In a real app, this would save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setSettings(prev => ({
      ...prev,
      [field]: array
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Configure Telco Ops Agent policies and integrations</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Policy Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Policy Guardrails</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Auto Value (€)
            </label>
            <input
              type="number"
              value={settings.maxAutoValue}
              onChange={(e) => handleInputChange('maxAutoValue', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum value for automatic execution without approval
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Threshold
            </label>
            <input
              type="number"
              value={settings.confidenceThreshold}
              onChange={(e) => handleInputChange('confidenceThreshold', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="1"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum confidence level for recommendations (0.0 - 1.0)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Threshold (%)
            </label>
            <input
              type="number"
              value={settings.riskThreshold}
              onChange={(e) => handleInputChange('riskThreshold', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="100"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum risk level before requiring approval
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Approval Roles
            </label>
            <input
              type="text"
              value={settings.requiredApprovalRoles.join(', ')}
              onChange={(e) => handleArrayChange('requiredApprovalRoles', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ops-supervisor, manager"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated list of roles that can approve actions
            </p>
          </div>
        </div>
      </div>

      {/* TMF Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 TMF Integration</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TMF Base URL
            </label>
            <input
              type="url"
              value={settings.tmfBaseUrl}
              onChange={(e) => handleInputChange('tmfBaseUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://tmf.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TMF Auth Token
            </label>
            <input
              type="password"
              value={settings.tmfAuthToken}
              onChange={(e) => handleInputChange('tmfAuthToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bearer token"
            />
          </div>
        </div>
      </div>

      {/* Appointment Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Appointment Integration</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Base URL
            </label>
            <input
              type="url"
              value={settings.appointBaseUrl}
              onChange={(e) => handleInputChange('appointBaseUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://appointments.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Token
            </label>
            <input
              type="password"
              value={settings.appointToken}
              onChange={(e) => handleInputChange('appointToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="API token"
            />
          </div>
        </div>
      </div>

      {/* Communication Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Communication Integration</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Provider
            </label>
            <select
              value={settings.commsProvider}
              onChange={(e) => handleInputChange('commsProvider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="m365">Microsoft 365</option>
              <option value="sendgrid">SendGrid</option>
              <option value="sms">SMS Provider</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication API Key
            </label>
            <input
              type="password"
              value={settings.commsApiKey}
              onChange={(e) => handleInputChange('commsApiKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="API key"
            />
          </div>

          {settings.commsProvider === 'm365' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graph User ID
                </label>
                <input
                  type="text"
                  value={settings.graphUserId}
                  onChange={(e) => handleInputChange('graphUserId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="me"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graph Bearer Token
                </label>
                <input
                  type="password"
                  value={settings.graphBearerToken}
                  onChange={(e) => handleInputChange('graphBearerToken', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Bearer token"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* CRM Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 CRM Integration</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CRM Base URL
            </label>
            <input
              type="url"
              value={settings.crmBaseUrl}
              onChange={(e) => handleInputChange('crmBaseUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://crm.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CRM Bearer Token
            </label>
            <input
              type="password"
              value={settings.crmBearerToken}
              onChange={(e) => handleInputChange('crmBearerToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bearer token"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
