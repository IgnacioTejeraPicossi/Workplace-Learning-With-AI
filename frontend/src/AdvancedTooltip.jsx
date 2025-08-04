import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const AdvancedTooltip = ({ topic, mastery, recommendations, position, visible, onClose }) => {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!isVisible || !topic) return null;

  const getMasteryColor = (mastery) => {
    if (mastery >= 0.7) return '#4caf50';
    if (mastery >= 0.4) return '#ff9800';
    return '#f44336';
  };

  const getMasteryLabel = (mastery) => {
    if (mastery >= 0.8) return 'Expert';
    if (mastery >= 0.6) return 'Advanced';
    if (mastery >= 0.4) return 'Intermediate';
    if (mastery >= 0.2) return 'Beginner';
    return 'Novice';
  };

  const isRecommended = recommendations?.some(rec => rec.topic_id === topic.id);

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x + 20,
        top: position.y - 20,
        backgroundColor: colors.background,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '280px',
        maxWidth: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transform: `translateY(${isVisible ? 0 : 10}px)`,
        transition: 'all 0.2s ease-in-out',
        pointerEvents: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: colors.textPrimary, fontWeight: '600' }}>
          {topic.label}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            color: colors.textSecondary,
            cursor: 'pointer',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: colors.textSecondary, lineHeight: '1.4' }}>
        {topic.description}
      </p>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Your Mastery:</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: getMasteryColor(mastery) }}>
            {getMasteryLabel(mastery)} ({Math.round(mastery * 100)}%)
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: colors.border,
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${mastery * 100}%`,
            height: '100%',
            backgroundColor: getMasteryColor(mastery),
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{
          padding: '4px 8px',
          backgroundColor: colors.primary + '20',
          color: colors.primary,
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '500'
        }}>
          {topic.category}
        </div>
        <div style={{
          padding: '4px 8px',
          backgroundColor: colors.surface,
          color: colors.textSecondary,
          borderRadius: '12px',
          fontSize: '0.8rem'
        }}>
          Cluster {topic.cluster}
        </div>
      </div>

      {isRecommended && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#4caf50',
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: '600',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>🎯</span>
          Recommended for you
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🎓 Start Learning
        </button>
        <button
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: 'transparent',
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          🎮 Simulate
        </button>
      </div>
    </div>
  );
};

export default AdvancedTooltip; 