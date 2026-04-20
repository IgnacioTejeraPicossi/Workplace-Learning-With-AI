import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ZONE_COLORS = {
  surface: { bg: '#e0f2fe', text: '#0369a1', label: 'Surface' },
  shallow: { bg: '#e9d5ff', text: '#6b21a8', label: 'Shallow' },
  deep: { bg: '#fee2e2', text: '#991b1b', label: 'Deep' },
};

const endings = [
  {
    id: 'I',
    titleKey: 'agiEndings.endings.selfDestruction.title',
    descKey: 'agiEndings.endings.selfDestruction.desc',
    zone: 'surface',
    icon: '💥',
  },
  {
    id: 'II',
    titleKey: 'agiEndings.endings.conquerors.title',
    descKey: 'agiEndings.endings.conquerors.desc',
    zone: 'surface',
    icon: '⚔️',
  },
  {
    id: 'III',
    titleKey: 'agiEndings.endings.enslavedGod.title',
    descKey: 'agiEndings.endings.enslavedGod.desc',
    zone: 'surface',
    icon: '⛓️',
  },
  {
    id: 'IV',
    titleKey: 'agiEndings.endings.benevolentDictator.title',
    descKey: 'agiEndings.endings.benevolentDictator.desc',
    zone: 'surface',
    icon: '👑',
  },
  {
    id: 'V',
    titleKey: 'agiEndings.endings.gatekeeperAI.title',
    descKey: 'agiEndings.endings.gatekeeperAI.desc',
    zone: 'surface',
    icon: '🚪',
  },
  {
    id: 'VI',
    titleKey: 'agiEndings.endings.protectorGod.title',
    descKey: 'agiEndings.endings.protectorGod.desc',
    zone: 'shallow',
    icon: '🛡️',
  },
  {
    id: 'VII',
    titleKey: 'agiEndings.endings.descendants.title',
    descKey: 'agiEndings.endings.descendants.desc',
    zone: 'shallow',
    icon: '🧬',
  },
  {
    id: 'VIII',
    titleKey: 'agiEndings.endings.libertarianUtopia.title',
    descKey: 'agiEndings.endings.libertarianUtopia.desc',
    zone: 'shallow',
    icon: '🗽',
  },
  {
    id: 'IX',
    titleKey: 'agiEndings.endings.egalitarianUtopia.title',
    descKey: 'agiEndings.endings.egalitarianUtopia.desc',
    zone: 'deep',
    icon: '⚖️',
  },
  {
    id: 'X',
    titleKey: 'agiEndings.endings.zookeeper.title',
    descKey: 'agiEndings.endings.zookeeper.desc',
    zone: 'deep',
    icon: '🎪',
  },
  {
    id: 'XI',
    titleKey: 'agiEndings.endings.reversion.title',
    descKey: 'agiEndings.endings.reversion.desc',
    zone: 'deep',
    icon: '⏪',
  },
  {
    id: 'XII',
    titleKey: 'agiEndings.endings.nineteenEightyFour.title',
    descKey: 'agiEndings.endings.nineteenEightyFour.desc',
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

      {/* Reference */}
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
    </div>
  );
}
