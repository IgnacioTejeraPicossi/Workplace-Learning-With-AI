import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';
import PromptPanel from './components/PromptPanel';

export default function JMessagesAnalyzer() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showToc, setShowToc] = useState(true);
  const [summaryLength, setSummaryLength] = useState("");
  const [status, setStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [aiComplexity, setAiComplexity] = useState(() => {
    return localStorage.getItem('jMessagesAiComplexity') || 'low';
  });
  const [apiProvider, setApiProvider] = useState('openai');
  const [itemaiModel, setItemaiModel] = useState(() => {
    return localStorage.getItem('itemaiCurrentModel') || null;
  });

  // Load API provider from localStorage and listen for changes
  useEffect(() => {
    const savedProvider = localStorage.getItem('apiProvider') || 'openai';
    setApiProvider(savedProvider);
    // Load ItemAI model if provider is ItemAI
    if (savedProvider === 'itemai') {
      const model = localStorage.getItem('itemaiCurrentModel');
      setItemaiModel(model);
    }
    
    // Listen for storage events (when API Config is changed in another tab/component)
    const handleStorageChange = (e) => {
      if (e.key === 'apiProvider') {
        setApiProvider(e.newValue || 'openai');
        if (e.newValue === 'itemai') {
          const model = localStorage.getItem('itemaiCurrentModel');
          setItemaiModel(model);
        }
      } else if (e.key === 'itemaiCurrentModel') {
        setItemaiModel(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (when changed in same tab)
    const handleApiProviderChange = () => {
      const currentProvider = localStorage.getItem('apiProvider') || 'openai';
      setApiProvider(currentProvider);
      // Update ItemAI model if available
      if (currentProvider === 'itemai') {
        const model = localStorage.getItem('itemaiCurrentModel');
        setItemaiModel(model);
      }
    };
    
    // Listen for ItemAI model updates
    const handleItemaiModelChange = () => {
      const model = localStorage.getItem('itemaiCurrentModel');
      setItemaiModel(model);
    };
    
    window.addEventListener('apiProviderChanged', handleApiProviderChange);
    window.addEventListener('itemaiModelChanged', handleItemaiModelChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiProviderChanged', handleApiProviderChange);
      window.removeEventListener('itemaiModelChanged', handleItemaiModelChange);
    };
  }, []);

  // Save complexity to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('jMessagesAiComplexity', aiComplexity);
  }, [aiComplexity]);

  // Load categories from saved J-messages
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const resp = await fetchWithAuth('/api/j-messages/list');
        const data = await resp.json();
        if (data.success && Array.isArray(data.items)) {
          const categories = Array.from(
            new Set(data.items.flatMap((i) => Array.isArray(i.categories) ? i.categories : []).filter(Boolean))
          ).sort();
          setAllCategories(categories);
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    };
    loadCategories();
  }, []);

  const headerStyle = useMemo(() => ({
    background: colors.cardBackground,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  }), [colors]);

  const onUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const params = new URLSearchParams();
      if (summaryLength) params.append('summary_length', summaryLength);
      params.append('complexity', aiComplexity);
      const url = `/api/j-messages/analyze${params.toString() ? `?${params.toString()}` : ''}`;
      const resp = await fetchWithAuth(url, {
        method: 'POST',
        body: form
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status} ${resp.statusText} - ${txt}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const onUploadNote = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const url = `/api/j-messages/analyze-note?complexity=${encodeURIComponent(aiComplexity)}`;
      const resp = await fetchWithAuth(url, {
        method: 'POST',
        body: form
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status} ${resp.statusText} - ${txt}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      const f = files[0];
      const name = (f?.name || '').toLowerCase();
      if (f && (name.endsWith('.docx') || name.endsWith('.pdf'))) setFile(f);
      else setError('Please drop a .docx or .pdf file');
    }
  };

  const scrollToAnchor = (anchor) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const saveToLibrary = async () => {
    if (!result) return;
    try {
      const resp = await fetchWithAuth('/api/j-messages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          filename: file?.name || ''
        })
      });
      const data = await resp.json();
      if (data.success) {
        setStatus(t('jMessages.analyzer.savedToLibrary'));
      } else {
        setStatus(t('jMessages.analyzer.saveFailed'));
      }
    } catch (e) {
      setStatus(`${t('jMessages.analyzer.saveFailed')}: ${String(e)}`);
    } finally {
      setTimeout(() => setStatus(''), 2500);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>📄 {t('jMessages.analyzer.title')}</h2>
      <p style={{ marginTop: 0, color: colors.textSecondary }}>
        {t('jMessages.analyzer.description')}
      </p>

      <div style={headerStyle}>
        {/* Drag & Drop Zone (single file) */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('jmsg-file-input').click()}
          style={{
            border: `2px dashed ${dragActive ? colors.primary : colors.border}`,
            borderRadius: 8,
            padding: '28px 16px',
            textAlign: 'center',
            background: dragActive ? colors.primaryLight : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            marginBottom: 12
          }}
          title="Drag & drop .docx here or click to browse"
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
          <div style={{ fontWeight: 600, color: colors.text }}>
            {dragActive ? t('jMessages.analyzer.dropFile') : t('jMessages.analyzer.dragDrop')}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            {t('jMessages.analyzer.supports')}
          </div>
          {file && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
              Selected: <strong>{file.name}</strong>
            </div>
          )}
        </div>
        <input
          id="jmsg-file-input"
          type="file"
          accept=".docx,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
        <span style={{ marginRight: 8 }}>{t('jMessages.analyzer.summary')}:</span>
        <select
          value={summaryLength}
          onChange={(e) => setSummaryLength(e.target.value)}
          style={{
            marginRight: 12,
            padding: '6px 8px',
            borderRadius: 6,
            border: `1px solid ${colors.border}`,
            background: colors.background,
            color: colors.text
          }}
        >
          <option value="">{t('jMessages.analyzer.summaryNone')}</option>
          <option value="short">{t('jMessages.analyzer.summaryShort')}</option>
          <option value="medium">{t('jMessages.analyzer.summaryMedium')}</option>
          <option value="long">{t('jMessages.analyzer.summaryLong')}</option>
        </select>
        <button
          onClick={onUpload}
          disabled={!file || isLoading}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: !file || isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? t('jMessages.analyzer.analyzing') : t('jMessages.analyzer.analyzeFile')}
        </button>
        <button
          onClick={onUploadNote}
          disabled={!file || isLoading}
          style={{
            marginLeft: 8,
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            cursor: !file || isLoading ? 'not-allowed' : 'pointer'
          }}
          title="Analyze a J-melding note (integrates with a base J-melding)"
        >
          {isLoading ? t('jMessages.analyzer.processing') : t('jMessages.analyzer.analyzeNote')}
        </button>
        <div style={{ 
          marginLeft: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          padding: '8px 12px',
          background: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          borderRadius: 8
        }}>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>
            {t('jMessages.analyzer.apiConfig')}: <strong style={{ color: colors.text }}>
              {apiProvider === 'itemai' ? 'ItemAI' : apiProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}
            </strong>
          </span>
          {apiProvider === 'itemai' ? (
            <>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>|</span>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>
                {t('jMessages.analyzer.model')}: <strong style={{ color: colors.text }}>
                  {itemaiModel || t('jMessages.analyzer.modelNotSet')}
                </strong>
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>|</span>
              <label style={{ fontSize: 12, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('jMessages.analyzer.aiLevel')}:
                <select
                  value={aiComplexity}
                  onChange={(e) => setAiComplexity(e.target.value)}
                  style={{
                    marginLeft: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.text,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  <option value="low">{t('jMessages.analyzer.aiLevelLow')} (GPT-3.5)</option>
                  <option value="medium">{t('jMessages.analyzer.aiLevelMedium')} (GPT-4o-mini)</option>
                  <option value="high">{t('jMessages.analyzer.aiLevelHigh')} (GPT-4o / GPT-5 if available)</option>
                </select>
              </label>
            </>
          )}
        </div>
        {allCategories.length > 0 && (
          <select
            style={{
              marginLeft: 8,
              padding: '6px 8px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text
            }}
            title="Available categories from saved J-messages"
          >
            <option value="">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        {error && (
          <div style={{ color: '#b91c1c', marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {error}
          </div>
        )}
        {status && (
          <div style={{ color: status.startsWith('✅') ? '#065f46' : '#b91c1c', marginTop: 8 }}>
            {status}
          </div>
        )}
      </div>

      {/* Prompt Manager */}
      <PromptPanel
        agent="j-messages"
        colors={colors}
        nativePromptText={`Du er en assistent som analyserer norske forskrifter fra Fiskeridirektoratet.
Du får teksten fra en J-melding (header + starten på forskriften).
Trekk ut metadata og returner KUN STRICT JSON uten kommentarer.
Felt:
- j_id
- title
  - replaces_id
  - replaced_by_id
- status
- valid_from
- valid_to
- category (ONE of: "Annet", "Bunnfisk", "Pelagisk fisk" - always required, use "Annet" if unsure)
- area (ARRAY of: "Andre lands soner", "Internasjonal farvann", "Nord for 62\u00B0 N", "Sør for 62\u00B0 N" - can have multiple areas, use empty array [] if none)

Tekst:
\"\"\"{header_text}\\n\\n{body_text[:4000]}\"\"\"

For notes (J-melding notes):
Extract STRICT JSON with:
- target_j_id: the J‑melding ID this note modifies (e.g., "J-195-2025"), or null if unknown
- note_type: "addendum" | "correction" | "extension" | "cancellation" | "other"
- valid_from: YYYY-MM-DD or null
- valid_to: YYYY-MM-DD or null
- affected_sections: array of strings listing affected chapters/paragraphs (e.g., "Kapittel 1", "§ 7 (sjette ledd)")
- actions: array of verbs like ["amend","replace","add","repeal"]
- summary: short human-readable summary of what the note changes`}
      />

      {result && (
        <div>
          {/* Sticky TOC bar */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              background: colors.sidebarBackground,
              borderBottom: `1px solid ${colors.border}`,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <strong>{showToc ? t('jMessages.analyzer.innhold') : t('jMessages.analyzer.showInnhold')}</strong>
            <button
              onClick={() => {
                if (!showToc) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                setShowToc((v) => !v);
              }}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '2px 8px',
                cursor: 'pointer'
              }}
              aria-expanded={showToc}
            >
              {showToc ? '−' : '+'}
            </button>
          </div>

          {/* Header metadata */}
          <div style={headerStyle}>
            {result.type === 'note' && result.note && (
              <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.background }}>
                <h4 style={{ margin: 0, color: colors.text }}>Note Analysis</h4>
                <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: colors.textSecondary }}>
                  <div><strong>Target J‑ID:</strong> {result.note.target_j_id || '—'}</div>
                  <div><strong>Type:</strong> {result.note.note_type || '—'}</div>
                  <div><strong>Valid from:</strong> {result.note.valid_from || '—'}</div>
                  <div><strong>Valid to:</strong> {result.note.valid_to || '—'}</div>
                </div>
                {Array.isArray(result.note.affected_sections) && result.note.affected_sections.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Affected sections:</strong>
                    <ul style={{ marginTop: 6 }}>
                      {result.note.affected_sections.map((s, i) => (<li key={i}>{s}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(result.note.actions) && result.note.actions.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <strong>Actions:</strong> {result.note.actions.join(', ')}
                  </div>
                )}
                {result.note.summary && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Summary:</strong>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{result.note.summary}</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><strong>{t('jMessages.analyzer.metadata.id')}:</strong> {result.id || '—'}</div>
              <div><strong>{t('jMessages.analyzer.metadata.status')}:</strong> {result.status || '—'}</div>
              <div><strong>{t('jMessages.analyzer.metadata.validFrom')}:</strong> {result.valid_from || '—'}</div>
              <div><strong>{t('jMessages.analyzer.metadata.validTo')}:</strong> {result.valid_to || '—'}</div>
              <div><strong>{t('jMessages.analyzer.metadata.replaces')}:</strong> {result.replaces || '—'}</div>
              <div><strong>{t('jMessages.analyzer.metadata.replacedBy')}:</strong> {result.replaced_by || '—'}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>{t('jMessages.analyzer.metadata.category')}:</strong>{' '}
              {result.category || (Array.isArray(result.categories) && result.categories.length > 0 ? result.categories[0] : '—')}
            </div>
            {result.area && (Array.isArray(result.area) ? result.area.length > 0 : result.area) && (
              <div style={{ marginTop: 8 }}>
                <strong>{t('jMessages.analyzer.metadata.area')}:</strong>{' '}
                {Array.isArray(result.area) ? result.area.join(', ') : result.area}
              </div>
            )}
            {result.title && (
              <h3 style={{ marginTop: 12, marginBottom: 0 }}>{result.title}</h3>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={saveToLibrary}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                💾 {t('jMessages.analyzer.saveToLibrary')}
              </button>
            </div>
          </div>

          {/* Optional Summary */}
          {result.summary && (
            <div
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 8, color: colors.text }}>
                {t('jMessages.analyzer.executiveSummary')} {result.summary_length ? `(${result.summary_length})` : ''}
              </h4>
              <div style={{ whiteSpace: 'pre-wrap', color: colors.text }}>
                {result.summary}
              </div>
            </div>
          )}

          {/* TOC */}
          {showToc && (
            <nav
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12
              }}
            >
              {Array.isArray(result.toc) && result.toc.length > 0 ? (
                result.toc.map((item, idx) => (
                  <div key={`${item.anchor}-${idx}`} style={{ marginBottom: 8 }}>
                    <button
                      onClick={() => scrollToAnchor(item.anchor)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.primary,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {item.title}
                    </button>
                    {Array.isArray(item.children) && item.children.length > 0 && (
                      <ul style={{ marginTop: 6, marginLeft: 18 }}>
                        {item.children.map((c, cidx) => (
                          <li key={`${c.anchor}-${cidx}-${item.anchor}`} style={{ marginBottom: 4 }}>
                            <button
                              onClick={() => scrollToAnchor(c.anchor)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: colors.primary,
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                            >
                              {c.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: colors.textSecondary }}>Ingen innholdsfortegnelse funnet.</div>
              )}
            </nav>
          )}

          {/* Body */}
          <article
            className="prose max-w-none"
            style={{
              background: colors.surface,
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${colors.border}`
            }}
            dangerouslySetInnerHTML={{ __html: result.body_html || '' }}
          />
        </div>
      )}
    </div>
  );
}


