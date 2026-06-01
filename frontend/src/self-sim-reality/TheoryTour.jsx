import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

const ROWS = [
  { id: 'predictive' },
  { id: 'relationalQm' },
  { id: 'holographic' },
  { id: 'simHypothesis' },
  { id: 'iit' },
  { id: 'gnw' },
  { id: 'oph' },
];

export default function TheoryTour() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>🧭 {t('selfSimReality.tabs.theoryTour')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.theoryTour.intro')}</p>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {ROWS.map(row => {
          const level = t(`selfSimReality.theoryTour.rows.${row.id}Level`);
          return (
            <div key={row.id} style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <strong style={{ fontSize: 15, color: '#1e293b' }}>
                  {t(`selfSimReality.theoryTour.rows.${row.id}Title`)}
                </strong>
                <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                  {t(`selfSimReality.theoryTour.rows.${row.id}Author`)}
                </span>
                <EpistemicBadge level={level} />
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {t(`selfSimReality.theoryTour.rows.${row.id}Body`)}
              </p>
              <p style={{
                margin: 0, fontSize: 12, color: '#6b21a8',
                fontStyle: 'italic', lineHeight: 1.45,
              }}>
                {t(`selfSimReality.theoryTour.rows.${row.id}Link`)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
