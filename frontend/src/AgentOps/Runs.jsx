import React, { useState, useEffect } from 'react';
import { get, qs, download } from './agentopsApi';

export default function Runs() {
  const [runs, setRuns] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    flow_id: '',
    status: '',
    date_from: '',
    date_to: '',
    limit: 25,
    min_score: ''
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        limit: filters.limit,
        flow_id: filters.flow_id || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        min_score: filters.min_score || undefined
      };
      const query = qs(params);
      
      const [runsRes, flowsRes, summaryRes] = await Promise.all([
        get(`/runs${query}`),
        get('/flows'),
        get(`/runs/summary${query}`).catch(() => null) // Optional summary
      ]);
      
      setRuns(runsRes.items || []);
      setFlows(flowsRes.items || []);
      setSummary(summaryRes);
    } catch (error) {
      console.error('Error loading runs data:', error);
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
      date_from: '',
      date_to: '',
      limit: 25,
      min_score: ''
    });
    setTimeout(loadData, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return '#10b981';
      case 'running': return '#3b82f6';
      case 'error': return '#ef4444';
      case 'safety_failed': return '#f59e0b';
      case 'queued': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return '✅';
      case 'running': return '🔄';
      case 'error': return '❌';
      case 'safety_failed': return '⚠️';
      case 'queued': return '⏳';
      default: return '❓';
    }
  };

  const formatDuration = (startedAt, finishedAt) => {
    if (!finishedAt) return 'Running...';
    const duration = new Date(finishedAt) - new Date(startedAt);
    const seconds = Math.round(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exportRuns = async (format) => {
    try {
      const params = {
        limit: filters.limit,
        flow_id: filters.flow_id || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        min_score: filters.min_score || undefined,
        format: format
      };
      const query = qs(params);
      const filename = format === 'json' ? 'agentops_runs.json' : 'agentops_runs.csv';
      await download(`/runs/export${query}`, filename);
    } catch (error) {
      console.error('Error exporting runs:', error);
      alert('Error exporting runs: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          📈 Runs Monitor
        </h2>
        <p style={{ color: '#6b7280' }}>
          Monitor and analyze workflow executions. View logs, filter results, and track performance metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
            {summary?.total_runs || runs.length || 0}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Runs</div>
        </div>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
            {summary?.success_rate ? `${Math.round(summary.success_rate * 100)}%` : '—'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Success Rate</div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
            {summary?.avg_score ? summary.avg_score.toFixed(1) : '—'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Avg Score</div>
        </div>

        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
            {summary?.error_count || 0}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Errors</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
          Filters
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
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
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">All Flows</option>
              {flows.map(flow => (
                <option key={flow._id} value={flow._id}>
                  {flow.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
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
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="done">Done</option>
              <option value="error">Error</option>
              <option value="safety_failed">Safety Failed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Date From
            </label>
            <input
              type="datetime-local"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Date To
            </label>
            <input
              type="datetime-local"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
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
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              {[10, 25, 50, 100, 250, 500].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Min Score
            </label>
            <input
              type="number"
              value={filters.min_score}
              onChange={(e) => handleFilterChange('min_score', e.target.value)}
              min="0"
              max="100"
              step="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
              placeholder="0-100"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={applyFilters}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            🔍 Apply Filters
          </button>
          
          <button
            onClick={clearFilters}
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
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      {/* Export Controls */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '0.5rem',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ color: '#0c4a6e' }}>Export Runs</strong>
          <div style={{ fontSize: '0.875rem', color: '#0c4a6e', marginTop: '0.25rem' }}>
            Download runs data in CSV or JSON format
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => exportRuns('csv')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📊 Export CSV
          </button>
          <button
            onClick={() => exportRuns('json')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📄 Export JSON
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
            Runs ({runs.length})
          </h3>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading runs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
            <p>No runs found.</p>
            <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or start a new run.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    When
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Flow
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Task / Topic
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Est (s)
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Actual (s)
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Score
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const flow = flows.find(f => f._id === run.flow_id);
                  return (
                    <tr key={run._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {flow ? flow.name : 'Unknown Flow'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: getStatusColor(run.status) + '20',
                          color: getStatusColor(run.status),
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getStatusIcon(run.status)} {run.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {run.output?.plan?.task_name || run.input?.topic || run.input?.task?.name || '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {run.output?.plan?.est_total_seconds ?? '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {run.output?.sim?.sim_total_seconds ?? '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {run.output?.judge?.score ?? '—'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => {
                            // TODO: Implement run details modal
                            alert(`Run Details:\nID: ${run._id}\nStatus: ${run.status}\nFlow: ${flow?.name || 'Unknown'}`);
                          }}
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
                          👁️ View
                        </button>
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
  );
}
