import React from 'react';

const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
        <p className="text-sm text-gray-600">
          Configure sources, integrations, and policies for the EA Second Brain
          Agent
        </p>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Integration Status
        </h3>
        <div className="space-y-4">
          <IntegrationStatus
            name="Jira"
            icon="📋"
            configured={!!process.env.REACT_APP_JIRA_BASE_URL}
          />
          <IntegrationStatus
            name="Slack"
            icon="💬"
            configured={!!process.env.REACT_APP_SLACK_WEBHOOK_URL}
          />
          <IntegrationStatus
            name="Confluence"
            icon="📝"
            configured={!!process.env.REACT_APP_CONFLUENCE_BASE}
          />
          <IntegrationStatus
            name="Google Sheets"
            icon="📊"
            configured={!!process.env.REACT_APP_SHEETS_SPREADSHEET_ID}
          />
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Environment Variables
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure these variables in your <code>.env</code> file:
        </p>
        <div className="bg-gray-50 rounded p-4 font-mono text-xs space-y-1 overflow-auto">
          <div>JIRA_BASE_URL=https://your.atlassian.net</div>
          <div>JIRA_EMAIL=your@email.com</div>
          <div>JIRA_API_TOKEN=***</div>
          <div className="mt-2">
            SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
          </div>
          <div className="mt-2">
            CONFLUENCE_BASE=https://your.atlassian.net/wiki
          </div>
          <div>CONFLUENCE_AUTH=base64(user:apitoken)</div>
          <div className="mt-2">SHEETS_SPREADSHEET_ID=...</div>
          <div>GOOGLE_SA_JSON={'{...}'}</div>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Execution Policies
        </h3>
        <div className="space-y-4">
          <PolicyItem
            label="Jira Projects"
            value="EA, ARCH"
            description="Allowed Jira projects for issue creation"
          />
          <PolicyItem
            label="Slack Channels"
            value="#ea-updates, #engineering, #cto-brief"
            description="Target channels for notifications"
          />
          <PolicyItem
            label="Auto-execution Mode"
            value="Low Risk"
            description="Automatically execute actions for low-risk insights"
          />
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Sources
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The Pulse job monitors these sources for EA insights:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Internal
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• EA tools</li>
              <li>• Confluence</li>
              <li>• Jira</li>
              <li>• Architecture Repository</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              External
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Vendor release notes</li>
              <li>• Tech news</li>
              <li>• CVE feeds</li>
              <li>• GitHub releases</li>
              <li>• EOL datasets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="text-sm font-semibold text-yellow-900">
              Need Help?
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Contact the platform team for assistance with configuration or
              consult the{' '}
              <a href="/docs/ea-agent" className="underline">
                EA Agent documentation
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationStatus = ({ name, icon, configured }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          configured
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {configured ? '✓ Configured' : 'Not Configured'}
      </span>
    </div>
  );
};

const PolicyItem = ({ label, value, description }) => {
  return (
    <div className="pb-4 border-b border-gray-200 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-900">{label}</span>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default Settings;

