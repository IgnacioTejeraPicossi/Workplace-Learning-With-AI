import React, { useState, useEffect } from 'react';
import { generateVideoQuiz, generateVideoSummary, askStream, saveVideo } from './api';
import StreamingProgress from './StreamingProgress';
import StreamingText from './StreamingText';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';
import { useTheme } from './ThemeContext';
import SavedVideos from './SavedVideos';

const EXAMPLE_VIDEO = "https://www.youtube.com/embed/1hHMwLxN6EM";
const EXAMPLE_SUMMARY = "This video explains the basics of Agile methodology, including its iterative approach, team collaboration, and adaptability to change. Key points: Agile is not waterfall, it values individuals and interactions, and it uses sprints to deliver value incrementally.";

function VideoLesson({ user }) {
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

  // Extract title from YouTube using oEmbed API
  const extractYouTubeTitle = async (videoId) => {
    if (!videoId) return;
    
    setExtractingTitle(true);
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.title) {
          setVideoTitle(data.title);
          // Auto-suggest topic based on title
          const suggestedTopic = suggestTopicFromTitle(data.title);
          if (suggestedTopic) {
            setVideoTopic(suggestedTopic);
          }
        }
      }
    } catch (error) {
      console.log('Could not extract title automatically:', error);
      // Fallback: try to extract from URL parameters
      try {
        const url = new URL(`https://www.youtube.com/watch?v=${videoId}`);
        const titleParam = url.searchParams.get('title');
        if (titleParam) {
          setVideoTitle(decodeURIComponent(titleParam));
        }
      } catch (urlError) {
        console.log('URL parsing failed:', urlError);
      }
    } finally {
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

      await saveVideo(videoData);
      
      // Reset form
      setVideoTitle('');
      setVideoDescription('');
      setVideoTopic('');
      setShowSaveForm(false);
      
      // Show success message
      alert('Video saved successfully! You can find it in the Saved Videos section below.');
      
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video. Please try again.');
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
      <h2 style={{ marginBottom: 16, color: colors.text }}>🎥 Video-Based Learning</h2>
      
      {/* Info Box */}
      <div style={{ 
        marginBottom: 24, 
        padding: 16, 
        background: '#e3f2fd', 
        borderRadius: 8, 
        border: '1px solid #2196f3',
        color: '#1565c0'
      }}>
        <h4 style={{ marginBottom: 8 }}>💡 How to Use Video Lessons</h4>
        <ol style={{ marginLeft: 20, marginBottom: 0 }}>
          <li><strong>Paste a YouTube URL</strong> - It will automatically convert to embed format and extract title</li>
          <li><strong>Fill in video details</strong> - Title, topic, and description (required)</li>
          <li><strong>Save the video</strong> - Add it to your personal video library</li>
          <li><strong>Paste transcript</strong> - Generate AI-powered summaries and quizzes</li>
          <li><strong>Learn & test</strong> - Take quizzes and track your progress</li>
        </ol>
      </div>
      
      {/* Video URL Input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          Video URL: *
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={videoUrl}
            onChange={handleUrlChange}
            onPaste={handleUrlPaste}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
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
            📋 Example
          </button>
        </div>
        <small style={{ color: colors.textSecondary }}>
          Paste a YouTube URL (auto-converts to embed and extracts title) or direct MP4 link. *Required
        </small>
        {extractingTitle && (
          <div style={{ marginTop: 8, color: '#2196f3', fontSize: '14px' }}>
            🔍 Extracting video title...
          </div>
        )}
      </div>

      {/* Video Save Form */}
      {videoUrl && (
        <div style={{ marginBottom: 20, padding: 16, background: colors.cardBackground, borderRadius: 8, border: `1px solid ${colors.border}` }}>
          <h3 style={{ marginBottom: 16, color: colors.text }}>💾 Save Video Information</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: colors.text }}>
                Video Title: * {extractingTitle && '⏳'}
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder={extractingTitle ? "Extracting title..." : "Enter a descriptive title for this video"}
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
                Topic/Category: *
              </label>
              <input
                type="text"
                value={videoTopic}
                onChange={(e) => setVideoTopic(e.target.value)}
                placeholder="e.g., Programming, Leadership, Design"
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: colors.text }}>
                Description:
              </label>
              <textarea
                rows={3}
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Brief description of what this video covers..."
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
                background: colors.primary,
                color: '#fff',
                cursor: saving || !videoTitle.trim() || !videoTopic.trim() || extractingTitle ? 'not-allowed' : 'pointer',
                opacity: saving || !videoTitle.trim() || !videoTopic.trim() || extractingTitle ? 0.6 : 1,
                alignSelf: 'flex-start'
              }}
            >
              {saving ? '⏳ Saving...' : extractingTitle ? '⏳ Wait for title...' : '💾 Save Video'}
            </button>
          </div>
        </div>
      )}

      {/* Video Player */}
      {isValidVideoUrl && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: colors.text }}>🎬 Video Player</h3>
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
                🔗 Open in New Tab
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
              Your browser does not support the video tag.
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
          <h4 style={{ marginBottom: 8 }}>⚠️ Browser Security Notice</h4>
          <p style={{ marginBottom: 8 }}>
            Some browsers may block YouTube videos for security reasons. If the video doesn't load:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 8 }}>
            <li>Try opening the video in a new tab</li>
            <li>Check your browser's security settings</li>
            <li>Use the transcript feature below for learning</li>
          </ul>
          <a 
            href={videoUrl.replace('/embed/', '/watch?v=')} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            Open video in new tab →
          </a>
        </div>
      )}

      {/* Transcript Input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          Video Transcript (for summary generation):
        </label>
        <textarea
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the video transcript here to generate a summary..."
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
          {summaryStreaming.loading ? '⏳ Generating...' : '📝 Generate Summary'}
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
          <h3 style={{ marginBottom: 12, color: colors.text }}>📋 Video Summary</h3>
          <StreamingText 
            content={summary}
            loading={summaryStreaming.loading}
            placeholder="Generating summary..."
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
            {quizStreaming.loading ? '⏳ Generating Quiz...' : '🧠 Generate Quiz'}
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
            📝 Quiz {showBadge && '🏆'}
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
                  ✅ Correct: {q.answer}  
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
                Quiz Complete! 🎉
              </h4>
              <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: colors.text }}>
                Score: {score}% ({correctCount}/{quiz.length} correct)
              </p>
              {showBadge && (
                <p style={{ color: '#4caf50', fontWeight: 'bold' }}>
                  🏆 Excellent! You've mastered this content!
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
        🗑️ Clear All
      </button>
      
      {/* Saved Videos Section */}
      <div style={{ marginTop: "40px" }}>
        <h3>🎬 Saved Videos</h3>
        <SavedVideos user={user} />
      </div>
    </div>
  );
}

export default VideoLesson; 