import React from 'react';
import { useBabel } from './BabelContext';
import { getTypeIcon, getTypeColor, isDemoResource } from './resourceHelpers';
import { apiCall } from '../api';

/**
 * Babel Library — "AI Search" tab (extracted from BabelLibrary.jsx, Fase 3 deep
 * refactor). Reads shared state/handlers from BabelContext; BabelLibrary still
 * owns them.
 */
export default function AISearchTab() {
  const {
    colors, t, typeLabel, authorLabel, trackInteraction, renderAiContentPanel,
    getSearchHistory, getUserId, performAiSearch,
    aiQuery, setAiQuery, aiResults, aiSearching, aiInsights,
    intelStats, setIntelStats, batchStatus, setBatchStatus,
    contentBatchStatus, setContentBatchStatus,
    recommendations, recsLoading, profileSummary,
    learningPath, setLearningPath, pathLoading, setPathLoading, pathGoal, setPathGoal,
    predictiveData, setPredictiveData, predictiveLoading, setPredictiveLoading,
  } = useBabel();
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
}
