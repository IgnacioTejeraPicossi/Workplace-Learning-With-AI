import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    harmGate: 0.35,
    minPersonas: 3,
    maxPersonas: 8,
    autoPublish: false,
    defaultChannel: '#council-briefs',
    confluenceSpace: 'SEC'
  });
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadPersonas();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/agents/council/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonas = async () => {
    try {
      const response = await fetch('/agents/council/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error("Failed to load personas:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/agents/council/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert(t('councilAgentModule.settingsSaved'));
      } else {
        alert(t('councilAgentModule.settingsSaveFail'));
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(t('councilAgentModule.settingsSaveError'));
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const lensLabel = (lens) => t(`councilAgentModule.lensLabels.${lens}`, { defaultValue: lens });
  const regionLabel = (region) => t(`councilAgentModule.regionLabels.${region}`, { defaultValue: region });
  const personaName = (p) => (p?.id ? t(`councilAgentModule.personaNames.${p.id}`, { defaultValue: p.name }) : p.name);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('councilAgentModule.settingsTitle')}</h2>
          <p className="text-gray-600">{t('councilAgentModule.settingsSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          {t('councilAgentModule.saveSettings')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('councilAgentModule.safetyQualityHeading')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('councilAgentModule.harmGateLabel')}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.harmGate}
              onChange={(e) => handleSettingChange('harmGate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('councilAgentModule.harmPermissive')}</span>
              <span className="font-medium">{settings.harmGate}</span>
              <span>{t('councilAgentModule.harmStrict')}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {t('councilAgentModule.harmHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('councilAgentModule.minPersonasLabel')}
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={settings.minPersonas}
              onChange={(e) => handleSettingChange('minPersonas', parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              {t('councilAgentModule.minPersonasHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('councilAgentModule.maxPersonasLabel')}
            </label>
            <input
              type="number"
              min="3"
              max="15"
              value={settings.maxPersonas}
              onChange={(e) => handleSettingChange('maxPersonas', parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              {t('councilAgentModule.maxPersonasHint')}
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoPublish}
                onChange={(e) => handleSettingChange('autoPublish', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {t('councilAgentModule.autoPublishLabel')}
              </span>
            </label>
            <p className="text-sm text-gray-600 mt-2">
              {t('councilAgentModule.autoPublishHint')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('councilAgentModule.publishingHeading')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('councilAgentModule.slackChannelLabel')}
            </label>
            <input
              type="text"
              value={settings.defaultChannel}
              onChange={(e) => handleSettingChange('defaultChannel', e.target.value)}
              placeholder="#council-briefs"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              {t('councilAgentModule.slackChannelHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('councilAgentModule.confluenceSpaceLabel')}
            </label>
            <input
              type="text"
              value={settings.confluenceSpace}
              onChange={(e) => handleSettingChange('confluenceSpace', e.target.value)}
              placeholder="SEC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              {t('councilAgentModule.confluenceHint')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('councilAgentModule.personaConfigHeading')}</h3>

        <div className="space-y-4">
          {personas.map((persona) => (
            <div key={persona.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{personaName(persona)}</h4>
                  <p className="text-sm text-gray-600">{lensLabel(persona.lens)} • {regionLabel(persona.region)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {lensLabel(persona.lens)}
                  </span>
                  <button type="button" className="text-purple-600 hover:text-purple-900 text-sm font-medium">
                    {t('councilAgentModule.edit')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('councilAgentModule.expertiseTags')}
                  </label>
                  <input
                    type="text"
                    value={persona.expertise_tags || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('councilAgentModule.valuesJson')}
                  </label>
                  <textarea
                    value={persona.values_json || '{}'}
                    readOnly
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button type="button" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            {t('councilAgentModule.addNewPersona')}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('councilAgentModule.envConfigHeading')}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">SLACK_BOT_TOKEN</span>
            <span className="text-xs text-gray-500">{t('councilAgentModule.envSlackToken')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">CONFLUENCE_BASE_URL</span>
            <span className="text-xs text-gray-500">{t('councilAgentModule.envConfluenceUrl')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">HARM_GATE</span>
            <span className="text-xs text-gray-500">{t('councilAgentModule.envHarmGate')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
