import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import {
  getRetentionPolicies,
  saveRetentionPolicies,
  isAutoPurgeEnabled,
  setAutoPurge,
  scanStorage,
  purgeExpired,
  purgeCategory,
  getStorageUsage,
  getPurgeHistory,
  formatBytes
} from '../utils/dataRetention';

const AutomaticDataDeletion = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [policies, setPolicies] = useState(getRetentionPolicies());
  const [autoPurge, setAutoPurgeState] = useState(isAutoPurgeEnabled());
  const [storageInfo, setStorageInfo] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [purgeHistory, setPurgeHistory] = useState([]);
  const [lastPurgeResult, setLastPurgeResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null); // category key or 'all'

  const refreshData = useCallback(() => {
    setStorageInfo(getStorageUsage());
    setScanResult(scanStorage());
    setPurgeHistory(getPurgeHistory());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Policy slider configs: { key, min, max, step, unit }
  const policyConfigs = [
    { key: 'activityLogs', min: 1, max: 90, step: 1, unit: 'days', toHours: v => v * 24, fromHours: h => Math.round(h / 24) },
    { key: 'tempFiles', min: 1, max: 30, step: 1, unit: 'days', toHours: v => v * 24, fromHours: h => Math.round(h / 24) },
    { key: 'cacheData', min: 1, max: 72, step: 1, unit: 'hours', toHours: v => v, fromHours: h => h },
    { key: 'sessionData', min: 0, max: 0, step: 0, unit: 'logout', toHours: () => 0, fromHours: () => 0 }
  ];

  const handlePolicyChange = (key, displayValue, config) => {
    const hours = config.toHours(displayValue);
    const updated = { ...policies, [key]: hours };
    setPolicies(updated);
    saveRetentionPolicies(updated);
  };

  const handleAutoPurgeToggle = (enabled) => {
    setAutoPurgeState(enabled);
    setAutoPurge(enabled);
  };

  const handlePurgeExpired = () => {
    const result = purgeExpired(false);
    setLastPurgeResult(result);
    setShowConfirm(null);
    refreshData();
  };

  const handlePurgeCategory = (category) => {
    purgeCategory(category);
    setShowConfirm(null);
    refreshData();
  };

  const getDisplayValue = (key) => {
    const config = policyConfigs.find(c => c.key === key);
    if (!config || config.unit === 'logout') return t('security.dataDeletion.periods.sessionData');
    const val = config.fromHours(policies[key] || 0);
    if (config.unit === 'days') return `${val} ${t('security.dataDeletion.units.days')}`;
    return `${val} ${t('security.dataDeletion.units.hours')}`;
  };

  const cardStyle = {
    background: colors.background,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: '20px'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '20px' }}>
        {t('security.dataDeletion.title')}
      </h3>

      {/* Storage Usage Bar */}
      {storageInfo && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0 }}>💾 {t('security.dataDeletion.storageUsage')}</h4>
            <span style={{ fontSize: '14px', color: colors.textSecondary }}>
              {storageInfo.usedFormatted} / {storageInfo.maxFormatted}
            </span>
          </div>
          <div style={{
            height: '12px',
            background: '#e0e0e0',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(storageInfo.usedPercent, 100)}%`,
              background: storageInfo.usedPercent > 80 ? '#f44336' : storageInfo.usedPercent > 50 ? '#ff9800' : '#4caf50',
              borderRadius: '6px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
            {storageInfo.usedPercent}% {t('security.dataDeletion.used')} • {localStorage.length} {t('security.dataDeletion.keys')}
          </div>
        </div>
      )}

      {/* Auto-Purge Toggle */}
      <div style={cardStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          <input
            type="checkbox"
            checked={autoPurge}
            onChange={(e) => handleAutoPurgeToggle(e.target.checked)}
            style={{ transform: 'scale(1.3)' }}
          />
          🔄 {t('security.dataDeletion.autoPurge')}
        </label>
        <p style={{ margin: '8px 0 0 32px', fontSize: '13px', color: colors.textSecondary }}>
          {t('security.dataDeletion.autoPurgeDesc')}
        </p>
      </div>

      {/* Retention Policy Sliders */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '16px' }}>📏 {t('security.dataDeletion.retentionPolicies')}</h4>
        <p style={{ marginBottom: '20px', color: colors.textSecondary, fontSize: '14px' }}>
          {t('security.dataDeletion.description')}
        </p>

        {policyConfigs.map((config) => {
          const displayVal = config.fromHours(policies[config.key] || 0);
          const catData = scanResult?.categories?.[config.key];

          return (
            <div key={config.key} style={{
              padding: '16px',
              background: colors.sidebarBackground,
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong>{t(`security.dataDeletion.policies.${config.key}`)}</strong>
                <span style={{
                  background: colors.primary,
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {getDisplayValue(config.key)}
                </span>
              </div>

              {config.unit !== 'logout' ? (
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={displayVal}
                  onChange={(e) => handlePolicyChange(config.key, parseInt(e.target.value), config)}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, fontStyle: 'italic' }}>
                  {t('security.dataDeletion.sessionDataNote')}
                </p>
              )}

              {/* Category stats */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: colors.textSecondary }}>
                <span>
                  {t('security.dataDeletion.matchingKeys')}: {catData?.count || 0}
                </span>
                <span>
                  {t('security.dataDeletion.size')}: {formatBytes(catData?.bytes || 0)}
                </span>
                {catData?.count > 0 && config.unit !== 'logout' && (
                  <button
                    onClick={() => setShowConfirm(config.key)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {t('security.dataDeletion.purgeCategory')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Purge Actions */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '12px' }}>🗑️ {t('security.dataDeletion.purgeActions')}</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowConfirm('all')}
            disabled={!scanResult || scanResult.expiredKeys.length === 0}
            style={{
              padding: '10px 20px',
              background: scanResult?.expiredKeys?.length > 0 ? '#f44336' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: scanResult?.expiredKeys?.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🧹 {t('security.dataDeletion.purgeNow')}
          </button>
          <span style={{ fontSize: '14px', color: colors.textSecondary }}>
            {scanResult?.expiredKeys?.length || 0} {t('security.dataDeletion.expiredItems')}
          </span>
          <button
            onClick={refreshData}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🔄 {t('security.dataDeletion.rescan')}
          </button>
        </div>

        {/* Last purge result */}
        {lastPurgeResult && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#e8f5e9',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#2e7d32'
          }}>
            ✅ {t('security.dataDeletion.purgeComplete', {
              count: lastPurgeResult.purgedCount,
              bytes: formatBytes(lastPurgeResult.bytesFreed)
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.background,
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ marginBottom: '12px', color: '#f44336' }}>
              ⚠️ {t('security.dataDeletion.confirmTitle')}
            </h4>
            <p style={{ marginBottom: '20px', color: colors.textSecondary }}>
              {showConfirm === 'all'
                ? t('security.dataDeletion.confirmAllMsg', { count: scanResult?.expiredKeys?.length || 0 })
                : t('security.dataDeletion.confirmCategoryMsg', {
                    category: t(`security.dataDeletion.policies.${showConfirm}`)
                  })
              }
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(null)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {t('security.dataDeletion.cancel')}
              </button>
              <button
                onClick={() => showConfirm === 'all' ? handlePurgeExpired() : handlePurgeCategory(showConfirm)}
                style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {t('security.dataDeletion.confirmPurge')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge History */}
      {purgeHistory.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ marginBottom: '12px' }}>📋 {t('security.dataDeletion.purgeHistoryTitle')}</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {purgeHistory.slice(0, 10).map((entry, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: `1px solid ${colors.border}`,
                fontSize: '13px'
              }}>
                <span style={{ color: colors.textSecondary }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span>
                  {entry.purgedCount} {t('security.dataDeletion.items')} • {formatBytes(entry.bytesFreed)}
                  {entry.category && ` • ${t(`security.dataDeletion.policies.${entry.category}`)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomaticDataDeletion;
