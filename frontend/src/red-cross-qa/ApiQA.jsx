import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const CHECKS = [
  { key: 'checkQueryCorrectness',  icon: '✅' },
  { key: 'checkPagination',        icon: '📄' },
  { key: 'checkFiltering',         icon: '🔍' },
  { key: 'checkLocalization',      icon: '🌍' },
  { key: 'checkPreviewVsPublished',icon: '👁️' },
  { key: 'checkCaching',           icon: '⚡' },
  { key: 'checkPerfBudget',        icon: '⏱️' },
  { key: 'checkSchemaDrift',       icon: '📐' },
  { key: 'checkRateLimit',         icon: '🚦' },
  { key: 'checkErrorHandling',     icon: '⚠️' },
  // Phase H+ (Enonic skill 0.1.0) — three security-focused checks added.
  { key: 'checkInjection',                  icon: '💉' },
  { key: 'checkIntrospectionDisabledInProd',icon: '🔒' },
  { key: 'checkDepthLimit',                 icon: '🧱' },
];

const STATUS_STYLES = {
  pass:    { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  warn:    { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  fail:    { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  pending: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
};

const ApiQA = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [endpoint, setEndpoint] = useState('/site/api/graphql');
  const [method, setMethod] = useState('POST');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  // Phase F — Tom's tip: Postman export + GraphQL introspection.
  // Both call mock-first backend endpoints; the Postman export also triggers
  // a browser download of the .postman_collection.json so the team can
  // import it directly into Postman without leaving the agent.
  const [introspecting, setIntrospecting] = useState(false);
  const [introspection, setIntrospection] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportInfo, setExportInfo] = useState(null);

  const handleAnalyze = async () => {
    if (!endpoint.trim()) return;
    setAnalyzing(true); setReport(null);
    try {
      const res = await fetch(`${API}/analyze-api`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setAnalyzing(false); }
  };

  const handleIntrospect = async () => {
    setIntrospecting(true); setIntrospection(null);
    try {
      const res = await fetch(`${API}/run-graphql-introspection`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: null, environment, lang: i18n.language }),
      });
      setIntrospection(await res.json());
    } catch { setIntrospection({ status: 'error', message: 'Network error' }); }
    finally { setIntrospecting(false); }
  };

  const handleExportPostman = async () => {
    setExporting(true); setExportInfo(null);
    try {
      const res = await fetch(`${API}/export-postman-collection`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: null, environment, lang: i18n.language }),
      });
      const data = await res.json();
      if (data?.status !== 'ok') {
        setExportInfo({ status: 'error', message: data?.message || 'Export failed' });
        return;
      }
      // Trigger browser download of the .postman_collection.json
      const json = JSON.stringify(data.collection, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'rodekors-guillotine.postman_collection.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportInfo({
        status: 'ok',
        filename: data.filename,
        operations: data.operation_count,
      });
    } catch (e) {
      setExportInfo({ status: 'error', message: String(e) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🔌"
          title={t('redCrossWebQaModule.apiQa.header')}
          subtitle={t('redCrossWebQaModule.apiQa.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #312e81 100%)"
        />

        <AiUsagePolicy variant="compact" />

        {/* Phase F — Tom's tip: Postman is the team's preferred GraphQL workflow tool */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
          color: '#1e3a8a', fontSize: 13, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>
            💡 {t('redCrossWebQaModule.apiQa.tomTipLabel')}
          </span>
          {t('redCrossWebQaModule.apiQa.tomTipText')}
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🎯 Endpoint</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, marginBottom: 14 }}>
            <input value={endpoint} onChange={e => setEndpoint(e.target.value)} style={input} />
            <select value={method} onChange={e => setMethod(e.target.value)} style={input}>
              {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={handleAnalyze} disabled={analyzing} style={primaryBtn(analyzing)}>
            {analyzing ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.apiQa.btnAnalyze')}
          </button>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>🩺 {t('redCrossWebQaModule.apiQa.checks')}</h3>
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
                    {t(`redCrossWebQaModule.apiQa.${c.key}`)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase F — GraphQL schema introspection panel */}
        <div style={{ ...panel, borderTop: '3px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>
              🔍 {t('redCrossWebQaModule.apiQa.introspectionTitle')}
            </h3>
            <button onClick={handleIntrospect} disabled={introspecting} style={introspectBtn(introspecting)}>
              {introspecting ? t('redCrossWebQaModule.common.running')
                            : t('redCrossWebQaModule.apiQa.btnIntrospect')}
            </button>
          </div>
          <p style={hint}>{t('redCrossWebQaModule.apiQa.introspectionHint')}</p>

          {introspection?.status === 'ok' && (
            <>
              {Array.isArray(introspection.operations) && introspection.operations.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4 style={subTitle}>{t('redCrossWebQaModule.apiQa.operationsTitle')} ({introspection.operations.length})</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                          <th style={th}>{t('redCrossWebQaModule.apiQa.opName')}</th>
                          <th style={th}>{t('redCrossWebQaModule.apiQa.opArgs')}</th>
                          <th style={th}>{t('redCrossWebQaModule.apiQa.opReturns')}</th>
                          <th style={th}>{t('redCrossWebQaModule.apiQa.opNote')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {introspection.operations.map((op, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={td}><code style={code}>{op.name}</code></td>
                            <td style={td}>
                              {(op.args || []).map((a, j) => (
                                <code key={j} style={{ ...code, marginRight: 4 }}>{a}</code>
                              ))}
                            </td>
                            <td style={td}><code style={code}>{op.returns}</code></td>
                            <td style={{ ...td, color: '#64748b' }}>{op.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {Array.isArray(introspection.content_types) && introspection.content_types.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <h4 style={subTitle}>{t('redCrossWebQaModule.apiQa.contentTypesTitle')} ({introspection.content_types.length})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                    {introspection.content_types.map((ct, i) => (
                      <div key={i} style={{
                        padding: '10px 12px', borderRadius: 8,
                        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                      }}>
                        <code style={{ ...code, fontWeight: 700, color: '#1e3a8a' }}>{ct.name}</code>
                        <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>
                          {(ct.fields || []).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {introspection.introspection_query && (
                <details style={{ marginTop: 14 }}>
                  <summary style={{ fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                    {t('redCrossWebQaModule.apiQa.showIntrospectionQuery')}
                  </summary>
                  <pre style={{
                    marginTop: 8, padding: 12, borderRadius: 8,
                    backgroundColor: '#0f172a', color: '#93c5fd', fontSize: 11,
                    fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap',
                  }}>{introspection.introspection_query}</pre>
                </details>
              )}

              {introspection.note && (
                <p style={{ marginTop: 12, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                  ℹ️ {introspection.note}
                </p>
              )}
            </>
          )}

          {introspection?.status === 'error' && <div style={errorBox}>{introspection.message}</div>}
        </div>

        {/* Phase F — Postman Collection export panel */}
        <div style={{ ...panel, borderTop: '3px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <h3 style={{ ...panelTitle, margin: 0 }}>
              📦 {t('redCrossWebQaModule.apiQa.postmanTitle')}
            </h3>
            <button onClick={handleExportPostman} disabled={exporting} style={postmanBtn(exporting)}>
              {exporting ? t('redCrossWebQaModule.common.generating')
                         : t('redCrossWebQaModule.apiQa.btnExportPostman')}
            </button>
          </div>
          <p style={hint}>{t('redCrossWebQaModule.apiQa.postmanHint')}</p>

          {exportInfo?.status === 'ok' && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 8,
              backgroundColor: '#dcfce7', border: '1px solid #86efac',
              color: '#15803d', fontSize: 12, fontWeight: 500,
            }}>
              ✅ {t('redCrossWebQaModule.apiQa.postmanDownloaded', {
                filename: exportInfo.filename,
                count: exportInfo.operations,
              })}
            </div>
          )}
          {exportInfo?.status === 'error' && <div style={errorBox}>{exportInfo.message}</div>}
        </div>

        {report?.status === 'error' && (
          <div style={errorBox}>{report.message}</div>
        )}
      </div>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const subTitle = { margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#334155' };
const hint = { fontSize: 12, color: '#64748b', margin: '0 0 10px' };
const input = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
  fontSize: 14, fontFamily: 'inherit', color: '#1e293b',
};
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#93c5fd' : '#2563eb', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const introspectBtn = (disabled) => ({
  padding: '8px 14px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#93c5fd' : '#1d4ed8', color: 'white',
  fontWeight: 600, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
});
const postmanBtn = (disabled) => ({
  padding: '8px 14px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fed7aa' : '#ea580c', color: 'white',
  fontWeight: 600, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
});
const th = {
  padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#475569',
  textTransform: 'uppercase', letterSpacing: 0.4,
};
const td = { padding: '8px 12px', color: '#334155', verticalAlign: 'top' };
const code = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11,
  padding: '1px 6px', borderRadius: 4,
  backgroundColor: '#eff6ff', color: '#1e3a8a',
};
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default ApiQA;
