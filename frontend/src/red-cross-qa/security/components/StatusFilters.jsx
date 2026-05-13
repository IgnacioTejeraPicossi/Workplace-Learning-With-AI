import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  STATUS_STYLES, SCAN_TYPE_STYLES, CATEGORY_STYLES, FINDING_STATUS_STYLES,
} from '../tokens';

/**
 * Composite filter bar used in two contexts:
 *  - filtering the SecurityCheckCard grid (status + scan_type + category)
 *  - filtering the FindingsList (finding_status + severity)
 *
 * The component renders both axes and the parent decides which slice of
 * the state object to consume (e.g. ignore `findingStatus` when filtering
 * checks). Keeping the bar unified prevents drift between the two slices.
 */
export default function StatusFilters({
  // Check filters
  checkStatus, onCheckStatus,
  scanType, onScanType,
  category, onCategory,
  // Finding filters
  findingStatus, onFindingStatus,
  severity, onSeverity,
  // Visibility
  showCheckFilters = true,
  showFindingFilters = true,
}) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center',
      padding: '10px 14px', borderRadius: 10,
      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    }}>
      {showCheckFilters && (
        <>
          <FilterGroup
            label={t('redCrossWebQaModule.securityPrivacy.filterStatus')}
            value={checkStatus}
            onChange={onCheckStatus}
            options={[
              { val: '',     label: t('redCrossWebQaModule.securityPrivacy.filterAll') },
              { val: 'pass', label: STATUS_STYLES.pass.label, color: STATUS_STYLES.pass.fg },
              { val: 'warn', label: STATUS_STYLES.warn.label, color: STATUS_STYLES.warn.fg },
              { val: 'fail', label: STATUS_STYLES.fail.label, color: STATUS_STYLES.fail.fg },
            ]}
          />
          <FilterGroup
            label={t('redCrossWebQaModule.securityPrivacy.filterScanType')}
            value={scanType}
            onChange={onScanType}
            options={[
              { val: '', label: t('redCrossWebQaModule.securityPrivacy.filterAll') },
              { val: 'automatic',      label: `${SCAN_TYPE_STYLES.automatic.icon} ${t('redCrossWebQaModule.securityPrivacy.scanType_automatic')}`,      color: SCAN_TYPE_STYLES.automatic.color },
              { val: 'semi-automatic', label: `${SCAN_TYPE_STYLES['semi-automatic'].icon} ${t('redCrossWebQaModule.securityPrivacy.scanType_semi_automatic')}`, color: SCAN_TYPE_STYLES['semi-automatic'].color },
              { val: 'manual',         label: `${SCAN_TYPE_STYLES.manual.icon} ${t('redCrossWebQaModule.securityPrivacy.scanType_manual')}`,         color: SCAN_TYPE_STYLES.manual.color },
            ]}
          />
          <FilterGroup
            label={t('redCrossWebQaModule.securityPrivacy.filterCategory')}
            value={category}
            onChange={onCategory}
            options={[
              { val: '', label: t('redCrossWebQaModule.securityPrivacy.filterAll') },
              { val: 'security', label: `${CATEGORY_STYLES.security.icon} ${t('redCrossWebQaModule.securityPrivacy.category_security')}` },
              { val: 'privacy',  label: `${CATEGORY_STYLES.privacy.icon} ${t('redCrossWebQaModule.securityPrivacy.category_privacy')}` },
              { val: 'dpia',     label: `${CATEGORY_STYLES.dpia.icon} ${t('redCrossWebQaModule.securityPrivacy.category_dpia')}` },
            ]}
          />
        </>
      )}
      {showFindingFilters && (
        <>
          <FilterGroup
            label={t('redCrossWebQaModule.securityPrivacy.filterFindingStatus')}
            value={findingStatus}
            onChange={onFindingStatus}
            options={[
              { val: '', label: t('redCrossWebQaModule.securityPrivacy.filterAll') },
              { val: 'open',          label: t('redCrossWebQaModule.securityPrivacy.findingStatus_open'),          color: FINDING_STATUS_STYLES.open.fg },
              { val: 'accepted_risk', label: t('redCrossWebQaModule.securityPrivacy.findingStatus_accepted_risk'), color: FINDING_STATUS_STYLES.accepted_risk.fg },
              { val: 'fixed',         label: t('redCrossWebQaModule.securityPrivacy.findingStatus_fixed'),         color: FINDING_STATUS_STYLES.fixed.fg },
              { val: 'verified',      label: t('redCrossWebQaModule.securityPrivacy.findingStatus_verified'),      color: FINDING_STATUS_STYLES.verified.fg },
            ]}
          />
          <FilterGroup
            label={t('redCrossWebQaModule.securityPrivacy.filterSeverity')}
            value={severity}
            onChange={onSeverity}
            options={[
              { val: '',         label: t('redCrossWebQaModule.securityPrivacy.filterAll') },
              { val: 'critical', label: 'CRITICAL', color: '#7f1d1d' },
              { val: 'high',     label: 'HIGH',     color: '#b91c1c' },
              { val: 'medium',   label: 'MEDIUM',   color: '#f59e0b' },
              { val: 'low',      label: 'LOW',      color: '#10b981' },
            ]}
          />
        </>
      )}
    </div>
  );
}

function FilterGroup({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#64748b',
        textTransform: 'uppercase', letterSpacing: 0.4,
      }}>{label}:</span>
      {options.map(opt => {
        const active = (value || '') === opt.val;
        return (
          <button
            key={opt.val || 'all'}
            type="button"
            onClick={() => onChange && onChange(opt.val)}
            style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              backgroundColor: active ? (opt.color || '#1e293b') : 'white',
              color: active ? 'white' : (opt.color || '#475569'),
              border: `1px solid ${active ? (opt.color || '#1e293b') : '#cbd5e1'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}
