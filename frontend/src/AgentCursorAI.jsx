import React, { useState, useEffect, useRef } from 'react';
import './AgentCursorAI.css';

const AgentCursorAI = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  
  const progressIntervalRef = useRef(null);
  const statusIntervalRef = useRef(null);

  // Quick templates for common repositories
  const quickTemplates = [
    { name: 'FastAPI', url: 'https://github.com/tiangolo/fastapi', branch: 'master' },
    { name: 'Express.js', url: 'https://github.com/expressjs/express', branch: 'master' },
    { name: 'Vue.js', url: 'https://github.com/vuejs/vue', branch: 'main' },
    { name: 'Flask', url: 'https://github.com/pallets/flask', branch: 'main' }
  ];

  const handleTemplateClick = (template) => {
    setRepoUrl(template.url);
    setBranch(template.branch);
  };

  const detectBranches = async () => {
    if (!repoUrl) return;
    
    try {
      // Extract owner and repo from URL
      const urlParts = repoUrl.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];
      
      // Try common branch names
      const commonBranches = ['main', 'master', 'develop', 'dev'];
      
      for (const branchName of commonBranches) {
        try {
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branchName}`);
          if (response.ok) {
            setBranch(branchName);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.log('Branch detection failed, using default');
    }
  };

  const startAnalysis = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    try {
      setError(null);
      setResult(null);
      setIsAnalyzing(true);
      setShowProgress(true);
      setProgress(0);
      setCurrentStep('Initializing...');

      const response = await fetch('/api/cursor/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          branch: branch,
          timeout_seconds: 900,
          user_prompt: userPrompt || "Generate a comprehensive README.md for this repository"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCurrentJob(data.job_id);
      setProgress(data.progress);
      setCurrentStep(data.current_step);

      // Start progress monitoring
      startProgressMonitoring(data.job_id);

    } catch (error) {
      console.error('Error starting analysis:', error);
      setError(`Failed to start analysis: ${error.message}`);
      setIsAnalyzing(false);
      setShowProgress(false);
    }
  };

  const startProgressMonitoring = (jobId) => {
    // Monitor job status every 2 seconds
    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/cursor/automation/status/${jobId}`);
        if (response.ok) {
          const status = await response.json();
          
          setProgress(status.progress);
          setCurrentStep(status.current_step);
          
          if (status.status === 'completed') {
            handleAnalysisComplete(jobId);
          } else if (status.status === 'failed' || status.status === 'timeout') {
            handleAnalysisError(status.status, status.error_message || 'Analysis failed');
          }
        }
      } catch (error) {
        console.error('Error monitoring status:', error);
      }
    }, 2000);

    // Simulate progress bar movement
    progressIntervalRef.current = setInterval(() => {
      if (progress < 95) {
        setProgress(prev => Math.min(prev + 1, 95));
      }
    }, 1000);
  };

  const handleAnalysisComplete = async (jobId) => {
    try {
      const response = await fetch(`/api/cursor/automation/result/${jobId}`);
      if (response.ok) {
        const resultData = await response.json();
        setResult(resultData);
        setProgress(100);
        setCurrentStep('Analysis completed successfully!');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
    }

    // Clean up intervals and reset all states
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Reset all states completely
    setIsAnalyzing(false);
    setCurrentJob(null);
    setShowProgress(false);
    
    // Force UI update
    setTimeout(() => {
      setProgress(0);
      setCurrentStep('');
    }, 100);
  };

  const handleAnalysisError = (status, message) => {
    setError(`Analysis ${status}: ${message}`);
    setProgress(0);
    setCurrentStep('Analysis failed');
    
    // Clean up intervals and reset all states
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Reset all states completely
    setIsAnalyzing(false);
    setCurrentJob(null);
    setShowProgress(false);
    
    // Force UI update
    setTimeout(() => {
      setProgress(0);
      setCurrentStep('');
    }, 100);
  };

  const resetForm = () => {
    setRepoUrl('');
    setBranch('main');
    setIsAnalyzing(false);
    setCurrentJob(null);
    setProgress(0);
    setCurrentStep('');
    setShowProgress(false);
    setResult(null);
    setError(null);
    setUserPrompt(''); // Reset user prompt
    
    // Clean up intervals
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const saveToLibrary = async () => {
    if (!result?.readme_content) return;
    
    try {
      const response = await fetch('/api/docs/import-from-readme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `README - ${repoUrl.split('/').pop()}`,
          markdown: result.readme_content
        }),
      });

      if (response.ok) {
        alert('README saved to Training Library successfully!');
      } else {
        throw new Error('Failed to save to library');
      }
    } catch (error) {
      console.error('Error saving to library:', error);
      alert('Failed to save to Training Library');
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup function to prevent memory leaks
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="agent-cursor-ai">
      {/* Header */}
      <div className="header-banner">
        <h1>Agent Cursor AI</h1>
        <p>
          Trigger Cursor AI locally to analyze Git repositories and generate professional documentation. 
          This module launches Cursor AI as a local application to provide the highest quality analysis.
        </p>
      </div>

      {/* Quick Templates */}
      <div className="quick-templates">
        <h3>Quick Templates</h3>
        <div className="template-buttons">
          {quickTemplates.map((template) => (
            <button
              key={template.name}
              className="template-btn"
              onClick={() => handleTemplateClick(template)}
              disabled={isAnalyzing}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Repository Input */}
      <div className="repository-input">
        <label htmlFor="repoUrl">GitHub Repository URL</label>
        <div className="input-group">
          <input
            id="repoUrl"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
            disabled={isAnalyzing}
          />
          <button 
            className="detect-btn"
            onClick={detectBranches}
            disabled={isAnalyzing || !repoUrl}
          >
            Detect Branches
          </button>
        </div>
        
        <div className="branch-input">
          <label htmlFor="branch">Branch:</label>
          <input
            id="branch"
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            disabled={isAnalyzing}
          />
        </div>

        {/* Agregar campo de texto entre Branch y Launch Cursor AI Analysis */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            User prompt for analysis:
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter custom instructions for Cursor AI analysis (optional)"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            className="launch-btn"
            onClick={startAnalysis}
            disabled={isAnalyzing || !repoUrl.trim()}
          >
            🚀 Launch Cursor AI Analysis
          </button>
          <button
            className="reset-btn"
            onClick={resetForm}
            disabled={isAnalyzing}
          >
            🔄 Reset Form
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="progress-container">
          <div className="progress-header">
            <h3>Analysis Progress</h3>
            <span className="progress-percentage">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="current-step">{currentStep}</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="results-container">
          <div className="results-header">
            <h3>Generated README.md</h3>
            <button className="save-btn" onClick={saveToLibrary}>
              💾 Save to Training Library
            </button>
          </div>
          <div className="readme-preview">
            <pre>{result.readme_content}</pre>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="how-it-works">
        <h3>How It Works</h3>
        <ol>
          <li><strong>Enter Repository URL:</strong> Provide a GitHub repository URL to analyze</li>
          <li><strong>User Prompt for Analysis:</strong> Enter custom instructions for Cursor AI analysis (optional)</li>
          <li><strong>Launch Analysis:</strong> Click the launch button to start Cursor AI</li>
          <li><strong>Automatic Analysis:</strong> Cursor AI will open locally and analyze the repository</li>
          <li><strong>Document Generation:</strong> Professional README.md will be generated automatically</li>
          <li><strong>Results:</strong> View and save the generated documentation to your Training Library</li>
        </ol>
      </div>

      {/* Important Note */}
      <div className="important-note">
        <strong>Note:</strong> This module requires Cursor AI to be installed on your local machine. 
        The system will automatically launch Cursor AI, trigger the documentation generation, 
        and monitor the process until completion.
      </div>
    </div>
  );
};

export default AgentCursorAI; 