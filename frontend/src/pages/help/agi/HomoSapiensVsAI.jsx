/**
 * Homo Sapiens vs. KI i Test — workshop tab for the SOCO testing workshop.
 *
 * 6 sections (top to bottom):
 *   1. WorkshopHero        — framing, 3 reflection questions, SOCO/Ola/Keyhan nod
 *   2. ActivityMatrix      — 10 testing activities × 3 verdicts (human/AI/hybrid)
 *   3. HeadToHeadDemos     — Problem Router (Step 0) + 10 live demos using
 *                             ask_ai_unified (side-by-side), aligned 1:1 with
 *                             the Activity Matrix rows. The Problem Router
 *                             takes a free-form problem description and lets
 *                             the LLM pick the best-fitting round, with the
 *                             option to drop the problem directly into that
 *                             round's input.
 *   4. TrustFramework      — "when to trust whom" decision rows
 *   5. WorkshopScoreboard  — configurable groups + round log + JSON export
 *   6. SpeakerCribSheet    — collapsible speaker notes, quotes, likely Q&A
 *
 * All copy comes from i18n (EN/NO). Language switch on the app header
 * automatically flips the tab from English to Norwegian for the SOCO crowd.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { judgeTestingRound, routeTestingProblem, runTestingChallenge } from '../../../api/agiApi';

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

function WorkshopHero({ t }) {
  const questions = t('homoVsAi.hero.questions', { returnObjects: true, defaultValue: [] });
  const qList = Array.isArray(questions) ? questions : [];
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white', borderRadius: 14, padding: '1.75rem 2rem',
      boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: '#60a5fa', fontWeight: 700 }}>
            {t('homoVsAi.hero.kicker', { defaultValue: 'SOCO · WORKSHOP · 2026' })}
          </div>
          <h2 style={{ margin: '6px 0 10px', fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
            🧑‍💻 {t('homoVsAi.hero.title', { defaultValue: 'Homo Sapiens vs. KI i Test' })}
          </h2>
          <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, maxWidth: 780 }}>
            {t('homoVsAi.hero.lead', {
              defaultValue:
                'How do humans and AI stack up on everyday testing tasks — and when does each one actually win? A pragmatic, evidence-led companion to the workshop with Ola Kleiven & Keyhan Farahaninia.',
            })}
          </div>
        </div>
        <div style={{
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(96,165,250,0.35)',
          borderRadius: 10, padding: '10px 14px', minWidth: 180,
        }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#93c5fd', fontWeight: 700 }}>HOSTS</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Ola Kleiven</div>
          <div style={{ fontSize: 13 }}>Keyhan Farahaninia</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>SOCO · software testing</div>
        </div>
      </div>

      {qList.length > 0 && (
        <div style={{
          marginTop: 18,
          display: 'grid', gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}>
          {qList.map((q, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, letterSpacing: 1 }}>
                Q{i + 1}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: '#e2e8f0' }}>
                {q}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Activity Matrix
// ---------------------------------------------------------------------------

const ACTIVITY_IDS = [
  'scenarios', 'risk', 'ambiguity', 'exploratory', 'followups',
  'automation', 'testData', 'oracle', 'triage', 'accessibility',
];

const VERDICT_STYLES = {
  ai:     { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', icon: '🤖', labelKey: 'homoVsAi.verdict.ai' },
  human:  { bg: '#f0fdf4', border: '#86efac', color: '#15803d', icon: '🧑', labelKey: 'homoVsAi.verdict.human' },
  hybrid: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e', icon: '🤝', labelKey: 'homoVsAi.verdict.hybrid' },
};

function ActivityCard({ id, t }) {
  const title = t(`homoVsAi.activities.${id}.title`, { defaultValue: id });
  const desc = t(`homoVsAi.activities.${id}.desc`, { defaultValue: '' });
  const rationale = t(`homoVsAi.activities.${id}.rationale`, { defaultValue: '' });
  const verdict = t(`homoVsAi.activities.${id}.verdict`, { defaultValue: 'hybrid' });
  const confidence = t(`homoVsAi.activities.${id}.confidence`, { defaultValue: 'medium' });
  const v = VERDICT_STYLES[verdict] || VERDICT_STYLES.hybrid;
  const verdictLabel = t(v.labelKey, { defaultValue: verdict });
  return (
    <div style={{
      background: 'white', border: `1px solid ${v.border}`,
      borderRadius: 10, padding: 14, borderLeft: `4px solid ${v.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.3 }}>
          {title}
        </div>
        <span style={{
          background: v.bg, color: v.color, border: `1px solid ${v.border}`,
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          whiteSpace: 'nowrap',
        }}>
          {v.icon} {verdictLabel}
        </span>
      </div>
      {desc && (
        <div style={{ color: '#475569', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
      )}
      {rationale && (
        <div style={{
          marginTop: 8, padding: '6px 8px', background: '#f8fafc',
          borderRadius: 6, color: '#334155', fontSize: 11, lineHeight: 1.5,
          borderLeft: '2px solid #cbd5e1',
        }}>
          <strong style={{ color: '#0f172a' }}>
            {t('homoVsAi.why', { defaultValue: 'Why' })}:
          </strong>{' '}{rationale}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('homoVsAi.confidenceLabel', { defaultValue: 'Confidence' })}: {confidence}
      </div>
    </div>
  );
}

function ActivityMatrix({ t }) {
  return (
    <div>
      <SectionHeader
        num="02"
        title={t('homoVsAi.activities.title', { defaultValue: 'Activity Matrix' })}
        lead={t('homoVsAi.activities.lead', {
          defaultValue: 'Ten canonical testing activities. Who has the edge today — and why? Colour-coded verdicts (not dogma).',
        })}
      />
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}>
        {ACTIVITY_IDS.map(id => <ActivityCard key={id} id={id} t={t} />)}
      </div>
      <Legend t={t} />
    </div>
  );
}

function Legend({ t }) {
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#475569' }}>
      {['human', 'ai', 'hybrid'].map(v => {
        const s = VERDICT_STYLES[v];
        return (
          <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
              padding: '2px 8px', borderRadius: 12, fontWeight: 700, fontSize: 11,
            }}>
              {s.icon} {t(s.labelKey, { defaultValue: v })}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — Head-to-Head Demos (live AI calls)
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
  const [judgeResult, setJudgeResult] = useState(null); // { verdict, confidence, rationale, criteria, raw? }
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeErr, setJudgeErr] = useState(null);
  const [judgeElapsed, setJudgeElapsed] = useState(null);

  // Follow i18n language changes: if the user switches EN<->NO, refresh the
  // human panel with the new locale copy as long as they have not edited it.
  const [humanDirty, setHumanDirty] = useState(false);
  useEffect(() => {
    if (!humanDirty) setHumanText(humanAnswer);
  }, [humanAnswer, humanDirty]);

  // Problem Router hand-off: when the parent passes a non-empty
  // `incomingInput` (a string timestamped/keyed by the router), overwrite the
  // input so the tester can press Run AI immediately on the routed problem.
  // We depend on the primitive value; every re-route produces a fresh string
  // (problem text) that only triggers the effect when it actually changes.
  useEffect(() => {
    if (incomingInput && incomingInput.trim()) {
      setInput(incomingInput);
      setAiOutput('');
      setErr(null);
      setElapsed(null);
    }
  }, [incomingInput]);

  const run = async () => {
    setLoading(true); setErr(null); setAiOutput(''); setElapsed(null);
    // Stale judge result would refer to the previous AI output — clear it.
    setJudgeResult(null); setJudgeErr(null); setJudgeElapsed(null);
    const t0 = performance.now();
    try {
      const res = await runTestingChallenge({
        task,
        input,
        language: i18n?.language?.startsWith('no') ? 'no' : 'en',
      });
      setAiOutput(res.output || '(empty)');
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
    setJudgeResult(null); setJudgeErr(null); setJudgeElapsed(null);
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
      </div>

      {/* Input */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {t('homoVsAi.demos.inputLabel', { defaultValue: 'Input' })}
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={task === 'tests_from_code' ? 7 : 5}
          style={{
            width: '100%', marginTop: 4, padding: 10, fontFamily: 'ui-monospace, monospace',
            fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box',
            resize: 'vertical', lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={run} disabled={loading || !input.trim()}
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

function HeadToHeadDemos({ t, i18n, onVote }) {
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
          <div style={{ fontSize: 11, color: recMeta.color, fontWeight: 700, letterSpacing: 1 }}>
            {t('homoVsAi.router.recommendedKicker', { defaultValue: 'AI recommends' })}
          </div>
          <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {recMeta.icon} {t(`homoVsAi.demos.${result.recommended}.title`, { defaultValue: result.recommended })}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
            {result.rationale}
          </div>
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

const TRUST_ROWS = [
  'context', 'risk', 'ambiguity', 'novelty', 'volume', 'judgement', 'accountability',
];

function TrustFramework({ t }) {
  return (
    <div>
      <SectionHeader
        num="04"
        title={t('homoVsAi.framework.title', { defaultValue: 'When to trust whom' })}
        lead={t('homoVsAi.framework.lead', {
          defaultValue: 'A compact decision grid by dimension — not a hierarchy, a toolkit.',
        })}
      />
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.6fr',
          background: '#0f172a', color: 'white', fontSize: 12, fontWeight: 700,
          padding: '10px 14px', gap: 10,
        }}>
          <div>{t('homoVsAi.framework.col.dimension', { defaultValue: 'Dimension' })}</div>
          <div>{t('homoVsAi.framework.col.ai', { defaultValue: 'AI excels when…' })}</div>
          <div>{t('homoVsAi.framework.col.human', { defaultValue: 'Humans excel when…' })}</div>
          <div>{t('homoVsAi.framework.col.verdict', { defaultValue: 'Practical rule' })}</div>
        </div>
        {TRUST_ROWS.map((id, i) => (
          <div key={id} style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.6fr',
            padding: '12px 14px', gap: 10, alignItems: 'start',
            borderTop: i === 0 ? 'none' : '1px solid #e2e8f0',
            background: i % 2 === 0 ? 'white' : '#f8fafc',
            fontSize: 12, lineHeight: 1.55, color: '#1f2937',
          }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              {t(`homoVsAi.framework.rows.${id}.dimension`, { defaultValue: id })}
            </div>
            <div>{t(`homoVsAi.framework.rows.${id}.ai`, { defaultValue: '' })}</div>
            <div>{t(`homoVsAi.framework.rows.${id}.human`, { defaultValue: '' })}</div>
            <div style={{ color: '#334155', fontWeight: 500 }}>
              {t(`homoVsAi.framework.rows.${id}.rule`, { defaultValue: '' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 5 — Workshop Scoreboard (configurable groups + rounds + export)
// ---------------------------------------------------------------------------

const DEFAULT_GROUPS = ['Menneske', 'KI', 'Uavgjort'];

function WorkshopScoreboard({ t, externalVote, onClearExternal }) {
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [scores, setScores] = useState(() => DEFAULT_GROUPS.reduce((a, g) => ({ ...a, [g]: 0 }), {}));
  const [rounds, setRounds] = useState([]); // {ts, group, note}
  const [newGroup, setNewGroup] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  // Vote mapping from HeadToHead demos → default group names.
  // externalVote may carry `aiJudge` = 'human'|'ai'|'tie'|null (advisory
  // snapshot at vote time). We pass it into bump() so the round log can
  // show a 🤖 agree/disagree badge alongside each entry.
  React.useEffect(() => {
    if (!externalVote) return;
    const map = { human: 'Menneske', ai: 'KI', tie: 'Uavgjort' };
    const group = map[externalVote.winner];
    if (group && groups.includes(group)) {
      bump(group, `round: ${externalVote.task}`, {
        task: externalVote.task,
        humanVote: externalVote.winner,
        aiJudge: externalVote.aiJudge || null,
      });
    }
    if (onClearExternal) onClearExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalVote]);

  const bump = (group, note = '', meta = null) => {
    setScores(prev => ({ ...prev, [group]: (prev[group] || 0) + 1 }));
    setRounds(prev => [
      {
        ts: new Date().toISOString(),
        group,
        note: note || noteDraft || '',
        // meta is present for votes that came via the head-to-head demos
        // (carries task + humanVote + aiJudge snapshot). Manual +1 clicks
        // on the group cards don't have meta — that's fine.
        task: meta?.task || null,
        humanVote: meta?.humanVote || null,
        aiJudge: meta?.aiJudge || null,
      },
      ...prev,
    ]);
    setNoteDraft('');
  };

  const undoLast = () => {
    if (rounds.length === 0) return;
    const [last, ...rest] = rounds;
    setRounds(rest);
    setScores(prev => ({ ...prev, [last.group]: Math.max(0, (prev[last.group] || 0) - 1) }));
  };

  const resetAll = () => {
    setScores(groups.reduce((a, g) => ({ ...a, [g]: 0 }), {}));
    setRounds([]);
  };

  const addGroup = () => {
    const g = newGroup.trim();
    if (!g || groups.includes(g)) return;
    setGroups(prev => [...prev, g]);
    setScores(prev => ({ ...prev, [g]: 0 }));
    setNewGroup('');
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      workshop: 'Homo Sapiens vs. KI i Test — SOCO',
      groups, scores, rounds,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-score-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeader
        num="05"
        title={t('homoVsAi.scoreboard.title', { defaultValue: 'Workshop Scoreboard' })}
        lead={t('homoVsAi.scoreboard.lead', {
          defaultValue: 'Live tally for the session. Votes from the head-to-head rounds feed here automatically. Add group names, undo the last vote, or export the full log as JSON.',
        })}
      />
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
        <div style={{
          display: 'grid', gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}>
          {groups.map(g => (
            <div key={g} style={{
              border: '1px solid #e2e8f0', borderRadius: 10, padding: 12,
              background: '#f8fafc',
            }}>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{g}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {scores[g] || 0}
              </div>
              <button onClick={() => bump(g)} style={{
                marginTop: 6, background: '#1d4ed8', color: 'white', border: 'none',
                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>+1</button>
            </div>
          ))}
        </div>

        {/* Note + add group */}
        <div style={{ marginTop: 12, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
            placeholder={t('homoVsAi.scoreboard.notePlaceholder', { defaultValue: 'Round note (optional, attaches to next +1)' })}
            style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newGroup} onChange={e => setNewGroup(e.target.value)}
              placeholder={t('homoVsAi.scoreboard.newGroupPlaceholder', { defaultValue: 'New group name' })}
              style={{ flex: 1, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
            <button onClick={addGroup} style={{
              background: '#059669', color: 'white', border: 'none',
              padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {t('homoVsAi.scoreboard.addGroup', { defaultValue: 'Add group' })}
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={undoLast} disabled={rounds.length === 0} style={{
            background: 'transparent', color: '#475569', border: '1px solid #cbd5e1',
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
          }}>↶ {t('homoVsAi.scoreboard.undo', { defaultValue: 'Undo last' })}</button>
          <button onClick={resetAll} style={{
            background: 'transparent', color: '#991b1b', border: '1px solid #fecaca',
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
          }}>{t('homoVsAi.scoreboard.reset', { defaultValue: 'Reset' })}</button>
          <button onClick={exportJson} style={{
            background: '#0f172a', color: 'white', border: 'none',
            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>⬇ {t('homoVsAi.scoreboard.export', { defaultValue: 'Export JSON' })}</button>
        </div>

        {/* Round log — shows the human vote plus (when present) the AI
            judge's advisory verdict as an agree/disagree badge. This makes
            the self-preference bias visible retrospectively. */}
        {rounds.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              {t('homoVsAi.scoreboard.logTitle', { defaultValue: 'Round log' })} ({rounds.length})
            </div>
            <div style={{
              maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8,
            }}>
              {rounds.map((r, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '80px 110px 140px 1fr',
                  padding: '6px 10px', fontSize: 12, gap: 8, alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                  color: '#334155',
                }}>
                  <code style={{ color: '#64748b', fontSize: 11 }}>{r.ts.slice(11, 19)}</code>
                  <strong style={{ color: '#0f172a' }}>{r.group}</strong>
                  <AiJudgeBadge t={t} humanVote={r.humanVote} aiJudge={r.aiJudge} />
                  <span style={{ color: '#475569' }}>{r.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AI Judge agreement badge — small pill used in the scoreboard round log.
// Visualises how the AI judge's advisory verdict compared to the human's
// canonical vote for that round. Three states:
//   - missing  → empty (AI judge was never run for this round)
//   - agree    → green "🤖 ✓" (AI and human concur)
//   - disagree → amber "🤖 ✗ said X" (AI picked something else — showcase)
// This is purely visual; no behaviour hangs off it.
function AiJudgeBadge({ t, humanVote, aiJudge }) {
  if (!aiJudge || !humanVote) {
    return <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
      {t('homoVsAi.scoreboard.aiJudgeNone', { defaultValue: '—' })}
    </span>;
  }
  const agree = aiJudge === humanVote;
  const style = agree
    ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' }
    : { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
  const verdictLabel = t(
    aiJudge === 'human' ? 'homoVsAi.verdict.human'
      : aiJudge === 'ai' ? 'homoVsAi.verdict.ai'
      : 'homoVsAi.verdict.tie',
    { defaultValue: aiJudge }
  );
  return (
    <span
      title={agree
        ? t('homoVsAi.scoreboard.aiJudgeAgreeTitle', { defaultValue: 'The AI judge agreed with your vote.' })
        : t('homoVsAi.scoreboard.aiJudgeDisagreeTitle', { defaultValue: 'The AI judge would have picked differently — possible self-preference bias in play.' })
      }
      style={{
        background: style.bg, color: style.color, border: `1px solid ${style.border}`,
        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 12,
        whiteSpace: 'nowrap', letterSpacing: 0.3,
      }}>
      🤖 {agree
        ? t('homoVsAi.scoreboard.aiJudgeAgree', { defaultValue: 'agreed' })
        : `${t('homoVsAi.scoreboard.aiJudgeDisagree', { defaultValue: 'said' })} ${verdictLabel}`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section 6 — Speaker Crib Sheet (collapsible)
// ---------------------------------------------------------------------------

function SpeakerCribSheet({ t }) {
  const [open, setOpen] = useState(false);
  const quotes = t('homoVsAi.cribSheet.quotes', { returnObjects: true, defaultValue: [] });
  const qa = t('homoVsAi.cribSheet.qa', { returnObjects: true, defaultValue: [] });
  const openerParas = t('homoVsAi.cribSheet.openerParas', { returnObjects: true, defaultValue: [] });
  const closerParas = t('homoVsAi.cribSheet.closerParas', { returnObjects: true, defaultValue: [] });

  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '14px 18px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#a16207', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            06 · {t('homoVsAi.cribSheet.privateLabel', { defaultValue: 'Speaker-only' })}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#78350f', marginTop: 2 }}>
            🎤 {t('homoVsAi.cribSheet.title', { defaultValue: 'Crib sheet (60-sec opener, quotes, likely Q&A)' })}
          </div>
        </div>
        <div style={{ fontSize: 22, color: '#a16207' }}>{open ? '▾' : '▸'}</div>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', color: '#78350f', fontSize: 13, lineHeight: 1.6 }}>
          <SubBlock title={t('homoVsAi.cribSheet.openerTitle', { defaultValue: '60-second opener' })}>
            {Array.isArray(openerParas) && openerParas.map((p, i) => (
              <p key={i} style={{ margin: '6px 0' }}>{p}</p>
            ))}
          </SubBlock>

          <SubBlock title={t('homoVsAi.cribSheet.quotesTitle', { defaultValue: 'Quotes to drop (only if natural)' })}>
            <div style={{ display: 'grid', gap: 8 }}>
              {Array.isArray(quotes) && quotes.map((q, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontStyle: 'italic', color: '#78350f' }}>“{q.text}”</div>
                  <div style={{ color: '#a16207', fontSize: 11, marginTop: 4 }}>— {q.attribution}</div>
                  {q.use && (
                    <div style={{ color: '#92400e', fontSize: 11, marginTop: 4 }}>
                      <strong>Use when:</strong> {q.use}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SubBlock>

          <SubBlock title={t('homoVsAi.cribSheet.qaTitle', { defaultValue: 'Likely audience questions' })}>
            <div style={{ display: 'grid', gap: 8 }}>
              {Array.isArray(qa) && qa.map((row, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #fde68a', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 700, color: '#78350f' }}>Q: {row.q}</div>
                  <div style={{ marginTop: 4, color: '#1f2937' }}>A: {row.a}</div>
                </div>
              ))}
            </div>
          </SubBlock>

          <SubBlock title={t('homoVsAi.cribSheet.closerTitle', { defaultValue: 'Closer (what you want them to remember)' })}>
            {Array.isArray(closerParas) && closerParas.map((p, i) => (
              <p key={i} style={{ margin: '6px 0', fontWeight: 600 }}>{p}</p>
            ))}
          </SubBlock>
        </div>
      )}
    </div>
  );
}

function SubBlock({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 700, color: '#78350f', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared — section header
// ---------------------------------------------------------------------------

function SectionHeader({ num, title, lead }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: 2 }}>
        {num} · SECTION
      </div>
      <h3 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
      {lead && (
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, maxWidth: 860 }}>
          {lead}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-level component
// ---------------------------------------------------------------------------

export default function HomoSapiensVsAI() {
  const { t, i18n } = useTranslation();
  const [externalVote, setExternalVote] = useState(null);

  const onVote = useMemo(() => (payload) => {
    setExternalVote(payload);
  }, []);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <WorkshopHero t={t} />
      <ActivityMatrix t={t} />
      <HeadToHeadDemos t={t} i18n={i18n} onVote={onVote} />
      <TrustFramework t={t} />
      <WorkshopScoreboard
        t={t}
        externalVote={externalVote}
        onClearExternal={() => setExternalVote(null)}
      />
      <SpeakerCribSheet t={t} />
    </div>
  );
}
