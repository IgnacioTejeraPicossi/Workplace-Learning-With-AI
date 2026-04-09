import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/atm-copilot';

const Overview = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats).catch(() => {});
    fetch(`${API}/health`).then(r => r.json()).then(setHealth).catch(() => {});
  }, []);

  const scenarioTypes = [
    { key: 'conflict_detection', icon: '🔴', color: '#ef4444' },
    { key: 'sector_handover', icon: '🔄', color: '#3b82f6' },
    { key: 'trajectory_update', icon: '✈️', color: '#8b5cf6' },
    { key: 'degraded_surveillance', icon: '📡', color: '#f59e0b' },
    { key: 'conformance_monitoring', icon: '📊', color: '#10b981' },
    { key: 'alert_timing', icon: '⏱️', color: '#ec4899' },
    { key: 'contingency_fallback', icon: '🛡️', color: '#6366f1' },
  ];

  const quickActions = [
    { icon: '📋', label: t('atmCopilotModule.overview.quickIngest'), tab: 'requirement-lab' },
    { icon: '🧪', label: t('atmCopilotModule.overview.quickDesign'), tab: 'requirement-lab' },
    { icon: '🗺️', label: t('atmCopilotModule.overview.quickScenario'), tab: 'scenario-builder' },
    { icon: '🔍', label: t('atmCopilotModule.overview.quickAnalyze'), tab: 'run-analyzer' },
  ];

  const statCards = [
    { label: t('atmCopilotModule.overview.requirements'), value: stats?.requirements ?? '—', icon: '📋', color: '#3b82f6' },
    { label: t('atmCopilotModule.overview.testDesigns'), value: stats?.testDesigns ?? '—', icon: '🧪', color: '#10b981' },
    { label: t('atmCopilotModule.overview.scenarioMatrices'), value: stats?.scenarioMatrices ?? '—', icon: '🗺️', color: '#8b5cf6' },
    { label: t('atmCopilotModule.overview.testRuns'), value: stats?.testRuns ?? '—', icon: '🔍', color: '#ef4444' },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Hero */}
        <div style={{
          borderRadius: '16px', padding: '28px', color: 'white',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f766e 50%, #1e40af 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ fontSize: '44px' }}>✈️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
                {t('atmCopilotModule.title')}
              </h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
                {t('atmCopilotModule.tagline')}
              </p>
            </div>
          </div>
          <p style={{ marginTop: '12px', opacity: 0.95, lineHeight: 1.6 }}>
            {t('atmCopilotModule.overview.description')}
          </p>
          {health && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: health.status === 'ok' ? '#4ade80' : '#f87171',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '13px', opacity: 0.9 }}>
                {health.status === 'ok' ? t('atmCopilotModule.overview.backendOnline') : t('atmCopilotModule.overview.backendOffline')}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {statCards.map((s, i) => (
            <div key={i} style={{
              backgroundColor: 'white', borderRadius: '12px', padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            {t('atmCopilotModule.overview.quickActionsTitle')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {quickActions.map((qa, i) => (
              <button key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '14px',
                transition: 'all 0.2s', textAlign: 'left'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <span style={{ fontSize: '22px' }}>{qa.icon}</span>
                <span>{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Categories */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            {t('atmCopilotModule.overview.scenarioCategoriesTitle')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {scenarioTypes.map(st => (
              <div key={st.key} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '10px',
                backgroundColor: `${st.color}10`, border: `1px solid ${st.color}30`
              }}>
                <span style={{ fontSize: '20px' }}>{st.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                  {t(`atmCopilotModule.scenarioTypes.${st.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
