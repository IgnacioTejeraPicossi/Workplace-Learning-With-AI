import React, { useEffect, useState } from 'react';

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent-runs?module=attention');
      const data = await response.json();
      setRuns(data.items || []);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DONE: 'bg-green-100 text-green-800',
      RUNNING: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
      QUEUED: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      DONE: '✅',
      RUNNING: '⏳',
      FAILED: '❌',
      QUEUED: '⏸️'
    };
    return icons[status] || '❓';
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Execution Runs</h1>
            <p className="text-gray-600 mt-1">
              Monitor attention agent execution history and attestation
            </p>
          </div>
          <button
            onClick={loadRuns}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Runs</p>
                <p className="text-3xl font-bold text-gray-900">{runs?.length || 0}</p>
              </div>
              <div className="text-4xl text-gray-500">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-3xl font-bold text-green-600">
                  {runs?.filter(r => r.status === 'DONE').length || 0}
                </p>
              </div>
              <div className="text-4xl text-green-500">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Running</p>
                <p className="text-3xl font-bold text-blue-600">
                  {runs?.filter(r => r.status === 'RUNNING').length || 0}
                </p>
              </div>
              <div className="text-4xl text-blue-500">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-3xl font-bold text-red-600">
                  {runs?.filter(r => r.status === 'FAILED').length || 0}
                </p>
              </div>
              <div className="text-4xl text-red-500">❌</div>
            </div>
          </div>
        </div>

        {/* Runs Table */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Runs</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading runs...</div>
            </div>
          ) : runs.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 mb-4">No runs found</div>
              <p className="text-sm text-gray-400">
                Execute some actions to see them here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Run ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attestation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(runs || []).map((run, index) => (
                    <tr key={run.run_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {run.run_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                          <span className="mr-1">{getStatusIcon(run.status)}</span>
                          {run.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {run.bundle?.topic || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {run.attestation_hash ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {run.attestation_hash.slice(0, 8)}...
                            </code>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.created_at ? new Date(run.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Runs;
