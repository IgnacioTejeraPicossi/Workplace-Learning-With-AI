import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import ActionDispatchModal from './components/ActionDispatchModal';
import AgentOpsRuns from './components/AgentOpsRuns';
import PromptPanel from './components/PromptPanel';
import { buildComplianceSpec } from './utils/complianceMapper';

const AIComplianceAgent = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [summary, setSummary] = useState('');
  const [risks, setRisks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);

  // Load saved document analyses
  useEffect(() => {
    loadDocumentAnalyses();
  }, []);

  const loadDocumentAnalyses = async () => {
    try {
      // Use unified endpoint to get documents from both sources
      const response = await fetch('http://localhost:8000/api/unified-documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        console.log(`📋 Loaded ${data.documents?.length || 0} unified documents:`, data.sources);
      }
    } catch (error) {
      console.error('Failed to load unified documents:', error);
    }
  };

  const analyzeDocument = async (doc) => {
    console.log('🔍 analyzeDocument called with:', doc);
    setLoading(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Default baseline (native) outcome; can be overwritten by PromptPanel test
    setSummary('This document contains compliance requirements that need to be implemented in OutSystems applications.');
    setRisks([
      'Data Privacy Compliance',
      'Security Requirements',
      'Access Control Policies',
      'Audit Trail Requirements'
    ]);
    setSelectedDoc(doc);
    setLoading(false);
    
    console.log('✅ Analysis completed');
  };

  const handleSendToAgent = () => {
    setIsModalOpen(true);
  };

  const buildPayload = (destConfig) => {
    return buildComplianceSpec(
      selectedDoc?.title || 'Compliance Document',
      selectedDoc?.url || selectedDoc?.file_path,
      summary,
      risks,
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
          <span style={{ fontSize: '2.5rem' }}>🛡️</span>
          AI Compliance Agent
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#64748b',
          marginBottom: '0',
          lineHeight: '1.6'
        }}>
          Transform compliance documents into auditable team actions via OutSystems enterprise execution.
        </p>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* Left Panel - Document Selection */}
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
            <span style={{ fontSize: '1.75rem' }}>📄</span>
            Select Compliance Document
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <p style={{ 
              fontSize: '1rem', 
              color: '#64748b', 
              marginBottom: '12px',
              lineHeight: '1.5'
            }}>
              Choose from your saved document analyses:
            </p>
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
                const doc = documents.find(d => d.id === e.target.value);
                if (doc) {
                  setSelectedDoc(doc);
                  analyzeDocument(doc);
                } else {
                  setSelectedDoc(null);
                }
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
              <option value="">Select a document...</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.filename || 'Untitled Document'} 
                  {doc.source === 'document_analyzer' ? ' (📄 Doc)' : ' (🤖 RAG)'}
                </option>
              ))}
            </select>
          </div>

          {selectedDoc && (
            <div style={{
              backgroundColor: '#f1f5f9',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                Selected Document:
              </h3>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#64748b',
                margin: '0 0 12px 0'
              }}>
                {selectedDoc.title || selectedDoc.filename || 'Untitled Document'}
              </p>
              <button
                onClick={() => analyzeDocument(selectedDoc)}
                disabled={loading}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#059669';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#10b981';
                }}
              >
                {loading ? '⏳ Analyzing...' : '🔍 Analyze Document'}
              </button>
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
            <span style={{ fontSize: '1.75rem' }}>🔍</span>
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
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Analyzing document...</p>
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

          {risks.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '12px' 
              }}>
                Key Risks Identified:
              </h3>
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #fecaca'
              }}>
                {risks.map((risk, index) => (
                  <div key={index} style={{
                    padding: '8px 0',
                    fontSize: '0.95rem',
                    color: '#7f1d1d',
                    borderBottom: index < risks.length - 1 ? '1px solid #fecaca' : 'none',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ color: '#dc2626', marginRight: '8px' }}>⚠️</span>
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDoc && summary && risks.length > 0 && (
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
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              minHeight: '200px'
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '16px' 
              }}>
                Available Documents:
              </h3>
              {documents.length > 0 ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    ...(showAllDocs ? { maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' } : {})
                  }}>
                    {(showAllDocs ? documents : documents.slice(0, 4)).map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc);
                        analyzeDocument(doc);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#f1f5f9';
                        e.target.style.borderColor = '#3b82f6';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', marginRight: '12px' }}>📄</span>
                      <span style={{ 
                        fontSize: '0.9rem', 
                        color: '#374151',
                        flex: 1
                      }}>
                        {doc.title || doc.filename || 'Untitled Document'}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: '#64748b',
                        backgroundColor: doc.source === 'document_analyzer' ? '#e0f2fe' : '#f0fdf4',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginRight: '8px'
                      }}>
                        {doc.source === 'document_analyzer' ? '📄 Doc' : '🤖 RAG'}
                      </span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#64748b',
                        backgroundColor: '#e2e8f0',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        Click to analyze
                      </span>
                    </div>
                    ))}
                  </div>

                  {documents.length > 4 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                      <button
                        onClick={() => setShowAllDocs(!showAllDocs)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#f9fafb';
                          e.target.style.borderColor = '#3b82f6';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#ffffff';
                          e.target.style.borderColor = '#d1d5db';
                        }}
                      >
                        {showAllDocs ? 'Show less' : `Show all (${documents.length - 4} more)`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px'
                }}>
                  <span style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</span>
                  <p style={{ 
                    color: '#9ca3af', 
                    fontSize: '1rem',
                    textAlign: 'center',
                    margin: 0
                  }}>
                    No documents available. Upload documents in Document Analyzer first.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Manager (always available) */}
      <PromptPanel
        agent="compliance"
        colors={colors}
        nativePromptText={
          `Summarize a compliance document into a concise brief and list 3-5 key risks.
Return markdown in two sections:\n\nSummary:\n- ...\n\nKey Risks:\n- ...\n`}
        onUseResult={(r)=>{
          if (r?.summary) setSummary(r.summary);
          if (Array.isArray(r?.risks) && r.risks.length) setRisks(r.risks);
        }}
      />

      {/* Agent Runs Monitor */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <AgentOpsRuns />
      </div>

      {/* Action Dispatch Modal */}
      <ActionDispatchModal
        module="compliance"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        endpoint="/api/compliance/dispatch"
        buildPayload={buildPayload}
      />
    </div>
  );
};

export default AIComplianceAgent;
