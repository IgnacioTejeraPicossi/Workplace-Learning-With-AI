import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

const DataAnonymization = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const rules = [
    { key: 'personalIdentifiers' },
    { key: 'locationData' },
    { key: 'usagePatterns' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '16px' }}>
        {t('security.anonymization.title')}
      </h3>
      <div style={{
        background: colors.background,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h4 style={{ marginBottom: '12px' }}>
          {t('security.anonymization.privacyStatus')}: ✅ {t('security.anonymization.enabled')}
        </h4>
        <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
          {t('security.anonymization.description')}
        </p>
        <div style={{ display: 'grid', gap: '16px' }}>
          {rules.map((rule) => (
            <div key={rule.key} style={{
              padding: '16px',
              background: colors.sidebarBackground,
              borderRadius: '6px',
              border: '2px solid #4caf50'
            }}>
              <strong>{t(`security.anonymization.rules.${rule.key}.name`)}:</strong>{' '}
              {t(`security.anonymization.rules.${rule.key}.desc`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataAnonymization;
