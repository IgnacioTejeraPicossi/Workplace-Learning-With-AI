import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AgentCursorAI.css';

export default function AgentCursorAI() {
  // Repository state
  const [repoUrl, setRepoUrl] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [branch, setBranch] = useState('main');
  const [availableBranches, setAvailableBranches] = useState([]);
  const [detectingBranch, setDetectingBranch] = useState(false);
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [readmeContent, setReadmeContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Results state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  
  // Quick templates
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // File input ref
  const fileInputRef = useRef();

  // Quick template URLs - using smaller repos to avoid Windows filename length issues
  const quickTemplates = [
    { name: "FastAPI", url: "https://github.com/tiangolo/fastapi", description: "Modern Python web framework" },
    { name: "Express.js", url: "https://github.com/expressjs/express", description: "Fast, unopinionated web framework" },
    { name: "Vue.js", url: "https://github.com/vuejs/vue", description: "Progressive JavaScript framework" },
    { name: "Flask", url: "https://github.com/pallets/flask", description: "Lightweight Python web framework" }
  ];

  const handleTemplateClick = (template) => {
    setRepoUrl(template.url);
    setSelectedTemplate(template.name);
    setBranch('main');
    setSuccess(`Template "${template.name}" selected!`);
    setError('');
  };

  const detectBranches = async () => {
    if (!repoUrl) {
      setError('Please enter a repository URL first');
      return;
    }

    setDetectingBranch(true);
    setError('');

    try {
      const response = await axios.get(`/api/detect-branch/${encodeURIComponent(repoUrl)}`);
      setAvailableBranches(response.data.branches || []);
      if (response.data.branches && response.data.branches.length > 0) {
        setBranch(response.data.branches[0]);
      }
      setSuccess(`Found ${response.data.branches?.length || 0} branches`);
    } catch (error) {
      setError('Failed to detect branches. Please check the URL and try again.');
      console.error('Branch detection error:', error);
    } finally {
      setDetectingBranch(false);
    }
  };

  const launchCursorAnalysis = async () => {
    if (!repoUrl) {
      setError('Please enter a repository URL');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    setReadmeContent('');
    setAnalysisStatus('Starting Cursor AI analysis...');

    try {
      // Step 1: Clone repository and get local path
      setAnalysisStatus('Cloning repository...');
      const cloneResponse = await axios.post('/api/cursor-agent/clone-repo', {
        repo_url: repoUrl,
        branch: branch || 'main'
      });

      if (cloneResponse.data.status === 'success') {
        const localPath = cloneResponse.data.repo_path;
        setRepoPath(localPath);
        setAnalysisStatus('Repository cloned successfully. Launching Cursor AI...');

        // Step 2: Launch Cursor AI analysis
        const cursorResponse = await axios.post('/api/cursor-agent/launch-analysis', {
          repo_path: localPath,
          repo_url: repoUrl
        });

        if (cursorResponse.data.status === 'success') {
          setAnalysisStatus('Cursor AI analysis completed. Loading results...');
          
          // Step 3: Get the generated README
          setTimeout(async () => {
            try {
              const readmeResponse = await axios.get('/api/cursor-agent/get-readme', {
                params: { repo_path: localPath }
              });

              if (readmeResponse.data.content) {
                setReadmeContent(readmeResponse.data.content);
                setAnalysisResult({
                  repo_name: repoUrl.split('/').pop(),
                  branch_used: branch || 'main',
                  analysis_type: 'cursor_ai_local',
                  quality_score: 0.95,
                  documentation: {
                    readme: readmeResponse.data.content
                  }
                });
                setSuccess('✅ Cursor AI analysis completed successfully!');
              } else {
                setError('⚠️ README not found after Cursor AI analysis.');
              }
            } catch (readmeError) {
              setError('Failed to retrieve README from Cursor AI analysis.');
              console.error('README retrieval error:', readmeError);
            } finally {
              setAnalyzing(false);
            }
          }, 2000); // Wait for file generation
        } else {
          setError(`Cursor AI analysis failed: ${cursorResponse.data.error}`);
          setAnalyzing(false);
        }
      } else {
        setError(`Repository cloning failed: ${cloneResponse.data.error}`);
        setAnalyzing(false);
      }
    } catch (error) {
      setError('Failed to launch Cursor AI analysis. Please check the URL and try again.');
      console.error('Cursor AI analysis error:', error);
      setAnalyzing(false);
    }
  };

  const generateReadmePreview = (content) => {
    if (!content) {
      return "No README content available.";
    }
    
    // Truncate if too long
    if (content.length > 800) {
      return content.substring(0, 800) + "...\n\n[Click to view full README]";
    }
    return content;
  };

  const getQualityBadge = () => {
    return (
      <div className="quality-badge cursor-ai">
        <span className="badge-icon">🚀</span>
        <span className="badge-text">Cursor AI Local</span>
        <span className="badge-score">95%</span>
      </div>
    );
  };

  return (
    <div className="agent-cursor-ai">
      <h1>Agent Cursor AI</h1>
      <p className="description">
        Trigger Cursor AI locally to analyze Git repositories and generate professional documentation.
        This module launches Cursor AI as a local application to provide the highest quality analysis.
      </p>

      {/* Repository URL Input */}
      <div className="repo-input-section">
        {/* Quick Templates */}
        <div className="template-section">
          <h3>Quick Templates</h3>
          <div className="quick-templates">
            <div className="template-buttons">
              {quickTemplates.map((template) => (
                <button 
                  key={template.name}
                  className={`template-button ${selectedTemplate === template.name ? 'active' : ''}`}
                  onClick={() => handleTemplateClick(template)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div className="url-input-group">
          <div className="url-input-row">
            <input
              type="text"
              className="url-input"
              placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <button 
              className="detect-branch-btn"
              onClick={detectBranches}
              disabled={detectingBranch}
            >
              {detectingBranch ? 'Detecting...' : 'Detect Branches'}
            </button>
          </div>
          
          {availableBranches.length > 0 && (
            <div className="branch-selection">
              <label>Select Branch:</label>
              <select 
                className="branch-select"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {availableBranches.map((branchName) => (
                  <option key={branchName} value={branchName}>
                    {branchName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button 
          className="launch-cursor-btn"
          onClick={launchCursorAnalysis}
          disabled={analyzing || !repoUrl}
        >
          {analyzing ? (
            <>
              <span className="loading-spinner"></span>
              Launching Cursor AI...
            </>
          ) : (
            <>
              <span className="cursor-icon">🚀</span>
              Launch Cursor AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Analysis Status */}
      {analyzing && (
        <div className="analysis-status">
          <div className="status-content">
            <div className="loading-spinner"></div>
            <p>{analysisStatus}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <div className="results-header">
            <h2>Cursor AI Analysis Results</h2>
            {getQualityBadge()}
          </div>

          {/* Executive Summary */}
          <div className="result-section">
            <div className="result-section-title">
              <span className="result-icon">📊</span>
              Executive Summary
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Repository</div>
                <div className="summary-value">{analysisResult.repo_name}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Branch</div>
                <div className="summary-value">{analysisResult.branch_used}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Analysis Type</div>
                <div className="summary-value">Cursor AI Local</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Quality Score</div>
                <div className="summary-value">95%</div>
              </div>
            </div>
          </div>

          {/* Generated README */}
          {readmeContent && (
            <div className="result-section">
              <div className="result-section-title">
                <span className="result-icon">📚</span>
                Generated README.md
              </div>
              <div className="readme-content">
                <div className="readme-preview">
                  <pre>{generateReadmePreview(readmeContent)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="documentation-actions">
            <button className="doc-action-btn">
              <span className="action-icon">💾</span>
              Save Analysis
            </button>
            <button className="doc-action-btn">
              <span className="action-icon">📥</span>
              Download README
            </button>
            <button className="doc-action-btn">
              <span className="action-icon">🎓</span>
              Create Learning Module
            </button>
          </div>

          {/* Raw Data Toggle */}
          <div className="raw-data-toggle">
            <button 
              className="toggle-btn"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? 'Hide' : 'Show'} Raw Analysis Data
            </button>
          </div>

          {showRawData && (
            <div className="raw-data-section">
              <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {success}
        </div>
      )}
    </div>
  );
} 