import React from 'react';
import { useTranslation } from 'react-i18next';

const card = {
  backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
  padding: '18px 20px',
};

export default function Overview() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 940 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          {t('selfCorrectingLoop.overview.title')}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15, lineHeight: 1.6 }}>
          {t('selfCorrectingLoop.overview.lead')}
        </p>
      </div>

      {/* The shift: from / to */}
      <div style={{ ...card, backgroundColor: '#f0fdfa', border: '1px solid #99f6e4' }}>
        <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: 10 }}>
          {t('selfCorrectingLoop.overview.shiftTitle')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          <div style={{ padding: '12px 14px', backgroundColor: 'white', borderRadius: 10, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>✗ {t('selfCorrectingLoop.overview.defaultLoopTitle')}</div>
            <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>{t('selfCorrectingLoop.overview.shiftFrom')}</div>
          </div>
          <div style={{ padding: '12px 14px', backgroundColor: 'white', borderRadius: 10, border: '1px solid #86efac' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>✓ {t('selfCorrectingLoop.overview.selfLoopTitle')}</div>
            <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>{t('selfCorrectingLoop.overview.shiftTo')}</div>
          </div>
        </div>
      </div>

      {/* Two supporting cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{t('selfCorrectingLoop.overview.defaultLoopTitle')}</div>
          <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{t('selfCorrectingLoop.overview.defaultLoopText')}</div>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{t('selfCorrectingLoop.overview.selfLoopTitle')}</div>
          <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{t('selfCorrectingLoop.overview.selfLoopText')}</div>
        </div>
      </div>

      {/* Not just asking twice */}
      <div style={{ ...card, borderLeft: '4px solid #0d9488' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          💡 {t('selfCorrectingLoop.overview.notTwiceTitle')}
        </div>
        <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>{t('selfCorrectingLoop.overview.notTwiceText')}</div>
      </div>

      {/* Key idea */}
      <div style={{ ...card, backgroundColor: '#1e293b', border: 'none' }}>
        <div style={{ fontWeight: 700, color: '#5eead4', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('selfCorrectingLoop.overview.keyIdeaTitle')}
        </div>
        <div style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.6, fontWeight: 500 }}>{t('selfCorrectingLoop.overview.keyIdeaText')}</div>
      </div>
    </div>
  );
}
