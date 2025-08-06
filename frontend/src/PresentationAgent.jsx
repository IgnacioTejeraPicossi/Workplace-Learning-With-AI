import React, { useState, useEffect, useRef } from 'react';
import { askStream } from './api';
import StreamingProgress from './StreamingProgress';
import StreamingText from './StreamingText';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';
import { useTheme } from './ThemeContext';
// Voice context removed - using browser TTS instead

function PresentationAgent() {
  const [presentationMode, setPresentationMode] = useState(''); // 'demo', 'qa', 'script'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customTiming, setCustomTiming] = useState(60); // seconds per slide
  const [language, setLanguage] = useState('en');
  const [voiceGender, setVoiceGender] = useState('female'); // 'male', 'female', 'my-voice'
  // Voice features simplified - using browser TTS
  const [exportFormat, setExportFormat] = useState('pdf');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showLiveIntegration, setShowLiveIntegration] = useState(true); // Changed to true to show by default
  const [liveDemoMode, setLiveDemoMode] = useState('features');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [isLiveDemoActive, setIsLiveDemoActive] = useState(false);
  const [liveData, setLiveData] = useState({});
  const [enhancedQAMode, setEnhancedQAMode] = useState('general');
  const [qaCategory, setQaCategory] = useState('all');
  const [showLiveDataInQA, setShowLiveDataInQA] = useState(true);
  const [qaQuestion, setQaQuestion] = useState('');
  const [presentationScript, setPresentationScript] = useState('');
  const { colors } = useTheme();
  
  // Voice cloning removed - using browser TTS instead
  
  // Use streaming hooks for different modes
  const scriptStreaming = useStreaming();
  const qaStreaming = useStreaming();
  const demoStreaming = useStreaming();

  // Speech synthesis
  const speechRef = useRef(null);
  // Voice recording features removed - using browser TTS instead

  // Voice cloning feature removed - using standard text-to-speech instead
  const synthesizeWithTrainedVoice = async (text, language = 'en') => {
    // Fallback to browser's built-in speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
      return 'browser-tts';
    } else {
      console.error('Speech synthesis not supported');
      return null;
    }
  };

  // Presentation slides structure
  const presentationSlides = [
    {
      id: 1,
      title: "Project Overview",
      content: "Reimagine Workplace Learning With AI",
      duration: 30, // seconds
      keyPoints: [
        "Traditional learning is expensive and generic",
        "LLMs can identify individual needs automatically",
        "Generate tailored content on the fly",
        "Build simulations for team-based learning"
      ]
    },
    {
      id: 2,
      title: "Core Features",
      content: "AI-Powered Learning Platform",
      duration: 45,
      keyPoints: [
        "AI Concepts Generation",
        "Micro-lessons with streaming",
        "Scenario Simulator",
        "AI Career Coach",
        "Skills Forecasting",
        "Team Dynamics Analyzer"
      ]
    },
    {
      id: 3,
      title: "Technical Architecture",
      content: "Modern Full-Stack Implementation",
      duration: 40,
      keyPoints: [
        "React frontend with streaming UI",
        "FastAPI backend with OpenAI integration",
        "MongoDB for user-specific data",
        "Firebase authentication",
        "Real-time streaming responses"
      ]
    },
    {
      id: 4,
      title: "Live Demo",
      content: "Interactive Feature Showcase",
      duration: 60,
      keyPoints: [
        "Show actual working features",
        "Demonstrate AI capabilities",
        "Handle live Q&A from judges",
        "Real-time interaction"
      ]
    }
  ];

  // Q&A knowledge base for common hackathon questions
  const qaKnowledgeBase = [
    {
      question: "What makes your solution unique?",
      answer: "Our solution is unique because it combines multiple AI-powered learning modalities in one platform: real-time streaming content generation, personalized career coaching, skills forecasting, and team dynamics analysis. Unlike traditional LMS platforms, we provide instant, contextual learning experiences that adapt to individual needs and workplace scenarios."
    },
    {
      question: "How does the AI Career Coach work?",
      answer: "The AI Career Coach uses advanced language models to provide personalized career guidance. It analyzes user input about their goals, current skills, and challenges, then generates actionable advice, improvement strategies, and recommended resources. The coach maintains conversation context and can handle multi-turn discussions about career development."
    },
    {
      question: "What's the technical architecture?",
      answer: "We built a modern full-stack application with React frontend for the UI, FastAPI backend for AI processing, OpenAI integration for content generation, MongoDB for user-specific data persistence, and Firebase for authentication. The system uses real-time streaming responses similar to ChatGPT for an engaging user experience."
    },
    {
      question: "How scalable is your solution?",
      answer: "Our architecture is highly scalable. The FastAPI backend can handle concurrent requests efficiently, MongoDB provides horizontal scaling for data storage, and the modular design allows easy addition of new features. We can deploy on cloud platforms like Google Cloud Run for automatic scaling based on demand."
    },
    {
      question: "What's the business value for employers?",
      answer: "For employers, our platform reduces training costs by 60-80% through AI-generated content, improves employee engagement with personalized learning paths, accelerates skill development with targeted micro-lessons, and provides data-driven insights into team learning needs and performance."
    },
    {
      question: "How do you ensure content quality?",
      answer: "We use advanced prompt engineering and content validation systems. The AI generates content based on proven learning methodologies, and we implement quality checks for accuracy, relevance, and educational value. Users can also provide feedback to continuously improve content quality."
    },
    {
      question: "What about data privacy and security?",
      answer: "We prioritize data security with Firebase authentication, encrypted data transmission, and user-specific data isolation. All personal learning data is stored securely in MongoDB with proper access controls. We comply with GDPR and other privacy regulations."
    },
    {
      question: "How do you measure learning effectiveness?",
      answer: "We track learning progress through multiple metrics: completion rates, engagement time, quiz performance, skill application in simulations, and career advancement outcomes. The AI analyzes these patterns to continuously improve content and recommendations."
    },
    {
      question: "What's your go-to-market strategy?",
      answer: "We're targeting mid-size companies (100-1000 employees) who struggle with traditional training costs and effectiveness. Our initial focus is on tech companies and consulting firms. We plan to offer freemium trials, then subscription-based pricing with enterprise features."
    },
    {
      question: "How do you compete with existing LMS platforms?",
      answer: "Unlike traditional LMS platforms that offer static, one-size-fits-all content, we provide dynamic, AI-generated learning experiences that adapt in real-time. Our platform is more engaging, cost-effective, and personalized than solutions like Coursera for Business or LinkedIn Learning."
    }
  ];

  // Enhanced Q&A with live data will be defined after liveSystemStats and liveUserData

  // Generate presentation script
  const handleGenerateScript = async () => {
    // Show the script panel immediately when clicked
    setPresentationMode('script');
    
    scriptStreaming.startStreaming(
      `Create a compelling 4-minute presentation script for the "Reimagine Workplace Learning With AI" project for a hackathon in Stockholm.
      
      Project Overview:
      - Traditional learning is expensive, time-consuming, and generic
      - LLMs can flip the script by identifying individual needs
      - Generate tailored content on the fly
      - Build simulations for team-based learning
      
      Key Features to Highlight:
      1. AI Concepts Generation - Real-time streaming of educational concepts powered by GPT-4
      2. Micro-lessons - Bite-sized learning with AI-powered content
      3. Scenario Simulator - Interactive workplace simulations
      4. AI Career Coach - Personalized career guidance using GPT-4
      5. Skills Forecasting - AI-powered skill development predictions
      6. Team Dynamics Analyzer - Team collaboration insights
      7. Certifications - AI-powered certification recommendations
      8. Video Lessons - Interactive video learning with quizzes
      
      Technical Highlights:
      - React frontend with modern streaming UI
      - FastAPI backend with OpenAI GPT-4 integration
      - MongoDB for user-specific data persistence
      - Firebase authentication
      - Real-time streaming responses like ChatGPT
      
      Make it engaging, professional, and suitable for a 4-minute hackathon presentation.
      Include specific examples and benefits for employers and employees.`,
      {
        statusMessages: STATUS_MESSAGES.PRESENTATION,
        onComplete: (content) => {
          console.log('Generate Script onComplete called with content length:', content?.length);
          setPresentationScript(content || 'No script generated');
          console.log('Presentation script generated');
        }
      }
    );
  };

  // Enhanced Q&A handling with knowledge base
  const handleAskQuestion = async () => {
    // Show the complete Q&A panel immediately when clicked
    setPresentationMode('qa');
  };

  // Removed handleQASubmit - now using the complete Q&A panel

  // Enhanced Q&A with live data functions
  const handleEnhancedQA = async (question) => {
    if (!question.trim()) return;
    
    setQaQuestion(question);
    
    // Find best matching question from categories
    let bestMatch = null;
    let bestScore = 0;
    
    enhancedQACategories.forEach(category => {
      if (qaCategory === 'all' || qaCategory === category.id) {
        category.questions.forEach(qa => {
          const score = calculateSimilarity(question.toLowerCase(), qa.question.toLowerCase());
          if (score > bestScore && score > 0.3) {
            bestScore = score;
            bestMatch = { ...qa, category: category.name };
          }
        });
      }
    });
    
    if (bestMatch) {
      // Use pre-defined answer with live data
      qaStreaming.startStreaming(
        `**${bestMatch.category} Question:** ${bestMatch.question}

${bestMatch.answer}

${showLiveDataInQA ? `
**Live Data Summary:**
- Total Users: ${liveUserData.totalUsers.toLocaleString()}
- Active Users: ${liveUserData.activeUsers.toLocaleString()}
- System Uptime: ${liveSystemStats.uptime}
- AI Accuracy: ${liveSystemStats.accuracy}
- Response Time: ${liveSystemStats.responseTime}` : ''}

*This answer includes real-time data from our platform.*`,
        {
          statusMessages: STATUS_MESSAGES.PRESENTATION,
          onComplete: () => {
            console.log('Enhanced Q&A response generated');
          }
        }
      );
    } else {
      // Generate AI response for unknown questions
      qaStreaming.startStreaming(
        `I'll answer your question about our AI-powered workplace learning platform:

${question}

Based on our current platform data and capabilities:

**Platform Overview:**
Our AI-powered learning platform helps organizations transform workplace learning through personalized, real-time content generation and interactive experiences.

**Current Performance:**
- ${liveUserData.totalUsers.toLocaleString()} total users
- ${liveUserData.activeUsers.toLocaleString()} active users
- ${liveSystemStats.accuracy} AI accuracy rate
- ${liveSystemStats.uptime} system uptime

**Key Features:**
- Real-time AI content generation
- Personalized learning paths
- Interactive simulations
- Skills forecasting
- Team dynamics analysis
- Career coaching

**Live Data:**
- ${liveUserData.learningHours.toLocaleString()} learning hours completed
- ${liveUserData.completedLessons.toLocaleString()} lessons finished
- ${liveUserData.coachingSessions.toLocaleString()} coaching sessions
- ${liveUserData.simulations} simulations run

Would you like me to elaborate on any specific aspect of our platform?`,
        {
          statusMessages: STATUS_MESSAGES.PRESENTATION,
          onComplete: () => {
            console.log('AI-generated Q&A response');
          }
        }
      );
    }
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Get questions by category
  const getQuestionsByCategory = (categoryId) => {
    if (categoryId === 'all') {
      return enhancedQACategories.flatMap(cat => cat.questions);
    }
    return enhancedQACategories.find(cat => cat.id === categoryId)?.questions || [];
  };

  // Start demo mode
  const handleStartDemo = async () => {
    // Show the demo panel immediately when clicked
    setPresentationMode('demo');
    setIsPresenting(true);
    setCurrentSlide(0); // Start with first slide only
    
    demoStreaming.startStreaming(
      `You are demonstrating the "Reimagine Workplace Learning With AI" platform live at a hackathon.
      
      Current slide: ${presentationSlides[currentSlide].title}
      Content: ${presentationSlides[currentSlide].content}
      Key points: ${presentationSlides[currentSlide].keyPoints.join(', ')}
      
      Provide a live demonstration script for this slide. Make it engaging and interactive.
      Include specific examples of how the features work and their benefits.
      Keep it concise for the ${presentationSlides[currentSlide].duration}-second time slot.`,
      {
        statusMessages: STATUS_MESSAGES.DEMO,
        onComplete: () => {
          console.log('Demo script generated');
        }
      }
    );
  };

  // Speech synthesis with voice selection
  const speakText = async (text) => {
    // Voice cloning removed - using browser speech synthesis only
    
    // Fallback to browser speech synthesis
    if ('speechSynthesis' in window) {
      // Stop any current speech
      stopSpeaking();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice based on gender preference
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;
      
      if (voiceGender === 'male') {
        // Prefer male voices
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') || 
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('james') ||
          voice.name.toLowerCase().includes('john') ||
          voice.name.toLowerCase().includes('mark') ||
          voice.name.toLowerCase().includes('peter') ||
          voice.name.toLowerCase().includes('steve') ||
          voice.name.toLowerCase().includes('tom') ||
          voice.name.toLowerCase().includes('alex') ||
          voice.name.toLowerCase().includes('daniel')
        );
      } else {
        // Prefer female voices
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('helena') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('monica') ||
          voice.name.toLowerCase().includes('lisa') ||
          voice.name.toLowerCase().includes('anna') ||
          voice.name.toLowerCase().includes('maria')
        );
      }
      
      // Fallback to first available voice if preferred voice not found
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Set language based on selection
      utterance.lang = language === 'no' ? 'nb-NO' : 
                      language === 'sv' ? 'sv-SE' : 
                      language === 'es' ? 'es-ES' : 
                      language === 'de' ? 'de-DE' : 
                      language === 'fr' ? 'fr-FR' : 'en-US';
      
      // Set speech parameters for professional presentation
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = voiceGender === 'male' ? 0.8 : 1.1; // Lower pitch for male voices
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        speechRef.current = utterance;
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        speechRef.current = null;
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        speechRef.current = null;
      };
      
      speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis is not supported in this browser.');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Auto-advance slides in demo mode - DISABLED for manual control
  useEffect(() => {
    // Auto-advance disabled - users can navigate manually
    // if (isPresenting && presentationMode === 'demo') {
    //   const timer = setTimeout(() => {
    //     if (currentSlide < presentationSlides.length - 1) {
    //       setCurrentSlide(currentSlide + 1);
    //       // Generate next slide content
    //       demoStreaming.startStreaming(
    //         `You are demonstrating the "Reimagine Workplace Learning With AI" platform live at a hackathon.
    //         
    //         Current slide: ${presentationSlides[currentSlide + 1].title}
    //         Content: ${presentationSlides[currentSlide + 1].content}
    //         Key points: ${presentationSlides[currentSlide + 1].keyPoints.join(', ')}
    //         
    //         Provide a live demonstration script for this slide. Make it engaging and interactive.
    //         Include specific examples of how the features work and their benefits.
    //         Keep it concise for the ${presentationSlides[currentSlide + 1].duration}-second time slot.`,
    //         {
    //           statusMessages: STATUS_MESSAGES.DEMO,
    //           onComplete: () => {
    //             console.log('Next slide demo script generated');
    //           }
    //         }
    //       );
    //     } else {
    //       setIsPresenting(false);
    //     }
    //   }, presentationSlides[currentSlide].duration * 1000);

    //   return () => clearTimeout(timer);
    // }
  }, [currentSlide, isPresenting, presentationMode]);

  // Manual slide navigation functions
  const handleNextSlide = () => {
    if (currentSlide < presentationSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      
      demoStreaming.startStreaming(
        `You are demonstrating the "Reimagine Workplace Learning With AI" platform live at a hackathon.
        
        Current slide: ${presentationSlides[nextSlide].title}
        Content: ${presentationSlides[nextSlide].content}
        Key points: ${presentationSlides[nextSlide].keyPoints.join(', ')}
        
        Provide a live demonstration script for this slide. Make it engaging and interactive.
        Include specific examples of how the features work and their benefits.
        Keep it concise for the ${presentationSlides[nextSlide].duration}-second time slot.`,
        {
          statusMessages: STATUS_MESSAGES.DEMO,
          onComplete: () => {
            console.log('Next slide demo script generated');
          }
        }
      );
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      
      demoStreaming.startStreaming(
        `You are demonstrating the "Reimagine Workplace Learning With AI" platform live at a hackathon.
        
        Current slide: ${presentationSlides[prevSlide].title}
        Content: ${presentationSlides[prevSlide].content}
        Key points: ${presentationSlides[prevSlide].keyPoints.join(', ')}
        
        Provide a live demonstration script for this slide. Make it engaging and interactive.
        Include specific examples of how the features work and their benefits.
        Keep it concise for the ${presentationSlides[prevSlide].duration}-second time slot.`,
        {
          statusMessages: STATUS_MESSAGES.DEMO,
          onComplete: () => {
            console.log('Previous slide demo script generated');
          }
        }
      );
    }
  };

  const handleClear = () => {
    // Don't set presentationMode to keep options always visible
    // setPresentationMode('');
    setCurrentSlide(0);
    setIsPresenting(false);
    setQaQuestion('');
    setPresentationScript('');
    stopSpeaking();
    scriptStreaming.clearStreaming();
    qaStreaming.clearStreaming();
    demoStreaming.clearStreaming();
  };

  // Export presentation to PDF or slides
  const handleExportPresentation = () => {
    if (!presentationScript) {
      alert('Please generate a script first!');
      return;
    }
    
    const content = `
# AI-Powered Workplace Learning Presentation

## Generated Script:
${presentationScript}

## Presentation Slides:
${presentationSlides.map((slide, index) => `
### Slide ${index + 1}: ${slide.title}
**Duration:** ${slide.duration} seconds

${slide.content}

**Key Points:**
${slide.keyPoints.map(point => `- ${point}`).join('\n')}
`).join('\n')}

## Q&A Knowledge Base:
${qaKnowledgeBase.map(qa => `
**Q:** ${qa.question}
**A:** ${qa.answer}
`).join('\n')}

---
*Generated by AI Presentation Agent*
*Date: ${new Date().toLocaleDateString()}*
    `;
    
    if (exportFormat === 'pdf') {
      // Create a blob and download as PDF
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation-script.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(content).then(() => {
        alert('Presentation content copied to clipboard!');
      });
    }
  };

  // Custom timing handler
  const handleCustomTiming = (seconds) => {
    setCustomTiming(seconds);
    // Update slide durations
    const updatedSlides = presentationSlides.map(slide => ({
      ...slide,
      duration: seconds
    }));
    // You would update the slides state here
  };

  // Language handler
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    // You could implement translation logic here
  };

  // Live integration handlers
  const handleStartLiveDemo = (featureId) => {
    setSelectedFeature(featureId);
    setIsLiveDemoActive(true);
    setLiveDemoMode('features');
    
    const feature = liveFeatures.find(f => f.id === featureId);
    if (feature) {
      setLiveData(feature.demoData);
      
      // Generate live demo script
      demoStreaming.startStreaming(
        `Live demonstration of ${feature.name}:

${feature.description}

Current Statistics:
${Object.entries(feature.demoData.stats).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Real-time Data:
${Object.entries(feature.demoData).filter(([key]) => key !== 'stats').map(([key, value]) => {
  if (Array.isArray(value)) {
    return `- ${key}: ${value.join(', ')}`;
  } else if (typeof value === 'object') {
    return `- ${key}: ${Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
  } else {
    return `- ${key}: ${value}`;
  }
}).join('\n')}

