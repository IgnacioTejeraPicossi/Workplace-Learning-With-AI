// Compliance Tracker — NIST, ISO, CIS, OWASP compliance management
import React, { useState, useEffect } from 'react';

const API = '/api/cyber';

const FRAMEWORK_COLORS = {
  'NIST-CSF': '#3b82f6',
  'ISO-27001': '#8b5cf6',
  'CIS': '#10b981',
  'OWASP-ASVS': '#f59e0b',
  'OWASP-TOP10': '#ef4444',
};

const STATUS_STYLES = {
  implemented:     { bg: '#dcfce7', color: '#166534', label: 'Implemented' },
  partial:         { bg: '#fef9c3', color: '#854d0e', label: 'Partial' },
  not_implemented: { bg: '#fee2e2', color: '#991b1b', label: 'Not Implemented' },
  not_applicable:  { bg: '#f3f4f6', color: '#6b7280', label: 'N/A' },
};

export default function ComplianceTracker() {
  const [statuses, setStatuses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [controls, setControls] = useState([]);
  const [filterFw, setFilterFw] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);   // key being edited
  const [editForm, setEditForm] = useState({ status: '', evidence: '', reviewer: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch data on mount
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statusRes, summaryRes, ctrlRes] = await Promise.all([
        fetch(`${API}/compliance/status`),
        fetch(`${API}/compliance/summary`),
        fetch(`${API}/controls`),
      ]);
      setStatuses(await statusRes.json());
      setSummary(await summaryRes.json());
      setControls(await ctrlRes.json());
    } catch (e) {
      console.error('Failed to load compliance data', e);
    }
    setLoading(false);
  }

  // Merge control metadata with compliance status
  function enriched() {
    return statuses.map(s => {
      const ctrl = controls.find(c => c.id === `${s.framework}:${s.control_id}`);
      return { ...s, title: ctrl?.title || s.control_id, description: ctrl?.description || '', guidance: ctrl?.implementation_guidance || '' };
    });
  }

  function filtered() {
    let rows = enriched();
    if (filterFw !== 'all') rows = rows.filter(r => r.framework === filterFw);
    if (filterStatus !== 'all') rows = rows.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.control_id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.evidence || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }

  function startEdit(row) {
    setEditing(`${row.framework}:${row.control_id}`);
    setEditForm({ status: row.status, evidence: row.evidence || '', reviewer: row.reviewer || '' });
  }

  async function saveEdit(row) {
    setSaving(true);
    try {
      const res = await fetch(`${API}/compliance/${row.framework}/${row.control_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditing(null);
        await loadData();
      }
    } catch (e) {
      console.error('Save failed', e);
    }
    setSaving(false);
  }

  // --- Render helpers ---
  const card = (label, value, color) => (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e5e7eb', minWidth: 130, flex: 1 }}>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color }}>{value}</div>
    </div>
  );

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading compliance data…</div>;

  const rows = filtered();
  const frameworks = [...new Set(statuses.map(s => s.framework))];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {card('Total Controls', summary.total_controls, '#1f2937')}
          {card('Implemented', summary.implemented, '#16a34a')}
          {card('Partial', summary.partial, '#ca8a04')}
          {card('Not Implemented', summary.not_implemented, '#dc2626')}
          {card('Overall Completion', `${summary.overall_completion_pct}%`, '#3b82f6')}
        </div>
      )}

      {/* Framework progress bars */}
      {summary && (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>Compliance by Framework</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {summary.by_framework.map(fw => {
              const pct = fw.completion_pct;
              const barColor = FRAMEWORK_COLORS[fw.framework] || '#6b7280';
              return (
                <div key={fw.framework}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: barColor }}>{fw.framework}</span>
                    <span style={{ color: '#6b7280' }}>{pct}% — {fw.counts.implemented} impl / {fw.counts.partial} partial / {fw.counts.not_implemented} gap</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          placeholder="Search controls…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', minWidth: 200 }}
        />
        <select value={filterFw} onChange={e => setFilterFw(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <option value="all">All Frameworks</option>
          {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <option value="all">All Statuses</option>
          <option value="implemented">Implemented</option>
          <option value="partial">Partial</option>
          <option value="not_implemented">Not Implemented</option>
          <option value="not_applicable">N/A</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{rows.length} controls</span>
      </div>

      {/* Controls table */}
      <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Framework', 'Control', 'Title', 'Status', 'Evidence', 'Reviewer', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const key = `${row.framework}:${row.control_id}`;
              const isEditing = editing === key;
              const st = STATUS_STYLES[row.status] || STATUS_STYLES.not_applicable;
              return (
                <tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: '600', background: `${FRAMEWORK_COLORS[row.framework]}18`, color: FRAMEWORK_COLORS[row.framework] }}>
                      {row.framework}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.control_id}</td>
                  <td style={{ padding: '0.6rem 0.5rem', maxWidth: 220 }}>
                    <div style={{ fontWeight: '500' }}>{row.title}</div>
                    {row.description && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{row.description}</div>}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    {isEditing ? (
                      <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                        style={{ padding: '0.3rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.8rem' }}>
                        <option value="implemented">Implemented</option>
                        <option value="partial">Partial</option>
                        <option value="not_implemented">Not Implemented</option>
                        <option value="not_applicable">N/A</option>
                      </select>
                    ) : (
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: '600', background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', maxWidth: 200 }}>
                    {isEditing ? (
                      <input value={editForm.evidence} onChange={e => setEditForm(p => ({ ...p, evidence: e.target.value }))}
                        style={{ width: '100%', padding: '0.3rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.8rem' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>{row.evidence || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    {isEditing ? (
                      <input value={editForm.reviewer} onChange={e => setEditForm(p => ({ ...p, reviewer: e.target.value }))}
                        style={{ width: 100, padding: '0.3rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.8rem' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{row.reviewer || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(row)} disabled={saving}
                          style={{ padding: '0.25rem 0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', marginRight: 4 }}>
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          style={{ padding: '0.25rem 0.5rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(row)}
                        style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No controls match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
