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
        type: 'repository_learning',
        difficulty: 'intermediate',
        estimated_time: '2-3 hours',
        topics: extractTopics(analysis.analysis_data),
        prerequisites: [],
        learning_objectives: generateLearningObjectives(analysis.analysis_data)
      };

      const response = await axios.post('/api/create-learning-module', learningModuleData);
      
      if (response.data.success) {
        setSuccess('Learning module created successfully!');
        await loadLearningModules();
        setTimeout(() => setSuccess(''), 3000);
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

  // Load learning modules
  const loadLearningModules = async () => {
    try {
      const response = await axios.get('/api/learning-modules');
      setLearningModules(response.data.modules || []);
    } catch (err) {
      console.error('Error loading learning modules:', err);
    }
  };

  // Generate quiz from analysis
  const generateQuiz = async (analysis) => {
    try {
      setError('');
      setSuccess('Generating quiz...');
      
      const quizData = {
        analysis_id: analysis._id,
        num_questions: 10,
        difficulty: 'medium',
        topics: extractTopics(analysis.analysis_data)
      };

      const response = await axios.post('/api/generate-quiz', quizData);
      
      if (response.data.quiz) {
        setQuizQuestions(response.data.quiz);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizCompleted(false);
        setScore(0);
        setSuccess('Quiz generated successfully! Start learning!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to generate quiz');
      }
    } catch (error) {
      console.error('Generate quiz error:', error);
      setError(`Failed to generate quiz: ${error.response?.data?.detail || error.message}`);
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

      {/* Saved Analyses Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ color: '#333', margin: 0 }}>
            📚 Available Repositories for Learning
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
              opacity: loadingSaved ? 0.6 : 1
            }}
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
                transition: 'all 0.2s ease'
              }}>
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
        <h2 style={{ color: '#333', marginBottom: '1rem' }}>
          📖 Your Learning Modules
        </h2>
        
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
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No learning modules created yet. Create your first one from a repository analysis above!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
            {learningModules.map((module) => (
              <div key={module._id} style={{ 
                background: '#fff', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#007bff', marginBottom: '1rem' }}>
                  {module.title}
                </h3>
                
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  {module.description}
                </p>
                
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>Difficulty:</strong> {module.difficulty}</p>
                  <p><strong>Estimated Time:</strong> {module.estimated_time}</p>
                  <p><strong>Topics:</strong> {module.topics?.join(', ') || 'General'}</p>
                </div>
                
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  📚 Start Learning
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
