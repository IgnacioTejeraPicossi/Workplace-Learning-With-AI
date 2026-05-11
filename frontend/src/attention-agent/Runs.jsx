import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  AttentionSectionHeader,
  StatCard,
  attentionLocale,
  attentionPanelStyle,
  heroButtonStyle,
} from './sharedUi';

const Runs = () => {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loc = attentionLocale(i18n);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent-runs?module=attention');
      const data = await response.json();
      setRuns(data.items || []);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      DONE: { bg: '#dcfce7', color: '#166534' },
      RUNNING: { bg: '#dbeafe', color: '#1e40af' },
      FAILED: { bg: '#fee2e2', color: '#991b1b' },
      QUEUED: { bg: '#fef9c3', color: '#854d0e' },
    };
    return styles[status] || { bg: '#f1f5f9', color: '#475569' };
  };

  const getStatusIcon = (status) => {
    const icons = {
      DONE: '✅',
      RUNNING: '⏳',
      FAILED: '❌',
      QUEUED: '⏸️',
    };
    return icons[status] || '❓';
  };

  const fmt = (d) => {
    if (!d) return t('personalAttentionAgentModule.notAvailable');
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? t('personalAttentionAgentModule.notAvailable') : x.toLocaleString(loc);
  };

  const done = runs?.filter((r) => r.status === 'DONE').length || 0;
  const running = runs?.filter((r) => r.status === 'RUNNING').length || 0;
  const failed = runs?.filter((r) => r.status === 'FAILED').length || 0;

  const refreshBtn = (
    <button type="button" onClick={loadRuns} style={heroButtonStyle(false)}>
      {t('personalAttentionAgentModule.refresh')}
    </button>
  );

  return (
    <AttentionPage>
      <AttentionHero
        icon="▶️"
        title={t('personalAttentionAgentModule.runsPageTitle')}
        subtitle={t('personalAttentionAgentModule.runsPageSubtitle')}
        trailing={refreshBtn}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label={t('personalAttentionAgentModule.totalRuns')} value={runs?.length || 0} icon="📊" />
        <StatCard label={t('personalAttentionAgentModule.successful')} value={done} icon="✅" />
        <StatCard label={t('personalAttentionAgentModule.running')} value={running} icon="⏳" />
        <StatCard label={t('personalAttentionAgentModule.failed')} value={failed} icon="❌" />
      </div>

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="📜" title={t('personalAttentionAgentModule.recentRuns')} />

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>{t('personalAttentionAgentModule.loadingRuns')}</div>
        ) : runs.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b' }}>{t('personalAttentionAgentModule.noRunsFound')}</p>
            <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#94a3b8' }}>{t('personalAttentionAgentModule.runsEmptyHint')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%)' }}>
                  {[
                    t('personalAttentionAgentModule.thRunId'),
                    t('personalAttentionAgentModule.thStatus'),
                    t('personalAttentionAgentModule.thTopic'),
                    t('personalAttentionAgentModule.thAttestation'),
                    t('personalAttentionAgentModule.thCreated'),
                    t('personalAttentionAgentModule.thActions'),
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '14px 20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderBottom: '2px solid #e2e8f0',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(runs || []).map((run, index) => {
                  const st = getStatusStyle(run.status);
                  return (
                    <tr key={run.run_id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                          {run.run_id || t('personalAttentionAgentModule.notAvailable')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          <span>{getStatusIcon(run.status)}</span>
                          {run.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '14px', color: '#334155', maxWidth: '280px' }}>
                        {run.bundle?.topic || t('personalAttentionAgentModule.notAvailable')}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {run.attestation_hash ? (
                          <code
                            style={{
                              background: '#f1f5f9',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#475569',
                            }}
                          >
                            {run.attestation_hash.slice(0, 8)}…
                          </code>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmt(run.created_at)}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {t('personalAttentionAgentModule.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AttentionPage>
  );
};

export default Runs;
