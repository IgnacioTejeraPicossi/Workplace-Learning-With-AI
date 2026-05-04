import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

const Runs = ({ environment }) => {
  const { t } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/runs?environment=${environment}`);
        const data = await res.json();
        setRuns(Array.isArray(data.runs) ? data.runs : []);
      } catch { setRuns([]); }
      finally { setLoading(false); }
    })();
  }, [environment]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📜 {t('redCrossWebQaModule.runs.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.runs.subheader')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">{t('redCrossWebQaModule.common.loading')}</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">{t('redCrossWebQaModule.common.noData')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{t('redCrossWebQaModule.runs.runId')}</th>
                <th className="px-4 py-3">{t('redCrossWebQaModule.runs.suite')}</th>
                <th className="px-4 py-3">{t('redCrossWebQaModule.runs.startedAt')}</th>
                <th className="px-4 py-3">{t('redCrossWebQaModule.runs.endedAt')}</th>
                <th className="px-4 py-3">{t('redCrossWebQaModule.common.status')}</th>
                <th className="px-4 py-3">{t('redCrossWebQaModule.runs.summary')}</th>
                <th className="px-4 py-3">{t('redCrossWebQaModule.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.run_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.run_id}</td>
                  <td className="px-4 py-3 text-gray-800">{r.suite}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.started_at}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.ended_at || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'pass' ? 'bg-green-100 text-green-700' : r.status === 'fail' ? 'bg-red-100 text-red-700' : r.status === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{r.summary || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(r)} className="text-xs text-blue-600 hover:underline">
                      {t('redCrossWebQaModule.common.details')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Run details — <span className="font-mono text-sm">{selected.run_id}</span></h3>
            <button onClick={() => setSelected(null)} className="text-xs text-gray-500 hover:text-gray-700">{t('redCrossWebQaModule.common.cancel')} ✕</button>
          </div>

          {selected.attestation_hash && (
            <div className="text-xs">
              <span className="text-gray-500">{t('redCrossWebQaModule.runs.attestationHash')}: </span>
              <span className="font-mono text-gray-700 break-all">{selected.attestation_hash}</span>
            </div>
          )}

          {Array.isArray(selected.artifacts) && selected.artifacts.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('redCrossWebQaModule.runs.artifacts')}</p>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                {selected.artifacts.map((a, i) => (
                  <li key={i}>{typeof a === 'string' ? a : (a.name || JSON.stringify(a))}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Runs;
