import React from 'react';
import { useTranslation } from 'react-i18next';
import { panel, panelTitle, hint, formatTimestamp } from '../tokens';

/**
 * Compact history of the last N scan runs.
 *
 * Renders each run as a single row with pass/warn/fail counts as inline
 * stat chips + a small trend arrow comparing fail+warn to the previous
 * run (↓ improvement / ↑ regression / → flat).
 */
export default function ScanHistoryPanel({ history }) {
  const { t } = useTranslation();
  const runs = history || [];

  return (
    <div style={panel}>
      <h3 style={panelTitle}>
        🕒 {t('redCrossWebQaModule.securityPrivacy.historyTitle')}
        {' '}<span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
          ({runs.length})
        </span>
      </h3>
      <p style={hint}>{t('redCrossWebQaModule.securityPrivacy.historyHint')}</p>

      {runs.length === 0 && (
        <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
          {t('redCrossWebQaModule.securityPrivacy.noHistory')}
        </p>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {runs.map((r, i) => {
          // Trend: compare (warn + fail) to the next-older run.
          const olderRun = runs[i + 1];
          const currentIssues = (r.warn_count || 0) + (r.fail_count || 0);
          const olderIssues = olderRun
            ? (olderRun.warn_count || 0) + (olderRun.fail_count || 0)
            : null;
          let trend = null;
          if (olderIssues !== null) {
            if (currentIssues < olderIssues) trend = { icon: '↓', color: '#047857', label: t('redCrossWebQaModule.securityPrivacy.trendImproving') };
            else if (currentIssues > olderIssues) trend = { icon: '↑', color: '#b91c1c', label: t('redCrossWebQaModule.securityPrivacy.trendRegressing') };
            else trend = { icon: '→', color: '#64748b', label: t('redCrossWebQaModule.securityPrivacy.trendFlat') };
          }

          return (
            <div key={r.id} style={{
              padding: '10px 14px', borderRadius: 8,
              backgroundColor: i === 0 ? '#f0fdf4' : '#f8fafc',
              border: '1px solid ' + (i === 0 ? '#86efac' : '#e2e8f0'),
              display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 10,
            }}>
              <code style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 10,
                padding: '2px 7px', borderRadius: 4,
                backgroundColor: 'white', color: '#475569',
                border: '1px solid #cbd5e1',
              }}>{(r.id || '').slice(0, 18)}</code>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                  {formatTimestamp(r.finished_at || r.started_at)}
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  {t('redCrossWebQaModule.common.environment')}: <strong>{r.environment}</strong>
                  {r.trigger && <> · {t('redCrossWebQaModule.securityPrivacy.historyTrigger')}: <strong>{r.trigger}</strong></>}
                  {r.actor && <> · {r.actor}</>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <Stat label={t('redCrossWebQaModule.common.statusPass').toUpperCase()} value={r.pass_count || 0} bg="#dcfce7" fg="#047857" />
                <Stat label={t('redCrossWebQaModule.common.statusWarn').toUpperCase()} value={r.warn_count || 0} bg="#fef3c7" fg="#92400e" />
                <Stat label={t('redCrossWebQaModule.common.statusFail').toUpperCase()} value={r.fail_count || 0} bg="#fee2e2" fg="#b91c1c" />
              </div>

              {trend && (
                <span style={{
                  fontSize: 14, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                  backgroundColor: 'white', border: `1px solid ${trend.color}`,
                  color: trend.color,
                }} title={trend.label}>
                  {trend.icon}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, bg, fg }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
      backgroundColor: bg, color: fg, letterSpacing: 0.4,
      whiteSpace: 'nowrap',
    }}>{label} {value}</span>
  );
}
