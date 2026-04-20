import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Shared "Update information from the web with AI" button + review panel.
 *
 * Design: non-destructive. The backend returns a list of suggestions; this
 * panel renders them and lets the parent tab decide what "Apply" means
 * (persist to DB for Tracker, or just update local state for Endings/Benefits).
 *
 * Props:
 *   fetchSuggestions: async () => { source, suggestions[], raw? }
 *   renderSuggestion: (suggestion, helpers) => ReactNode
 *       helpers: { onApply, onDismiss, applied, dismissed }
 *   onApply: async (suggestion) => void   (called when a card is applied)
 */
export default function AiSuggestions({ fetchSuggestions, renderSuggestion, onApply }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);
  const [applied, setApplied] = useState({});
  const [dismissed, setDismissed] = useState({});

  const run = async () => {
    setLoading(true);
    setErr(null);
    setApplied({});
    setDismissed({});
    try {
      const res = await fetchSuggestions();
      setData(res);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (idx, suggestion) => {
    try {
      if (onApply) await onApply(suggestion);
      setApplied((p) => ({ ...p, [idx]: true }));
    } catch (e) {
      setErr(t('ai.applyError', { defaultValue: 'Failed to apply suggestion' }) + `: ${e.message || e}`);
    }
  };
  const handleDismiss = (idx) => setDismissed((p) => ({ ...p, [idx]: true }));

  const sourceLabel = data?.source && {
    websearch_backend: t('ai.source.websearchBackend', { defaultValue: 'websearch-backend (port 8080)' }),
    duckduckgo: t('ai.source.duckduckgo', { defaultValue: 'DuckDuckGo fallback' }),
    none: t('ai.source.none', { defaultValue: 'No web results — LLM best-effort' }),
  }[data.source];

  const visibleSuggestions = (data?.suggestions || []).filter((_, i) => !dismissed[i]);

  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            ✨ {t('ai.title', { defaultValue: 'Update information from the web with AI' })}
          </div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
            {t('ai.subtitle', {
              defaultValue:
                'Calls websearch-backend (8080) with DuckDuckGo fallback, then asks the configured LLM for non-destructive suggestions. You review and apply each one.',
            })}
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          style={{
            background: loading ? '#93c5fd' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.55rem 1rem',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading
            ? t('ai.running', { defaultValue: 'Searching & asking AI…' })
            : t('ai.button', { defaultValue: 'Update with AI' })}
        </button>
      </div>

      {err && (
        <div style={{
          marginTop: 12, padding: '8px 10px', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13,
        }}>
          ⚠️ {err}
        </div>
      )}

      {data && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            {t('ai.sourceLabel', { defaultValue: 'Web source' })}: <strong>{sourceLabel}</strong>
            {' · '}
            {t('ai.countLabel', { defaultValue: 'Suggestions' })}: <strong>{data.suggestions?.length || 0}</strong>
          </div>

          {visibleSuggestions.length === 0 && (
            <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
              {t('ai.empty', { defaultValue: 'No new suggestions to review.' })}
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {(data.suggestions || []).map((s, idx) => {
              if (dismissed[idx]) return null;
              return (
                <div key={idx} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: 12,
                  background: applied[idx] ? '#f0fdf4' : '#f9fafb',
                }}>
                  {renderSuggestion(s, {
                    applied: !!applied[idx],
                    dismissed: !!dismissed[idx],
                    onApply: () => handleApply(idx, s),
                    onDismiss: () => handleDismiss(idx),
                    t,
                  })}
                </div>
              );
            })}
          </div>

          {data.raw && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                {t('ai.rawToggle', { defaultValue: 'LLM output could not be parsed as JSON — click to inspect raw' })}
              </summary>
              <pre style={{
                marginTop: 8, padding: 10, background: '#0f172a', color: '#e2e8f0',
                borderRadius: 8, fontSize: 11, overflow: 'auto', maxHeight: 220,
              }}>{data.raw}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// -- Small helpers reused by the three tabs ---------------------------------

export function ApplyDismissActions({ onApply, onDismiss, applied, t, applyLabel, appliedLabel }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button
        onClick={onApply}
        disabled={applied}
        style={{
          background: applied ? '#10b981' : '#1d4ed8',
          color: 'white', border: 'none', padding: '6px 12px',
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: applied ? 'default' : 'pointer',
        }}
      >
        {applied
          ? (appliedLabel || t('ai.applied', { defaultValue: 'Applied ✓' }))
          : (applyLabel || t('ai.apply', { defaultValue: 'Apply' }))}
      </button>
      {!applied && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent', color: '#6b7280',
            border: '1px solid #e5e7eb', padding: '6px 12px',
            borderRadius: 6, fontSize: 12, cursor: 'pointer',
          }}
        >
          {t('ai.dismiss', { defaultValue: 'Dismiss' })}
        </button>
      )}
    </div>
  );
}

export function SourceLink({ url }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ fontSize: 11, color: '#2563eb', wordBreak: 'break-all' }}
    >
      {url}
    </a>
  );
}
