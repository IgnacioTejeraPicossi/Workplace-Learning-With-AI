import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = 'http://localhost:8000/api/red-cross-qa';

const SCOPES = [
  { key: 'donation',       icon: '💝' },
  { key: 'volunteer',      icon: '🙋' },
  { key: 'cms-editorial',  icon: '📝' },
  { key: 'search',         icon: '🔎' },
  { key: 'forms',          icon: '📑' },
  { key: 'beredskap',      icon: '🚨' },
];

// UAT signoff stakeholders — the 3 business-side approvers per the
// official 'Roller og ansvar' document (Phase H+ 2026-05-28: Astri's full
// name corrected to 'Astri M.M. Fretheim', role labels mapped to i18n keys).
const STAKEHOLDERS = ['Hilde Forslund', 'Trine Røsand Scheen', 'Astri M.M. Fretheim'];

const ROLE_KEY_BY_NAME = {
  'Hilde Forslund': 'poInntektCrm',
  'Trine Røsand Scheen': 'poFrivillighetCrm',
  'Astri M.M. Fretheim': 'tilgangsstyringFrivillighet',
};

// Reverse lookup for backend-provided role labels (in Norwegian, per the
// official 'Roller og ansvar' document). Used to localize the role column
// of signoff_form.lines[] when the user runs the app in EN or ES. When the
// label is not recognized (e.g. backend evolves with a new role), we fall
// back to rendering the raw label as-is.
const ROLE_KEY_BY_LABEL = {
  'Produkteier Inntekt CRM': 'poInntektCrm',
  'Produkteier Frivillighet CRM': 'poFrivillighetCrm',
  'Tilgangsstyring frivillighet': 'tilgangsstyringFrivillighet',
  // Defensive: pre-2026-05-28 historic labels (in case old runs are replayed)
  'Produkteier': 'poInntektCrm',
  'Fagperson': 'poFrivillighetCrm',
};

