import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const STATUS_STYLES = {
  pass: { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn: { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  running: { bg: '#dbeafe', fg: '#1d4ed8', border: '#93c5fd' },
};

const Runs = ({ environment }) => {
  const { t } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/runs?environment=${environment}`);
        const data = await res.json();
        setRuns(Array.isArray(data.runs) ? data.runs : []);
      } catch { setRuns([]); }
      finally { setLoading(false); }
    })();
  }, [environment]);

  const counts = runs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="📜"
          title={t('redCrossWebQaModule.runs.header')}
          subtitle={t('redCrossWebQaModule.runs.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #334155 0%, #475569 50%, #1e293b 100%)"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <StatCard label={t('redCrossWebQaModule.runs.totalRuns') || 'Total runs'} value={runs.length} color="#1e293b" />
          <StatCard label={t('redCrossWebQaModule.common.statusPass')} value={counts.pass || 0} color="#047857" />
          <StatCard label={t('redCrossWebQaModule.common.statusWarn')} value={counts.warn || 0} color="#92400e" />
          <StatCard label={t('redCrossWebQaModule.common.statusFail')} value={counts.fail || 0} color="#b91c1c" />
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>📋 {t('redCrossWebQaModule.runs.history') || 'History'}</h3>
          {loading ? (
            <p style={empty}>{t('redCrossWebQaModule.common.loading')}</p>
          ) : runs.length === 0 ? (
            <p style={empty}>{t('redCrossWebQaModule.common.noData')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>{t('redCrossWebQaModule.runs.runId')}</th>
                    <th style={th}>{t('redCrossWebQaModule.runs.suite')}</th>
                    <th style={th}>{t('redCrossWebQaModule.runs.startedAt')}</th>
                    <th style={th}>{t('redCrossWebQaModule.runs.endedAt')}</th>
                    <th style={th}>{t('redCrossWebQaModule.common.status')}</th>
                    <th style={th}>{t('redCrossWebQaModule.runs.summary')}</th>
                    <th style={th}>{t('redCrossWebQaModule.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r, idx) => {
                    const s = STATUS_STYLES[r.status] || STATUS_STYLES.warn;
                    return (
                      <tr key={r.run_id} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#475569' }}>{r.run_id}</td>
                        <td style={{ ...td, fontWeight: 600, color: '#1e293b' }}>{r.suite}</td>
                        <td style={{ ...td, fontSize: 11, color: '#64748b' }}>{r.started_at}</td>
                        <td style={{ ...td, fontSize: 11, color: '#64748b' }}>{r.ended_at || '—'}</td>
                        <td style={td}>
                          <span style={{
                            padding: '2px 10px', borderRadius: 999,
                            backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}`,
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          }}>{r.status}</span>
                        </td>
                        <td style={{ ...td, fontSize: 12, color: '#475569' }}>{r.summary || '—'}</td>
                        <td style={td}>
                          <button onClick={() => setSelected(r)} style={detailBtn}>
                            {t('redCrossWebQaModule.common.details')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                🔍 Run details — <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{selected.run_id}</span>
              </h3>
              <button onClick={() => setSelected(null)} style={closeBtn}>
                ✕ {t('redCrossWebQaModule.common.cancel')}
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <DetailRow label={t('redCrossWebQaModule.runs.suite')} value={selected.suite} />
              <DetailRow label={t('redCrossWebQaModule.runs.startedAt')} value={selected.started_at} mono />
              <DetailRow label={t('redCrossWebQaModule.runs.endedAt')} value={selected.ended_at || '—'} mono />
              <DetailRow label={t('redCrossWebQaModule.common.status')} value={selected.status} />
              {selected.summary && <DetailRow label={t('redCrossWebQaModule.runs.summary')} value={selected.summary} />}

              {selected.attestation_hash && (
                <div style={{
                  padding: 12, borderRadius: 10,
                  backgroundColor: '#0f172a', color: '#86efac',
                  fontFamily: 'ui-monospace, monospace', fontSize: 11, wordBreak: 'break-all',
                }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                    {t('redCrossWebQaModule.runs.attestationHash')}
                  </div>
                  {selected.attestation_hash}
                </div>
              )}

              {Array.isArray(selected.artifacts) && selected.artifacts.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4, marginBottom: 8 }}>
                    {t('redCrossWebQaModule.runs.artifacts')} ({selected.artifacts.length})
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {selected.artifacts.map((a, i) => (
                      <div key={i} style={{
                        padding: '8px 12px', borderRadius: 8,
                        backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                        fontSize: 12, color: '#334155',
                      }}>
                        📎 {typeof a === 'string' ? a : (a.name || JSON.stringify(a))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: 12, padding: 18,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
  }}>
    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 6, lineHeight: 1 }}>{value}</div>
  </div>
);

const DetailRow = ({ label, value, mono }) => (
  <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
    <div style={{ minWidth: 120, color: '#64748b', fontWeight: 500 }}>{label}</div>
    <div style={{ color: '#1e293b', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', fontSize: mono ? 12 : 13 }}>{value}</div>
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const empty = { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '24px 0', margin: 0 };
const th = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4,
  backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0',
};
const td = { padding: '10px 12px', borderBottom: '1px solid #e2e8f0' };
const detailBtn = {
  padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
  backgroundColor: 'white', color: '#2563eb', fontSize: 12, fontWeight: 600,
  cursor: 'pointer',
};
const closeBtn = {
  padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc', color: '#64748b', fontSize: 12, cursor: 'pointer',
};

export default Runs;
