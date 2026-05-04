import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const PROFILES = ['profileSmoke','profileNormal','profileCampaign','profileCrisis','profileSoak'];
const SCENARIOS = [
  'scenarioPublic','scenarioDonation','scenarioVolunteer','scenarioSearch',
  'scenarioLocalPages','scenarioForms','scenarioRateLimit','scenarioCmsPublish','scenarioCachePurge',
];

const StressTest = ({ environment, executionMode }) => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState('profileNormal');
  const [scenarios, setScenarios] = useState(['scenarioDonation']);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const toggleScenario = (s) => setScenarios(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleGenerate = async () => {
    setGenerating(true); setResult(null);
    try {
      const res = await fetch(`${API}/generate-k6-script`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scenarios, environment, lang: i18n.language }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setGenerating(false); }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API}/run-k6`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scenarios, environment }),
      });
      setResult(await res.json());
    } catch { setResult({ status: 'error', message: 'Network error' }); }
    finally { setRunning(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🔥 {t('redCrossWebQaModule.stressTest.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.stressTest.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-5">
          {PROFILES.map(p => (
            <button key={p} onClick={() => setProfile(p)}
              className={`px-3 py-2 rounded-md border text-sm text-left ${profile === p ? 'bg-orange-50 border-orange-400 text-orange-800' : 'border-gray-200 hover:bg-gray-50'}`}>
              {t(`redCrossWebQaModule.stressTest.${p}`)}
            </button>
          ))}
        </div>

        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Scenarios</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
          {SCENARIOS.map(s => (
            <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${scenarios.includes(s) ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="checkbox" checked={scenarios.includes(s)} onChange={() => toggleScenario(s)} className="accent-orange-600" />
              {t(`redCrossWebQaModule.stressTest.${s}`)}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={generating}
            className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 disabled:opacity-50">
            {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.stressTest.btnGenerate')}
          </button>
          {executionMode === 'execute' && (
            <button onClick={handleRun} disabled={running}
              className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-md hover:bg-gray-900 disabled:opacity-50">
              {running ? t('redCrossWebQaModule.common.running') : t('redCrossWebQaModule.stressTest.btnRun')}
            </button>
          )}
        </div>
      </div>

      {result && result.status === 'ok' && result.script && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">{result.filename || 'k6-script.js'}</h3>
          <div className="bg-gray-900 text-orange-200 rounded-md p-4 font-mono text-xs overflow-x-auto">
            <pre>{result.script}</pre>
          </div>
        </div>
      )}

      {result && result.status === 'ok' && result.results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">k6 Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {Object.entries(result.results).map(([k, v]) => (
              <div key={k} className="px-3 py-2 rounded-md border border-gray-200">
                <div className="text-xs text-gray-500">{k}</div>
                <div className="font-semibold text-gray-800">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && result.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{result.message}</div>
      )}
    </div>
  );
};

export default StressTest;
