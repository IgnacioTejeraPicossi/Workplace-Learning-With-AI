import React, { useState } from 'react';
import Overview from './ops-efficiency-agent/Overview';
import Invoices from './ops-efficiency-agent/Invoices';
import Allocations from './ops-efficiency-agent/Allocations';
import Recruitment from './ops-efficiency-agent/Recruitment';
import Runs from './ops-efficiency-agent/Runs';
import Settings from './ops-efficiency-agent/Settings';

// Icon component for consistent sizing
const Icon = ({ name, size = 16 }) => {
  const icons = {
    'bar-chart': '📊',
    'document': '📄',
    'money': '💰',
    'users': '👥',
    'running': '🏃',
    'settings': '⚙️'
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

const OpsEfficiencyAgent = () => {
  const [activeTab, setActiveTab] = useState('overview');

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
          <span style={{ fontSize: '2.5rem' }}>⚙️</span>
          Operations Efficiency Agent
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#64748b',
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          Automates invoice processing, cost allocation suggestions, and CV ranking for Posten Bring.
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
            { id: 'invoices', label: 'Invoices', icon: 'document' },
            { id: 'allocations', label: 'Allocations', icon: 'money' },
            { id: 'recruitment', label: 'Recruitment', icon: 'users' },
            { id: 'runs', label: 'Runs', icon: 'running' },
            { id: 'settings', label: 'Settings', icon: 'settings' }
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

export default OpsEfficiencyAgent;
