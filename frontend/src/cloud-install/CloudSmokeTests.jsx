import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LAYERS = [
  {
    key: 'frontend',
    icon: '⚛️',
    labelKey: 'cloudInstall.smoke.layers.frontend',
    color: '#6366f1',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    checks: [
      { id: 'fe-1', text: 'Homepage loads without errors', critical: true },
      { id: 'fe-2', text: 'Sidebar renders all modules', critical: true },
      { id: 'fe-3', text: 'This module (Installing the App in the Cloud) opens correctly', critical: false },
      { id: 'fe-4', text: 'API base URL points to the cloud backend', critical: true },
      { id: 'fe-5', text: 'No console errors on initial load', critical: false },
      { id: 'fe-6', text: 'Responsive on mobile / tablet viewport', critical: false },
    ]
  },
  {
    key: 'backend',
    icon: '🐍',
    labelKey: 'cloudInstall.smoke.layers.backend',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    checks: [
      { id: 'be-1', text: 'GET /health returns 200 OK', critical: true },
      { id: 'be-2', text: 'GET /ready returns 200 OK', critical: true },
      { id: 'be-3', text: 'Backend accessible from production frontend domain', critical: true },
      { id: 'be-4', text: 'CORS headers allow the Vercel frontend origin', critical: true },
      { id: 'be-5', text: 'Backend logs appear in Cloud Run console', critical: false },
      { id: 'be-6', text: 'Response times are acceptable (< 3s cold start)', critical: false },
    ]
  },
  {
    key: 'auth',
    icon: '🔥',
    labelKey: 'cloudInstall.smoke.layers.auth',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    checks: [
      { id: 'auth-1', text: 'Firebase login flow completes successfully', critical: true },
      { id: 'auth-2', text: 'JWT token is issued and stored', critical: true },
      { id: 'auth-3', text: 'Protected routes reject unauthenticated requests', critical: true },
      { id: 'auth-4', text: 'Session persists after page refresh', critical: false },
      { id: 'auth-5', text: 'Sign-out clears session correctly', critical: false },
    ]
  },
  {
    key: 'database',
    icon: '🍃',
    labelKey: 'cloudInstall.smoke.layers.database',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    checks: [
      { id: 'db-1', text: 'MongoDB Atlas connection string is valid', critical: true },
      { id: 'db-2', text: 'Backend connects to Atlas on startup', critical: true },
      { id: 'db-3', text: 'Sample read query succeeds', critical: true },
      { id: 'db-4', text: 'Sample write query succeeds', critical: true },
      { id: 'db-5', text: 'Atlas network access allows Cloud Run IP range / 0.0.0.0/0 (temporary)', critical: false },
    ]
  },
  {
    key: 'ai',
    icon: '🤖',
    labelKey: 'cloudInstall.smoke.layers.ai',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    checks: [
      { id: 'ai-1', text: 'At least one AI provider API key is set in Cloud Run secrets', critical: true },
      { id: 'ai-2', text: 'A test AI query completes without error', critical: true },
      { id: 'ai-3', text: 'Errors are surfaced clearly when AI provider is unavailable', critical: false },
    ]
  },
];

const TROUBLESHOOTING = [
  {
    symptom: 'CORS error in browser console',
    cause: 'ALLOWED_ORIGINS in backend does not include the Vercel production URL',
    fix: 'Set ALLOWED_ORIGINS=https://your-app.vercel.app in Cloud Run environment',
  },
  {
    symptom: '/health returns 502 or no response',
    cause: 'Backend container is not starting correctly, or the port is misconfigured',
    fix: 'Check Cloud Run logs. Ensure BACKEND_PORT=8000 and startup command is correct',
  },
  {
    symptom: 'MongoDB connection timeout',
    cause: 'Atlas Network Access does not allow Cloud Run. MONGO_URI is incorrect.',
    fix: 'Temporarily allow 0.0.0.0/0 in Atlas Network Access. Validate MONGO_URI value.',
  },
  {
    symptom: 'Firebase login fails in production',
    cause: 'Authorized domains in Firebase Console does not include the Vercel domain',
    fix: 'Add your Vercel domain to Firebase Console → Authentication → Authorized domains',
  },
  {
    symptom: 'Frontend cannot reach backend',
    cause: 'REACT_APP_API_BASE_URL is still pointing to localhost or is missing',
    fix: 'Set REACT_APP_API_BASE_URL=https://your-backend.run.app in Vercel env variables and redeploy',
  },
];

function CheckItem({ check, completed, onToggle, accentColor }) {
  return (
    <div
      onClick={() => onToggle(check.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
        backgroundColor: completed ? '#f0fdf4' : 'white',
        border: completed ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
        cursor: 'pointer', transition: 'all 0.15s'
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '0.25rem', flexShrink: 0, marginTop: 1,
        border: completed ? `2px solid #16a34a` : `2px solid #d1d5db`,
        backgroundColor: completed ? '#16a34a' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {completed && <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: '700' }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: '0.845rem', color: completed ? '#374151' : '#1f2937',
          textDecoration: completed ? 'line-through' : 'none', lineHeight: 1.4
        }}>
          {check.text}
        </span>
        {check.critical && !completed && (
          <span style={{
            marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '9999px',
            backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.65rem', fontWeight: '700'
          }}>
            CRITICAL
          </span>
        )}
      </div>
    </div>
  );
}

