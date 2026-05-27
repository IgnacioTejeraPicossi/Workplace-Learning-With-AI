import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from '../_PageHero';
import { securityApi } from './api';
import { panel, panelTitle, hint, primaryBtn, errorBox, formatTimestamp, STATUS_STYLES } from './tokens';
import SecurityCheckCard from './components/SecurityCheckCard';
import SecurityCheckDetailPanel from './components/SecurityCheckDetailPanel';
import FindingsList from './components/FindingsList';
import ScanHistoryPanel from './components/ScanHistoryPanel';
import DpiaChecklistPanel from './components/DpiaChecklistPanel';
import StatusFilters from './components/StatusFilters';
// Pack 3 panels
import ExportButtons from './components/ExportButtons';
import ScanDiffPanel from './components/ScanDiffPanel';
import EnvironmentMatrix from './components/EnvironmentMatrix';

/**
 * Phase H · Pack 2 — Sikkerhet og personvern workbench.
 *
 * Orchestrates:
 *   - dashboard snapshot (top stat cards)
 *   - filterable check grid (clickable cards → detail panel)
 *   - findings list (status-aware, filterable)
 *   - scan history (last N runs, trend arrows)
 *   - DPIA checklist (editable structured form)
 *
 * All state lives here; child components are presentational + emit events
 * back up. This keeps cross-panel filtering coherent (e.g. clicking a
 * finding focuses the related check, switching filters updates both lists).
 */
