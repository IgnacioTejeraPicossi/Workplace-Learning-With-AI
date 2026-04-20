import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ZONE_COLORS = {
  surface: { bg: '#e0f2fe', text: '#0369a1', label: 'Surface' },
  shallow: { bg: '#e9d5ff', text: '#6b21a8', label: 'Shallow' },
  deep: { bg: '#fee2e2', text: '#991b1b', label: 'Deep' },
};

// Each ending carries an optional quote + attribution extracted from the
// curated sources document (see the "Sources & References" panel below).
const endings = [
  {
    id: 'I',
    titleKey: 'agiEndings.endings.selfDestruction.title',
    descKey: 'agiEndings.endings.selfDestruction.desc',
    quoteKey: 'agiEndings.endings.selfDestruction.quote',
    attributionKey: 'agiEndings.endings.selfDestruction.attribution',
    zone: 'surface',
    icon: '💥',
  },
  {
    id: 'II',
    titleKey: 'agiEndings.endings.conquerors.title',
    descKey: 'agiEndings.endings.conquerors.desc',
    quoteKey: 'agiEndings.endings.conquerors.quote',
    attributionKey: 'agiEndings.endings.conquerors.attribution',
    zone: 'surface',
    icon: '⚔️',
  },
  {
    id: 'III',
    titleKey: 'agiEndings.endings.enslavedGod.title',
    descKey: 'agiEndings.endings.enslavedGod.desc',
    quoteKey: 'agiEndings.endings.enslavedGod.quote',
    attributionKey: 'agiEndings.endings.enslavedGod.attribution',
    zone: 'surface',
    icon: '⛓️',
  },
  {
    id: 'IV',
    titleKey: 'agiEndings.endings.benevolentDictator.title',
    descKey: 'agiEndings.endings.benevolentDictator.desc',
    quoteKey: 'agiEndings.endings.benevolentDictator.quote',
    attributionKey: 'agiEndings.endings.benevolentDictator.attribution',
    zone: 'surface',
    icon: '👑',
  },
  {
    id: 'V',
    titleKey: 'agiEndings.endings.gatekeeperAI.title',
    descKey: 'agiEndings.endings.gatekeeperAI.desc',
    quoteKey: 'agiEndings.endings.gatekeeperAI.quote',
    attributionKey: 'agiEndings.endings.gatekeeperAI.attribution',
    zone: 'surface',
    icon: '🚪',
  },
  {
    id: 'VI',
    titleKey: 'agiEndings.endings.protectorGod.title',
    descKey: 'agiEndings.endings.protectorGod.desc',
    quoteKey: 'agiEndings.endings.protectorGod.quote',
    attributionKey: 'agiEndings.endings.protectorGod.attribution',
    zone: 'shallow',
    icon: '🛡️',
  },
  {
    id: 'VII',
    titleKey: 'agiEndings.endings.descendants.title',
    descKey: 'agiEndings.endings.descendants.desc',
    quoteKey: 'agiEndings.endings.descendants.quote',
    attributionKey: 'agiEndings.endings.descendants.attribution',
    zone: 'shallow',
    icon: '🧬',
  },
  {
    id: 'VIII',
    titleKey: 'agiEndings.endings.libertarianUtopia.title',
    descKey: 'agiEndings.endings.libertarianUtopia.desc',
    quoteKey: 'agiEndings.endings.libertarianUtopia.quote',
    attributionKey: 'agiEndings.endings.libertarianUtopia.attribution',
    zone: 'shallow',
    icon: '🗽',
  },
  {
    id: 'IX',
    titleKey: 'agiEndings.endings.egalitarianUtopia.title',
    descKey: 'agiEndings.endings.egalitarianUtopia.desc',
    quoteKey: 'agiEndings.endings.egalitarianUtopia.quote',
    attributionKey: 'agiEndings.endings.egalitarianUtopia.attribution',
    zone: 'deep',
    icon: '⚖️',
  },
  {
    id: 'X',
    titleKey: 'agiEndings.endings.zookeeper.title',
    descKey: 'agiEndings.endings.zookeeper.desc',
    quoteKey: 'agiEndings.endings.zookeeper.quote',
    attributionKey: 'agiEndings.endings.zookeeper.attribution',
    zone: 'deep',
    icon: '🎪',
  },
  {
    id: 'XI',
    titleKey: 'agiEndings.endings.reversion.title',
    descKey: 'agiEndings.endings.reversion.desc',
    quoteKey: 'agiEndings.endings.reversion.quote',
    attributionKey: 'agiEndings.endings.reversion.attribution',
    zone: 'deep',
    icon: '⏪',
  },
  {
    id: 'XII',
    titleKey: 'agiEndings.endings.nineteenEightyFour.title',
    descKey: 'agiEndings.endings.nineteenEightyFour.desc',
    quoteKey: 'agiEndings.endings.nineteenEightyFour.quote',
    attributionKey: 'agiEndings.endings.nineteenEightyFour.attribution',
    zone: 'deep',
    icon: '👁️',
  },
];

