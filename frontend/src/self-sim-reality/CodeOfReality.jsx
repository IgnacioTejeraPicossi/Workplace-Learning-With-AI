import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

// Which theory cards have a matching row in the Theory Tour tab (for the
// "See in Theory Tour →" cross-link). geometricHallucinations has no entry yet.
const THEORY_TO_TOUR = {
  digitalPhysics: 'holographic',
  simulationArgument: 'simHypothesis',
  predictiveProcessing: 'predictive',
  informationOntology: 'oph',
};

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

export default function CodeOfReality({ onAnalyzeClaim, onOpenTheory }) {
  const { t } = useTranslation();
  const K = 'selfSimReality.codeOfReality';
  const tests = ['test1', 'test2', 'test3', 'test4'];
  // Deterministic-ish speckle dots for the mini-visual (computed once).
  const specks = useMemo(
    () => Array.from({ length: 70 }, () => ({
      x: 6 + Math.random() * 158, y: 6 + Math.random() * 128, r: 0.8 + Math.random() * 1.6,
    })),
    [],
  );
  const theoryCards = [
    'digitalPhysics', 'simulationArgument', 'predictiveProcessing',
    'geometricHallucinations', 'informationOntology',
  ];
  const sources = [
    { label: 'Code Of Reality (official site)', url: 'https://codeofreality.org/' },
    { label: 'IPI Letters — pilot study (abstract)', url: 'https://ipipublishing.org/index.php/ipil/article/view/158' },
    { label: 'IPI Letters — pilot study (open-access PDF)', url: 'https://ipipublishing.org/index.php/ipil/article/view/158/93' },
    { label: 'Veilbreak — Code of Reality protocol', url: 'https://veilbreak.ai/cor/protocols/1' },
    { label: 'Vice — The Man Who Can “Prove” Life Is a Simulation', url: 'https://www.vice.com/en/article/danny-goler-dmt-vape-laser-simulation/' },
    { label: 'DoubleBlind — Wait, Are We In a Simulation?', url: 'https://doubleblindmag.com/wait-are-we-in-a-simulation/' },
    { label: 'Ecstatic Integration — Cracking the Code', url: 'https://www.ecstaticintegration.org/p/cracking-the-code' },
    { label: 'alien insect — On the DMT laser “Code of Reality” effect (artist’s rendering)', url: 'https://alieninsect.substack.com/p/on-the-dmt-laser-code-of-reality' },
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

      {/* Mini-visual: laser speckle (subjective scaffold) vs external code */}
      <div style={panel}>
        <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
          {t(`${K}.visual.title`)}
        </h4>
        <p style={{ ...subtle, margin: '0 0 12px' }}>{t(`${K}.visual.intro`)}</p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          {/* Left — laser speckle: random grains the brain scaffolds on */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <svg viewBox="0 0 170 140" width="100%" style={{ display: 'block', background: '#0f172a' }}>
              {specks.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f87171" opacity={0.85} />
              ))}
            </svg>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>{t(`${K}.visual.speckleLabel`)}</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{t(`${K}.visual.speckleCaption`)}</div>
            </div>
          </div>
          {/* Right — external code: a structured, position-locked grid of glyphs */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <svg viewBox="0 0 170 140" width="100%" style={{ display: 'block', background: '#052e16' }}>
              {Array.from({ length: 5 }).map((_, r) => Array.from({ length: 8 }).map((__, c) => {
                const x = 10 + c * 19, y = 16 + r * 26;
                return (
                  <g key={`${r}-${c}`} stroke="#4ade80" strokeWidth="1.4" fill="none" strokeLinecap="round">
                    <line x1={x} y1={y} x2={x + 8} y2={y} />
                    <line x1={x + 4} y1={y - 5} x2={x + 4} y2={y + 5} />
                  </g>
                );
              }))}
            </svg>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>{t(`${K}.visual.codeLabel`)}</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{t(`${K}.visual.codeCaption`)}</div>
            </div>
          </div>
        </div>
        <p style={{ ...subtle, margin: '12px 0 0', fontStyle: 'italic' }}>{t(`${K}.visual.note`)}</p>
      </div>

      {/* 4 · The simulation reading */}
      <NarrativeSection t={t}
        titleKey={`${K}.sections.simulationTitle`}
        bodyKey={`${K}.sections.simulationBody`}
        levelKey={`${K}.sections.simulationLevel`} />

      {/* Bridge → run the strong claim through the Claim Analyzer */}
      {onAnalyzeClaim && (
        <div style={{ ...panel, borderLeft: '4px solid #7c3aed', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#334155', flex: 1, minWidth: 200 }}>
            {t(`${K}.analyzeClaimPrompt`)}
          </span>
          <button
            type="button"
            onClick={() => onAnalyzeClaim(t('selfSimReality.claimAnalyzer.examples.codeOfReality'))}
            style={{
              background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            🔬 {t(`${K}.analyzeClaimBtn`)}
          </button>
        </div>
      )}

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

      {/* Recorded accounts — the honest state of the primary record */}
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            {t(`${K}.records.title`)}
          </h4>
          <EpistemicBadge level="mainstream" />
        </div>
        <p style={{ ...subtle, margin: '0 0 12px' }}>{t(`${K}.records.intro`)}</p>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          {['r1', 'r2', 'r3', 'r4'].map(id => (
            <li key={id} style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
              {t(`${K}.records.${id}`)}
            </li>
          ))}
        </ul>
        <p style={{ margin: '12px 0 0', fontSize: 12.5, color: '#6b21a8', fontStyle: 'italic', lineHeight: 1.55 }}>
          {t(`${K}.records.note`)}
        </p>
      </div>

      {/* Theoretical grounding — where the phenomenon sits in the theory map */}
      <div style={panel}>
        <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
          {t(`${K}.theory.sectionTitle`)}
        </h4>
        <p style={{ ...subtle, margin: '0 0 14px' }}>{t(`${K}.theory.intro`)}</p>
        <div style={{
          display: 'grid', gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}>
          {theoryCards.map(id => {
            const level = t(`${K}.theory.cards.${id}Level`);
            const accent = (LEVEL_COLORS[level] || LEVEL_COLORS.unsupported).fg;
            return (
              <div key={id} style={{ ...panel, padding: 16, borderTop: `4px solid ${accent}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h5 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                    {t(`${K}.theory.cards.${id}Title`)}
                  </h5>
                  <EpistemicBadge level={level} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                  {t(`${K}.theory.cards.${id}Author`)}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
                  {t(`${K}.theory.cards.${id}Body`)}
                </p>
                {onOpenTheory && THEORY_TO_TOUR[id] && (
                  <button
                    type="button"
                    onClick={() => onOpenTheory(THEORY_TO_TOUR[id])}
                    style={{
                      alignSelf: 'flex-start', background: 'transparent', border: 'none',
                      color: '#6b21a8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0,
                    }}
                  >
                    {t(`${K}.seeInTheoryTour`)} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
