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
import { DEMO_BOOKS, isDemoResource, getTypeIcon, getTypeColor } from './babel/resourceHelpers';
import AddResourceTab from './babel/AddResourceTab';
import AdvancedSearchTab from './babel/AdvancedSearchTab';
import CatalogTab from './babel/CatalogTab';
import AISearchTab from './babel/AISearchTab';
import { BabelContext } from './babel/BabelContext';

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
  // (Advanced Search state now lives inside ./babel/AdvancedSearchTab — 1.30.16)
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
      const demoBooks = DEMO_BOOKS;  // illustrative sample content (flagged isDemo)
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

  // (getTypeIcon / getTypeColor extracted to ./babel/resourceHelpers — 1.30.15)

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

  // Shared context for the extracted tabs (Fase 3 deep refactor). BabelLibrary
  // stays the single owner of all state/handlers; the tabs just read them.
  const babelCtx = {
    colors, t, loading, allResources, filteredResources, topics,
    selectedTopic, setSelectedTopic, selectedType, setSelectedType,
    searchTerm, setSearchTerm,
    videos, certifications, microLessons, webSearchResults, skillsForecasts,
    careerCoachSessions, simulationResults, documentAnalyses, repositoryAnalyses,
    agenticRAGAnalyses,
    typeLabel, authorLabel, trackInteraction, renderAiContentPanel,
    handleDeleteBook, handleDeleteVideo, handleDeleteCertification,
    handleDeleteMicroLesson, handleDeleteWebSearch, handleDeleteSkillsForecast,
    handleDeleteCareerCoach, handleDeleteSimulation, handleDeleteDocumentAnalysis,
    handleDeleteRepositoryAnalysis, handleDeleteAgenticRAGAnalysis,
    handleEditVideo, handleEditCertification, handleEditMicroLesson,
    handleEditCareerCoach, handleEditSimulation, handleEditDocumentAnalysis,
    handleEditRepositoryAnalysis, handleEditAgenticRAGAnalysis,
    // AI Search tab
    getSearchHistory, getUserId, performAiSearch,
    aiQuery, setAiQuery, aiResults, aiSearching, aiInsights,
    intelStats, setIntelStats, batchStatus, setBatchStatus,
    contentBatchStatus, setContentBatchStatus,
    recommendations, recsLoading, profileSummary,
    learningPath, setLearningPath, pathLoading, setPathLoading, pathGoal, setPathGoal,
    predictiveData, setPredictiveData, predictiveLoading, setPredictiveLoading,
  };

  return (
    <BabelContext.Provider value={babelCtx}>
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
        {activeTab === 'catalog' && <CatalogTab />}

        {activeTab === 'add' && (
          <AddResourceTab newBook={newBook} setNewBook={setNewBook} onSubmit={handleAddBook} />
        )}

        {activeTab === 'search' && (
          <AdvancedSearchTab allResources={allResources} topics={topics} typeLabel={typeLabel} authorLabel={authorLabel} />
        )}

        {activeTab === 'ai-search' && <AISearchTab />}
      </div>
    </div>
    </BabelContext.Provider>
  );
};

export default BabelLibrary;
