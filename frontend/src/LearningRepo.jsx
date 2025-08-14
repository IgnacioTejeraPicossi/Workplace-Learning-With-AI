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

  // Load saved analyses on component mount
  useEffect(() => {
    loadSavedAnalyses();
  }, []);

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

  // Create learning module from analysis
  const createLearningModule = async (analysis) => {
    try {
      setError('');
      setSuccess('Creating learning module...');
      
      const learningModuleData = {
        title: `Learning Module: ${analysis.repo_name || 'Repository Analysis'}`,
        description: `Structured learning material based on analysis of ${analysis.repo_url}`,
        content: analysis.analysis_data?.documentation?.readme || 'No content available',
        analysis_data: analysis.analysis_data,
        repo_url: analysis.repo_url,
        repo_name: analysis.repo_name,
        branch_used: analysis.branch_used,
        created_at: new Date().toISOString(),
        type: 'repository_analysis',
        difficulty: 'intermediate',
        estimated_time: '2-3 hours',
        topics: extractTopics(analysis.analysis_data),
        prerequisites: [],
        learning_objectives: generateLearningObjectives(analysis.analysis_data)
      };

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

  // Generate quiz from analysis
  const generateQuiz = async (analysis) => {
    try {
      setError('');
      setSuccess('Generating quiz...');
      
      // First, we need to get the markdown content from the analysis
      // or generate it if it doesn't exist
      let markdownContent = '';
      
      if (analysis.analysis_data?.documentation?.readme) {
        markdownContent = analysis.analysis_data.documentation.readme;
      } else if (analysis.analysis_data?.summaries) {
        // Generate basic markdown from summaries if no documentation exists
        markdownContent = generateBasicMarkdown(analysis);
      } else {
        throw new Error('No content available for quiz generation');
      }
      
      const quizData = {
        markdown_content: markdownContent,
        num_questions: 10,
        difficulty: 'medium',
        analysis_id: analysis._id
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
              <div key={analysis._id} style={{ 
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
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
