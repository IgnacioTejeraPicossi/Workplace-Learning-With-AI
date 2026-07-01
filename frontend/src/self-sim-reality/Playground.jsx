import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import TheoryMap from './playground/TheoryMap';
import ObserverPatchSimulator from './playground/ObserverPatchSimulator';

/**
 * Playground — V3 tab, groups two educational tools:
 *   1. Theory Map          — static SVG graph of the 8 theories + relations
 *   2. Observer Patch Sim  — animated canvas showing consensus emergence
 *
 * They live in the same tab because they're a matched pair: the map shows
 * OPH's neighbours in idea-space; the simulator shows the mechanism OPH
 * proposes ("public reality = overlap consensus") in action.
 */
export default function Playground() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={panel}>
        <h3 style={panelTitle}>🎨 {t('selfSimReality.playground.introTitle')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.playground.introBody')}</p>
      </div>

      <TheoryMap />
      <ObserverPatchSimulator />
    </div>
  );
}
