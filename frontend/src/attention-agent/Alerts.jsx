import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  AttentionSectionHeader,
  attentionLocale,
  attentionPanelStyle,
} from './sharedUi';

const PRIORITY_I18N = {
  urgent: 'priorityUrgent',
  high: 'priorityHigh',
  medium: 'priorityMedium',
  low: 'priorityLow',
};

const Alerts = () => {
  const { t, i18n } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const loc = attentionLocale(i18n);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const url =
        filter === 'all' ? '/agents/attention/alerts' : `/agents/attention/alerts?priority=${filter}`;

      const response = await fetch(url);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      urgent: { bg: '#fee2e2', color: '#991b1b' },
      high: { bg: '#ffedd5', color: '#9a3412' },
      medium: { bg: '#fef9c3', color: '#854d0e' },
      low: { bg: '#dcfce7', color: '#166534' },
    };
    return styles[priority] || { bg: '#f1f5f9', color: '#475569' };
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: { bg: '#fef9c3', color: '#854d0e' },
      sent: { bg: '#dbeafe', color: '#1e40af' },
      acknowledged: { bg: '#dcfce7', color: '#166534' },
      resolved: { bg: '#f1f5f9', color: '#475569' },
    };
    return styles[status] || { bg: '#f1f5f9', color: '#475569' };
  };

  const getChannelIcon = (channel) => {
    const icons = {
      slack: '💬',
      teams: '💬',
      email: '📧',
      calendar: '📅',
    };
    return icons[channel] || '📡';
  };

  const priorityLabel = (p) => {
    const key = PRIORITY_I18N[p];
    return key ? t(`personalAttentionAgentModule.${key}`) : (p || '').toString();
  };

  const statusLabel = (s) => t(`personalAttentionAgentModule.alertStatus.${s}`, { defaultValue: s });

  const fmt = (d) => {
    if (!d) return '';
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? '' : x.toLocaleString(loc);
  };

  const filterControl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label style={{ color: 'white', fontSize: '14px', fontWeight: 600, opacity: 0.95 }}>{t('personalAttentionAgentModule.filter')}:</label>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          borderRadius: '10px',
          padding: '8px 12px',
          border: '1px solid rgba(255,255,255,0.5)',
          background: 'rgba(255,255,255,0.95)',
          color: '#0f172a',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <option value="all">{t('personalAttentionAgentModule.filterAllPriorities')}</option>
        <option value="urgent">{t('personalAttentionAgentModule.priorityUrgent')}</option>
        <option value="high">{t('personalAttentionAgentModule.priorityHigh')}</option>
        <option value="medium">{t('personalAttentionAgentModule.priorityMedium')}</option>
        <option value="low">{t('personalAttentionAgentModule.priorityLow')}</option>
      </select>
    </div>
  );

  return (
    <AttentionPage>
      <AttentionHero
        icon="🚨"
        title={t('personalAttentionAgentModule.alertsPageTitle')}
        subtitle={t('personalAttentionAgentModule.alertsPageSubtitle')}
        trailing={filterControl}
      />

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="🔔" title={t('personalAttentionAgentModule.recentAlerts')} />

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>{t('personalAttentionAgentModule.loadingAlerts')}</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b' }}>{t('personalAttentionAgentModule.noAlertsFound')}</p>
            <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#94a3b8' }}>{t('personalAttentionAgentModule.alertsWillAppear')}</p>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
            {alerts.map((alert) => {
              const ps = getPriorityStyle(alert.priority);
              const ss = getStatusStyle(alert.status);
              return (
                <div
                  key={alert._id}
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
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                          {t('personalAttentionAgentModule.alertNumber', { id: alert._id.slice(-8) })}
                        </h4>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: ps.bg,
                            color: ps.color,
                          }}
                        >
                          {priorityLabel(alert.priority)}
                        </span>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: ss.bg,
                            color: ss.color,
                          }}
                        >
                          {statusLabel(alert.status)}
                        </span>
                      </div>

                      {alert.assignedTo && (
                        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#475569' }}>
                          {t('personalAttentionAgentModule.assignedTo')}: <strong>{alert.assignedTo}</strong>
                        </p>
                      )}

                      <div style={{ marginBottom: '12px' }}>
                        <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                          {t('personalAttentionAgentModule.dispatchedVia')}
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(alert.dispatchedVia || []).map((channel, i) => (
                            <span
                              key={i}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: '#eff6ff',
                                borderRadius: '999px',
                                fontSize: '13px',
                                color: '#1e3a8a',
                                border: '1px solid #dbeafe',
                              }}
                            >
                              <span>{getChannelIcon(channel)}</span>
                              <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {alert.artifacts && Object.keys(alert.artifacts).length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                            {t('personalAttentionAgentModule.executionArtifacts')}
                          </h5>
                          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                            <pre style={{ margin: 0, fontSize: '12px', color: '#475569', overflowX: 'auto' }}>
                              {JSON.stringify(alert.artifacts, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {alert.status === 'pending' && (
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
                          {t('personalAttentionAgentModule.acknowledge')}
                        </button>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          type="button"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: '#dcfce7',
                            color: '#166534',
                          }}
                        >
                          {t('personalAttentionAgentModule.resolve')}
                        </button>
                      )}
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
                      {t('personalAttentionAgentModule.created')}: {fmt(alert.createdAt)}
                    </span>
                    {alert.updatedAt && (
                      <span>
                        {t('personalAttentionAgentModule.updated')}: {fmt(alert.updatedAt)}
                      </span>
                    )}
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

export default Alerts;
