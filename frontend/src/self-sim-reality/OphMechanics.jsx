import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * OPH Mechanics — the technical heart of Observer Patch Holography (1.17.1).
 *
 * Four-section narrative drawn from the second batch of screenshots:
 *   1. The Problem        — Strange Loop capacity
 *   2. The Mechanism      — Overlap Synchronization
 *   3. The Algorithm      — Fact-Making Pipeline (4 visual steps)
 *   4. The Resolution     — Reality as Fixed Point
 *
 * Each section: title + epistemic badge + pull-quote (the exact slide
 * caption) + body explanation. The Pipeline section has its own visual
 * row showing the 4 process steps (Local Pattern → Compare → Repair →
 * Public Fact) — mirrors the slide layout.
 */

const PIPELINE_STEPS = [
  { id: 'pipelineStep1', icon: '✨', color: '#7c3aed' },  // Local Pattern  — colourful dots
  { id: 'pipelineStep2', icon: '🔍', color: '#0891b2' },  // Compare        — overlapping hexagons
  { id: 'pipelineStep3', icon: '🔧', color: '#15803d' },  // Repair         — flowing lines
  { id: 'pipelineStep4', icon: '💎', color: '#b45309' },  // Public Fact    — crystalline structure
];

function Section({ titleKey, quoteKey, bodyKey, levelKey, t, children }) {
  const level = t(levelKey);
  return (
    <div style={panel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
          {t(titleKey)}
        </h4>
        <EpistemicBadge level={level} />
      </div>
      {quoteKey && (
        <blockquote style={{
          margin: '0 0 12px', padding: '10px 14px',
          borderLeft: '3px solid #7c3aed', backgroundColor: '#faf5ff',
          fontStyle: 'italic', fontSize: 14, color: '#5b21b6', lineHeight: 1.5,
        }}>
          «{t(quoteKey)}»
        </blockquote>
      )}
      <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
        {t(bodyKey)}
      </p>
      {children}
    </div>
  );
}

function PipelineFlow({ t }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'grid', gap: 10,
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        alignItems: 'stretch',
      }}>
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.id} style={{
            position: 'relative',
            padding: '14px 12px', borderRadius: 10,
            backgroundColor: `${step.color}10`,
            border: `1px solid ${step.color}40`,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: step.color,
              letterSpacing: 0.5, marginBottom: 6,
            }}>
              STEP {i + 1}
            </div>
            <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}>{step.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              {t(`selfSimReality.ophMechanics.sections.${step.id}Title`)}
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
              {t(`selfSimReality.ophMechanics.sections.${step.id}Body`)}
            </div>
            {/* Arrow indicator — visible on wider layouts via absolute positioning */}
            {i < PIPELINE_STEPS.length - 1 && (
              <div style={{
                position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)',
                fontSize: 18, color: step.color, fontWeight: 700,
                display: 'none',  // shown via media query approach not in scope for V0
              }} aria-hidden="true">→</div>
            )}
          </div>
        ))}
      </div>
      <p style={{
        margin: '10px 0 0', textAlign: 'center', fontSize: 11,
        color: '#7c3aed', fontStyle: 'italic',
      }}>
        ↓ ↓ ↓ &nbsp; flow direction &nbsp; ↓ ↓ ↓
      </p>
    </div>
  );
}

export default function OphMechanics() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Intro */}
      <div style={panel}>
        <h3 style={panelTitle}>⚙️ {t('selfSimReality.tabs.ophMechanics')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.ophMechanics.intro')}</p>
      </div>

      {/* 1. The Problem */}
      <Section
        t={t}
        titleKey="selfSimReality.ophMechanics.sections.strangeLoopTitle"
        quoteKey="selfSimReality.ophMechanics.sections.strangeLoopQuote"
        bodyKey="selfSimReality.ophMechanics.sections.strangeLoopBody"
        levelKey="selfSimReality.ophMechanics.sections.strangeLoopLevel"
      />

      {/* 2. The Mechanism */}
      <Section
        t={t}
        titleKey="selfSimReality.ophMechanics.sections.overlapTitle"
        quoteKey="selfSimReality.ophMechanics.sections.overlapQuote"
        bodyKey="selfSimReality.ophMechanics.sections.overlapBody"
        levelKey="selfSimReality.ophMechanics.sections.overlapLevel"
      />

      {/* 3. The Algorithm — Fact-Making Pipeline (with 4-step visual) */}
      <Section
        t={t}
        titleKey="selfSimReality.ophMechanics.sections.pipelineTitle"
        bodyKey="selfSimReality.ophMechanics.sections.pipelineBody"
        levelKey="selfSimReality.ophMechanics.sections.pipelineLevel"
      >
        <PipelineFlow t={t} />
      </Section>

      {/* 4. The Resolution */}
      <Section
        t={t}
        titleKey="selfSimReality.ophMechanics.sections.fixedPointTitle"
        quoteKey="selfSimReality.ophMechanics.sections.fixedPointQuote"
        bodyKey="selfSimReality.ophMechanics.sections.fixedPointBody"
        levelKey="selfSimReality.ophMechanics.sections.fixedPointLevel"
      />
    </div>
  );
}
