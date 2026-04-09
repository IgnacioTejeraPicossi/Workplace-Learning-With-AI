import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from './atm-copilot/Overview';
import RequirementLab from './atm-copilot/RequirementLab';
import ScenarioBuilder from './atm-copilot/ScenarioBuilder';
import RunAnalyzer from './atm-copilot/RunAnalyzer';

const AtmVvTestCopilot = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('atmCopilotModule.tabOverview'), icon: '🏠' },
    { id: 'requirement-lab', label: t('atmCopilotModule.tabRequirementLab'), icon: '📋' },
    { id: 'scenario-builder', label: t('atmCopilotModule.tabScenarioBuilder'), icon: '🗺️' },
    { id: 'run-analyzer', label: t('atmCopilotModule.tabRunAnalyzer'), icon: '🔍' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'requirement-lab':
        return <RequirementLab />;
      case 'scenario-builder':
        return <ScenarioBuilder />;
      case 'run-analyzer':
        return <RunAnalyzer />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">✈️</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('atmCopilotModule.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('atmCopilotModule.tagline')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AtmVvTestCopilot;
