import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    crmProvider: 'salesforce',
    slackChannel: '#sales',
    graphUserId: 'me',
    autoExecution: 'low_risk_only'
  });

  const handleSave = () => {
    // In real implementation, this would save to backend
    console.log('Saving settings:', settings);
    alert('Settings saved! (Demo mode)');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Agent Settings</h1>
              <p className="text-gray-600">Configure CRM, email, and Slack integrations</p>
            </div>
          </div>
        </div>

        {/* CRM Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">CRM Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CRM Provider
              </label>
              <select
                value={settings.crmProvider}
                onChange={(e) => setSettings({...settings, crmProvider: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="salesforce">Salesforce</option>
                <option value="dynamics">Dynamics 365</option>
                <option value="hubspot">HubSpot</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CRM Base URL
              </label>
              <input
                type="url"
                placeholder="https://your-instance.my.salesforce.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bearer Token
              </label>
              <input
                type="password"
                placeholder="Enter your CRM API token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Microsoft 365 Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Microsoft 365 Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graph User ID
              </label>
              <input
                type="text"
                value={settings.graphUserId}
                onChange={(e) => setSettings({...settings, graphUserId: e.target.value})}
                placeholder="me or specific user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graph Bearer Token
              </label>
              <input
                type="password"
                placeholder="Enter your Microsoft Graph token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Slack Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Slack Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Channel
              </label>
              <input
                type="text"
                value={settings.slackChannel}
                onChange={(e) => setSettings({...settings, slackChannel: e.target.value})}
                placeholder="#sales"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token (xoxb-...)
              </label>
              <input
                type="password"
                placeholder="Enter your Slack bot token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL (alternative)
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Agent Behavior */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Agent Behavior</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Execution Policy
              </label>
              <select
                value={settings.autoExecution}
                onChange={(e) => setSettings({...settings, autoExecution: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="disabled">Disabled (Manual only)</option>
                <option value="low_risk_only">Low Risk Only</option>
                <option value="all_actions">All Actions</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Configuration Note</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    These settings are stored in environment variables. Update your .env file 
                    and restart the backend to apply changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables Reference */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Environment Variables</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`# CRM Configuration
CRM_PROVIDER=salesforce
CRM_BASE_URL=https://your-instance.my.salesforce.com
CRM_BEARER_TOKEN=your_crm_token_here

# Microsoft 365 Configuration
GRAPH_USER_ID=me
GRAPH_BEARER_TOKEN=your_graph_token_here

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_DEFAULT_CHANNEL=#sales`}
            </pre>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
