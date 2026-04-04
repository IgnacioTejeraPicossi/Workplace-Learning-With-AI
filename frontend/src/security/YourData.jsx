import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';

const YourData = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const dataOptions = [
    {
      key: 'personalInfo',
      action: 'viewEdit',
      buttonColor: colors.primary
    },
    {
      key: 'learningHistory',
      action: 'export',
      buttonColor: colors.primary
    },
    {
      key: 'accountDeletion',
      action: 'delete',
      buttonColor: '#f44336'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '16px' }}>
        {t('security.yourData.title')}
      </h3>
      <div style={{
        background: colors.background,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h4 style={{ marginBottom: '12px' }}>
          {t('security.yourData.protectionStatus')}: ✅ {t('security.yourData.protected')}
        </h4>
        <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
          {t('security.yourData.description')}
        </p>
        <div style={{ display: 'grid', gap: '12px' }}>
          {dataOptions.map((opt) => (
            <div key={opt.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: colors.sidebarBackground,
              borderRadius: '6px'
            }}>
              <span>{t(`security.yourData.options.${opt.key}`)}</span>
              <button style={{
                background: opt.buttonColor,
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                {t(`security.yourData.actions.${opt.action}`)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YourData;
