import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { enableLocalEncryption, disableLocalEncryption, isEncryptionActive } from '../utils/encryptedStorage';
import { logSecurityEvent, EventType, EventSeverity } from '../utils/securityEventLog';

const LocalInstallation = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [encryptionOn, setEncryptionOn] = useState(isEncryptionActive());
  const [showActivate, setShowActivate] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');

  const openActivate = () => {
    setPass1('');
    setPass2('');
    setError('');
    setShowActivate(true);
  };

  const confirmActivate = async () => {
    if (!pass1) {
      setError(t('security.localInstallation.passphraseEmpty', { defaultValue: 'Enter a passphrase.' }));
      return;
    }
    if (pass1 !== pass2) {
      setError(t('security.localInstallation.passphraseMismatch', { defaultValue: 'The passphrases do not match.' }));
      return;
    }
    await enableLocalEncryption(pass1);
    setEncryptionOn(true);
    logSecurityEvent(EventType.ENCRYPTION_ENABLED, EventSeverity.OK, { action: 'encryption_activated' });
    setShowActivate(false);
    setPass1('');
    setPass2('');
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
        background: colors.cardBackground,
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>
            {t('security.localInstallation.statusLabel')}{' '}
            {encryptionOn
              ? `✅ ${t('security.localInstallation.statusActive')}`
              : `⚠️ ${t('security.localInstallation.statusInactive')}`}
          </h4>
          <div>
            {encryptionOn ? (
              <button
                onClick={handleDisable}
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.cardBackground, color: colors.text, cursor: 'pointer' }}
              >
                {t('security.localInstallation.disable')}
              </button>
            ) : (
              <button
                onClick={openActivate}
                style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: colors.buttonSuccess, color: '#fff', cursor: 'pointer' }}
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
            🔐 <strong>{t('security.localInstallation.encryption')}:</strong>{' '}
            {encryptionOn
              ? t('security.localInstallation.encryptionActive')
              : t('security.localInstallation.encryptionDisabled')}
          </li>
          <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
            🚪 <strong>{t('security.localInstallation.accessControl')}:</strong>{' '}
            {t('security.localInstallation.accessControlDesc')}
          </li>
          <li style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
            🛡️ <strong>{t('security.localInstallation.firewall')}:</strong>{' '}
            {t('security.localInstallation.firewallDesc')}
          </li>
          <li style={{ padding: '8px 0' }}>
            🔒 <strong>{t('security.localInstallation.updates')}:</strong>{' '}
            {t('security.localInstallation.updatesDesc')}
          </li>
        </ul>
      </div>

      {showActivate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('security.localInstallation.passphraseTitle', { defaultValue: 'Enable local encryption' })}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div style={{ background: colors.cardBackground, padding: '24px', borderRadius: '12px', maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', color: colors.text }}>
            <h4 style={{ margin: '0 0 12px', color: colors.primary }}>
              🔐 {t('security.localInstallation.passphraseTitle', { defaultValue: 'Enable local encryption' })}
            </h4>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>
              {t('security.localInstallation.passphraseHint', { defaultValue: 'Choose a passphrase to encrypt your local data. Store it safely — it cannot be recovered.' })}
            </p>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              {t('security.localInstallation.passphraseLabel', { defaultValue: 'Passphrase' })}
            </label>
            <input
              type="password"
              value={pass1}
              autoFocus
              onChange={(e) => { setPass1(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmActivate(); }}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.sidebarBackground, color: colors.text, fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }}
            />
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              {t('security.localInstallation.passphraseConfirm', { defaultValue: 'Confirm passphrase' })}
            </label>
            <input
              type="password"
              value={pass2}
              onChange={(e) => { setPass2(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmActivate(); }}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.sidebarBackground, color: colors.text, fontSize: '14px', boxSizing: 'border-box', marginBottom: '8px' }}
            />
            {error && <p style={{ color: '#c62828', fontSize: '13px', margin: '0 0 8px' }}>⚠️ {error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={() => setShowActivate(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', color: colors.text }}
              >
                {t('security.localInstallation.passphraseCancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={confirmActivate}
                style={{ padding: '8px 16px', background: colors.buttonSuccess, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {t('security.localInstallation.passphraseEnable', { defaultValue: 'Enable encryption' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalInstallation;