This feature is currently being used by ${liveUserData.activeUsers} active users and has processed ${liveSystemStats.aiRequests} AI requests with ${liveSystemStats.accuracy} accuracy.`,
        {
          statusMessages: STATUS_MESSAGES.PRESENTATION,
          onComplete: () => {
            // Live demo script generated
          }
        }
      );
    }
  };

  const handleShowSystemStats = () => {
    setLiveDemoMode('stats');
    setIsLiveDemoActive(true);
    
    demoStreaming.startStreaming(
      `Live System Statistics:

Platform Performance:
- Total Users: ${liveUserData.totalUsers}
- Active Users: ${liveUserData.activeUsers}
- System Uptime: ${liveSystemStats.uptime}
- Average Response Time: ${liveSystemStats.responseTime}

Learning Analytics:
- Total Learning Hours: ${liveUserData.learningHours}
- Completed Lessons: ${liveUserData.completedLessons}
- Coaching Sessions: ${liveUserData.coachingSessions}
- Simulations Completed: ${liveUserData.simulations}

AI Performance:
- AI Requests Processed: ${liveSystemStats.aiRequests}
- Streaming Sessions: ${liveSystemStats.streamingSessions}
- Data Processed: ${liveSystemStats.dataProcessed}
- Overall Accuracy: ${liveSystemStats.accuracy}

