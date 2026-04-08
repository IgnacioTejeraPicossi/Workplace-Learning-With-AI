import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import descriptor from '../configs/agents/telco-ops-agent.json';

const Overview = () => {
  const { t } = useTranslation();
  const features = useMemo(
    () => t('telcoOpsAgentModule.features', { returnObjects: true }),
    [t]
  );
  const featureList = Array.isArray(features) ? features : [];

  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    lastRun: null,
    autoExecutions: 0,
    oneClickApprovals: 0,
  });

  useEffect(() => {
    fetch('/api/agent-runs')
      .then((res) => res.json())
      .then((data) => {
        const allRuns = data.items || [];
        const opsRuns = allRuns.filter((run) => run.module === 'ops');
        const total = opsRuns.length;
        const successful = opsRuns.filter((r) => r.status === 'DONE').length;
        const successRate = total > 0 ? (successful / total) * 100 : 0;
        const lastRun = opsRuns[0];
        const autoExecutions = opsRuns.filter((r) => r.bundle?.mode === 'auto').length;
        const oneClickApprovals = opsRuns.filter((r) => r.bundle?.mode === 'one_click').length;

        setStats({
          totalRuns: total,
          successRate: Number(successRate.toFixed(1)),
          lastRun: lastRun?.started_at,
          autoExecutions,
          oneClickApprovals,
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

  const StatCard = ({ label, value, icon }) => {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{value}</p>
          </div>
          <div style={{ fontSize: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))', padding: '12px', borderRadius: '12px' }}>
            <span>{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        <div
          style={{
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ fontSize: '40px' }}>📡</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t('telcoOpsAgentModule.title')}</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{t('telcoOpsAgentModule.tagline')}</p>
            </div>
          </div>
          <p style={{ marginTop: '12px', opacity: 0.95 }}>{t('telcoOpsAgentModule.description')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard label={t('telcoOpsAgentModule.statsTotalRuns')} value={stats.totalRuns} icon="🔄" />
          <StatCard label={t('telcoOpsAgentModule.statsSuccessRate')} value={`${stats.successRate}%`} icon="✅" />
          <StatCard label={t('telcoOpsAgentModule.statsAutoExecutions')} value={stats.autoExecutions} icon="🤖" />
          <StatCard label={t('telcoOpsAgentModule.statsOneClickApprovals')} value={stats.oneClickApprovals} icon="👆" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.capabilitiesHeading')}</h3>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {descriptor.capabilities.map((cap, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#eff6ff', borderRadius: '10px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {cap.includes('order') ? '📦' : cap.includes('subscription') ? '📋' : cap.includes('appointment') ? '📅' : cap.includes('comm') ? '📧' : cap.includes('crm') ? '🎫' : '🔧'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔌</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.integrationsHeading')}</h3>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {Object.entries(descriptor.integrations).map(([key]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {key.includes('tmf622') ? '📦' : key.includes('tmf679') ? '✅' : key.includes('appoint') ? '📅' : key.includes('comm') ? '📧' : key.includes('crm') ? '🎫' : '🔧'}
                    </span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{key.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', textAlign: 'right', marginLeft: '8px' }}>
                    {t(`telcoOpsAgentModule.integrations.${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.keyFeaturesHeading')}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {featureList.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', background: '#eff6ff', borderRadius: '10px' }}>
                <span style={{ color: '#2563eb', marginTop: 2 }}>✓</span>
                <span style={{ fontSize: '13px', color: '#334155' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            background: 'linear-gradient(90deg, #16a34a 0%, #2563eb 100%)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '22px' }}>🛡️</span>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{t('telcoOpsAgentModule.policyGuardrails')}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, marginBottom: '6px', opacity: 0.95 }}>
                {t('telcoOpsAgentModule.policyMaxAutoValue', { value: descriptor.policy.max_auto_value })}
              </p>
              <p style={{ margin: 0, opacity: 0.95 }}>
                {t('telcoOpsAgentModule.policyConfidence', { pct: descriptor.policy.confidence_threshold * 100 })}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, marginBottom: '6px', opacity: 0.95 }}>
                {t('telcoOpsAgentModule.policyRisk', { value: descriptor.policy.risk_threshold })}
              </p>
              <p style={{ margin: 0, opacity: 0.95 }}>
                {t('telcoOpsAgentModule.policyApprovalRoles', { list: descriptor.policy.required_approval_roles.join(', ') })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
