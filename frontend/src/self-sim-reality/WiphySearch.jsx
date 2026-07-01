import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';

/**
 * WiphySearch — thin UI over the public wiphy.org search endpoint.
 *
 * Fetches https://wiphy.org/api/search?q=<query> directly from the browser
 * (the endpoint is public, no auth). If the request fails for CORS reasons,
 * we surface an explanatory message and a suggestion to open the page in a
 * new tab — no silent failure.
 *
 * NOT a full MCP integration: WiPhy speaks the MCP protocol on /mcp, but
 * that path is designed for MCP clients (Claude Desktop, agent frameworks),
 * not for browsers. The plain /api/search endpoint is a light REST facade
 * over the same underlying corpus, which is what we can reach from here.
 *
 * The Roadmap tab still flags full MCP integration as a V1+ backend task.
 */

const WIPHY_BASE = 'https://wiphy.org';
const SEARCH_URL = (q) => `${WIPHY_BASE}/api/search?q=${encodeURIComponent(q)}`;
const STATS_URL  = `${WIPHY_BASE}/api/stats`;
const DOCS_URL   = `${WIPHY_BASE}/docs`;

// Read a field defensively from either camelCase or snake_case shapes.
const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return null;
};

// Normalise one result item to a common shape.
const normaliseResult = (raw) => ({
  paperId:   pick(raw, 'paper_id', 'paperId', 'arxiv_id', 'arxivId', 'paper', 'id'),
  claimId:   pick(raw, 'claim_id', 'claimId', 'claim'),
  text:      pick(raw, 'text', 'claim_text', 'claimText', 'body', 'sentence') || '',
  concepts:  pick(raw, 'concepts', 'tags', 'keywords') || [],
  score:     pick(raw, 'score', 'similarity', 'relevance'),
});

// The API may return an array directly, {results: [...]} or {items: [...]}.
const extractResults = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.items))   return json.items;
  if (Array.isArray(json?.hits))    return json.hits;
  return [];
};

const arxivUrl = (paperId) => {
  if (!paperId) return null;
  const clean = String(paperId).replace(/^arxiv:/i, '').trim();
  return `https://arxiv.org/abs/${clean}`;
};

