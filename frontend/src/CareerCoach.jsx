import React, { useState, useEffect } from 'react';
import { askStream } from './api';
import StreamingProgress from './StreamingProgress';
import StreamingText from './StreamingText';
import { useStreaming, STATUS_MESSAGES } from './hooks/useStreaming';
import { useTheme } from './ThemeContext';

export default function CareerCoach() {
  const [growthArea, setGrowthArea] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [showSavedSessions, setShowSavedSessions] = useState(false);
  const { colors } = useTheme();
  
  // Use streaming hook for career coaching
  const coachingStreaming = useStreaming('Ready to start coaching session');

  // Load saved sessions on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedCoachingSessions') || '[]');
    setSavedSessions(saved);
  }, []);

  const growthAreas = [
    { key: 'leadership', label: 'Leadership', icon: '👑', description: 'Team management, decision-making, strategic thinking' },
    { key: 'communication', label: 'Communication', icon: '💬', description: 'Public speaking, writing, active listening' },
    { key: 'conflict', label: 'Conflict Management', icon: '🤝', description: 'Negotiation, mediation, problem-solving' }
  ];

  const handleStartCoaching = async (area) => {
    setGrowthArea(area.key);
    
    coachingStreaming.startStreaming(
      `You are an AI career coach. The user wants to focus on ${area.label.toLowerCase()} development. 
      Provide personalized coaching advice including:
      1. Assessment of current skills
      2. Specific improvement strategies
      3. Actionable next steps
      4. Recommended resources
      5. Progress tracking suggestions
      
      Make it conversational and encouraging.`,
      {
        statusMessages: STATUS_MESSAGES.CAREER_COACH,
        onComplete: (content) => {
          // Could save coaching session to user profile
          console.log('Coaching session completed');
        }
      }
    );
  };

  const handleStartCustomCoaching = async () => {
    if (!customTopic.trim()) {
      alert('Please enter a coaching topic.');
      return;
    }

    setGrowthArea('custom');
    
    coachingStreaming.startStreaming(
      `You are an AI career coach. The user wants to focus on: ${customTopic}
      Provide personalized coaching advice including:
      1. Assessment of current skills in this area
      2. Specific improvement strategies
      3. Actionable next steps
      4. Recommended resources
      5. Progress tracking suggestions
      
      Make it conversational and encouraging.`,
      {
        statusMessages: STATUS_MESSAGES.CAREER_COACH,
        onComplete: (content) => {
          // Could save coaching session to user profile
          console.log('Custom coaching session completed');
        }
      }
    );
  };

  const handleSaveSession = () => {
    if (!coachingStreaming.content) {
      alert('No session to save. Please complete a coaching session first.');
      return;
    }

    const sessionTitle = growthArea === 'custom' ? customTopic : growthAreas.find(a => a.key === growthArea)?.label;
    
    const newSession = {
      id: Date.now(),
      title: sessionTitle,
      topic: growthArea === 'custom' ? customTopic : growthAreas.find(a => a.key === growthArea)?.label,
      content: coachingStreaming.content,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    setSavedSessions(prev => [newSession, ...prev]);
    
    // Save to localStorage for persistence
    const existing = JSON.parse(localStorage.getItem('savedCoachingSessions') || '[]');
    localStorage.setItem('savedCoachingSessions', JSON.stringify([newSession, ...existing]));
    
    alert('✅ Coaching session saved successfully! You can view it in your saved sessions.');
  };

  const handleDeleteSession = (id) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem('savedCoachingSessions', JSON.stringify(updated));
  };

  const handleClear = () => {
    setGrowthArea('');
    setCustomTopic('');
    setShowCustomInput(false);
    coachingStreaming.clearStreaming();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🎯 AI Career Coach</h2>
      
      {/* Saved Sessions Section */}
      {savedSessions.length > 0 && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          background: colors.cardBackground,
          borderRadius: 8,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 12
          }}>
            <h3 style={{ margin: 0, color: colors.text }}>
              💬 Saved Sessions ({savedSessions.length})
            </h3>
            <button
              onClick={() => setShowSavedSessions(!showSavedSessions)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              {showSavedSessions ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showSavedSessions && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {savedSessions.map((session, index) => (
                <div 
                  key={session.id}
                  style={{ 
                    padding: 12, 
                    marginBottom: 8, 
                    background: colors.background,
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 8
                  }}>
                    <div>
                      <strong style={{ color: colors.text }}>
                        Session #{savedSessions.length - index}
                      </strong>
                      <div style={{ 
                        fontSize: '0.8em', 
                        color: colors.textSecondary,
                        marginTop: 4
                      }}>
                        {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: 'none',
                        background: '#ff4444',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: colors.textSecondary }}>Topic:</strong>
                    <div style={{ 
                      fontSize: '0.9em', 
                      color: colors.text,
                      marginTop: 4,
                      fontStyle: 'italic'
                    }}>
                      {session.title}
                    </div>
                  </div>
                  
                  <div>
                    <strong style={{ color: colors.textSecondary }}>Session:</strong>
                    <div style={{ 
                      fontSize: '0.9em', 
                      color: colors.text,
                      marginTop: 4,
                      maxHeight: '150px',
                      overflowY: 'auto',
                      lineHeight: 1.4
                    }}>
                      {session.content.length > 300 
                        ? `${session.content.substring(0, 300)}...` 
                        : session.content
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!growthArea && !coachingStreaming.content && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 16, color: colors.textSecondary }}>
            Choose a growth area to receive personalized career coaching advice:
          </p>
          
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {growthAreas.map((area) => (
              <div
                key={area.key}
                onClick={() => handleStartCoaching(area)}
                style={{
                  padding: 20,
                  background: colors.cardBackground,
                  borderRadius: 12,
                  border: `2px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
                onMouseLeave={(e) => e.target.style.borderColor = colors.border}
              >
                <div style={{ fontSize: '2.5em', marginBottom: 12 }}>
                  {area.icon}
                </div>
                <h3 style={{ marginBottom: 8, color: colors.text }}>
                  {area.label}
                </h3>
                <p style={{ 
                  color: colors.textSecondary, 
                  fontSize: '0.9em',
                  lineHeight: 1.4
                }}>
                  {area.description}
                </p>
                <button
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: colors.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                >
                  Start Coaching
                </button>
              </div>
            ))}

            {/* Custom Coaching Card */}
            <div
              style={{
                padding: 20,
                background: colors.cardBackground,
                borderRadius: 12,
                border: `2px solid ${colors.border}`,
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '2.5em', marginBottom: 12 }}>
                ✨
              </div>
              <h3 style={{ marginBottom: 8, color: colors.text }}>
                Custom Topic
              </h3>
              <p style={{ 
                color: colors.textSecondary, 
                fontSize: '0.9em',
                lineHeight: 1.4
              }}>
                Get coaching on any career topic you want to improve
              </p>
              
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: colors.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                >
                  Start Custom
                </button>
              ) : (
                <div style={{ textAlign: 'left', marginTop: 12 }}>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter your coaching topic (e.g., 'Time management', 'Public speaking anxiety')"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      background: colors.background,
                      color: colors.text,
                      fontSize: '0.9em',
                      marginBottom: 8
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleStartCustomCoaching();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleStartCustomCoaching}
                      disabled={!customTopic.trim()}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: customTopic.trim() ? colors.primary : colors.border,
                        color: '#fff',
                        cursor: customTopic.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '0.9em',
                        flex: 1
                      }}
                    >
                      Start Coaching
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomTopic("");
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.cardBackground,
                        color: colors.text,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coaching Session */}
      {growthArea && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            padding: 12,
            background: colors.primaryLight,
            borderRadius: 8
          }}>
            <span style={{ fontSize: '1.5em' }}>
              {growthArea === 'custom' ? '✨' : growthAreas.find(a => a.key === growthArea)?.icon}
            </span>
            <div>
              <h3 style={{ margin: 0, color: colors.text }}>
                {growthArea === 'custom' ? `${customTopic} Coaching` : `${growthAreas.find(a => a.key === growthArea)?.label} Coaching`}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: colors.textSecondary }}>
                AI Career Coach Session
              </p>
            </div>
          </div>

          {/* Coaching Progress */}
          {coachingStreaming.loading && (
            <StreamingProgress 
              loading={coachingStreaming.loading}
              status={coachingStreaming.status}
              progress={coachingStreaming.progress}
              color="info"
            />
          )}

          {/* Coaching Content */}
          <StreamingText 
            content={coachingStreaming.content}
            loading={coachingStreaming.loading}
            placeholder="Starting your coaching session..."
            style={{ minHeight: '300px' }}
          />

          {/* Action Buttons */}
          {coachingStreaming.isComplete && (
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.primary,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                💬 Continue Session
              </button>
              <button
                onClick={handleSaveSession}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📋 Save Session
              </button>
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
                🔄 New Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Handling */}
      {coachingStreaming.error && (
        <div style={{ 
          padding: 16, 
          background: '#ffebee', 
          color: '#c62828',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <strong>Error:</strong> {coachingStreaming.error}
          <button
            onClick={handleClear}
            style={{
              marginLeft: 12,
              padding: '4px 8px',
              borderRadius: 4,
              border: 'none',
              background: '#c62828',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8em'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
