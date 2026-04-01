// Incident Response Drills — scenario-based training
import React, { useState, useEffect } from 'react';

const API = '/api/cyber';

const CAT_ICONS = {
  ransomware: '💀', phishing: '🎣', data_breach: '🔓',
  ddos: '🌊', insider_threat: '🕵️', supply_chain: '📦',
};
const DIFF_COLORS = {
  beginner:     { bg: '#dcfce7', color: '#166534' },
  intermediate: { bg: '#fef9c3', color: '#854d0e' },
  advanced:     { bg: '#fee2e2', color: '#991b1b' },
};

export default function IncidentDrills() {
  const [scenarios, setScenarios] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [loading, setLoading] = useState(true);

  // Active drill state
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // History
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('scenarios'); // 'scenarios' | 'drill' | 'results' | 'history'

  useEffect(() => { loadScenarios(); }, []);

  async function loadScenarios() {
    setLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`${API}/drills/scenarios`),
        fetch(`${API}/drills/history/list`),
      ]);
      setScenarios(await sRes.json());
      setHistory(await hRes.json());
    } catch (e) {
      console.error('Failed to load drill scenarios', e);
    }
    setLoading(false);
  }

  async function startDrill(scenarioId) {
    try {
      const res = await fetch(`${API}/drills/start/${scenarioId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setCurrentStep(data.step);
        setFeedback(null);
        setChosen(null);
        setView('drill');
      }
    } catch (e) {
      console.error('Failed to start drill', e);
    }
  }

  async function submitAction() {
    if (!chosen || !session) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/drills/${session.id}/action?chosen_option=${chosen}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback);
        setSession(data.session);
        if (data.next_step) {
          // Store next step but don't show it yet — show feedback first
          setCurrentStep(data.next_step);
        } else {
          setCurrentStep(null);
        }
      }
    } catch (e) {
      console.error('Failed to submit action', e);
    }
    setSubmitting(false);
  }

  function proceedToNext() {
    setFeedback(null);
    setChosen(null);
    if (session?.completed) {
      setView('results');
      // Refresh history
      fetch(`${API}/drills/history/list`).then(r => r.json()).then(setHistory).catch(() => {});
    }
  }

  function filteredScenarios() {
    let list = scenarios;
    if (filterCat !== 'all') list = list.filter(s => s.category === filterCat);
    if (filterDiff !== 'all') list = list.filter(s => s.difficulty === filterDiff);
    return list;
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading drill scenarios…</div>;

  const categories = [...new Set(scenarios.map(s => s.category))];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'scenarios', label: 'Scenarios', icon: '🚨' },
          { id: 'drill', label: 'Active Drill', icon: '⚡', disabled: !session },
          { id: 'history', label: 'History', icon: '🕐' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            disabled={tab.disabled}
            style={{
              padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: tab.disabled ? 'default' : 'pointer',
              background: view === tab.id ? '#dc2626' : '#f3f4f6',
              color: view === tab.id ? 'white' : '#374151',
              fontWeight: '500', fontSize: '0.875rem',
              opacity: tab.disabled ? 0.5 : 1,
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── SCENARIOS ── */}
      {view === 'scenarios' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {filteredScenarios().map(sc => {
              const dc = DIFF_COLORS[sc.difficulty] || DIFF_COLORS.beginner;
              return (
                <div key={sc.id} style={{
                  background: 'white', borderRadius: '0.75rem', padding: '1.25rem',
                  border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem' }}>{CAT_ICONS[sc.category] || '🚨'}</span>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: '600', background: dc.bg, color: dc.color }}>
                      {sc.difficulty}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{sc.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, flex: 1 }}>{sc.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>⏱ ~{sc.estimated_minutes} min · {sc.steps_count} steps</span>
                    <button onClick={() => startDrill(sc.id)}
                      style={{ padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', background: '#dc2626', color: 'white', fontSize: '0.8rem', fontWeight: '500' }}>
                      Start Drill
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── ACTIVE DRILL ── */}
      {view === 'drill' && session && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{session.scenario_title}</h2>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Step {Math.min(session.current_step + (feedback ? 0 : 1), session.total_steps)} of {session.total_steps} · Score: {session.score}/{session.max_score}
              </span>
            </div>
            {/* Progress */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: session.total_steps }, (_, i) => {
                const action = session.actions[i];
                let bg = '#e5e7eb';
                if (action) bg = action.is_correct ? '#22c55e' : '#ef4444';
                else if (i === session.current_step && !feedback) bg = '#3b82f6';
                return <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: bg }} />;
              })}
            </div>
          </div>

          {/* Feedback panel */}
          {feedback && (
            <div style={{
              padding: '1.25rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
              background: feedback.is_correct ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${feedback.is_correct ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: feedback.is_correct ? '#166534' : '#991b1b', marginBottom: '0.5rem' }}>
                {feedback.is_correct ? '✅ Correct!' : `❌ Incorrect — Best answer: ${feedback.correct_option}`}
              </div>
              <p style={{ margin: 0, color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>{feedback.explanation}</p>
              <button onClick={proceedToNext}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '500' }}>
                {session.completed ? 'View Results' : 'Next Step →'}
              </button>
            </div>
          )}

          {/* Current step (only show when no feedback is displayed) */}
          {!feedback && currentStep && (
            <>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                {currentStep.title}
              </h3>
              <p style={{ color: '#374151', lineHeight: 1.6, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                {currentStep.situation}
              </p>

              {/* Options */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {currentStep.options.map(opt => (
                  <button key={opt.id} onClick={() => setChosen(opt.id)}
                    style={{
                      padding: '1rem', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer',
                      border: chosen === opt.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      background: chosen === opt.id ? '#eff6ff' : 'white',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: chosen === opt.id ? '#3b82f6' : '#f3f4f6',
                        color: chosen === opt.id ? 'white' : '#6b7280',
                        fontWeight: '700', fontSize: '0.8rem', flexShrink: 0,
                      }}>
                        {opt.id}
                      </span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{opt.label}</div>
                        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>{opt.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={submitAction} disabled={!chosen || submitting}
                style={{
                  marginTop: '1.25rem', padding: '0.6rem 1.5rem', background: chosen ? '#dc2626' : '#d1d5db',
                  color: 'white', border: 'none', borderRadius: '0.4rem', cursor: chosen ? 'pointer' : 'default',
                  fontWeight: '600', fontSize: '0.9rem',
                }}>
                {submitting ? 'Submitting…' : 'Submit Answer'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      {view === 'results' && session && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {session.score === session.max_score ? '🏆' : session.score >= session.max_score / 2 ? '👍' : '📚'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.25rem' }}>Drill Complete</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{session.scenario_title}</p>

          <div style={{
            display: 'inline-block', padding: '1.5rem 2.5rem', borderRadius: '1rem',
            background: session.score === session.max_score ? '#f0fdf4' : session.score >= session.max_score / 2 ? '#fffbeb' : '#fef2f2',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: session.score === session.max_score ? '#16a34a' : session.score >= session.max_score / 2 ? '#d97706' : '#dc2626' }}>
              {session.score} / {session.max_score}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>correct answers</div>
          </div>

          {/* Action review */}
          <div style={{ textAlign: 'left', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Step Review</h3>
            {session.actions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0',
                borderBottom: i < session.actions.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{a.is_correct ? '✅' : '❌'}</span>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>
                  Step {a.step + 1}: chose <strong>{a.chosen}</strong>
                  {!a.is_correct && <> (correct: <strong>{a.correct}</strong>)</>}
                </span>
              </div>
            ))}
          </div>

          <button onClick={() => { setSession(null); setView('scenarios'); }}
            style={{ marginTop: '1.5rem', padding: '0.6rem 1.25rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '500' }}>
            Back to Scenarios
          </button>
        </div>
      )}

      {/* ── HISTORY ── */}
      {view === 'history' && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>Drill History</h3>
          {history.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No completed drills yet. Start one from the Scenarios tab!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Scenario', 'Score', 'Date'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.5rem' }}>{h.scenario_title}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.8rem', fontWeight: '600',
                        background: h.score === h.max_score ? '#dcfce7' : h.score >= h.max_score / 2 ? '#fef9c3' : '#fee2e2',
                        color: h.score === h.max_score ? '#166534' : h.score >= h.max_score / 2 ? '#854d0e' : '#991b1b',
                      }}>
                        {h.score}/{h.max_score}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(h.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
