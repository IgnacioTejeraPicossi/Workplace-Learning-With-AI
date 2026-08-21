/**
 * GovernanceSection - Phase E Prompt-Evolution panel + Option A feedback-log
 * export panel for the Homo-vs-AI workshop page. Extracted verbatim from
 * HomoSapiensVsAI.jsx (P5 decomposition) - no behaviour change.
 */
import React, { useState, useEffect } from 'react';
import {
  proposePromptRevision, listPromptRevisions, approvePromptRevision,
  rejectPromptRevision, rollbackPromptRevision, runRegressionHarness,
  exportHomoVsAiFeedbackLog,
} from '../../../../api/agiApi';
import { SectionHeader } from './shared';

// ---------------------------------------------------------------------------
// Phase E — Prompt Evolution governance panel
// ---------------------------------------------------------------------------
//
// A standalone section rendered between the SpeakerCribSheet and the Future
// Improvements footer. Lists all prompt revisions (pending, active, rejected,
// superseded, refused) and exposes the four governance actions:
//   - Approve → marks the revision active, previous active becomes superseded
//   - Reject  → marks pending|refused revisions rejected
//   - Regression → runs the curated harness on this revision (base vs proposed)
//   - Rollback → re-activates a previously superseded revision (recovery path)
//
// The panel is intentionally compact — full diff viewers, audit log timelines,
// per-task version trees are deferred follow-ups. The MVP focuses on the live
// workshop demo flow: a human proposes → LLM proposes → human approves →
// future rounds run the new prompt.

