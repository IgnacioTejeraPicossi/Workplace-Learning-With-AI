import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

const AutomaticDataDeletion = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const policies = [
    { key: 'activityLogs', period: '30' },
    { key: 'tempFiles', period: '7' },
    { key: 'cacheData', period: '24h' },
    { key: 'sessionData', period: 'logout' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '16px' }}>
        {t('security.dataDeletion.title')}
      </h3>
      <div style={{
        background: colors.background,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h4 style={{ marginBottom: '12px' }}>
          {t('security.dataDeletion.policyStatus')}: ✅ {t('security.dataDeletion.enabled')}
        </h4>
        <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
          {t('security.dataDeletion.description')}
        </p>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {policies.map((policy) => (
            <div key={policy.key} style={{ padding: '16px', background: colors.sidebarBackground, borderRadius: '6px' }}>
              <strong>{t(`security.dataDeletion.policies.${policy.key}`)}:</strong>{' '}
              {t(`security.dataDeletion.periods.${policy.key}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomaticDataDeletion;
