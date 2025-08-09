import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './RepoAnalyzerCursorAI.css';

export default function RepoAnalyzerWithAPIs() {
  // File upload state
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
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
  const [showRawData, setShowRawData] = useState(false);

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
    setSelectedTemplate(template.name);
    setBranch('main'); // Default to main branch
    setSuccess(`Template "${template.name}" selected!`);
    setError(''); // Clear any previous errors
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
    const newFiles = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/cursor-readme/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedFiles(selectedFiles);
      setSuccess(`Successfully uploaded ${selectedFiles.length} files`);
    } catch (error) {
      setError('Failed to upload files. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Save Analysis
  const handleSaveAnalysis = async () => {
    if (!analysisResult) {
      setError('No analysis result to save');
      return;
    }

    try {
      setSuccess('Saving analysis...');
      const response = await axios.post('/api/save-analysis', {
        analysis: analysisResult,
        repo_url: repoUrl,
        timestamp: new Date().toISOString()
      });
      
      setSuccess('Analysis saved successfully!');
      console.log('Analysis saved:', response.data);
    } catch (error) {
      setError('Failed to save analysis');
      console.error('Save analysis error:', error);
    }
  };

  // Handle Download README
  const handleDownloadREADME = () => {
    if (!analysisResult?.documentation?.readme) {
      setError('No README content to download');
      return;
    }

    try {
      const content = analysisResult.documentation.readme;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'README.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('README.md downloaded successfully!');
    } catch (error) {
      setError('Failed to download README');
      console.error('Download error:', error);
    }
  };

  // Handle Create Learning Module
  const handleCreateLearningModule = async () => {
    if (!analysisResult) {
      setError('No analysis result to create learning module from');
      return;
    }

    try {
      setSuccess('Creating learning module...');
      console.log('Creating learning module with data:', analysisResult);
      
      // Create learning module data with proper fallbacks
      const learningModuleData = {
        title: `Learning Module: ${analysisResult.repo_name || analysisResult.repository_name || 'Repository Analysis'}`,
        description: `Comprehensive learning module based on analysis of ${repoUrl || 'repository'}`,
        content: analysisResult.documentation?.readme || analysisResult.readme || 'No content available',
        analysis_data: analysisResult,
        created_at: new Date().toISOString(),
        type: 'repository_analysis'
      };

      console.log('Sending learning module data:', learningModuleData);
      
      // Save to backend
      const response = await axios.post('/api/create-learning-module', learningModuleData);
      
      if (response.data.success) {
        setSuccess('Learning module created successfully! Check AI Training Module section.');
        console.log('Learning module created:', response.data);
      } else {
        setError(`Failed to create learning module: ${response.data.message}`);
        console.error('Backend error:', response.data);
      }
      
      // Optionally redirect to learning module
      // window.location.href = '/ai-training-module';
      
    } catch (error) {
      console.error('Create learning module error:', error);
      if (error.response) {
        setError(`Failed to create learning module: ${error.response.data.message || error.response.statusText}`);
        console.error('Backend response error:', error.response.data);
      } else if (error.request) {
        setError('Failed to create learning module: No response from server');
        console.error('Network error:', error.request);
      } else {
        setError(`Failed to create learning module: ${error.message}`);
        console.error('Other error:', error.message);
      }
    }
  };

  const generateReadmePreview = (documentation) => {
    if (!documentation || !documentation.readme) {
      return "No README documentation available.";
    }
    
    // Truncate if too long
    const content = documentation.readme;
    if (content.length > 500) {
      return content.substring(0, 500) + "...\n\n[Click to view full README]";
    }
    return content;
  };

  const getQualityBadge = (qualityScore, analysisType) => {
    let badgeClass = "quality-badge";
    let qualityText = "Unknown";
    
    if (analysisType === "cursor_ai") {
      badgeClass += " cursor-ai";
      qualityText = "Cursor AI";
    } else if (analysisType === "enhanced_openai") {
      badgeClass += " enhanced";
      qualityText = "Enhanced OpenAI";
    } else {
      badgeClass += " basic";
      qualityText = "Basic";
    }
    
    return (
      <div className={badgeClass}>
        <span className="badge-icon">⚡</span>
        <span className="badge-text">{qualityText}</span>
        <span className="badge-score">{(qualityScore * 100).toFixed(0)}%</span>
      </div>
    );
  };

  const renderDocumentationSection = (documentation) => {
    if (!documentation) return null;
    
    return (
      <div className="result-section">
        <div className="result-section-title">
          <span className="result-icon">📚</span>
          Generated Documentation
        </div>
        <div className="documentation-content">
          {documentation.readme && (
            <div className="doc-section">
              <h4>README.md</h4>
              <div className="preview-content">
                <pre>{generateReadmePreview(documentation)}</pre>
              </div>
            </div>
          )}
          
          {documentation.api_documentation && (
            <div className="doc-section">
              <h4>API Documentation</h4>
              <div className="preview-content">
                <pre>{documentation.api_documentation.substring(0, 300)}...</pre>
              </div>
            </div>
          )}
          
          {documentation.setup_guide && (
            <div className="doc-section">
              <h4>Setup Guide</h4>
              <div className="preview-content">
                <pre>{documentation.setup_guide.substring(0, 300)}...</pre>
              </div>
            </div>
          )}
          
          {documentation.contributing_guide && (
            <div className="doc-section">
              <h4>Contributing Guide</h4>
              <div className="preview-content">
                <pre>{documentation.contributing_guide.substring(0, 300)}...</pre>
              </div>
            </div>
          )}
          
          {documentation.deployment_guide && (
            <div className="doc-section">
              <h4>Deployment Guide</h4>
              <div className="preview-content">
                <pre>{documentation.deployment_guide.substring(0, 300)}...</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLearningModule = (learningModule) => {
    if (!learningModule) return null;
    
    return (
      <div className="result-section">
        <div className="result-section-title">
          <span className="result-icon">🎓</span>
          Learning Module
        </div>
        <div className="learning-content">
          <div className="learning-header">
            <h3>{learningModule.title || "Learning Module"}</h3>
            <p>{learningModule.description || "Comprehensive learning module for this repository"}</p>
          </div>
          
          {learningModule.objectives && learningModule.objectives.length > 0 && (
            <div className="learning-section">
              <h4>Learning Objectives</h4>
              <ul>
                {learningModule.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
          
          {learningModule.estimated_duration && (
            <div className="learning-section">
              <h4>Estimated Duration</h4>
              <p>{learningModule.estimated_duration}</p>
            </div>
          )}
          
          {learningModule.exercises && learningModule.exercises.length > 0 && (
            <div className="learning-section">
              <h4>Exercises</h4>
              <ul>
                {learningModule.exercises.slice(0, 3).map((exercise, index) => (
                  <li key={index}>
                    <strong>{exercise.title}</strong>: {exercise.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdvancedInsights = (insights) => {
    if (!insights) return null;
    
    return (
      <div className="result-section">
        <div className="result-section-title">
          <span className="result-icon">🔍</span>
          Advanced Insights
        </div>
        <div className="insights-content">
          {insights.technology_stack && (
            <div className="insight-item">
              <div className="insight-label">Technology Stack</div>
              <div className="insight-value">
                {insights.technology_stack.languages && insights.technology_stack.languages.length > 0 && (
                  <div>
                    <strong>Languages:</strong> {insights.technology_stack.languages.join(', ')}
                  </div>
                )}
                {insights.technology_stack.frameworks && insights.technology_stack.frameworks.length > 0 && (
                  <div>
                    <strong>Frameworks:</strong> {insights.technology_stack.frameworks.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {insights.architecture_patterns && (
            <div className="insight-item">
              <div className="insight-label">Architecture Pattern</div>
              <div className="insight-value">
                {insights.architecture_patterns.pattern || "Not identified"}
              </div>
            </div>
          )}
          
          {insights.code_quality && (
            <div className="insight-item">
              <div className="insight-label">Code Quality</div>
              <div className="insight-value">
                <span className={`quality-indicator ${insights.code_quality.score?.toLowerCase()}`}>
                  {insights.code_quality.score || "Unknown"}
                </span>
              </div>
            </div>
          )}
          
          {insights.security_analysis && (
            <div className="insight-item">
              <div className="insight-label">Security Assessment</div>
              <div className="insight-value">
                <span className={`security-indicator ${insights.security_analysis.score?.toLowerCase()}`}>
                  {insights.security_analysis.score || "Unknown"}
                </span>
              </div>
            </div>
          )}
          
          {insights.performance_insights && (
            <div className="insight-item">
              <div className="insight-label">Performance</div>
              <div className="insight-value">
                <span className={`performance-indicator ${insights.performance_insights.score?.toLowerCase()}`}>
                  {insights.performance_insights.score || "Unknown"}
                </span>
              </div>
            </div>
          )}
          
          {insights.complexity_assessment && (
            <div className="insight-item">
              <div className="insight-label">Complexity Level</div>
              <div className="insight-value">
                {insights.complexity_assessment.level || "Unknown"}
              </div>
            </div>
          )}
          
          {insights.improvement_recommendations && insights.improvement_recommendations.length > 0 && (
            <div className="insight-item">
              <div className="insight-label">Improvement Recommendations</div>
              <div className="insight-value">
                <ul>
                  {insights.improvement_recommendations.slice(0, 5).map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="repo-analyzer-cursor-ai">
      <h1>Repo Analyzer with APIs</h1>
      <p className="description">
        Analyze Git repositories and generate professional documentation with AI-powered insights.
        Get comprehensive analysis including architecture patterns, code quality assessment, and learning modules.
      </p>

      {/* Analysis Mode Toggle */}
      <div className="analysis-mode-toggle">
        <button 
          className={`mode-button ${analysisMode === 'url' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('url')}
        >
          <span className="mode-icon">🔗</span>
          Repository URL
        </button>
        <button 
          className={`mode-button ${analysisMode === 'files' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('files')}
        >
          <span className="mode-icon">📁</span>
          Individual Files
        </button>
      </div>

      {analysisMode === 'url' && (
        <div className="repo-url-section">
          {/* Quick Templates */}
          <div className="template-section">
            <h3>Quick Templates</h3>
            <div className="quick-templates">
              <div className="template-buttons">
                <button 
                  className={`template-button ${selectedTemplate === 'React' ? 'active' : ''}`}
                  onClick={() => handleTemplateClick({
                    name: "React",
                    url: "https://github.com/facebook/react",
                    description: "Official React library"
                  })}
                >
                  React
                </button>
                <button 
                  className={`template-button ${selectedTemplate === 'FastAPI' ? 'active' : ''}`}
                  onClick={() => handleTemplateClick({
                    name: "FastAPI",
                    url: "https://github.com/tiangolo/fastapi",
                    description: "Modern Python web framework"
                  })}
                >
                  FastAPI
                </button>
                <button 
                  className={`template-button ${selectedTemplate === 'Express.js' ? 'active' : ''}`}
                  onClick={() => handleTemplateClick({
                    name: "Express.js",
                    url: "https://github.com/expressjs/express",
                    description: "Fast, unopinionated web framework"
                  })}
                >
                  Express.js
                </button>
                <button 
                  className={`template-button ${selectedTemplate === 'Vue.js' ? 'active' : ''}`}
                  onClick={() => handleTemplateClick({
                    name: "Vue.js",
                    url: "https://github.com/vuejs/vue",
                    description: "Progressive JavaScript framework"
                  })}
                >
                  Vue.js
                </button>
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
            className="analyze-repo-btn"
            onClick={analyzeRepository}
            disabled={analyzing || !repoUrl}
          >
            {analyzing ? (
              <>
                <span className="loading-spinner"></span>
                Analyzing Repository...
              </>
            ) : (
              <>
                <span className="analyze-icon">🔍</span>
                Analyze Repository
              </>
            )}
          </button>
        </div>
      )}

      {analysisMode === 'files' && (
        <div className="file-upload-section">
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📁</div>
            <div className="upload-text">Drop files here or click to select</div>
            <div className="upload-hint">Supports: .py, .js, .jsx, .ts, .tsx, .json, .md, .yml, .yaml, .html, .css</div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".py,.js,.jsx,.ts,.tsx,.json,.md,.yml,.yaml,.html,.css"
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="file-list">
              <h3>Selected Files ({selectedFiles.length})</h3>
              {selectedFiles.map((file, index) => (
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
                    ✕
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
                    <span className="loading-spinner"></span>
                    Uploading Files...
                  </>
                ) : (
                  <>
                    <span className="analyze-icon">📤</span>
                    Upload & Analyze Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <div className="results-header">
            <h2>Analysis Results</h2>
            {getQualityBadge(analysisResult.quality_score, analysisResult.analysis_type)}
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
                <div className="summary-label">Files Analyzed</div>
                <div className="summary-value">{analysisResult.files_analyzed}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Analysis Type</div>
                <div className="summary-value">
                  {analysisResult.analysis_type === 'cursor_ai' ? 'Cursor AI' : 
                   analysisResult.analysis_type === 'enhanced_openai' ? 'Enhanced OpenAI' : 
                   'Basic Analysis'}
                </div>
              </div>
            </div>
          </div>

          {/* Project Structure */}
          {analysisResult.structure && (
            <div className="result-section">
              <div className="result-section-title">
                <span className="result-icon">🏗️</span>
                Project Structure
              </div>
              <div className="structure-content">
                {analysisResult.structure.raw_response ? (
                  <div className="structure-analysis">
                    <pre>{analysisResult.structure.raw_response}</pre>
                  </div>
                ) : (
                  <div className="structure-basic">
                    <div className="structure-item">
                      <div className="structure-label">Project Type</div>
                      <div className="structure-value">{analysisResult.structure.project_type || 'Unknown'}</div>
                    </div>
                    <div className="structure-item">
                      <div className="structure-label">Languages</div>
                      <div className="structure-value">
                        {analysisResult.structure.languages && analysisResult.structure.languages.length > 0 
                          ? analysisResult.structure.languages.join(', ') 
                          : 'Not detected'}
                      </div>
                    </div>
                    <div className="structure-item">
                      <div className="structure-label">Frameworks</div>
                      <div className="structure-value">
                        {analysisResult.structure.frameworks && analysisResult.structure.frameworks.length > 0 
                          ? analysisResult.structure.frameworks.join(', ') 
                          : 'Not detected'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Insights */}
          {analysisResult.insights && renderAdvancedInsights(analysisResult.insights)}

          {/* Generated Documentation */}
          {analysisResult.documentation && renderDocumentationSection(analysisResult.documentation)}

          {/* Learning Module */}
          {analysisResult.learning_module && renderLearningModule(analysisResult.learning_module)}

          {/* Documentation Actions */}
          <div className="documentation-actions">
            <button className="doc-action-btn" onClick={handleSaveAnalysis}>
              <span className="action-icon">💾</span>
              Save Analysis
            </button>
            <button className="doc-action-btn" onClick={handleDownloadREADME}>
              <span className="action-icon">📥</span>
              Download README
            </button>
            <button className="doc-action-btn" onClick={handleCreateLearningModule}>
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

      {/* Loading State */}
      {analyzing && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Analyzing repository... This may take a few minutes for comprehensive analysis.</p>
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