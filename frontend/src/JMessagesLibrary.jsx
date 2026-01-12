import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';

export default function JMessagesLibrary() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tocOpen, setTocOpen] = useState({});
  const [editing, setEditing] = useState({});
  const [editContent, setEditContent] = useState({});
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const resp = await fetchWithAuth('/api/j-messages/list');
      const data = await resp.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError(t('jMessages.library.failedToLoad'));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allStatuses = Array.from(new Set(items.map((i) => i.status).filter(Boolean))).sort();
  
  // Predefined category values from Fiskeridirektoratet (only 3 allowed)
  const predefinedCategories = [
    "Annet",
    "Bunnfisk",
    "Pelagisk fisk"
  ];
  
  // Predefined area values from Fiskeridirektoratet
  const predefinedAreas = [
    "Andre lands soner",
    "Internasjonal farvann",
    "Nord for 62\u00B0 N",
    "Sør for 62\u00B0 N"
  ];

  const filtered = items.filter((it) => {
    const hay = `${it.j_id || ''} ${it.title || ''} ${it.categories?.join(' ') || ''}`.toLowerCase();
    const qOk = hay.includes(query.toLowerCase());
    const sOk = statusFilter === 'all' || (it.status || '') === statusFilter;
    const cOk = categoryFilter === 'all' || (Array.isArray(it.categories) && it.categories.includes(categoryFilter));
    return qOk && sOk && cOk;
  });

  const startEditing = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditContent(prev => ({
        ...prev,
        [itemId]: {
          title: item.title || '',
          j_id: item.j_id || '',
          status: item.status || '',
          valid_from: item.valid_from || '',
          valid_to: item.valid_to || '',
          replaces: item.replaces || '',
          category: item.category || (Array.isArray(item.categories) && item.categories.length > 0 ? item.categories[0] : ''),
          area: Array.isArray(item.area) ? [...item.area] : (item.area ? [item.area] : []),
          summary: item.summary || '',
          body_html: item.body_html || '',
          raw_text: item.raw_text || ''
        }
      }));
      setEditing(prev => ({
        ...prev,
        [itemId]: true
      }));
    }
  };

  const handleEditChange = (itemId, field, value) => {
    setEditContent(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleEditSave = async (itemId) => {
    try {
      const content = editContent[itemId];
      if (!content) return;

      const resp = await fetchWithAuth(`/api/j-messages/update/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });

      const data = await resp.json();
      if (data.success) {
        // Update local state
        setItems((prev) => prev.map(item =>
          item.id === itemId
            ? { ...item, ...content }
            : item
        ));
        setEditing(prev => ({
          ...prev,
          [itemId]: false
        }));
        setStatus(t('jMessages.library.documentUpdated'));
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(t('jMessages.library.updateFailed'));
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (e) {
      setStatus(`${t('jMessages.library.updateFailed')}: ${String(e)}`);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleEditCancel = (itemId) => {
    setEditing(prev => {
      const newEditing = { ...prev };
      delete newEditing[itemId];
      return newEditing;
    });
    setEditContent(prev => {
      const newContent = { ...prev };
      delete newContent[itemId];
      return newContent;
    });
  };

  const deleteItem = async (id) => {
    if (!window.confirm(t('jMessages.library.deleteConfirm'))) return;
    try {
      const resp = await fetchWithAuth(`/api/j-messages/delete/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        // Clear editing state if item was being edited
        setEditing(prev => {
          const newEditing = { ...prev };
          delete newEditing[id];
          return newEditing;
        });
        setEditContent(prev => {
          const newContent = { ...prev };
          delete newContent[id];
          return newContent;
        });
      } else {
        alert(t('jMessages.library.deleteFailed'));
      }
    } catch (e) {
      alert(`${t('jMessages.library.deleteFailed')}: ${String(e)}`);
    }
  };

  const exportMarkdown = (it) => {
    const lines = [];
    if (it.title) lines.push(`# ${it.title}`);
    const meta = [
      it.j_id ? `ID: ${it.j_id}` : null,
      it.status ? `Status: ${it.status}` : null,
      it.valid_from ? `Valid from: ${it.valid_from}` : null,
      it.valid_to ? `Valid to: ${it.valid_to}` : null,
      it.replaces ? `Replaces: ${it.replaces}` : null,
      (it.category || (Array.isArray(it.categories) && it.categories.length > 0)) ? `Category: ${it.category || (Array.isArray(it.categories) ? it.categories[0] : '')}` : null,
      (Array.isArray(it.area) && it.area.length > 0) ? `Area: ${it.area.join(', ')}` : (it.area && !Array.isArray(it.area) ? `Area: ${it.area}` : null)
    ].filter(Boolean);
    if (meta.length) {
      lines.push('', meta.map(m => `- ${m}`).join('\n'), '');
    }
    if (it.summary) {
      lines.push('## Executive Summary', '', it.summary, '');
    }
    if (Array.isArray(it.toc) && it.toc.length) {
      lines.push('## Innhold');
      const renderToc = (items, lvl = 0) => {
        items.forEach(x => {
          lines.push(`${'  '.repeat(lvl)}- ${x.title}`);
          if (x.children) renderToc(x.children, lvl + 1);
        });
      };
      renderToc(it.toc);
      lines.push('');
    }
    // Fallback: use raw_text for markdown body (safer than HTML)
    if (it.raw_text) {
      lines.push('---', '', it.raw_text);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(it.j_id || 'j-message').replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPDF = (it) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const title = it.title || (it.j_id || 'J-message');
    const meta = `
      <div style="margin-bottom:8px;color:#555;font-size:12px">
        ${it.j_id ? `<div><strong>ID:</strong> ${it.j_id}</div>` : ''}
        ${it.status ? `<div><strong>Status:</strong> ${it.status}</div>` : ''}
        ${it.valid_from ? `<div><strong>Valid from:</strong> ${it.valid_from}</div>` : ''}
        ${it.valid_to ? `<div><strong>Valid to:</strong> ${it.valid_to}</div>` : ''}
        ${it.replaces ? `<div><strong>Replaces:</strong> ${it.replaces}</div>` : ''}
        ${(it.category || (Array.isArray(it.categories) && it.categories.length > 0)) ? `<div><strong>Category:</strong> ${it.category || (Array.isArray(it.categories) ? it.categories[0] : '')}</div>` : ''}
        ${(Array.isArray(it.area) && it.area.length > 0) ? `<div><strong>Area:</strong> ${it.area.join(', ')}</div>` : (it.area && !Array.isArray(it.area) ? `<div><strong>Area:</strong> ${it.area}</div>` : '')}
      </div>`;
    const summary = it.summary ? `<h2>Executive Summary</h2><div>${it.summary.replace(/\n/g, '<br/>')}</div>` : '';
    const html = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1,h2,h3 { color: #111; }
            .toc ul { margin: 0 0 8px 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${meta}
          ${summary}
          <hr/>
          ${it.body_html || ''}
          <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
        </body>
      </html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: colors.primary, marginBottom: 8 }}>📚 {t('jMessages.library.title')}</h1>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          {t('jMessages.library.description')}
        </p>
      </div>

      <div style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('jMessages.library.searchPlaceholder')}
          style={{
            flex: 1,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            background: colors.background,
            color: colors.text
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            background: colors.background,
            color: colors.text
          }}
        >
          <option value="all">{t('jMessages.library.allStatuses')}</option>
          {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            background: colors.background,
            color: colors.text
          }}
        >
          <option value="all">{t('jMessages.library.allCategories')}</option>
          {predefinedCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={load}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          {t('jMessages.library.refresh')}
        </button>
      </div>

      {loading && <div>{t('jMessages.library.loading')}</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {status && (
        <div style={{
          padding: '12px',
          borderRadius: 8,
          marginBottom: 16,
          background: status.includes('✅') ? '#d1fae5' : '#fee2e2',
          color: status.includes('✅') ? '#065f46' : '#991b1b',
          border: `1px solid ${status.includes('✅') ? '#10b981' : '#dc2626'}`
        }}>
          {status}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((it) => (
          <div key={it.id} style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 400px)' }}>
                {editing[it.id] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                        {t('jMessages.library.metadata.title')}
                      </label>
                      <input
                        value={editContent[it.id]?.title || ''}
                        onChange={(e) => handleEditChange(it.id, 'title', e.target.value)}
                        placeholder={t('jMessages.library.metadata.title')}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          background: colors.background,
                          color: colors.text,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                          {t('jMessages.library.metadata.id')}
                        </label>
                        <input
                          value={editContent[it.id]?.j_id || ''}
                          onChange={(e) => handleEditChange(it.id, 'j_id', e.target.value)}
                          placeholder="J-XXX-YYYY"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            background: colors.background,
                            color: colors.text,
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                          {t('jMessages.library.metadata.status')}
                        </label>
                        <select
                          value={editContent[it.id]?.status || ''}
                          onChange={(e) => handleEditChange(it.id, 'status', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            background: colors.background,
                            color: colors.text,
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">{t('jMessages.library.selectStatus')}</option>
                          {allStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                          {t('jMessages.library.metadata.validFrom')}
                        </label>
                        <input
                          type="date"
                          value={editContent[it.id]?.valid_from || ''}
                          onChange={(e) => handleEditChange(it.id, 'valid_from', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            background: colors.background,
                            color: colors.text,
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                          {t('jMessages.library.metadata.validTo')}
                        </label>
                        <input
                          type="date"
                          value={editContent[it.id]?.valid_to || ''}
                          onChange={(e) => handleEditChange(it.id, 'valid_to', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            background: colors.background,
                            color: colors.text,
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                          {t('jMessages.library.metadata.replaces')}
                        </label>
                        <input
                          value={editContent[it.id]?.replaces || ''}
                          onChange={(e) => handleEditChange(it.id, 'replaces', e.target.value)}
                          placeholder="J-XXX-YYYY"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            background: colors.background,
                            color: colors.text,
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                          {t('jMessages.library.metadata.category')}
                        </label>
                        <select
                          value={editContent[it.id]?.category || ''}
                          onChange={(e) => {
                            handleEditChange(it.id, 'category', e.target.value);
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            background: colors.background,
                            color: colors.text,
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">{t('jMessages.library.selectCategory')}</option>
                          {predefinedCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}> {/* Increased gap */}
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 8 }}>
                          {t('jMessages.library.metadata.area')}
                        </label>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          background: colors.background
                        }}>
                          {predefinedAreas.map((area) => {
                            const currentAreas = Array.isArray(editContent[it.id]?.area) ? editContent[it.id].area : [];
                            const isChecked = currentAreas.includes(area);
                            return (
                              <label
                                key={area}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  color: colors.text
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentAreas = Array.isArray(editContent[it.id]?.area) ? editContent[it.id].area : [];
                                    let newAreas;
                                    if (e.target.checked) {
                                      newAreas = [...currentAreas, area];
                                    } else {
                                      newAreas = currentAreas.filter(a => a !== area);
                                    }
                                    handleEditChange(it.id, 'area', newAreas);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    width: 16,
                                    height: 16
                                  }}
                                />
                                <span>{area}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {it.title && (
                      <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.primary, fontWeight: 600 }}>
                        {it.title}
                      </h3>
                    )}
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div><strong>{t('jMessages.library.metadata.id')}:</strong> {it.j_id || '—'}</div>
                      <div><strong>{t('jMessages.library.metadata.status')}:</strong> {it.status || '—'}</div>
                      <div><strong>{t('jMessages.library.metadata.validFrom')}:</strong> {it.valid_from || '—'}</div>
                      <div><strong>{t('jMessages.library.metadata.validTo')}:</strong> {it.valid_to || '—'}</div>
                      <div><strong>{t('jMessages.library.metadata.replaces')}:</strong> {it.replaces || '—'}</div>
                    </div>
                    {(it.category || (Array.isArray(it.categories) && it.categories.length > 0)) && (
                      <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <strong>{t('jMessages.library.metadata.category')}:</strong>{' '}
                        {it.category || (Array.isArray(it.categories) ? it.categories[0] : '—')}
                      </div>
                    )}
                    {(Array.isArray(it.area) && it.area.length > 0) || (it.area && !Array.isArray(it.area)) ? (
                      <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <strong>{t('jMessages.library.metadata.area')}:</strong>{' '}
                        {Array.isArray(it.area) ? it.area.join(', ') : it.area}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch', minWidth: '380px', flexShrink: 0 }}>
                {/* Edit/Manage buttons row (Save/Cancel or Expand/Edit/Delete) */}
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  {editing[it.id] ? (
                    <>
                      <button
                        onClick={() => handleEditSave(it.id)}
                        style={{
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          flex: 1,
                          textAlign: 'center'
                        }}
                      >
                        💾 {t('jMessages.library.save')}
                      </button>
                      <button
                        onClick={() => handleEditCancel(it.id)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: colors.text,
                          flex: 1,
                          textAlign: 'center'
                        }}
                      >
                        ❌ {t('jMessages.library.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setExpanded((e) => {
                            const next = !e[it.id];
                            // Open TOC by default when expanding
                            if (next) setTocOpen((s) => ({ ...s, [it.id]: true }));
                            return { ...e, [it.id]: next };
                          });
                        }}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          flex: 1,
                          textAlign: 'center'
                        }}
                      >
                        {expanded[it.id] ? t('jMessages.library.collapse') : t('jMessages.library.expand')}
                      </button>
                      <button
                        onClick={() => startEditing(it.id)}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          flex: 1,
                          textAlign: 'center'
                        }}
                      >
                        ✏️ {t('jMessages.library.edit')}
                      </button>
                      <button
                        onClick={() => deleteItem(it.id)}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          flex: 1,
                          textAlign: 'center'
                        }}
                      >
                        {t('jMessages.library.delete')}
                      </button>
                    </>
                  )}
                </div>
                {/* Export buttons row */}
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button
                    onClick={async () => {
                      try {
                        const resp = await fetchWithAuth('/api/j-messages/export-docx', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(it)
                        });
                        if (!resp.ok) {
                          const txt = await resp.text();
                          throw new Error(`${resp.status} ${txt}`);
                        }
                        const blob = await resp.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(it.j_id || 'j-message').replace(/\s+/g, '_')}.docx`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        alert(`${t('jMessages.library.exportFailed')}: ${String(e)}`);
                      }
                    }}
                    style={{
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center'
                    }}
                  >
                    {t('jMessages.library.exportDOCX')}
                  </button>
                  <button
                    onClick={() => exportMarkdown(it)}
                    style={{
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center'
                    }}
                  >
                    {t('jMessages.library.exportMD')}
                  </button>
                  <button
                    onClick={() => exportPDF(it)}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center'
                    }}
                  >
                    {t('jMessages.library.exportPDF')}
                  </button>
                </div>
              </div>
            </div>
            {expanded[it.id] && (
              <div style={{ marginTop: 12 }}>
                {/* TOC toggle + panel */}
                {Array.isArray(it.toc) && it.toc.length > 0 && (
                  <div style={{
                    background: colors.cardBackground,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    marginBottom: 10
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: `1px solid ${colors.border}`
                    }}>
                      <strong>{t('jMessages.analyzer.innhold')}</strong>
                      <button
                        onClick={() => setTocOpen((s) => ({ ...s, [it.id]: !s[it.id] }))}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                        aria-expanded={!!tocOpen[it.id]}
                      >
                        {tocOpen[it.id] ? '−' : '+'}
                      </button>
                    </div>
                    {tocOpen[it.id] && (
                      <nav style={{ padding: 12 }}>
                        {it.toc.map((t, idx) => (
                          <div key={`${t.anchor}-${idx}`} style={{ marginBottom: 6 }}>
                            <button
                              onClick={() => {
                                const el = document.getElementById(t.anchor);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: colors.primary,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              {t.title}
                            </button>
                            {Array.isArray(t.children) && t.children.length > 0 && (
                              <ul style={{ marginTop: 4, marginLeft: 18 }}>
                                {t.children.map((c, cidx) => (
                                  <li key={`${c.anchor}-${cidx}-${t.anchor}`} style={{ marginBottom: 4 }}>
                                    <button
                                      onClick={() => {
                                        const el = document.getElementById(c.anchor);
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: colors.primary,
                                        textDecoration: 'underline',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {c.title}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </nav>
                    )}
                  </div>
                )}

                {it.summary && (
                  <div style={{ marginBottom: 10 }}>
                    <strong>Summary:</strong>
                    {editing[it.id] ? (
                      <textarea
                        value={editContent[it.id]?.summary || ''}
                        onChange={(e) => handleEditChange(it.id, 'summary', e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: 100,
                          padding: '8px 12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          background: colors.background,
                          color: colors.text,
                          fontFamily: 'inherit',
                          marginTop: 8
                        }}
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{it.summary}</div>
                    )}
                  </div>
                )}
                {editing[it.id] ? (
                  <div style={{ marginBottom: 10 }}>
                    <strong>Body HTML:</strong>
                    <textarea
                      value={editContent[it.id]?.body_html || ''}
                      onChange={(e) => handleEditChange(it.id, 'body_html', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: 300,
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: 6,
                        background: colors.background,
                        color: colors.text,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        marginTop: 8
                      }}
                    />
                  </div>
                ) : (
                  <article
                    dangerouslySetInnerHTML={{ __html: it.body_html || '' }}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      padding: 12
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ color: colors.textSecondary }}>No items found.</div>
        )}
      </div>
    </div>
  );
}


