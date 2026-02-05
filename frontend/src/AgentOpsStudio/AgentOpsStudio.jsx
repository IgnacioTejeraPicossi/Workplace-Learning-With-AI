// AgentOps Studio - Main Component
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from './Overview';
import PromptLab from './PromptLab';
import Playbook from './Playbook';
import FlowCatalog from './FlowCatalog';
import Runs from './Runs';
import Settings from './Settings';
import AgentCatalog from '../components/AgentCatalog';

export default function AgentOpsStudio() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('agent-catalog');

  const tabs = [
    { id: 'agent-catalog', labelKey: 'agentCatalog', icon: '📚' },
    { id: 'overview', labelKey: 'overview', icon: '📊' },
    { id: 'prompt-lab', labelKey: 'promptLab', icon: '🧪' },
    { id: 'playbook', labelKey: 'playbook', icon: '📋' },
    { id: 'flows', labelKey: 'flowCatalog', icon: '🔄' },
    { id: 'runs', labelKey: 'runs', icon: '🏃' },
    { id: 'settings', labelKey: 'settings', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />;
      case 'prompt-lab':
        return <PromptLab />;
      case 'playbook':
        return <Playbook />;
      case 'flows':
        return <FlowCatalog />;
      case 'runs':
        return <Runs />;
      case 'agent-catalog':
        return <AgentCatalog />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #334155'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          🤖 {t('agentopsStudio.title')}
        </h1>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '1.1rem',
          color: '#94a3b8'
        }}>
          {t('agentopsStudio.subtitle')}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          paddingTop: '1rem'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                borderRadius: '0.5rem 0.5rem 0 0',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              {t(`agentopsStudio.tabs.${tab.labelKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        {renderContent()}
      </div>
    </div>
  );
}
