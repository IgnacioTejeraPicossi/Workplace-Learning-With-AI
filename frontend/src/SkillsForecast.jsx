import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { askStream, saveSkillsForecast } from "./api";
import StreamingProgress from "./StreamingProgress";
import StreamingText from "./StreamingText";
import { useStreaming } from "./hooks/useStreaming";
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
  const { t } = useTranslation();

  const sampleInputs = useMemo(
    () => [
      t("skillsForecastModule.samples.sample1"),
      t("skillsForecastModule.samples.sample2"),
      t("skillsForecastModule.samples.sample3")
    ],
    [t]
  );

  const forecastStatusMessages = useMemo(
    () => [
      t("skillsForecastModule.streaming.status1"),
      t("skillsForecastModule.streaming.status2"),
      t("skillsForecastModule.streaming.status3"),
      t("skillsForecastModule.streaming.status4")
    ],
    [t]
  );

  const forecastStreaming = useStreaming(t("skillsForecastModule.streaming.initialStatus"));
  
  // Helper function to extract skills from forecast content
  const extractSkillsFromForecast = (content) => {
    // Simple extraction - look for common skill patterns
    const skillKeywords = [
      'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
      'Machine Learning', 'AI', 'Data Analysis', 'SQL', 'NoSQL', 'DevOps',
      'Agile', 'Scrum', 'Leadership', 'Communication', 'Problem Solving'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      content.toLowerCase().includes(skill.toLowerCase())
    );
    
    // If no specific skills found, return some generic ones
    return foundSkills.length > 0 ? foundSkills : ['Technical Skills', 'Soft Skills', 'Industry Knowledge'];
  };
  
  // Load saved forecasts on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedForecasts') || '[]');
    setSavedForecasts(saved);
  }, []);

  const handleGetForecast = async () => {
    if (!input.trim()) {
      alert(t("skillsForecastModule.alerts.inputRequired"));
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
        statusMessages: forecastStatusMessages,
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

  const handleSaveForecast = async () => {
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
    
    // Save to MongoDB
    try {
      const forecastData = {
        title: `Skills Forecast: ${input.substring(0, 50)}...`,
        description: `Skills forecast based on: ${input}`,
        skills: extractSkillsFromForecast(forecastStreaming.content),
        industry: 'Technology',
        timeframe: '6-12 months',
        confidence_level: 'High',
        analysis: forecastStreaming.content
      };
      await saveSkillsForecast(forecastData);
      console.log('Skills forecast saved to MongoDB');
    } catch (saveError) {
      console.error('Error saving skills forecast to MongoDB:', saveError);
    }
    
    alert(t("skillsForecastModule.alerts.saveSuccess"));
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
      setResources([t("skillsForecastModule.resources.errorLine")]);
    }
  };

  const handleScheduleReview = () => {
    if (!forecastStreaming.content) {
      alert(t("skillsForecastModule.alerts.noForecastSchedule"));
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
      alert(t("skillsForecastModule.alerts.reminderDateRequired"));
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

    alert(
      t("skillsForecastModule.schedule.scheduledAlert", {
        date: new Date(reminderDate).toLocaleDateString()
      })
    );
    setShowSchedule(false);
    setReminderDate('');
  };

  const handleSampleInput = (sample) => {
    setInput(sample);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', color: colors.text }}>
      <h2 style={{ marginBottom: 16, color: colors.text }}>{t("skillsForecastModule.pageTitle")}</h2>
      
      <p style={{ marginBottom: 20, color: colors.textSecondary }}>
        {t("skillsForecastModule.intro")}
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
              {t("skillsForecastModule.saved.title", { count: savedForecasts.length })}
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
              {showSavedForecasts ? t("skillsForecastModule.saved.hide") : t("skillsForecastModule.saved.show")}
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
                        {t("skillsForecastModule.saved.forecastNumber", { n: savedForecasts.length - index })}
                      </strong>
                      <div style={{ 
                        fontSize: '0.8em', 
                        color: colors.textSecondary,
                        marginTop: 4
                      }}>
                        {t("skillsForecastModule.saved.datetime", {
                          date: new Date(forecast.timestamp).toLocaleDateString(),
                          time: new Date(forecast.timestamp).toLocaleTimeString()
                        })}
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
                    <strong style={{ color: colors.textSecondary }}>{t("skillsForecastModule.saved.inputLabel")}</strong>
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
                    <strong style={{ color: colors.textSecondary }}>{t("skillsForecastModule.saved.forecastLabel")}</strong>
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
          {t("skillsForecastModule.form.label")}
        </label>
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("skillsForecastModule.form.placeholder")}
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
                {t("skillsForecastModule.form.sampleButton", { n: index + 1 })}
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
            {forecastStreaming.loading ? t("skillsForecastModule.actions.analyzing") : t("skillsForecastModule.actions.getForecast")}
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
            {t("skillsForecastModule.results.title")}
          </h3>
          
          <StreamingText 
            content={forecastStreaming.content}
            loading={forecastStreaming.loading}
            placeholder={t("skillsForecastModule.results.analyzingPlaceholder")}
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
                {t("skillsForecastModule.postActions.saveForecast")}
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
                {t("skillsForecastModule.postActions.findResources")}
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
                {t("skillsForecastModule.postActions.scheduleReview")}
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
            {t("skillsForecastModule.resources.title")}
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
            {t("skillsForecastModule.schedule.title")}
          </h3>
          <p style={{ marginBottom: 16, color: colors.textSecondary }}>
            {t("skillsForecastModule.schedule.intro")}
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: colors.text }}>
              {t("skillsForecastModule.schedule.dateLabel")}
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
          <strong>{t("skillsForecastModule.errors.prefix")}</strong> {forecastStreaming.error}
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
            {t("skillsForecastModule.errors.tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}

export default SkillsForecast;
