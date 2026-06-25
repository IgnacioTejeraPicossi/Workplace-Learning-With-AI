import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { enrichBenefits } from '../../../api/agiApi';
import AiSuggestions, { ApplyDismissActions, SourceLink } from './AiSuggestions';

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
  // ─── New in 2026-06: Mental Health & Disaster Response ────────────────────
  {
    id: 'mentalHealth',
    icon: '🧠',
    titleKey: 'agiBenefits.items.mentalHealth.title',
    descKey: 'agiBenefits.items.mentalHealth.desc',
    examplesKey: 'agiBenefits.items.mentalHealth.examples',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    borderColor: '#99f6e4',
  },
  {
    id: 'disasters',
    icon: '🌊',
    titleKey: 'agiBenefits.items.disasters.title',
    descKey: 'agiBenefits.items.disasters.desc',
    examplesKey: 'agiBenefits.items.disasters.examples',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  // ─── Added 2026-06: Accessibility, Humanoid Robotics, Conservation ────────
  {
    id: 'accessibility',
    icon: '🦮',
    titleKey: 'agiBenefits.items.accessibility.title',
    descKey: 'agiBenefits.items.accessibility.desc',
    examplesKey: 'agiBenefits.items.accessibility.examples',
    color: '#0369a1',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  {
    id: 'humanoidRobotics',
    icon: '🤖',
    titleKey: 'agiBenefits.items.humanoidRobotics.title',
    descKey: 'agiBenefits.items.humanoidRobotics.desc',
    examplesKey: 'agiBenefits.items.humanoidRobotics.examples',
    color: '#475569',
    bgColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  {
    id: 'conservation',
    icon: '🦁',
    titleKey: 'agiBenefits.items.conservation.title',
    descKey: 'agiBenefits.items.conservation.desc',
    examplesKey: 'agiBenefits.items.conservation.examples',
    color: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
  },
];

function BenefitCard({ benefit, t, extraExamples = [] }) {
  const examples = t(benefit.examplesKey, { returnObjects: true, defaultValue: [] });
  const baseList = Array.isArray(examples) ? examples : [];
  const exampleList = [...baseList, ...extraExamples];

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
              {exampleList.map((ex, i) => {
                const isObj = typeof ex === 'object' && ex !== null;
                const isAi  = isObj && ex.aiAdded;
                const text  = isObj ? ex.text : ex;
                const url   = isObj ? ex.url  : null;
                const sourceLabel = (isObj && ex.source) ? ex.source : 'source';
                return (
                  <li key={i}>
                    {text}
                    {url && (
                      <>
                        {' '}
                        <a href={url} target="_blank" rel="noreferrer"
                           style={{ fontSize: 10, color: '#2563eb' }}>
                          {sourceLabel} ↗
                        </a>
                      </>
                    )}
                    {isAi && (
                      <span style={{
                        background: '#ecfdf5', color: '#065f46',
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                        padding: '1px 5px', borderRadius: 4, marginLeft: 6,
                      }}>AI</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BenefitsOfAGI() {
  const { t } = useTranslation();
  // Session-only: AI-added examples keyed by categoryId.
  const [extraByCategory, setExtraByCategory] = useState({});

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
          <BenefitCard
            key={b.id}
            benefit={b}
            t={t}
            extraExamples={extraByCategory[b.id] || []}
          />
        ))}
      </div>

      {/* AI enrichment — web + LLM suggestions (session-only apply) */}
      <AiSuggestions
        fetchSuggestions={() => {
          const payload = benefits.map(b => ({
            id: b.id,
            title: t(b.titleKey),
            examples: (() => {
              const base = t(b.examplesKey, { returnObjects: true, defaultValue: [] });
              return Array.isArray(base) ? base : [];
            })(),
          }));
          return enrichBenefits(payload);
        }}
        onApply={async (s) => {
          if (!s.categoryId || !s.newExample) return;
          setExtraByCategory(prev => {
            const existing = prev[s.categoryId] || [];
            return {
              ...prev,
              [s.categoryId]: [
                ...existing,
                { text: s.newExample, url: s.sourceUrl || null, aiAdded: true },
              ],
            };
          });
        }}
        renderSuggestion={(s, { onApply, onDismiss, applied, t: tt }) => (
          <div>
            <span style={{
              background: '#dbeafe', color: '#1e40af',
              padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>{s.categoryId || '?'}</span>
            {s.newExample && (
              <div style={{ marginTop: 6, color: '#1f2937', fontSize: 13, lineHeight: 1.5 }}>
                {s.newExample}
              </div>
            )}
            {s.note && (
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                {s.note}
              </div>
            )}
            {s.sourceUrl && (
              <div style={{ marginTop: 6 }}><SourceLink url={s.sourceUrl} /></div>
            )}
            <ApplyDismissActions onApply={onApply} onDismiss={onDismiss} applied={applied} t={tt} />
          </div>
        )}
      />

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
