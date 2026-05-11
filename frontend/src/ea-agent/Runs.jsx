import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  StatCard,
  attentionLocale,
  attentionPanelStyle,
  heroButtonStyle,
} from './sharedUi';

const Runs = () => {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/agents/ea/runs');
      const data = await res.json();
      setRuns(data);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      RUNNING: { bg: '#dbeafe', color: '#1e40af' },
      DONE: { bg: '#dcfce7', color: '#166534' },
      FAILED: { bg: '#fee2e2', color: '#991b1b' },
    };
    return styles[status] || { bg: '#f1f5f9', color: '#475569' };
  };

  const loc = attentionLocale(i18n);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(loc);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(t('eaSecondBrainModule.copiedAlert'));
  };

  const done = runs.filter((r) => r.status === 'DONE').length;
  const running = runs.filter((r) => r.status === 'RUNNING').length;
  const failed = runs.filter((r) => r.status === 'FAILED').length;

  const refreshBtn = (
    <button type="button" onClick={loadRuns} style={heroButtonStyle(false)}>
      {t('eaSecondBrainModule.refresh')}
    </button>
  );

  return (
    <AttentionPage>
      <AttentionHero
        icon="▶️"
        title={t('eaSecondBrainModule.runsTitle')}
        subtitle={t('eaSecondBrainModule.runsSubtitle')}
        trailing={refreshBtn}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label={t('eaSecondBrainModule.statsTotalRuns')} value={runs.length} icon="📊" />
        <StatCard label={t('eaSecondBrainModule.runsStatDone')} value={done} icon="✅" />
        <StatCard label={t('eaSecondBrainModule.runsStatRunning')} value={running} icon="⏳" />
        <StatCard label={t('eaSecondBrainModule.runsStatFailed')} value={failed} icon="❌" />
      </div>

      <div style={attentionPanelStyle}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>{t('eaSecondBrainModule.loadingRuns')}</div>
        ) : runs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>{t('eaSecondBrainModule.noRuns')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%)' }}>
                  {[t('eaSecondBrainModule.thRunId'), t('eaSecondBrainModule.thStatus'), t('eaSecondBrainModule.thTopic'), t('eaSecondBrainModule.thCreated'), t('eaSecondBrainModule.thAttestation')].map((h) => (
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
                {runs.map((run, i) => {
                  const st = getStatusStyle(run.status);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <code style={{ fontSize: '12px', color: '#0f172a' }}>{run.run_id?.substring(0, 16)}…</code>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '14px', color: '#334155', maxWidth: '280px' }}>
                        {run.bundle?.topic || '—'}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(run.created_at)}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        {run.attestation_hash ? (
                          <button type="button" onClick={() => copyToClipboard(run.attestation_hash)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontFamily: 'monospace' }} title={t('eaSecondBrainModule.copyTitle')}>
                            {run.attestation_hash.substring(0, 12)}…
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          borderRadius: '16px',
          padding: '20px 24px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: '24px' }}>ℹ️</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>{t('eaSecondBrainModule.trustTitle')}</h3>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#1e40af', lineHeight: 1.5 }}>{t('eaSecondBrainModule.trustBody')}</p>
        </div>
      </div>
    </AttentionPage>
  );
};

export default Runs;
