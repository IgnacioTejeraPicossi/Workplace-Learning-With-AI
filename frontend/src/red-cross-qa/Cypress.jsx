import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const SCOPES = ['scopeComponent','scopeFrontendRegression','scopeQuickDebug'];

const Cypress = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(['scopeComponent']);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (k) => setSelected(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);

  const call = async (path, setter) => {
    setter(true); setResult(null);
    try {
      const res = await fetch(`${API}/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: selected, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setter(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🌲 {t('redCrossWebQaModule.cypress.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.cypress.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-5">
          {SCOPES.map(s => (
            <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${selected.includes(s) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} className="accent-emerald-600" />
              {t(`redCrossWebQaModule.cypress.${s}`)}
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => call('generate-cypress-tests', setGenerating)} disabled={generating}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-50">
            {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.cypress.btnGenerate')}
          </button>
          {executionMode === 'execute' && (
            <button onClick={() => call('run-cypress', setRunning)} disabled={running}
              className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-md hover:bg-gray-900 disabled:opacity-50">
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.cypress.btnRun')}
            </button>
          )}
        </div>
      </div>

      {result && result.status === 'ok' && result.scripts && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{t('redCrossWebQaModule.cypress.generatedFile')}</h3>
          {result.scripts.map((s, i) => (
            <div key={i} className="bg-gray-900 text-green-200 rounded-md p-4 font-mono text-xs overflow-x-auto">
              <div className="text-gray-400 mb-1">{`// ${s.filename}`}</div>
              <pre>{s.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cypress;
