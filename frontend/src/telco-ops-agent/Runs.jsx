import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Runs = () => {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loc = i18n.language === 'no' ? 'nb-NO' : 'en-US';

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/agent-runs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const allRuns = data.items || [];
      const opsRuns = allRuns.filter((run) => run.module === 'ops');
      setRuns(Array.isArray(opsRuns) ? opsRuns : []);
    } catch (e) {
      console.error('Failed to fetch telco ops runs:', e);
      setError(e.message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      DONE: 'bg-green-100 text-green-800',
      RUNNING: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons = {
      DONE: '✅',
      RUNNING: '⏳',
      FAILED: '❌',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt) return t('telcoOpsAgentModule.durationNa');
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const duration = Math.round((end - start) / 1000);
    return `${duration}s`;
  };

  const getArtifactSummary = (artifacts) => {
    if (!artifacts || Object.keys(artifacts).length === 0) return t('telcoOpsAgentModule.artifactsNone');

    const summary = [];
    Object.entries(artifacts).forEach(([type, items]) => {
      if (Array.isArray(items)) {
        summary.push(t('telcoOpsAgentModule.artifactsSummary', { type, count: items.length }));
      } else if (items) {
        summary.push(t('telcoOpsAgentModule.artifactsSummaryOne', { type }));
      }
    });

    return summary.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <span className="text-red-500 text-2xl mr-3">❌</span>
            <div>
              <h3 className="text-lg font-semibold text-red-800">{t('telcoOpsAgentModule.runsErrorTitle')}</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('telcoOpsAgentModule.runsTitle')}</h2>
          <p className="text-gray-600">{t('telcoOpsAgentModule.runsSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={fetchRuns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 {t('telcoOpsAgentModule.refresh')}
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('telcoOpsAgentModule.totalRuns')}</p>
              <p className="text-3xl font-bold text-gray-900">{runs?.length || 0}</p>
            </div>
            <div className="text-4xl text-gray-500">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('telcoOpsAgentModule.successful')}</p>
              <p className="text-3xl font-bold text-green-600">
                {runs?.filter((r) => r.status === 'DONE').length || 0}
              </p>
            </div>
            <div className="text-4xl text-green-500">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('telcoOpsAgentModule.running')}</p>
              <p className="text-3xl font-bold text-blue-600">
                {runs?.filter((r) => r.status === 'RUNNING').length || 0}
              </p>
            </div>
            <div className="text-4xl text-blue-500">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('telcoOpsAgentModule.failed')}</p>
              <p className="text-3xl font-bold text-red-600">
                {runs?.filter((r) => r.status === 'FAILED').length || 0}
              </p>
            </div>
            <div className="text-4xl text-red-500">❌</div>
          </div>
        </div>
      </div>

      {(!runs || !Array.isArray(runs) || runs.length === 0) ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('telcoOpsAgentModule.runsEmptyTitle')}</h3>
          <p className="text-gray-600">{t('telcoOpsAgentModule.runsEmptyBody')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thRunId')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thStatus')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thTopic')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thDuration')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thArtifacts')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thAttestation')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('telcoOpsAgentModule.thStarted')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(runs || []).map((run, index) => (
                  <tr key={run.run_id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {run.run_id || t('telcoOpsAgentModule.notAvailable')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.bundle?.topic || t('telcoOpsAgentModule.notAvailable')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(run.started_at, run.ended_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getArtifactSummary(run.artifacts)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {run.attestation_hash
                          ? `${run.attestation_hash.substring(0, 8)}...`
                          : t('telcoOpsAgentModule.notAvailable')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.started_at
                          ? new Date(run.started_at).toLocaleString(loc)
                          : t('telcoOpsAgentModule.notAvailable')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Runs;
