/**
 * DemoSection - the head-to-head live demos (10 rounds + Problem Router +
 * per-round AI Judge) for the Homo-vs-AI workshop page, plus their leaf atoms
 * (IstqbRagHint / IstqbBadge / MarkdownLite / VoteButton / CriteriaCell) and the
 * DEMO_TASKS / JUDGE_* tables. Extracted verbatim from HomoSapiensVsAI.jsx
 * (P5 decomposition) - no behaviour change. Exports HeadToHeadDemos.
 */
import React, { useState, useEffect } from 'react';
import {
  judgeTestingRound, routeTestingProblem, runTestingChallenge,
  logHomoVsAiFeedback, proposePromptRevision,
} from '../../../../api/agiApi';
import { SectionHeader } from './shared';

// ---------------------------------------------------------------------------
// ISTQB anchor badge — shows '📚 ISTQB-anchored' when a challenge / router /
// judge response carries a non-empty `istqb_anchors` array. Clicking it
// expands a compact list of the concrete syllabi sections used for that
// prompt. Kept tiny on purpose: it should read as a credibility cue on the
// projector, never as the main content.
// ---------------------------------------------------------------------------

function IstqbRagHint({ rag, t }) {
  if (!rag || typeof rag !== 'object') return null;
  if (rag.mode === 'local_rag') {
    const src = Array.isArray(rag.sources) && rag.sources.length
      ? rag.sources.slice(0, 4).join(' · ')
      : '';
    return (
      <div style={{
        marginTop: 6,
        fontSize: 11,
        color: '#0f766e',
        lineHeight: 1.45,
        padding: '6px 8px',
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: 6,
      }}>
        <strong style={{ fontWeight: 700 }}>📎 {t('homoVsAi.istqb.ragActive', { defaultValue: 'Local ISTQB PDF RAG' })}</strong>
        {rag.chunks_used != null && (
          <span style={{ color: '#047857' }}>{' '}({rag.chunks_used} {t('homoVsAi.istqb.ragChunks', { defaultValue: 'excerpts' })})</span>
        )}
        {src ? <div style={{ marginTop: 4, color: '#115e59', fontSize: 10 }}>{src}</div> : null}
      </div>
    );
  }
  if (rag.mode === 'local_rag_unavailable') {
    return (
      <div style={{
        marginTop: 6,
        fontSize: 11,
        color: '#92400e',
        lineHeight: 1.45,
        padding: '6px 8px',
        background: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: 6,
      }}>
        {t('homoVsAi.istqb.ragUnavailable', {
          defaultValue: 'Local LLM selected, but no ISTQB PDF index was built — add PDFs under docs-ISTQB/ or check backend logs.',
        })}
      </div>
    );
  }
  return null;
}

