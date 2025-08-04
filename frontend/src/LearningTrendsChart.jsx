import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from './ThemeContext';

const LearningTrendsChart = ({ data }) => {
  const { colors } = useTheme();
  return (
    <div style={{ 
      background: colors.cardBackground, 
      borderRadius: 12, 
      boxShadow: colors.shadow, 
      padding: 16, 
      marginBottom: 24, 
      color: colors.text,
      width: "100%",
      boxSizing: "border-box",
      maxWidth: "100%"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.text, fontSize: "1.1rem" }}>Lessons Completed Over Time</h3>
      <div style={{ width: "100%", height: 200, minWidth: 0, maxWidth: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
            <XAxis dataKey="week" stroke={colors.text} tick={{ fill: colors.text, fontSize: 10 }} />
            <YAxis allowDecimals={false} stroke={colors.text} tick={{ fill: colors.text, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: colors.cardBackground, color: colors.text, border: `1px solid ${colors.border}` }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="microLessons" 
              name="Micro-lessons"
              stroke={colors.primary} 
              strokeWidth={2} 
              dot={{ r: 3, fill: colors.primary }} 
            />
            <Line 
              type="monotone" 
              dataKey="videoLessons" 
              name="Video Lessons"
              stroke="#28a745" 
              strokeWidth={2} 
              dot={{ r: 3, fill: "#28a745" }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LearningTrendsChart; 