import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const BabelLibrary = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('catalog');
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    topic: '',
    description: '',
    type: 'book'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

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
        type: 'book'
      });
    }
  };

  const handleDeleteBook = (id) => {
    setBooks(books.filter(book => book.id !== id));
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || book.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const topics = ['all', ...Array.from(new Set(books.map(book => book.topic)))];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'book': return '📚';
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'course': return '🎓';
      default: return '📖';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'book': return '#007bff';
      case 'video': return '#28a745';
      case 'article': return '#ffc107';
      case 'course': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: 24, background: colors.background, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, marginBottom: 8 }}>
            🏛️ Babel Library
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: '1.1em' }}>
            Our world's knowledge repository - Articles, videos, summaries, and more
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'catalog', label: '📚 Library Catalog', icon: '📚' },
            { key: 'add', label: '➕ Add Resource', icon: '➕' },
            { key: 'search', label: '🔍 Advanced Search', icon: '🔍' },
            { key: 'ai-search', label: '🤖 AI Search', icon: '🤖' }
          ].map(tab => (
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
                  placeholder="Search by title, author, or description..."
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
                    {topic === 'all' ? 'All Topics' : topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Library Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16, 
              marginBottom: 24 
            }}>
              <div style={{
                background: colors.primaryLight,
                padding: '20px',
                borderRadius: 12,
                textAlign: 'center',
                border: `1px solid ${colors.primary}`
              }}>
                <div style={{ fontSize: '2em', marginBottom: 8 }}>📚</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: colors.primary }}>
                  {books.length}
                </div>
                <div style={{ color: colors.textSecondary }}>Total Resources</div>
              </div>
              <div style={{
                background: '#e8f5e8',
                padding: '20px',
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid #28a745'
              }}>
                <div style={{ fontSize: '2em', marginBottom: 8 }}>🎥</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#28a745' }}>
                  {books.filter(b => b.type === 'video').length}
                </div>
                <div style={{ color: colors.textSecondary }}>Videos</div>
              </div>
              <div style={{
                background: '#fff3cd',
                padding: '20px',
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid #ffc107'
              }}>
                <div style={{ fontSize: '2em', marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#ffc107' }}>
                  {books.filter(b => b.type === 'article').length}
                </div>
                <div style={{ color: colors.textSecondary }}>Articles</div>
              </div>
              <div style={{
                background: '#f3e5f5',
                padding: '20px',
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid #6f42c1'
              }}>
                <div style={{ fontSize: '2em', marginBottom: 8 }}>🎓</div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#6f42c1' }}>
                  {books.filter(b => b.type === 'course').length}
                </div>
                <div style={{ color: colors.textSecondary }}>Courses</div>
              </div>
            </div>

            {/* Books Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: 20 
            }}>
              {filteredBooks.map(book => (
                <div key={book.id} style={{
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
                    background: getTypeColor(book.type),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}>
                    {getTypeIcon(book.type)} {book.type}
                  </div>

                  {/* Content */}
                  <h3 style={{ 
                    color: colors.text, 
                    marginBottom: 8, 
                    fontSize: '1.2em',
                    paddingRight: '80px'
                  }}>
                    {book.title}
                  </h3>
                  
                  <p style={{ 
                    color: colors.primary, 
                    marginBottom: 8, 
                    fontWeight: 500,
                    fontSize: '0.9em'
                  }}>
                    👤 {book.author}
                  </p>
                  
                  <p style={{ 
                    color: colors.textSecondary, 
                    marginBottom: 12,
                    fontSize: '0.9em',
                    lineHeight: 1.5
                  }}>
                    {book.description}
                  </p>
                  
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
                      🏷️ {book.topic}
                    </span>
                    
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                      title="Delete resource"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div style={{
                    marginTop: 12,
                    fontSize: '0.8em',
                    color: colors.textSecondary,
                    textAlign: 'right'
                  }}>
                    Added: {book.addedDate}
                  </div>
                </div>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.textSecondary
              }}>
                <div style={{ fontSize: '3em', marginBottom: 16 }}>🔍</div>
                <h3>No resources found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ color: colors.text, marginBottom: 24 }}>Add New Resource</h2>
            
            <form onSubmit={handleAddBook}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  Resource Type *
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
                  <option value="book">📚 Book</option>
                  <option value="video">🎥 Video</option>
                  <option value="article">📄 Article</option>
                  <option value="course">🎓 Course</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  color: colors.text,
                  fontWeight: '500'
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  placeholder="Enter resource title..."
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
                  Author *
                </label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  placeholder="Enter author name..."
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
                  Topic *
                </label>
                <input
                  type="text"
                  value={newBook.topic}
                  onChange={(e) => setNewBook({...newBook, topic: e.target.value})}
                  placeholder="Enter topic or category..."
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
                  Description
                </label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  placeholder="Enter resource description..."
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
                📚 Add to Library
              </button>
            </form>
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <h2 style={{ color: colors.text, marginBottom: 24 }}>Advanced Search</h2>
            
            <div style={{
              background: colors.primaryLight,
              padding: '24px',
              borderRadius: 12,
              border: `1px solid ${colors.primary}`
            }}>
              <h3 style={{ color: colors.primary, marginBottom: 16 }}>🔍 Search Features</h3>
              <ul style={{ 
                color: colors.text, 
                lineHeight: 1.6,
                paddingLeft: '20px'
              }}>
                <li><strong>Full-text search:</strong> Search across titles, authors, descriptions, and content</li>
                <li><strong>Topic filtering:</strong> Filter by specific knowledge domains</li>
                <li><strong>Type categorization:</strong> Books, videos, articles, courses, and more</li>
                <li><strong>Date-based sorting:</strong> Find the most recent or historical resources</li>
                <li><strong>Author tracking:</strong> Discover all works by specific authors</li>
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
                  <strong>Future Enhancement:</strong> This search will integrate with AI-powered content analysis, 
                  semantic search, and personalized recommendations based on your learning history.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-search' && (
          <div>
            <h2 style={{ color: colors.text, marginBottom: 24 }}>🤖 AI-Powered Search & Intelligence</h2>
            
            <div style={{
              background: colors.primaryLight,
              padding: '24px',
              borderRadius: 12,
              border: `1px solid ${colors.primary}`
            }}>
              <h3 style={{ color: colors.primary, marginBottom: 16 }}>🚀 Future AI Capabilities</h3>
              
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>🧠 Intelligent Content Analysis</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li><strong>Automatic Classification:</strong> AI categorizes resources by topic, difficulty, and audience</li>
                  <li><strong>Concept Extraction:</strong> Identifies key concepts and creates dynamic taxonomies</li>
                  <li><strong>Duplicate Detection:</strong> Finds similar content and suggests consolidation</li>
                  <li><strong>Quality Assessment:</strong> Analyzes content quality based on multiple criteria</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>🔍 Semantic Search & Discovery</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li><strong>Meaning-Based Search:</strong> Find content by concept, not just keywords</li>
                  <li><strong>Intelligent Recommendations:</strong> AI suggests related resources based on patterns</li>
                  <li><strong>Multimodal Search:</strong> Search across text, images, and audio content</li>
                  <li><strong>Learning Context:</strong> Understands your learning journey for better suggestions</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>📊 Personalization & Adaptation</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li><strong>Smart User Profiles:</strong> AI learns from your reading and learning behavior</li>
                  <li><strong>Adaptive Learning Paths:</strong> Personalized routes that evolve with your progress</li>
                  <li><strong>Contextual Recommendations:</strong> Suggests resources based on time, mood, and context</li>
                  <li><strong>Content Adaptation:</strong> Adjusts content complexity to your experience level</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>⚡ AI-Generated Content</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li><strong>Automatic Summaries:</strong> AI creates executive summaries of long resources</li>
                  <li><strong>Comprehension Questions:</strong> Generated questions to test understanding</li>
                  <li><strong>Multi-language Translation:</strong> Instant translation to multiple languages</li>
                  <li><strong>Content Simplification:</strong> Creates versions for different audience levels</li>
                </ul>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ color: colors.text, marginBottom: 12 }}>🔮 Predictive Intelligence</h4>
                <ul style={{ 
                  color: colors.text, 
                  lineHeight: 1.6,
                  paddingLeft: '20px',
                  marginBottom: 16
                }}>
                  <li><strong>Emerging Trends:</strong> Identifies new topics and learning demands</li>
                  <li><strong>Demand Prediction:</strong> Forecasts which resources will be needed</li>
                  <li><strong>Knowledge Gap Analysis:</strong> Finds areas where content is missing</li>
                  <li><strong>Expert Identification:</strong> Discovers subject matter experts in your network</li>
                </ul>
              </div>
            </div>

            {/* Real-World Examples */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: colors.text, marginBottom: 16 }}>🌐 Real-World Examples Today</h3>
              
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
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>🔬 Academic Platforms</h4>
                  <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                    <li><strong>Google Scholar:</strong> AI-powered ranking and recommendations</li>
                    <li><strong>Mendeley:</strong> Citation analysis and paper suggestions</li>
                    <li><strong>Zotero:</strong> Automatic reference classification</li>
                    <li><strong>arXiv:</strong> AI categorization of scientific papers</li>
                  </ul>
                </div>

                <div style={{
                  background: colors.background,
                  padding: '20px',
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>📚 Learning Management</h4>
                  <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                    <li><strong>Coursera:</strong> Personalized course recommendations</li>
                    <li><strong>edX:</strong> AI-driven learning path optimization</li>
                    <li><strong>Khan Academy:</strong> Adaptive content difficulty</li>
                    <li><strong>Duolingo:</strong> AI-powered language learning</li>
                  </ul>
                </div>

                <div style={{
                  background: colors.background,
                  padding: '20px',
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>🏢 Enterprise Solutions</h4>
                  <ul style={{ color: colors.text, lineHeight: 1.5, paddingLeft: '20px' }}>
                    <li><strong>Microsoft Viva:</strong> AI-powered learning insights</li>
                    <li><strong>LinkedIn Learning:</strong> Skill-based recommendations</li>
                    <li><strong>Workday Learning:</strong> AI-driven career development</li>
                    <li><strong>Degreed:</strong> Intelligent skill mapping</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Implementation Roadmap */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: colors.text, marginBottom: 16 }}>🗺️ Implementation Roadmap</h3>
              
              <div style={{
                background: colors.background,
                padding: '24px',
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>Phase 1: Intelligent Analysis (Q3 2025)</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    AI-powered content classification, automatic tagging, and basic semantic search capabilities.
                  </p>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>Phase 2: Smart Recommendations (Q4 2025)</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    Personalized content suggestions, learning path optimization, and intelligent resource matching.
                  </p>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>Phase 3: AI Content Generation (Q1 2026)</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    Automatic summaries, comprehension questions, and adaptive content creation.
                  </p>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: colors.primary, marginBottom: 12 }}>Phase 4: Predictive Intelligence (Q2 2026)</h4>
                  <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
                    Trend analysis, demand forecasting, and proactive knowledge gap identification.
                  </p>
                </div>
              </div>
            </div>

            {/* Vision Statement */}
            <div style={{ marginTop: 32 }}>
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}25)`,
                padding: '24px',
                borderRadius: 12,
                border: `2px solid ${colors.primary}30`,
                textAlign: 'center'
              }}>
                <h3 style={{ color: colors.primary, marginBottom: 16 }}>🎯 Our Vision</h3>
                <p style={{ 
                  color: colors.text, 
                  fontSize: '1.1em', 
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  "Babel Library will be the first learning repository that doesn't just store knowledge, 
                  but understands it, analyzes it, and adapts it dynamically to each user's unique learning journey. 
                  We're building the future of intelligent knowledge management."
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
