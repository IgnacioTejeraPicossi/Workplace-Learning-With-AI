import React, { useEffect, useState } from 'react';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Replace with CRM deals endpoint; using demo data
        setDeals([
          { name: 'ACME Renewal', amount: 120000, stage: 'Proposal', risk: 'High', next: 'Schedule exec review' },
          { name: 'Beta Expansion', amount: 45000, stage: 'Qualification', risk: 'Medium', next: 'Send pricing options' },
          { name: 'Gamma POC', amount: 15000, stage: 'POC', risk: 'Low', next: 'Confirm success criteria' }
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
          <span style={{ fontSize: 20 }}>💼</span>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Active Deals</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>Loading deals…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Deal</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Stage</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Risk</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Next Step</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{d.name}</td>
                    <td style={{ padding: '12px' }}>${d.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{d.stage}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 8,
                        background: d.risk === 'High' ? '#fee2e2' : d.risk === 'Medium' ? '#fef3c7' : '#dcfce7',
                        color: d.risk === 'High' ? '#991b1b' : d.risk === 'Medium' ? '#92400e' : '#166534'
                      }}>{d.risk}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{d.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deals;
