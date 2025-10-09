import React, { useEffect, useState } from 'react';

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await fetch('/agents/sales/runs?limit=50');
      const data = await response.json();
      // Ensure data is an array
      setRuns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch runs:', error);
      setRuns([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DONE':
        return '✅';
      case 'RUNNING':
        return '⏳';
      case 'FAILED':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">▶️</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Agent Runs</h1>
                <p className="text-gray-600">Monitor execution history and results</p>
              </div>
            </div>
            
            <button
              onClick={fetchRuns}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Runs Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attestation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!runs || !Array.isArray(runs) || runs.length === 0) ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-4xl">📊</span>
                        <p>No sales agent runs found</p>
                        <p className="text-sm">Execute some actions to see them here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (runs || []).map((run, index) => (
                    <tr key={run.run_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {run.run_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {run.topic || 'N/A'}
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
                          {run.artifacts ? Object.keys(run.artifacts).length : 0} actions
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-600">
                          {run.attestation_hash ? 
                            `${run.attestation_hash.substring(0, 8)}...` : 
                            'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.updated_at ? 
                          new Date(run.updated_at).toLocaleString() : 
                          'N/A'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
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
      </div>
    </div>
  );
};

export default Runs;
