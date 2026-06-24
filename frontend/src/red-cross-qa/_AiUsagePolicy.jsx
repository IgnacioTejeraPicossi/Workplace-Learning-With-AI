/**
 * AI Usage Policy — shared component
 * ===================================
 * Per Teststrategi 30.3 — makes explicit what AI is used for, what it must NOT
 * touch (real personal data, production data, security findings, API keys),
 * and who keeps final accountability for quality, security and privacy.
 *
 * Two variants:
 *   <AiUsagePolicy variant="full" />     — full two-column card with header + ack
 *   <AiUsagePolicy variant="compact" />  — collapsible banner with one-line
 *                                          headline + ack chip + expand toggle
 *
 * Acknowledgement is persisted in localStorage under AI_ACK_KEY, so once
 * the user confirms in any tab the chip appears as already acknowledged
 * everywhere else.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const AI_ACK_KEY = 'redCrossQa.aiUsageAck';

const useAck = () => {
  const [ack, setAck] = useState(false);
  const [ackAt, setAckAt] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AI_ACK_KEY);
      if (stored) { setAck(true); setAckAt(stored); }
    } catch { /* ignore */ }
  }, []);

  const handleAck = () => {
    const ts = new Date().toISOString();
    try { localStorage.setItem(AI_ACK_KEY, ts); } catch { /* ignore */ }
    setAck(true); setAckAt(ts);
  };

  return { ack, ackAt, handleAck };
};

const AckChip = ({ ack, ackAt, onAck, label }) => (
  ack ? (
    <span title={ackAt || ''} style={{
      backgroundColor: '#dcfce7', color: '#15803d',
      border: '1px solid #86efac', borderRadius: 999,
      padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{label}</span>
  ) : null
);

const AckButton = ({ onAck, label }) => (
  <button onClick={onAck} style={{
    backgroundColor: '#dc2626', color: 'white',
    border: 'none', borderRadius: 8,
    padding: '8px 14px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }}>{label}</button>
);

const PolicyBody = ({ uses, limits, usesTitle, limitsTitle }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 0,
  }}>
    {/* Uses (green) */}
    <div style={{
      padding: '16px 20px',
      borderRight: '1px solid #e2e8f0',
      backgroundColor: '#f0fdf4',
    }}>
      <p style={{
        margin: '0 0 10px', fontSize: 11, fontWeight: 700,
        color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>✓ {usesTitle}</p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#1e293b', lineHeight: 1.7 }}>
        {uses.map((u, i) => <li key={i}>{u}</li>)}
      </ul>
    </div>

    {/* Limits (red) */}
    <div style={{ padding: '16px 20px', backgroundColor: '#fef2f2' }}>
      <p style={{
        margin: '0 0 10px', fontSize: 11, fontWeight: 700,
        color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>⚠ {limitsTitle}</p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#1e293b', lineHeight: 1.7 }}>
        {limits.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  </div>
);

/**
 * <AiUsagePolicy variant="full" | "compact" />
 */
const AiUsagePolicy = ({ variant = 'full' }) => {
  const { t } = useTranslation();
  const { ack, ackAt, handleAck } = useAck();
  const [expanded, setExpanded] = useState(false);

  const uses   = t('redCrossWebQaModule.aiUsage.uses',   { returnObjects: true }) || [];
  const limits = t('redCrossWebQaModule.aiUsage.limits', { returnObjects: true }) || [];

  if (variant === 'compact') {
    return (
      <div style={{
        backgroundColor: 'white', borderRadius: 10,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px',
          background: 'linear-gradient(90deg, #f0fdf4 0%, #fefefe 50%, #fef2f2 100%)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#1e293b', fontWeight: 600 }}>
              {t('redCrossWebQaModule.aiUsage.compactHeadline')}
            </p>
          </div>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'transparent', border: '1px solid #cbd5e1',
            borderRadius: 6, padding: '4px 10px', fontSize: 11,
            color: '#475569', fontWeight: 600, cursor: 'pointer',
          }}>
            {expanded
              ? t('redCrossWebQaModule.aiUsage.hideDetails')
              : t('redCrossWebQaModule.aiUsage.showDetails')}
          </button>
          {ack ? (
            <AckChip ack={ack} ackAt={ackAt} label={t('redCrossWebQaModule.aiUsage.acknowledged')} />
          ) : (
            <AckButton onAck={handleAck} label={t('redCrossWebQaModule.aiUsage.ackBtn')} />
          )}
        </div>

        {expanded && (
          <>
            <PolicyBody
              uses={uses} limits={limits}
              usesTitle={t('redCrossWebQaModule.aiUsage.usesTitle')}
              limitsTitle={t('redCrossWebQaModule.aiUsage.limitsTitle')}
            />
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              fontSize: 11, color: '#94a3b8',
            }}>
              {t('redCrossWebQaModule.aiUsage.ackHint')}
            </div>
          </>
        )}
      </div>
    );
  }

  // full variant
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: 12, padding: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 50%, #fef2f2 100%)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            {t('redCrossWebQaModule.aiUsage.title')}
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
            {t('redCrossWebQaModule.aiUsage.subtitle')}
          </p>
        </div>
        {ack ? (
          <AckChip ack={ack} ackAt={ackAt} label={t('redCrossWebQaModule.aiUsage.acknowledged')} />
        ) : (
          <AckButton onAck={handleAck} label={t('redCrossWebQaModule.aiUsage.ackBtn')} />
        )}
      </div>

      <PolicyBody
        uses={uses} limits={limits}
        usesTitle={t('redCrossWebQaModule.aiUsage.usesTitle')}
        limitsTitle={t('redCrossWebQaModule.aiUsage.limitsTitle')}
      />

      <div style={{
        padding: '8px 20px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        fontSize: 11, color: '#94a3b8',
      }}>
        {t('redCrossWebQaModule.aiUsage.ackHint')}
      </div>
    </div>
  );
};

export default AiUsagePolicy;
