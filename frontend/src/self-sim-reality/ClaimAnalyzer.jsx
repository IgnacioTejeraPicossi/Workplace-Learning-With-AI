import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * ClaimAnalyzer — Self-Simulating Reality Agent V2
 *
 * Paste a strong claim about physics / consciousness / cosmology → get:
 *   1. Scientific core        (green panel, per-part epistemic level)
 *   2. Overreach              (red panel, per-part overreach type)
 *   3. Reformulation          (violet panel — same idea, honest framing)
 *   4. Epistemic verdict      (badge)
 *   5. Key terms              (chips — click to jump to WiPhy Search)
 *
 * The onSearchWiphy prop is optional. When provided, clicking a key term
 * routes the user to the WiPhy Search tab with the term prefilled — the
 * cross-tab bridge lives in SelfSimRealityAgent (shell).
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const VERDICT_STYLE = {
  mostly_solid:    { bg: '#d1fae5', fg: '#065f46', border: '#6ee7b7' },
  mixed:           { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  mostly_overreach:{ bg: '#fed7aa', fg: '#7c2d12', border: '#fdba74' },
  unsupported:     { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
};

const OVERREACH_ICON = {
  unsupported:         '⚠',
  category_error:      '⛔',
  conflation:          '🔀',
  overgeneralization:  '📈',
  philosophical_leap:  '🪂',
};

export default function ClaimAnalyzer({ onSearchWiphy, prefillClaim, prefillNonce }) {
  const { t, i18n } = useTranslation();
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const lang = ['en', 'es', 'no'].includes(i18n.language) ? i18n.language : 'en';

  // Cross-tab prefill: when another tab (e.g. Code of Reality) sends a claim,
  // load it into the textarea and clear any previous result.
  useEffect(() => {
    if (prefillClaim) { setClaim(prefillClaim); setResult(null); setError(null); }
  }, [prefillClaim, prefillNonce]);

  const examples = [
    t('selfSimReality.claimAnalyzer.examples.codeOfReality'),
    t('selfSimReality.claimAnalyzer.examples.simulation'),
    t('selfSimReality.claimAnalyzer.examples.consciousness'),
    t('selfSimReality.claimAnalyzer.examples.observer'),
  ];

  const runAnalyze = useCallback(async () => {
    const q = claim.trim();
    if (!q) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/claim-analyzer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: q, lang }),
      });
      if (!res.ok) {
        setError({ kind: 'http', status: res.status });
      } else {
        setResult(await res.json());
      }
    } catch (e) {
      setError({ kind: 'network', message: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [claim, lang]);

  const onSubmit = (e) => { e.preventDefault(); runAnalyze(); };
  const loadExample = (ex) => { setClaim(ex); setResult(null); setError(null); };

  const verdictStyle = result ? VERDICT_STYLE[result.epistemic_verdict] || VERDICT_STYLE.mixed : null;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={panel}>
        <h3 style={panelTitle}>🔬 {t('selfSimReality.claimAnalyzer.title')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.claimAnalyzer.subtitle')}</p>
      </div>

      {/* Input form */}
      <div style={panel}>
        <form onSubmit={onSubmit}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 700,
            color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {t('selfSimReality.claimAnalyzer.claimLabel')}
          </label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder={t('selfSimReality.claimAnalyzer.placeholder')}
            rows={4}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid #cbd5e1', borderRadius: 8,
              fontSize: 14, fontFamily: 'inherit', color: '#1e293b',
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <button type="submit" disabled={loading || !claim.trim()} style={{
              background: loading ? '#c4b5fd' : '#7c3aed', color: 'white',
              border: 'none', borderRadius: 8, padding: '10px 22px',
              fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            }}>
              {loading
                ? t('selfSimReality.claimAnalyzer.analyzing')
                : `🔍 ${t('selfSimReality.claimAnalyzer.analyzeBtn')}`}
            </button>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
              {t('selfSimReality.claimAnalyzer.orTryExample')}
            </span>
          </div>

          {/* Example buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => loadExample(ex)}
                style={{
                  background: '#f5f3ff', color: '#6b21a8',
                  border: '1px solid #ddd6fe', borderRadius: 6,
                  padding: '5px 10px', fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {ex.length > 90 ? ex.slice(0, 90) + '…' : ex}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error.kind === 'http'
              ? t('selfSimReality.claimAnalyzer.errors.http', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })
              : t('selfSimReality.claimAnalyzer.errors.network')}
          </p>
        </div>
      )}

      {/* Result */}
      {result && !error && (
        <>
          {/* Verdict + mock notice */}
          <div style={{
            ...panel,
            background: verdictStyle.bg,
            borderColor: verdictStyle.border,
            display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.8,
              textTransform: 'uppercase', color: verdictStyle.fg,
            }}>{t('selfSimReality.claimAnalyzer.verdictLabel')}</span>
            <strong style={{ fontSize: 16, color: verdictStyle.fg }}>
              {t(`selfSimReality.claimAnalyzer.verdict.${result.epistemic_verdict}`,
                 { defaultValue: result.epistemic_verdict })}
            </strong>
            {result.is_mock && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                background: '#fbbf24', color: '#78350f',
                padding: '2px 8px', borderRadius: 999, letterSpacing: 0.5,
              }}>MOCK</span>
            )}
          </div>

          {/* Scientific core */}
          {result.core_scientific?.length > 0 && (
            <div style={{ ...panel, background: '#f0fdf4', borderColor: '#86efac' }}>
              <h4 style={{
                margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#065f46',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                ✓ {t('selfSimReality.claimAnalyzer.sections.coreScientific')}
              </h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {result.core_scientific.map((c, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', background: 'white', borderRadius: 8,
                    border: '1px solid #bbf7d0',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <EpistemicBadge level={c.evidence_level} />
                    </div>
                    <p style={{
                      margin: '0 0 6px', fontSize: 13, color: '#1e293b',
                      fontStyle: 'italic', lineHeight: 1.5,
                      borderLeft: '3px solid #6ee7b7', paddingLeft: 10,
                    }}>
                      "{c.claim_part}"
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                      {c.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overreach */}
          {result.overreach?.length > 0 && (
            <div style={{ ...panel, background: '#fef2f2', borderColor: '#fca5a5' }}>
              <h4 style={{
                margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#991b1b',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                ⚠ {t('selfSimReality.claimAnalyzer.sections.overreach')}
              </h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {result.overreach.map((o, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', background: 'white', borderRadius: 8,
                    border: '1px solid #fecaca',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                        textTransform: 'uppercase', color: '#991b1b',
                        background: '#fee2e2', padding: '2px 8px', borderRadius: 999,
                        border: '1px solid #fecaca',
                      }}>
                        {OVERREACH_ICON[o.type] || '⚠'}{' '}
                        {t(`selfSimReality.claimAnalyzer.overreachTypes.${o.type}`,
                           { defaultValue: o.type })}
                      </span>
                    </div>
                    <p style={{
                      margin: '0 0 6px', fontSize: 13, color: '#1e293b',
                      fontStyle: 'italic', lineHeight: 1.5,
                      borderLeft: '3px solid #fca5a5', paddingLeft: 10,
                    }}>
                      "{o.claim_part}"
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                      {o.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reformulation */}
          {result.reformulation?.text && (
            <div style={{ ...panel, background: '#f5f3ff', borderColor: '#c4b5fd' }}>
              <h4 style={{
                margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#6b21a8',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                ✎ {t('selfSimReality.claimAnalyzer.sections.reformulation')}
              </h4>
              <blockquote style={{
                margin: '0 0 10px', padding: '12px 16px',
                background: 'white', borderLeft: '4px solid #7c3aed',
                borderRadius: 6,
                fontSize: 14, color: '#1e293b', lineHeight: 1.6,
              }}>
                {result.reformulation.text}
              </blockquote>
              {result.reformulation.notes && (
                <p style={{ margin: 0, fontSize: 12, color: '#6b21a8', fontStyle: 'italic', lineHeight: 1.5 }}>
                  ↳ {result.reformulation.notes}
                </p>
              )}
            </div>
          )}

          {/* Key terms — bridge to WiPhy */}
          {result.key_terms?.length > 0 && (
            <div style={panel}>
              <h4 style={{
                margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#1e293b',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                🔗 {t('selfSimReality.claimAnalyzer.sections.keyTerms')}
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                {onSearchWiphy
                  ? t('selfSimReality.claimAnalyzer.keyTermsHintBridge')
                  : t('selfSimReality.claimAnalyzer.keyTermsHint')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.key_terms.map((term, i) => (
                  onSearchWiphy ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSearchWiphy(term)}
                      title={t('selfSimReality.claimAnalyzer.keyTermTitle')}
                      style={{
                        background: '#eff6ff', color: '#1e40af',
                        border: '1px solid #bfdbfe', borderRadius: 999,
                        padding: '4px 12px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🔍 {term}
                    </button>
                  ) : (
                    <a
                      key={i}
                      href={`https://wiphy.org/api/search?q=${encodeURIComponent(term)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        background: '#eff6ff', color: '#1e40af',
                        border: '1px solid #bfdbfe', borderRadius: 999,
                        padding: '4px 12px', fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      ↗ {term}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Disclaimer — keeps the module's epistemic discipline */}
      <div style={{
        ...panel, background: '#fffbeb', borderColor: '#fde68a',
        fontSize: 11, color: '#78350f', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.claimAnalyzer.disclaimer')}
      </div>
    </div>
  );
}
