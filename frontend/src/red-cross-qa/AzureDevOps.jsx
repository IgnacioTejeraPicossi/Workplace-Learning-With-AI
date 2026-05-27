import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

// ADO priority is 1 (highest) → 4 (lowest)
const PRIORITY_COLOR = {
  1: '#b91c1c', 2: '#dc2626', 3: '#f59e0b', 4: '#10b981',
};

// Tag colour for the test-level taxonomy (per Teststrategi 30.3 §5)
const TEST_LEVEL_COLOR = {
  unit: '#2563eb',
  sit: '#7c3aed',
  system: '#0891b2',
  uat: '#10b981',
  performance: '#f59e0b',
};

const AzureDevOps = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [bundle, setBundle] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Phase H+ (2026-05-27) — Paste-and-Generate.
  const [pastedText, setPastedText] = useState('');
  const [pasteResult, setPasteResult] = useState(null);
  const [pasting, setPasting] = useState(false);
  const [pasteError, setPasteError] = useState('');

  // Phase H+ (2026-05-28) — Fetch-from-ADO (live REST + mock fallback).
  const [iterationOverride, setIterationOverride] = useState('');
  const [fetchResult, setFetchResult] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/ado-bundle-preview?environment=${environment}`);
        const data = await res.json();
        if (data.status === 'ok') setBundle(data.bundle);
      } catch { /* offline */ }
    })();
  }, [environment]);

  const handlePasteToPlan = async () => {
    setPasteError('');
    if (!pastedText.trim()) {
      setPasteError(t('redCrossWebQaModule.ado.pasteEmpty'));
      return;
    }
    setPasting(true); setPasteResult(null);
    try {
      const res = await fetch(`${API}/ado/paste-to-plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pasted_text: pastedText, environment, lang: i18n.language }),
      });
      const data = await res.json();
      if (data.status === 'ok') setPasteResult(data);
      else setPasteError(data.detail || data.message || 'Error');
    } catch (e) {
      setPasteError('Network error');
    } finally { setPasting(false); }
  };

  const handleClearPaste = () => {
    setPastedText(''); setPasteResult(null); setPasteError('');
  };

  const handleFetchSprint = async () => {
    setFetchError(''); setFetching(true); setFetchResult(null);
    try {
      const res = await fetch(`${API}/ado/fetch-sprint`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iteration_path: iterationOverride.trim() || undefined,
          environment, lang: i18n.language,
        }),
      });
      const data = await res.json();
      if (data.status === 'ok') setFetchResult(data);
      else setFetchError(data.detail || data.message || 'Error');
    } catch {
      setFetchError('Network error');
    } finally { setFetching(false); }
  };

  // Pipe a fetched item into the paste textarea via the backend formatter
  // (single round-trip — the formatter mirrors the parser's expected shape
  // so paste-to-plan can run unchanged).
  const handleUseFetchedItem = async (item) => {
    try {
      const res = await fetch(`${API}/ado/format-item`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setPastedText(data.pasted_text || '');
        setPasteResult(null); setPasteError('');
        // Scroll the textarea into view so user sees the populated paste.
        setTimeout(() => {
          const ta = document.querySelector('textarea');
          if (ta) ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    } catch { /* ignore */ }
  };

  const handleDispatch = async () => {
    setDispatching(true); setResult(null);
    try {
      const res = await fetch(`${API}/create-ado-work-items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setDispatching(false); }
  };

  const handleOutSystems = async () => {
    setSending(true); setResult(null);
    try {
      const res = await fetch(`${API}/dispatch-to-outsystems`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setSending(false); }
  };

  const items = bundle?.work_items || [];

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🎯"
          title={t('redCrossWebQaModule.ado.header')}
          subtitle={t('redCrossWebQaModule.ado.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)"
        />

        <div style={panel}>
          <h3 style={panelTitle}>🏷️ {t('redCrossWebQaModule.ado.bundleConfig')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <ConfigChip label={t('redCrossWebQaModule.ado.organization')} value={bundle?.organization || 'rodekors'} color="#2563eb" mono />
            <ConfigChip label={t('redCrossWebQaModule.ado.project')} value={bundle?.project || 'rodekors-web'} color="#7c3aed" />
            <ConfigChip label={t('redCrossWebQaModule.ado.areaPath')} value={bundle?.area_path || 'rodekors-web\\Web QA'} color="#0891b2" mono />
            <ConfigChip label={t('redCrossWebQaModule.ado.iterationPath')} value={bundle?.iteration_path || 'rodekors-web\\Sprint 1'} color="#0d9488" mono />
            <ConfigChip label={t('redCrossWebQaModule.ado.tags')} value={(bundle?.tags || ['red-cross-qa']).join(', ')} color="#f59e0b" mono />
          </div>
        </div>

        {/* Phase H+ — Fetch-from-ADO panel (live REST when ADO_PAT is set,
            mock list otherwise). Output feeds into the Paste-and-Generate
            panel below via "Use this item". */}
        <div style={{ ...panel, borderLeft: '4px solid #0d9488' }}>
          <h3 style={panelTitle}>📥 {t('redCrossWebQaModule.ado.fetchTitle')}</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            {t('redCrossWebQaModule.ado.fetchSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
            <label style={{ flex: '1 1 280px', fontSize: 11, color: '#475569', fontWeight: 600 }}>
              {t('redCrossWebQaModule.ado.fetchIterationOverride')}
              <input
                type="text"
                value={iterationOverride}
                onChange={(e) => setIterationOverride(e.target.value)}
                placeholder={t('redCrossWebQaModule.ado.fetchIterationPlaceholder')}
                style={{
                  display: 'block', width: '100%', marginTop: 4,
                  padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: 13,
                  fontFamily: 'ui-monospace, monospace',
                }}
              />
            </label>
            <button onClick={handleFetchSprint} disabled={fetching} style={primaryBtn(fetching, '#0d9488')}>
              {fetching ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.ado.btnFetchSprint')}
            </button>
          </div>
          {fetchError && <div style={{ ...errorBox, marginTop: 8 }}>{t('redCrossWebQaModule.ado.fetchError')}: {fetchError}</div>}

          {fetchResult && (
            <>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                  backgroundColor: fetchResult.is_mock ? '#fef3c7' : '#dcfce7',
                  color: fetchResult.is_mock ? '#92400e' : '#047857',
                  border: `1px solid ${fetchResult.is_mock ? '#fcd34d' : '#86efac'}`,
                }}>
                  {fetchResult.is_mock
                    ? t('redCrossWebQaModule.ado.fetchBadgeMock')
                    : t('redCrossWebQaModule.ado.fetchBadgeLive')}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {fetchResult.is_mock
                    ? t('redCrossWebQaModule.ado.fetchMockHint')
                    : t('redCrossWebQaModule.ado.fetchPatHint')}
                </span>
                <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
                  <strong>{fetchResult.item_count}</strong> · {fetchResult.organization}/{fetchResult.project}
                  {fetchResult.iteration_path ? ` · ${fetchResult.iteration_path}` : ''}
                </span>
              </div>

              {fetchResult.items.length === 0 ? (
                <p style={empty}>{t('redCrossWebQaModule.ado.fetchNoItems')}</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {fetchResult.items.map((it) => (
                    <div key={it.id} style={{
                      padding: '12px 14px', borderRadius: 10,
                      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                          backgroundColor: '#1e293b', color: 'white', fontFamily: 'ui-monospace, monospace',
                        }}>#{it.id}</span>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{it.work_item_type}</span>
                        {it.state && (
                          <span style={{
                            padding: '2px 6px', borderRadius: 6, fontSize: 10, color: '#64748b',
                            backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                          }}>{it.state}</span>
                        )}
                        <strong style={{ fontSize: 13, color: '#1e293b', flex: 1 }}>{it.title}</strong>
                      </div>
                      {it.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {it.tags.map((tag, i) => (
                            <span key={i} style={{
                              padding: '1px 6px', borderRadius: 4, fontSize: 10,
                              backgroundColor: '#ede9fe', color: '#5b21b6',
                            }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {it.description && (
                        <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                          {it.description.length > 200 ? it.description.slice(0, 200) + '…' : it.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleUseFetchedItem(it)} style={primaryBtn(false, '#0d9488')}>
                          ↓ {t('redCrossWebQaModule.ado.btnUseItem')}
                        </button>
                        {it.url && (
                          <a href={it.url} target="_blank" rel="noopener noreferrer" style={{
                            padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1',
                            backgroundColor: 'white', color: '#1e293b', fontWeight: 600, fontSize: 14,
                            textDecoration: 'none', display: 'inline-block',
                          }}>↗ {t('redCrossWebQaModule.ado.fetchOpenInAdo')}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Phase H+ — Paste-and-Generate panel */}
        <div style={{ ...panel, borderLeft: '4px solid #2563eb' }}>
          <h3 style={panelTitle}>📋 {t('redCrossWebQaModule.ado.pasteTitle')}</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            {t('redCrossWebQaModule.ado.pasteSubtitle')}
          </p>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={t('redCrossWebQaModule.ado.pastePlaceholder')}
            rows={10}
            style={{
              width: '100%', padding: 12, borderRadius: 8,
              border: '1px solid #cbd5e1', fontSize: 12,
              fontFamily: 'ui-monospace, monospace', resize: 'vertical',
              backgroundColor: '#f8fafc', color: '#1e293b',
            }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <button onClick={handlePasteToPlan} disabled={pasting} style={primaryBtn(pasting, '#2563eb')}>
              {pasting ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.ado.btnGeneratePlan')}
            </button>
            <button onClick={handleClearPaste} disabled={pasting || (!pastedText && !pasteResult)} style={secondaryBtn(pasting || (!pastedText && !pasteResult))}>
              {t('redCrossWebQaModule.ado.btnClearPaste')}
            </button>
          </div>
          {pasteError && <div style={{ ...errorBox, marginTop: 14 }}>{pasteError}</div>}

          {pasteResult?.parsed && (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                🧠 {t('redCrossWebQaModule.ado.parsedTitle')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                {pasteResult.parsed.title && (
                  <ParsedChip label={t('redCrossWebQaModule.ado.parsedTitleField')} value={pasteResult.parsed.title} color="#2563eb" />
                )}
                {pasteResult.parsed.fields?.work_item_type && (
                  <ParsedChip label={t('redCrossWebQaModule.ado.parsedType')} value={pasteResult.parsed.fields.work_item_type} color="#7c3aed" />
                )}
                {pasteResult.parsed.fields?.area_path && (
                  <ParsedChip label={t('redCrossWebQaModule.ado.parsedArea')} value={pasteResult.parsed.fields.area_path} color="#0891b2" mono />
                )}
                {pasteResult.parsed.fields?.iteration_path && (
                  <ParsedChip label={t('redCrossWebQaModule.ado.parsedIteration')} value={pasteResult.parsed.fields.iteration_path} color="#0d9488" mono />
                )}
                <ParsedChip
                  label={t('redCrossWebQaModule.ado.parsedContentType')}
                  value={pasteResult.parsed.rk_content_type || t('redCrossWebQaModule.ado.noContentTypeDetected')}
                  color={pasteResult.parsed.rk_content_type ? '#16a34a' : '#94a3b8'}
                />
                <ParsedChip label={t('redCrossWebQaModule.ado.parsedRiskLevel')} value={pasteResult.parsed.risk_level} color="#f59e0b" />
                {pasteResult.parsed.tags?.length > 0 && (
                  <ParsedChip label={t('redCrossWebQaModule.ado.parsedTags')} value={pasteResult.parsed.tags.join(', ')} color="#db2777" />
                )}
              </div>
              {pasteResult.parsed.acceptance_criteria && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 600, marginBottom: 4 }}>
                    {t('redCrossWebQaModule.ado.parsedAcceptance')}
                  </div>
                  <pre style={{ margin: 0, fontSize: 12, color: '#1e293b', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }}>
                    {pasteResult.parsed.acceptance_criteria}
                  </pre>
                </div>
              )}
            </div>
          )}

          {pasteResult?.plan && (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                🎯 {t('redCrossWebQaModule.ado.planTitle')}
              </h4>
              <PlanSection title={t('redCrossWebQaModule.ado.planManualTests')} items={pasteResult.plan.manual_tests} renderItem={(it) => it.title} />
              <PlanSection title={t('redCrossWebQaModule.ado.planAutomatedCandidates')} items={pasteResult.plan.automated_candidates} renderItem={(it) => `${it.title} (${it.tool || ''})`} />
              <PlanSection title={t('redCrossWebQaModule.ado.planA11yChecklist')} items={pasteResult.plan.accessibility_checklist} renderItem={(it) => it} />
              <PlanSection title={t('redCrossWebQaModule.ado.planApiChecks')} items={pasteResult.plan.api_checks} renderItem={(it) => `${it.method || ''} ${it.endpoint || ''} — ${it.check || ''}`} />
              <PlanSection title={t('redCrossWebQaModule.ado.planRegressionScope')} items={pasteResult.plan.regression_scope} renderItem={(it) => it} />
              <PlanSection title={t('redCrossWebQaModule.ado.planSuggestedTestData')} items={pasteResult.plan.suggested_test_data} renderItem={(it) => it} />
              <PlanSection title={t('redCrossWebQaModule.ado.planAdoWorkItems')} items={pasteResult.plan.ado_work_items} renderItem={(it) => `[${it.work_item_type || 'Task'} P${it.priority || 3}${it.test_level ? ' · ' + it.test_level : ''}] ${it.title}`} />
            </div>
          )}
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>📋 {t('redCrossWebQaModule.ado.previewTitle')} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({items.length})</span></h3>
          {items.length === 0 ? (
            <p style={empty}>{t('redCrossWebQaModule.common.noData')}</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {items.map((wi, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, color: 'white',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      backgroundColor: PRIORITY_COLOR[wi.priority] || '#64748b',
                    }}>P{wi.priority || 3}</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{wi.work_item_type || 'Bug'}</span>
                    {wi.severity && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6,
                        fontSize: 10, color: '#64748b',
                        backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                      }}>Sev {wi.severity}</span>
                    )}
                    {wi.severity_dev && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6,
                        fontSize: 10, color: '#7c2d12',
                        backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
                      }}>Sev{wi.severity_dev} (dev)</span>
                    )}
                    {wi.category_ops && (
                      <span style={{
                        padding: '2px 6px', borderRadius: 6,
                        fontSize: 10, color: '#1e3a8a',
                        backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
                      }}>Kat {wi.category_ops} (drift)</span>
                    )}
                    {wi.test_level && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        fontSize: 10, color: 'white', fontWeight: 700,
                        backgroundColor: TEST_LEVEL_COLOR[wi.test_level] || '#64748b',
                      }}>{wi.test_level}</span>
                    )}
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{wi.title}</strong>
                  </div>
                  {wi.description && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{wi.description}</p>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <button onClick={handleDispatch} disabled={dispatching || items.length === 0} style={primaryBtn(dispatching || items.length === 0, '#2563eb')}>
              {dispatching ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.ado.btnDispatch')}
            </button>
            <button onClick={handleOutSystems} disabled={sending || items.length === 0} style={primaryBtn(sending || items.length === 0, '#4f46e5')}>
              {sending ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.ado.btnSendToOutsystems')}
            </button>
          </div>
        </div>

        {result?.status === 'ok' && (
          <div style={{
            padding: 14, borderRadius: 10,
            backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', color: '#047857',
            fontSize: 13, fontWeight: 500,
          }}>
            ✅ {t('redCrossWebQaModule.ado.dispatched')}: {result.created_count ?? result.dispatched_count ?? 0}
          </div>
        )}
        {result?.status === 'error' && <div style={errorBox}>{result.message}</div>}
      </div>
    </div>
  );
};

const ConfigChip = ({ label, value, color, mono }) => (
  <div style={{
    padding: '8px 12px', borderRadius: 10,
    backgroundColor: `${color}10`, border: `1px solid ${color}30`,
  }}>
    <div style={{ fontSize: 11, color, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', marginTop: 2 }}>{value}</div>
  </div>
);

// Phase H+ — small reusable building blocks for the Paste-and-Generate panel.
const ParsedChip = ({ label, value, color, mono }) => (
  <div style={{
    padding: '8px 12px', borderRadius: 10,
    backgroundColor: `${color}12`, border: `1px solid ${color}40`,
  }}>
    <div style={{ fontSize: 10, color, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
  </div>
);

const PlanSection = ({ title, items, renderItem }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 12, color: '#1e293b', marginBottom: 2 }}>
            {renderItem(it)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const primaryBtn = (disabled, bg) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#cbd5e1' : bg, color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const secondaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8,
  border: '1px solid #cbd5e1',
  backgroundColor: disabled ? '#f1f5f9' : 'white',
  color: disabled ? '#94a3b8' : '#1e293b',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const empty = { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' };
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default AzureDevOps;
