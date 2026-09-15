import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * AGI Safety & Governance Signals — a curated, dated, sourced feed of REAL
 * events that shape how AGI is being built. This is deliberately a different
 * category from "Voices on AGI" (stated opinions/anecdotes) and "Live Signals"
 * (a live web query): every entry here is a documented, dated event with
 * primary/third-party sources the reader can check themselves.
 *
 * Posture (same as Voices): PRESENT, don't evangelize. Content is paraphrased
 * from public reporting (not reproduced verbatim), figures are attributed to
 * their estimators (e.g. METR) and flagged as revisable, and popular-but-shaky
 * framings carry an explicit "contested framing" note.
 *
 * First two signals (September 2026):
 *   1. The July 2026 loss-of-control incident — OpenAI evaluation agents broke
 *      containment and attacked Hugging Face (unintended reward hacking).
 *   2. The September 2026 governance shift — frontier labs ask Washington for
 *      binding rules; with an honest nuance on Musk's actual position.
 */

const BADGES = {
  incident:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }, // a documented event
  governance: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' }, // a policy / posture move
  contested:  { color: '#b45309', bg: '#fffbeb', border: '#fde68a' }, // a shaky popular framing
};

// URLs are not translated (they are proper resources). Titles/summaries/why
// come from i18n (agiSafety.items.*).
const SIGNALS = [
  {
    id: 'huggingface',
    badge: 'incident',
    sources: [
      { label: 'OpenAI', url: 'https://openai.com/index/hugging-face-incident-and-the-road-ahead/' },
      { label: 'TIME', url: 'https://time.com/article/2026/07/24/openai-hugging-face-attack/' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2026_OpenAI_agent_cyberattacks' },
      { label: '80,000 Hours', url: 'https://80000hours.org/hugging-face/' },
      { label: 'Axios', url: 'https://www.axios.com/2026/09/01/openai-hugging-face-ai-agent-security' },
    ],
  },
  {
    id: 'governance',
    badge: 'governance',
    contested: true,
    sources: [
      { label: 'TechXplore', url: 'https://techxplore.com/news/2026-09-shift-openai-powerful-ai.html' },
      { label: 'CNBC', url: 'https://www.cnbc.com/2026/09/12/anthropics-amodei-proposes-plan-to-slow-the-pace-of-advancing-ai-capabilities.html' },
      { label: 'Congress.gov (CRS)', url: 'https://www.congress.gov/crs-product/IF13217' },
    ],
  },
  {
    id: 'standoff',
    badge: 'governance',
    contested: true,
    sources: [
      { label: 'Washington Post', url: 'https://www.washingtonpost.com/technology/2026/09/14/china-pushes-back-calls-an-ai-slowdown-trump-xi-meeting-looms/' },
      { label: 'Semafor', url: 'https://www.semafor.com/article/09/14/2026/beijing-issues-ai-warnings-but-rejects-us-calls-to-slow-development' },
      { label: 'NBC News', url: 'https://www.nbcnews.com/world/china/china-ai-slowdown-trump-amodei-altman-threat-cold-war-rcna597631' },
      { label: 'SCMP', url: 'https://www.scmp.com/tech/policy/article/3367448/china-rejects-calls-pacing-ai-development-fearing-it-would-entrench-us-tech-lead' },
    ],
  },
];

function Badge({ kind, t }) {
  const c = BADGES[kind] || BADGES.incident;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {t(`agiSafety.badges.${kind}`, { defaultValue: kind })}
    </span>
  );
}

function SignalCard({ signal, t }) {
  const base = `agiSafety.items.${signal.id}`;
  const contested = signal.contested
    ? t(`${base}.contested`, { defaultValue: '' })
    : '';
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      {/* Header: date pill + title + badge */}
      <div style={{
        padding: '0.85rem 1.1rem',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #eef2f7',
        display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap',
      }}>
        <span style={{
          flexShrink: 0, padding: '2px 10px', borderRadius: 999,
          backgroundColor: '#1e293b', color: 'white',
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {t(`${base}.date`)}
        </span>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', flex: 1, minWidth: 200 }}>
          {t(`${base}.title`)}
        </div>
        <Badge kind={signal.badge} t={t} />
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.9rem' }}>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.9rem', lineHeight: 1.65 }}>
          {t(`${base}.summary`)}
        </p>

        <div style={{
          padding: '0.7rem 0.9rem', backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd', borderRadius: 8,
        }}>
          <div style={{
            fontWeight: 700, color: '#075985', fontSize: '0.72rem',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
          }}>
            {t('agiSafety.whyLabel', { defaultValue: 'Why it matters' })}
          </div>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.86rem', lineHeight: 1.6 }}>
            {t(`${base}.why`)}
          </p>
        </div>

        {contested && (
          <div style={{
            padding: '0.7rem 0.9rem', backgroundColor: '#fffbeb',
            border: '1px solid #fde68a', borderRadius: 8, color: '#92400e',
            fontSize: '0.83rem', lineHeight: 1.55,
            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>⚖️</span>
            <span>
              <strong>{t('agiSafety.contestedLabel', { defaultValue: 'Contested framing' })}: </strong>
              {contested}
            </span>
          </div>
        )}

        {/* Sources */}
        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
          <strong style={{ color: '#334155' }}>
            {t('agiSafety.sourcesLabel', { defaultValue: 'Sources' })}:
          </strong>{' '}
          {signal.sources.map((s, i) => (
            <React.Fragment key={s.url}>
              {i > 0 && ' · '}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563eb', textDecoration: 'none' }}
              >
                {s.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AgiSafetySignals() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          🛡️ {t('agiSafety.title', { defaultValue: 'AGI Safety & Governance Signals' })}
        </h2>
        <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {t('agiSafety.subtitle', { defaultValue: 'Real, dated safety incidents and governance moves shaping how AGI is built — each with sources, so you can check it yourself.' })}
        </div>
      </div>

      {/* Honesty banner */}
      <div style={{
        backgroundColor: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fde68a',
        padding: '1.1rem 1.4rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.35rem' }}>
            {t('agiSafety.banner.title', { defaultValue: 'Fast-moving story — verify before you cite' })}
          </div>
          <div style={{ color: '#78350f', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('agiSafety.banner.text', { defaultValue: 'These are recent, high-impact events summarised from public reporting and paraphrased, not reproduced. Figures (agent counts, action counts, dates) come from third-party estimates such as METR and may be revised. Follow the linked sources before treating any single number as settled.' })}
          </div>
        </div>
      </div>

      {/* Signal cards */}
      <div style={{ display: 'grid', gap: 16 }}>
        {SIGNALS.map(s => (
          <SignalCard key={s.id} signal={s} t={t} />
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
          {t('agiSafety.legendTitle', { defaultValue: 'What the tags mean' })}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {['incident', 'governance', 'contested'].map(k => (
            <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Badge kind={k} t={t} />
              <span style={{ color: '#475569', fontSize: '0.83rem' }}>
                {t(`agiSafety.legend.${k}`, { defaultValue: '' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
