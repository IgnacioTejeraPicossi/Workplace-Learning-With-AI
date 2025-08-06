import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { fetchLessons, fetchSavedVideos } from "./api";
import ProgressCard from "./ProgressCard";
import LearningTrendsChart from "./LearningTrendsChart";
import TopicBreakdownChart from "./TopicBreakdownChart";
import { useTheme } from "./ThemeContext";

const PROGRESS_KEY_PREFIX = "ai_learning_progress_";

function getProgressKey(userId) {
  return `${PROGRESS_KEY_PREFIX}${userId}`;
}

function getInitialProgress(userId) {
  if (!userId) return getDefaultProgress();
  
  const stored = localStorage.getItem(getProgressKey(userId));
  if (stored) return JSON.parse(stored);
  return getDefaultProgress();
}

function getDefaultProgress() {
  return {
    lessonsCompleted: 0,
    simulationsCompleted: 0,
    simulationScore: 0,
    lastActivity: null
  };
}

// Utility function for formatting dates - will be used for:
// - Lesson history timestamps
// - Activity timeline display  
// - Team member join dates
// - Career coach session timestamps
// - Skills forecast creation dates
// eslint-disable-next-line no-unused-vars
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function getRecommendation(progress) {
  if (progress.lessonsCompleted === 0) return "Try your first micro-lesson!";
  if (progress.simulationsCompleted === 0) return "Try your first scenario simulation!";
  if (progress.simulationScore < progress.simulationsCompleted) return "Aim for more 'good' responses in simulations!";
  return "Great job! Keep learning or try a new scenario.";
}

