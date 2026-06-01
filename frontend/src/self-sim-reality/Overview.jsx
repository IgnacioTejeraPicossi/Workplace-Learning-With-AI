import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

export default function Overview() {
  const { t } = useTranslation();
  const levels = ['established', 'mainstream', 'speculative', 'philosophy', 'metaphor'];
  const bookLevel = t('selfSimReality.overview.bookMetaphorLevel');

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Mission */}
      <div style={panel}>
        <h3 style={panelTitle}>🎯 {t('selfSimReality.overview.missionTitle')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.overview.missionBody')}</p>
      </div>

      {/* Guiding phrase */}
      <div style={{
        ...panel, borderLeft: '4px solid #7c3aed',
        background: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)',
      }}>
        <p style={{
          margin: 0, fontSize: 16, fontStyle: 'italic', color: '#5b21b6',
          lineHeight: 1.5, fontWeight: 500,
        }}>
          «{t('selfSimReality.guidingPhrase')}»
        </p>
      </div>

      {/* The Book — intuition pump (1.17.1, added from second screenshot batch) */}
      <div style={{
        ...panel, borderLeft: '4px solid #f59e0b',
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#92400e' }}>
            📖 {t('selfSimReality.overview.bookMetaphorTitle')}
          </h4>
          <EpistemicBadge level={bookLevel} />
        </div>
        <blockquote style={{
          margin: '0 0 10px', padding: 0, borderLeft: 'none',
          fontStyle: 'italic', fontSize: 15, color: '#78350f', lineHeight: 1.5,
        }}>
          «{t('selfSimReality.overview.bookMetaphorQuote')}»
        </blockquote>
        <p style={{ margin: 0, fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
          {t('selfSimReality.overview.bookMetaphorBody')}
        </p>
      </div>

      {/* Epistemic discipline */}
      <div style={panel}>
        <h3 style={panelTitle}>🧪 {t('selfSimReality.overview.discipline')}</h3>
        <p style={{ ...subtle, margin: '0 0 14px' }}>{t('selfSimReality.overview.disciplineHint')}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {levels.map(lv => {
            const c = LEVEL_COLORS[lv];
            return (
              <div key={lv} style={{
                display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, alignItems: 'center',
                padding: '12px 14px', borderRadius: 10,
                backgroundColor: c.bg, border: `1px solid ${c.border}`,
              }}>
                <strong style={{ color: c.fg, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t(`selfSimReality.overview.levels.${lv}`)}
                </strong>
                <span style={{ fontSize: 13, color: '#1e293b' }}>
                  {t(`selfSimReality.overview.levels.${lv}Desc`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core rule */}
      <div style={{ ...panel, borderLeft: '4px solid #dc2626' }}>
        <h3 style={panelTitle}>⚖️ {t('selfSimReality.overview.ruleTitle')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.overview.ruleBody')}</p>
      </div>
    </div>
  );
}
