import React from 'react';
import { useTheme } from './ThemeContext';

const MasteryTimeline = ({ userData, topics }) => {
  const { colors } = useTheme();

  // Generate mock timeline data (in real implementation, this would come from backend)
  const generateTimelineData = () => {
    const timelineData = [];
    const now = new Date();
    
    // Generate data for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayData = {
        date: date.toISOString().split('T')[0],
        prompt_engineering: Math.min(0.5, 0.1 + (i * 0.013)), // Gradual increase
        ai_ethics: Math.min(0.4, 0.05 + (i * 0.012)),
        machine_learning: Math.min(0.1, 0.01 + (i * 0.003)),
        team_leadership: Math.min(0.4, 0.2 + (i * 0.007)),
        project_management: Math.min(0.2, 0.05 + (i * 0.005)),
        customer_service: Math.min(0.3, 0.1 + (i * 0.007)),
        sales_negotiation: Math.min(0.2, 0.05 + (i * 0.005)),
        conflict_resolution: Math.min(0.1, 0.01 + (i * 0.003)),
        presentation_skills: Math.min(0.3, 0.1 + (i * 0.007)),
        data_analysis: Math.min(0.1, 0.01 + (i * 0.003)),
        communication: Math.min(0.0, 0.0 + (i * 0.002)),
        strategic_thinking: Math.min(0.0, 0.0 + (i * 0.001)),
        innovation_management: Math.min(0.0, 0.0 + (i * 0.001))
      };
      
      timelineData.push(dayData);
    }
    
    return timelineData;
  };

  const timelineData = generateTimelineData();

  // Get top 5 topics by current mastery for the chart
  const getTopTopics = () => {
    if (!userData?.mastery_scores) return [];
    
    return Object.entries(userData.mastery_scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topicId, mastery]) => ({
        id: topicId,
        label: topics[topicId]?.label || topicId,
        mastery,
        color: getTopicColor(topicId)
      }));
  };

  const getTopicColor = (topicId) => {
    const topic = topics[topicId];
    if (!topic) return '#666';
    
    const clusterColors = {
      'AI Fundamentals': '#4CAF50',
      'Leadership': '#2196F3', 
      'Business Applications': '#FF9800',
      'Communication': '#9C27B0'
    };
    
    return clusterColors[topic.category] || '#666';
  };

  const topTopics = getTopTopics();

  // Calculate average mastery over time
  const getAverageMastery = (dayData) => {
    const values = Object.values(dayData).filter(val => typeof val === 'number');
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const averageData = timelineData.map(day => ({
    date: day.date,
    average: getAverageMastery(day)
  }));

  // Calculate SVG path for lines
  const createPath = (data, yAccessor) => {
    if (data.length === 0) return '';
    
    const points = data.map((item, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 300 - (yAccessor(item) * 300);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <div style={{
      background: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      border: `1px solid ${colors.border}`,
      boxShadow: colors.shadow
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, color: colors.text }}>
        📈 Mastery Progress Timeline
      </h3>
      
      <p style={{ marginBottom: 20, color: colors.textSecondary, fontSize: '0.9rem' }}>
        Track your learning progress over the last 30 days. See how your mastery levels have evolved across different topics.
      </p>

      {/* Timeline Chart */}
      <div style={{ 
        width: '100%', 
        height: 300, 
        position: 'relative',
        marginBottom: 20
      }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((y, i) => (
            <g key={i}>
              <line
                x1="0"
                y1={300 - (y * 300)}
                x2="100%"
                y2={300 - (y * 300)}
                stroke={colors.border}
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x="0"
                y={300 - (y * 300) - 5}
                fill={colors.textSecondary}
                fontSize="10"
                textAnchor="start"
              >
                {Math.round(y * 100)}%
              </text>
            </g>
          ))}

          {/* Date labels */}
          {timelineData.filter((_, i) => i % 7 === 0).map((day, i) => (
            <text
              key={i}
              x={`${(i * 7 / 29) * 100}%`}
              y="295"
              fill={colors.textSecondary}
              fontSize="10"
              textAnchor="middle"
            >
              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          ))}

          {/* Average mastery line */}
          <path
            d={createPath(averageData, day => day.average)}
            fill="none"
            stroke={colors.primary}
            strokeWidth="3"
            opacity="0.8"
          />

          {/* Individual topic lines */}
          {topTopics.map((topic, topicIndex) => (
            <path
              key={topic.id}
              d={createPath(timelineData, day => day[topic.id] || 0)}
              fill="none"
              stroke={topic.color}
              strokeWidth="2"
              opacity="0.6"
              strokeDasharray={topicIndex > 0 ? "5,5" : "none"}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 12, color: colors.text, fontSize: '1rem' }}>
          Topic Legend
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 16,
              height: 3,
              backgroundColor: colors.primary,
              borderRadius: 2
            }} />
            <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Average Mastery
            </span>
          </div>
          {topTopics.map((topic, index) => (
            <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16,
                height: 3,
                backgroundColor: topic.color,
                borderRadius: 2,
                borderStyle: index > 0 ? 'dashed' : 'solid'
              }} />
              <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                {topic.label} ({Math.round(topic.mastery * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        marginTop: 20, 
        padding: 16, 
        background: colors.primaryLight, 
        borderRadius: 8 
      }}>
        <h4 style={{ marginTop: 0, marginBottom: 12, color: colors.text, fontSize: '1rem' }}>
          📊 Progress Summary
        </h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <strong style={{ color: colors.text }}>Current Average:</strong>
            <span style={{ marginLeft: 8, color: colors.textSecondary }}>
              {Math.round(getAverageMastery(timelineData[timelineData.length - 1]) * 100)}%
            </span>
          </div>
          <div>
            <strong style={{ color: colors.text }}>30-Day Growth:</strong>
            <span style={{ marginLeft: 8, color: colors.textSecondary }}>
              +{Math.round((getAverageMastery(timelineData[timelineData.length - 1]) - getAverageMastery(timelineData[0])) * 100)}%
            </span>
          </div>
          <div>
            <strong style={{ color: colors.text }}>Most Improved:</strong>
            <span style={{ marginLeft: 8, color: colors.textSecondary }}>
              {topTopics[0]?.label || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasteryTimeline; 