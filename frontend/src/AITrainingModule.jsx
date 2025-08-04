import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import Quiz from './Quiz';
import CertificationBadge from './CertificationBadge';

const AITrainingModule = ({ user }) => {
  const { colors } = useTheme();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [view, setView] = useState('lessons'); // 'lessons', 'certifications', 'path'

  // Sample lesson data (in real implementation, this would come from API)
  const lessons = [
    {
      id: "ai_intro_001",
      title: "Introduction to AI",
      description: "Learn the fundamentals of Artificial Intelligence",
      difficulty: "Beginner",
      duration: "30 min",
      sections: [
        {
          heading: "What is Artificial Intelligence?",
          content: "Artificial Intelligence (AI) refers to machines that can simulate human intelligence — including reasoning, learning, and problem-solving. It powers everything from chatbots to autonomous vehicles.",
          type: "text"
        },
        {
          heading: "Subfields of AI",
          content: [
            "Machine Learning (ML): Learn from data without explicit programming",
            "Natural Language Processing (NLP): Understand and generate human language", 
            "Computer Vision: Interpret and analyze visual input"
          ],
          type: "list"
        },
        {
          heading: "Key Concepts",
          definitions: [
            { term: "AI", definition: "Machine-driven cognitive capability" },
            { term: "ML", definition: "AI technique using data to learn" },
            { term: "LLM", definition: "Large Language Model trained on vast text datasets" }
          ],
          type: "definitions"
        }
      ],
      quiz: [
        {
          question: "What does AI stand for?",
          options: {
            "a": "Artificial Intelligence",
            "b": "Automated Information", 
            "c": "Advanced Integration"
          },
          correct_answer: "a"
        },
        {
          question: "Which is a subfield of AI?",
          options: {
            "a": "Photosynthesis",
            "b": "Machine Learning",
            "c": "Quantum Painting"
          },
          correct_answer: "b"
        },
        {
          question: "What does NLP stand for?",
          options: {
            "a": "Natural Language Processing",
            "b": "Neural Link Protocol",
            "c": "Network Logic Programming"
          },
          correct_answer: "a"
        }
      ]
    },
    {
      id: "ml_fundamentals_002",
      title: "Machine Learning Fundamentals",
      description: "Master the basics of ML algorithms and techniques",
      difficulty: "Intermediate",
      duration: "45 min",
      sections: [
        {
          heading: "Types of Machine Learning",
          content: "Machine Learning can be categorized into three main types: Supervised Learning, Unsupervised Learning, and Reinforcement Learning.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "Which type of ML uses labeled data?",
          options: {
            "a": "Unsupervised Learning",
            "b": "Supervised Learning",
            "c": "Reinforcement Learning"
          },
          correct_answer: "b"
        }
      ]
    }
  ];

  const certifications = [
    {
      id: "ai_basics_cert",
      title: "AI Basics Certificate",
      description: "Complete introduction to AI concepts",
      requirements: ["ai_intro_001"],
      level: "Beginner"
    },
    {
      id: "ml_practitioner_cert",
      title: "ML Practitioner",
      description: "Advanced machine learning skills",
      requirements: ["ai_intro_001", "ml_fundamentals_002"],
      level: "Intermediate"
    }
  ];

  const learningPath = [
    {
      stage: 1,
      title: "Foundation",
      lessons: ["ai_intro_001"],
      description: "Build your AI foundation"
    },
    {
      stage: 2,
      title: "Core Skills",
      lessons: ["ml_fundamentals_002"],
      description: "Develop practical ML skills"
    }
  ];

  useEffect(() => {
    // Load user progress from localStorage
    const savedProgress = localStorage.getItem(`ai_training_progress_${user?.uid || 'guest'}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    setLoading(false);
  }, [user]);

  const saveProgress = (lessonId, sectionIndex, quizCompleted = false) => {
    const newProgress = { 
      ...progress, 
      [lessonId]: { 
        section: sectionIndex, 
        quizCompleted: quizCompleted || progress[lessonId]?.quizCompleted || false 
      } 
    };
    setProgress(newProgress);
    localStorage.setItem(`ai_training_progress_${user?.uid || 'guest'}`, JSON.stringify(newProgress));
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson);
    const lessonProgress = progress[lesson.id];
    setCurrentSection(lessonProgress?.section || 0);
    setQuizCompleted(lessonProgress?.quizCompleted || false);
    setShowQuiz(false);
    setView('lessons');
  };

  const nextSection = () => {
    if (currentLesson && currentSection < currentLesson.sections.length - 1) {
      const newSection = currentSection + 1;
      setCurrentSection(newSection);
      saveProgress(currentLesson.id, newSection, quizCompleted);
    } else if (currentLesson && currentSection === currentLesson.sections.length - 1) {
      setShowQuiz(true);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      const newSection = currentSection - 1;
      setCurrentSection(newSection);
      saveProgress(currentLesson.id, newSection, quizCompleted);
      setShowQuiz(false);
    }
  };

  const handleQuizSubmit = (answers, scoreData) => {
    const quizResults = {
      lessonId: currentLesson.id,
      answers,
      score: scoreData,
      timestamp: new Date().toISOString()
    };
    
    const existingResults = JSON.parse(localStorage.getItem(`ai_quiz_results_${user?.uid || 'guest'}`) || '[]');
    existingResults.push(quizResults);
    localStorage.setItem(`ai_quiz_results_${user?.uid || 'guest'}`, JSON.stringify(existingResults));
  };

  const handleQuizComplete = (scoreData) => {
    setQuizCompleted(true);
    saveProgress(currentLesson.id, currentSection, true);
    setShowQuiz(false);
  };

  const checkCertificationEligibility = (cert) => {
    return cert.requirements.every(req => 
      progress[req]?.quizCompleted === true
    );
  };

  const getEarnedCertifications = () => {
    return certifications.filter(cert => checkCertificationEligibility(cert));
  };

  const renderSection = (section) => {
    switch (section.type) {
      case 'text':
        return <p style={{ lineHeight: 1.6, color: colors.text }}>{section.content}</p>;
      
      case 'list':
        return (
          <ul style={{ lineHeight: 1.6, color: colors.text }}>
            {section.content.map((item, index) => (
              <li key={index} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
        );
      
      case 'definitions':
        return (
          <div>
            {section.definitions.map((def, index) => (
              <div key={index} style={{ marginBottom: 16, padding: 12, background: colors.cardBackground, borderRadius: 8 }}>
                <strong style={{ color: colors.primary }}>{def.term}:</strong>
                <span style={{ color: colors.text, marginLeft: 8 }}>{def.definition}</span>
              </div>
            ))}
          </div>
        );
      
      default:
        return <p style={{ color: colors.text }}>{section.content}</p>;
    }
  };

  const renderCertifications = () => (
    <div>
      <h2 style={{ color: colors.text, marginBottom: 24 }}>🏆 Certifications</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        {certifications.map((cert) => {
          const earned = checkCertificationEligibility(cert);
          return (
            <CertificationBadge
              key={cert.id}
              certification={cert}
              earned={earned}
              onClick={() => console.log('View certification details')}
            />
          );
        })}
      </div>
    </div>
  );

  const renderLearningPath = () => (
    <div>
      <h2 style={{ color: colors.text, marginBottom: 24 }}>🗺️ Learning Path</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {learningPath.map((stage, index) => (
          <div key={stage.stage} style={{
            background: colors.cardBackground,
            borderRadius: 12,
            padding: 24,
            border: `1px solid ${colors.border}`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: -10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: colors.primary,
              color: 'white',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {stage.stage}
            </div>
            <div style={{ marginLeft: 20 }}>
              <h3 style={{ color: colors.text, marginBottom: 8 }}>{stage.title}</h3>
              <p style={{ color: colors.textSecondary, marginBottom: 16 }}>{stage.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {stage.lessons.map(lessonId => {
                  const lesson = lessons.find(l => l.id === lessonId);
                  const completed = progress[lessonId]?.quizCompleted;
                  return (
                    <span key={lessonId} style={{
                      background: completed ? '#e8f5e8' : colors.primaryLight,
                      color: completed ? '#4CAF50' : colors.primary,
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '0.8em',
                      fontWeight: 600
                    }}>
                      {completed ? '✅' : '📚'} {lesson?.title}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors.text }}>
        Loading AI Training Module...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, marginBottom: 8 }}>🤖 AI Learning & Training</h1>
          <p style={{ color: colors.textSecondary, fontSize: '1.1em' }}>
            Master AI concepts, tools, and best practices through interactive lessons
          </p>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[
              { key: 'lessons', label: '📚 Lessons', icon: '📚' },
              { key: 'path', label: '🗺️ Learning Path', icon: '🗺️' },
              { key: 'certifications', label: '🏆 Certifications', icon: '🏆' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                style={{
                  background: view === tab.key ? colors.primary : 'transparent',
                  color: view === tab.key ? 'white' : colors.text,
                  border: `1px solid ${view === tab.key ? colors.primary : colors.border}`,
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {view === 'certifications' && renderCertifications()}
        {view === 'path' && renderLearningPath()}
        
        {view === 'lessons' && !currentLesson && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {lessons.map((lesson) => {
              const lessonProgress = progress[lesson.id];
              const sectionProgress = lessonProgress?.section || 0;
              const progressPercent = (sectionProgress / lesson.sections.length) * 100;
              
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonSelect(lesson)}
                  style={{
                    background: colors.cardBackground,
                    borderRadius: 12,
                    padding: 24,
                    cursor: 'pointer',
                    border: `1px solid ${colors.border}`,
                    transition: 'all 0.2s ease',
                    boxShadow: colors.shadow
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
                  onMouseLeave={(e) => e.target.style.borderColor = colors.border}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ color: colors.text, marginBottom: 8 }}>{lesson.title}</h3>
                    <span style={{
                      background: lesson.difficulty === 'Beginner' ? '#e8f5e8' : '#fff3e0',
                      color: lesson.difficulty === 'Beginner' ? '#4CAF50' : '#FF9800',
                      padding: '2px 8px',
                      borderRadius: 8,
                      fontSize: '0.7em',
                      fontWeight: 600
                    }}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  <p style={{ color: colors.textSecondary, marginBottom: 16 }}>{lesson.description}</p>
                  
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.9em', color: colors.textSecondary }}>Progress</span>
                      <span style={{ fontSize: '0.9em', color: colors.textSecondary }}>
                        {sectionProgress} of {lesson.sections.length} sections
                      </span>
                    </div>
                    <div style={{
                      background: colors.border,
                      borderRadius: 4,
                      height: 8,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: colors.primary,
                        height: '100%',
                        width: `${progressPercent}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      background: colors.primaryLight,
                      color: colors.primary,
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: '0.8em'
                    }}>
                      ⏱️ {lesson.duration}
                    </span>
                    <span style={{
                      background: colors.primaryLight,
                      color: colors.primary,
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: '0.8em'
                    }}>
                      Quiz included
                    </span>
                    {lessonProgress?.quizCompleted && (
                      <span style={{
                        background: '#e8f5e8',
                        color: '#4CAF50',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: '0.8em'
                      }}>
                        ✅ Quiz completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentLesson && (
          <div style={{ background: colors.cardBackground, borderRadius: 12, padding: 32, boxShadow: colors.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: colors.text, marginBottom: 4 }}>{currentLesson.title}</h2>
                <p style={{ color: colors.textSecondary }}>
                  {showQuiz ? 'Quiz' : `Section ${currentSection + 1} of ${currentLesson.sections.length}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentLesson(null);
                  setShowQuiz(false);
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                ← Back to Lessons
              </button>
            </div>

            {showQuiz ? (
              <Quiz 
                quiz={currentLesson.quiz}
                onSubmit={handleQuizSubmit}
                onComplete={handleQuizComplete}
              />
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.9em', color: colors.textSecondary }}>Lesson Progress</span>
                    <span style={{ fontSize: '0.9em', color: colors.textSecondary }}>
                      {Math.round(((currentSection + 1) / currentLesson.sections.length) * 100)}% complete
                    </span>
                  </div>
                  <div style={{
                    background: colors.border,
                    borderRadius: 4,
                    height: 8,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: colors.primary,
                      height: '100%',
                      width: `${((currentSection + 1) / currentLesson.sections.length) * 100}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ color: colors.text, marginBottom: 16 }}>
                    {currentLesson.sections[currentSection].heading}
                  </h3>
                  {renderSection(currentLesson.sections[currentSection])}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={prevSection}
                    disabled={currentSection === 0}
                    style={{
                      background: currentSection === 0 ? colors.border : colors.primary,
                      color: currentSection === 0 ? colors.textSecondary : 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 6,
                      cursor: currentSection === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentSection === 0 ? 0.5 : 1
                    }}
                  >
                    ← Previous
                  </button>

                  <span style={{ color: colors.textSecondary }}>
                    Section {currentSection + 1} of {currentLesson.sections.length}
                  </span>

                  <button
                    onClick={nextSection}
                    style={{
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    {currentSection === currentLesson.sections.length - 1 ? '📝 Take Quiz' : 'Next →'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AITrainingModule; 