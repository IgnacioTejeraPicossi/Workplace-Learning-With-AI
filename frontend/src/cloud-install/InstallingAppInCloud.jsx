import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CloudOverview from './CloudOverview';
import CloudTargetArchitecture from './CloudTargetArchitecture';
import CloudEnvSecrets from './CloudEnvSecrets';
import CloudSmokeTests from './CloudSmokeTests';

export default function InstallingAppInCloud() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('cloudInstall.tabs.overview'), icon: '🏠' },
    { id: 'architecture', label: t('cloudInstall.tabs.targetArchitecture'), icon: '🏗️' },
    { id: 'env', label: t('cloudInstall.tabs.envSecrets'), icon: '🔐' },
    { id: 'smoke', label: t('cloudInstall.tabs.smokeTests'), icon: '✅' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CloudOverview />;
      case 'architecture':
        return <CloudTargetArchitecture />;
      case 'env':
        return <CloudEnvSecrets />;
      case 'smoke':
        return <CloudSmokeTests />;
      default:
        return <CloudOverview />;
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
          ☁️ {t('cloudInstall.title')}
        </h1>
        <p style={{
          color: '#6b7280',
          margin: '0.5rem 0 0 0',
          fontSize: '1rem'
        }}>
          {t('cloudInstall.subtitle')}
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
