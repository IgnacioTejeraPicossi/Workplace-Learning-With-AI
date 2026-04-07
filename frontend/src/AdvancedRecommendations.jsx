import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';

const AdvancedRecommendations = ({ recommendations, learningPaths, vectorAnalysis, onTopicClick }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expandedPath, setExpandedPath] = useState(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  if (!recommendations || recommendations.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: colors.textSecondary,
        backgroundColor: colors.background,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h3>{t('knowledgeMapModule.recommendationsEmptyTitle')}</h3>
        <p>{t('knowledgeMapModule.recommendationsEmptyBody')}</p>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return colors.textSecondary;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4caf50';
      case 'intermediate': return '#ff9800';
      case 'advanced': return '#f44336';
      default: return colors.textSecondary;
    }
  };

  const formatScore = (score) => {
    return Math.round(score * 100) / 100;
  };

  const priorityLabel = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') return t('knowledgeMapModule.priorityHigh');
    if (p === 'low') return t('knowledgeMapModule.priorityLow');
    return t('knowledgeMapModule.priorityMedium');
  };

  const difficultyLabel = (difficulty) => {
    const d = (difficulty || 'intermediate').toLowerCase();
    if (d === 'beginner') return t('knowledgeMapModule.difficultyBeginner');
    if (d === 'advanced') return t('knowledgeMapModule.difficultyAdvanced');
    return t('knowledgeMapModule.difficultyIntermediate');
  };

  const categoryDisplay = (category) => {
    const c = (category || '').trim();
    if (!c || c.toLowerCase() === 'general') return t('knowledgeMapModule.categoryDefaultGeneral');
    return category;
  };

  return (
    <div style={{ 
      backgroundColor: colors.background,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: colors.primary,
        color: 'white',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{t('knowledgeMapModule.recommendationsPanelTitle')}</h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          {t('knowledgeMapModule.recommendationsSubtitle')}
        </p>
      </div>

      {/* Vector Analysis Summary */}
      {vectorAnalysis && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: colors.textPrimary }}>
            {t('knowledgeMapModule.learningProfileTitle')}
          </h4>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.primary }}>
                {vectorAnalysis.mastery_distribution.low_mastery}
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.profileMasteryLow')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.primary }}>
                {vectorAnalysis.mastery_distribution.medium_mastery}
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.profileMasteryMedium')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.primary }}>
                {vectorAnalysis.mastery_distribution.high_mastery}
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.profileMasteryHigh')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Recommendations */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: colors.textPrimary }}>
          {t('knowledgeMapModule.topRecommendationsSectionTitle')}
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            style={{
              padding: '8px 16px',
              backgroundColor: showScoreBreakdown ? colors.primary : colors.surface,
              color: showScoreBreakdown ? 'white' : colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {showScoreBreakdown ? t('knowledgeMapModule.hideScoreBreakdown') : t('knowledgeMapModule.showScoreBreakdown')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map((rec, index) => (
            <div
              key={rec.topic_id}
              style={{
                padding: '16px',
                backgroundColor: colors.surface,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onClick={() => onTopicClick && onTopicClick(rec.topic_id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Priority Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 8px',
                backgroundColor: getPriorityColor(rec.priority || 'medium'),
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {(rec.priority || 'medium').toUpperCase()}
              </div>

              {/* Main Content */}
              <div style={{ marginRight: '80px' }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: colors.textPrimary,
                  fontSize: '1.1rem'
                }}>
                  {index + 1}. {rec.topic_name || rec.topic_label || t('knowledgeMapModule.unknownTopic')}
                </h4>
                
                <p style={{ 
                  margin: '0 0 12px 0', 
                  color: colors.textSecondary,
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {rec.description || t('knowledgeMapModule.noDescriptionAvailable')}
                </p>

                {/* Meta Information */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.metaCategory')}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      backgroundColor: colors.primary + '20', 
                      color: colors.primary,
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}>
                      {categoryDisplay(rec.category)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.metaDifficulty')}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      backgroundColor: getDifficultyColor(rec.learning_difficulty || 'intermediate') + '20', 
                      color: getDifficultyColor(rec.learning_difficulty || 'intermediate'),
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}>
                      {difficultyLabel(rec.learning_difficulty)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.metaCurrentMastery')}</span>
                    <div style={{ 
                      width: '60px', 
                      height: '8px', 
                      backgroundColor: colors.border,
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(rec.current_mastery || 0) * 100}%`,
                        height: '100%',
                        backgroundColor: colors.primary,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {Math.round((rec.current_mastery || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Score Breakdown */}
                {showScoreBreakdown && rec.score_breakdown && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    backgroundColor: colors.background,
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`
                  }}>
                    <h5 style={{ margin: '0 0 8px 0', color: colors.textPrimary, fontSize: '0.9rem' }}>
                      {t('knowledgeMapModule.scoreBreakdownHeading')}
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.breakdownMasteryPriority')}</span>
                        <span style={{ fontSize: '0.8rem', color: colors.textPrimary }}>
                          {formatScore(rec.score_breakdown?.mastery_priority || 0)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.breakdownVectorProximity')}</span>
                        <span style={{ fontSize: '0.8rem', color: colors.textPrimary }}>
                          {formatScore(rec.score_breakdown?.proximity_score || 0)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.breakdownLearningContinuity')}</span>
                        <span style={{ fontSize: '0.8rem', color: colors.textPrimary }}>
                          {formatScore(rec.score_breakdown?.continuity_score || 0)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{t('knowledgeMapModule.breakdownClusterBonus')}</span>
                        <span style={{ fontSize: '0.8rem', color: colors.textPrimary }}>
                          {formatScore(rec.score_breakdown?.cluster_bonus || 0)}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        paddingTop: '6px',
                        borderTop: `1px solid ${colors.border}`,
                        fontWeight: 'bold'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textPrimary }}>{t('knowledgeMapModule.breakdownFinalScore')}</span>
                        <span style={{ fontSize: '0.8rem', color: colors.primary }}>
                          {formatScore(rec.recommendation_score || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Paths */}
      {learningPaths && learningPaths.length > 0 && (
        <div style={{ 
          padding: '20px',
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.surface
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: colors.textPrimary }}>
            {t('knowledgeMapModule.suggestedPathsTitle')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {learningPaths.map((path, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  backgroundColor: colors.background,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedPath(expandedPath === index ? null : index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: colors.textPrimary }}>
                      {path.name}
                    </h4>
                    <p style={{ margin: '0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                      {path.description}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {t('knowledgeMapModule.pathEstimatedHours', { hours: path.estimated_hours })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {t('knowledgeMapModule.pathTopicCount', { count: path.topics.length })}
                    </div>
                  </div>
                </div>
                
                {expandedPath === index && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                    <h5 style={{ margin: '0 0 8px 0', color: colors.textPrimary, fontSize: '0.9rem' }}>
                      {t('knowledgeMapModule.pathTopicsHeading')}
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {path.topics.map((topic, topicIndex) => (
                        <div
                          key={topic.topic_id}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: colors.surface,
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: colors.textPrimary,
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTopicClick && onTopicClick(topic.topic_id);
                          }}
                        >
                          {topicIndex + 1}. {topic.topic_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedRecommendations; 