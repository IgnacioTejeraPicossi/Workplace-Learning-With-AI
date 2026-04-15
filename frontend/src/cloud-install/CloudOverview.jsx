import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const STATUS_COLORS = {
  ready: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  partial: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  pending: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  info: { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' },
};

function StatusBadge({ status, label }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.2rem 0.65rem', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.text, fontSize: '0.75rem', fontWeight: '600'
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function ReadinessCard({ icon, title, value, status, detail }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <StatusBadge status={status} label={value} />
      </div>
      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{title}</div>
      <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{detail}</div>
    </div>
  );
}

function ArchSummaryRow({ icon, service, role, provider, phase }) {
  const phaseColor = phase === 1
    ? { bg: '#d1fae5', text: '#065f46' }
    : { bg: '#f3f4f6', text: '#6b7280' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.75rem 1rem', borderRadius: '0.5rem',
      backgroundColor: 'white', border: '1px solid #e5e7eb'
    }}>
      <span style={{ fontSize: '1.25rem', width: 28, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>{service}</div>
        <div style={{ color: '#6b7280', fontSize: '0.775rem' }}>{role}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: '#374151', fontSize: '0.8rem', fontWeight: '500' }}>{provider}</div>
        <span style={{
          display: 'inline-block', marginTop: '0.2rem',
          padding: '0.1rem 0.5rem', borderRadius: '9999px',
          backgroundColor: phaseColor.bg, color: phaseColor.text, fontSize: '0.7rem', fontWeight: '600'
        }}>
          Phase {phase}
        </span>
      </div>
    </div>
  );
}

