import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function LearningRepo() {
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [learningModules, setLearningModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [learningProgress, setLearningProgress] = useState({});
  const [cursorAIDocs, setCursorAIDocs] = useState([]);
  const [loadingCursorAI, setLoadingCursorAI] = useState(false);
  const [selectedDocForReading, setSelectedDocForReading] = useState(null);
  const [selectedModuleForViewing, setSelectedModuleForViewing] = useState(null);

  // Load saved analyses on component mount
  useEffect(() => {
    loadSavedAnalyses();
    loadCursorAIDocs();
  }, []);

  // Handle navigation events from Babel Library
  useEffect(() => {
    const handleNavigateToModule = (event) => {
      const { resourceId, resourceTitle, targetPage, action, autoExpand, expandDocument } = event.detail;
      
      if (targetPage === 'document' && resourceId && expandDocument) {
        console.log(`🔍 [LearningRepo] Navigating to document: ${resourceId}, title: "${resourceTitle}"`);
        
        // Find the document by ID in saved analyses
        const targetAnalysis = savedAnalyses.find(analysis => analysis._id === resourceId);
        if (targetAnalysis) {
          // Set the selected analysis to show details
          setSelectedAnalysis(targetAnalysis);
          
          // Scroll to the document (optional)
          setTimeout(() => {
            const element = document.getElementById(`analysis-${resourceId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
        
        // Find the document by ID in Cursor AI docs
        const targetDoc = cursorAIDocs.find(doc => doc._id === resourceId);
        if (targetDoc) {
          // Set the selected doc for reading
          setSelectedDocForReading(targetDoc);
          
          // Scroll to the document (optional)
          setTimeout(() => {
            const element = document.getElementById(`cursor-doc-${resourceId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    };

    window.addEventListener('navigateToModule', handleNavigateToModule);
    return () => window.removeEventListener('navigateToModule', handleNavigateToModule);
  }, [savedAnalyses, cursorAIDocs]);

  // Load saved analyses
  const loadSavedAnalyses = async () => {
    try {
      setLoadingSaved(true);
      const response = await axios.get('/api/saved-analyses?limit=20');
      setSavedAnalyses(response.data.analyses || []);
    } catch (err) {
      console.error('Error loading saved analyses:', err);
      setError('Failed to load saved analyses');
    } finally {
      setLoadingSaved(false);
    }
  };

  // Load Cursor AI documentation
  const loadCursorAIDocs = async () => {
    try {
      setLoadingCursorAI(true);
      const response = await axios.get('/api/cursor-ai-docs');
      if (response.data.success) {
        const docs = response.data.docs || [];
        setCursorAIDocs(docs);
        console.log(`Loaded ${docs.length} Cursor AI documents`);
        
        // Debug: Log the structure of the first document
        if (docs.length > 0) {
          console.log('First document structure:', docs[0]);
          console.log('First document ID:', docs[0]._id);
          console.log('First document ID type:', typeof docs[0]._id);
        }
      } else {
        console.error('Failed to load Cursor AI docs:', response.data.message);
      }
    } catch (err) {
      console.error('Error loading Cursor AI docs:', err);
    } finally {
      setLoadingCursorAI(false);
    }
  };

  // Create learning module from analysis or Cursor AI document
  const createLearningModule = async (doc) => {
    try {
      setError('');
      setSuccess('Creating learning module...');
      
      // Handle both Cursor AI documents and repository analyses
      let learningModuleData;
      
      if (doc.type === 'imported_readme' && doc.source === 'cursor_ai_automation') {
        // This is a Cursor AI document
        learningModuleData = {
          title: `Learning Module: ${doc.title}`,
          description: `Structured learning material based on Cursor AI analysis of ${doc.repo_name || 'repository'}`,
          content: doc.content || 'No content available',
          analysis_data: {
            documentation: { readme: doc.content },
            source: 'cursor_ai_automation',
            repo_name: doc.repo_name,
            repo_url: doc.repo_url
          },
          repo_url: doc.repo_url || '',
          repo_name: doc.repo_name || doc.title.replace('README - ', ''),
          branch_used: doc.branch_used || 'main',
          created_at: new Date().toISOString(),
          type: 'cursor_ai_analysis',
          difficulty: 'intermediate',
          estimated_time: '2-3 hours',
          topics: ['documentation', 'repository_analysis', 'cursor_ai'],
          prerequisites: [],
          learning_objectives: [
            'Understand the repository structure and purpose',
            'Learn from the generated documentation',
            'Apply best practices identified in the analysis'
          ]
        };
      } else {
        // This is a repository analysis
        learningModuleData = {
          title: `Learning Module: ${doc.repo_name || 'Repository Analysis'}`,
          description: `Structured learning material based on analysis of ${doc.repo_url}`,
          content: doc.analysis_data?.documentation?.readme || 'No content available',
          analysis_data: doc.analysis_data,
          repo_url: doc.repo_url,
          repo_name: doc.repo_name,
          branch_used: doc.branch_used,
          created_at: new Date().toISOString(),
          type: 'repository_analysis',
          difficulty: 'intermediate',
          estimated_time: '2-3 hours',
          topics: extractTopics(doc.analysis_data),
          prerequisites: [],
          learning_objectives: generateLearningObjectives(doc.analysis_data)
        };
      }

      const response = await axios.post('/api/create-learning-module', learningModuleData);
      
      if (response.data.success) {
        setSuccess(`Learning module created successfully! Module ID: ${response.data.module_id}`);
        console.log('Created learning module:', response.data.module);
        
        // Add the new module to the list immediately
        const newModule = response.data.module;
        setLearningModules(prev => [newModule, ...prev]);
        
        // Also reload from server to ensure consistency
        await loadLearningModules();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`Failed to create learning module: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Create learning module error:', error);
      setError(`Failed to create learning module: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Start learning a specific module
  const startLearning = (module) => {
    setActiveModule(module);
    // Initialize progress if not exists
    if (!learningProgress[module._id]) {
      setLearningProgress(prev => ({
        ...prev,
        [module._id]: {
          started: new Date().toISOString(),
          completed: false,
          currentSection: 0,
          sections: generateLearningSections(module)
        }
      }));
    }
  };

  // Generate learning sections from module content
  const generateLearningSections = (module) => {
    const sections = [];
    
    // Add overview section
    sections.push({
      title: "Overview",
      content: module.description,
      type: "text"
    });
    
    // Add repository analysis content
    if (module.analysis_data) {
      if (module.analysis_data.structure) {
        sections.push({
          title: "Project Structure",
          content: module.analysis_data.structure,
          type: "analysis"
        });
      }
      
      if (module.analysis_data.insights) {
        sections.push({
          title: "Key Insights",
          content: module.analysis_data.insights,
          type: "insights"
        });
      }
      
      if (module.analysis_data.documentation?.readme) {
        sections.push({
          title: "Documentation",
          content: module.analysis_data.documentation.readme,
          type: "documentation"
        });
      }
    }
    
    // Add learning objectives
    if (module.learning_objectives) {
      sections.push({
        title: "Learning Objectives",
        content: module.learning_objectives,
        type: "objectives"
      });
    }
    
    return sections;
  };

  // Navigate to next section
  const nextSection = () => {
    if (activeModule && learningProgress[activeModule._id]) {
      const progress = learningProgress[activeModule._id];
      if (progress.currentSection < progress.sections.length - 1) {
        setLearningProgress(prev => ({
          ...prev,
          [activeModule._id]: {
            ...prev[activeModule._id],
            currentSection: prev[activeModule._id].currentSection + 1
          }
        }));
      }
    }
  };

  // Navigate to previous section
  const prevSection = () => {
    if (activeModule && learningProgress[activeModule._id]) {
      const progress = learningProgress[activeModule._id];
      if (progress.currentSection > 0) {
        setLearningProgress(prev => ({
          ...prev,
          [activeModule._id]: {
            ...prev[activeModule._id],
            currentSection: prev[activeModule._id].currentSection - 1
          }
        }));
      }
    }
  };

  // Complete module
  const completeModule = () => {
    if (activeModule) {
      setLearningProgress(prev => ({
        ...prev,
        [activeModule._id]: {
          ...prev[activeModule._id],
          completed: true,
          completedAt: new Date().toISOString()
        }
      }));
      setSuccess(`🎉 Congratulations! You've completed "${activeModule.title}"`);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // Go back to modules list
  const backToModules = () => {
    setActiveModule(null);
  };

  // Render section content based on type
  const renderSectionContent = (section) => {
    switch (section.type) {
      case 'text':
        return <p style={{ margin: 0, lineHeight: '1.6' }}>{section.content}</p>;
      
      case 'analysis':
        return (
          <div>
            {section.content.languages && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Languages:</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {section.content.languages.map((lang, index) => (
                    <span key={index} style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {section.content.frameworks && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Frameworks:</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {section.content.frameworks.map((fw, index) => (
                    <span key={index} style={{
                      background: '#f3e5f5',
                      color: '#7b1fa2',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {section.content.file_structure && (
              <div>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>File Structure:</h4>
                <pre style={{
                  background: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  border: '1px solid #e0e0e0'
                }}>
                  {JSON.stringify(section.content.file_structure, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      
      case 'insights':
        return (
          <div>
            {section.content.architecture_pattern && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Architecture Pattern:</h4>
                <p style={{ margin: 0, padding: '0.5rem', background: '#e8f5e8', borderRadius: '4px', color: '#2e7d32' }}>
                  {section.content.architecture_pattern}
                </p>
              </div>
            )}
            
            {section.content.project_type && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Project Type:</h4>
                <p style={{ margin: 0, padding: '0.5rem', background: '#fff3e0', borderRadius: '4px', color: '#f57c00' }}>
                  {section.content.project_type}
                </p>
              </div>
            )}
            
            {section.content.complexity_score && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Complexity Score:</h4>
                <div style={{
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${section.content.complexity_score}%`,
                      height: '100%',
                      background: section.content.complexity_score > 70 ? '#f44336' : 
                                section.content.complexity_score > 40 ? '#ff9800' : '#4caf50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    {section.content.complexity_score}/100
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'documentation':
        return (
          <div>
            <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Documentation:</h4>
            <div style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {section.content}
              </pre>
            </div>
          </div>
        );
      
      case 'objectives':
        return (
          <div>
            <h4 style={{ color: '#007bff', marginBottom: '0.5rem' }}>Learning Objectives:</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {Array.isArray(section.content) ? section.content.map((objective, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  {objective}
                </li>
              )) : (
                <li>{section.content}</li>
              )}
            </ul>
          </div>
        );
      
      default:
        return <p style={{ margin: 0, lineHeight: '1.6' }}>{JSON.stringify(section.content, null, 2)}</p>;
    }
  };

  // Extract topics from analysis data
  const extractTopics = (analysisData) => {
    const topics = [];
    
    if (analysisData.structure?.languages) {
      topics.push(...analysisData.structure.languages.map(lang => `Programming in ${lang}`));
    }
    
    if (analysisData.structure?.frameworks) {
      topics.push(...analysisData.structure.frameworks.map(fw => `Working with ${fw}`));
    }
    
    if (analysisData.insights?.architecture_pattern) {
      topics.push(`Architecture: ${analysisData.insights.architecture_pattern}`);
    }
    
    if (analysisData.insights?.project_type) {
      topics.push(`Project Type: ${analysisData.insights.project_type}`);
    }
    
    return topics.length > 0 ? topics : ['Repository Analysis', 'Code Structure', 'Best Practices'];
  };

  // Generate learning objectives
  const generateLearningObjectives = (analysisData) => {
    const objectives = [
      'Understand the repository structure and architecture',
      'Learn the technologies and frameworks used',
      'Identify best practices and patterns',
      'Apply knowledge to similar projects'
    ];
    
    if (analysisData.insights?.complexity_score) {
      objectives.push(`Handle projects with complexity level: ${analysisData.insights.complexity_score}`);
    }
    
    return objectives;
  };

  // Generate basic markdown from analysis data for quiz generation
  const generateBasicMarkdown = (analysis) => {
    let markdown = `# ${analysis.repo_name || 'Repository'} Analysis\n\n`;
    
    if (analysis.analysis_data?.insights) {
      const insights = analysis.analysis_data.insights;
      markdown += `## Project Overview\n\n`;
      markdown += `- **Project Type**: ${insights.project_type || 'Unknown'}\n`;
      markdown += `- **Language**: ${insights.language || 'Unknown'}\n`;
      markdown += `- **Framework**: ${insights.framework || 'Unknown'}\n`;
      markdown += `- **Architecture Pattern**: ${insights.architecture_pattern || 'Unknown'}\n`;
      markdown += `- **Complexity Score**: ${insights.complexity_score || 'Unknown'}\n\n`;
    }
    
    if (analysis.analysis_data?.structure) {
      const structure = analysis.analysis_data.structure;
      markdown += `## Code Structure\n\n`;
      
      if (structure.languages && structure.languages.length > 0) {
        markdown += `### Languages Used\n`;
        structure.languages.forEach(lang => {
          markdown += `- ${lang}\n`;
        });
        markdown += `\n`;
      }
      
      if (structure.frameworks && structure.frameworks.length > 0) {
        markdown += `### Frameworks\n`;
        structure.frameworks.forEach(fw => {
          markdown += `- ${fw}\n`;
        });
        markdown += `\n`;
      }
    }
    
    if (analysis.analysis_data?.summaries) {
      markdown += `## File Analysis\n\n`;
      Object.entries(analysis.analysis_data.summaries).forEach(([filename, summary]) => {
        markdown += `### ${filename}\n`;
        markdown += `${summary}\n\n`;
      });
    }
    
    return markdown;
  };

  // Load learning modules
  const loadLearningModules = async () => {
    try {
      console.log('Loading learning modules...');
      const response = await axios.get('/api/learning-modules');
      console.log('Learning modules response:', response.data);
      
      if (response.data.success) {
        setLearningModules(response.data.modules || []);
        console.log(`Loaded ${response.data.modules?.length || 0} learning modules`);
      } else {
        console.error('Failed to load learning modules:', response.data.message);
        setError(`Failed to load learning modules: ${response.data.message}`);
      }
    } catch (err) {
      console.error('Error loading learning modules:', err);
      setError(`Error loading learning modules: ${err.message}`);
    }
  };

  // Generate quiz from analysis or Cursor AI document
  const generateQuiz = async (doc) => {
    try {
      setError('');
      setSuccess('Generating quiz...');
      
      // Get markdown content from either Cursor AI document or repository analysis
      let markdownContent = '';
      
      if (doc.type === 'imported_readme' && doc.source === 'cursor_ai_automation') {
        // This is a Cursor AI document - use the content directly
        markdownContent = doc.content || '';
      } else if (doc.analysis_data?.documentation?.readme) {
        // This is a repository analysis
        markdownContent = doc.analysis_data.documentation.readme;
      } else if (doc.analysis_data?.summaries) {
        // Generate basic markdown from summaries if no documentation exists
        markdownContent = generateBasicMarkdown(doc);
      } else {
        throw new Error('No content available for quiz generation');
      }
      
      if (!markdownContent || markdownContent.trim().length < 100) {
        throw new Error('Content too short for quiz generation');
      }
      
      const quizData = {
        markdown_content: markdownContent,
        num_questions: 10,
        difficulty: 'medium',
        analysis_id: doc._id
      };

      console.log('Sending quiz data:', quizData);
      console.log('Markdown content length:', markdownContent.length);

      const response = await axios.post('/api/generate-quiz', quizData);
      
      console.log('Quiz response:', response.data);
      
      if (response.data.quiz && Array.isArray(response.data.quiz) && response.data.quiz.length > 0) {
        setQuizQuestions(response.data.quiz);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizCompleted(false);
        setScore(0);
        setSuccess(`Quiz generated successfully! ${response.data.quiz.length} questions ready. Start learning!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('Invalid quiz response:', response.data);
        setError('Failed to generate quiz: Invalid response format from server');
      }
    } catch (error) {
      console.error('Generate quiz error:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      setError(`Failed to generate quiz: ${errorMessage}`);
    }
  };

  // Delete analysis
  const deleteAnalysis = async (analysis) => {
    try {
      setError('');
      setSuccess('Deleting analysis...');
      
      const response = await axios.delete(`/api/delete-analysis/${analysis._id}`);
      
      if (response.data.success) {
        setSuccess('Analysis deleted successfully!');
        await loadSavedAnalyses(); // Reload the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to delete analysis: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Delete analysis error:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      setError(`Failed to delete analysis: ${errorMessage}`);
    }
  };

  // Delete learning module
  const deleteLearningModule = async (module) => {
    try {
      setError('');
      setSuccess('Deleting learning module...');
      
      const response = await axios.delete(`/api/learning-modules/${module._id}`);
      
      if (response.data.success) {
        setSuccess('Learning module deleted successfully!');
        await loadLearningModules(); // Reload the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to delete learning module: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Delete learning module error:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      setError(`Failed to delete learning module: ${errorMessage}`);
    }
  };

  // Cleanup old analyses (older than 30 days)
  const cleanupOldAnalyses = async () => {
    try {
      setError('');
      setSuccess('Cleaning up old analyses...');
      
      const response = await axios.post('/api/cleanup-old-analyses');
      
      if (response.data.success) {
        const deletedCount = response.data.deleted_count || 0;
        setSuccess(`Cleanup completed! Removed ${deletedCount} old analyses.`);
        await loadSavedAnalyses(); // Reload the list
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`Failed to cleanup: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      const errorMessage = error.response?.data?.detail || error.message;
      setError(`Failed to cleanup: ${errorMessage}`);
    }
  };

  // Handle quiz answer
  const handleQuizAnswer = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  // Submit quiz
  const submitQuiz = () => {
    let correctAnswers = 0;
    
    quizQuestions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / quizQuestions.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setScore(0);
  };

  // Helper function to clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Delete Cursor AI document
  const deleteCursorAIDoc = async (docId) => {
    try {
      setError('');
      setSuccess('Deleting Cursor AI document...');
      
      // Debug logging
      console.log('Attempting to delete document with ID:', docId);
      console.log('ID type:', typeof docId);
      console.log('ID length:', docId ? docId.length : 'undefined');
      console.log('Full document object:', cursorAIDocs.find(doc => doc._id === docId));
      
      // Validate ID before sending
      if (!docId || typeof docId !== 'string' || docId.trim() === '') {
        setError('Invalid document ID: ID is empty or not a string');
        return;
      }
      
      const response = await axios.delete(`/api/delete-cursor-ai-doc/${docId}`);
      
      if (response.data.success) {
        setSuccess('Cursor AI document deleted successfully!');
        await loadCursorAIDocs(); // Reload the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to delete Cursor AI document: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Delete Cursor AI document error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;
      setError(`Failed to delete Cursor AI document: ${errorMessage}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '2rem' }}>
        🎓 Learning Repository - Convert Analysis to Study Material
      </h1>
      
      <p style={{ 
        color: '#666', 
        fontSize: '1.1rem', 
        marginBottom: '2rem',
        lineHeight: '1.6'
      }}>
        Transform your analyzed repositories into structured learning materials. 
        Create comprehensive study modules, generate quizzes, and track your learning progress.
      </p>

      {/* Error and Success Messages */}
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          border: '1px solid #f5c6cb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ {error}</span>
          <button onClick={clearMessages} style={{ background: 'none', border: 'none', color: '#721c24', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          border: '1px solid #c3e6cb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✅ {success}</span>
          <button onClick={clearMessages} style={{ background: 'none', border: 'none', color: '#155724', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              🗑️ Confirm Deletion
            </h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Are you sure you want to delete the analysis for <strong>{deleteConfirm.repo_name}</strong>?
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              This will permanently remove the analysis, documentation, quizzes, and learning modules associated with this repository.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAnalysis(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cursor AI Documentation Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ color: '#333', margin: 0 }}>
              🤖 Cursor AI Generated Documentation
            </h2>
            {cursorAIDocs.length > 0 && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.9rem', 
                color: '#666',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <span>📊 Total: {cursorAIDocs.length} documents</span>
                <span style={{ color: '#28a745' }}>✨ Automatically generated by Cursor AI</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={loadCursorAIDocs}
              disabled={loadingCursorAI}
              style={{
                padding: '0.5rem 1rem',
                background: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingCursorAI ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: loadingCursorAI ? 0.6 : 1
              }}
            >
              {loadingCursorAI ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {loadingCursorAI ? (
          <p>Loading Cursor AI documentation...</p>
        ) : cursorAIDocs.length === 0 ? (
          <div style={{ 
            padding: '2rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🤖</div>
            <p style={{ color: '#666', fontStyle: 'italic', margin: '0.5rem 0' }}>
              No Cursor AI documentation found
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
              Use the "Agent Cursor AI" module to generate documentation!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
            {cursorAIDocs.map((doc) => (
              <div key={doc._id} id={`cursor-doc-${doc._id}`} style={{ 
                background: '#fff', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                {/* Cursor AI indicator */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: '#17a2b8',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  🤖 Cursor AI
                </div>
                
                <h3 style={{ 
                  color: '#17a2b8', 
                  marginBottom: '1rem',
                  fontSize: '1.2rem',
                  paddingRight: '6rem'
                }}>
                  {doc.title || 'Untitled Document'}
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>Type:</strong> {doc.type || 'Unknown'}</p>
                  <p><strong>Source:</strong> {doc.source || 'Cursor AI'}</p>
                  <p><strong>Created:</strong> {new Date(doc.created_at).toLocaleDateString()}</p>
                  <p><strong>Content Length:</strong> {doc.content ? `${doc.content.length} characters` : 'No content'}</p>
                </div>

                {/* Content Preview */}
                {doc.content && (
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.5rem', 
                    background: '#f8f9fa', 
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    maxHeight: '150px',
                    overflow: 'hidden'
                  }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Content Preview:</strong>
                    </p>
                    <div style={{
                      background: '#fff',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      fontSize: '0.8rem',
                      lineHeight: '1.4',
                      color: '#333'
                    }}>
                      {doc.content.length > 200 ? 
                        `${doc.content.substring(0, 200)}...` : 
                        doc.content
                      }
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => setSelectedDocForReading(doc)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    title="Read the complete document"
                  >
                    📖 Read
                  </button>
                  
                  <button
                    onClick={() => createLearningModule(doc)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🎓 Create Learning Module
                  </button>
                  
                  <button
                    onClick={() => generateQuiz(doc)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🧠 Generate Quiz
                  </button>

                  <button
                    onClick={() => deleteCursorAIDoc(doc._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    title="Delete this Cursor AI document"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Analyses Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ color: '#333', margin: 0 }}>
              📚 Available Repositories for Learning
            </h2>
            {savedAnalyses.length > 0 && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.9rem', 
                color: '#666',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <span>📊 Total: {savedAnalyses.length} repositories</span>
                {savedAnalyses.some(analysis => {
                  const daysOld = (new Date() - new Date(analysis.created_at)) / (1000 * 60 * 60 * 24);
                  return daysOld > 30;
                }) && (
                  <span style={{ color: '#ffc107' }}>⚠️ Some analyses are over 30 days old</span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                opacity: loadingSaved ? 0.6 : 1
              }}
            >
              {loadingSaved ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
            <button
              onClick={() => cleanupOldAnalyses()}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              title="Remove analyses older than 30 days"
            >
              🧹 Cleanup Old
            </button>
          </div>
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📚</div>
            <p style={{ color: '#666', fontStyle: 'italic', margin: '0.5rem 0' }}>
              No repositories found for learning
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
              Analyze repositories in other sections to create learning materials here!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
            {savedAnalyses.map((analysis) => (
              <div key={analysis._id} id={`analysis-${analysis._id}`} style={{ 
                background: '#fff', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                {/* Age indicator */}
                {(() => {
                  const daysOld = (new Date() - new Date(analysis.created_at)) / (1000 * 60 * 60 * 24);
                  if (daysOld > 30) {
                    return (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: '#ffc107',
                        color: '#212529',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ {Math.floor(daysOld)}d old
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <h3 style={{ 
                  color: '#007bff', 
                  marginBottom: '1rem',
                  fontSize: '1.2rem'
                }}>
                  {analysis.repo_name || 'Unknown Repository'}
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>Repository:</strong> {analysis.repo_url}</p>
                  <p><strong>Branch:</strong> {analysis.branch_used || 'Unknown'}</p>
                  <p><strong>Files Analyzed:</strong> {analysis.analysis_data?.summaries ? Object.keys(analysis.analysis_data.summaries).length : 0}</p>
                  <p><strong>Date:</strong> {new Date(analysis.created_at).toLocaleDateString()}</p>
                  
                  {/* Additional Analysis Info */}
                  {analysis.analysis_data?.insights && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      background: '#f8f9fa', 
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      <p style={{ margin: '0.25rem 0' }}>
                        <strong>Type:</strong> {analysis.analysis_data.insights.project_type || 'Unknown'}
                      </p>
                      <p style={{ margin: '0.25rem 0' }}>
                        <strong>Language:</strong> {analysis.analysis_data.insights.language || 'Unknown'}
                      </p>
                      {analysis.analysis_data.insights.complexity_score && (
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Complexity:</strong> {analysis.analysis_data.insights.complexity_score}/10
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => createLearningModule(analysis)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🎓 Create Learning Module
                  </button>
                  
                  <button
                    onClick={() => generateQuiz(analysis)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🧠 Generate Quiz
                  </button>
                  
                  <button
                    onClick={() => setDeleteConfirm(analysis)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    title="Delete this repository analysis"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Section */}
      {quizQuestions.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>
            🧠 Learning Quiz
          </h2>
          
          {!quizCompleted ? (
            <div style={{ 
              background: '#fff', 
              padding: '2rem', 
              borderRadius: '8px', 
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                <span>Progress: {Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}%</span>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                  {quizQuestions[currentQuestionIndex]?.question}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {quizQuestions[currentQuestionIndex]?.options?.map((option, optIndex) => (
                    <label key={optIndex} style={{ 
                      cursor: 'pointer',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: userAnswers[currentQuestionIndex] === option ? '#e3f2fd' : '#fff',
                      transition: 'all 0.2s ease'
                    }}>
                      <input 
                        type="radio" 
                        name={`question-${currentQuestionIndex}`} 
                        value={option}
                        checked={userAnswers[currentQuestionIndex] === option}
                        onChange={() => handleQuizAnswer(currentQuestionIndex, option)}
                        style={{ marginRight: '0.75rem' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: currentQuestionIndex === 0 ? '#ccc' : '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Previous
                </button>
                
                {currentQuestionIndex === quizQuestions.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              background: '#fff', 
              padding: '2rem', 
              borderRadius: '8px', 
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#333', marginBottom: '1rem' }}>
                Quiz Completed! 🎉
              </h3>
              
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545'
              }}>
                {score}%
              </div>
              
              <p style={{ 
                fontSize: '1.2rem', 
                marginBottom: '1rem',
                color: score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545'
              }}>
                {score >= 70 ? 'Excellent! You have a great understanding!' : 
                 score >= 50 ? 'Good job! Keep learning!' : 
                 'Keep studying! Review the material and try again!'}
              </p>
              
              <button
                onClick={resetQuiz}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Take Quiz Again
              </button>
            </div>
          )}
        </div>
      )}

             {/* Learning Modules Section */}
       <div style={{ marginBottom: '2rem' }}>
         <div style={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center',
           marginBottom: '1rem'
         }}>
           <h2 style={{ color: '#333', margin: 0 }}>
             📖 Your Learning Modules
           </h2>
           {learningModules.length > 0 && (
             <span style={{ 
               background: '#28a745', 
               color: '#fff', 
               padding: '0.25rem 0.75rem', 
               borderRadius: '20px',
               fontSize: '0.9rem',
               fontWeight: 'bold'
             }}>
               {learningModules.length} module{learningModules.length !== 1 ? 's' : ''}
             </span>
           )}
         </div>
        
        <button
          onClick={loadLearningModules}
          style={{
            padding: '0.5rem 1rem',
            background: '#17a2b8',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          🔄 Load Learning Modules
        </button>
        
                 {learningModules.length === 0 ? (
           <div style={{ 
             padding: '2rem',
             background: '#f8f9fa',
             borderRadius: '8px',
             border: '1px solid #e9ecef',
             textAlign: 'center'
           }}>
             <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📖</div>
             <p style={{ color: '#666', fontStyle: 'italic', margin: '0.5rem 0' }}>
               No learning modules created yet
             </p>
             <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
               Create your first one from a repository analysis above!
             </p>
           </div>
         ) : (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
             {learningModules.map((module) => (
               <div key={module._id} style={{ 
                 background: '#fff', 
                 padding: '1.5rem', 
                 borderRadius: '8px', 
                 border: '1px solid #e9ecef',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                 position: 'relative'
               }}>
                 {/* Module type indicator */}
                 <div style={{
                   position: 'absolute',
                   top: '0.5rem',
                   right: '0.5rem',
                   background: '#28a745',
                   color: '#fff',
                   padding: '0.25rem 0.5rem',
                   borderRadius: '4px',
                   fontSize: '0.8rem',
                   fontWeight: 'bold'
                 }}>
                   🎓 Module
                 </div>
                 
                 {/* Progress indicator */}
                 {learningProgress[module._id] && (
                   <div style={{
                     position: 'absolute',
                     top: '0.5rem',
                     left: '0.5rem',
                     background: learningProgress[module._id].completed ? '#28a745' : '#ffc107',
                     color: '#fff',
                     padding: '0.25rem 0.5rem',
                     borderRadius: '4px',
                     fontSize: '0.8rem',
                     fontWeight: 'bold'
                   }}>
                     {learningProgress[module._id].completed ? '✅ Completed' : '🔄 In Progress'}
                   </div>
                 )}
                 
                 <h3 style={{ color: '#007bff', marginBottom: '1rem', paddingRight: '4rem' }}>
                   {module.title}
                 </h3>
                 
                 <p style={{ color: '#666', marginBottom: '1rem' }}>
                   {module.description}
                 </p>
                 
                 {/* Repository info */}
                 {module.repo_name && (
                   <div style={{ 
                     marginBottom: '1rem', 
                     padding: '0.5rem', 
                     background: '#f8f9fa', 
                     borderRadius: '4px',
                     fontSize: '0.9rem'
                   }}>
                     <p style={{ margin: '0.25rem 0' }}>
                       <strong>Repository:</strong> {module.repo_name}
                     </p>
                     {module.repo_url && (
                       <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#666' }}>
                         {module.repo_url}
                       </p>
                     )}
                   </div>
                 )}
                 
                 <div style={{ marginBottom: '1rem' }}>
                   <p><strong>Difficulty:</strong> {module.difficulty}</p>
                   <p><strong>Estimated Time:</strong> {module.estimated_time}</p>
                   <p><strong>Topics:</strong> {module.topics?.join(', ') || 'General'}</p>
                   <p><strong>Created:</strong> {new Date(module.created_at).toLocaleDateString()}</p>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button
                     onClick={() => startLearning(module)}
                     style={{
                       padding: '0.5rem 1rem',
                       background: '#007bff',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       flex: 1
                     }}
                   >
                     📚 Start Learning
                   </button>
                   
                   <button
                     onClick={() => setSelectedModuleForViewing(module)}
                     style={{
                       padding: '0.5rem 1rem',
                       background: '#6c757d',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       fontSize: '0.9rem'
                     }}
                     title="View module details"
                   >
                     👁️ View
                   </button>

                   <button
                     onClick={() => deleteLearningModule(module)}
                     style={{
                       padding: '0.5rem 1rem',
                       background: '#dc3545',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       fontSize: '0.9rem'
                     }}
                     title="Delete this learning module"
                   >
                     🗑️ Delete
                   </button>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Active Learning Module View */}
      {activeModule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8f9fa'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#007bff' }}>
                  📚 {activeModule.title}
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  {learningProgress[activeModule._id]?.sections?.length || 0} sections • 
                  {learningProgress[activeModule._id]?.completed ? ' ✅ Completed' : ' 🔄 In Progress'}
                </p>
              </div>
              <button
                onClick={backToModules}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '2rem'
            }}>
              {learningProgress[activeModule._id]?.sections && (
                <div>
                  {/* Progress Bar */}
                  <div style={{
                    marginBottom: '2rem',
                    background: '#e9ecef',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: '#28a745',
                      height: '100%',
                      width: `${((learningProgress[activeModule._id].currentSection + 1) / learningProgress[activeModule._id].sections.length) * 100}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Current Section */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#333', marginBottom: '1rem' }}>
                      {learningProgress[activeModule._id].sections[learningProgress[activeModule._id].currentSection].title}
                    </h3>
                    
                    <div style={{
                      background: '#f8f9fa',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      {renderSectionContent(learningProgress[activeModule._id].sections[learningProgress[activeModule._id].currentSection])}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={prevSection}
                      disabled={learningProgress[activeModule._id].currentSection === 0}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: learningProgress[activeModule._id].currentSection === 0 ? '#ccc' : '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: learningProgress[activeModule._id].currentSection === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Previous
                    </button>

                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Section {learningProgress[activeModule._id].currentSection + 1} of {learningProgress[activeModule._id].sections.length}
                    </div>

                    {learningProgress[activeModule._id].currentSection === learningProgress[activeModule._id].sections.length - 1 ? (
                      <button
                        onClick={completeModule}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🎉 Complete Module
                      </button>
                    ) : (
                      <button
                        onClick={nextSection}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Reading Modal */}
      {selectedDocForReading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Close button */}
            <button
              onClick={() => setSelectedDocForReading(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close document"
            >
              ×
            </button>

            {/* Document header */}
            <div style={{ marginBottom: '1.5rem', paddingRight: '3rem' }}>
              <h2 style={{ color: '#333', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                {selectedDocForReading.title}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                <p><strong>Type:</strong> {selectedDocForReading.type}</p>
                <p><strong>Source:</strong> {selectedDocForReading.source}</p>
                <p><strong>Created:</strong> {new Date(selectedDocForReading.created_at).toLocaleDateString()}</p>
                <p><strong>Content Length:</strong> {selectedDocForReading.content?.length || 0} characters</p>
                {selectedDocForReading.repo_name && <p><strong>Repository:</strong> {selectedDocForReading.repo_name}</p>}
                {selectedDocForReading.repo_url && <p><strong>URL:</strong> {selectedDocForReading.repo_url}</p>}
              </div>
            </div>

            {/* Document content */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              maxHeight: '60vh',
              overflow: 'auto',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {selectedDocForReading.content || 'No content available'}
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setSelectedDocForReading(null);
                  createLearningModule(selectedDocForReading);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🎓 Create Learning Module
              </button>
              
              <button
                onClick={() => {
                  setSelectedDocForReading(null);
                  generateQuiz(selectedDocForReading);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🧠 Generate Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Module Details Modal */}
      {selectedModuleForViewing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Close button */}
            <button
              onClick={() => setSelectedModuleForViewing(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close module details"
            >
              ×
            </button>

            {/* Module header */}
            <div style={{ marginBottom: '1.5rem', paddingRight: '3rem' }}>
              <h2 style={{ color: '#333', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                {selectedModuleForViewing.title}
              </h2>
              <p style={{ color: '#666', margin: '0 0 1rem 0', fontSize: '1rem' }}>
                {selectedModuleForViewing.description}
              </p>
            </div>

            {/* Module details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#333', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Module Details</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <strong>Type:</strong> {selectedModuleForViewing.type}
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <strong>Difficulty:</strong> {selectedModuleForViewing.difficulty}
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <strong>Estimated Time:</strong> {selectedModuleForViewing.estimated_time}
                </div>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <strong>Created:</strong> {new Date(selectedModuleForViewing.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {selectedModuleForViewing.topics && selectedModuleForViewing.topics.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Topics:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {selectedModuleForViewing.topics.map((topic, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          margin: '0.25rem',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          borderRadius: '12px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedModuleForViewing.learning_objectives && selectedModuleForViewing.learning_objectives.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Learning Objectives:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {selectedModuleForViewing.learning_objectives.map((objective, index) => (
                      <li key={index} style={{ marginBottom: '0.25rem' }}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedModuleForViewing.repo_url && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Repository URL:</strong>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    wordBreak: 'break-all',
                    fontSize: '0.9rem'
                  }}>
                    {selectedModuleForViewing.repo_url}
                  </div>
                </div>
              )}
            </div>

            {/* Module content preview */}
            {selectedModuleForViewing.content && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#333', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Content Preview</h3>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  maxHeight: '300px',
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace'
                }}>
                  {selectedModuleForViewing.content.length > 1000 ? 
                    `${selectedModuleForViewing.content.substring(0, 1000)}...` : 
                    selectedModuleForViewing.content
                  }
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setSelectedModuleForViewing(null);
                  startLearning(selectedModuleForViewing);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📚 Start Learning
              </button>
              
              <button
                onClick={() => setSelectedModuleForViewing(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
