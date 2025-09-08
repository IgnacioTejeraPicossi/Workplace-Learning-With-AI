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

  const loadSavedAnalyses = async () => {
    setLoadingSaved(true);
    try {
      const response = await axios.get('/api/saved-analyses?limit=5');
      setSavedAnalyses(response.data.analyses || []);
    } catch (err) {
      console.error('Error loading saved analyses:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleLoadAnalysis = async (analysisId) => {
    try {
      const response = await axios.get(`/api/saved-analyses/${analysisId}`);
      setAnalysisResult(response.data);
      setError(null);
    } catch (err) {
      setError('Error loading analysis: ' + err.message);
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    try {
      await axios.delete(`/api/saved-analyses/${analysisId}`);
      setSavedAnalyses(prev => prev.filter(analysis => analysis.analysis_id !== analysisId));
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
      
      {/* Quick Templates */}
      <div className="quick-templates">
        <h3><span className="icon icon-rocket"></span> Quick Templates</h3>
        <div className="template-grid">
          {templates.map((template, index) => (
            <div
              key={index}
              className={`template-card ${selectedTemplate === template.name ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <h4>{template.name}</h4>
              <p>{template.description || `Repository: ${template.url.split('/').pop()}`}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Form */}
      <div className="analysis-form">
        <h3><span className="icon icon-search"></span> Repository Analysis</h3>
        
        <div className="form-group">
          <label>Repository URL:</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Branch (optional - will auto-detect):</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Leave empty for auto-detection"
            />
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={detectBranches}
            disabled={detectingBranch}
          >
            {detectingBranch ? <span className="spinner"></span> : <span className="icon icon-search"></span>}
            Detect Branches
          </button>
        </div>

        {availableBranches.length > 0 && (
          <div className="form-group">
            <label>Available Branches:</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {availableBranches.map((branchName, index) => (
                <button
                  key={index}
                  className={`btn ${branch === branchName ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setBranch(branchName)}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  {branchName}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          className="btn btn-primary" 
          onClick={handleAnalyze}
          disabled={loading}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {loading ? <span className="spinner"></span> : <span className="icon icon-search"></span>}
          {loading ? 'Analyzing...' : 'Analyze Repository'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="message error">
          <span className="icon icon-error"></span>
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <h3><span className="icon icon-check"></span> Analysis Results</h3>
          
          <div className="result-section">
            <h4>Repository Information</h4>
            <p><strong>Name:</strong> {analysisResult.repo_name}</p>
            <p><strong>Branch:</strong> {analysisResult.branch_used}</p>
            <p><strong>Files Analyzed:</strong> {analysisResult.files_analyzed}</p>
            <p><strong>Analysis Type:</strong> {analysisResult.analysis_type}</p>
            <p><strong>Quality Score:</strong> {Math.round((analysisResult.quality_score || 0) * 100)}%</p>
          </div>

          {analysisResult.structure && (
            <div className="result-section">
              <h4>Project Structure</h4>
              <p>{safeGet(analysisResult.structure, 'overview', 'No structure overview available')}</p>
            </div>
          )}

          {analysisResult.insights && (
            <div className="result-section">
              <h4>Key Insights</h4>
              <p>{safeGet(analysisResult.insights, 'summary', 'No insights available')}</p>
            </div>
          )}

          {analysisResult.architecture && (
            <div className="result-section">
              <h4>Architecture Analysis</h4>
              <p>{safeGet(analysisResult.architecture, 'overview', 'No architecture overview available')}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-success" onClick={handleGenerateDocumentation}>
              <span className="icon icon-folder"></span>
              Generate Documentation
            </button>
            <button className="btn btn-secondary" onClick={handleGenerateQuiz}>
              <span className="icon icon-robot"></span>
              Generate Quiz
            </button>
          </div>
        </div>
      )}

      {/* Saved Analyses */}
      <div className="saved-analyses">
        <h3><span className="icon icon-folder"></span> Saved Analyses</h3>
        {loadingSaved ? (
          <div className="loading">
            <span className="spinner"></span>
            Loading saved analyses...
          </div>
        ) : savedAnalyses.length > 0 ? (
          <div>
            {savedAnalyses.map((analysis) => (
              <div key={analysis.analysis_id} className="analysis-item">
                <h4>{analysis.repo_name}</h4>
                <p>Branch: {analysis.branch_used} | Files: {analysis.files_analyzed} | Quality: {Math.round((analysis.quality_score || 0) * 100)}%</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleLoadAnalysis(analysis.analysis_id)}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                  >
                    Load
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleDeleteAnalysis(analysis.analysis_id)}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No saved analyses found.</p>
        )}
      </div>
    </div>
  );
}
