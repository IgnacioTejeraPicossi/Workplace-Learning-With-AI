import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from './ThemeContext';
import { useTranslation } from 'react-i18next';
import { buildCategoryTreemap } from './utils/topicCategories';

// Tile renderer: draws a colored rectangle per category and labels it when
// there is enough room. Detail per topic is shown in the tooltip on hover.
const CategoryTile = (props) => {
  const { x, y, width, height, name, value, fill, root } = props;
  if (width <= 0 || height <= 0) return null;

  const total = (root && root.value) || 0;
  const pct = total ? Math.round((value / total) * 100) : 0;
  const showName = width > 64 && height > 30;
  const showMeta = width > 64 && height > 48;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
        rx={4}
        ry={4}
      />
      {showName && (
        <text
          x={x + 8}
          y={y + 20}
          fill="#ffffff"
          fontSize={13}
          fontWeight={700}
          style={{ pointerEvents: 'none' }}
        >
          {name}
        </text>
      )}
      {showMeta && (
        <text
          x={x + 8}
          y={y + 38}
          fill="#ffffff"
          fontSize={11}
          opacity={0.9}
          style={{ pointerEvents: 'none' }}
        >
          {value} · {pct}%
        </text>
      )}
    </g>
  );
};

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

  const treemapData = buildCategoryTreemap(data, t);

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
          <Treemap
            data={treemapData}
            dataKey="value"
            nameKey="name"
            stroke="#ffffff"
            isAnimationActive={false}
            content={<CategoryTile />}
          >
            <Tooltip content={<TopicTooltip colors={colors} />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopicBreakdownChart;
