// AgentOps Studio - Overview Component
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Overview({ setActiveTab }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use the same API as Agent Runs Monitor
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/agent-runs`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const agentRuns = data.items || [];
      
      // Create summary from agent runs data
      const summaryData = {
        total_runs: agentRuns.length,
        completed_runs: agentRuns.filter(run => run.status === 'DONE').length,
        running_runs: agentRuns.filter(run => run.status === 'RUNNING').length,
        today_runs: agentRuns.filter(run => {
          const today = new Date().toDateString();
          return new Date(run.updated_at).toDateString() === today;
        }).length
      };
      
      setSummary(summaryData);
      
      // Show a balanced mix of both modules (up to 8 runs)
      const complianceRuns = agentRuns.filter(run => run.module === 'compliance').slice(0, 4);
      const productivityRuns = agentRuns.filter(run => run.module === 'productivity').slice(0, 4);
      const mixedRuns = [...complianceRuns, ...productivityRuns]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 8);
      
      setRecentRuns(mixedRuns);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>{t('agentopsStudio.overview.loading')}</p>
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
        {t('agentopsStudio.overview.title')}
      </h2>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
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
            <span style={{ fontSize: '1.5rem' }}>🏃</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('agentopsStudio.overview.kpiTotalRuns')}</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {summary?.total_runs || 0}
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('agentopsStudio.overview.kpiCompleted')}</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {summary?.completed_runs || 0}
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('agentopsStudio.overview.kpiRunning')}</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {summary?.running_runs || 0}
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
            <span style={{ fontSize: '1.5rem' }}>📅</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('agentopsStudio.overview.kpiToday')}</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
            {summary?.today_runs || 0}
          </div>
        </div>
      </div>

      {/* Recent Runs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{t('agentopsStudio.overview.recentRuns')}</h3>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
            {loading ? '⏳' : '🔄'} {t('agentopsStudio.overview.refresh')}
          </button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {recentRuns.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
              <p>{t('agentopsStudio.overview.noRuns')}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>{t('agentopsStudio.overview.thRunId')}</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>{t('agentopsStudio.overview.thStatus')}</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>{t('agentopsStudio.overview.thUpdated')}</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>{t('agentopsStudio.overview.thModule')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map(run => (
                    <tr key={run.run_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {run.run_id.slice(-8)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: run.status === 'DONE' ? '#dcfce7' : 
                                         run.status === 'RUNNING' ? '#fef3c7' : 
                                         run.status === 'FAILED' ? '#fee2e2' : '#f1f5f9',
                          color: run.status === 'DONE' ? '#166534' : 
                                run.status === 'RUNNING' ? '#92400e' : 
                                run.status === 'FAILED' ? '#991b1b' : '#475569'
                        }}>
                          {run.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                        {run.updated_at ? new Date(run.updated_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: run.module === 'compliance' ? '#dbeafe' : 
                                         run.module === 'productivity' ? '#dcfce7' : '#f1f5f9',
                          color: run.module === 'compliance' ? '#1e40af' : 
                                run.module === 'productivity' ? '#166534' : '#475569',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {run.module === 'compliance' ? '🛡️' : 
                           run.module === 'productivity' ? '🚀' : '📋'} 
                          {run.module || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
            🧪 {t('agentopsStudio.overview.quickStartTitle')}
          </h4>
          <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
            {t('agentopsStudio.overview.quickStartDesc')}
          </p>
          <button
            onClick={() => setActiveTab('prompt-lab')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
            {t('agentopsStudio.overview.quickStartBtn')}
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
            📋 {t('agentopsStudio.overview.playbookTitle')}
          </h4>
          <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
            {t('agentopsStudio.overview.playbookDesc')}
          </p>
          <button
            onClick={() => setActiveTab('playbook')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
            {t('agentopsStudio.overview.playbookBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