export default function WiphySearch() {
  const { t } = useTranslation();
  const [query, setQuery]       = useState('celestial holography');
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [stats, setStats]       = useState(null);
  const [statsError, setStatsError] = useState(false);

  // Load corpus stats once (best-effort; failure is fine, we hide the block).
  useEffect(() => {
    let cancelled = false;
    fetch(STATS_URL)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(j => { if (!cancelled) setStats(j); })
      .catch(() => { if (!cancelled) setStatsError(true); });
    return () => { cancelled = true; };
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError(null); setResults(null);
    try {
      const res = await fetch(SEARCH_URL(q));
      if (!res.ok) {
        setError({ kind: 'http', status: res.status });
      } else {
        const json = await res.json();
        setResults(extractResults(json).map(normaliseResult));
      }
    } catch (e) {
      // Fetch failure with no `res` is almost always CORS or network.
      const message = String(e && e.message || e);
      const isCors = /failed to fetch|networkerror|cors/i.test(message);
      setError({ kind: isCors ? 'cors' : 'network', message });
    } finally {
      setLoading(false);
    }
  }, [query]);

  const onSubmit = (e) => { e.preventDefault(); runSearch(); };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Hero */}
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <h3 style={{ ...panelTitle, margin: 0 }}>🔍 {t('selfSimReality.wiphySearch.title')}</h3>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999,
          }}>MCP · {t('selfSimReality.wiphySearch.publicEndpoint')}</span>
        </div>
        <p style={{ ...subtle, margin: '0 0 6px' }}>{t('selfSimReality.wiphySearch.subtitle')}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
          {t('selfSimReality.wiphySearch.source')}{' '}
          <a href={WIPHY_BASE} target="_blank" rel="noopener noreferrer" style={{ color: '#6b21a8', fontWeight: 600 }}>
            wiphy.org
          </a>
          {' · '}
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#6b21a8' }}>
            /docs
          </a>
        </p>
      </div>

      {/* Corpus stats (best-effort) */}
      {stats && !statsError && (
        <div style={{ ...panel, background: '#f5f3ff', borderColor: '#c4b5fd' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}>
            {[
              { key: 'papers',        label: t('selfSimReality.wiphySearch.stats.papers'),        value: pick(stats, 'papers', 'papers_total', 'n_papers') },
              { key: 'abstractOnly',  label: t('selfSimReality.wiphySearch.stats.abstractOnly'),  value: pick(stats, 'abstract_only', 'abstractOnly') },
              { key: 'claims',        label: t('selfSimReality.wiphySearch.stats.claims'),        value: pick(stats, 'claims', 'claims_total', 'n_claims') },
              { key: 'concepts',      label: t('selfSimReality.wiphySearch.stats.concepts'),      value: pick(stats, 'concepts', 'concepts_total', 'n_concepts') },
            ].map(s => s.value != null && (
              <div key={s.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4c1d95' }}>
                  {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#6b21a8' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search form */}
      <div style={panel}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('selfSimReality.wiphySearch.placeholder')}
            style={{
              flex: 1, minWidth: 240, padding: '10px 14px',
              border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14,
              fontFamily: 'inherit', color: '#1e293b',
            }}
          />
          <button type="submit" disabled={loading || !query.trim()} style={{
            background: loading ? '#c4b5fd' : '#7c3aed', color: 'white',
            border: 'none', borderRadius: 8, padding: '10px 20px',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          }}>
            {loading
              ? t('selfSimReality.wiphySearch.searching')
              : t('selfSimReality.wiphySearch.searchBtn')}
          </button>
        </form>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: '#94a3b8' }}>
          {t('selfSimReality.wiphySearch.hint')}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
            {error.kind === 'cors'
              ? `⚠ ${t('selfSimReality.wiphySearch.errors.corsTitle')}`
              : error.kind === 'http'
                ? `⚠ ${t('selfSimReality.wiphySearch.errors.httpTitle', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })}`
                : `⚠ ${t('selfSimReality.wiphySearch.errors.networkTitle')}`}
          </h4>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#7f1d1d', lineHeight: 1.5 }}>
            {error.kind === 'cors'
              ? t('selfSimReality.wiphySearch.errors.corsBody')
              : t('selfSimReality.wiphySearch.errors.genericBody')}
          </p>
          <a
            href={SEARCH_URL(query)}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '6px 12px', borderRadius: 6,
              background: 'white', border: '1px solid #fecaca',
              fontSize: 12, fontWeight: 600, color: '#991b1b',
              textDecoration: 'none',
            }}
          >
            ↗ {t('selfSimReality.wiphySearch.errors.openInBrowser')}
          </a>
        </div>
      )}

      {/* Empty results */}
      {results && results.length === 0 && !error && (
        <div style={{ ...panel, textAlign: 'center', color: '#64748b' }}>
          {t('selfSimReality.wiphySearch.noResults', { q: query })}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            {t('selfSimReality.wiphySearch.resultsCount', { count: results.length })}
          </div>
          {results.map((r, i) => {
            const url = arxivUrl(r.paperId);
            return (
              <div key={i} style={panel}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  {r.paperId && (
                    url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{
                        fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                        color: '#2563eb', textDecoration: 'none',
                        background: '#eff6ff', padding: '2px 8px', borderRadius: 6,
                      }}>
                        {r.paperId} ↗
                      </a>
                    ) : (
                      <span style={{
                        fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                        color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 6,
                      }}>{r.paperId}</span>
                    )
                  )}
                  {r.claimId && (
                    <span style={{
                      fontFamily: 'monospace', fontSize: 11, color: '#64748b',
                    }}>
                      claim {r.claimId}
                    </span>
                  )}
                  {r.score != null && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, color: '#94a3b8',
                      fontFamily: 'monospace',
                    }}>
                      score: {typeof r.score === 'number' ? r.score.toFixed(3) : r.score}
                    </span>
                  )}
                </div>
                {r.text && (
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#1e293b', lineHeight: 1.55 }}>
                    {r.text}
                  </p>
                )}
                {Array.isArray(r.concepts) && r.concepts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.concepts.map((c, ci) => (
                      <span key={ci} style={{
                        fontSize: 11, color: '#6b21a8',
                        background: '#f5f3ff', border: '1px solid #ddd6fe',
                        padding: '1px 8px', borderRadius: 999,
                      }}>
                        {typeof c === 'string' ? c : (c?.name || c?.label || JSON.stringify(c))}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Epistemic footnote — keep the module's discipline */}
      <div style={{
        ...panel, background: '#fffbeb', borderColor: '#fde68a',
        fontSize: 11, color: '#78350f', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.wiphySearch.disclaimer')}
      </div>
    </div>
  );
}
