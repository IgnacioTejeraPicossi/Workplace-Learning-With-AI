/**
 * HumanitasBadge — drop-in indicator that a piece of AI output has passed
 * through (or been evaluated by) the Humanizing AI gateway filter.
 *
 * Designed so any module in WLWAI can show ethical-review status next to a
 * response with one line of JSX. Pass either:
 *
 *   <HumanitasBadge filterResult={result} />           // auto-derive state
 *   <HumanitasBadge state="reviewed" score={85} />     // explicit props
 *
 * The component is i18n-aware (EN/ES/NO) and falls back to English when keys
 * are missing.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

const STATES = {
  reviewed: { color: '#059669', light: '#d1fae5', border: '#6ee7b7', icon: '✓' },
  enhanced: { color: '#4f46e5', light: '#eef2ff', border: '#c7d2fe', icon: '✎' },
  audited:  { color: '#6b7280', light: '#f3f4f6', border: '#d1d5db', icon: '👁' },
  warning:  { color: '#dc2626', light: '#fef2f2', border: '#fecaca', icon: '⚠' },
};

const SIZE = {
  sm: { font: 10, pad: '3px 8px',  iconSize: 11 },
  md: { font: 11, pad: '4px 10px', iconSize: 12 },
  lg: { font: 13, pad: '6px 14px', iconSize: 14 },
};

/** Derive {state, score, originalScore, threshold, mode, moduleId, isMock} from
 *  a /filter response object. Exported so callers can build their own UI on top
 *  if the badge isn't quite right.                                              */
export const filterResultToBadgeProps = (r) => {
  if (!r) return null;
  const score = r.humanitas_score;
  let state;
  if (r.mode === 'audit') state = 'audited';
  else if (r.was_modified) state = 'enhanced';
  else if (score != null && score < 40) state = 'warning';
  else state = 'reviewed';
  return {
    state,
    score,
    originalScore: r.was_modified ? r.humanitas_score : null,
    threshold:     r.threshold,
    mode:          r.mode,
    moduleId:      r.module_id,
    isMock:        r.is_mock,
    promptVersion: r.prompt_version,
  };
};

const HumanitasBadge = ({
  // Either pass the full /filter response...
  filterResult = null,
  // ...or pass explicit props:
  state    = 'reviewed',
  score    = null,
  originalScore = null,
  threshold = null,
  mode     = null,
  moduleId = null,
  isMock   = false,
  promptVersion = null,
  // Layout
  size       = 'md',
  showScore  = true,
  showLabel  = true,
}) => {
  const { t } = useTranslation();

  const derived = filterResult ? filterResultToBadgeProps(filterResult) : null;
  const s   = derived?.state         ?? state;
  const sc  = derived?.score         ?? score;
  const orig= derived?.originalScore ?? originalScore;
  const th  = derived?.threshold     ?? threshold;
  const md  = derived?.mode          ?? mode;
  const mid = derived?.moduleId      ?? moduleId;
  const mock= derived?.isMock        ?? isMock;
  const pv  = derived?.promptVersion ?? promptVersion;

  const palette = STATES[s] || STATES.reviewed;
  const sz      = SIZE[size] || SIZE.md;
  const label   = t(`humanizingAiModule.badge.${s}`, { defaultValue: s });

  // Tooltip composition
  const tooltipParts = [];
  if (sc != null)  tooltipParts.push(`${t('humanizingAiModule.badge.tooltipScore', { defaultValue: 'Score' })}: ${sc}${sc <= 15 ? '/15' : '/100'}`);
  if (orig != null && s === 'enhanced')
                   tooltipParts.push(`${t('humanizingAiModule.badge.tooltipOriginal', { defaultValue: 'was' })} ${orig} → ${sc}`);
  if (md)          tooltipParts.push(`${t('humanizingAiModule.badge.tooltipMode',  { defaultValue: 'Mode' })}: ${md}`);
  if (th != null)  tooltipParts.push(`${t('humanizingAiModule.badge.tooltipThreshold', { defaultValue: 'Threshold' })}: ${th}`);
  if (mid)         tooltipParts.push(`${t('humanizingAiModule.badge.tooltipModule', { defaultValue: 'Module' })}: ${mid}`);
  if (mock)        tooltipParts.push(`⚠ ${t('humanizingAiModule.badge.tooltipMock', { defaultValue: 'Mock evaluation' })}`);
  if (pv)          tooltipParts.push(`Prompt v${pv}`);
  const tooltip = tooltipParts.join(' · ');

  return (
    <span
      title={tooltip || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: palette.light,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        borderRadius: 999,
        padding: sz.pad,
        fontSize: sz.font,
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        verticalAlign: 'middle',
      }}
    >
      <span style={{ fontSize: sz.iconSize, lineHeight: 1 }}>{palette.icon}</span>
      {showLabel && <span>{label}</span>}
      {showScore && sc != null && (
        <span style={{ fontFamily: 'monospace', opacity: 0.85 }}>
          · {s === 'enhanced' && orig != null ? `${orig}→${sc}` : sc}{sc <= 15 ? '/15' : '/100'}
        </span>
      )}
      {mock && (
        <span style={{
          fontSize: sz.font - 1, background: '#fef3c7', color: '#92400e',
          borderRadius: 4, padding: '0 4px', marginLeft: 2,
        }}>MOCK</span>
      )}
    </span>
  );
};

export default HumanitasBadge;
