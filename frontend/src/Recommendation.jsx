import React, { useState } from "react";
import { askStream } from "./api";
import StreamingProgress from "./StreamingProgress";
import StreamingText from "./StreamingText";
import { useStreaming, STATUS_MESSAGES } from "./hooks/useStreaming";
import { useTheme } from "./ThemeContext";

function Recommendation({ query }) {
  const [skillGap, setSkillGap] = useState(query || "");
  const { colors } = useTheme();
  
  // Use streaming hook for recommendations
  const recommendationStreaming = useStreaming('Ready to generate recommendations');

  const commonSkillGaps = [
    "Communication and presentation skills",
    "Project management and leadership",
    "Technical skills and programming",
    "Data analysis and analytics",
    "Customer service and support",
    "Sales and negotiation",
    "Time management and productivity",
    "Team collaboration and remote work"
  ];

  const handleGetRecommendation = async () => {
    if (!skillGap.trim()) {
      alert('Please describe your skill gap or learning need.');
      return;
    }

    recommendationStreaming.startStreaming(
      `Suggest what to learn next if my skill gap is: ${skillGap}
      
      Provide:
      1. Specific learning recommendations
      2. Recommended courses or resources
      3. Learning path and timeline
      4. Expected outcomes and benefits
      5. Related skills to develop
      
      Make it personalized and actionable.`,
      {
        statusMessages: STATUS_MESSAGES.RECOMMENDATION,
        onComplete: (content) => {
          // Could save recommendation to user profile
          console.log('Recommendation generated');
        }
      }
    );
  };

  const handleClear = () => {
    setSkillGap("");
    recommendationStreaming.clearStreaming();
  };

  const handleSkillGapSelect = (gap) => {
    setSkillGap(gap);
  };

  const handleSaveRecommendations = () => {
    if (!recommendationStreaming.content) {
      alert('No recommendations to save. Please generate recommendations first.');
      return;
    }

    // Save recommendations to localStorage
    const savedRecommendations = JSON.parse(localStorage.getItem('savedRecommendations') || '[]');
    const newRecommendation = {
      id: Date.now(),
      skillGap: skillGap,
      content: recommendationStreaming.content,
      timestamp: new Date().toISOString(),
      status: 'saved'
    };
    
    savedRecommendations.push(newRecommendation);
    localStorage.setItem('savedRecommendations', JSON.stringify(savedRecommendations));

    // Update knowledge map progress
    const currentProgress = JSON.parse(localStorage.getItem('ai_learning_progress_user') || '{}');
    const updatedProgress = {
      ...currentProgress,
      savedRecommendations: (currentProgress.savedRecommendations || 0) + 1,
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem('ai_learning_progress_user', JSON.stringify(updatedProgress));

    // Trigger progress update event
    window.dispatchEvent(new CustomEvent('progressUpdated', { 
      detail: { progress: updatedProgress, updates: { savedRecommendations: 1 } } 
    }));

    alert('Recommendations saved successfully! They will be reflected in your knowledge map.');
  };

  const handleTrySimulation = () => {
    // Navigate to simulation with the skill gap as context
    window.location.href = '#simulations';
    // You could also use a router or state management here
  };

  const handleScheduleLearning = () => {
    alert('Learning scheduling feature coming soon!');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>⭐ Personalized Recommendations</h2>
      
      <p style={{ marginBottom: 20, color: colors.textSecondary }}>
        Tell us about your skill gaps or learning needs, and we'll provide personalized recommendations for your next steps.
      </p>

      {/* Input Section */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          What skill gap or learning need would you like to address?
        </label>
        
        <textarea
          rows={3}
          value={skillGap}
          onChange={(e) => setSkillGap(e.target.value)}
          placeholder="Describe the skill you want to develop or the area you want to improve..."
          style={{ 
            width: '100%', 
            padding: 12, 
            borderRadius: 8, 
            border: `1px solid ${colors.border}`,
            background: colors.cardBackground,
            color: colors.text,
            resize: 'vertical',
            marginBottom: 12
          }}
        />

        {/* Quick Selection */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, fontSize: '0.9em', color: colors.textSecondary }}>
            💡 Quick selection:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {commonSkillGaps.map((gap, index) => (
              <button
                key={index}
                onClick={() => handleSkillGapSelect(gap)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: '0.8em',
                  whiteSpace: 'nowrap'
                }}
              >
                {gap}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleGetRecommendation}
            disabled={recommendationStreaming.loading || !skillGap.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              cursor: recommendationStreaming.loading ? 'not-allowed' : 'pointer',
              opacity: recommendationStreaming.loading ? 0.6 : 1
            }}
          >
            {recommendationStreaming.loading ? '⏳ Generating...' : '⭐ Get Recommendations'}
          </button>
          
          <button
            onClick={handleClear}
            disabled={recommendationStreaming.loading}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              cursor: recommendationStreaming.loading ? 'not-allowed' : 'pointer'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Recommendation Progress */}
      {recommendationStreaming.loading && (
        <StreamingProgress 
          loading={recommendationStreaming.loading}
          status={recommendationStreaming.status}
          progress={recommendationStreaming.progress}
          color="info"
        />
      )}

      {/* Recommendation Results */}
      {recommendationStreaming.content && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: colors.text }}>
            📚 Your Personalized Recommendations
          </h3>
          
          <StreamingText 
            content={recommendationStreaming.content}
            loading={recommendationStreaming.loading}
            placeholder="Generating personalized recommendations..."
            style={{ minHeight: '250px' }}
          />

          {/* Action Buttons */}
          {recommendationStreaming.isComplete && (
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleTrySimulation}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.primary,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                🎮 Try Simulation
              </button>
              <button
                onClick={handleSaveRecommendations}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📋 Save Recommendations
              </button>
              <button
                onClick={handleScheduleLearning}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📅 Schedule Learning
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Handling */}
      {recommendationStreaming.error && (
        <div style={{ 
          padding: 16, 
          background: '#ffebee', 
          color: '#c62828',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <strong>Error:</strong> {recommendationStreaming.error}
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

export default Recommendation; 