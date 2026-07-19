import React from 'react';
import { useTranslation } from 'react-i18next';

const ROLES = [
  { id: 'builder', icon: '🔨', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'judge',   icon: '⚖️', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'manager', icon: '🧭', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
];

export default function ThreeRoles() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 940 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          {t('selfCorrectingLoop.roles.title')}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15, lineHeight: 1.6 }}>
          {t('selfCorrectingLoop.roles.lead')}
        </p>
      </div>

      {/* Flow: Builder -> Judge -> Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {ROLES.map((r, i) => (
          <div key={r.id} style={{
            backgroundColor: 'white', borderRadius: 12, border: `1px solid ${r.border}`,
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              padding: '14px 16px', backgroundColor: r.bg, borderBottom: `1px solid ${r.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 26 }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: r.color, fontSize: 16 }}>
                  {t(`selfCorrectingLoop.roles.${r.id}.name`)}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {t(`selfCorrectingLoop.roles.${r.id}.role`)}
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', width: 22, height: 22, borderRadius: 999,
                backgroundColor: r.color, color: 'white', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</span>
            </div>
            <div style={{ padding: '14px 16px', fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>
              {t(`selfCorrectingLoop.roles.${r.id}.detail`)}
            </div>
          </div>
        ))}
      </div>

      {/* Principle */}
      <div style={{
        backgroundColor: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a',
        padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🎯</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
            {t('selfCorrectingLoop.roles.principleTitle')}
          </div>
          <div style={{ fontSize: 13.5, color: '#78350f', lineHeight: 1.65 }}>
            {t('selfCorrectingLoop.roles.principleText')}
          </div>
        </div>
      </div>
    </div>
  );
}
