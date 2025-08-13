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

  // Helper function to clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // State for saved analyses
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

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
    // Load saved analyses on component mount
    loadSavedAnalyses();
  }, []);

  // Clear messages when analysis mode changes
  useEffect(() => {
    clearMessages();
  }, [analysisMode]);

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
    clearMessages();
    setSuccess(`Template "${template.name}" selected!`);
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccess('');
    }, 3000);
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
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setSuccess('');
      }, 4000);
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
    clearMessages();
    setAnalysisResult(null);

    try {
      const response = await axios.post('/api/analyze-repo', {
        repo_url: repoUrl,
        branch: branch || null
      });

      setAnalysisResult(response.data);
      setSuccess('Repository analyzed successfully!');
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setSuccess('');
      }, 4000);
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
    clearMessages();

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
      
      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setSuccess('');
      }, 4000);
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
      clearMessages();
      setError('No analysis result to save');
      return;
    }

    try {
      clearMessages();
      setSuccess('Saving analysis...');
      
      // Log the data being sent
      const saveData = {
        analysis: analysisResult,
        repo_url: repoUrl,
        timestamp: new Date().toISOString()
      };
      console.log('Sending save data:', saveData);
      
      const response = await axios.post('/api/save-analysis', saveData);
      
      setSuccess('Analysis saved successfully!');
      console.log('Analysis saved:', response.data);
      
      // Reload the saved analyses list
      await loadSavedAnalyses();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      clearMessages();
      console.error('Save analysis error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setError(`Failed to save analysis: ${error.response?.data?.detail || error.message}`);
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
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError('Failed to download README');
      console.error('Download error:', error);
    }
  };

  // Handle Create Learning Module
  const handleCreateLearningModule = async () => {
    if (!analysisResult) {
      clearMessages();
      setError('No analysis result to create learning module from');
      return;
    }

    try {
      clearMessages();
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
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } else {
        clearMessages();
        setError(`Failed to create learning module: ${response.data.message}`);
        console.error('Backend error:', response.data);
      }
      
      // Optionally redirect to learning module
      // window.location.href = '/ai-training-module';
      
    } catch (error) {
      console.error('Create learning module error:', error);
      clearMessages();
      
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

  // Load saved analyses
  const loadSavedAnalyses = async () => {
    try {
      setLoadingSaved(true);
      const response = await axios.get('/api/saved-analyses?limit=10');
      setSavedAnalyses(response.data.analyses || []);
    } catch (err) {
      console.error('Error loading saved analyses:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Load a specific analysis
  const loadAnalysis = async (analysisId) => {
    try {
      const response = await axios.get(`/api/saved-analyses/${analysisId}`);
      
      // Extract data from the saved analysis structure
      const savedAnalysis = response.data.analysis;
      const analysisData = savedAnalysis.analysis_data || {};
      
      // Reconstruct the original analysis result structure
      const reconstructedAnalysis = {
        repo_name: savedAnalysis.repo_name || 'Unknown Repository',
        branch_used: savedAnalysis.branch_used || 'Unknown',
        files_analyzed: savedAnalysis.analysis_data?.summaries ? Object.keys(savedAnalysis.analysis_data.summaries).length : 0,
        summaries: analysisData.summaries || {},
        structure: analysisData.structure || {},
        insights: analysisData.insights || {},
        architecture: analysisData.architecture || {},
        analysis_id: savedAnalysis.analysis_id || '',
        documentation: response.data.documentation?.documentation || {},
        quiz: response.data.quiz?.quiz_data || []
      };
      
      setAnalysisResult(reconstructedAnalysis);
      setRepoUrl(savedAnalysis.repo_url || '');
      setBranch(savedAnalysis.branch_used || '');
      clearMessages();
      setSuccess('Analysis loaded successfully!');
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError('Error loading analysis: ' + err.message);
    }
  };

  // Delete a saved analysis
  const deleteAnalysis = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    
    try {
      await axios.delete(`/api/saved-analyses/${analysisId}`);
      await loadSavedAnalyses(); // Reload the list
      if (analysisResult?.analysis_id === analysisId) {
        setAnalysisResult(null);
        setRepoUrl('');
        setBranch('');
      }
      setSuccess('Analysis deleted successfully!');
      
      // Reload the saved analyses list
      await loadSavedAnalyses();
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError('Error deleting analysis: ' + err.message);
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
          <button 
            onClick={clearMessages}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {success}
          <button 
            onClick={clearMessages}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: '#28a745',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Saved Analyses Section */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ 
            color: '#333', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💾 Saved Analyses
            {savedAnalyses.length > 0 && (
              <span style={{
                background: '#007bff',
                color: '#fff',
                fontSize: '0.8rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                marginLeft: '0.5rem'
              }}>
                {savedAnalyses.length}
              </span>
            )}
          </h2>
          
          <button
            onClick={loadSavedAnalyses}
            disabled={loadingSaved}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingSaved ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              opacity: loadingSaved ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => !loadingSaved && (e.target.style.background = '#218838')}
            onMouseOut={(e) => !loadingSaved && (e.target.style.background = '#28a745')}
          >
            {loadingSaved ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
        
        {loadingSaved ? (
          <p>Loading saved analyses...</p>
        ) : savedAnalyses.length === 0 ? (
          <div style={{ 
            padding: '2rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              opacity: 0.5
            }}>
              💾
            </div>
            <p style={{ 
              color: '#666', 
              fontStyle: 'italic',
              margin: '0.5rem 0',
              fontSize: '1.1rem'
            }}>
              No saved analyses found
            </p>
            <p style={{ 
              color: '#999', 
              fontSize: '0.9rem',
              margin: 0
            }}>
              Analyze a repository and save it to see it here!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {savedAnalyses.map((analysis) => (
              <div key={analysis._id} style={{ 
                background: '#f8f9fa', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                border: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ flex: '1' }}>
                  <h4 style={{ 
                    marginBottom: '0.5rem', 
                    color: '#007bff',
                    fontSize: '1.1rem'
                  }}>
                    {analysis.repo_name || 'Unknown Repository'}
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    <p><strong>Repository:</strong> {analysis.repo_url}</p>
                    <p><strong>Branch:</strong> {analysis.branch_used || 'Unknown'}</p>
                    <p><strong>Files Analyzed:</strong> {analysis.analysis_data?.summaries ? Object.keys(analysis.analysis_data.summaries).length : 0}</p>
                    <p><strong>Date:</strong> {new Date(analysis.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => loadAnalysis(analysis._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#0056b3'}
                    onMouseOut={(e) => e.target.style.background = '#007bff'}
                  >
                    📂 Load Analysis
                  </button>
                  <button
                    onClick={() => deleteAnalysis(analysis._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c82333'}
                    onMouseOut={(e) => e.target.style.background = '#dc3545'}
                  >
                    🗑️ Delete
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