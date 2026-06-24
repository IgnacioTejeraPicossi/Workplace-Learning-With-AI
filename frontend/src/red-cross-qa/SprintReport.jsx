import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = 'http://localhost:8000/api/red-cross-qa';

/**
 * Sprint Report — automated end-of-sprint summary for Trine (Testleder).
 * Per Teststrategi 30.3 §8: "Det skal utarbeides en rapport per sprint
 * med status, identifiserte avvik og anbefalinger."
 *
 * Pulls runs + findings + ADO dispatches for the active sprint, renders
 * a structured report (status / avvik / anbefalinger) with severity
 * (Sev 1-4 utviklingsfase) and category (A-C driftsfase) breakdowns.
 */
const DOD_KEYS = [
  'functionality_tested',
  'integrations_verified',
  'known_bugs_documented',
  'ready_for_uat',
];

const DOD_STATUS_COLOR = {
  pass: { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn: { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
};

const SprintReport = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [sprintName, setSprintName] = useState('');
  const [defaultSprint, setDefaultSprint] = useState('Sprint 1');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // DoD verifier — Trine §6.1
  const [dodLoading, setDodLoading] = useState(false);
  const [dod, setDod] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        if (data.status === 'ok' && data.settings?.current_sprint) {
          setDefaultSprint(data.settings.current_sprint);
        }
      } catch { /* offline */ }
    })();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/generate-sprint-report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sprint_name: sprintName || null,
          environment,
          lang: i18n.language,
        }),
      });
      const data = await res.json();
      setReport(data.status === 'ok' ? data.report : null);
    } catch {
      setReport({ error: 'Network error — backend unavailable' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDod = async () => {
    setDodLoading(true);
    setDod(null);
    try {
      const res = await fetch(`${API}/verify-definition-of-done`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sprint_name: sprintName || null,
          environment,
          lang: i18n.language,
        }),
      });
      const data = await res.json();
      setDod(data.status === 'ok' ? data : { error: data.message || 'DoD failed' });
    } catch {
      setDod({ error: 'Network error — backend unavailable' });
    } finally {
      setDodLoading(false);
    }
  };

  const stats = report?.stats || {};
  const sevDev = stats.severity_dev || { 1: 0, 2: 0, 3: 0, 4: 0 };
  const catOps = stats.category_ops || { A: 0, B: 0, C: 0 };
  const dodSummary = dod?.summary || {};

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="📈"
          title={t('redCrossWebQaModule.sprintReport.header')}
          subtitle={t('redCrossWebQaModule.sprintReport.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)"
        />

        <AiUsagePolicy variant="compact" />

        <div style={panel}>
          <h3 style={panelTitle}>🗓️ {t('redCrossWebQaModule.sprintReport.configTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={lbl}>{t('redCrossWebQaModule.sprintReport.sprintName')}</label>
              <input
                type="text"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder={defaultSprint}
                style={input}
              />
              <p style={hint}>{t('redCrossWebQaModule.sprintReport.sprintHint', { value: defaultSprint })}</p>
            </div>
            <button onClick={handleGenerate} disabled={loading} style={primaryBtn(loading)}>
              {loading
                ? t('redCrossWebQaModule.common.running')
                : `📈 ${t('redCrossWebQaModule.sprintReport.btnGenerate')}`}
            </button>
          </div>
        </div>

        {report?.error && <div style={errorBox}>{report.error}</div>}

        {report && !report.error && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <StatCard label={t('redCrossWebQaModule.sprintReport.totalRuns')} value={stats.total_runs ?? 0} color="#1e293b" />
              <StatCard label={t('redCrossWebQaModule.sprintReport.passRate')} value={`${stats.pass_rate ?? 0}%`} color="#047857" />
              <StatCard label={t('redCrossWebQaModule.sprintReport.warnings')} value={stats.by_status?.warn ?? 0} color="#92400e" />
              <StatCard label={t('redCrossWebQaModule.sprintReport.failures')} value={stats.by_status?.fail ?? 0} color="#b91c1c" />
            </div>

            <div style={panel}>
              <h3 style={panelTitle}>⚠️ {t('redCrossWebQaModule.sprintReport.severityDev')}</h3>
              <p style={hint}>{t('redCrossWebQaModule.sprintReport.severityDevHint')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <SevCard rank="Sev 1" label={t('redCrossWebQaModule.sprintReport.sev1')} count={sevDev[1] || 0} color="#b91c1c" />
                <SevCard rank="Sev 2" label={t('redCrossWebQaModule.sprintReport.sev2')} count={sevDev[2] || 0} color="#dc2626" />
                <SevCard rank="Sev 3" label={t('redCrossWebQaModule.sprintReport.sev3')} count={sevDev[3] || 0} color="#f59e0b" />
                <SevCard rank="Sev 4" label={t('redCrossWebQaModule.sprintReport.sev4')} count={sevDev[4] || 0} color="#10b981" />
              </div>
            </div>

            <div style={panel}>
              <h3 style={panelTitle}>📂 {t('redCrossWebQaModule.sprintReport.categoryOps')}</h3>
              <p style={hint}>{t('redCrossWebQaModule.sprintReport.categoryOpsHint')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <SevCard rank="Kat A" label={t('redCrossWebQaModule.sprintReport.catA')} count={catOps.A || 0} color="#b91c1c" />
                <SevCard rank="Kat B" label={t('redCrossWebQaModule.sprintReport.catB')} count={catOps.B || 0} color="#dc2626" />
                <SevCard rank="Kat C" label={t('redCrossWebQaModule.sprintReport.catC')} count={catOps.C || 0} color="#10b981" />
              </div>
            </div>

            {report.narrative && (
              <div style={panel}>
                <h3 style={panelTitle}>📝 {t('redCrossWebQaModule.sprintReport.narrative')}</h3>
                <div style={{
                  padding: 16, borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                  fontSize: 13, lineHeight: 1.6, color: '#334155',
                  whiteSpace: 'pre-wrap', fontFamily: 'ui-sans-serif, system-ui',
                }}>
                  {report.narrative}
                </div>
              </div>
            )}

            {Array.isArray(report.runs_sample) && report.runs_sample.length > 0 && (
              <div style={panel}>
                <h3 style={panelTitle}>🧪 {t('redCrossWebQaModule.sprintReport.runsSample')} ({report.runs_sample.length})</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {report.runs_sample.map((r, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 8,
                      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                      fontSize: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: r.status === 'pass' ? '#d1fae5' : r.status === 'fail' ? '#fee2e2' : '#fef3c7',
                        color: r.status === 'pass' ? '#047857' : r.status === 'fail' ? '#b91c1c' : '#92400e',
                      }}>{r.status}</span>
                      <strong style={{ color: '#1e293b' }}>{r.suite}</strong>
                      <span style={{ color: '#64748b' }}>{r.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(report.dispatches) && report.dispatches.length > 0 && (
              <div style={panel}>
                <h3 style={panelTitle}>🎯 {t('redCrossWebQaModule.sprintReport.dispatches')} ({report.dispatches.length})</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {report.dispatches.map((d, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', borderRadius: 8,
                      backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                      fontSize: 12, color: '#334155',
                    }}>
                      <strong>{d.destination}</strong> — {d.items} {t('redCrossWebQaModule.sprintReport.workItems')} ({d.status})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Definition of Done verifier — Trine §6.1 ── */}
        <div style={{ ...panel, borderTop: '3px solid #0891b2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>
              ✅ {t('redCrossWebQaModule.dod.header')}
            </h3>
            <button onClick={handleVerifyDod} disabled={dodLoading} style={dodBtn(dodLoading)}>
              {dodLoading ? t('redCrossWebQaModule.common.running')
                          : t('redCrossWebQaModule.dod.btnVerify')}
            </button>
          </div>
          <p style={hint}>{t('redCrossWebQaModule.dod.subheader')}</p>

          {dod?.error && <div style={errorBox}>{dod.error}</div>}

          {dod && !dod.error && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12, marginBottom: 16 }}>
                <DodStat label={t('redCrossWebQaModule.dod.totalItems')}    value={dodSummary.total_work_items || 0} color="#0e7490" />
                <DodStat label={t('redCrossWebQaModule.dod.dodPass')}       value={dodSummary.dod_pass || 0}        color="#047857" />
                <DodStat label={t('redCrossWebQaModule.dod.dodPartial')}    value={dodSummary.dod_partial || 0}     color="#92400e" />
                <DodStat label={t('redCrossWebQaModule.dod.dodFail')}       value={dodSummary.dod_fail || 0}        color="#b91c1c" />
                <DodStat label={t('redCrossWebQaModule.dod.readyForUat')}   value={dodSummary.ready_for_uat || 0}   color="#1d4ed8" />
                <DodStat label={t('redCrossWebQaModule.dod.blockersOpen')}  value={dodSummary.blockers_open || 0}   color="#b91c1c" />
              </div>

              {Array.isArray(dod.items) && dod.items.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                        <th style={th}>{t('redCrossWebQaModule.dod.workItem')}</th>
                        <th style={th}>{t('redCrossWebQaModule.dod.functionalityTested')}</th>
                        <th style={th}>{t('redCrossWebQaModule.dod.integrationsVerified')}</th>
                        <th style={th}>{t('redCrossWebQaModule.dod.knownBugsDocumented')}</th>
                        <th style={th}>{t('redCrossWebQaModule.dod.readyForUatCol')}</th>
                        <th style={th}>{t('redCrossWebQaModule.dod.dodOverall')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dod.items.map((it, i) => {
                        const overall = (it.dod_status || 'fail').toLowerCase();
                        const c = DOD_STATUS_COLOR[overall] || DOD_STATUS_COLOR.fail;
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={td}>
                              <strong>{it.work_item_id || it.id || `WI-${i + 1}`}</strong>
                              {it.title && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{it.title}</div>}
                            </td>
                            {DOD_KEYS.map(k => (
                              <td key={k} style={tdCenter}>
                                <DodCheckIcon value={it.checklist?.[k]} />
                              </td>
                            ))}
                            <td style={td}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}`,
                                textTransform: 'uppercase',
                              }}>{overall}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {dod.narrative && (
                <div style={{
                  marginTop: 16, padding: 14, borderRadius: 10,
                  backgroundColor: '#ecfeff', border: '1px solid #a5f3fc',
                  fontSize: 12, lineHeight: 1.6, color: '#0e7490',
                  whiteSpace: 'pre-wrap',
                }}>
                  {dod.narrative}
                </div>
              )}
            </>
          )}
        </div>
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

const DodStat = ({ label, value, color }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: 10, padding: 12,
    border: `1px solid ${color}30`,
  }}>
    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4, lineHeight: 1 }}>{value}</div>
  </div>
);

const DodCheckIcon = ({ value }) => {
  if (value === true || value === 'pass') {
    return <span style={{ color: '#047857', fontSize: 16, fontWeight: 700 }}>✓</span>;
  }
  if (value === false || value === 'fail') {
    return <span style={{ color: '#b91c1c', fontSize: 16, fontWeight: 700 }}>✗</span>;
  }
  return <span style={{ color: '#94a3b8', fontSize: 14 }}>—</span>;
};

const SevCard = ({ rank, label, count, color }) => (
  <div style={{
    padding: 14, borderRadius: 10,
    backgroundColor: `${color}10`, border: `1px solid ${color}30`,
  }}>
    <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{rank}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginTop: 4, lineHeight: 1 }}>{count}</div>
    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</div>
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const lbl = { display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 };
const input = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: 13, outline: 'none',
};
const hint = { fontSize: 11, color: '#94a3b8', margin: '6px 0 0' };
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#cbd5e1' : '#16a34a', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
  whiteSpace: 'nowrap',
});
const dodBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#a5f3fc' : '#0891b2', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
  whiteSpace: 'nowrap',
});
const th = { padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' };
const td = { padding: '8px 12px', color: '#334155' };
const tdCenter = { padding: '8px 12px', color: '#334155', textAlign: 'center' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default SprintReport;