const DECISION_COLOR = {
  godkjent: { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  'ikke godkjent': { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  'godkjent med merknader': { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const UatSupport = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [scopes, setScopes] = useState(['donation', 'volunteer', 'cms-editorial']);
  const [stakeholders, setStakeholders] = useState(STAKEHOLDERS);
  const [sprintName, setSprintName] = useState('');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const toggleScope = (s) => setScopes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleStakeholder = (n) =>
    setStakeholders(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  const handleRun = async () => {
    setRunning(true);
    setReport(null);
    try {
      const res = await fetch(`${API}/generate-uat-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopes, stakeholders,
          sprint_name: sprintName || null,
          environment, lang: i18n.language,
        }),
      });
      setReport(await res.json());
    } catch {
      setReport({ status: 'error', message: 'Network error' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="✅"
          title={t('redCrossWebQaModule.uatSupport.header')}
          subtitle={t('redCrossWebQaModule.uatSupport.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #15803d 0%, #16a34a 50%, #65a30d 100%)"
        />

        <AiUsagePolicy variant="compact" />

        <div style={panel}>
          <h3 style={panelTitle}>🎯 {t('redCrossWebQaModule.uatSupport.scopes')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
            {SCOPES.map(s => {
              const active = scopes.includes(s.key);
              return (
                <label key={s.key} onClick={() => toggleScope(s.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: active ? '#dcfce7' : '#f8fafc',
                  border: `1px solid ${active ? '#86efac' : '#e2e8f0'}`,
                  fontSize: 13, color: active ? '#15803d' : '#475569',
                  fontWeight: active ? 600 : 500,
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span>{t(`redCrossWebQaModule.uatSupport.scope_${s.key.replace('-', '_')}`)}</span>
                </label>
              );
            })}
          </div>

          <h3 style={panelTitle}>👥 {t('redCrossWebQaModule.uatSupport.stakeholders')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
            {STAKEHOLDERS.map(n => {
              const active = stakeholders.includes(n);
              return (
                <label key={n} onClick={() => toggleStakeholder(n)} style={{
                  display: 'flex', flexDirection: 'column', gap: 2,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: active ? '#dcfce7' : '#f8fafc',
                  border: `1px solid ${active ? '#86efac' : '#e2e8f0'}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#15803d' : '#1e293b' }}>{n}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {ROLE_KEY_BY_NAME[n] ? t(`redCrossWebQaModule.stakeholders.roles.${ROLE_KEY_BY_NAME[n]}`) : ''}
                  </span>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              placeholder={t('redCrossWebQaModule.uatSupport.sprintNamePlaceholder')}
              style={{
                flex: '1 1 220px', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 13,
              }}
            />
            <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
              {running ? t('redCrossWebQaModule.common.generating')
                       : t('redCrossWebQaModule.uatSupport.btnGenerate')}
            </button>
          </div>
        </div>

        {Array.isArray(report?.uat_scripts) && report.uat_scripts.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>📝 {t('redCrossWebQaModule.uatSupport.scripts')} ({report.uat_scripts.length})</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              {report.uat_scripts.map((sc, i) => (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 10,
                  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div>
                      <span style={scriptIdPill}>{sc.script_id}</span>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>{sc.title}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={metaPill}>{sc.stakeholder}</span>
                      <span style={metaPill}>{sc.scope}</span>
                      {sc.estimated_minutes ? <span style={metaPill}>{sc.estimated_minutes} min</span> : null}
                    </div>
                  </div>
                  {Array.isArray(sc.preconditions) && sc.preconditions.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                      <strong>{t('redCrossWebQaModule.uatSupport.preconditions')}:</strong> {sc.preconditions.join(' · ')}
                    </div>
                  )}
                  {Array.isArray(sc.steps) && (
                    <ol style={{ marginTop: 8, paddingLeft: 20, fontSize: 13, color: '#334155' }}>
                      {sc.steps.map((st, j) => (
                        <li key={j} style={{ marginBottom: 4 }}>
                          <strong>{st.action}</strong>
                          {st.expected ? <span style={{ color: '#475569' }}> → {st.expected}</span> : null}
                        </li>
                      ))}
                    </ol>
                  )}
                  {Array.isArray(sc.acceptance_criteria) && sc.acceptance_criteria.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#15803d' }}>
                      <strong>{t('redCrossWebQaModule.uatSupport.acceptanceCriteria')}:</strong>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                        {sc.acceptance_criteria.map((a, k) => <li key={k}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(report?.checklists) && report.checklists.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>☑️ {t('redCrossWebQaModule.uatSupport.checklists')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {report.checklists.map((c, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>{c.stakeholder}</div>
                  {Array.isArray(c.items) && c.items.map((it, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', padding: '4px 0' }}>
                      <span style={{ color: it.required ? '#dc2626' : '#94a3b8' }}>
                        {it.required ? '●' : '○'}
                      </span>
                      <span>{it.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {report?.signoff_form && Array.isArray(report.signoff_form.lines) && (
          <div style={panel}>
            <h3 style={panelTitle}>🖊️ {t('redCrossWebQaModule.uatSupport.signoffForm')}</h3>
            <div style={{ marginBottom: 12, fontSize: 12, color: '#64748b' }}>
              <strong>Sprint:</strong> {report.signoff_form.sprint || '—'}
              {report.signoff_form.build_attestation && (
                <span style={{ marginLeft: 14 }}><strong>Build:</strong> <code style={{ fontSize: 11 }}>{report.signoff_form.build_attestation}</code></span>
              )}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={th}>{t('redCrossWebQaModule.uatSupport.role')}</th>
                  <th style={th}>{t('redCrossWebQaModule.uatSupport.name')}</th>
                  <th style={th}>{t('redCrossWebQaModule.uatSupport.decision')}</th>
                  <th style={th}>{t('redCrossWebQaModule.uatSupport.comment')}</th>
                </tr>
              </thead>
              <tbody>
                {report.signoff_form.lines.map((ln, i) => {
                  const c = DECISION_COLOR[(ln.decision || 'pending').toLowerCase()] || DECISION_COLOR.pending;
                  const roleKey = ROLE_KEY_BY_LABEL[ln.role];
                  const roleLabel = roleKey
                    ? t(`redCrossWebQaModule.stakeholders.roles.${roleKey}`)
                    : (ln.role || '');
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td} title={ln.role !== roleLabel ? ln.role : undefined}>{roleLabel}</td>
                      <td style={td}><strong>{ln.name}</strong></td>
                      <td style={td}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}`,
                          textTransform: 'uppercase',
                        }}>{ln.decision || 'pending'}</span>
                      </td>
                      <td style={td}>{ln.comment || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {Array.isArray(report?.support_notes) && report.support_notes.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>💬 {t('redCrossWebQaModule.uatSupport.supportNotes')}</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569' }}>
              {report.support_notes.map((n, i) => <li key={i} style={{ marginBottom: 4 }}>{n}</li>)}
            </ul>
          </div>
        )}

        {report?.status === 'error' && <div style={errorBox}>{report.message}</div>}
      </div>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#86efac' : '#15803d', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const scriptIdPill = {
  display: 'inline-block', marginRight: 10, padding: '2px 8px', borderRadius: 6,
  backgroundColor: '#15803d', color: 'white', fontSize: 11, fontWeight: 700,
  fontFamily: 'ui-monospace, monospace',
};
const metaPill = {
  padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
  backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
};
const th = { padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' };
const td = { padding: '8px 12px', color: '#334155' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default UatSupport;
