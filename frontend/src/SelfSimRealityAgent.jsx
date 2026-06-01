import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from './self-sim-reality/Overview';
import CoreConcepts from './self-sim-reality/CoreConcepts';
import OphMechanics from './self-sim-reality/OphMechanics';
import TheoryTour from './self-sim-reality/TheoryTour';
import AiAsObserver from './self-sim-reality/AiAsObserver';
import RoadmapAndSources from './self-sim-reality/RoadmapAndSources';

/**
 * Self-Simulating Reality Agent · 1.17.0 (V0 · structure + reading material)
 *
 * Sits at the end of Future Item Agents in the sidebar (after Red Cross Web QA
 * Agent). A philosophical-scientific companion for the idea that observers,
 * minds and consciousness participate in constructing the universe they
 * experience — built around Observer Patch Holography (Mueller et al.) with
 * the epistemic discipline of always labelling claims by evidence level.
 *
 * V0 ships rich static content (5 tabs, 113 i18n leaves × 3 locales). The
 * full agent with RAG + Mongo + claim analyzer + red-team arrives in V1+
 * per docs/self-sim-reality-agent-plan.md.
 *
 * The 5 tabs:
 *   1. Overview          — mission, guiding phrase, the 5 epistemic levels
 *   2. Core Concepts     — 5 cards from the OPH presentation screenshots
 *                          (Self-Simulating Universe / Past Paradox /
 *                          Observer Patch / Screen Encoding / Modular Flow)
 *   3. Theory Tour       — 7 related theories (Friston, Rovelli, 't Hooft,
 *                          Bostrom, Tononi IIT, Dehaene GNW, OPH itself)
 *                          each with author + epistemic level + relation
 *   4. AI as Observer    — speculative contribution: 5 thought experiments
 *                          about whether AIs can be observer patches
 *   5. Roadmap & Sources — V0→V3 phases + 10 reference links
 */
const SelfSimRealityAgent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview',      label: t('selfSimReality.tabs.overview'),      icon: '🎯' },
    { id: 'concepts',      label: t('selfSimReality.tabs.concepts'),      icon: '📚' },
    { id: 'ophMechanics',  label: t('selfSimReality.tabs.ophMechanics'),  icon: '⚙️' },
    { id: 'theoryTour',    label: t('selfSimReality.tabs.theoryTour'),    icon: '🧭' },
    { id: 'aiAsObserver',  label: t('selfSimReality.tabs.aiAsObserver'),  icon: '🧠' },
    { id: 'roadmap',       label: t('selfSimReality.tabs.roadmap'),       icon: '🗺️' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':     return <Overview />;
      case 'concepts':     return <CoreConcepts />;
      case 'ophMechanics': return <OphMechanics />;
      case 'theoryTour':   return <TheoryTour />;
      case 'aiAsObserver': return <AiAsObserver />;
      case 'roadmap':      return <RoadmapAndSources />;
      default:             return <Overview />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Hero */}
      <div style={{
        padding: '28px 32px',
        background: 'linear-gradient(135deg, #4c1d95 0%, #6b21a8 50%, #1e3a8a 100%)',
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
            <span style={{ fontSize: 36 }}>🌀</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.25)', color: 'white',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              {t('selfSimReality.statusBadge')}
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
              {t('selfSimReality.moduleTitle')}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.92, lineHeight: 1.5, maxWidth: 800 }}>
              {t('selfSimReality.moduleSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Status hint strip */}
      <div style={{
        padding: '10px 32px', backgroundColor: '#faf5ff',
        borderBottom: '1px solid #e9d5ff', fontSize: 12, color: '#6b21a8',
        lineHeight: 1.4,
      }}>
        ℹ️ {t('selfSimReality.statusHint')}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ padding: '0 32px', overflowX: 'auto' }}>
          <nav style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 4px',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#7c3aed' : 'transparent'}`,
                  backgroundColor: 'transparent',
                  fontSize: 14, fontWeight: 500,
                  color: activeTab === tab.id ? '#6b21a8' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ marginRight: 6 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {renderTab()}
      </div>
    </div>
  );
};

export default SelfSimRealityAgent;
