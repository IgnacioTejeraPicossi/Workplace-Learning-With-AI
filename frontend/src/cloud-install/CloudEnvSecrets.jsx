import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SECRET_BADGE = {
  secret: { bg: '#fee2e2', text: '#991b1b', label: 'SECRET' },
  public: { bg: '#d1fae5', text: '#065f46', label: 'PUBLIC' },
  optional: { bg: '#f3f4f6', text: '#6b7280', label: 'OPTIONAL' },
};

function TypeBadge({ type }) {
  const s = SECRET_BADGE[type] || SECRET_BADGE.optional;
  return (
    <span style={{
      padding: '0.15rem 0.5rem', borderRadius: '9999px',
      backgroundColor: s.bg, color: s.text,
      fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em'
    }}>
      {s.label}
    </span>
  );
}

function EnvRow({ name, type, example, cloudNote }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${name}=${example}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 80px 1fr auto',
      gap: '0.75rem',
      alignItems: 'center',
      padding: '0.65rem 1rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.8rem'
    }}>
      <code style={{
        fontFamily: 'monospace', fontWeight: '600', color: '#1f2937',
        backgroundColor: '#f9fafb', padding: '0.2rem 0.4rem', borderRadius: '0.25rem',
        fontSize: '0.775rem'
      }}>
        {name}
      </code>
      <TypeBadge type={type} />
      <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem' }}>
        {example}
      </span>
      <button
        onClick={handleCopy}
        title={cloudNote}
        style={{
          padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #e5e7eb',
          backgroundColor: copied ? '#d1fae5' : 'white', color: copied ? '#065f46' : '#6b7280',
          fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
      >
        {copied ? '✓ Copied' : '📋 Copy'}
      </button>
    </div>
  );
}

