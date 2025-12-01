import React, { useState, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';

export default function JMessagesAnalyzer() {
  const { colors } = useTheme();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showToc, setShowToc] = useState(true);

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
      const resp = await fetchWithAuth('/api/j-messages/analyze', {
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

  const scrollToAnchor = (anchor) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>📄 J-messages Analyzer</h2>
      <p style={{ marginTop: 0, color: colors.textSecondary }}>
        Last opp en J-melding (.docx) for å generere metadata, innholdsfortegnelse og hovedinnhold.
      </p>

      <div style={headerStyle}>
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginRight: 12 }}
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
          {isLoading ? 'Analyserer…' : 'Analyser .docx'}
        </button>
        {error && (
          <div style={{ color: '#b91c1c', marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {error}
          </div>
        )}
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
            <strong>{showToc ? 'Innhold' : 'Vis innhold'}</strong>
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
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><strong>ID:</strong> {result.id || '—'}</div>
              <div><strong>Status:</strong> {result.status || '—'}</div>
              <div><strong>Gyldig fra:</strong> {result.valid_from || '—'}</div>
              <div><strong>Gyldig til:</strong> {result.valid_to || '—'}</div>
              <div><strong>Erstatter:</strong> {result.replaces || '—'}</div>
            </div>
            {Array.isArray(result.categories) && result.categories.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong>Kategorier:</strong>{' '}
                {result.categories.join(', ')}
              </div>
            )}
            {result.title && (
              <h3 style={{ marginTop: 12, marginBottom: 0 }}>{result.title}</h3>
            )}
          </div>

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
                result.toc.map((item) => (
                  <div key={item.anchor} style={{ marginBottom: 8 }}>
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
                        {item.children.map((c) => (
                          <li key={c.anchor} style={{ marginBottom: 4 }}>
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


