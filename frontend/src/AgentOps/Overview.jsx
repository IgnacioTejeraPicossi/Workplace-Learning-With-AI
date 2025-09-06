import React, { useState, useEffect } from 'react';
import { get } from './agentopsApi';

export default function Overview({ onRunExample, isLoading }) {
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
        get('/runs/summary'),
        get('/runs?limit=10')
      ]);
      setSummary(summaryData);
      setRecentRuns(runsData.items || []);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading overview data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
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
            {summary?.total_runs || 0}
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
            {summary?.status_counts?.done || 0}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Successful</div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
            {summary?.recent_runs_24h || 0}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Last 24h</div>
        </div>

        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
            {summary?.status_counts?.error || 0}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Failed</div>
        </div>
      </div>

      {/* Recent Runs Table */}
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
            Recent Runs
          </h3>
          <button
            onClick={loadData}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                  Run ID
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                  Started
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No runs yet. Start by creating a flow in the Flow Catalog.
                  </td>
                </tr>
              ) : (
                recentRuns.map((run) => (
                  <tr key={run._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {run._id.substring(0, 8)}...
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
                      {new Date(run.started_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {run.finished_at 
                        ? `${Math.round((new Date(run.finished_at) - new Date(run.started_at)) / 1000)}s`
                        : 'Running...'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Example Information */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#0c4a6e' }}>
          🎯 Example Workflow: "Web Research Agent"
        </h3>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0c4a6e' }}>
          This example demonstrates a complete n8n workflow that researches a website, extracts content,
          and generates a structured report using LM Studio AI.
        </p>
        <div style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>
          <p style={{ margin: '0 0 0.25rem 0' }}><strong>Workflow:</strong> Web Research → Content Extraction → AI Report Generation</p>
          <p style={{ margin: '0 0 0.25rem 0' }}><strong>Input:</strong> URL, topic, and research depth parameters</p>
          <p style={{ margin: '0' }}><strong>Output:</strong> Structured Markdown report with key insights</p>
        </div>
      </div>

      {/* Example Workflow Information */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#0c4a6e' }}>
          🎯 Example Workflow: "Web Research Agent"
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0c4a6e' }}>
          This example demonstrates a complete n8n workflow that researches topics using LM Studio and returns structured reports.
        </p>
        <div style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Workflow Steps:</strong></p>
          <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>1. Receive webhook with research topic and URL</li>
            <li>2. Fetch webpage content using HTTP Request</li>
            <li>3. Clean and process HTML to extract text</li>
            <li>4. Send to LM Studio for analysis and report generation</li>
            <li>5. Return structured Markdown report via callback</li>
          </ul>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Example Input:</strong></p>
          <div style={{
            backgroundColor: '#e0f2fe',
            border: '1px solid #0ea5e9',
            borderRadius: '0.25rem',
            padding: '0.75rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            {`{
  "url": "https://www.tetrapak.com/en",
  "topic": "Sustainable packaging for electronics",
  "depth": 2,
  "model": "qwen2.5-7b-instruct"
}`}
          </div>
          <p style={{ margin: '0' }}><strong>Output:</strong> Structured Markdown report with insights, analysis, and recommendations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '0.5rem',
        padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#0c4a6e' }}>
          🚀 Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.hash = '#agentops-flowcatalog'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            📋 Register New Flow
          </button>
          <button
            onClick={() => window.location.hash = '#agentops-runbuilder'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            🚀 Start New Run
          </button>
          <button
            onClick={() => window.location.hash = '#agentops-runs'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            📈 View All Runs
          </button>
        </div>
      </div>
    </div>
  );
}