export default function SecurityPrivacyTab({ environment, setEnvironment }) {
  const { t, i18n } = useTranslation();

  // Snapshot + base data
  const [status, setStatus] = useState(null);
  const [checks, setChecks] = useState([]);
  const [findings, setFindings] = useState([]);
  const [history, setHistory] = useState([]);

  // UI state
  const [activeCheckId, setActiveCheckId] = useState(null);
  const [activeCheckDetail, setActiveCheckDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  // Filters (shared across check grid + findings list)
  const [filters, setFilters] = useState({
    checkStatus: '',
    scanType: '',
    category: '',
    findingStatus: '',
    severity: '',
  });

  // ── Load initial data on mount + env change ──────────────────────────
  const refreshAll = async () => {
    setLoading(true); setError(null);
    try {
      const [s, ch, fi, hi] = await Promise.all([
        securityApi.status(environment),
        securityApi.checks(environment, i18n.language),
        securityApi.findings({ limit: 200 }),
        securityApi.history({ limit: 5, environment }),
      ]);
      setStatus(s);
      setChecks(ch.items || []);
      setFindings(fi.items || []);
      setHistory(hi.items || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  // refreshAll depends on `environment` + `i18n.language` (which are the
  // deps below) but ESLint cannot see that. Suppressing the warning is
  // safe — re-creating refreshAll on every render would otherwise
  // re-fire this effect on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refreshAll(); }, [environment, i18n.language]);

  // ── Filtered slices ──────────────────────────────────────────────────
  const filteredChecks = useMemo(() => {
    return (checks || []).filter(c => {
      if (filters.checkStatus && c.status !== filters.checkStatus) return false;
      if (filters.scanType && c.scan_type !== filters.scanType) return false;
      if (filters.category && c.category !== filters.category) return false;
      return true;
    });
  }, [checks, filters]);

  const filteredFindings = useMemo(() => {
    return (findings || []).filter(f => {
      if (filters.findingStatus && f.status !== filters.findingStatus) return false;
      if (filters.severity && f.severity !== filters.severity) return false;
      return true;
    });
  }, [findings, filters]);

  // ── Click on a check card → load full detail (with findings_detail) ──
  const openCheck = async (check) => {
    setActiveCheckId(check.id);
    setActiveCheckDetail(null);
    setDetailLoading(true); setDetailError(null);
    try {
      const detail = await securityApi.checkDetail(check.id, environment, i18n.language);
      setActiveCheckDetail(detail);
    } catch (e) {
      setDetailError(String(e.message || e));
    } finally {
      setDetailLoading(false);
    }
  };

  // After a PATCH succeeds on a finding, update the top-level findings list
  // AND, if the finding belongs to the currently open detail panel, update
  // the panel too. This avoids a full refresh on every status click.
  const onFindingPatched = (updated) => {
    setFindings(list => list.map(f => f.id === updated.id ? updated : f));
    setActiveCheckDetail(detail => {
      if (!detail) return detail;
      const idx = (detail.findings_detail || []).findIndex(f => f.id === updated.id);
      if (idx < 0) return detail;
      const next = [...detail.findings_detail];
      next[idx] = updated;
      return { ...detail, findings_detail: next };
    });
    // Snapshot's open_findings count may have changed; refresh lightly.
    securityApi.status(environment).then(setStatus).catch(() => {});
  };

  // ── Trigger a new scan ───────────────────────────────────────────────
  const runScan = async () => {
    setScanning(true); setError(null);
    try {
      const res = await securityApi.scan({
        environment, lang: i18n.language,
        actor: 'workshop-host', trigger: 'manual',
      });
      // Optimistic update from the scan response.
      setChecks(res.checks || []);
      setFindings(res.findings || []);
      setStatus(res.snapshot || null);
      // Refresh history separately (the scan response doesn't include it).
      const hi = await securityApi.history({ limit: 5, environment });
      setHistory(hi.items || []);
      // If a detail panel was open, refresh it too.
      if (activeCheckId) await openCheck({ id: activeCheckId });
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setScanning(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 20 }}>
        <PageHero
          icon="🛡️"
          title={t('redCrossWebQaModule.securityPrivacy.header')}
          subtitle={t('redCrossWebQaModule.securityPrivacy.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)"
        />

        {/* Top: snapshot + scan button + Pack 3 export buttons */}
        <SnapshotPanel
          status={status}
          onScan={runScan}
          scanning={scanning}
          loading={loading}
          environment={environment}
        />

        {/* Pack 3 — environment matrix (governance dashboard) */}
        <EnvironmentMatrix
          currentEnv={environment}
          onPickEnvironment={setEnvironment}
        />

        {error && <div style={errorBox}>{error}</div>}

        {/* Filters bar */}
        <StatusFilters
          checkStatus={filters.checkStatus}
          onCheckStatus={(v) => setFilters(f => ({ ...f, checkStatus: v }))}
          scanType={filters.scanType}
          onScanType={(v) => setFilters(f => ({ ...f, scanType: v }))}
          category={filters.category}
          onCategory={(v) => setFilters(f => ({ ...f, category: v }))}
          findingStatus={filters.findingStatus}
          onFindingStatus={(v) => setFilters(f => ({ ...f, findingStatus: v }))}
          severity={filters.severity}
          onSeverity={(v) => setFilters(f => ({ ...f, severity: v }))}
        />

        {/* Check grid */}
        <div style={panel}>
          <h3 style={panelTitle}>
            🛡️ {t('redCrossWebQaModule.securityPrivacy.checksTitle')}
            {' '}<span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
              ({filteredChecks.length}{filteredChecks.length !== checks.length ? ` / ${checks.length}` : ''})
            </span>
          </h3>
          <p style={hint}>{t('redCrossWebQaModule.securityPrivacy.checksHint')}</p>
          {filteredChecks.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
              {t('redCrossWebQaModule.securityPrivacy.noChecksForFilter')}
            </p>
          ) : (
            <div style={{
              display: 'grid', gap: 10,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}>
              {filteredChecks.map(c => (
                <SecurityCheckCard
                  key={c.id}
                  check={c}
                  active={activeCheckId === c.id}
                  onClick={openCheck}
                />
              ))}
            </div>
          )}
        </div>

        {/* Active check detail */}
        {(activeCheckDetail || detailLoading || detailError) && (
          <SecurityCheckDetailPanel
            check={activeCheckDetail}
            loading={detailLoading}
            error={detailError}
            onClose={() => {
              setActiveCheckId(null);
              setActiveCheckDetail(null);
              setDetailError(null);
            }}
            onFindingPatched={onFindingPatched}
          />
        )}

        {/* Findings list (filtered) */}
        <FindingsList
          findings={filteredFindings}
          totalCount={findings.length}
          onFindingPatched={onFindingPatched}
        />

        {/* History */}
        <ScanHistoryPanel history={history} />

        {/* Pack 3 — diff between two scan runs */}
        <ScanDiffPanel history={history} environment={environment} />

        {/* DPIA */}
        <DpiaChecklistPanel />
      </div>
    </div>
  );
}

function SnapshotPanel({ status, onScan, scanning, loading, environment }) {
  const { t } = useTranslation();
  const overall = status?.overall_status || 'pending';
  const overallStyle = STATUS_STYLES[overall] || STATUS_STYLES.pending;

  return (
    <div style={panel}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 14, marginBottom: 12,
      }}>
        <div>
          <h3 style={{ ...panelTitle, margin: 0 }}>
            🩺 {t('redCrossWebQaModule.securityPrivacy.snapshotTitle')}
          </h3>
          <p style={{ ...hint, margin: '4px 0 0' }}>
            {status?.last_scan_at
              ? `${t('redCrossWebQaModule.securityPrivacy.lastScanAt')}: ${formatTimestamp(status.last_scan_at)}`
              : t('redCrossWebQaModule.securityPrivacy.noScanYet')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
            backgroundColor: overallStyle.bg, color: overallStyle.fg,
            border: `1px solid ${overallStyle.border}`, letterSpacing: 0.4,
          }}>
            {t('redCrossWebQaModule.securityPrivacy.overall')}: {overallStyle.label}
          </span>
          {/* Pack 3 — Markdown export controls */}
          <ExportButtons environment={environment} />
          <button onClick={onScan} disabled={scanning || loading}
                   style={primaryBtn(scanning || loading, '#334155')}>
            {scanning
              ? `🔄 ${t('redCrossWebQaModule.common.running')}`
              : `▶️ ${t('redCrossWebQaModule.securityPrivacy.runScan')}`}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <SnapshotStat label={t('redCrossWebQaModule.securityPrivacy.statTotal')}    value={status?.total_checks ?? 0} color="#1e293b" />
        <SnapshotStat label={t('redCrossWebQaModule.common.statusPass').toUpperCase()} value={status?.pass_count ?? 0} color="#047857" />
        <SnapshotStat label={t('redCrossWebQaModule.common.statusWarn').toUpperCase()} value={status?.warn_count ?? 0} color="#92400e" />
        <SnapshotStat label={t('redCrossWebQaModule.common.statusFail').toUpperCase()} value={status?.fail_count ?? 0} color="#b91c1c" />
        <SnapshotStat label={t('redCrossWebQaModule.securityPrivacy.statOpenFindings')} value={status?.open_findings ?? 0} color="#dc2626" />
      </div>
    </div>
  );
}

function SnapshotStat({ label, value, color }) {
  return (
    <div style={{
      padding: 14, borderRadius: 10,
      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
