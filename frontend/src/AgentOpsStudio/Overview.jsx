// AgentOps Studio - Overview Component
import React, { useState, useEffect } from 'react';
import { Runs } from './agentopsApi';

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, runsData] = await Promise.all([
        Runs.summary(),
        Runs.list({ limit: 5 })
      ]);
      setSummary(summaryData);
      setRecentRuns(runsData.items || []);
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
        <p>Loading overview...</p>
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
        Dashboard Overview
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Total Runs</h3>
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Completed</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {summary?.status_counts?.done || 0}
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Running</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {summary?.status_counts?.running || 0}
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Today</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
            {summary?.recent_runs || 0}
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
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Recent Runs</h3>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {recentRuns.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
              <p>No runs yet. Start by creating a playbook or registering a flow!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Run ID</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Started</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map(run => (
                    <tr key={run._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {run._id.slice(-8)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: run.status === 'done' ? '#dcfce7' : 
                                         run.status === 'running' ? '#fef3c7' : 
                                         run.status === 'error' ? '#fee2e2' : '#f1f5f9',
                          color: run.status === 'done' ? '#166534' : 
                                run.status === 'running' ? '#92400e' : 
                                run.status === 'error' ? '#991b1b' : '#475569'
                        }}>
                          {run.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                        {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {run.output?.judge?.score ? `${run.output.judge.score}/100` : '—'}
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
            🧪 Quick Start
          </h4>
          <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
            Test AI prompts with LM Studio integration
          </p>
          <button style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Go to Prompt Lab
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
            📋 Create Playbook
          </h4>
          <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
            Design and test software workflows
          </p>
          <button style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Create Playbook
          </button>
        </div>
      </div>
    </div>
  );
}
