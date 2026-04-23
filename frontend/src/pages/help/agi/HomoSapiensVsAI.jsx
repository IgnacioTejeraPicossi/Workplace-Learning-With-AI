/**
 * Homo Sapiens vs. KI i Test — workshop tab for the SOCO testing workshop.
 *
 * 6 sections (top to bottom):
 *   1. WorkshopHero        — framing, 3 reflection questions, SOCO/Ola/Keyhan nod
 *   2. ActivityMatrix      — 10 testing activities × 3 verdicts (human/AI/hybrid)
 *   3. HeadToHeadDemos     — 10 live demos using ask_ai_unified (side-by-side),
 *                             aligned 1:1 with the Activity Matrix rows
 *   4. TrustFramework      — "when to trust whom" decision rows
 *   5. WorkshopScoreboard  — configurable groups + round log + JSON export
 *   6. SpeakerCribSheet    — collapsible speaker notes, quotes, likely Q&A
 *
 * All copy comes from i18n (EN/NO). Language switch on the app header
 * automatically flips the tab from English to Norwegian for the SOCO crowd.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { runTestingChallenge } from '../../../api/agiApi';

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

function DemoCard({ task, icon, color, t, i18n, onVote }) {
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

  // Follow i18n language changes: if the user switches EN<->NO, refresh the
  // human panel with the new locale copy as long as they have not edited it.
  const [humanDirty, setHumanDirty] = useState(false);
  useEffect(() => {
    if (!humanDirty) setHumanText(humanAnswer);
  }, [humanAnswer, humanDirty]);

  const run = async () => {
    setLoading(true); setErr(null); setAiOutput(''); setElapsed(null);
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

  const resetToSample = () => { setInput(sample); setAiOutput(''); setErr(null); setElapsed(null); };

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

      {/* Vote bar */}
      <div style={{
        marginTop: 12, padding: '10px 12px', background: '#f8fafc',
        border: '1px dashed #cbd5e1', borderRadius: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {t('homoVsAi.demos.votePrompt', { defaultValue: 'Who won this round?' })}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <VoteButton onClick={() => onVote({ task, winner: 'human' })}   bg="#f0fdf4" border="#86efac" color="#15803d" icon="🧑" label={t('homoVsAi.verdict.human', { defaultValue: 'Human' })} />
          <VoteButton onClick={() => onVote({ task, winner: 'ai' })}      bg="#eff6ff" border="#93c5fd" color="#1d4ed8" icon="🤖" label={t('homoVsAi.verdict.ai', { defaultValue: 'AI' })} />
          <VoteButton onClick={() => onVote({ task, winner: 'tie' })}     bg="#f1f5f9" border="#cbd5e1" color="#334155" icon="🤝" label={t('homoVsAi.verdict.tie', { defaultValue: 'Tie' })} />
        </div>
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
  const scrollTo = (task) => {
    const el = document.getElementById(`demo-${task}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <DemoCard key={d.task} {...d} t={t} i18n={i18n} onVote={onVote} />
        ))}
      </div>
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

  // Vote mapping from HeadToHead demos → default group names
  React.useEffect(() => {
    if (!externalVote) return;
    const map = { human: 'Menneske', ai: 'KI', tie: 'Uavgjort' };
    const group = map[externalVote.winner];
    if (group && groups.includes(group)) {
      bump(group, `round: ${externalVote.task}`);
    }
    if (onClearExternal) onClearExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalVote]);

  const bump = (group, note = '') => {
    setScores(prev => ({ ...prev, [group]: (prev[group] || 0) + 1 }));
    setRounds(prev => [
      { ts: new Date().toISOString(), group, note: note || noteDraft || '' },
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

        {/* Round log */}
        {rounds.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              {t('homoVsAi.scoreboard.logTitle', { defaultValue: 'Round log' })} ({rounds.length})
            </div>
            <div style={{
              maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8,
            }}>
              {rounds.map((r, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '140px 120px 1fr',
                  padding: '6px 10px', fontSize: 12, gap: 8,
                  borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                  color: '#334155',
                }}>
                  <code style={{ color: '#64748b', fontSize: 11 }}>{r.ts.slice(11, 19)}</code>
                  <strong style={{ color: '#0f172a' }}>{r.group}</strong>
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
