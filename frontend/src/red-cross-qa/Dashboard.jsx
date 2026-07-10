import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

/**
 * Quality status overview for the Red Cross Web QA Agent.
 * Visual language mirrors the ATM V&V Test Copilot Overview:
 * gradient hero → stat cards → quick actions panel → quality gates → recent runs + risks.
 */
const Dashboard = ({ environment, executionMode, onNavigate }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalRuns: 12, passRate: 78, openFindings: 9, criticalBlockers: 1,
  });
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(d => {
      if (d && typeof d === 'object') {
        setStats(s => ({
          ...s,
          totalRuns:        d.total_runs        ?? s.totalRuns,
          passRate:         d.pass_rate         ?? s.passRate,
          openFindings:     d.open_findings     ?? s.openFindings,
          criticalBlockers: d.critical_blockers ?? s.criticalBlockers,
        }));
        setHealth({ status: d.status === 'ok' ? 'ok' : 'error' });
      }
    }).catch(() => setHealth({ status: 'error' }));
  }, []);

  // ── KPI cards (top row) ───────────────────────────────────────────
  const statCards = [
    { label: t('redCrossWebQaModule.dashboard.totalRuns'),        value: stats.totalRuns,        icon: '📜', color: '#3b82f6' },
    { label: t('redCrossWebQaModule.dashboard.passRate'),         value: `${stats.passRate}%`,   icon: '✅', color: '#10b981' },
    { label: t('redCrossWebQaModule.dashboard.openFindings'),     value: stats.openFindings,     icon: '🐞', color: '#f59e0b' },
    { label: t('redCrossWebQaModule.dashboard.criticalBlockers'), value: stats.criticalBlockers, icon: '🚨', color: '#ef4444' },
  ];

  // ── Quick actions (panel) ─────────────────────────────────────────
  // Mirrors the full 20-tab navigation. Dashboard (current view) is omitted;
  // Settings is omitted because mode/environment selectors live in the header.
  const quickActions = [
    { icon: '📋', label: t('redCrossWebQaModule.tabTestPlan'),         tab: 'test-plan',         color: '#dc2626' },
    { icon: '🎭', label: t('redCrossWebQaModule.tabPlaywright'),       tab: 'playwright',        color: '#ef4444' },
    { icon: '🌲', label: t('redCrossWebQaModule.tabCypress'),          tab: 'cypress',           color: '#15803d' },
    { icon: '🔌', label: t('redCrossWebQaModule.tabApiQa'),            tab: 'api-qa',            color: '#0891b2' },
    { icon: '📝', label: t('redCrossWebQaModule.tabCmsQa'),            tab: 'cms-qa',            color: '#7c3aed' },
    { icon: '📑', label: t('redCrossWebQaModule.tabFormsQa'),          tab: 'forms-qa',          color: '#6366f1' },
    { icon: '📦', label: t('redCrossWebQaModule.tabContentMigration'), tab: 'content-migration', color: '#0d9488' },
    { icon: '♿', label: t('redCrossWebQaModule.tabAccessibility'),    tab: 'accessibility',     color: '#06b6d4' },
    { icon: '⚡', label: t('redCrossWebQaModule.tabPerformance'),      tab: 'performance',       color: '#f59e0b' },
    { icon: '🎨', label: t('redCrossWebQaModule.tabDesignsystemet'),   tab: 'designsystemet',    color: '#be185d' },
    { icon: '🔐', label: t('redCrossWebQaModule.tabRoleMatrix'),       tab: 'role-matrix',       color: '#475569' },
    { icon: '🔥', label: t('redCrossWebQaModule.tabStressTest'),       tab: 'stress-test',       color: '#f97316' },
    { icon: '🛡️', label: t('redCrossWebQaModule.tabSecurityPrivacy'),  tab: 'security-privacy',  color: '#52525b' },
    { icon: '🎯', label: t('redCrossWebQaModule.tabAdo'),              tab: 'ado',               color: '#3b82f6' },
    { icon: '📈', label: t('redCrossWebQaModule.tabSprintReport'),     tab: 'sprint-report',     color: '#16a34a' },
    { icon: '✅', label: t('redCrossWebQaModule.tabUatSupport'),       tab: 'uat-support',       color: '#15803d' },
    { icon: '🎲', label: t('redCrossWebQaModule.tabRiskMatrix'),       tab: 'risk-matrix',       color: '#9a3412' },
    { icon: '📜', label: t('redCrossWebQaModule.tabRuns'),             tab: 'runs',              color: '#64748b' },
  ];

  // ── Quality gates (with per-gate accent color, status badge) ──────
  // 11 gates aligned with the documented coverage in MODULES_REFERENCE.md.
  const gates = [
    { id: 'gateAccessibility',  status: 'WARN', color: '#06b6d4' },
    { id: 'gatePerformance',    status: 'PASS', color: '#f59e0b' },
    { id: 'gateApi',            status: 'PASS', color: '#3b82f6' },
    { id: 'gateSecurity',       status: 'WARN', color: '#475569' },
    { id: 'gateSeo',            status: 'PASS', color: '#10b981' },
    { id: 'gateForms',          status: 'PASS', color: '#6366f1' },
    { id: 'gateCms',            status: 'PASS', color: '#8b5cf6' },
    { id: 'gateStress',         status: 'IDLE', color: '#f97316' },
    { id: 'gateMigration',      status: 'IDLE', color: '#0d9488' },
    { id: 'gateDesignsystemet', status: 'PASS', color: '#be185d' },
    { id: 'gateRoleMatrix',     status: 'IDLE', color: '#dc2626' },
  ];

  const recentRuns = [
    { id: 'redcross-qa-2026-05-04-001', suite: 'donationFlow',      status: 'WARN', when: '2h ago' },
    { id: 'redcross-qa-2026-05-04-002', suite: 'accessibilityCore', status: 'PASS', when: '5h ago' },
    { id: 'redcross-qa-2026-05-03-014', suite: 'graphqlApi',        status: 'PASS', when: '1d ago' },
    { id: 'redcross-qa-2026-05-03-013', suite: 'releaseReadiness',  status: 'FAIL', when: '1d ago' },
  ];

  const topRisks = [
    { title: 'Donation amount field has insufficient screen reader description', severity: 'high',   category: 'accessibility' },
    { title: 'Search page TTFB above 800ms target on /sok',                       severity: 'medium', category: 'performance' },
    { title: 'Missing Content-Security-Policy header on staging',                 severity: 'medium', category: 'security' },
  ];

  // Røde Kors stakeholders — single source of truth (also rendered in Settings).
  // Phase H+ (2026-05-28): synced with the official 'Roller og ansvar' document
  // (10 people). Role labels come from i18n keys to stay in NO/EN/ES sync.
  const stakeholders = [
    { name: 'Gry Rønjum',              roleKey: 'projectManagerProductOwner', initials: 'GR', color: '#dc2626' },
    { name: 'Terje Christensen',       roleKey: 'rkTechnicalRep',             initials: 'TC', color: '#9333ea' },
    { name: 'Tom Arild Jakobsen',      roleKey: 'techLeadItem',               initials: 'TJ', color: '#0891b2' },
    { name: 'Jah Langleite',           roleKey: 'iamStakeholder',             initials: 'JL', color: '#0d9488' },
    { name: 'Hilde Forslund',          roleKey: 'poInntektCrm',               initials: 'HF', color: '#f59e0b' },
    { name: 'Trine Røsand Scheen',     roleKey: 'poFrivillighetCrm',          initials: 'TS', color: '#1d4ed8' },
    { name: 'Astri M.M. Fretheim',     roleKey: 'tilgangsstyringFrivillighet', initials: 'AF', color: '#7c3aed' },
    { name: 'Thomas Augestad',         roleKey: 'techleadAppPlatform',        initials: 'TA', color: '#be185d' },
    { name: 'Trine Bruu',              roleKey: 'testleder',                  initials: 'TB', color: '#15803d' },
    { name: 'Ignacio Tejera Picossi',  roleKey: 'qaTester',                   initials: 'IT', color: '#ea580c' },
  ];

  const statusPill = (s) => ({
    PASS: { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
    WARN: { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
    FAIL: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
    IDLE: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
  }[s] || { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' });

  const sevPill = (s) => ({
    critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981',
  }[s] || '#64748b');

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        {/* Hero */}
        <PageHero
          icon="❤️‍🩹"
          title={t('redCrossWebQaModule.title')}
          subtitle={t('redCrossWebQaModule.tagline')}
          description={t('redCrossWebQaModule.description')}
          environment={environment}
          mode={executionMode}
          status={health?.status}
        />

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {statCards.map((s, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'white', borderRadius: 12, padding: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={panelStyle}>
          <h3 style={panelTitle}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={() => onNavigate && onNavigate(qa.tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 10,
                  border: `1px solid ${qa.color}30`,
                  backgroundColor: `${qa.color}10`, cursor: 'pointer',
                  fontSize: 14, color: '#334155', textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = `${qa.color}20`;
                  e.currentTarget.style.borderColor = `${qa.color}60`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = `${qa.color}10`;
                  e.currentTarget.style.borderColor = `${qa.color}30`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 22 }}>{qa.icon}</span>
                <span style={{ fontWeight: 500 }}>{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Gates */}
        <div style={panelStyle}>
          <h3 style={panelTitle}>{t('redCrossWebQaModule.dashboard.qualityGates')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {gates.map(g => {
              const p = statusPill(g.status);
              return (
                <div
                  key={g.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, padding: '12px 14px', borderRadius: 10,
                    backgroundColor: `${g.color}10`,
                    border: `1px solid ${g.color}30`,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                    {t(`redCrossWebQaModule.dashboard.${g.id}`)}
                  </span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px',
                      borderRadius: 999, backgroundColor: p.bg, color: p.fg,
                      border: `1px solid ${p.border}`,
                    }}
                  >
                    {g.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase F — Tom's tooling tips for the rodekors.no rebuild (2026-05-12).
            Renders as a single info banner so the workshop host can point at it
            before opening any tab. Compact, one line per tip. */}
        <div style={{ ...panelStyle, borderTop: '4px solid #2563eb' }}>
          <h3 style={panelTitle}>💡 {t('redCrossWebQaModule.dashboard.tomTipsTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            <TipCard icon="⚛️"  color="#3b82f6" label="NextJS" text={t('redCrossWebQaModule.dashboard.tomTipNextjs')} />
            <TipCard icon="📚"  color="#a16207" label="Storybook" text={t('redCrossWebQaModule.dashboard.tomTipStorybook')} />
            <TipCard icon="🎭"  color="#be185d" label="Playwright" text={t('redCrossWebQaModule.dashboard.tomTipPlaywright')} />
            <TipCard icon="📦"  color="#ea580c" label="Postman" text={t('redCrossWebQaModule.dashboard.tomTipPostman')} />
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
            — {t('redCrossWebQaModule.dashboard.tomTipsAttribution')}
          </p>
        </div>

        {/* Stakeholders & Roller — Røde Kors team (Phase C) */}
        <div style={{ ...panelStyle, borderTop: '4px solid #db2777' }}>
          <h3 style={panelTitle}>👥 {t('redCrossWebQaModule.stakeholders.header')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {stakeholders.map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 10,
                backgroundColor: `${s.color}08`, border: `1px solid ${s.color}30`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: s.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{s.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>
                    {t(`redCrossWebQaModule.stakeholders.roles.${s.roleKey}`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two columns: Recent runs + Top risks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          <div style={panelStyle}>
            <h3 style={panelTitle}>{t('redCrossWebQaModule.dashboard.recentRuns')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentRuns.map(r => {
                const p = statusPill(r.status);
                return (
                  <div
                    key={r.id}
                    onClick={() => onNavigate && onNavigate('runs')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 10,
                      border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{r.id}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', marginTop: 2 }}>
                        {t(`redCrossWebQaModule.suites.${r.suite}`)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px',
                          borderRadius: 999, backgroundColor: p.bg, color: p.fg,
                          border: `1px solid ${p.border}`,
                        }}
                      >
                        {r.status}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.when}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={panelStyle}>
            <h3 style={panelTitle}>{t('redCrossWebQaModule.dashboard.topRisks')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topRisks.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px', borderRadius: 10,
                    border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 999, color: 'white',
                        backgroundColor: sevPill(r.severity),
                      }}
                    >
                      {t(`redCrossWebQaModule.common.${r.severity}`)}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {r.category}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{r.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TipCard = ({ icon, color, label, text }) => (
  <div style={{
    padding: '10px 12px', borderRadius: 10,
    backgroundColor: `${color}10`, border: `1px solid ${color}30`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 0.3 }}>{label}</span>
    </div>
    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{text}</div>
  </div>
);

const panelStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
};

const panelTitle = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 600,
  color: '#1e293b',
};

export default Dashboard;