// Helper to get ISO week string (YYYY-Www)
function getISOWeek(dateStr) {
  const date = new Date(dateStr);
  const year = date.getUTCFullYear();
  // Get week number
  const firstJan = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + firstJan.getUTCDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function Dashboard({ user, onSectionSelect }) {
  const [progress, setProgress] = useState(getDefaultProgress());
  const [loading, setLoading] = useState(true);
  const [lessonTrends, setLessonTrends] = useState([]);
  const [topicBreakdown, setTopicBreakdown] = useState([]);
  const { colors } = useTheme();

  useEffect(() => {
    if (!user) {
      setProgress(getDefaultProgress());
      setLessonTrends([]);
      setTopicBreakdown([]);
      setLoading(false);
      return;
    }

    // Load user-specific progress
    const userProgress = getInitialProgress(user.uid);
    setProgress(userProgress);

    // Fetch actual lessons count from backend
    const fetchUserData = async () => {
      try {
        const lessonsData = await fetchLessons();
        const lessons = lessonsData.lessons || lessonsData || [];
        const actualLessonsCount = lessons.length;
        
        // Fetch saved videos count
        const videosData = await fetchSavedVideos();
        const videos = videosData.videos || [];
        const actualVideosCount = videos.length;
        
        // Update progress with real data
        const updatedProgress = {
          ...userProgress,
          lessonsCompleted: actualLessonsCount,
          videosCompleted: actualVideosCount, // Add videos count
          lastActivity: userProgress.lastActivity || (lessons[0]?.created_at || new Date().toISOString())
        };
        setProgress(updatedProgress);
        localStorage.setItem(getProgressKey(user.uid), JSON.stringify(updatedProgress));

        // Group lessons by week for line chart
        const weekMap = {};
        const videoWeekMap = {};
        
        // Process micro-lessons
        lessons.forEach(lesson => {
          if (lesson.created_at) {
            const week = getISOWeek(lesson.created_at);
            weekMap[week] = (weekMap[week] || 0) + 1;
          }
        });
        
        // Mock video lessons data (replace with actual API call when available)
        const mockVideoLessons = [
          { created_at: '2025-01-15', topic: 'Agile' },
          { created_at: '2025-01-15', topic: 'Programming' },
          { created_at: '2025-01-14', topic: 'Leadership' },
          { created_at: '2025-01-13', topic: 'Programming' },
          { created_at: '2025-01-12', topic: 'Programming' }
        ];
        
        // Process video lessons
        mockVideoLessons.forEach(video => {
          if (video.created_at) {
            const week = getISOWeek(video.created_at);
            videoWeekMap[week] = (videoWeekMap[week] || 0) + 1;
          }
        });
        
        // Combine all weeks and create chart data
        const allWeeks = [...new Set([...Object.keys(weekMap), ...Object.keys(videoWeekMap)])].sort();
        
        // If no real data, create some sample data for demonstration
        if (allWeeks.length === 0) {
          const currentWeek = getISOWeek(new Date().toISOString());
          const lastWeek = getISOWeek(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          const twoWeeksAgo = getISOWeek(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
          
          const trends = [
            { week: twoWeeksAgo, microLessons: 2, videoLessons: 1 },
            { week: lastWeek, microLessons: 5, videoLessons: 3 },
            { week: currentWeek, microLessons: 8, videoLessons: 4 }
          ];
          setLessonTrends(trends);
        } else {
          const trends = allWeeks.map(week => ({ 
            week, 
            microLessons: weekMap[week] || 0,
            videoLessons: videoWeekMap[week] || 0
          }));
          setLessonTrends(trends);
        }

        // Group lessons by topic for pie chart
        const topicMap = {};
        lessons.forEach(lesson => {
          if (lesson.topic) {
            topicMap[lesson.topic] = (topicMap[lesson.topic] || 0) + 1;
          }
        });
        
        // Add mock video topics to the breakdown
        mockVideoLessons.forEach(video => {
          if (video.topic) {
            topicMap[video.topic] = (topicMap[video.topic] || 0) + 1;
          }
        });
        
        // Convert to array for pie chart
        const breakdown = Object.keys(topicMap).map(topic => ({
          name: topic,
          value: topicMap[topic]
        }));
        
        // If no real data, create sample breakdown
        if (breakdown.length === 0) {
          const sampleBreakdown = [
            { name: 'Programming', value: 5 },
            { name: 'Leadership', value: 3 },
            { name: 'Agile', value: 2 },
            { name: 'Communication', value: 1 }
          ];
          setTopicBreakdown(sampleBreakdown);
        } else {
          setTopicBreakdown(breakdown);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setProgress(userProgress);
        setLessonTrends([]);
        setTopicBreakdown([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Listen for storage events to update progress when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        const updatedProgress = getInitialProgress(user.uid);
        setProgress(updatedProgress);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('progressUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('progressUpdated', handleStorageChange);
    };
  }, [user]);

  if (loading) {
    return (
      <div style={{
        background: colors.primaryLight,
        borderRadius: 10,
        padding: 24,
        marginBottom: 32,
        boxShadow: colors.shadow,
        color: colors.text
      }}>
        <h2 style={{ marginTop: 0, color: colors.text }}>Your Progress</h2>
        <div>Loading your progress...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: colors.primaryLight,
        borderRadius: 10,
        padding: 24,
        marginBottom: 32,
        boxShadow: colors.shadow,
        color: colors.text
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, color: colors.text }}>Your Progress</h2>
        
        <div style={{ 
          display: "flex", 
          gap: 16, 
          flexWrap: "wrap", 
          marginBottom: 20 
        }}>
          <ProgressCard
            title="Lessons Completed"
            value={progress.lessonsCompleted}
            total={Math.max(progress.lessonsCompleted, 10)}
            icon="📚"
            color="#4CAF50"
            backgroundColor="#e8f5e8"
          />
          
          <ProgressCard
            title="Simulations Completed"
            value={progress.simulationsCompleted}
            total={5}
            icon="▶️"
            color="#2196F3"
            backgroundColor="#e3f2fd"
          />
          
          <ProgressCard
            title="Simulation Score"
            value={progress.simulationScore}
            total={progress.simulationsCompleted || 1}
            icon="🎯"
            color="#FF9800"
            backgroundColor="#fff3e0"
            showProgress={progress.simulationsCompleted > 0}
          />
          
          <ProgressCard
            title="Learning Streak"
            value={progress.lastActivity ? 1 : 0}
            total={1}
            icon="🔥"
            color="#F44336"
            backgroundColor="#ffebee"
            showProgress={false}
          />
        </div>
        
        <div style={{ 
          fontWeight: 500, 
          color: colors.primary,
          background: colors.cardBackground,
          padding: "12px 16px",
          borderRadius: 8,
          border: `1px solid ${colors.border}`
        }}>
          💡 <strong>Recommended next step:</strong> {getRecommendation(progress)}
        </div>
      </div>
      
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: "100%" }}>
        <div style={{ 
          flex: "1 1 350px", 
          minWidth: 0,
          maxWidth: "100%"
        }}>
          <LearningTrendsChart data={lessonTrends} />
        </div>
        <div style={{ 
          flex: "1 1 350px", 
          minWidth: 0,
          maxWidth: "100%"
        }}>
          <TopicBreakdownChart data={topicBreakdown} />
        </div>
      </div>
    </div>
  );
}

export function updateProgress(updates) {
  const user = auth.currentUser;
  if (!user) return;

  const current = getInitialProgress(user.uid);
  
  // For simulations, increment the existing values
  const merged = { 
    ...current, 
    ...updates,
    simulationsCompleted: current.simulationsCompleted + (updates.simulationsCompleted || 0),
    simulationScore: current.simulationScore + (updates.simulationScore || 0)
  };
  merged.lastActivity = new Date().toISOString();
  
  localStorage.setItem(getProgressKey(user.uid), JSON.stringify(merged));
  
  // Dispatch custom event for real-time updates
  window.dispatchEvent(new CustomEvent('progressUpdated', { 
    detail: { progress: merged, updates } 
  }));
  
  // Also dispatch storage event for other tabs
  window.dispatchEvent(new Event("storage"));
}

export function getCurrentProgress() {
  const user = auth.currentUser;
  if (!user) return getDefaultProgress();
  return getInitialProgress(user.uid);
}

export default Dashboard; 