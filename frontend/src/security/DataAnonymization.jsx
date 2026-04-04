import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import {
  ANONYMIZATION_RULES,
  getAnonymizationConfig,
  saveAnonymizationConfig,
  anonymizeText,
  detectPII
} from '../utils/anonymizer';

const DataAnonymization = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [config, setConfig] = useState(getAnonymizationConfig());
  const [previewInput, setPreviewInput] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleToggleGlobal = (enabled) => {
    const updated = { ...config, enabled };
    setConfig(updated);
    saveAnonymizationConfig(updated);
    showSaved();
  };

  const handleToggleRule = (ruleKey, enabled) => {
    const updated = { ...config, rules: { ...config.rules, [ruleKey]: enabled } };
    setConfig(updated);
    saveAnonymizationConfig(updated);
    showSaved();
  };

  const showSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const runPreview = useCallback(() => {
    if (!previewInput.trim()) {
      setPreviewResult(null);
      return;
    }
    const result = anonymizeText(previewInput, config);
    const findings = detectPII(previewInput);
    setPreviewResult({ ...result, findings });
  }, [previewInput, config]);

  const loadSampleText = () => {
    setPreviewInput(t('security.anonymization.sampleText'));
  };

  const activeRuleCount = Object.values(config.rules).filter(Boolean).length;
  const totalRuleCount = Object.keys(ANONYMIZATION_RULES).length;

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
        {t('security.anonymization.title')}
      </h3>

      {/* Global Toggle */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleToggleGlobal(e.target.checked)}
              style={{ transform: 'scale(1.3)' }}
            />
            🛡️ {t('security.anonymization.globalToggle')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {savedFeedback && (
              <span style={{ color: '#4caf50', fontSize: '13px' }}>✅ {t('security.anonymization.saved')}</span>
            )}
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: config.enabled ? '#e8f5e9' : '#fce4ec',
              color: config.enabled ? '#2e7d32' : '#c62828'
            }}>
              {config.enabled ? t('security.anonymization.active') : t('security.anonymization.inactive')}
            </span>
          </div>
        </div>
        <p style={{ margin: '8px 0 0 32px', fontSize: '13px', color: colors.textSecondary }}>
          {t('security.anonymization.globalDesc')}
        </p>
      </div>

      {/* Rules Configuration */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0 }}>📋 {t('security.anonymization.rulesTitle')}</h4>
          <span style={{ fontSize: '13px', color: colors.textSecondary }}>
            {activeRuleCount}/{totalRuleCount} {t('security.anonymization.rulesActive')}
          </span>
        </div>
        <p style={{ marginBottom: '16px', color: colors.textSecondary, fontSize: '14px' }}>
          {t('security.anonymization.rulesDesc')}
        </p>

        <div style={{ display: 'grid', gap: '10px' }}>
          {Object.entries(ANONYMIZATION_RULES).map(([ruleKey, rule]) => (
            <div key={ruleKey} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: config.rules[ruleKey] ? (colors.primaryLight || '#e3f2fd') : colors.sidebarBackground,
              borderRadius: '8px',
              border: `1px solid ${config.rules[ruleKey] ? colors.primary : colors.border}`,
              opacity: config.enabled ? 1 : 0.5,
              transition: 'all 0.2s ease'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={config.rules[ruleKey]}
                  onChange={(e) => handleToggleRule(ruleKey, e.target.checked)}
                  disabled={!config.enabled}
                  style={{ transform: 'scale(1.1)' }}
                />
                <span style={{ fontSize: '18px' }}>{rule.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {t(`security.anonymization.ruleNames.${ruleKey}`)}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                    {t(`security.anonymization.ruleDescs.${ruleKey}`)}
                  </div>
                </div>
              </label>
              <code style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.08)',
                borderRadius: '4px',
                color: colors.textSecondary
              }}>
                → {rule.replacement}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '12px' }}>🔍 {t('security.anonymization.previewTitle')}</h4>
        <p style={{ marginBottom: '12px', color: colors.textSecondary, fontSize: '14px' }}>
          {t('security.anonymization.previewDesc')}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={loadSampleText}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📝 {t('security.anonymization.loadSample')}
          </button>
          <button
            onClick={() => { setPreviewInput(''); setPreviewResult(null); }}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🗑️ {t('security.anonymization.clearPreview')}
          </button>
        </div>

        <textarea
          value={previewInput}
          onChange={(e) => setPreviewInput(e.target.value)}
          placeholder={t('security.anonymization.previewPlaceholder')}
          rows={5}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            background: colors.sidebarBackground,
            color: colors.text,
            fontSize: '14px',
            fontFamily: 'monospace',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />

        <button
          onClick={runPreview}
          disabled={!previewInput.trim()}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            background: previewInput.trim() ? colors.primary : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: previewInput.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🛡️ {t('security.anonymization.runAnonymize')}
        </button>

        {/* Preview Results */}
        {previewResult && (
          <div style={{ marginTop: '16px' }}>
            {/* Stats bar */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '12px',
              padding: '10px 16px',
              background: previewResult.totalMatches > 0 ? '#fff3e0' : '#e8f5e9',
              borderRadius: '6px',
              fontSize: '14px',
              flexWrap: 'wrap'
            }}>
              <strong>
                {previewResult.totalMatches > 0
                  ? `⚠️ ${t('security.anonymization.foundItems', { count: previewResult.totalMatches })}`
                  : `✅ ${t('security.anonymization.noItemsFound')}`
                }
              </strong>
              {Object.entries(previewResult.stats).map(([rule, count]) => (
                <span key={rule} style={{ color: colors.textSecondary }}>
                  {ANONYMIZATION_RULES[rule]?.icon} {t(`security.anonymization.ruleNames.${rule}`)}: {count}
                </span>
              ))}
            </div>

            {/* Findings detail */}
            {previewResult.findings && previewResult.findings.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ marginBottom: '8px', fontSize: '14px' }}>{t('security.anonymization.detectedItems')}</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {previewResult.findings.map((f, i) => (
                    <span key={i} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: '#fce4ec',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {ANONYMIZATION_RULES[f.rule]?.icon}{' '}
                      <s style={{ color: '#c62828' }}>{f.match.length > 30 ? f.match.slice(0, 30) + '...' : f.match}</s>
                      {' → '}
                      <strong style={{ color: '#2e7d32' }}>{f.replacement}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Anonymized output */}
            <h5 style={{ marginBottom: '8px', fontSize: '14px' }}>{t('security.anonymization.resultTitle')}</h5>
            <div style={{
              padding: '12px',
              background: colors.sidebarBackground,
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: `1px solid ${colors.border}`,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {previewResult.result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnonymization;
