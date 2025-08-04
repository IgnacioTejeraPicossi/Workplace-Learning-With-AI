import React from 'react';
import { useTheme } from './ThemeContext';

const ProgressCard = ({ 
  title, 
  value, 
  total, 
  icon, 
  color = "#2236a8", 
  backgroundColor = "#f0f4ff",
  showProgress = true 
}) => {
  const { colors, isDark } = useTheme();
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const cardBg = colors.cardBackground;
  const borderCol = isDark ? colors.border : backgroundColor;
  const textCol = colors.text;
  const secondaryCol = colors.textSecondary;

  return (
    <div style={{
      background: cardBg,
      borderRadius: 12,
      padding: 20,
      boxShadow: colors.shadow,
      border: `1px solid ${borderCol}`,
      minWidth: 200,
      flex: 1
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 16
      }}>
        <div style={{
          background: backgroundColor,
          color: color,
          borderRadius: 8,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          marginRight: 12
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: textCol
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: secondaryCol,
            marginTop: 2
          }}>
            {value} of {total}
          </p>
        </div>
      </div>
      
      {showProgress && (
        <div style={{
          background: isDark ? colors.border : "#f0f0f0",
          borderRadius: 8,
          height: 8,
          overflow: "hidden",
          marginTop: 8
        }}>
          <div style={{
            background: color,
            height: "100%",
            width: `${percentage}%`,
            borderRadius: 8,
            transition: "width 0.3s ease"
          }} />
        </div>
      )}
      
      <div style={{
        marginTop: 8,
        fontSize: 12,
        color: secondaryCol,
        fontWeight: 500
      }}>
        {percentage}% complete
      </div>
    </div>
  );
};

export default ProgressCard; 