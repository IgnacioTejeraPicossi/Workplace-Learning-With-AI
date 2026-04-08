import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Runs = () => {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/agents/ea/runs');
      const data = await res.json();
      setRuns(data);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      RUNNING: 'bg-blue-100 text-blue-800',
      DONE: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const loc = i18n.language === 'no' ? 'nb-NO' : 'en-US';
    return new Date(dateStr).toLocaleString(loc);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(t('eaSecondBrainModule.copiedAlert'));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('eaSecondBrainModule.runsTitle')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('eaSecondBrainModule.runsSubtitle')}
          </p>
        </div>
        <button
          onClick={loadRuns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('eaSecondBrainModule.refresh')}
        </button>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            {t('eaSecondBrainModule.loadingRuns')}
          </div>
        ) : runs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {t('eaSecondBrainModule.noRuns')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('eaSecondBrainModule.thRunId')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('eaSecondBrainModule.thStatus')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('eaSecondBrainModule.thTopic')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('eaSecondBrainModule.thCreated')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('eaSecondBrainModule.thAttestation')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.map((run, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs text-gray-900">
                        {run.run_id?.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          run.status
                        )}`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {run.bundle?.topic || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(run.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {run.attestation_hash ? (
                        <button
                          onClick={() => copyToClipboard(run.attestation_hash)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-mono"
                          title={t('eaSecondBrainModule.copyTitle')}
                        >
                          {run.attestation_hash.substring(0, 12)}...
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              {t('eaSecondBrainModule.trustTitle')}
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {t('eaSecondBrainModule.trustBody')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Runs;

