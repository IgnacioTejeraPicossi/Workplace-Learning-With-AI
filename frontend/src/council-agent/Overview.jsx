import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import descriptor from '../configs/agents/council-agent.json';

const Overview = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalDeliberations: 0,
    personasUsed: 0,
    briefsPublished: 0,
    challengesRequested: 0,
    avgDiversityScore: 0.0
  });

  useEffect(() => {
    fetch('/agents/council/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(error => console.error("Failed to fetch Council stats:", error));
  }, []);

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  };

  const lensLabel = (lens) => t(`councilAgentModule.lensLabels.${lens}`, { defaultValue: lens });
  const regionLabel = (region) => t(`councilAgentModule.regionLabels.${region}`, { defaultValue: region });
  const personaDisplayName = (persona) =>
    t(`councilAgentModule.personaNames.${persona.id}`, { defaultValue: persona.name });

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ borderRadius: '16px', padding: '24px', color: 'white', background: 'linear-gradient(90deg,#7c3aed 0%, #2563eb 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 18 }}>🏛️</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t('councilAgentModule.title')}</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>{t('councilAgentModule.description')}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t('councilAgentModule.statsTotalDeliberations')}</p>
                <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{stats.totalDeliberations}</p>
              </div>
              <div style={{ width: 32, height: 32, background: '#dbeafe', color: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏛️</div>
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t('councilAgentModule.statsPersonasUsed')}</p>
                <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{stats.personasUsed}</p>
              </div>
              <div style={{ width: 32, height: 32, background: '#dcfce7', color: '#16a34a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t('councilAgentModule.statsBriefsPublished')}</p>
                <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{stats.briefsPublished}</p>
              </div>
              <div style={{ width: 32, height: 32, background: '#ede9fe', color: '#7c3aed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t('councilAgentModule.statsAvgDiversity')}</p>
                <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{(stats.avgDiversityScore * 100).toFixed(1)}%</p>
              </div>
              <div style={{ width: 32, height: 32, background: '#ffedd5', color: '#f59e0b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎯</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{t('councilAgentModule.keyFeaturesHeading')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Feature icon="🔍" title={t('councilAgentModule.featureMultiPersonaTitle')} desc={t('councilAgentModule.featureMultiPersonaDesc')} color="#2563eb" bg="#dbeafe" />
            <Feature icon="🛡️" title={t('councilAgentModule.featureSafetyTitle')} desc={t('councilAgentModule.featureSafetyDesc')} color="#16a34a" bg="#dcfce7" />
            <Feature icon="📊" title={t('councilAgentModule.featureAuditableTitle')} desc={t('councilAgentModule.featureAuditableDesc')} color="#7c3aed" bg="#ede9fe" />
            <Feature icon="🔗" title={t('councilAgentModule.featureIntegrationTitle')} desc={t('councilAgentModule.featureIntegrationDesc')} color="#f59e0b" bg="#ffedd5" />
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{t('councilAgentModule.availablePersonas')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {descriptor.personas.map((persona) => (
              <div key={persona.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, background: '#dbeafe', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#2563eb', fontSize: 12 }}>{persona.lens.charAt(0)}</span>
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{personaDisplayName(persona)}</h4>
                </div>
                <p style={{ margin: 0, marginBottom: 6, fontSize: 12, color: '#475569' }}>{lensLabel(persona.lens)} • {regionLabel(persona.region)}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{persona.expertise_tags}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(90deg,#eff6ff,#f5f3ff)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, background: '#dbeafe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#2563eb', fontSize: 16 }}>🔌</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{t('councilAgentModule.mcpHeading')}</h3>
          </div>
          <p style={{ margin: 0, marginBottom: 10, color: '#334155' }}>{t('councilAgentModule.mcpBody')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, fontSize: 12 }}>council.generate</span>
            <span style={{ padding: '6px 10px', background: '#dcfce7', color: '#047857', borderRadius: 999, fontSize: 12 }}>publish.slack</span>
            <span style={{ padding: '6px 10px', background: '#efe9ff', color: '#6b21a8', borderRadius: 999, fontSize: 12 }}>publish.confluence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function Feature({ icon, title, desc, color, bg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 24, height: 24, background: bg, color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
      </div>
      <div>
        <h4 style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{title}</h4>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>{desc}</p>
      </div>
    </div>
  );
}

export default Overview;
