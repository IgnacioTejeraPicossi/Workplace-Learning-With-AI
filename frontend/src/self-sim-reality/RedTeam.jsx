import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';

/**
 * RedTeam — Self-Simulating Reality Agent V2
 *
 * Paste a claim → a good-faith adversarial critique:
 *   1. Steelman               (the strongest fair version — attack the best form)
 *   2. Objections[]           (typed: empirical / logical / conceptual /
 *                              methodological / parsimony; each with a strength)
 *   3. What would change my mind (concrete evidence that would defeat the objections)
 *   4. Surviving core         (what honestly holds up, if any)
 *   5. Verdict                (holds_up / weakened / does_not_survive)
 *
 * Grounded via the vector store; never claims a speculative idea is "disproven".
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const VERDICT_STYLE = {
  holds_up:         { bg: '#d1fae5', fg: '#065f46', border: '#6ee7b7' },
  weakened:         { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  does_not_survive: { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
};

const STRENGTH_STYLE = {
  strong:   { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
  moderate: { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  weak:     { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' },
};

const TYPE_ICON = {
  empirical: '🔬', logical: '🧮', conceptual: '🧩', methodological: '📏', parsimony: '✂️',
};

export default function RedTeam({ prefillClaim, prefillNonce }) {
  const { t, i18n } = useTranslation();
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const lang = ['en', 'es', 'no'].includes(i18n.language) ? i18n.language : 'en';

  useEffect(() => {
    if (prefillClaim) { setClaim(prefillClaim); setResult(null); setError(null); }
  }, [prefillClaim, prefillNonce]);

  const run = useCallback(async (q) => {
    const c = (q || '').trim();
    if (!c) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/self-sim-reality/red-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: c, lang }),
      });
      if (!res.ok) setError({ kind: 'http', status: res.status });
      else setResult(await res.json());
    } catch (e) {
      setError({ kind: 'network', message: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const onSubmit = (e) => { e.preventDefault(); run(claim); };

  const examples = [
    t('selfSimReality.redTeam.examples.selfSim'),
    t('selfSimReality.redTeam.examples.consciousness'),
    t('selfSimReality.redTeam.examples.simulation'),
  ];

  const verdictStyle = result ? VERDICT_STYLE[result.verdict] || VERDICT_STYLE.weakened : null;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={panel}>
        <h3 style={panelTitle}>⚔️ {t('selfSimReality.redTeam.title')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.redTeam.subtitle')}</p>
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} style={{ ...panel, display: 'grid', gap: 12 }}>
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder={t('selfSimReality.redTeam.placeholder')}
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1',
            borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: '#1e293b',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading || !claim.trim()} style={{
            background: loading || !claim.trim() ? '#c4b5fd' : '#7c3aed', color: 'white',
            border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13,
            fontWeight: 700, cursor: loading || !claim.trim() ? 'default' : 'pointer',
          }}>
            {loading ? t('selfSimReality.redTeam.challenging') : `⚔️ ${t('selfSimReality.redTeam.challengeBtn')}`}
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{t('selfSimReality.redTeam.orTry')}</span>
          {examples.map((ex, i) => (
            <button key={i} type="button" onClick={() => { setClaim(ex); run(ex); }} style={{
              background: '#f5f3ff', color: '#6b21a8', border: '1px solid #ddd6fe',
              borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left', maxWidth: '100%',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{ex.length > 60 ? ex.slice(0, 60) + '…' : ex}</button>
          ))}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error.kind === 'http'
              ? t('selfSimReality.redTeam.errors.http', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })
              : t('selfSimReality.redTeam.errors.network')}
          </p>
        </div>
      )}

      {/* Result */}
      {result && !error && (
        <>
          {/* Verdict */}
          <div style={{
            ...panel, background: verdictStyle.bg, borderColor: verdictStyle.border,
            display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: verdictStyle.fg }}>
              {t('selfSimReality.redTeam.verdictLabel')}
            </span>
            <strong style={{ fontSize: 16, color: verdictStyle.fg }}>
              {t(`selfSimReality.redTeam.verdicts.${result.verdict}`, { defaultValue: result.verdict })}
            </strong>
            {result.is_mock && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#fbbf24', color: '#78350f', padding: '2px 8px', borderRadius: 999 }}>MOCK</span>
            )}
          </div>

          {/* Steelman */}
          {result.steelman && (
            <div style={{ ...panel, background: '#f0fdf4', borderColor: '#86efac' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🛡️ {t('selfSimReality.redTeam.steelman')}
              </h4>
              <p style={{ margin: 0, fontSize: 13.5, color: '#166534', lineHeight: 1.55, fontStyle: 'italic' }}>{result.steelman}</p>
            </div>
          )}

          {/* Objections */}
          {result.objections?.length > 0 && (
            <div style={panel}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚔ {t('selfSimReality.redTeam.objections')}
              </h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {result.objections.map((o, i) => {
                  const ss = STRENGTH_STYLE[o.strength] || STRENGTH_STYLE.moderate;
                  return (
                    <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                        <strong style={{ fontSize: 13, color: '#1e293b' }}>{TYPE_ICON[o.type] || '•'} {o.title}</strong>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6b21a8', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '1px 7px', borderRadius: 999 }}>
                          {t(`selfSimReality.redTeam.types.${o.type}`, { defaultValue: o.type })}
                        </span>
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          background: ss.bg, color: ss.fg, border: `1px solid ${ss.border}`, padding: '1px 8px', borderRadius: 999,
                        }}>
                          {t(`selfSimReality.redTeam.strengths.${o.strength}`, { defaultValue: o.strength })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.55 }}>{o.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What would change my mind */}
          {result.what_would_change_my_mind?.length > 0 && (
            <div style={{ ...panel, background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🔄 {t('selfSimReality.redTeam.changeMind')}
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.what_would_change_my_mind.map((x, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5, marginBottom: 3 }}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Surviving core */}
          {result.surviving_core && (
            <div style={{ ...panel, background: '#faf5ff', borderColor: '#e9d5ff' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ✓ {t('selfSimReality.redTeam.survivingCore')}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6b21a8', lineHeight: 1.55 }}>{result.surviving_core}</p>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <div style={{
        ...panel, background: '#fffbeb', borderColor: '#fde68a',
        fontSize: 11, color: '#78350f', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.redTeam.disclaimer')}
      </div>
    </div>
  );
}
