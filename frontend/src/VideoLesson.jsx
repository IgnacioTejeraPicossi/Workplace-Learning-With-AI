import React, { useState } from 'react';
import { generateVideoQuiz, generateVideoSummary, askStream } from './api';
import StreamingProgress from './StreamingProgress';
import StreamingText from './StreamingText';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';
import { useTheme } from './ThemeContext';
import SavedVideos from './SavedVideos';

const EXAMPLE_VIDEO = "https://www.youtube.com/embed/1hHMwLxN6EM";
const EXAMPLE_SUMMARY = "This video explains the basics of Agile methodology, including its iterative approach, team collaboration, and adaptability to change. Key points: Agile is not waterfall, it values individuals and interactions, and it uses sprints to deliver value incrementally.";

function VideoLesson() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [transcript, setTranscript] = useState('');
  const { colors } = useTheme();

  // Use streaming hooks for different operations
  const summaryStreaming = useStreaming('Ready to generate summary');
  const quizStreaming = useStreaming('Ready to generate quiz');

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
      `Summarize this video transcript into 5 key points for learning purposes: ${transcript}`,
      {
        statusMessages: STATUS_MESSAGES.VIDEO_ANALYSIS,
        onComplete: (output) => {
          setSummary(output);
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
    setSummary(EXAMPLE_SUMMARY);
    setQuiz([]);
    setUserAnswers({});
    summaryStreaming.clearStreaming();
    quizStreaming.clearStreaming();
  };

  const handleClear = () => {
    setVideoUrl('');
    setSummary('');
    setQuiz([]);
    setUserAnswers({});
    setTranscript('');
    summaryStreaming.clearStreaming();
    quizStreaming.clearStreaming();
  };

  // Calculate score
  const correctCount = quiz.reduce((acc, q, idx) => userAnswers[idx] === q.answer ? acc + 1 : acc, 0);
  const score = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;
  const showBadge = score >= 80 && quiz.length > 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🎥 Video-Based Learning</h2>
      
      {/* Video URL Input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          Video URL:
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
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
          Paste a YouTube embed URL or direct MP4 link
        </small>
      </div>

      {/* Video Player */}
      {videoUrl && (
        <div style={{ marginBottom: 20 }}>
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
        <SavedVideos user={null} />
      </div>
    </div>
  );
}

export default VideoLesson; 