import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
  const sourcesInternal = useMemo(
    () => t('eaSecondBrainModule.sourcesInternal', { returnObjects: true }),
    [t]
  );
  const sourcesExternal = useMemo(
    () => t('eaSecondBrainModule.sourcesExternal', { returnObjects: true }),
    [t]
  );
  const internalList = Array.isArray(sourcesInternal) ? sourcesInternal : [];
  const externalList = Array.isArray(sourcesExternal) ? sourcesExternal : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('eaSecondBrainModule.settingsTitle')}</h2>
        <p className="text-sm text-gray-600">
          {t('eaSecondBrainModule.settingsSubtitle')}
        </p>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('eaSecondBrainModule.integrationStatus')}
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
          {t('eaSecondBrainModule.envVarsTitle')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('eaSecondBrainModule.envVarsIntro')}
          <code>{t('eaSecondBrainModule.envFile')}</code>
          {t('eaSecondBrainModule.envFileSuffix')}
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
          {t('eaSecondBrainModule.policiesTitle')}
        </h3>
        <div className="space-y-4">
          <PolicyItem
            label={t('eaSecondBrainModule.policyJiraProjects')}
            value="EA, ARCH"
            description={t('eaSecondBrainModule.policyJiraProjectsDesc')}
          />
          <PolicyItem
            label={t('eaSecondBrainModule.policySlackChannels')}
            value="#ea-updates, #engineering, #cto-brief"
            description={t('eaSecondBrainModule.policySlackChannelsDesc')}
          />
          <PolicyItem
            label={t('eaSecondBrainModule.policyAutoMode')}
            value={t('eaSecondBrainModule.policyValueLowRisk')}
            description={t('eaSecondBrainModule.policyAutoModeDesc')}
          />
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('eaSecondBrainModule.dataSourcesSettingsTitle')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('eaSecondBrainModule.dataSourcesSettingsIntro')}
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('eaSecondBrainModule.internalLabel')}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {internalList.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('eaSecondBrainModule.externalLabel')}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {externalList.map((item) => (
                <li key={item}>• {item}</li>
              ))}
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
              {t('eaSecondBrainModule.needHelpTitle')}
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              {t('eaSecondBrainModule.needHelpBody')}
              <a href="/docs/ea-agent" className="underline">
                {t('eaSecondBrainModule.needHelpLink')}
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
  const { t } = useTranslation();
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
        {configured ? t('eaSecondBrainModule.configured') : t('eaSecondBrainModule.notConfigured')}
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
