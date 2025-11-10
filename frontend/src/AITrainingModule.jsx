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
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // 'all', 'Beginner', 'Intermediate', 'Advanced', 'Expert'
  const [lessonsState, setLessonsState] = useState(null); // dynamic lessons from /ai-lessons/index.json

  // Comprehensive AI Learning Curriculum with 4 levels
  const embeddedLessons = [
    // ===== BEGINNER LEVEL =====
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
      id: "ai_ethics_002",
      title: "AI Ethics & Responsible AI",
      description: "Understanding bias, fairness, and responsible AI development",
      difficulty: "Beginner",
      duration: "25 min",
      sections: [
        {
          heading: "Why AI Ethics Matter",
          content: "As AI becomes more powerful, ethical considerations become crucial. We need to ensure AI systems are fair, transparent, and beneficial to society.",
          type: "text"
        },
        {
          heading: "Key Ethical Principles",
          content: [
            "Fairness: AI should not discriminate based on protected characteristics",
            "Transparency: AI decisions should be explainable",
            "Accountability: Humans remain responsible for AI outcomes",
            "Privacy: AI should respect user data and privacy"
          ],
          type: "list"
        }
      ],
      quiz: [
        {
          question: "What is a key principle of AI ethics?",
          options: {
            "a": "Speed at all costs",
            "b": "Fairness and transparency", 
            "c": "Maximum complexity"
          },
          correct_answer: "b"
        }
      ]
    },

    // ===== INTERMEDIATE LEVEL =====
    {
      id: "ml_fundamentals_003",
      title: "Machine Learning Fundamentals",
      description: "Master the basics of ML algorithms and techniques",
      difficulty: "Intermediate",
      duration: "45 min",
      sections: [
        {
          heading: "Types of Machine Learning",
          content: "Machine Learning can be categorized into three main types: Supervised Learning, Unsupervised Learning, and Reinforcement Learning.",
          type: "text"
        },
        {
          heading: "Supervised Learning",
          content: "Uses labeled training data to learn the relationship between input features and output labels. Examples include classification and regression.",
          type: "text"
        },
        {
          heading: "Common Algorithms",
          content: [
            "Linear Regression: For predicting continuous values",
            "Logistic Regression: For binary classification",
            "Decision Trees: For both classification and regression",
            "Random Forest: Ensemble of decision trees"
          ],
          type: "list"
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
        },
        {
          question: "What is Random Forest?",
          options: {
            "a": "A single decision tree",
            "b": "An ensemble of decision trees",
            "c": "A neural network"
          },
          correct_answer: "b"
        }
      ]
    },
    {
      id: "deep_learning_004",
      title: "Deep Learning Basics",
      description: "Neural networks, CNNs, RNNs and their applications",
      difficulty: "Intermediate",
      duration: "60 min",
      sections: [
        {
          heading: "What are Neural Networks?",
          content: "Neural networks are computing systems inspired by biological brains. They consist of interconnected nodes (neurons) that process information in layers.",
          type: "text"
        },
        {
          heading: "Convolutional Neural Networks (CNNs)",
          content: "Specialized for processing grid-like data such as images. They use convolutional layers to detect features like edges, textures, and patterns.",
          type: "text"
        },
        {
          heading: "Recurrent Neural Networks (RNNs)",
          content: "Designed for sequential data like text or time series. They maintain internal memory to process sequences of varying lengths.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What are CNNs best suited for?",
          options: {
            "a": "Text processing",
            "b": "Image processing",
            "c": "Audio processing"
          },
          correct_answer: "b"
        }
      ]
    },
    {
      id: "data_science_005",
      title: "Data Science Essentials",
      description: "Data preprocessing, feature engineering, and analysis",
      difficulty: "Intermediate",
      duration: "50 min",
      sections: [
        {
          heading: "Data Preprocessing",
          content: "The crucial first step in any ML project. Includes cleaning data, handling missing values, and normalizing features.",
          type: "text"
        },
        {
          heading: "Feature Engineering",
          content: "Creating new features from existing data to improve model performance. This is often where the most impact is made.",
          type: "text"
        },
        {
          heading: "Data Visualization",
          content: "Using charts and graphs to understand data patterns, identify outliers, and communicate insights effectively.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is feature engineering?",
          options: {
            "a": "Building physical features",
            "b": "Creating new features from existing data",
            "c": "Designing UI features"
          },
          correct_answer: "b"
        }
      ]
    },

    // ===== ADVANCED LEVEL =====
    {
      id: "advanced_ml_006",
      title: "Advanced ML Algorithms",
      description: "Ensemble methods, optimization, and advanced techniques",
      difficulty: "Advanced",
      duration: "75 min",
      sections: [
        {
          heading: "Ensemble Methods",
          content: "Combining multiple models to improve performance. Popular methods include Bagging, Boosting, and Stacking.",
          type: "text"
        },
        {
          heading: "Gradient Boosting",
          content: "Sequentially builds models where each new model focuses on the errors of previous models. XGBoost and LightGBM are popular implementations.",
          type: "text"
        },
        {
          heading: "Hyperparameter Tuning",
          content: "Optimizing model parameters using techniques like Grid Search, Random Search, and Bayesian Optimization.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is the main idea behind ensemble methods?",
          options: {
            "a": "Using only one model",
            "b": "Combining multiple models",
            "c": "Ignoring model performance"
          },
          correct_answer: "b"
        }
      ]
    },
    {
      id: "nlp_advanced_007",
      title: "Natural Language Processing",
      description: "Transformers, BERT, GPT and modern NLP techniques",
      difficulty: "Advanced",
      duration: "80 min",
      sections: [
        {
          heading: "The Transformer Architecture",
          content: "Revolutionary architecture that uses attention mechanisms to process sequences. It's the foundation for models like BERT and GPT.",
          type: "text"
        },
        {
          heading: "BERT (Bidirectional Encoder Representations)",
          content: "Pre-trained model that understands context from both directions. Excellent for tasks like question answering and text classification.",
          type: "text"
        },
        {
          heading: "GPT (Generative Pre-trained Transformer)",
          content: "Autoregressive model that generates text one token at a time. Used for text generation, completion, and conversation.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What does BERT stand for?",
          options: {
            "a": "Bidirectional Encoder Representations from Transformers",
            "b": "Basic Encoding and Recognition Tool",
            "c": "Binary Encoding and Response Technology"
          },
          correct_answer: "a"
        }
      ]
    },
    {
      id: "computer_vision_008",
      title: "Computer Vision Deep Dive",
      description: "Object detection, segmentation, and advanced CV techniques",
      difficulty: "Advanced",
      duration: "70 min",
      sections: [
        {
          heading: "Object Detection",
          content: "Identifying and locating objects in images. Popular models include YOLO, Faster R-CNN, and SSD.",
          type: "text"
        },
        {
          heading: "Image Segmentation",
          content: "Dividing images into meaningful regions. Includes semantic segmentation, instance segmentation, and panoptic segmentation.",
          type: "text"
        },
        {
          heading: "Transfer Learning",
          content: "Using pre-trained models on new tasks. This approach significantly reduces training time and improves performance.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What does YOLO stand for?",
          options: {
            "a": "You Only Look Once",
            "b": "Your Object Learning Online",
            "c": "Yet Another Learning Object"
          },
          correct_answer: "a"
        }
      ]
    },
    {
      id: "mlops_009",
      title: "MLOps & Production",
      description: "Model deployment, monitoring, and production ML systems",
      difficulty: "Advanced",
      duration: "65 min",
      sections: [
        {
          heading: "Model Deployment",
          content: "Moving models from development to production. Includes containerization, API development, and infrastructure setup.",
          type: "text"
        },
        {
          heading: "Model Monitoring",
          content: "Tracking model performance in production. Monitoring for data drift, model decay, and system health.",
          type: "text"
        },
        {
          heading: "CI/CD for ML",
          content: "Continuous Integration and Deployment for machine learning models. Automating testing, building, and deployment.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is MLOps?",
          options: {
            "a": "Machine Learning Operations",
            "b": "Model Learning Online",
            "c": "Machine Learning Online"
          },
          correct_answer: "a"
        }
      ]
    },

    // ===== EXPERT LEVEL =====
    {
      id: "research_frontiers_010",
      title: "Research Frontiers in AI",
      description: "Latest papers, cutting-edge techniques, and research directions",
      difficulty: "Expert",
      duration: "90 min",
      sections: [
        {
          heading: "Current Research Areas",
          content: "Exploring the latest developments in AI research including multimodal learning, few-shot learning, and AI alignment.",
          type: "text"
        },
        {
          heading: "Multimodal AI",
          content: "AI systems that can process and understand multiple types of data simultaneously (text, images, audio, video).",
          type: "text"
        },
        {
          heading: "AI Alignment",
          content: "Ensuring AI systems pursue the goals intended by their designers. A critical challenge for advanced AI systems.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is multimodal AI?",
          options: {
            "a": "AI that only processes text",
            "b": "AI that processes multiple data types",
            "c": "AI that only processes images"
          },
          correct_answer: "b"
        }
      ]
    },
    {
      id: "custom_models_011",
      title: "Custom AI Model Development",
      description: "Architecture design, optimization, and custom model building",
      difficulty: "Expert",
      duration: "100 min",
      sections: [
        {
          heading: "Model Architecture Design",
          content: "Designing custom neural network architectures for specific tasks. Understanding when and how to modify existing architectures.",
          type: "text"
        },
        {
          heading: "Advanced Optimization",
          content: "Techniques for training large models efficiently including mixed precision, gradient accumulation, and distributed training.",
          type: "text"
        },
        {
          heading: "Model Compression",
          content: "Reducing model size while maintaining performance. Techniques include pruning, quantization, and knowledge distillation.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is model compression?",
          options: {
            "a": "Making models physically smaller",
            "b": "Reducing model size while maintaining performance",
            "c": "Compressing model files"
          },
          correct_answer: "b"
        }
      ]
    },
    {
      id: "ai_architecture_012",
      title: "AI System Architecture",
      description: "Scalable AI infrastructure and system design",
      difficulty: "Expert",
      duration: "85 min",
      sections: [
        {
          heading: "Scalable AI Infrastructure",
          content: "Designing systems that can handle increasing loads and complexity. Includes microservices, load balancing, and auto-scaling.",
          type: "text"
        },
        {
          heading: "AI Pipeline Design",
          content: "End-to-end workflows from data ingestion to model serving. Includes data preprocessing, training, validation, and deployment.",
          type: "text"
        },
        {
          heading: "Performance Optimization",
          content: "Techniques for optimizing AI system performance including caching, batching, and asynchronous processing.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is an AI pipeline?",
          options: {
            "a": "A physical pipeline for AI",
            "b": "End-to-end workflow from data to deployment",
            "c": "A type of neural network"
          },
          correct_answer: "b"
        }
      ]
    },
    {
      id: "ai_strategy_013",
      title: "AI Strategy & Leadership",
      description: "Business AI implementation and strategic planning",
      difficulty: "Expert",
      duration: "70 min",
      sections: [
        {
          heading: "AI Strategy Development",
          content: "Creating comprehensive AI strategies that align with business objectives. Identifying opportunities and prioritizing initiatives.",
          type: "text"
        },
        {
          heading: "Change Management",
          content: "Managing organizational change when implementing AI. Training teams, updating processes, and measuring impact.",
          type: "text"
        },
        {
          heading: "AI ROI Measurement",
          content: "Measuring the return on investment for AI initiatives. Tracking metrics, costs, and business impact.",
          type: "text"
        }
      ],
      quiz: [
        {
          question: "What is AI ROI?",
          options: {
            "a": "Return on Investment for AI initiatives",
            "b": "AI Return Online",
            "c": "Artificial Intelligence Return"
          },
          correct_answer: "a"
        }
      ]
    }
  ];

  // Resolve lessons list (dynamic index with fallback to embedded)
  const lessons = lessonsState || embeddedLessons;

  // Load dynamic index.json from public (graceful fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/ai-lessons/index.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('index not found');
        const idx = await res.json();
        const mapped = idx.map((item) => {
          const fb = embeddedLessons.find(l => l.id === item.id) || {};
          return {
            id: item.id,
            title: item.title || fb.title || item.id,
            description: item.summary || fb.description || '',
            difficulty: item.difficulty || fb.difficulty || 'Beginner',
            duration: item.duration || fb.duration || '',
            sections: fb.sections || [],
            quiz: fb.quiz || [],
            contentUrl: item.contentUrl,
            relatedModules: item.relatedModules || fb.relatedModules || []
          };
        });
        if (mounted) setLessonsState(mapped);
      } catch (_) {
        if (mounted) setLessonsState(null); // fallback is embeddedLessons
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const applyLesson = (l) => {
      setCurrentLesson(l);
      const lessonProgress = progress[l.id];
      setCurrentSection(lessonProgress?.section || 0);
      setQuizCompleted(lessonProgress?.quizCompleted || false);
      setShowQuiz(false);
      setView('lessons');
    };

    if (lesson?.contentUrl) {
      fetch(lesson.contentUrl, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('content fetch failed')))
        .then(data => {
          const merged = {
            ...lesson,
            title: data.title || lesson.title,
            difficulty: data.difficulty || lesson.difficulty,
            duration: data.duration || lesson.duration,
            sections: data.sections || lesson.sections || [],
            quiz: data.quiz || lesson.quiz || [],
            relatedModules: data.relatedModules || lesson.relatedModules || []
          };
          applyLesson(merged);
        })
        .catch(() => applyLesson(lesson));
    } else {
      applyLesson(lesson);
    }
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
      
      case 'image':
        return (
          <div style={{ textAlign: 'center' }}>
            <img src={section.src} alt={section.alt || section.heading || 'diagram'} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, border: `1px solid ${colors.border}` }} />
            {section.caption && <div style={{ marginTop: 8, color: colors.textSecondary, fontSize: '0.9em' }}>{section.caption}</div>}
          </div>
        );

      case 'code':
        return (
          <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
            <code>{section.content}</code>
          </pre>
        );

      case 'exercise':
        return (
          <div style={{ border: `1px dashed ${colors.primary}`, padding: 12, borderRadius: 8 }}>
            {section.description && <p style={{ color: colors.text }}>{section.description}</p>}
            {Array.isArray(section.steps) && (
              <ol style={{ lineHeight: 1.6, color: colors.text, marginLeft: 18 }}>
                {section.steps.map((s, i) => <li key={i} style={{ marginBottom: 8 }}>{s}</li>)}
              </ol>
            )}
          </div>
        );
      
      case 'download':
        return (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {section.text && <span style={{ color: colors.text }}>{section.text}</span>}
            <a href={section.href} download style={{ 
              background: colors.primary, 
              color: 'white',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none'
            }}>
              ⬇ {section.label || 'Download'}
            </a>
            <button onClick={async ()=>{
              try {
                const res = await fetch(section.href, { cache: 'no-store' });
                const text = await res.text();
                await navigator.clipboard.writeText(text);
                alert('Dataset copied to clipboard');
              } catch (e) {
                alert('Could not copy dataset');
              }
            }} style={{ 
              background: colors.cardBackground,
              color: colors.text,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer'
            }}>
              📋 {section.copyLabel || 'Copy JSON'}
            </button>
            <button onClick={async ()=>{
              try {
                const res = await fetch(section.href, { cache: 'no-store' });
                const text = await res.text();
                localStorage.setItem('agenticRag_preload_dataset', text);
                window.dispatchEvent(new CustomEvent('navigateToModule', { detail: { module: 'agentic-rag', dataset: 'agenticRag_preload_dataset' } }));
              } catch (e) {
                alert('Could not open Agentic RAG with dataset');
              }
            }} style={{ 
              background: colors.primaryLight,
              color: colors.primary,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${colors.primary}`,
              cursor: 'pointer'
            }}>
              🚀 {section.openLabel || 'Open in Agentic RAG'}
            </button>
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
          <div>
            {/* Difficulty Level Headers */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: colors.text, marginBottom: 16, textAlign: 'center' }}>Choose Your Learning Path</h2>
              
              {/* Difficulty Filter Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => setDifficultyFilter('all')}
                  style={{
                    background: difficultyFilter === 'all' ? colors.primary : 'transparent',
                    color: difficultyFilter === 'all' ? 'white' : colors.text,
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.9em',
                    fontWeight: 600,
                    border: `2px solid ${colors.primary}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🌟 All Levels
                </button>
                <button
                  onClick={() => setDifficultyFilter('Beginner')}
                  style={{
                    background: difficultyFilter === 'Beginner' ? '#4CAF50' : 'transparent',
                    color: difficultyFilter === 'Beginner' ? 'white' : '#4CAF50',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.9em',
                    fontWeight: 600,
                    border: '2px solid #4CAF50',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🟢 Beginner (2)
                </button>
                <button
                  onClick={() => setDifficultyFilter('Intermediate')}
                  style={{
                    background: difficultyFilter === 'Intermediate' ? '#FF9800' : 'transparent',
                    color: difficultyFilter === 'Intermediate' ? 'white' : '#FF9800',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.9em',
                    fontWeight: 600,
                    border: '2px solid #FF9800',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🟡 Intermediate (3)
                </button>
                <button
                  onClick={() => setDifficultyFilter('Advanced')}
                  style={{
                    background: difficultyFilter === 'Advanced' ? '#2196F3' : 'transparent',
                    color: difficultyFilter === 'Advanced' ? 'white' : '#2196F3',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.9em',
                    fontWeight: 600,
                    border: '2px solid #2196F3',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔵 Advanced (4)
                </button>
                <button
                  onClick={() => setDifficultyFilter('Expert')}
                  style={{
                    background: difficultyFilter === 'Expert' ? '#E91E63' : 'transparent',
                    color: difficultyFilter === 'Expert' ? 'white' : '#E91E63',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.9em',
                    fontWeight: 600,
                    border: '2px solid #E91E63',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔴 Expert (4)
                </button>
              </div>
              
              {/* Difficulty Level Info */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  background: '#e8f5e8',
                  color: '#4CAF50',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.9em',
                  fontWeight: 600,
                  border: '2px solid #4CAF50'
                }}>
                  🟢 Beginner (2 modules)
                </div>
                <div style={{
                  background: '#fff3e0',
                  color: '#FF9800',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.9em',
                  fontWeight: 600,
                  border: '2px solid #FF9800'
                }}>
                  🟡 Intermediate (3 modules)
                </div>
                <div style={{
                  background: '#e3f2fd',
                  color: '#2196F3',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.9em',
                  fontWeight: 600,
                  border: '2px solid #2196F3'
                }}>
                  🔵 Advanced (4 modules)
                </div>
                <div style={{
                  background: '#fce4ec',
                  color: '#E91E63',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.9em',
                  fontWeight: 600,
                  border: '2px solid #E91E63'
                }}>
                  🔴 Expert (4 modules)
                </div>
              </div>
            </div>

                          {/* Lessons Grid */}
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <span style={{ 
                  color: colors.textSecondary, 
                  fontSize: '0.9em',
                  background: colors.cardBackground,
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: `1px solid ${colors.border}`
                }}>
                  📚 Showing {lessons.filter(lesson => difficultyFilter === 'all' || lesson.difficulty === difficultyFilter).length} of {lessons.length} modules
                </span>
              </div>
              
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                {lessons
                  .filter(lesson => difficultyFilter === 'all' || lesson.difficulty === difficultyFilter)
                  .map((lesson) => {
                const lessonProgress = progress[lesson.id];
                const sectionProgress = lessonProgress?.section || 0;
                const progressPercent = (sectionProgress / lesson.sections.length) * 100;
                
                // Get difficulty colors
                const getDifficultyColors = (difficulty) => {
                  switch(difficulty) {
                    case 'Beginner':
                      return { bg: '#e8f5e8', color: '#4CAF50', border: '#4CAF50' };
                    case 'Intermediate':
                      return { bg: '#fff3e0', color: '#FF9800', border: '#FF9800' };
                    case 'Advanced':
                      return { bg: '#e3f2fd', color: '#2196F3', border: '#2196F3' };
                    case 'Expert':
                      return { bg: '#fce4ec', color: '#E91E63', border: '#E91E63' };
                    default:
                      return { bg: '#f5f5f5', color: '#666', border: '#666' };
                  }
                };
                
                const difficultyColors = getDifficultyColors(lesson.difficulty);
                
                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson)}
                    style={{
                      background: colors.cardBackground,
                      borderRadius: 16,
                      padding: 24,
                      cursor: 'pointer',
                      border: `2px solid ${difficultyColors.border}`,
                      transition: 'all 0.3s ease',
                      boxShadow: colors.shadow,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-4px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = colors.shadow;
                    }}
                  >
                    {/* Difficulty Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: difficultyColors.bg,
                      color: difficultyColors.color,
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: '0.75em',
                      fontWeight: 700,
                      border: `1px solid ${difficultyColors.border}`
                    }}>
                      {lesson.difficulty}
                    </div>
                    
                    {/* Lesson Content */}
                    <div style={{ marginTop: 8 }}>
                      <h3 style={{ 
                        color: colors.text, 
                        marginBottom: 12, 
                        fontSize: '1.2em',
                        fontWeight: 600,
                        lineHeight: 1.3
                      }}>
                        {lesson.title}
                      </h3>
                      <p style={{ 
                        color: colors.textSecondary, 
                        marginBottom: 20,
                        lineHeight: 1.5,
                        fontSize: '0.95em'
                      }}>
                        {lesson.description}
                      </p>
                      
                      {/* Progress Bar */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.85em', color: colors.textSecondary, fontWeight: 500 }}>
                            Progress
                          </span>
                          <span style={{ fontSize: '0.85em', color: colors.textSecondary, fontWeight: 500 }}>
                            {sectionProgress} of {lesson.sections.length} sections
                          </span>
                        </div>
                        <div style={{
                          background: colors.border,
                          borderRadius: 8,
                          height: 10,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: `linear-gradient(90deg, ${difficultyColors.color}, ${difficultyColors.border})`,
                            height: '100%',
                            width: `${progressPercent}%`,
                            transition: 'width 0.4s ease',
                            borderRadius: 8
                          }} />
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: difficultyColors.bg,
                          color: difficultyColors.color,
                          padding: '6px 12px',
                          borderRadius: 16,
                          fontSize: '0.8em',
                          fontWeight: 500,
                          border: `1px solid ${difficultyColors.border}`
                        }}>
                          ⏱️ {lesson.duration}
                        </span>
                        <span style={{
                          background: difficultyColors.bg,
                          color: difficultyColors.color,
                          padding: '6px 12px',
                          borderRadius: 16,
                          fontSize: '0.8em',
                          fontWeight: 500,
                          border: `1px solid ${difficultyColors.border}`
                        }}>
                          📚 {lesson.sections.length > 0 ? `${lesson.sections.length} sections` : (lesson.contentUrl ? 'sections in file' : '0 sections')}
                        </span>
                        <span style={{
                          background: difficultyColors.bg,
                          color: difficultyColors.color,
                          padding: '6px 12px',
                          borderRadius: 16,
                          fontSize: '0.8em',
                          fontWeight: 500,
                          border: `1px solid ${difficultyColors.border}`
                        }}>
                          🧠 Quiz included
                        </span>
                        {Array.isArray(lesson.relatedModules) && lesson.relatedModules.length > 0 && lesson.relatedModules.map((m) => (
                          <span key={m} onClick={(e)=>{
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('navigateToModule', { detail: { module: m } }));
                            }} style={{
                            background: colors.primaryLight,
                            color: colors.primary,
                            padding: '6px 10px',
                            borderRadius: 16,
                            fontSize: '0.75em',
                            fontWeight: 500,
                            border: `1px solid ${colors.primary}`,
                            cursor: 'pointer'
                          }}>
                            🔗 {m}
                          </span>
                        ))}
                        {lessonProgress?.quizCompleted && (
                          <span style={{
                            background: '#e8f5e8',
                            color: '#4CAF50',
                            padding: '6px 12px',
                            borderRadius: 16,
                            fontSize: '0.8em',
                            fontWeight: 500,
                            border: '1px solid #4CAF50'
                          }}>
                            ✅ Quiz completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

            {Array.isArray(currentLesson?.relatedModules) && currentLesson.relatedModules.length > 0 && (
              <div style={{ margin: '6px 0 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {currentLesson.relatedModules.map((m) => (
                  <span key={m} onClick={()=>{
                      window.dispatchEvent(new CustomEvent('navigateToModule', { detail: { module: m } }));
                    }} style={{ padding: '4px 10px', borderRadius: 12, background: colors.primaryLight, color: colors.primary, fontSize: '0.8em', cursor: 'pointer' }}>
                    🔗 {m}
                  </span>
                ))}
              </div>
            )}

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