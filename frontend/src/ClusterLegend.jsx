import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

const ClusterLegend = ({ clusters, clusterColors, onClusterToggle, activeClusters }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleCluster = (clusterName) => {
    onClusterToggle(clusterName);
  };

  const getClusterStats = (clusterName) => {
    // This would be calculated from actual data
    return {
      totalTopics: clusters[clusterName]?.length || 0,
      averageMastery: 0.65, // Mock data
      completionRate: 0.78 // Mock data
    };
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px',
      minWidth: '200px',
      maxWidth: '280px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      zIndex: 100
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 style={{ 
          margin: 0, 
          color: colors.textPrimary, 
          fontSize: '1rem',
          fontWeight: '600'
        }}>
          🎨 Knowledge Clusters
        </h4>
        <span style={{
          fontSize: '1.2rem',
          color: colors.textSecondary,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>

      {/* Cluster List */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(clusters).map(([clusterName, topicIds]) => {
            const stats = getClusterStats(clusterName);
            const isActive = activeClusters.includes(clusterName);
            
            return (
              <div
                key={clusterName}
                style={{
                  padding: '8px 12px',
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? clusterColors[clusterName] : colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleCluster(clusterName)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: clusterColors[clusterName],
                    border: `2px solid ${isActive ? colors.primary : 'transparent'}`
                  }} />
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? colors.textPrimary : colors.textSecondary
                  }}>
                    {clusterName}
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: colors.textSecondary,
                    marginLeft: 'auto'
                  }}>
                    {stats.totalTopics}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: colors.border,
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginTop: '4px'
                }}>
                  <div style={{
                    width: `${stats.completionRate * 100}%`,
                    height: '100%',
                    backgroundColor: clusterColors[clusterName],
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                {/* Stats */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: colors.textSecondary,
                  marginTop: '4px'
                }}>
                  <span>Avg: {Math.round(stats.averageMastery * 100)}%</span>
                  <span>{Math.round(stats.completionRate * 100)}% done</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {isExpanded && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: colors.surface,
          borderRadius: '6px',
          borderTop: `1px solid ${colors.border}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: colors.textSecondary
          }}>
            <span>Active Clusters:</span>
            <span style={{ color: colors.primary, fontWeight: '600' }}>
              {activeClusters.length} / {Object.keys(clusters).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterLegend; 