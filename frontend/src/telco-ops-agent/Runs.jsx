import React, { useEffect, useState } from 'react';

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      // Extract items from response and filter runs for ops module
      const allRuns = data.items || [];
      const opsRuns = allRuns.filter(run => run.module === 'ops');
      setRuns(Array.isArray(opsRuns) ? opsRuns : []);
    } catch (e) {
      console.error("Failed to fetch telco ops runs:", e);
      setError(e.message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DONE': 'bg-green-100 text-green-800',
      'RUNNING': 'bg-blue-100 text-blue-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    const icons = {
      'DONE': '✅',
      'RUNNING': '⏳',
      'FAILED': '❌'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const duration = Math.round((end - start) / 1000);
    return `${duration}s`;
  };

  const getArtifactSummary = (artifacts) => {
    if (!artifacts || Object.keys(artifacts).length === 0) return 'No artifacts';
    
    const summary = [];
    Object.entries(artifacts).forEach(([type, items]) => {
      if (Array.isArray(items)) {
        summary.push(`${type}: ${items.length}`);
      } else if (items) {
        summary.push(`${type}: 1`);
      }
    });
    
    return summary.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <span className="text-red-500 text-2xl mr-3">❌</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Error Loading Runs</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Execution Runs</h2>
          <p className="text-gray-600">Telco Ops Agent execution history and attestation</p>
        </div>
        <button
          onClick={fetchRuns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh
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
      {(!runs || !Array.isArray(runs) || runs.length === 0) ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Runs Found</h3>
          <p className="text-gray-600">Execute some telco operations to see them here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artifacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attestation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(runs || []).map((run, index) => (
                  <tr key={run.run_id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {run.run_id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.bundle?.topic || 'N/A'}
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
                        {run.attestation_hash ? 
                          `${run.attestation_hash.substring(0, 8)}...` : 
                          'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.started_at ? 
                          new Date(run.started_at).toLocaleString() : 
                          'N/A'
                        }
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
