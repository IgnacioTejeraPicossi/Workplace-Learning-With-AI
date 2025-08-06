import React, { useState, useRef } from 'react';
import axios from 'axios';
import './RepoAnalyzerCursorAI.css';

export default function RepoAnalyzerCursorAI() {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [learningModule, setLearningModule] = useState(null);
  const [projectStructure, setProjectStructure] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [includeLearningModule, setIncludeLearningModule] = useState(true);
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/cursor-readme/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFiles(files);
      setProjectStructure(response.data.project_structure);
      setSuccess(response.data.message);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading files');
    } finally {
      setLoading(false);
    }
  };

  const generateReadme = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('project_name', projectName);
      formData.append('project_description', projectDescription);
      formData.append('include_learning_module', includeLearningModule);

      const response = await axios.post('/api/cursor-readme/generate', formData);

      setReadmeContent(response.data.readme_content);
      setLearningModule(response.data.learning_module);
      setSuccess('README generated successfully!');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Error generating README');
    } finally {
      setGenerating(false);
    }
  };

  const saveAsLearningModule = async () => {
    if (!readmeContent) {
      setError('No README content to save');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('project_name', projectName);
      formData.append('readme_content', readmeContent);

      const response = await axios.post('/api/cursor-readme/save-learning-module', formData);

      setSuccess('Learning module saved successfully!');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving learning module');
    }
  };

  const downloadReadme = () => {
    if (!readmeContent) return;
    
    const blob = new Blob([readmeContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cursor-readme-container">
      <div className="header">
        <h1>🚀 Repo Analyzer Cursor AI</h1>
        <p className="subtitle">
          Generate Cursor AI-quality documentation and learning modules from your project files
        </p>
      </div>

      {/* File Upload Section */}
      <div className="section">
        <h2>📁 Upload Project Files</h2>
        <p>Drag and drop your project files or click to select them</p>
        
        <div 
          ref={dropZoneRef}
          className="drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-content">
            <div className="upload-icon">📁</div>
            <p>Drag & drop files here or click to browse</p>
            <p className="file-types">Supports: .py, .js, .ts, .jsx, .tsx, .html, .css, .json, .md, etc.</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="file-list">
            <h3>Selected Files ({files.length})</h3>
            <div className="files">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button 
                    className="remove-file"
                    onClick={() => removeFile(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button 
              className="upload-btn"
              onClick={uploadFiles}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        )}
      </div>

      {/* Project Configuration */}
      {uploadedFiles.length > 0 && (
        <div className="section">
          <h2>⚙️ Project Configuration</h2>
          
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Project Description</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Brief description of your project"
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={includeLearningModule}
                onChange={(e) => setIncludeLearningModule(e.target.checked)}
              />
              Create Learning Module
            </label>
            <p className="help-text">
              Convert the generated README into a structured learning module for your training system
            </p>
          </div>

          {/* Project Structure Analysis */}
          {projectStructure && (
            <div className="project-structure">
              <h3>📊 Project Analysis</h3>
              <div className="structure-grid">
                <div className="structure-item">
                  <span className="structure-label">Backend Files:</span>
                  <span className="structure-value">{projectStructure.backend_files.length}</span>
                </div>
                <div className="structure-item">
                  <span className="structure-label">Frontend Files:</span>
                  <span className="structure-value">{projectStructure.frontend_files.length}</span>
                </div>
                <div className="structure-item">
                  <span className="structure-label">Config Files:</span>
                  <span className="structure-value">{projectStructure.config_files.length}</span>
                </div>
                <div className="structure-item">
                  <span className="structure-label">Technologies:</span>
                  <span className="structure-value">{projectStructure.technologies.join(', ') || 'None detected'}</span>
                </div>
              </div>
            </div>
          )}

          <button 
            className="generate-btn"
            onClick={generateReadme}
            disabled={generating || !projectName.trim()}
          >
            {generating ? 'Generating README...' : '🚀 Generate Cursor AI README'}
          </button>
        </div>
      )}

      {/* Generated README */}
      {readmeContent && (
        <div className="section">
          <h2>📄 Generated README</h2>
          
          <div className="readme-actions">
            <button className="action-btn" onClick={downloadReadme}>
              📥 Download README.md
            </button>
            {includeLearningModule && (
              <button className="action-btn" onClick={saveAsLearningModule}>
                🎓 Save as Learning Module
              </button>
            )}
          </div>

          <div className="readme-preview">
            <div className="readme-header">
              <h3>Preview</h3>
              <span className="file-name">{projectName}-README.md</span>
            </div>
            <div className="readme-content">
              <pre>{readmeContent}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Learning Module Preview */}
      {learningModule && (
        <div className="section">
          <h2>🎓 Learning Module Preview</h2>
          
          <div className="learning-module-info">
            <div className="module-stats">
              <div className="stat">
                <span className="stat-label">Sections:</span>
                <span className="stat-value">{learningModule.total_sections}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Duration:</span>
                <span className="stat-value">{learningModule.estimated_duration} min</span>
              </div>
              <div className="stat">
                <span className="stat-label">Difficulty:</span>
                <span className="stat-value">{learningModule.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="module-sections">
            {learningModule.sections?.map((section, index) => (
              <div key={index} className="section-preview">
                <h4>{section.title}</h4>
                <div className="section-content">
                  <pre>{section.content.substring(0, 200)}...</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="message error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="message success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}
    </div>
  );
} 