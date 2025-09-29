import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import ActionDispatchModal from './components/ActionDispatchModal';
import AgentOpsRuns from './components/AgentOpsRuns';
import { buildProductivitySpec } from './utils/productivityMapper';

const AIProductivityAgent = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [summary, setSummary] = useState('');
  const [nextActions, setNextActions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  // Load saved Agentic RAG analyses
  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/agentic-rag/get-analyses');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    }
  };

  const analyzeUrl = async () => {
    if (!inputUrl.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/agentic-rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Analyze this URL and provide a summary with top 5 actionable next steps: ${inputUrl}`,
          url: inputUrl
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSummary(result.summary || '');
        
        // Extract next actions from the response
        const actions = result.next_actions || [];
        if (actions.length === 0 && result.response) {
          // Try to extract actions from the response text
          const actionMatches = result.response.match(/(\d+\.\s*[^\n]+)/g);
          if (actionMatches) {
            setNextActions(actionMatches.slice(0, 5).map((action, index) => ({
              title: action.replace(/^\d+\.\s*/, ''),
              detail: `Action ${index + 1} extracted from analysis`,
              assignee: null
            })));
          }
        } else {
          setNextActions(actions);
        }
        
        setSelectedAnalysis({
          title: `Analysis of ${inputUrl}`,
          url: inputUrl,
          summary: result.summary || result.response
        });
      }
    } catch (error) {
      console.error('Failed to analyze URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectExistingAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setSummary(analysis.summary || '');
    setNextActions(analysis.next_actions || []);
  };

  const handleSendToAgent = () => {
    setIsModalOpen(true);
  };

  const buildPayload = (destConfig) => {
    return buildProductivitySpec(
      selectedAnalysis?.title || 'Productivity Analysis',
      selectedAnalysis?.url || selectedAnalysis?.primary_url,
      summary,
      nextActions,
      destConfig.jira,
      destConfig.slack,
      destConfig.sheets
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: '32px',
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '700', 
          color: '#1e293b',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🚀</span>
          AI Productivity Agent
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#64748b',
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          Convert research briefs and competitive analysis into actionable team tasks with enterprise-grade execution.
        </p>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* Left Panel - Input & Selection */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.75rem' }}>🔍</span>
            Research Input
          </h2>
          
          {/* URL Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '1rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '12px'
            }}>
              Analyze URL:
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={analyzeUrl}
                disabled={loading || !inputUrl.trim()}
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading || !inputUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputUrl.trim() ? 0.6 : 1,
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  if (!loading && inputUrl.trim()) {
                    e.target.style.backgroundColor = '#7c3aed';
                    e.target.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && inputUrl.trim()) {
                    e.target.style.backgroundColor = '#8b5cf6';
                    e.target.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {loading ? '⏳' : '🚀'}
              </button>
            </div>
          </div>

          {/* Existing Analyses */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '1rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '12px'
            }}>
              Or select from existing analyses:
            </label>
            <select 
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onChange={(e) => {
                const analysis = analyses.find(a => a.id === e.target.value);
                if (analysis) selectExistingAnalysis(analysis);
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select an analysis...</option>
              {analyses.map(analysis => (
                <option key={analysis.id} value={analysis.id}>
                  {analysis.title || analysis.query || 'Untitled Analysis'}
                </option>
              ))}
            </select>
          </div>

          {selectedAnalysis && (
            <div style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginTop: '20px'
            }}>
              <h3 style={{ 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Selected Analysis:
              </h3>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#64748b',
                margin: 0
              }}>
                {selectedAnalysis.title}
              </p>
            </div>
          )}
        </div>

        {/* Right Panel - Analysis Results */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.75rem' }}>📋</span>
            AI Analysis Results
          </h2>

          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Analyzing content...</p>
            </div>
          )}

          {summary && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '12px' 
              }}>
                Summary:
              </h3>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '0.95rem',
                color: '#64748b',
                lineHeight: '1.6',
                border: '1px solid #e2e8f0'
              }}>
                {summary}
              </div>
            </div>
          )}

          {nextActions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '12px' 
              }}>
                Top 5 Next Actions:
              </h3>
              <div style={{
                backgroundColor: '#f0f9ff',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #bae6fd'
              }}>
                {nextActions.map((action, index) => (
                  <div key={index} style={{
                    padding: '12px 0',
                    fontSize: '0.95rem',
                    color: '#1e40af',
                    borderBottom: index < nextActions.length - 1 ? '1px solid #bae6fd' : 'none',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ 
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {index + 1}
                      </span>
                      {action.title}
                    </div>
                    {action.detail && (
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#64748b', 
                        marginLeft: '28px',
                        lineHeight: '1.4'
                      }}>
                        {action.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary && nextActions.length > 0 && (
            <button
              onClick={handleSendToAgent}
              style={{
                width: '100%',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '16px 20px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.1)';
              }}
            >
              🚀 Send to OutSystems Agent
            </button>
          )}

          {!summary && !loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</span>
              <p style={{ 
                color: '#9ca3af', 
                fontSize: '1rem',
                textAlign: 'center',
                margin: 0
              }}>
                Enter a URL or select an analysis to view results
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Runs Monitor */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#1e293b',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.75rem' }}>📊</span>
          Agent Runs Monitor
        </h2>
        <AgentOpsRuns />
      </div>

      {/* Action Dispatch Modal */}
      <ActionDispatchModal
        module="productivity"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        endpoint="/api/productivity/dispatch"
        buildPayload={buildPayload}
      />
    </div>
  );
};

export default AIProductivityAgent;
