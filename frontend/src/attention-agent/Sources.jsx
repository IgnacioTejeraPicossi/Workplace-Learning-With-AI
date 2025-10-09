import React, { useEffect, useState } from 'react';

const Sources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    type: 'slack',
    urlOrId: '',
    authRef: '',
    pullIntervalMin: 15,
    active: true
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/agents/attention/sources');
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    try {
      const response = await fetch('/agents/attention/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
      
      if (response.ok) {
        setNewSource({
          type: 'slack',
          urlOrId: '',
          authRef: '',
          pullIntervalMin: 15,
          active: true
        });
        setShowAddForm(false);
        loadSources();
      }
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const toggleSource = async (sourceId, active) => {
    try {
      const response = await fetch(`/agents/attention/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      
      if (response.ok) {
        loadSources();
      }
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  const deleteSource = async (sourceId) => {
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    
    try {
      const response = await fetch(`/agents/attention/sources/${sourceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadSources();
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const getSourceIcon = (type) => {
    const icons = {
      slack: '💬',
      teams: '💬',
      webex: '📹',
      sharepoint: '📄',
      rss: '📡',
      workplace: '👥',
      workvivo: '🏢'
    };
    return icons[type] || '📡';
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Channel Sources</h1>
            <p className="text-gray-600 mt-1">
              Manage data sources for multi-channel signal ingestion
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Source
          </button>
        </div>

        {/* Add Source Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Source</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Type
                </label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({...newSource, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="slack">Slack</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="webex">Webex</option>
                  <option value="sharepoint">SharePoint</option>
                  <option value="rss">RSS Feed</option>
                  <option value="workplace">Workplace</option>
                  <option value="workvivo">Workvivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL or ID
                </label>
                <input
                  type="text"
                  value={newSource.urlOrId}
                  onChange={(e) => setNewSource({...newSource, urlOrId: e.target.value})}
                  placeholder="https://example.com or channel-id"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auth Reference
                </label>
                <input
                  type="text"
                  value={newSource.authRef}
                  onChange={(e) => setNewSource({...newSource, authRef: e.target.value})}
                  placeholder="auth-config-id"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pull Interval (minutes)
                </label>
                <input
                  type="number"
                  value={newSource.pullIntervalMin}
                  onChange={(e) => setNewSource({...newSource, pullIntervalMin: parseInt(e.target.value)})}
                  min="5"
                  max="60"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={addSource}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Source
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sources List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Active Sources</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading sources...</div>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 mb-4">No sources configured</div>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                Add your first source
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sources.map((source) => (
                <div key={source._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getSourceIcon(source.type)}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {source.type} Source
                        </h4>
                        <p className="text-sm text-gray-600">{source.urlOrId}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            source.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {source.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Pull every {source.pullIntervalMin} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSource(source._id, !source.active)}
                        className={`px-3 py-1 rounded text-sm ${
                          source.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {source.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteSource(source._id)}
                        className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
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

export default Sources;
