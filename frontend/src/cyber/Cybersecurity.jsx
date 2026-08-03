// Main Cybersecurity Module Component
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CyberDashboard from './CyberDashboard';
import ThreatLibrary from './ThreatLibrary';
import AgentSecurity from './AgentSecurity';
import ToolsFrameworks from './ToolsFrameworks';
import PostureRisk from './PostureRisk';
import Vulnerabilities from './Vulnerabilities';
import ComplianceTracker from './ComplianceTracker';
import SecureCodingCoach from './SecureCodingCoach';
import IncidentDrills from './IncidentDrills';
import KnowledgeBase from './KnowledgeBase';
import FreshInsights from '../FreshInsights';

export default function Cybersecurity() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: t('cyber.tabs.dashboard'), icon: '📊' },
    { id: 'agent-security', label: t('cyber.tabs.agentSecurity'), icon: '🤖' },
    { id: 'threats', label: t('cyber.tabs.threatLibrary'), icon: '🛡️' },
    { id: 'tools', label: t('cyber.tabs.toolsFrameworks'), icon: '🧰' },
    { id: 'posture', label: t('cyber.tabs.postureRisk'), icon: '📈' },
    { id: 'vulnerabilities', label: t('cyber.tabs.vulnerabilities'), icon: '🔍' },
    { id: 'coach', label: t('cyber.tabs.secureCodingCoach'), icon: '👨‍🏫' },
    { id: 'compliance', label: t('cyber.tabs.complianceTracker'), icon: '📋' },
    { id: 'drills', label: t('cyber.tabs.incidentDrills'), icon: '🚨' },
    { id: 'knowledge', label: t('cyber.tabs.knowledge'), icon: '📚' },
    { id: 'threatIntel', label: t('cyber.tabs.threatIntel'), icon: '🛰️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CyberDashboard />;
      case 'agent-security':
        return <AgentSecurity />;
      case 'threats':
        return <ThreatLibrary />;
      case 'tools':
        return <ToolsFrameworks />;
      case 'posture':
        return <PostureRisk />;
      case 'vulnerabilities':
        return <Vulnerabilities />;
      case 'coach':
        return <SecureCodingCoach />;
      case 'compliance':
        return <ComplianceTracker />;
      case 'drills':
        return <IncidentDrills />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'threatIntel':
        return (
          <div style={{ padding: '1.5rem' }}>
            <FreshInsights
              query={t('cyber.threatIntel.query')}
              title={t('cyber.threatIntel.title')}
              intro={t('cyber.threatIntel.intro')}
            />
          </div>
        );
      default:
        return <CyberDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 1.5rem'
      }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔒 {t('cyber.title')}
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '0.5rem 0 0 0',
          fontSize: '1rem'
        }}>
          {t('cyber.subtitle')}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          padding: '0.5rem 0'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );
}
