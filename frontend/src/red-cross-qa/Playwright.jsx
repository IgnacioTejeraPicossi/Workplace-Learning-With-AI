import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const SCOPES = [
  'scopeNavigation','scopeForms','scopeSearch','scopeDonation',
  'scopeVolunteer','scopeCmsPreview','scopeAccessibility','scopeVisual','scopeApiMock',
];

const Playwright = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(['scopeNavigation', 'scopeDonation', 'scopeAccessibility']);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (key) => setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);

  const handleGenerate = async () => {
    setGenerating(true); setResult(null);
    try {
      const res = await fetch(`${API}/generate-playwright-tests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: selected, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setGenerating(false); }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API}/run-playwright`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: selected, environment }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🎭 {t('redCrossWebQaModule.playwright.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.playwright.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
          {SCOPES.map(s => (
            <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${selected.includes(s) ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} className="accent-red-600" />
              {t(`redCrossWebQaModule.playwright.${s}`)}
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50">
            {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.playwright.btnGenerate')}
          </button>
          {executionMode === 'execute' && (
            <button onClick={handleRun} disabled={running}
              className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-md hover:bg-gray-900 disabled:opacity-50">
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.playwright.btnRun')}
            </button>
          )}
        </div>
      </div>

      {result && result.status === 'ok' && result.scripts && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{t('redCrossWebQaModule.playwright.generatedFile')}</h3>
          {result.scripts.map((s, i) => (
            <div key={i} className="bg-gray-900 text-green-200 rounded-md p-4 font-mono text-xs overflow-x-auto">
              <div className="text-gray-400 mb-1">{`// ${s.filename}`}</div>
              <pre>{s.content}</pre>
            </div>
          ))}
        </div>
      )}
      {result && result.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{result.message}</div>
      )}
    </div>
  );
};

export default Playwright;
