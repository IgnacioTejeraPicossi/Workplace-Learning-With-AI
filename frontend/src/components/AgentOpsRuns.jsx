import React, { useEffect, useState } from "react";

export default function AgentOpsRuns() {
  const [items, setItems] = useState([]);
  const [module, setModule] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = module ? `?module=${module}` : "";
      const response = await fetch(`http://localhost:8000/api/agent-runs${q}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const res = await response.json();
      setItems(res.items || res.data?.items || []);
    } catch (error) {
      console.error('Failed to load agent runs:', error);
      alert('Failed to load agent runs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [module]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return '#10b981'; // green
      case 'RUNNING': return '#f59e0b'; // yellow
      case 'FAILED': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getModuleColor = (module) => {
    switch (module) {
      case 'compliance': return '#3b82f6'; // blue
      case 'productivity': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📊 Agent Runs Monitor
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1rem',
          margin: 0
        }}>
          Monitor and track agent execution status and results
        </p>
      </div>

      {/* Controls */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              Filter by Module
            </label>
            <select
              value={module}
              onChange={e => setModule(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="">All Modules</option>
              <option value="compliance">🤖 Compliance Agent</option>
              <option value="productivity">🚀 Productivity Agent</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              onClick={load}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              {loading ? '⏳' : '🔄'} {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Agent Runs Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        
        {items.length === 0 && !loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              No agent runs found
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              Try running a compliance or productivity agent first to see results here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '1rem 0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Run ID
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '1rem 0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Module
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '1rem 0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Topic
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '1rem 0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '1rem 0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Artifacts
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '1rem 0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Updated
                  </th>
            </tr>
          </thead>
          <tbody>
                {items.map((item, index) => (
                  <tr 
                    key={item.run_id} 
                    style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa'}
                  >
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        display: 'inline-block'
                      }}>
                        {item.run_id.slice(-8)}
                      </div>
                </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: getModuleColor(item.module) + '20',
                        color: getModuleColor(item.module),
                        textTransform: 'capitalize',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {item.module === 'compliance' ? '🤖' : '🚀'} {item.module}
                  </span>
                </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#374151',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.topic}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(item.status) + '20',
                        color: getStatusColor(item.status),
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {item.artifacts?.jira && (
                          <div style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: '500', color: '#374151' }}>Jira:</span>
                            <span style={{ color: '#6b7280', marginLeft: '0.25rem' }}>
                              {Array.isArray(item.artifacts.jira) ? 
                                item.artifacts.jira.join(", ") : String(item.artifacts.jira)}
                            </span>
                      </div>
                    )}
                        {item.artifacts?.slack && (
                          <div style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: '500', color: '#374151' }}>Slack:</span>
                            <span style={{ color: '#6b7280', marginLeft: '0.25rem' }}>
                              {String(item.artifacts.slack)}
                            </span>
                      </div>
                    )}
                        {item.artifacts?.sheets && (
                          <div style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: '500', color: '#374151' }}>Sheets:</span>
                            <a 
                              style={{ 
                                color: '#3b82f6',
                                textDecoration: 'none',
                                marginLeft: '0.25rem',
                                fontWeight: '500'
                              }}
                              href={String(item.artifacts.sheets)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                              Open →
                        </a>
                      </div>
                    )}
                        {!item.artifacts?.jira && !item.artifacts?.slack && !item.artifacts?.sheets && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                            No artifacts
                          </span>
                        )}
                  </div>
                </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280',
                        fontFamily: 'monospace'
                      }}>
                        {new Date(item.updated_at).toLocaleString()}
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