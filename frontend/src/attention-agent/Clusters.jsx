import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  AttentionSectionHeader,
  attentionPanelStyle,
  attentionLocale,
  heroButtonStyle,
} from './sharedUi';

const Clusters = () => {
  const { t, i18n } = useTranslation();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loc = attentionLocale(i18n);

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/clusters');
      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (error) {
      console.error('Failed to load clusters:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestAlert = async () => {
    setSending(true);
    try {
      const bundle = {
        run_id: `attn-test-${Date.now()}`,
        topic: 'Test Alert - Vendor Outage',
        summary_md: 'This is a test alert for the Personal Attention Agent',
        evidence: [
          {
            url: 'https://status.example.com',
            source: 'Status Page',
            snippet: 'Service degradation detected',
            published_at: new Date().toISOString(),
          },
        ],
        recommended_actions: [
          {
            title: 'Post status update',
            detail: 'Inform team about the outage',
            assignee: 'oncall@telenor.com',
            due_date: new Date(Date.now() + 3600000).toISOString(),
          },
        ],
        actions: [
          {
            type: 'slack.postMessage',
            payload: {
              channel: '#cto-brief',
              text: '🚨 Test Alert: Vendor outage detected. Please check status page.',
            },
          },
          {
            type: 'teams.sendCard',
            payload: {
              title: 'Vendor Outage Alert',
              summary: 'Service degradation detected on vendor platform',
              url: 'https://status.example.com',
            },
          },
        ],
        callback_url: 'http://localhost:8000/api/agent-runs/callback',
      };

      const response = await fetch('/agents/attention/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });

      if (response.ok) {
        window.alert(t('personalAttentionAgentModule.testAlertOk'));
        loadClusters();
      } else {
        window.alert(t('personalAttentionAgentModule.testAlertFail'));
      }
    } catch (error) {
      console.error('Failed to send test alert:', error);
      window.alert(t('personalAttentionAgentModule.testAlertError'));
    } finally {
      setSending(false);
    }
  };

  const getPriorityStyle = (score) => {
    if (score >= 0.8) return { bg: '#fee2e2', color: '#991b1b' };
    if (score >= 0.6) return { bg: '#ffedd5', color: '#9a3412' };
    if (score >= 0.4) return { bg: '#fef9c3', color: '#854d0e' };
    return { bg: '#dcfce7', color: '#166534' };
  };

  const getPriorityLabel = (score) => {
    if (score >= 0.8) return t('personalAttentionAgentModule.priorityUrgent');
    if (score >= 0.6) return t('personalAttentionAgentModule.priorityHigh');
    if (score >= 0.4) return t('personalAttentionAgentModule.priorityMedium');
    return t('personalAttentionAgentModule.priorityLow');
  };

  const fmt = (d) => {
    if (!d) return '';
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? '' : x.toLocaleString(loc);
  };

  const testBtn = (
    <button type="button" onClick={sendTestAlert} disabled={sending} style={heroButtonStyle(sending)}>
      {sending ? t('personalAttentionAgentModule.sending') : t('personalAttentionAgentModule.sendTestAlert')}
    </button>
  );

  return (
    <AttentionPage>
      <AttentionHero
        icon="🔗"
        title={t('personalAttentionAgentModule.clustersPageTitle')}
        subtitle={t('personalAttentionAgentModule.clustersPageSubtitle')}
        trailing={testBtn}
      />

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="📌" title={t('personalAttentionAgentModule.recentClusters')} />

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>{t('personalAttentionAgentModule.loadingClusters')}</div>
        ) : clusters.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b' }}>{t('personalAttentionAgentModule.noClustersFound')}</p>
            <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#94a3b8' }}>{t('personalAttentionAgentModule.clustersWillAppear')}</p>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
            {clusters.map((cluster) => {
              const pr = getPriorityStyle(cluster.score);
              return (
                <div
                  key={cluster._id}
                  style={{
                    background: 'white',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{cluster.topic}</h4>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: pr.bg,
                            color: pr.color,
                          }}
                        >
                          {getPriorityLabel(cluster.score)} ({cluster.score.toFixed(2)})
                        </span>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#dbeafe',
                            color: '#1e40af',
                          }}
                        >
                          {t('personalAttentionAgentModule.signalCount', { count: cluster.volume })}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>{cluster.summaryMd}</p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                            {t('personalAttentionAgentModule.evidence')}
                          </h5>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {cluster.evidence &&
                              cluster.evidence.slice(0, 3).map((ev, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: '10px 12px',
                                    background: '#eff6ff',
                                    borderRadius: '10px',
                                    border: '1px solid #dbeafe',
                                    fontSize: '13px',
                                  }}
                                >
                                  <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                                    {ev.source}
                                  </a>
                                  {ev.snippet && <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>{ev.snippet}</p>}
                                </div>
                              ))}
                            {cluster.evidence && cluster.evidence.length > 3 && (
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                {t('personalAttentionAgentModule.moreSources', { count: cluster.evidence.length - 3 })}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                            {t('personalAttentionAgentModule.recommendedActions')}
                          </h5>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {cluster.recommended_actions &&
                              cluster.recommended_actions.slice(0, 2).map((action, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: '10px 12px',
                                    background: '#ecfdf5',
                                    borderRadius: '10px',
                                    border: '1px solid #bbf7d0',
                                    fontSize: '13px',
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{action.title}</div>
                                  {action.detail && <div style={{ color: '#475569', fontSize: '12px', marginTop: '6px' }}>{action.detail}</div>}
                                  {action.assignee && (
                                    <div style={{ color: '#2563eb', fontSize: '12px', marginTop: '6px' }}>→ {action.assignee}</div>
                                  )}
                                </div>
                              ))}
                            {cluster.recommended_actions && cluster.recommended_actions.length > 2 && (
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                {t('personalAttentionAgentModule.moreActions', { count: cluster.recommended_actions.length - 2 })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                        }}
                      >
                        {t('personalAttentionAgentModule.sendAlert')}
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {t('personalAttentionAgentModule.viewDetails')}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '14px',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    <span>
                      {t('personalAttentionAgentModule.firstSeen')}: {fmt(cluster.firstSeen)}
                    </span>
                    <span>
                      {t('personalAttentionAgentModule.lastSeen')}: {fmt(cluster.lastSeen)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AttentionPage>
  );
};

export default Clusters;
