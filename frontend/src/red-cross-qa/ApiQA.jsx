import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  'checkQueryCorrectness','checkPagination','checkFiltering','checkLocalization',
  'checkPreviewVsPublished','checkCaching','checkPerfBudget','checkSchemaDrift',
  'checkRateLimit','checkErrorHandling',
];

const ApiQA = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [endpoint, setEndpoint] = useState('/site/api/graphql');
  const [method, setMethod] = useState('POST');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!endpoint.trim()) return;
    setAnalyzing(true); setReport(null);
    try {
      const res = await fetch(`${API}/analyze-api`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setAnalyzing(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🔌 {t('redCrossWebQaModule.apiQa.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.apiQa.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('redCrossWebQaModule.apiQa.endpoint')}</label>
            <input value={endpoint} onChange={e => setEndpoint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('redCrossWebQaModule.apiQa.method')}</label>
            <select value={method} onChange={e => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleAnalyze} disabled={analyzing}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50">
          {analyzing ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.apiQa.btnAnalyze')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">{t('redCrossWebQaModule.apiQa.checks')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CHECKS.map(c => {
            const status = report?.checks?.[c] || 'pending';
            const cls = status === 'pass' ? 'border-green-200 bg-green-50 text-green-700'
                     : status === 'fail' ? 'border-red-200 bg-red-50 text-red-700'
                     : status === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-700'
                     : 'border-gray-200 bg-gray-50 text-gray-500';
            return (
              <div key={c} className={`px-3 py-2 rounded-md border text-sm ${cls}`}>
                {t(`redCrossWebQaModule.apiQa.${c}`)}
              </div>
            );
          })}
        </div>
      </div>

      {report && report.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{report.message}</div>
      )}
    </div>
  );
};

export default ApiQA;
