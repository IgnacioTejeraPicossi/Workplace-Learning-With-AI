import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';
import {
  fetchSavedVideos,
  fetchCertifications,
  fetchMicroLessons,
  fetchWebSearchResults,
  fetchSkillsForecasts,
  fetchCareerCoachSessions,
  fetchSimulationResults,
  fetchDocumentAnalyses,
  fetchRepositoryAnalyses,
  fetchAgenticRAGAnalyses,
  apiCall
} from './api';
import { auth } from './firebase';

// Illustrative sample content seeded when the local catalog is empty. Kept for a
// non-empty first impression, but clearly labelled so it is never mistaken for
// real library resources. Detection covers both the new `isDemo` flag and older
// localStorage entries seeded before the flag existed (matched by author).
const DEMO_AUTHORS = new Set([
  'Dr. Sarah Chen', 'Prof. Michael Rodriguez', 'Dr. Emily Watson',
  'Prof. David Kim', 'Dr. Lisa Thompson',
]);
const isDemoResource = (resource) => !!(resource && (resource.isDemo || DEMO_AUTHORS.has(resource.author)));

const BabelLibrary = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('catalog');
  const [books, setBooks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [microLessons, setMicroLessons] = useState([]);
  const [webSearchResults, setWebSearchResults] = useState([]);
  const [skillsForecasts, setSkillsForecasts] = useState([]);
  const [careerCoachSessions, setCareerCoachSessions] = useState([]);
  const [simulationResults, setSimulationResults] = useState([]);
  const [documentAnalyses, setDocumentAnalyses] = useState([]);
  const [repositoryAnalyses, setRepositoryAnalyses] = useState([]);
  const [agenticRAGAnalyses, setAgenticRAGAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    topic: '',
    description: '',
    type: 'book',
    url: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  // Advanced Search state
  const [advSearchQuery, setAdvSearchQuery] = useState('');
  const [advSearchType, setAdvSearchType] = useState('all');
  const [advSearchTopic, setAdvSearchTopic] = useState('all');
  const [advSearchAuthor, setAdvSearchAuthor] = useState('all');
  const [advSortBy, setAdvSortBy] = useState('newest');
  const [advSearchExecuted, setAdvSearchExecuted] = useState(false);
  // AI Search state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState(null); // null = not searched, [] = no results
  const [aiSearching, setAiSearching] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null); // null | {running, total, processed, failed, skipped}
  const [intelStats, setIntelStats] = useState(null);
  // Phase 2: Recommendations & Learning Path
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathGoal, setPathGoal] = useState('');
  // Phase 3: AI Content
  const [expandedContent, setExpandedContent] = useState({}); // { resourceKey: true/false }
  const [contentBatchStatus, setContentBatchStatus] = useState(null);
  const [shownAnswers, setShownAnswers] = useState({}); // { resourceKey_qtype: true/false }
  // Phase 4: Predictive Intelligence
  const [predictiveData, setPredictiveData] = useState(null);
  const [predictiveLoading, setPredictiveLoading] = useState(false);
  const { t } = useTranslation();

  const getUserId = () => {
    try { return auth?.currentUser?.uid || 'test-user'; } catch { return 'test-user'; }
  };

  // Fire-and-forget interaction tracking
  const trackInteraction = (resourceId, resourceType, action, extra = {}) => {
    const userId = getUserId();
    apiCall('/api/babel/profile/interaction', 'POST', {
      user_id: userId, resource_id: String(resourceId),
      resource_type: resourceType, action, ...extra
    }).catch(() => {});
  };

  // Phase 3: render AI Content panel for a resource
  const toggleContent = (key) => setExpandedContent(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAnswer = (key) => setShownAnswers(prev => ({ ...prev, [key]: !prev[key] }));

  const renderAiContentPanel = (resource, resourceKey) => {
    const hasSummary = resource.summary;
    const hasQuestions = resource.questions;
    const hasHints = resource.adaptive_hints;
    if (!hasSummary && !hasQuestions && !hasHints) return null;

    const isOpen = expandedContent[resourceKey];
    const diffColor = (d) => d === 'beginner' ? '#2e7d32' : d === 'advanced' ? '#c62828' : '#f57f17';

    return (
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => toggleContent(resourceKey)}
          style={{
            background: isOpen ? '#e8eaf6' : 'transparent',
            border: `1px solid ${isOpen ? '#3f51b5' : colors.border}`,
            borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
            fontSize: '0.8em', color: isOpen ? '#3f51b5' : colors.textSecondary,
            fontWeight: isOpen ? 600 : 400
          }}
        >
          {t('babelLibraryModule.aiContent.toggle')} {isOpen ? '▲' : '▼'}
        </button>

        {isOpen && (
          <div style={{ marginTop: 8, padding: 12, background: colors.primaryLight || '#f5f5f5', borderRadius: 10, fontSize: '0.85em' }}>
            {/* Summary */}
            {hasSummary && (
              <div style={{ marginBottom: 12 }}>
                <strong>📋 {t('babelLibraryModule.aiContent.summaryTitle')}</strong>
                <p style={{ margin: '4px 0', lineHeight: 1.5 }}>{resource.summary.short}</p>
                {resource.summary.key_points?.length > 0 && (
                  <div>
                    <em style={{ color: colors.textSecondary }}>{t('babelLibraryModule.aiContent.keyPoints')}:</em>
                    <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                      {resource.summary.key_points.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Questions */}
            {hasQuestions && (
              <div style={{ marginBottom: 12 }}>
                <strong>❓ {t('babelLibraryModule.aiContent.questionsTitle')}</strong>

                {/* Multiple choice */}
                {resource.questions.multiple_choice && (
                  <div style={{ margin: '8px 0', padding: 10, background: colors.background, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {t('babelLibraryModule.aiContent.multipleChoice')}
                      <span style={{ fontSize: '0.8em', color: diffColor(resource.questions.multiple_choice.difficulty), marginLeft: 6 }}>
                        ({t(`babelLibraryModule.intelligence.${resource.questions.multiple_choice.difficulty}`)})
                      </span>
                    </div>
                    <p style={{ margin: '4px 0' }}>{resource.questions.multiple_choice.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {resource.questions.multiple_choice.options.map((opt, i) => (
                        <div key={i} style={{
                          padding: '4px 8px', borderRadius: 6,
                          background: shownAnswers[`${resourceKey}_mc`] && opt.startsWith(resource.questions.multiple_choice.correct_answer) ? '#e8f5e9' : 'transparent',
                          border: `1px solid ${colors.border}`
                        }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => toggleAnswer(`${resourceKey}_mc`)} style={{
                      marginTop: 6, background: 'none', border: 'none', color: colors.primary,
                      cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline'
                    }}>
                      {shownAnswers[`${resourceKey}_mc`] ? t('babelLibraryModule.aiContent.hideAnswer') : t('babelLibraryModule.aiContent.showAnswer')}
                    </button>
                    {shownAnswers[`${resourceKey}_mc`] && (
                      <div style={{ marginTop: 4, fontWeight: 500, color: '#2e7d32' }}>
                        ✅ {resource.questions.multiple_choice.correct_answer}
                      </div>
                    )}
                  </div>
                )}

                {/* True/False */}
                {resource.questions.true_false && (
                  <div style={{ margin: '8px 0', padding: 10, background: colors.background, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {t('babelLibraryModule.aiContent.trueFalse')}
                      <span style={{ fontSize: '0.8em', color: diffColor(resource.questions.true_false.difficulty), marginLeft: 6 }}>
                        ({t(`babelLibraryModule.intelligence.${resource.questions.true_false.difficulty}`)})
                      </span>
                    </div>
                    <p style={{ margin: '4px 0' }}>{resource.questions.true_false.question}</p>
                    <button onClick={() => toggleAnswer(`${resourceKey}_tf`)} style={{
                      marginTop: 4, background: 'none', border: 'none', color: colors.primary,
                      cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline'
                    }}>
                      {shownAnswers[`${resourceKey}_tf`] ? t('babelLibraryModule.aiContent.hideAnswer') : t('babelLibraryModule.aiContent.showAnswer')}
                    </button>
                    {shownAnswers[`${resourceKey}_tf`] && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontWeight: 500, color: resource.questions.true_false.answer ? '#2e7d32' : '#c62828' }}>
                          {resource.questions.true_false.answer ? `✅ ${t('babelLibraryModule.aiContent.true')}` : `❌ ${t('babelLibraryModule.aiContent.false')}`}
                        </span>
                        {resource.questions.true_false.explanation && (
                          <div style={{ marginTop: 4, color: colors.textSecondary, fontSize: '0.9em' }}>
                            💡 {t('babelLibraryModule.aiContent.explanation')}: {resource.questions.true_false.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Open-ended */}
                {resource.questions.open_ended && (
                  <div style={{ margin: '8px 0', padding: 10, background: colors.background, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {t('babelLibraryModule.aiContent.openEnded')}
                      <span style={{ fontSize: '0.8em', color: diffColor(resource.questions.open_ended.difficulty), marginLeft: 6 }}>
                        ({t(`babelLibraryModule.intelligence.${resource.questions.open_ended.difficulty}`)})
                      </span>
                    </div>
                    <p style={{ margin: '4px 0' }}>{resource.questions.open_ended.question}</p>
                    <button onClick={() => toggleAnswer(`${resourceKey}_oe`)} style={{
                      marginTop: 4, background: 'none', border: 'none', color: colors.primary,
                      cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline'
                    }}>
                      {shownAnswers[`${resourceKey}_oe`] ? t('babelLibraryModule.aiContent.hideAnswer') : t('babelLibraryModule.aiContent.showAnswer')}
                    </button>
                    {shownAnswers[`${resourceKey}_oe`] && resource.questions.open_ended.suggested_answer_points?.length > 0 && (
                      <div style={{ marginTop: 4, color: colors.textSecondary, fontSize: '0.9em' }}>
                        💡 {t('babelLibraryModule.aiContent.keyPointsToConsider')}:
                        <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                          {resource.questions.open_ended.suggested_answer_points.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Adaptive Hints */}
            {hasHints && (
              <div>
                <strong>💡 {t('babelLibraryModule.aiContent.hintsTitle')}</strong>
                {resource.adaptive_hints.approach && (
                  <div style={{ margin: '6px 0' }}>
                    <em>{t('babelLibraryModule.aiContent.approach')}:</em> {resource.adaptive_hints.approach}
                  </div>
                )}
                {resource.adaptive_hints.prerequisites?.length > 0 && (
                  <div style={{ margin: '6px 0' }}>
                    <em>{t('babelLibraryModule.aiContent.prerequisites')}:</em>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {resource.adaptive_hints.prerequisites.map((p, i) => (
                        <span key={i} style={{ background: '#fff3e0', color: '#e65100', padding: '2px 8px', borderRadius: 10, fontSize: '0.8em' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {resource.adaptive_hints.next_steps?.length > 0 && (
                  <div style={{ margin: '6px 0' }}>
                    <em>{t('babelLibraryModule.aiContent.nextSteps')}:</em>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {resource.adaptive_hints.next_steps.map((n, i) => (
                        <span key={i} style={{ background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: 10, fontSize: '0.8em' }}>{n}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const typeLabel = (type) => t(`babelLibraryModule.types.${type}`, { defaultValue: type });

  const authorLabel = (author) => {
    const keyMap = {
      'YouTube Video': 'authors.youtubeVideo',
      'Certification': 'authors.certification',
      'Micro-lesson': 'authors.microLesson',
      'Web Search': 'authors.webSearch',
      'Skills Forecast': 'authors.skillsForecast',
      'AI Career Coach': 'authors.aiCareerCoach',
      'Simulation Result': 'authors.simulationResult',
      'Document Analyzer': 'authors.documentAnalyzer',
      'Repository Analyzer': 'authors.repositoryAnalyzer',
      'Agentic RAG': 'authors.agenticRAG'
    };
    const sub = keyMap[author];
    return sub ? t(`babelLibraryModule.${sub}`) : author;
  };

  const mainTabs = useMemo(
    () => [
      { key: 'catalog', label: t('babelLibraryModule.tabs.catalog') },
      { key: 'add', label: t('babelLibraryModule.tabs.add') },
      { key: 'search', label: t('babelLibraryModule.tabs.search') },
      { key: 'ai-search', label: t('babelLibraryModule.tabs.aiSearch') }
    ],
    [t]
  );

  // Load videos from MongoDB
  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await fetchSavedVideos();
      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load certifications from MongoDB
  const loadCertifications = async () => {
    try {
      const data = await fetchCertifications();
      if (data) {
        setCertifications(data);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
    }
  };

  // Load micro-lessons from MongoDB
  const loadMicroLessons = async () => {
    try {
      const data = await fetchMicroLessons();
      if (data) {
        setMicroLessons(data);
      }
    } catch (error) {
      console.error('Error loading micro-lessons:', error);
    }
  };

  // Load web search results from MongoDB
  const loadWebSearchResults = async () => {
    try {
      const data = await fetchWebSearchResults();
      if (data) {
        setWebSearchResults(data);
      }
    } catch (error) {
      console.error('Error loading web search results:', error);
    }
  };

  // Load skills forecasts from MongoDB
  const loadSkillsForecasts = async () => {
    try {
      const data = await fetchSkillsForecasts();
      if (data) {
        setSkillsForecasts(data);
      }
    } catch (error) {
      console.error('Error loading skills forecasts:', error);
    }
  };

  // Load career coach sessions from MongoDB
  const loadCareerCoachSessions = async () => {
    try {
      const data = await fetchCareerCoachSessions();
      if (data) {
        setCareerCoachSessions(data);
      }
    } catch (error) {
      console.error('Error loading career coach sessions:', error);
    }
  };

  // Load simulation results from MongoDB
  const loadSimulationResults = async () => {
    try {
      const data = await fetchSimulationResults();
      if (data) {
        setSimulationResults(data);
      }
    } catch (error) {
      console.error('Error loading simulation results:', error);
    }
  };

  // Load document analyses from MongoDB
  const loadDocumentAnalyses = async () => {
    try {
      const data = await fetchDocumentAnalyses();
      if (data && data.analyses) {
        setDocumentAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error loading document analyses:', error);
    }
  };

  // Load repository analyses from MongoDB
  const loadRepositoryAnalyses = async () => {
    try {
      const data = await fetchRepositoryAnalyses();
      if (data && data.analyses) {
        setRepositoryAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error loading repository analyses:', error);
    }
  };

  // Load agentic RAG analyses from MongoDB
  const loadAgenticRAGAnalyses = async () => {
    try {
      const data = await fetchAgenticRAGAnalyses();
      if (data && data.analyses) {
        setAgenticRAGAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error loading agentic RAG analyses:', error);
    }
  };

  // Load demo/user books from localStorage (persisted across refreshes)
  useEffect(() => {
    const BOOKS_KEY = 'wlwai_babel_library_books';
    const stored = localStorage.getItem(BOOKS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBooks(parsed);
        } else {
          // Empty array — seed with demo data
          seedDemoBooks(BOOKS_KEY);
        }
      } catch {
        seedDemoBooks(BOOKS_KEY);
      }
    } else {
      seedDemoBooks(BOOKS_KEY);
    }

    function seedDemoBooks(key) {
      const demoBooks = [
        {
          id: 1,
          title: "The Art of Artificial Intelligence",
          author: "Dr. Sarah Chen",
          topic: "AI & Machine Learning",
          description: "Comprehensive guide to modern AI techniques and applications",
          type: "book",
          addedDate: "2024-01-15"
        },
        {
          id: 2,
          title: "Digital Transformation Strategies",
          author: "Prof. Michael Rodriguez",
          topic: "Business Strategy",
          description: "How organizations can successfully navigate digital transformation",
          type: "book",
          addedDate: "2024-01-10"
        },
        {
          id: 3,
          title: "Future of Work: AI Integration",
          author: "Dr. Emily Watson",
          topic: "Workplace Innovation",
          description: "Exploring how AI will reshape the modern workplace",
          type: "book",
          addedDate: "2024-01-05"
        },
        {
          id: 4,
          title: "Machine Learning Fundamentals",
          author: "Prof. David Kim",
          topic: "AI & Machine Learning",
          description: "Core concepts and practical applications of ML",
          type: "video",
          addedDate: "2024-01-20"
        },
        {
          id: 5,
          title: "Leadership in the Digital Age",
          author: "Dr. Lisa Thompson",
          topic: "Leadership",
          description: "Essential leadership skills for the technology-driven era",
          type: "article",
          addedDate: "2024-01-12"
        }
      ].map(b => ({ ...b, isDemo: true }));  // flag illustrative sample content
      setBooks(demoBooks);
      localStorage.setItem(key, JSON.stringify(demoBooks));
    }
    
    // Load videos from MongoDB
    loadVideos();
    // Load certifications and micro-lessons from MongoDB
    loadCertifications();
    loadMicroLessons();
    // Load web search results and skills forecasts from MongoDB
    loadWebSearchResults();
    loadSkillsForecasts();
    // Load career coach sessions from MongoDB
    loadCareerCoachSessions();
    // Load simulation results from MongoDB
    loadSimulationResults();
    // Load document analyses from MongoDB
    loadDocumentAnalyses();
    // Load repository analyses from MongoDB
    loadRepositoryAnalyses();
    // Load agentic RAG analyses from MongoDB
    loadAgenticRAGAnalyses();
  }, []);

  // Load recommendations when AI Search tab is activated
  useEffect(() => {
    if (activeTab !== 'ai-search') return;
    const userId = getUserId();
    setRecsLoading(true);
    apiCall(`/api/babel/profile/${userId}/recommendations`)
      .then(data => {
        setRecommendations(data.recommendations || []);
        setProfileSummary(data.profile_summary || null);
      })
      .catch(() => setRecommendations([]))
      .finally(() => setRecsLoading(false));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const BOOKS_KEY = 'wlwai_babel_library_books';

  const persistBooks = (updatedBooks) => {
    try { localStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks)); } catch {}
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    if (newBook.title && newBook.author && newBook.topic) {
      const book = {
        id: Date.now(),
        ...newBook,
        addedDate: new Date().toISOString().split('T')[0]
      };
      const updated = [book, ...books];
      setBooks(updated);
      persistBooks(updated);
      setNewBook({
        title: '',
        author: '',
        topic: '',
        description: '',
        type: 'book',
        url: ''
      });
      setActiveTab('catalog');

      // Fire-and-forget AI classification
      apiCall('/api/babel/intelligence/classify', 'POST', {
        title: book.title,
        description: book.description || '',
        resource_type: book.type,
        resource_id: String(book.id),
        source_collection: 'books_local'
      }).catch(err => console.warn('AI classification skipped:', err.message));
    }
  };

  const handleDeleteBook = (id) => {
    const updated = books.filter(book => book.id !== id);
    setBooks(updated);
    persistBooks(updated);
  };

  // Delete functions for different resource types
  const handleDeleteVideo = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteVideo'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/saved-videos/${id}`, { method: 'DELETE' });
        // Update local state
        setVideos(prev => prev.filter(video => video._id !== id));
        alert(t('babelLibraryModule.toast.videoDeleted'));
      } catch (error) {
        console.error('Error deleting video:', error);
        alert(t('babelLibraryModule.toast.videoDeleteError'));
      }
    }
  };

  const handleDeleteCertification = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteCertification'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
        // Update local state
        setCertifications(prev => prev.filter(cert => cert.id !== id));
        alert(t('babelLibraryModule.toast.certDeleted'));
      } catch (error) {
        console.error('Error deleting certification:', error);
        alert(t('babelLibraryModule.toast.certDeleteError'));
      }
    }
  };

  const handleDeleteMicroLesson = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteMicroLesson'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/micro-lessons/${id}`, { method: 'DELETE' });
        // Update local state
        setMicroLessons(prev => prev.filter(lesson => lesson.id !== id));
        alert(t('babelLibraryModule.toast.lessonDeleted'));
      } catch (error) {
        console.error('Error deleting micro-lesson:', error);
        alert(t('babelLibraryModule.toast.lessonDeleteError'));
      }
    }
  };

  const handleDeleteWebSearch = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteWebSearch'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/web-search/${id}`, { method: 'DELETE' });
        // Update local state
        setWebSearchResults(prev => prev.filter(result => result.id !== id));
        alert(t('babelLibraryModule.toast.webDeleted'));
      } catch (error) {
        console.error('Error deleting web search:', error);
        alert(t('babelLibraryModule.toast.webDeleteError'));
      }
    }
  };

  const handleDeleteSkillsForecast = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteSkillsForecast'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/skills-forecast/${id}`, { method: 'DELETE' });
        // Update local state
        setSkillsForecasts(prev => prev.filter(forecast => forecast.id !== id));
        alert(t('babelLibraryModule.toast.forecastDeleted'));
      } catch (error) {
        console.error('Error deleting skills forecast:', error);
        alert(t('babelLibraryModule.toast.forecastDeleteError'));
      }
    }
  };

  const handleDeleteCareerCoach = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteCareerCoach'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/career-coach/${id}`, { method: 'DELETE' });
        // Update local state
        setCareerCoachSessions(prev => prev.filter(session => session.id !== id));
        alert(t('babelLibraryModule.toast.sessionDeleted'));
      } catch (error) {
        console.error('Error deleting career coach session:', error);
        alert(t('babelLibraryModule.toast.sessionDeleteError'));
      }
    }
  };

  const handleDeleteSimulation = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteSimulation'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/simulation-results/${id}`, { method: 'DELETE' });
        // Update local state
        setSimulationResults(prev => prev.filter(result => result.id !== id));
        alert(t('babelLibraryModule.toast.simDeleted'));
      } catch (error) {
        console.error('Error deleting simulation:', error);
        alert(t('babelLibraryModule.toast.simDeleteError'));
      }
    }
  };

  const handleDeleteDocumentAnalysis = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteDocumentAnalysis'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/document-analyzer/delete-analysis/${id}`, { method: 'DELETE' });
        // Update local state
        setDocumentAnalyses(prev => prev.filter(analysis => (analysis.id || analysis._id) !== id));
        alert(t('babelLibraryModule.toast.docDeleted'));
      } catch (error) {
        console.error('Error deleting document analysis:', error);
        alert(t('babelLibraryModule.toast.docDeleteError'));
      }
    }
  };

  const handleDeleteRepositoryAnalysis = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteRepositoryAnalysis'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/saved-analyses/${id}`, { method: 'DELETE' });
        // Update local state
        setRepositoryAnalyses(prev => prev.filter(analysis => (analysis.id || analysis._id) !== id));
        alert(t('babelLibraryModule.toast.repoDeleted'));
      } catch (error) {
        console.error('Error deleting repository analysis:', error);
        alert(t('babelLibraryModule.toast.repoDeleteError'));
      }
    }
  };

  const handleDeleteAgenticRAGAnalysis = async (id) => {
    if (window.confirm(t('babelLibraryModule.confirm.deleteAgenticRAG'))) {
      try {
        // Remove from MongoDB
        await fetch(`/api/agentic-rag/delete-analysis/${id}`, { method: 'DELETE' });
        // Update local state
        setAgenticRAGAnalyses(prev => prev.filter(analysis => (analysis.id || analysis._id) !== id));
        alert(t('babelLibraryModule.toast.ragDeleted'));
      } catch (error) {
        console.error('Error deleting agentic RAG analysis:', error);
        alert(t('babelLibraryModule.toast.ragDeleteError'));
      }
    }
  };

  const handleEditMicroLesson = (id, title) => {
    // Navigate to Micro-lessons module with specific page info and object details
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'micro-lessons',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'list', // Navigate to the list where micro-lessons are shown
        action: 'edit',
        autoExpand: true // Flag to automatically expand the specific micro-lesson
      }
    }));
    
    // Also show a user-friendly message
    alert(t('babelLibraryModule.redirect.microLesson', { title }));
  };

  const handleEditCertification = (id, title) => {
    // Navigate to Certifications module with specific page info and object details
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'certifications',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'history', // Navigate to History tab where certifications are listed
        action: 'edit',
        autoExpand: true // Flag to automatically expand the specific certification
      }
    }));
    
    alert(t('babelLibraryModule.redirect.certification', { title }));
  };

  const handleEditCareerCoach = (id, title) => {
    // Navigate to AI Career Coach module with specific page info and object details
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'ai-career-coach',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'sessions', // Navigate to Saved Sessions tab
        action: 'edit',
        autoExpand: true // Flag to automatically expand the specific session
      }
    }));
    
    alert(t('babelLibraryModule.redirect.careerCoach', { title }));
  };

  const handleEditVideo = (id, title) => {
    // Navigate to Video Lessons module with specific page info and object details
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'video-lessons',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'list', // Navigate to the saved videos list
        action: 'edit',
        autoExpand: true // Flag to automatically expand the specific video
      }
    }));
    
    alert(t('babelLibraryModule.redirect.video', { title }));
  };

  const handleEditSimulation = (id, title) => {
    // Navigate to Simulations module with specific page info and object details
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'simulations',
        resourceId: id,
        resourceTitle: title,
        action: 'edit',
        autoExpand: true // Flag to automatically expand the specific simulation
      }
    }));
    
    alert(t('babelLibraryModule.redirect.simulation', { title }));
  };

  const handleEditDocumentAnalysis = (id, title) => {
    // Navigate to Document Analyzer module with specific document expanded
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'learning-document',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'document', // Navigate directly to the specific document
        action: 'edit',
        autoExpand: true, // Flag to automatically expand the specific analysis
        expandDocument: true // Additional flag to ensure document is expanded
      }
    }));
    
    alert(t('babelLibraryModule.redirect.document', { title }));
  };

  const handleEditRepositoryAnalysis = (id, title) => {
    // Navigate to Learning Repo module with specific document expanded
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'learning-repo',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'document', // Navigate directly to the specific document
        action: 'edit',
        autoExpand: true, // Flag to automatically expand the specific analysis
        expandDocument: true // Additional flag to ensure document is expanded
      }
    }));
    
    alert(t('babelLibraryModule.redirect.repo', { title }));
  };

  const handleEditAgenticRAGAnalysis = (id, title) => {
    // Navigate to Agentic RAG Documents module with specific document expanded
    window.dispatchEvent(new CustomEvent('navigateToModule', {
      detail: {
        module: 'agentic-rag-document',
        resourceId: id,
        resourceTitle: title,
        targetPage: 'document', // Navigate directly to the specific document
        action: 'edit',
        autoExpand: true, // Flag to automatically expand the specific analysis
        expandDocument: true // Additional flag to ensure document is expanded
      }
    }));
    
    alert(t('babelLibraryModule.redirect.agenticRag', { title }));
  };

  const unknownDateLabel = t('babelLibraryModule.unknownDate');

  // Combine books and videos for unified search
  const allResources = [
    ...books, 
    ...videos.map(video => ({
      id: video._id,
      title: video.title,
      author: 'YouTube Video',
      topic: video.topic,
      description: video.description,
      type: 'video',
      addedDate: video.saved_at ? video.saved_at.split('T')[0] : unknownDateLabel,
      url: video.url
    })),
    ...certifications.map(cert => ({
      id: cert.id,
      title: cert.title,
      author: 'Certification',
      topic: cert.topics.join(', '),
      description: cert.description,
      type: 'course',
      addedDate: cert.created_at ? cert.created_at.split('T')[0] : unknownDateLabel,
      level: cert.level,
      duration: cert.duration
    })),
    ...microLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      author: 'Micro-lesson',
      topic: lesson.topic,
      description: lesson.content.substring(0, 100) + '...',
      type: 'article',
      addedDate: lesson.created_at ? lesson.created_at.split('T')[0] : unknownDateLabel,
      level: lesson.level,
      duration: lesson.duration
    })),
    ...webSearchResults.map(result => ({
      id: result.id,
      title: result.title,
      author: 'Web Search',
      topic: result.topic,
      description: result.snippet,
      type: 'article',
      addedDate: result.created_at ? result.created_at.split('T')[0] : unknownDateLabel,
      url: result.url,
      searchQuery: result.search_query
    })),
    ...skillsForecasts.map(forecast => ({
      id: forecast.id,
      title: forecast.title,
      author: 'Skills Forecast',
      topic: forecast.industry,
      description: forecast.description,
      type: 'article',
      addedDate: forecast.created_at ? forecast.created_at.split('T')[0] : 'Unknown',
      skills: forecast.skills,
      timeframe: forecast.timeframe,
      confidenceLevel: forecast.confidence_level
    })),
         ...careerCoachSessions.map(session => ({
       id: session.id,
       title: session.title,
       author: 'AI Career Coach',
       topic: session.topic,
       description: session.content.substring(0, 100) + '...',
       type: 'simulation',
       addedDate: session.created_at ? session.created_at.split('T')[0] : unknownDateLabel,
       growthArea: session.growth_area,
       customTopic: session.custom_topic
     })),
     ...simulationResults.map(result => ({
       id: result.id,
       title: result.title,
       author: 'Simulation Result',
       topic: result.topic,
       description: result.description,
       type: 'simulation',
       addedDate: result.created_at ? result.created_at.split('T')[0] : 'Unknown',
       difficulty: result.difficulty,
       duration: result.duration,
       scenarioType: result.scenario_type,
       userScore: result.user_score,
       completionTime: result.completion_time
     })),
     ...documentAnalyses.map(analysis => ({
       id: analysis.id || analysis._id,
       title: analysis.filename || 'Document Analysis',
       author: 'Document Analyzer',
       topic: 'Document Analysis',
       description: analysis.summary ? analysis.summary.substring(0, 100) + '...' : 'Document analysis result',
       type: 'analysis',
       addedDate: analysis.created_at ? analysis.created_at.split('T')[0] : unknownDateLabel,
       chars: analysis.chars,
       chunks: analysis.chunks,
       length: analysis.length
     })),
     ...repositoryAnalyses.map(analysis => ({
       id: analysis.id || analysis._id,
       title: analysis.repo_name || 'Repository Analysis',
       author: 'Repository Analyzer',
       topic: 'Repository Analysis',
       description: analysis.summary ? analysis.summary.substring(0, 100) + '...' : 'Repository analysis result',
       type: 'analysis',
       addedDate: analysis.created_at ? analysis.created_at.split('T')[0] : 'Unknown',
       repoUrl: analysis.repo_url,
       language: analysis.language,
       stars: analysis.stars
     })),
     ...agenticRAGAnalyses.map(analysis => ({
       id: analysis.id || analysis._id,
       title: analysis.filename || 'Agentic RAG Analysis',
       author: 'Agentic RAG',
       topic: 'Agentic RAG Analysis',
       description: analysis.answer ? analysis.answer.substring(0, 100) + '...' : 'Agentic RAG analysis result',
       type: 'analysis',
       addedDate: analysis.created_at ? analysis.created_at.split('T')[0] : unknownDateLabel,
       question: analysis.question,
       confidence: analysis.confidence
     }))
  ];

  const filteredResources = allResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || resource.topic === selectedTopic;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    return matchesSearch && matchesTopic && matchesType;
  });

  const topics = ['all', ...Array.from(new Set([
    ...books.map(book => book.topic), 
    ...videos.map(video => video.topic),
    ...certifications.flatMap(cert => cert.topics),
    ...microLessons.map(lesson => lesson.topic),
    ...webSearchResults.map(result => result.topic),
    ...skillsForecasts.map(forecast => forecast.industry)
  ]))];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'book': return '📚';
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'course': return '🎓';
      case 'simulation': return '🎮';
      case 'analysis': return '📊';
      default: return '📖';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'book': return '#007bff';
      case 'video': return '#28a745';
      case 'article': return '#ffc107';
      case 'course': return '#6f42c1';
      case 'simulation': return '#fd7e14';
      case 'analysis': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  // ──── AI Search Engine ────

  const AI_HISTORY_KEY = 'wlwai_babel_ai_search_history';

  // Synonym/concept map for semantic-like matching
  const conceptMap = {
    'ai': ['artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural', 'ai'],
    'ml': ['machine learning', 'ai', 'artificial intelligence', 'deep learning', 'model', 'training'],
    'security': ['cybersecurity', 'encryption', 'firewall', 'threat', 'vulnerability', 'protection', 'security'],
    'web': ['website', 'frontend', 'backend', 'html', 'css', 'javascript', 'web', 'internet'],
    'data': ['database', 'analytics', 'data science', 'big data', 'visualization', 'data'],
    'leadership': ['management', 'leader', 'team', 'strategy', 'leadership', 'director'],
    'cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'infrastructure', 'devops'],
    'programming': ['coding', 'software', 'developer', 'code', 'programming', 'engineering'],
    'business': ['strategy', 'transformation', 'digital', 'enterprise', 'business', 'innovation'],
    'agile': ['scrum', 'kanban', 'sprint', 'agile', 'lean', 'devops']
  };

  // Extract keywords and expand with synonyms
  const expandQuery = (query) => {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const expanded = new Set(words);
    for (const word of words) {
      for (const [concept, synonyms] of Object.entries(conceptMap)) {
        if (synonyms.some(s => s.includes(word) || word.includes(s))) {
          synonyms.forEach(s => expanded.add(s));
          expanded.add(concept);
        }
      }
    }
    return Array.from(expanded);
  };

  // Score a resource against expanded keywords
  const scoreResource = (resource, expandedKeywords) => {
    let score = 0;
    const title = (resource.title || '').toLowerCase();
    const desc = (resource.description || '').toLowerCase();
    const topic = (resource.topic || '').toLowerCase();
    const author = (resource.author || '').toLowerCase();
    const all = `${title} ${desc} ${topic} ${author}`;

    for (const kw of expandedKeywords) {
      // Title match = highest weight
      if (title.includes(kw)) score += 10;
      // Topic match = high weight
      if (topic.includes(kw)) score += 7;
      // Description match
      if (desc.includes(kw)) score += 4;
      // Author match
      if (author.includes(kw)) score += 3;
    }

    // Bonus for exact phrase match in title
    const originalQuery = expandedKeywords.slice(0, 3).join(' ');
    if (title.includes(originalQuery)) score += 15;

    return score;
  };

  // Detect intent from natural language query
  const detectIntent = (query) => {
    const q = query.toLowerCase();
    const intent = { types: [], difficulty: null, action: 'search' };

    // Type detection
    if (/\b(video|watch|ver)\b/.test(q)) intent.types.push('video');
    if (/\b(book|read|leer|libro)\b/.test(q)) intent.types.push('book');
    if (/\b(article|paper|articulo)\b/.test(q)) intent.types.push('article');
    if (/\b(course|curso|certification|certificat)\b/.test(q)) intent.types.push('course');
    if (/\b(analys|report|repositor|document)\b/.test(q)) intent.types.push('analysis');
    if (/\b(simulat|practice|practic)\b/.test(q)) intent.types.push('simulation');

    // Difficulty detection
    if (/\b(beginner|basic|introduct|fundamental|inicio)\b/.test(q)) intent.difficulty = 'beginner';
    if (/\b(advanced|expert|deep|profund)\b/.test(q)) intent.difficulty = 'advanced';

    // Action detection
    if (/\b(recommend|suggest|similar|like)\b/.test(q)) intent.action = 'recommend';
    if (/\b(popular|trending|most|top)\b/.test(q)) intent.action = 'trending';
    if (/\b(recent|new|latest|nuevo)\b/.test(q)) intent.action = 'recent';

    return intent;
  };

  // Generate AI insights about the result set
  const generateInsights = (results, query, allRes) => {
    const types = {};
    const topics = {};
    const authors = {};
    for (const r of results) {
      types[r.type] = (types[r.type] || 0) + 1;
      if (r.topic) topics[r.topic] = (topics[r.topic] || 0) + 1;
      authors[r.author] = (authors[r.author] || 0) + 1;
    }

    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    const topTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0];
    const topAuthor = Object.entries(authors).sort((a, b) => b[1] - a[1])[0];

    // Find related topics the user might want
    const allTopicsSet = new Set(allRes.map(r => r.topic).filter(Boolean));
    const resultTopics = new Set(results.map(r => r.topic).filter(Boolean));
    const relatedTopics = Array.from(allTopicsSet).filter(t => !resultTopics.has(t)).slice(0, 3);

    return {
      totalFound: results.length,
      coverage: Math.round((results.length / allRes.length) * 100),
      topType: topType ? { name: topType[0], count: topType[1] } : null,
      topTopic: topTopic ? { name: topTopic[0], count: topTopic[1] } : null,
      topAuthor: topAuthor ? { name: topAuthor[0], count: topAuthor[1] } : null,
      relatedTopics,
      typeDistribution: types
    };
  };

  // Save search to history
  const saveSearchHistory = (query) => {
    try {
      const raw = localStorage.getItem(AI_HISTORY_KEY);
      const history = raw ? JSON.parse(raw) : [];
      history.unshift({ query, timestamp: new Date().toISOString() });
      if (history.length > 20) history.length = 20;
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(history));
    } catch {}
  };

  const getSearchHistory = () => {
    try {
      const raw = localStorage.getItem(AI_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  // Client-side fallback search (original logic)
  const clientSideSearch = (query) => {
    const expandedKw = expandQuery(query);
    const intent = detectIntent(query);

    let scored = allResources.map(r => ({
      ...r,
      _score: scoreResource(r, expandedKw)
    }));

    if (intent.types.length > 0) {
      scored = scored.map(r => ({
        ...r,
        _score: intent.types.includes(r.type) ? r._score + 20 : r._score
      }));
    }

    if (intent.action === 'recent') {
      scored.sort((a, b) => (b.addedDate || '').localeCompare(a.addedDate || ''));
    } else {
      scored.sort((a, b) => b._score - a._score);
    }

    const results = scored.filter(r => r._score > 0);
    const insights = generateInsights(results, query, allResources);
    insights.expandedKeywords = expandedKw;
    insights.intent = intent;
    insights.mode = 'client';

    setAiResults(results);
    setAiInsights(insights);
    setAiSearching(false);
    saveSearchHistory(query);
    apiCall('/api/babel/profile/search', 'POST', { user_id: getUserId(), query }).catch(() => {});
  };

  // Main AI search — tries server-side hybrid search, falls back to client-side
  const performAiSearch = async (query) => {
    if (!query.trim()) return;
    setAiSearching(true);

    try {
      const response = await apiCall('/api/babel/intelligence/search', 'POST', {
        query, limit: 30, mode: 'hybrid'
      });
      if (response?.results?.length > 0) {
        setAiResults(response.results);
        setAiInsights({ ...response.insights, mode: 'server-ai' });
        setAiSearching(false);
        saveSearchHistory(query);
        apiCall('/api/babel/profile/search', 'POST', { user_id: getUserId(), query }).catch(() => {});
        return;
      }
    } catch (err) {
      console.warn('Server AI search unavailable, falling back to client-side:', err.message);
    }

    // Fallback to client-side
    clientSideSearch(query);
  };

  return (
    <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, marginBottom: 8 }}>
            {t('babelLibraryModule.header.title')}
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '1.1em' }}>
            {t('babelLibraryModule.header.subtitle')}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {mainTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? colors.primary : 'transparent',
                color: activeTab === tab.key ? 'white' : colors.text,
                border: `1px solid ${activeTab === tab.key ? colors.primary : colors.border}`,
                padding: '12px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 500
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'catalog' && (
          <div>
            {/* Loading indicator */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px', color: colors.textSecondary }}>
                {t('babelLibraryModule.catalog.loading')}
              </div>
            )}
            {/* Search and Filter */}
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              marginBottom: 24,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <input
                  type="text"
                  placeholder={t('babelLibraryModule.catalog.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text
                  }}
                />
              </div>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: '1em',
                  background: colors.background,
                  color: colors.text,
                  minWidth: 200
                }}
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic === 'all' ? t('babelLibraryModule.catalog.allTopics') : topic}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontSize: '1em',
                  background: colors.background,
                  color: colors.text,
                  minWidth: 180
                }}
              >
                <option value="all">{t('babelLibraryModule.catalog.allTypes')}</option>
                {['book', 'video', 'article', 'course', 'simulation', 'analysis'].map(type => (
                  <option key={type} value={type}>
                    {getTypeIcon(type)} {typeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Active Filters Display */}
            {(selectedType !== 'all' || selectedTopic !== 'all' || searchTerm) && (
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginBottom: 16,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span style={{ color: colors.textSecondary, fontSize: '0.9em' }}>{t('babelLibraryModule.catalog.activeFilters')}</span>
                {selectedType !== 'all' && (
                  <span style={{
                    background: getTypeColor(selectedType),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: '500'
                  }}>
                    {getTypeIcon(selectedType)} {typeLabel(selectedType)}
                  </span>
                )}
                {selectedTopic !== 'all' && (
                  <span style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: '500'
                  }}>
                    🏷️ {selectedTopic}
                  </span>
                )}
                {searchTerm && (
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: '500'
                  }}>
                    🔍 "{searchTerm}"
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedTopic('all');
                    setSearchTerm('');
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    cursor: 'pointer'
                  }}
                >
                  {t('babelLibraryModule.catalog.clearAll')}
                </button>
              </div>
            )}

                         {/* Library Stats - Interactive Filter Buttons */}
             <div style={{ 
               display: 'grid', 
               gridTemplateColumns: 'repeat(6, 1fr)', 
               gap: 12, 
               marginBottom: 24 
             }}>
               <button
                 onClick={() => setSelectedType('all')}
                 style={{
                   background: selectedType === 'all' ? colors.primary : colors.primaryLight,
                   color: selectedType === 'all' ? 'white' : colors.primary,
                   padding: '16px 12px',
                   borderRadius: 12,
                   textAlign: 'center',
                   border: `1px solid ${colors.primary}`,
                   cursor: 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 <div style={{ fontSize: '2em', marginBottom: 8 }}>📚</div>
                 <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('babelLibraryModule.catalog.stats.total')}</div>
                 <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{allResources.length}</div>
               </button>
               
               <button
                 onClick={() => setSelectedType('video')}
                 style={{
                   background: selectedType === 'video' ? colors.primary : colors.primaryLight,
                   color: selectedType === 'video' ? 'white' : colors.primary,
                   padding: '16px 12px',
                   borderRadius: 12,
                   textAlign: 'center',
                   border: `1px solid ${colors.primary}`,
                   cursor: 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 <div style={{ fontSize: '2em', marginBottom: 8 }}>🎥</div>
                 <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('babelLibraryModule.catalog.stats.videos')}</div>
                 <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{videos.length}</div>
               </button>
               
               <button
                 onClick={() => setSelectedType('article')}
                 style={{
                   background: selectedType === 'article' ? colors.primary : colors.primaryLight,
                   color: selectedType === 'article' ? 'white' : colors.primary,
                   padding: '16px 12px',
                   borderRadius: 12,
                   textAlign: 'center',
                   border: `1px solid ${colors.primary}`,
                   cursor: 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 <div style={{ fontSize: '2em', marginBottom: 8 }}>📄</div>
                 <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('babelLibraryModule.catalog.stats.articles')}</div>
                 <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{microLessons.length + webSearchResults.length + skillsForecasts.length}</div>
               </button>
               
               <button
                 onClick={() => setSelectedType('course')}
                 style={{
                   background: selectedType === 'course' ? colors.primary : colors.primaryLight,
                   color: selectedType === 'course' ? 'white' : colors.primary,
                   padding: '16px 12px',
                   borderRadius: 12,
                   textAlign: 'center',
                   border: `1px solid ${colors.primary}`,
                   cursor: 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 <div style={{ fontSize: '2em', marginBottom: 8 }}>🎓</div>
                 <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('babelLibraryModule.catalog.stats.courses')}</div>
                 <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{certifications.length}</div>
               </button>
               
               <button
                 onClick={() => setSelectedType('simulation')}
                 style={{
                   background: selectedType === 'simulation' ? colors.primary : colors.primaryLight,
                   color: selectedType === 'simulation' ? 'white' : colors.primary,
                   padding: '16px 12px',
                   borderRadius: 12,
                   textAlign: 'center',
                   border: `1px solid ${colors.primary}`,
                   cursor: 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 <div style={{ fontSize: '2em', marginBottom: 8 }}>🎮</div>
                 <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('babelLibraryModule.catalog.stats.simulationsCoach')}</div>
                 <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{careerCoachSessions.length + simulationResults.length}</div>
               </button>
               
               <button
                 onClick={() => setSelectedType('analysis')}
                 style={{
                   background: selectedType === 'analysis' ? colors.primary : colors.primaryLight,
                   color: selectedType === 'analysis' ? 'white' : colors.primary,
                   padding: '16px 12px',
                   borderRadius: 12,
                   textAlign: 'center',
                   border: `1px solid ${colors.primary}`,
                   cursor: 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 <div style={{ fontSize: '2em', marginBottom: 8 }}>📊</div>
                 <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('babelLibraryModule.catalog.stats.repoDocAnalysis')}</div>
                 <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{documentAnalyses.length + repositoryAnalyses.length + agenticRAGAnalyses.length}</div>
               </button>
             </div>

            {/* Resources Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: 20 
            }}>
              {filteredResources.map(resource => (
                <div key={resource.id} onClick={() => trackInteraction(resource.id, resource.type, 'view', { topic: resource.topic })} style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  {/* Type Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: getTypeColor(resource.type),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}>
                    {getTypeIcon(resource.type)} {typeLabel(resource.type)}
                  </div>

                  {/* Sample/demo label — never present illustrative seed data as real */}
                  {isDemoResource(resource) && (
                    <span style={{
                      display: 'inline-block', marginBottom: 8,
                      background: '#9ca3af', color: 'white', padding: '2px 8px',
                      borderRadius: '10px', fontSize: '0.72em', fontWeight: 'bold'
                    }}>
                      {t('babelLibraryModule.sampleBadge')}
                    </span>
                  )}

                  {/* Content */}
                  <h3 style={{
                    color: colors.text,
                    marginBottom: 8,
                    fontSize: '1.2em',
                    paddingRight: '80px'
                  }}>
                    {resource.title}
                  </h3>
                  
                  <p style={{ 
                    color: colors.primary, 
                    marginBottom: 8, 
                    fontWeight: 500,
                    fontSize: '0.9em'
                  }}>
                    👤 {authorLabel(resource.author)}
                  </p>
                  
                  <p style={{ 
                    color: colors.textSecondary, 
                    marginBottom: 12,
                    fontSize: '0.9em',
                    lineHeight: 1.5
                  }}>
                    {resource.description}
                  </p>
                  
                  {/* Video Player for video resources */}
                  {resource.type === 'video' && resource.url && (
                    <div style={{ marginBottom: 12 }}>
                      <iframe
                        width="100%"
                        height="200"
                        src={resource.url}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={resource.title}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        background: colors.primaryLight,
                        color: colors.primary,
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        fontWeight: '500'
                      }}>
                        🏷️ {resource.topic}
                      </span>
                      {resource.classification?.domain && (
                        <span style={{
                          background: '#e8eaf6', color: '#3f51b5',
                          padding: '3px 8px', borderRadius: 12, fontSize: '0.75em', fontWeight: 500
                        }}>
                          📂 {resource.classification.domain}
                        </span>
                      )}
                      {resource.classification?.difficulty && (
                        <span style={{
                          background: resource.classification.difficulty === 'beginner' ? '#e8f5e9' : resource.classification.difficulty === 'advanced' ? '#fce4ec' : '#fff8e1',
                          color: resource.classification.difficulty === 'beginner' ? '#2e7d32' : resource.classification.difficulty === 'advanced' ? '#c62828' : '#f57f17',
                          padding: '3px 8px', borderRadius: 12, fontSize: '0.75em', fontWeight: 500
                        }}>
                          {resource.classification.difficulty === 'beginner' ? '🟢' : resource.classification.difficulty === 'advanced' ? '🔴' : '🟡'} {t(`babelLibraryModule.intelligence.${resource.classification.difficulty}`)}
                        </span>
                      )}
                      {resource.tags?.length > 0 && resource.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          background: '#f3e5f5', color: '#7b1fa2',
                          padding: '2px 7px', borderRadius: 10, fontSize: '0.7em'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Action buttons based on resource type */}
                                             {resource.author === 'Micro-lesson' && (
                         <button
                           onClick={() => handleEditMicroLesson(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.microLesson')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                      
                                             {resource.author === 'Certification' && (
                         <button
                           onClick={() => handleEditCertification(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.certification')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                      
                                             {resource.author === 'AI Career Coach' && (
                         <button
                           onClick={() => handleEditCareerCoach(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.careerCoach')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                      
                      {(resource.author === 'YouTube Video' || resource.type === 'video') && (
                         <button
                          onClick={() => handleEditVideo(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.video')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                      
                                             {resource.author === 'Simulation Result' && (
                         <button
                           onClick={() => handleEditSimulation(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.simulation')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                       
                       {resource.author === 'Document Analyzer' && (
                         <button
                           onClick={() => handleEditDocumentAnalysis(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.document')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                       
                       {resource.author === 'Repository Analyzer' && (
                         <button
                           onClick={() => handleEditRepositoryAnalysis(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.repo')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                       
                       {resource.author === 'Agentic RAG' && (
                         <button
                           onClick={() => handleEditAgenticRAGAnalysis(resource.id, resource.title)}
                           style={{
                             background: colors.primary,
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title={t('babelLibraryModule.editIn.agenticRag')}
                         >
                           {t('babelLibraryModule.edit')}
                         </button>
                       )}
                      
                                             {/* Delete button - calls appropriate function based on resource type */}
                       {resource.author === 'Micro-lesson' && (
                         <button
                           onClick={() => handleDeleteMicroLesson(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.microLesson')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Certification' && (
                         <button
                           onClick={() => handleDeleteCertification(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.certification')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'AI Career Coach' && (
                         <button
                           onClick={() => handleDeleteCareerCoach(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.careerCoach')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {(resource.author === 'YouTube Video' || resource.type === 'video') && (
                         <button
                           onClick={() => {
                             if (resource.author === 'YouTube Video') {
                               handleDeleteVideo(resource.id);
                             } else {
                               handleDeleteBook(resource.id);
                             }
                           }}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.video')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Simulation Result' && (
                         <button
                           onClick={() => handleDeleteSimulation(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.simulation')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Skills Forecast' && (
                         <button
                           onClick={() => handleDeleteSkillsForecast(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.skillsForecast')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Web Search' && (
                         <button
                           onClick={() => handleDeleteWebSearch(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.webSearch')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Document Analyzer' && (
                         <button
                           onClick={() => handleDeleteDocumentAnalysis(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.document')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Repository Analyzer' && (
                         <button
                           onClick={() => handleDeleteRepositoryAnalysis(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.repository')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {resource.author === 'Agentic RAG' && (
                         <button
                           onClick={() => handleDeleteAgenticRAGAnalysis(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.agenticRag')}
                         >
                           🗑️
                         </button>
                       )}
                       
                       {/* For demo books (hardcoded), use the original handleDeleteBook */}
                       {(resource.author === 'Dr. Sarah Chen' || 
                         resource.author === 'Prof. Michael Rodriguez' || 
                         resource.author === 'Dr. Emily Watson' || 
                         resource.author === 'Prof. David Kim' || 
                         resource.author === 'Dr. Lisa Thompson') && (
                         <button
                           onClick={() => handleDeleteBook(resource.id)}
                           style={{
                             background: '#dc3545',
                             color: 'white',
                             border: 'none',
                             padding: '6px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer',
                             fontSize: '0.8em'
                           }}
                           title={t('babelLibraryModule.deleteTitle.demo')}
                         >
                           🗑️
                         </button>
                       )}
                    </div>
                  </div>
                  
                  {/* Phase 3: AI Content panel */}
                  {renderAiContentPanel(resource, `catalog-${resource.id}`)}

                  <div style={{
                    marginTop: 12,
                    fontSize: '0.8em',
                    color: colors.textSecondary,
                    textAlign: 'right'
                  }}>
                    {t('babelLibraryModule.catalog.addedPrefix', { date: resource.addedDate })}
                  </div>
                </div>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.textSecondary
              }}>
                <div style={{ fontSize: '3em', marginBottom: 16 }}>🔍</div>
                <h3>{t('babelLibraryModule.catalog.emptyTitle')}</h3>
                <p>{t('babelLibraryModule.catalog.emptyHint')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ color: colors.text, marginBottom: 24 }}>{t('babelLibraryModule.addForm.title')}</h2>
            
            <form onSubmit={handleAddBook}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  {t('babelLibraryModule.addForm.resourceType')}
                </label>
                <select
                  value={newBook.type}
                  onChange={(e) => setNewBook({...newBook, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text
                  }}
                >
                  <option value="book">{t('babelLibraryModule.addForm.typeBook')}</option>
                  <option value="video">{t('babelLibraryModule.addForm.typeVideo')}</option>
                  <option value="article">{t('babelLibraryModule.addForm.typeArticle')}</option>
                  <option value="course">{t('babelLibraryModule.addForm.typeCourse')}</option>
                  <option value="analysis">{t('babelLibraryModule.addForm.typeAnalysis')}</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  {t('babelLibraryModule.addForm.fieldTitle')}
                </label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  placeholder={t('babelLibraryModule.addForm.placeholderTitle')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  {t('babelLibraryModule.addForm.fieldAuthor')}
                </label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  placeholder={t('babelLibraryModule.addForm.placeholderAuthor')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  {t('babelLibraryModule.addForm.fieldTopic')}
                </label>
                <input
                  type="text"
                  value={newBook.topic}
                  onChange={(e) => setNewBook({...newBook, topic: e.target.value})}
                  placeholder={t('babelLibraryModule.addForm.placeholderTopic')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  {t('babelLibraryModule.addForm.fieldDescription')}
                </label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  placeholder={t('babelLibraryModule.addForm.placeholderDescription')}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text,
                    resize: 'vertical'
                  }}
                />
              </div>

              {newBook.type === 'video' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8, 
                    color: colors.text,
                    fontWeight: '500'
                  }}>
                    {t('babelLibraryModule.addForm.fieldVideoUrl')}
                  </label>
                  <input
                    type="text"
                    value={newBook.url}
                    onChange={(e) => setNewBook({ ...newBook, url: e.target.value })}
                    placeholder={t('babelLibraryModule.addForm.placeholderVideoUrl')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      fontSize: '1em',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                style={{
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontSize: '1em',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {t('babelLibraryModule.addForm.submit')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'search' && (() => {
          // Compute unique authors from allResources
          const uniqueAuthors = ['all', ...Array.from(new Set(allResources.map(r => r.author)))].sort((a, b) => {
            if (a === 'all') return -1;
            if (b === 'all') return 1;
            return a.localeCompare(b);
          });

          // Advanced search filtering
          const advResults = allResources.filter(resource => {
            const q = advSearchQuery.toLowerCase();
            const matchesQuery = !q ||
              resource.title.toLowerCase().includes(q) ||
              resource.author.toLowerCase().includes(q) ||
              resource.description.toLowerCase().includes(q) ||
              (resource.topic && resource.topic.toLowerCase().includes(q));
            const matchesType = advSearchType === 'all' || resource.type === advSearchType;
            const matchesTopic = advSearchTopic === 'all' || resource.topic === advSearchTopic;
            const matchesAuthor = advSearchAuthor === 'all' || resource.author === advSearchAuthor;
            return matchesQuery && matchesType && matchesTopic && matchesAuthor;
          });

          // Sort
          const sortedResults = [...advResults].sort((a, b) => {
            switch (advSortBy) {
              case 'newest':
                return (b.addedDate || '').localeCompare(a.addedDate || '');
              case 'oldest':
                return (a.addedDate || '').localeCompare(b.addedDate || '');
              case 'alpha':
                return a.title.localeCompare(b.title);
              case 'alpha-desc':
                return b.title.localeCompare(a.title);
              case 'author':
                return a.author.localeCompare(b.author);
              default:
                return 0;
            }
          });

          const handleAdvSearch = () => setAdvSearchExecuted(true);
          const handleAdvClear = () => {
            setAdvSearchQuery('');
            setAdvSearchType('all');
            setAdvSearchTopic('all');
            setAdvSearchAuthor('all');
            setAdvSortBy('newest');
            setAdvSearchExecuted(false);
          };

          const selectStyle = {
            padding: '10px 14px',
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontSize: '0.9em',
            background: colors.background,
            color: colors.text,
            minWidth: 160,
            flex: 1
          };

          return (
          <div>
            <h2 style={{ color: colors.text, marginBottom: 20 }}>{t('babelLibraryModule.advancedSearch.title')}</h2>

            {/* Search Features Info (collapsible) */}
            <details style={{
              background: colors.primaryLight,
              padding: '16px 20px',
              borderRadius: 10,
              border: `1px solid ${colors.primary}`,
              marginBottom: 20,
              cursor: 'pointer'
            }}>
              <summary style={{ color: colors.primary, fontWeight: 'bold', fontSize: '1em' }}>
                {t('babelLibraryModule.advancedSearch.featuresTitle')}
              </summary>
              <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px', marginTop: 12 }}>
                <li>{t('babelLibraryModule.advancedSearch.li1')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li2')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li3')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li4')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li5')}</li>
              </ul>
            </details>

            {/* Search Form */}
            <div style={{
              background: colors.background,
              padding: '24px',
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              marginBottom: 20
            }}>
              {/* Full-text search input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: '0.9em', color: colors.text }}>
                  🔍 {t('babelLibraryModule.advancedSearch.queryLabel')}
                </label>
                <input
                  type="text"
                  value={advSearchQuery}
                  onChange={(e) => { setAdvSearchQuery(e.target.value); setAdvSearchExecuted(true); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdvSearch()}
                  placeholder={t('babelLibraryModule.advancedSearch.queryPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: '1em',
                    background: colors.sidebarBackground || colors.background,
                    color: colors.text,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Filter row */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
                    📁 {t('babelLibraryModule.advancedSearch.filterType')}
                  </label>
                  <select value={advSearchType} onChange={(e) => { setAdvSearchType(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
                    <option value="all">{t('babelLibraryModule.catalog.allTypes')}</option>
                    {['book', 'video', 'article', 'course', 'simulation', 'analysis'].map(type => (
                      <option key={type} value={type}>{getTypeIcon(type)} {typeLabel(type)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
                    🏷️ {t('babelLibraryModule.advancedSearch.filterTopic')}
                  </label>
                  <select value={advSearchTopic} onChange={(e) => { setAdvSearchTopic(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
                    {topics.map(topic => (
                      <option key={topic} value={topic}>
                        {topic === 'all' ? t('babelLibraryModule.catalog.allTopics') : topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
                    👤 {t('babelLibraryModule.advancedSearch.filterAuthor')}
                  </label>
                  <select value={advSearchAuthor} onChange={(e) => { setAdvSearchAuthor(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
                    {uniqueAuthors.map(author => (
                      <option key={author} value={author}>
                        {author === 'all' ? t('babelLibraryModule.advancedSearch.allAuthors') : authorLabel(author)}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>
                    📊 {t('babelLibraryModule.advancedSearch.sortLabel')}
                  </label>
                  <select value={advSortBy} onChange={(e) => { setAdvSortBy(e.target.value); setAdvSearchExecuted(true); }} style={selectStyle}>
                    <option value="newest">{t('babelLibraryModule.advancedSearch.sortNewest')}</option>
                    <option value="oldest">{t('babelLibraryModule.advancedSearch.sortOldest')}</option>
                    <option value="alpha">{t('babelLibraryModule.advancedSearch.sortAlpha')}</option>
                    <option value="alpha-desc">{t('babelLibraryModule.advancedSearch.sortAlphaDesc')}</option>
                    <option value="author">{t('babelLibraryModule.advancedSearch.sortAuthor')}</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={handleAdvSearch}
                  style={{
                    padding: '10px 24px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.95em'
                  }}
                >
                  🔍 {t('babelLibraryModule.advancedSearch.searchBtn')}
                </button>
                <button
                  onClick={handleAdvClear}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.95em'
                  }}
                >
                  ✕ {t('babelLibraryModule.advancedSearch.clearBtn')}
                </button>
                {advSearchExecuted && (
                  <span style={{ color: colors.textSecondary, fontSize: '0.9em' }}>
                    {t('babelLibraryModule.advancedSearch.resultCount', { count: sortedResults.length, total: allResources.length })}
                  </span>
                )}
              </div>
            </div>

            {/* Results */}
            {advSearchExecuted && (
              <div>
                {/* Active filters summary */}
                {(advSearchQuery || advSearchType !== 'all' || advSearchTopic !== 'all' || advSearchAuthor !== 'all') && (
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <span style={{ color: colors.textSecondary, fontSize: '0.9em' }}>{t('babelLibraryModule.catalog.activeFilters')}</span>
                    {advSearchQuery && (
                      <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                        🔍 "{advSearchQuery}"
                      </span>
                    )}
                    {advSearchType !== 'all' && (
                      <span style={{ background: getTypeColor(advSearchType), color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                        {getTypeIcon(advSearchType)} {typeLabel(advSearchType)}
                      </span>
                    )}
                    {advSearchTopic !== 'all' && (
                      <span style={{ background: colors.primaryLight, color: colors.primary, padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                        🏷️ {advSearchTopic}
                      </span>
                    )}
                    {advSearchAuthor !== 'all' && (
                      <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '4px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500 }}>
                        👤 {authorLabel(advSearchAuthor)}
                      </span>
                    )}
                  </div>
                )}

                {sortedResults.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: colors.textSecondary
                  }}>
                    <div style={{ fontSize: '3em', marginBottom: 12 }}>📭</div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('babelLibraryModule.catalog.emptyTitle')}</p>
                    <p>{t('babelLibraryModule.catalog.emptyHint')}</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 16
                  }}>
                    {sortedResults.map((resource, index) => {
                      // Highlight matching text
                      const highlightMatch = (text) => {
                        if (!advSearchQuery || !text) return text;
                        const q = advSearchQuery.toLowerCase();
                        const idx = text.toLowerCase().indexOf(q);
                        if (idx === -1) return text;
                        return (
                          <span>
                            {text.slice(0, idx)}
                            <mark style={{ background: '#fff176', padding: '0 2px', borderRadius: 2 }}>
                              {text.slice(idx, idx + advSearchQuery.length)}
                            </mark>
                            {text.slice(idx + advSearchQuery.length)}
                          </span>
                        );
                      };

                      return (
                        <div key={`adv-${resource.id || index}`} style={{
                          background: colors.background,
                          padding: 20,
                          borderRadius: 12,
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ margin: 0, fontSize: '1em', color: colors.text, flex: 1 }}>
                              {highlightMatch(resource.title)}
                            </h3>
                            <span style={{
                              background: getTypeColor(resource.type),
                              color: 'white',
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontSize: '0.75em',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              marginLeft: 8
                            }}>
                              {getTypeIcon(resource.type)} {typeLabel(resource.type)}
                            </span>
                          </div>
                          {isDemoResource(resource) && (
                            <span style={{
                              display: 'inline-block', alignSelf: 'flex-start',
                              background: '#9ca3af', color: 'white', padding: '2px 8px',
                              borderRadius: '10px', fontSize: '0.72em', fontWeight: 'bold'
                            }}>
                              {t('babelLibraryModule.sampleBadge')}
                            </span>
                          )}
                          <div style={{ fontSize: '0.85em', color: colors.textSecondary }}>
                            👤 {highlightMatch(authorLabel(resource.author))}
                          </div>
                          <div style={{ fontSize: '0.85em', color: colors.textSecondary }}>
                            🏷️ {highlightMatch(resource.topic)}
                          </div>
                          <p style={{ fontSize: '0.9em', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                            {highlightMatch(resource.description)}
                          </p>
                          {resource.addedDate && (
                            <div style={{ fontSize: '0.8em', color: colors.textSecondary, marginTop: 'auto' }}>
                              📅 {t('babelLibraryModule.catalog.addedPrefix', { date: resource.addedDate })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}

        {activeTab === 'ai-search' && (() => {
          const searchHistory = getSearchHistory();
          const suggestedQueries = [
            t('babelLibraryModule.aiSearch.suggestion1'),
            t('babelLibraryModule.aiSearch.suggestion2'),
            t('babelLibraryModule.aiSearch.suggestion3'),
            t('babelLibraryModule.aiSearch.suggestion4'),
            t('babelLibraryModule.aiSearch.suggestion5')
          ];

          return (
          <div>
            <h2 style={{ color: colors.text, marginBottom: 20 }}>{t('babelLibraryModule.aiSearch.title')}</h2>

            {/* Recommended For You */}
            {(recommendations?.length > 0 || recsLoading) && (
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}05, ${colors.primary}10)`,
                padding: '20px',
                borderRadius: 12,
                border: `1px solid ${colors.primary}25`,
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, color: colors.text }}>
                    💡 {t('babelLibraryModule.recommendations.title')}
                  </h3>
                  {profileSummary && (
                    <span style={{
                      background: profileSummary.total_interactions > 100 ? '#fff8e1' : profileSummary.total_interactions > 20 ? '#e8f5e9' : profileSummary.total_interactions > 0 ? '#e3f2fd' : '#f5f5f5',
                      color: profileSummary.total_interactions > 100 ? '#f57f17' : profileSummary.total_interactions > 20 ? '#2e7d32' : profileSummary.total_interactions > 0 ? '#1565c0' : '#757575',
                      padding: '3px 10px', borderRadius: 12, fontSize: '0.75em', fontWeight: 600
                    }}>
                      {profileSummary.total_interactions > 100 ? '⭐' : profileSummary.total_interactions > 20 ? '🟢' : profileSummary.total_interactions > 0 ? '🔵' : '⚪'}
                      {' '}{profileSummary.total_interactions > 100
                        ? t('babelLibraryModule.recommendations.powerLearner')
                        : profileSummary.total_interactions > 20
                        ? t('babelLibraryModule.recommendations.activeLearner')
                        : profileSummary.total_interactions > 0
                        ? t('babelLibraryModule.recommendations.buildingProfile')
                        : t('babelLibraryModule.recommendations.newLearner')}
                    </span>
                  )}
                </div>

                {recsLoading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: colors.textSecondary }}>
                    ⏳ {t('babelLibraryModule.recommendations.loading')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                    {recommendations.slice(0, 6).map((rec, i) => (
                      <div
                        key={`rec-${rec.resource_id || i}`}
                        onClick={() => {
                          trackInteraction(rec.resource_id, rec.resource_type, 'click', { domain: rec.classification?.domain });
                          setAiQuery(rec.title);
                          performAiSearch(rec.title);
                        }}
                        style={{
                          minWidth: 220, maxWidth: 240,
                          background: colors.background,
                          padding: 14,
                          borderRadius: 10,
                          border: `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'box-shadow 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{
                            background: getTypeColor(rec.resource_type), color: 'white',
                            padding: '2px 7px', borderRadius: 10, fontSize: '0.7em', fontWeight: 500
                          }}>
                            {getTypeIcon(rec.resource_type)} {typeLabel(rec.resource_type)}
                          </span>
                          <span style={{ fontSize: '0.7em', fontWeight: 'bold', color: rec.match_score >= 70 ? '#4caf50' : rec.match_score >= 50 ? '#ff9800' : colors.textSecondary }}>
                            {rec.match_score}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9em', fontWeight: 600, color: colors.text, marginBottom: 6, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {rec.title}
                        </div>
                        {rec.classification?.difficulty && (
                          <span style={{
                            background: rec.classification.difficulty === 'beginner' ? '#e8f5e9' : rec.classification.difficulty === 'advanced' ? '#fce4ec' : '#fff8e1',
                            color: rec.classification.difficulty === 'beginner' ? '#2e7d32' : rec.classification.difficulty === 'advanced' ? '#c62828' : '#f57f17',
                            padding: '1px 6px', borderRadius: 8, fontSize: '0.65em'
                          }}>
                            {rec.classification.difficulty === 'beginner' ? '🟢' : rec.classification.difficulty === 'advanced' ? '🔴' : '🟡'} {t(`babelLibraryModule.intelligence.${rec.classification.difficulty}`)}
                          </span>
                        )}
                        {rec.tags?.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {rec.tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '1px 5px', borderRadius: 8, fontSize: '0.6em' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Search Input */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.primary}08, ${colors.primary}18)`,
              padding: '28px',
              borderRadius: 16,
              border: `2px solid ${colors.primary}40`,
              marginBottom: 24
            }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 10, color: colors.text, fontSize: '1em' }}>
                🤖 {t('babelLibraryModule.aiSearch.inputLabel')}
              </label>
              <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginBottom: 12 }}>
                {t('babelLibraryModule.aiSearch.inputHint')}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performAiSearch(aiQuery)}
                  placeholder={t('babelLibraryModule.aiSearch.inputPlaceholder')}
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    border: `2px solid ${colors.primary}50`,
                    borderRadius: 10,
                    fontSize: '1em',
                    background: colors.background,
                    color: colors.text,
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => performAiSearch(aiQuery)}
                  disabled={!aiQuery.trim() || aiSearching}
                  style={{
                    padding: '14px 28px',
                    background: aiQuery.trim() ? colors.primary : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    cursor: aiQuery.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '1em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {aiSearching ? '⏳' : '🤖'} {t('babelLibraryModule.aiSearch.searchBtn')}
                </button>
              </div>

              {/* Suggested queries */}
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.trySuggestions')}</span>
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setAiQuery(q); performAiSearch(q); }}
                    style={{
                      padding: '4px 12px',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 16,
                      fontSize: '0.8em',
                      cursor: 'pointer',
                      color: colors.primary
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {aiSearching && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.primary
              }}>
                <div style={{ fontSize: '2em', marginBottom: 12 }}>🧠</div>
                <p style={{ fontWeight: 'bold' }}>{t('babelLibraryModule.aiSearch.analyzing')}</p>
                <p style={{ color: colors.textSecondary, fontSize: '0.9em' }}>{t('babelLibraryModule.aiSearch.analyzingDesc')}</p>
              </div>
            )}

            {/* AI Insights Panel */}
            {aiInsights && !aiSearching && (
              <div style={{
                background: colors.background,
                padding: '20px',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                marginBottom: 20
              }}>
                <h4 style={{ color: colors.primary, marginBottom: 14 }}>🧠 {t('babelLibraryModule.aiSearch.insightsTitle')}</h4>

                {/* Intent detected */}
                {aiInsights.intent && (
                  <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.detectedIntent')}</span>
                    {aiInsights.intent.types.length > 0 && aiInsights.intent.types.map(type => (
                      <span key={type} style={{
                        background: getTypeColor(type), color: 'white',
                        padding: '2px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500
                      }}>
                        {getTypeIcon(type)} {typeLabel(type)}
                      </span>
                    ))}
                    {aiInsights.intent.action !== 'search' && (
                      <span style={{
                        background: '#e8eaf6', color: '#3f51b5',
                        padding: '2px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 500
                      }}>
                        {aiInsights.intent.action === 'recommend' ? '💡' : aiInsights.intent.action === 'trending' ? '📈' : '🕐'} {t(`babelLibraryModule.aiSearch.intent_${aiInsights.intent.action}`)}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded keywords */}
                {aiInsights.expandedKeywords && (
                  <div style={{ marginBottom: 14, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.conceptsExpanded')}</span>
                    {aiInsights.expandedKeywords.slice(0, 12).map((kw, i) => (
                      <span key={i} style={{
                        background: '#e3f2fd', color: '#1565c0',
                        padding: '2px 8px', borderRadius: 10, fontSize: '0.75em'
                      }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 10,
                  marginBottom: 14
                }}>
                  <div style={{ textAlign: 'center', padding: '10px', background: colors.primaryLight || '#e3f2fd', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: colors.primary }}>{aiInsights.totalFound}</div>
                    <div style={{ fontSize: '0.8em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.matchesFound')}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', background: colors.primaryLight || '#e3f2fd', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: colors.primary }}>{aiInsights.coverage}%</div>
                    <div style={{ fontSize: '0.8em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.libraryCoverage')}</div>
                  </div>
                  {aiInsights.topType && (
                    <div style={{ textAlign: 'center', padding: '10px', background: colors.primaryLight || '#e3f2fd', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: colors.primary }}>{getTypeIcon(aiInsights.topType.name)} {aiInsights.topType.count}</div>
                      <div style={{ fontSize: '0.8em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.topType')}</div>
                    </div>
                  )}
                  {aiInsights.topTopic && (
                    <div style={{ textAlign: 'center', padding: '10px', background: colors.primaryLight || '#e3f2fd', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.95em', fontWeight: 'bold', color: colors.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aiInsights.topTopic.name}</div>
                      <div style={{ fontSize: '0.8em', color: colors.textSecondary }}>{t('babelLibraryModule.aiSearch.topTopic')}</div>
                    </div>
                  )}
                </div>

                {/* Related topics suggestion */}
                {aiInsights.relatedTopics.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85em', color: colors.textSecondary }}>💡 {t('babelLibraryModule.aiSearch.alsoExplore')}</span>
                    {aiInsights.relatedTopics.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => { setAiQuery(topic); performAiSearch(topic); }}
                        style={{
                          padding: '3px 10px', background: '#f3e5f5', color: '#7b1fa2',
                          border: '1px solid #ce93d8', borderRadius: 12, fontSize: '0.8em', cursor: 'pointer'
                        }}
                      >
                        🏷️ {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Results */}
            {aiResults && !aiSearching && (
              <div>
                {aiResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textSecondary }}>
                    <div style={{ fontSize: '3em', marginBottom: 12 }}>🔍</div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('babelLibraryModule.aiSearch.noResults')}</p>
                    <p>{t('babelLibraryModule.aiSearch.noResultsHint')}</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 16
                  }}>
                    {aiResults.map((resource, index) => (
                      <div key={`ai-${resource.id || index}`} style={{
                        background: colors.background,
                        padding: 20,
                        borderRadius: 12,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        position: 'relative'
                      }}>
                        {/* Relevance score badge */}
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: resource._score >= 25 ? '#4caf50' : resource._score >= 15 ? '#ff9800' : '#90a4ae',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: '0.7em',
                          fontWeight: 'bold'
                        }}>
                          {resource._score >= 25 ? '🎯' : resource._score >= 15 ? '✨' : '🔍'} {t('babelLibraryModule.aiSearch.relevance')} {resource._score}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingRight: 70 }}>
                          <h3 style={{ margin: 0, fontSize: '1em', color: colors.text, flex: 1 }}>
                            {resource.title}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            background: getTypeColor(resource.type), color: 'white',
                            padding: '3px 10px', borderRadius: 12, fontSize: '0.75em', fontWeight: 500
                          }}>
                            {getTypeIcon(resource.type)} {typeLabel(resource.type)}
                          </span>
                          <span style={{ fontSize: '0.85em', color: colors.textSecondary }}>
                            👤 {authorLabel(resource.author)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85em', color: colors.textSecondary }}>
                          🏷️ {resource.topic}
                        </div>
                        {/* AI classification badges */}
                        {(resource.classification || resource.tags?.length > 0) && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {resource.classification?.domain && (
                              <span style={{ background: '#e8eaf6', color: '#3f51b5', padding: '2px 7px', borderRadius: 10, fontSize: '0.7em' }}>
                                📂 {resource.classification.domain}
                              </span>
                            )}
                            {resource.classification?.difficulty && (
                              <span style={{
                                background: resource.classification.difficulty === 'beginner' ? '#e8f5e9' : resource.classification.difficulty === 'advanced' ? '#fce4ec' : '#fff8e1',
                                color: resource.classification.difficulty === 'beginner' ? '#2e7d32' : resource.classification.difficulty === 'advanced' ? '#c62828' : '#f57f17',
                                padding: '2px 7px', borderRadius: 10, fontSize: '0.7em'
                              }}>
                                {resource.classification.difficulty === 'beginner' ? '🟢' : resource.classification.difficulty === 'advanced' ? '🔴' : '🟡'} {t(`babelLibraryModule.intelligence.${resource.classification.difficulty}`)}
                              </span>
                            )}
                            {resource.tags?.slice(0, 4).map(tag => (
                              <span key={tag} style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '2px 6px', borderRadius: 10, fontSize: '0.65em' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ fontSize: '0.9em', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                          {resource.description}
                        </p>
                        {/* Phase 3: AI Content panel */}
                        {renderAiContentPanel(resource, `ai-${resource.id || index}`)}
                        {resource.addedDate && (
                          <div style={{ fontSize: '0.8em', color: colors.textSecondary, marginTop: 'auto' }}>
                            📅 {t('babelLibraryModule.catalog.addedPrefix', { date: resource.addedDate })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && !aiSearching && (
              <div style={{
                background: colors.background,
                padding: '20px',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                marginTop: 24
              }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>🕐 {t('babelLibraryModule.aiSearch.historyTitle')}</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {searchHistory.slice(0, 10).map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => { setAiQuery(entry.query); performAiSearch(entry.query); }}
                      style={{
                        padding: '4px 12px',
                        background: colors.sidebarBackground || '#f5f5f5',
                        border: `1px solid ${colors.border}`,
                        borderRadius: 16,
                        fontSize: '0.8em',
                        cursor: 'pointer',
                        color: colors.text
                      }}
                    >
                      🔍 {entry.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Path Generator */}
            <details style={{
              background: `linear-gradient(135deg, ${colors.primary}05, ${colors.primary}12)`,
              padding: '16px 20px',
              borderRadius: 10,
              border: `1px solid ${colors.primary}30`,
              marginTop: 24,
              cursor: 'pointer'
            }}>
              <summary style={{ color: colors.primary, fontWeight: 'bold', fontSize: '1em' }}>
                🗺️ {t('babelLibraryModule.learningPath.title')}
              </summary>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginBottom: 12 }}>
                  {t('babelLibraryModule.learningPath.description')}
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="text"
                    value={pathGoal}
                    onChange={(e) => setPathGoal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && pathGoal.trim()) {
                        setPathLoading(true);
                        apiCall(`/api/babel/profile/${getUserId()}/learning-path`, 'POST', { goal_topic: pathGoal, max_steps: 8 })
                          .then(data => setLearningPath(data))
                          .catch(() => setLearningPath({ steps: [] }))
                          .finally(() => setPathLoading(false));
                      }
                    }}
                    placeholder={t('babelLibraryModule.learningPath.inputPlaceholder')}
                    style={{
                      flex: 1, padding: '10px 14px',
                      border: `1px solid ${colors.border}`, borderRadius: 8,
                      fontSize: '0.95em', background: colors.background, color: colors.text
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!pathGoal.trim()) return;
                      setPathLoading(true);
                      apiCall(`/api/babel/profile/${getUserId()}/learning-path`, 'POST', { goal_topic: pathGoal, max_steps: 8 })
                        .then(data => setLearningPath(data))
                        .catch(() => setLearningPath({ steps: [] }))
                        .finally(() => setPathLoading(false));
                    }}
                    disabled={!pathGoal.trim() || pathLoading}
                    style={{
                      padding: '10px 20px',
                      background: pathGoal.trim() && !pathLoading ? colors.primary : '#ccc',
                      color: 'white', border: 'none', borderRadius: 8,
                      cursor: pathGoal.trim() && !pathLoading ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold', whiteSpace: 'nowrap'
                    }}
                  >
                    {pathLoading ? '⏳' : '🗺️'} {t('babelLibraryModule.learningPath.generate')}
                  </button>
                </div>

                {pathLoading && (
                  <div style={{ textAlign: 'center', padding: 20, color: colors.primary }}>
                    ⏳ {t('babelLibraryModule.learningPath.generating')}
                  </div>
                )}

                {learningPath && !pathLoading && (
                  <div style={{ marginTop: 16 }}>
                    {learningPath.steps?.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20, color: colors.textSecondary }}>
                        🔍 {t('babelLibraryModule.learningPath.empty')}
                      </div>
                    ) : (
                      <div>
                        {learningPath.steps.map((step, i) => (
                          <div key={`path-${i}`} style={{
                            display: 'flex', gap: 14, alignItems: 'flex-start',
                            padding: '12px 0',
                            borderBottom: i < learningPath.steps.length - 1 ? `1px solid ${colors.border}` : 'none'
                          }}>
                            {/* Step number */}
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: colors.primary, color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold', fontSize: '0.85em', flexShrink: 0
                            }}>
                              {step.step}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                                {getTypeIcon(step.resource_type)} {step.title}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{
                                  background: getTypeColor(step.resource_type), color: 'white',
                                  padding: '1px 7px', borderRadius: 10, fontSize: '0.7em'
                                }}>
                                  {typeLabel(step.resource_type)}
                                </span>
                                {step.difficulty && (
                                  <span style={{
                                    background: step.difficulty === 'beginner' ? '#e8f5e9' : step.difficulty === 'advanced' ? '#fce4ec' : '#fff8e1',
                                    color: step.difficulty === 'beginner' ? '#2e7d32' : step.difficulty === 'advanced' ? '#c62828' : '#f57f17',
                                    padding: '1px 7px', borderRadius: 10, fontSize: '0.7em'
                                  }}>
                                    {step.difficulty === 'beginner' ? '🟢' : step.difficulty === 'advanced' ? '🔴' : '🟡'} {t(`babelLibraryModule.intelligence.${step.difficulty}`)}
                                  </span>
                                )}
                                {step.tags?.map(tag => (
                                  <span key={tag} style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '1px 5px', borderRadius: 8, fontSize: '0.65em' }}>{tag}</span>
                                ))}
                              </div>
                              <div style={{ fontSize: '0.8em', color: colors.textSecondary, fontStyle: 'italic' }}>
                                {step.reason}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </details>

            {/* Phase 4: Predictive Intelligence Dashboard */}
            <details style={{
              background: `linear-gradient(135deg, #7b1fa205, #7b1fa212)`,
              padding: '16px 20px',
              borderRadius: 10,
              border: `1px solid #7b1fa230`,
              marginTop: 24,
              cursor: 'pointer'
            }}>
              <summary style={{ color: '#7b1fa2', fontWeight: 'bold', fontSize: '1em' }}>
                🔮 {t('babelLibraryModule.predictiveIntel.title')}
              </summary>
              <div style={{ marginTop: 16 }}>
                {/* Load / Refresh button */}
                {!predictiveData ? (
                  <button
                    onClick={async () => {
                      setPredictiveLoading(true);
                      try {
                        const data = await apiCall(`/api/babel/intelligence/predictive/dashboard?user_id=${getUserId()}`);
                        setPredictiveData(data);
                      } catch (err) { console.error('Predictive load error:', err); }
                      finally { setPredictiveLoading(false); }
                    }}
                    disabled={predictiveLoading}
                    style={{
                      padding: '10px 20px', background: '#7b1fa2', color: 'white',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    {predictiveLoading ? `⏳ ${t('babelLibraryModule.predictiveIntel.loading')}` : `🔮 ${t('babelLibraryModule.predictiveIntel.loadBtn')}`}
                  </button>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: '0.8em', color: colors.textSecondary }}>
                        {t('babelLibraryModule.predictiveIntel.generatedAt')}: {new Date(predictiveData.generated_at).toLocaleString()}
                      </span>
                      <button
                        onClick={async () => {
                          setPredictiveLoading(true);
                          try {
                            const data = await apiCall(`/api/babel/intelligence/predictive/dashboard?user_id=${getUserId()}`);
                            setPredictiveData(data);
                          } catch (err) { console.error('Predictive refresh error:', err); }
                          finally { setPredictiveLoading(false); }
                        }}
                        style={{
                          padding: '4px 12px', background: 'transparent', color: '#7b1fa2',
                          border: '1px solid #7b1fa2', borderRadius: 6, cursor: 'pointer', fontSize: '0.85em'
                        }}
                      >
                        🔄 {t('babelLibraryModule.predictiveIntel.refreshBtn')}
                      </button>
                    </div>

                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 20 }}>
                      {[
                        { label: t('babelLibraryModule.predictiveIntel.profilesAnalyzed'), value: predictiveData.trends?.total_profiles_analyzed || 0, icon: '👥' },
                        { label: t('babelLibraryModule.predictiveIntel.totalResources'), value: predictiveData.demand?.total_resources || 0, icon: '📚' },
                        { label: t('babelLibraryModule.predictiveIntel.demandSignals'), value: predictiveData.demand?.total_demand_signals || 0, icon: '📊' },
                        { label: t('babelLibraryModule.predictiveIntel.activeLearners'), value: predictiveData.expertise?.total_learners || 0, icon: '🎓' }
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: 10, background: '#f3e5f5', borderRadius: 8 }}>
                          <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#7b1fa2' }}>{s.icon} {s.value}</div>
                          <div style={{ fontSize: '0.7em', color: colors.textSecondary }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* 1. Trend Analysis */}
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ color: colors.text, marginBottom: 4 }}>📈 {t('babelLibraryModule.predictiveIntel.trendsTitle')}</h4>
                      <p style={{ color: colors.textSecondary, fontSize: '0.85em', marginBottom: 10 }}>{t('babelLibraryModule.predictiveIntel.trendsDesc')}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(predictiveData.trends?.domain_trends || []).filter(d => d.total_interactions > 0).map((trend, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            background: colors.background, borderRadius: 8, border: `1px solid ${colors.border}`
                          }}>
                            <span style={{ fontSize: '1.1em' }}>
                              {trend.direction === 'rising' ? '🔥' : trend.direction === 'declining' ? '📉' : '➡️'}
                            </span>
                            <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9em' }}>{trend.domain}</span>
                            <span style={{
                              fontSize: '0.75em', fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                              background: trend.direction === 'rising' ? '#e8f5e9' : trend.direction === 'declining' ? '#fce4ec' : '#f5f5f5',
                              color: trend.direction === 'rising' ? '#2e7d32' : trend.direction === 'declining' ? '#c62828' : colors.textSecondary
                            }}>
                              {t(`babelLibraryModule.predictiveIntel.${trend.direction}`)}
                              {trend.momentum !== 0 && ` ${trend.momentum > 0 ? '+' : ''}${trend.momentum}%`}
                            </span>
                            <span style={{ fontSize: '0.7em', color: colors.textSecondary, minWidth: 50, textAlign: 'right' }}>
                              {t('babelLibraryModule.predictiveIntel.recent7d')}: {trend.recent_7d}
                            </span>
                          </div>
                        ))}
                        {(predictiveData.trends?.domain_trends || []).every(d => d.total_interactions === 0) && (
                          <div style={{ color: colors.textSecondary, fontSize: '0.9em', fontStyle: 'italic' }}>
                            {t('babelLibraryModule.predictiveIntel.noData')}
                          </div>
                        )}
                      </div>
                      {/* Trending tags */}
                      {(predictiveData.trends?.trending_tags || []).length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {predictiveData.trends.trending_tags.slice(0, 10).map((tt, i) => (
                            <span key={i} style={{ background: '#fff3e0', color: '#e65100', padding: '2px 8px', borderRadius: 10, fontSize: '0.75em' }}>
                              🏷️ {tt.tag} ({tt.recent_7d})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Demand vs Supply */}
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ color: colors.text, marginBottom: 4 }}>⚖️ {t('babelLibraryModule.predictiveIntel.demandTitle')}</h4>
                      <p style={{ color: colors.textSecondary, fontSize: '0.85em', marginBottom: 10 }}>{t('babelLibraryModule.predictiveIntel.demandDesc')}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(predictiveData.demand?.forecast || []).filter(f => f.supply_count > 0 || f.demand_score > 0).map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            background: colors.background, borderRadius: 8, border: `1px solid ${colors.border}`
                          }}>
                            <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9em' }}>{item.domain}</span>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7em', color: colors.textSecondary }}>
                                {t('babelLibraryModule.predictiveIntel.supply')}: {item.supply_count}
                              </span>
                              <div style={{
                                width: 60, height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden', position: 'relative'
                              }}>
                                <div style={{
                                  position: 'absolute', left: 0, top: 0, height: '100%',
                                  width: `${Math.min(item.supply_pct, 100)}%`, background: '#42a5f5', borderRadius: 3
                                }} />
                                <div style={{
                                  position: 'absolute', left: 0, top: 0, height: '100%',
                                  width: `${Math.min(item.demand_pct, 100)}%`, background: '#ef5350', borderRadius: 3, opacity: 0.5
                                }} />
                              </div>
                              <span style={{
                                fontSize: '0.7em', fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                background: item.status === 'under_served' ? '#fce4ec' : item.status === 'over_served' ? '#e3f2fd' : '#f5f5f5',
                                color: item.status === 'under_served' ? '#c62828' : item.status === 'over_served' ? '#1565c0' : colors.textSecondary
                              }}>
                                {t(`babelLibraryModule.predictiveIntel.${item.status === 'under_served' ? 'underServed' : item.status === 'over_served' ? 'overServed' : 'balanced'}`)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Knowledge Gaps (user-specific) */}
                    {(predictiveData.gaps?.user_gaps || []).length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ color: colors.text, marginBottom: 4 }}>🎯 {t('babelLibraryModule.predictiveIntel.gapsTitle')}</h4>
                        <p style={{ color: colors.textSecondary, fontSize: '0.85em', marginBottom: 10 }}>{t('babelLibraryModule.predictiveIntel.gapsDesc')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {predictiveData.gaps.user_gaps.map((gap, i) => (
                            <div key={i} style={{
                              padding: '8px 12px', background: colors.background, borderRadius: 8,
                              border: `1px solid ${gap.severity === 'high' ? '#ef535050' : colors.border}`,
                              borderLeft: `4px solid ${gap.severity === 'high' ? '#ef5350' : '#ff9800'}`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, fontSize: '0.9em' }}>{gap.domain}</span>
                                <span style={{
                                  fontSize: '0.7em', padding: '1px 6px', borderRadius: 8,
                                  background: gap.severity === 'high' ? '#fce4ec' : '#fff8e1',
                                  color: gap.severity === 'high' ? '#c62828' : '#f57f17'
                                }}>
                                  {gap.severity === 'high' ? '🔴' : '🟡'} {t(`babelLibraryModule.predictiveIntel.${gap.gap_type === 'interest_gap' ? 'interestGap' : gap.gap_type === 'exploration_gap' ? 'explorationGap' : 'contentGap'}`)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.8em', color: colors.textSecondary }}>
                                <span>{t('babelLibraryModule.predictiveIntel.interest')}: {Math.round(gap.interest_score * 100)}%</span>
                                <span>{t('babelLibraryModule.predictiveIntel.engagement')}: {gap.engagement_pct}%</span>
                                <span>{t('babelLibraryModule.predictiveIntel.available')}: {gap.available_resources}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Network Expertise */}
                    <div>
                      <h4 style={{ color: colors.text, marginBottom: 4 }}>🌐 {t('babelLibraryModule.predictiveIntel.expertiseTitle')}</h4>
                      <p style={{ color: colors.textSecondary, fontSize: '0.85em', marginBottom: 10 }}>{t('babelLibraryModule.predictiveIntel.expertiseDesc')}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(predictiveData.expertise?.domain_expertise || []).filter(d => d.active_learners > 0).map((dom, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            background: colors.background, borderRadius: 8, border: `1px solid ${colors.border}`
                          }}>
                            <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9em' }}>{dom.domain}</span>
                            <span style={{ fontSize: '0.75em', color: colors.textSecondary }}>
                              👥 {dom.active_learners} {t('babelLibraryModule.predictiveIntel.activeLearners')}
                            </span>
                            <span style={{ fontSize: '0.75em', color: colors.textSecondary }}>
                              📊 {dom.avg_interactions} {t('babelLibraryModule.predictiveIntel.avgInteractions')}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Difficulty distribution */}
                      {predictiveData.expertise?.difficulty_distribution && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: '0.8em', color: colors.textSecondary }}>{t('babelLibraryModule.predictiveIntel.difficultyDist')}:</span>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {Object.entries(predictiveData.expertise.difficulty_distribution).map(([diff, count]) => (
                              <span key={diff} style={{
                                padding: '2px 8px', borderRadius: 10, fontSize: '0.8em',
                                background: diff === 'beginner' ? '#e8f5e9' : diff === 'advanced' ? '#fce4ec' : '#fff8e1',
                                color: diff === 'beginner' ? '#2e7d32' : diff === 'advanced' ? '#c62828' : '#f57f17'
                              }}>
                                {t(`babelLibraryModule.intelligence.${diff}`)}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </details>

            {/* Batch Classification Admin Panel */}
            <details style={{
              background: `linear-gradient(135deg, ${colors.primary}05, ${colors.primary}12)`,
              padding: '16px 20px',
              borderRadius: 10,
              border: `1px solid ${colors.primary}30`,
              marginTop: 24,
              cursor: 'pointer'
            }}>
              <summary style={{ color: colors.primary, fontWeight: 'bold', fontSize: '1em' }}>
                🧠 {t('babelLibraryModule.intelligence.adminTitle')}
              </summary>
              <div style={{ marginTop: 16 }}>
                <p style={{ color: colors.textSecondary, fontSize: '0.9em', marginBottom: 16 }}>
                  {t('babelLibraryModule.intelligence.adminDesc')}
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      try {
                        setBatchStatus({ running: true, total: 0, processed: 0, failed: 0 });
                        await apiCall('/api/babel/intelligence/batch', 'POST', { delay: 0.3 });
                        // Poll for status
                        const poll = setInterval(async () => {
                          try {
                            const status = await apiCall('/api/babel/intelligence/batch/status');
                            setBatchStatus(status);
                            if (!status.running) {
                              clearInterval(poll);
                              // Refresh stats
                              const stats = await apiCall('/api/babel/intelligence/stats');
                              setIntelStats(stats);
                            }
                          } catch { clearInterval(poll); }
                        }, 2000);
                      } catch (err) {
                        console.error('Batch failed:', err);
                        setBatchStatus(null);
                      }
                    }}
                    disabled={batchStatus?.running}
                    style={{
                      padding: '10px 20px',
                      background: batchStatus?.running ? '#ccc' : colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: batchStatus?.running ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {batchStatus?.running ? `⏳ ${t('babelLibraryModule.intelligence.processing')}` : `🧠 ${t('babelLibraryModule.intelligence.classifyAll')}`}
                  </button>
                  {/* Phase 3: Content generation batch button */}
                  <button
                    onClick={async () => {
                      try {
                        setContentBatchStatus({ running: true, total: 0, processed: 0, failed: 0 });
                        await apiCall('/api/babel/intelligence/generate-content/batch', 'POST', { delay: 1.0 });
                        const poll = setInterval(async () => {
                          try {
                            const status = await apiCall('/api/babel/intelligence/generate-content/batch/status');
                            setContentBatchStatus(status);
                            if (!status.running) {
                              clearInterval(poll);
                              const stats = await apiCall('/api/babel/intelligence/stats');
                              setIntelStats(stats);
                            }
                          } catch { clearInterval(poll); }
                        }, 3000);
                      } catch (err) {
                        console.error('Content batch failed:', err);
                        setContentBatchStatus(null);
                      }
                    }}
                    disabled={contentBatchStatus?.running}
                    style={{
                      padding: '10px 20px',
                      background: contentBatchStatus?.running ? '#ccc' : '#7b1fa2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: contentBatchStatus?.running ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {contentBatchStatus?.running ? `⏳ ${t('babelLibraryModule.intelligence.generatingContent')}` : `⚡ ${t('babelLibraryModule.intelligence.generateContent')}`}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const stats = await apiCall('/api/babel/intelligence/stats');
                        setIntelStats(stats);
                      } catch {}
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      color: colors.primary,
                      border: `1px solid ${colors.primary}`,
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    📊 {t('babelLibraryModule.intelligence.refreshStats')}
                  </button>
                </div>

                {/* Progress bar */}
                {batchStatus?.running && batchStatus.total > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ background: '#e0e0e0', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round((batchStatus.processed + batchStatus.failed) / batchStatus.total * 100)}%`,
                        background: colors.primary,
                        height: '100%',
                        borderRadius: 8,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.8em', color: colors.textSecondary, marginTop: 4 }}>
                      {batchStatus.processed + batchStatus.failed} / {batchStatus.total} — {t('babelLibraryModule.intelligence.processed')}: {batchStatus.processed}, {t('babelLibraryModule.intelligence.failed')}: {batchStatus.failed}
                    </div>
                  </div>
                )}

                {/* Batch complete */}
                {batchStatus && !batchStatus.running && batchStatus.processed > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: '#e8f5e9', borderRadius: 8, fontSize: '0.9em', color: '#2e7d32' }}>
                    ✅ {t('babelLibraryModule.intelligence.batchComplete', { processed: batchStatus.processed, failed: batchStatus.failed })}
                  </div>
                )}

                {/* Phase 3: Content batch progress */}
                {contentBatchStatus?.running && contentBatchStatus.total > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ background: '#e0e0e0', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round((contentBatchStatus.processed + contentBatchStatus.failed) / contentBatchStatus.total * 100)}%`,
                        background: '#7b1fa2',
                        height: '100%',
                        borderRadius: 8,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.8em', color: colors.textSecondary, marginTop: 4 }}>
                      ⚡ {contentBatchStatus.processed + contentBatchStatus.failed} / {contentBatchStatus.total} — {t('babelLibraryModule.intelligence.processed')}: {contentBatchStatus.processed}, {t('babelLibraryModule.intelligence.failed')}: {contentBatchStatus.failed}
                    </div>
                  </div>
                )}

                {contentBatchStatus && !contentBatchStatus.running && contentBatchStatus.processed > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f3e5f5', borderRadius: 8, fontSize: '0.9em', color: '#7b1fa2' }}>
                    ✅ {t('babelLibraryModule.intelligence.contentBatchComplete', { processed: contentBatchStatus.processed, failed: contentBatchStatus.failed })}
                  </div>
                )}

                {/* Stats */}
                {intelStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 16 }}>
                    {[
                      { label: t('babelLibraryModule.intelligence.totalIndexed'), value: intelStats.total_metadata, icon: '📚' },
                      { label: t('babelLibraryModule.intelligence.llmClassified'), value: intelStats.llm_classified, icon: '🧠' },
                      { label: t('babelLibraryModule.intelligence.embedded'), value: intelStats.embedded, icon: '🔢' },
                      { label: t('babelLibraryModule.intelligence.contentGenerated'), value: intelStats.content_generated, icon: '⚡' },
                      { label: t('babelLibraryModule.intelligence.pending'), value: intelStats.pending_classification, icon: '⏳' }
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: 12, background: colors.primaryLight || '#e3f2fd', borderRadius: 8 }}>
                        <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: colors.primary }}>{s.icon} {s.value}</div>
                        <div style={{ fontSize: '0.75em', color: colors.textSecondary }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>

            {/* Collapsible reference sections — existing informational content */}
            <div style={{ marginTop: 32 }}>
              <details style={{
                background: colors.primaryLight,
                padding: '16px 20px',
                borderRadius: 10,
                border: `1px solid ${colors.primary}`,
                marginBottom: 16,
                cursor: 'pointer'
              }}>
                <summary style={{ color: colors.primary, fontWeight: 'bold', fontSize: '1em' }}>
                  {t('babelLibraryModule.aiSearch.futureCaps')}
                </summary>
                <div style={{ marginTop: 16 }}>
                  {[
                    { title: t('babelLibraryModule.aiSearch.intelAnalysis'), items: ['ia1','ia2','ia3','ia4'] },
                    { title: t('babelLibraryModule.aiSearch.semantic'), items: ['s1','s2','s3','s4'] },
                    { title: t('babelLibraryModule.aiSearch.personal'), items: ['p1','p2','p3','p4'] },
                    { title: t('babelLibraryModule.aiSearch.generated'), items: ['g1','g2','g3','g4'] },
                    { title: t('babelLibraryModule.aiSearch.predictive'), items: ['pr1','pr2','pr3','pr4'] }
                  ].map((section, si) => (
                    <div key={si} style={{ marginBottom: 16 }}>
                      <h4 style={{ color: colors.text, marginBottom: 8 }}>{section.title}</h4>
                      <ul style={{ color: colors.text, lineHeight: 1.6, paddingLeft: '20px', marginBottom: 8 }}>
                        {section.items.map(k => <li key={k}>{t(`babelLibraryModule.aiSearch.${k}`)}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>

              <details style={{
                background: colors.background,
                padding: '16px 20px',
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                marginBottom: 16,
                cursor: 'pointer'
              }}>
                <summary style={{ color: colors.text, fontWeight: 'bold', fontSize: '1em' }}>
                  {t('babelLibraryModule.aiSearch.examplesTitle')}
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                  {[
                    { title: t('babelLibraryModule.aiSearch.exAcademic'), items: ['exAcademicLi1','exAcademicLi2','exAcademicLi3','exAcademicLi4'] },
                    { title: t('babelLibraryModule.aiSearch.exLms'), items: ['exLmsLi1','exLmsLi2','exLmsLi3','exLmsLi4'] },
                    { title: t('babelLibraryModule.aiSearch.exEnterprise'), items: ['exEntLi1','exEntLi2','exEntLi3','exEntLi4'] }
                  ].map((section, si) => (
                    <div key={si} style={{ padding: 16, background: colors.sidebarBackground || '#f5f5f5', borderRadius: 10 }}>
                      <h4 style={{ color: colors.primary, marginBottom: 8 }}>{section.title}</h4>
                      <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                        {section.items.map(k => <li key={k}>{t(`babelLibraryModule.aiSearch.${k}`)}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>

              <details style={{
                background: colors.background,
                padding: '16px 20px',
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                marginBottom: 16,
                cursor: 'pointer'
              }}>
                <summary style={{ color: colors.text, fontWeight: 'bold', fontSize: '1em' }}>
                  {t('babelLibraryModule.aiSearch.roadmapTitle')}
                </summary>
                <div style={{ marginTop: 16 }}>
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{ marginBottom: 14 }}>
                      <h4 style={{ color: colors.primary, marginBottom: 6 }}>{t(`babelLibraryModule.aiSearch.phase${n}Title`)}</h4>
                      <p style={{ color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>{t(`babelLibraryModule.aiSearch.phase${n}Body`)}</p>
                    </div>
                  ))}
                </div>
              </details>

              {/* Vision */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}25)`,
                padding: '24px',
                borderRadius: 12,
                border: `2px solid ${colors.primary}30`,
                textAlign: 'center'
              }}>
                <h3 style={{ color: colors.primary, marginBottom: 16 }}>{t('babelLibraryModule.aiSearch.visionTitle')}</h3>
                <p style={{ color: colors.text, fontSize: '1.1em', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                  {t('babelLibraryModule.aiSearch.visionQuote')}
                </p>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};

export default BabelLibrary;
