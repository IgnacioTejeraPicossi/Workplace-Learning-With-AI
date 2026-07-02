import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * README Viewer — Section-aware markdown reader.
 *
 * Key design decision: search filters at the SECTION level, not the block
 * level. When a query matches anything inside a section (heading OR any
 * paragraph), the full section is rendered so the user reads it in context.
 * Previous flat-block filtering would show one matching line orphaned from
 * the surrounding explanation — see 2026-07-02 issue "Self-Simulating
 * Reality search returns one line".
 *
 * A section is defined as: a heading + every block that follows it until
 * the next heading of any level. Content before the first heading lives in
 * an implicit level-0 "top" section.
 */

// ── Mermaid renderer ────────────────────────────────────────────────────────
const MermaidBlock = ({ code }) => {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!window.mermaid) { setTimeout(render, 100); return; }
      if (ref.current) {
        try {
          if (!window.__mmdInit) {
            window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
            window.__mmdInit = true;
          }
          const id = `mmd-${Math.random().toString(36).slice(2)}`;
          const res = await window.mermaid.render(id, code, ref.current);
          if (!cancelled && ref.current) {
            if (res && res.svg) ref.current.innerHTML = res.svg;
          }
        } catch (e) {
          if (ref.current) ref.current.textContent = code;
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [code]);
  return <div ref={ref} />;
};

// ── Utilities ───────────────────────────────────────────────────────────────
const slugify = (s = '') =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Parser: markdown → sections[] ───────────────────────────────────────────
// Returns { id, level, headingText, blocks[], combinedBlobL }
const parseMarkdown = (md) => {
  const lines = md.split('\n');
  const sections = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    current.combinedBlobL = [
      current.headingText,
      ...current.blocks.map(b => b.blobL || ''),
    ].join(' ').toLowerCase();
    sections.push(current);
    current = null;
  };
  const open = (level, text) => {
    flush();
    current = {
      id: slugify(text) || `section-${sections.length + 1}`,
      level,
      headingText: text,
      blocks: [],
      combinedBlobL: '',
    };
  };
  const push = (block) => {
    if (!current) open(0, '__preamble__');
    current.blocks.push(block);
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```mermaid')) {
      let j = i + 1;
      const code = [];
      while (j < lines.length && !lines[j].startsWith('```')) { code.push(lines[j]); j++; }
      const content = code.join('\n');
      push({ type: 'mermaid', content, blobL: content.toLowerCase() });
      i = j + 1;
      continue;
    }
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) { open(m[1].length, m[2]); i++; continue; }
    if (line.trim() !== '') {
      let j = i;
      const para = [];
      while (j < lines.length && lines[j].trim() !== '') { para.push(lines[j]); j++; }
      const text = para.join(' ');
      push({ type: 'paragraph', text, blobL: text.toLowerCase() });
      i = j + 1;
      continue;
    }
    i++;
  }
  flush();
  return sections;
};

