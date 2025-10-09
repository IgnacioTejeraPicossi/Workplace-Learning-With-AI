import React, { useState } from 'react';
import Overview from './telco-ops-agent/Overview';
import Recommendations from './telco-ops-agent/Recommendations';
import Actions from './telco-ops-agent/Actions';
import Runs from './telco-ops-agent/Runs';
import Settings from './telco-ops-agent/Settings';

const TelcoOpsAgent = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'runs', label: 'Runs', icon: '🔄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'recommendations':
        return <Recommendations />;
      case 'actions':
        return <Actions />;
      case 'runs':
        return <Runs />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">📡</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Telco Ops Decisioning Agent</h1>
                <p className="text-gray-600">Data-driven telco operations with safe autonomy</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TelcoOpsAgent;
