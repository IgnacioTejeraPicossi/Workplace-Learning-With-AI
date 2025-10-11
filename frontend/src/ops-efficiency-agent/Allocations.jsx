import React, { useState, useEffect } from 'react';

const Allocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      // Mock data for demo
      const mockAllocations = [
        {
          id: 'ALLOC-2024-001',
          document_id: 'DOC-2024-001',
          vendor: 'SaaS Provider AS',
          description: 'Monthly subscription - Office 365',
          total_amount: 5000.00,
          status: 'draft',
          confidence_score: 0.85,
          rationale: 'Historical pattern shows 60% IT, 40% Operations split',
          lines: [
            { amount: 3000, gl_account: '6020', cost_center: 'IT_DEPT', project: null, note: 'IT Department' },
            { amount: 2000, gl_account: '6020', cost_center: 'OPS_DEPT', project: null, note: 'Operations' }
          ],
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 'ALLOC-2024-002',
          document_id: 'DOC-2024-002',
          vendor: 'Marketing Agency',
          description: 'Q1 Marketing Campaign',
          total_amount: 25000.00,
          status: 'posted',
          confidence_score: 0.92,
          rationale: 'Campaign-specific allocation based on project codes',
          lines: [
            { amount: 15000, gl_account: '6040', cost_center: 'MARKETING', project: 'Q1_CAMPAIGN', note: 'Campaign costs' },
            { amount: 10000, gl_account: '6040', cost_center: 'MARKETING', project: 'BRANDING', note: 'Brand development' }
          ],
          created_at: '2024-01-14T14:20:00Z'
        }
      ];
      setAllocations(mockAllocations);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
      setLoading(false);
    }
  };

  const executeOpsx = async (bundle) => {
    try {
      const response = await fetch('/agents/opsx/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'test-signature' // In production, generate proper HMAC
        },
        body: JSON.stringify(bundle)
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Ops Efficiency execution result:', result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to execute Ops Efficiency:', error);
      throw error;
    }
  };

  const handleSuggestAllocation = async () => {
    setSending(true);
    try {
      const runId = `opsx-alloc-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: "Cost Allocation Suggestion",
        summary_md: "AI-powered cost allocation suggestion based on vendor patterns",
        actions: [
          { type: "cost.allocate", payload: { docId: "JRN-001", lines: [ { amount: 3000, gl: "6020", costCenter: "IT_DEPT", project: null, note: "IT Department" }, { amount: 2000, gl: "6020", costCenter: "OPS_DEPT", project: null, note: "Operations" } ] } },
          { type: "notify.slack", payload: { channel: "#finance", text: "New cost allocation suggestion generated with 85% confidence" } }
        ],
        callback_url: "/api/agent-runs/callback"
      };
      await executeOpsx(bundle);
      setShowSuggestion(true);
      alert('Cost allocation suggestion generated successfully!');
    } catch (error) {
      alert(`Failed to generate suggestion: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handlePostAllocation = async (allocation) => {
    setSending(true);
    try {
      const runId = `opsx-alloc-${Date.now()}`;
      const bundle = {
        run_id: runId,
        topic: `Post Allocation ${allocation.id}`,
        summary_md: `Posting cost allocation ${allocation.id} to ERP system`,
        actions: [
          { type: "cost.allocate", payload: { docId: allocation.document_id, lines: allocation.lines } },
          { type: "notify.slack", payload: { channel: "#finance", text: `Allocation ${allocation.id} posted successfully` } }
        ],
        callback_url: "/api/agent-runs/callback"
      };
      await executeOpsx(bundle);
      setAllocations(prev => prev.map(alloc => alloc.id === allocation.id ? { ...alloc, status: 'posted' } : alloc));
      alert(`Allocation ${allocation.id} posted successfully!`);
    } catch (error) {
      alert(`Failed to post allocation: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = { draft: { bg: '#FEF3C7', color: '#92400E', label: 'Draft' }, posted: { bg: '#DCFCE7', color: '#166534', label: 'Posted' }, cancelled: { bg: '#E5E7EB', color: '#374151', label: 'Cancelled' } };
    const s = map[status] || { bg: '#E5E7EB', color: '#374151', label: status };
    return (
      <span style={{ padding: '0.25rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
    );
  };

  const getConfidenceBadge = (confidence) => {
    const pct = Math.round(confidence * 100);
    const isHigh = pct >= 80;
    const isMid = pct >= 60 && pct < 80;
    const styles = isHigh ? { bg: '#DCFCE7', color: '#166534' } : isMid ? { bg: '#FEF3C7', color: '#92400E' } : { bg: '#FEE2E2', color: '#991B1B' };
    return (
      <span style={{ padding: '0.25rem 0.5rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500, backgroundColor: styles.bg, color: styles.color }}>{pct}%</span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>Loading allocations...</p>
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
  const btn = (color) => ({ padding: '0.35rem 0.6rem', borderRadius: '8px', border: `1px solid ${color.border}`, backgroundColor: color.bg, color: color.text, cursor: 'pointer' });

  return (
    <div style={container}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Cost Allocations</h1>
        <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>AI-powered cost allocation suggestions with explainability</p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={handleSuggestAllocation} disabled={sending} style={btn({ bg: '#2563EB', border: '#1D4ED8', text: '#FFFFFF' })}>
          {sending ? 'Generating...' : 'Suggest New Allocation'}
        </button>
      </div>

      {/* Allocation Suggestions */}
      {showSuggestion && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, color: '#1E3A8A', fontWeight: 600 }}>New Allocation Suggestion</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Suggested Split:</h4>
              <ul style={{ margin: '8px 0', paddingLeft: 18, color: '#4B5563' }}>
                <li>IT Department: NOK 3,000 (60%)</li>
                <li>Operations: NOK 2,000 (40%)</li>
              </ul>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Rationale:</h4>
              <p style={{ margin: '8px 0', color: '#4B5563' }}>Historical pattern analysis shows consistent 60/40 split for SaaS subscriptions</p>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={btn({ bg: '#10B981', border: '#059669', text: '#FFFFFF' })}>Accept Suggestion</button>
            <button onClick={() => setShowSuggestion(false)} style={btn({ bg: '#E5E7EB', border: '#D1D5DB', text: '#374151' })}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Allocations Table */}
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={cardTitle}>Recent Allocations</h2>
        </div>
        <div style={{ padding: '0.25rem 0 1rem 0' }}>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Allocation ID</th>
                  <th style={th}>Vendor</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Status</th>
                  <th style={th}>Confidence</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{allocation.id}</div>
                      <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>Doc: {allocation.document_id}</div>
                    </td>
                    <td style={td}>
                      <div>{allocation.vendor}</div>
                      <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>{allocation.description}</div>
                    </td>
                    <td style={td}>NOK {allocation.total_amount.toLocaleString()}</td>
                    <td style={td}>{getStatusBadge(allocation.status)}</td>
                    <td style={td}>{getConfidenceBadge(allocation.confidence_score)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {allocation.status === 'draft' && (
                          <button onClick={() => handlePostAllocation(allocation)} disabled={sending} style={btn({ bg: '#ECFDF5', border: '#10B981', text: '#065F46' })}>Post</button>
                        )}
                        <button style={btn({ bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' })}>Details</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Allocation Details */}
      <div style={{ marginTop: 16, ...card, padding: 16 }}>
        <h3 style={{ ...cardTitle, marginBottom: 12 }}>Allocation Breakdown</h3>
        <div style={{ display: 'grid', rowGap: 12 }}>
          {allocations.map((allocation) => (
            <div key={allocation.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>{allocation.id}</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  {getStatusBadge(allocation.status)}
                  {getConfidenceBadge(allocation.confidence_score)}
                </div>
              </div>
              <p style={{ color: '#6B7280', marginTop: 0 }}>{allocation.rationale}</p>
              <div style={{ display: 'grid', rowGap: 6 }}>
                {allocation.lines.map((line, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6B7280' }}>{line.cost_center} {line.project ? `(${line.project})` : ''}</span>
                    <span style={{ fontWeight: 600 }}>NOK {line.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Allocations;
