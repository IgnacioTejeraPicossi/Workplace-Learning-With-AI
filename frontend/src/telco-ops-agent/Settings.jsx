import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
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
    graphBearerToken: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('Loading settings...');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFeedback({ type: 'success', message: t('telcoOpsAgentModule.settingsSaved') });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFeedback({ type: 'error', message: t('telcoOpsAgentModule.settingsSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map((item) => item.trim()).filter(Boolean);
    setSettings((prev) => ({
      ...prev,
      [field]: array,
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('telcoOpsAgentModule.settingsTitle')}</h2>
          <p className="text-gray-600">{t('telcoOpsAgentModule.settingsSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? `⏳ ${t('telcoOpsAgentModule.saving')}` : `💾 ${t('telcoOpsAgentModule.saveSettings')}`}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ {t('telcoOpsAgentModule.policySection')}</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelMaxAuto')}
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
              {t('telcoOpsAgentModule.hintMaxAuto')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelConfidence')}
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
              {t('telcoOpsAgentModule.hintConfidence')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelRisk')}
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
              {t('telcoOpsAgentModule.hintRisk')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelApprovalRoles')}
            </label>
            <input
              type="text"
              value={settings.requiredApprovalRoles.join(', ')}
              onChange={(e) => handleArrayChange('requiredApprovalRoles', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ops-supervisor, manager"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('telcoOpsAgentModule.hintApprovalRoles')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 {t('telcoOpsAgentModule.tmfSection')}</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelTmfBaseUrl')}
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
              {t('telcoOpsAgentModule.labelTmfAuthToken')}
            </label>
            <input
              type="password"
              value={settings.tmfAuthToken}
              onChange={(e) => handleInputChange('tmfAuthToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('telcoOpsAgentModule.placeholderBearer')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 {t('telcoOpsAgentModule.appointSection')}</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelAppointBaseUrl')}
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
              {t('telcoOpsAgentModule.labelAppointToken')}
            </label>
            <input
              type="password"
              value={settings.appointToken}
              onChange={(e) => handleInputChange('appointToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('telcoOpsAgentModule.placeholderApiToken')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 {t('telcoOpsAgentModule.commSection')}</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelCommProvider')}
            </label>
            <select
              value={settings.commsProvider}
              onChange={(e) => handleInputChange('commsProvider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="m365">{t('telcoOpsAgentModule.providerM365')}</option>
              <option value="sendgrid">{t('telcoOpsAgentModule.providerSendgrid')}</option>
              <option value="sms">{t('telcoOpsAgentModule.providerSms')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelCommApiKey')}
            </label>
            <input
              type="password"
              value={settings.commsApiKey}
              onChange={(e) => handleInputChange('commsApiKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('telcoOpsAgentModule.placeholderApiKey')}
            />
          </div>

          {settings.commsProvider === 'm365' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('telcoOpsAgentModule.labelGraphUserId')}
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
                  {t('telcoOpsAgentModule.labelGraphBearer')}
                </label>
                <input
                  type="password"
                  value={settings.graphBearerToken}
                  onChange={(e) => handleInputChange('graphBearerToken', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('telcoOpsAgentModule.placeholderBearer')}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 {t('telcoOpsAgentModule.crmSection')}</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('telcoOpsAgentModule.labelCrmBaseUrl')}
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
              {t('telcoOpsAgentModule.labelCrmBearer')}
            </label>
            <input
              type="password"
              value={settings.crmBearerToken}
              onChange={(e) => handleInputChange('crmBearerToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('telcoOpsAgentModule.placeholderBearer')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
