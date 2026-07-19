import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Voices on AGI — a curated, epistemically-honest feed of notable claims and
 * anecdotes about the state of AGI. The first entry is Marc Andreessen's
 * appearance on The Joe Rogan Experience (17 points), summarized by @cyrilXBT.
 *
 * Design intent (same posture as the "Code of Reality" case study): PRESENT,
 * don't evangelize. Every point carries an epistemic badge and the source's
 * own caveats are shown up front, including the published counter-evidence for
 * the strongest health claim. Points are paraphrased, not reproduced verbatim.
 *
 * This tab is also the natural home for the "constantly updating" curated feed
 * — new voices/signals can be appended over time.
 */

// Epistemic taxonomy — honest about what each point actually is.
const BADGES = {
  view:      { color: '#b45309', bg: '#fffbeb', border: '#fde68a' }, // stated opinion/claim
  technique: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' }, // a usage technique
  anecdote:  { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }, // second-hand story
  contested: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }, // counter-evidence exists
};

// Point id + its epistemic category. Titles/bodies come from i18n (agiVoices.items.*).
// `counterpoint: true` renders the published counter-evidence note (point 2).
const ANDREESSEN_POINTS = [
  { id: 'p1',  badge: 'view' },
  { id: 'p2',  badge: 'contested', counterpoint: true },
  { id: 'p3',  badge: 'view' },
  { id: 'p4',  badge: 'technique' },
  { id: 'p5',  badge: 'technique' },
  { id: 'p6',  badge: 'technique' },
  { id: 'p7',  badge: 'technique' },
  { id: 'p8',  badge: 'view' },
  { id: 'p9',  badge: 'view' },
  { id: 'p10', badge: 'anecdote' },
  { id: 'p11', badge: 'view' },
  { id: 'p12', badge: 'view' },
  { id: 'p13', badge: 'anecdote' },
  { id: 'p14', badge: 'anecdote' },
  { id: 'p15', badge: 'anecdote' },
  { id: 'p16', badge: 'view' },
  { id: 'p17', badge: 'view' },
];

function EpistemicBadge({ kind, t }) {
  const c = BADGES[kind] || BADGES.view;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {t(`agiVoices.badges.${kind}`, { defaultValue: kind })}
    </span>
  );
}

function PointCard({ point, index, t }) {
  const counterpoint = point.counterpoint
    ? t('agiVoices.items.p2.counterpoint', { defaultValue: '' })
    : '';
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '0.85rem 1rem',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #eef2f7',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
      }}>
        <span style={{
          flexShrink: 0, width: 26, height: 26, borderRadius: 999,
          backgroundColor: '#1e293b', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
        }}>{index + 1}</span>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', flex: 1 }}>
          {t(`agiVoices.items.${point.id}.title`)}
        </div>
        <EpistemicBadge kind={point.badge} t={t} />
      </div>
      <div style={{ padding: '0.9rem 1rem', flex: 1 }}>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.6 }}>
          {t(`agiVoices.items.${point.id}.body`)}
        </p>
        {counterpoint && (
          <div style={{
            marginTop: '0.7rem', padding: '0.6rem 0.75rem',
            backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, color: '#991b1b', fontSize: '0.8rem', lineHeight: 1.5,
            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>⚖️</span>
            <span>
              <strong>{t('agiVoices.counterpointLabel', { defaultValue: 'Counterpoint' })}: </strong>
              {counterpoint}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoicesOnAGI() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all',       labelKey: 'agiVoices.filters.all' },
    { id: 'view',      labelKey: 'agiVoices.badges.view' },
    { id: 'technique', labelKey: 'agiVoices.badges.technique' },
    { id: 'anecdote',  labelKey: 'agiVoices.badges.anecdote' },
    { id: 'contested', labelKey: 'agiVoices.badges.contested' },
  ];

  const points = useMemo(
    () => (filter === 'all'
      ? ANDREESSEN_POINTS
      : ANDREESSEN_POINTS.filter(p => p.badge === filter)),
    [filter]
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          🎙️ {t('agiVoices.title', { defaultValue: 'Voices on AGI' })}
        </h2>
        <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {t('agiVoices.subtitle', { defaultValue: 'A curated, epistemically-honest feed of notable claims and anecdotes about the state of AGI — each tagged for what it actually is.' })}
        </div>
      </div>

      {/* Caution banner — surface the source's own caveats up front */}
      <div style={{
        backgroundColor: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fde68a',
        padding: '1.1rem 1.4rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.35rem' }}>
            {t('agiVoices.banner.title', { defaultValue: 'Read these as claims, not settled facts' })}
          </div>
          <div style={{ color: '#78350f', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('agiVoices.banner.text', { defaultValue: 'Several of these are Marc Andreessen’s stated views and second-hand anecdotes, not independently verified facts. Where strong claims have published counter-evidence, it is shown alongside. Treat the numbers as starting points to verify, not conclusions.' })}
          </div>
        </div>
      </div>

      {/* Source / attribution */}
      <div style={{
        backgroundColor: '#f1f5f9', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
        padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#334155' }}>
          {t('agiVoices.attribution.sourceLabel', { defaultValue: 'Source' })}:
        </strong>{' '}
        {t('agiVoices.attribution.source', { defaultValue: 'Marc Andreessen on The Joe Rogan Experience (3+ hour interview).' })}{' '}
        {t('agiVoices.attribution.via', { defaultValue: 'Summary of 17 points via @cyrilXBT on X.' })}{' '}
        <em>{t('agiVoices.attribution.watch', { defaultValue: 'Watch the full interview before treating any single number as settled.' })}</em>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${filter === f.id ? '#3b82f6' : '#cbd5e1'}`,
              backgroundColor: filter === f.id ? '#3b82f6' : 'white',
              color: filter === f.id ? 'white' : '#475569',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s ease',
            }}
          >
            {t(f.labelKey, { defaultValue: f.id })}
          </button>
        ))}
      </div>

      {/* Point cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 16,
      }}>
        {points.map((p) => (
          <PointCard key={p.id} point={p} index={ANDREESSEN_POINTS.indexOf(p)} t={t} />
        ))}
      </div>

      {/* Legend */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
        padding: '1rem 1.25rem',
      }}>
        <div style={{
          fontWeight: 700, color: '#334155', fontSize: '0.8rem',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem',
        }}>
          {t('agiVoices.legendTitle', { defaultValue: 'What the badges mean' })}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {['view', 'technique', 'anecdote', 'contested'].map(k => (
            <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <EpistemicBadge kind={k} t={t} />
              <span style={{ color: '#475569', fontSize: '0.83rem' }}>
                {t(`agiVoices.legend.${k}`, { defaultValue: '' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
