import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from './self-correcting-loop/Overview';
import ThreeRoles from './self-correcting-loop/ThreeRoles';
import HandoffsStops from './self-correcting-loop/HandoffsStops';
import WorkedExamples from './self-correcting-loop/WorkedExamples';
import TestAndScale from './self-correcting-loop/TestAndScale';
import LoopBuilder from './self-correcting-loop/LoopBuilder';

/**
 * Self-Correcting AI Loop · 1.26.0 (V0 · reference + interactive Loop Builder)
 *
 * Sits at the end of Future Item Agents in the sidebar, after the
 * Self-Simulating Reality Agent. A practical companion for building AI quality
 * control: the Builder / Judge / Manager pattern, structured handoffs, real
 * ground truth for the Judge, and hard stop conditions.
 *
 * Content is paraphrased from "How to Build a Self-Correcting AI Loop" by
 * @cyrilXBT (X) — summarized for learning, original wording not reproduced.
 *
 * The 6 tabs:
 *   1. Overview        — the shift away from being the verification layer
 *   2. The Three Roles — Builder / Judge / Manager
 *   3. Handoffs & Stops— structured handoff format, ground truth, stop conditions
 *   4. Worked Examples — content production + code, and the shared skeleton
 *   5. Test & Scale    — 4 stress tests, common mistakes, scaling
 *   6. Loop Builder    — interactive: pick a task type -> generated scaffolds
 */
const SelfCorrectingLoop = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview',  label: t('selfCorrectingLoop.tabs.overview'),  icon: '🔄' },
    { id: 'roles',     label: t('selfCorrectingLoop.tabs.roles'),     icon: '🎭' },
    { id: 'handoffs',  label: t('selfCorrectingLoop.tabs.handoffs'),  icon: '📋' },
    { id: 'examples',  label: t('selfCorrectingLoop.tabs.examples'),  icon: '🛠️' },
    { id: 'testScale', label: t('selfCorrectingLoop.tabs.testScale'), icon: '🧪' },
    { id: 'builder',   label: t('selfCorrectingLoop.tabs.builder'),   icon: '⚙️' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':  return <Overview />;
      case 'roles':     return <ThreeRoles />;
      case 'handoffs':  return <HandoffsStops />;
      case 'examples':  return <WorkedExamples />;
      case 'testScale': return <TestAndScale />;
      case 'builder':   return <LoopBuilder />;
      default:          return <Overview />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Hero */}
      <div style={{
        padding: '28px 32px',
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #1e3a8a 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 36 }}>🔄</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.25)', color: 'white',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              {t('selfCorrectingLoop.statusBadge')}
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
              {t('selfCorrectingLoop.moduleTitle')}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.92, lineHeight: 1.5, maxWidth: 820 }}>
              {t('selfCorrectingLoop.moduleSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Hint strip */}
      <div style={{
        padding: '10px 32px', backgroundColor: '#f0fdfa',
        borderBottom: '1px solid #99f6e4', fontSize: 12, color: '#0f766e',
        lineHeight: 1.4,
      }}>
        {t('selfCorrectingLoop.hintStrip')}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '10px 32px 0', backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0', overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', border: 'none',
              backgroundColor: activeTab === tab.id ? '#0d9488' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              borderRadius: '8px 8px 0 0', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease',
            }}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {renderTab()}
        {/* Source note */}
        <div style={{
          marginTop: 28, paddingTop: 14, borderTop: '1px solid #e2e8f0',
          fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, maxWidth: 900,
        }}>
          {t('selfCorrectingLoop.sourceNote')}
        </div>
      </div>
    </div>
  );
};

export default SelfCorrectingLoop;
