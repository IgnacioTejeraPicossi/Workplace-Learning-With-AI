import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Chrome strings for the viewer itself, localized inline (kept out of the huge
// common.json). The DOCUMENT content is localized server-side by serving
// '<name>.<lang>.md' with English fallback — see backend /api/readme?lang=.
const toDocLang = (lng) => (String(lng || 'en').startsWith('es') ? 'es'
                          : String(lng || 'en').startsWith('no') ? 'no' : 'en');
const UI = {
  en: {
    title: 'README Viewer', search: 'Search headings or text…', clear: 'Clear search',
    hide: '⇤ Hide sections', show: '⇥ Show sections', sections: 'Sections',
    loading: 'Loading README…', copyLink: 'Copy link to section',
    fallback: 'This document is not translated yet — showing the English version.',
    noMatch: (q) => <>❕ No sections match <strong>&quot;{q}&quot;</strong>. Try a broader query, e.g. a single keyword.</>,
    found: (m, s) => <>🔍 Found <strong>{m}</strong> match{m !== 1 ? 'es' : ''} across <strong>{s}</strong> section{s !== 1 ? 's' : ''}. Whole sections shown so you can read them in context.</>,
  },
  no: {
    title: 'README-visning', search: 'Søk i overskrifter eller tekst…', clear: 'Tøm søk',
    hide: '⇤ Skjul seksjoner', show: '⇥ Vis seksjoner', sections: 'Seksjoner',
    loading: 'Laster README…', copyLink: 'Kopier lenke til seksjonen',
    fallback: 'Dette dokumentet er ikke oversatt ennå — viser den engelske versjonen.',
    noMatch: (q) => <>❕ Ingen seksjoner samsvarer med <strong>&quot;{q}&quot;</strong>. Prøv et bredere søk, f.eks. ett nøkkelord.</>,
    found: (m, s) => <>🔍 Fant <strong>{m}</strong> treff i <strong>{s}</strong> seksjon{s !== 1 ? 'er' : ''}. Hele seksjoner vises så du kan lese dem i kontekst.</>,
  },
  es: {
    title: 'Visor de README', search: 'Buscar en títulos o texto…', clear: 'Limpiar búsqueda',
    hide: '⇤ Ocultar secciones', show: '⇥ Mostrar secciones', sections: 'Secciones',
    loading: 'Cargando README…', copyLink: 'Copiar enlace a la sección',
    fallback: 'Este documento aún no está traducido — mostrando la versión en inglés.',
    noMatch: (q) => <>❕ Ninguna sección coincide con <strong>&quot;{q}&quot;</strong>. Prueba una búsqueda más amplia, p. ej. una sola palabra.</>,
    found: (m, s) => <>🔍 {m} coincidencia{m !== 1 ? 's' : ''} en <strong>{s}</strong> sección{s !== 1 ? 'es' : ''}. Se muestran secciones completas para leerlas en contexto.</>,
  },
};

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
// Block types: heading (section), paragraph, list, table, hr, code, mermaid,
// blockquote. Kept intentionally lightweight (no external markdown lib) but
// covers the constructs used across the repo docs so they render like GitHub.
const _isHr        = (t) => /^(-{3,}|\*{3,}|_{3,})$/.test(t);
const _isListItem  = (l) => /^\s*([-*+]|\d+\.)\s+/.test(l);
const _isTableSep  = (l) => l.includes('|') && l.includes('-') && /^\s*\|?[\s:|-]+\|?\s*$/.test(l);
const _splitRow    = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

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
    const trimmed = line.trim();

    // Fenced code block (``` or ```mermaid …)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim().toLowerCase();
      let j = i + 1;
      const code = [];
      while (j < lines.length && !lines[j].trim().startsWith('```')) { code.push(lines[j]); j++; }
      const content = code.join('\n');
      if (lang === 'mermaid') push({ type: 'mermaid', content, blobL: content.toLowerCase() });
      else push({ type: 'code', content, blobL: content.toLowerCase() });
      i = j + 1;
      continue;
    }

    // Heading
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) { open(m[1].length, m[2]); i++; continue; }

    // Horizontal rule
    if (_isHr(trimmed)) { push({ type: 'hr', blobL: '' }); i++; continue; }

    // Table (current row has a pipe AND the next line is a |---|---| separator)
    if (trimmed.includes('|') && i + 1 < lines.length && _isTableSep(lines[i + 1])) {
      const headers = _splitRow(line);
      let j = i + 2;
      const rows = [];
      while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
        rows.push(_splitRow(lines[j])); j++;
      }
      const blob = [headers.join(' '), ...rows.map(r => r.join(' '))].join(' ').toLowerCase();
      push({ type: 'table', headers, rows, blobL: blob });
      i = j;
      continue;
    }

    // List (bulleted or ordered) — including wrapped continuation lines
    if (_isListItem(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      let j = i;
      while (j < lines.length && lines[j].trim() !== '') {
        if (_isListItem(lines[j])) {
          const indent = (lines[j].match(/^\s*/)[0] || '').length;
          items.push({ text: lines[j].replace(/^\s*([-*+]|\d+\.)\s+/, ''), indent });
        } else if (/^\s+\S/.test(lines[j]) && items.length) {
          items[items.length - 1].text += ' ' + lines[j].trim();  // continuation
        } else {
          break;
        }
        j++;
      }
      push({ type: 'list', ordered, items, blobL: items.map(it => it.text).join(' ').toLowerCase() });
      i = j;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quote = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('>')) {
        quote.push(lines[j].trim().replace(/^>\s?/, '')); j++;
      }
      const text = quote.join(' ');
      push({ type: 'blockquote', text, blobL: text.toLowerCase() });
      i = j;
      continue;
    }

    // Paragraph — gather until a blank line OR the start of another block
    if (trimmed !== '') {
      const para = [];
      let j = i;
      while (
        j < lines.length && lines[j].trim() !== '' &&
        !_isListItem(lines[j]) &&
        !_isHr(lines[j].trim()) &&
        !/^(#{1,6})\s+/.test(lines[j]) &&
        !lines[j].trim().startsWith('```') &&
        !lines[j].trim().startsWith('>') &&
        !(lines[j].includes('|') && j + 1 < lines.length && _isTableSep(lines[j + 1]))
      ) { para.push(lines[j]); j++; }
      const text = para.join(' ');
      if (text.trim()) push({ type: 'paragraph', text, blobL: text.toLowerCase() });
      i = Math.max(j, i + 1);
      continue;
    }

    i++;
  }
  flush();
  return sections;
};

