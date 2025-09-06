import React, { useEffect, useState } from "react";
import { get, post, patch, del } from "./agentopsApi";

export default function FlowCatalog({ onLoadExample }) {
  const [flows, setFlows] = useState([]);
  const [form, setForm] = useState({ 
    name: "", 
    n8n_webhook_url: "", 
    description: "",
    version: "1.0.0",
    input_schema: {}
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      const res = await get("/flows");
      setFlows(res.items || []);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    try {
      setLoading(true);
      if (editing) {
        await patch(`/flows/${editing}`, form);
      } else {
        await post("/flows", form);
      }
      setForm({ 
        name: "", 
        n8n_webhook_url: "", 
        description: "",
        version: "1.0.0",
        input_schema: {}
      });
      setEditing(null);
      await refresh();
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error saving flow: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Are you sure you want to delete this flow?')) return;
    
    try {
      setLoading(true);
      await del(`/flows/${id}`);
      await refresh();
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('Error deleting flow: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(f) {
    setEditing(f._id);
    setForm({ 
      name: f.name, 
      n8n_webhook_url: f.n8n_webhook_url, 
      description: f.description || "",
      version: f.version || "1.0.0",
      input_schema: f.input_schema || {}
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ 
      name: "", 
      n8n_webhook_url: "", 
      description: "",
      version: "1.0.0",
      input_schema: {}
    });
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          📋 Flow Catalog
        </h2>
        <p style={{ color: '#6b7280' }}>
          Register and manage n8n workflows. Add webhook URLs, configure input schemas, and version flows.
        </p>
      </div>

      {/* Add/Edit Form */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          {editing ? 'Edit Flow' : 'Register New Flow'}
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Flow Name *
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="e.g., Web Research Agent"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Version
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="1.0.0"
                value={form.version}
                onChange={e => setForm({...form, version: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              n8n Webhook URL *
            </label>
            <input
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
              placeholder="https://your-n8n-instance.com/webhook/agentops-web-research"
              value={form.n8n_webhook_url}
              onChange={e => setForm({...form, n8n_webhook_url: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Describe what this workflow does..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={save}
              disabled={loading || !form.name || !form.n8n_webhook_url}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading || !form.name || !form.n8n_webhook_url ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: loading || !form.name || !form.n8n_webhook_url ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? '⏳' : editing ? '💾 Update Flow' : '➕ Add Flow'}
            </button>
            
            {onLoadExample && (
              <button
                onClick={onLoadExample}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🎯 Load Example
              </button>
            )}
            
            {editing && (
              <button
                onClick={cancelEdit}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flows Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
            Registered Flows ({flows.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading flows...</p>
          </div>
        ) : flows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <p>No flows registered yet.</p>
            <p style={{ fontSize: '0.875rem' }}>Add your first flow using the form above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Name
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Version
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Webhook URL
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Description
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {flows.map(f => (
                  <tr key={f._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      {f.name}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {f.version}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#6b7280' }}>
                      {f.n8n_webhook_url.length > 50 
                        ? f.n8n_webhook_url.substring(0, 50) + '...'
                        : f.n8n_webhook_url
                      }
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {f.description || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEdit(f)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => remove(f._id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
