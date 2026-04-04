import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

const SecurityInformation = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const infoItems = [
    { key: 'lastAudit' },
    { key: 'compliance' },
    { key: 'certifications' },
    { key: 'penTesting' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '16px' }}>
        {t('security.securityInfo.title')}
      </h3>
      <div style={{
        background: colors.background,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h4 style={{ marginBottom: '12px' }}>
          {t('security.securityInfo.statusLabel')}: ✅ {t('security.securityInfo.upToDate')}
        </h4>
        <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
          {t('security.securityInfo.description')}
        </p>
        <div style={{ display: 'grid', gap: '16px' }}>
          {infoItems.map((item) => (
            <div key={item.key} style={{
              padding: '16px',
              background: colors.sidebarBackground,
              borderRadius: '6px'
            }}>
              <strong>{t(`security.securityInfo.items.${item.key}.name`)}:</strong>{' '}
              {t(`security.securityInfo.items.${item.key}.value`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityInformation;
