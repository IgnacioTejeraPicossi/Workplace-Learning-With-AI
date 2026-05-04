import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const Jira = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [bundle, setBundle] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/jira-bundle-preview?environment=${environment}`);
        const data = await res.json();
        if (data.status === 'ok') setBundle(data.bundle);
      } catch { /* offline */ }
    })();
  }, [environment]);

  const handleDispatch = async () => {
    setDispatching(true); setResult(null);
    try {
      const res = await fetch(`${API}/create-jira-issues`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setDispatching(false); }
  };

  const handleOutSystems = async () => {
    setSending(true); setResult(null);
    try {
      const res = await fetch(`${API}/dispatch-to-outsystems`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setSending(false); }
  };

  const issues = bundle?.issues || [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🎯 {t('redCrossWebQaModule.jira.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.jira.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm">
            <span className="text-xs text-gray-500">{t('redCrossWebQaModule.jira.projectKey')}: </span>
            <span className="font-mono font-semibold text-gray-800">{bundle?.project_key || 'ITEM'}</span>
          </div>
          <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm">
            <span className="text-xs text-gray-500">{t('redCrossWebQaModule.jira.component')}: </span>
            <span className="font-semibold text-gray-800">{bundle?.component || 'Web QA'}</span>
          </div>
          <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm">
            <span className="text-xs text-gray-500">{t('redCrossWebQaModule.jira.labels')}: </span>
            <span className="font-mono text-gray-800">{(bundle?.labels || ['red-cross-qa']).join(', ')}</span>
          </div>
        </div>

        <h3 className="font-semibold text-gray-800 mb-3">{t('redCrossWebQaModule.jira.previewTitle')} ({issues.length})</h3>
        {issues.length === 0 ? (
          <p className="text-sm text-gray-400">{t('redCrossWebQaModule.common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {issues.map((iss, i) => (
              <div key={i} className="p-3 rounded-md border border-gray-100 text-sm">
                <div className="flex flex-wrap gap-2 items-center mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${iss.priority === 'Critical' ? 'bg-red-100 text-red-700' : iss.priority === 'High' ? 'bg-orange-100 text-orange-700' : iss.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>{iss.priority || 'Medium'}</span>
                  <span className="text-xs text-gray-500">{iss.type || 'Bug'}</span>
                  <strong className="text-gray-800">{iss.title}</strong>
                </div>
                {iss.description && <p className="text-gray-600 text-xs">{iss.description}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={handleDispatch} disabled={dispatching || issues.length === 0}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50">
            {dispatching ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.jira.btnDispatch')}
          </button>
          <button onClick={handleOutSystems} disabled={sending || issues.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {sending ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.jira.btnSendToOutsystems')}
          </button>
        </div>
      </div>

      {result && result.status === 'ok' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800">
          ✅ {t('redCrossWebQaModule.jira.dispatched')}: {result.created_count || result.dispatched_count || 0}
        </div>
      )}
      {result && result.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{result.message}</div>
      )}
    </div>
  );
};

export default Jira;
