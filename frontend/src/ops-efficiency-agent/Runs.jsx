import React, { useState, useEffect } from 'react';

const Runs = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await fetch('/agents/opsx/runs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      } else {
        // Mock data for demo
        const mockRuns = [
          {
            _id: 'run-001',
            run_id: 'opsx-inv-20240115-001',
            module: 'opsx',
            status: 'SUCCESS',
            topic: 'Invoice INV-2024-001 Approval',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:31:00Z',
            artifacts: {
              invoice: [
                {
                  action: 'approve',
                  invoice_id: 'INV-2024-001',
                  timestamp: '2024-01-15T10:30:45Z'
                }
              ],
              notifications: [
                {
                  type: 'slack',
                  channel: '#finance',
                  message_id: '1234567890.123456',
                  timestamp: '2024-01-15T10:30:50Z'
                }
              ]
            },
            attestation_hash: 'sha256:abc123def456...'
          },
          {
            _id: 'run-002',
            run_id: 'opsx-alloc-20240115-002',
            module: 'opsx',
            status: 'SUCCESS',
            topic: 'Cost Allocation Suggestion',
            created_at: '2024-01-15T14:20:00Z',
            updated_at: '2024-01-15T14:21:00Z',
            artifacts: {
              allocation: [
                {
                  allocation_id: 'ALLOC-2024-001',
                  document_id: 'DOC-2024-001',
                  lines: [
                    { amount: 3000, gl_account: '6020', cost_center: 'IT_DEPT' },
                    { amount: 2000, gl_account: '6020', cost_center: 'OPS_DEPT' }
                  ],
                  timestamp: '2024-01-15T14:20:30Z'
                }
              ],
              notifications: [
                {
                  type: 'slack',
                  channel: '#finance',
                  message_id: '1234567890.123457',
                  timestamp: '2024-01-15T14:20:35Z'
                }
              ]
            },
            attestation_hash: 'sha256:def456ghi789...'
          },
          {
            _id: 'run-003',
            run_id: 'opsx-ats-20240115-003',
            module: 'opsx',
            status: 'SUCCESS',
            topic: 'CV Ranking: Backend Developer',
            created_at: '2024-01-15T16:45:00Z',
            updated_at: '2024-01-15T16:46:00Z',
            artifacts: {
              ats: {
                job_id: 'JOB-2024-001',
                candidates: [
                  { candidateId: 'CAND-001', score01: 0.92 },
                  { candidateId: 'CAND-002', score01: 0.78 },
                  { candidateId: 'CAND-003', score01: 0.65 }
                ],
                timestamp: '2024-01-15T16:45:30Z'
              },
              sheets: [
                {
                  operation: 'append',
                  range: 'ATS!A1',
                  updated_range: 'ATS!A1:E4',
                  timestamp: '2024-01-15T16:45:45Z'
                }
              ]
            },
            attestation_hash: 'sha256:ghi789jkl012...'
          }
        ];
        setRuns(mockRuns);
      }
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      SUCCESS: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      RUNNING: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {status}
      </span>
    );
  };

  const getActionIcon = (actionType) => {
    const icons = {
      'invoice.approve': '✅',
      'invoice.hold': '⚠️',
      'cost.allocate': '💰',
      'ats.rank': '👥',
      'notify.slack': '💬',
      'notify.email': '📧',
      'sheets.appendRow': '📊'
    };
    return icons[actionType] || '⚙️';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateHash = (hash) => {
    if (!hash) return '-';
    return hash.substring(0, 16) + '...';
  };

  const filteredRuns = runs.filter(run => {
    if (filter === 'all') return true;
    if (filter === 'success') return run.status === 'SUCCESS';
    if (filter === 'failed') return run.status === 'FAILED';
    if (filter === 'running') return run.status === 'RUNNING';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Execution History</h1>
        <p className="text-lg text-gray-600 mt-2">View all Operations Efficiency Agent executions with attestation</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({runs.length})
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Success ({runs.filter(r => r.status === 'SUCCESS').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'failed' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Failed ({runs.filter(r => r.status === 'FAILED').length})
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'running' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Running ({runs.filter(r => r.status === 'RUNNING').length})
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attestation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRuns.map((run) => (
                <tr key={run._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {run.run_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{run.topic}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(run.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {run.artifacts && Object.keys(run.artifacts).map((key) => {
                        const artifact = run.artifacts[key];
                        if (Array.isArray(artifact)) {
                          return artifact.map((item, index) => (
                            <span key={index} className="text-lg" title={key}>
                              {getActionIcon(key)}
                            </span>
                          ));
                        } else if (artifact && typeof artifact === 'object') {
                          return (
                            <span key={key} className="text-lg" title={key}>
                              {getActionIcon(key)}
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(run.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {truncateHash(run.attestation_hash)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
              <p className="text-2xl font-semibold text-gray-900">{runs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-semibold text-gray-900">
                {runs.filter(r => r.status === 'SUCCESS').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-red-600 text-xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {runs.filter(r => r.status === 'FAILED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-yellow-600 text-xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {runs.length > 0 
                  ? Math.round((runs.filter(r => r.status === 'SUCCESS').length / runs.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Runs;
