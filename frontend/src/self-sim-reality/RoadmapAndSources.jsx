import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';

const PHASES = ['v0', 'v1', 'v2', 'v3'];
const SOURCES = [
  { id: 'ophRepo',   href: 'https://github.com/FloatingPragma/observer-patch-holography' },
  { id: 'ophLearn',  href: 'https://learn.floatingpragma.io/' },
  { id: 'ophBook',   href: 'https://oph-book.floatingpragma.io/' },
  { id: 'muellerX',  href: 'https://x.com/muellerberndt/status/2053045501193535607' },
  { id: 'bostrom',   href: 'https://www.simulation-argument.com/simulation.html' },
  { id: 'rovelli',   href: 'https://arxiv.org/abs/quant-ph/9609002' },
  { id: 'susskind',  href: 'https://en.wikipedia.org/wiki/Holographic_principle' },
  { id: 'friston',   href: 'https://www.fil.ion.ucl.ac.uk/~karl/A%20theory%20of%20cortical%20responses.pdf' },
  { id: 'iit',       href: 'https://www.nature.com/articles/s41583-022-00578-5' },
  { id: 'gnw',       href: 'https://www.sciencedirect.com/science/article/pii/S0028393218302878' },
];

export default function RoadmapAndSources() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>🗺️ {t('selfSimReality.tabs.roadmap')}</h3>
        <p style={{ ...subtle, margin: '0 0 14px' }}>{t('selfSimReality.roadmap.intro')}</p>
        <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 8 }}>
          {PHASES.map((p, i) => (
            <li key={p} style={{
              fontSize: 13, color: i === 0 ? '#047857' : '#475569',
              fontWeight: i === 0 ? 600 : 400, lineHeight: 1.5,
            }}>
              {t(`selfSimReality.roadmap.phases.${p}`)}
            </li>
          ))}
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
    </div>
  );
}
