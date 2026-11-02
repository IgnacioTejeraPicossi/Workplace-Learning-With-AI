import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RCQA_API,
  fetchRcqaSettings,
  invalidateRcqaSettingsCache,
  stripTrailingSlash,
} from '../../red-cross-qa/settingsApi';

/**
 * "Use as local env for RC QA Agent" — Web Lab → RCQA Settings contract.
 *
 * docs/web-lab-plan.md §7:
 *   POST { env_local_url, env_default: "local" } only
 *   never overwrite env_test_url / enonic_admin_url
 *   invalidateRcqaSettingsCache() then open RCQA (Local)
 *
 * Safe to call before the clone server is up: it only updates Settings.
 * Suites against :3102 will fail until V2 start/health — that is expected.
 */
export default function ConnectToQaAgent({
  localUrl,
  onSuccess,
  accentColor = '#dc2626',
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${RCQA_API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env_local_url: localUrl,
          env_default: 'local',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.message || data.detail || `HTTP ${res.status}`);
      }

      invalidateRcqaSettingsCache();
      const settings = await fetchRcqaSettings({ force: true });

      const appliedLocal = stripTrailingSlash(settings.env_local_url);
      const expectedLocal = stripTrailingSlash(localUrl);
      if (appliedLocal !== expectedLocal) {
        throw new Error(
          t('webLab.redcrossNo.useAsLocalEnvVerifyFail', {
            expected: expectedLocal,
            got: appliedLocal,
          }),
        );
      }

      setResult({
        env_local_url: settings.env_local_url,
        env_test_url: settings.env_test_url,
        enonic_admin_url: settings.enonic_admin_url,
      });
      if (typeof onSuccess === 'function') onSuccess(settings);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <p style={styles.hint}>{t('webLab.redcrossNo.useAsLocalEnvHint')}</p>
      <button
        type="button"
        onClick={handleConnect}
        disabled={busy || !localUrl}
        style={{
          ...styles.btn,
          backgroundColor: accentColor,
          opacity: busy ? 0.7 : 1,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy
          ? t('webLab.redcrossNo.useAsLocalEnvWorking')
          : t('webLab.redcrossNo.btnUseAsLocalEnv')}
      </button>

      {error && (
        <p style={styles.error} role="alert">
          {t('webLab.redcrossNo.useAsLocalEnvError')}: {error}
        </p>
      )}

      {result && (
        <div style={styles.success} role="status">
          <p style={styles.successTitle}>
            {t('webLab.redcrossNo.useAsLocalEnvSuccess')}
          </p>
          <ul style={styles.successList}>
            <li>
              <code>env_local_url</code> = {result.env_local_url}
            </li>
            <li>
              <code>env_test_url</code> = {result.env_test_url}
            </li>
            <li>
              <code>enonic_admin_url</code> = {result.enonic_admin_url}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { marginTop: 14 },
  hint: {
    margin: '0 0 10px',
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 1.45,
  },
  btn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: 13,
  },
  error: {
    margin: '10px 0 0',
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 1.4,
  },
  success: {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
  },
  successTitle: {
    margin: '0 0 6px',
    fontSize: 12,
    fontWeight: 600,
    color: '#166534',
  },
  successList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.5,
    fontFamily: 'ui-monospace, monospace',
    wordBreak: 'break-all',
  },
};
