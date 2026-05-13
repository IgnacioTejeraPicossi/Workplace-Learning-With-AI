import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  STATUS_STYLES, SEV_COLOR, SCAN_TYPE_STYLES, CATEGORY_STYLES,
  formatTimestamp,
} from '../tokens';

/**
 * One clickable card per security/privacy check.
 *
 * Renders status, severity, scan_type, category, summary + a small badge for
 * the number of linked findings. Clicking opens the detail panel.
 */
export default function SecurityCheckCard({ check, onClick, active }) {
  const { t } = useTranslation();
  const status = STATUS_STYLES[check.status] || STATUS_STYLES.pending;
  const scan = SCAN_TYPE_STYLES[check.scan_type] || SCAN_TYPE_STYLES.automatic;
  const cat = CATEGORY_STYLES[check.category] || CATEGORY_STYLES.security;
  const findingsCount = (check.findings || []).length;
  const severityColor = SEV_COLOR[check.severity] || SEV_COLOR.info;

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(check)}
      style={{
        textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '12px 14px', borderRadius: 10,
        background: active ? `${cat.color}10` : 'white',
        border: `1px solid ${active ? cat.color : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = '#94a3b8';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Top row — category icon + title + status pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16 }} aria-hidden>{cat.icon}</span>
          <span style={{
            fontSize: 13, fontWeight: 600, color: '#1e293b',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{check.title}</span>
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          backgroundColor: status.bg, color: status.fg,
          border: `1px solid ${status.border}`, letterSpacing: 0.4,
          flexShrink: 0,
        }}>
          {status.label}
        </span>
      </div>

      {/* Summary */}
      {check.summary && (
        <div style={{
          fontSize: 12, color: '#64748b', lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {check.summary}
        </div>
      )}

      {/* Bottom row — scan type, severity, findings count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 999,
          backgroundColor: `${scan.color}15`, color: scan.color,
          fontWeight: 600,
        }} title={t('redCrossWebQaModule.securityPrivacy.scanType')}>
          {scan.icon} {t(`redCrossWebQaModule.securityPrivacy.scanType_${check.scan_type.replace('-', '_')}`)}
        </span>
        {check.severity && check.severity !== 'info' && (
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 999,
            backgroundColor: `${severityColor}15`, color: severityColor,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3,
          }}>
            {check.severity}
          </span>
        )}
        {findingsCount > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 10, padding: '2px 7px', borderRadius: 999,
            backgroundColor: '#1e293b', color: 'white',
            fontWeight: 700,
          }} title={t('redCrossWebQaModule.securityPrivacy.findingsCount')}>
            🐞 {findingsCount}
          </span>
        )}
      </div>

      {/* Last run */}
      {check.last_run_at && (
        <div style={{ fontSize: 10, color: '#94a3b8' }}>
          {t('redCrossWebQaModule.securityPrivacy.lastRunAt')}: {formatTimestamp(check.last_run_at)}
        </div>
      )}
    </button>
  );
}
