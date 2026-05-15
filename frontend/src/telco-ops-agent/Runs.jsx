import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
};

const STATUS_CONFIG = {
  DONE:    { bg: '#dcfce7', color: '#166534', border: '#86efac', icon: '✅', gradFrom: 'rgba(22,163,74,0.15)' },
  RUNNING: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: '⏳', gradFrom: 'rgba(37,99,235,0.15)' },
  FAILED:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '❌', gradFrom: 'rgba(220,38,38,0.15)' },
};

const StatCard = ({ label, value, icon, color }) => (
  <div style={cardStyle}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 700, color: color || '#0f172a' }}>{value}</p>
      </div>
      <div style={{ fontSize: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))', padding: '12px', borderRadius: '12px' }}>
        {icon}
      </div>
    </div>
  </div>
);

const Runs = () => {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loc = i18n.language === 'no' ? 'nb-NO' : 'en-US';

  useEffect(() => { fetchRuns(); }, []);

  const fetchRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/agent-runs');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const allRuns = data.items || [];
      setRuns(allRuns.filter((run) => run.module === 'ops'));
    } catch (e) {
      console.error('Failed to fetch telco ops runs:', e);
      setError(e.message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt) return t('telcoOpsAgentModule.durationNa');
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    return `${Math.round((end - start) / 1000)}s`;
  };

  const getArtifactSummary = (artifacts) => {
    if (!artifacts || Object.keys(artifacts).length === 0) return t('telcoOpsAgentModule.artifactsNone');
    return Object.entries(artifacts).map(([type, items]) =>
      Array.isArray(items)
        ? t('telcoOpsAgentModule.artifactsSummary', { type, count: items.length })
        : t('telcoOpsAgentModule.artifactsSummaryOne', { type })
    ).join(', ');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem', backgroundColor: '#f8fafc' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#f8fafc' }}>
        <div style={{ ...cardStyle, background: 'linear-gradient(90deg, #fee2e2 0%, #fff1f2 100%)', borderColor: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>❌</span>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#991b1b' }}>{t('telcoOpsAgentModule.runsErrorTitle')}</h3>
              <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const total = runs.length;
  const done = runs.filter((r) => r.status === 'DONE').length;
  const running = runs.filter((r) => r.status === 'RUNNING').length;
  const failed = runs.filter((r) => r.status === 'FAILED').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>

        {/* Hero banner */}
        <div style={{
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          background: 'linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '40px' }}>🔄</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t('telcoOpsAgentModule.runsTitle')}</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{t('telcoOpsAgentModule.runsSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchRuns}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            🔄 {t('telcoOpsAgentModule.refresh')}
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard label={t('telcoOpsAgentModule.totalRuns')} value={total} icon="📊" />
          <StatCard label={t('telcoOpsAgentModule.successful')} value={done} icon="✅" color="#16a34a" />
          <StatCard label={t('telcoOpsAgentModule.running')} value={running} icon="⏳" color="#2563eb" />
          <StatCard label={t('telcoOpsAgentModule.failed')} value={failed} icon="❌" color="#dc2626" />
        </div>

        {/* Runs list */}
        {runs.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '56px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🔄</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.runsEmptyTitle')}</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{t('telcoOpsAgentModule.runsEmptyBody')}</p>
          </div>
        ) : (
          <div style={cardStyle}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 90px 1.4fr 70px 1.4fr 130px 150px',
              gap: '8px',
              padding: '10px 16px',
              background: 'linear-gradient(90deg, #eff6ff 0%, #f5f3ff 100%)',
              borderRadius: '10px',
              marginBottom: '8px',
            }}>
              {[
                t('telcoOpsAgentModule.thRunId'),
                t('telcoOpsAgentModule.thStatus'),
                t('telcoOpsAgentModule.thTopic'),
                t('telcoOpsAgentModule.thDuration'),
                t('telcoOpsAgentModule.thArtifacts'),
                t('telcoOpsAgentModule.thAttestation'),
                t('telcoOpsAgentModule.thStarted'),
              ].map((h, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div style={{ display: 'grid', gap: '6px' }}>
              {runs.map((run, index) => {
                const sc = STATUS_CONFIG[run.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: '•', gradFrom: 'rgba(100,116,139,0.1)' };
                return (
                  <div
                    key={run.run_id || index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 90px 1.4fr 70px 1.4fr 130px 150px',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: `linear-gradient(90deg, ${sc.gradFrom} 0%, #f8fafc 30%)`,
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(90deg, ${sc.gradFrom} 0%, #f8fafc 30%)`; }}
                  >
                    <div style={{ fontSize: '12px', color: '#334155', fontFamily: 'monospace', fontWeight: 600 }}>
                      {run.run_id || t('telcoOpsAgentModule.notAvailable')}
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {sc.icon} {run.status}
                    </span>

                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      {run.bundle?.topic || t('telcoOpsAgentModule.notAvailable')}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      {formatDuration(run.started_at, run.ended_at)}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {getArtifactSummary(run.artifacts)}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                      {run.attestation_hash
                        ? `${run.attestation_hash.substring(0, 10)}…`
                        : t('telcoOpsAgentModule.notAvailable')}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {run.started_at
                        ? new Date(run.started_at).toLocaleString(loc)
                        : t('telcoOpsAgentModule.notAvailable')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Runs;
