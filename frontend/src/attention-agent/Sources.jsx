import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Sources = () => {
  const { t } = useTranslation();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    type: 'slack',
    urlOrId: '',
    authRef: '',
    pullIntervalMin: 15,
    active: true
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    try {
      const response = await fetch('/agents/attention/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });

      if (response.ok) {
        setNewSource({
          type: 'slack',
          urlOrId: '',
          authRef: '',
          pullIntervalMin: 15,
          active: true
        });
        setShowAddForm(false);
        loadSources();
      }
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const toggleSource = async (sourceId, active) => {
    try {
      const response = await fetch(`/agents/attention/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        loadSources();
      }
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  const deleteSource = async (sourceId) => {
    if (!window.confirm(t('personalAttentionAgentModule.confirmDeleteSource'))) return;

    try {
      const response = await fetch(`/agents/attention/sources/${sourceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadSources();
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const getSourceIcon = (type) => {
    const icons = {
      slack: '💬',
      teams: '💬',
      webex: '📹',
      sharepoint: '📄',
      rss: '📡',
      workplace: '👥',
      workvivo: '🏢'
    };
    return icons[type] || '📡';
  };

  const typeLabel = (type) => t(`personalAttentionAgentModule.sourceTypes.${type}`, { defaultValue: type });

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('personalAttentionAgentModule.sourcesPageTitle')}</h1>
            <p className="text-gray-600 mt-1">
              {t('personalAttentionAgentModule.sourcesPageSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + {t('personalAttentionAgentModule.addSource')}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('personalAttentionAgentModule.addNewSource')}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('personalAttentionAgentModule.sourceType')}
                </label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="slack">{t('personalAttentionAgentModule.sourceTypes.slack')}</option>
                  <option value="teams">{t('personalAttentionAgentModule.sourceTypes.teams')}</option>
                  <option value="webex">{t('personalAttentionAgentModule.sourceTypes.webex')}</option>
                  <option value="sharepoint">{t('personalAttentionAgentModule.sourceTypes.sharepoint')}</option>
                  <option value="rss">{t('personalAttentionAgentModule.sourceTypes.rss')}</option>
                  <option value="workplace">{t('personalAttentionAgentModule.sourceTypes.workplace')}</option>
                  <option value="workvivo">{t('personalAttentionAgentModule.sourceTypes.workvivo')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('personalAttentionAgentModule.urlOrId')}
                </label>
                <input
                  type="text"
                  value={newSource.urlOrId}
                  onChange={(e) => setNewSource({ ...newSource, urlOrId: e.target.value })}
                  placeholder={t('personalAttentionAgentModule.urlOrIdPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('personalAttentionAgentModule.authReference')}
                </label>
                <input
                  type="text"
                  value={newSource.authRef}
                  onChange={(e) => setNewSource({ ...newSource, authRef: e.target.value })}
                  placeholder={t('personalAttentionAgentModule.authRefPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('personalAttentionAgentModule.pullIntervalMin')}
                </label>
                <input
                  type="number"
                  value={newSource.pullIntervalMin}
                  onChange={(e) => setNewSource({ ...newSource, pullIntervalMin: parseInt(e.target.value, 10) })}
                  min="5"
                  max="60"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                type="button"
                onClick={addSource}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('personalAttentionAgentModule.addSource')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('personalAttentionAgentModule.cancel')}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">{t('personalAttentionAgentModule.activeSources')}</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">{t('personalAttentionAgentModule.loadingSources')}</div>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 mb-4">{t('personalAttentionAgentModule.noSourcesConfigured')}</div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                {t('personalAttentionAgentModule.addFirstSource')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sources.map((source) => (
                <div key={source._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getSourceIcon(source.type)}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {t('personalAttentionAgentModule.sourceRow', { type: typeLabel(source.type) })}
                        </h4>
                        <p className="text-sm text-gray-600">{source.urlOrId}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            source.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {source.active ? t('personalAttentionAgentModule.statusActive') : t('personalAttentionAgentModule.statusInactive')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {t('personalAttentionAgentModule.pullEvery', { minutes: source.pullIntervalMin })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleSource(source._id, !source.active)}
                        className={`px-3 py-1 rounded text-sm ${
                          source.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {source.active ? t('personalAttentionAgentModule.deactivate') : t('personalAttentionAgentModule.activate')}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSource(source._id)}
                        className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        {t('personalAttentionAgentModule.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sources;
