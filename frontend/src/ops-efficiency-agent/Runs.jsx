import React, { useState, useEffect } from 'react';

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await fetch('/agents/opsx/runs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      } else {
        const mockRuns = [
          { _id: 'run-001', run_id: 'opsx-inv-20240115-001', module: 'opsx', status: 'SUCCESS', topic: 'Invoice INV-2024-001 Approval', created_at: '2024-01-15T10:30:00Z', updated_at: '2024-01-15T10:31:00Z', artifacts: { invoice: [{ action: 'approve', invoice_id: 'INV-2024-001', timestamp: '2024-01-15T10:30:45Z' }], notifications: [{ type: 'slack', channel: '#finance', message_id: '1234567890.123456', timestamp: '2024-01-15T10:30:50Z' }] }, attestation_hash: 'sha256:abc123def456...' },
          { _id: 'run-002', run_id: 'opsx-alloc-20240115-002', module: 'opsx', status: 'SUCCESS', topic: 'Cost Allocation Suggestion', created_at: '2024-01-15T14:20:00Z', updated_at: '2024-01-15T14:21:00Z', artifacts: { allocation: [{ allocation_id: 'ALLOC-2024-001', document_id: 'DOC-2024-001', lines: [{ amount: 3000, gl_account: '6020', cost_center: 'IT_DEPT' }, { amount: 2000, gl_account: '6020', cost_center: 'OPS_DEPT' }], timestamp: '2024-01-15T14:20:30Z' }], notifications: [{ type: 'slack', channel: '#finance', message_id: '1234567890.123457', timestamp: '2024-01-15T14:20:35Z' }] }, attestation_hash: 'sha256:def456ghi789...' },
          { _id: 'run-003', run_id: 'opsx-ats-20240115-003', module: 'opsx', status: 'SUCCESS', topic: 'CV Ranking: Backend Developer', created_at: '2024-01-15T16:45:00Z', updated_at: '2024-01-15T16:46:00Z', artifacts: { ats: { job_id: 'JOB-2024-001', candidates: [{ candidateId: 'CAND-001', score01: 0.92 }, { candidateId: 'CAND-002', score01: 0.78 }, { candidateId: 'CAND-003', score01: 0.65 }], timestamp: '2024-01-15T16:45:30Z' }, sheets: [{ operation: 'append', range: 'ATS!A1', updated_range: 'ATS!A1:E4', timestamp: '2024-01-15T16:45:45Z' }] }, attestation_hash: 'sha256:ghi789jkl012...' }
        ];
        setRuns(mockRuns);
      }
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = { SUCCESS: { bg: '#DCFCE7', color: '#166534' }, FAILED: { bg: '#FEE2E2', color: '#991B1B' }, RUNNING: { bg: '#DBEAFE', color: '#1E40AF' }, PENDING: { bg: '#FEF3C7', color: '#92400E' } };
    const s = map[status] || { bg: '#E5E7EB', color: '#374151' };
    return <span style={{ padding: '0.25rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, backgroundColor: s.bg, color: s.color }}>{status}</span>;
  };

  const getActionIcon = (actionType) => {
    const icons = { 'invoice.approve': '✅', 'invoice.hold': '⚠️', 'cost.allocate': '💰', 'ats.rank': '👥', 'notify.slack': '💬', 'notify.email': '📧', 'sheets.appendRow': '📊' };
    return icons[actionType] || '⚙️';
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();
  const truncateHash = (hash) => (!hash ? '-' : hash.substring(0, 16) + '...');

  const filteredRuns = runs.filter(run => {
    if (filter === 'all') return true;
    if (filter === 'success') return run.status === 'SUCCESS';
    if (filter === 'failed') return run.status === 'FAILED';
    if (filter === 'running') return run.status === 'RUNNING';
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>Loading runs...</p>
      </div>
    );
  }

  const container = { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' };
  const card = { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
  const cardHeader = { padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const cardTitle = { margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' };
  const tableWrap = { overflowX: 'auto' };
  const table = { width: '100%', borderCollapse: 'collapse' };
  const th = { textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', backgroundColor: '#F9FAFB', borderBottom: '1px solid #e5e7eb' };
  const td = { padding: '0.75rem', borderBottom: '1px solid #F3F4F6', fontSize: '0.9rem', color: '#111827' };
  const btn = (bg, text, border) => ({ padding: '0.45rem 0.8rem', borderRadius: 8, backgroundColor: bg, color: text, border: `1px solid ${border}`, cursor: 'pointer' });

  return (
    <div style={container}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Execution History</h1>
        <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>View all Operations Efficiency Agent executions with attestation</p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setFilter('all')} style={btn(filter === 'all' ? '#2563EB' : '#E5E7EB', filter === 'all' ? '#FFFFFF' : '#374151', filter === 'all' ? '#1D4ED8' : '#D1D5DB')}>All ({runs.length})</button>
        <button onClick={() => setFilter('success')} style={btn(filter === 'success' ? '#10B981' : '#E5E7EB', filter === 'success' ? '#FFFFFF' : '#374151', filter === 'success' ? '#059669' : '#D1D5DB')}>Success ({runs.filter(r => r.status === 'SUCCESS').length})</button>
        <button onClick={() => setFilter('failed')} style={btn(filter === 'failed' ? '#EF4444' : '#E5E7EB', filter === 'failed' ? '#FFFFFF' : '#374151', filter === 'failed' ? '#B91C1C' : '#D1D5DB')}>Failed ({runs.filter(r => r.status === 'FAILED').length})</button>
        <button onClick={() => setFilter('running')} style={btn(filter === 'running' ? '#3B82F6' : '#E5E7EB', filter === 'running' ? '#FFFFFF' : '#374151', filter === 'running' ? '#1D4ED8' : '#D1D5DB')}>Running ({runs.filter(r => r.status === 'RUNNING').length})</button>
      </div>

      {/* Runs Table */}
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={cardTitle}>Recent Executions</h2>
        </div>
        <div style={{ padding: '0.25rem 0 1rem 0' }}>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Run ID</th>
                  <th style={th}>Topic</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                  <th style={th}>Created</th>
                  <th style={th}>Attestation</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run._id}>
                    <td style={td}><div style={{ fontWeight: 600 }}>{run.run_id}</div></td>
                    <td style={td}><div>{run.topic}</div></td>
                    <td style={td}>{getStatusBadge(run.status)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {run.artifacts && Object.keys(run.artifacts).map((key) => {
                          const artifact = run.artifacts[key];
                          if (Array.isArray(artifact)) {
                            return artifact.map((item, index) => (
                              <span key={index} style={{ fontSize: '1.1rem' }} title={key}>{getActionIcon(key)}</span>
                            ));
                          } else if (artifact && typeof artifact === 'object') {
                            return <span key={key} style={{ fontSize: '1.1rem' }} title={key}>{getActionIcon(key)}</span>;
                          }
                          return null;
                        })}
                      </div>
                    </td>
                    <td style={td}><span style={{ color: '#6B7280' }}>{formatDate(run.created_at)}</span></td>
                    <td style={td}><code style={{ fontSize: '0.75rem', color: '#4B5563', background: '#F3F4F6', padding: '2px 6px', borderRadius: 6 }}>{truncateHash(run.attestation_hash)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, borderRadius: 9999, background: '#DBEAFE' }}>📊</div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Total Runs</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{runs.length}</div>
            </div>
          </div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, borderRadius: 9999, background: '#DCFCE7' }}>✅</div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Successful</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{runs.filter(r => r.status === 'SUCCESS').length}</div>
            </div>
          </div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, borderRadius: 9999, background: '#FEE2E2' }}>❌</div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Failed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{runs.filter(r => r.status === 'FAILED').length}</div>
            </div>
          </div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 8, borderRadius: 9999, background: '#FEF3C7' }}>⏱️</div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Success Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{runs.length > 0 ? Math.round((runs.filter(r => r.status === 'SUCCESS').length / runs.length) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Runs;
