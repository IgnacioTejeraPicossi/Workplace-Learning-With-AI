import React, { useEffect, useMemo, useRef, useState } from 'react';

// Lightweight Markdown + Mermaid renderer
// Strategy: Use window.marked if available for better Markdown fidelity; render Mermaid fences via window.mermaid.

const MermaidBlock = ({ code }) => {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      // Wait until mermaid is available
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
            // res.svg may be string; mermaid also populates container when third arg provided
            if (res && res.svg) ref.current.innerHTML = res.svg;
          }
        } catch (e) {
          // fallback: show raw code
          if (ref.current) ref.current.textContent = code;
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [code]);
  return <div ref={ref} />;
};

const parseMarkdown = (md) => {
  const lines = md.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Mermaid fenced code
    if (line.trim().startsWith('```mermaid')) {
      let j = i + 1; const code = [];
      while (j < lines.length && !lines[j].startsWith('```')) { code.push(lines[j]); j++; }
      const content = code.join('\n');
      blocks.push({ type: 'mermaid', content, blobL: content.toLowerCase() });
      i = j + 1; continue;
    }
    // Headings
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) { const text = m[2]; blocks.push({ type: 'heading', level: m[1].length, text, blobL: text.toLowerCase() }); i++; continue; }
    // Paragraphs (collapse until blank)
    if (line.trim() !== '') {
      let j = i; const para = [];
      while (j < lines.length && lines[j].trim() !== '') { para.push(lines[j]); j++; }
      const text = para.join(' ');
      blocks.push({ type: 'paragraph', text, blobL: text.toLowerCase() });
      i = j + 1; continue;
    }
    i++;
  }
  return blocks;
};

export default function ReadmeViewer() {
  const [markdown, setMarkdown] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [docPath, setDocPath] = useState('README.md');
  const listRef = useRef(null);
  const [resultLimit, setResultLimit] = useState(200);

  useEffect(() => {
    const load = async () => {
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

  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return blocks;
    const q = debouncedQuery.toLowerCase();
    const out = [];
    for (let k=0; k<blocks.length; k++) {
      const b = blocks[k];
      if ((b.blobL || '').includes(q)) {
        out.push(b);
        if (out.length >= resultLimit) break;
      }
    }
    return out;
  }, [blocks, debouncedQuery]);

  // Scroll to first match automatically
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    const el = document.querySelector('[data-first-match="1"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filtered, debouncedQuery, docPath]);

  const slugify = (s='') => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const highlight = (s) => {
    if (!debouncedQuery.trim()) return s;
    const esc = debouncedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return s.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
  };

  // Debounce search input to keep UI smooth
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Intercept link clicks for internal navigation without app reload
  const handleLinkClick = (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (!/^https?:\/\//i.test(href)) {
      // relative link to another doc
      e.preventDefault();
      const next = href.startsWith('docs/') ? href : `docs/${href}`;
      setDocPath(next);
      setQuery('');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>📘</span>
        <h3 style={{ margin: 0 }}>README Viewer</h3>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input
          placeholder="Search headings or text..."
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <select value={docPath} onChange={(e)=>setDocPath(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <option value="README.md">README.md</option>
          <option value="docs/architecture.md">docs/architecture.md</option>
          <option value="docs/deployment.md">docs/deployment.md</option>
          <option value="docs/n8n.md">docs/n8n.md</option>
          <option value="docs/agents.md">docs/agents.md</option>
          <option value="docs/admin-dev.md">docs/admin-dev.md</option>
        </select>
        {debouncedQuery && filtered.length >= resultLimit && (
          <button onClick={()=>setResultLimit(l => l + 200)} style={{ border: '1px solid #e2e8f0', background:'#fff', borderRadius: 6, padding:'8px 12px' }}>Show more</button>
        )}
      </div>
      {loading ? (
        <div style={{ color: '#64748b' }}>Loading README...</div>
      ) : (
        <div ref={listRef} style={{ display: 'grid', gap: 12 }} onClick={handleLinkClick}>
          {filtered.map((b, idx) => {
            if (b.type === 'heading') {
              const Tag = `h${Math.min(b.level, 3)}`;
              const id = slugify(b.text);
              const isFirst = idx === 0 && query.trim();
              const html = highlight(b.text || '');
              return (
                <div key={idx} id={id} data-first-match={isFirst ? '1' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag style={{ margin: '12px 0 4px', flex: 1 }} dangerouslySetInnerHTML={{ __html: html }} />
                  <button onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#${id}`;
                    navigator.clipboard.writeText(url);
                  }} title="Copy link" style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6, padding: '4px 8px' }}>🔗</button>
                </div>
              );
            }
            if (b.type === 'paragraph') {
              const html = highlight((b.text||''))
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
              const isFirst = idx === 0 && query.trim();
              return <div key={idx} data-first-match={isFirst ? '1' : undefined} style={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: html }} />;
            }
            if (b.type === 'mermaid') {
              if (debouncedQuery.trim()) {
                // Evitar renders pesados durante la búsqueda
                return <div key={idx} style={{ fontStyle: 'italic', color: '#64748b' }}>[Diagram omitted in search results]</div>;
              }
              return <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <MermaidBlock code={b.content} />
              </div>;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}


