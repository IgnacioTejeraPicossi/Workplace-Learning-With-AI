import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from './attention-agent/Overview';
import Sources from './attention-agent/Sources';
import Clusters from './attention-agent/Clusters';
import Alerts from './attention-agent/Alerts';
import Runs from './attention-agent/Runs';
import Settings from './attention-agent/Settings';

const PersonalAttentionAgent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('personalAttentionAgentModule.tabOverview'), icon: '🏠' },
    { id: 'sources', label: t('personalAttentionAgentModule.tabSources'), icon: '📡' },
    { id: 'clusters', label: t('personalAttentionAgentModule.tabClusters'), icon: '🔗' },
    { id: 'alerts', label: t('personalAttentionAgentModule.tabAlerts'), icon: '🚨' },
    { id: 'runs', label: t('personalAttentionAgentModule.tabRuns'), icon: '▶️' },
    { id: 'settings', label: t('personalAttentionAgentModule.tabSettings'), icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'sources':
        return <Sources />;
      case 'clusters':
        return <Clusters />;
      case 'alerts':
        return <Alerts />;
      case 'runs':
        return <Runs />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">🎯</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('personalAttentionAgentModule.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('personalAttentionAgentModule.tagline')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <div className="px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default PersonalAttentionAgent;
