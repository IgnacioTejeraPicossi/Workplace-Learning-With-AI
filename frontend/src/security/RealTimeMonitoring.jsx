import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

const RealTimeMonitoring = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Placeholder events — will be replaced with real event log in Phase 6
  const events = [
    { time: '14:30:22', key: 'scanCompleted', severity: 'ok' },
    { time: '14:25:15', key: 'firewallUpdated', severity: 'ok' },
    { time: '14:20:08', key: 'authSuccess', severity: 'ok' },
    { time: '14:15:33', key: 'unusualLogin', severity: 'warning' },
    { time: '14:10:45', key: 'backupCompleted', severity: 'ok' },
    { time: '14:05:12', key: 'sslValidated', severity: 'ok' }
  ];

  const getSeverityColor = (severity) => {
    return severity === 'warning' ? '#ff9800' : '#4caf50';
  };

  const getSeverityIcon = (severity) => {
    return severity === 'warning' ? '\u26A0' : '\u2713';
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '16px' }}>
        {t('security.realTime.title')}
      </h3>
      <div style={{
        background: colors.background,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h4 style={{ marginBottom: '12px' }}>
          {t('security.realTime.monitoringStatus')}: ✅ {t('security.realTime.active')}
        </h4>
        <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
          {t('security.realTime.description')}
        </p>
        <div style={{
          background: colors.sidebarBackground,
          padding: '16px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {events.map((event, index) => (
            <div key={index} style={{ color: getSeverityColor(event.severity), padding: '2px 0' }}>
              {getSeverityIcon(event.severity)} {event.time} - {t(`security.realTime.events.${event.key}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;
