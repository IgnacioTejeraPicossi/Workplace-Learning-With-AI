import React from 'react';
import { useTranslation } from 'react-i18next';

const RoleLine = ({ label, color, text }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
    <span style={{
      flexShrink: 0, alignSelf: 'flex-start', padding: '2px 8px', borderRadius: 6,
      backgroundColor: color, color: 'white', fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 66, textAlign: 'center',
    }}>{label}</span>
    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{text}</span>
  </div>
);

export default function WorkedExamples() {
  const { t } = useTranslation();

  const examples = [
    {
      key: 'content', icon: '✍️', accent: '#2563eb', bg: '#eff6ff',
      builder: 'contentBuilder', judge: 'contentJudge', manager: 'contentManager',
      titleKey: 'contentTitle',
    },
    {
      key: 'code', icon: '💻', accent: '#7c3aed', bg: '#f5f3ff',
      builder: 'codeBuilder', judge: 'codeJudge', manager: 'codeManager',
      titleKey: 'codeTitle',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 940 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          {t('selfCorrectingLoop.examples.title')}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15, lineHeight: 1.6 }}>
          {t('selfCorrectingLoop.examples.lead')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        {examples.map(ex => (
          <div key={ex.key} style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', backgroundColor: ex.bg, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{ex.icon}</span>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                {t(`selfCorrectingLoop.examples.${ex.titleKey}`)}
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <RoleLine label="Builder" color="#2563eb" text={t(`selfCorrectingLoop.examples.${ex.builder}`)} />
              <RoleLine label="Judge"   color="#7c3aed" text={t(`selfCorrectingLoop.examples.${ex.judge}`)} />
              <RoleLine label="Manager" color="#0d9488" text={t(`selfCorrectingLoop.examples.${ex.manager}`)} />
            </div>
          </div>
        ))}
      </div>

      {/* Shared skeleton */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, color: '#5eead4', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          🦴 {t('selfCorrectingLoop.examples.skeletonTitle')}
        </div>
        <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.65 }}>
          {t('selfCorrectingLoop.examples.skeletonText')}
        </div>
      </div>
    </div>
  );
}
