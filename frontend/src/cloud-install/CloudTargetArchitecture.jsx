import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const services = [
  {
    key: 'frontend',
    icon: '⚛️',
    name: 'React Frontend',
    provider: 'Vercel',
    phase: 1,
    color: '#000000',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
    accentColor: '#6366f1',
    descKey: 'cloudInstall.arch.frontend.desc',
    whyKey: 'cloudInstall.arch.frontend.why',
    features: ['GitHub-based CI/CD', 'Custom domain + SSL', 'Edge network', 'ENV variable support'],
    link: 'https://vercel.com',
  },
  {
    key: 'backend',
    icon: '🐍',
    name: 'FastAPI Backend',
    provider: 'Google Cloud Run',
    phase: 1,
    color: '#1a73e8',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    accentColor: '#2563eb',
    descKey: 'cloudInstall.arch.backend.desc',
    whyKey: 'cloudInstall.arch.backend.why',
    features: ['Container-based', 'Pay-per-request', 'Auto-scaling', 'Managed SSL & domain'],
    link: 'https://cloud.google.com/run',
  },
  {
    key: 'database',
    icon: '🍃',
    name: 'MongoDB',
    provider: 'MongoDB Atlas',
    phase: 1,
    color: '#00684a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    accentColor: '#16a34a',
    descKey: 'cloudInstall.arch.database.desc',
    whyKey: 'cloudInstall.arch.database.why',
    features: ['Free M0 tier available', 'Managed backups', 'Connection via MONGO_URI', 'Global clusters'],
    link: 'https://mongodb.com/atlas',
  },
  {
    key: 'auth',
    icon: '🔥',
    name: 'Authentication',
    provider: 'Firebase Auth',
    phase: 1,
    color: '#f57c00',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    accentColor: '#ea580c',
    descKey: 'cloudInstall.arch.auth.desc',
    whyKey: 'cloudInstall.arch.auth.why',
    features: ['Already integrated', 'Email / Google / social', 'JWT tokens', 'No migration needed'],
    link: 'https://firebase.google.com/products/auth',
  },
  {
    key: 'dns',
    icon: '☁️',
    name: 'DNS & SSL',
    provider: 'Cloudflare',
    phase: 2,
    color: '#f38020',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    accentColor: '#d97706',
    descKey: 'cloudInstall.arch.dns.desc',
    whyKey: 'cloudInstall.arch.dns.why',
    features: ['Free DNS management', 'DDoS protection', 'Edge cache', 'Custom domain routing'],
    link: 'https://cloudflare.com',
  },
];

const deferred = [
  { icon: '📊', name: 'Sentry', role: 'Error tracking & monitoring' },
  { icon: '📈', name: 'PostHog', role: 'Product analytics' },
  { icon: '📧', name: 'Resend', role: 'Transactional email' },
  { icon: '🔄', name: 'n8n Cloud', role: 'Workflow automation' },
  { icon: '🔍', name: 'Web Search Backend', role: 'Node.js search service' },
];

