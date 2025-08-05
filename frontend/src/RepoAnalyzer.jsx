import React, { useState } from 'react';
import axios from 'axios';

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
        format: 'both' // Generate both markdown and PDF
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
    if (!analysisResult?.documentation?.markdown) return;

    try {
      const response = await axios.post('/api/generate-quiz', {
        markdown_content: analysisResult.documentation.markdown,
        num_questions: 5,
        difficulty: 'medium'
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '2rem' }}>
        🔍 Repository Documentation Generator
      </h1>
      
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
      {analysisResult && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            📊 Analysis Results: {analysisResult.repo_name}
          </h2>
          
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '1px solid #ddd',
            marginBottom: '1rem'
          }}>
            <p><strong>Files Analyzed:</strong> {analysisResult.file_count}</p>
            <p><strong>Repository:</strong> {analysisResult.repo_name}</p>
            <p><strong>Branch Used:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{analysisResult.branch_used}</span></p>
          </div>

          {/* File Summaries */}
          <div style={{ marginBottom: '1rem' }}>
            <h3>📄 File Summaries</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(analysisResult.summaries).map(([filename, summary]) => (
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
            
            {analysisResult.documentation && (
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
      {analysisResult?.documentation && (
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
            
            {analysisResult.documentation.pdf_path && (
              <div style={{ marginTop: '1rem' }}>
                <a 
                  href={`/api/download-pdf/${analysisResult.documentation.pdf_path.split('/').pop()}`}
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
      {analysisResult?.quiz && (
        <div style={{ marginBottom: '2rem' }}>
          <h2>🧠 Generated Quiz</h2>
          
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            border: '1px solid #ddd'
          }}>
            {analysisResult.quiz.map((question, index) => (
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
    </div>
  );
} 