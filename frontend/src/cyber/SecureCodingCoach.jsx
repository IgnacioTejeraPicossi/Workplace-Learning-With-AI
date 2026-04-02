// Secure Coding Coach — topic browser, lesson generator, history
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = '/api/cyber';

const CATEGORY_ICONS = {
  injection: '💉', auth: '🔐', crypto: '🔑', config: '⚙️', monitoring: '📡', general: '📘',
};
const DIFF_COLORS = {
  beginner: { bg: '#dcfce7', color: '#166534' },
  intermediate: { bg: '#fef9c3', color: '#854d0e' },
  advanced: { bg: '#fee2e2', color: '#991b1b' },
};

export default function SecureCodingCoach() {
  const { t } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [history, setHistory] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [activeLesson, setActiveLesson] = useState(null);
  const [generating, setGenerating] = useState(null); // topic id
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('topics'); // 'topics' | 'lesson' | 'history'

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tRes, hRes] = await Promise.all([
        fetch(`${API}/coach/topics`),
        fetch(`${API}/coach/history`),
      ]);
      setTopics(await tRes.json());
      setHistory(await hRes.json());
    } catch (e) {
      console.error('Failed to load coach data', e);
    }
    setLoading(false);
  }

  async function generateLesson(topicId) {
    setGenerating(topicId);
    try {
      const res = await fetch(`${API}/coach/lesson/topic/${topicId}`, { method: 'POST' });
      if (res.ok) {
        const lesson = await res.json();
        setActiveLesson(lesson);
        setView('lesson');
        // Refresh history
        const hRes = await fetch(`${API}/coach/history`);
        setHistory(await hRes.json());
      }
    } catch (e) {
      console.error('Lesson generation failed', e);
    }
    setGenerating(null);
  }

  function filteredTopics() {
    let list = topics;
    if (filterCat !== 'all') list = list.filter(t => t.category === filterCat);
    if (filterDiff !== 'all') list = list.filter(t => t.difficulty === filterDiff);
    return list;
  }

  // Simple markdown-ish renderer (headings, bold, code blocks, lists)
  function renderMarkdown(md) {
    if (!md) return null;
    const lines = md.split('\n');
    const elements = [];
    let inCode = false;
    let codeLines = [];
    let codeLang = '';

    function flushCode() {
      if (codeLines.length) {
        elements.push(
          <pre key={`code-${elements.length}`} style={{
            background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '0.5rem',
            overflow: 'auto', fontSize: '0.82rem', lineHeight: 1.5, margin: '0.75rem 0',
          }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) {
        if (inCode) { flushCode(); inCode = false; }
        else { inCode = true; codeLang = line.slice(3).trim(); }
        continue;
      }
      if (inCode) { codeLines.push(line); continue; }

      if (line.startsWith('# ')) {
        elements.push(<h2 key={i} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', margin: '1rem 0 0.5rem' }}>{line.slice(2)}</h2>);
      } else if (line.startsWith('## ')) {
        elements.push(<h3 key={i} style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1f2937', margin: '1rem 0 0.4rem' }}>{line.slice(3)}</h3>);
      } else if (line.startsWith('### ')) {
        elements.push(<h4 key={i} style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', margin: '0.75rem 0 0.3rem' }}>{line.slice(4)}</h4>);
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(<div key={i} style={{ paddingLeft: '1.25rem', margin: '0.15rem 0', color: '#374151' }}>{renderInline(line)}</div>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<div key={i} style={{ paddingLeft: '1.25rem', margin: '0.15rem 0', color: '#374151' }}>• {renderInline(line.slice(2))}</div>);
      } else if (line.trim() === '') {
        elements.push(<div key={i} style={{ height: '0.5rem' }} />);
      } else {
        elements.push(<p key={i} style={{ margin: '0.25rem 0', color: '#374151', lineHeight: 1.6 }}>{renderInline(line)}</p>);
      }
    }
    flushCode();
    return elements;
  }

  function renderInline(text) {
    // Bold **text** and inline code `code`
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let last = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(<span key={idx++}>{text.slice(last, match.index)}</span>);
      if (match[2]) parts.push(<strong key={idx++}>{match[2]}</strong>);
      else if (match[3]) parts.push(<code key={idx++} style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: 3, fontSize: '0.82rem' }}>{match[3]}</code>);
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(<span key={idx}>{text.slice(last)}</span>);
    return parts.length ? parts : text;
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>{t('cyber.coach.loading')}</div>;

  const categories = [...new Set(topics.map(tp => tp.category))];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'topics', label: t('cyber.coach.topicCatalog'), icon: '📚' },
          { id: 'lesson', label: t('cyber.coach.currentLesson'), icon: '📝' },
          { id: 'history', label: t('cyber.coach.history'), icon: '🕐' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            disabled={tab.id === 'lesson' && !activeLesson}
            style={{
              padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              background: view === tab.id ? '#3b82f6' : '#f3f4f6',
              color: view === tab.id ? 'white' : '#374151',
              fontWeight: '500', fontSize: '0.875rem',
              opacity: tab.id === 'lesson' && !activeLesson ? 0.5 : 1,
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ---------- TOPIC CATALOG ---------- */}
      {view === 'topics' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <option value="all">{t('cyber.common.allCategories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <option value="all">{t('cyber.common.allDifficulties')}</option>
              <option value="beginner">{t('cyber.common.beginner')}</option>
              <option value="intermediate">{t('cyber.common.intermediate')}</option>
              <option value="advanced">{t('cyber.common.advanced')}</option>
            </select>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', alignSelf: 'center' }}>{filteredTopics().length} {t('cyber.coach.topics')}</span>
          </div>

          {/* Topic cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {filteredTopics().map(topic => {
              const dc = DIFF_COLORS[topic.difficulty] || DIFF_COLORS.beginner;
              const isGenerating = generating === topic.id;
              return (
                <div key={topic.id} style={{
                  background: 'white', borderRadius: '0.75rem', padding: '1.25rem',
                  border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem' }}>{CATEGORY_ICONS[topic.category] || '📘'}</span>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: '600',
                      background: dc.bg, color: dc.color,
                    }}>
                      {topic.difficulty}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{topic.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, flex: 1 }}>{topic.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>⏱ {topic.estimated_minutes} min</span>
                    <button onClick={() => generateLesson(topic.id)} disabled={isGenerating}
                      style={{
                        padding: '0.4rem 0.75rem', border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
                        background: isGenerating ? '#93c5fd' : '#3b82f6', color: 'white',
                        fontSize: '0.8rem', fontWeight: '500',
                      }}>
                      {isGenerating ? t('cyber.coach.generating') : t('cyber.coach.startLesson')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- LESSON VIEW ---------- */}
      {view === 'lesson' && activeLesson && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{activeLesson.title}</h2>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>⏱ {activeLesson.duration_minutes} min</span>
            </div>
            <button onClick={() => setView('topics')}
              style={{ padding: '0.4rem 0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              {t('cyber.coach.backToTopics')}
            </button>
          </div>
          <div style={{ lineHeight: 1.65 }}>
            {renderMarkdown(activeLesson.content)}
          </div>
          {activeLesson.references?.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>{t('cyber.coach.references')}</h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {activeLesson.references.map((r, i) => <li key={i} style={{ fontSize: '0.82rem', color: '#6b7280' }}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ---------- HISTORY ---------- */}
      {view === 'history' && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>{t('cyber.coach.lessonHistory')}</h3>
          {history.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>{t('cyber.coach.noLessons')}</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {[t('cyber.coach.topic'), t('cyber.common.title'), t('cyber.coach.duration'), t('cyber.coach.generatedAt')].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.5rem' }}><code style={{ fontSize: '0.8rem' }}>{h.topic_id}</code></td>
                    <td style={{ padding: '0.5rem' }}>{h.title}</td>
                    <td style={{ padding: '0.5rem' }}>{h.duration_minutes} min</td>
                    <td style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(h.generated_at).toLocaleString()}</td>
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