const envGroups = [
  {
    key: 'backend',
    titleKey: 'cloudInstall.env.backendTitle',
    file: 'backend/.env',
    icon: '🐍',
    vars: [
      { name: 'MONGO_URI', type: 'secret', example: 'mongodb+srv://user:pass@cluster.mongodb.net/db', cloudNote: 'Set in Cloud Run Secret Manager' },
      { name: 'OPENAI_API_KEY', type: 'secret', example: 'sk-...', cloudNote: 'Set in Cloud Run Secret Manager' },
      { name: 'ANTHROPIC_API_KEY', type: 'secret', example: 'sk-ant-...', cloudNote: 'Set in Cloud Run Secret Manager' },
      { name: 'FIREBASE_SERVICE_ACCOUNT', type: 'secret', example: '{"type":"service_account",...}', cloudNote: 'Store as Secret Manager secret' },
      { name: 'BACKEND_HOST', type: 'public', example: '0.0.0.0', cloudNote: 'Required for Cloud Run' },
      { name: 'BACKEND_PORT', type: 'public', example: '8000', cloudNote: 'Must match Cloud Run port' },
      { name: 'ALLOWED_ORIGINS', type: 'public', example: 'https://your-app.vercel.app', cloudNote: 'Set to Vercel production URL' },
      { name: 'LM_STUDIO_URL', type: 'optional', example: 'http://localhost:1234', cloudNote: 'Optional - local LLM fallback' },
    ]
  },
  {
    key: 'frontend',
    titleKey: 'cloudInstall.env.frontendTitle',
    file: 'frontend/.env',
    icon: '⚛️',
    vars: [
      { name: 'REACT_APP_API_BASE_URL', type: 'public', example: 'https://your-backend.run.app', cloudNote: 'Set to Cloud Run backend URL in Vercel' },
      { name: 'REACT_APP_FIREBASE_API_KEY', type: 'public', example: 'AIzaSy...', cloudNote: 'Public Firebase config key' },
      { name: 'REACT_APP_FIREBASE_AUTH_DOMAIN', type: 'public', example: 'your-app.firebaseapp.com', cloudNote: 'Firebase project auth domain' },
      { name: 'REACT_APP_FIREBASE_PROJECT_ID', type: 'public', example: 'your-project-id', cloudNote: 'Firebase project ID' },
      { name: 'REACT_APP_FIREBASE_STORAGE_BUCKET', type: 'public', example: 'your-app.appspot.com', cloudNote: 'Firebase storage bucket' },
      { name: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', type: 'public', example: '123456789', cloudNote: 'Firebase messaging sender ID' },
      { name: 'REACT_APP_FIREBASE_APP_ID', type: 'public', example: '1:123:web:abc', cloudNote: 'Firebase app ID' },
    ]
  },
  {
    key: 'websearch',
    titleKey: 'cloudInstall.env.websearchTitle',
    file: 'websearch-backend/.env',
    icon: '🔍',
    vars: [
      { name: 'PORT', type: 'public', example: '3001', cloudNote: 'Phase 2 - optional service' },
      { name: 'SERPER_API_KEY', type: 'secret', example: 'serper_key_...', cloudNote: 'Phase 2 - web search API key' },
      { name: 'ALLOWED_ORIGINS', type: 'public', example: 'https://your-app.vercel.app', cloudNote: 'Phase 2 - set to production URL' },
    ]
  }
];

export default function CloudEnvSecrets() {
  const { t } = useTranslation();
  const [activeGroup, setActiveGroup] = useState('backend');
  const [showCloudTips, setShowCloudTips] = useState(false);

  const currentGroup = envGroups.find(g => g.key === activeGroup);

  const secretCount = currentGroup?.vars.filter(v => v.type === 'secret').length ?? 0;
  const publicCount = currentGroup?.vars.filter(v => v.type === 'public').length ?? 0;
  const optionalCount = currentGroup?.vars.filter(v => v.type === 'optional').length ?? 0;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Info box */}
      <div style={{
        backgroundColor: '#fffbeb', borderRadius: '0.75rem', border: '1px solid #fde68a',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔐</span>
        <div>
          <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '0.35rem' }}>
            {t('cloudInstall.env.infoTitle')}
          </div>
          <div style={{ color: '#78350f', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('cloudInstall.env.infoText')}
          </div>
        </div>
      </div>

      {/* Group tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {envGroups.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveGroup(g.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
              backgroundColor: activeGroup === g.key ? '#3b82f6' : '#f3f4f6',
              color: activeGroup === g.key ? 'white' : '#374151',
              fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer'
            }}
          >
            <span>{g.icon}</span>
            <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{g.file}</code>
            {g.key === 'websearch' && (
              <span style={{
                padding: '0.1rem 0.4rem', borderRadius: '9999px',
                backgroundColor: activeGroup === g.key ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                color: activeGroup === g.key ? 'white' : '#6b7280',
                fontSize: '0.65rem', fontWeight: '700'
              }}>Phase 2</span>
            )}
          </button>
        ))}
      </div>

      {currentGroup && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
          overflow: 'hidden', marginBottom: '1.5rem'
        }}>
          {/* Table header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{currentGroup.icon}</span>
              <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.9rem' }}>
                {t(currentGroup.titleKey)}
              </div>
              <code style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                {currentGroup.file}
              </code>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {secretCount > 0 && (
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: '600'
                }}>
                  {secretCount} secret
                </span>
              )}
              {publicCount > 0 && (
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.7rem', fontWeight: '600'
                }}>
                  {publicCount} public
                </span>
              )}
              {optionalCount > 0 && (
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '0.7rem', fontWeight: '600'
                }}>
                  {optionalCount} optional
                </span>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 1fr auto',
            gap: '0.75rem', padding: '0.5rem 1rem',
            backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb'
          }}>
            {['Variable', 'Type', 'Example value', ''].map((h, i) => (
              <div key={i} style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </div>
            ))}
          </div>

          {currentGroup.vars.map((v, i) => (
            <EnvRow key={i} {...v} />
          ))}
        </div>
      )}

      {/* Cloud tips toggle */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setShowCloudTips(!showCloudTips)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.5rem', border: 'none', backgroundColor: 'transparent',
            cursor: 'pointer', fontWeight: '700', color: '#1f2937', fontSize: '0.95rem'
          }}
        >
          <span>☁️ {t('cloudInstall.env.cloudTipsTitle')}</span>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{showCloudTips ? '▲' : '▼'}</span>
        </button>

        {showCloudTips && (
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '🔑', title: 'Google Cloud Secret Manager', text: 'Store MONGO_URI, OPENAI_API_KEY, ANTHROPIC_API_KEY, and FIREBASE_SERVICE_ACCOUNT in Secret Manager. Reference them in cloudrun.yaml.' },
              { icon: '⚛️', title: 'Vercel Environment Variables', text: 'All REACT_APP_* variables go into Vercel Project Settings → Environment Variables. They are baked into the build.' },
              { icon: '🚫', title: 'Never commit .env files', text: 'Ensure .env, .env.local, .env.production are in .gitignore. Use env.example for documentation.' },
              { icon: '🌐', title: 'ALLOWED_ORIGINS in Cloud Run', text: 'Set ALLOWED_ORIGINS to your Vercel production URL (e.g. https://your-app.vercel.app) to fix CORS in production.' },
            ].map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.75rem', padding: '0.85rem 1rem',
                backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{tip.title}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.5 }}>{tip.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
