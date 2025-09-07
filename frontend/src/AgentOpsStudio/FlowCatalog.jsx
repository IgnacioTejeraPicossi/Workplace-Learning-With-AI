// AgentOps Studio - Flow Catalog Component
import React, { useState, useEffect } from 'react';
import { Flows } from './agentopsApi';

export default function FlowCatalog() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "Web Research Agent",
    n8n_webhook_url: "https://n8n.example.com/webhook/agentops-web-research",
    description: "Web research → extract → LM Studio report"
  });
  const [editingFlow, setEditingFlow] = useState(null);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const response = await Flows.list();
      setFlows(response.items || []);
    } catch (error) {
      console.error('Error loading flows:', error);
      alert(`Error loading flows: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.n8n_webhook_url.trim()) {
      alert("Name and Webhook URL are required");
      return;
    }

    try {
      if (editingFlow) {
        await Flows.patch(editingFlow._id, form);
        alert("Flow updated successfully");
      } else {
        await Flows.create(form);
        alert("Flow created successfully");
      }
      
      setForm({
        name: "Web Research Agent",
        n8n_webhook_url: "https://n8n.example.com/webhook/agentops-web-research",
        description: "Web research → extract → LM Studio report"
      });
      setEditingFlow(null);
      loadFlows();
    } catch (error) {
      console.error('Error saving flow:', error);
      alert(`Error saving flow: ${error.message}`);
    }
  };

  const handleEdit = (flow) => {
    setForm({
      name: flow.name,
      n8n_webhook_url: flow.n8n_webhook_url,
      description: flow.description || ""
    });
    setEditingFlow(flow);
  };

  const handleDelete = async (flowId) => {
    if (!window.confirm("Are you sure you want to delete this flow?")) {
      return;
    }

    try {
      await Flows.delete(flowId);
      alert("Flow deleted successfully");
      loadFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert(`Error deleting flow: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setForm({
      name: "Web Research Agent",
      n8n_webhook_url: "https://n8n.example.com/webhook/agentops-web-research",
      description: "Web research → extract → LM Studio report"
    });
    setEditingFlow(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>Loading flows...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '600', 
        marginBottom: '2rem',
        color: '#1e293b'
      }}>
        🔄 Flow Catalog
      </h2>

      {/* Create/Edit Form */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          fontSize: '1.25rem', 
          fontWeight: '600',
          color: editingFlow ? '#8b5cf6' : '#3b82f6'
        }}>
          {editingFlow ? '✏️ Edit Flow' : '➕ Register New Flow'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Flow Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Web Research Agent"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                n8n Webhook URL *
              </label>
              <input
                type="url"
                value={form.n8n_webhook_url}
                onChange={(e) => setForm({ ...form, n8n_webhook_url: e.target.value })}
                placeholder="https://n8n.example.com/webhook/agentops-web-research"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of what this flow does"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              type="submit"
              style={{
                backgroundColor: editingFlow ? '#8b5cf6' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {editingFlow ? '💾 Update Flow' : '➕ Register Flow'}
            </button>

            {editingFlow && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Flows List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Registered Flows ({flows.length})
          </h3>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {flows.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
              <p>No flows registered yet. Create your first flow above!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Webhook URL</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Created</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.map(flow => (
                    <tr key={flow._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                        {flow.name}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <code style={{
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}>
                          {flow.n8n_webhook_url}
                        </code>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
                        {flow.description || '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>
                        {flow.created_at ? new Date(flow.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(flow)}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(flow._id)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
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

      {/* Help Section */}
      <div style={{
        marginTop: '2rem',
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          💡 How to use Flow Catalog
        </h4>
        <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>1. Create n8n Workflow:</strong> Design your automation workflow in n8n
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>2. Get Webhook URL:</strong> Copy the webhook URL from your n8n workflow
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>3. Register Here:</strong> Add the flow details to make it available for execution
          </p>
          <p style={{ margin: '0' }}>
            <strong>4. Execute:</strong> Use the flow in Playbook or Runs to execute your automation
          </p>
        </div>
      </div>
    </div>
  );
}
