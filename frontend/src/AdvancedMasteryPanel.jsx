import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import * as d3 from 'd3';

const AdvancedMasteryPanel = ({ userData, topics, recommendations }) => {
  const { colors } = useTheme();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);

  // Generate comprehensive timeline data
  const generateAdvancedTimelineData = () => {
    const timelineData = [];
    const now = new Date();
    
    // Generate data for the last 90 days (more comprehensive)
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Base progression with realistic learning curves
      const baseProgress = Math.min(0.8, 0.1 + (i * 0.008)); // Slower, more realistic progression
      
      const dayData = {
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        // More realistic progression with gradual improvement
        prompt_engineering: Math.min(0.6, 0.15 + (i * 0.006) + (Math.random() * 0.01 - 0.005)),
        ai_ethics: Math.min(0.5, 0.1 + (i * 0.005) + (Math.random() * 0.008 - 0.004)),
        machine_learning: Math.min(0.3, 0.05 + (i * 0.003) + (Math.random() * 0.006 - 0.003)),
        team_leadership: Math.min(0.7, 0.2 + (i * 0.006) + (Math.random() * 0.012 - 0.006)),
        project_management: Math.min(0.4, 0.1 + (i * 0.004) + (Math.random() * 0.008 - 0.004)),
        customer_service: Math.min(0.5, 0.15 + (i * 0.004) + (Math.random() * 0.01 - 0.005)),
        sales_negotiation: Math.min(0.3, 0.08 + (i * 0.003) + (Math.random() * 0.006 - 0.003)),
        conflict_resolution: Math.min(0.2, 0.05 + (i * 0.002) + (Math.random() * 0.004 - 0.002)),
        presentation_skills: Math.min(0.4, 0.12 + (i * 0.004) + (Math.random() * 0.008 - 0.004)),
        data_analysis: Math.min(0.25, 0.06 + (i * 0.002) + (Math.random() * 0.004 - 0.002)),
        communication: Math.min(0.35, 0.08 + (i * 0.003) + (Math.random() * 0.006 - 0.003)),
        strategic_thinking: Math.min(0.2, 0.04 + (i * 0.002) + (Math.random() * 0.004 - 0.002)),
        innovation_management: Math.min(0.15, 0.03 + (i * 0.001) + (Math.random() * 0.003 - 0.0015))
      };
      
      timelineData.push(dayData);
    }
    
    return timelineData;
  };

  const timelineData = generateAdvancedTimelineData();

  // Color mapping function (moved before usage)
  const getTopicColor = (topicId) => {
    const colorMap = {
      'prompt_engineering': '#FF6B6B',
      'ai_ethics': '#4ECDC4',
      'machine_learning': '#45B7D1',
      'team_leadership': '#96CEB4',
      'project_management': '#FFEAA7',
      'customer_service': '#DDA0DD',
      'sales_negotiation': '#98D8C8',
      'conflict_resolution': '#F7DC6F',
      'presentation_skills': '#BB8FCE',
      'data_analysis': '#85C1E9',
      'communication': '#F8C471',
      'strategic_thinking': '#82E0AA',
      'innovation_management': '#F1948A'
    };
    return colorMap[topicId] || '#95A5A6';
  };

  // Calculate advanced metrics
  const calculateMetrics = () => {
    if (!userData?.mastery_scores) return {};

    const currentMastery = userData.mastery_scores;
    const masteryValues = Object.values(currentMastery);
    
    // Get recent data based on selected time range
    const daysToShow = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
    const recentData = timelineData.slice(-daysToShow);
    
    // Calculate average mastery over time (only topic values, exclude date and timestamp)
    const averageOverTime = recentData.map(day => {
      const topicValues = Object.entries(day)
        .filter(([key, val]) => key !== 'date' && key !== 'timestamp' && typeof val === 'number')
        .map(([key, val]) => val);
      return topicValues.length > 0 ? topicValues.reduce((sum, val) => sum + val, 0) / topicValues.length : 0;
    });

    // Calculate improvement metrics (more stable calculation)
    const firstWeek = averageOverTime.slice(0, Math.min(7, averageOverTime.length));
    const lastWeek = averageOverTime.slice(-7);
    const firstAvg = firstWeek.length > 0 ? firstWeek.reduce((sum, val) => sum + val, 0) / firstWeek.length : 0;
    const lastAvg = lastWeek.length > 0 ? lastWeek.reduce((sum, val) => sum + val, 0) / lastWeek.length : 0;
    const improvement = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

    // Find top improving topics
    const topicImprovements = Object.keys(currentMastery).map(topicId => {
      const topicData = recentData.map(day => day[topicId] || 0);
      const startValue = topicData[0] || 0;
      const endValue = topicData[topicData.length - 1] || 0;
      const improvement = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
      
      return {
        topicId,
        label: topics[topicId]?.label || topicId,
        improvement: Math.min(improvement, 100), // Cap at 100%
        currentMastery: currentMastery[topicId] || 0,
        color: getTopicColor(topicId)
      };
    }).sort((a, b) => b.improvement - a.improvement);

    // Calculate learning velocity (mastery gained per day) - more reasonable calculation
    const learningVelocity = recentData.length > 1 
      ? Math.min(((averageOverTime[averageOverTime.length - 1] - averageOverTime[0]) / recentData.length) * 100, 10) // Cap at 10% per day
      : 0;

    // Find consistency score (how regularly user learns)
    const consistencyScore = recentData.filter(day => {
      const topicValues = Object.entries(day)
        .filter(([key, val]) => key !== 'date' && key !== 'timestamp' && typeof val === 'number')
        .map(([key, val]) => val);
      const avg = topicValues.length > 0 ? topicValues.reduce((sum, val) => sum + val, 0) / topicValues.length : 0;
      return avg > 0.05; // Lower threshold for "active learning day"
    }).length / recentData.length * 100;

    return {
      averageMastery: masteryValues.reduce((sum, val) => sum + val, 0) / masteryValues.length,
      improvement: Math.min(improvement, 50), // Cap improvement at 50%
      learningVelocity: Math.max(learningVelocity, 0), // Ensure non-negative
      consistencyScore: Math.min(consistencyScore, 100), // Cap at 100%
      topImprovingTopics: topicImprovements.slice(0, 5),
      averageOverTime,
      recentData
    };
  };

  const metrics = calculateMetrics();
  
  // Ensure metrics are valid
  const safeMetrics = {
    averageMastery: metrics.averageMastery || 0,
    improvement: metrics.improvement || 0,
    learningVelocity: metrics.learningVelocity || 0,
    consistencyScore: metrics.consistencyScore || 0,
    topImprovingTopics: metrics.topImprovingTopics || [],
    averageOverTime: metrics.averageOverTime || [],
    recentData: metrics.recentData || []
  };

  const getMetricColor = (value, type = 'positive') => {
    if (type === 'positive') {
      return value > 0 ? '#4CAF50' : value < 0 ? '#f44336' : colors.textSecondary;
    }
    return value > 80 ? '#4CAF50' : value > 60 ? '#FF9800' : '#f44336';
  };

  const formatMetric = (value, type = 'percentage') => {
    if (type === 'percentage') {
      return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    }
    return value.toFixed(2);
  };

  return (
    <div style={{
      backgroundColor: colors.background,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      marginTop: '20px'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        backgroundColor: colors.primary,
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>📊 Advanced Mastery Analytics</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['7d', '30d', '90d'].map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTimeRange === range ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {['overview', 'trends', 'insights'].map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedView === view ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textTransform: 'capitalize'
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div style={{
        padding: '24px',
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: colors.textPrimary }}>🎯 Key Performance Indicators</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {/* Average Mastery */}
          <div style={{
            padding: '20px',
            backgroundColor: colors.background,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center'
          }}
          onMouseEnter={() => setHoveredMetric('average')}
          onMouseLeave={() => setHoveredMetric(null)}
          >
                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.primary }}>
               {formatMetric(safeMetrics.averageMastery * 100, 'percentage')}
             </div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '4px' }}>
              Average Mastery
            </div>
            {hoveredMetric === 'average' && (
              <div style={{
                position: 'absolute',
                backgroundColor: colors.background,
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                fontSize: '0.8rem',
                color: colors.textSecondary,
                marginTop: '8px'
              }}>
                Overall proficiency across all topics
              </div>
            )}
          </div>

          {/* Improvement */}
          <div style={{
            padding: '20px',
            backgroundColor: colors.background,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center'
          }}
          onMouseEnter={() => setHoveredMetric('improvement')}
          onMouseLeave={() => setHoveredMetric(null)}
          >
                         <div style={{ 
               fontSize: '2rem', 
               fontWeight: 'bold', 
               color: getMetricColor(safeMetrics.improvement, 'positive')
             }}>
               {formatMetric(safeMetrics.improvement, 'percentage')}
             </div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '4px' }}>
              {selectedTimeRange} Improvement
            </div>
          </div>

                     {/* Learning Velocity */}
           <div style={{
             padding: '20px',
             backgroundColor: colors.background,
             borderRadius: '12px',
             border: `1px solid ${colors.border}`,
             textAlign: 'center'
           }}
           onMouseEnter={() => setHoveredMetric('velocity')}
           onMouseLeave={() => setHoveredMetric(null)}
           >
             <div style={{ 
               fontSize: '2rem', 
               fontWeight: 'bold', 
               color: getMetricColor(safeMetrics.learningVelocity, 'positive')
             }}>
               {formatMetric(safeMetrics.learningVelocity, 'percentage')}
             </div>
             <div style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '4px' }}>
               Daily Learning Rate
             </div>
           </div>

          {/* Consistency */}
          <div style={{
            padding: '20px',
            backgroundColor: colors.background,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center'
          }}
          onMouseEnter={() => setHoveredMetric('consistency')}
          onMouseLeave={() => setHoveredMetric(null)}
          >
                         <div style={{ 
               fontSize: '2rem', 
               fontWeight: 'bold', 
               color: getMetricColor(safeMetrics.consistencyScore, 'consistency')
             }}>
               {formatMetric(safeMetrics.consistencyScore, 'percentage')}
             </div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '4px' }}>
              Learning Consistency
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Timeline Chart */}
      <div style={{
        padding: '24px',
        backgroundColor: colors.background
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: colors.textPrimary }}>📈 Mastery Progression Timeline</h3>
        
                 <div style={{
           width: '100%',
           height: '300px',
           backgroundColor: colors.surface,
           borderRadius: '12px',
           border: `1px solid ${colors.border}`,
           padding: '20px',
           position: 'relative'
         }}>
           {safeMetrics.averageOverTime && safeMetrics.averageOverTime.length > 0 ? (
             <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
               {/* Grid lines */}
               {[0, 25, 50, 75, 100].map(y => (
                 <line
                   key={y}
                   x1="0"
                   y1={y * 2.6}
                   x2="100%"
                   y2={y * 2.6}
                   stroke={colors.border}
                   strokeWidth="1"
                   opacity="0.3"
                 />
               ))}
               
               {/* Average mastery line */}
               <path
                 d={d3.line()
                   .x((d, i) => (i / (safeMetrics.averageOverTime.length - 1)) * 100)
                   .y(d => 260 - (d * 260))
                   (safeMetrics.averageOverTime)}
                 fill="none"
                 stroke={colors.primary}
                 strokeWidth="3"
                 opacity="0.8"
               />
               
               {/* Area under the line */}
               <path
                 d={d3.area()
                   .x((d, i) => (i / (safeMetrics.averageOverTime.length - 1)) * 100)
                   .y0(260)
                   .y1(d => 260 - (d * 260))
                   (safeMetrics.averageOverTime)}
                 fill={colors.primary}
                 opacity="0.1"
               />
             </svg>
           ) : (
             <div style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               height: '100%',
               color: colors.textSecondary,
               fontSize: '1.1rem'
             }}>
               📊 Timeline data will appear here as you complete more learning activities
             </div>
           )}
          
          {/* Y-axis labels */}
          <div style={{
            position: 'absolute',
            left: '10px',
            top: '20px',
            bottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: colors.textSecondary
          }}>
            {[100, 75, 50, 25, 0].map(value => (
              <span key={value}>{value}%</span>
            ))}
          </div>
          
          {/* X-axis labels */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '60px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: colors.textSecondary
          }}>
                         {safeMetrics.recentData.length > 0 && (
              <>
                                 <span>{new Date(safeMetrics.recentData[0].timestamp).toLocaleDateString()}</span>
                 <span>{new Date(safeMetrics.recentData[Math.floor(safeMetrics.recentData.length / 2)].timestamp).toLocaleDateString()}</span>
                 <span>{new Date(safeMetrics.recentData[safeMetrics.recentData.length - 1].timestamp).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Improving Topics */}
      <div style={{
        padding: '24px',
        backgroundColor: colors.surface,
        borderTop: `1px solid ${colors.border}`
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: colors.textPrimary }}>🚀 Top Improving Topics</h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
                     {safeMetrics.topImprovingTopics.map((topic, index) => (
            <div
              key={topic.topicId}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: colors.background,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: topic.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginRight: '16px'
              }}>
                {index + 1}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>
                  {topic.label}
                </div>
                <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                  Current: {formatMetric(topic.currentMastery * 100, 'percentage')}
                </div>
              </div>
              
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: getMetricColor(topic.improvement, 'positive')
              }}>
                {formatMetric(topic.improvement, 'percentage')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Panel */}
      {selectedView === 'insights' && (
        <div style={{
          padding: '24px',
          backgroundColor: colors.background,
          borderTop: `1px solid ${colors.border}`
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: colors.textPrimary }}>💡 Learning Insights</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Consistency Insight */}
            <div style={{
              padding: '20px',
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: colors.textPrimary }}>📅 Learning Consistency</h4>
                             <p style={{ margin: '0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                 {safeMetrics.consistencyScore > 80 
                   ? "Excellent! You're maintaining a very consistent learning schedule."
                   : safeMetrics.consistencyScore > 60
                   ? "Good consistency! Consider setting daily learning reminders."
                   : "Try to establish a more regular learning routine for better results."
                 }
               </p>
            </div>

            {/* Velocity Insight */}
            <div style={{
              padding: '20px',
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: colors.textPrimary }}>⚡ Learning Velocity</h4>
                             <p style={{ margin: '0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                 {safeMetrics.learningVelocity > 0.01
                   ? "Great pace! You're making steady progress in your learning journey."
                   : safeMetrics.learningVelocity > 0.005
                   ? "Steady progress! Consider increasing study time for faster growth."
                   : "Consider dedicating more time to learning to accelerate your progress."
                 }
               </p>
            </div>

            {/* Recommendations Insight */}
            <div style={{
              padding: '20px',
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: colors.textPrimary }}>🎯 Smart Recommendations</h4>
              <p style={{ margin: '0', color: colors.textSecondary, fontSize: '0.9rem' }}>
                {recommendations?.length > 0
                  ? `Based on your progress, we recommend focusing on ${recommendations[0]?.topic_name} next.`
                  : "Complete more topics to get personalized recommendations."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedMasteryPanel; 