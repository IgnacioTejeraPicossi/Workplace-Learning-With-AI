import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

const CARDS = [
  { id: 'selfSimUniverse', icon: '🌀' },
  { id: 'pastParadox',     icon: '⏳' },
  { id: 'observerPatch',   icon: '🧩' },
  { id: 'screenEncoding',  icon: '🖥️' },
  { id: 'modularFlow',     icon: '〰️' },
];

export default function CoreConcepts() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>📚 {t('selfSimReality.tabs.concepts')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.concepts.intro')}</p>
      </div>

      <div style={{
        display: 'grid', gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      }}>
        {CARDS.map(card => {
          const level = t(`selfSimReality.concepts.cards.${card.id}Level`);
          return (
            <div key={card.id} style={{
              ...panel, padding: 18,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{card.icon}</span>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  {t(`selfSimReality.concepts.cards.${card.id}Title`)}
                </h4>
              </div>
              <EpistemicBadge level={level} />
              <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {t(`selfSimReality.concepts.cards.${card.id}Body`)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
