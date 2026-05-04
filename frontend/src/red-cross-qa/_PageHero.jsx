import React from 'react';

/**
 * Shared hero panel for every Red Cross Web QA tab.
 * Mirrors the visual language used in the ATM V&V Test Copilot Overview:
 * a colored gradient card with an emoji, title, subtitle and an optional
 * "backend connected" status pill on the right.
 *
 * Props:
 *  - icon:        emoji shown on the left (default: ❤️‍🩹)
 *  - title:       big title
 *  - subtitle:    one-line tagline below title
 *  - description: optional longer description below
 *  - gradient:    css linear-gradient string (defaults to red-rose)
 *  - environment: 'local' | 'test' (renders an env pill on the right)
 *  - mode:        'generate' | 'execute' (renders a mode pill on the right)
 *  - status:      'ok' | 'error' | null — renders a green/red dot
 */
const DEFAULT_GRADIENT =
  'linear-gradient(135deg, #dc2626 0%, #b91c1c 45%, #9d174d 100%)';

const PageHero = ({
  icon = '❤️‍🩹',
  title,
  subtitle,
  description,
  gradient = DEFAULT_GRADIENT,
  environment,
  mode,
  status,
}) => {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '24px 28px',
        color: 'white',
        background: gradient,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{icon}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h2>
            {subtitle && (
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 14 }}>{subtitle}</p>
            )}
          </div>
        </div>

        {(environment || mode || status) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {status && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.15)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: status === 'ok' ? '#4ade80' : '#f87171',
                  }}
                />
                {status === 'ok' ? 'Backend connected' : 'Backend offline'}
              </span>
            )}
            {environment && (
              <span style={pillStyle}>env: <strong style={{ marginLeft: 4 }}>{environment}</strong></span>
            )}
            {mode && (
              <span style={pillStyle}>mode: <strong style={{ marginLeft: 4 }}>{mode}</strong></span>
            )}
          </div>
        )}
      </div>

      {description && (
        <p style={{ marginTop: 14, marginBottom: 0, opacity: 0.95, lineHeight: 1.55, fontSize: 14 }}>
          {description}
        </p>
      )}
    </div>
  );
};

const pillStyle = {
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.15)',
  fontSize: 12,
};

export default PageHero;
