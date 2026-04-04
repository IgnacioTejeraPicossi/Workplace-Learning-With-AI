import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import LocalInstallation from './LocalInstallation';
import AutomaticDataDeletion from './AutomaticDataDeletion';
import YourData from './YourData';
import DataAnonymization from './DataAnonymization';
import SecurityInformation from './SecurityInformation';
import RealTimeMonitoring from './RealTimeMonitoring';
import { isEncryptionActive } from '../utils/encryptedStorage';

const SecurityCenter = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selectedOption, setSelectedOption] = useState('local-installation');

  const securityOptions = [
    {
      key: 'local-installation',
      label: t('security.localInstallation.label'),
      icon: '\uD83C\uDFE0',
      description: t('security.localInstallation.sidebarDesc'),
      status: isEncryptionActive() ? 'active' : 'warning'
    },
    {
      key: 'automatic-data-deletion',
      label: t('security.dataDeletion.label'),
      icon: '\uD83D\uDDD1\uFE0F',
      description: t('security.dataDeletion.sidebarDesc'),
      status: 'enabled'
    },
    {
      key: 'your-data',
      label: t('security.yourData.label'),
      icon: '\uD83D\uDCCA',
      description: t('security.yourData.sidebarDesc'),
      status: 'protected'
    },
    {
      key: 'data-anonymization',
      label: t('security.anonymization.label'),
      icon: '\uD83D\uDD75\uFE0F',
      description: t('security.anonymization.sidebarDesc'),
      status: 'enabled'
    },
    {
      key: 'security-information',
      label: t('security.securityInfo.label'),
      icon: '\uD83D\uDD12',
      description: t('security.securityInfo.sidebarDesc'),
      status: 'up-to-date'
    },
    {
      key: 'real-time-monitoring',
      label: t('security.realTime.label'),
      icon: '\u26A1',
      description: t('security.realTime.sidebarDesc'),
      status: 'monitoring'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'enabled':
      case 'protected':
      case 'up-to-date':
      case 'monitoring':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const renderContent = () => {
    switch (selectedOption) {
      case 'local-installation':
        return <LocalInstallation />;
      case 'automatic-data-deletion':
        return <AutomaticDataDeletion />;
      case 'your-data':
        return <YourData />;
      case 'data-anonymization':
        return <DataAnonymization />;
      case 'security-information':
        return <SecurityInformation />;
      case 'real-time-monitoring':
        return <RealTimeMonitoring />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: colors.background
    }}>
      {/* Left Panel - Security Options */}
      <div style={{
        width: '300px',
        background: colors.sidebarBackground,
        borderRight: `1px solid ${colors.border}`,
        padding: '24px 0',
        overflowY: 'auto'
      }}>
        <h2 style={{
          color: colors.primary,
          marginBottom: '24px',
          padding: '0 24px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {t('security.title')}
        </h2>

        <div style={{ padding: '0 16px' }}>
          {securityOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => setSelectedOption(option.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                marginBottom: '8px',
                background: selectedOption === option.key ? colors.primaryLight : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                border: `1px solid ${selectedOption === option.key ? colors.primary : 'transparent'}`,
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '20px' }}>{option.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '500',
                  color: selectedOption === option.key ? colors.primary : colors.text,
                  marginBottom: '4px'
                }}>
                  {option.label}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                  lineHeight: '1.3'
                }}>
                  {option.description}
                </div>
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor(option.status)
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: colors.background
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SecurityCenter;
