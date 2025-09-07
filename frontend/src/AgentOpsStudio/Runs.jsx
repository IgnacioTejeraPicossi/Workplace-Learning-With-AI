// AgentOps Studio - Runs Component
import React, { useState, useEffect } from 'react';
import { Runs, Flows } from './agentopsApi';

export default function RunsPage() {
  const [runs, setRuns] = useState([]);
  const [flows, setFlows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    flow_id: '',
    status: '',
    start: '',
    end: '',
    min_score: '',
    limit: 25
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flowsData, runsData, summaryData] = await Promise.all([
        Flows.list(),
        Runs.list(filters),
        Runs.summary()
      ]);
      setFlows(flowsData.items || []);
      setRuns(runsData.items || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadData();
  };

  const clearFilters = () => {
    setFilters({
      flow_id: '',
      status: '',
      start: '',
      end: '',
      min_score: '',
      limit: 25
    });
  };

  const exportRuns = async (format) => {
    try {
      const response = await Runs.export({ ...filters, format });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `runs.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting runs:', error);
      alert(`Error exporting runs: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return '#10b981';
      case 'running': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'queued': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>Loading runs...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ 
        fontSize: '1.75rem', 
        fontWeight: '600', 
        marginBottom: '2rem',
        color: '#1e293b'
      }}>
        🏃 Runs
      </h2>

      {/* Summary Cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Total Runs</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
              {summary.total_runs || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Completed</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              {summary.status_counts?.done || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⏳</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Running</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {summary.status_counts?.running || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>❌</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Errors</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
              {summary.status_counts?.error || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
          🔍 Filters
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              Flow
            </label>
            <select
              value={filters.flow_id}
              onChange={(e) => handleFilterChange('flow_id', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            >
              <option value="">All flows</option>
              {flows.map(flow => (
                <option key={flow._id} value={flow._id}>{flow.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Any status</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="done">Done</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.start}
              onChange={(e) => handleFilterChange('start', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.end}
              onChange={(e) => handleFilterChange('end', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Min Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.min_score}
              onChange={(e) => handleFilterChange('min_score', e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.9rem'
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={applyFilters}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🔍 Apply Filters
          </button>

          <button
            onClick={clearFilters}
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
            🗑️ Clear
          </button>

          <button
            onClick={() => exportRuns('csv')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            📊 Export CSV
          </button>

          <button
            onClick={() => exportRuns('json')}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            📄 Export JSON
          </button>
        </div>
      </div>

      {/* Runs Table */}
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
            Run History ({runs.length} runs)
          </h3>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {runs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏃</div>
              <p>No runs found. Start by creating a playbook or executing a flow!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Run ID</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Flow</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Started</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Duration</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(run => {
                    const flow = flows.find(f => f._id === run.flow_id);
                    const duration = run.started_at && run.finished_at ? 
                      Math.round((new Date(run.finished_at) - new Date(run.started_at)) / 1000) : null;
                    const score = run.output?.judge?.score;

                    return (
                      <tr key={run._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {run._id.slice(-8)}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                          {flow?.name || run.flow_id}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(run.status) + '20',
                            color: getStatusColor(run.status)
                          }}>
                            {run.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                          {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                          {duration ? `${duration}s` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {score ? (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              backgroundColor: getScoreColor(score) + '20',
                              color: getScoreColor(score)
                            }}>
                              {score}/100
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
