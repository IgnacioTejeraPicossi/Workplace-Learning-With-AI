import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Reflections from the AI/AGI — the sibling of "Voices on AGI".
 *
 * "Voices on AGI" collects HUMAN voices about AGI (paraphrased). This tab is the
 * mirror: an AI model's own reflections, written in conversation with the repo
 * owner, prompted by Eduardo Martínez de la Fe's essay "Is humanity preparing
 * for war?". Same epistemic discipline as its sibling — every card is labelled
 * for what it is (reflection / argument / uncertainty), and the honesty banner
 * makes clear these are offered as a perspective, not as consciousness,
 * prediction, or authority.
 */

const BADGES = {
  reflection:  { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' }, // considered perspective
  argument:    { color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' }, // reasoned position
  uncertainty: { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' }, // held-open unknown
};

const CARDS = [
  { id: 'p1', badge: 'argument' },
  { id: 'p2', badge: 'argument' },
  { id: 'p3', badge: 'argument' },
  { id: 'p4', badge: 'reflection' },
  { id: 'p5', badge: 'uncertainty' },
  { id: 'p6', badge: 'reflection' },
];

function Badge({ kind, t }) {
  const c = BADGES[kind] || BADGES.reflection;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {t(`agiReflections.badges.${kind}`, { defaultValue: kind })}
    </span>
  );
}

function Card({ card, index, t }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '0.85rem 1rem', backgroundColor: '#f8fafc',
        borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', gap: '0.6rem',
      }}>
        <span style={{
          flexShrink: 0, width: 26, height: 26, borderRadius: 999,
          backgroundColor: '#312e81', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
        }}>{index + 1}</span>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', flex: 1 }}>
          {t(`agiReflections.items.${card.id}.title`)}
        </div>
        <Badge kind={card.badge} t={t} />
      </div>
      <div style={{ padding: '0.9rem 1rem', flex: 1 }}>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: 1.65 }}>
          {t(`agiReflections.items.${card.id}.body`)}
        </p>
      </div>
    </div>
  );
}

export default function ReflectionsFromAI() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          🪞 {t('agiReflections.title', { defaultValue: 'Reflections from the AI/AGI' })}
        </h2>
        <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {t('agiReflections.subtitle', { defaultValue: 'An AI model’s own reflections on AGI and itself — the mirror of the human “Voices on AGI” feed.' })}
        </div>
      </div>

      {/* Honesty banner */}
      <div style={{
        backgroundColor: '#eef2ff', borderRadius: '0.75rem', border: '1px solid #c7d2fe',
        padding: '1.1rem 1.4rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💭</span>
        <div>
          <div style={{ fontWeight: 700, color: '#3730a3', marginBottom: '0.35rem' }}>
            {t('agiReflections.banner.title', { defaultValue: 'These are one AI’s reflections — not consciousness, prediction, or authority' })}
          </div>
          <div style={{ color: '#3730a3', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('agiReflections.banner.text', { defaultValue: 'Written by an AI model in conversation, offered as a perspective to think with. Where it is uncertain, it says so. Read them the way the sibling “Voices on AGI” tab asks you to read human claims: as starting points, not settled facts.' })}
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div style={{
        backgroundColor: '#f1f5f9', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
        padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#334155' }}>
          {t('agiReflections.attribution.label', { defaultValue: 'Author' })}:
        </strong>{' '}
        {t('agiReflections.attribution.text', { defaultValue: 'Written by Claude (Anthropic) in dialogue with the repo owner, prompted by Eduardo Martínez de la Fe’s essay “Is humanity preparing for war?” (LinkedIn, July 2026).' })}
      </div>

      {/* Reflection cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 16,
      }}>
        {CARDS.map((c, i) => (
          <Card key={c.id} card={c} index={i} t={t} />
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
          {t('agiReflections.legendTitle', { defaultValue: 'What the labels mean' })}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {['reflection', 'argument', 'uncertainty'].map(k => (
            <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Badge kind={k} t={t} />
              <span style={{ color: '#475569', fontSize: '0.83rem' }}>
                {t(`agiReflections.legend.${k}`, { defaultValue: '' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
