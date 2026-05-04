import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/atm-copilot';

const SOURCE_TYPES = [
  'requirement', 'user_story', 'defect', 'change_request', 'spec_excerpt', 'validation_note'
];

const RequirementLab = () => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('requirement');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [testDesign, setTestDesign] = useState(null);
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    loadBundles();
    loadDesigns();
  }, []);

  const loadBundles = () => {
    fetch(`${API}/requirements?limit=20`).then(r => r.json()).then(setBundles).catch(() => {});
  };

  const loadDesigns = () => {
    fetch(`${API}/designs?limit=20`).then(r => r.json()).then(setDesigns).catch(() => {});
  };

  const handleIngest = async () => {
    if (!title.trim() || !content.trim()) return;
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await fetch(`${API}/requirements/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          source_type: sourceType,
          content: content.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      setIngestResult(data);
      loadBundles();
      setTitle('');
      setContent('');
      setTags('');
    } catch {
      setIngestResult({ status: 'error', message: t('atmCopilotModule.reqLab.networkError') });
    } finally {
      setIngesting(false);
    }
  };

  const handleGenerate = async (bundleId) => {
    setGenerating(true);
    setTestDesign(null);
    try {
      const res = await fetch(`${API}/designs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement_bundle_id: bundleId }),
      });
      const data = await res.json();
      setTestDesign(data);
      loadDesigns();
    } catch {
      setTestDesign({ status: 'error', message: t('atmCopilotModule.reqLab.networkError') });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportMd = (designId) => {
    window.open(`${API}/designs/${designId}/export/markdown`, '_blank');
  };

  const handleDelete = async (bundleId) => {
    await fetch(`${API}/requirements/${bundleId}`, { method: 'DELETE' }).catch(() => {});
    loadBundles();
  };

  const cardStyle = {
    backgroundColor: 'white', borderRadius: '12px', padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
  };

  const btnPrimary = {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    backgroundColor: '#1e40af', color: 'white', fontWeight: 600,
    cursor: 'pointer', fontSize: '14px',
  };

  const renderTestList = (tests, label, color) => {
    if (!tests || tests.length === 0) return null;
    return (
      <div style={{ marginTop: '16px' }}>
        <h5 style={{ margin: '0 0 8px', color, fontWeight: 600 }}>{label} ({tests.length})</h5>
        {tests.map((tc, i) => (
          <div key={i} style={{
            padding: '12px', borderRadius: '8px', backgroundColor: `${color}08`,
            border: `1px solid ${color}20`, marginBottom: '8px'
          }}>
            <strong>{tc.title}</strong>
            <p style={{ margin: '4px 0', fontSize: '13px', color: '#475569' }}>{tc.description}</p>
            {tc.steps && (
              <ol style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                {tc.steps.map((s, j) => <li key={j}>{s}</li>)}
              </ol>
            )}
            <p style={{ margin: '4px 0', fontSize: '13px' }}>
              <strong>{t('atmCopilotModule.reqLab.expectedOutcome')}:</strong> {tc.expectedOutcome}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
        {/* Left: Ingest Form */}
        <div>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              📋 {t('atmCopilotModule.reqLab.ingestTitle')}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.reqLab.titleLabel')}
              </label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
                placeholder={t('atmCopilotModule.reqLab.titlePlaceholder')} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.reqLab.sourceTypeLabel')}
              </label>
              <select style={inputStyle} value={sourceType} onChange={e => setSourceType(e.target.value)}>
                {SOURCE_TYPES.map(st => (
                  <option key={st} value={st}>{t(`atmCopilotModule.sourceTypes.${st}`)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.reqLab.contentLabel')}
              </label>
              <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                value={content} onChange={e => setContent(e.target.value)}
                placeholder={t('atmCopilotModule.reqLab.contentPlaceholder')} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                {t('atmCopilotModule.reqLab.tagsLabel')}
              </label>
              <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)}
                placeholder={t('atmCopilotModule.reqLab.tagsPlaceholder')} />
            </div>

            <button style={{ ...btnPrimary, opacity: ingesting ? 0.6 : 1 }}
              onClick={handleIngest} disabled={ingesting || !title.trim() || !content.trim()}>
              {ingesting ? t('atmCopilotModule.reqLab.ingesting') : t('atmCopilotModule.reqLab.ingestBtn')}
            </button>

            {ingestResult && (
              <div style={{
                marginTop: '16px', padding: '12px', borderRadius: '8px',
                backgroundColor: ingestResult.status === 'stored' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${ingestResult.status === 'stored' ? '#bbf7d0' : '#fecaca'}`
              }}>
                <strong>{ingestResult.status === 'stored' ? '✅' : '⚠️'} {ingestResult.status === 'stored' ? t('atmCopilotModule.reqLab.statusStored') : t('atmCopilotModule.reqLab.statusError')}</strong>
                {ingestResult.normalizedSections && (
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <p><strong>{t('atmCopilotModule.reqLab.intent')}:</strong> {ingestResult.normalizedSections.intent}</p>
                    <p><strong>{t('atmCopilotModule.reqLab.conditions')}:</strong> {(ingestResult.normalizedSections.conditions || []).join(', ') || '—'}</p>
                    <p><strong>{t('atmCopilotModule.reqLab.constraints')}:</strong> {(ingestResult.normalizedSections.constraints || []).join(', ') || '—'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stored Bundles */}
          <div style={{ ...cardStyle, marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
              📦 {t('atmCopilotModule.reqLab.storedBundles')} ({bundles.length})
            </h3>
            {bundles.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('atmCopilotModule.reqLab.noBundles')}</p>
            )}
            {bundles.map(b => (
              <div key={b._id} style={{
                padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                marginBottom: '8px', cursor: 'pointer',
                backgroundColor: selectedBundle === b._id ? '#eff6ff' : 'white'
              }}
              onClick={() => setSelectedBundle(selectedBundle === b._id ? null : b._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{b.title}</strong>
                    <span style={{
                      marginLeft: '8px', fontSize: '11px', padding: '2px 8px',
                      borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af'
                    }}>{t(`atmCopilotModule.sourceTypes.${b.sourceType}`, { defaultValue: b.sourceType })}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={e => { e.stopPropagation(); handleGenerate(b._id); }}
                      style={{ ...btnPrimary, padding: '6px 12px', fontSize: '12px' }}
                      disabled={generating}>
                      🧪 {t('atmCopilotModule.reqLab.generateDesign')}
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(b._id); }}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca',
                        backgroundColor: '#fff1f2', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>
                      🗑️
                    </button>
                  </div>
                </div>
                {b.tags && b.tags.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {b.tags.map((tag, i) => (
                      <span key={i} style={{
                        fontSize: '11px', padding: '1px 6px', borderRadius: '4px',
                        backgroundColor: '#f1f5f9', color: '#475569'
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Test Design Results */}
        <div>
          {generating && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧪</div>
              <p style={{ color: '#64748b' }}>{t('atmCopilotModule.reqLab.generatingDesign')}</p>
            </div>
          )}

          {testDesign && testDesign.status === 'ok' && testDesign.design && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  🧪 {t('atmCopilotModule.reqLab.testDesignResult')}
                </h3>
                <button onClick={() => handleExportMd(testDesign.design._id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
                    backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>
                  📄 {t('atmCopilotModule.export.markdown')}
                </button>
              </div>

              <p style={{ fontSize: '14px', color: '#334155', marginBottom: '12px' }}>
                <strong>{t('atmCopilotModule.reqLab.intent')}:</strong> {testDesign.design.intent}
              </p>

              {testDesign.design.assumptions?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>
                    {t('atmCopilotModule.reqLab.assumptions')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {testDesign.design.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {renderTestList(testDesign.design.positiveTests, t('atmCopilotModule.reqLab.positiveTests'), '#10b981')}
              {renderTestList(testDesign.design.negativeTests, t('atmCopilotModule.reqLab.negativeTests'), '#ef4444')}
              {renderTestList(testDesign.design.edgeCases, t('atmCopilotModule.reqLab.edgeCases'), '#f59e0b')}

              {testDesign.design.automationCandidates?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>
                    🤖 {t('atmCopilotModule.reqLab.automationCandidates')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {testDesign.design.automationCandidates.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {testDesign.design.openQuestions?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>
                    ❓ {t('atmCopilotModule.reqLab.openQuestions')}
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    {testDesign.design.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {testDesign && testDesign.status === 'fallback' && (
            <div style={{ ...cardStyle, backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
              <p>⚠️ {testDesign.message}</p>
            </div>
          )}

          {/* Recent Designs */}
          {designs.length > 0 && (
            <div style={{ ...cardStyle, marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
                📋 {t('atmCopilotModule.reqLab.recentDesigns')} ({designs.length})
              </h3>
              {designs.map(d => (
                <div key={d._id} style={{
                  padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '13px' }}>{d.intent || d.requirementTitle || t('atmCopilotModule.reqLab.designFallback')}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <button onClick={() => handleExportMd(d._id)}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db',
                      backgroundColor: 'white', cursor: 'pointer', fontSize: '11px' }}>
                    📄 MD
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementLab;
