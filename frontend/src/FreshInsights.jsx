import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { webSearchAi } from "./api";
import { useTheme } from "./ThemeContext";

/**
 * FreshInsights — reusable "AI + Internet" freshness panel.
 *
 * Drop it into any module that wants a current, web-grounded, cited answer.
 * It calls the shared POST /api/web-search-ai endpoint (fresh DuckDuckGo search
 * + AI-synthesized cited answer, with an offline `is_mock` fallback) and renders
 * the answer above its sources.
 *
 * Props:
 *   query   (string, required) — the search query (localize it upstream so the
 *                                 sources come back in the user's language).
 *   title   (string, optional) — panel heading.
 *   intro   (string, optional) — short subtitle under the heading.
 *   autoLoad(bool,   optional) — fetch once on mount (default true).
 *
 * i18n: reuses the webSearchModule.* keys (answer/sources chrome) plus the
 * webSearchModule.freshInsights.* block for this panel. Uses the 'common' bundle.
 */
export default function FreshInsights({ query, title, intro, autoLoad = true }) {
  const { t } = useTranslation("common");
  const { colors } = useTheme();

  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loadedQuery, setLoadedQuery] = useState("");

  const run = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    setError(false);
    try {
      const data = await webSearchAi(query);
      setAnswer(data.answer || "");
      setResults(Array.isArray(data.results) ? data.results : []);
      setIsMock(!!data.is_mock);
      setLoadedQuery(query);
    } catch (e) {
      console.error("FreshInsights fetch failed:", e);
      setError(true);
      setAnswer("");
      setResults([]);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    if (autoLoad) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, query]);

  const hasResults = Array.isArray(results) && results.length > 0;

  return (
    <div style={{ color: colors.text }}>
      {/* Header + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <div>
          <h3 style={{ margin: 0, color: colors.text, fontSize: 18, fontWeight: 700 }}>
            {title || t("webSearchModule.freshInsights.defaultTitle")}
          </h3>
          {intro && (
            <p style={{ margin: "4px 0 0 0", color: colors.textSecondary, fontSize: 13 }}>{intro}</p>
          )}
        </div>
        <button
          onClick={run}
          disabled={loading || !query}
          style={{
            background: colors.buttonPrimary || colors.primary, color: "#fff", border: 0,
            borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14,
            cursor: loading || !query ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            opacity: loading || !query ? 0.7 : 1,
          }}
        >
          {loading ? t("webSearchModule.freshInsights.loading") : t("webSearchModule.freshInsights.refreshBtn")}
        </button>
      </div>

      <p style={{ margin: "0 0 12px 0", fontSize: 12, color: colors.textSecondary, opacity: 0.8 }}>
        {t("webSearchModule.freshInsights.poweredBy")}
      </p>

      {/* Error */}
      {error && (
        <div style={{ padding: 14, background: "#ffebee", color: "#c62828", borderRadius: 8 }}>
          {t("webSearchModule.errorSearch")}
        </div>
      )}

      {/* Loading placeholder */}
      {loading && !answer && !error && (
        <div style={{ padding: 16, color: colors.textSecondary, fontSize: 14 }}>
          {t("webSearchModule.freshInsights.loading")}
        </div>
      )}

      {/* Results */}
      {!loading && !error && loadedQuery && (
        <div style={{
          background: colors.cardBackground, borderRadius: 8, padding: 20,
          border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          {/* AI answer */}
          {answer ? (
            <div style={{
              margin: "0 0 16px 0", padding: "14px 16px", borderRadius: 8,
              background: colors.primaryLight || colors.background,
              border: `1px solid ${colors.primary}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <strong style={{ color: colors.text, fontSize: 15 }}>{t("webSearchModule.aiAnswerHeading")}</strong>
                {hasResults && (
                  <span style={{ fontSize: 12, color: colors.textSecondary }}>
                    · {t("webSearchModule.groundedNote", { count: results.length })}
                  </span>
                )}
              </div>
              <div style={{ color: colors.text, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {answer}
              </div>
              {isMock && (
                <div style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary, fontStyle: "italic" }}>
                  {t("webSearchModule.offlineNote")}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: hasResults ? 16 : 0 }}>
              <p style={{ margin: "0 0 10px 0" }}>{t("webSearchModule.noResults")}</p>
              <a
                href={`https://duckduckgo.com/?q=${encodeURIComponent(loadedQuery)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: colors.primary, fontWeight: 600, textDecoration: "none" }}
              >
                {t("webSearchModule.openOnProvider")}
              </a>
            </div>
          )}

          {/* Sources */}
          {hasResults && (
            <>
              <h4 style={{ margin: "0 0 8px 0", color: colors.text, fontSize: 14, fontWeight: 600 }}>
                {t("webSearchModule.sourcesHeading")}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", borderRadius: 8,
                    border: `1px solid ${colors.border}`, background: colors.primaryLight || colors.background,
                  }}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                       style={{ color: colors.primary, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                      [{i + 1}] {r.title}
                    </a>
                    {r.snippet && (
                      <p style={{ margin: "4px 0 0 0", fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{r.snippet}</p>
                    )}
                    <div style={{ marginTop: 4, fontSize: 12, color: colors.textSecondary, opacity: 0.7 }}>🔗 {r.url}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
