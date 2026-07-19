import React from 'react';
import { useTranslation } from 'react-i18next';

const card = { backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' };

const TESTS = [
  { id: 't1', icon: '♾️' },
  { id: 't2', icon: '🎭' },
  { id: 't3', icon: '🕳️' },
  { id: 't4', icon: '💸' },
];

export default function TestAndScale() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 940 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          {t('selfCorrectingLoop.testScale.title')}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15, lineHeight: 1.6 }}>
          {t('selfCorrectingLoop.testScale.lead')}
        </p>
      </div>

      {/* Four stress tests */}
      <div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          🧪 {t('selfCorrectingLoop.testScale.testsTitle')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          {TESTS.map(test => (
            <div key={test.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{test.icon}</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>
                  {t(`selfCorrectingLoop.testScale.${test.id}Title`)}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                {t(`selfCorrectingLoop.testScale.${test.id}Text`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common mistakes */}
      <div style={{ ...card, borderLeft: '4px solid #dc2626' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          ⚠️ {t('selfCorrectingLoop.testScale.mistakesTitle')}
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: 13.5, lineHeight: 1.85 }}>
          {['m1', 'm2', 'm3', 'm4', 'm5'].map(k => (
            <li key={k}>{t(`selfCorrectingLoop.testScale.${k}`)}</li>
          ))}
        </ul>
      </div>

      {/* Scaling */}
      <div style={{ ...card, backgroundColor: '#f0fdfa', border: '1px solid #99f6e4' }}>
        <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>
          📈 {t('selfCorrectingLoop.testScale.scaleTitle')}
        </div>
        <div style={{ fontSize: 13.5, color: '#0f766e', lineHeight: 1.65, marginBottom: 10 }}>
          {t('selfCorrectingLoop.testScale.scaleText')}
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#0f766e', fontSize: 13.5, lineHeight: 1.8 }}>
          {['scale1', 'scale2', 'scale3'].map(k => (
            <li key={k}>{t(`selfCorrectingLoop.testScale.${k}`)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
