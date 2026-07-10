import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const CHECKS = [
  { key: 'checkKeyboard',       icon: '⌨️' }, { key: 'checkFocusOrder',     icon: '🎯' },
  { key: 'checkSkipLinks',      icon: '⏭️' }, { key: 'checkAriaMisuse',     icon: '🏷️' },
  { key: 'checkHeadings',       icon: '📑' }, { key: 'checkColorContrast',  icon: '🎨' },
  { key: 'checkFormLabels',     icon: '🏷️' }, { key: 'checkErrorMessages',  icon: '⚠️' },
  { key: 'checkScreenReader',   icon: '🔊' }, { key: 'checkDialogs',        icon: '💬' },
  { key: 'checkAltText',        icon: '🖼️' }, { key: 'checkContentClarity', icon: '📖' },
  // Phase H+ (Enonic skill 0.1.0) — three Enonic-XP-specific a11y checks.
  { key: 'checkLangAttribute',         icon: '🌐' },
  { key: 'checkHtmlAreaEditorialA11y', icon: '✍️' },
  { key: 'checkCmsEditorialUiA11y',    icon: '🖥️' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const SEV_COLOR = { critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981' };

// WCAG version selector — Phase C (Trine §4.1).
const WCAG_VERSIONS = [
  { val: '2.2-AA', label: 'WCAG 2.2 AA', subtitle: 'Recommended (rodekors.no rebuild target)', color: '#0891b2' },
  { val: '2.1-AA', label: 'WCAG 2.1 AA', subtitle: 'Trine §4.1 / offentlig sektor minimum',     color: '#0e7490' },
];

// Phase G — three accessibility tools side by side in the same tab.
// `axe` is the existing axe-core + Lighthouse runner; `nvda` generates a
// markdown checklist for the manual NVDA tester on Windows; `wave` returns
// the WebAIM-style report shape (mock-first).
const TOOLS = [
  { key: 'axe',   icon: '🤖', label: 'axe-core + Lighthouse', color: '#0891b2' },
  { key: 'nvda',  icon: '🔊', label: 'NVDA (screen reader)',  color: '#7c3aed' },
  { key: 'wave',  icon: '🌊', label: 'WAVE (WebAIM)',         color: '#0d9488' },
];

// NVDA scope options. Each scope maps server-side to a default URL + a set
// of expected announcements specific to that flow.
const NVDA_SCOPES = [
  { key: 'donation',   icon: '💝' },
  { key: 'volunteer',  icon: '🙋' },
  { key: 'search',     icon: '🔎' },
  { key: 'navigation', icon: '🧭' },
  { key: 'forms',      icon: '📝' },
];

const Accessibility = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [tool, setTool] = useState('axe');
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [wcagVersion, setWcagVersion] = useState('2.2-AA');

  // axe + Lighthouse state (existing)
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  // Phase G — NVDA state
  const [nvdaScope, setNvdaScope] = useState('donation');
  const [nvdaLoading, setNvdaLoading] = useState(false);
  const [nvda, setNvda] = useState(null);

  // Phase G — WAVE state
  const [waveLoading, setWaveLoading] = useState(false);
  const [wave, setWave] = useState(null);

  const activeTool = TOOLS.find(t => t.key === tool) || TOOLS[0];

  const handleRunAxe = async () => {
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

  const handleGenerateNvda = async () => {
    setNvdaLoading(true); setNvda(null);
    try {
      const res = await fetch(`${API}/generate-nvda-script`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scope: nvdaScope, environment, lang: i18n.language }),
      });
      setNvda(await res.json());
    } catch { setNvda({ status: 'error', message: 'Network error' }); }
    finally { setNvdaLoading(false); }
  };

  const handleDownloadNvda = () => {
    if (!nvda?.script_md) return;
    const blob = new Blob([nvda.script_md], { type: 'text/markdown;charset=utf-8' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = nvda.filename || 'nvda-script.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(u);
  };

  const handleRunWave = async () => {
    setWaveLoading(true); setWave(null);
    try {
      const res = await fetch(`${API}/run-wave-audit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, environment, lang: i18n.language }),
      });
      setWave(await res.json());
    } catch { setWave({ status: 'error', message: 'Network error' }); }
    finally { setWaveLoading(false); }
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

        <AiUsagePolicy variant="compact" />

        {/* Phase G — tool selector */}
        <div style={panel}>
          <h3 style={panelTitle}>🛠️ {t('redCrossWebQaModule.accessibility.toolTitle')}</h3>
          <p style={hint}>{t('redCrossWebQaModule.accessibility.toolHint')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {TOOLS.map(tl => {
              const active = tool === tl.key;
              return (
                <label key={tl.key} onClick={() => setTool(tl.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  backgroundColor: active ? `${tl.color}15` : '#f8fafc',
                  border: `1px solid ${active ? `${tl.color}80` : '#e2e8f0'}`,
                  transition: 'all 0.2s',
                }}>
                  <input type="radio" name="a11yTool" value={tl.key}
                    checked={active} onChange={() => setTool(tl.key)}
                    style={{ accentColor: tl.color }} />
                  <span style={{ fontSize: 22 }}>{tl.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600,
                                  color: active ? tl.color : '#1e293b' }}>
                      {tl.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                      {t(`redCrossWebQaModule.accessibility.tool_${tl.key}_hint`)}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Target URL — shared across all 3 tools */}
        <div style={panel}>
          <h3 style={panelTitle}>🌐 Target URL</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} style={{ ...input, flex: 1, minWidth: 240 }} />
            {tool === 'axe' && (
              <button onClick={handleRunAxe} disabled={running} style={primaryBtn(running, activeTool.color)}>
                {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.accessibility.btnRun')}
              </button>
            )}
            {tool === 'wave' && (
              <button onClick={handleRunWave} disabled={waveLoading} style={primaryBtn(waveLoading, activeTool.color)}>
                {waveLoading ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.accessibility.btnRunWave')}
              </button>
            )}
          </div>

          {/* axe-only: WCAG version selector + checks grid (existing) */}
          {tool === 'axe' && (
            <>
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
            </>
          )}

          {/* NVDA scope picker + generate button */}
          {tool === 'nvda' && (
            <div>
              <div style={{
                fontSize: 11, color: '#64748b', textTransform: 'uppercase',
                fontWeight: 600, letterSpacing: 0.4, marginBottom: 8,
              }}>
                {t('redCrossWebQaModule.accessibility.nvdaScopeTitle')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                {NVDA_SCOPES.map(s => {
                  const active = nvdaScope === s.key;
                  return (
                    <label key={s.key} onClick={() => setNvdaScope(s.key)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      backgroundColor: active ? '#f3e8ff' : '#f8fafc',
                      border: `1px solid ${active ? '#a78bfa' : '#e2e8f0'}`,
                      fontSize: 13, color: active ? '#6b21a8' : '#475569',
                      fontWeight: active ? 600 : 500,
                    }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span>{t(`redCrossWebQaModule.accessibility.nvdaScope_${s.key}`)}</span>
                    </label>
                  );
                })}
              </div>
              <button onClick={handleGenerateNvda} disabled={nvdaLoading}
                       style={primaryBtn(nvdaLoading, '#7c3aed')}>
                {nvdaLoading ? t('redCrossWebQaModule.common.generating')
                              : `🔊 ${t('redCrossWebQaModule.accessibility.btnGenerateNvda')}`}
              </button>
            </div>
          )}
        </div>

        {/* axe results: score card + violations (existing) */}
        {tool === 'axe' && (
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
        )}

        {/* NVDA result: markdown viewer + download */}
        {tool === 'nvda' && nvda?.status === 'ok' && (
          <div style={{ ...panel, borderTop: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
              <h3 style={{ ...panelTitle, margin: 0 }}>
                📝 {nvda.filename}
                {' '}<span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                  ({nvda.step_count} {t('redCrossWebQaModule.accessibility.nvdaSteps')} ·
                  {' '}{nvda.platform})
                </span>
              </h3>
              <button onClick={handleDownloadNvda} style={ghostBtn('#7c3aed')}>
                ⬇️ {t('redCrossWebQaModule.accessibility.btnDownloadNvda')}
              </button>
            </div>
            {Array.isArray(nvda.wcag_sc_covered) && nvda.wcag_sc_covered.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginRight: 6 }}>
                  {t('redCrossWebQaModule.accessibility.nvdaWcagCovered')}:
                </span>
                {nvda.wcag_sc_covered.map((sc, i) => (
                  <span key={i} style={{
                    display: 'inline-block', marginRight: 4, padding: '2px 8px',
                    borderRadius: 999, backgroundColor: '#ede9fe',
                    color: '#6b21a8', border: '1px solid #c4b5fd',
                    fontSize: 10, fontWeight: 700,
                  }}>{sc}</span>
                ))}
              </div>
            )}
            <pre style={mdBlock}>{nvda.script_md}</pre>
          </div>
        )}
        {tool === 'nvda' && nvda?.status === 'error' && <div style={errorBox}>{nvda.message}</div>}

        {/* WAVE result */}
        {tool === 'wave' && wave?.status === 'ok' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <WaveStat label={t('redCrossWebQaModule.accessibility.waveCategories.errors')}    value={wave.categories.errors}          color="#b91c1c" />
              <WaveStat label={t('redCrossWebQaModule.accessibility.waveCategories.contrast')}  value={wave.categories.contrast_errors} color="#dc2626" />
              <WaveStat label={t('redCrossWebQaModule.accessibility.waveCategories.alerts')}    value={wave.categories.alerts}          color="#f59e0b" />
              <WaveStat label={t('redCrossWebQaModule.accessibility.waveCategories.features')}  value={wave.categories.features}        color="#10b981" />
              <WaveStat label={t('redCrossWebQaModule.accessibility.waveCategories.structure')} value={wave.categories.structural_elements} color="#0891b2" />
              <WaveStat label={t('redCrossWebQaModule.accessibility.waveCategories.aria')}      value={wave.categories.aria}            color="#7c3aed" />
            </div>

            <div style={{ ...panel, borderTop: '4px solid #0d9488' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ ...panelTitle, margin: 0 }}>
                  🌊 {t('redCrossWebQaModule.accessibility.waveOpenReport')}
                </h3>
                <a href={wave.wave_report_url} target="_blank" rel="noopener noreferrer"
                   style={{
                     padding: '8px 14px', borderRadius: 8,
                     backgroundColor: '#0d9488', color: 'white',
                     fontSize: 13, fontWeight: 600, textDecoration: 'none',
                   }}>
                  ↗ wave.webaim.org/report
                </a>
              </div>
              <p style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                {t('redCrossWebQaModule.accessibility.waveOpenHint')}{' '}
                <code style={code}>{wave.wave_report_url}</code>
              </p>
              {!wave.used_api && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 8,
                  backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
                  fontSize: 11, color: '#92400e',
                }}>
                  ℹ️ {t('redCrossWebQaModule.accessibility.waveMockNotice')}
                  {' '}<code style={code}>WAVE_API_KEY</code>{' '}
                  {wave.api_key_present
                    ? t('redCrossWebQaModule.accessibility.waveKeyPresentButMock')
                    : t('redCrossWebQaModule.accessibility.waveKeyMissing')}
                </div>
              )}
            </div>

            <WaveDetailTable
              title={t('redCrossWebQaModule.accessibility.waveErrorsTitle')}
              rows={wave.errors_detail}
              accent="#b91c1c"
              t={t}
            />
            <WaveDetailTable
              title={t('redCrossWebQaModule.accessibility.waveContrastTitle')}
              rows={wave.contrast_detail}
              accent="#dc2626"
              t={t}
            />
            <WaveDetailTable
              title={t('redCrossWebQaModule.accessibility.waveAlertsTitle')}
              rows={wave.alerts_detail}
              accent="#f59e0b"
              t={t}
            />
          </>
        )}
        {tool === 'wave' && wave?.status === 'error' && <div style={errorBox}>{wave.message}</div>}

        {report?.status === 'error' && <div style={errorBox}>{report.message}</div>}
      </div>
    </div>
  );
};

const WaveStat = ({ label, value, color }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
  </div>
);

const WaveDetailTable = ({ title, rows, accent, t }) => {
  const items = (rows || []).filter(r => (r.count ?? 0) > 0);
  if (items.length === 0) return null;
  return (
    <div style={{ ...panel, borderTop: `3px solid ${accent}` }}>
      <h3 style={panelTitle}>{title} ({items.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={th}>{t('redCrossWebQaModule.accessibility.waveColCode')}</th>
              <th style={th}>{t('redCrossWebQaModule.accessibility.waveColLabel')}</th>
              <th style={th}>{t('redCrossWebQaModule.accessibility.waveColCount')}</th>
              <th style={th}>{t('redCrossWebQaModule.accessibility.waveColWcag')}</th>
              <th style={th}>{t('redCrossWebQaModule.accessibility.waveColSeverity')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}><code style={code}>{r.code}</code></td>
                <td style={td}>
                  {r.label}
                  {r.note && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.note}</div>}
                </td>
                <td style={{ ...td, fontWeight: 700, color: accent }}>{r.count}</td>
                <td style={td}><code style={code}>{r.wcag}</code></td>
                <td style={td}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, color: 'white',
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    backgroundColor: SEV_COLOR[r.severity] || '#64748b',
                  }}>{r.severity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const hint = { fontSize: 12, color: '#64748b', margin: '0 0 12px' };
const input = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
  fontSize: 14, fontFamily: 'inherit', color: '#1e293b',
};
const primaryBtn = (disabled, color = '#0891b2') => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#cbd5e1' : color, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const ghostBtn = (color) => ({
  padding: '8px 14px', borderRadius: 8, border: `1px solid ${color}`,
  backgroundColor: 'white', color, fontWeight: 600, fontSize: 12,
  cursor: 'pointer',
});
const empty = { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};
const mdBlock = {
  margin: 0, padding: 16, borderRadius: 8,
  backgroundColor: '#0f172a', color: '#e9d5ff', fontSize: 12,
  fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap',
  maxHeight: 480, overflowY: 'auto', lineHeight: 1.5,
};
const th = { padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 };
const td = { padding: '8px 12px', color: '#334155', verticalAlign: 'top' };
const code = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11,
  padding: '1px 6px', borderRadius: 4,
  backgroundColor: '#f1f5f9', color: '#334155',
};

export default Accessibility;
