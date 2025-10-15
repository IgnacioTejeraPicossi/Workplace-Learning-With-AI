import React, { useEffect, useState } from 'react';

const Hygiene = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Demo data; replace with CRM hygiene endpoint when available
        setIssues([
          { account: 'ACME Corp', missing: ['Close Date', 'Next Activity', 'Amount'], score: 85, owner: 'sales@company.com', stage: 'Qualification' },
          { account: 'Beta Corp', missing: ['Next Activity'], score: 25, owner: 'sales@company.com', stage: 'Proposal' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🧹</span>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Pipeline Hygiene</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>Loading hygiene issues…</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {issues.map((it, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: '#fff7ed', border: '1px solid #ffedd5' }}>
                <div style={{ fontWeight: 700, color: '#9a3412' }}>{it.account}</div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 6 }}>
                  Missing: {it.missing.join(', ')}
                </div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 4 }}>Hygiene Score: {it.score}% ({it.score > 70 ? 'High Risk' : it.score > 40 ? 'Medium Risk' : 'Low Risk'})</div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 4 }}>Owner: {it.owner}</div>
                <div style={{ fontSize: 13, color: '#7c2d12', marginTop: 4 }}>Stage: {it.stage}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hygiene;

