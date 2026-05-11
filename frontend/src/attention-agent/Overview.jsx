import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import descriptor from '../configs/agents/attention-agent.json';
import {
  AttentionPage,
  AttentionHero,
  StatCard,
  attentionCardStyle,
} from './sharedUi';

const Overview = () => {
  const { t } = useTranslation();
  const sourcesInternal = useMemo(
    () => t('personalAttentionAgentModule.sourcesInternal', { returnObjects: true }),
    [t]
  );
  const sourcesExternal = useMemo(
    () => t('personalAttentionAgentModule.sourcesExternal', { returnObjects: true }),
    [t]
  );
  const features = useMemo(
    () => t('personalAttentionAgentModule.features', { returnObjects: true }),
    [t]
  );
  const internalList = Array.isArray(sourcesInternal) ? sourcesInternal : [];
  const externalList = Array.isArray(sourcesExternal) ? sourcesExternal : [];
  const featureList = Array.isArray(features) ? features : [];

  const [stats, setStats] = useState({
    activeSources: 0,
    totalSignals: 0,
    totalClusters: 0,
    pendingAlerts: 0,
    recentSignals24h: 0,
    recentClusters24h: 0,
  });

  useEffect(() => {
    fetch('/agents/attention/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error('Failed to load stats:', err));
  }, []);

  return (
    <AttentionPage>
      <AttentionHero
        icon="🎯"
        title={t('personalAttentionAgentModule.title')}
        subtitle={t('personalAttentionAgentModule.tagline')}
        description={t('personalAttentionAgentModule.description')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard label={t('personalAttentionAgentModule.statsActiveSources')} value={stats.activeSources} icon="📡" />
        <StatCard label={t('personalAttentionAgentModule.statsTotalSignals')} value={stats.totalSignals} icon="📊" />
        <StatCard label={t('personalAttentionAgentModule.statsPendingAlerts')} value={stats.pendingAlerts} icon="🚨" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={attentionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('personalAttentionAgentModule.capabilitiesHeading')}</h3>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {descriptor.capabilities.map((cap, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  background: '#eff6ff',
                  borderRadius: '10px',
                }}
              >
                <span style={{ fontSize: '18px' }}>
                  {cap.includes('teams')
                    ? '💬'
                    : cap.includes('slack')
                      ? '💬'
                      : cap.includes('calendar')
                        ? '📅'
                        : cap.includes('email')
                          ? '📧'
                          : '🔧'}
                </span>
                <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={attentionCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('personalAttentionAgentModule.dataSourcesHeading')}</h3>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <h4 style={{ margin: 0, marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                <span style={{ marginRight: 6 }}>🔒</span>
                {t('personalAttentionAgentModule.internalHeading')}
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '6px' }}>
                {internalList.map((source, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}>✓</span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ margin: 0, marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                <span style={{ marginRight: 6 }}>🌐</span>
                {t('personalAttentionAgentModule.externalHeading')}
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '6px' }}>
                {externalList.map((source, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}>✓</span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={attentionCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('personalAttentionAgentModule.keyFeaturesHeading')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {featureList.map((feature, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px',
                background: '#ecfdf5',
                borderRadius: '10px',
              }}
            >
              <span style={{ color: '#16a34a', marginTop: 2 }}>✓</span>
              <span style={{ fontSize: '13px', color: '#334155' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={attentionCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}>📈</span>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('personalAttentionAgentModule.recentActivity24h')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#2563eb' }}>{t('personalAttentionAgentModule.newSignals')}</p>
                <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#1e3a8a' }}>{stats.recentSignals24h}</p>
              </div>
              <div style={{ fontSize: '22px', color: '#3b82f6' }}>📊</div>
            </div>
          </div>
          <div style={{ background: '#ecfdf5', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#16a34a' }}>{t('personalAttentionAgentModule.newClusters')}</p>
                <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#065f46' }}>{stats.recentClusters24h}</p>
              </div>
              <div style={{ fontSize: '22px', color: '#10b981' }}>🔗</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '22px' }}>🔌</span>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{t('personalAttentionAgentModule.mcpHeading')}</h3>
        </div>
        <p style={{ margin: 0, marginBottom: '10px', opacity: 0.95 }}>{t('personalAttentionAgentModule.mcpSupportText')}</p>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px' }}>
          <code
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {descriptor.mcp.endpoint}
          </code>
        </div>
      </div>
    </AttentionPage>
  );
};

export default Overview;
