import React, { useState } from 'react';
import Overview from './sales-agent/Overview';
import Hygiene from './sales-agent/Hygiene';
import Deals from './sales-agent/Deals';
import Runs from './sales-agent/Runs';
import Settings from './sales-agent/Settings';

const SalesAssistant = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'hygiene', label: 'Hygiene', icon: '🧹' },
    { id: 'deals', label: 'Deals', icon: '💼' },
    { id: 'runs', label: 'Runs', icon: '▶️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'hygiene':
        return <Hygiene />;
      case 'deals':
        return <Deals />;
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
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">💼</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sales Assistant Agent
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Pipeline hygiene, deal risk scoring, and contextual follow-up drafts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-8">
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

export default SalesAssistant;
