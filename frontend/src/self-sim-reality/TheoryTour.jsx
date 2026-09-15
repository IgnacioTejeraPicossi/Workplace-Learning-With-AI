import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

const ROWS = [
  { id: 'predictive' },
  { id: 'relationalQm' },
  { id: 'holographic' },
  { id: 'simHypothesis' },
  { id: 'iit' },
  { id: 'gnw' },
  { id: 'celestialHolography' },
  { id: 'oph' },
  { id: 'ctmu' },
  { id: 'willowMultiverse' },
  { id: 'hoffmanInterface' },
  // The "mind co-constructs reality" lineage (Pribram → Bohm → Grinberg),
  // added from a documentary the project owner brought in. Historical order.
  { id: 'pribramHolonomic' },
  { id: 'bohmImplicate' },
  { id: 'grinbergSyntergic' },
  // Deutsch's Many-Worlds multiverse — brought in from a documentary on the
  // double-slit experiment. The time-travel row also answers the owner's own
  // "which-multiverse?" probability question (see its Link note).
  { id: 'deutschMultiverse' },
  { id: 'deutschTimeTravel' },
];

const PASTERSKI_LINKS = [
  { id: 'perimeter', href: 'https://perimeterinstitute.ca/people/sabrina-pasterski' },
  { id: 'simons',    href: 'https://simonscelestialholographycollaboration.org/' },
  { id: 'personal',  href: 'https://physicsgirl.com' },
  { id: 'review',    href: 'https://arxiv.org/abs/2111.11392' },
];

// Second featured voice — David Deutsch. Added when his Many-Worlds rows entered
// the tour. Links verified live 2026-09-15 (personal site + Oxford profile).
const DEUTSCH_LINKS = [
  { id: 'oxford',   href: 'https://www.physics.ox.ac.uk/our-people/deutsch' },
  { id: 'personal', href: 'https://www.daviddeutsch.org.uk/' },
  { id: 'book',     href: 'https://en.wikipedia.org/wiki/The_Fabric_of_Reality' },
  { id: 'paper',    href: 'https://gwern.net/doc/science/physics/1991-deutsch.pdf' },
];

// Reusable featured-voice card (was inlined for Pasterski; generalised so the
// tour can name more than one working researcher). `prefix` selects the i18n
// block (featured | featuredDeutsch); `links` supplies the button hrefs.
function FeaturedVoice({ prefix, links, icon, t }) {
  const base = `selfSimReality.theoryTour.${prefix}`;
  return (
    <div style={{
      ...panel,
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderColor: '#c4b5fd',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: 'white', flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <strong style={{ fontSize: 16, color: '#4c1d95' }}>
              {t(`${base}.name`)}
            </strong>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              background: '#7c3aed', color: 'white', padding: '2px 8px', borderRadius: 999,
            }}>{t(`${base}.badge`)}</span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: '#4c1d95', fontStyle: 'italic' }}>
            {t(`${base}.role`)}
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
            {t(`${base}.bio`)}
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b21a8', fontStyle: 'italic', lineHeight: 1.5 }}>
            {t(`${base}.relationToOph`)}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {links.map(l => (
              <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'white', border: '1px solid #c4b5fd',
                fontSize: 11, fontWeight: 600, color: '#6b21a8',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                ↗ {t(`${base}.links.${l.id}`)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TheoryTour({ scrollTarget }) {
  const { t } = useTranslation();
  const [highlightId, setHighlightId] = useState('');

  // When another tab (e.g. Code of Reality) links to a specific theory, scroll
  // it into view and flash a highlight ring for a couple of seconds.
  useEffect(() => {
    const id = scrollTarget && scrollTarget.rowId;
    if (!id) return;
    setHighlightId(id);
    const el = document.getElementById(`theory-row-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setHighlightId(''), 2400);
    return () => clearTimeout(timer);
  }, [scrollTarget]);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>🧭 {t('selfSimReality.tabs.theoryTour')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.theoryTour.intro')}</p>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {ROWS.map(row => {
          const level = t(`selfSimReality.theoryTour.rows.${row.id}Level`);
          return (
            <div key={row.id} id={`theory-row-${row.id}`} style={{
              ...panel,
              transition: 'box-shadow 0.3s',
              ...(highlightId === row.id ? { boxShadow: '0 0 0 3px #7c3aed' } : {}),
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <strong style={{ fontSize: 15, color: '#1e293b' }}>
                  {t(`selfSimReality.theoryTour.rows.${row.id}Title`)}
                </strong>
                <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                  {t(`selfSimReality.theoryTour.rows.${row.id}Author`)}
                </span>
                <EpistemicBadge level={level} />
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {t(`selfSimReality.theoryTour.rows.${row.id}Body`)}
              </p>
              <p style={{
                margin: 0, fontSize: 12, color: '#6b21a8',
                fontStyle: 'italic', lineHeight: 1.45,
              }}>
                {t(`selfSimReality.theoryTour.rows.${row.id}Link`)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Featured Voices — working researchers the tour names directly, not just
          papers. Pasterski (celestial holography, mainstream) and Deutsch
          (Many-Worlds multiverse, speculative). Each keeps its epistemic badge. */}
      <FeaturedVoice prefix="featured" links={PASTERSKI_LINKS} icon="🌌" t={t} />
      <FeaturedVoice prefix="featuredDeutsch" links={DEUTSCH_LINKS} icon="⚛️" t={t} />
    </div>
  );
}
