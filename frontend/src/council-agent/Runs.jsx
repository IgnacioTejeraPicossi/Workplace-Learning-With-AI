import React, { useEffect, useState } from 'react';
import AgentOpsRuns from '../components/AgentOpsRuns';

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const response = await fetch('/api/agent-runs?module=council');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.items || data || []);
      }
    } catch (error) {
      console.error("Failed to load runs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Council Runs</h2>
          <p className="text-gray-600">Monitor deliberation executions and audit trails</p>
        </div>
        <button
          onClick={loadRuns}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attestation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No Council runs found</p>
                      <p className="text-sm">Run a deliberation to see results here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                runs.map((run, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {run.run_id?.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.bundle?.topic || 'Unknown topic'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        run.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        run.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {run.bundle?.personas?.length || 0} personas
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.created_at ? new Date(run.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {run.attestation_hash ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {run.attestation_hash.substring(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-purple-600 hover:text-purple-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-sm">🏛️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
              <p className="text-lg font-semibold text-gray-900">{runs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {runs.filter(r => r.status === 'DONE').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm">🏃</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-lg font-semibold text-gray-900">
                {runs.filter(r => r.status === 'RUNNING').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-sm">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-lg font-semibold text-gray-900">
                {runs.filter(r => r.status === 'FAILED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Runs;
