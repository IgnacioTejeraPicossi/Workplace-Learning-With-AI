import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';

const PHASES = ['v0', 'v1', 'v2', 'v3'];
const SOURCES = [
  { id: 'ophRepo',        href: 'https://github.com/FloatingPragma/observer-patch-holography' },
  { id: 'ophLearn',       href: 'https://learn.floatingpragma.io/' },
  { id: 'ophBook',        href: 'https://oph-book.floatingpragma.io/' },
  { id: 'muellerX',       href: 'https://x.com/muellerberndt/status/2053045501193535607' },
  { id: 'bostrom',        href: 'https://www.simulation-argument.com/simulation.html' },
  { id: 'rovelli',        href: 'https://arxiv.org/abs/quant-ph/9609002' },
  { id: 'susskind',       href: 'https://en.wikipedia.org/wiki/Holographic_principle' },
  { id: 'friston',        href: 'https://www.fil.ion.ucl.ac.uk/~karl/A%20theory%20of%20cortical%20responses.pdf' },
  { id: 'iit',            href: 'https://www.nature.com/articles/s41583-022-00578-5' },
  { id: 'gnw',            href: 'https://www.sciencedirect.com/science/article/pii/S0028393218302878' },
  // ─── Added when Celestial Holography joined the theory tour (Pasterski) ──
  { id: 'pasterskiPI',    href: 'https://perimeterinstitute.ca/people/sabrina-pasterski' },
  { id: 'simonsCelestial',href: 'https://simonscelestialholographycollaboration.org/' },
  { id: 'celestialReview',href: 'https://arxiv.org/abs/2111.11392' },
  { id: 'physicsgirl',    href: 'https://physicsgirl.com' },
  { id: 'ctmuWiki',       href: 'https://ctmucommunity.org/wiki/Cognitive-Theoretic_Model_of_the_Universe' },
  { id: 'ctmuReviews',    href: 'https://www.physicsforums.com/threads/chris-langans-ctmu-scientific-reviews.487548/' },
];

// V1+ candidate integrations — kept out of SOURCES until verified
const PENDING_INTEGRATIONS = [
  { id: 'wiphyMcp', href: 'https://wiphy.org/docs' },
];

export default function RoadmapAndSources() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>🗺️ {t('selfSimReality.tabs.roadmap')}</h3>
        <p style={{ ...subtle, margin: '0 0 14px' }}>{t('selfSimReality.roadmap.intro')}</p>
        <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 8 }}>
          {PHASES.map((p, i) => {
            // All planned phases (V0–V3) are shipped; every phase reads as done
            // (green). No single "current" — the module is functionally complete.
            const CURRENT_INDEX = PHASES.length - 1;
            const done = i <= CURRENT_INDEX;
            return (
              <li key={p} style={{
                fontSize: 13, color: done ? '#047857' : '#475569',
                fontWeight: i === CURRENT_INDEX ? 600 : 400, lineHeight: 1.5,
              }}>
                {t(`selfSimReality.roadmap.phases.${p}`)}
              </li>
            );
          })}
        </ol>
      </div>

      <div style={panel}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
          📖 {t('selfSimReality.roadmap.sourcesTitle')}
        </h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {SOURCES.map(s => (
            <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', padding: '10px 12px', borderRadius: 8,
              backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
              fontSize: 12, color: '#1e293b', textDecoration: 'none',
              lineHeight: 1.45,
            }}>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>↗</span>{' '}
              {t(`selfSimReality.roadmap.sources.${s.id}`)}
            </a>
          ))}
        </div>
      </div>

      {/* Pending V1+ integrations — kept visible so the roadmap is honest
          about which sources are candidates vs already accepted */}
      <div style={{ ...panel, background: '#fffbeb', borderColor: '#fde68a' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#78350f' }}>
          🧪 {t('selfSimReality.roadmap.pendingTitle')}
        </h4>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
          {t('selfSimReality.roadmap.pendingIntro')}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {PENDING_INTEGRATIONS.map(p => (
            <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', padding: '10px 12px', borderRadius: 8,
              backgroundColor: 'white', border: '1px dashed #fbbf24',
              fontSize: 12, color: '#78350f', textDecoration: 'none',
              lineHeight: 1.45,
            }}>
              <span style={{ color: '#d97706', fontWeight: 600 }}>↗</span>{' '}
              {t(`selfSimReality.roadmap.pending.${p.id}`)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
