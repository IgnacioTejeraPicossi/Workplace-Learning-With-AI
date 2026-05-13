import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SEV_COLOR, FINDING_STATUS_STYLES, formatTimestamp, inputCss,
} from '../tokens';
import { securityApi } from '../api';

/**
 * Expandable row representing one Finding.
 *
 * Collapsed view: severity + title + linked check + status pill + chevron
 * Expanded view: description, evidence list, recommendation editor, owner
 *                input, status selector, "Save" button, audit history
 *
 * `onPatched(updated)` is called after a successful PATCH so the parent
 * can refresh its local list without re-fetching.
 */
const STATUSES = ['open', 'accepted_risk', 'fixed', 'verified'];

export default function FindingRow({ finding, onPatched, compact = false }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({
    status: finding.status || 'open',
    owner: finding.owner || '',
    recommendation: finding.recommendation || '',
    note: '',
  });

  // Sync draft whenever the parent passes in a different finding object.
  React.useEffect(() => {
    setDraft({
      status: finding.status || 'open',
      owner: finding.owner || '',
      recommendation: finding.recommendation || '',
      note: '',
    });
  }, [finding.id, finding.status, finding.owner, finding.recommendation]);

  const status = FINDING_STATUS_STYLES[finding.status] || FINDING_STATUS_STYLES.open;
  const sevColor = SEV_COLOR[finding.severity] || SEV_COLOR.info;
  const isDirty = (
    draft.status !== (finding.status || 'open') ||
    (draft.owner || '') !== (finding.owner || '') ||
    (draft.recommendation || '') !== (finding.recommendation || '') ||
    !!(draft.note && draft.note.trim())
  );

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const updated = await securityApi.patchFinding(finding.id, {
        status: draft.status,
        owner: draft.owner,
        recommendation: draft.recommendation,
        note: draft.note,
        actor: 'workshop-host',
      });
      if (onPatched) onPatched(updated);
      // Clear the note (it's been written to history); keep the other fields
      // so the form reflects what the server returned.
      setDraft(d => ({ ...d, note: '' }));
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 8,
      backgroundColor: 'white',
      borderLeft: `4px solid ${sevColor}`,
      overflow: 'hidden',
    }}>
      {/* Header (always visible) */}
      <button
        type="button"
        onClick={() => setExpanded(x => !x)}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          backgroundColor: sevColor, color: 'white', letterSpacing: 0.4,
          textTransform: 'uppercase', flexShrink: 0,
        }}>{finding.severity || 'info'}</span>

        <span style={{
          fontSize: 13, fontWeight: 600, color: '#1e293b',
          flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{finding.title}</span>

        {!compact && finding.check_id && (
          <code style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 10,
            padding: '1px 6px', borderRadius: 4,
            backgroundColor: '#f1f5f9', color: '#475569',
            flexShrink: 0,
          }}>{finding.check_id}</code>
        )}

        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          backgroundColor: status.bg, color: status.fg,
          border: `1px solid ${status.border}`, letterSpacing: 0.4,
          textTransform: 'uppercase', flexShrink: 0,
        }}>
          {t(`redCrossWebQaModule.securityPrivacy.findingStatus_${finding.status || 'open'}`)}
        </span>

        <span style={{ color: '#94a3b8', fontSize: 14, flexShrink: 0 }}>
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#fafbfc',
          display: 'grid', gap: 10,
        }}>
          {finding.description && (
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              {finding.description}
            </div>
          )}

          {finding.gdpr_article && (
            <div>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 999,
                backgroundColor: '#f5f3ff', color: '#6b21a8',
                fontWeight: 600, border: '1px solid #d8b4fe',
              }}>GDPR {finding.gdpr_article}</span>
            </div>
          )}

          {Array.isArray(finding.evidence) && finding.evidence.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                {t('redCrossWebQaModule.securityPrivacy.detailEvidence')}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569' }}>
                {finding.evidence.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Edit form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div>
              <label style={fieldLabel}>{t('redCrossWebQaModule.securityPrivacy.findingStatusLabel')}</label>
              <select
                value={draft.status}
                onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
                style={inputCss}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {t(`redCrossWebQaModule.securityPrivacy.findingStatus_${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>{t('redCrossWebQaModule.securityPrivacy.findingOwner')}</label>
              <input
                value={draft.owner}
                onChange={e => setDraft(d => ({ ...d, owner: e.target.value }))}
                placeholder={t('redCrossWebQaModule.securityPrivacy.findingOwnerPlaceholder')}
                style={inputCss}
              />
            </div>
          </div>

          <div>
            <label style={fieldLabel}>{t('redCrossWebQaModule.securityPrivacy.findingRecommendation')}</label>
            <textarea
              value={draft.recommendation}
              onChange={e => setDraft(d => ({ ...d, recommendation: e.target.value }))}
              rows={2}
              placeholder={t('redCrossWebQaModule.securityPrivacy.findingRecommendationPlaceholder')}
              style={{ ...inputCss, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={fieldLabel}>{t('redCrossWebQaModule.securityPrivacy.findingNote')}</label>
            <input
              value={draft.note}
              onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
              placeholder={t('redCrossWebQaModule.securityPrivacy.findingNotePlaceholder')}
              style={inputCss}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={save} disabled={saving || !isDirty} style={{
              padding: '7px 14px', borderRadius: 6, border: 'none',
              backgroundColor: (saving || !isDirty) ? '#cbd5e1' : '#15803d',
              color: 'white', fontWeight: 700, fontSize: 12,
              cursor: (saving || !isDirty) ? 'default' : 'pointer',
              letterSpacing: 0.3,
            }}>
              {saving ? t('redCrossWebQaModule.common.running') : `💾 ${t('redCrossWebQaModule.securityPrivacy.findingSave')}`}
            </button>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {t('redCrossWebQaModule.securityPrivacy.updatedAt')}: {formatTimestamp(finding.updated_at)}
              {finding.updated_by && ` · ${finding.updated_by}`}
            </span>
          </div>

          {error && (
            <div style={{
              padding: '8px 10px', borderRadius: 6, fontSize: 12,
              backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
            }}>{error}</div>
          )}

          {Array.isArray(finding.history) && finding.history.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                📜 {t('redCrossWebQaModule.securityPrivacy.findingHistory')}
              </div>
              <div style={{ display: 'grid', gap: 4, fontSize: 11, color: '#64748b' }}>
                {finding.history.slice(-5).reverse().map((h, i) => (
                  <div key={i}>
                    <code style={{ marginRight: 4 }}>{formatTimestamp(h.at)}</code>
                    {h.actor && <strong>{h.actor}</strong>}
                    {h.status && <span> · status={h.status}</span>}
                    {h.note && <span style={{ fontStyle: 'italic' }}> · "{h.note}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const fieldLabel = {
  display: 'block', fontSize: 10, color: '#64748b',
  textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4,
  marginBottom: 4,
};
