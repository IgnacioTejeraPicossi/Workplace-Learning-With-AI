import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import descriptor from '../configs/agents/sales-assistant.json';

const Overview = () => {
  const { t } = useTranslation();
  const sourcesInternal = useMemo(
    () => t('salesAssistantModule.sourcesInternal', { returnObjects: true }),
    [t]
  );
  const sourcesExternal = useMemo(
    () => t('salesAssistantModule.sourcesExternal', { returnObjects: true }),
    [t]
  );
  const features = useMemo(
    () => t('salesAssistantModule.features', { returnObjects: true }),
    [t]
  );
  const internalList = Array.isArray(sourcesInternal) ? sourcesInternal : [];
  const externalList = Array.isArray(sourcesExternal) ? sourcesExternal : [];
  const featureList = Array.isArray(features) ? features : [];

  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    lastRun: null,
  });

  useEffect(() => {
    fetch('/agents/sales/runs?limit=100')
      .then((res) => res.json())
      .then((runs) => {
        const total = runs.length;
        const successful = runs.filter((r) => r.status === 'DONE').length;
        const successRate = total > 0 ? (successful / total) * 100 : 0;
        const lastRun = runs[0];

        setStats({
          totalRuns: total,
          successRate: Number(successRate.toFixed(1)),
          lastRun: lastRun?.created_at,
        });
      })
      .catch((err) => console.error('Failed to load stats:', err));
  }, []);

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Hero */}
        <div
          style={{
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            background: 'linear-gradient(90deg, #16a34a 0%, #2563eb 100%)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ fontSize: '40px' }}>💼</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t('salesAssistantModule.title')}</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{t('salesAssistantModule.tagline')}</p>
            </div>
          </div>
          <p style={{ marginTop: '12px', opacity: 0.95 }}>{t('salesAssistantModule.description')}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatCard label={t('salesAssistantModule.statsTotalRuns')} value={stats.totalRuns} icon="▶️" />
          <StatCard label={t('salesAssistantModule.statsSuccessRate')} value={`${stats.successRate}%`} icon="✅" />
          <StatCard label={t('salesAssistantModule.statsCapabilities')} value={descriptor.capabilities.length} icon="⚡" />
        </div>

        {/* Two Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Capabilities */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('salesAssistantModule.capabilitiesHeading')}</h3>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {descriptor.capabilities.map((cap, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#ecfdf5', borderRadius: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {cap.includes('crm') ? '📊' : cap.includes('email') ? '📧' : cap.includes('slack') ? '💬' : '🔧'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Sources */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('salesAssistantModule.dataSourcesHeading')}</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 style={{ margin: 0, marginBottom: '8px', fontSize: '13px', color: '#334155' }}><span style={{ marginRight: 6 }}>🔒</span>{t('salesAssistantModule.internalHeading')}</h4>
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
                <h4 style={{ margin: 0, marginBottom: '8px', fontSize: '13px', color: '#334155' }}><span style={{ marginRight: 6 }}>🌐</span>{t('salesAssistantModule.externalHeading')}</h4>
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

        {/* Features */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('salesAssistantModule.keyFeaturesHeading')}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {featureList.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', background: '#ecfdf5', borderRadius: '10px' }}>
                <span style={{ color: '#16a34a', marginTop: 2 }}>✓</span>
                <span style={{ fontSize: '13px', color: '#334155' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MCP */}
        <div
          style={{
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '22px' }}>🔌</span>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{t('salesAssistantModule.mcpHeading')}</h3>
          </div>
          <p style={{ margin: 0, marginBottom: '10px', opacity: 0.95 }}>{t('salesAssistantModule.mcpSupportText')}</p>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px' }}>
            <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              {descriptor.mcp.endpoint}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{value}</p>
        </div>
        <div style={{ fontSize: '24px', background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(37,99,235,0.15))', padding: '12px', borderRadius: '12px' }}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default Overview;
