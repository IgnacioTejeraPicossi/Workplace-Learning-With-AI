import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const ROLE_COLORS = {
  Administrator:     '#7c3aed',
  Eier:              '#dc2626',
  'Lokal eier':      '#ea580c',
  Redaktør:          '#2563eb',
  'Lokal redaktør':  '#0891b2',
  Bidragsyter:       '#10b981',
};

const CHECKS = [
  { key: 'checkSubtreeIsolation',    icon: '🌳' },
  { key: 'checkPublishGuard',        icon: '🚀' },
  { key: 'checkDeleteGuard',         icon: '🗑️' },
  { key: 'checkRoleAssignmentGuard', icon: '🎭' },
  { key: 'checkAuditLog',            icon: '📜' },
  { key: 'checkSessionExpiry',       icon: '⏰' },
  { key: 'checkPrivilegeEscalation', icon: '⬆️' },
  { key: 'checkApiAuthZ',            icon: '🔌' },
  // Phase H+ (Enonic skill 0.1.0) — three role-layer checks aligned with the
  // skill's most-cited sections (security-patterns §2 + §1, reliability §4).
  { key: 'checkRepositoryAcl',              icon: '🏰' },
  { key: 'checkNoQLInjectionInRoleQueries', icon: '💉' },
  { key: 'checkRoleCacheStaleness',         icon: '🕰️' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};
const SEV_COLOR = { critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

const ACTIONS = ['read', 'edit', 'publish', 'delete'];

const cellStyle = (decision) => ({
  textAlign: 'center', padding: '8px 10px',
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: decision === 'allow' ? '#d1fae5' : decision === 'deny' ? '#fee2e2' : 'white',
  color: decision === 'allow' ? '#047857' : decision === 'deny' ? '#b91c1c' : '#94a3b8',
});

const RoleMatrix = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-role-matrix-audit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🔐"
          title={t('redCrossWebQaModule.roleMatrix.header')}
          subtitle={t('redCrossWebQaModule.roleMatrix.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #831843 0%, #be185d 50%, #7c3aed 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>👥 {t('redCrossWebQaModule.roleMatrix.rolesTitle')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {Object.entries(ROLE_COLORS).map(([r, color]) => (
              <span key={r} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                backgroundColor: `${color}15`, color, border: `1px solid ${color}40`,
              }}>{r}</span>
            ))}
          </div>
          <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
            {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.roleMatrix.btnRun')}
          </button>
        </div>

        {Array.isArray(report?.matrix) && report.matrix.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🗂️ {t('redCrossWebQaModule.roleMatrix.matrixTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.matrix.length})</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>{t('redCrossWebQaModule.roleMatrix.role')}</th>
                    <th style={th}>{t('redCrossWebQaModule.roleMatrix.scope')}</th>
                    {ACTIONS.map(a => (
                      <th key={a} style={{ ...th, textAlign: 'center' }}>
                        {t(`redCrossWebQaModule.roleMatrix.action_${a}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.matrix.map((row, i) => {
                    const color = ROLE_COLORS[row.role] || '#64748b';
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ ...td, fontWeight: 600 }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 999,
                            backgroundColor: `${color}15`, color, border: `1px solid ${color}40`,
                            fontSize: 12, fontWeight: 600,
                          }}>{row.role}</span>
                        </td>
                        <td style={{ ...td, fontSize: 12, color: '#475569', fontStyle: 'italic' }}>{row.scope}</td>
                        {ACTIONS.map(a => (
                          <td key={a} style={cellStyle(row[a])}>{row[a] || '—'}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={panel}>
          <h3 style={panelTitle}>🔍 {t('redCrossWebQaModule.roleMatrix.checksTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {CHECKS.map(c => {
              const item = report?.checks?.[c.key];
              const status = item?.status || 'pending';
              const s = STATUS_STYLES[status];
              return (
                <div key={c.key} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      {t(`redCrossWebQaModule.roleMatrix.${c.key}`)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                  </div>
                  {item?.note && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>{item.note}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {Array.isArray(report?.violations) && report.violations.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🚨 {t('redCrossWebQaModule.roleMatrix.violationsTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.violations.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.violations.map((v, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: SEV_COLOR[v.severity] || '#64748b',
                    }}>{v.severity}</span>
                    {v.role && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: `${ROLE_COLORS[v.role] || '#64748b'}15`,
                        color: ROLE_COLORS[v.role] || '#64748b',
                        border: `1px solid ${ROLE_COLORS[v.role] || '#64748b'}40`,
                        fontSize: 10, fontWeight: 700,
                      }}>{v.role}</span>
                    )}
                    {v.action && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: '#1e293b', color: 'white',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>{v.action}</span>
                    )}
                    {v.scope && <span style={{ fontSize: 12, color: '#64748b' }}>· {v.scope}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#1e293b' }}>
                    {t('redCrossWebQaModule.roleMatrix.expected')}:{' '}
                    <strong style={{ color: '#047857' }}>{v.expected}</strong>
                    {' · '}
                    {t('redCrossWebQaModule.roleMatrix.actual')}:{' '}
                    <strong style={{ color: '#b91c1c' }}>{v.actual}</strong>
                  </div>
                  {v.fix_hint && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#be185d', fontStyle: 'italic' }}>
                      💡 {v.fix_hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(report?.test_cases) && report.test_cases.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🧪 {t('redCrossWebQaModule.roleMatrix.testCasesTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.test_cases.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.test_cases.map((tc, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    {tc.role && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: `${ROLE_COLORS[tc.role] || '#64748b'}15`,
                        color: ROLE_COLORS[tc.role] || '#64748b',
                        border: `1px solid ${ROLE_COLORS[tc.role] || '#64748b'}40`,
                        fontSize: 10, fontWeight: 700,
                      }}>{tc.role}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{tc.title}</strong>
                    {tc.tool && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: '#be185d15', color: '#be185d', border: '1px solid #be185d40',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>{tc.tool}</span>
                    )}
                  </div>
                  {Array.isArray(tc.steps) && tc.steps.length > 0 && (
                    <ol style={{ margin: '4px 0 4px 20px', padding: 0, fontSize: 12, color: '#64748b' }}>
                      {tc.steps.map((s, j) => <li key={j} style={{ marginBottom: 2 }}>{s}</li>)}
                    </ol>
                  )}
                  {tc.expected && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#047857', fontWeight: 500 }}>
                      ✓ {tc.expected}
                    </p>
                  )}
                </div>
              ))}
            </div>
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
  backgroundColor: disabled ? '#f9a8d4' : '#be185d', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const th = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4,
  backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0',
};
const td = { padding: '10px 12px', borderBottom: '1px solid #e2e8f0' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default RoleMatrix;