export function PromptEvolutionPanel({ t }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState(''); // '' = all
  const [filterTask, setFilterTask] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [regressionResults, setRegressionResults] = useState({}); // revisionId → result
  const [expandedId, setExpandedId] = useState(null);

  const reload = async () => {
    setLoading(true); setError(null);
    try {
      const data = await listPromptRevisions({
        task: filterTask || undefined,
        status: filterStatus || undefined,
        limit: 100,
      });
      setRevisions(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Re-load whenever a filter changes. `reload` itself depends on the filters,
  // so adding it to the deps would cause a re-creation loop. Intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [filterStatus, filterTask]);

  const doAction = async (label, fn, revisionId) => {
    setBusyId(revisionId); setActionMsg(null);
    try {
      await fn();
      setActionMsg({ ok: true, text: `${label} ✓` });
      await reload();
    } catch (e) {
      setActionMsg({ ok: false, text: `${label}: ${e.message || e}` });
    } finally {
      setBusyId(null);
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleApprove = (id) =>
    doAction('Approve', () => approvePromptRevision(id, { approver: 'workshop-host' }), id);
  const handleReject = (id) => {
    const reason = window.prompt(t('homoVsAi.evolve.panel.rejectPrompt', {
      defaultValue: 'Why are you rejecting this revision? (optional)',
    }), '') || '';
    doAction('Reject', () => rejectPromptRevision(id, { reviewer: 'workshop-host', reason }), id);
  };
  const handleRollback = (id) => {
    const reason = window.prompt(t('homoVsAi.evolve.panel.rollbackPrompt', {
      defaultValue: 'Why rolling back? (optional, shows in audit log)',
    }), '') || '';
    doAction('Rollback', () => rollbackPromptRevision(id, { actor: 'workshop-host', reason }), id);
  };
  const handleRegression = async (id) => {
    setBusyId(id); setActionMsg(null);
    try {
      const res = await runRegressionHarness(id, { maxSamples: 3 });
      setRegressionResults((prev) => ({ ...prev, [id]: res }));
      setActionMsg({ ok: true, text: `Regression ✓ (${res.summary?.verdict || 'done'})` });
      await reload();
    } catch (e) {
      setActionMsg({ ok: false, text: `Regression: ${e.message || e}` });
    } finally {
      setBusyId(null);
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const STATUS_STYLES = {
    pending:    { bg: '#fefce8', fg: '#854d0e', border: '#fde047', label: 'PENDING' },
    active:     { bg: '#dcfce7', fg: '#15803d', border: '#86efac', label: 'ACTIVE' },
    rejected:   { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5', label: 'REJECTED' },
    superseded: { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1', label: 'SUPERSEDED' },
    refused:    { bg: '#fff7ed', fg: '#c2410c', border: '#fdba74', label: 'LLM REFUSED' },
  };

  const tasksInList = Array.from(new Set(revisions.map(r => r.task))).sort();

  return (
    <div>
      <SectionHeader
        num="07"
        title={t('homoVsAi.evolve.panel.title', { defaultValue: 'Prompt Evolution (governance)' })}
        lead={t('homoVsAi.evolve.panel.lead', {
          defaultValue: 'When the human writes critical feedback during a re-run, they can ask LLM #2 to propose a permanent revision to the task\'s base system prompt. Nothing changes until a human approves here. Approved revisions feed all future rounds; rollback is one click away. Audit log persists every action.',
        })}
      />
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
        borderTop: '4px solid #a16207', padding: 16,
      }}>
      {/* Filters + reload */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        marginBottom: 12, padding: 10, background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 8,
      }}>
        <label style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
          {t('homoVsAi.evolve.panel.filterStatus', { defaultValue: 'Status' })}:
        </label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}>
          <option value="">{t('homoVsAi.evolve.panel.all', { defaultValue: 'all' })}</option>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="rejected">rejected</option>
          <option value="superseded">superseded</option>
          <option value="refused">refused</option>
        </select>
        <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginLeft: 8 }}>
          {t('homoVsAi.evolve.panel.filterTask', { defaultValue: 'Task' })}:
        </label>
        <select value={filterTask} onChange={(e) => setFilterTask(e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}>
          <option value="">{t('homoVsAi.evolve.panel.all', { defaultValue: 'all' })}</option>
          {tasksInList.map((task) => <option key={task} value={task}>{task}</option>)}
        </select>
        <button onClick={reload}
                style={{
                  marginLeft: 'auto', fontSize: 12, padding: '4px 10px',
                  border: '1px solid #cbd5e1', borderRadius: 4, background: 'white',
                  cursor: 'pointer', fontWeight: 600, color: '#475569',
                }}>
          🔄 {t('homoVsAi.evolve.panel.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>

      {actionMsg && (
        <div style={{
          marginBottom: 10, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: actionMsg.ok ? '#dcfce7' : '#fee2e2',
          color: actionMsg.ok ? '#15803d' : '#b91c1c',
          border: `1px solid ${actionMsg.ok ? '#86efac' : '#fca5a5'}`,
        }}>{actionMsg.text}</div>
      )}

      {loading && <div style={{ fontSize: 12, color: '#64748b' }}>Loading…</div>}
      {error && (
        <div style={{ color: '#991b1b', fontSize: 12, background: '#fef2f2',
                     padding: 10, borderRadius: 8, border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}
      {!loading && !error && revisions.length === 0 && (
        <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', padding: 16,
                     background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          {t('homoVsAi.evolve.panel.empty', {
            defaultValue: 'No revisions yet. Write feedback under any AI answer above and click "Propose persistent revision" to create the first one.',
          })}
        </div>
      )}

      {revisions.map((r) => {
        const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
        const isExpanded = expandedId === r.revision_id;
        const reg = regressionResults[r.revision_id] || r.regression;
        return (
          <div key={r.revision_id} style={{
            marginBottom: 12, padding: 12, borderRadius: 10,
            background: 'white', border: `1px solid ${st.border}`,
            borderLeft: `4px solid ${st.border}`,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: st.bg, color: st.fg, border: `1px solid ${st.border}`, letterSpacing: 0.4,
              }}>{st.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{r.task}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>v{r.version}</span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                {(r.revision_id || '').slice(0, 8)}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                · {new Date(r.proposed_at).toLocaleString()}
              </span>
              {reg?.summary && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: reg.summary.verdict === 'no_regression' ? '#dcfce7'
                            : reg.summary.verdict === 'mixed' ? '#fef3c7' : '#fee2e2',
                  color: reg.summary.verdict === 'no_regression' ? '#15803d'
                       : reg.summary.verdict === 'mixed' ? '#854d0e' : '#b91c1c',
                  border: '1px solid',
                  borderColor: reg.summary.verdict === 'no_regression' ? '#86efac'
                              : reg.summary.verdict === 'mixed' ? '#fcd34d' : '#fca5a5',
                  letterSpacing: 0.4,
                }}>📊 {reg.summary.verdict}</span>
              )}
              <button onClick={() => setExpandedId(isExpanded ? null : r.revision_id)}
                      style={{
                        marginLeft: 'auto', fontSize: 11, padding: '3px 10px',
                        border: '1px solid #cbd5e1', borderRadius: 4, background: 'white',
                        cursor: 'pointer', fontWeight: 600, color: '#475569',
                      }}>
                {isExpanded
                  ? t('homoVsAi.evolve.panel.collapse', { defaultValue: 'Collapse' })
                  : t('homoVsAi.evolve.panel.expand', { defaultValue: 'Expand' })}
              </button>
            </div>

            {r.meta_llm_rationale && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                <strong>{t('homoVsAi.evolve.rationale', { defaultValue: 'Rationale' })}:</strong>{' '}
                {r.meta_llm_rationale}
              </div>
            )}
            {Array.isArray(r.risk_flags) && r.risk_flags.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 11 }}>
                {r.risk_flags.map((f, i) => (
                  <span key={i} style={{
                    marginRight: 4, padding: '1px 6px', background: '#fef3c7',
                    color: '#854d0e', border: '1px solid #fcd34d', borderRadius: 999,
                    fontWeight: 600,
                  }}>{f}</span>
                ))}
              </div>
            )}
            {r.refusal_reason && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#7c2d12', fontStyle: 'italic' }}>
                {r.refusal_reason}
              </div>
            )}
            {r.rejection_reason && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#7c2d12', fontStyle: 'italic' }}>
                {t('homoVsAi.evolve.panel.rejectedBecause', { defaultValue: 'Rejected because' })}: {r.rejection_reason}
              </div>
            )}

            {/* Action row */}
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {r.status === 'pending' && (
                <>
                  <button onClick={() => handleRegression(r.revision_id)} disabled={busyId === r.revision_id}
                          style={btnStyle('#475569', busyId === r.revision_id)}>
                    📊 {t('homoVsAi.evolve.panel.runRegression', { defaultValue: 'Run regression' })}
                  </button>
                  <button onClick={() => handleApprove(r.revision_id)} disabled={busyId === r.revision_id}
                          style={btnStyle('#15803d', busyId === r.revision_id)}>
                    ✅ {t('homoVsAi.evolve.panel.approve', { defaultValue: 'Approve' })}
                  </button>
                  <button onClick={() => handleReject(r.revision_id)} disabled={busyId === r.revision_id}
                          style={btnStyle('#b91c1c', busyId === r.revision_id)}>
                    ❌ {t('homoVsAi.evolve.panel.reject', { defaultValue: 'Reject' })}
                  </button>
                </>
              )}
              {r.status === 'refused' && (
                <button onClick={() => handleReject(r.revision_id)} disabled={busyId === r.revision_id}
                        style={btnStyle('#b91c1c', busyId === r.revision_id)}>
                  ❌ {t('homoVsAi.evolve.panel.archive', { defaultValue: 'Archive (reject)' })}
                </button>
              )}
              {(r.status === 'superseded' || r.status === 'rejected') && r.proposed_prompt && (
                <button onClick={() => handleRollback(r.revision_id)} disabled={busyId === r.revision_id}
                        style={btnStyle('#a16207', busyId === r.revision_id)}>
                  ⏪ {t('homoVsAi.evolve.panel.rollback', { defaultValue: 'Rollback (re-activate)' })}
                </button>
              )}
            </div>

            {/* Expanded view — base + proposed prompts side-by-side */}
            {isExpanded && (
              <div style={{ marginTop: 12, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <PromptBox label={t('homoVsAi.evolve.panel.basePrompt', { defaultValue: 'Base (current) prompt' })}
                           color="#94a3b8" text={r.base_prompt} />
                <PromptBox label={t('homoVsAi.evolve.panel.proposedPrompt', { defaultValue: 'Proposed prompt' })}
                           color={r.proposed_prompt ? '#a16207' : '#cbd5e1'}
                           text={r.proposed_prompt || '(no proposal — refusal record)'} />
                <PromptBox label={t('homoVsAi.evolve.panel.humanFeedback', { defaultValue: 'Human feedback' })}
                           color="#15803d" text={r.human_feedback} />
                <PromptBox label={t('homoVsAi.evolve.panel.previousAi', { defaultValue: 'Previous AI answer' })}
                           color="#1d4ed8" text={r.previous_ai_output} />
                {reg?.samples && reg.samples.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <RegressionView reg={reg} t={t} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

function btnStyle(color, disabled) {
  return {
    background: disabled ? '#e2e8f0' : color,
    color: disabled ? '#94a3b8' : 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: 0.3,
  };
}

function PromptBox({ label, color, text }) {
  return (
    <div style={{
      background: '#f8fafc', border: `1px solid ${color}`, borderRadius: 8, padding: 10,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color, letterSpacing: 0.4,
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <pre style={{
        margin: 0, fontSize: 11, fontFamily: 'monospace', color: '#0f172a',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 240, overflowY: 'auto',
      }}>{text || '(empty)'}</pre>
    </div>
  );
}

function RegressionView({ reg, t }) {
  const s = reg.summary || {};
  return (
    <div style={{
      padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
        📊 {t('homoVsAi.evolve.panel.regressionTitle', { defaultValue: 'Regression harness' })}
        {' '}<span style={{ color: '#64748b', fontWeight: 400 }}>
          · {s.samples_run} samples · verdict: {s.verdict}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
        Base: {s.base_pass} pass / {s.base_warn} warn / {s.base_fail} fail
        {' · '}Proposed: {s.proposed_pass} pass / {s.proposed_warn} warn / {s.proposed_fail} fail
      </div>
      <details>
        <summary style={{ fontSize: 11, cursor: 'pointer', color: '#475569' }}>
          {t('homoVsAi.evolve.panel.showSamples', { defaultValue: 'Show per-sample scores' })}
        </summary>
        <div style={{ marginTop: 6, fontSize: 11 }}>
          {(reg.samples || []).map((sample, i) => (
            <div key={i} style={{ marginBottom: 6, padding: 6, background: 'white', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <div style={{ fontFamily: 'monospace', color: '#64748b' }}>{sample.id}</div>
              <div style={{ color: '#475569', marginTop: 2 }}>
                <strong>Base:</strong> {sample.base_score?.verdict}
                {' · coverage '}{sample.base_score?.coverage}
                {sample.base_score?.missing?.length ? ` · missing: ${sample.base_score.missing.join(', ')}` : ''}
              </div>
              <div style={{ color: '#475569' }}>
                <strong>Proposed:</strong> {sample.proposed_score?.verdict}
                {' · coverage '}{sample.proposed_score?.coverage}
                {sample.proposed_score?.missing?.length ? ` · missing: ${sample.proposed_score.missing.join(', ')}` : ''}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer — Future improvements (parking lot)
// ---------------------------------------------------------------------------
//
// Deliberately rendered as a muted footnote, NOT a full section. The goal is
// to keep ideas visible for the next maintainer without creating UI noise
// during the live workshop. Each item carries enough context that whoever
// picks it up later doesn't have to re-run the design discussion from zero.

// ---------------------------------------------------------------------------
// Option A · Workshop feedback log — export panel (1.15.1) + Promote-to-
// revision bridge A→C (1.15.2, 2026-05-22)
// ---------------------------------------------------------------------------
//
// Two operations side by side:
//   1. JSON export of every captured feedback note (1.15.1).
//   2. Inline review list with per-row "Promote to revision" buttons that
//      close the bridge from Option A (log) to Option C (Phase E revision
//      proposal). 1.15.2 lets the host curate critiques in cold blood after
//      the live workshop ends.
//
// Surfaced near the bottom of the page so it does not compete with the live
// workshop flow but is one click away when the session ends.

export function FeedbackLogExportPanel({ t }) {
  // Export download state (1.15.1).
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [summary, setSummary] = useState(null); // { count, generatedAt, filename }
  // Inline review list state (1.15.2 bridge).
  const [entries, setEntries] = useState([]);     // Loaded from /export endpoint.
  const [loadingList, setLoadingList] = useState(false);
  const [listErr, setListErr] = useState(null);
  const [expanded, setExpanded] = useState(false);
  // Per-entry promote state — keyed by entry_id. Values:
  //   { state: 'idle' | 'promoting' | 'promoted' | 'error', revisionId?, error? }
  const [promoteState, setPromoteState] = useState({});

  // Load the entries list when the host expands the review section.
  const loadEntries = async () => {
    setLoadingList(true); setListErr(null);
    try {
      const data = await exportHomoVsAiFeedbackLog({ limit: 200 });
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setListErr(String(e.message || e));
    } finally {
      setLoadingList(false);
    }
  };

  const onToggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && entries.length === 0 && !loadingList) {
      loadEntries(); // Lazy first load.
    }
  };

  const onExport = async () => {
    setBusy(true); setErr(null);
    try {
      const data = await exportHomoVsAiFeedbackLog({ limit: 5000 });
      // Save as workshop-feedback-log-<UTC>.json. The host downloads this
      // and can hand it to whoever curates Option C revision proposals
      // post-workshop.
      const ts = (data.generated_at || new Date().toISOString()).replace(/[:.]/g, '-');
      const filename = `workshop-feedback-log-${ts}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSummary({
        count: data.count || 0,
        generatedAt: data.generated_at,
        filename,
      });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  // 1.15.2 — A→C bridge. For a log entry that has task + user_input +
  // previous_ai_output + text, we can replay it through Phase E's
  // proposePromptRevision without the host re-typing anything. The
  // resulting revision lands in the governance panel above (pending
  // approval), exactly as if it had been proposed live.
  const isPromotable = (entry) => Boolean(
    entry && entry.task && entry.text
    && entry.user_input && entry.user_input.trim()
    && entry.previous_ai_output && entry.previous_ai_output.trim()
  );

  const promoteEntry = async (entry) => {
    const id = entry.entry_id;
    setPromoteState(s => ({ ...s, [id]: { state: 'promoting' } }));
    try {
      const res = await proposePromptRevision({
        task: entry.task,
        userInput: entry.user_input,
        previousAiOutput: entry.previous_ai_output,
        humanFeedback: entry.text,
        actor: entry.actor || 'workshop-host',
      });
      setPromoteState(s => ({
        ...s,
        [id]: {
          state: 'promoted',
          revisionId: res?.revision_id || res?.revisionId || null,
        },
      }));
    } catch (e) {
      setPromoteState(s => ({
        ...s,
        [id]: { state: 'error', error: String(e.message || e) },
      }));
    }
  };

  return (
    <div style={{
      marginTop: 16,
      background: '#ecfdf5',
      border: '1px dashed #6ee7b7',
      borderRadius: 10,
      padding: '14px 18px',
      color: '#065f46',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#047857',
        textTransform: 'uppercase',
      }}>
        📝 {t('homoVsAi.feedbackLog.panelKicker', { defaultValue: 'Workshop feedback log' })}
      </div>
      <div style={{ fontSize: 12, marginTop: 4, color: '#047857' }}>
        {t('homoVsAi.feedbackLog.panelLead', {
          defaultValue: 'Download every feedback note captured during the workshop (manual saves + auto-logged re-runs + auto-logged proposal triggers). Useful for post-workshop analysis and as input to future revision proposals.',
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={onExport}
          disabled={busy}
          style={{
            background: busy ? '#a7f3d0' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy
            ? t('homoVsAi.feedbackLog.exporting', { defaultValue: 'Exporting…' })
            : t('homoVsAi.feedbackLog.exportBtn', { defaultValue: 'Export JSON' })}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          style={{
            background: 'white',
            color: '#047857',
            border: '1px solid #6ee7b7',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title={t('homoVsAi.feedbackLog.reviewTooltip', {
            defaultValue: 'Review captured notes and (optionally) promote any of them into a Phase E revision proposal.',
          })}
        >
          {expanded
            ? `▾ ${t('homoVsAi.feedbackLog.hideReview', { defaultValue: 'Hide review list' })}`
            : `▸ ${t('homoVsAi.feedbackLog.showReview', { defaultValue: 'Review & promote entries' })}`}
        </button>
        {summary && (
          <span style={{
            fontSize: 12, color: '#047857',
            background: 'white', border: '1px solid #6ee7b7',
            padding: '4px 10px', borderRadius: 999,
          }}>
            ✓ {t('homoVsAi.feedbackLog.exportedCount', {
                  count: summary.count,
                  defaultValue: '{{count}} entries exported',
                })}
            {' · '}<code style={{ fontSize: 11 }}>{summary.filename}</code>
          </span>
        )}
        {err && (
          <span style={{
            fontSize: 12, color: '#b91c1c',
            background: '#fef2f2', border: '1px solid #fecaca',
            padding: '4px 10px', borderRadius: 999,
          }}>
            ⚠ {err}
          </span>
        )}
      </div>

      {/* 1.15.2 — Inline review list with Promote buttons. */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {loadingList && (
            <div style={{ fontSize: 12, color: '#047857' }}>
              {t('homoVsAi.feedbackLog.loadingList', { defaultValue: 'Loading entries…' })}
            </div>
          )}
          {listErr && (
            <div style={{
              fontSize: 12, color: '#b91c1c',
              background: '#fef2f2', border: '1px solid #fecaca',
              padding: '6px 10px', borderRadius: 6,
            }}>
              ⚠ {listErr}
            </div>
          )}
          {!loadingList && !listErr && entries.length === 0 && (
            <div style={{ fontSize: 12, color: '#047857', fontStyle: 'italic' }}>
              {t('homoVsAi.feedbackLog.emptyList', {
                defaultValue: 'No feedback notes captured yet. They will appear here once the host saves notes or re-runs with feedback.',
              })}
            </div>
          )}
          {entries.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {entries.slice(0, 50).map(entry => {
                const promotable = isPromotable(entry);
                const ps = promoteState[entry.entry_id] || { state: 'idle' };
                return (
                  <div key={entry.entry_id} style={{
                    background: 'white',
                    border: '1px solid #d1fae5',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 11, color: '#065f46' }}>{entry.task}</code>
                      <span style={{
                        fontSize: 10, color: '#047857',
                        background: '#d1fae5', border: '1px solid #6ee7b7',
                        padding: '1px 6px', borderRadius: 999,
                      }}>{entry.context}</span>
                      <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                        {entry.timestamp}
                      </span>
                      <span style={{ flex: 1 }} />
                      {promotable ? (
                        ps.state === 'promoted' ? (
                          <span style={{
                            fontSize: 11, color: '#15803d', fontWeight: 600,
                            background: '#dcfce7', border: '1px solid #86efac',
                            padding: '3px 8px', borderRadius: 999,
                          }} title={ps.revisionId || ''}>
                            ✓ {t('homoVsAi.feedbackLog.promoted', { defaultValue: 'Promoted (pending approval)' })}
                          </span>
                        ) : ps.state === 'error' ? (
                          <span style={{
                            fontSize: 11, color: '#b91c1c',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            padding: '3px 8px', borderRadius: 999,
                          }} title={ps.error}>
                            ⚠ {t('homoVsAi.feedbackLog.promoteError', { defaultValue: 'Promote failed' })}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promoteEntry(entry)}
                            disabled={ps.state === 'promoting'}
                            title={t('homoVsAi.feedbackLog.promoteTooltip', {
                              defaultValue: 'Promote this captured note to a Phase E revision proposal. The proposed prompt diff will appear in the governance panel above for human approval.',
                            })}
                            style={{
                              background: ps.state === 'promoting' ? '#fef3c7' : '#a16207',
                              color: 'white',
                              border: '1px solid #ca8a04',
                              padding: '4px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: ps.state === 'promoting' ? 'wait' : 'pointer',
                            }}
                          >
                            🧬 {ps.state === 'promoting'
                                  ? t('homoVsAi.feedbackLog.promoting', { defaultValue: 'Promoting…' })
                                  : t('homoVsAi.feedbackLog.promoteBtn', { defaultValue: 'Promote to revision' })}
                          </button>
                        )
                      ) : (
                        <span style={{
                          fontSize: 10, color: '#92400e',
                          background: '#fef3c7', border: '1px solid #fcd34d',
                          padding: '2px 8px', borderRadius: 999,
                        }} title={t('homoVsAi.feedbackLog.notPromotableTooltip', {
                          defaultValue: 'Missing user_input or previous_ai_output — Phase E needs both. This entry was captured before 1.15.2 OR via a code path that didn\'t pass them.',
                        })}>
                          ⊘ {t('homoVsAi.feedbackLog.notPromotable', { defaultValue: 'Not promotable' })}
                        </span>
                      )}
                    </div>
                    <div style={{
                      marginTop: 4, color: '#0f172a', whiteSpace: 'pre-wrap',
                      borderLeft: '3px solid #6ee7b7', paddingLeft: 8,
                    }}>
                      {entry.text}
                    </div>
                  </div>
                );
              })}
              {entries.length > 50 && (
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                  {t('homoVsAi.feedbackLog.truncated', {
                    count: entries.length,
                    defaultValue: 'Showing 50 of {{count}} entries. Export JSON for the full list.',
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
