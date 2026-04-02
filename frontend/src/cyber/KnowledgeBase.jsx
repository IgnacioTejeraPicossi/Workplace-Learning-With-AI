// Knowledge Base — cybersecurity articles, search, and AI Q&A
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = '/api/cyber';

const CAT_ICONS = {
  fundamentals: '📐', frameworks: '🏗️', threats: '⚠️',
  best_practices: '✅', incident_response: '🚨', compliance: '📋',
};
const DIFF_COLORS = {
  beginner:     { bg: '#dcfce7', color: '#166534' },
  intermediate: { bg: '#fef9c3', color: '#854d0e' },
  advanced:     { bg: '#fee2e2', color: '#991b1b' },
};

export default function KnowledgeBase() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [search, setSearch] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  const [view, setView] = useState('articles'); // 'articles' | 'reader' | 'ask'

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch(`${API}/knowledge/articles`),
        fetch(`${API}/knowledge/categories`),
      ]);
      setArticles(await aRes.json());
      setCategories(await cRes.json());
    } catch (e) {
      console.error('Failed to load knowledge base', e);
    }
    setLoading(false);
  }

  async function openArticle(id) {
    try {
      const res = await fetch(`${API}/knowledge/articles/${id}`);
      if (res.ok) {
        setActiveArticle(await res.json());
        setView('reader');
      }
    } catch (e) {
      console.error('Failed to load article', e);
    }
  }

  async function askQuestion() {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await fetch(`${API}/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, max_paragraphs: 6 }),
      });
      if (res.ok) {
        setAnswer(await res.json());
      }
    } catch (e) {
      console.error('Failed to ask question', e);
    }
    setAsking(false);
  }

  function filteredArticles() {
    let list = articles;
    if (filterCat !== 'all') list = list.filter(a => a.category === filterCat);
    if (filterDiff !== 'all') list = list.filter(a => a.difficulty === filterDiff);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)));
    }
    return list;
  }

  // Simple markdown renderer (same as coach)
  function renderMarkdown(md) {
    if (!md) return null;
    const lines = md.split('\n');
    const elements = [];
    let inCode = false;
    let codeLines = [];

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
        if (inCode) { flushCode(); inCode = false; } else { inCode = true; }
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
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let last = 0, match, idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(<span key={idx++}>{text.slice(last, match.index)}</span>);
      if (match[2]) parts.push(<strong key={idx++}>{match[2]}</strong>);
      else if (match[3]) parts.push(<code key={idx++} style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: 3, fontSize: '0.82rem' }}>{match[3]}</code>);
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(<span key={idx}>{text.slice(last)}</span>);
    return parts.length ? parts : text;
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>{t('cyber.knowledge.loading')}</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'articles', label: t('cyber.knowledge.articles'), icon: '📚' },
          { id: 'reader', label: t('cyber.knowledge.reading'), icon: '📖', disabled: !activeArticle },
          { id: 'ask', label: t('cyber.knowledge.askQuestion'), icon: '💬' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            disabled={tab.disabled}
            style={{
              padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: tab.disabled ? 'default' : 'pointer',
              background: view === tab.id ? '#7c3aed' : '#f3f4f6',
              color: view === tab.id ? 'white' : '#374151',
              fontWeight: '500', fontSize: '0.875rem',
              opacity: tab.disabled ? 0.5 : 1,
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── ARTICLES ── */}
      {view === 'articles' && (
        <>
          {/* Category summary */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {categories.map(c => (
              <button key={c.category} onClick={() => setFilterCat(filterCat === c.category ? 'all' : c.category)}
                style={{
                  padding: '0.4rem 0.75rem', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  background: filterCat === c.category ? '#7c3aed' : '#f3f4f6',
                  color: filterCat === c.category ? 'white' : '#374151',
                  fontSize: '0.8rem', fontWeight: '500',
                }}>
                {CAT_ICONS[c.category] || '📄'} {c.category.replace('_', ' ')} ({c.count})
              </button>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input placeholder={t('cyber.common.search') + '...'} value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', minWidth: 200 }} />
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <option value="all">{t('cyber.knowledge.allLevels')}</option>
              <option value="beginner">{t('cyber.common.beginner')}</option>
              <option value="intermediate">{t('cyber.common.intermediate')}</option>
              <option value="advanced">{t('cyber.common.advanced')}</option>
            </select>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', alignSelf: 'center' }}>{filteredArticles().length} {t('cyber.knowledge.articleCount')}</span>
          </div>

          {/* Article cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredArticles().map(article => {
              const dc = DIFF_COLORS[article.difficulty] || DIFF_COLORS.beginner;
              return (
                <div key={article.id} onClick={() => openArticle(article.id)}
                  style={{
                    background: 'white', borderRadius: '0.75rem', padding: '1.25rem',
                    border: '1px solid #e5e7eb', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem' }}>{CAT_ICONS[article.category] || '📄'}</span>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: '600', background: dc.bg, color: dc.color }}>
                      {article.difficulty}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{article.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, flex: 1 }}>{article.summary}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>📖 {article.reading_minutes} min read</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{ padding: '0.1rem 0.4rem', borderRadius: 4, background: '#f3f4f6', fontSize: '0.65rem', color: '#6b7280' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── READER ── */}
      {view === 'reader' && activeArticle && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{CAT_ICONS[activeArticle.category] || '📄'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{activeArticle.category.replace('_', ' ')}</span>
                <span style={{
                  padding: '0.1rem 0.4rem', borderRadius: 9999, fontSize: '0.65rem', fontWeight: '600',
                  background: (DIFF_COLORS[activeArticle.difficulty] || DIFF_COLORS.beginner).bg,
                  color: (DIFF_COLORS[activeArticle.difficulty] || DIFF_COLORS.beginner).color,
                }}>{activeArticle.difficulty}</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{activeArticle.title}</h2>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>📖 {activeArticle.reading_minutes} min read</span>
            </div>
            <button onClick={() => setView('articles')}
              style={{ padding: '0.4rem 0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              {t('cyber.knowledge.backToArticles')}
            </button>
          </div>

          <div style={{ lineHeight: 1.65 }}>
            {renderMarkdown(activeArticle.content)}
          </div>

          {activeArticle.tags.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activeArticle.tags.map(tag => (
                <span key={tag} style={{ padding: '0.2rem 0.5rem', borderRadius: 4, background: '#f3f4f6', fontSize: '0.75rem', color: '#6b7280' }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ASK Q&A ── */}
      {view === 'ask' && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
              💬 {t('cyber.knowledge.askCyberQuestion')}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder={t('cyber.knowledge.askPlaceholder')}
                style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.9rem' }}
              />
              <button onClick={askQuestion} disabled={asking || !question.trim()}
                style={{
                  padding: '0.6rem 1rem', background: asking ? '#a78bfa' : '#7c3aed', color: 'white',
                  border: 'none', borderRadius: '0.5rem', cursor: question.trim() ? 'pointer' : 'default',
                  fontWeight: '500', fontSize: '0.875rem', whiteSpace: 'nowrap',
                }}>
                {asking ? t('cyber.knowledge.thinking') : t('cyber.knowledge.ask')}
              </button>
            </div>

            {/* Suggested questions */}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[t('cyber.knowledge.suggestedQuestions.phishing'), t('cyber.knowledge.suggestedQuestions.sqlInjection'), t('cyber.knowledge.suggestedQuestions.zeroTrust'), t('cyber.knowledge.suggestedQuestions.ciaTriad')].map(q => (
                <button key={q} onClick={() => { setQuestion(q); }}
                  style={{ padding: '0.3rem 0.6rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 9999, cursor: 'pointer', fontSize: '0.75rem', color: '#6b7280' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Answer */}
          {answer && (
            <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{t('cyber.knowledge.answer')}</h4>
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: '600',
                  background: answer.confidence >= 0.8 ? '#dcfce7' : answer.confidence >= 0.5 ? '#fef9c3' : '#fee2e2',
                  color: answer.confidence >= 0.8 ? '#166534' : answer.confidence >= 0.5 ? '#854d0e' : '#991b1b',
                }}>
                  {t('cyber.knowledge.confidence', { pct: Math.round(answer.confidence * 100) })}
                </span>
              </div>
              <p style={{ color: '#374151', lineHeight: 1.65, margin: '0 0 1rem' }}>{answer.answer}</p>
              {answer.sources.length > 0 && (
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280' }}>{t('cyber.knowledge.sources')}</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {answer.sources.map((s, i) => (
                      <span key={i} style={{ padding: '0.15rem 0.5rem', borderRadius: 4, background: '#f3f4f6', fontSize: '0.75rem', color: '#6b7280' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                {t('cyber.knowledge.responseTime', { time: answer.processing_time.toFixed(2) })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
