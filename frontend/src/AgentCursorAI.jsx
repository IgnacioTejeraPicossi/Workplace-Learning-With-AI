import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './AgentCursorAI.css';

/** Translate backend `current_step` strings (English) for display; pass through unknown text. */
function translateAgentCursorApiStep(step, t) {
  if (step == null || step === '') return '';
  const raw = String(step);

  const EXACT = {
    'Initializing...': 'apiStepInitializing',
    'Initializing…': 'apiStepInitializing',
    'Job initialized successfully': 'apiStepJobInitialized',
    'Creating temporary directory...': 'apiStepCreatingTempDir',
    'Repository cloned successfully': 'apiStepRepoCloned',
    'Creating automation files...': 'apiStepCreatingAutomationFiles',
    'Automation files created successfully': 'apiStepAutomationFilesCreated',
    'Launching Cursor AI...': 'apiStepLaunchingCursor',
    'Using existing Cursor AI instance...': 'apiStepUsingExistingCursor',
    'Cursor AI launched successfully': 'apiStepCursorLaunchedOk',
    'Failed to launch Cursor AI': 'apiStepFailedLaunchCursor',
    'Monitoring for README generation...': 'apiStepMonitoringReadme',
    'README.md generated successfully!': 'apiStepReadmeGenerated',
    'Cursor AI launched, monitoring progress...': 'apiStepLaunchedMonitoring',
    'Cursor AI not available, using AI fallback...': 'apiStepCursorUnavailableFallback',
    'Using unified AI system (fallback)...': 'apiStepUnifiedAiFallback',
    'Analyzing repository structure...': 'apiStepAnalyzingStructure',
    'Generating README with AI...': 'apiStepGeneratingReadmeAi',
    'Processing AI response...': 'apiStepProcessingAiResponse',
    'README.md generated successfully with AI fallback!': 'apiStepReadmeGeneratedFallback',
    'Analysis failed': 'clientStepAnalysisFailed'
  };

  const exactKey = EXACT[raw];
  if (exactKey) return t(`agentCursorModule.${exactKey}`);

  let m = /^Cloning (.+)\.\.\.$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepCloning', { url: m[1] });

  m = /^Error cloning repository: (.+)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepErrorCloning', { detail: m[1] });

  m = /^Error creating automation files: (.+)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepErrorAutomationFiles', { detail: m[1] });

  m = /^Error launching Cursor AI: (.+)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepErrorLaunchCursor', { detail: m[1] });

  m = /^README\.md exists but content short \((\d+) chars\)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepReadmeShort', { count: m[1] });

  m = /^Waiting for README\.md\.\.\. \((\d+)s elapsed\)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepWaitingReadme', { seconds: m[1] });

  m = /^Timeout after (\d+) seconds$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepTimeout', { seconds: m[1] });

  m = /^Error in monitoring: (.+)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepErrorMonitoring', { detail: m[1] });

  m = /^Fallback analysis failed: (.+)$/.exec(raw);
  if (m) return t('agentCursorModule.apiStepFallbackFailed', { detail: m[1] });

  return raw;
}

const AgentCursorAI = () => {
  const { t } = useTranslation();
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
      setError(t('agentCursorModule.errEnterUrl'));
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
          user_prompt: userPrompt.trim()
            ? userPrompt
            : t('agentCursorModule.defaultAnalysisPrompt')
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
      setError(t('agentCursorModule.errStartAnalysis', { message: error.message }));
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
        setCurrentStep('README.md generated successfully!');
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
    const statusKey = `jobStatus_${status}`;
    const statusLabel = t(`agentCursorModule.${statusKey}`, { defaultValue: status });
    setError(t('agentCursorModule.errAnalysisStatus', {
      status: statusLabel,
      message: translateAgentCursorApiStep(message, t)
    }));
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
        alert(t('agentCursorModule.alertSaveOk'));
      } else {
        throw new Error('Failed to save to library');
      }
    } catch (error) {
      console.error('Error saving to library:', error);
      alert(t('agentCursorModule.alertSaveFail'));
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
        <h1>{t('agentCursorModule.title')}</h1>
        <p>
          {t('agentCursorModule.intro')}
        </p>
      </div>

      {/* Quick Templates */}
      <div className="quick-templates">
        <h3>{t('agentCursorModule.quickTemplates')}</h3>
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
        <label htmlFor="repoUrl">{t('agentCursorModule.labelGithubUrl')}</label>
        <div className="input-group">
          <input
            id="repoUrl"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder={t('agentCursorModule.placeholderGithubUrl')}
            disabled={isAnalyzing}
          />
          <button 
            className="detect-btn"
            onClick={detectBranches}
            disabled={isAnalyzing || !repoUrl}
          >
            {t('agentCursorModule.detectBranches')}
          </button>
        </div>
        
        <div className="branch-input">
          <label htmlFor="branch">{t('agentCursorModule.labelBranch')}</label>
          <input
            id="branch"
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder={t('agentCursorModule.placeholderBranch')}
            disabled={isAnalyzing}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {t('agentCursorModule.labelUserPrompt')}
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder={t('agentCursorModule.placeholderUserPrompt')}
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
            {t('agentCursorModule.launchAnalysis')}
          </button>
          <button
            className="reset-btn"
            onClick={resetForm}
            disabled={isAnalyzing}
          >
            {t('agentCursorModule.resetForm')}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="progress-container">
          <div className="progress-header">
            <h3>{t('agentCursorModule.analysisProgress')}</h3>
            <span className="progress-percentage">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="current-step">{translateAgentCursorApiStep(currentStep, t)}</div>
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
            <h3>{t('agentCursorModule.generatedReadme')}</h3>
            <button className="save-btn" onClick={saveToLibrary}>
              {t('agentCursorModule.saveToTrainingLibrary')}
            </button>
          </div>
          <div className="readme-preview">
            <pre>{result.readme_content}</pre>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="how-it-works">
        <h3>{t('agentCursorModule.howItWorks')}</h3>
        <ol>
          <li><strong>{t('agentCursorModule.how1Strong')}</strong> {t('agentCursorModule.how1Rest')}</li>
          <li><strong>{t('agentCursorModule.how2Strong')}</strong> {t('agentCursorModule.how2Rest')}</li>
          <li><strong>{t('agentCursorModule.how3Strong')}</strong> {t('agentCursorModule.how3Rest')}</li>
          <li><strong>{t('agentCursorModule.how4Strong')}</strong> {t('agentCursorModule.how4Rest')}</li>
          <li><strong>{t('agentCursorModule.how5Strong')}</strong> {t('agentCursorModule.how5Rest')}</li>
          <li><strong>{t('agentCursorModule.how6Strong')}</strong> {t('agentCursorModule.how6Rest')}</li>
        </ol>
      </div>

      {/* Important Note */}
      <div className="important-note">
        <strong>{t('agentCursorModule.importantNoteStrong')}</strong> {t('agentCursorModule.importantNoteRest')}
      </div>
    </div>
  );
};

export default AgentCursorAI; 