import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { getStorageUsage, formatBytes } from '../utils/dataRetention';
import { logSecurityEvent, EventType, EventSeverity } from '../utils/securityEventLog';

const PROFILE_KEY = 'wlwai_user_profile';

function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { displayName: '', email: '', language: 'en', notifications: true };
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, _ts: Date.now() }));
}

/**
 * Collect all WLWAI data from localStorage for export
 */
function collectAllData() {
  const data = {};
  const meta = { exportedAt: new Date().toISOString(), totalKeys: 0 };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    meta.totalKeys++;
    try {
      data[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      data[key] = localStorage.getItem(key);
    }
  }
  return { meta, data };
}

/**
 * Build usage statistics from localStorage
 */
function buildUsageStats() {
  const storage = getStorageUsage();
  const categories = { settings: 0, security: 0, cache: 0, other: 0 };
  const moduleActivity = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || '';
    const lk = key.toLowerCase();

    if (lk.includes('setting') || lk.includes('config') || lk.includes('policy') || lk.includes('theme') || lk.includes('i18n')) {
      categories.settings++;
    } else if (lk.includes('security') || lk.includes('enc') || lk.includes('anon')) {
      categories.security++;
    } else if (lk.includes('cache') || lk.includes('tmp') || lk.includes('temp')) {
      categories.cache++;
    } else {
      categories.other++;
    }

    // Try to detect module from key prefix
    const prefix = key.split('_')[0] || key.split(/[A-Z]/)[0] || 'other';
    moduleActivity[prefix] = (moduleActivity[prefix] || 0) + 1;
  }

  return { storage, categories, moduleActivity, totalKeys: localStorage.length };
}

