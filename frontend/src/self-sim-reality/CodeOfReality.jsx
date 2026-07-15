import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * The Code of Reality — 1.17.6+ (case study)
 *
 * A worked, skeptical-balanced case study of the viral "Code of Reality"
 * phenomenon: staring at the diffracted reflection of a 650 nm red laser under
 * N,N-DMT, people report seeing katakana-like "code" and read it as proof of a
 * simulation. It is the perfect live illustration of the agent's fact-making
 * pipeline — how a raw percept becomes a claimed "fact".
 *
 * Discipline: separate the three layers (percept / mechanism / metaphysics),
 * give the leading *perceptual* explanation its due, tag every claim with an
 * epistemic level, and end on how the two stories could actually be told apart.
 * Explicitly a case study — NOT an endorsement or how-to (safety banner).
 */

function NarrativeSection({ titleKey, bodyKey, levelKey, t }) {
  return (
    <div style={panel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{t(titleKey)}</h4>
        <EpistemicBadge level={t(levelKey)} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{t(bodyKey)}</p>
    </div>
  );
}

export default function CodeOfReality() {
  const { t } = useTranslation();
  const K = 'selfSimReality.codeOfReality';
  const tests = ['test1', 'test2', 'test3', 'test4'];
  const sources = [
    { label: 'Code Of Reality (official site)', url: 'https://codeofreality.org/' },
    { label: 'IPI Letters — pilot study (N,N-DMT “Code of Reality”)', url: 'https://ipipublishing.org/index.php/ipil/article/view/158' },
    { label: 'Vice — The Man Who Can “Prove” Life Is a Simulation', url: 'https://www.vice.com/en/article/danny-goler-dmt-vape-laser-simulation/' },
    { label: 'Ecstatic Integration — Cracking the Code', url: 'https://www.ecstaticintegration.org/p/cracking-the-code' },
    { label: 'alien insect — On the DMT laser “Code of Reality” effect', url: 'https://alieninsect.substack.com/p/on-the-dmt-laser-code-of-reality' },
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Intro */}
      <div style={{ ...panel, borderLeft: '4px solid #16a34a' }}>
        <h3 style={panelTitle}>🟩 {t('selfSimReality.tabs.codeOfReality')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t(`${K}.intro`)}</p>
      </div>

      {/* Safety / legal banner */}
      <div style={{
        ...panel,
        background: LEVEL_COLORS.unsupported.bg,
        border: `1px solid ${LEVEL_COLORS.unsupported.border}`,
        borderLeft: `4px solid ${LEVEL_COLORS.unsupported.fg}`,
      }}>
        <p style={{ margin: 0, fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.55 }}>
          ⚠️ {t(`${K}.safety`)}
        </p>
      </div>

      {/* 1 · The phenomenon */}
      <NarrativeSection t={t}
        titleKey={`${K}.sections.phenomenonTitle`}
        bodyKey={`${K}.sections.phenomenonBody`}
        levelKey={`${K}.sections.phenomenonLevel`} />

      {/* 2 · Three layers */}
      <NarrativeSection t={t}
        titleKey={`${K}.sections.threeLayersTitle`}
        bodyKey={`${K}.sections.threeLayersBody`}
        levelKey={`${K}.sections.threeLayersLevel`} />

      {/* 3 · The perceptual account (leading) */}
      <NarrativeSection t={t}
        titleKey={`${K}.sections.perceptualTitle`}
        bodyKey={`${K}.sections.perceptualBody`}
        levelKey={`${K}.sections.perceptualLevel`} />

      {/* 4 · The simulation reading */}
      <NarrativeSection t={t}
        titleKey={`${K}.sections.simulationTitle`}
        bodyKey={`${K}.sections.simulationBody`}
        levelKey={`${K}.sections.simulationLevel`} />

      {/* 5 · Through the OPH lens */}
      <NarrativeSection t={t}
        titleKey={`${K}.sections.ophTitle`}
        bodyKey={`${K}.sections.ophBody`}
        levelKey={`${K}.sections.ophLevel`} />

      {/* 6 · How you would test it — narrative + 4 discriminating experiments */}
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            {t(`${K}.sections.falsifiabilityTitle`)}
          </h4>
          <EpistemicBadge level={t(`${K}.sections.falsifiabilityLevel`)} />
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
          {t(`${K}.sections.falsifiabilityBody`)}
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          {tests.map(id => (
            <li key={id} style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
              {t(`${K}.sections.${id}`)}
            </li>
          ))}
        </ul>
      </div>

      {/* Closing epistemic reminder */}
      <div style={{
        ...panel,
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)',
        color: 'white', padding: '24px 28px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase', opacity: 0.7, marginBottom: 10,
        }}>
          ⚖️ {t(`${K}.verdictLabel`)}
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, opacity: 0.95, fontStyle: 'italic' }}>
          {t(`${K}.sections.closingNote`)}
        </p>
      </div>

      {/* Sources */}
      <div style={panel}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
          🔗 {t(`${K}.sourcesLabel`)}
        </h4>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {sources.map(s => (
            <li key={s.url} style={{ fontSize: 12, lineHeight: 1.5 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                 style={{ color: '#6b21a8', textDecoration: 'none' }}>{s.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
