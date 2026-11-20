import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      // Background colors
      background: isDark ? '#1a1a1a' : '#f5f6fa',
      cardBackground: isDark ? '#2d2d2d' : '#ffffff',
      sidebarBackground: isDark ? '#2d2d2d' : '#f8fafc',
      
      // Text colors
      text: isDark ? '#ffffff' : '#2e2e2e',
      textSecondary: isDark ? '#b0b0b0' : '#666666',
      
      // Primary colors
      primary: '#2236a8',
      primaryLight: isDark ? '#4a5bb8' : '#e0e7ff',
      
      // Button colors
      buttonPrimary: '#1976d2',
      buttonSuccess: '#388e3c',
      buttonDanger: '#d32f2f',
      
      // Border colors
      border: isDark ? '#404040' : '#e5e7eb',

      // Semantic status colors (theme-aware bg + text) — for badges, event rows,
      // checklists, status chips. Avoids hardcoded light backgrounds in dark mode.
      successBg: isDark ? '#1b3a24' : '#e8f5e9',
      successText: isDark ? '#81c784' : '#2e7d32',
      warningBg: isDark ? '#3a2e15' : '#fff3e0',
      warningText: isDark ? '#ffb74d' : '#e65100',
      dangerBg: isDark ? '#3a1f1f' : '#ffebee',
      dangerText: isDark ? '#ef9a9a' : '#c62828',
      infoBg: isDark ? '#16293d' : '#e3f2fd',
      infoText: isDark ? '#64b5f6' : '#1565c0',
      // Neutral track for progress/slider backgrounds
      track: isDark ? '#404040' : '#e0e0e0',

      // Chart colors
      chartGrid: isDark ? '#404040' : '#f0f0f0',
      
      // Shadow
      shadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 