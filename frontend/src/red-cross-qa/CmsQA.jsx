import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const AREAS = [
  'areaContentTypes','areaPageTemplates','areaLayouts','areaParts','areaFieldSets',
  'areaRoles','areaPreview','areaPublish','areaUnpublish','areaScheduled',
  'areaLocalization','areaMedia','areaBrokenLinks','areaIsr',
];

const ROLES = ['Administrator','Owner','Local Owner','Editor','Local Editor','Contributor'];

const CmsQA = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true); setResult(null);
    try {
      const res = await fetch(`${API}/generate-cms-test-cases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areas: AREAS, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setGenerating(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📝 {t('redCrossWebQaModule.cmsQa.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.cmsQa.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {AREAS.map(a => (
            <div key={a} className="px-3 py-2 rounded-md border border-purple-200 bg-purple-50 text-purple-800 text-sm">
              {t(`redCrossWebQaModule.cmsQa.${a}`)}
            </div>
          ))}
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50">
          {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.cmsQa.btnGenerate')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">{t('redCrossWebQaModule.cmsQa.rolesTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <span key={r} className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">{r}</span>
          ))}
        </div>
      </div>

      {result && result.status === 'ok' && Array.isArray(result.test_cases) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Generated test cases ({result.test_cases.length})</h3>
          <div className="space-y-2">
            {result.test_cases.map((tc, i) => (
              <div key={i} className="p-3 rounded-md border border-gray-100 text-sm">
                <strong className="text-gray-800">{tc.title}</strong>
                <p className="text-gray-600 mt-1">{tc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsQA;
