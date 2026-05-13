import React from 'react';
import { useTranslation } from 'react-i18next';
import FindingRow from './FindingRow';
import { panel, panelTitle, hint } from '../tokens';

/**
 * Section that wraps a list of FindingRow + a small header showing the
 * filtered count vs total. Stateless — filters live in the parent so they
 * can drive sibling panels (e.g. the check grid) at the same time.
 */
export default function FindingsList({ findings, totalCount, onFindingPatched }) {
  const { t } = useTranslation();
  const filtered = (findings || []).length;
  return (
    <div style={panel}>
      <h3 style={panelTitle}>
        🐞 {t('redCrossWebQaModule.securityPrivacy.findingsSectionTitle')}
        {' '}<span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
          ({filtered}{typeof totalCount === 'number' && totalCount !== filtered ? ` / ${totalCount}` : ''})
        </span>
      </h3>
      {(!findings || findings.length === 0) ? (
        <p style={hint}>{t('redCrossWebQaModule.securityPrivacy.noFindingsForFilter')}</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {findings.map(f => (
            <FindingRow key={f.id} finding={f} onPatched={onFindingPatched} />
          ))}
        </div>
      )}
    </div>
  );
}
