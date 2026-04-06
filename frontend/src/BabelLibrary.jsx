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
  fetchAgenticRAGAnalyses
} from './api';

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
  const { t } = useTranslation();

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
      console.log('Certifications loaded:', data);
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
      console.log('Micro-lessons loaded:', data);
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
      console.log('Web search results loaded:', data);
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
      console.log('Skills forecasts loaded:', data);
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
      console.log('Career coach sessions loaded:', data);
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
      console.log('Simulation results loaded:', data);
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
      console.log('Document analyses loaded:', data);
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
      console.log('Repository analyses loaded:', data);
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
      console.log('Agentic RAG analyses loaded:', data);
      if (data && data.analyses) {
        setAgenticRAGAnalyses(data.analyses);
      }
    } catch (error) {
      console.error('Error loading agentic RAG analyses:', error);
    }
  };

  // Demo data for the prototype
  useEffect(() => {
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
    ];
    setBooks(demoBooks);
    
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

  const handleAddBook = (e) => {
    e.preventDefault();
    if (newBook.title && newBook.author && newBook.topic) {
      const book = {
        id: Date.now(),
        ...newBook,
        addedDate: new Date().toISOString().split('T')[0]
      };
      setBooks([book, ...books]);
      setNewBook({
        title: '',
        author: '',
        topic: '',
        description: '',
        type: 'book',
        url: ''
      });
    }
  };

  const handleDeleteBook = (id) => {
    setBooks(books.filter(book => book.id !== id));
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
    
    alert(`Redirecting to Video Lessons module saved videos list to edit: "${title}"`);
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
                <div key={resource.id} style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative'
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
                           title="Delete career coach session"
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
                           title="Delete simulation"
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
                           title="Delete web search result"
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
                           title="Delete repository analysis"
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

        {activeTab === 'search' && (
          <div>
            <h2 style={{ color: colors.text, marginBottom: 24 }}>{t('babelLibraryModule.advancedSearch.title')}</h2>
            
            <div style={{
              background: colors.primaryLight,
              padding: '24px',
              borderRadius: 12,
              border: `1px solid ${colors.primary}`
            }}>
              <h3 style={{ color: colors.primary, marginBottom: 16 }}>{t('babelLibraryModule.advancedSearch.featuresTitle')}</h3>
              <ul style={{ 
                color: colors.text, 
                lineHeight: 1.6,
                paddingLeft: '20px'
              }}>
                <li>{t('babelLibraryModule.advancedSearch.li1')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li2')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li3')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li4')}</li>
                <li>{t('babelLibraryModule.advancedSearch.li5')}</li>
              </ul>
              
              <div style={{ 
                marginTop: 20, 
                padding: '16px', 
                background: colors.background,
                borderRadius: 8,
                border: `1px solid ${colors.border}`
              }}>
                <p style={{ 
                  color: colors.textSecondary, 
                  fontSize: '0.9em',
                  margin: 0
                }}>
                  <strong>{t('babelLibraryModule.advancedSearch.futureTitle')}</strong> {t('babelLibraryModule.advancedSearch.futureBody')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-search' && (
          <div>
            <h2 style={{ color: colors.text, marginBottom: 24 }}>{t('babelLibraryModule.aiSearch.title')}</h2>
            
            <div style={{
              background: colors.primaryLight,
              padding: '24px',
              borderRadius: 12,
              border: `1px solid ${colors.primary}`
            }}>
              <h3 style={{ color: colors.primary, marginBottom: 16 }}>{t('babelLibraryModule.aiSearch.futureCaps')}</h3>
              
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.intelAnalysis')}</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li>{t('babelLibraryModule.aiSearch.ia1')}</li>
                  <li>{t('babelLibraryModule.aiSearch.ia2')}</li>
                  <li>{t('babelLibraryModule.aiSearch.ia3')}</li>
                  <li>{t('babelLibraryModule.aiSearch.ia4')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.semantic')}</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li>{t('babelLibraryModule.aiSearch.s1')}</li>
                  <li>{t('babelLibraryModule.aiSearch.s2')}</li>
                  <li>{t('babelLibraryModule.aiSearch.s3')}</li>
                  <li>{t('babelLibraryModule.aiSearch.s4')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.personal')}</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li>{t('babelLibraryModule.aiSearch.p1')}</li>
                  <li>{t('babelLibraryModule.aiSearch.p2')}</li>
                  <li>{t('babelLibraryModule.aiSearch.p3')}</li>
                  <li>{t('babelLibraryModule.aiSearch.p4')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.generated')}</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li>{t('babelLibraryModule.aiSearch.g1')}</li>
                  <li>{t('babelLibraryModule.aiSearch.g2')}</li>
                  <li>{t('babelLibraryModule.aiSearch.g3')}</li>
                  <li>{t('babelLibraryModule.aiSearch.g4')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.predictive')}</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li>{t('babelLibraryModule.aiSearch.pr1')}</li>
                  <li>{t('babelLibraryModule.aiSearch.pr2')}</li>
                  <li>{t('babelLibraryModule.aiSearch.pr3')}</li>
                  <li>{t('babelLibraryModule.aiSearch.pr4')}</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: colors.text, marginBottom: 16 }}>{t('babelLibraryModule.aiSearch.examplesTitle')}</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: 16 
              }}>
                <div style={{
                  background: colors.background,
                  padding: '20px',
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.exAcademic')}</h4>
                  <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                    <li>{t('babelLibraryModule.aiSearch.exAcademicLi1')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exAcademicLi2')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exAcademicLi3')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exAcademicLi4')}</li>
                  </ul>
                </div>

                <div style={{
                  background: colors.background,
                  padding: '20px',
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.exLms')}</h4>
                  <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                    <li>{t('babelLibraryModule.aiSearch.exLmsLi1')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exLmsLi2')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exLmsLi3')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exLmsLi4')}</li>
                  </ul>
                </div>

                <div style={{
                  background: colors.background,
                  padding: '20px',
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.exEnterprise')}</h4>
                  <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                    <li>{t('babelLibraryModule.aiSearch.exEntLi1')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exEntLi2')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exEntLi3')}</li>
                    <li>{t('babelLibraryModule.aiSearch.exEntLi4')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: colors.text, marginBottom: 16 }}>{t('babelLibraryModule.aiSearch.roadmapTitle')}</h3>
              
              <div style={{
                background: colors.background,
                padding: '24px',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.phase1Title')}</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    {t('babelLibraryModule.aiSearch.phase1Body')}
                  </p>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.phase2Title')}</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    {t('babelLibraryModule.aiSearch.phase2Body')}
                  </p>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.phase3Title')}</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    {t('babelLibraryModule.aiSearch.phase3Body')}
                  </p>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>{t('babelLibraryModule.aiSearch.phase4Title')}</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    {t('babelLibraryModule.aiSearch.phase4Body')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}25)`,
                padding: '24px',
                borderRadius: 12,
                border: `2px solid ${colors.primary}30`,
                textAlign: 'center'
              }}>
                <h3 style={{ color: colors.primary, marginBottom: 16 }}>{t('babelLibraryModule.aiSearch.visionTitle')}</h3>
                <p style={{ 
                  color: colors.text, 
                  fontSize: '1.1em', 
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  {t('babelLibraryModule.aiSearch.visionQuote')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BabelLibrary;
