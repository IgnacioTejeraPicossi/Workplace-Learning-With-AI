import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { securityApi } from '../api';
import { ghostBtn } from '../tokens';

/**
 * Pack 3 export controls. Renders inline alongside the "Run scan" button.
 *
 * Today: Markdown export (snapshot + findings by severity + tally +
 * history + DPIA snapshot). The frontend creates a Blob URL on the
 * client and triggers a download — no server file system involvement.
 *
 * Optional sprint-name field lets the report carry a meaningful title
 * (e.g. "Sprint 12 — final QA review") which surfaces in the markdown
 * H1 and filename.
 */
export default function ExportButtons({ environment }) {
  const { t, i18n } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [sprintName, setSprintName] = useState('');

  const exportMarkdown = async () => {
    setExporting(true); setError(null);
    try {
      const res = await securityApi.exportMarkdown({
        environment,
        includeDpia: true,
        includeHistory: true,
        sprintName: sprintName || null,
        lang: i18n.language,
      });
      // Trigger browser download via Blob URL.
      const blob = new Blob([res.markdown || ''], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || `sikkerhet-personvern-${environment}.md`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input
        value={sprintName}
        onChange={(e) => setSprintName(e.target.value)}
        placeholder={t('redCrossWebQaModule.securityPrivacy.exportSprintPlaceholder')}
        style={{
          padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
          fontSize: 12, fontFamily: 'inherit', width: 200,
        }}
      />
      <button onClick={exportMarkdown} disabled={exporting} style={ghostBtn('#0d9488')}>
        {exporting ? t('redCrossWebQaModule.common.running')
                    : `📥 ${t('redCrossWebQaModule.securityPrivacy.exportMarkdownBtn')}`}
      </button>
      {error && (
        <span style={{
          fontSize: 11, color: '#b91c1c', padding: '4px 8px',
          backgroundColor: '#fef2f2', borderRadius: 4, border: '1px solid #fecaca',
        }}>{error}</span>
      )}
    </div>
  );
}
