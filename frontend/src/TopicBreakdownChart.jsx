import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from './ThemeContext';
import { useTranslation } from 'react-i18next';
import { buildCategoryTreemap } from './utils/topicCategories';

const TopicTooltip = ({ active, payload, colors }) => {
  if (!active || !payload || payload.length === 0) return null;
  const node = payload[0].payload;
  if (!node || !node.rawName) return null;

  const topics = node.topics || [];
  const top = topics.slice(0, 6);

  return (
    <div
      style={{
        background: colors.cardBackground,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '0.8rem',
        maxWidth: 260,
        boxShadow: colors.shadow,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: node.fill, display: 'inline-block' }} />
        {node.name} — {node.value}
      </div>
      {top.map((tp) => (
        <div key={tp.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.name}</span>
          <span style={{ opacity: 0.7 }}>{tp.value}</span>
        </div>
      ))}
      {topics.length > top.length && (
        <div style={{ opacity: 0.6, marginTop: 4 }}>+{topics.length - top.length}…</div>
      )}
    </div>
  );
};

const TopicBreakdownChart = ({ data }) => {
  const { colors } = useTheme();
  const { t } = useTranslation('common');

  if (!data || data.length === 0) {
    return (
      <div style={{ background: colors.cardBackground, borderRadius: 12, boxShadow: colors.shadow, padding: 24, marginBottom: 24, color: colors.text }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: colors.text }}>{t('dashboard.lessonsByTopic')}</h3>
        <div style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px 20px' }}>
          {t('dashboard.lessonsByTopicEmpty')}
        </div>
      </div>
    );
  }

  const pieData = buildCategoryTreemap(data, t);

  return (
    <div style={{
      background: colors.cardBackground,
      borderRadius: 12,
      boxShadow: colors.shadow,
      padding: 16,
      marginBottom: 24,
      color: colors.text,
      width: '100%',
      boxSizing: 'border-box',
      maxWidth: '100%',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, color: colors.text, fontSize: '1.1rem' }}>{t('dashboard.lessonsByTopic')}</h3>
      <div style={{ width: '100%', height: 250, minWidth: 0, maxWidth: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              innerRadius={42}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              isAnimationActive={false}
            >
              {pieData.map((entry) => (
                <Cell key={entry.rawName} fill={entry.fill} stroke={colors.cardBackground} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<TopicTooltip colors={colors} />} />
            <Legend wrapperStyle={{ color: colors.text, fontSize: '0.8rem' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopicBreakdownChart;
