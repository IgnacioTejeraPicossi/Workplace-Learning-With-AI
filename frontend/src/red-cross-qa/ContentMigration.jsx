import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const CONTENT_TYPES = [
  { key: 'typeForening',     icon: '🏛️', color: '#dc2626' },
  { key: 'typeDistrikt',     icon: '🗺️', color: '#ea580c' },
  { key: 'typeAktivitet',    icon: '🎯', color: '#f59e0b' },
  { key: 'typeKontaktperson', icon: '👤', color: '#0891b2' },
  { key: 'typeTjenesteKurs', icon: '🎓', color: '#7c3aed' },
  { key: 'typeTema',         icon: '📂', color: '#2563eb' },
  { key: 'typeNyhet',        icon: '📰', color: '#10b981' },
  { key: 'typeKampanje',     icon: '📢', color: '#ec4899' },
];

const CHECKS = [
  { key: 'checkContentTypeMapping',    icon: '🗂️' },
  { key: 'checkNorwegianChars',        icon: '🔤' },
  { key: 'checkRelations',             icon: '🔗' },
  { key: 'checkLocalization',          icon: '🌍' },
  { key: 'checkImageReanchoring',      icon: '🖼️' },
  { key: 'checkRedirects',             icon: '↪️' },
  { key: 'checkSeoMetadata',           icon: '🔍' },
  { key: 'checkPublishState',          icon: '📤' },
  { key: 'checkIsrInvalidation',       icon: '🔄' },
  { key: 'checkPermissionsCarryover',  icon: '🔐' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const ContentMigration = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTypes, setActiveTypes] = useState(CONTENT_TYPES.map(c => c.key));
  const [sampleSize, setSampleSize] = useState(100);

  const toggleType = (key) => {
    setActiveTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-content-migration-audit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scopes: activeTypes, environment,
          legacy_sample_size: Number(sampleSize) || 100, lang: i18n.language,
        }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const summary = report?.summary;

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="📦"
          title={t('redCrossWebQaModule.contentMigration.header')}
          subtitle={t('redCrossWebQaModule.contentMigration.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #312e81 0%, #4338ca 50%, #7c3aed 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🗂️ {t('redCrossWebQaModule.contentMigration.contentTypesTitle')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 18 }}>
            {CONTENT_TYPES.map(c => {
              const active = activeTypes.includes(c.key);
              return (
                <button key={c.key} onClick={() => toggleType(c.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 10,
                  backgroundColor: active ? `${c.color}15` : '#f8fafc',
                  border: `1px solid ${active ? `${c.color}80` : '#e2e8f0'}`,
                  color: active ? c.color : '#64748b',
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  {t(`redCrossWebQaModule.contentMigration.${c.key}`)}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('redCrossWebQaModule.contentMigration.sampleSize')}
            </label>
            <input type="number" min="10" max="5000" value={sampleSize}
              onChange={e => setSampleSize(e.target.value)}
              style={{
                width: 100, padding: '8px 10px', borderRadius: 8,
                border: '1px solid #cbd5e1', fontSize: 13,
              }} />
            <button onClick={handleRun} disabled={running || activeTypes.length === 0} style={primaryBtn(running || activeTypes.length === 0)}>
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.contentMigration.btnRun')}
            </button>
          </div>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <StatCard
              label={t('redCrossWebQaModule.contentMigration.totalLegacy')}
              value={summary.total_pages_legacy}
              color="#475569"
            />
            <StatCard
              label={t('redCrossWebQaModule.contentMigration.totalMigrated')}
              value={summary.total_pages_migrated}
              color="#2563eb"
            />
            <StatCard
              label={t('redCrossWebQaModule.contentMigration.coverage')}
              value={`${summary.coverage_percent}%`}
              color={summary.coverage_percent >= 90 ? '#047857' : summary.coverage_percent >= 70 ? '#92400e' : '#b91c1c'}
            />
            <StatCard
              label={t('redCrossWebQaModule.contentMigration.brokenLinks')}
              value={summary.broken_links}
              color={summary.broken_links === 0 ? '#047857' : '#b91c1c'}
            />
            <StatCard
              label={t('redCrossWebQaModule.contentMigration.missingRedirects')}
              value={summary.missing_redirects}
              color={summary.missing_redirects === 0 ? '#047857' : '#92400e'}
            />
            <StatCard
              label={t('redCrossWebQaModule.contentMigration.orphanAssets')}
              value={summary.orphan_assets}
              color={summary.orphan_assets === 0 ? '#047857' : '#92400e'}
            />
          </div>
        )}

        <div style={panel}>
          <h3 style={panelTitle}>🔍 {t('redCrossWebQaModule.contentMigration.checksTitle')}</h3>
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
                      {t(`redCrossWebQaModule.contentMigration.${c.key}`)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                  </div>
                  {item?.note && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>{item.note}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {Array.isArray(report?.broken_pages) && report.broken_pages.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>⚠️ {t('redCrossWebQaModule.contentMigration.brokenPagesTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.broken_pages.length})</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>{t('redCrossWebQaModule.contentMigration.legacyUrl')}</th>
                    <th style={th}>{t('redCrossWebQaModule.contentMigration.newUrl')}</th>
                    <th style={th}>{t('redCrossWebQaModule.contentMigration.issue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.broken_pages.map((p, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#475569' }}>{p.legacy_url}</td>
                      <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#475569' }}>{p.new_url || '—'}</td>
                      <td style={td}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 999,
                          backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        }}>{p.issue}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {Array.isArray(report?.missing_redirects) && report.missing_redirects.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>↪️ {t('redCrossWebQaModule.contentMigration.missingRedirectsTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.missing_redirects.length})</span></h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {report.missing_redirects.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
                  fontSize: 12, color: '#92400e',
                }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>{r.from}</span>
                  <span style={{ color: '#94a3b8' }}>→</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace' }}>{r.to}</span>
                  <span style={{
                    marginLeft: 'auto', padding: '2px 8px', borderRadius: 999,
                    backgroundColor: 'white', border: '1px solid #fcd34d',
                    fontSize: 10, fontWeight: 700,
                  }}>{r.status_expected || 301}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(report?.test_cases) && report.test_cases.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>🧪 {t('redCrossWebQaModule.contentMigration.testCasesTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({report.test_cases.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {report.test_cases.map((tc, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <strong style={{ fontSize: 13, color: '#1e293b' }}>{tc.title}</strong>
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

const StatCard = ({ label, value, color }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: 12, padding: 18,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
  }}>
    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 6, lineHeight: 1 }}>{value}</div>
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#94a3b8' : '#4338ca', color: 'white',
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

export default ContentMigration;
