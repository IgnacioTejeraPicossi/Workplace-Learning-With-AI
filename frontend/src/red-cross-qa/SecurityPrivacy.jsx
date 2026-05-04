import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const CHECKS = [
  'checkPersonalData','checkDataSeparation','checkAuth','checkHeaders','checkOwasp',
  'checkFormAbuse','checkApiAbuse','checkRateLimit','checkSecrets','checkDeps',
  'checkLogging','checkConsent','checkGdpr',
];

const SecurityPrivacy = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true); setReport(null);
    try {
      const res = await fetch(`${API}/run-security-scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setReport(await res.json());
    } catch { setReport({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🛡️ {t('redCrossWebQaModule.securityPrivacy.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.securityPrivacy.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <button onClick={handleRun} disabled={running}
          className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 disabled:opacity-50 mb-5">
          {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.securityPrivacy.btnRun')}
        </button>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CHECKS.map(c => {
            const item = report?.checks?.[c];
            const status = item?.status || 'pending';
            const cls = status === 'pass' ? 'border-green-200 bg-green-50 text-green-700'
                     : status === 'fail' ? 'border-red-200 bg-red-50 text-red-700'
                     : status === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-700'
                     : 'border-gray-200 bg-gray-50 text-gray-500';
            return (
              <div key={c} className={`px-3 py-2 rounded-md border text-sm ${cls}`}>
                <div className="font-medium">{t(`redCrossWebQaModule.securityPrivacy.${c}`)}</div>
                {item?.note && <div className="text-xs mt-0.5 opacity-80">{item.note}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {report && Array.isArray(report.findings) && report.findings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Findings ({report.findings.length})</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            {report.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${f.severity === 'critical' ? 'bg-red-100 text-red-700' : f.severity === 'high' ? 'bg-orange-100 text-orange-700' : f.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>{f.severity}</span>
                <span>{f.message || f.title || JSON.stringify(f)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report && report.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{report.message}</div>
      )}
    </div>
  );
};

export default SecurityPrivacy;
