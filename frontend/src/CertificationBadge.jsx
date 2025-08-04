import React from 'react';
import { useTheme } from './ThemeContext';

const CertificationBadge = ({ certification, earned = false, onClick }) => {
  const { colors } = useTheme();

  const getBadgeStyle = () => {
    if (earned) {
      return {
        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
        border: '2px solid #4CAF50',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
      };
    }
    return {
      background: colors.cardBackground,
      border: `2px solid ${colors.border}`,
      opacity: 0.7
    };
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...getBadgeStyle(),
        borderRadius: 12,
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        textAlign: 'center',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = earned 
            ? '0 6px 16px rgba(76, 175, 80, 0.4)' 
            : '0 6px 16px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = earned 
            ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
            : 'none';
        }
      }}
    >
      <div style={{ fontSize: '2.5em', marginBottom: 12 }}>
        {earned ? '🏆' : '📜'}
      </div>
      <h4 style={{ 
        color: earned ? 'white' : colors.text, 
        marginBottom: 8,
        fontSize: '1.1em'
      }}>
        {certification.title}
      </h4>
      <p style={{ 
        color: earned ? 'rgba(255,255,255,0.9)' : colors.textSecondary,
        fontSize: '0.9em',
        marginBottom: 8
      }}>
        {certification.description}
      </p>
      {earned && (
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: '0.8em',
          color: 'white',
          fontWeight: 600
        }}>
          ✅ Earned
        </div>
      )}
    </div>
  );
};

export default CertificationBadge; 