// Main Cybersecurity Module Component
import React, { useState } from 'react';
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

export default function Cybersecurity() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'agent-security', label: 'Agent Security', icon: '🤖' },
    { id: 'threats', label: 'Threat Library', icon: '🛡️' },
    { id: 'tools', label: 'Tools & Frameworks', icon: '🧰' },
    { id: 'posture', label: 'Posture & Risk', icon: '📈' },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: '🔍' },
    { id: 'coach', label: 'Secure Coding Coach', icon: '👨‍🏫' },
    { id: 'compliance', label: 'Compliance Tracker', icon: '📋' },
    { id: 'drills', label: 'Incident Drills', icon: '🚨' },
    { id: 'knowledge', label: 'Knowledge', icon: '📚' }
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
          🔒 Cybersecurity
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '0.5rem 0 0 0',
          fontSize: '1rem'
        }}>
          Comprehensive security management and threat intelligence platform
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
