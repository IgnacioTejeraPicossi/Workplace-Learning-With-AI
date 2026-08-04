import React from 'react';
import { useBabel } from './BabelContext';
import { getTypeIcon, getTypeColor, isDemoResource } from './resourceHelpers';

/**
 * Babel Library — "Catalog" tab (extracted from BabelLibrary.jsx, Fase 3 deep
 * refactor). All state/handlers still live in BabelLibrary and are delivered
 * through BabelContext; this component only reads them.
 */
export default function CatalogTab() {
  const {
    // data
    colors, t, loading, allResources, filteredResources, topics,
    selectedTopic, setSelectedTopic, selectedType, setSelectedType,
    searchTerm, setSearchTerm,
    // per-collection lists (for delete/edit availability)
    videos, certifications, microLessons, webSearchResults, skillsForecasts,
    careerCoachSessions, simulationResults, documentAnalyses, repositoryAnalyses,
    agenticRAGAnalyses,
    // label helpers
    typeLabel, authorLabel,
    // interaction + AI content
    trackInteraction, renderAiContentPanel,
    // delete handlers
    handleDeleteBook, handleDeleteVideo, handleDeleteCertification,
    handleDeleteMicroLesson, handleDeleteWebSearch, handleDeleteSkillsForecast,
    handleDeleteCareerCoach, handleDeleteSimulation, handleDeleteDocumentAnalysis,
    handleDeleteRepositoryAnalysis, handleDeleteAgenticRAGAnalysis,
    // edit handlers
    handleEditVideo, handleEditCertification, handleEditMicroLesson,
    handleEditCareerCoach, handleEditSimulation, handleEditDocumentAnalysis,
    handleEditRepositoryAnalysis, handleEditAgenticRAGAnalysis,
  } = useBabel();

  return (
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
  );
}
