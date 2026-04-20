import React from 'react';
import { useTranslation } from 'react-i18next';

const benefits = [
  {
    id: 'health',
    icon: '🏥',
    titleKey: 'agiBenefits.items.health.title',
    descKey: 'agiBenefits.items.health.desc',
    examplesKey: 'agiBenefits.items.health.examples',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  {
    id: 'science',
    icon: '🔬',
    titleKey: 'agiBenefits.items.science.title',
    descKey: 'agiBenefits.items.science.desc',
    examplesKey: 'agiBenefits.items.science.examples',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  {
    id: 'education',
    icon: '🎓',
    titleKey: 'agiBenefits.items.education.title',
    descKey: 'agiBenefits.items.education.desc',
    examplesKey: 'agiBenefits.items.education.examples',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  {
    id: 'climate',
    icon: '🌍',
    titleKey: 'agiBenefits.items.climate.title',
    descKey: 'agiBenefits.items.climate.desc',
    examplesKey: 'agiBenefits.items.climate.examples',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  {
    id: 'productivity',
    icon: '⚙️',
    titleKey: 'agiBenefits.items.productivity.title',
    descKey: 'agiBenefits.items.productivity.desc',
    examplesKey: 'agiBenefits.items.productivity.examples',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  {
    id: 'poverty',
    icon: '🤝',
    titleKey: 'agiBenefits.items.poverty.title',
    descKey: 'agiBenefits.items.poverty.desc',
    examplesKey: 'agiBenefits.items.poverty.examples',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
  },
  {
    id: 'creativity',
    icon: '🎨',
    titleKey: 'agiBenefits.items.creativity.title',
    descKey: 'agiBenefits.items.creativity.desc',
    examplesKey: 'agiBenefits.items.creativity.examples',
    color: '#db2777',
    bgColor: '#fdf2f8',
    borderColor: '#fbcfe8',
  },
  {
    id: 'space',
    icon: '🚀',
    titleKey: 'agiBenefits.items.space.title',
    descKey: 'agiBenefits.items.space.desc',
    examplesKey: 'agiBenefits.items.space.examples',
    color: '#4338ca',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  {
    id: 'governance',
    icon: '🏛️',
    titleKey: 'agiBenefits.items.governance.title',
    descKey: 'agiBenefits.items.governance.desc',
    examplesKey: 'agiBenefits.items.governance.examples',
    color: '#6b7280',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
];

function BenefitCard({ benefit, t }) {
  const examples = t(benefit.examplesKey, { returnObjects: true, defaultValue: [] });
  const exampleList = Array.isArray(examples) ? examples : [];

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: `1px solid ${benefit.borderColor}`,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: benefit.bgColor,
        borderBottom: `1px solid ${benefit.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '1.75rem' }}>{benefit.icon}</span>
        <div style={{ fontWeight: '700', color: benefit.color, fontSize: '1rem' }}>
          {t(benefit.titleKey)}
        </div>
      </div>
      <div style={{ padding: '1rem 1.25rem' }}>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.6 }}>
          {t(benefit.descKey)}
        </p>
        {exampleList.length > 0 && (
          <div style={{
            marginTop: '0.75rem', paddingTop: '0.75rem',
            borderTop: '1px dashed #e5e7eb'
          }}>
            <div style={{
              fontWeight: '600', color: '#6b7280', fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem'
            }}>
              {t('agiBenefits.examplesLabel', { defaultValue: 'Examples' })}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {exampleList.map((ex, i) => <li key={i}>{ex}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BenefitsOfAGI() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          ✨ {t('agiBenefits.title', { defaultValue: 'The Benefits of AGI' })}
        </h2>
        <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {t('agiBenefits.subtitle', { defaultValue: 'If developed safely and equitably, Artificial General Intelligence could unlock transformative benefits for humanity.' })}
        </div>
      </div>

      {/* Intro */}
      <div style={{
        backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0',
        padding: '1.25rem 1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontWeight: '700', color: '#15803d', marginBottom: '0.35rem' }}>
            {t('agiBenefits.introTitle', { defaultValue: 'Why explore the benefits?' })}
          </div>
          <div style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('agiBenefits.introText', { defaultValue: 'While the risks of AGI deserve serious attention (see "Possible Endings"), it is equally important to articulate the upside. These benefits are not guaranteed — they depend on the alignment, governance, and distribution choices we make today.' })}
          </div>
        </div>
      </div>

      {/* Benefit cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16
      }}>
        {benefits.map(b => (
          <BenefitCard key={b.id} benefit={b} t={t} />
        ))}
      </div>

      {/* Caveat */}
      <div style={{
        backgroundColor: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fde68a',
        padding: '1.25rem 1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '0.35rem' }}>
            {t('agiBenefits.caveatTitle', { defaultValue: 'Benefits are conditional' })}
          </div>
          <div style={{ color: '#78350f', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('agiBenefits.caveatText', { defaultValue: 'None of these outcomes are automatic. They require alignment research, equitable access, thoughtful regulation, and international cooperation. The choice between the scenarios in "Possible Endings" and the benefits on this page depends on decisions being made right now.' })}
          </div>
        </div>
      </div>
    </div>
  );
}
