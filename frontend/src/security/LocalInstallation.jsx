import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { enableLocalEncryption, disableLocalEncryption, isEncryptionActive } from '../utils/encryptedStorage';
import { logSecurityEvent, EventType, EventSeverity } from '../utils/securityEventLog';

const LocalInstallation = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [encryptionOn, setEncryptionOn] = useState(isEncryptionActive());

  const handleActivate = async () => {
    const pw = prompt(t('security.localInstallation.passphrasePrompt'));
    if (!pw) return;
    await enableLocalEncryption(pw);
    setEncryptionOn(true);
    logSecurityEvent(EventType.ENCRYPTION_ENABLED, EventSeverity.OK, { action: 'encryption_activated' });
  };

  const handleDisable = () => {
    disableLocalEncryption();
    setEncryptionOn(false);
    logSecurityEvent(EventType.ENCRYPTION_DISABLED, EventSeverity.WARNING, { action: 'encryption_deactivated' });
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '16px' }}>
        {t('security.localInstallation.title')}
      </h3>
      <div style={{
        background: colors.background,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>
            {t('security.localInstallation.statusLabel')}{' '}
            {encryptionOn
              ? `\u2705 ${t('security.localInstallation.statusActive')}`
              : `\u26A0\uFE0F ${t('security.localInstallation.statusInactive')}`}
          </h4>
          <div>
            {encryptionOn ? (
              <button
                onClick={handleDisable}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
              >
                {t('security.localInstallation.disable')}
              </button>
            ) : (
              <button
                onClick={handleActivate}
                style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer' }}
              >
                {t('security.localInstallation.activate')}
              </button>
            )}
          </div>
        </div>
        <p style={{ marginBottom: '16px', color: colors.textSecondary }}>
          {t('security.localInstallation.description')}
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
            \uD83D\uDD10 <strong>{t('security.localInstallation.encryption')}:</strong>{' '}
            {encryptionOn
              ? t('security.localInstallation.encryptionActive')
              : t('security.localInstallation.encryptionDisabled')}
          </li>
          <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
            \uD83D\uDEAA <strong>{t('security.localInstallation.accessControl')}:</strong>{' '}
            {t('security.localInstallation.accessControlDesc')}
          </li>
          <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
            \uD83D\uDEE1\uFE0F <strong>{t('security.localInstallation.firewall')}:</strong>{' '}
            {t('security.localInstallation.firewallDesc')}
          </li>
          <li style={{ padding: '8px 0' }}>
            \uD83D\uDD12 <strong>{t('security.localInstallation.updates')}:</strong>{' '}
            {t('security.localInstallation.updatesDesc')}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LocalInstallation;
