import React from 'react';
import { useTranslation } from 'react-i18next';
import { LEVEL_COLORS } from './_tokens';

/**
 * Small pill that renders an epistemic level (established / mainstream /
 * speculative / philosophy / metaphor / unsupported) with the right colour
 * and localized label.
 */
export default function EpistemicBadge({ level }) {
  const { t } = useTranslation();
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.unsupported;
  const label = t(`selfSimReality.overview.levels.${level}`, level);
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      backgroundColor: colors.bg, color: colors.fg,
      border: `1px solid ${colors.border}`,
    }}>{label}</span>
  );
}
