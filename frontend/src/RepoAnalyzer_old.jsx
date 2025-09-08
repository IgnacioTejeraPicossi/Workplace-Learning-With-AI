import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ArchitectureDiagram from './ArchitectureDiagram';
import './RepoAnalyzer.css';

export default function RepoAnalyzer() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([]);
  const [detectingBranch, setDetectingBranch] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Helper function to safely access nested properties
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch (error) {
      console.warn('Error accessing property:', path, error);
      return defaultValue;
    }
  };

  // Load templates on component mount
  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/repo-templates');
      setTemplates(response.data.templates);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleTemplateSelect = (template) => {
    setRepoUrl(template.url);
    setBranch(template.branch);
    setSelectedTemplate(template.name);
    setAvailableBranches([]);
  };

  const detectBranches = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL first');
      return;
    }

    setDetectingBranch(true);
    setError(null);
    setAvailableBranches([]);

    try {
      const encodedUrl = encodeURIComponent(repoUrl);
      const response = await axios.get(`/api/detect-branch/${encodedUrl}`);
      
      setAvailableBranches(response.data.available_branches);
      if (response.data.default_branch && !branch) {
        setBranch(response.data.default_branch);
      }
      
      // Show success message
      setError(null);
    } catch (err) {
      setError('Could not detect branches. You can still try with a specific branch name.');
      console.error('Error detecting branches:', err);
    } finally {
      setDetectingBranch(false);
    }
  };

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await axios.post('/api/analyze-repo', {
        repo_url: repoUrl,
        branch: branch || null  // Send null if branch is empty to auto-detect
      });
      
      // Log the response structure for debugging
      console.log('Analysis response structure:', response.data);
      console.log('Documentation structure:', response.data?.documentation);
      
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error analyzing repository');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocumentation = async () => {
    if (!analysisResult) return;

    try {
      const response = await axios.post('/api/generate-documentation', {
        summaries: analysisResult.summaries,
        repo_name: analysisResult.repo_name,
        format: 'both', // Generate both markdown and PDF
        insights: analysisResult.insights,
        architecture: analysisResult.architecture,
        analysis_id: analysisResult.analysis_id
      });
      
      // Update the analysis result with documentation
      setAnalysisResult(prev => ({
        ...prev,
        documentation: response.data
      }));
    } catch (err) {
      setError('Error generating documentation: ' + err.message);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!analysisResult?.documentation?.markdown) {
      setError('No documentation available. Please generate documentation first.');
      return;
    }

    try {
      const response = await axios.post('/api/generate-quiz', {
        markdown_content: analysisResult.documentation.markdown,
        num_questions: 5,
        difficulty: 'medium',
        analysis_id: analysisResult.analysis_id
      });
      
      // Update the analysis result with quiz
      setAnalysisResult(prev => ({
        ...prev,
        quiz: response.data.quiz
      }));
    } catch (err) {
      setError('Error generating quiz: ' + err.message);
    }
  };

  // Load saved analyses on component mount
  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const loadSavedAnalyses = async () => {
    try {
      setLoadingSaved(true);
      const response = await axios.get('/api/saved-analyses?limit=5');
      setSavedAnalyses(response.data.analyses);
    } catch (err) {
      console.error('Error loading saved analyses:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const loadAnalysis = async (analysisId) => {
    try {
      const response = await axios.get(`/api/saved-analyses/${analysisId}`);
      
      // Extract data from the saved analysis structure
      const savedAnalysis = response.data.analysis;
      const analysisData = savedAnalysis.analysis_data || {};
      
      // Reconstruct the original analysis result structure
      const reconstructedAnalysis = {
        repo_name: safeGet(savedAnalysis, 'repo_name', 'Unknown Repository'),
        branch_used: safeGet(savedAnalysis, 'branch_used', 'Unknown'),
        files_analyzed: safeGet(savedAnalysis, 'analysis_data.summaries') ? Object.keys(safeGet(savedAnalysis, 'analysis_data.summaries', {})).length : 0,
        summaries: safeGet(analysisData, 'summaries', {}),
        structure: safeGet(analysisData, 'structure', {}),
        insights: safeGet(analysisData, 'insights', {}),
        architecture: safeGet(analysisData, 'architecture', {}),
        analysis_id: safeGet(savedAnalysis, 'analysis_id', ''),
        documentation: safeGet(response.data, 'documentation.documentation', {}),
        quiz: safeGet(response.data, 'quiz.quiz_data', [])
      };
      
      setAnalysisResult(reconstructedAnalysis);
      setError(null);
    } catch (err) {
      setError('Error loading analysis: ' + err.message);
    }
  };

  const deleteAnalysis = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    
    try {
      await axios.delete(`/api/saved-analyses/${analysisId}`);
      await loadSavedAnalyses(); // Reload the list
      if (analysisResult?.analysis_id === analysisId) {
        setAnalysisResult(null);
      }
    } catch (err) {
      setError('Error deleting analysis: ' + err.message);
    }
  };

  return (
    <div className="repo-analyzer-container">
      <div className="analyzer-header">
        <h1>Repository Documentation Generator</h1>
        <p>Analyze Git repositories and generate comprehensive documentation with AI-powered insights. Get detailed analysis including architecture patterns, code quality assessment, and learning modules.</p>
      </div>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2rem', 
        borderRadius: '8px', 
        marginBottom: '2rem' 
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Repository Analysis</h2>
        
        {/* Quick Templates */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Quick Templates</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: selectedTemplate === template.name ? '#007bff' : '#fff',
                  color: selectedTemplate === template.name ? '#fff' : '#333',
                  cursor: 'pointer'
                }}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* Repository URL Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Repository URL:
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Branch Detection and Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Branch (optional - will auto-detect):
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Leave empty for auto-detection"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <button
              onClick={detectBranches}
              disabled={detectingBranch || !repoUrl.trim()}
              style={{
                padding: '0.75rem 1rem',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: detectingBranch || !repoUrl.trim() ? 'not-allowed' : 'pointer',
                opacity: detectingBranch || !repoUrl.trim() ? 0.6 : 1
              }}
            >
              {detectingBranch ? '🔍 Detecting...' : '🔍 Detect Branches'}
            </button>
          </div>
          
          {/* Available Branches Display */}
          {availableBranches.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#e7f3ff', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Available Branches:</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableBranches.map((branchName, index) => (
                  <button
                    key={index}
                    onClick={() => setBranch(branchName)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      background: branch === branchName ? '#007bff' : '#fff',
                      color: branch === branchName ? '#fff' : '#007bff',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {branchName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: '0.75rem 2rem',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Analyzing...' : '🔍 Analyze Repository'}
        </button>

        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}
      </div>

            {/* Analysis Results */}
      {analysisResult && typeof analysisResult === 'object' && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            📊 Analysis Results: {safeGet(analysisResult, 'repo_name', 'Unknown Repository')}
          </h2>
          
          {/* Show warning if data structure is incomplete */}
          {!safeGet(analysisResult, 'summaries') && (
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              color: '#856404', 
              padding: '1rem', 
              borderRadius: '4px', 
              marginBottom: '1rem' 
            }}>
              ⚠️ Warning: Analysis data appears to be incomplete. Some features may not work properly.
            </div>
          )}
          
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '1px solid #ddd',
            marginBottom: '1rem'
          }}>
            <p><strong>Files Analyzed:</strong> {safeGet(analysisResult, 'files_analyzed', 0)}</p>
            <p><strong>Repository:</strong> {safeGet(analysisResult, 'repo_name', 'Unknown')}</p>
            <p><strong>Branch Used:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{safeGet(analysisResult, 'branch_used', 'Unknown')}</span></p>
            
            {/* Project Insights */}
            {safeGet(analysisResult, 'insights') && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#e7f3ff', borderRadius: '4px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>🔍 Project Insights</h4>
                <p><strong>Type:</strong> {safeGet(analysisResult, 'insights.project_type', 'Unknown')}</p>
                <p><strong>Language:</strong> {safeGet(analysisResult, 'insights.language', 'Unknown')}</p>
                <p><strong>Framework:</strong> {safeGet(analysisResult, 'insights.framework', 'Unknown')}</p>
                <p><strong>Architecture:</strong> {safeGet(analysisResult, 'insights.architecture_pattern', 'Unknown')}</p>
                <p><strong>Complexity Score:</strong> {safeGet(analysisResult, 'insights.complexity_score', 'Unknown')}</p>
                
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Components:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>Frontend: {safeGet(analysisResult, 'insights.has_frontend') ? '✅' : '❌'}</li>
                    <li>Backend: {safeGet(analysisResult, 'insights.has_backend') ? '✅' : '❌'}</li>
                    <li>Database: {safeGet(analysisResult, 'insights.has_database') ? '✅' : '❌'}</li>
                    <li>Tests: {safeGet(analysisResult, 'insights.has_tests') ? '✅' : '❌'}</li>
                    <li>Documentation: {safeGet(analysisResult, 'insights.has_docs') ? '✅' : '❌'}</li>
                    <li>Deployment Ready: {safeGet(analysisResult, 'insights.deployment_ready') ? '✅' : '❌'}</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* Architecture Overview */}
            {safeGet(analysisResult, 'architecture') && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>🏗️ Architecture Overview</h4>
                <p><strong>Total Components:</strong> {safeGet(analysisResult, 'architecture.components', []).length}</p>
                <p><strong>Dependencies:</strong> {safeGet(analysisResult, 'architecture.relationships', []).length}</p>
                
                {safeGet(analysisResult, 'architecture.layers') && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Layers:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      {Object.entries(safeGet(analysisResult, 'architecture.layers', {})).map(([layer, components]) => (
                        <li key={layer}>
                          {layer.charAt(0).toUpperCase() + layer.slice(1)}: {Array.isArray(components) ? components.length : 0} components
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Architecture Diagram */}
            {safeGet(analysisResult, 'architecture') && (
              <div style={{ marginTop: '1rem' }}>
                <ArchitectureDiagram architectureData={safeGet(analysisResult, 'architecture', {})} />
              </div>
            )}
          </div>

          {/* File Summaries */}
          <div style={{ marginBottom: '1rem' }}>
            <h3>📄 File Summaries</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(safeGet(analysisResult, 'summaries', {})).map(([filename, summary]) => (
                <div key={filename} style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>{filename}</h4>
                  <p style={{ margin: 0, lineHeight: '1.5' }}>{summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateDocumentation}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📝 Generate Documentation
            </button>
            
            {safeGet(analysisResult, 'documentation.markdown') && (
              <button
                onClick={handleGenerateQuiz}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🧠 Generate Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generated Documentation */}
                  {analysisResult?.documentation?.markdown && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>📚 Generated Documentation</h2>
          
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '1px solid #ddd',
            marginBottom: '1rem'
          }}>
            <h3>Markdown Preview</h3>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              background: '#f8f9fa', 
              padding: '1rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap'
            }}>
              {analysisResult.documentation.markdown.substring(0, 1000)}...
            </div>
            
            {safeGet(analysisResult, 'documentation.pdf_path') && (
              <div style={{ marginTop: '1rem' }}>
                <a 
                  href={`/api/download-pdf/${safeGet(analysisResult, 'documentation.pdf_path', '').split('/').pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                >
                  📄 Download PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Quiz */}
      {safeGet(analysisResult, 'quiz') && Array.isArray(safeGet(analysisResult, 'quiz')) && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>🧠 Generated Quiz</h2>
          
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '1px solid #ddd'
          }}>
            {safeGet(analysisResult, 'quiz', []).map((question, index) => (
              <div key={index} style={{ 
                marginBottom: '2rem', 
                padding: '1rem', 
                background: '#f8f9fa', 
                borderRadius: '4px' 
              }}>
                <h4 style={{ marginBottom: '1rem' }}>
                  Question {index + 1}: {question.question}
                </h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={{ marginBottom: '0.5rem' }}>
                      <label style={{ cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name={`question-${index}`} 
                          value={option}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    Show Answer
                  </summary>
                  <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#e7f3ff', borderRadius: '4px' }}>
                    <p><strong>Correct Answer:</strong> {question.correct_answer}</p>
                    <p><strong>Explanation:</strong> {question.explanation}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Analyses */}
      <div style={{ marginTop: '2rem' }}>
        <h2>💾 Saved Analyses</h2>
        {loadingSaved ? (
          <p>Loading saved analyses...</p>
        ) : savedAnalyses.length === 0 ? (
          <p>No saved analyses found. Analyze a repository to save it!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {savedAnalyses.map((analysis) => (
              <div key={analysis.analysis_id} style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>
                    Analysis ID: {analysis.analysis_id}
                  </h4>
                  <p><strong>Repository:</strong> {analysis.repo_name}</p>
                  <p><strong>Branch:</strong> {analysis.branch_used}</p>
                  <p><strong>Files Analyzed:</strong> {analysis.files_analyzed}</p>
                  <p><strong>Date:</strong> {new Date(analysis.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => loadAnalysis(analysis.analysis_id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Load Analysis
                  </button>
                  <button
                    onClick={() => deleteAnalysis(analysis.analysis_id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 