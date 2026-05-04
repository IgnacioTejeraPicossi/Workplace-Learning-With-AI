import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const METRICS = [
  'metricLcp','metricCls','metricInp','metricTtfb','metricBundleSize',
  'metricImageOpt','metricFontLoad','metricServerResp','metricGraphQL','metricCacheHit',
];

const Performance = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-lighthouse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const score = report?.lighthouse_score ?? null;
  const scoreCls = score === null ? 'text-gray-400'
                 : score >= 90 ? 'text-green-600'
                 : score >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚡ {t('redCrossWebQaModule.performance.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.performance.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input value={url} onChange={e => setUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="https://www.rodekors.no/" />
          <button onClick={handleRun} disabled={running}
            className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 disabled:opacity-50">
            {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.performance.btnRunLighthouse')}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {METRICS.map(m => {
            const v = report?.metrics?.[m];
            const status = v?.status || 'pending';
            const cls = status === 'pass' ? 'border-green-200 bg-green-50'
                     : status === 'fail' ? 'border-red-200 bg-red-50'
                     : status === 'warn' ? 'border-amber-200 bg-amber-50'
                     : 'border-gray-200 bg-gray-50';
            return (
              <div key={m} className={`px-3 py-2 rounded-md border text-sm ${cls}`}>
                <div className="text-xs text-gray-500">{t(`redCrossWebQaModule.performance.${m}`)}</div>
                <div className="font-semibold text-gray-800">{v?.value || '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-xs text-gray-500 mb-2">{t('redCrossWebQaModule.performance.lighthouseScore')}</p>
          <p className={`text-4xl font-bold ${scoreCls}`}>{score === null ? '—' : score}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">{t('redCrossWebQaModule.performance.bottlenecks')}</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            {(report?.bottlenecks || []).map((b, i) => <li key={i}>{typeof b === 'string' ? b : b.title || JSON.stringify(b)}</li>)}
            {(!report?.bottlenecks || report.bottlenecks.length === 0) && <li className="list-none text-gray-400">{t('redCrossWebQaModule.common.noData')}</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">{t('redCrossWebQaModule.performance.optimizations')}</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            {(report?.optimizations || []).map((o, i) => <li key={i}>{typeof o === 'string' ? o : o.title || JSON.stringify(o)}</li>)}
            {(!report?.optimizations || report.optimizations.length === 0) && <li className="list-none text-gray-400">{t('redCrossWebQaModule.common.noData')}</li>}
          </ul>
        </div>
      </div>

      {report && report.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{report.message}</div>
      )}
    </div>
  );
};

export default Performance;
