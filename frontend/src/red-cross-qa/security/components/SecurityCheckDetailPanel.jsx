import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  STATUS_STYLES, SEV_COLOR, SCAN_TYPE_STYLES, CATEGORY_STYLES,
  panel, panelTitle, subTitle, formatTimestamp, errorBox,
} from '../tokens';
import FindingRow from './FindingRow';

/**
 * Detail drawer-style panel that opens when a SecurityCheckCard is clicked.
 *
 * Shows:
 *   - title + status pill
 *   - description, summary
 *   - evidence list
 *   - recommendations list
 *   - linked findings (full rows via FindingRow)
 *   - last run, scan type, category
 *   - close button
 *
 * Findings list is rendered with FindingRow so status changes propagate
 * straight back to the parent state.
 */
export default function SecurityCheckDetailPanel({ check, onClose, onFindingPatched, loading, error }) {
  const { t } = useTranslation();
  if (!check) return null;

  const status = STATUS_STYLES[check.status] || STATUS_STYLES.pending;
  const scan = SCAN_TYPE_STYLES[check.scan_type] || SCAN_TYPE_STYLES.automatic;
  const cat = CATEGORY_STYLES[check.category] || CATEGORY_STYLES.security;
  const severityColor = SEV_COLOR[check.severity] || SEV_COLOR.info;
  const findings = check.findings_detail || [];

  return (
    <div style={{
      ...panel,
      borderTop: `4px solid ${cat.color}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 22 }} aria-hidden>{cat.icon}</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>{check.title}</h3>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              <code style={{
                fontFamily: 'ui-monospace, monospace',
                padding: '1px 6px', borderRadius: 4, backgroundColor: '#f1f5f9',
              }}>{check.id}</code>
              {' · '}
              <span style={{ color: cat.color, fontWeight: 600 }}>
                {t(`redCrossWebQaModule.securityPrivacy.category_${check.category}`)}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            backgroundColor: status.bg, color: status.fg,
            border: `1px solid ${status.border}`, letterSpacing: 0.4,
          }}>{status.label}</span>
          {check.severity && check.severity !== 'info' && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              backgroundColor: `${severityColor}15`, color: severityColor,
              textTransform: 'uppercase',
            }}>{check.severity}</span>
          )}
          {onClose && (
            <button onClick={onClose} style={{
              padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
              backgroundColor: 'white', color: '#475569', fontWeight: 600,
              fontSize: 12, cursor: 'pointer',
            }}>
              ✕ {t('common.close', { defaultValue: 'Close' })}
            </button>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14,
        fontSize: 11, color: '#64748b',
      }}>
        <span><strong>{t('redCrossWebQaModule.securityPrivacy.scanType')}:</strong>{' '}
          <span style={{ color: scan.color, fontWeight: 600 }}>
            {scan.icon} {t(`redCrossWebQaModule.securityPrivacy.scanType_${check.scan_type.replace('-', '_')}`)}
          </span>
        </span>
        {check.source && (
          <span><strong>{t('redCrossWebQaModule.securityPrivacy.source')}:</strong> {check.source}</span>
        )}
        {check.last_run_at && (
          <span><strong>{t('redCrossWebQaModule.securityPrivacy.lastRunAt')}:</strong> {formatTimestamp(check.last_run_at)}</span>
        )}
      </div>

      {check.description && (
        <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 14px' }}>
          {check.description}
        </p>
      )}

      {check.summary && (
        <div style={{ marginBottom: 14 }}>
          <h4 style={subTitle}>📌 {t('redCrossWebQaModule.securityPrivacy.detailSummary')}</h4>
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
            fontSize: 13, color: '#334155',
          }}>{check.summary}</div>
        </div>
      )}

      {Array.isArray(check.evidence) && check.evidence.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h4 style={subTitle}>🔎 {t('redCrossWebQaModule.securityPrivacy.detailEvidence')} ({check.evidence.length})</h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            {check.evidence.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {Array.isArray(check.recommendations) && check.recommendations.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h4 style={subTitle}>💡 {t('redCrossWebQaModule.securityPrivacy.detailRecommendations')} ({check.recommendations.length})</h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#1d4ed8', lineHeight: 1.6 }}>
            {check.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {/* Linked findings (full rows) */}
      <div>
        <h4 style={subTitle}>
          🐞 {t('redCrossWebQaModule.securityPrivacy.detailLinkedFindings')} ({findings.length})
        </h4>
        {loading && <p style={{ fontSize: 12, color: '#64748b' }}>{t('redCrossWebQaModule.common.running')}…</p>}
        {error && <div style={errorBox}>{error}</div>}
        {!loading && !error && findings.length === 0 && (
          <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
            {t('redCrossWebQaModule.securityPrivacy.noFindingsForCheck')}
          </p>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {findings.map(f => (
            <FindingRow
              key={f.id}
              finding={f}
              onPatched={onFindingPatched}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}