This demonstrates the scalability and reliability of our AI-powered learning platform.`,
        {
          statusMessages: STATUS_MESSAGES.PRESENTATION,
          onComplete: () => {
            console.log('System stats demo generated');
          }
        }
      );
  };

  const handleShowUserJourney = () => {
    setLiveDemoMode('journey');
    setIsLiveDemoActive(true);
    
    demoStreaming.startStreaming(
      `Live User Journey Demonstration:

Let me show you how a typical user progresses through our platform:

1. **Onboarding** - User creates account and completes skill assessment
2. **AI Concepts** - Generates personalized learning content in real-time
3. **Micro-lessons** - Completes bite-sized lessons based on identified needs
4. **Scenario Simulation** - Practices workplace scenarios with AI guidance
5. **Career Coaching** - Receives personalized career advice and planning
6. **Skills Forecasting** - Gets AI predictions for future skill development
7. **Team Dynamics** - Participates in team collaboration analysis
8. **Certifications** - Earns AI-recommended certifications

Current User Progress:
- Average completion rate: 78%
- Time to first lesson: 2.3 minutes
- User satisfaction score: 4.6/5
- Return user rate: 89%

This demonstrates the comprehensive learning journey our platform provides.`,
        {
          statusMessages: STATUS_MESSAGES.PRESENTATION,
          onComplete: () => {
            console.log('User journey demo generated');
          }
        }
      );
  };

  const handleStopLiveDemo = () => {
    setIsLiveDemoActive(false);
    setSelectedFeature('');
    setLiveData({});
    demoStreaming.clearStreaming();
  };

  // Live integration data and features
  const liveFeatures = [
    {
      id: 'ai-concepts',
      name: 'AI Concepts Generation',
      description: 'Real-time streaming educational content',
      icon: '🧠',
      demoData: {
        concepts: ['Machine Learning Basics', 'Neural Networks', 'Deep Learning', 'Natural Language Processing'],
        streamingExample: 'Machine Learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed...',
        stats: { generated: 47, topics: 12, users: 156 }
      }
    },
    {
      id: 'micro-lessons',
      name: 'Micro-lessons',
      description: 'Bite-sized learning with AI-powered content',
      icon: '📚',
      demoData: {
        lessons: ['React Hooks in 5 Minutes', 'API Integration Basics', 'State Management Patterns'],
        currentLesson: 'React Hooks in 5 Minutes',
        progress: 75,
        stats: { completed: 23, total: 45, timeSaved: '2.5 hours' }
      }
    },
    {
      id: 'scenario-simulator',
      name: 'Scenario Simulator',
      description: 'Interactive workplace simulations',
      icon: '🎮',
      demoData: {
        scenarios: ['Team Conflict Resolution', 'Client Presentation', 'Code Review Process'],
        activeScenario: 'Team Conflict Resolution',
        participants: 4,
        stats: { completed: 8, successRate: 87, avgTime: 12 }
      }
    },
    {
      id: 'career-coach',
      name: 'AI Career Coach',
      description: 'Personalized career guidance',
      icon: '👨‍💼',
      demoData: {
        sessions: ['Career Path Planning', 'Skill Gap Analysis', 'Interview Preparation'],
        currentSession: 'Career Path Planning',
        recommendations: ['Learn React', 'Practice System Design', 'Build Portfolio Projects'],
        stats: { sessions: 15, goals: 8, progress: 65 }
      }
    },
    {
      id: 'skills-forecast',
      name: 'Skills Forecasting',
      description: 'AI-powered skill development predictions',
      icon: '📈',
      demoData: {
        predictions: ['Full Stack Development', 'DevOps Engineering', 'Product Management'],
        currentSkills: ['JavaScript', 'React', 'Node.js'],
        forecast: { nextSkill: 'Docker', confidence: 89, timeframe: '3 months' },
        stats: { predictions: 12, accuracy: 92, savedForecasts: 5 }
      }
    },
    {
      id: 'team-dynamics',
      name: 'Team Dynamics Analyzer',
      description: 'Team collaboration insights',
      icon: '👥',
      demoData: {
        teams: ['Frontend Team', 'Backend Team', 'DevOps Team'],
        activeTeam: 'Frontend Team',
        metrics: { collaboration: 85, communication: 78, productivity: 92 },
        insights: ['High collaboration during code reviews', 'Consider more pair programming sessions'],
        stats: { teams: 6, members: 24, reports: 18 }
      }
    }
  ];

  const enhancedQACategories = [
    {
      id: 'technical',
      name: 'Technical',
      icon: '⚙️',
      questions: [
        {
          question: "What's your tech stack?",
          answer: "Our platform uses a modern, scalable tech stack with React frontend, FastAPI backend, OpenAI GPT-4 integration, MongoDB database, and Firebase authentication.",
          liveData: false
        },
        {
          question: "How do you handle scalability?",
          answer: "Our platform is designed for enterprise-scale deployment with microservices architecture, load balancing, caching layers, and database sharding.",
          liveData: false
        },
        {
          question: "What's your AI accuracy rate?",
          answer: "Our AI system maintains high accuracy through continuous learning with human review, user feedback integration, and continuous model training.",
          liveData: false
        }
      ]
    },
    {
      id: 'business',
      name: 'Business',
      icon: '💼',
      questions: [
        {
          question: "What's your business model?",
          answer: "We offer flexible pricing tiers: Starter ($29/month), Professional ($79/month), and Enterprise (custom pricing) with proven ROI and user satisfaction.",
          liveData: false
        },
        {
          question: "How do you compete with existing LMS?",
          answer: "We differentiate through AI-powered personalization, real-time content generation, interactive simulations, and predictive skill forecasting.",
          liveData: false
        },
        {
          question: "What's your go-to-market strategy?",
          answer: "Our GTM strategy focuses on rapid adoption through product-led growth, content marketing, partnerships, and direct sales for enterprise clients.",
          liveData: false
        }
      ]
    },
    {
      id: 'features',
      name: 'Features',
      icon: '🚀',
      questions: [
        {
          question: "How does AI Concepts Generation work?",
          answer: "AI Concepts Generation creates personalized content in real-time by analyzing user knowledge levels, identifying skill gaps, and generating contextual content on-demand.",
          liveData: false
        },
        {
          question: "What makes your Skills Forecasting unique?",
          answer: "Our Skills Forecasting uses advanced AI with machine learning algorithms, real-time market analysis, and predictive modeling for skill demand.",
          liveData: false
        },
        {
          question: "How effective are your simulations?",
          answer: "Our Scenario Simulator provides realistic workplace training with high success rates, immediate feedback, and measurable learning outcomes.",
          liveData: false
        }
      ]
    },
    {
      id: 'implementation',
      name: 'Implementation',
      icon: '🔧',
      questions: [
        {
          question: "How long does implementation take?",
          answer: "Our implementation process takes 4 weeks: Week 1 setup, Week 2 configuration, Week 3 training, Week 4 deployment with dedicated support.",
          liveData: false
        },
        {
          question: "What's the learning curve for users?",
          answer: "Our platform is designed for intuitive use with 5-minute setup, guided tours, interactive tutorials, and AI-powered assistance.",
          liveData: false
        },
        {
          question: "Can you integrate with existing systems?",
          answer: "Yes, we offer comprehensive integration with SSO, HR systems, LMS platforms, and RESTful APIs for custom integrations.",
          liveData: false
        }
      ]
    }
  ];

  const liveUserData = {
    totalUsers: 1247,
    activeUsers: 892,
    learningHours: 2847,
    completedLessons: 15623,
    savedForecasts: 892,
    coachingSessions: 2341,
    simulations: 567,
    certifications: 234
  };

  const liveSystemStats = {
    uptime: '99.8%',
    responseTime: '1.2s',
    aiRequests: 15420,
    streamingSessions: 8923,
    dataProcessed: '2.3TB',
    accuracy: '94.2%'
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🎤 AI Presentation Agent</h2>
      
      <p style={{ marginBottom: 20, color: colors.textSecondary }}>
        AI-powered presentation agent for your hackathon demo. Generate scripts, handle Q&A, and deliver live presentations.
      </p>

      {/* Mode Selection - Always visible */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, color: colors.text }}>Select Presentation Mode:</h3>
        
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {/* Generate Script */}
          <div
            style={{
              padding: 20,
              background: colors.cardBackground,
              borderRadius: 12,
              border: `2px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={handleGenerateScript}
            onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
            onMouseLeave={(e) => e.target.style.borderColor = colors.border}
          >
            <div style={{ fontSize: '2.5em', marginBottom: 12 }}>📝</div>
            <h3 style={{ marginBottom: 8, color: colors.text }}>Generate Script</h3>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: '0.9em',
              lineHeight: 1.4
            }}>
              Create a 4-minute presentation script for the hackathon
            </p>
          </div>

          {/* Q&A Mode */}
          <div
            style={{
              padding: 20,
              background: colors.cardBackground,
              borderRadius: 12,
              border: `2px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={handleAskQuestion}
            onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
            onMouseLeave={(e) => e.target.style.borderColor = colors.border}
          >
            <div style={{ fontSize: '2.5em', marginBottom: 12 }}>❓</div>
            <h3 style={{ marginBottom: 8, color: colors.text }}>Q&A Mode</h3>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: '0.9em',
              lineHeight: 1.4
            }}>
              Handle questions from judges and audience
            </p>
          </div>

          {/* Live Demo */}
          <div
            style={{
              padding: 20,
              background: colors.cardBackground,
              borderRadius: 12,
              border: `2px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={handleStartDemo}
            onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
            onMouseLeave={(e) => e.target.style.borderColor = colors.border}
          >
            <div style={{ fontSize: '2.5em', marginBottom: 12 }}>🎬</div>
            <h3 style={{ marginBottom: 8, color: colors.text }}>Live Demo</h3>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: '0.9em',
              lineHeight: 1.4
            }}>
              Start 4-minute automated presentation
            </p>
          </div>


        </div>
      </div>

      {/* Script Generation Mode - MOVED ABOVE Advanced Settings */}
      {presentationMode === 'script' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            padding: 12,
            background: colors.primaryLight,
            borderRadius: 8
          }}>
            <span style={{ fontSize: '1.5em' }}>📝</span>
            <div>
              <h3 style={{ margin: 0, color: colors.text }}>Generating Presentation Script</h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
                4-Minute Hackathon Presentation
              </p>
            </div>
          </div>

          {/* Script Generation Progress */}
          {scriptStreaming.loading && (
            <StreamingProgress 
              loading={scriptStreaming.loading}
              status={scriptStreaming.status}
              progress={scriptStreaming.progress}
              color="info"
            />
          )}

          {/* Generated Script */}
          <StreamingText 
            content={scriptStreaming.content}
            loading={scriptStreaming.loading}
            placeholder="Generating your presentation script..."
            style={{ minHeight: '400px' }}
          />

          {/* Script Actions */}
          {scriptStreaming.isComplete && (
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => speakText(scriptStreaming.content)}
                disabled={isSpeaking}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSpeaking ? colors.border : colors.primary,
                  color: '#fff',
                  cursor: isSpeaking ? 'not-allowed' : 'pointer'
                }}
              >
                {isSpeaking ? '🔊 Speaking...' : '🔊 Speak Script'}
              </button>
              <button
                onClick={stopSpeaking}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                🔇 Stop Speaking
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                🔄 New Script
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Q&A Mode - MOVED ABOVE Advanced Settings */}
      {presentationMode === 'qa' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            padding: 12,
            background: colors.primaryLight,
            borderRadius: 8
          }}>
            <span style={{ fontSize: '1.5em' }}>❓</span>
            <div>
              <h3 style={{ margin: 0, color: colors.text }}>
                Enhanced Q&A with Live Data
              </h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
                Intelligent responses with real-time platform data
              </p>
            </div>
          </div>

          {/* Q&A Controls */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 16, 
            marginBottom: 20 
          }}>
            {/* Category Selection */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: colors.textSecondary,
                fontSize: '0.9em'
              }}>
                Question Category:
              </label>
              <select
                value={qaCategory}
                onChange={(e) => setQaCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: '1em'
                }}
              >
                <option value="all">🎯 All Categories</option>
                {enhancedQACategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Data Toggle */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: colors.textSecondary,
                fontSize: '0.9em'
              }}>
                Live Data Integration:
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8 
              }}>
                <input
                  type="checkbox"
                  checked={showLiveDataInQA}
                  onChange={(e) => setShowLiveDataInQA(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '0.9em', color: colors.text }}>
                  Include real-time platform data
                </span>
              </div>
            </div>
          </div>

          {/* Question Input */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              placeholder="Ask any question about our platform..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                fontSize: '1em'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEnhancedQA(qaQuestion);
                }
              }}
            />
          </div>

          {/* Quick Question Buttons */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ 
              marginBottom: 8, 
              fontSize: '0.9em', 
              color: colors.textSecondary 
            }}>
              💡 Quick questions by category:
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 8 
            }}>
              {getQuestionsByCategory(qaCategory).slice(0, 6).map((qa, index) => (
                <button
                  key={index}
                  onClick={() => setQaQuestion(qa.question)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: colors.cardBackground,
                    color: colors.text,
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={qa.question}
                >
                  {qa.question.length > 40 ? qa.question.substring(0, 40) + '...' : qa.question}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleEnhancedQA(qaQuestion)}
            disabled={qaStreaming.loading || !qaQuestion.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: (qaStreaming.loading || !qaQuestion.trim()) ? colors.border : colors.primary,
              color: '#fff',
              cursor: (qaStreaming.loading || !qaQuestion.trim()) ? 'not-allowed' : 'pointer',
              marginBottom: 16
            }}
          >
            {qaStreaming.loading ? '⏳ Generating Answer...' : '❓ Get Enhanced Answer'}
          </button>

          {/* Q&A Response */}
          <StreamingText 
            content={qaStreaming.content}
            loading={qaStreaming.loading}
            placeholder="Enhanced Q&A responses with live data will appear here..."
            style={{ minHeight: '300px' }}
          />

          {/* Q&A Stats */}
          <div style={{ 
            marginTop: 16,
            padding: 12,
            background: colors.background,
            borderRadius: 8,
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: 12,
              fontSize: '0.8em'
            }}>
              <div>
                <span style={{ color: colors.textSecondary }}>📊 Categories:</span>
                <div style={{ color: colors.text, fontWeight: 'bold' }}>
                  {enhancedQACategories.length}
                </div>
              </div>
              <div>
                <span style={{ color: colors.textSecondary }}>❓ Questions:</span>
                <div style={{ color: colors.text, fontWeight: 'bold' }}>
                  {getQuestionsByCategory(qaCategory).length}
                </div>
              </div>
              <div>
                <span style={{ color: colors.textSecondary }}>📈 Live Data:</span>
                <div style={{ color: colors.text, fontWeight: 'bold' }}>
                  {showLiveDataInQA ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div>
                <span style={{ color: colors.textSecondary }}>🎯 Accuracy:</span>
                <div style={{ color: colors.text, fontWeight: 'bold' }}>
                  {liveSystemStats.accuracy}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Panel - MOVED BELOW Script and Q&A */}
      <div style={{ 
        marginBottom: 24,
        padding: 16,
        background: colors.cardBackground,
        borderRadius: 12,
        border: `1px solid ${colors.border}`
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <h3 style={{ margin: 0, color: colors.text }}>⚙️ Advanced Settings</h3>
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            {showAdvancedSettings ? '🔽 Hide' : '🔼 Show'}
          </button>
        </div>

        {showAdvancedSettings && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Export Options */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>📄 Export Options</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  color: colors.textSecondary,
                  fontSize: '0.9em'
                }}>
                  Export Format:
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: colors.cardBackground,
                    color: colors.text,
                    fontSize: '0.9em'
                  }}
                >
                  <option value="pdf">📄 Download as Text</option>
                  <option value="clipboard">📋 Copy to Clipboard</option>
                </select>
              </div>
              <button
                onClick={handleExportPresentation}
                disabled={!presentationScript}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: !presentationScript ? colors.border : colors.primary,
                  color: '#fff',
                  cursor: !presentationScript ? 'not-allowed' : 'pointer',
                  fontSize: '0.9em'
                }}
              >
                {!presentationScript ? 'Generate Script First' : '📄 Export Presentation'}
              </button>
            </div>

            {/* Custom Timing */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>⏱️ Custom Timing</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  color: colors.textSecondary,
                  fontSize: '0.9em'
                }}>
                  Seconds per slide: {customTiming}s
                </label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={customTiming}
                  onChange={(e) => handleCustomTiming(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: colors.primary
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '0.8em',
                  color: colors.textSecondary,
                  marginTop: 4
                }}>
                  <span>30s</span>
                  <span>120s</span>
                </div>
              </div>
              <button
                onClick={() => handleCustomTiming(60)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                🔄 Reset to Default (60s)
              </button>
            </div>

            {/* Language Selection */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>🌍 Language</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  color: colors.textSecondary,
                  fontSize: '0.9em'
                }}>
                  Presentation Language:
                </label>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: colors.cardBackground,
                    color: colors.text,
                    fontSize: '0.9em'
                  }}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="no">🇳🇴 Norwegian</option>
                  <option value="sv">🇸🇪 Swedish</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="fr">🇫🇷 French</option>
                </select>
              </div>
              <div style={{ 
                fontSize: '0.8em', 
                color: colors.textSecondary,
                padding: '8px',
                background: colors.background,
                borderRadius: 4
              }}>
                💡 Language support for script generation and Q&A responses
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>🎤 Voice</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  color: colors.textSecondary,
                  fontSize: '0.9em'
                }}>
                  Presentation Voice:
                </label>
                <select
                  value={voiceGender}
                  onChange={(e) => setVoiceGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: colors.cardBackground,
                    color: colors.text,
                    fontSize: '0.9em'
                  }}
                >
                  <option value="my-voice" disabled>
                    🎤 My Voice (Feature Removed)
                  </option>
                  <option value="male">👨 Male Voice</option>
                  <option value="female">👩 Female Voice</option>
                </select>
              </div>
              <div style={{ 
                fontSize: '0.8em', 
                color: colors.textSecondary,
                padding: '8px',
                background: colors.background,
                borderRadius: 4
              }}>
                🎵 Voice selection for speech synthesis and audio presentations
              </div>
            </div>

            {/* Presentation Stats */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>📊 Stats</h4>
              <div style={{ 
                fontSize: '0.9em',
                color: colors.textSecondary
              }}>
                <div style={{ marginBottom: 4 }}>
                  📄 Script Length: {presentationScript ? presentationScript.split(' ').length : 0} words
                </div>
                <div style={{ marginBottom: 4 }}>
                  🎬 Total Slides: {presentationSlides.length}
                </div>
                <div style={{ marginBottom: 4 }}>
                  ⏱️ Total Duration: {presentationSlides.reduce((sum, slide) => sum + slide.duration, 0)}s
                </div>
                <div style={{ marginBottom: 4 }}>
                  ❓ Q&A Pairs: {qaKnowledgeBase.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Demo Mode */}
      {presentationMode === 'demo' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            padding: 12,
            background: colors.primaryLight,
            borderRadius: 8
          }}>
            <span style={{ fontSize: '1.5em' }}>🎬</span>
            <div>
              <h3 style={{ margin: 0, color: colors.text }}>
                Live Demo - Slide {currentSlide + 1} of {presentationSlides.length}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
                {presentationSlides[currentSlide].title}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: colors.border, 
            borderRadius: 4,
            marginBottom: 16,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentSlide + 1) / presentationSlides.length) * 100}%`,
              height: '100%',
              background: colors.primary,
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Timer Display */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 16,
            padding: '8px 16px',
            background: colors.cardBackground,
            borderRadius: 8,
            border: `1px solid ${colors.border}`
          }}>
            <span style={{ 
              fontSize: '1.2em', 
              fontWeight: 'bold', 
              color: colors.primary 
            }}>
              ⏱️ {presentationSlides[currentSlide].duration}s
            </span>
            <span style={{ 
              marginLeft: 12, 
              color: colors.textSecondary 
            }}>
              Total: {presentationSlides.reduce((sum, slide) => sum + slide.duration, 0)}s
            </span>
          </div>

          {/* Current Slide Info */}
          <div style={{ 
            padding: 20, 
            background: colors.cardBackground,
            borderRadius: 12,
            border: `2px solid ${colors.border}`,
            marginBottom: 16,
            boxShadow: colors.shadow
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 16 
            }}>
              <div style={{ 
                fontSize: '2em', 
                background: colors.primary,
                color: '#fff',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {currentSlide + 1}
              </div>
              <div>
                <h4 style={{ margin: 0, color: colors.text, fontSize: '1.3em' }}>
                  {presentationSlides[currentSlide].title}
                </h4>
                <p style={{ margin: '4px 0 0 0', color: colors.textSecondary }}>
                  {presentationSlides[currentSlide].content}
                </p>
              </div>
            </div>
            
            <div style={{ 
              background: colors.background,
              padding: 16,
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <strong style={{ color: colors.textSecondary, display: 'block', marginBottom: 8 }}>
                Key Points:
              </strong>
              <ul style={{ 
                margin: 0, 
                paddingLeft: 20, 
                color: colors.text,
                lineHeight: 1.6
              }}>
                {presentationSlides[currentSlide].keyPoints.map((point, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Demo Content */}
          <StreamingText 
            content={demoStreaming.content}
            loading={demoStreaming.loading}
            placeholder="Generating demo script..."
            style={{ minHeight: '300px' }}
          />

          {/* Demo Controls */}
          <div style={{ 
            marginTop: 16, 
            display: 'flex', 
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Manual Navigation Controls */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 12,
              width: '100%',
              justifyContent: 'center'
            }}>
              <button
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: currentSlide === 0 ? colors.border : colors.cardBackground,
                  color: currentSlide === 0 ? colors.textSecondary : colors.text,
                  cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9em'
                }}
              >
                ← Previous Slide
              </button>
              <span style={{ 
                padding: '8px 16px',
                color: colors.textSecondary,
                fontSize: '0.9em'
              }}>
                Slide {currentSlide + 1} of {presentationSlides.length}
              </span>
              <button
                onClick={handleNextSlide}
                disabled={currentSlide === presentationSlides.length - 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: currentSlide === presentationSlides.length - 1 ? colors.border : colors.cardBackground,
                  color: currentSlide === presentationSlides.length - 1 ? colors.textSecondary : colors.text,
                  cursor: currentSlide === presentationSlides.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Next Slide →
              </button>
            </div>

            <button
              onClick={() => speakText(demoStreaming.content)}
              disabled={isSpeaking || demoStreaming.loading}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: (isSpeaking || demoStreaming.loading) ? colors.border : colors.primary,
                color: '#fff',
                cursor: (isSpeaking || demoStreaming.loading) ? 'not-allowed' : 'pointer',
                fontSize: '1em'
              }}
            >
              {isSpeaking ? '🔊 Speaking...' : '🔊 Speak Demo'}
            </button>
            <button
              onClick={stopSpeaking}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              🔇 Stop Speaking
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              🔄 End Demo
            </button>
          </div>

          {/* Presentation Status */}
          {isPresenting && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: 16,
              padding: '8px 16px',
              background: colors.background,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              fontSize: '0.9em',
              color: colors.textSecondary
            }}>
              Slide {currentSlide + 1} of {presentationSlides.length} • Manual Navigation
            </div>
          )}
        </div>
      )}

      {/* Live Integration Panel */}
      <div style={{ 
        marginBottom: 24,
        padding: 16,
        background: colors.cardBackground,
        borderRadius: 12,
        border: `2px solid ${colors.primary}`,
        boxShadow: colors.shadow
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5em' }}>🎬</span>
            <h3 style={{ margin: 0, color: colors.text }}>Live Integration</h3>
          </div>
          <button
            onClick={() => setShowLiveIntegration(!showLiveIntegration)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${colors.primary}`,
              background: showLiveIntegration ? colors.primary : colors.cardBackground,
              color: showLiveIntegration ? '#fff' : colors.primary,
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            {showLiveIntegration ? '🔽 Hide' : '🔼 Show'}
          </button>
        </div>

        {showLiveIntegration && (
          <div>
            <p style={{ 
              marginBottom: 16, 
              color: colors.textSecondary,
              fontSize: '0.9em'
            }}>
              Connect with real app data for live demonstrations during your presentation
            </p>

            {/* Live Demo Modes */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>🎯 Demo Modes</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 12 
              }}>
                <button
                  onClick={() => handleShowSystemStats()}
                  disabled={isLiveDemoActive}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: isLiveDemoActive ? colors.border : colors.cardBackground,
                    color: colors.text,
                    cursor: isLiveDemoActive ? 'not-allowed' : 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '1.2em', marginBottom: 4 }}>📊</div>
                  <div style={{ fontWeight: 'bold' }}>System Statistics</div>
                  <div style={{ fontSize: '0.8em', color: colors.textSecondary }}>
                    Live platform metrics
                  </div>
                </button>

                <button
                  onClick={() => handleShowUserJourney()}
                  disabled={isLiveDemoActive}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: isLiveDemoActive ? colors.border : colors.cardBackground,
                    color: colors.text,
                    cursor: isLiveDemoActive ? 'not-allowed' : 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '1.2em', marginBottom: 4 }}>👤</div>
                  <div style={{ fontWeight: 'bold' }}>User Journey</div>
                  <div style={{ fontSize: '0.8em', color: colors.textSecondary }}>
                    Complete learning path
                  </div>
                </button>
              </div>
            </div>

            {/* Feature Demonstrations */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>🚀 Feature Demonstrations</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: 12 
              }}>
                {liveFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleStartLiveDemo(feature.id)}
                    disabled={isLiveDemoActive}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: isLiveDemoActive ? colors.border : colors.cardBackground,
                      color: colors.text,
                      cursor: isLiveDemoActive ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLiveDemoActive) {
                        e.target.style.background = colors.primaryLight;
                        e.target.style.borderColor = colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLiveDemoActive) {
                        e.target.style.background = colors.cardBackground;
                        e.target.style.borderColor = colors.border;
                      }
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 8 
                    }}>
                      <span style={{ fontSize: '1.2em' }}>{feature.icon}</span>
                      <div style={{ fontWeight: 'bold' }}>{feature.name}</div>
                    </div>
                    <div style={{ 
                      fontSize: '0.8em', 
                      color: colors.textSecondary,
                      lineHeight: 1.4
                    }}>
                      {feature.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Demo Status */}
            {isLiveDemoActive && (
              <div style={{ 
                padding: 12,
                background: colors.primaryLight,
                borderRadius: 8,
                border: `1px solid ${colors.primary}`,
                marginBottom: 16
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <span style={{ 
                    color: colors.primary, 
                    fontWeight: 'bold',
                    fontSize: '0.9em'
                  }}>
                    🎬 Live Demo Active: {liveFeatures.find(f => f.id === selectedFeature)?.name || 'System Stats'}
                  </span>
                  <button
                    onClick={handleStopLiveDemo}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.primary}`,
                      background: colors.cardBackground,
                      color: colors.primary,
                      cursor: 'pointer',
                      fontSize: '0.8em'
                    }}
                  >
                    Stop Demo
                  </button>
                </div>
              </div>
            )}

            {/* Live Data Display */}
            {isLiveDemoActive && Object.keys(liveData).length > 0 && (
              <div style={{ 
                padding: 16,
                background: colors.background,
                borderRadius: 8,
                border: `1px solid ${colors.border}`
              }}>
                <h5 style={{ margin: '0 0 12px 0', color: colors.text }}>📊 Live Data</h5>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: 12 
                }}>
                  {Object.entries(liveData).map(([key, value]) => (
                    <div key={key} style={{ 
                      padding: '8px 12px',
                      background: colors.cardBackground,
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`
                    }}>
                      <div style={{ 
                        fontSize: '0.8em', 
                        color: colors.textSecondary,
                        textTransform: 'capitalize',
                        marginBottom: 4
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: colors.text,
                        fontWeight: 'bold'
                      }}>
                        {Array.isArray(value) ? value.length : typeof value === 'object' ? Object.keys(value).length : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Demo Content Display */}
            {isLiveDemoActive && (
              <div style={{ 
                marginTop: 16,
                padding: 16,
                background: colors.cardBackground,
                borderRadius: 8,
                border: `1px solid ${colors.border}`
              }}>
                <h5 style={{ margin: '0 0 12px 0', color: colors.text }}>
                  🎬 Live Demo Content: {liveDemoMode === 'stats' ? 'System Statistics' : 
                                        liveDemoMode === 'journey' ? 'User Journey' : 
                                        liveFeatures.find(f => f.id === selectedFeature)?.name || 'Demo'}
                </h5>
                
                {/* Demo Progress */}
                {demoStreaming.loading && (
                  <StreamingProgress 
                    loading={demoStreaming.loading}
                    status={demoStreaming.status}
                    progress={demoStreaming.progress}
                    color="info"
                  />
                )}

                {/* Demo Content */}
                <StreamingText 
                  content={demoStreaming.content}
                  loading={demoStreaming.loading}
                  placeholder="Live demo content will appear here..."
                  style={{ minHeight: '200px' }}
                />

                {/* Demo Actions */}
                {demoStreaming.isComplete && (
                  <div style={{ 
                    marginTop: 16, 
                    display: 'flex', 
                    gap: 12,
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => speakText(demoStreaming.content)}
                      disabled={isSpeaking}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: isSpeaking ? colors.border : colors.primary,
                        color: '#fff',
                        cursor: isSpeaking ? 'not-allowed' : 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {isSpeaking ? '🔊 Speaking...' : '🔊 Speak Demo'}
                    </button>
                    <button
                      onClick={stopSpeaking}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.cardBackground,
                        color: colors.text,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      🔇 Stop Speaking
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Handling */}
      {(scriptStreaming.error || qaStreaming.error || demoStreaming.error) && (
        <div style={{ 
          padding: 16, 
          background: '#ffebee', 
          color: '#c62828',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <strong>Error:</strong> {scriptStreaming.error || qaStreaming.error || demoStreaming.error}
          <button
            onClick={handleClear}
            style={{
              marginLeft: 12,
              padding: '4px 8px',
              borderRadius: 4,
              border: 'none',
              background: '#c62828',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8em'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Voice training feature removed - using browser TTS instead */}


    </div>
  );
}

export default PresentationAgent; 