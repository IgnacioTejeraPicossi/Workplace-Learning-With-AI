import React from 'react';
import { useTheme } from './ThemeContext';

const StreamingProgress = ({ 
  loading, 
  status, 
  progress = 0, 
  showProgressBar = true, 
  showSpinner = true,
  size = 'medium',
  color = 'primary'
}) => {
  const { colors } = useTheme();
  
  const getProgressColor = () => {
    switch (color) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return colors.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { padding: '12px 16px', fontSize: '14px' },
          progressBar: { height: '4px' },
          spinner: { width: '16px', height: '16px' }
        };
      case 'large':
        return {
          container: { padding: '20px 24px', fontSize: '18px' },
          progressBar: { height: '12px' },
          spinner: { width: '24px', height: '24px' }
        };
      default: // medium
        return {
          container: { padding: '16px 20px', fontSize: '16px' },
          progressBar: { height: '8px' },
          spinner: { width: '20px', height: '20px' }
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const progressColor = getProgressColor();

  if (!loading) return null;

  return (
    <div style={{
      background: colors.cardBackground,
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: 16,
      ...sizeStyles.container
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: showProgressBar ? 12 : 0
      }}>
        {showSpinner && (
          <div style={{
            width: sizeStyles.spinner.width,
            height: sizeStyles.spinner.height,
            border: `2px solid ${colors.border}`,
            borderTop: `2px solid ${progressColor}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        <div style={{
          flex: 1,
          color: colors.text,
          fontWeight: 500
        }}>
          {status || 'Processing...'}
        </div>
        {showProgressBar && progress > 0 && (
          <div style={{
            color: colors.textSecondary,
            fontSize: '0.9em',
            fontWeight: 500
          }}>
            {Math.round(progress)}%
          </div>
        )}
      </div>
      
      {showProgressBar && (
        <div style={{
          background: colors.border,
          borderRadius: 4,
          overflow: 'hidden',
          ...sizeStyles.progressBar
        }}>
          <div style={{
            background: progressColor,
            height: '100%',
            width: `${progress}%`,
            borderRadius: 4,
            transition: 'width 0.3s ease',
            animation: progress === 0 ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }} />
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StreamingProgress; 