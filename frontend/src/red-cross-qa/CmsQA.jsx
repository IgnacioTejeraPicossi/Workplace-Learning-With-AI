import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

const AREAS = [
  { key: 'areaContentTypes', icon: '📦' }, { key: 'areaPageTemplates', icon: '🧱' },
  { key: 'areaLayouts',      icon: '🗂️' }, { key: 'areaParts',         icon: '🧩' },
  { key: 'areaFieldSets',    icon: '🗃️' }, { key: 'areaRoles',         icon: '👥' },
  { key: 'areaPreview',      icon: '👁️' }, { key: 'areaPublish',       icon: '🚀' },
  { key: 'areaUnpublish',    icon: '🗑️' }, { key: 'areaScheduled',     icon: '⏰' },
  { key: 'areaLocalization', icon: '🌍' }, { key: 'areaMedia',         icon: '🖼️' },
  { key: 'areaBrokenLinks',  icon: '🔗' }, { key: 'areaIsr',           icon: '🔄' },
];

const ROLE_COLORS = {
  Administrator: '#7c3aed', Owner: '#dc2626', 'Local Owner': '#ea580c',
  Editor: '#2563eb', 'Local Editor': '#0891b2', Contributor: '#10b981',
};
const ROLES = Object.keys(ROLE_COLORS);

const CmsQA = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true); setResult(null);
    try {
      const res = await fetch(`${API}/generate-cms-test-cases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areas: AREAS.map(a => a.key), environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="📝"
          title={t('redCrossWebQaModule.cmsQa.header')}
          subtitle={t('redCrossWebQaModule.cmsQa.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #6b21a8 0%, #7c3aed 50%, #4338ca 100%)"
        />

        <AiUsagePolicy variant="compact" />

        <div style={panel}>
          <h3 style={panelTitle}>🎯 Editorial coverage</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 18 }}>
            {AREAS.map(a => (
              <div key={a.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 10,
                backgroundColor: '#faf5ff', border: '1px solid #e9d5ff',
                color: '#7c3aed', fontSize: 13, fontWeight: 500,
              }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                {t(`redCrossWebQaModule.cmsQa.${a.key}`)}
              </div>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={generating} style={primaryBtn(generating)}>
            {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.cmsQa.btnGenerate')}
          </button>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>👥 {t('redCrossWebQaModule.cmsQa.rolesTitle')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map(r => (
              <span key={r} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                backgroundColor: `${ROLE_COLORS[r]}15`, color: ROLE_COLORS[r],
                border: `1px solid ${ROLE_COLORS[r]}40`,
              }}>{r}</span>
            ))}
          </div>
        </div>

        {result?.status === 'ok' && Array.isArray(result.test_cases) && result.test_cases.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>📋 Generated test cases <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({result.test_cases.length})</span></h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {result.test_cases.map((tc, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                }}>
                  <strong style={{ fontSize: 13, color: '#1e293b' }}>{tc.title}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{tc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#c4b5fd' : '#7c3aed', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});

export default CmsQA;
