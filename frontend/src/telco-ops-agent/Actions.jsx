import React, { useState, useEffect } from 'react';

const Actions = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      // Load recent runs to show actions
      const response = await fetch('/api/agent-runs');
      const data = await response.json();
      
      // Extract items from response and filter runs for ops module
      const allRuns = data.items || [];
      const opsRuns = allRuns.filter(run => run.module === 'ops');
      
      // Extract actions from runs
      const allActions = [];
      opsRuns.forEach(run => {
        if (run.bundle?.actions) {
          run.bundle.actions.forEach((action, index) => {
            allActions.push({
              ...action,
              run_id: run.run_id,
              status: run.status,
              created_at: run.started_at,
              artifacts: run.artifacts
            });
          });
        }
      });
      
      setActions(allActions);
    } catch (error) {
      console.error('Failed to load actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type) => {
    const icons = {
      'tmf622.order.create': '📦',
      'tmf622.order.change': '🔄',
      'subscription.change': '📋',
      'appointment.schedule': '📅',
      'comm.send': '📧',
      'crm.case.create': '🎫'
    };
    return icons[type] || '🔧';
  };

  const getActionStatus = (status) => {
    const styles = {
      'DONE': 'bg-green-100 text-green-800',
      'RUNNING': 'bg-blue-100 text-blue-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getArtifactInfo = (action, artifacts) => {
    if (!artifacts) return 'No artifacts';
    
    const artifactTypes = Object.keys(artifacts);
    if (artifactTypes.length === 0) return 'No artifacts';
    
    return artifactTypes.map(type => {
      const items = artifacts[type];
      if (Array.isArray(items) && items.length > 0) {
        return `${type}: ${items.length} item(s)`;
      }
      return `${type}: 1 item`;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actions</h2>
          <p className="text-gray-600">Action execution history and details</p>
        </div>
        <button
          onClick={loadActions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Actions Table */}
      {actions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Actions</h3>
          <p className="text-gray-600">No actions have been executed yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artifacts
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
                {actions.map((action, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getActionIcon(action.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {action.type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {action.payload?.customerId || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {action.run_id?.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionStatus(action.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getArtifactInfo(action, action.artifacts)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {action.created_at ? new Date(action.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedAction(action)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Details Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Action Details
                </h3>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Action Type</label>
                  <p className="text-sm text-gray-900">{selectedAction.type}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Run ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedAction.run_id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">{selectedAction.status}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Payload</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedAction.payload, null, 2)}
                  </pre>
                </div>
                
                {selectedAction.artifacts && Object.keys(selectedAction.artifacts).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Artifacts</label>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedAction.artifacts, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actions;
