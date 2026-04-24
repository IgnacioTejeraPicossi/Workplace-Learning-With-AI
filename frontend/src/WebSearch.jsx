import React, { useState } from "react";
import { webSearch, saveWebSearchResult } from "./api";
import { useTheme } from "./ThemeContext";
import { useTranslation } from 'react-i18next';

function WebSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // array of {title, url, snippet} or string fallback
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation('common');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await webSearch(query);

      // /api/simple-search returns { results: [{title,url,snippet}], query, provider }
      // Fallback for any legacy string response
      const resultContent = data.results || data.result || JSON.stringify(data, null, 2);
      setResults(resultContent);

      // Save search result summary to MongoDB
      if (query && resultContent) {
        try {
          const snippet = Array.isArray(resultContent)
            ? resultContent.slice(0, 3).map(r => r.title).join(' | ')
            : String(resultContent).substring(0, 200);
          await saveWebSearchResult({
            title: `Search: ${query}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet,
            topic: 'Web Search',
            search_query: query,
            source: 'web_search'
          });
        } catch (saveError) {
          console.error('Error saving web search result:', saveError);
        }
      }
    } catch (error) {
      console.error("Failed to search:", error);
      setResults(t('webSearchModule.errorSearch'));
    }
    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query && !loading) handleSearch();
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text }}>{t('webSearchModule.pageTitle')}</h2>

      {/* Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('webSearchModule.placeholder')}
            style={{
              width: "100%",
              padding: "12px 16px",
              paddingLeft: "40px",
              borderRadius: 8,
              border: `2px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              fontSize: 16,
              outline: "none",
              transition: "border-color 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = colors.primary}
            onBlur={(e) => e.target.style.borderColor = colors.border}
          />
          <span style={{
            position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)", fontSize: "18px",
            color: colors.textSecondary, pointerEvents: "none"
          }}>🔍</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={handleSearch}
            disabled={loading || !query}
            style={{
              background: colors.buttonPrimary, color: "#fff", border: 0,
              borderRadius: 8, padding: "12px 20px", fontWeight: 600, fontSize: 16,
              cursor: loading || !query ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)", transition: "transform 0.1s ease",
              minWidth: "100px", whiteSpace: "nowrap"
            }}
            onMouseDown={(e) => e.target.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.target.style.transform = "scale(1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            {loading ? t('webSearchModule.searching') : t('webSearchModule.searchBtn')}
          </button>
          <button
            onClick={handleClear}
            disabled={!query && !results}
            style={{
              background: colors.cardBackground, color: colors.text,
              border: `2px solid ${colors.border}`, borderRadius: 8,
              padding: "12px 20px", fontWeight: 600, fontSize: 16,
              cursor: !query && !results ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)", transition: "all 0.2s ease",
              minWidth: "80px", whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => { if (query || results) e.target.style.borderColor = colors.primary; }}
            onMouseLeave={(e) => e.target.style.borderColor = colors.border}
          >
            {t('webSearchModule.clearBtn')}
          </button>
        </div>
      </div>

      {/* Results panel */}
      {results && (
        <div style={{
          marginTop: 16, background: colors.cardBackground, borderRadius: 8,
          padding: 20, border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)", maxHeight: "560px", overflowY: "auto"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 4, color: colors.text, fontSize: "18px", fontWeight: "600" }}>
            {t('webSearchModule.resultsHeading', { query })}
          </h3>

          {/* Structured results (DuckDuckGo array) */}
          {Array.isArray(results) ? (
            <>
              <p style={{ marginTop: 0, marginBottom: 16, fontSize: "13px", color: colors.textSecondary }}>
                {t('webSearchModule.foundResults', { count: results.length })}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    padding: "12px 16px", borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: colors.primaryLight || colors.background
                  }}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: colors.primary, fontWeight: 600, fontSize: 15, textDecoration: "none" }}
                    >
                      {r.title}
                    </a>
                    {r.snippet && (
                      <p style={{ margin: "6px 0 0 0", fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>
                        {r.snippet}
                      </p>
                    )}
                    <div style={{ marginTop: 6, fontSize: 12, color: colors.textSecondary, opacity: 0.7 }}>
                      🔗 {r.url}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Fallback: plain text response */
            <div style={{ color: colors.text, lineHeight: "1.6", fontSize: "14px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {results}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WebSearch;
