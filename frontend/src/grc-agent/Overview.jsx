import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import descriptor from '../configs/agents/grc-agent.json';

const Overview = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalFindings: 0,
    openFindings: 0,
    resolvedFindings: 0,
    totalActions: 0,
    resolutionRate: 0,
  });

  useEffect(() => {
    fetch('/agents/grc/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((error) => console.error('Failed to fetch GRC stats:', error));
  }, []);

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  };

  const Stat = ({ title, value, iconBg, icon }) => (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{title}</p>
          <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{value}</p>
        </div>
        <div style={{ width: 40, height: 40, background: iconBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ borderRadius: 16, padding: 24, color: 'white', background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>✅</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t('grcAgentModule.title')}</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>{t('grcAgentModule.versionLabel', { version: descriptor.version })}</p>
            </div>
          </div>
          <p style={{ margin: 0, opacity: 0.95 }}>{t('grcAgentModule.description')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
          <Stat title={t('grcAgentModule.statsTotalFindings')} value={stats.totalFindings} iconBg="#dbeafe" icon={<span style={{ color: '#2563eb' }}>📘</span>} />
          <Stat title={t('grcAgentModule.statsOpenFindings')} value={stats.openFindings} iconBg="#ffedd5" icon={<span style={{ color: '#f59e0b' }}>⚠️</span>} />
          <Stat title={t('grcAgentModule.statsResolved')} value={stats.resolvedFindings} iconBg="#dcfce7" icon={<span style={{ color: '#16a34a' }}>✅</span>} />
          <Stat title={t('grcAgentModule.statsTotalActions')} value={stats.totalActions} iconBg="#ede9fe" icon={<span style={{ color: '#7c3aed' }}>⚙️</span>} />
          <Stat title={t('grcAgentModule.statsResolutionRate')} value={`${(stats.resolutionRate * 100).toFixed(1)}%`} iconBg="#e0e7ff" icon={<span style={{ color: '#4f46e5' }}>📈</span>} />
        </div>

        <div style={card}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 18, color: '#0f172a' }}>{t('grcAgentModule.capabilitiesHeading')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {descriptor.capabilities.map((capability, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: 9999 }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{capability}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 18, color: '#0f172a' }}>{t('grcAgentModule.responsibleAiHeading')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {Object.entries(descriptor.responsible_ai).map(([feature, enabled]) => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: enabled ? '#10b981' : '#cbd5e1' }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                  {t(`grcAgentModule.responsibleAiLabels.${feature}`, { defaultValue: feature.replace(/_/g, ' ') })}
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
