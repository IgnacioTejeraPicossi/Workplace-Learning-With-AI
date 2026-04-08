import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Runs = () => {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/agents/sales/runs`);
        const data = await res.json();
        setRuns(Array.isArray(data) ? data : data.items || []);
      } catch (e) {
        setRuns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loc = i18n.language === 'no' ? 'nb-NO' : 'en-US';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? String(dateStr) : d.toLocaleString(loc);
  };

  const card = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>▶️</span>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{t('salesAssistantModule.runsTitle')}</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>{t('salesAssistantModule.runsLoading')}</div>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>{t('salesAssistantModule.runsEmpty')}</div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 460 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thRunId')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thStatus')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thCreated')}</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>{t('salesAssistantModule.thError')}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{r.run_id || r.id}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 8,
                        background: r.status === 'DONE' ? '#dcfce7' : r.status === 'FAILED' ? '#fee2e2' : '#e0f2fe',
                        color: r.status === 'DONE' ? '#166534' : r.status === 'FAILED' ? '#991b1b' : '#1d4ed8',
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{formatDate(r.created_at)}</td>
                    <td style={{ padding: '12px', color: '#991b1b' }}>{r.error || ''}</td>
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

export default Runs;
