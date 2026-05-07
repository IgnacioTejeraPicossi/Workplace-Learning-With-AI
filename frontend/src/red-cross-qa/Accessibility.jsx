import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  { key: 'checkKeyboard',       icon: '⌨️' }, { key: 'checkFocusOrder',     icon: '🎯' },
  { key: 'checkSkipLinks',      icon: '⏭️' }, { key: 'checkAriaMisuse',     icon: '🏷️' },
  { key: 'checkHeadings',       icon: '📑' }, { key: 'checkColorContrast',  icon: '🎨' },
  { key: 'checkFormLabels',     icon: '🏷️' }, { key: 'checkErrorMessages',  icon: '⚠️' },
  { key: 'checkScreenReader',   icon: '🔊' }, { key: 'checkDialogs',        icon: '💬' },
  { key: 'checkAltText',        icon: '🖼️' }, { key: 'checkContentClarity', icon: '📖' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const SEV_COLOR = { critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

// WCAG version selector — Trine §4.1 mandates 2.1 AA as the contractual minimum
// for offentlig sektor, but the rodekors.no rebuild aims for 2.2 AA (9 new
// success criteria). The agent runs both and exposes the version on the score
// card so reports cite the exact criterion set.
const WCAG_VERSIONS = [
  { val: '2.2-AA', label: 'WCAG 2.2 AA', subtitle: 'Recommended (rodekors.no rebuild target)', color: '#0891b2' },
  { val: '2.1-AA', label: 'WCAG 2.1 AA', subtitle: 'Trine §4.1 / offentlig sektor minimum',     color: '#0e7490' },
];

const Accessibility = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [wcagVersion, setWcagVersion] = useState('2.2-AA');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-accessibility-check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, wcag_version: wcagVersion, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const activeVersionMeta = WCAG_VERSIONS.find(v => v.val === wcagVersion) || WCAG_VERSIONS[0];
  const reportedVersion = report?.wcag_version || activeVersionMeta.label;

  const score = report?.wcag_score ?? null;
  const scoreColor = score === null ? '#94a3b8' : score >= 95 ? '#10b981' : score >= 80 ? '#f59e0b' : '#dc2626';

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="♿"
          title={t('redCrossWebQaModule.accessibility.header')}
          subtitle={t('redCrossWebQaModule.accessibility.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0369a1 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🌐 Target URL</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} style={{ ...input, flex: 1, minWidth: 240 }} />
            <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.accessibility.btnRun')}
            </button>
          </div>

          {/* WCAG version selector — Phase C explicit labeling (Trine §4.1) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: '#64748b', textTransform: 'uppercase',
              fontWeight: 600, letterSpacing: 0.4, marginBottom: 8,
            }}>
              {t('redCrossWebQaModule.accessibility.wcagVersion')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {WCAG_VERSIONS.map(v => {
                const active = wcagVersion === v.val;
                return (
                  <label key={v.val} onClick={() => setWcagVersion(v.val)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: active ? `${v.color}15` : '#f8fafc',
                    border: `1px solid ${active ? `${v.color}80` : '#e2e8f0'}`,
                  }}>
                    <input type="radio" name="wcagVersion" value={v.val}
                      checked={active} onChange={() => setWcagVersion(v.val)}
                      style={{ accentColor: v.color }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: active ? v.color : '#1e293b' }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {v.subtitle}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {CHECKS.map(c => {
              const status = report?.checks?.[c.key] || 'pending';
              const s = STATUS_STYLES[status];
              return (
                <div key={c.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 10, padding: '12px 14px', borderRadius: 10,
                  backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.fg,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    {t(`redCrossWebQaModule.accessibility.${c.key}`)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ ...panel, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('redCrossWebQaModule.accessibility.wcagScore')}
            </p>
            <p style={{ margin: '12px 0 0', fontSize: 48, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {score === null ? '—' : score}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>{reportedVersion}</p>
          </div>

          <div style={{ ...panel, gridColumn: 'span 2' }}>
            <h3 style={panelTitle}>🐞 {t('redCrossWebQaModule.accessibility.violations')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({(report?.violations || []).length})</span></h3>
            {(!report?.violations || report.violations.length === 0) && (
              <p style={empty}>{t('redCrossWebQaModule.common.noData')}</p>
            )}
            <div style={{ display: 'grid', gap: 6 }}>
              {(report?.violations || []).map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                  fontSize: 13, color: '#334155',
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, color: 'white',
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    backgroundColor: SEV_COLOR[v.severity] || '#64748b',
                  }}>{v.severity}</span>
                  <span>{v.message || v.rule || JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
  backgroundColor: disabled ? '#67e8f9' : '#0891b2', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const empty = { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default Accessibility;
