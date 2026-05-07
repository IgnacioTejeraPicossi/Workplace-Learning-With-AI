import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  { key: 'checkPersonalData',   icon: '👤' }, { key: 'checkDataSeparation', icon: '🔀' },
  { key: 'checkAuth',           icon: '🔐' }, { key: 'checkHeaders',        icon: '📋' },
  { key: 'checkOwasp',          icon: '🛡️' }, { key: 'checkFormAbuse',      icon: '📝' },
  { key: 'checkApiAbuse',       icon: '🔌' }, { key: 'checkRateLimit',      icon: '🚦' },
  { key: 'checkSecrets',        icon: '🔑' }, { key: 'checkDeps',           icon: '📦' },
  { key: 'checkLogging',        icon: '📜' }, { key: 'checkConsent',        icon: '🍪' },
  { key: 'checkGdpr',           icon: '⚖️' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};
const SEV_COLOR = { critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

const SecurityPrivacy = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  // DPIA / Privacy by Design — Trine §6.x + GDPR Art. 25/35
  const [dpiaRunning, setDpiaRunning] = useState(false);
  const [dpia, setDpia] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-security-scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const handleDpia = async () => {
    setDpiaRunning(true); setDpia(null);
    try {
      const res = await fetch(`${API}/run-dpia-check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setDpia(await res.json());
    } catch { setDpia({ status: 'error', message: 'Network error' }); }
    finally { setDpiaRunning(false); }
  };

  const dpiaScore = dpia?.dpia_score ?? null;
  const dpiaScoreColor =
    dpiaScore == null ? '#64748b' :
    dpiaScore >= 80   ? '#047857' :
    dpiaScore >= 60   ? '#f59e0b' : '#b91c1c';

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🛡️"
          title={t('redCrossWebQaModule.securityPrivacy.header')}
          subtitle={t('redCrossWebQaModule.securityPrivacy.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🔒 OWASP + Privacy checks</h3>
          <button onClick={handleRun} disabled={running} style={{ ...primaryBtn(running), marginBottom: 18 }}>
            {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.securityPrivacy.btnRun')}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
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
                      {t(`redCrossWebQaModule.securityPrivacy.${c.key}`)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                  </div>
                  {item?.note && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>{item.note}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {Array.isArray(report?.findings) && report.findings.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🔎 Findings <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.findings.length})</span></h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {report.findings.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                  fontSize: 13, color: '#334155',
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, color: 'white',
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    backgroundColor: SEV_COLOR[f.severity] || '#64748b',
                  }}>{f.severity}</span>
                  <span><strong>{f.title}</strong>{f.message ? ` — ${f.message}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report?.status === 'error' && <div style={errorBox}>{report.message}</div>}

        {/* ── DPIA / Innebygget personvern (Trine §6.x + GDPR Art. 25/35) ── */}
        <div style={{ ...panel, borderTop: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>
              ⚖️ {t('redCrossWebQaModule.dpia.header')}
            </h3>
            {dpiaScore != null && (
              <div style={{
                padding: '6px 14px', borderRadius: 999,
                backgroundColor: `${dpiaScoreColor}15`, border: `1px solid ${dpiaScoreColor}50`,
                color: dpiaScoreColor, fontSize: 12, fontWeight: 700,
              }}>
                {t('redCrossWebQaModule.dpia.score')}: {dpiaScore}/100
              </div>
            )}
          </div>
          <p style={hint}>{t('redCrossWebQaModule.dpia.subheader')}</p>
          <button onClick={handleDpia} disabled={dpiaRunning} style={{ ...dpiaBtn(dpiaRunning), marginBottom: 18 }}>
            {dpiaRunning ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.dpia.btnRun')}
          </button>

          {Array.isArray(dpia?.checks) && dpia.checks.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginBottom: 18 }}>
              {dpia.checks.map((c, i) => {
                const s = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
                return (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 10,
                    backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{c.label || c.key}</strong>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{c.status}</span>
                    </div>
                    {c.gdpr_article && (
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, opacity: 0.85 }}>
                        GDPR {c.gdpr_article}
                      </div>
                    )}
                    {c.note && <div style={{ fontSize: 11, opacity: 0.85 }}>{c.note}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {Array.isArray(dpia?.data_register) && dpia.data_register.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h4 style={subTitle}>📚 {t('redCrossWebQaModule.dpia.dataRegister')}</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={th}>{t('redCrossWebQaModule.dpia.system')}</th>
                    <th style={th}>{t('redCrossWebQaModule.dpia.dataTypes')}</th>
                    <th style={th}>{t('redCrossWebQaModule.dpia.legalBasis')}</th>
                    <th style={th}>{t('redCrossWebQaModule.dpia.retention')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dpia.data_register.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><strong>{d.system}</strong></td>
                      <td style={td}>
                        {Array.isArray(d.data_types) ? d.data_types.map((dt, j) => (
                          <span key={j} style={dataPill}>{dt}</span>
                        )) : d.data_types}
                      </td>
                      <td style={td}>{d.legal_basis || '—'}</td>
                      <td style={td}>{d.retention || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {Array.isArray(dpia?.findings) && dpia.findings.length > 0 && (
            <div>
              <h4 style={subTitle}>🔎 {t('redCrossWebQaModule.dpia.findings')} ({dpia.findings.length})</h4>
              <div style={{ display: 'grid', gap: 6 }}>
                {dpia.findings.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                    fontSize: 13, color: '#334155',
                  }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: SEV_COLOR[f.severity] || '#64748b',
                    }}>{f.severity}</span>
                    {f.gdpr_article && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe',
                      }}>{f.gdpr_article}</span>
                    )}
                    <span style={{ flex: 1 }}><strong>{f.title}</strong>{f.message ? ` — ${f.message}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dpia?.status === 'error' && <div style={errorBox}>{dpia.message}</div>}
        </div>
      </div>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const subTitle = { margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#334155' };
const hint = { fontSize: 12, color: '#64748b', margin: '0 0 12px' };
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#94a3b8' : '#334155', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const dpiaBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#a5b4fc' : '#6366f1', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const th = { padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' };
const td = { padding: '8px 12px', color: '#334155' };
const dataPill = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 999,
  fontSize: 10, fontWeight: 600, marginRight: 4, marginBottom: 2,
  backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
};
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default SecurityPrivacy;