// ── Component ───────────────────────────────────────────────────────────────
export default function ReadmeViewer() {
  const { i18n } = useTranslation();
  const lang = toDocLang(i18n.language);
  const ui = UI[lang] || UI.en;
  const [markdown, setMarkdown] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [docPath, setDocPath] = useState('README.md');
  const [showToc, setShowToc] = useState(true);
  const [fallback, setFallback] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = docPath.startsWith('docs/')
          ? await fetch(`/api/docs/read?path=${encodeURIComponent(docPath)}&lang=${lang}`)
          : await fetch(`/api/readme?lang=${lang}`);
        const data = await res.json();
        if (data?.markdown) setMarkdown(data.markdown);
        // Show the "not translated yet" notice only when a non-English UI is
        // active AND the backend fell back to the English document.
        setFallback(lang !== 'en' && !!data?.fallback);
      } finally { setLoading(false); }
    };
    load();
  }, [docPath, lang]);

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

  // Inline markdown → HTML (bold / italic / inline-code / links), search-highlighted.
  const renderInline = (text) => highlight(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:0.9em;">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  const renderBlock = (b, idx) => {
    if (b.type === 'paragraph') {
      return (
        <div key={idx}
             style={{ lineHeight: 1.6, margin: '8px 0', color: '#1e293b', fontSize: 14 }}
             dangerouslySetInnerHTML={{ __html: renderInline(b.text) }} />
      );
    }
    if (b.type === 'list') {
      const Tag = b.ordered ? 'ol' : 'ul';
      return React.createElement(
        Tag,
        { key: idx, style: { margin: '8px 0', paddingLeft: 24, lineHeight: 1.6, color: '#1e293b', fontSize: 14 } },
        b.items.map((it, k) => (
          <li key={k}
              style={{ margin: '4px 0', marginLeft: it.indent > 1 ? 18 : 0 }}
              dangerouslySetInnerHTML={{ __html: renderInline(it.text) }} />
        ))
      );
    }
    if (b.type === 'hr') {
      return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '18px 0' }} />;
    }
    if (b.type === 'table') {
      return (
        <div key={idx} style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
            <thead>
              <tr>{b.headers.map((h, k) => (
                <th key={k}
                    style={{ border: '1px solid #e2e8f0', padding: '6px 10px', textAlign: 'left',
                             background: '#f8fafc', color: '#0f172a', fontWeight: 700 }}
                    dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
              ))}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, k) => (
                <tr key={k}>{r.map((c, ci) => (
                  <td key={ci}
                      style={{ border: '1px solid #e2e8f0', padding: '6px 10px', color: '#1e293b', verticalAlign: 'top' }}
                      dangerouslySetInnerHTML={{ __html: renderInline(c) }} />
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (b.type === 'code') {
      return (
        <pre key={idx} style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8,
                                overflowX: 'auto', fontSize: 12.5, lineHeight: 1.5, margin: '10px 0' }}>
          <code>{b.content}</code>
        </pre>
      );
    }
    if (b.type === 'blockquote') {
      return (
        <blockquote key={idx}
          style={{ borderLeft: '3px solid #cbd5e1', margin: '10px 0', padding: '6px 14px',
                   color: '#475569', fontStyle: 'italic', background: '#f8fafc', borderRadius: '0 6px 6px 0' }}
          dangerouslySetInnerHTML={{ __html: renderInline(b.text) }} />
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
        <h3 style={{ margin: 0 }}>{ui.title}</h3>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <input
            placeholder={ui.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 34px 10px 12px',
                     borderRadius: 8, border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              title={ui.clear}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                       border: 'none', background: 'transparent', cursor: 'pointer',
                       fontSize: 18, color: '#94a3b8', padding: '2px 8px' }}
            >×</button>
          )}
        </div>
        <select value={docPath} onChange={(e) => setDocPath(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <option value="README.md">README.md</option>
          <option value="docs/andres-robot-help.md">docs/andres-robot-help.md</option>
          <option value="docs/self-sim-reality-help.md">docs/self-sim-reality-help.md</option>
          <option value="docs/ai-study-buddy.md">docs/ai-study-buddy.md</option>
          <option value="docs/architecture.md">docs/architecture.md</option>
          <option value="docs/deployment.md">docs/deployment.md</option>
          <option value="docs/n8n.md">docs/n8n.md</option>
          <option value="docs/agents.md">docs/agents.md</option>
          <option value="docs/admin-dev.md">docs/admin-dev.md</option>
        </select>
        <button onClick={() => setShowToc(t => !t)} style={btnStyle} title={ui.sections}>
          {showToc ? ui.hide : ui.show}
        </button>
      </div>

      {/* Translation-fallback notice */}
      {fallback && (
        <div style={{
          marginBottom: 12, padding: '8px 14px', borderRadius: 8, fontSize: 12.5,
          background: '#fffbeb', border: '1px solid #fde68a', color: '#78350f',
        }}>
          🌐 {ui.fallback}
        </div>
      )}

      {/* Search summary */}
      {debouncedQuery && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: matchingSectionCount === 0 ? '#fef3c7' : '#eff6ff',
          border: `1px solid ${matchingSectionCount === 0 ? '#fcd34d' : '#bfdbfe'}`,
          color:  matchingSectionCount === 0 ? '#92400e' : '#1e40af',
        }}>
          {matchingSectionCount === 0 ? ui.noMatch(debouncedQuery) : ui.found(totalMatches, matchingSectionCount)}
        </div>
      )}

      {/* Content layout */}
      {loading ? (
        <div style={{ color: '#64748b' }}>{ui.loading}</div>
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
