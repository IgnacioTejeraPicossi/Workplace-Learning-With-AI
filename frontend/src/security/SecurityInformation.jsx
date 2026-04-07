import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../ThemeContext';
import { calculateSecurityScore, getScoreColor } from '../utils/securityScore';

const SecurityInformation = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [scoreData, setScoreData] = useState(null);

  const refresh = useCallback(() => {
    setScoreData(calculateSecurityScore());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const cardStyle = {
    background: colors.background,
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: '20px'
  };

  const complianceFrameworks = [
    { key: 'gdpr', controls: ['encryption', 'anonymization', 'autoPurge', 'profileSet'] },
    { key: 'ccpa', controls: ['anonymization', 'autoPurge', 'profileSet'] },
    { key: 'soc2', controls: ['encryption', 'https', 'retentionConfigured', 'recentActivity'] }
  ];

  if (!scoreData) return null;

  const scoreColor = getScoreColor(scoreData.score);

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h3 style={{ color: colors.primary, marginBottom: '20px' }}>
        {t('security.securityInfo.title')}
      </h3>

      {/* Security Score Hero */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        padding: '28px',
        flexWrap: 'wrap'
      }}>
        {/* Score Circle */}
        <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray={`${scoreData.score * 3.14} 314`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: scoreColor, lineHeight: 1 }}>
              {scoreData.score}
            </div>
            <div style={{ fontSize: '14px', color: colors.textSecondary }}>{t('security.securityInfo.scoreMax')}</div>
          </div>
        </div>

        {/* Score Details */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '20px' }}>
            {t('security.securityInfo.scoreTitle')}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '16px',
              background: scoreColor,
              color: '#fff'
            }}>
              {t('security.securityInfo.grade')}: {scoreData.grade}
            </span>
            <span style={{ fontSize: '14px', color: colors.textSecondary }}>
              {t(`security.securityInfo.gradeLabels.${scoreData.grade}`)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>
            {scoreData.checks.filter(c => c.passed).length}/{scoreData.checks.length}{' '}
            {t('security.securityInfo.checksPassed')}
          </p>
          <button
            onClick={refresh}
            style={{
              marginTop: '12px',
              padding: '6px 16px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🔄 {t('security.securityInfo.refresh')}
          </button>
        </div>
      </div>

      {/* Security Checklist */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '16px' }}>✅ {t('security.securityInfo.checklistTitle')}</h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {scoreData.checks.map((check) => (
            <div key={check.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: check.passed ? '#e8f5e9' : '#fff3e0',
              borderRadius: '8px',
              borderLeft: `4px solid ${check.passed ? '#4caf50' : '#ff9800'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{check.passed ? '✅' : '⚠️'}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {t(`security.securityInfo.checks.${check.id}.name`)}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                    {check.passed
                      ? t(`security.securityInfo.checks.${check.id}.passedMsg`)
                      : t(`security.securityInfo.checks.${check.id}.failedMsg`)
                    }
                  </div>
                </div>
              </div>
              <span style={{
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: check.passed ? '#4caf50' : '#ff9800',
                color: '#fff'
              }}>
                +{check.weight} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {scoreData.recommendations.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ marginBottom: '16px' }}>💡 {t('security.securityInfo.recommendationsTitle')}</h4>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: colors.textSecondary }}>
            {t('security.securityInfo.recommendationsDesc')}
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {scoreData.recommendations.map((recId) => (
              <div key={recId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: colors.sidebarBackground,
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>🔧</span>
                <span style={{ fontSize: '14px' }}>
                  {t(`security.securityInfo.checks.${recId}.recommendation`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Coverage */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '16px' }}>📜 {t('security.securityInfo.complianceTitle')}</h4>
        <p style={{ marginBottom: '16px', fontSize: '14px', color: colors.textSecondary }}>
          {t('security.securityInfo.complianceDesc')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {complianceFrameworks.map((fw) => {
            const covered = fw.controls.filter(c => scoreData.checks.find(ch => ch.id === c && ch.passed)).length;
            const total = fw.controls.length;
            const pct = Math.round((covered / total) * 100);
            const fwColor = pct >= 100 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#f44336';

            return (
              <div key={fw.key} style={{
                padding: '16px',
                background: colors.sidebarBackground,
                borderRadius: '8px',
                border: `2px solid ${fwColor}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '16px' }}>{t(`security.securityInfo.frameworks.${fw.key}.name`)}</strong>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: fwColor,
                    color: '#fff'
                  }}>
                    {pct}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: fwColor, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {t(`security.securityInfo.frameworks.${fw.key}.desc`)}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {covered}/{total} {t('security.securityInfo.controlsMet')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Static Info */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: '16px' }}>📋 {t('security.securityInfo.additionalInfo')}</h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          {['lastAudit', 'certifications', 'penTesting'].map((item) => (
            <div key={item} style={{
              padding: '12px 16px',
              background: colors.sidebarBackground,
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <strong>{t(`security.securityInfo.items.${item}.name`)}</strong>
              <span style={{ color: colors.textSecondary }}>{t(`security.securityInfo.items.${item}.value`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityInformation;
