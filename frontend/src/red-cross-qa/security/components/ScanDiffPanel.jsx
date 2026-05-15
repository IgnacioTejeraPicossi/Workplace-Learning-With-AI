import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { securityApi } from '../api';
import {
  panel, panelTitle, hint, ghostBtn, SEV_COLOR, formatTimestamp, errorBox,
} from '../tokens';

/**
 * Pack 3 — scan-run diff panel.
 *
 * Renders a 4-column comparison between two scan runs:
 *   • NEW         — findings created in (from, to] window
 *   • FIXED       — findings closed in the window
 *   • REGRESSED   — were closed before, now re-opened
 *   • PERSISTED   — open in both runs
 *
 * The parent passes the history array so the user can pick a "from" scan
 * via dropdown; "to" defaults to the newest run.
 */
const BUCKETS = [
  { key: 'new',       color: '#b91c1c', label: 'NEW',       icon: '🆕' },
  { key: 'regressed', color: '#dc2626', label: 'REGRESSED', icon: '↩️' },
  { key: 'fixed',     color: '#047857', label: 'FIXED',     icon: '✅' },
  { key: 'persisted', color: '#64748b', label: 'PERSISTED', icon: '➡️' },
];

export default function ScanDiffPanel({ history, environment }) {
  const { t } = useTranslation();
  const [fromScanId, setFromScanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diff, setDiff] = useState(null);

  const runDiff = async (fromId = fromScanId) => {
    setLoading(true); setError(null);
    try {
      const res = await securityApi.diff({
        fromScan: fromId || null,
        toScan: null,
        environment,
      });
      setDiff(res);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Auto-run diff on mount whenever history changes meaningfully.
  // Compute keys outside the effect so the dep array is primitive.
  const historySig = (history || []).map(h => h.id).join(',');
  useEffect(() => {
    if ((history || []).length >= 2) {
      runDiff('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySig, environment]);

  const runs = history || [];
  const canDiff = runs.length >= 2;

  return (
    <div style={{ ...panel, borderTop: '4px solid #1d4ed8' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 6,
      }}>
        <h3 style={{ ...panelTitle, margin: 0 }}>
          🔀 {t('redCrossWebQaModule.securityPrivacy.diffTitle')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
            {t('redCrossWebQaModule.securityPrivacy.diffFromLabel')}:
          </label>
          <select value={fromScanId} onChange={(e) => setFromScanId(e.target.value)}
                   style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}>
            <option value="">{t('redCrossWebQaModule.securityPrivacy.diffAutoPrevious')}</option>
            {runs.slice(1).map(r => (
              <option key={r.id} value={r.id}>
                {(r.id || '').slice(0, 18)} — {formatTimestamp(r.finished_at)}
              </option>
            ))}
          </select>
          <button onClick={() => runDiff()} disabled={loading || !canDiff} style={ghostBtn('#1d4ed8')}>
            {loading ? t('redCrossWebQaModule.common.running')
                      : `🔀 ${t('redCrossWebQaModule.securityPrivacy.diffRefresh')}`}
          </button>
        </div>
      </div>
      <p style={hint}>{t('redCrossWebQaModule.securityPrivacy.diffHint')}</p>

      {!canDiff && (
        <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
          {t('redCrossWebQaModule.securityPrivacy.diffNeedTwoRuns')}
        </p>
      )}

      {error && <div style={errorBox}>{error}</div>}

      {diff && diff.summary && (
        <>
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 8,
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
            color: '#1e3a8a', fontSize: 13, fontWeight: 600,
          }}>
            ℹ️ {diff.summary}
            <span style={{
              marginLeft: 12, fontSize: 11, color: '#64748b', fontWeight: 400,
            }}>
              Δ pass: {diff.counts_delta?.pass ?? 0} ·
              Δ warn: {diff.counts_delta?.warn ?? 0} ·
              Δ fail: {diff.counts_delta?.fail ?? 0}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {BUCKETS.map(b => (
              <DiffBucket key={b.key}
                          bucket={b}
                          items={diff.findings?.[b.key] || []}
                          t={t} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DiffBucket({ bucket, items, t }) {
  return (
    <div style={{
      padding: 12, borderRadius: 10,
      backgroundColor: `${bucket.color}08`,
      border: `1px solid ${bucket.color}30`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: bucket.color, letterSpacing: 0.4 }}>
          {bucket.icon} {t(`redCrossWebQaModule.securityPrivacy.diffBucket_${bucket.key}`)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          backgroundColor: 'white', color: bucket.color,
          border: `1px solid ${bucket.color}40`,
        }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
          {t('redCrossWebQaModule.securityPrivacy.diffBucketEmpty')}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {items.slice(0, 10).map((f) => (
            <div key={f.id} style={{
              padding: '6px 8px', borderRadius: 6,
              backgroundColor: 'white', border: '1px solid #e2e8f0',
              fontSize: 11,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 999,
                  backgroundColor: SEV_COLOR[f.severity] || '#64748b',
                  color: 'white', textTransform: 'uppercase',
                }}>{f.severity || 'info'}</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{f.title}</span>
              </div>
              <code style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 10,
                color: '#64748b',
              }}>{f.check_id}</code>
            </div>
          ))}
          {items.length > 10 && (
            <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
              {t('redCrossWebQaModule.securityPrivacy.diffBucketMore', { count: items.length - 10 })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
