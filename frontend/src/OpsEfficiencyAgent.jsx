import React, { useState } from 'react';
import Overview from './ops-efficiency-agent/Overview';
import Invoices from './ops-efficiency-agent/Invoices';
import Allocations from './ops-efficiency-agent/Allocations';
import Recruitment from './ops-efficiency-agent/Recruitment';
import Runs from './ops-efficiency-agent/Runs';
import Settings from './ops-efficiency-agent/Settings';

const OpsEfficiencyAgent = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'allocations', label: 'Allocations', icon: '💰' },
    { id: 'recruitment', label: 'Recruitment', icon: '👥' },
    { id: 'runs', label: 'Runs', icon: '🏃' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'invoices':
        return <Invoices />;
      case 'allocations':
        return <Allocations />;
      case 'recruitment':
        return <Recruitment />;
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
        <div className="flex items-center space-x-4">
          <div className="text-5xl">⚙️</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Operations Efficiency Agent
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Automates invoice processing, cost allocation suggestions, and CV ranking for Posten Bring
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

export default OpsEfficiencyAgent;