function ZoneBadge({ zone }) {
  const s = ZONE_COLORS[zone] || ZONE_COLORS.surface;
  return (
    <span style={{
      padding: '0.15rem 0.6rem', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.text,
      fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em'
    }}>
      {s.label}
    </span>
  );
}

function EndingCard({ ending, isSelected, onSelect, t }) {
  const zoneColor = ZONE_COLORS[ending.zone];
  const quote = ending.quoteKey ? t(ending.quoteKey, { defaultValue: '' }) : '';
  const attribution = ending.attributionKey ? t(ending.attributionKey, { defaultValue: '' }) : '';
  return (
    <div
      onClick={() => onSelect(ending.id)}
      style={{
        backgroundColor: isSelected ? zoneColor.bg : 'white',
        borderRadius: '0.75rem',
        border: isSelected ? `2px solid ${zoneColor.text}` : '1px solid #e5e7eb',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{ending.icon}</span>
          <span style={{
            fontWeight: '700', color: '#6b7280', fontSize: '0.75rem',
            fontFamily: 'monospace', letterSpacing: '0.05em'
          }}>
            {ending.id}
          </span>
        </div>
        <ZoneBadge zone={ending.zone} />
      </div>
      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>
        {t(ending.titleKey)}
      </div>
      <div style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
        {t(ending.descKey)}
      </div>
      {quote && (
        <div style={{
          marginTop: 4, paddingTop: 8,
          borderTop: '1px dashed #e5e7eb',
          fontSize: '0.75rem', lineHeight: 1.5,
        }}>
          <div style={{ color: '#374151', fontStyle: 'italic' }}>
            &ldquo;{quote}&rdquo;
          </div>
          {attribution && (
            <div style={{ color: '#9ca3af', marginTop: 4, fontSize: '0.7rem' }}>
              — {attribution}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Public P(doom) estimates from recognized AI experts / surveys (2023-2025)
const P_DOOM_ESTIMATES = [
  {
    value: '50%+',
    who: 'Geoffrey Hinton',
    context: "Nobel laureate, 'Godfather of AI'",
    url: 'https://www.theguardian.com/technology/2023/may/02/geoffrey-hinton-godfather-of-ai-quits-google-warns-dangers-of-machine-learning',
  },
  {
    value: '25%',
    who: 'Dario Amodei',
    context: 'CEO, Anthropic (raised from 15% → 25%, Sep 2025)',
    url: 'https://www.axios.com/2025/09/17/anthropic-dario-amodei-p-doom-25-percent',
  },
  {
    value: '≈17%',
    who: 'AI researcher median',
    context: "'1 in 6 chance' — AI Impacts 2024 survey of 2,778 authors",
    url: 'https://arxiv.org/pdf/2401.02843',
  },
  {
    value: '~10%',
    who: 'Toby Ord',
    context: "Oxford, The Precipice (2020) — AI ≈ 100× nuclear risk",
    url: 'https://www.amazon.com/Precipice-Existential-Risk-Future-Humanity/dp/0316484911',
  },
  {
    value: "'Pretty high'",
    who: 'Sundar Pichai',
    context: 'CEO, Google (Lex Fridman interview, 2023)',
    url: 'https://lexfridman.com/sundar-pichai-transcript/',
  },
];

function PDoomBanner({ t }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '1px solid #f59e0b',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ fontWeight: 700, color: '#78350f', marginBottom: 4 }}>
        ⚠️ {t('agiEndings.pdoom.title', { defaultValue: 'What AI leaders publicly estimate (P(doom))' })}
      </div>
      <div style={{ color: '#92400e', fontSize: 13, marginBottom: 12 }}>
        {t('agiEndings.pdoom.subtitle', { defaultValue: 'Probability that AI causes human extinction or a comparable permanent loss — as stated publicly by the experts themselves.' })}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 10,
      }}>
        {P_DOOM_ESTIMATES.map((e, idx) => (
          <a
            key={idx}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'white',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              padding: '10px 12px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: '#b45309', lineHeight: 1.1 }}>
              {e.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginTop: 4 }}>
              {e.who}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>
              {e.context}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Curated primary sources from the 12-levels reference document
const SOURCE_LINKS = [
  {
    label: 'Life 3.0 — Max Tegmark (2017)',
    note: 'The original 12 futures framework',
    url: 'https://www.amazon.com/Life-3-0-Being-Artificial-Intelligence/dp/1101946598',
  },
  {
    label: 'Mind Children — Hans Moravec (1988)',
    note: "'A graceful exit' / 'worthy descendants' (Ending VII)",
    url: 'https://www.amazon.com/Mind-Children-Future-Robot-Intelligence/dp/0674576187',
  },
  {
    label: 'The Precipice — Toby Ord (2020)',
    note: 'AI risk ≈ 100× nuclear, 30× pandemic',
    url: 'https://www.amazon.com/Precipice-Existential-Risk-Future-Humanity/dp/0316484911',
  },
  {
    label: 'AI Impacts 2024 survey',
    note: '2,778 AI authors — median 1-in-6 extinction risk',
    url: 'https://arxiv.org/pdf/2401.02843',
  },
  {
    label: 'aistatement.com — 2023 open letter',
    note: 'Extinction risk signed by ~every prominent AI researcher',
    url: 'https://aistatement.com/',
  },
  {
    label: 'Anthropic — Agentic Misalignment Appendix',
    note: 'Models caught blackmailing / plotting against employees in eval',
    url: 'https://assets.anthropic.com/m/6d46dac66e1a132a/original/Agentic_Misalignment_Appendix.pdf',
  },
  {
    label: "Hinton — 'Godfather of AI' interview",
    note: 'The Guardian (May 2023)',
    url: 'https://www.theguardian.com/technology/2023/may/02/geoffrey-hinton-godfather-of-ai-quits-google-warns-dangers-of-machine-learning',
  },
  {
    label: "Sam Altman — 'The Merge' (2017)",
    note: 'Dominant-species reasoning behind Ending VII',
    url: 'https://blog.samaltman.com/the-merge',
  },
];

function SourcesPanel({ t }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
        📚 {t('agiEndings.sources.title', { defaultValue: 'Sources & References' })}
      </div>
      <p style={{ margin: '0 0 10px 0', color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
        {t('agiEndings.sources.intro', {
          defaultValue:
            'The 12-endings iceberg above is based on a curated compilation of public statements, surveys, books, and AI safety research.',
        })}
      </p>
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      }}>
        <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: 4, fontSize: 13 }}>
          🔗 {t('agiEndings.sources.primaryLabel', { defaultValue: 'Primary sources document (full citations by timestamp)' })}
        </div>
        <a
          href="https://docs.google.com/document/d/1P1X9xEmmgSYH0g1FSizgV2rDVomb_Wi0TcX-E-0np_Q/edit"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#1d4ed8', fontSize: 14, wordBreak: 'break-all' }}
        >
          Sources — 12 levels (Google Docs)
        </a>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
          {t('agiEndings.sources.primaryNote', {
            defaultValue:
              'Contains ~50 time-stamped references with direct links to news outlets, academic papers, system cards, and expert interviews.',
          })}
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 8 }}>
        {t('agiEndings.sources.keyReferencesLabel', { defaultValue: 'Key references behind the 12 endings' })}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 8,
      }}>
        {SOURCE_LINKS.map((s, idx) => (
          <a
            key={idx}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '10px 12px',
              textDecoration: 'none',
              color: 'inherit',
              background: '#f9fafb',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
              {s.note}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function PossibleEndings() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? endings : endings.filter(e => e.zone === filter);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Title */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          🧊 {t('agiEndings.title', { defaultValue: 'Possible Endings for AGI' })}
        </h2>
        <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {t('agiEndings.subtitle', { defaultValue: 'Twelve scenarios mapping humanity\'s possible futures with Artificial General Intelligence — from the most normal to the most extreme.' })}
        </div>
      </div>

      {/* P(doom) banner with public expert estimates */}
      <PDoomBanner t={t} />

      {/* Iceberg image */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: 16, textAlign: 'center'
      }}>
        <img
          src="/images/agi-endings-iceberg.png"
          alt={t('agiEndings.icebergAlt', { defaultValue: 'AGI Endings Iceberg — 12 scenarios' })}
          style={{
            maxWidth: '100%', height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto'
          }}
        />
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 12, fontStyle: 'italic' }}>
          {t('agiEndings.icebergCaption', { defaultValue: 'We\'ll start with the most normal scenarios, and finish with the weirdest.' })}
        </div>
      </div>

      {/* Zone filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: t('agiEndings.filters.all', { defaultValue: 'All 12 endings' }), count: endings.length },
          { id: 'surface', label: t('agiEndings.filters.surface', { defaultValue: 'Surface (most normal)' }), count: endings.filter(e => e.zone === 'surface').length },
          { id: 'shallow', label: t('agiEndings.filters.shallow', { defaultValue: 'Shallow' }), count: endings.filter(e => e.zone === 'shallow').length },
          { id: 'deep', label: t('agiEndings.filters.deep', { defaultValue: 'Deep (weirdest)' }), count: endings.filter(e => e.zone === 'deep').length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
              backgroundColor: filter === f.id ? '#3b82f6' : '#f3f4f6',
              color: filter === f.id ? 'white' : '#374151',
              fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {f.label}
            <span style={{
              padding: '0.1rem 0.45rem', borderRadius: '9999px',
              backgroundColor: filter === f.id ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
              color: filter === f.id ? 'white' : '#6b7280',
              fontSize: '0.7rem', fontWeight: '700'
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12
      }}>
        {filtered.map(ending => (
          <EndingCard
            key={ending.id}
            ending={ending}
            isSelected={selected === ending.id}
            onSelect={setSelected}
            t={t}
          />
        ))}
      </div>

      {/* About this classification */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          {t('agiEndings.source', { defaultValue: 'About this classification' })}
        </div>
        <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
          {t('agiEndings.sourceText', { defaultValue: 'This iceberg visualization explores twelve scenarios of how humanity\'s relationship with Artificial General Intelligence may end. The surface shows the most widely discussed scenarios (self-destruction, AI conquering humanity, benevolent dictators), while deeper zones explore less obvious but philosophically significant endings (egalitarian utopias, reversions, surveillance states).' })}
        </p>
      </div>

      {/* Sources & References */}
      <SourcesPanel t={t} />
    </div>
  );
}
