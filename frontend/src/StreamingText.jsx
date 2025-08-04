import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

const StreamingText = ({ 
  content, 
  loading = false, 
  placeholder = "Waiting for response...",
  showCursor = true,
  speed = 50,
  style = {}
}) => {
  const { colors } = useTheme();
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const contentRef = useRef('');

  // Reset state when content changes
  useEffect(() => {
    if (content !== contentRef.current) {
      contentRef.current = content;
      setDisplayedContent('');
      setCurrentIndex(0);
      setIsStreaming(false);
    }
  }, [content]);

  // Handle streaming animation
  useEffect(() => {
    if (!content || content.length === 0) {
      setDisplayedContent('');
      setCurrentIndex(0);
      setIsStreaming(false);
      return;
    }

    // Start streaming
    if (!isStreaming && content.length > 0) {
      setIsStreaming(true);
    }

    if (isStreaming && currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [content, currentIndex, speed, isStreaming]);

  const defaultStyle = {
    background: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    lineHeight: 1.6,
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minHeight: '100px',
    maxHeight: '400px',
    overflowY: 'auto',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ ...defaultStyle, ...style }}>
      {loading && !content ? (
        <div style={{ 
          color: colors.textSecondary, 
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: `2px solid ${colors.border}`,
            borderTop: `2px solid ${colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          {placeholder}
        </div>
      ) : (
        <>
          {displayedContent}
          {showCursor && (loading || (isStreaming && currentIndex < content.length)) && (
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              background: colors.primary,
              marginLeft: '2px',
              animation: 'blink 1s infinite'
            }} />
          )}
        </>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default StreamingText; 