function ServiceCard({ service, isSelected, onSelect }) {
  const { t } = useTranslation();
  const phaseColor = service.phase === 1
    ? { bg: '#d1fae5', text: '#065f46' }
    : { bg: '#fef3c7', text: '#92400e' };

  return (
    <div
      onClick={() => onSelect(service.key)}
      style={{
        backgroundColor: isSelected ? service.bgColor : 'white',
        borderRadius: '0.75rem',
        border: isSelected ? `2px solid ${service.accentColor}` : '1px solid #e5e7eb',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isSelected ? `0 0 0 3px ${service.accentColor}22` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '2rem' }}>{service.icon}</span>
        <span style={{
          padding: '0.15rem 0.6rem', borderRadius: '9999px',
          backgroundColor: phaseColor.bg, color: phaseColor.text,
          fontSize: '0.7rem', fontWeight: '700'
        }}>
          Phase {service.phase}
        </span>
      </div>
      <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>{service.name}</div>
      <div style={{ color: service.accentColor, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
        {service.provider}
      </div>
      <div style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
        {t(service.descKey)}
      </div>
    </div>
  );
}

export default function CloudTargetArchitecture() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('frontend');
  const [costData, setCostData] = useState(null);
  const [archData, setArchData] = useState(null);

  useEffect(() => {
    // Fetch cost baseline
    fetch(`${API}/api/cloud-install/cost-baseline`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCostData(data); })
      .catch(() => {});
    // Fetch architecture recommendation
    fetch(`${API}/api/cloud-install/recommend-architecture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ include_optional: false, budget_tier: 'starter' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setArchData(data); })
      .catch(() => {});
  }, []);

  const selectedService = services.find(s => s.key === selected);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Principle box */}
      <div style={{
        backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontWeight: '700', color: '#15803d', marginBottom: '0.35rem' }}>
            {t('cloudInstall.arch.principleTitle')}
          </div>
          <div style={{ color: '#166534', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('cloudInstall.arch.principleText')}
          </div>
        </div>
      </div>

      {/* Architecture flow diagram */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        padding: '1.5rem', marginBottom: '1.5rem'
      }}>
        <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          {t('cloudInstall.arch.flowTitle')}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', flexWrap: 'wrap'
        }}>
          {[
            { icon: '👤', label: 'User / Browser' },
            { arrow: true },
            { icon: '⚛️', label: 'Vercel\n(Frontend)' },
            { arrow: true },
            { icon: '🐍', label: 'Cloud Run\n(FastAPI)' },
            { arrow: true },
            { icon: '🍃', label: 'MongoDB\nAtlas' },
          ].map((item, i) =>
            item.arrow ? (
              <span key={i} style={{ color: '#9ca3af', fontSize: '1.25rem', fontWeight: '300' }}>→</span>
            ) : (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                padding: '0.75rem 1rem', backgroundColor: '#f9fafb',
                borderRadius: '0.5rem', border: '1px solid #e5e7eb', minWidth: 90, textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.7rem', color: '#374151', fontWeight: '500', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                  {item.label}
                </span>
              </div>
            )
          )}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.25rem', backgroundColor: '#fff7ed',
              borderRadius: '0.5rem', border: '1px solid #fed7aa', fontSize: '0.8rem', color: '#92400e'
            }}>
              <span>🔥</span>
              <span>Firebase Auth {t('cloudInstall.arch.spansBoth')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service cards grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '0.95rem' }}>
          {t('cloudInstall.arch.servicesTitle')}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem'
        }}>
          {services.map(s => (
            <ServiceCard
              key={s.key}
              service={s}
              isSelected={selected === s.key}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedService && (
        <div style={{
          backgroundColor: selectedService.bgColor,
          borderRadius: '0.75rem',
          border: `1px solid ${selectedService.borderColor}`,
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>{selectedService.icon}</span>
            <div>
              <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1.05rem' }}>{selectedService.name}</div>
              <div style={{ color: selectedService.accentColor, fontSize: '0.85rem', fontWeight: '600' }}>
                {selectedService.provider}
              </div>
            </div>
            <a
              href={selectedService.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: 'auto', padding: '0.4rem 0.85rem', borderRadius: '0.375rem',
                backgroundColor: selectedService.accentColor, color: 'white',
                fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none'
              }}
            >
              {t('cloudInstall.arch.visitDocs')} ↗
            </a>
          </div>
          <p style={{ color: '#374151', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            {t(selectedService.whyKey)}
          </p>
          <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {t('cloudInstall.arch.keyFeatures')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {selectedService.features.map((f, i) => (
              <span key={i} style={{
                padding: '0.25rem 0.65rem', borderRadius: '9999px',
                backgroundColor: 'white', border: `1px solid ${selectedService.borderColor}`,
                color: '#374151', fontSize: '0.775rem'
              }}>
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cost Baseline (from backend) */}
      {costData && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
          padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.95rem' }}>
              {t('cloudInstall.arch.costTitle')}
            </div>
            <div style={{
              padding: '0.3rem 0.85rem', borderRadius: '9999px',
              backgroundColor: '#d1fae5', color: '#065f46', fontWeight: '700', fontSize: '0.85rem'
            }}>
              {costData.total_monthly}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {costData.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                backgroundColor: '#f9fafb', border: '1px solid #f3f4f6',
                fontSize: '0.825rem'
              }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>{item.service}</span>
                  <span style={{
                    marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '9999px',
                    backgroundColor: item.phase === 1 ? '#d1fae5' : '#f3f4f6',
                    color: item.phase === 1 ? '#065f46' : '#6b7280',
                    fontSize: '0.65rem', fontWeight: '600'
                  }}>
                    Phase {item.phase}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{item.tier}</span>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{item.monthly_estimate}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Budget tiers */}
          {costData.budget_tiers && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(costData.budget_tiers).map(([tier, desc]) => (
                <div key={tier} style={{
                  flex: 1, minWidth: 200, padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.8rem', textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                    {tier}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deployment Order (from backend) */}
      {archData && archData.deployment_order && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
          padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            {t('cloudInstall.arch.deployOrderTitle')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {archData.deployment_order.map((step, i) => (
              <React.Fragment key={step}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 0.8rem', borderRadius: '9999px',
                  backgroundColor: '#eff6ff', border: '1px solid #bfdbfe'
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#3b82f6', color: 'white', fontSize: '0.65rem', fontWeight: '700'
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#1e40af' }}>
                    {t(`cloudInstall.arch.deployOrder.steps.${step}`, { defaultValue: step.charAt(0).toUpperCase() + step.slice(1) })}
                  </span>
                </div>
                {i < archData.deployment_order.length - 1 && (
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
          {archData.notes && archData.notes.length > 0 && (() => {
            const i18nNotes = t('cloudInstall.arch.deployOrder.notes', { returnObjects: true, defaultValue: archData.notes });
            const notesList = Array.isArray(i18nNotes) ? i18nNotes : archData.notes;
            return (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {notesList.map((note, i) => (
                  <div key={i} style={{ fontSize: '0.775rem', color: '#6b7280' }}>
                    • {note}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Deferred services */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb',
        padding: '1.25rem 1.5rem'
      }}>
        <div style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          {t('cloudInstall.arch.deferredTitle')}
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {t('cloudInstall.arch.deferredDesc')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {deferred.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.85rem', borderRadius: '0.5rem',
              backgroundColor: '#f9fafb', border: '1px dashed #d1d5db'
            }}>
              <span>{d.icon}</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280' }}>{d.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{d.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