const YourData = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [activeSection, setActiveSection] = useState(null); // 'profile' | 'export' | 'stats' | 'delete'
  const [profile, setProfile] = useState(getProfile());
  const [profileSaved, setProfileSaved] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportDone, setExportDone] = useState(false);

  const refreshStats = useCallback(() => {
    setUsageStats(buildUsageStats());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleProfileSave = () => {
    saveProfile(profile);
    setProfileSaved(true);
    logSecurityEvent(EventType.SETTINGS_CHANGED, EventSeverity.INFO, { action: 'profile_updated' });
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleExport = (format) => {
    const allData = collectAllData();
    let content, mimeType, extension;

    if (format === 'json') {
      content = JSON.stringify(allData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV: key, value (truncated)
      const rows = [[t('security.yourData.csvHeaders.key'), t('security.yourData.csvHeaders.value'), t('security.yourData.csvHeaders.type')]];
      for (const [key, value] of Object.entries(allData.data)) {
        const type = typeof value;
        const display = type === 'object' ? JSON.stringify(value).slice(0, 200) : String(value).slice(0, 200);
        rows.push([key, display, type]);
      }
      content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wlwai-data-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportDone(true);
    logSecurityEvent(EventType.DATA_EXPORT, EventSeverity.OK, { format, keys: allData.meta.totalKeys });
    setTimeout(() => setExportDone(false), 4000);
  };

  const handleDeleteAccount = () => {
    // Clear all localStorage except language preference
    const lang = localStorage.getItem('i18nextLng');
    localStorage.clear();
    if (lang) localStorage.setItem('i18nextLng', lang);
    logSecurityEvent(EventType.ACCOUNT_DELETION, EventSeverity.WARNING, { action: 'all_data_cleared' });
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setActiveSection(null);
    refreshStats();
    window.location.reload();
  };

  const cardStyle = {
    background: colors.background,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: '20px'
  };

  const sectionBtnStyle = (isActive) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: isActive ? (colors.primaryLight || '#e3f2fd') : colors.sidebarBackground,
    borderRadius: '8px',
    cursor: 'pointer',
    border: `2px solid ${isActive ? colors.primary : 'transparent'}`,
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '20px' }}>
        {t('security.yourData.title')}
      </h3>

      {/* Quick Stats Bar */}
      {usageStats && (
        <div style={{
          ...cardStyle,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          padding: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{usageStats.totalKeys}</div>
            <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.stats.totalKeys')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{usageStats.storage.usedFormatted}</div>
            <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.stats.storageUsed')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{usageStats.categories.settings}</div>
            <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.stats.settingsKeys')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{usageStats.categories.security}</div>
            <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.stats.securityKeys')}</div>
          </div>
        </div>
      )}

      {/* Section Buttons */}
      <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        {/* Personal Information */}
        <div
          style={sectionBtnStyle(activeSection === 'profile')}
          onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>👤</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>{t('security.yourData.options.personalInfo')}</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.profileDesc')}</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', color: colors.textSecondary }}>{activeSection === 'profile' ? '▲' : '▼'}</span>
        </div>

        {/* Profile Form */}
        {activeSection === 'profile' && (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
                  {t('security.yourData.profile.displayName')}
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
                  placeholder={t('security.yourData.profile.displayNamePlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    background: colors.sidebarBackground,
                    color: colors.text,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
                  {t('security.yourData.profile.email')}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder={t('security.yourData.profile.emailPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    background: colors.sidebarBackground,
                    color: colors.text,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={profile.notifications}
                    onChange={(e) => setProfile(p => ({ ...p, notifications: e.target.checked }))}
                  />
                  {t('security.yourData.profile.notifications')}
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={handleProfileSave}
                  style={{
                    padding: '10px 20px',
                    background: colors.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {t('security.yourData.profile.save')}
                </button>
                {profileSaved && (
                  <span style={{ color: '#4caf50', fontSize: '14px' }}>✅ {t('security.yourData.profile.saved')}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Export Data */}
        <div
          style={sectionBtnStyle(activeSection === 'export')}
          onClick={() => setActiveSection(activeSection === 'export' ? null : 'export')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📦</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>{t('security.yourData.options.learningHistory')}</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.exportDesc')}</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', color: colors.textSecondary }}>{activeSection === 'export' ? '▲' : '▼'}</span>
        </div>

        {activeSection === 'export' && (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <p style={{ marginBottom: '16px', color: colors.textSecondary, fontSize: '14px' }}>
              {t('security.yourData.exportInfo')}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => handleExport('json')}
                style={{
                  padding: '10px 20px',
                  background: colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📄 {t('security.yourData.exportJson')}
              </button>
              <button
                onClick={() => handleExport('csv')}
                style={{
                  padding: '10px 20px',
                  background: '#43a047',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📊 {t('security.yourData.exportCsv')}
              </button>
              {exportDone && (
                <span style={{ color: '#4caf50', fontSize: '14px' }}>✅ {t('security.yourData.exportComplete')}</span>
              )}
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        <div
          style={sectionBtnStyle(activeSection === 'stats')}
          onClick={() => { setActiveSection(activeSection === 'stats' ? null : 'stats'); refreshStats(); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📈</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>{t('security.yourData.options.usageStats')}</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.statsDesc')}</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', color: colors.textSecondary }}>{activeSection === 'stats' ? '▲' : '▼'}</span>
        </div>

        {activeSection === 'stats' && usageStats && (
          <div style={{ ...cardStyle, marginTop: 0 }}>
            <h4 style={{ marginBottom: '16px' }}>{t('security.yourData.stats.categoryBreakdown')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {Object.entries(usageStats.categories).map(([cat, count]) => (
                <div key={cat} style={{
                  padding: '12px',
                  background: colors.sidebarBackground,
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>{count}</div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    {t(`security.yourData.stats.cat_${cat}`)}
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: '20px 0 12px' }}>{t('security.yourData.stats.storageBreakdown')}</h4>
            <div style={{
              height: '16px',
              background: '#e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{ width: `${usageStats.storage.usedPercent}%`, background: colors.primary, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
              <span>{usageStats.storage.usedFormatted} {t('security.yourData.stats.used')}</span>
              <span>{usageStats.storage.maxFormatted} {t('security.yourData.stats.max')}</span>
            </div>
          </div>
        )}

        {/* Account Deletion */}
        <div
          style={sectionBtnStyle(activeSection === 'delete')}
          onClick={() => setActiveSection(activeSection === 'delete' ? null : 'delete')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 'bold', color: '#f44336' }}>{t('security.yourData.options.accountDeletion')}</div>
              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{t('security.yourData.deleteDesc')}</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', color: colors.textSecondary }}>{activeSection === 'delete' ? '▲' : '▼'}</span>
        </div>

        {activeSection === 'delete' && (
          <div style={{
            ...cardStyle,
            marginTop: 0,
            borderColor: '#f44336',
            background: '#fff5f5'
          }}>
            <h4 style={{ color: '#f44336', marginBottom: '12px' }}>⚠️ {t('security.yourData.deleteWarningTitle')}</h4>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
              {t('security.yourData.deleteWarningMsg')}
            </p>
            <ul style={{ color: '#666', marginBottom: '16px', fontSize: '14px', paddingLeft: '20px' }}>
              <li>{t('security.yourData.deleteItem1')}</li>
              <li>{t('security.yourData.deleteItem2')}</li>
              <li>{t('security.yourData.deleteItem3')}</li>
              <li>{t('security.yourData.deleteItem4')}</li>
            </ul>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '10px 20px',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🗑️ {t('security.yourData.actions.delete')}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.background,
            padding: '28px',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            <h4 style={{ color: '#f44336', marginBottom: '16px' }}>
              🚨 {t('security.yourData.deleteConfirmTitle')}
            </h4>
            <p style={{ marginBottom: '16px', color: colors.textSecondary, fontSize: '14px' }}>
              {t('security.yourData.deleteConfirmMsg')}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
              {t('security.yourData.deleteConfirmType')}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={t('security.yourData.deletePlaceholder')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: `2px solid ${deleteConfirmText === 'DELETE' ? '#f44336' : colors.border}`,
                fontSize: '16px',
                fontFamily: 'monospace',
                textAlign: 'center',
                boxSizing: 'border-box',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {t('security.yourData.deleteCancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{
                  padding: '10px 20px',
                  background: deleteConfirmText === 'DELETE' ? '#f44336' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {t('security.yourData.deleteForever')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourData;