// ── Component ───────────────────────────────────────────────────────────────
export default function ReadmeViewer() {
  const [markdown, setMarkdown] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [docPath, setDocPath] = useState('README.md');
  const [showToc, setShowToc] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = docPath.startsWith('docs/')
          ? await fetch(`/api/docs/read?path=${encodeURIComponent(docPath)}`)
          : await fetch('/api/readme');
        const data = await res.json();
        if (data?.markdown) setMarkdown(data.markdown);
      } finally { setLoading(false); }
    };
    load();
  }, [docPath]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const allSections = useMemo(() => parseMarkdown(markdown), [markdown]);

  // Filter sections by query. Every section keeps a matchCount for the ToC.
  const { visible, totalMatches, matchingSectionCount } = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { visible: allSections, totalMatches: 0, matchingSectionCount: 0 };
    }
    const q = debouncedQuery.toLowerCase();
    const matched = [];
    let total = 0;
    for (const s of allSections) {
      if (!s.combinedBlobL.includes(q)) continue;
      let count = 0;
      if (s.headingText.toLowerCase().includes(q)) count++;
      for (const b of s.blocks) if ((b.blobL || '').includes(q)) count++;
      total += count;
      matched.push({ ...s, matchCount: count });
    }
    return { visible: matched, totalMatches: total, matchingSectionCount: matched.length };
  }, [allSections, debouncedQuery]);

  // Scroll to first matching section when the query changes.
  useEffect(() => {
    if (!debouncedQuery.trim() || visible.length === 0) return;
    const first = document.getElementById(visible[0].id);
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [debouncedQuery, visible, docPath]);

  const highlight = (s) => {
    if (!debouncedQuery.trim()) return s || '';
    const esc = debouncedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (s || '').replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
  };

  const handleLinkClick = (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (!/^https?:\/\//i.test(href)) {
      e.preventDefault();
      const next = href.startsWith('docs/') ? href : `docs/${href}`;
      setDocPath(next);
      setQuery('');
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderBlock = (b, idx) => {
    if (b.type === 'paragraph') {
      const html = highlight(b.text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:0.9em;">$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
      return (
        <div key={idx}
             style={{ lineHeight: 1.6, margin: '4px 0', color: '#1e293b', fontSize: 14 }}
             dangerouslySetInnerHTML={{ __html: html }} />
      );
    }
    if (b.type === 'mermaid') {
      if (debouncedQuery.trim()) {
        return (
          <div key={idx} style={{ fontStyle: 'italic', color: '#64748b', fontSize: 12 }}>
            [Diagram omitted in search results]
          </div>
        );
      }
      return (
        <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: 8, padding: 12, margin: '8px 0' }}>
          <MermaidBlock code={b.content} />
        </div>
      );
    }
    return null;
  };

  // ── UI atoms ───────────────────────────────────────────────────────────────
  const btnStyle = {
    border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6,
    padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#334155',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>📘</span>
        <h3 style={{ margin: 0 }}>README Viewer</h3>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <input
            placeholder="Search headings or text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 34px 10px 12px',
                     borderRadius: 8, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              title="Clear search"
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                       border: 'none', background: 'transparent', cursor: 'pointer',
                       fontSize: 18, color: '#94a3b8', padding: '2px 8px' }}
            >×</button>
          )}
        </div>
        <select value={docPath} onChange={(e) => setDocPath(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <option value="README.md">README.md</option>
          <option value="docs/architecture.md">docs/architecture.md</option>
          <option value="docs/deployment.md">docs/deployment.md</option>
          <option value="docs/n8n.md">docs/n8n.md</option>
          <option value="docs/agents.md">docs/agents.md</option>
          <option value="docs/admin-dev.md">docs/admin-dev.md</option>
        </select>
        <button onClick={() => setShowToc(t => !t)} style={btnStyle} title="Toggle table of contents">
          {showToc ? '⇤ Hide sections' : '⇥ Show sections'}
        </button>
      </div>

      {/* Search summary */}
      {debouncedQuery && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: matchingSectionCount === 0 ? '#fef3c7' : '#eff6ff',
          border: `1px solid ${matchingSectionCount === 0 ? '#fcd34d' : '#bfdbfe'}`,
          color:  matchingSectionCount === 0 ? '#92400e' : '#1e40af',
        }}>
          {matchingSectionCount === 0 ? (
            <>❕ No sections match <strong>&quot;{debouncedQuery}&quot;</strong>. Try a broader query, e.g. a single keyword.</>
          ) : (
            <>🔍 Found <strong>{totalMatches}</strong> match{totalMatches !== 1 ? 'es' : ''} across <strong>{matchingSectionCount}</strong> section{matchingSectionCount !== 1 ? 's' : ''}. Whole sections shown so you can read them in context.</>
          )}
        </div>
      )}

      {/* Content layout */}
      {loading ? (
        <div style={{ color: '#64748b' }}>Loading README…</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: showToc ? '260px 1fr' : '1fr',
          gap: 20, alignItems: 'flex-start',
        }}>
          {/* Table of contents */}
          {showToc && (
            <aside style={{
              position: 'sticky', top: 12,
              maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#475569',
                letterSpacing: 0.5, textTransform: 'uppercase',
                marginBottom: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>Sections</span>
                <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                  {visible.filter(s => s.level > 0).length}
                </span>
              </div>
              <div style={{ display: 'grid', gap: 2 }}>
                {visible.filter(s => s.level > 0 && s.level <= 3).map(s => {
                  const label = s.headingText.length > 42
                    ? s.headingText.slice(0, 42) + '…'
                    : s.headingText;
                  const hasMatch = (s.matchCount || 0) > 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        width: '100%', textAlign: 'left', border: 'none',
                        background: hasMatch ? '#eff6ff' : 'transparent',
                        padding: `5px 8px 5px ${(s.level - 1) * 10 + 8}px`,
                        fontSize: 12, color: hasMatch ? '#1e40af' : '#334155',
                        cursor: 'pointer', borderRadius: 4,
                        fontWeight: s.level === 1 ? 700 : (s.level === 2 ? 600 : 500),
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden',
                                     textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                      </span>
                      {hasMatch && (
                        <span style={{
                          fontSize: 10, background: '#3b82f6', color: 'white',
                          padding: '1px 6px', borderRadius: 999, fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {s.matchCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Main content */}
          <div ref={contentRef} onClick={handleLinkClick}
               style={{ display: 'grid', gap: 4, minWidth: 0 }}>
            {visible.map(s => {
              const hasMatch = (s.matchCount || 0) > 0;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  style={{
                    marginBottom: 24,
                    padding: hasMatch ? '10px 14px' : 0,
                    background: hasMatch ? '#fafbff' : 'transparent',
                    borderLeft: hasMatch ? '3px solid #7c3aed' : 'none',
                    borderRadius: hasMatch ? 6 : 0,
                    scrollMarginTop: 20,
                  }}
                >
                  {s.level > 0 && s.headingText !== '__preamble__' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {React.createElement(
                        `h${Math.min(s.level, 3)}`,
                        {
                          style: { margin: '10px 0 6px', flex: 1, color: '#0f172a' },
                          dangerouslySetInnerHTML: { __html: highlight(s.headingText) },
                        }
                      )}
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}#${s.id}`;
                          navigator.clipboard.writeText(url);
                        }}
                        title="Copy link to section"
                        style={{ ...btnStyle, padding: '4px 8px' }}
                      >🔗</button>
                    </div>
                  )}
                  {s.blocks.map(renderBlock)}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
