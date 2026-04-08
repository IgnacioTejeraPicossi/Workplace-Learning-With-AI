import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    mustHave: [],
    muteTerms: [],
    teams: [],
    priorityBoostJson: {},
    quietHours: '22:00-08:00'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/preferences');
      const data = await response.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/agents/attention/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        window.alert(t('personalAttentionAgentModule.prefsSaved'));
      } else {
        window.alert(t('personalAttentionAgentModule.prefsSaveFailed'));
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      window.alert(t('personalAttentionAgentModule.prefsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const addMustHave = () => {
    const term = window.prompt(t('personalAttentionAgentModule.promptMustHave'));
    if (term && !preferences.mustHave.includes(term)) {
      setPreferences({
        ...preferences,
        mustHave: [...preferences.mustHave, term]
      });
    }
  };

  const removeMustHave = (index) => {
    setPreferences({
      ...preferences,
      mustHave: preferences.mustHave.filter((_, i) => i !== index)
    });
  };

  const addMuteTerm = () => {
    const term = window.prompt(t('personalAttentionAgentModule.promptMute'));
    if (term && !preferences.muteTerms.includes(term)) {
      setPreferences({
        ...preferences,
        muteTerms: [...preferences.muteTerms, term]
      });
    }
  };

  const removeMuteTerm = (index) => {
    setPreferences({
      ...preferences,
      muteTerms: preferences.muteTerms.filter((_, i) => i !== index)
    });
  };

  const addTeam = () => {
    const team = window.prompt(t('personalAttentionAgentModule.promptTeam'));
    if (team && !preferences.teams.includes(team)) {
      setPreferences({
        ...preferences,
        teams: [...preferences.teams, team]
      });
    }
  };

  const removeTeam = (index) => {
    setPreferences({
      ...preferences,
      teams: preferences.teams.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('personalAttentionAgentModule.settingsPageTitle')}</h1>
            <p className="text-gray-600 mt-1">
              {t('personalAttentionAgentModule.settingsPageSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? t('personalAttentionAgentModule.saving') : t('personalAttentionAgentModule.saveSettings')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">{t('personalAttentionAgentModule.loadingSettings')}</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('personalAttentionAgentModule.mustHaveTitle')}</h3>
              <p className="text-gray-600 mb-4">
                {t('personalAttentionAgentModule.mustHaveDesc')}
              </p>
              <div className="space-y-2">
                {preferences.mustHave.map((term, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                    <span className="text-sm">{term}</span>
                    <button
                      type="button"
                      onClick={() => removeMustHave(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('personalAttentionAgentModule.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMustHave}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  {t('personalAttentionAgentModule.addMustHave')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('personalAttentionAgentModule.muteTitle')}</h3>
              <p className="text-gray-600 mb-4">
                {t('personalAttentionAgentModule.muteDesc')}
              </p>
              <div className="space-y-2">
                {preferences.muteTerms.map((term, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                    <span className="text-sm">{term}</span>
                    <button
                      type="button"
                      onClick={() => removeMuteTerm(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('personalAttentionAgentModule.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMuteTerm}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  {t('personalAttentionAgentModule.addMute')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('personalAttentionAgentModule.teamsTitle')}</h3>
              <p className="text-gray-600 mb-4">
                {t('personalAttentionAgentModule.teamsDesc')}
              </p>
              <div className="space-y-2">
                {preferences.teams.map((team, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-sm">{team}</span>
                    <button
                      type="button"
                      onClick={() => removeTeam(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('personalAttentionAgentModule.remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTeam}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t('personalAttentionAgentModule.addTeam')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('personalAttentionAgentModule.quietHoursTitle')}</h3>
              <p className="text-gray-600 mb-4">
                {t('personalAttentionAgentModule.quietHoursDesc')}
              </p>
              <div className="max-w-xs">
                <input
                  type="text"
                  value={preferences.quietHours}
                  onChange={(e) => setPreferences({ ...preferences, quietHours: e.target.value })}
                  placeholder="22:00-08:00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('personalAttentionAgentModule.quietHoursFormat')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('personalAttentionAgentModule.integrationSettings')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">{t('personalAttentionAgentModule.slackIntegration')}</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">{t('personalAttentionAgentModule.botToken')}</label>
                      <input
                        type="password"
                        placeholder="xoxb-..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">{t('personalAttentionAgentModule.defaultChannel')}</label>
                      <input
                        type="text"
                        placeholder="#cto-brief"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">{t('personalAttentionAgentModule.teamsIntegration')}</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-600">{t('personalAttentionAgentModule.webhookUrl')}</label>
                      <input
                        type="url"
                        placeholder="https://outlook.office.com/webhook/..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">{t('personalAttentionAgentModule.graphToken')}</label>
                      <input
                        type="password"
                        placeholder="Bearer token"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
