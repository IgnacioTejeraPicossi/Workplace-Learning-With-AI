/**
 * Enonic 'Red Cross' Agent — grounded project-knowledge & testing assistant (V1)
 * ==============================================================================
 * Item Agent placed below Humanizing AI. Five tabs:
 *   Overview · Assistant (grounded chat) · Knowledge · Test Catalog · Project Context
 *
 * All UI strings via t(). Uses the shared backend LLM (server-side) through
 * /api/enonic-red-cross/chat; degrades to the backend's offline mock. Every
 * claim is tagged by evidence level and sources are cited — the module never
 * presents speculation as fact and never claims to have run a live test.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const toLang = (lng) => (lng === 'es' ? 'es' : lng === 'no' ? 'no' : 'en');

// ─── Design tokens ──────────────────────────────────────────────────────────
const RED = '#C8102E';
const RED_DARK = '#9E0B23';
const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const BG_SOFT = '#f8fafc';

const LEVEL_META = {
  'platform-doc':        { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'project-fact':        { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  'project-observation': { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'test-recipe':         { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  'guidance':            { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  'unsupported':         { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};
const STATUS_META = {
  supported:    { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  partial:      { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  insufficient: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};
const RESULT_META = {
  pass:    { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  fail:    { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  partial: { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  blocked: { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  planned: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
};

const isHttpUrl = (s) => {
  if (typeof s !== 'string' || !s.trim()) return false;
  try { const u = new URL(s.trim()); return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.host && !/\s/.test(s.trim()); }
  catch { return false; }
};

// ─── Small shared pieces ─────────────────────────────────────────────────────
function LevelBadge({ level, children }) {
  const m = LEVEL_META[level] || LEVEL_META.guidance;
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 8px',
      borderRadius: 999, color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      textTransform: 'uppercase', letterSpacing: 0.3 }}>{children}</span>
  );
}
function Sources({ items, label }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>
      <strong style={{ color: '#374151' }}>{label}: </strong>
      {items.map((s, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {isHttpUrl(s)
            ? <a href={s} target="_blank" rel="noopener noreferrer" style={{ color: RED, textDecoration: 'none' }}>{s}</a>
            : <span>{s}</span>}
        </span>
      ))}
    </div>
  );
}
const card = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 };

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function Overview({ t, onOpenAssistant }) {
  const points = ['point1', 'point2', 'point3', 'point4'];
  const levels = ['platform-doc', 'project-fact', 'project-observation', 'test-recipe', 'guidance'];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...card, background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`, color: '#fff', border: 'none' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{t('enonicRedCrossModule.overview.heroTitle')}</h2>
        <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.95 }}>{t('enonicRedCrossModule.overview.heroSub')}</p>
        <button onClick={onOpenAssistant} style={{ marginTop: 14, background: '#fff', color: RED, border: 'none',
          borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
          {t('enonicRedCrossModule.overview.openAssistant')} →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 10px', fontSize: 16, color: INK }}>{t('enonicRedCrossModule.overview.whatTitle')}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', lineHeight: 1.7 }}>
            {points.map((p) => <li key={p}>{t(`enonicRedCrossModule.overview.${p}`)}</li>)}
          </ul>
        </div>
        <div style={card}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: INK }}>{t('enonicRedCrossModule.overview.evidenceTitle')}</h3>
          <p style={{ margin: '0 0 12px', color: MUTED, fontSize: 13, lineHeight: 1.6 }}>{t('enonicRedCrossModule.overview.evidenceIntro')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {levels.map((l) => <LevelBadge key={l} level={l}>{t(`enonicRedCrossModule.evidence.${l}`)}</LevelBadge>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div style={{ ...card, background: BG_SOFT }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: INK }}>{t('enonicRedCrossModule.overview.limitsTitle')}</h3>
          <p style={{ margin: 0, color: '#374151', fontSize: 13.5, lineHeight: 1.6 }}>{t('enonicRedCrossModule.overview.limits')}</p>
        </div>
        <div style={{ ...card, background: BG_SOFT }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: INK }}>{t('enonicRedCrossModule.overview.relatedTitle')}</h3>
          <p style={{ margin: 0, color: '#374151', fontSize: 13.5, lineHeight: 1.6 }}>{t('enonicRedCrossModule.overview.related')}</p>
        </div>
      </div>
      <p style={{ margin: 0, color: MUTED, fontSize: 12, fontStyle: 'italic' }}>{t('enonicRedCrossModule.overview.disclaimer')}</p>
    </div>
  );
}

// ─── Tab: Assistant (grounded chat) ───────────────────────────────────────────
function Assistant({ t, lang, caseAsk }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [streamText, setStreamText] = useState('');
  const taRef = useRef(null);
  const lastNonce = useRef(null);

  const commit = useCallback((message, data) => {
    setAnswer(data);
    setHistory((h) => [...h, { role: 'user', content: message },
      { role: 'assistant', content: data.short_answer || '' }]);
    setInput('');
  }, []);

  // Fallback: the original single-shot request (used if streaming is unavailable).
  const askFallback = useCallback(async (message) => {
    const res = await fetch(`${API_BASE}/api/enonic-red-cross/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang: toLang(lang), history: history.slice(-6) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    commit(message, data);
  }, [lang, history, commit]);

  const ask = useCallback(async (q) => {
    const message = (q ?? input).trim();
    if (!message || loading) return;
    setLoading(true); setError(''); setAnswer(null); setStreamText('');
    try {
      const res = await fetch(`${API_BASE}/api/enonic-red-cross/chat/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lang: toLang(lang), history: history.slice(-6) }),
      });
      if (!res.ok || !res.body) throw new Error('stream-unavailable');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', acc = '', finalAnswer = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          let obj; try { obj = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (obj.t === 'tok') { acc += obj.v; setStreamText(acc); }
          else if (obj.t === 'done') { finalAnswer = obj.answer; }
        }
      }
      if (!finalAnswer || finalAnswer.error) throw new Error('no-result');
      commit(message, finalAnswer);
    } catch (e) {
      try { await askFallback(message); }
      catch (e2) { setError(t('enonicRedCrossModule.assistant.error')); }
    } finally { setLoading(false); setStreamText(''); }
  }, [input, loading, lang, history, t, askFallback, commit]);

  // Cross-tab bridge: a case clicked in the Test Catalog arrives as {text, nonce}
  // and is asked once (nonce guards against re-firing on unrelated re-renders).
  useEffect(() => {
    if (caseAsk && caseAsk.nonce !== lastNonce.current) {
      lastNonce.current = caseAsk.nonce;
      ask(caseAsk.text);
    }
  }, [caseAsk, ask]);

  const onKey = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask(); } };
  const suggestions = ['q1', 'q2', 'q3', 'q4'];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={card}>
        <p style={{ margin: '0 0 10px', color: MUTED, fontSize: 13.5 }}>{t('enonicRedCrossModule.assistant.intro')}</p>
        <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
          placeholder={t('enonicRedCrossModule.assistant.placeholder')} rows={3}
          style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 10,
            padding: 12, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((q) => (
              <button key={q} onClick={() => ask(t(`enonicRedCrossModule.assistant.${q}`))} disabled={loading}
                style={{ fontSize: 12, color: '#374151', background: BG_SOFT, border: `1px solid ${LINE}`,
                  borderRadius: 999, padding: '5px 10px', cursor: loading ? 'default' : 'pointer' }}>
                {t(`enonicRedCrossModule.assistant.${q}`)}
              </button>
            ))}
          </div>
          <button onClick={() => ask()} disabled={loading || !input.trim()}
            style={{ background: RED, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px',
              fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer', opacity: loading || !input.trim() ? 0.6 : 1 }}>
            {loading ? t('enonicRedCrossModule.assistant.thinking') : t('enonicRedCrossModule.assistant.send')}
          </button>
        </div>
      </div>

      {error && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}

      {!answer && !error && !loading && (
        <div style={{ ...card, color: MUTED, textAlign: 'center', fontStyle: 'italic' }}>
          {t('enonicRedCrossModule.assistant.emptyHint')}
        </div>
      )}

      {loading && !streamText && (
        <div style={{ ...card, color: MUTED, textAlign: 'center', fontStyle: 'italic' }}>
          {t('enonicRedCrossModule.assistant.thinking')}
        </div>
      )}

      {loading && streamText && (
        <div style={{ ...card, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>
            {t('enonicRedCrossModule.assistant.shortAnswer')}
          </div>
          <p style={{ margin: 0, lineHeight: 1.65, color: INK, fontSize: 15 }}>
            {streamText}<span aria-hidden style={{ opacity: 0.5 }}>▍</span>
          </p>
        </div>
      )}

      {answer && !loading && <AnswerCard t={t} answer={answer} onFollowUp={(q) => ask(q)} />}
    </div>
  );
}

function AnswerCard({ t, answer, onFollowUp }) {
  const st = STATUS_META[answer.evidence_status] || STATUS_META.partial;
  return (
    <div style={{ ...card, display: 'grid', gap: 14 }}>
      {answer.is_mock && (
        <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 8, padding: '6px 10px' }}>{t('enonicRedCrossModule.assistant.mockNote')}</div>
      )}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>
          {t('enonicRedCrossModule.assistant.shortAnswer')}
        </div>
        <p style={{ margin: 0, lineHeight: 1.65, color: INK, fontSize: 15 }}>{answer.short_answer}</p>
      </div>

      {Array.isArray(answer.sections) && answer.sections.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
            {t('enonicRedCrossModule.assistant.sectionsTitle')}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {answer.sections.map((s, i) => (
              <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, background: BG_SOFT }}>
                <LevelBadge level={s.level}>{t(`enonicRedCrossModule.evidence.${s.level}`, s.level)}</LevelBadge>
                <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.6, fontSize: 14 }}>{s.text}</p>
                <Sources items={s.sources} label={t('enonicRedCrossModule.assistant.sources')} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: MUTED }}>{t('enonicRedCrossModule.assistant.evidenceStatus')}:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`,
          borderRadius: 999, padding: '2px 10px' }}>
          {t(`enonicRedCrossModule.evidence.${answer.evidence_status}`, answer.evidence_status)}
        </span>
      </div>

      {Array.isArray(answer.missing_information) && answer.missing_information.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
            {t('enonicRedCrossModule.assistant.missingInfo')}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', fontSize: 13.5, lineHeight: 1.6 }}>
            {answer.missing_information.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {answer.suggested_next_question && (
        <button onClick={() => onFollowUp(answer.suggested_next_question)}
          style={{ textAlign: 'left', background: '#fff', border: `1px dashed ${RED}`, color: RED_DARK,
            borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontSize: 13.5 }}>
          ↪ {answer.suggested_next_question}
        </button>
      )}

      {Array.isArray(answer.grounding) && answer.grounding.length > 0 && (
        <GroundedOn t={t} items={answer.grounding} onAskCase={onFollowUp} />
      )}
    </div>
  );
}

// Transparency: a collapsible list of the chunks the answer was grounded on.
// Catalog cases (is_case) are clickable and re-ask about that case.
function GroundedOn({ t, items, onAskCase }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: MUTED,
          fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden>{open ? '▾' : '▸'}</span>
        {t('enonicRedCrossModule.assistant.groundedOn', { n: items.length })}
      </button>
      {open && (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {items.map((g) => (
            <div key={g.id} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 10, background: BG_SOFT }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <LevelBadge level={g.level}>{t(`enonicRedCrossModule.evidence.${g.level}`, g.level)}</LevelBadge>
                {g.is_case && g.case_id ? (
                  <button onClick={() => onAskCase(t('enonicRedCrossModule.testCatalog.askTemplate', { id: g.case_id }))}
                    title={t('enonicRedCrossModule.testCatalog.askTitle')}
                    style={{ background: 'none', border: 'none', padding: 0, color: RED, fontWeight: 700,
                      cursor: 'pointer', textDecoration: 'underline', fontSize: 13.5 }}>
                    {g.title}
                  </button>
                ) : (
                  <span style={{ fontWeight: 600, color: INK, fontSize: 13.5 }}>{g.title}</span>
                )}
              </div>
              {g.text && <p style={{ margin: '6px 0 0', color: '#374151', fontSize: 12.5, lineHeight: 1.5 }}>{g.text}</p>}
              <Sources items={g.sources} label={t('enonicRedCrossModule.assistant.sources')} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Knowledge ───────────────────────────────────────────────────────────
function Knowledge({ t }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/enonic-red-cross/knowledge`).then((r) => r.json())
      .then((d) => { if (alive) setItems(d.knowledge || []); }).catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);
  if (items === null) return <div style={{ ...card, color: MUTED }}>{t('enonicRedCrossModule.knowledge.loading')}</div>;
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, color: MUTED, fontSize: 13.5 }}>{t('enonicRedCrossModule.knowledge.intro')}</p>
      {items.length === 0 && <div style={{ ...card, color: MUTED }}>{t('enonicRedCrossModule.knowledge.empty')}</div>}
      {items.map((c) => (
        <div key={c.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15.5, color: INK }}>{c.title}</h3>
            <LevelBadge level={c.level}>{t(`enonicRedCrossModule.evidence.${c.level}`, c.level)}</LevelBadge>
          </div>
          <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.6, fontSize: 14 }}>{c.text}</p>
          <Sources items={c.sources} label={t('enonicRedCrossModule.knowledge.sources')} />
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Test Catalog ────────────────────────────────────────────────────────
function TestCatalog({ t, onAskCase }) {
  const [cases, setCases] = useState(null);
  const [q, setQ] = useState('');
  const [persona, setPersona] = useState('');
  const [result, setResult] = useState('');
  const [sprint, setSprint] = useState('');
  const [sprintOpts, setSprintOpts] = useState([]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams();
    if (q) params.set('query', q);
    if (persona) params.set('persona', persona);
    if (result) params.set('result', result);
    if (sprint) params.set('sprint', sprint);
    fetch(`${API_BASE}/api/enonic-red-cross/test-catalog?${params.toString()}`).then((r) => r.json())
      .then((d) => { if (alive) { setCases(d.cases || []); if (Array.isArray(d.sprints)) setSprintOpts(d.sprints); } })
      .catch(() => { if (alive) setCases([]); });
    return () => { alive = false; };
  }, [q, persona, result, sprint]);

  const sel = { border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#fff' };

  // Breakdown of the CURRENT filtered view, by result (emoji taken from the rows).
  const RESULT_ORDER = ['pass', 'fail', 'partial', 'blocked', 'planned'];
  const stats = {};
  const emojiFor = {};
  (cases || []).forEach((c) => {
    stats[c.result] = (stats[c.result] || 0) + 1;
    if (c.result_emoji) emojiFor[c.result] = c.result_emoji;
  });

  // Export the current filtered view as CSV (UTF-8 BOM so Excel renders æøå; the
  // data is already on screen — a local Blob download, nothing leaves the browser).
  const csvCell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const downloadCsv = () => {
    if (!cases || !cases.length) return;
    const tc = (k) => t(`enonicRedCrossModule.testCatalog.${k}`);
    const head = [tc('colId'), tc('sprint'), tc('colResult'), tc('colPersona'), tc('colTitle'), tc('colNote')];
    const rows = (cases || []).map((c) => [
      c.id, c.sprint || '', t(`enonicRedCrossModule.testCatalog.results.${c.result}`),
      c.persona, c.title, c.note || '',
    ]);
    const csv = '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `enonic-red-cross-test-catalog${sprint ? `-sprint${sprint}` : ''}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, color: MUTED, fontSize: 13.5 }}>{t('enonicRedCrossModule.testCatalog.intro')}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('enonicRedCrossModule.testCatalog.searchPlaceholder')}
          style={{ ...sel, flex: '1 1 220px', minWidth: 180 }} />
        <select value={persona} onChange={(e) => setPersona(e.target.value)} style={sel}>
          <option value="">{t('enonicRedCrossModule.testCatalog.persona')}: {t('enonicRedCrossModule.testCatalog.all')}</option>
          <option value="Sluttbruker">Sluttbruker</option>
          <option value="Redaktør">Redaktør</option>
        </select>
        <select value={result} onChange={(e) => setResult(e.target.value)} style={sel}>
          <option value="">{t('enonicRedCrossModule.testCatalog.result')}: {t('enonicRedCrossModule.testCatalog.all')}</option>
          {['pass', 'fail', 'partial', 'blocked', 'planned'].map((r) =>
            <option key={r} value={r}>{t(`enonicRedCrossModule.testCatalog.results.${r}`)}</option>)}
        </select>
        {sprintOpts.length > 1 && (
          <select value={sprint} onChange={(e) => setSprint(e.target.value)} style={sel}>
            <option value="">{t('enonicRedCrossModule.testCatalog.sprint')}: {t('enonicRedCrossModule.testCatalog.all')}</option>
            {sprintOpts.map((s) => <option key={s} value={s}>{t('enonicRedCrossModule.testCatalog.sprint')} {s}</option>)}
          </select>
        )}
      </div>

      {cases === null ? (
        <div style={{ ...card, color: MUTED }}>{t('enonicRedCrossModule.testCatalog.loading')}</div>
      ) : cases.length === 0 ? (
        <div style={{ ...card, color: MUTED }}>{t('enonicRedCrossModule.testCatalog.empty')}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {RESULT_ORDER.filter((r) => stats[r]).map((r) => {
                const m = RESULT_META[r] || RESULT_META.blocked;
                const active = result === r;
                return (
                  <button key={r} onClick={() => setResult(active ? '' : r)}
                    title={t('enonicRedCrossModule.testCatalog.filterByResult')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, color: m.color, background: m.bg,
                      borderRadius: 999, padding: '4px 10px',
                      border: `1px solid ${active ? m.color : m.border}`,
                      outline: active ? `2px solid ${m.color}` : 'none', outlineOffset: active ? 1 : 0 }}>
                    <span>{emojiFor[r]} {t(`enonicRedCrossModule.testCatalog.results.${r}`)}</span>
                    <span style={{ background: '#fff', border: `1px solid ${m.border}`, borderRadius: 999, padding: '0 6px', fontSize: 11 }}>{stats[r]}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={downloadCsv}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700, color: RED, background: '#fff',
                border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 12px' }}>
              ⬇ {t('enonicRedCrossModule.testCatalog.exportCsv')}
            </button>
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>{t('enonicRedCrossModule.testCatalog.count', { n: cases.length })}</div>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: BG_SOFT, textAlign: 'left' }}>
                    {['colId', 'colResult', 'colPersona', 'colTitle', 'colNote'].map((c) => (
                      <th key={c} style={{ padding: '10px 12px', color: '#374151', fontSize: 12, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>
                        {t(`enonicRedCrossModule.testCatalog.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => {
                    const m = RESULT_META[c.result] || RESULT_META.blocked;
                    return (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => onAskCase && onAskCase(c.id)}
                            title={t('enonicRedCrossModule.testCatalog.askTitle')}
                            style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700,
                              color: RED, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
                            {c.id}
                          </button>
                          {sprintOpts.length > 1 && c.sprint && (
                            <span title={`${t('enonicRedCrossModule.testCatalog.sprint')} ${c.sprint}`}
                              style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: MUTED,
                                background: BG_SOFT, border: `1px solid ${LINE}`, borderRadius: 6, padding: '1px 5px' }}>
                              S{c.sprint}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: m.color, background: m.bg, border: `1px solid ${m.border}`, borderRadius: 999, padding: '2px 8px' }}>
                            {c.result_emoji} {t(`enonicRedCrossModule.testCatalog.results.${c.result}`)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: MUTED, whiteSpace: 'nowrap' }}>{c.persona}</td>
                        <td style={{ padding: '10px 12px', color: INK, minWidth: 220 }}>{c.title}</td>
                        <td style={{ padding: '10px 12px', color: '#374151', minWidth: 240 }}>
                          {c.note ? c.note : <span style={{ color: '#9ca3af' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Project Context ─────────────────────────────────────────────────────
function ProjectContext({ t }) {
  const [ctx, setCtx] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/enonic-red-cross/project-context`).then((r) => r.json())
      .then((d) => { if (alive) setCtx(d); }).catch(() => { if (alive) setCtx({}); });
    return () => { alive = false; };
  }, []);
  if (ctx === null) return <div style={{ ...card, color: MUTED }}>{t('enonicRedCrossModule.projectContext.loading')}</div>;
  const c = ctx.context || {};
  const ado = c.azure_devops || {};
  const docs = ctx.official_docs || {};
  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${LINE}`, flexWrap: 'wrap' }}>
      <div style={{ width: 170, color: MUTED, fontSize: 13, flexShrink: 0 }}>{label}</div>
      <div style={{ color: INK, fontSize: 13.5, flex: 1, minWidth: 180, wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
  const link = (u) => <a href={u} target="_blank" rel="noopener noreferrer" style={{ color: RED, textDecoration: 'none' }}>{u}</a>;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ margin: 0, color: MUTED, fontSize: 13.5 }}>{t('enonicRedCrossModule.projectContext.intro')}</p>
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15.5, color: INK }}>{t('enonicRedCrossModule.projectContext.environments')}</h3>
        <Row label={t('enonicRedCrossModule.projectContext.platform')}>{c.platform}</Row>
        <Row label={t('enonicRedCrossModule.projectContext.designSystem')}>{c.frontend_design_system}</Row>
        <Row label={t('enonicRedCrossModule.projectContext.contentStudio')}>{c.content_studio_url && link(c.content_studio_url)}</Row>
        <Row label={t('enonicRedCrossModule.projectContext.publicFrontend')}>{c.public_test_frontend && link(c.public_test_frontend)}</Row>
      </div>
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15.5, color: INK }}>{t('enonicRedCrossModule.projectContext.azureDevops')}</h3>
        <Row label={t('enonicRedCrossModule.projectContext.org')}>{ado.organization}</Row>
        <Row label={t('enonicRedCrossModule.projectContext.project')}>{ado.project}</Row>
        <Row label={t('enonicRedCrossModule.projectContext.sprint')}>{ado.sprint}</Row>
        <Row label={t('enonicRedCrossModule.projectContext.suites')}>{(ado.suites || []).join(' · ')}</Row>
      </div>
      {Array.isArray(c.known_unknowns) && c.known_unknowns.length > 0 && (
        <div style={{ ...card, background: '#fffbeb', borderColor: '#fde68a' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15.5, color: '#92400e' }}>{t('enonicRedCrossModule.projectContext.knownUnknowns')}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#78350f', fontSize: 13.5, lineHeight: 1.7 }}>
            {c.known_unknowns.map((k, i) => <li key={i}>{k}</li>)}
          </ul>
        </div>
      )}
      <div style={card}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15.5, color: INK }}>{t('enonicRedCrossModule.projectContext.docsTitle')}</h3>
        <div style={{ display: 'grid', gap: 6 }}>
          {Object.entries(docs).map(([k, u]) => (
            <div key={k} style={{ fontSize: 13 }}>
              <span style={{ color: MUTED, marginRight: 8 }}>{k}</span>{link(u)}
            </div>
          ))}
        </div>
      </div>
      {ctx.disclaimer && <p style={{ margin: 0, color: MUTED, fontSize: 12, fontStyle: 'italic' }}>{ctx.disclaimer}</p>}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
const TABS = ['overview', 'assistant', 'knowledge', 'testCatalog', 'projectContext'];

export default function EnonicRedCross() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('overview');
  const [caseAsk, setCaseAsk] = useState(null);
  const lang = i18n.language;

  const askCase = (id) => {
    setCaseAsk({ text: t('enonicRedCrossModule.testCatalog.askTemplate', { id }), nonce: Date.now() });
    setTab('assistant');
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '20px 16px', color: INK,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
        <span aria-hidden style={{ fontSize: 26 }}>➕</span>
        <h1 style={{ margin: 0, fontSize: 24, color: RED_DARK }}>{t('enonicRedCrossModule.title')}</h1>
      </div>
      <p style={{ margin: '0 0 16px', color: MUTED, fontSize: 14 }}>{t('enonicRedCrossModule.subtitle')}</p>

      <div style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${LINE}`, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            style={{ background: 'none', border: 'none', borderBottom: tab === tb ? `2px solid ${RED}` : '2px solid transparent',
              color: tab === tb ? RED_DARK : MUTED, fontWeight: tab === tb ? 700 : 500, fontSize: 14,
              padding: '10px 12px', cursor: 'pointer', marginBottom: -1 }}>
            {t(`enonicRedCrossModule.tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview t={t} onOpenAssistant={() => setTab('assistant')} />}
      {tab === 'assistant' && <Assistant t={t} lang={lang} caseAsk={caseAsk} />}
      {tab === 'knowledge' && <Knowledge t={t} />}
      {tab === 'testCatalog' && <TestCatalog t={t} onAskCase={askCase} />}
      {tab === 'projectContext' && <ProjectContext t={t} />}
    </div>
  );
}
