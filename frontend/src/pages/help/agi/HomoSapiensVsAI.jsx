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

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from './homo-vs-ai/shared';
import { HeadToHeadDemos } from './homo-vs-ai/DemoSection';
import { PromptEvolutionPanel, FeedbackLogExportPanel } from './homo-vs-ai/GovernanceSection';

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

function FutureImprovementsNote({ t }) {
  const ideas = t('homoVsAi.future.ideas', { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(ideas) ? ideas : [];
  return (
    <div style={{
      marginTop: 4,
      background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10,
      padding: '14px 18px', color: '#475569',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#64748b',
        textTransform: 'uppercase',
      }}>
        * {t('homoVsAi.future.kicker', { defaultValue: 'Future improvements' })}
      </div>
      <div style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic', color: '#64748b' }}>
        {t('homoVsAi.future.lead', {
          defaultValue: 'Ideas deliberately parked, not implemented — documented here so the next iteration starts with context, not a blank page.',
        })}
      </div>
      {list.length > 0 && (
        <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 12, lineHeight: 1.6 }}>
          {list.map((idea, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              {idea.status && (
                <div style={{
                  fontSize: 11,
                  color: '#047857',
                  fontWeight: 700,
                  marginBottom: 4,
                  letterSpacing: 0.3,
                }}>
                  {idea.status}
                </div>
              )}
              <strong style={{ color: '#334155' }}>{idea.title}</strong>
              {idea.summary && <span style={{ color: '#64748b' }}> — {idea.summary}</span>}
              {Array.isArray(idea.options) && idea.options.length > 0 && (
                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#64748b' }}>
                  {idea.options.map((opt, j) => (
                    <li key={j} style={{ marginBottom: 2 }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>{opt.label}:</span>{' '}
                      {opt.text}
                    </li>
                  ))}
                </ul>
              )}
              {idea.tradeoff && (
                <div style={{
                  marginTop: 4, fontSize: 11, color: '#64748b', fontStyle: 'italic',
                }}>
                  {t('homoVsAi.future.tradeoffPrefix', { defaultValue: 'Why deferred' })}: {idea.tradeoff}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared — section header
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Top-level component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cross-link banner → Red Cross Web QA Agent. The workshop teaches the
// human-vs-AI framing in the abstract; the Red Cross agent is where that
// framing gets applied to a real production site (rodekors.no / Enonic XP).
// Only renders when the host app threaded an `onNavigate(section)` callback.
// ---------------------------------------------------------------------------
function ApplyToRealSite({ t, onNavigate }) {
  if (typeof onNavigate !== 'function') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      padding: '14px 18px', borderRadius: 12,
      background: 'linear-gradient(135deg,#fef2f2,#fff1f2)',
      border: '1px solid #fecaca',
    }}>
      <span style={{ fontSize: 26, lineHeight: 1 }}>❤️‍🩹</span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 14 }}>
          {t('homoVsAi.crossLink.title', { defaultValue: 'Apply this to a real site' })}
        </div>
        <div style={{ fontSize: 12.5, color: '#7f1d1d', marginTop: 2 }}>
          {t('homoVsAi.crossLink.body', { defaultValue: 'See the same human-vs-AI split applied to a live production website in the Red Cross Web QA Agent.' })}
        </div>
      </div>
      <button
        onClick={() => onNavigate('red-cross-web-qa')}
        style={{
          padding: '9px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff',
          fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
        }}
      >
        {t('homoVsAi.crossLink.cta', { defaultValue: 'Open Red Cross Web QA Agent →' })}
      </button>
    </div>
  );
}

export default function HomoSapiensVsAI({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const [externalVote, setExternalVote] = useState(null);

  const onVote = useMemo(() => (payload) => {
    setExternalVote(payload);
  }, []);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <WorkshopHero t={t} />
      <ApplyToRealSite t={t} onNavigate={onNavigate} />
      <ActivityMatrix t={t} />
      <HeadToHeadDemos t={t} i18n={i18n} onVote={onVote} />
      <TrustFramework t={t} />
      <WorkshopScoreboard
        t={t}
        externalVote={externalVote}
        onClearExternal={() => setExternalVote(null)}
      />
      <SpeakerCribSheet t={t} />
      <PromptEvolutionPanel t={t} />
      <FeedbackLogExportPanel t={t} />
      <FutureImprovementsNote t={t} />
    </div>
  );
}