function IstqbBadge({ anchors, t }) {
  const [open, setOpen] = useState(false);
  if (!Array.isArray(anchors) || anchors.length === 0) return null;

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={t('homoVsAi.istqb.tooltip', {
          defaultValue: 'Prompt anchored in ISTQB syllabi. Click to see the sections used.',
        })}
        style={{
          background: '#eef2ff',
          color: '#4338ca',
          border: '1px solid #c7d2fe',
          padding: '3px 8px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.2,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        📚 {t('homoVsAi.istqb.badge', { defaultValue: 'ISTQB-anchored' })}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          marginTop: 6,
          background: 'white',
          border: '1px solid #c7d2fe',
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 11,
          lineHeight: 1.45,
          color: '#334155',
          maxWidth: 560,
        }}>
          <div style={{ fontSize: 10, color: '#4338ca', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            {t('homoVsAi.istqb.title', { defaultValue: 'Syllabi sections this prompt is anchored in' })}
          </div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {anchors.map((a, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>
                <strong style={{ color: '#1e293b' }}>{a.syllabus}</strong>{' '}
                <span style={{ color: '#4338ca' }}>{a.section}</span>
                {a.summary ? <> — <span style={{ color: '#475569' }}>{a.summary}</span></> : null}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 6, fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
            {t('homoVsAi.istqb.footnote', {
              defaultValue: 'ISTQB syllabi are referenced as curated short summaries (author\'s notes). Full-text use is deferred — see Future improvements at the bottom of this tab.',
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal markdown-lite renderer — handles **bold**, headings, bullets, code
// ---------------------------------------------------------------------------

function MarkdownLite({ text }) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  const rendered = [];
  let listBuffer = null; // { type: 'ul'|'ol', items: [] }

  const flushList = () => {
    if (!listBuffer) return;
    const Tag = listBuffer.type === 'ol' ? 'ol' : 'ul';
    rendered.push(
      <Tag key={`list-${rendered.length}`} style={{ margin: '6px 0 10px 22px', color: '#1f2937' }}>
        {listBuffer.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>
    );
    listBuffer = null;
  };

  const inline = (s) => {
    // bold, code, italic
    const parts = [];
    let remaining = s;
    let key = 0;
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/;
    while (remaining.length) {
      const m = remaining.match(re);
      if (!m) { parts.push(<span key={key++}>{remaining}</span>); break; }
      if (m.index > 0) parts.push(<span key={key++}>{remaining.slice(0, m.index)}</span>);
      const tok = m[0];
      if (tok.startsWith('**')) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
      else if (tok.startsWith('`')) parts.push(<code key={key++} style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{tok.slice(1, -1)}</code>);
      else parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
      remaining = remaining.slice(m.index + tok.length);
    }
    return <>{parts}</>;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const hMatch = line.match(/^(#{1,3})\s+(.*)$/);
    const ulMatch = line.match(/^[-•*]\s+(.*)$/);
    const olMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const size = level === 1 ? 18 : level === 2 ? 16 : 14;
      rendered.push(
        <div key={`h-${idx}`} style={{ fontWeight: 700, fontSize: size, margin: '10px 0 4px', color: '#0f172a' }}>
          {inline(hMatch[2])}
        </div>
      );
    } else if (ulMatch) {
      if (!listBuffer || listBuffer.type !== 'ul') { flushList(); listBuffer = { type: 'ul', items: [] }; }
      listBuffer.items.push(ulMatch[1]);
    } else if (olMatch) {
      if (!listBuffer || listBuffer.type !== 'ol') { flushList(); listBuffer = { type: 'ol', items: [] }; }
      listBuffer.items.push(olMatch[1]);
    } else if (!line) {
      flushList();
      rendered.push(<div key={`sp-${idx}`} style={{ height: 6 }} />);
    } else {
      flushList();
      rendered.push(<div key={`p-${idx}`} style={{ color: '#1f2937', margin: '2px 0', lineHeight: 1.55 }}>{inline(line)}</div>);
    }
  });
  flushList();
  return <div style={{ fontSize: 13 }}>{rendered}</div>;
}

// ---------------------------------------------------------------------------
// Section 1 — Workshop Hero
// ---------------------------------------------------------------------------

// Ordered to mirror the Activity Matrix row-by-row (10 challenges, 1:1 alignment).
// Legacy 'tests_from_code' is kept in the backend TASK_SPECS for backward compat
// but intentionally excluded from the live grid here.
const DEMO_TASKS = [
  { task: 'scenarios',      icon: '🎯', color: '#2563eb' },
  { task: 'risk',           icon: '⚖️', color: '#d97706' },
  { task: 'ambiguities',    icon: '🔍', color: '#7c3aed' },
  { task: 'exploratory',    icon: '🧭', color: '#059669' },
  { task: 'followups',      icon: '❓', color: '#db2777' },
  { task: 'automation',     icon: '⚙️', color: '#4338ca' },
  { task: 'testData',       icon: '🧪', color: '#0d9488' },
  { task: 'oracle',         icon: '🔮', color: '#e11d48' },
  { task: 'triage',         icon: '🚑', color: '#ea580c' },
  { task: 'accessibility',  icon: '♿', color: '#0891b2' },
];

function DemoCard({ task, icon, color, t, i18n, onVote, incomingInput }) {
  const title = t(`homoVsAi.demos.${task}.title`, { defaultValue: task });
  const prompt = t(`homoVsAi.demos.${task}.prompt`, { defaultValue: '' });
  const sample = t(`homoVsAi.demos.${task}.sample`, { defaultValue: '' });
  const humanAnswer = t(`homoVsAi.demos.${task}.humanAnswer`, { defaultValue: '' });

  const [input, setInput] = useState(sample);
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [humanText, setHumanText] = useState(humanAnswer);
  const [humanEditing, setHumanEditing] = useState(false);

  // AI Judge — advisory verdict. Kept local per card so each round can be
  // judged independently. NOT wired into the scoreboard; we only pass the
  // snapshot forward when the human casts their vote (so the scoreboard log
  // can show a 🤖 agree/disagree badge per round).
  const [judgeResult, setJudgeResult] = useState(null); // { verdict, confidence, rationale, criteria, istqb_anchors?, raw? }
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeErr, setJudgeErr] = useState(null);
  const [judgeElapsed, setJudgeElapsed] = useState(null);

  // ISTQB anchors surfaced alongside the AI output (populated by /challenge).
  // Empty until the tester runs the AI once; persists across the same task so
  // the badge stays visible as long as the AI answer is shown.
  const [istqbAnchors, setIstqbAnchors] = useState([]);
  // Local PDF RAG metadata (only when ItemAI / ItemServerAI + docs-ISTQB PDFs).
  const [istqbRag, setIstqbRag] = useState(null);
  // Ephemeral human feedback for "Re-run with feedback" (Option B).
  const [feedbackText, setFeedbackText] = useState('');

  // Phase E — Prompt Evolution. State for the per-card "Propose revision" flow.
  // The governance panel below the demo card lists pending revisions and lets
  // the workshop host approve / reject / regression / rollback. The "propose"
  // button here on the DemoCard becomes available the moment a human has
  // typed feedback AND the AI has produced an answer (same precondition as
  // Re-run with feedback). The result is stored ephemerally so the diff +
  // rationale stay visible until the user opens the governance panel.
  const [proposeLoading, setProposeLoading] = useState(false);
  const [proposeErr, setProposeErr] = useState(null);
  const [proposeResult, setProposeResult] = useState(null);
  // Bubble up to the parent so the governance panel below refreshes after
  // a propose call lands.
  const [promptSource, setPromptSource] = useState(null);

  // Follow i18n language changes: if the user switches EN<->NO<->ES, refresh
  // the human panel with the new locale copy as long as they have not edited it.
  const [humanDirty, setHumanDirty] = useState(false);
  useEffect(() => {
    if (!humanDirty) setHumanText(humanAnswer);
  }, [humanAnswer, humanDirty]);

  // 1.17.10 — same pattern for the Input textarea: until the tester has typed
  // anything (or the router has pushed external content), follow locale
  // changes so the sample text re-renders in the active language. Without
  // this, the textarea froze whatever sample was active at mount and ignored
  // subsequent locale switches.
  const [inputDirty, setInputDirty] = useState(false);
  useEffect(() => {
    if (!inputDirty) setInput(sample);
  }, [sample, inputDirty]);

  // Problem Router hand-off: when the parent passes a non-empty
  // `incomingInput` (a string timestamped/keyed by the router), overwrite the
  // input so the tester can press Run AI immediately on the routed problem.
  // We depend on the primitive value; every re-route produces a fresh string
  // (problem text) that only triggers the effect when it actually changes.
  useEffect(() => {
    if (incomingInput && incomingInput.trim()) {
      setInput(incomingInput);
      setInputDirty(true);  // router-injected content; do not overwrite on locale change
      setAiOutput('');
      setErr(null);
      setElapsed(null);
      setIstqbRag(null);
      setFeedbackText('');
    }
  }, [incomingInput]);

  const run = async ({ rerun = false } = {}) => {
    if (rerun) {
      if (!feedbackText.trim() || !aiOutput.trim()) return;
    } else {
      setAiOutput('');
    }
    setLoading(true);
    setErr(null);
    setIstqbRag(null);
    if (!rerun) setElapsed(null);
    // Stale judge result would refer to the previous AI output — clear it.
    setJudgeResult(null);
    setJudgeErr(null);
    setJudgeElapsed(null);
    const t0 = performance.now();
    const snapshotPrev = aiOutput;
    try {
      const res = await runTestingChallenge({
        task,
        input,
        language: i18n?.language?.startsWith('no') ? 'no' : 'en',
        ...(rerun ? { previousAiOutput: snapshotPrev, feedback: feedbackText.trim() } : {}),
      });
      setAiOutput(res.output || '(empty)');
      setIstqbAnchors(Array.isArray(res.istqb_anchors) ? res.istqb_anchors : []);
      setIstqbRag(res.istqb_rag || null);
      setPromptSource(res.prompt_source || null);
      if (rerun) setFeedbackText('');
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setElapsed(Math.round(performance.now() - t0));
      setLoading(false);
    }
  };

  // Ask the AI to judge the duel. Button is disabled until BOTH sides have
  // content (we can't judge with one side empty). Verdict is advisory only
  // — the human still clicks the +1 button below. The judgeResult snapshot
  // will ride along with the next human vote so the scoreboard log can show
  // agreement/disagreement.
  const judge = async () => {
    if (!humanText.trim() || !aiOutput.trim()) return;
    setJudgeLoading(true); setJudgeErr(null); setJudgeResult(null); setJudgeElapsed(null);
    const t0 = performance.now();
    try {
      const res = await judgeTestingRound({
        task,
        humanAnswer: humanText,
        aiAnswer: aiOutput,
        userInput: input,
        language: i18n?.language?.startsWith('no') ? 'no' : 'en',
      });
      setJudgeResult(res);
    } catch (e) {
      setJudgeErr(String(e.message || e));
    } finally {
      setJudgeElapsed(Math.round(performance.now() - t0));
      setJudgeLoading(false);
    }
  };

  const resetToSample = () => {
    setInput(sample); setAiOutput(''); setErr(null); setElapsed(null);
    setInputDirty(false);  // 1.17.10 — re-attach input to locale changes
    setJudgeResult(null); setJudgeErr(null); setJudgeElapsed(null);
    setIstqbAnchors([]);
    setIstqbRag(null);
    setFeedbackText('');
    setProposeResult(null); setProposeErr(null);
    setPromptSource(null);
  };

  // Phase E — Propose a persistent revision to the base system prompt for this
  // task. Requires both (a) an AI answer already generated and (b) human
  // feedback typed in the textarea. The LLM may REFUSE — we surface that as
  // a yellow notice rather than treating it as an error. On a real proposal
  // the diff appears below the button + a "Open governance panel" link.
  const proposeRevision = async () => {
    if (!aiOutput.trim() || !feedbackText.trim() || !input.trim()) return;
    setProposeLoading(true); setProposeErr(null); setProposeResult(null);
    try {
      const res = await proposePromptRevision({
        task,
        userInput: input.trim(),
        previousAiOutput: aiOutput.trim(),
        humanFeedback: feedbackText.trim(),
        actor: 'workshop-host',
      });
      setProposeResult(res);
      // Option A (1.15.1) — also persist the feedback as a 'proposal-trigger'
      // note so the workshop log captures the moment a revision was proposed.
      // Best-effort: never block the proposal flow on this.
      // 1.15.2 — also capture user_input so the A→C bridge can re-propose
      // this entry later from the export panel.
      try {
        await logHomoVsAiFeedback({
          task,
          text: feedbackText.trim(),
          context: 'proposal-trigger',
          previousAiOutput: aiOutput.trim(),
          userInput: input.trim(),
        });
      } catch (_) { /* ignore */ }
    } catch (e) {
      setProposeErr(String(e.message || e));
    } finally {
      setProposeLoading(false);
    }
  };

  // Option A (1.15.1, 2026-05-22) — Save the typed feedback as a note
  // without re-running the AI. Useful when the host wants to capture
  // critique for post-workshop analysis but does NOT want to either
  // burn a re-run on it OR escalate to a persistent revision proposal.
  // Preserves the textarea content so the host can still act on it
  // later in the same round.
  const [saveNoteLoading, setSaveNoteLoading] = useState(false);
  const [saveNoteResult, setSaveNoteResult] = useState(null);
  const [saveNoteErr, setSaveNoteErr] = useState(null);

  const saveAsNote = async () => {
    if (!feedbackText.trim()) return;
    setSaveNoteLoading(true);
    setSaveNoteErr(null);
    setSaveNoteResult(null);
    try {
      const res = await logHomoVsAiFeedback({
        task,
        text: feedbackText.trim(),
        context: 'manual-note',
        previousAiOutput: aiOutput.trim() || null,
        // 1.15.2 — also capture user_input (when present) so this manual
        // note can later be promoted to a Phase E revision proposal.
        userInput: input.trim() || null,
      });
      setSaveNoteResult(res);
      // Note is logged; the textarea stays so the host can still
      // re-run OR propose if they change their mind.
    } catch (e) {
      setSaveNoteErr(String(e.message || e));
    } finally {
      setSaveNoteLoading(false);
    }
  };

  return (
    <div id={`demo-${task}`} style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16,
      borderTop: `4px solid ${color}`,
      scrollMarginTop: 80,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('homoVsAi.demos.roundLabel', { defaultValue: 'Round' })}
          </div>
          <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            {icon} {title}
          </h3>
          {prompt && (
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4, maxWidth: 700 }}>{prompt}</div>
          )}
        </div>
        {istqbAnchors.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <IstqbBadge anchors={istqbAnchors} t={t} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {t('homoVsAi.demos.inputLabel', { defaultValue: 'Input' })}
        </label>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setInputDirty(true); }}
          rows={task === 'tests_from_code' ? 7 : 5}
          style={{
            width: '100%', marginTop: 4, padding: 10, fontFamily: 'ui-monospace, monospace',
            fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box',
            resize: 'vertical', lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={() => run({ rerun: false })} disabled={loading || !input.trim()}
            style={{
              background: loading ? '#93c5fd' : color, color: 'white', border: 'none',
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}>
            {loading
              ? t('homoVsAi.demos.running', { defaultValue: 'AI thinking…' })
              : `🤖 ${t('homoVsAi.demos.runLabel', { defaultValue: 'Run AI' })}`}
          </button>
          <button onClick={resetToSample} disabled={loading}
            style={{
              background: 'transparent', color: '#475569', border: '1px solid #cbd5e1',
              padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            }}>
            {t('homoVsAi.demos.resetLabel', { defaultValue: 'Reset to sample' })}
          </button>
        </div>
      </div>

      {/* Side-by-side answers */}
      <div style={{
        marginTop: 14, display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      }}>
        {/* Human */}
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 12,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700, letterSpacing: 1 }}>
              🧑 {humanEditing
                ? t('homoVsAi.demos.humanLabelEditing', { defaultValue: 'Human tester (editing)' })
                : t('homoVsAi.demos.humanLabel', { defaultValue: 'Human tester (prewritten)' })}
            </div>
            {!humanEditing ? (
              <button
                onClick={() => setHumanEditing(true)}
                title={t('homoVsAi.demos.humanEdit', { defaultValue: 'Edit human answer' })}
                style={{
                  background: 'transparent', border: '1px solid #86efac', color: '#15803d',
                  padding: '2px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                }}>
                ✏️ {t('homoVsAi.demos.humanEdit', { defaultValue: 'Edit' })}
              </button>
            ) : (
              <button
                onClick={() => setHumanEditing(false)}
                title={t('homoVsAi.demos.humanSave', { defaultValue: 'Save and view' })}
                style={{
                  background: '#15803d', border: '1px solid #15803d', color: 'white',
                  padding: '2px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                }}>
                💾 {t('homoVsAi.demos.humanSave', { defaultValue: 'Save' })}
              </button>
            )}
          </div>

          <div style={{ marginTop: 6 }}>
            {humanEditing ? (
              <>
                <textarea
                  value={humanText}
                  onChange={e => { setHumanText(e.target.value); setHumanDirty(true); }}
                  rows={10}
                  placeholder={t('homoVsAi.demos.humanEditPlaceholder', {
                    defaultValue: 'Write the group\'s answer here. Markdown (**bold**, bullets with -) is rendered when you save.',
                  })}
                  style={{
                    width: '100%', padding: 8, fontFamily: 'ui-monospace, monospace',
                    fontSize: 12, border: '1px solid #86efac', borderRadius: 6,
                    boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
                    background: 'white',
                  }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setHumanText(''); setHumanDirty(true); }}
                    style={{
                      background: 'transparent', border: '1px solid #cbd5e1', color: '#475569',
                      padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    }}>
                    🧹 {t('homoVsAi.demos.humanClear', { defaultValue: 'Clear' })}
                  </button>
                  <button
                    onClick={() => { setHumanText(humanAnswer); setHumanDirty(false); }}
                    style={{
                      background: 'transparent', border: '1px solid #cbd5e1', color: '#475569',
                      padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    }}>
                    ↩ {t('homoVsAi.demos.humanRestore', { defaultValue: 'Restore prewritten' })}
                  </button>
                </div>
              </>
            ) : (
              humanText
                ? <MarkdownLite text={humanText} />
                : <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                    {t('homoVsAi.demos.humanPlaceholder', { defaultValue: 'Click ✏️ Edit to write the group\'s answer here.' })}
                  </div>
            )}
          </div>
        </div>

        {/* AI */}
        <div style={{
          background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 10, padding: 12,
          minHeight: 120,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, letterSpacing: 1 }}>
              🤖 {t('homoVsAi.demos.aiLabel', { defaultValue: 'AI (live)' })}
            </div>
            {elapsed != null && (
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {(elapsed / 1000).toFixed(1)}s
              </div>
            )}
          </div>
          <div style={{ marginTop: 6 }}>
            {err && (
              <div style={{ color: '#991b1b', fontSize: 12, background: '#fef2f2', padding: 8, borderRadius: 6, border: '1px solid #fecaca' }}>
                ⚠️ {err}
              </div>
            )}
            {loading && (
              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                {t('homoVsAi.demos.thinking', { defaultValue: 'Querying the model…' })}
              </div>
            )}
            {!loading && !err && (aiOutput
              ? <MarkdownLite text={aiOutput} />
              : <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                  {t('homoVsAi.demos.aiPlaceholder', { defaultValue: 'Press "Run AI" to generate the answer live.' })}
                </div>)}
            <IstqbRagHint rag={istqbRag} t={t} />
          </div>
        </div>
      </div>

      {/* Vote bar — AI judge button sits next to the three human vote buttons.
          The verdict, if any, is attached to the human vote payload so the
          scoreboard can show a 🤖 agree/disagree badge per round. */}
      <div style={{
        marginTop: 12, padding: '10px 12px', background: '#f8fafc',
        border: '1px dashed #cbd5e1', borderRadius: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {t('homoVsAi.demos.votePrompt', { defaultValue: 'Who won this round?' })}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={judge}
            disabled={judgeLoading || !humanText.trim() || !aiOutput.trim()}
            title={
              (!humanText.trim() || !aiOutput.trim())
                ? t('homoVsAi.demos.judge.disabledHint', { defaultValue: 'Run the AI first, and make sure the human answer is not empty.' })
                : t('homoVsAi.demos.judge.buttonTitle', { defaultValue: 'Let the AI compare both answers (advisory only).' })
            }
            style={{
              background: judgeLoading ? '#e9d5ff' : '#7c3aed', color: 'white', border: 'none',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: (judgeLoading || !humanText.trim() || !aiOutput.trim()) ? 'not-allowed' : 'pointer',
              opacity: (!humanText.trim() || !aiOutput.trim()) ? 0.5 : 1,
            }}>
            {judgeLoading
              ? `⏳ ${t('homoVsAi.demos.judge.running', { defaultValue: 'AI judging…' })}`
              : `🧠 ${t('homoVsAi.demos.judge.button', { defaultValue: 'Ask AI to judge' })}`}
          </button>
          {/* Subtle separator between the advisory judge and the canonical human votes */}
          <span style={{ width: 1, height: 18, background: '#cbd5e1', margin: '0 2px' }} />
          <VoteButton onClick={() => onVote({ task, winner: 'human', aiJudge: judgeResult?.verdict || null })}   bg="#f0fdf4" border="#86efac" color="#15803d" icon="🧑" label={t('homoVsAi.verdict.human', { defaultValue: 'Human' })} />
          <VoteButton onClick={() => onVote({ task, winner: 'ai', aiJudge: judgeResult?.verdict || null })}      bg="#eff6ff" border="#93c5fd" color="#1d4ed8" icon="🤖" label={t('homoVsAi.verdict.ai', { defaultValue: 'AI' })} />
          <VoteButton onClick={() => onVote({ task, winner: 'tie', aiJudge: judgeResult?.verdict || null })}     bg="#f1f5f9" border="#cbd5e1" color="#334155" icon="🤝" label={t('homoVsAi.verdict.tie', { defaultValue: 'Tie' })} />
        </div>
      </div>

      {/* Ephemeral feedback re-run (Option B) — base prompts are unchanged; one-shot critique in system. */}
      <div style={{
        marginTop: 10,
        padding: '10px 12px',
        background: '#fafafa',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block' }}>
          {t('homoVsAi.demos.feedbackLabel', { defaultValue: 'Improvement notes for the AI (same round, ephemeral)' })}
        </label>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {t('homoVsAi.demos.feedbackHelp', {
            defaultValue: 'After a live answer, add concrete critique and press Re-run. The base task prompt is not modified — only this request gets the extra context.',
          })}
        </div>
        <textarea
          value={feedbackText}
          onChange={e => {
            setFeedbackText(e.target.value);
            // Option A (1.15.1): clear stale "Noted" / error toasts when the
            // host edits the critique — the saved note is older than what
            // they're typing now.
            if (saveNoteResult) setSaveNoteResult(null);
            if (saveNoteErr) setSaveNoteErr(null);
          }}
          rows={3}
          disabled={loading}
          placeholder={t('homoVsAi.demos.feedbackPlaceholder', {
            defaultValue: 'e.g. "Add boundary cases for email; you missed negative testing."',
          })}
          style={{
            width: '100%',
            marginTop: 6,
            padding: 8,
            fontSize: 12,
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            boxSizing: 'border-box',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.45,
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => run({ rerun: true })}
            disabled={
              loading || !input.trim() || !feedbackText.trim() || !aiOutput.trim()
            }
            style={{
              background: loading || !aiOutput.trim() || !feedbackText.trim()
                ? '#e2e8f0'
                : '#475569',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor:
                loading || !aiOutput.trim() || !feedbackText.trim()
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            🔁 {t('homoVsAi.demos.rerunWithFeedback', { defaultValue: 'Re-run with feedback' })}
          </button>

          {/* Phase E — Propose a persistent revision (governance flow).
              Same precondition as Re-run, different consequence: this asks
              LLM #2 for a diff to the BASE system prompt. The human must
              then approve in the governance panel below. */}
          <button
            type="button"
            onClick={proposeRevision}
            disabled={proposeLoading || loading || !aiOutput.trim() || !feedbackText.trim() || !input.trim()}
            title={t('homoVsAi.evolve.proposeTooltip', {
              defaultValue: 'Ask LLM #2 to propose a permanent revision to this task\'s base prompt. Human approval required.',
            })}
            style={{
              background: proposeLoading || !aiOutput.trim() || !feedbackText.trim()
                ? '#fef3c7'
                : '#a16207',
              color: proposeLoading || !aiOutput.trim() || !feedbackText.trim()
                ? '#92400e'
                : 'white',
              border: '1px solid #ca8a04',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: proposeLoading || !aiOutput.trim() || !feedbackText.trim()
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            🧬 {proposeLoading
                  ? t('homoVsAi.evolve.proposing', { defaultValue: 'Proposing…' })
                  : t('homoVsAi.evolve.proposeBtn', { defaultValue: 'Propose persistent revision' })}
          </button>

          {/* Option A (1.15.1) — Save the typed feedback as a note WITHOUT
              re-running the AI or proposing a revision. Captures critique
              for post-workshop analysis when neither B nor C is desired. */}
          <button
            type="button"
            onClick={saveAsNote}
            disabled={saveNoteLoading || !feedbackText.trim()}
            title={t('homoVsAi.feedbackLog.saveTooltip', {
              defaultValue: 'Save this critique to the workshop feedback log without re-running the AI. Persists for post-workshop export.',
            })}
            style={{
              background: saveNoteLoading || !feedbackText.trim() ? '#f1f5f9' : '#ecfdf5',
              color: saveNoteLoading || !feedbackText.trim() ? '#94a3b8' : '#047857',
              border: '1px solid #6ee7b7',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: saveNoteLoading || !feedbackText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            📝 {saveNoteLoading
                  ? t('homoVsAi.feedbackLog.saving', { defaultValue: 'Saving…' })
                  : t('homoVsAi.feedbackLog.saveBtn', { defaultValue: 'Save as note' })}
          </button>

          {/* Toast-like confirmation after a successful save. Auto-clears next
              time the host edits the textarea (handled in onChange below). */}
          {saveNoteResult && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#047857',
              background: '#dcfce7', border: '1px solid #6ee7b7',
              padding: '3px 8px', borderRadius: 999,
            }} title={saveNoteResult.entry?.entry_id}>
              ✓ {t('homoVsAi.feedbackLog.saved', { defaultValue: 'Noted' })}
            </span>
          )}
          {saveNoteErr && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#b91c1c',
              background: '#fee2e2', border: '1px solid #fecaca',
              padding: '3px 8px', borderRadius: 999,
            }}>
              ⚠ {saveNoteErr}
            </span>
          )}

          {/* Badge: this round's answer used an evolved prompt (Phase E) */}
          {promptSource?.source === 'evolved' && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#15803d',
              background: '#dcfce7', border: '1px solid #86efac',
              padding: '3px 8px', borderRadius: 999,
              letterSpacing: 0.4,
            }} title={t('homoVsAi.evolve.evolvedBadgeTooltip', {
              defaultValue: 'This answer used an LLM-evolved system prompt approved by a human.',
            })}>
              🧬 {t('homoVsAi.evolve.evolvedBadge', { defaultValue: 'Evolved prompt' })}
              {' '}v{promptSource.version}
            </span>
          )}
        </div>

        {/* Propose-revision result panel (ephemeral preview before approval) */}
        {proposeErr && (
          <div style={{
            marginTop: 8, color: '#991b1b', fontSize: 12, background: '#fef2f2',
            padding: 10, borderRadius: 8, border: '1px solid #fecaca',
          }}>
            ⚠️ {t('homoVsAi.evolve.errorPrefix', { defaultValue: 'Prompt evolution failed' })}: {proposeErr}
          </div>
        )}
        {proposeResult && (
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 8,
            background: proposeResult.status === 'pending' ? '#fefce8' : '#fef3c7',
            border: `1px solid ${proposeResult.status === 'pending' ? '#fde047' : '#fcd34d'}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#854d0e' }}>
              {proposeResult.status === 'pending'
                ? `🧬 ${t('homoVsAi.evolve.pendingTitle', { defaultValue: 'Revision proposed (pending human approval)' })}`
                : `🛑 ${t('homoVsAi.evolve.refusedTitle', { defaultValue: 'LLM refused this revision' })}`}
              {' '}<span style={{ fontWeight: 500, color: '#a16207' }}>
                · v{proposeResult.version} · {proposeResult.revision_id?.slice(0, 8)}
              </span>
            </div>
            {proposeResult.meta_llm_rationale && (
              <div style={{ fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
                <strong>{t('homoVsAi.evolve.rationale', { defaultValue: 'Rationale' })}:</strong>{' '}
                {proposeResult.meta_llm_rationale}
              </div>
            )}
            {Array.isArray(proposeResult.risk_flags) && proposeResult.risk_flags.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11 }}>
                <strong style={{ color: '#854d0e' }}>
                  {t('homoVsAi.evolve.riskFlags', { defaultValue: 'Risk flags' })}:
                </strong>
                {proposeResult.risk_flags.map((f, i) => (
                  <span key={i} style={{
                    marginLeft: 4, display: 'inline-block', padding: '2px 6px',
                    background: 'white', border: '1px solid #fcd34d',
                    borderRadius: 999, color: '#854d0e', fontWeight: 600,
                  }}>{f}</span>
                ))}
              </div>
            )}
            {proposeResult.status === 'refused' && proposeResult.refusal_reason && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#7c2d12', fontStyle: 'italic' }}>
                {proposeResult.refusal_reason}
              </div>
            )}
            {proposeResult.status === 'pending' && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                ✅ {t('homoVsAi.evolve.openPanelHint', {
                  defaultValue: 'Approve, reject or run the regression harness in the Prompt Evolution panel at the bottom of the tab.',
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Judge error */}
      {judgeErr && (
        <div style={{
          marginTop: 8, color: '#991b1b', fontSize: 12, background: '#fef2f2',
          padding: 10, borderRadius: 8, border: '1px solid #fecaca',
        }}>
          ⚠️ {t('homoVsAi.demos.judge.errorPrefix', { defaultValue: 'AI judge failed' })}: {judgeErr}
        </div>
      )}

      {/* Judge advisory panel — appears only after the user clicks the button.
          Deliberately styled in purple to distinguish it from the green human
          panel and the blue AI panel — this is a DIFFERENT role (meta-judge). */}
      {judgeResult && (
        <JudgeAdvisoryPanel t={t} result={judgeResult} elapsed={judgeElapsed} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Judge advisory panel — rendered below the vote bar when the user clicks
// "Ask AI to judge". Displays verdict, confidence, rationale, per-criterion
// breakdown, and a clear self-preference bias disclaimer. NEVER writes to
// the scoreboard — that's the human presenter's job.
// ---------------------------------------------------------------------------

const JUDGE_VERDICT_STYLES = {
  human: { bg: '#f0fdf4', border: '#86efac', color: '#15803d', icon: '🧑', labelKey: 'homoVsAi.demos.judge.verdictHuman', fallback: 'Human tester wins this round' },
  ai:    { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', icon: '🤖', labelKey: 'homoVsAi.demos.judge.verdictAi',    fallback: 'AI wins this round' },
  tie:   { bg: '#f1f5f9', border: '#cbd5e1', color: '#334155', icon: '🤝', labelKey: 'homoVsAi.demos.judge.verdictTie',   fallback: 'It is a tie' },
};

const JUDGE_CONFIDENCE_COLORS = {
  low:    { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  medium: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  high:   { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
};

function JudgeAdvisoryPanel({ t, result, elapsed }) {
  const v = JUDGE_VERDICT_STYLES[result.verdict] || JUDGE_VERDICT_STYLES.tie;
  const c = JUDGE_CONFIDENCE_COLORS[result.confidence] || JUDGE_CONFIDENCE_COLORS.medium;
  const criteria = result.criteria || {};
  return (
    <div style={{
      marginTop: 10, background: '#faf5ff', border: '1px solid #d8b4fe',
      borderLeft: '4px solid #7c3aed', borderRadius: 10, padding: 12,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 10, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            🧠 {t('homoVsAi.demos.judge.kicker', { defaultValue: 'AI judge · advisory' })}
          </div>
          <div style={{ marginTop: 2, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {v.icon} {t(v.labelKey, { defaultValue: v.fallback })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {Array.isArray(result.istqb_anchors) && result.istqb_anchors.length > 0 && (
            <IstqbBadge anchors={result.istqb_anchors} t={t} />
          )}
          <span style={{
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          }}>
            {t('homoVsAi.demos.judge.confidenceLabel', { defaultValue: 'Confidence' })}:{' '}
            {t(`homoVsAi.demos.judge.confidence_${result.confidence}`, { defaultValue: result.confidence })}
          </span>
          {elapsed != null && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {(elapsed / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {result.rationale && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
          {result.rationale}
        </div>
      )}

      {(criteria.accuracy || criteria.coverage || criteria.practical_value) && (
        <div style={{
          marginTop: 10, display: 'grid', gap: 8,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}>
          {criteria.accuracy && (
            <CriteriaCell
              label={t('homoVsAi.demos.judge.criteriaAccuracy', { defaultValue: 'Accuracy' })}
              value={criteria.accuracy}
            />
          )}
          {criteria.coverage && (
            <CriteriaCell
              label={t('homoVsAi.demos.judge.criteriaCoverage', { defaultValue: 'Coverage' })}
              value={criteria.coverage}
            />
          )}
          {criteria.practical_value && (
            <CriteriaCell
              label={t('homoVsAi.demos.judge.criteriaPracticalValue', { defaultValue: 'Practical value' })}
              value={criteria.practical_value}
            />
          )}
        </div>
      )}

      {/* Bias disclaimer — this is the whole point of making this advisory. */}
      <div style={{
        marginTop: 10, padding: '8px 10px', background: 'white',
        border: '1px dashed #d8b4fe', borderRadius: 8, color: '#581c87',
        fontSize: 11, lineHeight: 1.5,
      }}>
        ⚠️ {t('homoVsAi.demos.judge.biasDisclaimer', {
          defaultValue: 'Note: an AI judge can favour AI-style answers (self-preference bias). This verdict is advisory — the scoreboard only counts your vote.',
        })}
      </div>

      <IstqbRagHint rag={result.istqb_rag} t={t} />

      {result.raw && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
            {t('homoVsAi.demos.judge.rawToggle', { defaultValue: 'Show raw AI output (debug)' })}
          </summary>
          <pre style={{
            fontSize: 11, background: '#0f172a', color: '#e2e8f0', padding: 10,
            borderRadius: 6, overflowX: 'auto', marginTop: 6,
          }}>{result.raw}</pre>
        </details>
      )}
    </div>
  );
}

function CriteriaCell({ label, value }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e9d5ff', borderRadius: 8,
      padding: '6px 10px',
    }}>
      <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#334155', marginTop: 2, lineHeight: 1.45 }}>
        {value}
      </div>
    </div>
  );
}

function VoteButton({ onClick, bg, border, color, icon, label }) {
  return (
    <button onClick={onClick} style={{
      background: bg, color, border: `1px solid ${border}`,
      padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    }}>{icon} +1 {label}</button>
  );
}

export function HeadToHeadDemos({ t, i18n, onVote }) {
  // One slot per task. When the Problem Router picks a round, we drop the
  // problem text into that task's slot; the corresponding DemoCard has a
  // useEffect that mirrors it into its input textarea.
  const [routedInputs, setRoutedInputs] = useState({});

  const scrollTo = (task) => {
    const el = document.getElementById(`demo-${task}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onRouteApply = (task, problem) => {
    setRoutedInputs(prev => ({ ...prev, [task]: problem }));
    setTimeout(() => scrollTo(task), 60);
  };

  return (
    <div>
      <SectionHeader
        num="03"
        title={t('homoVsAi.demos.title', { defaultValue: 'Head-to-Head: 10 Live Rounds' })}
        lead={t('homoVsAi.demos.lead', {
          defaultValue:
            "Ten rounds, one per Activity Matrix row. Pick a round, read the prewritten human answer out loud, then press Run AI. Vote at the end of each round — it feeds the scoreboard.",
        })}
      />

      {/* Step 0 — Problem Router: free-form problem → AI-picked round */}
      <ProblemRouter t={t} i18n={i18n} onRouteApply={onRouteApply} scrollTo={scrollTo} />

      {/* Quick-nav chips — let the presenter jump to a round without scrolling */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 0 14px',
        padding: 10, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1,
          textTransform: 'uppercase', alignSelf: 'center', marginRight: 4,
        }}>
          {t('homoVsAi.demos.jumpTo', { defaultValue: 'Jump to' })}
        </span>
        {DEMO_TASKS.map((d, i) => (
          <button key={d.task} onClick={() => scrollTo(d.task)} title={t(`homoVsAi.demos.${d.task}.title`, { defaultValue: d.task })}
            style={{
              background: 'white', border: `1px solid ${d.color}`, color: d.color,
              padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>
            {d.icon} {i + 1}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {DEMO_TASKS.map(d => (
          <DemoCard
            key={d.task}
            {...d}
            t={t}
            i18n={i18n}
            onVote={onVote}
            incomingInput={routedInputs[d.task] || ''}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Problem Router — "Step 0": free-form problem description → AI picks best
// of the 10 rounds and lets the tester drop the problem into that demo card.
// ---------------------------------------------------------------------------

function ProblemRouter({ t, i18n, onRouteApply, scrollTo }) {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null); // { recommended, rationale, runner_ups, raw? }
  const [elapsed, setElapsed] = useState(null);

  const findTaskMeta = (taskKey) => DEMO_TASKS.find(d => d.task === taskKey) || null;

  const run = async () => {
    setLoading(true); setErr(null); setResult(null); setElapsed(null);
    const t0 = performance.now();
    try {
      const res = await routeTestingProblem({
        problem,
        language: i18n?.language?.startsWith('no') ? 'no' : 'en',
      });
      setResult(res);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setElapsed(Math.round(performance.now() - t0));
      setLoading(false);
    }
  };

  const clear = () => {
    setProblem(''); setResult(null); setErr(null); setElapsed(null);
  };

  const apply = (taskKey) => {
    if (!problem.trim()) return;
    onRouteApply(taskKey, problem.trim());
  };

  const recMeta = result ? findTaskMeta(result.recommended) : null;

  return (
    <div style={{
      background: 'white', border: '1px solid #cbd5e1', borderRadius: 12,
      borderTop: '4px solid #0ea5e9', padding: 16, marginBottom: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#0ea5e9', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('homoVsAi.router.kicker', { defaultValue: 'Step 0 · Problem Router' })}
          </div>
          <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            🧭 {t('homoVsAi.router.title', { defaultValue: 'Describe your problem — AI picks the best round' })}
          </h3>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4, maxWidth: 780 }}>
            {t('homoVsAi.router.lead', {
              defaultValue: 'Not sure which round fits? Paste the problem you are working on. The AI will recommend one of the 10 rounds, explain why, and offer two alternatives.',
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {t('homoVsAi.router.inputLabel', { defaultValue: 'Problem description' })}
        </label>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          rows={4}
          placeholder={t('homoVsAi.router.placeholder', {
            defaultValue: 'e.g. "We\'re shipping a password-reset feature in 3 days and I don\'t know where to start testing."',
          })}
          style={{
            width: '100%', marginTop: 4, padding: 10, fontFamily: 'inherit',
            fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box',
            resize: 'vertical', lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={run} disabled={loading || problem.trim().length < 10}
            style={{
              background: loading ? '#bae6fd' : '#0ea5e9', color: 'white', border: 'none',
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}>
            {loading
              ? t('homoVsAi.router.running', { defaultValue: 'AI routing…' })
              : `🧭 ${t('homoVsAi.router.runLabel', { defaultValue: 'Find best round' })}`}
          </button>
          <button onClick={clear} disabled={loading}
            style={{
              background: 'transparent', color: '#475569', border: '1px solid #cbd5e1',
              padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            }}>
            {t('homoVsAi.router.clearLabel', { defaultValue: 'Clear' })}
          </button>
          {elapsed != null && (
            <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>
              {(elapsed / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {err && (
        <div style={{
          marginTop: 12, color: '#991b1b', fontSize: 12, background: '#fef2f2',
          padding: 10, borderRadius: 8, border: '1px solid #fecaca',
        }}>
          ⚠️ {err}
        </div>
      )}

      {result && recMeta && (
        <div style={{
          marginTop: 14, background: '#f0f9ff', border: `1px solid ${recMeta.color}`,
          borderRadius: 10, padding: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: recMeta.color, fontWeight: 700, letterSpacing: 1 }}>
                {t('homoVsAi.router.recommendedKicker', { defaultValue: 'AI recommends' })}
              </div>
              <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {recMeta.icon} {t(`homoVsAi.demos.${result.recommended}.title`, { defaultValue: result.recommended })}
              </div>
            </div>
            {Array.isArray(result.istqb_anchors) && result.istqb_anchors.length > 0 && (
              <IstqbBadge anchors={result.istqb_anchors} t={t} />
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
            {result.rationale}
          </div>
          <IstqbRagHint rag={result.istqb_rag} t={t} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={() => apply(result.recommended)}
              style={{
                background: recMeta.color, color: 'white', border: 'none',
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              ⚡ {t('homoVsAi.router.useInRound', { defaultValue: 'Use this problem in Round' })}{' '}
              {DEMO_TASKS.findIndex(d => d.task === result.recommended) + 1}
            </button>
            <button onClick={() => scrollTo(result.recommended)}
              style={{
                background: 'transparent', color: recMeta.color, border: `1px solid ${recMeta.color}`,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              {t('homoVsAi.router.jumpOnly', { defaultValue: 'Just jump to round' })}
            </button>
          </div>

          {Array.isArray(result.runner_ups) && result.runner_ups.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                {t('homoVsAi.router.alternatives', { defaultValue: 'Alternative rounds' })}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {result.runner_ups.map((ru) => {
                  const meta = findTaskMeta(ru.task);
                  if (!meta) return null;
                  return (
                    <div key={ru.task} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      background: 'white', border: `1px solid ${meta.color}33`, borderRadius: 8, padding: 10,
                    }}>
                      <div style={{ fontSize: 18, lineHeight: 1 }}>{meta.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>
                          {t(`homoVsAi.demos.${ru.task}.title`, { defaultValue: ru.task })}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>
                          {ru.why}
                        </div>
                      </div>
                      <button onClick={() => apply(ru.task)}
                        style={{
                          background: 'transparent', border: `1px solid ${meta.color}`, color: meta.color,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          alignSelf: 'center', whiteSpace: 'nowrap',
                        }}>
                        ⚡ {t('homoVsAi.router.useShort', { defaultValue: 'Use here' })}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.raw && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
                {t('homoVsAi.router.rawToggle', { defaultValue: 'Show raw AI output (debug)' })}
              </summary>
              <pre style={{
                fontSize: 11, background: '#0f172a', color: '#e2e8f0', padding: 10,
                borderRadius: 6, overflowX: 'auto', marginTop: 6,
              }}>{result.raw}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 4 — Trust Framework
// ---------------------------------------------------------------------------
