import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { fetchWithAuth } from './api';

export default function JMessagesPairsLibrary() {
  const { colors } = useTheme();
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPair, setSelectedPair] = useState(null);
  const [isImportMode, setIsImportMode] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'overlay'
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('training'); // 'analyzed' or 'training'
  const [originalFile, setOriginalFile] = useState(null);
  const [humanAnalyzedFile, setHumanAnalyzedFile] = useState(null);
  const [importingOriginal, setImportingOriginal] = useState(false);
  const [importingHuman, setImportingHuman] = useState(false);
  const [filters, setFilters] = useState({
    has_human: null,
    has_ai: null,
    evaluated: null
  });
  const [stats, setStats] = useState(null);
  const [promptSuggestion, setPromptSuggestion] = useState(null);
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const loadTrainingPairs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.append('j_id', query);
      if (filters.has_human !== null) params.append('has_human', filters.has_human);
      if (filters.has_ai !== null) params.append('has_ai', filters.has_ai);
      if (filters.evaluated !== null) params.append('evaluated', filters.evaluated);
      
      const resp = await fetchWithAuth(`/api/j-messages/training?${params.toString()}`);
      const data = await resp.json();
      if (data.success) {
        setPairs(data.items || []);
      } else {
        setError('Failed to load training pairs');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const resp = await fetchWithAuth('/api/j-messages/training/stats/summary');
      const data = await resp.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  // Epic 3: Evaluation functions
  const [evaluating, setEvaluating] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});

  const runEvaluation = async (pairId, event) => {
    // Prevent card click event
    if (event) event.stopPropagation();
    
    try {
      setEvaluating(prev => ({ ...prev, [pairId]: true }));
      setError('');
      
      const resp = await fetchWithAuth(`/api/j-messages/training/${pairId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await resp.json();
      
      if (data.success) {
        // Store evaluation result
        setEvaluationResults(prev => ({ ...prev, [pairId]: data }));
        
        // Reload pairs to get updated data
        if (tab === 'training') {
          await loadTrainingPairs();
        }
        
        // Show success message briefly
        setTimeout(() => {
          setEvaluationResults(prev => {
            const updated = { ...prev };
            delete updated[pairId];
            return updated;
          });
        }, 3000);
      } else {
        setError(`Evaluation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      setError(`Error running evaluation: ${String(e)}`);
    } finally {
      setEvaluating(prev => ({ ...prev, [pairId]: false }));
    }
  };

  const handleDelete = async (pairId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this training pair? This action cannot be undone.')) {
      return;
    }
    
    try {
      const resp = await fetchWithAuth(`/api/j-messages/training/${pairId}`, {
        method: 'DELETE'
      });
      
      if (resp.ok) {
        // Remove from local state
        setPairs(prev => prev.filter(p => p.id !== pairId));
        setSelectedPair(null);
        loadStats();
      } else {
        const data = await resp.json();
        setError(`Failed to delete pair: ${data.detail || 'Unknown error'}`);
      }
    } catch (e) {
      setError(`Error deleting pair: ${String(e)}`);
    }
  };

  const getEvaluationStatus = (pair) => {
    if (!pair.evaluation) return null;
    
    const accuracy = pair.evaluation.overall_score || pair.evaluation.metrics?.overall_accuracy || 0;
    
    let color = '#dc2626'; // red
    let label = 'Poor';
    
    if (accuracy >= 0.9) {
      color = '#22c55e'; // green
      label = 'Excellent';
    } else if (accuracy >= 0.7) {
      color = '#3b82f6'; // blue
      label = 'Good';
    } else if (accuracy >= 0.5) {
      color = '#f59e0b'; // orange
      label = 'Fair';
    }
    
    return { accuracy, color, label };
  };

  const generatePromptSuggestion = async (numExamples = 5, focusOnErrors = true) => {
    try {
      setGeneratingSuggestion(true);
      setError('');
      
      const resp = await fetchWithAuth('/api/j-messages/training/prompt/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_examples: numExamples,
          focus_on_errors: focusOnErrors
        })
      });
      
      const data = await resp.json();
      
      if (data.success) {
        setPromptSuggestion(data.suggestion);
        setShowSuggestionModal(true);
      } else {
        setError(`Failed to generate suggestion: ${data.detail || 'Unknown error'}`);
      }
    } catch (e) {
      setError(`Error generating prompt suggestion: ${String(e)}`);
    } finally {
      setGeneratingSuggestion(false);
    }
  };

  const loadAnalyzedDocs = async () => {
    try {
      setLoading(true);
      const resp = await fetchWithAuth('/api/j-messages/list');
      const data = await resp.json();
      if (data.success) {
        // Show all analyzed documents
        const pairsData = (data.items || []).map(item => ({
          id: item.id,
          j_id: item.j_id,
          title: item.title,
          status: item.status,
          created_at: item.created_at,
          human_structured: {
            metadata: {
              j_id: item.j_id,
              title: item.title,
              status: item.status,
              valid_from: item.valid_from,
              valid_to: item.valid_to,
              categories: item.categories
            },
            toc: item.toc,
            body_html: item.body_html
          },
          original: {
            text_excerpt: item.raw_text
          }
        }));
        setPairs(pairsData);
      } else {
        setError('Failed to load analyzed documents');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'training') {
      loadTrainingPairs();
      loadStats();
    } else {
      loadAnalyzedDocs();
    }
  }, [tab, filters]);

  const handleRefresh = () => {
    if (tab === 'training') {
      loadTrainingPairs();
      loadStats();
    } else {
      loadAnalyzedDocs();
    }
  };

  const filtered = pairs.filter((p) => {
    const searchText = `${p.j_id || ''} ${p.title || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const highlightDifferences = (humanHtml, aiHtml) => {
    if (!humanHtml || !aiHtml) return aiHtml;
    
    // Extraer texto plano de ambos HTML
    const tempDiv1 = document.createElement('div');
    const tempDiv2 = document.createElement('div');
    tempDiv1.innerHTML = humanHtml;
    tempDiv2.innerHTML = aiHtml;
    
    const humanText = (tempDiv1.textContent || tempDiv1.innerText || '').trim();
    const aiText = (tempDiv2.textContent || tempDiv2.innerText || '').trim();
    
    if (humanText === aiText) return aiHtml;
    
    // Comparar palabra por palabra
    const humanWords = humanText.split(/\s+/);
    const aiWords = aiText.split(/\s+/);
    const humanWordSet = new Set(humanWords.map(w => w.toLowerCase()));
    
    // Marcar palabras diferentes en el HTML de AI
    let result = aiHtml;
    const processedIndices = new Set();
    
    aiWords.forEach((word) => {
      if (word && !humanWordSet.has(word.toLowerCase())) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
        let match;
        let searchStart = 0;
        
        while ((match = regex.exec(result.substring(searchStart))) !== null) {
          const actualIndex = searchStart + match.index;
          
          // Verificar que no estemos dentro de un tag HTML
          const beforeMatch = result.substring(0, actualIndex);
          const lastTag = beforeMatch.lastIndexOf('<');
          const lastTagClose = beforeMatch.lastIndexOf('>');
          
          if (lastTag <= lastTagClose) {
            // No estamos dentro de un tag, resaltar
            const before = result.substring(0, actualIndex);
            const after = result.substring(actualIndex + match[0].length);
            result = before + 
              `<span style="background-color: #fee2e2; color: #dc2626; font-weight: 600;">${match[0]}</span>` + 
              after;
            searchStart = actualIndex + match[0].length + 100; // Saltar el span agregado
            break;
          } else {
            searchStart = actualIndex + match[0].length;
          }
        }
      }
    });
    
    return result;
  };

  const handleOriginalFileSelect = async (file) => {
    if (!file || !selectedPair) return;
    setImportingOriginal(true);
    setError('');
    
    try {
      const form = new FormData();
      form.append('file', file);
      
      // Analyze the original document
      const resp = await fetchWithAuth('/api/j-messages/analyze?complexity=low', {
        method: 'POST',
        body: form
      });
      
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Failed to analyze document: ${txt}`);
      }
      
      const analysisResult = await resp.json();
      
      // Update the pair with original document
      const updateResp = await fetchWithAuth(`/api/j-messages/training/${selectedPair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original: {
            doc_type: file.name.endsWith('.docx') ? 'docx' : 'pdf',
            text_excerpt: analysisResult.raw_text || ''
          }
        })
      });
      
      if (!updateResp.ok) {
        throw new Error('Failed to update pair');
      }
      
      // Reload the pair
      const pairResp = await fetchWithAuth(`/api/j-messages/training/${selectedPair.id}`);
      const pairData = await pairResp.json();
      if (pairData.success) {
        setSelectedPair(pairData.item);
        setOriginalFile(null);
      }
    } catch (e) {
      setError(`Failed to import original document: ${String(e)}`);
    } finally {
      setImportingOriginal(false);
    }
  };

  const handleHumanAnalyzedFileSelect = async (file) => {
    if (!file || !selectedPair) return;
    setImportingHuman(true);
    setError('');
    
    try {
      const form = new FormData();
      form.append('file', file);
      
      // Analyze the human-analyzed document
      const resp = await fetchWithAuth('/api/j-messages/analyze?complexity=low', {
        method: 'POST',
        body: form
      });
      
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Failed to analyze document: ${txt}`);
      }
      
      const analysisResult = await resp.json();
      
      // Update the pair with human-analyzed document
      const updateResp = await fetchWithAuth(`/api/j-messages/training/${selectedPair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          human_structured: {
            metadata: {
              j_id: analysisResult.id,
              title: analysisResult.title,
              status: analysisResult.status,
              valid_from: analysisResult.valid_from,
              valid_to: analysisResult.valid_to,
              category: analysisResult.category || [],
              area: analysisResult.area || []
            },
            toc: analysisResult.toc || [],
            body_html: analysisResult.body_html || ''
          }
        })
      });
      
      if (!updateResp.ok) {
        throw new Error('Failed to update pair');
      }
      
      // Reload the pair
      const pairResp = await fetchWithAuth(`/api/j-messages/training/${selectedPair.id}`);
      const pairData = await pairResp.json();
      if (pairData.success) {
        setSelectedPair(pairData.item);
        setHumanAnalyzedFile(null);
      }
    } catch (e) {
      setError(`Failed to import human-analyzed document: ${String(e)}`);
    } finally {
      setImportingHuman(false);
    }
  };

  const FileUpload = ({ label, file, setFile, onFileSelect, isUploading, setError }) => {
    const [dragActive, setDragActive] = useState(false);
    
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
      if (e.type === 'dragleave') setDragActive(false);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length > 0) {
        const f = files[0];
        const name = (f?.name || '').toLowerCase();
        if (f && (name.endsWith('.docx') || name.endsWith('.pdf'))) {
          setFile(f);
          onFileSelect(f);
        } else {
          setError('Please drop a .docx or .pdf file');
        }
      }
    };
    
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: colors.text }}>
          {label}
        </div>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-input-${label.replace(/\s+/g, '-')}`).click()}
          style={{
            border: `2px dashed ${dragActive ? colors.primary : colors.border}`,
            borderRadius: 8,
            padding: '16px',
            textAlign: 'center',
            background: dragActive ? colors.primaryLight : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
          <div style={{ fontWeight: 600, color: colors.text }}>
            {dragActive ? 'Drop file here' : 'Drag & drop file here or click to browse'}
          </div>
          <div style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
            Supports DOCX/PDF (single file)
          </div>
          {file && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
              Selected: <strong>{file.name}</strong>
            </div>
          )}
          {isUploading && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.primary }}>
              ⏳ Uploading and analyzing...
            </div>
          )}
        </div>
        <input
          id={`file-input-${label.replace(/\s+/g, '-')}`}
          type="file"
          accept=".docx,.pdf"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            if (selectedFile) {
              setFile(selectedFile);
              onFileSelect(selectedFile);
            }
          }}
          style={{ display: 'none' }}
        />
      </div>
    );
  };

  const renderSideBySide = (pair) => {
    // Extract original text (supports both old and new format)
    const originalText = pair.original?.text_excerpt || pair.original || '';
    
    // Extract analyzed HTML (supports both old and new format)
    const analyzedHtml = pair.human_structured?.body_html || pair.analyzed || '';
    
    // Extract AI-generated HTML if available
    const aiHtml = pair.ai_structured?.body_html || null;
    
    return (
      <div style={{ display: 'flex', gap: 16, height: '600px' }}>
        {/* Original Document */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: colors.primaryLight, 
            padding: 12,
            borderBottom: `1px solid ${colors.border}`,
            fontWeight: 600,
            color: colors.primary
          }}>
            📄 Original Document
          </div>
          <div style={{ 
            flex: 1, 
            padding: 16, 
            overflow: 'auto',
            background: colors.background,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {isImportMode && (
              <FileUpload
                label="Import Original Document"
                file={originalFile}
                setFile={setOriginalFile}
                onFileSelect={handleOriginalFileSelect}
                isUploading={importingOriginal}
                setError={setError}
              />
            )}
            <div style={{ 
              flex: 1,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.6,
              overflow: 'auto'
            }}>
              {originalText || '(No original text available)'}
            </div>
          </div>
        </div>

        {/* Human-Analyzed Document */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: '#d1fae5', 
            padding: 12,
            borderBottom: `1px solid ${colors.border}`,
            fontWeight: 600,
            color: '#065f46'
          }}>
            ✨ Human-Analyzed Document
          </div>
          <div style={{ 
            flex: 1, 
            padding: 16, 
            overflow: 'auto',
            background: colors.background,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {isImportMode && (
              <FileUpload
                label="Import Human-Analyzed Document"
                file={humanAnalyzedFile}
                setFile={setHumanAnalyzedFile}
                onFileSelect={handleHumanAnalyzedFileSelect}
                isUploading={importingHuman}
                setError={setError}
              />
            )}
            <div style={{ 
              flex: 1,
              overflow: 'auto'
            }}>
              {analyzedHtml ? (
                <div dangerouslySetInnerHTML={{ __html: analyzedHtml }} />
              ) : (
                <div style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                  (No analyzed content available)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI-Analyzed Document (if available) */}
        {aiHtml && (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            border: `2px solid #fbbf24`,
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <div style={{ 
              background: '#fef3c7', 
              padding: 12,
              borderBottom: `2px solid #fbbf24`,
              fontWeight: 600,
              color: '#92400e'
            }}>
              🤖 AI-Analyzed Document (Current Prompt)
            </div>
            <div style={{ 
              flex: 1, 
              padding: 16, 
              overflow: 'auto',
              background: colors.background
            }}>
              <div dangerouslySetInnerHTML={{ __html: highlightDifferences(analyzedHtml, aiHtml) }} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: colors.text, margin: 0, marginBottom: 8 }}>
            📚 J-messages pairs Library
          </h1>
          <p style={{ color: colors.textSecondary, margin: 0, fontSize: 14 }}>
            Compare original documents with AI-analyzed versions side by side. 
            This data will be used to improve future analysis prompts.
          </p>
        </div>

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 16,
          flex: '1 1 200px'
        }}>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Total Pairs
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: colors.primary }}>
            {pairs.length}
          </div>
        </div>
        <div style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 16,
          flex: '1 1 200px'
        }}>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Selected for Review
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#22c55e' }}>
            {selectedPair ? 1 : 0}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by ID, title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: '8px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            background: colors.cardBackground,
            color: colors.text
          }}
        />
        <button
          onClick={handleRefresh}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          🔄 Refresh
        </button>
        <button
          onClick={() => generatePromptSuggestion(5, true)}
          disabled={generatingSuggestion || tab === 'analyzed'}
          style={{
            background: generatingSuggestion ? colors.textSecondary : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: generatingSuggestion || tab === 'analyzed' ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            opacity: tab === 'analyzed' ? 0.5 : 1
          }}
          title={tab === 'analyzed' ? 'Switch to Training Pairs tab to generate suggestions' : 'Generate AI-powered prompt improvement suggestions'}
        >
          {generatingSuggestion ? '⏳ Generating...' : '💡 Suggest Prompt Improvements'}
        </button>
      </div>

      {loading && <div style={{ color: colors.textSecondary }}>Loading pairs...</div>}
      {error && <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {/* Pairs List */}
      {!selectedPair ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((pair) => (
            <div
              key={pair.id}
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': { borderColor: colors.primary }
              }}
              onClick={() => {
                setIsImportMode(false);
                setSelectedPair(pair);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: colors.primary, marginBottom: 4 }}>
                    {pair.title}
                  </div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
                    {pair.j_id} • {pair.status || 'N/A'} • {pair.created_at ? new Date(pair.created_at).toLocaleDateString('no-NO') : 'N/A'}
                  </div>
                  
                  {/* Categories and Evaluation Status */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(() => {
                      const categories = pair.human_structured?.metadata?.categories || pair.metadata?.categories || [];
                      return categories.map((cat, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: colors.primaryLight,
                            color: colors.primary,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11
                          }}
                        >
                          {cat}
                        </span>
                      ));
                    })()}
                    
                    {/* Evaluation Status Badge */}
                    {(() => {
                      const evalStatus = getEvaluationStatus(pair);
                      return evalStatus && (
                        <span style={{
                          background: evalStatus.color + '20',
                          color: evalStatus.color,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span>📊</span>
                          {evalStatus.label}: {(evalStatus.accuracy * 100).toFixed(0)}%
                        </span>
                      );
                    })()}
                    
                    {/* Evaluation in Progress */}
                    {evaluating[pair.id] && (
                      <span style={{
                        background: '#3b82f620',
                        color: '#3b82f6',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span className="spinner" style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          border: '2px solid #3b82f6',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></span>
                        Evaluating...
                      </span>
                    )}
                    
                    {/* Success Message */}
                    {evaluationResults[pair.id] && (
                      <span style={{
                        background: '#22c55e20',
                        color: '#22c55e',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        ✓ Evaluation complete!
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginLeft: 12 }}>
                  {tab === 'training' && (
                    <>
                      <button
                        onClick={(e) => runEvaluation(pair.id, e)}
                        disabled={evaluating[pair.id]}
                        style={{
                          background: evaluating[pair.id] ? colors.border : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          cursor: evaluating[pair.id] ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                          opacity: evaluating[pair.id] ? 0.6 : 1
                        }}
                        title="Run AI evaluation on this pair"
                      >
                        {evaluating[pair.id] ? '⏳' : '🤖'} Evaluate
                      </button>
                      <button
                        onClick={(e) => handleDelete(pair.id, e)}
                        style={{
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                        title="Delete this training pair"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsImportMode(true);
                          setSelectedPair(pair);
                        }}
                        style={{
                          background: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                        title="Import this pair"
                      >
                        📥 Import Pair
                      </button>
                    </>
                  )}
                  <div style={{ 
                    color: colors.primary,
                    fontSize: 20
                  }}>
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: 48, 
              color: colors.textSecondary 
            }}>
              {query ? 'No pairs found matching your search' : 'No document pairs available yet'}
            </div>
          )}
        </div>
      ) : (
        /* Pair Comparison View */
        <div>
          {/* Back button and metadata */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => {
                setSelectedPair(null);
                setIsImportMode(false);
                setOriginalFile(null);
                setHumanAnalyzedFile(null);
              }}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                color: colors.text,
                marginBottom: 12
              }}
            >
              ← Back to list
            </button>
            {isImportMode && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 14,
                color: '#92400e'
              }}>
                <strong>📥 Import Mode:</strong> Select files to import for Original Document and Human-Analyzed Document
              </div>
            )}
            <div style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <h2 style={{ margin: 0, marginBottom: 8, color: colors.primary }}>
                {selectedPair.title}
              </h2>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
                {selectedPair.j_id} • {selectedPair.status || 'N/A'}
              </div>
              {(() => {
                const summary = selectedPair.human_structured?.metadata?.summary || selectedPair.metadata?.summary || '';
                return summary && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 12, 
                    background: colors.primaryLight,
                    borderRadius: 6,
                    fontSize: 13,
                    color: colors.text
                  }}>
                    <strong>Summary:</strong> {summary}
                  </div>
                );
              })()}
            </div>
            
            {/* Evaluation Metrics (if available) */}
            {selectedPair.evaluation && (
              <div style={{
                background: colors.cardBackground,
                border: `2px solid ${getEvaluationStatus(selectedPair)?.color || colors.border}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16
              }}>
                <h3 style={{ margin: 0, marginBottom: 12, color: colors.text, fontSize: 16 }}>
                  📊 Evaluation Results
                </h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>Overall Accuracy</div>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 600, 
                      color: getEvaluationStatus(selectedPair)?.color || colors.text 
                    }}>
                      {((selectedPair.evaluation.overall_score || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>Evaluated</div>
                    <div style={{ fontSize: 14, color: colors.text }}>
                      {selectedPair.evaluation.last_evaluated_at 
                        ? new Date(selectedPair.evaluation.last_evaluated_at).toLocaleDateString('no-NO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Field-by-field accuracy */}
                {selectedPair.evaluation.metrics?.field_accuracy && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: colors.text }}>
                      Field Accuracy:
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(selectedPair.evaluation.metrics.field_accuracy).map(([field, accuracy]) => {
                        let color = '#dc2626';
                        if (accuracy >= 0.9) color = '#22c55e';
                        else if (accuracy >= 0.7) color = '#3b82f6';
                        else if (accuracy >= 0.5) color = '#f59e0b';
                        
                        return (
                          <div
                            key={field}
                            style={{
                              background: color + '20',
                              color: color,
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500
                            }}
                          >
                            {field}: {(accuracy * 100).toFixed(0)}%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                {selectedPair.evaluation.metrics?.evaluation_summary && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: colors.background,
                    borderRadius: 6,
                    fontSize: 13,
                    color: colors.textSecondary
                  }}>
                    {selectedPair.evaluation.metrics.evaluation_summary}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side by side comparison */}
          {renderSideBySide(selectedPair)}

          {/* Future improvement notes */}
          <div style={{
            marginTop: 16,
            padding: 16,
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: 8,
            fontSize: 13
          }}>
            <strong>💡 AI Training Note:</strong> This comparison will be used to improve 
            future document analysis. The system will learn from the differences between 
            original and analyzed content to enhance prompt engineering.
          </div>
        </div>
      )}

      {/* Prompt Suggestion Modal */}
      {showSuggestionModal && promptSuggestion && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setShowSuggestionModal(false)}
        >
          <div
            style={{
              background: colors.cardBackground,
              borderRadius: 12,
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              borderBottom: `1px solid ${colors.border}`,
              padding: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                💡 AI-Generated Prompt Suggestion
              </h2>
              <button
                onClick={() => setShowSuggestionModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24 }}>
              {/* Info Banner */}
              <div style={{
                background: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                fontSize: 14
              }}>
                <strong>📊 Based on:</strong> {promptSuggestion.num_examples} training examples
                {' • '}
                <strong>Generated:</strong> {new Date(promptSuggestion.generated_at).toLocaleString()}
              </div>

              {/* Notes Section */}
              {promptSuggestion.notes && promptSuggestion.notes.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: colors.text, marginBottom: 12 }}>🔍 Key Improvements:</h3>
                  <ul style={{ 
                    color: colors.text, 
                    lineHeight: '1.8',
                    paddingLeft: 20,
                    margin: 0
                  }}>
                    {promptSuggestion.notes.map((note, idx) => (
                      <li key={idx} style={{ marginBottom: 8 }}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Prompt */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <h3 style={{ color: colors.text, margin: 0 }}>✨ Suggested Prompt:</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(promptSuggestion.suggested_prompt);
                      alert('Prompt copied to clipboard!');
                    }}
                    style={{
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
                <pre style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 13,
                  lineHeight: '1.6',
                  overflowX: 'auto',
                  color: colors.text,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {promptSuggestion.suggested_prompt}
                </pre>
              </div>

              {/* Original Prompt (Collapsible) */}
              <details style={{ marginBottom: 16 }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  color: colors.textSecondary,
                  fontWeight: 500,
                  marginBottom: 8
                }}>
                  🔄 Compare with Original Prompt
                </summary>
                <pre style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 13,
                  lineHeight: '1.6',
                  overflowX: 'auto',
                  color: colors.textSecondary,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  marginTop: 8
                }}>
                  {promptSuggestion.original_prompt}
                </pre>
              </details>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                marginTop: 24,
                paddingTop: 24,
                borderTop: `1px solid ${colors.border}`
              }}>
                <button
                  onClick={() => setShowSuggestionModal(false)}
                  style={{
                    background: colors.cardBackground,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promptSuggestion.suggested_prompt);
                    setShowSuggestionModal(false);
                    alert('Prompt copied! You can now paste it into the Prompt Manager.');
                  }}
                  style={{
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  💾 Copy & Use in Prompt Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

