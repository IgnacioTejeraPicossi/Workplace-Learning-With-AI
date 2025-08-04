import React, { useState, useEffect } from "react";
import { askStream } from "./api";
import StreamingProgress from "./StreamingProgress";
import StreamingText from "./StreamingText";
import { useStreaming, STATUS_MESSAGES } from "./hooks/useStreaming";
import { useTheme } from "./ThemeContext";

function SkillsForecast() {
  const [input, setInput] = useState("");
  const [savedForecasts, setSavedForecasts] = useState([]);
  const [showResources, setShowResources] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSavedForecasts, setShowSavedForecasts] = useState(false);
  const [resources, setResources] = useState([]);
  const [reminderDate, setReminderDate] = useState('');
  const { colors } = useTheme();
  
  // Load saved forecasts on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedForecasts') || '[]');
    setSavedForecasts(saved);
  }, []);

  // Use streaming hook for skills forecasting
  const forecastStreaming = useStreaming('Ready to analyze your skills');

  const handleGetForecast = async () => {
    if (!input.trim()) {
      alert('Please provide information about your current skills and career goals.');
      return;
    }

    forecastStreaming.startStreaming(
      `Given my current skills and career goals: ${input}, 
      predict the next best skills to develop and provide a personalized forecast.
      
      Include:
      1. Analysis of current skill gaps
      2. Emerging industry trends
      3. Recommended skill development path
      4. Timeline for skill acquisition
      5. Resources and learning methods
      
      Make it actionable and specific.`,
      {
        statusMessages: STATUS_MESSAGES.SKILLS_FORECAST,
        onComplete: (content) => {
          // Could save forecast to user profile
          console.log('Skills forecast completed');
        }
      }
    );
  };

  const handleClear = () => {
    setInput("");
    forecastStreaming.clearStreaming();
    setShowResources(false);
    setShowSchedule(false);
    setResources([]);
    setReminderDate('');
  };

  const handleSaveForecast = () => {
    if (!forecastStreaming.content) {
      alert('No forecast to save. Please generate a forecast first.');
      return;
    }

    const newForecast = {
      id: Date.now(),
      input: input,
      forecast: forecastStreaming.content,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    setSavedForecasts(prev => [newForecast, ...prev]);
    
    // Save to localStorage for persistence
    const existing = JSON.parse(localStorage.getItem('savedForecasts') || '[]');
    localStorage.setItem('savedForecasts', JSON.stringify([newForecast, ...existing]));
    
    alert('✅ Forecast saved successfully! You can view it in your saved forecasts.');
  };

  const handleDeleteForecast = (id) => {
    const updated = savedForecasts.filter(f => f.id !== id);
    setSavedForecasts(updated);
    localStorage.setItem('savedForecasts', JSON.stringify(updated));
  };

  const handleFindResources = async () => {
    if (!forecastStreaming.content) {
      alert('No forecast to analyze. Please generate a forecast first.');
      return;
    }

    setShowResources(true);
    setShowSchedule(false);

    // Generate learning resources based on the forecast
    try {
      let resourcesContent = '';
      await askStream(
        { prompt: `Based on this skills forecast: ${forecastStreaming.content}
        
        Generate a list of specific learning resources including:
        1. Online courses (with platforms like Udemy, Coursera, edX)
        2. Books and publications
        3. Practice projects and exercises
        4. Communities and forums
        5. Certifications and credentials
        
        Format as a structured list with links and descriptions.` },
        (output) => {
          resourcesContent = output;
          setResources(output.split('\n').filter(line => line.trim()));
        }
      );
    } catch (error) {
      console.error('Failed to generate resources:', error);
      setResources(['Error generating resources. Please try again.']);
    }
  };

  const handleScheduleReview = () => {
    if (!forecastStreaming.content) {
      alert('No forecast to schedule. Please generate a forecast first.');
      return;
    }

    setShowSchedule(true);
    setShowResources(false);
    
    // Set default date to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setReminderDate(defaultDate.toISOString().split('T')[0]);
  };

  const handleSetReminder = () => {
    if (!reminderDate) {
      alert('Please select a reminder date.');
      return;
    }

    const reminder = {
      id: Date.now(),
      forecast: forecastStreaming.content,
      reminderDate: reminderDate,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('forecastReminders') || '[]');
    localStorage.setItem('forecastReminders', JSON.stringify([reminder, ...existing]));

    alert(`✅ Review scheduled for ${new Date(reminderDate).toLocaleDateString()}. You'll be reminded to review your skills progress.`);
    setShowSchedule(false);
    setReminderDate('');
  };

  const sampleInputs = [
    "I'm a junior developer with 2 years of experience in JavaScript and React. I want to advance to a senior role.",
    "I'm a project manager looking to transition into product management. I have experience with Agile methodologies.",
    "I'm a marketing specialist wanting to learn data analysis and digital marketing automation."
  ];

  const handleSampleInput = (sample) => {
    setInput(sample);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>🔮 Skills Forecasting</h2>
      
      <p style={{ marginBottom: 20, color: colors.textSecondary }}>
        Get AI-powered predictions about which skills you should develop next based on your current profile and career goals.
      </p>

      {/* Saved Forecasts Section */}
      {savedForecasts.length > 0 && (
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
              📋 Saved Forecasts ({savedForecasts.length})
            </h3>
            <button
              onClick={() => setShowSavedForecasts(!showSavedForecasts)}
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
              {showSavedForecasts ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showSavedForecasts && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {savedForecasts.map((forecast, index) => (
                <div 
                  key={forecast.id}
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
                        Forecast #{savedForecasts.length - index}
                      </strong>
                      <div style={{ 
                        fontSize: '0.8em', 
                        color: colors.textSecondary,
                        marginTop: 4
                      }}>
                        {new Date(forecast.timestamp).toLocaleDateString()} at {new Date(forecast.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteForecast(forecast.id)}
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
                    <strong style={{ color: colors.textSecondary }}>Input:</strong>
                    <div style={{ 
                      fontSize: '0.9em', 
                      color: colors.text,
                      marginTop: 4,
                      fontStyle: 'italic'
                    }}>
                      {forecast.input.length > 100 
                        ? `${forecast.input.substring(0, 100)}...` 
                        : forecast.input
                      }
                    </div>
                  </div>
                  
                  <div>
                    <strong style={{ color: colors.textSecondary }}>Forecast:</strong>
                    <div style={{ 
                      fontSize: '0.9em', 
                      color: colors.text,
                      marginTop: 4,
                      maxHeight: '150px',
                      overflowY: 'auto',
                      lineHeight: 1.4
                    }}>
                      {forecast.forecast.length > 300 
                        ? `${forecast.forecast.substring(0, 300)}...` 
                        : forecast.forecast
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Section */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: colors.text }}>
          Tell us about your current skills and career goals:
        </label>
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your current role, skills, experience level, and career aspirations..."
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
        
        {/* Sample Inputs */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, fontSize: '0.9em', color: colors.textSecondary }}>
            💡 Try a sample input:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sampleInputs.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSampleInput(sample)}
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
                Sample {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleGetForecast}
            disabled={forecastStreaming.loading || !input.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              cursor: forecastStreaming.loading ? 'not-allowed' : 'pointer',
              opacity: forecastStreaming.loading ? 0.6 : 1
            }}
          >
            {forecastStreaming.loading ? '⏳ Analyzing...' : '🔮 Get Forecast'}
          </button>
          
          <button
            onClick={handleClear}
            disabled={forecastStreaming.loading}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              cursor: forecastStreaming.loading ? 'not-allowed' : 'pointer'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Forecasting Progress */}
      {forecastStreaming.loading && (
        <StreamingProgress 
          loading={forecastStreaming.loading}
          status={forecastStreaming.status}
          progress={forecastStreaming.progress}
          color="info"
        />
      )}

      {/* Forecast Results */}
      {forecastStreaming.content && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: colors.text }}>
            📊 Your Skills Forecast
          </h3>
          
          <StreamingText 
            content={forecastStreaming.content}
            loading={forecastStreaming.loading}
            placeholder="Analyzing your skills and generating forecast..."
            style={{ minHeight: '300px' }}
          />

          {/* Action Buttons */}
          {forecastStreaming.isComplete && (
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleSaveForecast}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.primary,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                📋 Save Forecast
              </button>
              <button
                onClick={handleFindResources}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📚 Find Learning Resources
              </button>
              <button
                onClick={handleScheduleReview}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  cursor: 'pointer'
                }}
              >
                📅 Schedule Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* Learning Resources Section */}
      {showResources && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: colors.cardBackground,
          borderRadius: 8,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ marginBottom: 16, color: colors.text }}>
            📚 Learning Resources
          </h3>
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            lineHeight: 1.6,
            color: colors.text
          }}>
            {resources.map((resource, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                {resource}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowResources(false)}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.cardBackground,
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Schedule Review Section */}
      {showSchedule && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: colors.cardBackground,
          borderRadius: 8,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ marginBottom: 16, color: colors.text }}>
            📅 Schedule Skills Review
          </h3>
          <p style={{ marginBottom: 16, color: colors.textSecondary }}>
            Set a reminder to review your skills progress and update your forecast.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: colors.text }}>
              Reminder Date:
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSetReminder}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: colors.primary,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Set Reminder
            </button>
            <button
              onClick={() => setShowSchedule(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.cardBackground,
                color: colors.text,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Handling */}
      {forecastStreaming.error && (
        <div style={{ 
          padding: 16, 
          background: '#ffebee', 
          color: '#c62828',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <strong>Error:</strong> {forecastStreaming.error}
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

export default SkillsForecast;
