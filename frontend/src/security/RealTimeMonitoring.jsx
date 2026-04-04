import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import {
  getSecurityEvents,
  getRecentEventCount,
  clearSecurityEvents,
  EventType,
  EventSeverity
} from '../utils/securityEventLog';

const RealTimeMonitoring = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterHours, setFilterHours] = useState(0); // 0 = all time
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const intervalRef = useRef(null);

  const loadEvents = useCallback(() => {
    const filters = {};
    if (filterType !== 'all') filters.type = filterType;
    if (filterSeverity !== 'all') filters.severity = filterSeverity;
    if (filterHours > 0) {
      filters.since = new Date(Date.now() - filterHours * 60 * 60 * 1000).toISOString();
    }
    setEvents(getSecurityEvents(filters));
  }, [filterType, filterSeverity, filterHours]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadEvents, refreshInterval * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, refreshInterval, loadEvents]);

  const handleClearLogs = () => {
    clearSecurityEvents();
    setEvents([]);
    setShowClearConfirm(false);
  };

  // KPI calculations
  const allEvents = getSecurityEvents();
  const last24h = getRecentEventCount(24);
  const last1h = getRecentEventCount(1);
  const criticalCount = allEvents.filter(e => e.severity === EventSeverity.CRITICAL || e.severity === EventSeverity.ERROR).length;
  const warningCount = allEvents.filter(e => e.severity === EventSeverity.WARNING).length;

  // Unique event types present
  const uniqueTypes = [...new Set(allEvents.map(e => e.type))];

  const severityConfig = {
    [EventSeverity.CRITICAL]: { icon: '🔴', color: '#c62828', bg: '#ffebee' },
    [EventSeverity.ERROR]:    { icon: '🟠', color: '#e65100', bg: '#fff3e0' },
    [EventSeverity.WARNING]:  { icon: '🟡', color: '#f57f17', bg: '#fffde7' },
    [EventSeverity.OK]:       { icon: '🟢', color: '#2e7d32', bg: '#e8f5e9' },
    [EventSeverity.INFO]:     { icon: '🔵', color: '#1565c0', bg: '#e3f2fd' }
  };

  const typeIcons = {
    [EventType.ENCRYPTION_ENABLED]:   '🔒',
    [EventType.ENCRYPTION_DISABLED]:  '🔓',
    [EventType.DATA_PURGE]:           '🗑️',
    [EventType.DATA_EXPORT]:          '📦',
    [EventType.ANONYMIZATION_TOGGLED]:'🛡️',
    [EventType.ANONYMIZATION_APPLIED]:'🎭',
    [EventType.ACCOUNT_DELETION]:     '⚠️',
    [EventType.POLICY_CHANGED]:       '📋',
    [EventType.AUTH_SUCCESS]:         '✅',
    [EventType.AUTH_FAILURE]:         '❌',
    [EventType.SCAN_COMPLETED]:       '🔍',
    [EventType.SETTINGS_CHANGED]:     '⚙️'
  };

  const cardStyle = {
    background: colors.background,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: '20px'
  };

  const formatTimestamp = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return t('security.realTime.timeAgo.justNow');
    if (diffMin < 60) return t('security.realTime.timeAgo.minutes', { count: diffMin });
    if (diffHr < 24) return t('security.realTime.timeAgo.hours', { count: diffHr });

    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '20px' }}>
        {t('security.realTime.title')}
      </h3>

      {/* KPI Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {[
          { label: t('security.realTime.kpi.totalEvents'), value: allEvents.length, icon: '📊', color: colors.primary },
          { label: t('security.realTime.kpi.last24h'), value: last24h, icon: '🕐', color: '#1565c0' },
          { label: t('security.realTime.kpi.last1h'), value: last1h, icon: '⚡', color: '#6a1b9a' },
          { label: t('security.realTime.kpi.criticalErrors'), value: criticalCount, icon: '🔴', color: criticalCount > 0 ? '#c62828' : '#4caf50' },
          { label: t('security.realTime.kpi.warnings'), value: warningCount, icon: '🟡', color: warningCount > 0 ? '#f57f17' : '#4caf50' }
        ].map((kpi, i) => (
          <div key={i} style={{
            ...cardStyle,
            marginBottom: 0,
            padding: '16px',
            textAlign: 'center',
            borderTop: `3px solid ${kpi.color}`
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{kpi.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: colors.textSecondary }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '16px 20px'
      }}>
        {/* Auto-refresh toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          {t('security.realTime.autoRefresh')}
        </label>

        {autoRefresh && (
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`,
              background: colors.sidebarBackground,
              fontSize: '13px'
            }}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        )}

        <div style={{ borderLeft: `1px solid ${colors.border}`, height: '24px' }} />

        {/* Filters */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${colors.border}`,
            background: colors.sidebarBackground,
            fontSize: '13px'
          }}
        >
          <option value="all">{t('security.realTime.filters.allTypes')}</option>
          {Object.values(EventType).map(type => (
            <option key={type} value={type}>
              {typeIcons[type] || '📌'} {t(`security.realTime.eventTypes.${type}`)}
            </option>
          ))}
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${colors.border}`,
            background: colors.sidebarBackground,
            fontSize: '13px'
          }}
        >
          <option value="all">{t('security.realTime.filters.allSeverities')}</option>
          {Object.values(EventSeverity).map(sev => (
            <option key={sev} value={sev}>
              {severityConfig[sev]?.icon} {t(`security.realTime.severities.${sev}`)}
            </option>
          ))}
        </select>

        <select
          value={filterHours}
          onChange={(e) => setFilterHours(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${colors.border}`,
            background: colors.sidebarBackground,
            fontSize: '13px'
          }}
        >
          <option value={0}>{t('security.realTime.filters.allTime')}</option>
          <option value={1}>{t('security.realTime.filters.last1h')}</option>
          <option value={24}>{t('security.realTime.filters.last24h')}</option>
          <option value={168}>{t('security.realTime.filters.last7d')}</option>
        </select>

        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <button
          onClick={loadEvents}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          🔄 {t('security.realTime.refresh')}
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={allEvents.length === 0}
          style={{
            padding: '6px 14px',
            background: allEvents.length > 0 ? '#ffebee' : '#eee',
            border: `1px solid ${allEvents.length > 0 ? '#ef9a9a' : colors.border}`,
            borderRadius: '6px',
            cursor: allEvents.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            color: allEvents.length > 0 ? '#c62828' : '#999'
          }}
        >
          🗑️ {t('security.realTime.clearLogs')}
        </button>
      </div>

      {/* Status indicator */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: autoRefresh ? '#4caf50' : '#ff9800',
          animation: autoRefresh ? 'pulse 2s infinite' : 'none'
        }} />
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {t('security.realTime.monitoringStatus')}:{' '}
          {autoRefresh ? t('security.realTime.statusLive') : t('security.realTime.statusPaused')}
        </span>
        <span style={{ fontSize: '13px', color: colors.textSecondary }}>
          — {t('security.realTime.showingEvents', { count: events.length, total: allEvents.length })}
        </span>
      </div>

      {/* Event List */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '16px' }}>📋 {t('security.realTime.eventLog')}</h4>

        {events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: colors.textSecondary
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{t('security.realTime.noEvents')}</p>
            <p style={{ fontSize: '14px' }}>{t('security.realTime.noEventsDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '6px', maxHeight: '500px', overflowY: 'auto' }}>
            {events.map((event) => {
              const sevConf = severityConfig[event.severity] || severityConfig[EventSeverity.INFO];
              return (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: sevConf.bg,
                  borderRadius: '6px',
                  borderLeft: `4px solid ${sevConf.color}`,
                  fontSize: '14px'
                }}>
                  {/* Type icon */}
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>
                    {typeIcons[event.type] || '📌'}
                  </span>

                  {/* Event info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                      {t(`security.realTime.eventTypes.${event.type}`)}
                    </div>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                        {Object.entries(event.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Severity badge */}
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: sevConf.color,
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {sevConf.icon} {t(`security.realTime.severities.${event.severity}`)}
                  </span>

                  {/* Time */}
                  <span style={{
                    fontSize: '12px',
                    color: colors.textSecondary,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Type Summary */}
      {uniqueTypes.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ marginBottom: '16px' }}>📈 {t('security.realTime.eventSummary')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {uniqueTypes.map(type => {
              const count = allEvents.filter(e => e.type === type).length;
              const pct = Math.round((count / allEvents.length) * 100);
              return (
                <div key={type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: colors.sidebarBackground,
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '18px' }}>{typeIcons[type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      {t(`security.realTime.eventTypes.${type}`)}
                    </div>
                    <div style={{
                      height: '4px',
                      background: '#e0e0e0',
                      borderRadius: '2px',
                      marginTop: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors.primary, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: colors.primary }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.background,
            padding: '28px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h4 style={{ margin: '0 0 12px', color: '#c62828' }}>
              ⚠️ {t('security.realTime.clearConfirmTitle')}
            </h4>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
              {t('security.realTime.clearConfirmDesc', { count: allEvents.length })}
            </p>
            <p style={{ fontSize: '13px', color: '#c62828', marginBottom: '20px' }}>
              {t('security.realTime.clearConfirmWarn')}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '8px 20px',
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {t('security.realTime.cancel')}
              </button>
              <button
                onClick={handleClearLogs}
                style={{
                  padding: '8px 20px',
                  background: '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗑️ {t('security.realTime.confirmClear')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default RealTimeMonitoring;
