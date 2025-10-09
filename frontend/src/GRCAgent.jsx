import React, { useState } from 'react';
import Overview from './grc-agent/Overview';
import Findings from './grc-agent/Findings';
import Actions from './grc-agent/Actions';
import Runs from './grc-agent/Runs';
import Policies from './grc-agent/Policies';

// Icon component for consistent sizing
const Icon = ({ name, size = 16 }) => {
  const icons = {
    'bar-chart': '📊',
    'search': '🔍',
    'lightning': '⚡',
    'running': '🏃',
    'document': '📋'
  };

  const icon = icons[name] || '❓';
  
  // For emojis, use a smaller font size to control the visual size
  const emojiSize = size <= 16 ? '0.5em' : size <= 18 ? '0.6em' : '0.7em';
  
  return (
    <span style={{ 
      fontSize: emojiSize,
      display: 'inline-block',
      lineHeight: 1,
      verticalAlign: 'middle'
    }}>
      {icon}
    </span>
  );
};

const GRCAgent = () => {
  const [activeTab, setActiveTab] = useState('overview');

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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: '32px',
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🛡️</span>
          Responsible AI Ops (GRC)
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#64748b',
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          Detects data-quality, policy, and risk issues across Finance/Procurement/Supply Chain/ESG and executes fixes with audit.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview', icon: 'bar-chart' },
            { id: 'findings', label: 'Findings', icon: 'search' },
            { id: 'actions', label: 'Actions', icon: 'lightning' },
            { id: 'runs', label: 'Runs', icon: 'running' },
            { id: 'policies', label: 'Policies', icon: 'document' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : '#f1f5f9',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = '#e2e8f0';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = '#f1f5f9';
                }
              }}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default GRCAgent;