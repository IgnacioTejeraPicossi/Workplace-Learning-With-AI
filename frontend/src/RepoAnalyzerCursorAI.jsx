import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './RepoAnalyzerCursorAI.css';

export default function RepoAnalyzerCursorAI() {
  // File upload state
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Repository URL state
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [availableBranches, setAvailableBranches] = useState([]);
  const [detectingBranch, setDetectingBranch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([]);
  
  // Analysis mode
  const [analysisMode, setAnalysisMode] = useState('url'); // 'url' or 'files'
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // File upload refs
  const fileInputRef = useRef();
  const dropZoneRef = useRef();

  // Quick template URLs
  const quickTemplates = [
    {
      name: "React Application",
      url: "https://github.com/facebook/create-react-app",
      description: "Official React starter template"
    },
    {
      name: "FastAPI Backend", 
      url: "https://github.com/tiangolo/full-stack-fastapi-postgresql",
      description: "Full-stack FastAPI with PostgreSQL"
    },
    {
      name: "Node.js Express",
      url: "https://github.com/expressjs/express",
      description: "Fast, unopinionated web framework"
    }
  ];

  useEffect(() => {
    // Load templates on component mount
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/repo-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateClick = (template) => {
    setRepoUrl(template.url);
    setBranch('main'); // Default to main branch
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
        setBranch(response.data.branches[0]); // Set first branch as default
      }
      setSuccess(`Found ${response.data.branches?.length || 0} branches`);
    } catch (error) {
      setError('Failed to detect branches. Please check the URL and try again.');
      console.error('Branch detection error:', error);
    } finally {
      setDetectingBranch(false);
    }
  };

  const analyzeRepository = async () => {
    if (!repoUrl) {
      setError('Please enter a repository URL');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      const response = await axios.post('/api/analyze-repo', {
        repo_url: repoUrl,
        branch: branch || null
      });

      setAnalysisResult(response.data);
      setSuccess('Repository analyzed successfully!');
    } catch (error) {
      setError('Failed to analyze repository. Please check the URL and try again.');
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // File upload handlers
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    dropZoneRef.current?.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dropZoneRef.current?.classList.remove('dragover');
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/cursor-readme/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedFiles(files);
      setSuccess(`Successfully uploaded ${files.length} files`);
    } catch (error) {
      setError('Failed to upload files. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="repo-analyzer-cursor-ai">
      <h1>🚀 Repo Analyzer Cursor AI</h1>
      <p className="description">
        Generate Cursor AI-quality documentation and learning modules from your project files
      </p>

      {/* Analysis Mode Toggle */}
      <div className="analysis-mode-toggle">
        <button 
          className={`mode-button ${analysisMode === 'url' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('url')}
        >
          <span className="mode-icon">🌐</span>
          <span>Repository URL</span>
        </button>
        <button 
          className={`mode-button ${analysisMode === 'files' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('files')}
        >
          <span className="mode-icon">📁</span>
          <span>Individual Files</span>
        </button>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Repository URL Analysis Mode */}
      {analysisMode === 'url' && (
        <div className="repo-url-section">
          <h3>
            <span className="section-icon">🌐</span>
            Repository Analysis
          </h3>

          {/* Quick Templates */}
          <div className="quick-templates">
            <h4>Quick Templates</h4>
            <div className="template-buttons">
              {quickTemplates.map((template, index) => (
                <button
                  key={index}
                  className="template-button"
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="template-name">{template.name}</div>
                  <div className="template-url">{template.url}</div>
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div className="url-input-group">
            <div className="url-input-row">
              <input
                type="text"
                className="url-input"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: '0.5rem 0' }}>
              Supports GitHub, GitLab, and Bitbucket repositories
            </p>
          </div>

          {/* Branch Selection */}
          <div className="branch-selection">
            <label style={{ fontWeight: '600', color: '#495057' }}>Branch:</label>
            <select
              className="branch-select"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {availableBranches.length > 0 ? (
                availableBranches.map((branchName, index) => (
                  <option key={index} value={branchName}>
                    {branchName}
                  </option>
                ))
              ) : (
                <option value="main">main</option>
              )}
            </select>
            <button
              className="detect-branch-btn"
              onClick={detectBranches}
              disabled={detectingBranch || !repoUrl}
            >
              {detectingBranch ? 'Detecting...' : 'Detect Branches'}
            </button>
          </div>

          {/* Analyze Button */}
          <button
            className="analyze-repo-btn"
            onClick={analyzeRepository}
            disabled={analyzing || !repoUrl}
          >
            {analyzing ? (
              <>
                <div className="loading-spinner"></div>
                Analyzing Repository...
              </>
            ) : (
              <>
                <span>🔍</span>
                Analyze Repository
              </>
            )}
          </button>
        </div>
      )}

      {/* File Upload Mode */}
      {analysisMode === 'files' && (
        <div className="file-upload-section">
          <h3>
            <span className="section-icon">📁</span>
            File Upload Analysis
          </h3>

          <div
            className="upload-area"
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📤</div>
            <div className="upload-text">Drop files here or click to browse</div>
            <div className="upload-hint">
              Supports .py, .js, .ts, .jsx, .tsx, .html, .css, .json, .md, and more
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="file-input"
            onChange={handleFileSelect}
            accept=".py,.js,.ts,.jsx,.tsx,.html,.css,.json,.md,.txt,.yml,.yaml,.xml,.sql,.sh,.bat,.ps1"
          />

          {files.length > 0 && (
            <div className="file-list">
              <h4 style={{ marginBottom: '1rem', color: '#495057' }}>Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    className="remove-file"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="analyze-repo-btn"
                onClick={uploadFiles}
                disabled={analyzing}
                style={{ marginTop: '1rem' }}
              >
                {analyzing ? (
                  <>
                    <div className="loading-spinner"></div>
                    Uploading Files...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Upload & Analyze Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Template Selection */}
      <div className="template-section">
        <h3>
          <span className="section-icon">📋</span>
          Documentation Template
        </h3>
        <div className="template-grid">
          <div
            className={`template-card ${selectedTemplate === 'professional' ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate('professional')}
          >
            <div className="template-title">Professional README</div>
            <div className="template-description">
              Comprehensive documentation with installation, usage, API reference, and contribution guidelines.
            </div>
          </div>
          <div
            className={`template-card ${selectedTemplate === 'minimal' ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate('minimal')}
          >
            <div className="template-title">Minimal README</div>
            <div className="template-description">
              Simple and clean documentation focusing on essential information and quick start guide.
            </div>
          </div>
          <div
            className={`template-card ${selectedTemplate === 'learning' ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate('learning')}
          >
            <div className="template-title">Learning Module</div>
            <div className="template-description">
              Educational documentation with concepts, examples, exercises, and learning objectives.
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <h3>
            <span className="section-icon">📊</span>
            Analysis Results
          </h3>
          <div className="result-content">
            {JSON.stringify(analysisResult, null, 2)}
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyzing && !analysisResult && (
        <div className="loading">
          <div className="loading-spinner"></div>
          Analyzing repository...
        </div>
      )}
    </div>
  );
} 