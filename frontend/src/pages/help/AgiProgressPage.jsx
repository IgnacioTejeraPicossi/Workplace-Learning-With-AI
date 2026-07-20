import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AgiTracker from './agi/AgiTracker';
import PossibleEndings from './agi/PossibleEndings';
import BenefitsOfAGI from './agi/BenefitsOfAGI';
import HomoSapiensVsAI from './agi/HomoSapiensVsAI';
import VoicesOnAGI from './agi/VoicesOnAGI';
import ReflectionsFromAI from './agi/ReflectionsFromAI';

export default function AgiProgressPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tracker');

  const tabs = [
    { id: 'tracker', labelKey: 'help.agiTabs.tracker', fallback: 'AGI Progress Tracker', icon: '📈' },
    { id: 'endings', labelKey: 'help.agiTabs.endings', fallback: 'Possible Endings for AGI', icon: '🧊' },
    { id: 'benefits', labelKey: 'help.agiTabs.benefits', fallback: 'The Benefits of AGI', icon: '✨' },
    { id: 'homoVsAi', labelKey: 'help.agiTabs.homoVsAi', fallback: 'Homo Sapiens vs. KI i Test', icon: '🧑‍💻' },
    { id: 'voices', labelKey: 'help.agiTabs.voices', fallback: 'Voices on AGI', icon: '🎙️' },
    { id: 'reflections', labelKey: 'help.agiTabs.reflections', fallback: 'Reflections from the AI/AGI', icon: '🪞' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'tracker':
        return <AgiTracker />;
      case 'endings':
        return <PossibleEndings />;
      case 'benefits':
        return <BenefitsOfAGI />;
      case 'homoVsAi':
        return <HomoSapiensVsAI />;
      case 'voices':
        return <VoicesOnAGI />;
      case 'reflections':
        return <ReflectionsFromAI />;
      default:
        return <AgiTracker />;
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
          🧠 {t('help.agiHub.title', { defaultValue: 'AGI Progress Hub' })}
        </h1>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '1.1rem',
          color: '#94a3b8'
        }}>
          {t('help.agiHub.subtitle', { defaultValue: 'Track progress, explore possible futures, and understand the benefits of Artificial General Intelligence' })}
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
          paddingTop: '1rem',
          overflowX: 'auto'
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
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              {t(tab.labelKey, { defaultValue: tab.fallback })}
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
