import React, { useEffect, useState } from 'react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? '/agents/attention/alerts' 
        : `/agents/attention/alerts?priority=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      acknowledged: 'bg-green-100 text-green-800',
      resolved: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getChannelIcon = (channel) => {
    const icons = {
      slack: '💬',
      teams: '💬',
      email: '📧',
      calendar: '📅'
    };
    return icons[channel] || '📡';
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert Feed</h1>
            <p className="text-gray-600 mt-1">
              Dispatched alerts and their execution artifacts
            </p>
          </div>
          
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading alerts...</div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 mb-4">No alerts found</div>
              <p className="text-sm text-gray-400">
                Alerts will appear here when clusters are dispatched
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div key={alert._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Alert #{alert._id.slice(-8)}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {alert.assignedTo && (
                        <p className="text-sm text-gray-600 mb-3">
                          Assigned to: <span className="font-medium">{alert.assignedTo}</span>
                        </p>
                      )}
                      
                      {/* Dispatched Via */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">Dispatched Via</h5>
                        <div className="flex items-center space-x-2">
                          {alert.dispatchedVia.map((channel, i) => (
                            <span key={i} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-sm">
                              <span>{getChannelIcon(channel)}</span>
                              <span className="capitalize">{channel}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Artifacts */}
                      {alert.artifacts && Object.keys(alert.artifacts).length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Execution Artifacts</h5>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(alert.artifacts, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      {alert.status === 'pending' && (
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                          Acknowledge
                        </button>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                          Resolve
                        </button>
                      )}
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.updatedAt && (
                        <span>Updated: {new Date(alert.updatedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
