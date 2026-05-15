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
  // Pack 3 — busy + error state for the two new buttons (ADO + verify-fix).
  const [adoBusy, setAdoBusy] = useState(false);
  const [adoError, setAdoError] = useState(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={save} disabled={saving || !isDirty} style={{
              padding: '7px 14px', borderRadius: 6, border: 'none',
              backgroundColor: (saving || !isDirty) ? '#cbd5e1' : '#15803d',
              color: 'white', fontWeight: 700, fontSize: 12,
              cursor: (saving || !isDirty) ? 'default' : 'pointer',
              letterSpacing: 0.3,
            }}>
              {saving ? t('redCrossWebQaModule.common.running') : `💾 ${t('redCrossWebQaModule.securityPrivacy.findingSave')}`}
            </button>

            {/* Pack 3 — Send to ADO (idempotent) */}
            {/* Pack 4.2 — ado_is_mock flag distinguishes deterministic mock
                work items (no ADO_PAT in backend env) from real REST-created
                ones. Defaults to `true` on legacy finding docs that
                pre-date Pack 4.2 (no flag persisted yet). */}
            {finding.ado_url ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <a href={finding.ado_url} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px', borderRadius: 6,
                      backgroundColor: '#1d4ed8', color: 'white',
                      fontSize: 11, fontWeight: 700, textDecoration: 'none',
                      letterSpacing: 0.3,
                    }}
                    title={t('redCrossWebQaModule.securityPrivacy.findingAdoLinkTitle')}>
                  🎯 ADO #{finding.ado_work_item_id}
                </a>
                <span
                  title={t(finding.ado_is_mock === false
                    ? 'redCrossWebQaModule.securityPrivacy.findingAdoLiveTitle'
                    : 'redCrossWebQaModule.securityPrivacy.findingAdoMockTitle')}
                  style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 6px',
                    borderRadius: 999, letterSpacing: 0.5,
                    backgroundColor: finding.ado_is_mock === false ? '#dcfce7' : '#fef3c7',
                    color: finding.ado_is_mock === false ? '#166534' : '#92400e',
                    border: `1px solid ${finding.ado_is_mock === false ? '#86efac' : '#fcd34d'}`,
                  }}>
                  {finding.ado_is_mock === false
                    ? t('redCrossWebQaModule.securityPrivacy.findingAdoLiveBadge')
                    : t('redCrossWebQaModule.securityPrivacy.findingAdoMockBadge')}
                </span>
              </span>
            ) : (
              <button
                onClick={async () => {
                  setAdoBusy(true); setAdoError(null);
                  try {
                    const r = await securityApi.dispatchAdo(finding.id);
                    if (onPatched) onPatched({
                      ...finding,
                      ado_url: r.ado_url,
                      ado_work_item_id: r.ado_work_item_id,
                      ado_work_item_type: r.work_item_type,
                      ado_dispatched_at: r.dispatched_at,
                      // Pack 4.2 — carry the MOCK/LIVE marker forward so the
                      // badge renders without a refetch.
                      ado_is_mock: r.is_mock !== false,
                    });
                  } catch (e) {
                    setAdoError(String(e.message || e));
                  } finally {
                    setAdoBusy(false);
                  }
                }}
                disabled={adoBusy}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: '1px solid #1d4ed8',
                  backgroundColor: adoBusy ? '#dbeafe' : 'white',
                  color: '#1d4ed8', fontWeight: 700, fontSize: 11, cursor: adoBusy ? 'default' : 'pointer',
                  letterSpacing: 0.3,
                }}
                title={t('redCrossWebQaModule.securityPrivacy.findingDispatchAdoTitle')}
              >
                {adoBusy ? t('redCrossWebQaModule.common.running')
                          : `🎯 ${t('redCrossWebQaModule.securityPrivacy.findingDispatchAdo')}`}
              </button>
            )}

            {/* Pack 3 — Verify-fix (only meaningful when status is 'fixed') */}
            {finding.status === 'fixed' && (
              <button
                onClick={async () => {
                  setVerifyBusy(true); setVerifyError(null);
                  try {
                    const r = await securityApi.verify(finding.id);
                    if (onPatched && r?.finding) onPatched(r.finding);
                  } catch (e) {
                    setVerifyError(String(e.message || e));
                  } finally {
                    setVerifyBusy(false);
                  }
                }}
                disabled={verifyBusy}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: '1px solid #047857',
                  backgroundColor: verifyBusy ? '#d1fae5' : 'white',
                  color: '#047857', fontWeight: 700, fontSize: 11, cursor: verifyBusy ? 'default' : 'pointer',
                  letterSpacing: 0.3,
                }}
                title={t('redCrossWebQaModule.securityPrivacy.findingVerifyTitle')}
              >
                {verifyBusy ? t('redCrossWebQaModule.common.running')
                              : `✅ ${t('redCrossWebQaModule.securityPrivacy.findingVerify')}`}
              </button>
            )}

            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
              {t('redCrossWebQaModule.securityPrivacy.updatedAt')}: {formatTimestamp(finding.updated_at)}
              {finding.updated_by && ` · ${finding.updated_by}`}
            </span>
          </div>
          {(adoError || verifyError) && (
            <div style={{
              padding: '8px 10px', borderRadius: 6, fontSize: 12,
              backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
            }}>{adoError || verifyError}</div>
          )}

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
