import { useState, useCallback } from 'react';
import { askStream } from '../api';

export const useStreaming = (initialStatus = '') => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const startStreaming = useCallback(async (prompt, options = {}) => {
    const {
      onStart = () => {},
      onProgress = () => {},
      onComplete = () => {},
      onError = () => {},
      statusMessages = [],
      showProgress = true
    } = options;

    setLoading(true);
    setContent('');
    setError(null);
    setProgress(0);
    setStatus(statusMessages[0] || 'Starting...');
    
    onStart();

    try {
      let currentStep = 0;
      const totalSteps = statusMessages.length || 1;
      let finalContent = '';

      await askStream(
        { prompt },
        (output) => {
          finalContent = output;
          setContent(output);
          
          // Update progress and status if we have status messages
          if (statusMessages.length > 0 && showProgress) {
            const newStep = Math.min(
              Math.floor((output.length / 100) * totalSteps), 
              totalSteps - 1
            );
            
            if (newStep !== currentStep) {
              currentStep = newStep;
              setStatus(statusMessages[currentStep]);
              setProgress((currentStep / (totalSteps - 1)) * 100);
              onProgress(currentStep, statusMessages[currentStep]);
            }
          }
        }
      );

      console.log('Streaming completed, final content length:', finalContent.length);
      setStatus('Complete');
      setProgress(100);
      onComplete(finalContent);
      
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during streaming';
      setError(errorMessage);
      setStatus('Error');
      onError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStreaming = useCallback(() => {
    setLoading(false);
    setContent('');
    setStatus('');
    setProgress(0);
    setError(null);
  }, []);

  const updateStatus = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  const updateProgress = useCallback((newProgress) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  return {
    // State
    loading,
    content,
    status,
    progress,
    error,
    
    // Actions
    startStreaming,
    clearStreaming,
    updateStatus,
    updateProgress,
    
    // Computed
    hasContent: content.length > 0,
    hasError: error !== null,
    isComplete: !loading && content.length > 0 && !error
  };
};

// Predefined status messages for common operations
export const STATUS_MESSAGES = {
  MICRO_LESSON: [
    'Analyzing topic...',
    'Generating content...',
    'Creating examples...',
    'Finalizing lesson...'
  ],
  RECOMMENDATION: [
    'Analyzing skill gaps...',
    'Finding relevant content...',
    'Generating recommendations...',
    'Personalizing suggestions...'
  ],
  SIMULATION: [
    'Creating scenario...',
    'Building interactive elements...',
    'Generating responses...',
    'Finalizing simulation...'
  ],
  VIDEO_ANALYSIS: [
    'Processing video...',
    'Extracting key points...',
    'Generating summary...',
    'Creating quiz questions...'
  ],
  CAREER_COACH: [
    'Analyzing profile...',
    'Identifying opportunities...',
    'Generating advice...',
    'Creating action plan...'
  ],
  SKILLS_FORECAST: [
    'Analyzing learning history...',
    'Identifying trends...',
    'Predicting future needs...',
    'Generating forecast...'
  ],
  TEAM_ANALYSIS: [
    'Analyzing team data...',
    'Identifying patterns...',
    'Generating insights...',
    'Creating recommendations...'
  ],
  PRESENTATION: [
    'Analyzing project features...',
    'Creating presentation structure...',
    'Generating engaging content...',
    'Finalizing script...'
  ],
  QA: [
    'Understanding question...',
    'Analyzing project context...',
    'Generating response...',
    'Finalizing answer...'
  ],
  DEMO: [
    'Preparing slide content...',
    'Generating demo script...',
    'Adding technical details...',
    'Finalizing presentation...'
  ]
}; 