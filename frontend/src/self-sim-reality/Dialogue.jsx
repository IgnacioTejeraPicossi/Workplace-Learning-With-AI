import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, subtle } from './_tokens';
import EpistemicBadge from './EpistemicBadge';

/**
 * Dialogue — Self-Simulating Reality Agent V1
 *
 * The conversational endpoint the plan (§8, §13) always meant to ship. Ask about
 * observers, minds, consciousness, simulation, holography or OPH, and every
 * answer comes back STRUCTURED and TAGGED by evidence level:
 *   - short_answer            (plain-language paragraph)
 *   - sections[]              (scientific_grounding / speculative_extension /
 *                              oph_interpretation, each with an EpistemicBadge)
 *   - objections[]            (red-team critique)
 *   - safer_reformulation     (when the question contained an over-claim)
 *   - suggested_next_question (click to ask it)
 *
 * Backend grounds answers in a curated OPH+science knowledge base (RAG-lite) and
 * NEVER says "this is true" — it says "this belongs to level X".
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const SECTION_STYLE = {
  scientific_grounding: { icon: '🔬', bg: '#f0fdf4', border: '#86efac', fg: '#065f46' },
  speculative_extension:{ icon: '🌀', bg: '#fff7ed', border: '#fdba74', fg: '#7c2d12' },
  oph_interpretation:   { icon: '🧩', bg: '#faf5ff', border: '#c4b5fd', fg: '#6b21a8' },
};

export default function Dialogue() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState([]);   // { role:'user'|'agent', text?, data? }
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const lang = ['en', 'es', 'no'].includes(i18n.language) ? i18n.language : 'en';

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [turns, loading]);

  const send = useCallback(async (text) => {
    const q = (text || '').trim();
    if (!q || loading) return;
    setError(null);
    // history the backend expects: prior user/agent turns, agent → assistant.
    const history = turns.map(tt => ({
      role: tt.role === 'agent' ? 'assistant' : 'user',
      content: tt.role === 'agent' ? (tt.data?.short_answer || '') : (tt.text || ''),
    })).filter(h => h.content);
    setTurns(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/self-sim-reality/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, lang, history }),
      });
      if (!res.ok) {
        setError({ kind: 'http', status: res.status });
      } else {
        const data = await res.json();
        setTurns(prev => [...prev, { role: 'agent', data }]);
      }
    } catch (e) {
      setError({ kind: 'network', message: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [loading, turns, lang]);

  const onSubmit = (e) => { e.preventDefault(); send(input); };

  const examples = [
    t('selfSimReality.dialogue.examples.observer'),
    t('selfSimReality.dialogue.examples.simulation'),
    t('selfSimReality.dialogue.examples.fixedPoint'),
    t('selfSimReality.dialogue.examples.ai'),
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={panel}>
        <h3 style={panelTitle}>💬 {t('selfSimReality.dialogue.title')}</h3>
        <p style={{ ...subtle, margin: 0 }}>{t('selfSimReality.dialogue.subtitle')}</p>
      </div>

      {/* Conversation */}
      {turns.length === 0 && !loading && (
        <div style={{ ...panel, background: '#faf5ff', borderColor: '#e9d5ff' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6b21a8', fontWeight: 600 }}>
            {t('selfSimReality.dialogue.emptyHint')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {examples.map((ex, i) => (
              <button key={i} type="button" onClick={() => send(ex)} style={{
                background: 'white', color: '#6b21a8', border: '1px solid #ddd6fe',
                borderRadius: 6, padding: '6px 11px', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
              }}>{ex}</button>
            ))}
          </div>
        </div>
      )}

      {turns.map((turn, i) => (
        <div key={i}>
          {turn.role === 'user' ? (
            <div style={{
              ...panel, background: '#eef2ff', borderColor: '#c7d2fe',
              padding: '12px 16px',
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
                             textTransform: 'uppercase', color: '#4338ca' }}>
                {t('selfSimReality.dialogue.you')}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#1e293b', lineHeight: 1.5 }}>
                {turn.text}
              </p>
            </div>
          ) : (
            <AgentTurn data={turn.data} onAsk={send} t={t} />
          )}
        </div>
      ))}

      {loading && (
        <div style={{ ...panel, color: '#7c3aed', fontSize: 13 }}>
          🌀 {t('selfSimReality.dialogue.thinking')}
        </div>
      )}

      {error && (
        <div style={{ ...panel, background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error.kind === 'http'
              ? t('selfSimReality.dialogue.errors.http', { status: error.status, defaultValue: `Server returned HTTP ${error.status}` })
              : t('selfSimReality.dialogue.errors.network')}
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={onSubmit} style={{ ...panel, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('selfSimReality.dialogue.placeholder')}
          style={{
            flex: 1, padding: '12px 14px', border: '1px solid #cbd5e1',
            borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box',
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{
          background: loading || !input.trim() ? '#c4b5fd' : '#7c3aed', color: 'white',
          border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 13,
          fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer',
        }}>
          {t('selfSimReality.dialogue.send')}
        </button>
      </form>

      {/* Discipline reminder */}
      <div style={{
        ...panel, background: '#fffbeb', borderColor: '#fde68a',
        fontSize: 11, color: '#78350f', lineHeight: 1.55,
      }}>
        ℹ️ {t('selfSimReality.dialogue.disclaimer')}
      </div>
      <div ref={endRef} />
    </div>
  );
}

function AgentTurn({ data, onAsk, t }) {
  if (!data) return null;
  const sources = data.sources_consulted || [];
  return (
    <div style={{ ...panel, borderColor: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
                       textTransform: 'uppercase', color: '#6b21a8' }}>
          🌀 {t('selfSimReality.dialogue.agent')}
        </span>
        {data.is_mock && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                         background: '#fbbf24', color: '#78350f',
                         padding: '2px 8px', borderRadius: 999, letterSpacing: 0.5 }}>
            MOCK
          </span>
        )}
      </div>

      {/* Short answer */}
      {data.short_answer && (
        <p style={{ margin: '0 0 14px', fontSize: 15, color: '#1e293b', lineHeight: 1.6 }}>
          {data.short_answer}
        </p>
      )}

      {/* Structured sections, each tagged by evidence level */}
      {(data.sections || []).map((s, i) => {
        const st = SECTION_STYLE[s.kind] || SECTION_STYLE.oph_interpretation;
        return (
          <div key={i} style={{
            background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8,
            padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: st.fg,
                             textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {st.icon} {t(`selfSimReality.dialogue.sectionKinds.${s.kind}`, { defaultValue: s.kind })}
              </span>
              <EpistemicBadge level={s.level} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{s.text}</p>
            {s.sources?.length > 0 && (
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8' }}>
                ↳ {s.sources.join(' · ')}
              </p>
            )}
          </div>
        );
      })}

      {/* Objections (red-team) */}
      {data.objections?.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                      padding: '10px 12px', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b',
                         textTransform: 'uppercase', letterSpacing: 0.5 }}>
            ⚔ {t('selfSimReality.dialogue.objections')}
          </span>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            {data.objections.map((o, i) => (
              <li key={i} style={{ fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.5, marginBottom: 3 }}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safer reformulation */}
      {data.safer_reformulation && (
        <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 8,
                      padding: '10px 12px', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b21a8',
                         textTransform: 'uppercase', letterSpacing: 0.5 }}>
            ✎ {t('selfSimReality.dialogue.reformulation')}
          </span>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#1e293b', lineHeight: 1.55, fontStyle: 'italic' }}>
            {data.safer_reformulation}
          </p>
        </div>
      )}

      {/* Sources consulted */}
      {sources.length > 0 && (
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#94a3b8' }}>
          📎 {t('selfSimReality.dialogue.sourcesConsulted')}: {sources.join(' · ')}
        </p>
      )}

      {/* Suggested next question */}
      {data.suggested_next_question && (
        <button type="button" onClick={() => onAsk(data.suggested_next_question)} style={{
          background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe',
          borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', marginTop: 2,
        }}>
          ↪ {data.suggested_next_question}
        </button>
      )}
    </div>
  );
}
