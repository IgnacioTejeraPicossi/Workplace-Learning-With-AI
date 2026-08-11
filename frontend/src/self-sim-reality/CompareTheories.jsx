import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * CompareTheories — Self-Simulating Reality Agent V2
 *
 * Enter two theories/positions → a structured, epistemically-tagged side-by-side:
 * each side grounded via the vector store (its title + evidence level), then the
 * LLM produces agreements, differences, the relation, and an honest note on what
 * neither settles. Never declares a "winner".
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const PAIRS = [
  ['iit', 'gnw'],
  ['oph', 'celestial'],
  ['rovelli', 'consciousness'],
];

export default function CompareTheories() {
  const { t, i18n } = useTranslation();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const lang = ['en', 'es', 'no'].includes(i18n.language) ? i18n.language : 'en';

  const run = useCallback(async (qa, qb) => {
    const x = (qa || '').trim();
    const y = (qb || '').trim();
    if (!x || !y) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/self-sim-reality/compare-theories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: x, b: y, lang }),
      });
      if (!res.ok) setError({ kind: 'http', status: res.status });
      else setResult(await res.json());
    } catch (e) {
      setError({ kind: 'network', message: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const onSubmit = (e) => { e.preventDefault(); run(a, b); };

  const loadPair = (key) => {
    const x = t(`selfSimReality.compare.pairs.${key}.a`);
    const y = t(`selfSimReality.compare.pairs.${key}.b`);
    setA(x); setB(y); run(x, y);
  };

  const sideCard = (side, data) => {
    const colors = LEVEL_COLORS[data.level] || LEVEL_COLORS.unsupported;
    return (
      <div style={{ ...panel, borderTop: `4px solid ${colors.border}`, flex: 1, minWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{side}</span>
          <strong style={{ fontSize: 15, color: '#1e293b' }}>{data.title}</strong>
          <EpistemicBadge level={data.level} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{data.summary}</p>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={panel}>
        <h3 style={panelTitle}>⚖️ {t('selfSimReality.compare.title')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.compare.subtitle')}</p>
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} style={{ ...panel, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={t('selfSimReality.compare.placeholderA')}
            style={{
              flex: 1, minWidth: 200, padding: '12px 14px', border: '1px solid #cbd5e1',
              borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box',
            }}
          />
          <span style={{ alignSelf: 'center', fontWeight: 800, color: '#7c3aed' }}>vs</span>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder={t('selfSimReality.compare.placeholderB')}
            style={{
              flex: 1, minWidth: 200, padding: '12px 14px', border: '1px solid #cbd5e1',
              borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading || !a.trim() || !b.trim()} style={{
            background: loading || !a.trim() || !b.trim() ? '#c4b5fd' : '#7c3aed', color: 'white',
            border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13,
            fontWeight: 700, cursor: loading || !a.trim() || !b.trim() ? 'default' : 'pointer',
          }}>
            {loading ? t('selfSimReality.compare.comparing') : `⚖️ ${t('selfSimReality.compare.compareBtn')}`}
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{t('selfSimReality.compare.orTryPair')}</span>
          {PAIRS.map(([ka]) => (
            <button key={ka} type="button" onClick={() => loadPair(ka)} style={{
              background: '#f5f3ff', color: '#6b21a8', border: '1px solid #ddd6fe',
              borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}>
              {t(`selfSimReality.compare.pairs.${ka}.a`)} vs {t(`selfSimReality.compare.pairs.${ka}.b`)}
            </button>
          ))}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error.kind === 'http'
              ? t('selfSimReality.compare.errors.http', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })
              : t('selfSimReality.compare.errors.network')}
          </p>
        </div>
      )}

      {/* Result */}
      {result && !error && (
        <>
          {result.is_mock && (
            <div style={{ display: 'flex' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, background: '#fbbf24', color: '#78350f',
                padding: '2px 8px', borderRadius: 999, letterSpacing: 0.5,
              }}>MOCK</span>
            </div>
          )}

          {/* Side-by-side */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {sideCard('A', result.a)}
            {sideCard('B', result.b)}
          </div>

          {/* Relation */}
          <div style={{ ...panel, background: '#eef2ff', borderColor: '#c7d2fe' }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: '#4338ca',
            }}>
              🔗 {t('selfSimReality.compare.relationLabel')}: {t(`selfSimReality.compare.relations.${result.relation}`, { defaultValue: result.relation })}
            </span>
            {result.relation_note && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#1e293b', lineHeight: 1.55 }}>{result.relation_note}</p>
            )}
          </div>

          {/* Agreements */}
          {result.agreements?.length > 0 && (
            <div style={{ ...panel, background: '#f0fdf4', borderColor: '#86efac' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ✓ {t('selfSimReality.compare.agreements')}
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.agreements.map((x, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, marginBottom: 3 }}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Differences */}
          {result.differences?.length > 0 && (
            <div style={panel}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#7c2d12', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚔ {t('selfSimReality.compare.differences')}
              </h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {result.differences.map((d, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{d.point}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: '#475569' }}>
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>A · </span>{d.a}
                      </div>
                      <div style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: '#475569' }}>
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>B · </span>{d.b}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Honest note */}
          {result.honest_note && (
            <div style={{ ...panel, background: '#fffbeb', borderColor: '#fde68a' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#78350f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚖ {t('selfSimReality.compare.honestNote')}
              </span>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#78350f', lineHeight: 1.55 }}>{result.honest_note}</p>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <div style={{
        ...panel, background: '#faf5ff', borderColor: '#e9d5ff',
        fontSize: 11, color: '#6b21a8', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.compare.disclaimer')}
      </div>
    </div>
  );
}
