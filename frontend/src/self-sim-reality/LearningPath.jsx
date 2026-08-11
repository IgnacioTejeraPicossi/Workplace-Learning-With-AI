import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle, LEVEL_COLORS } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * LearningPath — Self-Simulating Reality Agent V3
 *
 * A deterministic, evidence-first reading order through the module (established
 * science → mainstream → speculative OPH → philosophy → practice). Enter an
 * optional goal and the vector store picks which stage to start from; earlier
 * stages stay visible as prerequisites. No LLM — fast, offline, honest.
 *
 * The backend returns the ordered structure + recommended_start; all stage text
 * is localized here via i18n (selfSimReality.learningPath.stages.<id>.*).
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export default function LearningPath() {
  const { t } = useTranslation();
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (g) => {
    setLoading(true); setError(null);
    try {
      const q = g ? `?goal=${encodeURIComponent(g)}` : '';
      const res = await fetch(`${API_BASE}/api/self-sim-reality/learning-path${q}`);
      if (!res.ok) setError({ kind: 'http', status: res.status });
      else setData(await res.json());
    } catch (e) {
      setError({ kind: 'network', message: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  const onSubmit = (e) => { e.preventDefault(); load(goal); };

  const recIndex = data
    ? data.stages.findIndex(s => s.id === data.recommended_start)
    : -1;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={panel}>
        <h3 style={panelTitle}>🎓 {t('selfSimReality.learningPath.title')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.learningPath.subtitle')}</p>
      </div>

      {/* Goal input */}
      <form onSubmit={onSubmit} style={{ ...panel, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={t('selfSimReality.learningPath.placeholder')}
          style={{
            flex: 1, minWidth: 220, padding: '12px 14px', border: '1px solid #cbd5e1',
            borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box',
          }}
        />
        <button type="submit" disabled={loading} style={{
          background: loading ? '#c4b5fd' : '#7c3aed', color: 'white', border: 'none',
          borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
        }}>
          🎯 {t('selfSimReality.learningPath.findBtn')}
        </button>
        {goal && (
          <button type="button" onClick={() => { setGoal(''); load(''); }} style={{
            background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '12px 14px', fontSize: 13, cursor: 'pointer',
          }}>
            {t('selfSimReality.learningPath.reset')}
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error.kind === 'http'
              ? t('selfSimReality.learningPath.errors.http', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })
              : t('selfSimReality.learningPath.errors.network')}
          </p>
        </div>
      )}

      {/* Stages */}
      {data && !error && (
        <div style={{ display: 'grid', gap: 12 }}>
          {data.goal && recIndex >= 0 && (
            <div style={{ ...panel, background: '#eef2ff', borderColor: '#c7d2fe', fontSize: 13, color: '#3730a3' }}>
              🎯 {t('selfSimReality.learningPath.recommendedFor', {
                goal: data.goal,
                stage: t(`selfSimReality.learningPath.stages.${data.recommended_start}.title`),
              })}
            </div>
          )}
          {data.stages.map((s, i) => {
            const colors = LEVEL_COLORS[s.level] || LEVEL_COLORS.unsupported;
            const isRec = s.id === data.recommended_start && !!data.goal;
            const isPrereq = data.goal && recIndex > 0 && i < recIndex;
            return (
              <div key={s.id} style={{
                ...panel,
                borderLeft: `4px solid ${colors.border}`,
                opacity: isPrereq ? 0.7 : 1,
                boxShadow: isRec ? '0 0 0 2px #7c3aed' : panel.boxShadow,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: '#7c3aed', color: 'white', fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <strong style={{ fontSize: 15, color: '#1e293b' }}>
                    {t(`selfSimReality.learningPath.stages.${s.id}.title`)}
                  </strong>
                  <EpistemicBadge level={s.level} />
                  {isRec && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                      background: '#7c3aed', color: 'white', padding: '2px 8px', borderRadius: 999,
                    }}>{t('selfSimReality.learningPath.startHere')}</span>
                  )}
                  {isPrereq && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                      {t('selfSimReality.learningPath.prereq')}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
                  {t(`selfSimReality.learningPath.stages.${s.id}.what`)}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#64748b', lineHeight: 1.5, fontStyle: 'italic' }}>
                  ↳ {t(`selfSimReality.learningPath.stages.${s.id}.why`)}
                </p>
                <span style={{ fontSize: 11, color: '#6b21a8', fontWeight: 600 }}>
                  📍 {t('selfSimReality.learningPath.goToTab', { tab: t(`selfSimReality.tabs.${s.tab}`) })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        ...panel, background: '#faf5ff', borderColor: '#e9d5ff',
        fontSize: 11, color: '#6b21a8', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.learningPath.disclaimer')}
      </div>
    </div>
  );
}
