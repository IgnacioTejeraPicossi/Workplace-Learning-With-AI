import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

const SecurityPanel = () => {
  const { colors } = useTheme();
  const [selectedOption, setSelectedOption] = useState('local-installation');
  const [securityStatus, setSecurityStatus] = useState({
    localInstallation: 'active',
    dataDeletion: 'enabled',
    dataPrivacy: 'protected',
    anonymization: 'enabled',
    securityInfo: 'up-to-date',
    realTimeConversions: 'monitoring'
  });

  const securityOptions = [
    {
      key: 'local-installation',
      label: 'Local Installation',
      icon: '🏠',
      description: 'Manage your local security settings and configurations',
      status: securityStatus.localInstallation
    },
    {
      key: 'automatic-data-deletion',
      label: 'Automatic Data Deletion',
      icon: '🗑️',
      description: 'Configure automatic data cleanup and retention policies',
      status: securityStatus.dataDeletion
    },
    {
      key: 'your-data',
      label: 'Your Data',
      icon: '📊',
      description: 'View and manage your personal data and privacy settings',
      status: securityStatus.dataPrivacy
    },
    {
      key: 'data-anonymization',
      label: 'Data Anonymization',
      icon: '🕵️',
      description: 'Configure data anonymization and privacy protection',
      status: securityStatus.anonymization
    },
    {
      key: 'security-information',
      label: 'Security Information',
      icon: '🔒',
      description: 'Access security documentation and compliance information',
      status: securityStatus.securityInfo
    },
    {
      key: 'real-time-conversions',
      label: 'Real-time Conversions',
      icon: '⚡',
      description: 'Monitor real-time security events and conversions',
      status: securityStatus.realTimeConversions
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

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'enabled':
        return 'Enabled';
      case 'protected':
        return 'Protected';
      case 'up-to-date':
        return 'Up to Date';
      case 'monitoring':
        return 'Monitoring';
      default:
        return status;
    }
  };

  const renderOptionContent = () => {
    switch (selectedOption) {
      case 'local-installation':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: colors.primary, marginBottom: '16px' }}>Local Installation Security</h3>
            <div style={{ 
              background: colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ marginBottom: '12px' }}>Security Status: ✅ Active</h4>
              <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
                Your local installation is properly secured with the following features:
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                  🔐 <strong>Encryption:</strong> All local data is encrypted at rest
                </li>
                <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                  🚪 <strong>Access Control:</strong> Local authentication required
                </li>
                <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                  🛡️ <strong>Firewall:</strong> Local network access restricted
                </li>
                <li style={{ padding: '8px 0' }}>
                  🔒 <strong>Updates:</strong> Security patches automatically applied
                </li>
              </ul>
            </div>
          </div>
        );

      case 'automatic-data-deletion':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: colors.primary, marginBottom: '16px' }}>Automatic Data Deletion</h3>
            <div style={{ 
              background: colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ marginBottom: '12px' }}>Data Retention Policy: ✅ Enabled</h4>
              <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
                Configure how long your data is retained before automatic deletion:
              </p>
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div style={{ padding: '16px', background: colors.sidebarBackground, borderRadius: '6px' }}>
                  <strong>User Activity Logs:</strong> 30 days
                </div>
                <div style={{ padding: '16px', background: colors.sidebarBackground, borderRadius: '6px' }}>
                  <strong>Temporary Files:</strong> 7 days
                </div>
                <div style={{ padding: '16px', background: colors.sidebarBackground, borderRadius: '6px' }}>
                  <strong>Cache Data:</strong> 24 hours
                </div>
                <div style={{ padding: '16px', background: colors.sidebarBackground, borderRadius: '6px' }}>
                  <strong>Session Data:</strong> Until logout
                </div>
              </div>
            </div>
          </div>
        );

      case 'your-data':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: colors.primary, marginBottom: '16px' }}>Your Data & Privacy</h3>
            <div style={{ 
              background: colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ marginBottom: '12px' }}>Data Protection: ✅ Protected</h4>
              <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
                You have full control over your personal data:
              </p>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: colors.sidebarBackground,
                  borderRadius: '6px'
                }}>
                  <span>Personal Information</span>
                  <button style={{
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    View/Edit
                  </button>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: colors.sidebarBackground,
                  borderRadius: '6px'
                }}>
                  <span>Learning History</span>
                  <button style={{
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    Export
                  </button>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: colors.sidebarBackground,
                  borderRadius: '6px'
                }}>
                  <span>Account Deletion</span>
                  <button style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data-anonymization':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: colors.primary, marginBottom: '16px' }}>Data Anonymization</h3>
            <div style={{ 
              background: colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ marginBottom: '12px' }}>Privacy Protection: ✅ Enabled</h4>
              <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
                Your data is automatically anonymized to protect your privacy:
              </p>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px',
                  border: `2px solid ${getStatusColor('enabled')}`
                }}>
                  <strong>Personal Identifiers:</strong> Removed or hashed
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px',
                  border: `2px solid ${getStatusColor('enabled')}`
                }}>
                  <strong>Location Data:</strong> Generalized to city level
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px',
                  border: `2px solid ${getStatusColor('enabled')}`
                }}>
                  <strong>Usage Patterns:</strong> Aggregated and anonymized
                </div>
              </div>
            </div>
          </div>
        );

      case 'security-information':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: colors.primary, marginBottom: '16px' }}>Security Information</h3>
            <div style={{ 
              background: colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ marginBottom: '12px' }}>Security Status: ✅ Up to Date</h4>
              <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
                Latest security information and compliance details:
              </p>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px'
                }}>
                  <strong>Last Security Audit:</strong> 2024-01-15
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px'
                }}>
                  <strong>Compliance:</strong> GDPR, CCPA, SOC 2 Type II
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px'
                }}>
                  <strong>Security Certifications:</strong> ISO 27001, PCI DSS
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: colors.sidebarBackground, 
                  borderRadius: '6px'
                }}>
                  <strong>Penetration Testing:</strong> Quarterly assessments
                </div>
              </div>
            </div>
          </div>
        );

      case 'real-time-conversions':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: colors.primary, marginBottom: '16px' }}>Real-time Security Monitoring</h3>
            <div style={{ 
              background: colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ marginBottom: '12px' }}>Monitoring Status: ✅ Active</h4>
              <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
                Real-time security events and threat detection:
              </p>
              <div style={{ 
                background: colors.sidebarBackground, 
                padding: '16px', 
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                <div style={{ color: '#4caf50' }}>✓ 2024-01-15 14:30:22 - Security scan completed</div>
                <div style={{ color: '#4caf50' }}>✓ 2024-01-15 14:25:15 - Firewall rules updated</div>
                <div style={{ color: '#4caf50' }}>✓ 2024-01-15 14:20:08 - Authentication successful</div>
                <div style={{ color: '#ff9800' }}>⚠ 2024-01-15 14:15:33 - Unusual login attempt detected</div>
                <div style={{ color: '#4caf50' }}>✓ 2024-01-15 14:10:45 - Data backup completed</div>
                <div style={{ color: '#4caf50' }}>✓ 2024-01-15 14:05:12 - SSL certificate validated</div>
              </div>
            </div>
          </div>
        );

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
          Security Center
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
        {renderOptionContent()}
      </div>
    </div>
  );
};

export default SecurityPanel;
