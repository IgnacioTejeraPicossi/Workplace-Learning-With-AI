import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './ea-agent/Dashboard';
import Insights from './ea-agent/Insights';
import Portfolio from './ea-agent/Portfolio';
import Ask from './ea-agent/Ask';
import Runs from './ea-agent/Runs';
import Settings from './ea-agent/Settings';

const EASecondBrain = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: t('eaSecondBrainModule.tabDashboard'), icon: '📊' },
    { id: 'insights', label: t('eaSecondBrainModule.tabInsights'), icon: '💡' },
    { id: 'portfolio', label: t('eaSecondBrainModule.tabPortfolio'), icon: '🏗️' },
    { id: 'ask', label: t('eaSecondBrainModule.tabAsk'), icon: '🔍' },
    { id: 'runs', label: t('eaSecondBrainModule.tabRuns'), icon: '▶️' },
    { id: 'settings', label: t('eaSecondBrainModule.tabSettings'), icon: '⚙️' },
  ];

  const handleNavigate = (tab) => {
    if (tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'insights':
        return <Insights />;
      case 'portfolio':
        return <Portfolio />;
      case 'ask':
        return <Ask />;
      case 'runs':
        return <Runs />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">🧠</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('eaSecondBrainModule.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('eaSecondBrainModule.tagline')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm">
        <div className="px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
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

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default EASecondBrain;
