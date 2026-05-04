import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  'checkKeyboard','checkFocusOrder','checkSkipLinks','checkAriaMisuse',
  'checkHeadings','checkColorContrast','checkFormLabels','checkErrorMessages',
  'checkScreenReader','checkDialogs','checkAltText','checkContentClarity',
];

const Accessibility = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('https://www.rodekors.no/');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-accessibility-check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  const score = report?.wcag_score ?? null;
  const scoreCls = score === null ? 'text-gray-400'
                 : score >= 95 ? 'text-green-600'
                 : score >= 80 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">♿ {t('redCrossWebQaModule.accessibility.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.accessibility.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input value={url} onChange={e => setUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="https://www.rodekors.no/" />
          <button onClick={handleRun} disabled={running}
            className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 disabled:opacity-50">
            {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.accessibility.btnRun')}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CHECKS.map(c => {
            const status = report?.checks?.[c] || 'pending';
            const cls = status === 'pass' ? 'border-green-200 bg-green-50 text-green-700'
                     : status === 'fail' ? 'border-red-200 bg-red-50 text-red-700'
                     : status === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-700'
                     : 'border-gray-200 bg-gray-50 text-gray-500';
            return (
              <div key={c} className={`px-3 py-2 rounded-md border text-sm ${cls}`}>
                {t(`redCrossWebQaModule.accessibility.${c}`)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-xs text-gray-500 mb-2">{t('redCrossWebQaModule.accessibility.wcagScore')}</p>
          <p className={`text-4xl font-bold ${scoreCls}`}>{score === null ? '—' : `${score}`}</p>
        </div>
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">{t('redCrossWebQaModule.accessibility.violations')} ({(report?.violations || []).length})</h3>
          {(!report?.violations || report.violations.length === 0) && (
            <p className="text-sm text-gray-400">{t('redCrossWebQaModule.common.noData')}</p>
          )}
          <ul className="text-sm text-gray-700 space-y-1">
            {(report?.violations || []).map((v, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.severity === 'critical' ? 'bg-red-100 text-red-700' : v.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{v.severity}</span>
                <span>{v.message || v.rule || JSON.stringify(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {report && report.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{report.message}</div>
      )}
    </div>
  );
};

export default Accessibility;
