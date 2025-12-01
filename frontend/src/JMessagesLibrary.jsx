import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';

export default function JMessagesLibrary() {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const resp = await fetchWithAuth('/api/j-messages/list');
      const data = await resp.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setError('Failed to load items');
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

  const filtered = items.filter((it) => {
    const hay = `${it.j_id || ''} ${it.title || ''} ${it.categories?.join(' ') || ''}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const resp = await fetchWithAuth(`/api/j-messages/delete/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert('Delete failed');
      }
    } catch (e) {
      alert(`Delete failed: ${String(e)}`);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: colors.primary, marginBottom: 8 }}>📚 J-messages Library</h1>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          Browse and manage previously analyzed J‑meldinger.
        </p>
      </div>

      <div style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        display: 'flex',
        gap: 8
      }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, title, or category"
          style={{
            flex: 1,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            background: colors.background,
            color: colors.text
          }}
        />
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
          Refresh
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((it) => (
          <div key={it.id} style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: colors.primary }}>
                  {it.title || '(untitled)'}
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>
                  {it.j_id ? `${it.j_id} • ` : ''}{it.status || ''} {it.valid_from ? `• ${it.valid_from}` : ''} {it.valid_to ? `→ ${it.valid_to}` : ''}
                </div>
                {Array.isArray(it.categories) && it.categories.length > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {it.categories.map((c, idx) => (
                      <span key={idx} style={{
                        background: colors.primaryLight,
                        color: colors.primary,
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 12
                      }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [it.id]: !e[it.id] }))}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer'
                  }}
                >
                  {expanded[it.id] ? 'Collapse' : 'Expand'}
                </button>
                <button
                  onClick={() => deleteItem(it.id)}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            {expanded[it.id] && (
              <div style={{ marginTop: 12 }}>
                {it.summary && (
                  <div style={{ marginBottom: 10 }}>
                    <strong>Summary:</strong>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{it.summary}</div>
                  </div>
                )}
                <article
                  dangerouslySetInnerHTML={{ __html: it.body_html || '' }}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: 12
                  }}
                />
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


