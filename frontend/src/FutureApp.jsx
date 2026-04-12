import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';

const PHASE_ROWS = [
  { phase: '1', rowId: 'p1', feas: 'high', stat: 'live', color: '#4caf50', section: 'idea-log' },
  { phase: '2', rowId: 'p2', feas: 'high', stat: 'live', color: '#ff9800', section: null },
  { phase: '3', rowId: 'p3', feas: 'high', stat: 'live', color: '#ff5722', section: 'feature-roadmap' },
  { phase: '4', rowId: 'p4', feas: 'high', stat: 'live', color: '#2196f3', section: 'feature-roadmap' },
  { phase: '5', rowId: 'p5', feas: 'lowRd', stat: 'planned', color: '#f44336', section: null },
];

function FutureApp({ onSectionSelect }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handlePhaseClick = (section) => {
    if (section && onSectionSelect) {
      onSectionSelect(section);
    }
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text, marginBottom: '2rem' }}>
        🔮 {t('futureAppModule.pageTitle')}
      </h2>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ color: colors.text, marginBottom: '1rem' }}>
          {t('futureAppModule.roadmapHeading')}
        </h3>
        <div
          style={{
            background: colors.cardBackground,
            borderRadius: 12,
            padding: '1.5rem',
            boxShadow: colors.shadow,
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: colors.textSecondary }}>
                  {t('futureAppModule.thPhase')}
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: colors.textSecondary }}>
                  {t('futureAppModule.thTitle')}
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: colors.textSecondary }}>
                  {t('futureAppModule.thMainFeature')}
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: colors.textSecondary }}>
                  {t('futureAppModule.thFeasibility')}
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: colors.textSecondary }}>
                  {t('futureAppModule.thStatus')}
                </th>
              </tr>
            </thead>
            <tbody>
              {PHASE_ROWS.map((row) => {
                const title = t(`futureAppModule.phaseRows.${row.rowId}.title`);
                const mainFeature = t(`futureAppModule.phaseRows.${row.rowId}.mainFeature`);
                const feasibility = t(`futureAppModule.feasibility.${row.feas}`);
                const status = t(`futureAppModule.status.${row.stat}`);
                const feasColor = row.feas === 'high' ? '#4caf50' : '#f44336';
                const statusColor = row.stat === 'live' ? '#4caf50' : colors.textSecondary;

                return (
                  <tr key={row.rowId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          background: row.color,
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {row.phase}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {row.section ? (
                        <button
                          type="button"
                          onClick={() => handlePhaseClick(row.section)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: colors.primary,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: 'inherit',
                            padding: 0,
                            fontFamily: 'inherit',
                          }}
                        >
                          {title}
                        </button>
                      ) : (
                        <span style={{ color: colors.text }}>{title}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: colors.text }}>{mainFeature}</td>
                    <td
                      style={{
                        padding: '0.75rem',
                        color: feasColor,
                        fontWeight: '500',
                      }}
                    >
                      {feasibility}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        color: statusColor,
                        fontWeight: '500',
                      }}
                    >
                      {status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          background: colors.cardBackground,
          borderRadius: 12,
          padding: '2rem',
          boxShadow: colors.shadow,
        }}
      >
        <h3
          style={{
            color: colors.text,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          🔮 {t('futureAppModule.previewTitle')}
        </h3>

        <p style={{ color: colors.text, marginBottom: '2rem', lineHeight: 1.6 }}>
          {t('futureAppModule.previewIntro')}
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <h4
            style={{
              color: colors.text,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            🏗️ {t('futureAppModule.techArchTitle')}
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                background: colors.background,
                padding: '1.5rem',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
              <h5 style={{ color: colors.text, marginBottom: '0.5rem' }}>
                {t('futureAppModule.techCard1Title')}
              </h5>
              <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                {t('futureAppModule.techCard1Body')}
              </p>
            </div>

            <div
              style={{
                background: colors.background,
                padding: '1.5rem',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐛</div>
              <h5 style={{ color: colors.text, marginBottom: '0.5rem' }}>
                {t('futureAppModule.techCard2Title')}
              </h5>
              <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                {t('futureAppModule.techCard2Body')}
              </p>
            </div>

            <div
              style={{
                background: colors.background,
                padding: '1.5rem',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
              <h5 style={{ color: colors.text, marginBottom: '0.5rem' }}>
                {t('futureAppModule.techCard3Title')}
              </h5>
              <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                {t('futureAppModule.techCard3Body')}
              </p>
              <p
                style={{
                  color: colors.textSecondary,
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                }}
              >
                {t('futureAppModule.techCard3Note')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4
            style={{
              color: colors.text,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            🎬 {t('futureAppModule.demoTitle')}
          </h4>
          <div
            style={{
              background: colors.background,
              padding: '1.5rem',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: colors.textSecondary,
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>{t('futureAppModule.demoLine1')}</div>
            <div style={{ marginBottom: '0.5rem' }}>{t('futureAppModule.demoLine2')}</div>
            <div style={{ marginBottom: '0.5rem' }}>{t('futureAppModule.demoLine3')}</div>
            <div style={{ marginBottom: '0.5rem' }}>{t('futureAppModule.demoLine4')}</div>
            <div style={{ color: '#4caf50' }}>{t('futureAppModule.demoLine5')}</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4
            style={{
              color: colors.text,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            💼 {t('futureAppModule.impactTitle')}
          </h4>
          <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '1.5rem' }}>
            <li>
              <strong>{t('futureAppModule.impact1Label')}:</strong>{' '}
              {t('futureAppModule.impact1Body')}
            </li>
            <li>
              <strong>{t('futureAppModule.impact2Label')}:</strong>{' '}
              {t('futureAppModule.impact2Body')}
            </li>
            <li>
              <strong>{t('futureAppModule.impact3Label')}:</strong>{' '}
              {t('futureAppModule.impact3Body')}
            </li>
            <li>
              <strong>{t('futureAppModule.impact4Label')}:</strong>{' '}
              {t('futureAppModule.impact4Body')}
            </li>
          </ul>
        </div>

        <div>
          <h4
            style={{
              color: colors.text,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            🗺️ {t('futureAppModule.implRoadmapTitle')}
          </h4>
          <div
            style={{
              background: colors.background,
              padding: '1.5rem',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              fontSize: '0.9rem',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t('futureAppModule.impl51Title')}:</strong> {t('futureAppModule.impl51Body')}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t('futureAppModule.impl52Title')}:</strong> {t('futureAppModule.impl52Body')}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t('futureAppModule.impl53Title')}:</strong> {t('futureAppModule.impl53Body')}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t('futureAppModule.impl54Title')}:</strong> {t('futureAppModule.impl54Body')}
            </div>
            <div style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
              {t('futureAppModule.implTimeline')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FutureApp;
