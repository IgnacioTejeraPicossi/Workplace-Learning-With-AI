import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  { key: 'checkDsComponents',    icon: '🧩' },
  { key: 'checkDsTokens',        icon: '🎨' },
  { key: 'checkDsTypography',    icon: '🔤' },
  { key: 'checkDsSpacing',       icon: '📏' },
  { key: 'checkDsAccessibility', icon: '♿' },
  { key: 'checkDsDarkMode',      icon: '🌙' },
  { key: 'checkBrandOverride',   icon: '❤️' },
  { key: 'checkDsVersion',       icon: '🔢' },
  { key: 'checkDsButtonUsage',   icon: '🔘' },
  { key: 'checkDsFormElements',  icon: '📝' },
  // Phase H+ (Enonic skill 0.1.0) — three DS+Enonic integration checks.
  { key: 'checkDsSsrHydration',           icon: '💧' },
  { key: 'checkDsPackageVersionsAligned', icon: '📚' },
  { key: 'checkDsHtmlAreaIntegration',    icon: '✍️' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};
const SEV_COLOR = { critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

const Designsystemet = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-designsystemet-audit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const score = report?.compliance_score ?? null;
  const scoreColor = score === null ? '#94a3b8' : score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#dc2626';

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🎨"
          title={t('redCrossWebQaModule.designsystemet.header')}
          subtitle={t('redCrossWebQaModule.designsystemet.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🌐 {t('redCrossWebQaModule.common.url')}</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input value={url} onChange={e => setUrl(e.target.value)} style={{ ...input, flex: 1, minWidth: 240 }} />
            <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.designsystemet.btnRun')}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 16 }}>
          <div style={{ ...panel, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              {t('redCrossWebQaModule.designsystemet.complianceScore')}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 56, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {score === null ? '—' : score}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>/ 100</p>
          </div>

          <div style={panel}>
            <h3 style={panelTitle}>🔍 {t('redCrossWebQaModule.designsystemet.checksTitle')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {CHECKS.map(c => {
                const item = report?.checks?.[c.key];
                const status = item?.status || 'pending';
                const s = STATUS_STYLES[status];
                return (
                  <div key={c.key} style={{
                    padding: '10px 12px', borderRadius: 10,
                    backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500 }}>
                        <span style={{ fontSize: 16 }}>{c.icon}</span>
                        {t(`redCrossWebQaModule.designsystemet.${c.key}`)}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                    </div>
                    {item?.note && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>{item.note}</div>}
                    {item?.version_used && (
                      <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600 }}>
                        {item.version_used} → {item.latest}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {Array.isArray(report?.deviations) && report.deviations.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>⚠️ {t('redCrossWebQaModule.designsystemet.deviationsTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.deviations.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.deviations.map((d, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: SEV_COLOR[d.severity] || '#64748b',
                    }}>{d.severity}</span>
                    {d.component && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: '#06b6d415', color: '#0891b2', border: '1px solid #06b6d440',
                        fontSize: 10, fontWeight: 700,
                      }}>{d.component}</span>
                    )}
                    {d.page && (
                      <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'ui-monospace, monospace' }}>{d.page}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{d.title}</strong>
                  </div>
                  {d.message && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>{d.message}</p>}
                  {d.fix_hint && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#2563eb', fontStyle: 'italic' }}>
                      💡 {d.fix_hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(report?.recommendations) && report.recommendations.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>💡 {t('redCrossWebQaModule.designsystemet.recommendationsTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.recommendations.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.recommendations.map((r, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    {r.category && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        backgroundColor: '#2563eb15', color: '#2563eb', border: '1px solid #2563eb40',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>{r.category}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{r.title}</strong>
                  </div>
                  {r.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>{r.description}</p>}
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
const input = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
  fontSize: 14, fontFamily: 'inherit', color: '#1e293b',
};
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#93c5fd' : '#2563eb', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default Designsystemet;
