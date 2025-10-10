import React, { useState } from 'react';
import Overview from './grc-agent/Overview';
import Findings from './grc-agent/Findings';
import Actions from './grc-agent/Actions';
import Runs from './grc-agent/Runs';
import Policies from './grc-agent/Policies';

const GRCAgent = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'findings', label: 'Findings', icon: '🔍' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'runs', label: 'Runs', icon: '🏃' },
    { id: 'policies', label: 'Policies', icon: '📋' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'findings':
        return <Findings />;
      case 'actions':
        return <Actions />;
      case 'runs':
        return <Runs />;
      case 'policies':
        return <Policies />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="text-5xl">🛡️</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Responsible AI Ops (GRC)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Detects data-quality, policy, and risk issues across Finance/Procurement/Supply Chain/ESG and executes fixes with audit
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

export default GRCAgent;