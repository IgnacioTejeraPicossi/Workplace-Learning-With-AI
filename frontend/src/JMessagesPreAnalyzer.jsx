import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';

// API base URL
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export default function JMessagesPreAnalyzer() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showToc, setShowToc] = useState(true);
  const [status, setStatus] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [aiComplexity, setAiComplexity] = useState(() => {
    return localStorage.getItem('jMessagesPreAnalyzerAiComplexity') || 'medium';
  });
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('jMessagesPreAnalyzerTemperature');
    const v = saved != null ? Number(saved) : 0.2;
    return Number.isFinite(v) ? v : 0.2;
  });
  const [apiProvider, setApiProvider] = useState('openai');
  const [itemaiModel, setItemaiModel] = useState(() => {
    return localStorage.getItem('itemaiCurrentModel') || null;
  });
  const [preAnalyzePrompt, setPreAnalyzePrompt] = useState('');

  // Load pre-analyze prompt from backend
  useEffect(() => {
    const loadPreAnalyzePrompt = async () => {
      try {
        const resp = await fetchWithAuth(`${API_BASE}/api/j-messages/pre-analyze/prompt`);
        const data = await resp.json();
        if (data.template) {
          setPreAnalyzePrompt(data.template);
        }
      } catch (err) {
        console.error('Failed to load pre-analyze prompt:', err);
        setPreAnalyzePrompt('(Failed to load prompt from server)');
      }
    };
    loadPreAnalyzePrompt();
  }, []);

  // Load API provider from localStorage and listen for changes
  useEffect(() => {
    const savedProvider = localStorage.getItem('apiProvider') || 'openai';
    setApiProvider(savedProvider);
    if (savedProvider === 'itemai' || savedProvider === 'itemserverai') {
      const model = localStorage.getItem('itemaiCurrentModel');
      setItemaiModel(model);
    }
    
    const handleStorageChange = (e) => {
      if (e.key === 'apiProvider') {
        setApiProvider(e.newValue || 'openai');
        if (e.newValue === 'itemai' || e.newValue === 'itemserverai') {
          const model = localStorage.getItem('itemaiCurrentModel');
          setItemaiModel(model);
        }
      } else if (e.key === 'itemaiCurrentModel') {
        setItemaiModel(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleApiProviderChange = () => {
      const currentProvider = localStorage.getItem('apiProvider') || 'openai';
      setApiProvider(currentProvider);
      if (currentProvider === 'itemai' || currentProvider === 'itemserverai') {
        const model = localStorage.getItem('itemaiCurrentModel');
        setItemaiModel(model);
      }
    };
    
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
    localStorage.setItem('jMessagesPreAnalyzerAiComplexity', aiComplexity);
  }, [aiComplexity]);

  // Save temperature to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('jMessagesPreAnalyzerTemperature', String(temperature));
  }, [temperature]);

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
      params.append('complexity', aiComplexity);
      if (Number.isFinite(temperature)) params.append('temperature', String(temperature));
      const url = `${API_BASE}/api/j-messages/pre-analyze${params.toString() ? `?${params.toString()}` : ''}`;
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
      if (f && (name.endsWith('.docx') || name.endsWith('.pdf') || name.endsWith('.json') || name.endsWith('.html') || name.endsWith('.htm'))) setFile(f);
      else setError(t('jMessages.preAnalyzer.pleaseDropFile'));
    }
  };

  const scrollToAnchor = (anchor) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const exportDocx = async () => {
    if (!result) return;
    try {
      const resp = await fetchWithAuth(`${API_BASE}/api/j-messages/pre-analyze/export-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `j-message-pre-analyzed-${result.id || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setStatus(t('jMessages.preAnalyzer.exported'));
    } catch (e) {
      setStatus(`${t('jMessages.preAnalyzer.exportFailed')}: ${String(e)}`);
    } finally {
      setTimeout(() => setStatus(''), 2500);
    }
  };

  const exportMarkdown = () => {
    if (!result) return;
    const lines = [];
    if (result.title) lines.push(`# ${result.title}`);
    
    if (Array.isArray(result.toc) && result.toc.length) {
      lines.push('', '## Innhold');
      const renderToc = (items, lvl = 0) => {
        items.forEach(x => {
          lines.push(`${'  '.repeat(lvl)}- ${x.title}`);
          if (x.children) renderToc(x.children, lvl + 1);
        });
      };
      renderToc(result.toc);
      lines.push('');
    }
    
    // Use raw_text for markdown body (safer than HTML)
    if (result.raw_text) {
      lines.push('---', '', result.raw_text);
    }
    
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `j-message-pre-analyzed-${result.id || 'document'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(t('jMessages.preAnalyzer.exported'));
    setTimeout(() => setStatus(''), 2500);
  };

  const exportPDF = () => {
    if (!result) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const title = result.title || 'J-message Pre-Analyzed';
    const html = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1,h2,h3 { color: #111; }
            .toc ul { margin: 0 0 8px 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${Array.isArray(result.toc) && result.toc.length > 0 ? `
            <div class="toc">
              <h2>Innhold</h2>
              <ul>
                ${result.toc.map(item => `
                  <li>${item.title}
                    ${item.children && item.children.length > 0 ? `
                      <ul>
                        ${item.children.map(child => `<li>${child.title}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          <div>${result.body_html || result.raw_text || ''}</div>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 250);
    setStatus(t('jMessages.preAnalyzer.exported'));
    setTimeout(() => setStatus(''), 2500);
  };

  const exportJSON = () => {
    if (!result) return;
    const jsonData = {
      id: result.id || null,
      title: result.title || null,
      toc: result.toc || [],
      body_html: result.body_html || '',
      raw_text: result.raw_text || '',
      type: result.type || 'pre-analyzed'
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `j-message-pre-analyzed-${result.id || 'document'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(t('jMessages.preAnalyzer.exported'));
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>📝 {t('jMessages.preAnalyzer.title')}</h2>
      <p style={{ marginTop: 0, color: colors.textSecondary }}>
        {t('jMessages.preAnalyzer.description')}
      </p>

      <div style={headerStyle}>
        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('jmsg-pre-file-input').click()}
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
          title="Drag & drop .docx or .pdf here or click to browse"
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
          <div style={{ fontWeight: 600, color: colors.text }}>
            {dragActive ? t('jMessages.preAnalyzer.dropFile') : t('jMessages.preAnalyzer.dragDrop')}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            {t('jMessages.preAnalyzer.supports')}
          </div>
          {file && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
              Selected: <strong>{file.name}</strong>
            </div>
          )}
        </div>
        <input
          id="jmsg-pre-file-input"
          type="file"
          accept=".docx,.pdf,.json,.html,.htm"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
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
          {isLoading ? t('jMessages.preAnalyzer.processing') : t('jMessages.preAnalyzer.analyzeFile')}
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
            {t('jMessages.preAnalyzer.apiConfig')}: <strong style={{ color: colors.text }}>
              {apiProvider === 'itemai' ? 'ItemAI' : apiProvider === 'itemserverai' ? 'ItemServerAI' : apiProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}
            </strong>
          </span>
          {(apiProvider === 'itemai' || apiProvider === 'itemserverai') ? (
            <>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>|</span>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>
                {t('jMessages.preAnalyzer.model')}: <strong style={{ color: colors.text }}>
                  {itemaiModel || t('jMessages.preAnalyzer.modelNotSet')}
                </strong>
              </span>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>|</span>
              <label
                style={{ fontSize: 12, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}
                title="Lower temperature = more deterministic. Higher = more variation."
              >
                {t('jMessages.preAnalyzer.temperature')}:
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  style={{ width: 110 }}
                />
                <span style={{ minWidth: 28, textAlign: 'right', color: colors.text }}>
                  {Number.isFinite(temperature) ? temperature.toFixed(1) : '—'}
                </span>
              </label>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>|</span>
              <label style={{ fontSize: 12, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('jMessages.preAnalyzer.aiLevel')}:
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
                  <option value="low">{t('jMessages.preAnalyzer.aiLevelLow')} (GPT-3.5)</option>
                  <option value="medium">{t('jMessages.preAnalyzer.aiLevelMedium')} (GPT-4o-mini)</option>
                  <option value="high">{t('jMessages.preAnalyzer.aiLevelHigh')} (GPT-4o / GPT-5 if available)</option>
                </select>
              </label>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>|</span>
              <label
                style={{ fontSize: 12, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}
                title="Lower temperature = more deterministic. Higher = more variation."
              >
                {t('jMessages.preAnalyzer.temperature')}:
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  style={{ width: 110 }}
                />
                <span style={{ minWidth: 28, textAlign: 'right', color: colors.text }}>
                  {Number.isFinite(temperature) ? temperature.toFixed(1) : '—'}
                </span>
              </label>
            </>
          )}
        </div>
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

      {/* Prompt Display Panel */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>🧩</span> {t('jMessages.preAnalyzer.promptTitle', { defaultValue: 'Pre-Analyze Prompt' })}
        </h2>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            {t('jMessages.preAnalyzer.nativePrompt', { defaultValue: 'Native prompt' })}
          </div>
          <textarea
            readOnly
            value={preAnalyzePrompt || t('jMessages.preAnalyzer.loadingPrompt', { defaultValue: '(Loading prompt...)' })}
            style={{ 
              width: '100%', 
              minHeight: 200, 
              padding: 12, 
              borderRadius: 8, 
              border: '1px solid #e2e8f0', 
              background: '#f8fafc', 
              color: '#64748b', 
              fontFamily: 'monospace', 
              fontSize: '0.9em',
              lineHeight: '1.5'
            }}
          />
          <div style={{ marginTop: 8, fontSize: '0.85em', color: '#64748b' }}>
            {t('jMessages.preAnalyzer.promptDescription', { 
              defaultValue: 'This prompt is used to rewrite J-messages according to lovteknikk rules. The prompt includes instructions and references the lovteknikkboka-oppdatert.md document.' 
            })}
          </div>
        </div>
      </div>

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
            <strong>{showToc ? t('jMessages.preAnalyzer.innhold') : t('jMessages.preAnalyzer.showInnhold')}</strong>
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
            {result.title && (
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{result.title}</h3>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
              <button
                onClick={exportDocx}
                style={{
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                {t('jMessages.preAnalyzer.exportDOCX', { defaultValue: 'Export DOCX' })}
              </button>
              <button
                onClick={exportMarkdown}
                style={{
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                {t('jMessages.preAnalyzer.exportMD', { defaultValue: 'Export MD' })}
              </button>
              <button
                onClick={exportPDF}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                {t('jMessages.preAnalyzer.exportPDF', { defaultValue: 'Export PDF' })}
              </button>
              <button
                onClick={exportJSON}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                {t('jMessages.preAnalyzer.exportJSON', { defaultValue: 'Export JSON' })}
              </button>
            </div>
          </div>

          {/* TOC */}
          {showToc && result.toc && Array.isArray(result.toc) && result.toc.length > 0 && (
            <nav
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12
              }}
            >
              {result.toc.map((item, idx) => (
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
              ))}
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