export default function CloudSmokeTests() {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState({});
  const [activeLayer, setActiveLayer] = useState('frontend');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const toggleCheck = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetLayer = () => {
    const layer = LAYERS.find(l => l.key === activeLayer);
    if (!layer) return;
    const reset = { ...completed };
    layer.checks.forEach(c => { delete reset[c.id]; });
    setCompleted(reset);
  };

  const completeAll = () => {
    const layer = LAYERS.find(l => l.key === activeLayer);
    if (!layer) return;
    const all = { ...completed };
    layer.checks.forEach(c => { all[c.id] = true; });
    setCompleted(all);
  };

  const totalChecks = LAYERS.reduce((sum, l) => sum + l.checks.length, 0);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const pct = Math.round((completedCount / totalChecks) * 100);

  const currentLayer = LAYERS.find(l => l.key === activeLayer);
  const layerChecks = currentLayer?.checks ?? [];
  const layerCompleted = layerChecks.filter(c => completed[c.id]).length;
  const layerPct = Math.round((layerCompleted / layerChecks.length) * 100);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Overall progress */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: '700', color: '#1f2937' }}>
            {t('cloudInstall.smoke.overallProgress')}
          </div>
          <div style={{ fontWeight: '700', color: pct === 100 ? '#16a34a' : '#374151', fontSize: '1.25rem' }}>
            {pct}%
          </div>
        </div>
        <div style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            backgroundColor: pct === 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#f59e0b',
            borderRadius: '9999px', transition: 'width 0.4s ease'
          }} />
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          {completedCount} / {totalChecks} {t('cloudInstall.smoke.checksCompleted')}
        </div>
      </div>

      {/* Layer tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {LAYERS.map(layer => {
          const lChecks = layer.checks.length;
          const lDone = layer.checks.filter(c => completed[c.id]).length;
          const isActive = activeLayer === layer.key;
          return (
            <button
              key={layer.key}
              onClick={() => setActiveLayer(layer.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                backgroundColor: isActive ? layer.color : '#f3f4f6',
                color: isActive ? 'white' : '#374151',
                fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span>{layer.icon}</span>
              <span>{t(layer.labelKey)}</span>
              <span style={{
                padding: '0.1rem 0.45rem', borderRadius: '9999px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: isActive ? 'white' : '#6b7280',
                fontSize: '0.7rem', fontWeight: '700'
              }}>
                {lDone}/{lChecks}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current layer checklist */}
      {currentLayer && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem',
          border: `1px solid ${currentLayer.borderColor}`,
          overflow: 'hidden', marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.25rem', backgroundColor: currentLayer.bgColor,
            borderBottom: `1px solid ${currentLayer.borderColor}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{currentLayer.icon}</span>
              <div style={{ fontWeight: '700', color: '#1f2937' }}>
                {t(currentLayer.labelKey)}
              </div>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                {layerCompleted}/{layerChecks.length} — {layerPct}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={completeAll} style={{
                padding: '0.3rem 0.7rem', borderRadius: '0.375rem',
                border: '1px solid #d1d5db', backgroundColor: 'white',
                fontSize: '0.75rem', cursor: 'pointer', color: '#374151'
              }}>
                {t('cloudInstall.smoke.checkAll')}
              </button>
              <button onClick={resetLayer} style={{
                padding: '0.3rem 0.7rem', borderRadius: '0.375rem',
                border: '1px solid #d1d5db', backgroundColor: 'white',
                fontSize: '0.75rem', cursor: 'pointer', color: '#6b7280'
              }}>
                {t('cloudInstall.smoke.reset')}
              </button>
            </div>
          </div>

          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {layerChecks.map(check => (
              <CheckItem
                key={check.id}
                check={check}
                completed={!!completed[check.id]}
                onToggle={toggleCheck}
                accentColor={currentLayer.color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Troubleshooting toggle */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.5rem', border: 'none', backgroundColor: 'transparent',
            cursor: 'pointer', fontWeight: '700', color: '#1f2937', fontSize: '0.95rem'
          }}
        >
          <span>🔧 {t('cloudInstall.smoke.troubleshootingTitle')}</span>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{showTroubleshooting ? '▲' : '▼'}</span>
        </button>

        {showTroubleshooting && (
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {TROUBLESHOOTING.map((item, i) => (
              <div key={i} style={{
                borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden'
              }}>
                <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
                  <span style={{ fontWeight: '600', color: '#92400e', fontSize: '0.85rem' }}>
                    ⚠️ {item.symptom}
                  </span>
                </div>
                <div style={{ padding: '0.65rem 1rem', backgroundColor: '#f9fafb' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.35rem' }}>
                    <strong>Cause:</strong> {item.cause}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#374151' }}>
                    <strong style={{ color: '#16a34a' }}>Fix:</strong> {item.fix}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
