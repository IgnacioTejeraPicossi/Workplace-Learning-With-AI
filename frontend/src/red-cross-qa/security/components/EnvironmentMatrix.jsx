import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { securityApi } from '../api';
import { panel, panelTitle, hint, ghostBtn, STATUS_STYLES, formatTimestamp, errorBox } from '../tokens';

/**
 * Pack 3 — environment matrix.
 *
 * Compact 4-column governance view showing the most recent snapshot per
 * environment (local / test / staging / prod). Each column carries:
 *   - status pill (PASS/WARN/FAIL/PENDING)
 *   - stat counts (pass/warn/fail/open findings)
 *   - last scan timestamp
 *   - DPIA presence indicator
 *
 * Clicking a column emits `onPickEnvironment(env)` so the parent can
 * switch the active environment for the rest of the workbench.
 */
const ENV_META = {
  local:   { icon: '💻', label: 'Local',   color: '#64748b' },
  test:    { icon: '🧪', label: 'Test',    color: '#0891b2' },
  staging: { icon: '🚦', label: 'Staging', color: '#a16207' },
  prod:    { icon: '🚀', label: 'Prod',    color: '#b91c1c' },
};

export default function EnvironmentMatrix({ currentEnv, onPickEnvironment }) {
  const { t } = useTranslation();
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await securityApi.environments();
      setMatrix(res);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = matrix?.environments || [];
  const worst = matrix?.worst_overall || 'pending';
  const worstStyle = STATUS_STYLES[worst] || STATUS_STYLES.pending;

  return (
    <div style={{ ...panel, borderTop: '4px solid #0d9488' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 6,
      }}>
        <h3 style={{ ...panelTitle, margin: 0 }}>
          🌐 {t('redCrossWebQaModule.securityPrivacy.envMatrixTitle')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            backgroundColor: worstStyle.bg, color: worstStyle.fg,
            border: `1px solid ${worstStyle.border}`, letterSpacing: 0.4,
          }}>
            {t('redCrossWebQaModule.securityPrivacy.envMatrixWorst')}: {worstStyle.label}
          </span>
          <button onClick={load} disabled={loading} style={ghostBtn('#0d9488')}>
            🔄 {t('redCrossWebQaModule.securityPrivacy.envMatrixRefresh')}
          </button>
        </div>
      </div>
      <p style={hint}>{t('redCrossWebQaModule.securityPrivacy.envMatrixHint')}</p>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10,
      }}>
        {rows.map(row => {
          const meta = ENV_META[row.environment] || { icon: '🌍', label: row.environment, color: '#64748b' };
          const st = STATUS_STYLES[row.overall_status] || STATUS_STYLES.pending;
          const active = row.environment === currentEnv;
          return (
            <button
              key={row.environment}
              type="button"
              onClick={() => onPickEnvironment && onPickEnvironment(row.environment)}
              style={{
                textAlign: 'left', cursor: 'pointer',
                padding: 12, borderRadius: 10,
                backgroundColor: active ? `${meta.color}15` : '#f8fafc',
                border: `1px solid ${active ? meta.color : '#e2e8f0'}`,
                boxShadow: active ? `0 0 0 3px ${meta.color}25` : 'none',
                transition: 'all 0.15s',
              }}
              title={t('redCrossWebQaModule.securityPrivacy.envMatrixPickHint',
                         { defaultValue: 'Switch to this environment' })}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{meta.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: meta.color, letterSpacing: 0.4 }}>
                    {meta.label}
                  </span>
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  backgroundColor: st.bg, color: st.fg,
                  border: `1px solid ${st.border}`, letterSpacing: 0.4,
                }}>{st.label}</span>
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                <Stat label="P" value={row.pass_count || 0} fg="#047857" />
                <Stat label="W" value={row.warn_count || 0} fg="#92400e" />
                <Stat label="F" value={row.fail_count || 0} fg="#b91c1c" />
                <Stat label="OF" value={row.open_findings || 0} fg="#dc2626"
                       title={t('redCrossWebQaModule.securityPrivacy.statOpenFindings')} />
              </div>

              <div style={{ fontSize: 10, color: '#64748b' }}>
                {row.last_scan_at
                  ? <>🕒 {formatTimestamp(row.last_scan_at)}</>
                  : <span style={{ fontStyle: 'italic' }}>{t('redCrossWebQaModule.securityPrivacy.noScanYet')}</span>}
              </div>
              {row.dpia_present && (
                <div style={{ marginTop: 4, fontSize: 10, color: '#6b21a8', fontWeight: 600 }}>
                  ⚖️ DPIA
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, fg, title }) {
  return (
    <span title={title}
          style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            backgroundColor: 'white', color: fg, border: '1px solid #e2e8f0',
            whiteSpace: 'nowrap',
          }}>
      {label} {value}
    </span>
  );
}
