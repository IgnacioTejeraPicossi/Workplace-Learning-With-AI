import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateVideoQuiz, generateVideoSummary, askStream, saveVideo } from './api';
import StreamingProgress from './StreamingProgress';
import StreamingText from './StreamingText';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';
import { useTheme } from './ThemeContext';
import SavedVideos from './SavedVideos';

const EXAMPLE_VIDEO = "https://www.youtube.com/embed/1hHMwLxN6EM";
const EXAMPLE_SUMMARY = "This video explains the basics of Agile methodology, including its iterative approach, team collaboration, and adaptability to change. Key points: Agile is not waterfall, it values individuals and interactions, and it uses sprints to deliver value incrementally.";

function VideoLesson({ user }) {
  const { t } = useTranslation('common');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoTopic, setVideoTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [transcript, setTranscript] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractingTitle, setExtractingTitle] = useState(false);
  const { colors } = useTheme();

  // Use streaming hooks for different operations
  const summaryStreaming = useStreaming('Ready to generate summary');
  const quizStreaming = useStreaming('Ready to generate quiz');

  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    if (!url) return null;
    
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1]?.split('&')[0];
    }
    
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0];
    }
    
    if (url.includes('/embed/')) {
      return url.split('/embed/')[1]?.split('?')[0];
    }
    
    return null;
  };

  // Extract title from YouTube using oEmbed API with better error handling
  const extractYouTubeTitle = async (videoId) => {
    if (!videoId) return;
    
    setExtractingTitle(true);
    console.log(`🔍 [VideoLesson] Extracting title for video ID: ${videoId}`);
    
    // Set a timeout to ensure extractingTitle doesn't stay true forever
    const timeoutId = setTimeout(() => {
      console.log(`⚠️ [VideoLesson] Title extraction timeout, using fallback`);
      setVideoTitle(`YouTube Video ${videoId}`);
      setExtractingTitle(false);
    }, 10000); // 10 second timeout
    
    try {
      // Try multiple methods to get the title
      const methods = [
        // Method 1: Direct oEmbed API
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        // Method 2: Alternative oEmbed endpoint
        `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`,
        // Method 3: No-cors proxy (if available)
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)}`
      ];
      
      let title = null;
      
      for (const url of methods) {
        try {
          console.log(`🔍 [VideoLesson] Trying method: ${url}`);
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ [VideoLesson] Response data:`, data);
            
            // Handle proxy response
            if (data.contents) {
              const parsedData = JSON.parse(data.contents);
              title = parsedData.title;
            } else if (data.title) {
              title = data.title;
            }
            
            if (title) {
              console.log(`✅ [VideoLesson] Title extracted: ${title}`);
              break;
            }
          } else {
            console.log(`❌ [VideoLesson] Method failed with status: ${response.status}`);
          }
        } catch (methodError) {
          console.log(`❌ [VideoLesson] Method error:`, methodError.message);
          continue;
        }
      }
      
      if (title) {
        setVideoTitle(title);
        // Auto-suggest topic based on title
        const suggestedTopic = suggestTopicFromTitle(title);
        if (suggestedTopic) {
          setVideoTopic(suggestedTopic);
        }
      } else {
        // Fallback: Set a default title based on video ID
        setVideoTitle(`YouTube Video ${videoId}`);
        console.log(`⚠️ [VideoLesson] Could not extract title, using fallback`);
      }
      
    } catch (error) {
      console.error('❌ [VideoLesson] All title extraction methods failed:', error);
      // Fallback: Set a default title
      setVideoTitle(`YouTube Video ${videoId}`);
    } finally {
      clearTimeout(timeoutId);
      setExtractingTitle(false);
    }
  };

  // Suggest topic based on video title
  const suggestTopicFromTitle = (title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('programming') || titleLower.includes('coding') || titleLower.includes('python') || titleLower.includes('javascript')) {
      return 'Programming';
    }
    if (titleLower.includes('ai') || titleLower.includes('artificial intelligence') || titleLower.includes('machine learning')) {
      return 'AI & Machine Learning';
    }
    if (titleLower.includes('leadership') || titleLower.includes('management') || titleLower.includes('business')) {
      return 'Leadership & Business';
    }
    if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) {
      return 'Design & UX';
    }
    if (titleLower.includes('data') || titleLower.includes('analytics') || titleLower.includes('statistics')) {
      return 'Data & Analytics';
    }
    if (titleLower.includes('marketing') || titleLower.includes('social media') || titleLower.includes('branding')) {
      return 'Marketing';
    }
    if (titleLower.includes('n8n') || titleLower.includes('workflow') || titleLower.includes('automation')) {
      return 'Workflow Automation';
    }
    
    return '';
  };

  // Suggest topic based on video URL
  const suggestTopicFromUrl = (url) => {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('n8n')) {
      return 'Workflow Automation';
    }
    if (urlLower.includes('python') || urlLower.includes('javascript') || urlLower.includes('programming')) {
      return 'Programming';
    }
    if (urlLower.includes('ai') || urlLower.includes('machine-learning')) {
      return 'AI & Machine Learning';
    }
    if (urlLower.includes('devops') || urlLower.includes('deployment')) {
      return 'DevOps & Infrastructure';
    }
    if (urlLower.includes('cloud') || urlLower.includes('aws') || urlLower.includes('azure')) {
      return 'Cloud Computing';
    }
    
    return '';
  };

  // Convert YouTube URL to embed format
  const convertToEmbedUrl = (url) => {
    if (!url) return '';
    
    // If already embed format, return as is
    if (url.includes('/embed/')) return url;
    
    // Convert watch URLs to embed
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert youtu.be URLs to embed
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // If it's an MP4 or other direct link, return as is
    if (url.match(/\.(mp4|webm|ogg)$/i)) return url;
    
    return url; // Return original if can't convert
  };

  // Handle URL input change with auto-conversion and title extraction
  const handleUrlChange = async (e) => {
    const url = e.target.value;
    setVideoUrl(url);
    
    // Auto-convert and update the URL field
    if (url && (url.includes('youtube.com/watch') || url.includes('youtu.be/'))) {
      const embedUrl = convertToEmbedUrl(url);
      if (embedUrl !== url) {
        setVideoUrl(embedUrl);
      }
      
      // Suggest topic based on URL first
      const suggestedTopic = suggestTopicFromUrl(url);
      if (suggestedTopic && !videoTopic.trim()) {
        setVideoTopic(suggestedTopic);
        console.log(`🔍 [VideoLesson] Suggested topic from URL: ${suggestedTopic}`);
      }
      
      // Extract title automatically
      const videoId = extractVideoId(url);
      if (videoId) {
        await extractYouTubeTitle(videoId);
      }
    }
  };

  // Handle URL paste (for better title extraction)
  const handleUrlPaste = async (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && (pastedText.includes('youtube.com/watch') || pastedText.includes('youtu.be/'))) {
      // Extract title immediately when pasting
      const videoId = extractVideoId(pastedText);
      if (videoId) {
        await extractYouTubeTitle(videoId);
      }
    }
  };

  // Save video to database
  const handleSaveVideo = async () => {
    if (!videoUrl.trim() || !videoTitle.trim() || !videoTopic.trim()) {
      alert('Please fill in all required fields: URL, Title, and Topic');
      return;
    }

    setSaving(true);
    try {
      const videoData = {
        title: videoTitle.trim(),
        description: videoDescription.trim() || 'No description provided',
        topic: videoTopic.trim(),
        url: videoUrl.trim(),
        duration: 'Unknown', // Could be enhanced with YouTube API
        saved_at: new Date().toISOString()
      };

      console.log('🔍 [VideoLesson] Attempting to save video:', videoData);
      
      const result = await saveVideo(videoData);
      console.log('✅ [VideoLesson] Video saved successfully:', result);
      
      // Reset form - Keep title and topic for better UX
      setVideoDescription('');  // Clear description as it's user-specific
      // Keep videoTitle, videoTopic, and videoUrl for better UX
      // User can manually clear them if needed
      setShowSaveForm(false);
      
      // Reload saved videos list by triggering a component refresh
      // This ensures the SavedVideos component shows the new video without page reload
      setTimeout(() => {
        // Force a re-render of the SavedVideos component
        const event = new CustomEvent('videoSaved');
        window.dispatchEvent(event);
        
        // Also emit videoUpdated event for Dashboard refresh
        const updateEvent = new CustomEvent('videoUpdated');
        window.dispatchEvent(updateEvent);
      }, 100);
      
      // Show success message
      alert('Video saved successfully! You can find it in the Saved Videos section below.');
      
    } catch (error) {
      console.error('❌ [VideoLesson] Error saving video:', error);
      console.error('❌ [VideoLesson] Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // More detailed error message
      let errorMessage = 'Failed to save video. ';
      if (error.message) {
        errorMessage += `Error: ${error.message}`;
      } else if (error.status) {
        errorMessage += `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!summary.trim()) {
      alert('Please provide a video summary first.');
      return;
    }

    quizStreaming.startStreaming(
      `Generate a quiz based on this video summary: ${summary}`,
      {
        statusMessages: STATUS_MESSAGES.VIDEO_ANALYSIS,
        onComplete: async (content) => {
          try {
            const response = await generateVideoQuiz(summary);
            if (response.quiz && Array.isArray(response.quiz)) {
              setQuiz(response.quiz);
            } else {
              throw new Error('Invalid quiz response');
            }
          } catch (err) {
            console.error('Quiz generation error:', err);
            alert("Failed to generate quiz. Please try again.");
          }
        }
      }
    );
  };

  const handleGenerateSummary = async () => {
    if (!transcript.trim()) {
      alert('Please provide a video transcript first.');
      return;
    }

    summaryStreaming.startStreaming(
      `Generating summary from transcript...`,
      {
        statusMessages: STATUS_MESSAGES.VIDEO_ANALYSIS,
        onComplete: async (output) => {
          try {
            // Use the backend API instead of local streaming
            const response = await generateVideoSummary({ transcript: transcript.trim() });
            if (response.summary) {
              setSummary(response.summary);
            } else {
              throw new Error('Invalid summary response');
            }
          } catch (error) {
            console.error('Summary generation error:', error);
            alert('Failed to generate summary. Please try again.');
            // Fallback to local content if backend fails
            setSummary(output);
          }
        }
      }
    );
  };

  const handleAnswer = (questionIdx, selected) => {
    setUserAnswers({
      ...userAnswers,
      [questionIdx]: selected
    });
  };

  const handlePasteExample = () => {
    setVideoUrl(EXAMPLE_VIDEO);
    setVideoTitle('Agile Scrum Basics - Example Video');
    setVideoDescription('Learn the fundamentals of Agile methodology and Scrum framework for effective project management.');
    setVideoTopic('Agile');
    setSummary(EXAMPLE_SUMMARY);
    setQuiz([]);
    setUserAnswers({});
    summaryStreaming.clearStreaming();
    quizStreaming.clearStreaming();
  };

  const handleClear = () => {
    setVideoUrl('');
    setVideoTitle('');
    setVideoDescription('');
    setVideoTopic('');
    setSummary('');
    setQuiz([]);
    setUserAnswers({});
    setTranscript('');
    setShowSaveForm(false);
    summaryStreaming.clearStreaming();
    quizStreaming.clearStreaming();
  };

  // Calculate score
  const correctCount = quiz.reduce((acc, q, idx) => userAnswers[idx] === q.answer ? acc + 1 : acc, 0);
  const score = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;
  const showBadge = score >= 80 && quiz.length > 0;

  // Check if URL is valid for display
  const isValidVideoUrl = videoUrl && (videoUrl.includes('/embed/') || videoUrl.match(/\.(mp4|webm|ogg)$/i));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🎥 {t('videoBasedLearning.title')}</h2>
      
      {/* Info Box */}
      <div style={{ 
        marginBottom: 24, 
        padding: 16, 
        background: '#e3f2fd', 
        borderRadius: 8, 
        border: '1px solid #2196f3',
        color: '#1565c0'
      }}>
        <h4 style={{ marginBottom: 8 }}>💡 {t('videoBasedLearning.howToUse')}</h4>
        <ol style={{ marginLeft: 20, marginBottom: 0 }}>
          <li>{t('videoBasedLearning.instruction1')}</li>
          <li>{t('videoBasedLearning.instruction2')}</li>
          <li>{t('videoBasedLearning.instruction3')}</li>
          <li>{t('videoBasedLearning.instruction4')}</li>
          <li>{t('videoBasedLearning.instruction5')}</li>
        </ol>
      </div>
      
      {/* Video URL Input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          {t('videoBasedLearning.videoUrlLabel')}
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={videoUrl}
            onChange={handleUrlChange}
            onPaste={handleUrlPaste}
            placeholder={t('videoBasedLearning.videoUrlPlaceholder')}
            style={{ 
              flex: 1, 
              padding: 12, 
              borderRadius: 8, 
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text
            }}
          />
          <button 
            onClick={handlePasteExample}
            style={{ 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            📋 {t('videoBasedLearning.exampleButton')}
          </button>
        </div>
        <small style={{ color: colors.textSecondary }}>
          {t('videoBasedLearning.videoUrlHint')}
        </small>
        {extractingTitle && (
          <div style={{ marginTop: 8, color: '#2196f3', fontSize: '14px' }}>
            🔍 {t('videoBasedLearning.extractingTitle')}
          </div>
        )}
      </div>

      {/* Video Save Form */}
      {videoUrl && (
        <div style={{ marginBottom: 20, padding: 16, background: colors.cardBackground, borderRadius: 8, border: `1px solid ${colors.border}` }}>
          <h3 style={{ marginBottom: 16, color: colors.text }}>💾 {t('videoBasedLearning.saveVideoInfo')}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: colors.text }}>
                {t('videoBasedLearning.videoTitleLabel')} {extractingTitle && '⏳'}
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder={extractingTitle ? t('videoBasedLearning.extractingTitle') : t('videoBasedLearning.videoTitlePlaceholder')}
                disabled={extractingTitle}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: `1px solid ${colors.border}`,
                  background: extractingTitle ? '#f5f5f5' : colors.background,
                  color: colors.text
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: colors.text }}>
                {t('videoBasedLearning.topicLabel')} {!videoTopic.trim() && <span style={{ color: '#dc2626', fontSize: '0.9em' }}>{t('videoBasedLearning.required')}</span>}
              </label>
              <input
                type="text"
                value={videoTopic}
                onChange={(e) => setVideoTopic(e.target.value)}
                placeholder={t('videoBasedLearning.topicPlaceholder')}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: `1px solid ${!videoTopic.trim() ? '#dc2626' : colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  boxShadow: !videoTopic.trim() ? '0 0 0 2px rgba(220, 38, 38, 0.1)' : 'none'
                }}
              />
              {!videoTopic.trim() && (
                <div style={{ marginTop: 4, fontSize: '0.85em', color: '#dc2626' }}>
                  ⚠️ {t('videoBasedLearning.topicRequiredHint')}
                </div>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: colors.text }}>
                {t('videoBasedLearning.descriptionLabel')}
              </label>
              <textarea
                rows={3}
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder={t('videoBasedLearning.descriptionPlaceholder')}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  resize: 'vertical'
                }}
              />
            </div>
            
            <button 
              onClick={handleSaveVideo}
              disabled={saving || !videoTitle.trim() || !videoTopic.trim() || extractingTitle}
              style={{ 
                padding: '10px 20px', 
                borderRadius: 6, 
                border: 'none',
                background: saving || !videoTitle.trim() || !videoTopic.trim() || extractingTitle ? '#9ca3af' : colors.primary,
                color: '#fff',
                cursor: saving || !videoTitle.trim() || !videoTopic.trim() || extractingTitle ? 'not-allowed' : 'pointer',
                opacity: saving || !videoTitle.trim() || !videoTopic.trim() || extractingTitle ? 0.6 : 1,
                alignSelf: 'flex-start',
                transition: 'background 0.2s'
              }}
              title={
                !videoTitle.trim() ? t('videoBasedLearning.tooltipEnterTitle') :
                !videoTopic.trim() ? t('videoBasedLearning.tooltipEnterTopic') :
                extractingTitle ? t('videoBasedLearning.tooltipExtracting') :
                saving ? t('videoBasedLearning.tooltipSaving') :
                t('videoBasedLearning.tooltipSaveLibrary')
              }
            >
              {saving ? `⏳ ${t('videoBasedLearning.saving')}` : extractingTitle ? `⏳ ${t('videoBasedLearning.extractingTitle')}` : !videoTopic.trim() ? `💾 ${t('videoBasedLearning.saveVideoTopicRequired')}` : `💾 ${t('videoBasedLearning.saveVideo')}`}
            </button>
          </div>
        </div>
      )}

      {/* Video Player */}
      {isValidVideoUrl && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: colors.text }}>🎬 {t('videoBasedLearning.videoPlayer')}</h3>
            {videoUrl.includes('/embed/') && (
              <button
                onClick={() => window.open(videoUrl.replace('/embed/', '/watch?v='), '_blank')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔗 {t('videoBasedLearning.openInNewTab')}
              </button>
            )}
          </div>
          {videoUrl.includes('/embed/') ? (
            <iframe
              width="100%"
              height="315"
              src={videoUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video"
              style={{ borderRadius: 8 }}
            />
          ) : (
            <video
              width="100%"
              height="315"
              controls
              style={{ borderRadius: 8 }}
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} type="video/webm" />
              <source src={videoUrl} type="video/ogg" />
              {t('videoBasedLearning.videoNotSupported')}
            </video>
          )}
        </div>
      )}

      {/* Security Notice for YouTube */}
      {videoUrl && videoUrl.includes('youtube.com') && !isValidVideoUrl && (
        <div style={{ 
          marginBottom: 20, 
          padding: 16, 
          background: '#fff3cd', 
          borderRadius: 8, 
          border: '1px solid #ffeaa7',
          color: '#856404'
        }}>
          <h4 style={{ marginBottom: 8 }}>⚠️ {t('videoBasedLearning.securityNotice')}</h4>
          <p style={{ marginBottom: 8 }}>
            {t('videoBasedLearning.securityIntro')}
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 8 }}>
            <li>{t('videoBasedLearning.securityBullet1')}</li>
            <li>{t('videoBasedLearning.securityBullet2')}</li>
            <li>{t('videoBasedLearning.securityBullet3')}</li>
          </ul>
          <a 
            href={videoUrl.replace('/embed/', '/watch?v=')} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            {t('videoBasedLearning.openInNewTabLink')}
          </a>
        </div>
      )}

      {/* Transcript Input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          {t('videoBasedLearning.transcriptLabel')}
        </label>
        <textarea
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={t('videoBasedLearning.transcriptPlaceholder')}
          style={{ 
            width: '100%', 
            padding: 12, 
            borderRadius: 8, 
            border: `1px solid ${colors.border}`,
            background: colors.cardBackground,
            color: colors.text,
            resize: 'vertical'
          }}
        />
        <button 
          onClick={handleGenerateSummary}
          disabled={summaryStreaming.loading || !transcript.trim()}
          style={{ 
            marginTop: 8,
            padding: '12px 20px', 
            borderRadius: 8, 
            border: 'none',
            background: colors.primary,
            color: '#fff',
            cursor: summaryStreaming.loading ? 'not-allowed' : 'pointer',
            opacity: summaryStreaming.loading ? 0.6 : 1
          }}
        >
          {summaryStreaming.loading ? `⏳ ${t('videoBasedLearning.generating')}` : `📝 ${t('videoBasedLearning.generateSummary')}`}
        </button>
      </div>

      {/* Summary Streaming */}
      {summaryStreaming.loading && (
        <StreamingProgress 
          loading={summaryStreaming.loading}
          status={summaryStreaming.status}
          progress={summaryStreaming.progress}
          color="info"
        />
      )}

      {/* Summary Display */}
      {summary && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, color: colors.text }}>📋 {t('videoBasedLearning.videoSummary')}</h3>
          <StreamingText 
            content={summary}
            loading={summaryStreaming.loading}
            placeholder={t('videoBasedLearning.generatingSummary')}
          />
        </div>
      )}

      {/* Quiz Generation */}
      {summary && (
        <div style={{ marginBottom: 20 }}>
          <button 
            onClick={handleGenerateQuiz}
            disabled={quizStreaming.loading || !summary.trim()}
            style={{ 
              padding: '12px 20px', 
              borderRadius: 8, 
              border: 'none',
              background: colors.primary,
              color: '#fff',
              cursor: quizStreaming.loading ? 'not-allowed' : 'pointer',
              opacity: quizStreaming.loading ? 0.6 : 1
            }}
          >
            {quizStreaming.loading ? `⏳ ${t('videoBasedLearning.generatingQuiz')}` : `🧠 ${t('videoBasedLearning.generateQuiz')}`}
          </button>
        </div>
      )}

      {/* Quiz Streaming */}
      {quizStreaming.loading && (
        <StreamingProgress 
          loading={quizStreaming.loading}
          status={quizStreaming.status}
          progress={quizStreaming.progress}
          color="success"
        />
      )}

      {/* Quiz Display */}
      {quiz.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, color: colors.text }}>
            📝 {t('videoBasedLearning.quiz')} {showBadge && '🏆'}
          </h3>
          {quiz.map((q, idx) => (
            <div key={idx} style={{ 
              marginBottom: 20, 
              padding: 16, 
              background: colors.cardBackground,
              borderRadius: 8,
              border: `1px solid ${colors.border}`
            }}>
              <strong style={{ color: colors.text }}>
                Q{idx + 1}: {q.question}
              </strong>
              <div style={{ marginTop: 8 }}>
                {q.options.map((opt, optIdx) => (
                  <label key={optIdx} style={{ 
                    display: 'block', 
                    marginBottom: 4,
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt}
                      checked={userAnswers[idx] === opt}
                      onChange={() => handleAnswer(idx, opt)}
                      style={{ marginRight: 8 }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {userAnswers[idx] && (
                <div style={{ 
                  marginTop: 8,
                  padding: 8,
                  borderRadius: 4,
                  background: userAnswers[idx] === q.answer ? '#e8f5e8' : '#ffebee',
                  color: userAnswers[idx] === q.answer ? '#2e7d32' : '#c62828'
                }}>
                  ✅ {t('videoBasedLearning.correct')} {q.answer}  
                  <br/>
                  🧾 {q.explanation}
                </div>
              )}
            </div>
          ))}
          
          {Object.keys(userAnswers).length === quiz.length && (
            <div style={{ 
              padding: 16, 
              background: colors.cardBackground,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              textAlign: 'center'
            }}>
              <h4 style={{ marginBottom: 8, color: colors.text }}>
                {t('videoBasedLearning.quizComplete')}
              </h4>
              <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: colors.text }}>
                {t('videoBasedLearning.score')} {score}% ({correctCount}/{quiz.length} {t('videoBasedLearning.correctCount')})
              </p>
              {showBadge && (
                <p style={{ color: '#4caf50', fontWeight: 'bold' }}>
                  🏆 {t('videoBasedLearning.masteredContent')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Clear Button */}
      <button 
        onClick={handleClear}
        style={{ 
          padding: '12px 20px', 
          borderRadius: 8, 
          border: `1px solid ${colors.border}`,
          background: colors.cardBackground,
          color: colors.text,
          cursor: 'pointer'
        }}
      >
        🗑️ {t('videoBasedLearning.clearAll')}
      </button>
      
      {/* Saved Videos Section */}
      <div style={{ marginTop: "40px" }}>
        <h3>🎬 {t('videoBasedLearning.savedVideos')}</h3>
        <SavedVideos user={user} />
      </div>
    </div>
  );
}

export default VideoLesson; 