export default function CloudOverview() {
  const { t } = useTranslation();
  const [workflowStep, setWorkflowStep] = useState(0);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/cloud-install/status`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLiveStatus(data); })
      .catch(() => {});
  }, []);

  const sectionIcons = {
    architecture: '⚙️', env_secrets: '🔐', frontend: '🚀',
    backend: '🔧', data_auth: '🗄️', smoke_tests: '✅',
  };
  const sectionTitles = {
    architecture: t('cloudInstall.overview.readiness.architecture'),
    env_secrets: t('cloudInstall.overview.readiness.envSecrets'),
    frontend: t('cloudInstall.overview.readiness.frontendDeploy'),
    backend: t('cloudInstall.overview.readiness.backendDeploy'),
    data_auth: t('cloudInstall.overview.readiness.dataAuth'),
    smoke_tests: t('cloudInstall.overview.readiness.smokeTests'),
  };
  const statusMap = {
    ready: 'ready', partial: 'partial', pending: 'pending',
    not_started: 'pending', error: 'pending',
  };

  // Use live data from backend if available, otherwise fallback to static
  const readinessCards = liveStatus?.sections
    ? liveStatus.sections.map(s => ({
        icon: sectionIcons[s.id] || '📋',
        title: sectionTitles[s.id] || s.label,
        value: `${s.progress}%`,
        status: statusMap[s.status] || 'pending',
        detail: s.details || '',
      }))
    : [
        {
          icon: '⚙️',
          title: t('cloudInstall.overview.readiness.architecture'),
          value: t('cloudInstall.status.defined'),
          status: 'ready',
          detail: t('cloudInstall.overview.readiness.architectureDetail'),
        },
        {
          icon: '🔐',
          title: t('cloudInstall.overview.readiness.envSecrets'),
          value: t('cloudInstall.status.pendingReview'),
          status: 'partial',
          detail: t('cloudInstall.overview.readiness.envSecretsDetail'),
        },
        {
          icon: '🚀',
          title: t('cloudInstall.overview.readiness.frontendDeploy'),
          value: t('cloudInstall.status.notStarted'),
          status: 'pending',
          detail: t('cloudInstall.overview.readiness.frontendDeployDetail'),
        },
        {
          icon: '🔧',
          title: t('cloudInstall.overview.readiness.backendDeploy'),
          value: t('cloudInstall.status.notStarted'),
          status: 'pending',
          detail: t('cloudInstall.overview.readiness.backendDeployDetail'),
        },
        {
          icon: '🗄️',
          title: t('cloudInstall.overview.readiness.dataAuth'),
          value: t('cloudInstall.status.notStarted'),
          status: 'pending',
          detail: t('cloudInstall.overview.readiness.dataAuthDetail'),
        },
        {
          icon: '✅',
          title: t('cloudInstall.overview.readiness.smokeTests'),
          value: t('cloudInstall.status.notStarted'),
          status: 'pending',
          detail: t('cloudInstall.overview.readiness.smokeTestsDetail'),
        },
      ];

  const archRows = [
    { icon: '⚛️', service: 'React Frontend', role: t('cloudInstall.overview.arch.frontendRole'), provider: 'Vercel', phase: 1 },
    { icon: '🐍', service: 'FastAPI Backend', role: t('cloudInstall.overview.arch.backendRole'), provider: 'Google Cloud Run', phase: 1 },
    { icon: '🍃', service: 'MongoDB', role: t('cloudInstall.overview.arch.dbRole'), provider: 'MongoDB Atlas', phase: 1 },
    { icon: '🔥', service: 'Firebase Auth', role: t('cloudInstall.overview.arch.authRole'), provider: 'Firebase (keep)', phase: 1 },
    { icon: '☁️', service: 'Cloudflare', role: t('cloudInstall.overview.arch.dnsRole'), provider: 'Cloudflare', phase: 2 },
    { icon: '🔍', service: 'Web Search Backend', role: t('cloudInstall.overview.arch.wsRole'), provider: 'Node.js / TBD', phase: 2 },
  ];

  const workflowSteps = [
    t('cloudInstall.overview.workflow.step1'),
    t('cloudInstall.overview.workflow.step2'),
    t('cloudInstall.overview.workflow.step3'),
    t('cloudInstall.overview.workflow.step4'),
    t('cloudInstall.overview.workflow.step5'),
    t('cloudInstall.overview.workflow.step6'),
    t('cloudInstall.overview.workflow.step7'),
    t('cloudInstall.overview.workflow.step8'),
  ];

  const readyCount = readinessCards.filter(c => c.status === 'ready').length;
  const totalCount = readinessCards.length;
  const pct = liveStatus?.readinessScore ?? Math.round((readyCount / totalCount) * 100);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Mission box */}
      <div style={{
        backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🎯</span>
        <div>
          <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '0.35rem' }}>
            {t('cloudInstall.overview.missionTitle')}
          </div>
          <div style={{ color: '#1e3a8a', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('cloudInstall.overview.missionText')}
          </div>
        </div>
      </div>

      {/* Readiness score */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem' }}>
            {t('cloudInstall.overview.readinessScore')}
          </div>
          <div style={{ fontWeight: '700', color: '#374151', fontSize: '1.25rem' }}>
            {pct}%
          </div>
        </div>
        <div style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            backgroundColor: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#3b82f6',
            borderRadius: '9999px', transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          {readyCount} / {totalCount} {t('cloudInstall.overview.sectionsReady')}
        </div>
      </div>

      {/* Readiness grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem'
      }}>
        {readinessCards.map((card, i) => (
          <ReadinessCard key={i} {...card} />
        ))}
      </div>

      {/* Architecture summary */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
      }}>
        <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '0.95rem' }}>
          {t('cloudInstall.overview.archSummaryTitle')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {archRows.map((row, i) => <ArchSummaryRow key={i} {...row} />)}
        </div>
      </div>

      {/* Deployment workflow */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        padding: '1.25rem 1.5rem'
      }}>
        <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '0.95rem' }}>
          {t('cloudInstall.overview.workflowTitle')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {workflowSteps.map((step, i) => (
            <button
              key={i}
              onClick={() => setWorkflowStep(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '0.5rem',
                border: workflowStep === i ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: workflowStep === i ? '#eff6ff' : 'white',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                backgroundColor: workflowStep === i ? '#3b82f6' : '#e5e7eb',
                color: workflowStep === i ? 'white' : '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: '700'
              }}>
                {i + 1}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: workflowStep === i ? '#1e40af' : '#374151',
                fontWeight: workflowStep === i ? '600' : '400'
              }}>
                {step}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
