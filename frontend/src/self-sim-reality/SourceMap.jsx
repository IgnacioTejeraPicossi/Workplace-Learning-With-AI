import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * SourceMap — Self-Simulating Reality Agent V2
 *
 * Type a topic → get the most relevant source chunks from the curated OPH +
 * science knowledge base, ranked by a real vector store (cosine similarity),
 * each carrying its epistemic level and citations. No LLM — fast, deterministic,
 * and cheap. The response says which backend answered:
 *   - "embeddings" — dense semantic vectors (finds paraphrases with no shared words)
 *   - "tfidf"      — sparse keyword vectors (deterministic offline fallback)
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export default function SourceMap() {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async (q) => {
    const query = (q || '').trim();
    if (!query) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/self-sim-reality/source-map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: query, k: 6 }),
      });
      if (!res.ok) setError({ kind: 'http', status: res.status });
      else setResult(await res.json());
    } catch (e) {
      setError({ kind: 'network', message: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = (e) => { e.preventDefault(); run(topic); };

  const examples = [
    t('selfSimReality.sourceMap.examples.observer'),
    t('selfSimReality.sourceMap.examples.simulation'),
    t('selfSimReality.sourceMap.examples.time'),
    t('selfSimReality.sourceMap.examples.ai'),
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={panel}>
        <h3 style={panelTitle}>🗂️ {t('selfSimReality.sourceMap.title')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.sourceMap.subtitle')}</p>
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} style={{ ...panel, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('selfSimReality.sourceMap.placeholder')}
            style={{
              flex: 1, padding: '12px 14px', border: '1px solid #cbd5e1',
              borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box',
            }}
          />
          <button type="submit" disabled={loading || !topic.trim()} style={{
            background: loading || !topic.trim() ? '#c4b5fd' : '#7c3aed', color: 'white',
            border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 13,
            fontWeight: 700, cursor: loading || !topic.trim() ? 'default' : 'pointer',
          }}>
            {loading ? t('selfSimReality.sourceMap.mapping') : `🔍 ${t('selfSimReality.sourceMap.mapBtn')}`}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {examples.map((ex, i) => (
            <button key={i} type="button" onClick={() => { setTopic(ex); run(ex); }} style={{
              background: '#f5f3ff', color: '#6b21a8', border: '1px solid #ddd6fe',
              borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left',
            }}>{ex}</button>
          ))}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error.kind === 'http'
              ? t('selfSimReality.sourceMap.errors.http', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })
              : t('selfSimReality.sourceMap.errors.network')}
          </p>
        </div>
      )}

      {/* Results */}
      {result && !error && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {t('selfSimReality.sourceMap.foundCount', { count: result.count })}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
              background: result.backend === 'embeddings' ? '#ede9fe' : '#e2e8f0',
              color: result.backend === 'embeddings' ? '#6b21a8' : '#475569',
              border: `1px solid ${result.backend === 'embeddings' ? '#c4b5fd' : '#cbd5e1'}`,
              padding: '2px 8px', borderRadius: 999,
            }}>
              {result.backend === 'embeddings'
                ? `🧠 ${t('selfSimReality.sourceMap.backend.embeddings')}`
                : `🔤 ${t('selfSimReality.sourceMap.backend.tfidf')}`}
            </span>
          </div>

          {result.results.map((r) => {
            const colors = LEVEL_COLORS[r.level] || LEVEL_COLORS.unsupported;
            const pct = Math.max(4, Math.round((r.score || 0) * 100));
            return (
              <div key={r.id} style={{ ...panel, borderLeft: `4px solid ${colors.border}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <strong style={{ fontSize: 14, color: '#1e293b' }}>{r.title}</strong>
                  <EpistemicBadge level={r.level} />
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                    {t('selfSimReality.sourceMap.relevance')}: {pct}%
                  </span>
                </div>
                {/* relevance bar */}
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: colors.fg, borderRadius: 999 }} />
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{r.claim}</p>
                {r.sources?.length > 0 && (
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>📎 {r.sources.join(' · ')}</p>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Disclaimer */}
      <div style={{
        ...panel, background: '#fffbeb', borderColor: '#fde68a',
        fontSize: 11, color: '#78350f', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.sourceMap.disclaimer')}
      </div>
    </div>
  );
}
