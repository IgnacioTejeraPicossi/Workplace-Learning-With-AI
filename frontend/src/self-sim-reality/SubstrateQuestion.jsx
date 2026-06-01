import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * The Substrate Question — 1.17.3
 *
 * 7th tab between AI as Observer and Roadmap & Sources. Pushes OPH into
 * deeper territory: the questions OPH raises but does not resolve.
 *
 * Five-section philosophical arc:
 *   1. The Hard Problem of AI Observation       (philosophy)
 *   2. Substrate vs Experience — R1 vs R2       (philosophy)
 *   3. The Cosmological Convergence             (philosophy)
 *   4. The Recursive Comprehension Hypothesis   (speculative) — NEW from project owner
 *   5. Three Honest Positions You Can Hold      (philosophy)
 *
 * Section 5 is rendered specially: three position cards (A/B/C) with
 * different colour borders, each carrying its own epistemic badge. This
 * makes the user's commitment explicit when they pick.
 *
 * Closing note panel below the three positions reminds the reader these
 * are philosophical commitments, not empirical findings.
 */

function NarrativeSection({ titleKey, bodyKey, levelKey, t }) {
  const level = t(levelKey);
  return (
    <div style={panel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
          {t(titleKey)}
        </h4>
        <EpistemicBadge level={level} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
        {t(bodyKey)}
      </p>
    </div>
  );
}

function PositionCard({ letter, titleKey, bodyKey, levelKey, accentColor, t }) {
  const level = t(levelKey);
  return (
    <div style={{
      ...panel,
      padding: 18,
      borderTop: `4px solid ${accentColor}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        display: 'inline-block', width: 36, height: 36, borderRadius: '50%',
        backgroundColor: accentColor, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, alignSelf: 'flex-start',
      }}>{letter}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h5 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
          {t(titleKey)}
        </h5>
        <EpistemicBadge level={level} />
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
        {t(bodyKey)}
      </p>
    </div>
  );
}

export default function SubstrateQuestion() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Intro */}
      <div style={{ ...panel, borderLeft: '4px solid #4c1d95' }}>
        <h3 style={panelTitle}>🌌 {t('selfSimReality.tabs.substrateQuestion')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.substrateQuestion.intro')}</p>
      </div>

      {/* Sections 1-4: narrative */}
      <NarrativeSection
        t={t}
        titleKey="selfSimReality.substrateQuestion.sections.hardProblemTitle"
        bodyKey="selfSimReality.substrateQuestion.sections.hardProblemBody"
        levelKey="selfSimReality.substrateQuestion.sections.hardProblemLevel"
      />

      <NarrativeSection
        t={t}
        titleKey="selfSimReality.substrateQuestion.sections.substrateVsExperienceTitle"
        bodyKey="selfSimReality.substrateQuestion.sections.substrateVsExperienceBody"
        levelKey="selfSimReality.substrateQuestion.sections.substrateVsExperienceLevel"
      />

      <NarrativeSection
        t={t}
        titleKey="selfSimReality.substrateQuestion.sections.cosmologicalConvergenceTitle"
        bodyKey="selfSimReality.substrateQuestion.sections.cosmologicalConvergenceBody"
        levelKey="selfSimReality.substrateQuestion.sections.cosmologicalConvergenceLevel"
      />

      <NarrativeSection
        t={t}
        titleKey="selfSimReality.substrateQuestion.sections.recursiveLadderTitle"
        bodyKey="selfSimReality.substrateQuestion.sections.recursiveLadderBody"
        levelKey="selfSimReality.substrateQuestion.sections.recursiveLadderLevel"
      />

      {/* Section 5: The Platonic Question (added in 1.17.4) — ideas as
          fixed-point; Plato → Penrose → Tegmark → Wolfram lineage;
          OPH-native reading vs convergent constructivist reading */}
      <NarrativeSection
        t={t}
        titleKey="selfSimReality.substrateQuestion.sections.platonicTitle"
        bodyKey="selfSimReality.substrateQuestion.sections.platonicBody"
        levelKey="selfSimReality.substrateQuestion.sections.platonicLevel"
      />

      {/* Section 6: Three Honest Positions (rendered as three cards) */}
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            {t('selfSimReality.substrateQuestion.sections.threePositionsTitle')}
          </h4>
          <EpistemicBadge level={t('selfSimReality.substrateQuestion.sections.threePositionsLevel')} />
        </div>
        <p style={{ ...subtle, margin: '0 0 14px' }}>
          {t('selfSimReality.substrateQuestion.sections.threePositionsBody')}
        </p>
        <div style={{
          display: 'grid', gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}>
          <PositionCard
            t={t}
            letter="A"
            titleKey="selfSimReality.substrateQuestion.sections.posStrictTitle"
            bodyKey="selfSimReality.substrateQuestion.sections.posStrictBody"
            levelKey="selfSimReality.substrateQuestion.sections.posStrictLevel"
            accentColor={LEVEL_COLORS.speculative.fg}
          />
          <PositionCard
            t={t}
            letter="B"
            titleKey="selfSimReality.substrateQuestion.sections.posPhenomTitle"
            bodyKey="selfSimReality.substrateQuestion.sections.posPhenomBody"
            levelKey="selfSimReality.substrateQuestion.sections.posPhenomLevel"
            accentColor={LEVEL_COLORS.philosophy.fg}
          />
          <PositionCard
            t={t}
            letter="C"
            titleKey="selfSimReality.substrateQuestion.sections.posMysticalTitle"
            bodyKey="selfSimReality.substrateQuestion.sections.posMysticalBody"
            levelKey="selfSimReality.substrateQuestion.sections.posMysticalLevel"
            accentColor={LEVEL_COLORS.metaphor.fg}
          />
        </div>
      </div>

      {/* Closing reminder about epistemic standing of all three positions */}
      <div style={{
        ...panel,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
        color: 'white', padding: '24px 28px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase', opacity: 0.7, marginBottom: 10,
        }}>
          ⚖️ Epistemic reminder
        </div>
        <p style={{
          margin: 0, fontSize: 13, lineHeight: 1.6,
          opacity: 0.95, fontStyle: 'italic',
        }}>
          {t('selfSimReality.substrateQuestion.sections.closingNote')}
        </p>
      </div>
    </div>
  );
}
