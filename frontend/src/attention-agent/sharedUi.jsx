import React from 'react';

/** Matches Personal Attention Overview cards */
export const attentionCardStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
};

export const attentionPanelStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
};

export function AttentionPage({ children }) {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: '24px' }}>{children}</div>
    </div>
  );
}

export function AttentionHero({ icon, title, subtitle, description, trailing }) {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <div style={{ fontSize: '40px', lineHeight: 1 }}>{icon}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{title}</h2>
            {subtitle ? (
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '15px', maxWidth: '52rem' }}>{subtitle}</p>
            ) : null}
            {description ? (
              <p style={{ marginTop: '12px', marginBottom: 0, opacity: 0.95, fontSize: '14px', maxWidth: '52rem' }}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {trailing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AttentionSectionHeader({ icon, title }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      {icon ? <span style={{ fontSize: '20px' }}>{icon}</span> : null}
      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>{title}</h3>
    </div>
  );
}

export function StatCard({ label, value, icon }) {
  return (
    <div style={{ ...attentionCardStyle, padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{value}</p>
        </div>
        <div
          style={{
            fontSize: '24px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
            padding: '12px',
            borderRadius: '12px',
          }}
        >
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
}

/** Primary action on purple/blue hero */
export function heroButtonStyle(disabled) {
  return {
    background: disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.22)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.45)',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  };
}

/** Secondary outline on light background */
export function accentButtonStyle(variant = 'blue') {
  const bg =
    variant === 'green'
      ? '#16a34a'
      : variant === 'gray'
        ? '#64748b'
        : '#2563eb';
  return {
    background: bg,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  };
}

export function attentionLocale(i18n) {
  if (i18n.language === 'no') return 'nb-NO';
  if (i18n.language === 'es') return 'es-ES';
  return 'en-US';
}
